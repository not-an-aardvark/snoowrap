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
      _ac.warn(
        `Warning: Unknown type '${response_tree.kind}'. This may be a bug, please report it: ${constants.ISSUE_REPORT_LINK}.`
      );
      return _ac._new_object('RedditContent', remainder_of_tree, true);
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
    if (result.length === 2 && result[0] && result[0].constructor.name === 'Listing' && result[0][0] &&
        result[0][0].constructor.name === 'Submission' && result[1] && result[1].constructor.name === 'Listing') {
      result[0][0].comments = result[1];
      return result[0][0];
    }
    return result;
  }
  return response_tree;
};

exports._handle_json_errors = function (response) {
  if (_.isEmpty(response)) {
    return this;
  }
  if (response.json.errors.length) {
    throw response.json.errors[0];
  }
  return this;
};

exports.find_message_in_tree = (desired_message_name, current_message) => {
  if (current_message.name === desired_message_name) {
    return current_message;
  }
  if (current_message.replies) {
    return _.find(current_message.replies.map(_.partial(exports.find_message_in_tree, desired_message_name)));
  }
};

exports._format_permissions = (all_permission_names, permissions_array) => {
  if (!permissions_array) {
    return '+all';
  }
  return all_permission_names.map(type => (_.includes(permissions_array, type) ? '+' : '-') + type).join(',');
};

exports._format_mod_permissions = _.partial(exports._format_permissions, constants.MODERATOR_PERMISSIONS);
exports._format_livethread_permissions = _.partial(exports._format_permissions, constants.LIVETHREAD_PERMISSIONS);

exports.rename_key = (obj, oldkey, newkey) => obj && _(_.clone(obj)).assign({[newkey]: obj[oldkey]}).omit(oldkey).value();
