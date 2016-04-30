import {keys, map, mapValues, includes, property, isEmpty, find, partial, omit, keyBy, remove} from 'lodash';
import {KINDS, USER_KEYS, SUBREDDIT_KEYS, MODERATOR_PERMISSIONS, LIVETHREAD_PERMISSIONS} from './constants';
import {empty_children as empty_more_object} from './objects/More';

export function populate (response_tree, _r) {
  if (typeof response_tree === 'object' && response_tree !== null) {
    // Map {kind: 't2', data: {name: 'some_username', ... }} to a RedditUser (e.g.) with the same properties
    if (keys(response_tree).length === 2 && response_tree.kind) {
      const remainder_of_tree = populate(response_tree.data, _r);
      return _r._new_object(KINDS[response_tree.kind] || 'RedditContent', remainder_of_tree, true);
    }
    const result = (Array.isArray(response_tree) ? map : mapValues)(response_tree, (value, key) => {
      // Maps {..., author: 'some_username', ...} to {..., author: RedditUser {}, ... } (e.g.)
      if (includes(USER_KEYS, key) && value !== null) {
        return _r._new_object('RedditUser', {name: value}, false);
      }
      if (includes(SUBREDDIT_KEYS, key) && value !== null) {
        return _r._new_object('Subreddit', {display_name: value}, false);
      }
      return populate(value, _r);
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
}

export function get_empty_replies_listing (item) {
  if (item.constructor.name === 'Comment') {
    return item._r._new_object('Listing', {
      _uri: `comments/${item.link_id.slice(3)}`,
      _query: {comment: item.name.slice(3)},
      _transform: property('comments[0].replies'),
      _link_id: item.link_id,
      _is_comment_list: true
    });
  }
  if (item.constructor.name === 'Submission') {
    return item._r._new_object('Listing', {
      _uri: `comments/${item.id}`,
      _transform: property('comments'),
      _is_comment_list: true
    });
  }
  return item._r._new_object('Listing');
}

export function add_empty_replies_listing (item) {
  item.replies = get_empty_replies_listing(item);
  return item;
}

export function handle_json_errors (returnValue) {
  return response => {
    if (isEmpty(response) || !response.json.errors.length) {
      return returnValue;
    }
    throw new Error(response.json.errors[0]);
  };
}

// Performs a depth-first search of a tree of private messages, in order to find a message with a given name.
export function find_message_in_tree (desired_message_name, current_message) {
  if (current_message.name === desired_message_name) {
    return current_message;
  }
  return find(current_message.replies.map(partial(find_message_in_tree, desired_message_name)));
}

export function format_permissions (all_permission_names, permissions_array) {
  if (!permissions_array) {
    return '+all';
  }
  return all_permission_names.map(type => (includes(permissions_array, type) ? '+' : '-') + type).join(',');
}

export function rename_key (obj, old_key, new_key) {
  return obj && omit({...obj, [new_key]: obj[old_key]}, old_key);
}

/* When reddit returns private messages (or comments from the /api/morechildren endpoint), it arranges their in a very
nonintuitive way (see https://github.com/not-an-aardvark/snoowrap/issues/15 for details). This function rearranges the message
tree so that replies are threaded properly. */
export function build_replies_tree (child_list) {
  const child_map = keyBy(child_list, 'name');
  child_list.forEach(add_empty_replies_listing);
  child_list.forEach(child => {
    if (child.constructor.name === 'Comment') {
      child.replies._more = empty_more_object;
    }
  });
  remove(child_list, child => child_map[child.parent_id]).forEach(child => {
    if (child.constructor.name === 'More') {
      child_map[child.parent_id].replies._set_more(child);
      child.link_id = child_map[child.parent_id].link_id;
    } else {
      child_map[child.parent_id].replies.push(child);
    }
  });
  return child_list;
}

export const format_mod_permissions = partial(format_permissions, MODERATOR_PERMISSIONS);
export const format_livethread_permissions = partial(format_permissions, LIVETHREAD_PERMISSIONS);
