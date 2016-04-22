'use strict';
const _ = require('lodash');
const constants = require('./constants');

module.exports = {
  _populate (response_tree, _r) {
    if (typeof response_tree === 'object' && response_tree !== null) {
      // Map {kind: 't2', data: {name: 'some_username', ... }} to a RedditUser (e.g.) with the same properties
      if (_.keys(response_tree).length === 2 && response_tree.kind) {
        const remainder_of_tree = module.exports._populate(response_tree.data, _r);
        return _r._new_object(constants.KINDS[response_tree.kind] || 'RedditContent', remainder_of_tree, true);
      }
      const mapFunction = Array.isArray(response_tree) ? _.map : _.mapValues;
      const result = mapFunction(response_tree, (value, key) => {
        // Map {..., author: 'some_username', ...} to {..., author: RedditUser {}, ... } (e.g.)
        if (_.includes(constants.USER_KEYS, key) && value !== null) {
          return _r._new_object('RedditUser', {name: value}, false);
        }
        if (_.includes(constants.SUBREDDIT_KEYS, key) && value !== null) {
          return _r._new_object('Subreddit', {display_name: value}, false);
        }
        return module.exports._populate(value, _r);
      });
      if (result.length === 2 && result[0] && result[0].constructor.name === 'Listing' && result[0][0] &&
          result[0][0].constructor.name === 'Submission' && result[1] && result[1].constructor.name === 'Listing') {
        if (result[1]._more && !result[1]._more.link_id) {
          result[1]._more.link_id = result[0][0].name;
        }
        result[0][0].comments = result[1];
        return result[0][0];
      }
      return result;
    }
    return response_tree;
  },

  _get_empty_replies_listing (item) {
    if (item.link_id) {
      const replies_uri = `comments/${item.link_id.slice(3)}`;
      const replies_query = {comment: item.name.slice(3)};
      const _transform = response => response.comments[0].replies;
      const params = {_uri: replies_uri, _query: replies_query, _transform, _link_id: item.link_id, _is_comment_list: true};
      return item._r._new_object('Listing', params);
    }
    return item._r._new_object('Listing');
  },

  _add_empty_replies_listing (item) {
    item.replies = module.exports._get_empty_replies_listing(item);
    return item;
  },

  _handle_json_errors (returnValue) {
    return response => {
      if (_.isEmpty(response) || !response.json.errors.length) {
        return returnValue;
      }
      throw new Error(response.json.errors[0]);
    };
  },

  // Performs a depth-first search of a tree of private messages, in order to find a message with a given name.
  _find_message_in_tree (desired_message_name, current_message) {
    if (current_message.name === desired_message_name) {
      return current_message;
    }
    return _.find(current_message.replies.map(_.partial(module.exports._find_message_in_tree, desired_message_name)));
  },

  _format_permissions (all_permission_names, permissions_array) {
    if (!permissions_array) {
      return '+all';
    }
    return all_permission_names.map(type => (_.includes(permissions_array, type) ? '+' : '-') + type).join(',');
  },

  _rename_key (obj, old_key, new_key) {
    return obj && _.omit({...obj, [new_key]: obj[old_key]}, old_key);
  },

  /* When reddit returns private messages (or comments from the /api/morechildren endpoint), it arranges their in a very
  nonintuitive way (see https://github.com/not-an-aardvark/snoowrap/issues/15 for details). This function rearranges the message
  tree so that replies are threaded properly. */
  _build_replies_tree (child_list) {
    const More = require('./objects/More');
    const child_map = _.keyBy(child_list, 'name');
    child_list.forEach(module.exports._add_empty_replies_listing);
    child_list.forEach(child => {
      if (child.constructor.name === 'Comment') {
        child.replies._more = More.empty_children();
      }
    });
    _.remove(child_list, child => child_map[child.parent_id]).forEach(child => {
      if (child instanceof More) {
        child_map[child.parent_id].replies._set_more(child);
      } else {
        child_map[child.parent_id].replies.push(child);
      }
    });
    return child_list;
  }
};

module.exports._format_mod_permissions = _.partial(module.exports._format_permissions, constants.MODERATOR_PERMISSIONS);
module.exports._format_livethread_permissions = _.partial(module.exports._format_permissions, constants.LIVETHREAD_PERMISSIONS);
