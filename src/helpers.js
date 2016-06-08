import {filter, find, forEach, includes, isEmpty, keyBy, omit, partial, property, remove} from 'lodash';
import {MODERATOR_PERMISSIONS, LIVETHREAD_PERMISSIONS} from './constants.js';
import {empty_children as empty_more_object} from './objects/More.js';

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
    if (isEmpty(response) || isEmpty(response.json.errors)) {
      return returnValue;
    }
    throw new Error(response.json.errors[0]);
  };
}

// Performs a depth-first search of a tree of private messages, in order to find a message with a given name.
export function find_message_in_tree (desired_name, root_node) {
  return root_node.name === desired_name ? root_node : find(root_node.replies.map(partial(find_message_in_tree, desired_name)));
}

export function format_permissions (all_permission_names, perms_array) {
  return perms_array ? all_permission_names.map(type => (includes(perms_array, type) ? '+' : '-') + type).join(',') : '+all';
}

export const format_mod_permissions = partial(format_permissions, MODERATOR_PERMISSIONS);
export const format_livethread_permissions = partial(format_permissions, LIVETHREAD_PERMISSIONS);

export function rename_key (obj, old_key, new_key) {
  return obj && omit({...obj, [new_key]: obj[old_key]}, old_key);
}

/* When reddit returns private messages (or comments from the /api/morechildren endpoint), it arranges their in a very
nonintuitive way (see https://github.com/not-an-aardvark/snoowrap/issues/15 for details). This function rearranges the message
tree so that replies are threaded properly. */
export function build_replies_tree (child_list) {
  const child_map = keyBy(child_list, 'name');
  forEach(child_list, add_empty_replies_listing);
  forEach(filter(child_list, child => child.constructor.name === 'Comment'), child => {
    child.replies._more = empty_more_object;
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

export function add_fullname_prefix (item, prefix) {
  if (typeof item === 'string') {
    return has_fullname_prefix(item) ? item : prefix + item;
  }
  return item.name;
}

export function has_fullname_prefix (item) {
  return /^(t\d|LiveUpdateEvent)_/.test(item);
}
