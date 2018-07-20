'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isBrowser = exports.formatLivethreadPermissions = exports.formatModPermissions = undefined;

var _snakeCase2 = require('lodash/snakeCase');

var _snakeCase3 = _interopRequireDefault(_snakeCase2);

var _remove2 = require('lodash/remove');

var _remove3 = _interopRequireDefault(_remove2);

var _property2 = require('lodash/property');

var _property3 = _interopRequireDefault(_property2);

var _partial2 = require('lodash/partial');

var _partial3 = _interopRequireDefault(_partial2);

var _omit2 = require('lodash/omit');

var _omit3 = _interopRequireDefault(_omit2);

var _keyBy2 = require('lodash/keyBy');

var _keyBy3 = _interopRequireDefault(_keyBy2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _includes2 = require('lodash/includes');

var _includes3 = _interopRequireDefault(_includes2);

var _find2 = require('lodash/find');

var _find3 = _interopRequireDefault(_find2);

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.getEmptyRepliesListing = getEmptyRepliesListing;
exports.addEmptyRepliesListing = addEmptyRepliesListing;
exports.handleJsonErrors = handleJsonErrors;
exports.findMessageInTree = findMessageInTree;
exports.formatPermissions = formatPermissions;
exports.renameKey = renameKey;
exports.buildRepliesTree = buildRepliesTree;
exports.addFullnamePrefix = addFullnamePrefix;
exports.hasFullnamePrefix = hasFullnamePrefix;
exports.addSnakeCaseShadowProps = addSnakeCaseShadowProps;
exports.defineInspectFunc = defineInspectFunc;
exports.requiredArg = requiredArg;

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _constants = require('./constants.js');

var _More = require('./objects/More.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* @summary Returns an unfetched empty replies Listing for an item.
* @param {Comment|Submission|PrivateMessage} item An item without a replies Listing
* @returns {Listing} The empty replies Listing
* @api private
*/
function getEmptyRepliesListing(item) {
  if (item.constructor._name === 'Comment') {
    return item._r._newObject('Listing', {
      _uri: 'comments/' + (item.link_id || item.parent_id).slice(3),
      _query: { comment: item.name.slice(3) },
      _transform: (0, _property3.default)('comments[0].replies'),
      _link_id: item.link_id,
      _isCommentList: true
    });
  }
  if (item.constructor._name === 'Submission') {
    return item._r._newObject('Listing', {
      _uri: 'comments/' + item.id,
      _transform: (0, _property3.default)('comments'),
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
function addEmptyRepliesListing(item) {
  item.replies = getEmptyRepliesListing(item);
  return item;
}

function handleJsonErrors(returnValue) {
  return function (response) {
    if ((0, _isEmpty3.default)(response) || (0, _isEmpty3.default)(response.json.errors)) {
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
function findMessageInTree(desiredName, rootNode) {
  return rootNode.name === desiredName ? rootNode : (0, _find3.default)(rootNode.replies.map((0, _partial3.default)(findMessageInTree, desiredName)));
}

/**
* @summary Formats permissions into a '+'/'-' string
* @param {String[]} allPermissionNames All possible permissions in this category
* @param {String[]} permsArray The permissions that should be enabled
* @returns {String} The permissions formatted into a '+'/'-' string
* @api private
*/
function formatPermissions(allPermissionNames, permsArray) {
  return permsArray ? allPermissionNames.map(function (type) {
    return ((0, _includes3.default)(permsArray, type) ? '+' : '-') + type;
  }).join(',') : '+all';
}

var formatModPermissions = exports.formatModPermissions = (0, _partial3.default)(formatPermissions, _constants.MODERATOR_PERMISSIONS);
var formatLivethreadPermissions = exports.formatLivethreadPermissions = (0, _partial3.default)(formatPermissions, _constants.LIVETHREAD_PERMISSIONS);

/**
* @summary Renames a key on an object, omitting the old key
* @param {Object} obj
* @param oldKey {String}
* @param newKey {String}
* @returns {Object} A version of the object with the key renamed
* @api private
*/
function renameKey(obj, oldKey, newKey) {
  return obj && (0, _omit3.default)(_extends({}, obj, { [newKey]: obj[oldKey] }), oldKey);
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
function buildRepliesTree(childList) {
  var childMap = (0, _keyBy3.default)(childList, 'name');
  childList.forEach(addEmptyRepliesListing);
  childList.filter(function (child) {
    return child.constructor._name === 'Comment';
  }).forEach(function (child) {
    return child.replies._more = _More.emptyChildren;
  });
  (0, _remove3.default)(childList, function (child) {
    return childMap[child.parent_id];
  }).forEach(function (child) {
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
function addFullnamePrefix(item, prefix) {
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
function hasFullnamePrefix(item) {
  return (/^(t\d|LiveUpdateEvent)_/.test(item)
  );
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
function addSnakeCaseShadowProps(obj) {
  Object.keys(obj).filter(function (key) {
    return !key.startsWith('_') && key !== (0, _snakeCase3.default)(key);
  }).forEach(function (key) {
    Object.defineProperty(obj, (0, _snakeCase3.default)(key), { get: function () {
        return obj[key];
      }, set: function (value) {
        return obj[key] = value;
      } });
  });
  return obj;
}

var isBrowser = exports.isBrowser = typeof self === 'object';

function defineInspectFunc(obj, inspectFunc) {
  if (isBrowser) {
    return;
  }
  // Use the util.inspect.custom symbol if available (Node 6.6.0+)
  var inspectKey = _util2.default.inspect && typeof _util2.default.inspect.custom === 'symbol' ? _util2.default.inspect.custom : 'inspect';
  Object.defineProperty(obj, inspectKey, { writable: true, enumerable: false, value: inspectFunc });
}

function requiredArg(argName) {
  throw new TypeError('Missing required argument ' + argName);
}