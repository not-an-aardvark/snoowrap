'use strict';
const _ = require('lodash');
const constants = require('./constants');

exports._populate = (response_tree, _ac) => {
  if (typeof response_tree === 'object' && response_tree !== null) {
    // Map {kind: 't2', data: {name: 'some_username', ... }} to a RedditUser (e.g.) with the same properties
    if (_.keys(response_tree).length === 2 && response_tree.kind) {
      const remainder_of_tree = exports._populate(response_tree.data, _ac);
      if (constants.KINDS[response_tree.kind]) {
        return _ac._new_object(constants.KINDS[response_tree.kind], remainder_of_tree, true);
      }
      _ac.warn(`Unknown type ${response_tree.kind}. This may be a bug; please report it at ${constants.ISSUE_REPORT_LINK}.`);
      return remainder_of_tree;
    }
    const mapFunction = Array.isArray(response_tree) ? _.map : _.mapValues;
    const result = mapFunction(response_tree, (value, key) => {
      // Map {..., author: 'some_username', ...} to {..., author: RedditUser {}, ... } (e.g.)
      if (_.includes(constants.USER_KEYS, key) && value !== null) {
        return _ac._new_object('RedditUser', {name: value}, false);
      }
      if (_.includes(constants.SUBREDDIT_KEYS, key) && value !== null) {
        return _ac._new_object('Subreddit', {display_name: value}, false);
      }
      return exports._populate(value, _ac);
    });
    if (result.length === 2 && result[0].constructor.name === 'Listing' && result[0][0].constructor.name === 'Submission' &&
        result[1].constructor.name === 'Listing') {
      result[0][0].comments = result[1];
      return result[0][0];
    }
    return result;
  }
  return response_tree;
};

exports.find_message_in_tree = (desired_message_name, current_message) => {
  if (current_message.name === desired_message_name) {
    return current_message;
  }
  if (current_message.replies) {
    return _.find(current_message.replies.map(_.partial(exports.find_message_in_tree, desired_message_name)));
  }
};

exports.assign_to_proxy = (proxied_object, values) => {
  /* This is basically the same as _.assign(this, response), but _.assign ends up triggering warning messages when
  used on Proxies, since the patched globals from harmony-reflect aren't applied to lodash. This won't be a problem once
  Proxies are correctly implemented natively. https://github.com/tvcutsem/harmony-reflect#dependencies */
  _.forIn(values, (value, key) => {proxied_object[key] = value;});
};
