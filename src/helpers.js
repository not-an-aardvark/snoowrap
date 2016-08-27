import {filter, find, forEach, includes, isEmpty, keyBy, omit, partial, property, remove, snakeCase} from 'lodash';
import {MODERATOR_PERMISSIONS, LIVETHREAD_PERMISSIONS} from './constants.js';
import {emptyChildren as emptyMoreObject} from './objects/More.js';

export function getEmptyRepliesListing (item) {
  if (item.constructor._name === 'Comment') {
    return item._r._newObject('Listing', {
      _uri: `comments/${item.link_id.slice(3)}`,
      _query: {comment: item.name.slice(3)},
      _transform: property('comments[0].replies'),
      _link_id: item.link_id,
      _isCommentList: true
    });
  }
  if (item.constructor._name === 'Submission') {
    return item._r._newObject('Listing', {
      _uri: `comments/${item.id}`,
      _transform: property('comments'),
      _isCommentList: true
    });
  }
  return item._r._newObject('Listing');
}

export function addEmptyRepliesListing (item) {
  item.replies = getEmptyRepliesListing(item);
  return item;
}

export function handleJsonErrors (returnValue) {
  return response => {
    if (isEmpty(response) || isEmpty(response.json.errors)) {
      return returnValue;
    }
    throw new Error(response.json.errors[0]);
  };
}

// Performs a depth-first search of a tree of private messages, in order to find a message with a given name.
export function findMessageInTree (desiredName, rootNode) {
  return rootNode.name === desiredName ? rootNode : find(rootNode.replies.map(partial(findMessageInTree, desiredName)));
}

export function formatPermissions (allPermissionNames, permsArray) {
  return permsArray ? allPermissionNames.map(type => (includes(permsArray, type) ? '+' : '-') + type).join(',') : '+all';
}

export const formatModPermissions = partial(formatPermissions, MODERATOR_PERMISSIONS);
export const formatLivethreadPermissions = partial(formatPermissions, LIVETHREAD_PERMISSIONS);

export function renameKey (obj, oldKey, newKey) {
  return obj && omit({...obj, [newKey]: obj[oldKey]}, oldKey);
}

/* When reddit returns private messages (or comments from the /api/morechildren endpoint), it arranges their in a very
nonintuitive way (see https://github.com/not-an-aardvark/snoowrap/issues/15 for details). This function rearranges the message
tree so that replies are threaded properly. */
export function buildRepliesTree (childList) {
  const childMap = keyBy(childList, 'name');
  forEach(childList, addEmptyRepliesListing);
  forEach(filter(childList, child => child.constructor._name === 'Comment'), child => {
    child.replies._more = emptyMoreObject;
  });
  remove(childList, child => childMap[child.parent_id]).forEach(child => {
    if (child.constructor._name === 'More') {
      childMap[child.parent_id].replies._setMore(child);
      child.link_id = childMap[child.parent_id].link_id;
    } else {
      childMap[child.parent_id].replies.push(child);
    }
  });
  return childList;
}

export function addFullnamePrefix (item, prefix) {
  if (typeof item === 'string') {
    return hasFullnamePrefix(item) ? item : prefix + item;
  }
  return item.name;
}

export function hasFullnamePrefix (item) {
  return /^(t\d|LiveUpdateEvent)_/.test(item);
}

export function addSnakeCaseShadowProps (obj) {
  Object.keys(obj).filter(key => !key.startsWith('_') && key !== snakeCase(key)).forEach(key => {
    Object.defineProperty(obj, snakeCase(key), {get: () => obj[key], set: value => obj[key] = value});
  });
  return obj;
}
