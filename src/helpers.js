import util from 'util';
import {find, includes, isEmpty, keyBy, omit, partial, property, remove, snakeCase} from 'lodash';
import {MODERATOR_PERMISSIONS, LIVETHREAD_PERMISSIONS} from './constants.js';
import {emptyChildren as emptyMoreObject} from './objects/More.js';

/**
* @summary Returns an unfetched empty replies Listing for an item.
* @param {Comment|Submission|PrivateMessage} item An item without a replies Listing
* @returns {Listing} The empty replies Listing
* @api private
*/
export function getEmptyRepliesListing (item) {
  if (item.constructor._name === 'Comment') {
    return item._r._newObject('Listing', {
      _uri: `comments/${(item.link_id || item.parent_id).slice(3)}`,
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

/**
* @summary Adds an empty replies Listing to an item.
* @param {Comment|PrivateMessage} item
* @returns {Comment|PrivateMessage} The item with the new replies Listing
* @api private
*/
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

/**
* @summary Performs a depth-first search of a tree of private messages, in order to find a message with a given name.
* @param {String} desiredName The fullname of the desired message
* @param {PrivateMessage} rootNode The root message of the tree
* @returns {PrivateMessage} The PrivateMessage with the given fullname, or undefined if it was not found in the tree.
* @api private
*/
export function findMessageInTree (desiredName, rootNode) {
  return rootNode.name === desiredName ? rootNode : find(rootNode.replies.map(partial(findMessageInTree, desiredName)));
}

/**
* @summary Formats permissions into a '+'/'-' string
* @param {String[]} allPermissionNames All possible permissions in this category
* @param {String[]} permsArray The permissions that should be enabled
* @returns {String} The permissions formatted into a '+'/'-' string
* @api private
*/
export function formatPermissions (allPermissionNames, permsArray) {
  return permsArray ? allPermissionNames.map(type => (includes(permsArray, type) ? '+' : '-') + type).join(',') : '+all';
}

export const formatModPermissions = partial(formatPermissions, MODERATOR_PERMISSIONS);
export const formatLivethreadPermissions = partial(formatPermissions, LIVETHREAD_PERMISSIONS);

/**
* @summary Renames a key on an object, omitting the old key
* @param {Object} obj
* @param oldKey {String}
* @param newKey {String}
* @returns {Object} A version of the object with the key renamed
* @api private
*/
export function renameKey (obj, oldKey, newKey) {
  return obj && omit({...obj, [newKey]: obj[oldKey]}, oldKey);
}

/**
* @summary Builds a replies tree from a list of child comments or messages
* @desc When reddit returns private messages (or comments from the /api/morechildren endpoint), it arranges their in a very
nonintuitive way (see https://github.com/not-an-aardvark/snoowrap/issues/15 for details). This function rearranges the message
tree so that replies are threaded properly.
* @param {Array} childList The list of child comments
* @returns {Array} The resulting list of child comments, arranged into a tree.
* @api private
*/
export function buildRepliesTree (childList) {
  const childMap = keyBy(childList, 'name');
  childList.forEach(addEmptyRepliesListing);
  childList.filter(child => child.constructor._name === 'Comment').forEach(child => child.replies._more = emptyMoreObject);
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

/**
* @summary Adds a fullname prefix to an item, if it doesn't have a prefix already. If the item is a RedditContent object, gets
the item's fullname.
* @param {String|RedditContent} item
* @returns {String}
* @api private
*/
export function addFullnamePrefix (item, prefix) {
  if (typeof item === 'string') {
    return hasFullnamePrefix(item) ? item : prefix + item;
  }
  return item.name;
}

/**
* @summary Determines whether a string is a "fullname". A "fullname" starts with "t1_", "t2_", ... "t8_", or "LiveUpdateEvent_".
* @param {String} item
* @returns {boolean}
* @api private
*/
export function hasFullnamePrefix (item) {
  return /^(t\d|LiveUpdateEvent)_/.test(item);
}

/**
* @summary Adds snake_case getters and setters to an object
* @desc All of snoowrap's functions and object options used to be defined in snake_case. For backwards compatibility,
snake_case property names (e.g. for the snoowrap constructor) are still supported. This function adds snake_case getters and
setters to a camelCase object, such that accessing and setting the snake_case property also correctly set the camelCase version
of the property.
* @param {object} obj The object that should have getters/setters attached
* @returns The updated version of `obj`
* @api private
*/
export function addSnakeCaseShadowProps (obj) {
  Object.keys(obj).filter(key => !key.startsWith('_') && key !== snakeCase(key)).forEach(key => {
    Object.defineProperty(obj, snakeCase(key), {get: () => obj[key], set: value => obj[key] = value});
  });
  return obj;
}

export const isBrowser = typeof self === 'object';

export function defineInspectFunc (obj, inspectFunc) {
  if (isBrowser) {
    return;
  }
  // Use the util.inspect.custom symbol if available (Node 6.6.0+)
  const inspectKey = util.inspect && typeof util.inspect.custom === 'symbol' ? util.inspect.custom : 'inspect';
  Object.defineProperty(obj, inspectKey, {writable: true, enumerable: false, value: inspectFunc});
}

export function requiredArg (argName) {
  throw new TypeError(`Missing required argument ${argName}`);
}
