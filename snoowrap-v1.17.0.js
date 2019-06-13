(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PromiseCopy = _bluebird2.default.getNewLibraryCopy();
PromiseCopy.config({ cancellation: true, warnings: false });
exports.default = PromiseCopy;
},{"bluebird":26}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var MODULE_NAME = exports.MODULE_NAME = 'snoowrap';
var VERSION = exports.VERSION = '1.17.0';
var DOCS_LINK = exports.DOCS_LINK = 'https://not-an-aardvark.github.io/snoowrap/';
var API_RULES_LINK = exports.API_RULES_LINK = 'https://github.com/reddit/reddit/wiki/API';
/* USER_KEYS and SUBREDDIT_KEYS are keys that are replaced by RedditUser and Subreddit objects when encountered in
`snoowrap#_populate`. `author`, `approved_by`, `banned_by`, and `subreddit` all appear in fetched Submissions, among other
places. `user` appears in responses from the api/flairlist endpoint, and `sr` appears in responses from the `api/v1/me/karma`
endpoint. */
var USER_KEYS = exports.USER_KEYS = new Set(['author', 'approved_by', 'banned_by', 'user']);
var SUBREDDIT_KEYS = exports.SUBREDDIT_KEYS = new Set(['subreddit', 'sr']);
var KINDS = exports.KINDS = {
  t1: 'Comment',
  t2: 'RedditUser',
  t3: 'Submission',
  t4: 'PrivateMessage',
  t5: 'Subreddit',
  t6: 'Trophy',
  t8: 'PromoCampaign',
  Listing: 'Listing',
  more: 'More',
  UserList: 'UserList',
  KarmaList: 'KarmaList',
  TrophyList: 'TrophyList',
  subreddit_settings: 'SubredditSettings',
  modaction: 'ModAction',
  wikipage: 'WikiPage',
  wikipagesettings: 'WikiPageSettings',
  wikipagelisting: 'WikiPageListing',
  LiveUpdateEvent: 'LiveThread',
  LiveUpdate: 'LiveUpdate',
  LabeledMulti: 'MultiReddit',
  ModmailConversation: 'ModmailConversation',
  ModmailConversationAuthor: 'ModmailConversationAuthor'
};
var USERNAME_REGEX = exports.USERNAME_REGEX = /^[\w-]{1,20}$/;
var MODERATOR_PERMISSIONS = exports.MODERATOR_PERMISSIONS = ['wiki', 'posts', 'access', 'mail', 'config', 'flair'];
var LIVETHREAD_PERMISSIONS = exports.LIVETHREAD_PERMISSIONS = ['update', 'edit', 'manage'];
var HTTP_VERBS = exports.HTTP_VERBS = ['delete', 'get', 'head', 'patch', 'post', 'put'];
var IDEMPOTENT_HTTP_VERBS = exports.IDEMPOTENT_HTTP_VERBS = ['delete', 'get', 'head', 'put'];
var MAX_TOKEN_LATENCY = exports.MAX_TOKEN_LATENCY = 10000;
var MAX_API_INFO_AMOUNT = exports.MAX_API_INFO_AMOUNT = 100;
var MAX_API_MORECHILDREN_AMOUNT = exports.MAX_API_MORECHILDREN_AMOUNT = 20;
var MAX_LISTING_ITEMS = exports.MAX_LISTING_ITEMS = 100;
},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var config = Object.create(null);
  config.endpointDomain = 'reddit.com';
  config.requestDelay = 0;
  config.requestTimeout = 30000;
  config.continueAfterRatelimitError = false;
  config.retryErrorCodes = [502, 503, 504, 522];
  config.maxRetryAttempts = 3;
  config.warnings = true;
  config.debug = false;
  config.proxies = true;

  return (0, _helpers.addSnakeCaseShadowProps)(config);
};

var _helpers = require('./helpers.js');
},{"./helpers.js":5}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StatusCodeError = exports.RequestError = exports.InvalidMethodCallError = exports.NoCredentialsError = exports.InvalidUserError = exports.RateLimitError = undefined;
exports.rateLimitWarning = rateLimitWarning;

var _constants = require('./constants.js');

class RateLimitError extends Error {
  constructor() {
    super(_constants.MODULE_NAME + ' refused to continue because reddit\'s ratelimit was exceeded. For more information about reddit\'s ratelimit, please consult reddit\'s API rules at ' + _constants.API_RULES_LINK + '.');
  }
}

exports.RateLimitError = RateLimitError; /* eslint-disable max-len */

class InvalidUserError extends Error {
  constructor() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Cannot fetch information on the given user. Please be sure you have the right username.';

    super(message);
  }
}

exports.InvalidUserError = InvalidUserError;
class NoCredentialsError extends Error {
  constructor() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Missing credentials passed to ' + _constants.MODULE_NAME + ' constructor. You must pass an object containing either (a) userAgent, clientId, clientSecret, and refreshToken properties, (b) userAgent and accessToken properties, or (c) userAgent, clientId, clientSecret, username, and password properties. For information, please read the docs at ' + _constants.DOCS_LINK + '.';

    super(message);
  }
}

exports.NoCredentialsError = NoCredentialsError;
class InvalidMethodCallError extends Error {}
exports.InvalidMethodCallError = InvalidMethodCallError;
class RequestError extends Error {}
exports.RequestError = RequestError;
class StatusCodeError extends Error {}

exports.StatusCodeError = StatusCodeError;
function rateLimitWarning(millisecondsUntilReset) {
  return 'Warning: ' + _constants.MODULE_NAME + ' temporarily stopped sending requests because reddit\'s ratelimit was exceeded. The request you attempted to send was queued, and will be sent to reddit when the current ratelimit period expires in ' + millisecondsUntilReset / 1000 + ' seconds.';
}
},{"./constants.js":2}],5:[function(require,module,exports){
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
},{"./constants.js":2,"./objects/More.js":10,"lodash/find":244,"lodash/includes":252,"lodash/isEmpty":258,"lodash/keyBy":269,"lodash/omit":280,"lodash/partial":282,"lodash/property":285,"lodash/remove":286,"lodash/snakeCase":287,"util":27}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _helpers = require('../helpers.js');

var _Listing = require('./Listing.js');

var _Listing2 = _interopRequireDefault(_Listing);

var _More = require('./More.js');

var _VoteableContent = require('./VoteableContent.js');

var _VoteableContent2 = _interopRequireDefault(_VoteableContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* A class representing a reddit comment
* <style> #Comment {display: none} </style>
* @example
*
* // Get a comment with the given ID
* r.getComment('c0hkuyq')
*
* @extends VoteableContent
*/
var Comment = class Comment extends _VoteableContent2.default {
  constructor(options, _r, _hasFetched) {
    super(options, _r, _hasFetched);
    if (_hasFetched) {
      /* If a comment is in a deep comment chain, reddit will send a single `more` object with name `t1__` in place of the
      comment's replies. This is the equivalent of seeing a 'Continue this thread' link on the HTML site, and it indicates that
      replies should be fetched by sending another request to view the deep comment alone, and parsing the replies from that. */
      if (this.replies instanceof _Listing2.default && !this.replies.length && this.replies._more && this.replies._more.name === 't1__') {
        this.replies = (0, _helpers.getEmptyRepliesListing)(this);
      } else if (this.replies === '') {
        /* If a comment has no replies, reddit returns an empty string as its `replies` property rather than an empty Listing.
        This behavior is unexpected, so replace the empty string with an empty Listing. */
        this.replies = this._r._newObject('Listing', { children: [], _more: _More.emptyChildren, _isCommentList: true });
      } else if (this.replies._more && !this.replies._more.link_id) {
        this.replies._more.link_id = this.link_id;
      }
    }
  }
  _transformApiResponse(response) {
    return (0, _helpers.addEmptyRepliesListing)(response[0]);
  }
  get _uri() {
    return 'api/info?id=' + this.name;
  }
};

exports.default = Comment;
},{"../helpers.js":5,"./Listing.js":7,"./More.js":10,"./VoteableContent.js":19}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _pick2 = require('lodash/pick');

var _pick3 = _interopRequireDefault(_pick2);

var _omitBy2 = require('lodash/omitBy');

var _omitBy3 = _interopRequireDefault(_omitBy2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _defaultsDeep2 = require('lodash/defaultsDeep');

var _defaultsDeep3 = _interopRequireDefault(_defaultsDeep2);

var _defaults2 = require('lodash/defaults');

var _defaults3 = _interopRequireDefault(_defaults2);

var _clone2 = require('lodash/clone');

var _clone3 = _interopRequireDefault(_clone2);

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _Promise = require('../Promise.js');

var _Promise2 = _interopRequireDefault(_Promise);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _url = require('url');

var _helpers = require('../helpers.js');

var _errors = require('../errors.js');

var _More = require('./More.js');

var _More2 = _interopRequireDefault(_More);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var INTERNAL_DEFAULTS = {
  _query: {},
  _transform: function (value) {
    return value;
  },
  _method: 'get',
  _isCommentList: false,
  _link_id: null,
  _uri: null,
  _more: null,
  _cachedLookahead: null
};

/**
* A class representing a list of content. This is a subclass of the native Array object, so it has all the properties of
an Array (length, forEach, etc.) in addition to some added methods. The Listing can be extended by using the
[#fetchMore()]{@link Listing#fetchMore} and
[#fetchAll()]{@link Listing#fetchAll} functions. Note that these methods return new Listings, rather than mutating the
original Listing.
*
* Most methods that return Listings will also accept `limit`, `after`, `before`, `show`, and `count` properties.
*
* If you've used the reddit API before (or used other API wrappers like [PRAW](https://praw.readthedocs.org/en/stable/)), you
might know that reddit uses a `MoreComments` object in its raw JSON responses, representing comments that have been stubbed
out of Listings. In snoowrap, there are no exposed `MoreComments` objects; the objects returned by the reddit API are
stripped from Listings and are used internally as sources for the `fetchMore` functions. This means that in snoowrap, Listings
that contain Comments can be used/expanded in the same manner as Listings that don't contain Comments, and for the most part
you don't have to worry about the distinction.

(Incidentally, if you encounter a Listing that *does* contain a `MoreComments` object then it's a bug, so please report it.)

* <style> #Listing {display: none} </style>
* @extends Array
*/
var Listing = class Listing extends Array {
  constructor() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _r = arguments[1];

    super();
    if (!(this instanceof Listing)) {
      // Safari 9 has an incorrect implementation of classes that extend Arrays. As a workaround,
      // manually set the constructor and prototype.
      this.constructor = Listing;
      Object.setPrototypeOf(this, Listing.prototype);
    }
    this.push.apply(this, _toConsumableArray(options.children || []));
    this._r = _r;
    this._cachedLookahead = options._cachedLookahead;
    (0, _defaultsDeep3.default)(this, (0, _pick3.default)(options, Object.keys(INTERNAL_DEFAULTS)), INTERNAL_DEFAULTS);
    Object.assign(this._query, (0, _pick3.default)(options, ['before', 'after']));
    if (options.children && options.children[options.children.length - 1] instanceof _More2.default) {
      this._setMore(this.pop());
    }
  }
  _setUri(value) {
    var parsedUri = (0, _url.parse)(value, true);
    this._uri = parsedUri.pathname;
    (0, _defaultsDeep3.default)(this._query, parsedUri.query);
    if (parsedUri.query.before) {
      this._query.after = null;
    } else {
      this._query.before = null;
    }
  }
  /**
  * @summary A getter that indicates whether this Listing has any more items to fetch.
  * @type {boolean}
  */
  get isFinished() {
    // The process of checking whether a Listing is 'finished' varies depending on what kind of Listing it is.
    return this._isCommentList
    /* For comment Listings (i.e. Listings containing comments and comment replies, sourced by `more` objects): A Listing is
    *never* finished if it has a cached lookahead (i.e. extra items that were fetched from a previous request). If there is
    no cached lookahead, a Listing is finished iff it has an empty `more` object. */
    ? (0, _isEmpty3.default)(this._cachedLookahead) && !!this._more && (0, _isEmpty3.default)(this._more.children)
    /* For non-comment Listings: A Listing is always finished if it has no URI (since there would be nowhere to fetch items
    from). If it has a URI, a Listing is finished iff its `before` and `after` query are both `null`. This is because reddit
    returns a value of `null` as the `after` and `before` parameters to signify that a Listing is complete.
     It is important to check for `null` here rather than any falsey value, because when an empty Listing is initialized, its
    `after` and `before` properties are both `undefined`, but calling these empty Listings `finished` would be incorrect. */
    : !this._uri || this._query.after === null && this._query.before === null;
  }
  get is_finished() {
    // camel-case alias for backwards-compatibility.
    // As a getter, the `isFinished` property doesn't have an alias like everything else.
    return this.isFinished;
  }
  /**
  * @summary Fetches some more items
  * @param {object} options
  * @param {number} options.amount The number of items to fetch.
  * @param {boolean} [options.skipReplies=false] For a Listing that contains comment objects on a Submission, this option can
  be used to save a few API calls, provided that only top-level comments are being examined. If this is set to `true`, snoowrap
  is able to fetch 100 Comments per API call rather than 20, but all returned Comments will have no fetched replies by default.
  *
  * Internal details: When `skipReplies` is set to `true`, snoowrap uses reddit's `api/info` endpoint to fetch Comments. When
  `skipReplies` is set to `false`, snoowrap uses reddit's `api/morechildren` endpoint. It's worth noting that reddit does
  not allow concurrent requests to the `api/morechildren` endpoint by the same account.
  * @param {boolean} [options.append=true] If `true`, the resulting Listing will contain the existing elements in addition to
  the newly-fetched elements. If `false`, the resulting Listing will only contain the newly-fetched elements.
  * @returns {Promise} A new Listing containing the newly-fetched elements. If `options.append` is `true`, the new Listing will
  also contain all elements that were in the original Listing. Under most circumstances, the newly-fetched elements will appear
  at the end of the new Listing. However, if reverse pagination is enabled (i.e. if this Listing was created with a `before`
  query parameter), then the newly-fetched elements will appear at the beginning. In any case, continuity is maintained, i.e.
  the order of items in the Listing will be the same as the order in which they appear on reddit.
  * @example
  * r.getHot({limit: 25}).then(myListing => {
  *   console.log(myListing.length); // => 25
  *   myListing.fetchMore({amount: 10}).then(extendedListing => {
  *     console.log(extendedListing.length); // => 35
  *   })
  * });
  */
  fetchMore(options) {
    var parsedOptions = (0, _defaults3.default)(typeof options === 'number' ? { amount: options } : (0, _clone3.default)(options),
    // Accept either `skip_replies` or `skipReplies` for backwards compatibility.
    { append: true, skipReplies: options.skip_replies });
    if (typeof parsedOptions.amount !== 'number' || Number.isNaN(parsedOptions.amount)) {
      throw new _errors.InvalidMethodCallError('Failed to fetch Listing. (`amount` parameter was missing or invalid)');
    }
    if (parsedOptions.amount <= 0 || this.isFinished) {
      return this._r._promiseWrap(_Promise2.default.resolve(parsedOptions.append ? this._clone() : this._clone()._empty()));
    }
    if (this._cachedLookahead) {
      var cloned = this._clone();
      cloned.push.apply(cloned, _toConsumableArray(cloned._cachedLookahead.splice(0, parsedOptions.amount)));
      return cloned.fetchMore(parsedOptions.amount - cloned.length + this.length);
    }
    return this._r._promiseWrap(this._more ? this._fetchMoreComments(parsedOptions) : this._fetchMoreRegular(parsedOptions));
  }
  _fetchMoreRegular(options) {
    var _this = this;

    var query = (0, _omitBy3.default)((0, _clone3.default)(this._query), function (value) {
      return value === null || value === undefined;
    });
    if (!this._isCommentList) {
      /* Reddit returns a different number of items per request depending on the `limit` querystring property specified in the
      request. If no `limit` property is specified, reddit returns some number of items depending on the user's preferences
      (currently 25 items with default preferences). If a `limit` property is specified, then reddit returns `limit` items per
      batch. However, this is capped at 100, so if a `limit` larger than 100 items is specified, reddit will only return 100
      items in the batch. (The cap of 100 could plausibly change to a different amount in the future.)
       However, one caveat is that reddit's parser doesn't understand the javascript `Infinity` global. If `limit=Infinity` is
      provided in the querystring, reddit won't understand the parameter so it'll just act as if no parameter was provided, and
      will return 25 items in the batch. This is suboptimal behavior as far as snoowrap is concerned, because it means that 4
      times as many requests are needed to fetch the entire listing.
       To get around the issue, snoowrap caps the `limit` property at Number.MAX_SAFE_INTEGER when sending requests. This ensures
      that `Infinity` will never be sent as part of the querystring, so reddit will always return the maximal 100 items per
      request if the desired amount of items is large. */
      query.limit = Math.min(options.amount, Number.MAX_SAFE_INTEGER);
    }
    return this._r.oauthRequest({
      uri: this._uri,
      qs: query,
      method: this._method
    }).then(this._transform).then(function (response) {
      var cloned = _this._clone();
      if (!options.append) {
        cloned._empty();
      }
      if (cloned._query.before) {
        cloned.unshift.apply(cloned, _toConsumableArray(response));
        cloned._query.before = response._query.before;
        cloned._query.after = null;
      } else {
        cloned.push.apply(cloned, _toConsumableArray(response));
        cloned._query.before = null;
        cloned._query.after = response._query.after;
      }
      if (_this._isCommentList) {
        cloned._more = cloned._more || response._more || _More.emptyChildren;
        if (response.length > options.amount) {
          cloned._cachedLookahead = Array.from(cloned.splice(options.amount));
        }
      }
      return cloned.fetchMore(_extends({}, options, { append: true, amount: options.amount - response.length }));
    });
  }
  /* Pagination for comments works differently than it does for most other things; rather than sending a link to the next page
  within a Listing, reddit sends the last comment in the list as as a `more` object, with links to all the remaining comments
  in the thread. */
  _fetchMoreComments(options) {
    var _this2 = this;

    return this._more.fetchMore(options).then(function (moreComments) {
      var cloned = _this2._clone();
      if (!options.append) {
        cloned._empty();
      }
      cloned.push.apply(cloned, _toConsumableArray(moreComments));
      cloned._more.children = cloned._more.children.slice(options.amount);
      return cloned;
    });
  }
  /**
  * @summary Fetches all of the items in this Listing, only stopping when there are none left.
  * @param {object} [options] Fetching options -- see {@link Listing#fetchMore}
  * @returns {Promise} A new fully-fetched Listing. Keep in mind that this method has the potential to exhaust your
  ratelimit quickly if the Listing doesn't have a clear end (e.g. with posts on the front page), so use it with discretion.
  * @example
  *
  * r.getMe().getUpvotedContent().fetchAll().then(console.log)
  * // => Listing [ Submission { ... }, Submission { ... }, ... ]
  */
  fetchAll(options) {
    return this.fetchMore(_extends({}, options, { amount: Infinity }));
  }
  fetchUntil(options) {
    this._r._warn('Listing#fetchUntil is deprecated -- use Listing#fetchMore instead.');
    return this.fetchMore(_extends({}, options, { append: true, amount: options.length - this.length }));
  }
  _clone() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$deep = _ref.deep,
        deep = _ref$deep === undefined ? false : _ref$deep;

    var properties = (0, _pick3.default)(this, Object.keys(INTERNAL_DEFAULTS));
    properties._query = (0, _clone3.default)(properties._query);
    properties._cachedLookahead = (0, _clone3.default)(properties._cachedLookahead);
    properties._more = this._more && this._more._clone();
    var shallowChildren = Array.from(this);
    properties.children = deep ? shallowChildren.map(function (item) {
      return '_clone' in item && typeof item._clone === 'function' ? item._clone({ deep }) : item;
    }) : shallowChildren;
    return new Listing(properties, this._r);
  }
  _setMore(moreObj) {
    this._more = moreObj;
    this._isCommentList = true;
  }
  _empty() {
    this.splice(0, this.length);
    return this;
  }
  toJSON() {
    return Array.from(this).map(function (item) {
      return item && item.toJSON ? item.toJSON() : item;
    });
  }
};

(0, _helpers.defineInspectFunc)(Listing.prototype, function () {
  return 'Listing ' + _util2.default.inspect(Array.from(this));
});

exports.default = Listing;
},{"../Promise.js":1,"../errors.js":4,"../helpers.js":5,"./More.js":10,"lodash/clone":236,"lodash/defaults":241,"lodash/defaultsDeep":242,"lodash/isEmpty":258,"lodash/omitBy":281,"lodash/pick":283,"url":321,"util":27}],8:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _events = require('events');

var _helpers = require('../helpers.js');

var _RedditContent = require('./RedditContent.js');

var _RedditContent2 = _interopRequireDefault(_RedditContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var WebSocket = _helpers.isBrowser ? global.WebSocket : require('ws');

var api_type = 'json';

/**
* A class representing a live reddit thread
* <style> #LiveThread {display: none} </style>
* @example
*
* // Get a livethread with the given ID
* r.getLivethread('whrdxo8dg9n0')
* @desc For the most part, reddit distributes the content of live threads via websocket, rather than through the REST API.
As such, snoowrap assigns each fetched LiveThread object a `stream` property, which takes the form of an
[EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter). To listen for new thread updates, simply
add listeners to that emitter.

The following events can be emitted:
- `update`: Occurs when a new update has been posted in this thread. Emits a `LiveUpdate` object containing information
about the new update.
- `activity`: Occurs periodically when the viewer count for this thread changes.
- `settings`: Occurs when the thread's settings change. Emits an object containing the new settings.
- `delete`: Occurs when an update has been deleted. Emits the ID of the deleted update.
- `strike`: Occurs when an update has been striken (marked incorrect and crossed out). Emits the ID of the striken update.
- `embeds_ready`: Occurs when embedded media is now available for a previously-posted update.
- `complete`: Occurs when this LiveThread has been marked as complete, and no more updates will be sent.

(Note: These event types are mapped directly from reddit's categorization of the updates. The descriptions above are
paraphrased from reddit's descriptions [here](https://www.reddit.com/dev/api#section_live).)

As an example, this would log all new livethread updates to the console:

```javascript
someLivethread.stream.on('update', data => {
  console.log(data.body);
});
```

* @extends RedditContent
*/
var LiveThread = class LiveThread extends _RedditContent2.default {
  constructor(options, _r, _hasFetched) {
    var _this;

    _this = super(options, _r, _hasFetched);
    this._rawStream = null;
    this._populatedStream = null;
    if (_hasFetched) {
      Object.defineProperty(this, 'stream', { get: function () {
          if (!_this._populatedStream && _this.websocket_url) {
            _this._setupWebSocket();
          }
          return _this._populatedStream;
        } });
    }
  }
  get _uri() {
    return 'live/' + this.id + '/about';
  }
  _setupWebSocket() {
    var _this2 = this;

    this._rawStream = new WebSocket(this.websocket_url);
    this._populatedStream = new _events.EventEmitter();
    var handler = function (data) {
      var parsed = _this2._r._populate(JSON.parse(data));
      _this2._populatedStream.emit(parsed.type, parsed.payload);
    };
    if (typeof this._rawStream.on === 'function') {
      this._rawStream.on('message', handler);
    } else {
      this._rawStream.onmessage = function (messageEvent) {
        return handler(messageEvent.data);
      };
    }
  }
  /**
  * @summary Adds a new update to this thread.
  * @param {string} body The body of the new update
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').addUpdate('Breaking: Someone is reading the snoowrap documentation \\o/')
  */
  addUpdate(body) {
    return this._post({ uri: 'api/live/' + this.id + '/update', form: { api_type, body } }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Strikes (marks incorrect and crosses out) the given update.
  * @param {object} options
  * @param {string} options.id The ID of the update that should be striked.
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').strikeUpdate({id: 'LiveUpdate_edc34446-faf0-11e5-a1b4-0e858bca33cd'})
  */
  strikeUpdate(_ref) {
    var id = _ref.id;

    return this._post({
      uri: 'api/live/' + this.id + '/strike_update',
      form: { api_type, id: '' + (id.startsWith('LiveUpdate_') ? '' : 'LiveUpdate_') + id }
    }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Deletes an update from this LiveThread.
  * @param {object} options
  * @param {string} options.id The ID of the LiveUpdate that should be deleted
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').deleteUpdate({id: 'LiveUpdate_edc34446-faf0-11e5-a1b4-0e858bca33cd'})
  */
  deleteUpdate(_ref2) {
    var id = _ref2.id;

    return this._post({
      uri: 'api/live/' + this.id + '/delete_update',
      form: { api_type, id: '' + (id.startsWith('LiveUpdate_') ? '' : 'LiveUpdate_') + id }
    }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Gets a list of this LiveThread's contributors
  * @returns {Promise} An Array containing RedditUsers
  * @example
  *
  * r.getLivethread('whrdxo8dg9n0').getContributors().then(console.log)
  * // => [
  * //  RedditUser { permissions: ['edit'], name: 'not_an_aardvark', id: 't2_k83md' },
  * //  RedditUser { permissions: ['all'], id: 't2_u3l80', name: 'snoowrap_testing' }
  * // ]
  */
  getContributors() {
    return this._get({ uri: 'live/' + this.id + '/contributors' }).then(function (contributors) {
      return Array.isArray(contributors[0]) ? contributors[0] : contributors;
    });
  }
  /**
  * @summary Invites a contributor to this LiveThread.
  * @param {object} options
  * @param {string} options.name The name of the user who should be invited
  * @param {Array} options.permissions The permissions that the invited user should receive. This should be an Array containing
  some combination of `'update', 'edit', 'manage'`. To invite a contributor with full permissions, omit this property.
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').inviteContributor({name: 'actually_an_aardvark', permissions: ['update']})
  */
  inviteContributor(_ref3) {
    var name = _ref3.name,
        permissions = _ref3.permissions;

    return this._post({ uri: 'api/live/' + this.id + '/invite_contributor', form: {
        api_type,
        name,
        permissions: (0, _helpers.formatLivethreadPermissions)(permissions),
        type: 'liveupdate_contributor_invite'
      } }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Revokes an invitation for the given user to become a contributor on this LiveThread.
  * @param {object} options
  * @param {string} options.name The username of the account whose invitation should be revoked
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').revokeContributorInvite({name: 'actually_an_aardvark'});
  */
  revokeContributorInvite(_ref4) {
    var _this3 = this;

    var name = _ref4.name;

    return this._r.getUser(name).fetch().get('id').then(function (userId) {
      return _this3._post({ uri: 'api/live/' + _this3.id + '/rm_contributor_invite', form: { api_type, id: 't2_' + userId } });
    }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Accepts a pending contributor invitation on this LiveThread.
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').acceptContributorInvite()
  */
  acceptContributorInvite() {
    return this._post({ uri: 'api/live/' + this.id + '/accept_contributor_invite', form: { api_type } }).return(this);
  }
  /**
  * @summary Abdicates contributor status on this LiveThread.
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').leaveContributor()
  */
  leaveContributor() {
    return this._post({ uri: 'api/live/' + this.id + '/leave_contributor', form: { api_type } }).return(this);
  }
  /**
  * @summary Removes the given user from contributor status on this LiveThread.
  * @param {object} options
  * @param {string} options.name The username of the account who should be removed
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').removeContributor({name: 'actually_an_aardvark'})
  */
  removeContributor(_ref5) {
    var _this4 = this;

    var name = _ref5.name;

    return this._r.getUser(name).fetch().get('id').then(function (userId) {
      return _this4._post({ uri: 'api/live/' + _this4.id + '/rm_contributor', form: { api_type, id: 't2_' + userId } });
    }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Sets the permissions of the given contributor.
  * @param {object} options
  * @param {string} options.name The name of the user whose permissions should be changed
  * @param {Array} options.permissions The updated permissions that the user should have. This should be an Array containing
  some combination of `'update', 'edit', 'manage'`. To give the contributor with full permissions, omit this property.
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').setContributorPermissions({name: 'actually_an_aardvark', permissions: ['edit']})
  */
  setContributorPermissions(_ref6) {
    var name = _ref6.name,
        permissions = _ref6.permissions;

    return this._post({
      uri: 'api/live/' + this.id + '/set_contributor_permissions',
      form: { api_type, name, permissions: (0, _helpers.formatLivethreadPermissions)(permissions), type: 'liveupdate_contributor' }
    }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Edits the settings on this LiveThread.
  * @param {object} options
  * @param {string} options.title The title of the thread
  * @param {string} [options.description] A descriptions of the thread. 120 characters max
  * @param {string} [options.resources] Information and useful links related to the thread.
  * @param {boolean} options.nsfw Determines whether the thread is Not Safe For Work
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').editSettings({title: 'My livethread', description: 'an updated description'})
  */
  editSettings(_ref7) {
    var title = _ref7.title,
        description = _ref7.description,
        resources = _ref7.resources,
        nsfw = _ref7.nsfw;

    return this._post({
      uri: 'api/live/' + this.id + '/edit',
      form: { api_type, description, nsfw, resources, title }
    }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Permanently closes this thread, preventing any more updates from being added.
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').closeThread()
  */
  closeThread() {
    return this._post({ uri: 'api/live/' + this.id + '/close_thread', form: { api_type } }).return(this);
  }
  /**
  * @summary Reports this LiveThread for breaking reddit's rules.
  * @param {object} options
  * @param {string} options.reason The reason for the report. One of `spam`, `vote-manipulation`, `personal-information`,
  `sexualizing-minors`, `site-breaking`
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').report({reason: 'Breaking a rule blah blah blah'})
  */
  report(_ref8) {
    var reason = _ref8.reason;

    return this._post({ uri: 'api/live/' + this.id + '/report', form: { api_type, type: reason } }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Gets a Listing containing past updates to this LiveThread.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing LiveUpdates
  * @example
  *
  * r.getLivethread('whrdxo8dg9n0').getRecentUpdates().then(console.log)
  * // => Listing [
  * //  LiveUpdate { ... },
  * //  LiveUpdate { ... },
  * //  ...
  * // ]
  */
  getRecentUpdates(options) {
    return this._getListing({ uri: 'live/' + this.id, qs: options });
  }
  /**
  * @summary Gets a list of reddit submissions linking to this LiveThread.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions
  * @example
  *
  * r.getLivethread('whrdxo8dg9n0').getDiscussions().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getDiscussions(options) {
    return this._getListing({ uri: 'live/' + this.id + '/discussions', qs: options });
  }
  /**
  * @summary Stops listening for new updates on this LiveThread.
  * @desc To avoid memory leaks that can result from open sockets, it's recommended that you call this method when you're
  finished listening for updates on this LiveThread.
  *
  * This should not be confused with {@link LiveThread#closeThread}, which marks the thread as "closed" on reddit.
  * @returns undefined
  * @example
  *
  * var myThread = r.getLivethread('whrdxo8dg9n0');
  * myThread.stream.on('update', content => {
  *   console.log(content);
  *   myThread.closeStream();
  * })
  *
  */
  closeStream() {
    if (this._rawStream) {
      this._rawStream.close();
    }
  }
};

exports.default = LiveThread;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../helpers.js":5,"./RedditContent.js":13,"events":31,"ws":27}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.modActionStates = exports.conversationStates = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _RedditContent = require('./RedditContent.js');

var _RedditContent2 = _interopRequireDefault(_RedditContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var conversationStates = exports.conversationStates = Object.freeze({
  New: 0,
  InProgress: 1,
  Archived: 2
});

var modActionStates = exports.modActionStates = Object.freeze({
  Highlight: 0,
  UnHighlight: 1,
  Archive: 2,
  UnArchive: 3,
  ReportedToAdmins: 4,
  Mute: 5,
  Unmute: 6
});

/**
 * A class representing a conversation from new modmail
 * <style> #ModmailConversation {display: none} </style>
 * @example
 *
 * // Get a Modmail Conversation with a given ID
 * r.getNewModmailConversation('75hxt')
 * @extends RedditContent
 */
var ModmailConversation = class ModmailConversation extends _RedditContent2.default {

  static get conversationStates() {
    return conversationStates;
  }

  static get modActionStates() {
    return modActionStates;
  }

  get _uri() {
    return 'api/mod/conversations/' + this.id + '?markRead=false';
  }

  /**
   * @summary Converts relevant fields in the ModmailConversation to snoowrap models.
   * @param response API Response
   * @return {ModmailConversation}
   * @private
   */
  _transformApiResponse(response) {
    response.conversation.owner = this._r._newObject('Subreddit', {
      id: response.conversation.owner.id,
      display_name: response.conversation.owner.displayName
    });
    response.conversation.participant = this._r._newObject('ModmailConversationAuthor', response.user.name, true);
    for (var author of response.conversation.authors) {
      author = this._r._newObject('ModmailConversationAuthor', author, true);
    }

    var conversationObjects = ModmailConversation._getConversationObjects(response.conversation, response);
    return this._r._newObject('ModmailConversation', _extends({}, conversationObjects, response.conversation), true);
  }

  /**
   * @summary Maps objects to the ModmailConversation
   * @param conversation The conversation to map objects to
   * @param response API Response
   * @return {object}
   * @private
   */
  static _getConversationObjects(conversation, response) {
    var conversationObjects = {};
    for (var objId of conversation.objIds) {
      if (!conversationObjects[objId.key]) {
        conversationObjects[objId.key] = [];
      }
      conversationObjects[objId.key].push(response[objId.key][objId.id]);
    }
    return conversationObjects;
  }

  /**
   * @summary Archives the ModmailConversation
   * @return {Promise}
   * @example
   *
   * r.getNewModmailConversation('75hxt').archive()
   */
  archive() {
    return this._post({ uri: 'api/mod/conversations/' + this.id + '/archive' });
  }

  /**
   * @summary Unarchives the ModmailConversation
   * @return {Promise}
   * @example
   *
   * r.getNewModmailConversation('75hxt').unarchive()
   */
  unarchive() {
    return this._post({ uri: 'api/mod/conversations/' + this.id + '/unarchive' });
  }

  /**
   * @summary Marks a ModmailConversation as highlighted
   * @return {Promise}
   * @example
   *
   * r.getNewModmailConversation('75hxt').highlight()
   */
  highlight() {
    return this._post({ uri: 'api/mod/conversations/' + this.id + '/highlight' });
  }

  /**
   * @summary Removed highligted from a ModmailConversation
   * @return {Promise}
   * @example
   *
   * r.getNewModmailConversation('75hxt').unhighlight()
   */
  unhighlight() {
    return this._delete({ uri: 'api/mod/conversations/' + this.id + '/highlight' });
  }

  /**
   * @summary Mute the participant of the ModmailConversation
   * @return {Promise}
   * @example
   *
   * r.getNewModmailConversation('75hxt').mute()
   */
  mute() {
    return this._post({ uri: 'api/mod/conversations/' + this.id + '/mute' });
  }

  /**
   * @summary Unmute the participant of the ModmailConversation
   * @return {Promise}
   * @example
   *
   * r.getNewModmailConversation('75hxt').unmute()
   */
  unmute() {
    return this._post({ uri: 'api/mod/conversations/' + this.id + '/unmute' });
  }

  /**
   * @summary Marks the ModmailConversation as read
   * @return {Promise}
   * @example
   *
   * r.getNewModmailConversation('75hxt').read()
   */
  read() {
    return this._r.markNewModmailConversationsAsRead([this.id]);
  }

  /**
   * @summary Marks the ModmailConversation as unread
   * @return {Promise}
   * @example
   *
   * r.getNewModmailConversation('75hxt').unread()
   */
  unread() {
    return this._r.markNewModmailConversationsAsUnread([this.id]);
  }

  /**
   * @summary Fetches the participant of the conversation
   * @return {Promise<ModmailConversationAuthor>}
   * @example
   *
   * r.getNewModmailConversation('75hxt').getParticipant().then(console.log)
   * // ModmailConversationAuthor { muteStatus: {...}, name: "SpyTec13", created: '2015-11-22T14:30:38.821292+00:00', ...}
   */
  getParticipant() {
    var _this = this;

    return this._get({ uri: 'api/mod/conversations/' + this.id + '/user' }).then(function (res) {
      return _this._r._newObject('ModmailConversationAuthor', res, true);
    });
  }

  /**
   * @summary Returns whether the ModmailConversation is read.
   * @return {boolean} true, if read. false otherwise
   */
  isRead() {
    return this.lastUnread === null;
  }

  get name() {
    return this.id;
  }
};

exports.default = ModmailConversation;
},{"./RedditContent.js":13}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.emptyChildren = undefined;

var _remove2 = require('lodash/remove');

var _remove3 = _interopRequireDefault(_remove2);

var _pick2 = require('lodash/pick');

var _pick3 = _interopRequireDefault(_pick2);

var _forEach2 = require('lodash/forEach');

var _forEach3 = _interopRequireDefault(_forEach2);

var _flatten2 = require('lodash/flatten');

var _flatten3 = _interopRequireDefault(_flatten2);

var _concat2 = require('lodash/concat');

var _concat3 = _interopRequireDefault(_concat2);

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _Promise = require('../Promise.js');

var _Promise2 = _interopRequireDefault(_Promise);

var _helpers = require('../helpers.js');

var _constants = require('../constants.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var api_type = 'json';

/**
* The `More` class is a helper representing reddit's exposed `more` type in comment threads, used to fetch additional comments
on a thread.
* No instances of the `More` class are exposed externally by snoowrap; instead, comment lists are exposed as Listings.
Additional replies on an item can be fetched by calling `fetchMore` on a Listing, in the same manner as what would be done
with a Listing of posts. snoowrap should handle the differences internally, and expose a nearly-identical interface for the
two use-cases.

Combining reddit's `Listing` and `more` objects has the advantage of having a more consistent exposed interface; for example,
if a consumer iterates over the comments on a Submission, all of the iterated items will actually be Comment objects, so the
consumer won't encounter an unexpected `more` object at the end. However, there are a few disadvantages, namely that (a) this
leads to an increase in internal complexity, and (b) there are a few cases where reddit's `more` objects have different amounts
of available information (e.g. all the child IDs of a `more` object are known on creation), which leads to different optimal
behavior.
*/

var More = class More {
  constructor(options, _r) {
    Object.assign(this, options);
    this._r = _r;
  }
  /* Requests to /api/morechildren are capped at 20 comments at a time, but requests to /api/info are capped at 100, so
  it's easier to send to the latter. The disadvantage is that comment replies are not automatically sent from requests
  to /api/info. */
  fetchMore(options) {
    var startIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    if (options.amount <= 0 || startIndex >= this.children.length) {
      return _Promise2.default.resolve([]);
    }
    if (!options.skipReplies) {
      return this.fetchTree(options, startIndex);
    }
    var ids = getNextIdSlice(this.children, startIndex, options.amount, _constants.MAX_API_INFO_AMOUNT).map(function (id) {
      return 't1_' + id;
    });
    // Requests are capped at 100 comments. Send lots of requests recursively to get the comments, then concatenate them.
    // (This speed-requesting is only possible with comment Listings since the entire list of ids is present initially.)
    var promiseForThisBatch = this._r._getListing({ uri: 'api/info', qs: { id: ids.join(',') } });
    var nextRequestOptions = _extends({}, options, { amount: options.amount - ids.length });
    var promiseForRemainingItems = this.fetchMore(nextRequestOptions, startIndex + ids.length);
    return _Promise2.default.all([promiseForThisBatch, promiseForRemainingItems]).then(_flatten3.default);
  }
  fetchTree(options, startIndex) {
    var _this = this;

    if (options.amount <= 0 || startIndex >= this.children.length) {
      return _Promise2.default.resolve([]);
    }
    var ids = getNextIdSlice(this.children, startIndex, options.amount, _constants.MAX_API_MORECHILDREN_AMOUNT);
    return this._r._get({
      uri: 'api/morechildren',
      qs: { api_type, children: ids.join(','), link_id: this.link_id || this.parent_id }
    }).tap(_helpers.handleJsonErrors).then(function (res) {
      return res.json.data.things;
    }).map(_helpers.addEmptyRepliesListing).then(_helpers.buildRepliesTree).then(function (resultTrees) {
      /* Sometimes, when sending a request to reddit to get multiple comments from a `more` object, reddit decides to only
      send some of the requested comments, and then stub out the remaining ones in a smaller `more` object. ( ¯\_(ツ)_/¯ )
      In these cases, recursively fetch the smaller `more` objects as well. */
      var childMores = (0, _remove3.default)(resultTrees, function (c) {
        return c instanceof More;
      });
      (0, _forEach3.default)(childMores, function (c) {
        c.link_id = _this.link_id || _this.parent_id;
      });
      return _Promise2.default.mapSeries(childMores, function (c) {
        return c.fetchTree(_extends({}, options, { amount: Infinity }), 0);
      }).then(function (expandedTrees) {
        return _this.fetchMore(_extends({}, options, { amount: options.amount - ids.length }), startIndex + ids.length).then(function (nexts) {
          return (0, _concat3.default)(resultTrees, (0, _flatten3.default)(expandedTrees), nexts);
        });
      });
    });
  }
  _clone() {
    return new More((0, _pick3.default)(this, Object.getOwnPropertyNames(this)), this._r);
  }
};

function getNextIdSlice(children, startIndex, desiredAmount, limit) {
  return children.slice(startIndex, startIndex + Math.min(desiredAmount, limit));
}

var emptyChildren = exports.emptyChildren = new More({ children: [] });
exports.default = More;
},{"../Promise.js":1,"../constants.js":2,"../helpers.js":5,"lodash/concat":238,"lodash/flatten":246,"lodash/forEach":247,"lodash/pick":283,"lodash/remove":286}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _RedditContent = require('./RedditContent.js');

var _RedditContent2 = _interopRequireDefault(_RedditContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* @summary A class representing a multireddit.
* <style> #MultiReddit {display: none} </style>
* @example
*
* // Get a multireddit belonging to a specific user
* r.getUser('multi-mod').getMultireddit('coding_languages')
*/
var MultiReddit = class MultiReddit extends _RedditContent2.default {
  constructor(options, _r, _hasFetched) {
    var _this;

    _this = super(options, _r, _hasFetched);
    if (_hasFetched) {
      this.curator = _r.getUser(this.path.split('/')[2]);
      this.subreddits = this.subreddits.map(function (item) {
        return _this._r._newObject('Subreddit', item.data || { display_name: item.name });
      });
    }
  }
  get _uri() {
    return 'api/multi' + this._path + '?expand_srs=true';
  }
  get _path() {
    return '/user/' + this.curator.name + '/m/' + this.name;
  }
  /**
  * @summary Copies this multireddit to the requester's own account.
  * @param {object} options
  * @param {string} options.newName The new name for the copied multireddit
  * @returns {Promise} A Promise for the newly-copied multireddit
  * @example r.getUser('multi-mod').getMultireddit('coding_languages').copy({newName: 'my_coding_languages_copy'})
  */
  copy(_ref) {
    var _this2 = this;

    var new_name = _ref.new_name,
        _ref$newName = _ref.newName,
        newName = _ref$newName === undefined ? new_name : _ref$newName;

    return this._r._getMyName().then(function (name) {
      return _this2._post({ uri: 'api/multi/copy', form: {
          from: _this2._path,
          to: '/user/' + name + '/m/' + newName,
          display_name: newName
        } });
    });
  }
  /**
  * @summary Renames this multireddit.
  * @desc **Note**: This method mutates this MultiReddit.
  * @param {object} options
  * @param {string} options.newName The new name for this multireddit.
  * @returns {Promise} A Promise that fulfills with this multireddit
  * @example r.getUser('multi-mod').getMultireddit('coding_languages').copy({newName: 'cookie_languages '})
  * @deprecated Reddit no longer provides the corresponding API endpoint. Please use `edit()` with a new name.
  */
  rename(_ref2) {
    var _this3 = this;

    var new_name = _ref2.new_name,
        _ref2$newName = _ref2.newName,
        newName = _ref2$newName === undefined ? new_name : _ref2$newName;

    return this._r._getMyName().then(function (name) {
      return _this3._post({
        uri: 'api/multi/rename',
        form: { from: _this3._path, to: '/user/' + name + '/m/' + newName, display_name: newName }
      });
    }).then(function (res) {
      _this3.name = res.name;
    }).return(this);
  }
  /**
  * @summary Edits the properties of this multireddit.
  * @desc **Note**: Any omitted properties here will simply retain their previous values.
  * @param {object} options
  * @param {string} [options.name] The name of the new multireddit. 50 characters max.
  * @param {string} [options.description] A description for the new multireddit, in markdown.
  * @param {string} [options.visibility] The multireddit's visibility setting. One of `private`, `public`, `hidden`.
  * @param {string} [options.icon_name] One of `art and design`, `ask`, `books`, `business`, `cars`, `comics`, `cute animals`,
  `diy`, `entertainment`, `food and drink`, `funny`, `games`, `grooming`, `health`, `life advice`, `military`, `models pinup`,
  `music`, `news`, `philosophy`, `pictures and gifs`, `science`, `shopping`, `sports`, `style`, `tech`, `travel`,
  `unusual stories`, `video`, `None`
  * @param {string} [options.key_color] A six-digit RGB hex color, preceded by '#'
  * @param {string} [options.weighting_scheme] One of 'classic', 'fresh'
  * @returns {Promise} The updated version of this multireddit
  * @example r.getUser('not_an_aardvark').getMultireddit('cookie_languages').edit({visibility: 'hidden'})
  */
  edit(_ref3) {
    var _ref3$name = _ref3.name,
        name = _ref3$name === undefined ? '' : _ref3$name,
        description = _ref3.description,
        icon_name = _ref3.icon_name,
        key_color = _ref3.key_color,
        visibility = _ref3.visibility,
        weighting_scheme = _ref3.weighting_scheme;

    var display_name = name.length ? name : this.name;
    return this._put({ uri: 'api/multi' + this._path, form: { model: JSON.stringify({
          description_md: description,
          display_name,
          icon_name,
          key_color,
          visibility,
          weighting_scheme
        }) } });
  }
  /**
  * @summary Adds a subreddit to this multireddit.
  * @param {Subreddit} sub The Subreddit object to add (or a string representing a subreddit name)
  * @returns {Promise} A Promise that fulfills with this multireddit when the reuqest is complete
  * @example r.getUser('not_an_aardvark').getMultireddit('cookie_languages').addSubreddit('cookies')
  */
  addSubreddit(sub) {
    sub = typeof sub === 'string' ? sub : sub.display_name;
    return this._put({ uri: 'api/multi' + this._path + '/r/' + sub, form: { model: JSON.stringify({ name: sub }) } }).return(this);
  }
  /**
  * @summary Removes a subreddit from this multireddit.
  * @param {Subreddit} sub The Subreddit object to remove (or a string representing a subreddit name)
  * @returns {Promise} A Promise that fulfills with this multireddit when the request is complete
  * @example r.getUser('not_an_aardvark').getMultireddit('cookie_languages').removeSubreddit('cookies')
  */
  removeSubreddit(sub) {
    return this._delete({ uri: 'api/multi' + this._path + '/r/' + (typeof sub === 'string' ? sub : sub.display_name) }).return(this);
  }
  /* Note: The endpoints GET/PUT /api/multi/multipath/description and GET /api/multi/multipath/r/srname are intentionally not
  included, because they're redundant and the same thing can be achieved by simply using fetch() and edit(). */
};

// MultiReddit#delete is not in the class body since Safari 9 can't parse the `delete` function name in class bodies.
/**
* @function
* @name delete
* @summary Deletes this multireddit.
* @returns {Promise} A Promise that fulfills when this request is complete
* @example r.getUser('not_an_aardvark').getMultireddit('cookie_languages').delete()
* @memberof MultiReddit
* @instance
*/
Object.defineProperty(MultiReddit.prototype, 'delete', { value() {
    return this._delete({ uri: 'api/multi' + this._path });
  }, configurable: true, writable: true });

exports.default = MultiReddit;
},{"./RedditContent.js":13}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _helpers = require('../helpers.js');

var _ReplyableContent = require('./ReplyableContent.js');

var _ReplyableContent2 = _interopRequireDefault(_ReplyableContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* A class representing a private message or a modmail.
* <style> #PrivateMessage {display: none} </style>
* @example
*
* // Get a Private Message with a given ID
* r.getMessage('51shnw')
* @extends ReplyableContent
*/
var PrivateMessage = class PrivateMessage extends _ReplyableContent2.default {
  get _uri() {
    return 'message/messages/' + this.name.slice(3);
  }
  _transformApiResponse(response) {
    response[0].replies = (0, _helpers.buildRepliesTree)(response[0].replies || []);
    return (0, _helpers.findMessageInTree)(this.name, response[0]);
  }
  // TODO: Get rid of the repeated code here, most of these methods are exactly the same with the exception of the URIs
  /**
  * @summary Marks this message as read.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  * @example r.getMessage('51shxv').markAsRead()
  */
  markAsRead() {
    return this._r.markMessagesAsRead([this]).return(this);
  }
  /**
  * @summary Marks this message as unread.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  * @example r.getMessage('51shxv').markAsUnread()
  */
  markAsUnread() {
    return this._r.markMessagesAsUnread([this]).return(this);
  }
  /**
  * @summary Mutes the author of this message for 72 hours. This can only be used on moderator mail.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  * @example r.getMessage('51shxv').muteAuthor()
  */
  muteAuthor() {
    return this._post({ uri: 'api/mute_message_author', form: { id: this.name } }).return(this);
  }
  /**
  * @summary Unmutes the author of this message.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  * @example r.getMessage('51shxv').unmuteAuthor()
  */
  unmuteAuthor() {
    return this._post({ uri: 'api/unmute_message_author', form: { id: this.name } }).return(this);
  }
  /**
  * @summary Deletes this message from the authenticated user's inbox.
  * @desc This only removes the item from the authenticated user's inbox. It has no effect on how the item looks to the sender.
  * @returns {Promise} A Promise that fulfills with this message when the request is complete.
  * @example
  *
  * const firstMessage = r.getInbox().get(0);
  * firstMessage.deleteFromInbox();
  */
  deleteFromInbox() {
    return this._post({ uri: 'api/del_msg', form: { id: this.name } }).return(this);
  }
};

exports.default = PrivateMessage;
},{"../helpers.js":5,"./ReplyableContent.js":15}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _pick2 = require('lodash/pick');

var _pick3 = _interopRequireDefault(_pick2);

var _mapValues2 = require('lodash/mapValues');

var _mapValues3 = _interopRequireDefault(_mapValues2);

var _cloneDeep2 = require('lodash/cloneDeep');

var _cloneDeep3 = _interopRequireDefault(_cloneDeep2);

var _Promise = require('../Promise.js');

var _Promise2 = _interopRequireDefault(_Promise);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _helpers = require('../helpers.js');

var _constants = require('../constants.js');

var _Listing = require('./Listing.js');

var _Listing2 = _interopRequireDefault(_Listing);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* A base class for content from reddit. With the expection of Listings, all content types extend this class.
* This class should be considered 'abstract', to the extend that JavaScript classes can be -- it should not be necessary to
* instantiate it directly.
* <style> #RedditContent {display: none} </style>
*/
var RedditContent = class RedditContent {
  constructor(options, _r, _hasFetched) {
    // _r refers to the snoowrap requester that is used to fetch this content.
    this._r = _r;
    this._fetch = null;
    this._hasFetched = !!_hasFetched;
    Object.assign(this, options);
    if (typeof Proxy !== 'undefined' && !this._hasFetched && _r._config.proxies) {
      return new Proxy(this, { get(target, key) {
          return key in target || key === 'length' || key in _Promise2.default.prototype ? target[key] : target.fetch()[key];
        } });
    }
  }
  /**
  * @summary Fetches this content from reddit.
  * @desc This will not mutate the original content object; all Promise properties will remain as Promises after the content has
  * been fetched. However, the information on this object will be cached, so it may become out-of-date with the content on
  * reddit. To clear the cache and fetch this object from reddit again, use `refresh()`.
  *
  * If snoowrap is running in an environment that supports ES2015 Proxies (e.g. Chrome 49+), then `fetch()` will get
  * automatically called when an unknown property is accessed on an unfetched content object.
  * @returns {Promise} A version of this object with all of its fetched properties from reddit. This will not mutate the
  object. Once an object has been fetched once, its properties will be cached, so they might end up out-of-date if this
  function is called again. To refresh an object, use refresh().
  * @example
  *
  * r.getUser('not_an_aardvark').fetch().then(userInfo => {
  *   console.log(userInfo.name); // 'not_an_aardvark'
  *   console.log(userInfo.created_utc); // 1419104352
  * });
  *
  * r.getComment('d1xchqn').fetch().then(comment => comment.body).then(console.log)
  * // => 'This is a little too interesting for my liking'
  *
  * // In environments that support ES2015 Proxies, the above line is equivalent to:
  * r.getComment('d1xchqn').body.then(console.log);
  * // => 'This is a little too interesting for my liking'
  */
  fetch() {
    var _this = this;

    if (!this._fetch) {
      this._fetch = this._r._promiseWrap(this._r._get({ uri: this._uri }).then(function (res) {
        return _this._transformApiResponse(res);
      }));
    }
    return this._fetch;
  }
  /**
  * @summary Refreshes this content.
  * @returns {Promise} A newly-fetched version of this content
  * @example
  *
  * var someComment = r.getComment('cmfkyus');
  * var initialCommentBody = some_comment.fetch().then(comment => comment.body);
  *
  * setTimeout(() => {
  *   someComment.refresh().then(refreshedComment => {
  *     if (initialCommentBody.value() !== refreshedComment.body) {
  *       console.log('This comment has changed since 10 seconds ago.');
  *     }
  *   });
  * }, 10000);
  */
  refresh() {
    this._fetch = null;
    return this.fetch();
  }
  /**
  * @summary Returns a stringifyable version of this object.
  * @desc It is usually not necessary to call this method directly; simply running JSON.stringify(some_object) will strip the
  private properties anyway.
  * @returns {object} A version of this object with all the private properties stripped
  * @example
  *
  * var user = r.getUser('not_an_aardvark');
  * JSON.stringify(user) // => '{"name":"not_an_aardvark"}'
  */
  toJSON() {
    return (0, _mapValues3.default)(this._stripPrivateProps(), function (value, key) {
      if (value instanceof RedditContent && !value._hasFetched) {
        if (value.constructor._name === 'RedditUser' && _constants.USER_KEYS.has(key)) {
          return value.name;
        }
        if (value.constructor._name === 'Subreddit' && _constants.SUBREDDIT_KEYS.has(key)) {
          return value.display_name;
        }
      }
      return value && value.toJSON ? value.toJSON() : value;
    });
  }
  _stripPrivateProps() {
    return (0, _pick3.default)(this, Object.keys(this).filter(function (key) {
      return !key.startsWith('_');
    }));
  }
  _transformApiResponse(response) {
    return response;
  }
  _clone() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$deep = _ref.deep,
        deep = _ref$deep === undefined ? false : _ref$deep;

    var clonedProps = (0, _mapValues3.default)(this, function (value) {
      if (deep) {
        return value instanceof RedditContent || value instanceof _Listing2.default ? value._clone({ deep }) : (0, _cloneDeep3.default)(value);
      }
      return value;
    });
    return this._r._newObject(this.constructor._name, clonedProps, this._hasFetched);
  }
  _getListing() {
    var _r2;

    return (_r2 = this._r)._getListing.apply(_r2, arguments);
  }
};

(0, _helpers.defineInspectFunc)(RedditContent.prototype, function () {
  return this.constructor._name + ' ' + _util2.default.inspect(this._stripPrivateProps());
});

_constants.HTTP_VERBS.forEach(function (method) {
  Object.defineProperty(RedditContent.prototype, '_' + method, { value() {
      var _r3;

      return (_r3 = this._r)['_' + method].apply(_r3, arguments);
    }, configurable: true, writable: true });
});

exports.default = RedditContent;
},{"../Promise.js":1,"../constants.js":2,"../helpers.js":5,"./Listing.js":7,"lodash/cloneDeep":237,"lodash/mapValues":274,"lodash/pick":283,"util":27}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _constants = require('../constants.js');

var _errors = require('../errors.js');

var _RedditContent = require('./RedditContent.js');

var _RedditContent2 = _interopRequireDefault(_RedditContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* A class representing a reddit user
* <style> #RedditUser {display: none} </style>
* @extends ReplyableContent
* @example
*
* // Get a user with the given username
* r.getUser('spez')
*/
var RedditUser = class RedditUser extends _RedditContent2.default {
  get _uri() {
    if (typeof this.name !== 'string' || !_constants.USERNAME_REGEX.test(this.name)) {
      throw new _errors.InvalidUserError(this.name);
    }
    return 'user/' + this.name + '/about';
  }
  /**
  * @summary Gives reddit gold to a user
  * @param {number} months The number of months of gold to give. This must be a number between 1 and 36.
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example r.getUser('not_an_aardvark').giveGold(12)
  */
  giveGold(months) {
    /* Ideally this would allow for more than 36 months by sending multiple requests, but I don't have the resources to test
    that code, and it's probably better that such a big investment be deliberate anyway. */
    if (typeof months !== 'number' || months < 1 || months > 36) {
      throw new _errors.InvalidMethodCallError('Invalid argument to RedditUser#giveGold; `months` must be between 1 and 36.');
    }
    return this._post({ uri: 'api/v1/gold/give/' + this.name, form: { months } });
  }
  /**
  * Assigns flair to this user on a given subreddit (as a moderator).
  * @param {object} options
  * @param {string} options.subredditName The subreddit that flair should be assigned on
  * @param {string} [options.text=''] The text that the user's flair should have
  * @param {string} [options.cssClass=''] The CSS class that the user's flair should have
  * @returns {Promise} A Promise that fulfills with the current user after the request is complete
  * @example r.getUser('not_an_aardvark').assignFlair({subredditName: 'snoowrap', text: "Isn't an aardvark"})
  */
  assignFlair(options) {
    return this._r._assignFlair(_extends({}, options, { name: this.name })).return(this);
  }
  /**
  * @summary Adds this user as a friend, or modifies their friend note.
  * @desc **Note:** reddit.com only permits "notes" to be added on friends if the authenticated account has a subscription to
  reddit gold.
  * @param {object} options
  * @param {string} [options.note] An optional note to add on the user (300 characters max)
  * @returns {Promise} A Promise that fulfills when this request is complete
  * @example r.getUser('actually_an_aardvark').friend({note: 'Is an aardvark'})
  */
  friend() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        note = _ref.note;

    return this._put({ uri: 'api/v1/me/friends/' + this.name, body: { user: this.name, note } }).return(this);
  }
  /**
  * @summary Removes this user from the requester's friend list.
  * @returns {Promise} A Promise that fulfills with this user when the request is complete
  * @example r.getUser('actually_an_aardvark').unfriend()
  */
  unfriend() {
    return this._delete({ uri: 'api/v1/me/friends/' + this.name });
  }
  /**
  * @summary Gets information on this user related to their presence on the friend list.
  * @returns {Promise} A Promise that fulfills with an object containing friend information
  * @example
  *
  * r.getUser('not_an_aardvark').getFriendInformation().then(console.log)
  * // => { date: 1460318190, note: 'Is an aardvark', name: 'actually_an_aardvark', id: 't2_q3519' }
  */
  getFriendInformation() {
    return this._get({ uri: 'api/v1/me/friends/' + this.name });
  }
  /**
  * @summary Gets a list of this user's trophies.
  * @returns {Promise} A TrophyList containing this user's trophies
  * @example
  *
  * r.getUser('not_an_aardvark').getTrophies().then(console.log)
  * // => TrophyList { trophies: [
  * //  Trophy { ... },
  * //  Trophy { ... },
  * //  ...
  * // ] }
  */
  getTrophies() {
    return this._get({ uri: 'api/v1/user/' + this.name + '/trophies' });
  }
  /**
  * @summary Gets a Listing of the content this user has submitted.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  * @example
  *
  * r.getUser('spez').getOverview().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getOverview(options) {
    return this._getListing({ uri: 'user/' + this.name + '/overview', qs: options });
  }
  /**
  * @summary Gets a Listing of this user's submissions.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions
  * @example
  *
  * r.getUser('spez').getSubmissions().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getSubmissions(options) {
    return this._getListing({ uri: 'user/' + this.name + '/submitted', qs: options });
  }
  /**
  * @summary Gets a Listing of this user's comments.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Comments
  * @example
  *
  * r.getUser('spez').getComments().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Comment { ... },
  * //  ...
  * // ]
  */
  getComments(options) {
    return this._getListing({ uri: 'user/' + this.name + '/comments', qs: options });
  }
  /**
  * @summary Gets a Listing of the content that this user has upvoted.
  * @desc **Note**: This can only be used to view one's own upvoted content, unless the user in question has chosen to
  make this information public in their preferences.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  * @example
  *
  * r.getMe().getUpvotedContent().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getUpvotedContent(options) {
    return this._getListing({ uri: 'user/' + this.name + '/upvoted', qs: options });
  }
  /**
  * @summary Gets a Listing of the content that this user has downvoted.
  * @desc **Note**: This can only be used to view one's own downvoted content, unless the user in question has chosen to
  make this information public in their preferences.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  * @example
  *
  * r.getMe().getDownvotedContent().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getDownvotedContent(options) {
    return this._getListing({ uri: 'user/' + this.name + '/downvoted', qs: options });
  }
  /**
  * @summary Gets a Listing of the submissions that this user has hidden.
  * @desc **Note**: This can only be used to view one's own set of hidden posts, as reddit will return a 403 error when
  attempting to view another users' hidden posts.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions
  * @example
  *
  * r.getMe().getHiddenContent().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getHiddenContent(options) {
    return this._getListing({ uri: 'user/' + this.name + '/hidden', qs: options });
  }
  /**
  * @summary Gets a Listing of the content that this user has saved.
  * @desc **Note**: This can only be used to view one's own set of saved content, as reddit will return a 403 error when
  attempting to view other users' saved content.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments.
  * @example
  *
  * r.getMe().getSavedContent().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getSavedContent(options) {
    return this._getListing({ uri: 'user/' + this.name + '/saved', qs: options });
  }
  /**
  * @summary Gets a Listing of this user's content which has been gilded.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  * @example
  *
  * r.getMe().getGildedContent().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getGildedContent(options) {
    return this._getListing({ uri: 'user/' + this.name + '/gilded', qs: options });
  }
  /**
  * @summary Gets a multireddit belonging to this user.
  * @param {string} name The name of the multireddit
  * @returns {MultiReddit} An unfetched MultiReddit object
  * @example
  *
  * r.getUser('multi-mod').getMultireddit('coding_languages')
  * // => MultiReddit {
  * //  name: 'coding_languages',
  * //  curator: RedditUser { name: 'multi-mod' },
  * //  path: '/user/multi-mod/m/coding_languages'
  * // }
  */
  getMultireddit(name) {
    return this._r._newObject('MultiReddit', { name, curator: this });
  }
  /**
  * @summary Gets an Array of all of this user's MultiReddits.
  * @returns {Promise} A Promise that fulfills with an Array containing MultiReddits.
  * @example
  *
  * r.getUser('multi-mod').getMultireddits().then(console.log)
  *
  * // => [
  *   MultiReddit { ... },
  *   MultiReddit { ... },
  *   MultiReddit { ... },
  *   ...
  * ]
  */
  getMultireddits() {
    return this._get({ uri: 'api/multi/user/' + this.name, qs: { expand_srs: true } });
  }
};

exports.default = RedditUser;
},{"../constants.js":2,"../errors.js":4,"./RedditContent.js":13}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _helpers = require('../helpers.js');

var _RedditContent = require('./RedditContent.js');

var _RedditContent2 = _interopRequireDefault(_RedditContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var api_type = 'json';

/**
* A set of mixin functions that apply to Submissions, Comments, and PrivateMessages
* <style> #ReplyableContent {display: none} </style>
* @extends RedditContent
*/
var ReplyableContent = class ReplyableContent extends _RedditContent2.default {
  /**
  * @summary Removes this Comment, Submission or PrivateMessage from public listings.
  * @desc This requires the authenticated user to be a moderator of the subreddit with the `posts` permission.
  * @param {object} options
  * @param {boolean} [options.spam=false] Determines whether this should be marked as spam
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  * @example r.getComment('c08pp5z').remove({spam: true})
  */
  remove() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$spam = _ref.spam,
        spam = _ref$spam === undefined ? false : _ref$spam;

    return this._post({ uri: 'api/remove', form: { spam, id: this.name } }).return(this);
  }
  /**
  * @summary Approves this Comment, Submission, or PrivateMessage, re-adding it to public listings if it had been removed
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  * @example r.getComment('c08pp5z').approve()
  */
  approve() {
    return this._post({ uri: 'api/approve', form: { id: this.name } }).return(this);
  }
  /**
  * @summary Reports this content anonymously to subreddit moderators (for Comments and Submissions)
  or to the reddit admins (for PrivateMessages)
  * @param {object} [options]
  * @param {string} [options.reason] The reason for the report
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  * @example r.getComment('c08pp5z').report({reason: 'Breaking the subreddit rules'})
  */
  report() {
    var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        reason = _ref2.reason;

    return this._post({ uri: 'api/report', form: {
        api_type, reason: 'other', other_reason: reason, thing_id: this.name
      } }).return(this);
  }
  /**
  * @summary Ignores reports on this Comment, Submission, or PrivateMessage
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  * @example r.getComment('c08pp5z').ignoreReports()
  */
  ignoreReports() {
    return this._post({ uri: 'api/ignore_reports', form: { id: this.name } }).return(this);
  }
  /**
  * @summary Unignores reports on this Comment, Submission, or PrivateMessages
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  * @example r.getComment('c08pp5z').unignoreReports()
  */
  unignoreReports() {
    return this._post({ uri: 'api/unignore_reports', form: { id: this.name } }).return(this);
  }
  /**
  * @summary Submits a new reply to this object. (This takes the form of a new Comment if this object is a Submission/Comment,
  or a new PrivateMessage if this object is a PrivateMessage.)
  * @param {string} text The content of the reply, in raw markdown text
  * @returns {Promise} A Promise that fulfills with the newly-created reply
  * @example r.getSubmission('4e60m3').reply('This was an interesting post. Thanks.');
  */
  reply(text) {
    return this._post({
      uri: 'api/comment',
      form: { api_type, text, thing_id: this.name }
    }).tap((0, _helpers.handleJsonErrors)(this)).then(function (res) {
      return res.json.data.things[0];
    });
  }
  /**
  * @summary Blocks the author of this content.
  * @desc **Note:** In order for this function to have an effect, this item **must** be in the authenticated account's inbox or
  modmail somewhere. The reddit API gives no outward indication of whether this condition is satisfied, so the returned Promise
  will fulfill even if this is not the case.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  * @example
  *
  * r.getInbox({limit: 1}).then(messages =>
  *   messages[0].blockAuthor();
  * );
  */
  blockAuthor() {
    return this._post({ uri: 'api/block', form: { id: this.name } }).return(this);
  }
};

exports.default = ReplyableContent;
},{"../helpers.js":5,"./RedditContent.js":13}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _helpers = require('../helpers.js');

var _VoteableContent = require('./VoteableContent.js');

var _VoteableContent2 = _interopRequireDefault(_VoteableContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var api_type = 'json';

/**
* A class representing a reddit submission
* <style> #Submission {display: none} </style>
* @extends VoteableContent
* @example
*
* // Get a submission by ID
* r.getSubmission('2np694')
*/
var Submission = class Submission extends _VoteableContent2.default {
  constructor(data, _r, _hasFetched) {
    super(data, _r, _hasFetched);
    if (_hasFetched) {
      this.comments = this.comments || (0, _helpers.getEmptyRepliesListing)(this);
    }
  }
  get _uri() {
    return 'comments/' + this.name.slice(3);
  }
  /**
  * @summary Hides this Submission, preventing it from appearing on most Listings.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').hide()
  */
  hide() {
    return this._post({ uri: 'api/hide', form: { id: this.name } }).return(this);
  }
  /**
  * @summary Unhides this Submission, allowing it to reappear on most Listings.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').unhide()
  */
  unhide() {
    return this._post({ uri: 'api/unhide', form: { id: this.name } }).return(this);
  }
  /**
  * @summary Locks this Submission, preventing new comments from being posted on it.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').lock()
  */
  lock() {
    return this._post({ uri: 'api/lock', form: { id: this.name } }).return(this);
  }
  /**
  * @summary Unlocks this Submission, allowing comments to be posted on it again.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').unlock()
  */
  unlock() {
    return this._post({ uri: 'api/unlock', form: { id: this.name } }).return(this);
  }
  /**
  * @summary Marks this Submission as NSFW (Not Safe For Work).
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').markNsfw()
  */
  markNsfw() {
    return this._post({ uri: 'api/marknsfw', form: { id: this.name } }).return(this);
  }
  /**
  * @summary Unmarks this Submission as NSFW (Not Safe For Work).
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').unmarkNsfw()
  */
  unmarkNsfw() {
    return this._post({ uri: 'api/unmarknsfw', form: { id: this.name } }).return(this);
  }
  /**
  * @summary Mark a submission as a spoiler
  * @desc **Note:** This will silently fail if the subreddit has disabled spoilers.
  * @returns {Promise} A Promise that fulfills with this Submission when the request is complete
  * @example r.getSubmission('2np694').markSpoiler()
  */
  markSpoiler() {
    return this._post({ uri: 'api/spoiler', form: { id: this.name } }).return(this);
  }

  /**
  * @summary Unmark a submission as a spoiler
  * @returns {Promise} A Promise that fulfills with this Submission when the request is complete
  * @example r.getSubmission('2np694').unmarkSpoiler()
  */
  unmarkSpoiler() {
    return this._post({ uri: 'api/unspoiler', form: { id: this.name } }).return(this);
  }

  /**
  * @summary Sets the contest mode status of this submission.
  * @private
  * @param {boolean} state The desired contest mode status
  * @returns {Promise} The updated version of this Submission
  */
  _setContestModeEnabled(state) {
    return this._post({ uri: 'api/set_contest_mode', form: { api_type, state, id: this.name } }).return(this);
  }
  /**
  * @summary Enables contest mode for this Submission.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').enableContestMode()
  */
  enableContestMode() {
    return this._setContestModeEnabled(true);
  }
  /**
  * @summary Disables contest mode for this Submission.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').disableContestMode()
  */
  disableContestMode() {
    return this._setContestModeEnabled(false);
  }
  _setStickied(_ref) {
    var state = _ref.state,
        num = _ref.num;

    return this._post({ uri: 'api/set_subreddit_sticky', form: { api_type, state, num, id: this.name } }).return(this);
  }
  /**
  * @summary Stickies this Submission.
  * @param {object} [options]
  * @param {number} [options.num=1] The sticky slot to put this submission in; this should be either 1 or 2.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').sticky({num: 2})
  */
  sticky() {
    var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref2$num = _ref2.num,
        num = _ref2$num === undefined ? 1 : _ref2$num;

    return this._setStickied({ state: true, num });
  }
  /**
  * @summary Unstickies this Submission.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').unsticky()
  */
  unsticky() {
    return this._setStickied({ state: false });
  }
  /**
  * @summary Sets the suggested comment sort method on this Submission
  * @desc **Note**: To enable contest mode, use {@link Submission#enableContestMode} instead.
  * @param {string} sort The suggested sort method. This should be one of
  `confidence, top, new, controversial, old, random, qa, blank`
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').setSuggestedSort('new')
  */
  setSuggestedSort(sort) {
    return this._post({ uri: 'api/set_suggested_sort', form: { api_type, id: this.name, sort } }).return(this);
  }
  /**
  * @summary Marks this submission as 'visited'.
  * @desc **Note**: This function only works if the authenticated account has a subscription to reddit gold.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').markAsRead()
  */
  markAsRead() {
    return this._post({ uri: 'api/store_visits', form: { links: this.name } }).return(this);
  }
  /**
  * @summary Gets a Listing of other submissions on reddit that had the same link as this one.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing of other Submission objects
  * @example r.getSubmission('2np694').getDuplicates()
  */
  getDuplicates() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this._getListing({ uri: 'duplicates/' + this.name.slice(3), qs: options });
  }
  /**
  * @summary Gets a Listing of Submissions that are related to this one.
  * @deprecated This function uses the <code>/related/submission_id</code> endpoint, which was recently changed on reddit.com;
  instead of returning a Listing containing related posts, the reddit API now simply returns the post itself. As such, this
  function only exists for backwards compatability and should not be used in practice.
  * @param {object} [options={}] ~~Options for the resulting Listing~~
  * @returns {Promise} ~~A Listing of other Submission objects~~ The submission in question.
  * @example r.getSubmission('2np694').getRelated()
  */
  getRelated() {
    var _this = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this._getListing({ uri: 'related/' + this.name.slice(3), qs: options }).tap(function (result) {
      if (result.constructor._name === 'Submission') {
        _this._r._warn('Submission#getRelated has been deprecated upstream, and will not work as expected.');
      }
    });
  }
  /**
  * @summary Gets a list of flair template options for this post.
  * @returns {Promise} An Array of flair templates
  * @example
  *
  * r.getSubmission('2np694').getLinkFlairTemplates().then(console.log)
  *
  * // => [
  * //   { flair_text: 'Text 1', flair_css_class: '', flair_text_editable: false, flair_template_id: '(UUID not shown)' ... },
  * //   { flair_text: 'Text 2', flair_css_class: 'aa', flair_text_editable: false, flair_template_id: '(UUID not shown)' ... },
  * //   ...
  * // ]
  */
  getLinkFlairTemplates() {
    var _this2 = this;

    return this.fetch().get('subreddit').then(function (sub) {
      return sub.getLinkFlairTemplates(_this2.name);
    });
  }
  /**
  * @summary Assigns flair on this Submission (as a moderator; also see [selectFlair]{@link Submission#selectFlair})
  * @param {object} options
  * @param {string} options.text The text that this link's flair should have
  * @param {string} options.cssClass The CSS class that the link's flair should have
  * @returns {Promise} A Promise that fulfills with an updated version of this Submission
  * @example r.getSubmission('2np694').assignFlair({text: 'this is a flair text', cssClass: 'these are css classes'})
  */
  assignFlair(options) {
    return this._r._assignFlair(_extends({}, options, { link: this.name, subredditName: this.subreddit.display_name })).return(this);
  }

  /**
  * @summary Selects a flair for this Submission (as the OP; also see [assignFlair]{@link Submission#assignFlair})
  * @param {object} options
  * @param {string} options.flair_template_id A flair template ID to use for this Submission. (This should be obtained
  beforehand using {@link getLinkFlairTemplates}.)
  * @param {string} [options.text] The flair text to use for the submission. (This is only necessary/useful if the given flair
  template has the `text_editable` property set to `true`.)
  * @returns {Promise} A Promise that fulfills with this objects after the request is complete
  * @example r.getSubmission('2np694').selectFlair({flair_template_id: 'e3340d80-8152-11e4-a76a-22000bc1096c'})
  */
  selectFlair(options) {
    return this._r._selectFlair(_extends({}, options, { link: this.name, subredditName: this.subreddit.display_name })).return(this);
  }

  /**
   * @summary Crossposts this submission to a different subreddit
   * @desc **NOTE**: To create a crosspost, the authenticated account must be subscribed to the subreddit where
   * the crosspost is being submitted, and that subreddit be configured to allow crossposts.
   * @param {object} options An object containing details about the submission
   * @param {string} options.subredditName The name of the subreddit that the crosspost should be submitted to
   * @param {string} options.title The title of the crosspost
   * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission
   * @param {boolean} [options.resubmit=true] If this is false and same link has already been submitted to this subreddit in
   the past, reddit will return an error. This could be used to avoid accidental reposts.
   * @returns {Promise} The newly-created Submission object
   * @example
   *
   * await r.getSubmission('6vths0').submitCrosspost({ title: 'I found an interesting post', subredditName: 'snoowrap' })
   */
  submitCrosspost(options) {
    return this._r.submitCrosspost(_extends({}, options, { originalPost: this }));
  }
};

exports.default = Submission;
},{"../helpers.js":5,"./VoteableContent.js":19}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _omit2 = require('lodash/omit');

var _omit3 = _interopRequireDefault(_omit2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _flatten2 = require('lodash/flatten');

var _flatten3 = _interopRequireDefault(_flatten2);

var _chunk2 = require('lodash/chunk');

var _chunk3 = _interopRequireDefault(_chunk2);

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _Promise = require('../Promise.js');

var _Promise2 = _interopRequireDefault(_Promise);

var _stream = require('stream');

var _fs = require('fs');

var _helpers = require('../helpers.js');

var _errors = require('../errors.js');

var _RedditContent = require('./RedditContent.js');

var _RedditContent2 = _interopRequireDefault(_RedditContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var api_type = 'json';

/**
* A class representing a subreddit
* <style> #Subreddit {display: none} </style>
* @extends RedditContent
* @example
*
* // Get a subreddit by name
* r.getSubreddit('AskReddit')
*/
var Subreddit = class Subreddit extends _RedditContent2.default {
  get _uri() {
    return 'r/' + this.display_name + '/about';
  }
  _transformApiResponse(response) {
    if (!(response instanceof Subreddit)) {
      throw new TypeError('The subreddit /r/' + this.display_name + ' does not exist.');
    }
    return response;
  }
  _deleteFlairTemplates(_ref) {
    var flair_type = _ref.flair_type;

    return this._post({ uri: 'r/' + this.display_name + '/api/clearflairtemplates', form: { api_type, flair_type } }).return(this);
  }
  /**
  * @summary Deletes all of this subreddit's user flair templates
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteAllUserFlairTemplates()
  */
  deleteAllUserFlairTemplates() {
    return this._deleteFlairTemplates({ flair_type: 'USER_FLAIR' });
  }
  /**
  * @summary Deletes all of this subreddit's link flair templates
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteAllLinkFlairTemplates()
  */
  deleteAllLinkFlairTemplates() {
    return this._deleteFlairTemplates({ flair_type: 'LINK_FLAIR' });
  }
  /**
  * @summary Deletes one of this subreddit's flair templates
  * @param {object} options
  * @param {string} options.flair_template_id The ID of the template that should be deleted
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteFlairTemplate({flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721'})
  */
  deleteFlairTemplate(_ref2) {
    var flair_template_id = _ref2.flair_template_id;

    return this._post({
      uri: 'r/' + this.display_name + '/api/deleteflairtemplate',
      form: { api_type, flair_template_id }
    }).return(this);
  }
  _createFlairTemplate(_ref3) {
    var text = _ref3.text,
        css_class = _ref3.css_class,
        _ref3$cssClass = _ref3.cssClass,
        cssClass = _ref3$cssClass === undefined ? css_class : _ref3$cssClass,
        flair_type = _ref3.flair_type,
        _ref3$text_editable = _ref3.text_editable,
        text_editable = _ref3$text_editable === undefined ? false : _ref3$text_editable,
        _ref3$textEditable = _ref3.textEditable,
        textEditable = _ref3$textEditable === undefined ? text_editable : _ref3$textEditable;

    return this._post({
      uri: 'r/' + this.display_name + '/api/flairtemplate',
      form: { api_type, text, css_class: cssClass, flair_type, text_editable: textEditable }
    }).return(this);
  }
  /**
  * @summary Creates a new user flair template for this subreddit
  * @param {object} options
  * @param {string} options.text The flair text for this template
  * @param {string} [options.cssClass=''] The CSS class for this template
  * @param {boolean} [options.textEditable=false] Determines whether users should be able to edit their flair text
  when it has this template
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').createUserFlairTemplate({text: 'Some Flair Text', cssClass: 'some-css-class'})
  */
  createUserFlairTemplate(options) {
    return this._createFlairTemplate(_extends({}, options, { flair_type: 'USER_FLAIR' }));
  }
  /**
  * @summary Creates a new link flair template for this subreddit
  * @param {object} options
  * @param {string} options.text The flair text for this template
  * @param {string} [options.cssClass=''] The CSS class for this template
  * @param {boolean} [options.textEditable=false] Determines whether users should be able to edit the flair text of their
  links when it has this template
  * @returns {Promise} A Promise that fulfills with this Subredit when the request is complete.
  * @example r.getSubreddit('snoowrap').createLinkFlairTemplate({text: 'Some Flair Text', cssClass: 'some-css-class'})
  */
  createLinkFlairTemplate(options) {
    return this._createFlairTemplate(_extends({}, options, { flair_type: 'LINK_FLAIR' }));
  }
  _getFlairOptions() {
    var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        name = _ref4.name,
        link = _ref4.link;

    // TODO: Add shortcuts for this on RedditUser and Submission
    return this._post({ uri: 'r/' + this.display_name + '/api/flairselector', form: { name, link } });
  }
  /**
  * @summary Gets the flair templates for a given link.
  * @param {string} linkId The link's base36 ID
  * @returns {Promise} An Array of flair template options
  * @example
  *
  * r.getSubreddit('snoowrap').getLinkFlairTemplates('4fp36y').then(console.log)
  // => [ { flair_css_class: '',
  //  flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721',
  //  flair_text_editable: true,
  //  flair_position: 'right',
  //  flair_text: '' },
  //  { flair_css_class: '',
  //  flair_template_id: '03821f62-c920-11e5-b608-0e309fbcf863',
  //  flair_text_editable: true,
  //  flair_position: 'right',
  //  flair_text: '' },
  //  ...
  // ]
  */
  getLinkFlairTemplates(linkId) {
    return this._getFlairOptions({ link: linkId }).get('choices');
  }
  /**
  * @summary Gets the list of user flair templates on this subreddit.
  * @returns {Promise} An Array of user flair templates
  * @example
  *
  * r.getSubreddit('snoowrap').getUserFlairTemplates().then(console.log)
  // => [ { flair_css_class: '',
  //  flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721',
  //  flair_text_editable: true,
  //  flair_position: 'right',
  //  flair_text: '' },
  //  { flair_css_class: '',
  //  flair_template_id: '03821f62-c920-11e5-b608-0e309fbcf863',
  //  flair_text_editable: true,
  //  flair_position: 'right',
  //  flair_text: '' },
  //  ...
  // ]
  */
  getUserFlairTemplates() {
    return this._getFlairOptions().get('choices');
  }
  /**
  * @summary Clears a user's flair on this subreddit.
  * @param {string} name The user's name
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteUserFlair('actually_an_aardvark')
  */
  deleteUserFlair(name) {
    return this._post({ uri: 'r/' + this.display_name + '/api/deleteflair', form: { api_type, name } }).return(this);
  }
  /**
  * @summary Gets a user's flair on this subreddit.
  * @param {string} name The user's name
  * @returns {Promise} An object representing the user's flair
  * @example
  *
  * r.getSubreddit('snoowrap').getUserFlair('actually_an_aardvark').then(console.log)
  // => { flair_css_class: '',
  //  flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721',
  //  flair_text: '',
  //  flair_position: 'right'
  // }
  */
  getUserFlair(name) {
    return this._getFlairOptions({ name }).get('current');
  }
  /**
  * @summary Sets multiple user flairs at the same time
  * @desc Due to the behavior of the reddit API endpoint that this function uses, if any of the provided user flairs are
  invalid, reddit will make note of this in its response, but it will still attempt to set the remaining user flairs. If this
  occurs, the Promise returned by snoowrap will be rejected, and the rejection reason will be an array containing the 'error'
  responses from reddit.
  * @param {object[]} flairArray
  * @param {string} flairArray[].name A user's name
  * @param {string} flairArray[].text The flair text to assign to this user
  * @param {string} flairArray[].cssClass The flair CSS class to assign to this user
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example
  * r.getSubreddit('snoowrap').setMultipleUserFlairs([
  *   {name: 'actually_an_aardvark', text: "this is /u/actually_an_aardvark's flair text", cssClass: 'some-css-class'},
  *   {name: 'snoowrap_testing', text: "this is /u/snoowrap_testing's flair text", cssClass: 'some-css-class'}
  * ]);
  * // the above request gets completed successfully
  *
  * r.getSubreddit('snoowrap').setMultipleUserFlairs([
  *   {name: 'actually_an_aardvark', text: 'foo', cssClass: 'valid-css-class'},
  *   {name: 'snoowrap_testing', text: 'bar', cssClass: "this isn't a valid css class"},
  *   {name: 'not_an_aardvark', text: 'baz', cssClass: "this also isn't a valid css class"}
  * ])
  * // the Promise from the above request gets rejected, with the following rejection reason:
  * [
  *   {
  *     status: 'skipped',
  *     errors: { css: 'invalid css class `this isn\'t a valid css class\', ignoring' },
  *     ok: false,
  *     warnings: {}
  *   },
  *   {
  *     status: 'skipped',
  *     errors: { css: 'invalid css class `this also isn\'t a valid css class\', ignoring' },
  *     ok: false,
  *     warnings: {}
  *   }
  * ]
  * // note that /u/actually_an_aardvark's flair still got set by the request, even though the other two flairs caused errors.
  */
  setMultipleUserFlairs(flairArray) {
    var _this = this;

    var csvLines = flairArray.map(function (item) {
      // reddit expects to receive valid CSV data, which each line having the form `username,flair_text,css_class`.
      return [item.name, item.text || item.flairText || item.flair_text || '', item.cssClass || item.css_class || item.flairCssClass || item.flair_css_class || ''].map(function (str) {
        /* To escape special characters in the lines (e.g. if the flair text itself contains a comma), surround each
        part of the line with double quotes before joining the parts together with commas (in accordance with how special
        characters are usually escaped in CSV). If double quotes are themselves part of the flair text, replace them with a
        pair of consecutive double quotes. */
        return '"' + str.replace(/"/g, '""') + '"';
      }).join(',');
    });
    /* Due to an API limitation, this endpoint can only set the flair of 100 users at a time.
    Send multiple requests if necessary to ensure that all users in the array are accounted for. */
    return _Promise2.default.map((0, _chunk3.default)(csvLines, 100), function (flairChunk) {
      return _this._post({ uri: 'r/' + _this.display_name + '/api/flaircsv', form: { flair_csv: flairChunk.join('\n') } });
    }).then(_flatten3.default).tap(function (results) {
      var errorRows = results.filter(function (row) {
        return !row.ok;
      });
      if (errorRows.length) {
        throw errorRows;
      }
    }).return(this);
  }
  /**
  * @summary Gets a list of all user flairs on this subreddit.
  * @param {object} options
  * @param {string} [options.name] A specific username to jump to
  * @returns {Promise} A Listing containing user flairs
  * @example
  *
  * r.getSubreddit('snoowrap').getUserFlairList().then(console.log)
  // => Listing [
  //  { flair_css_class: null,
  //  user: 'not_an_aardvark',
  //  flair_text: 'Isn\'t an aardvark' },
  //  { flair_css_class: 'some-css-class',
  //    user: 'actually_an_aardvark',
  //    flair_text: 'this is /u/actually_an_aardvark\'s flair text' },
  //  { flair_css_class: 'some-css-class',
  //    user: 'snoowrap_testing',
  //    flair_text: 'this is /u/snoowrap_testing\'s flair text' }
  // ]
  */
  getUserFlairList() {
    var _this2 = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this._getListing({ uri: 'r/' + this.display_name + '/api/flairlist', qs: options, _transform: function (response) {
        /* For unknown reasons, responses from the api/flairlist endpoint are formatted differently than responses from all other
        Listing endpoints. Most Listing endpoints return an object with a `children` property containing the Listing's children,
        and `after` and `before` properties corresponding to the `after` and `before` querystring parameters that a client should
        use in the next request. However, the api/flairlist endpoint returns an objecti with a `users` property containing the
        Listing's children, and `next` and `prev` properties corresponding to the `after` and `before` querystring parameters. As
        far as I can tell, there's no actual reason for this difference. >_> */
        response.after = response.next || null;
        response.before = response.prev || null;
        response.children = response.users;
        return _this2._r._newObject('Listing', response);
      } });
  }
  /**
  * @summary Configures the flair settings for this subreddit.
  * @param {object} options
  * @param {boolean} options.userFlairEnabled Determines whether user flair should be enabled
  * @param {string} options.userFlairPosition Determines the orientation of user flair relative to a given username. This
  should be either the string 'left' or the string 'right'.
  * @param {boolean} options.userFlairSelfAssignEnabled Determines whether users should be able to edit their own flair
  * @param {string} options.linkFlairPosition Determines the orientation of link flair relative to a link title. This should
  be either 'left' or 'right'.
  * @param {boolean} options.linkFlairSelfAssignEnabled Determines whether users should be able to edit the flair of their
  submissions.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').configure_flair({
    userFlairEnabled: true,
    userFlairPosition: 'left',
    userFlairSelfAssignEnabled: false,
    linkFlairPosition: 'right',
    linkFlairSelfAssignEnabled: false
  * })
  */
  configureFlair(_ref5) {
    var user_flair_enabled = _ref5.user_flair_enabled,
        _ref5$userFlairEnable = _ref5.userFlairEnabled,
        userFlairEnabled = _ref5$userFlairEnable === undefined ? user_flair_enabled : _ref5$userFlairEnable,
        user_flair_position = _ref5.user_flair_position,
        _ref5$userFlairPositi = _ref5.userFlairPosition,
        userFlairPosition = _ref5$userFlairPositi === undefined ? user_flair_position : _ref5$userFlairPositi,
        user_flair_self_assign_enabled = _ref5.user_flair_self_assign_enabled,
        _ref5$userFlairSelfAs = _ref5.userFlairSelfAssignEnabled,
        userFlairSelfAssignEnabled = _ref5$userFlairSelfAs === undefined ? user_flair_self_assign_enabled : _ref5$userFlairSelfAs,
        link_flair_position = _ref5.link_flair_position,
        _ref5$linkFlairPositi = _ref5.linkFlairPosition,
        linkFlairPosition = _ref5$linkFlairPositi === undefined ? link_flair_position : _ref5$linkFlairPositi,
        link_flair_self_assign_enabled = _ref5.link_flair_self_assign_enabled,
        _ref5$linkFlairSelfAs = _ref5.linkFlairSelfAssignEnabled,
        linkFlairSelfAssignEnabled = _ref5$linkFlairSelfAs === undefined ? link_flair_self_assign_enabled : _ref5$linkFlairSelfAs;

    return this._post({ uri: 'r/' + this.display_name + '/api/flairconfig', form: {
        api_type,
        flair_enabled: userFlairEnabled,
        flair_position: userFlairPosition,
        flair_self_assign_enabled: userFlairSelfAssignEnabled,
        link_flair_position: linkFlairPosition,
        link_flair_self_assign_enabled: linkFlairSelfAssignEnabled
      } }).return(this);
  }
  /**
  * @summary Gets the requester's flair on this subreddit.
  * @returns {Promise} An object representing the requester's current flair
  * @example
  *
  * r.getSubreddit('snoowrap').getMyFlair().then(console.log)
  // => { flair_css_class: 'some-css-class',
  //  flair_template_id: null,
  //  flair_text: 'this is /u/snoowrap_testing\'s flair text',
  //  flair_position: 'right'
  // }
  */
  getMyFlair() {
    return this._getFlairOptions().get('current');
  }
  /**
  * @summary Sets the requester's flair on this subreddit.
  * @param {object} options
  * @param {string} options.flair_template_id A flair template ID to use. (This should be obtained beforehand using
  {@link getUserFlairTemplates}.)
  * @param {string} [options.text] The flair text to use. (This is only necessary/useful if the given flair
  template has the `text_editable` property set to `true`.)
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').selectMyFlair({flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721'})
  */
  selectMyFlair(options) {
    var _this3 = this;

    /* NOTE: This requires `identity` scope in addition to `flair` scope, since the reddit api needs to be passed a username.
    I'm not sure if there's a way to do this without requiring additional scope. */
    return this._r._getMyName().then(function (name) {
      return _this3._r._selectFlair(_extends({}, options, { subredditName: _this3.display_name, name }));
    }).return(this);
  }
  _setMyFlairVisibility(flair_enabled) {
    return this._post({ uri: 'r/' + this.display_name + '/api/setflairenabled', form: { api_type, flair_enabled } }).return(this);
  }
  /**
  * @summary Makes the requester's flair visible on this subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').showMyFlair()
  */
  showMyFlair() {
    return this._setMyFlairVisibility(true);
  }
  /**
  * @summary Makes the requester's flair invisible on this subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').hideMyFlair()
  */
  hideMyFlair() {
    return this._setMyFlairVisibility(false);
  }
  /**
  * @summary Creates a new selfpost on this subreddit.
  * @param {object} options An object containing details about the submission
  * @param {string} options.title The title of the submission
  * @param {string} [options.text] The selftext of the submission
  * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission
  * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [options.captchaResponse] The response to the captcha with the given identifier
  * @returns {Promise} The newly-created Submission object
  * @example
  *
  * r.getSubreddit('snoowrap').submitSelfpost({title: 'this is a selfpost', text: "hi, how's it going?"}).then(console.log)
  * // => Submission { name: 't3_4abmsz' }
  */
  submitSelfpost(options) {
    return this._r.submitSelfpost(_extends({}, options, { subredditName: this.display_name }));
  }
  /**
  * @summary Creates a new link submission on this subreddit.
  * @param {object} options An object containing details about the submission
  * @param {string} options.title The title of the submission
  * @param {string} options.url The url that the link submission should point to
  * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission
  * @param {boolean} [options.resubmit=true] If this is false and same link has already been submitted to this subreddit in
  the past, reddit will return an error. This could be used to avoid accidental reposts.
  * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [options.captchaResponse] The response to the captcha with the given identifier
  * @returns {Promise} The newly-created Submission object
  * @example
  *
  * r.getSubreddit('snoowrap').submitLink({title: 'I found a cool website', url: 'https://google.com'}).then(console.log)
  * // => Submission { name: 't3_4abmsz' }
  */
  submitLink(options) {
    return this._r.submitLink(_extends({}, options, { subredditName: this.display_name }));
  }

  /**
   * @summary Creates a new crosspost submission on this subreddit
   * @desc **NOTE**: To create a crosspost, the authenticated account must be subscribed to the subreddit where
   * the crosspost is being submitted, and that subreddit be configured to allow crossposts.
   * @param {object} options An object containing details about the submission
   * @param {string} options.title The title of the crosspost
   * @param {string|Submission} options.originalPost A Submission object or a post ID for the original post which
   is being crossposted
   * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission
   * @param {boolean} [options.resubmit=true] If this is false and same link has already been submitted to this subreddit in
   the past, reddit will return an error. This could be used to avoid accidental reposts.
   * @returns {Promise} The newly-created Submission object
   * @example
   *
   * await r.getSubreddit('snoowrap').submitCrosspost({ title: 'I found an interesting post', originalPost: '6vths0' })
   * // => Submission { name: 't3_4abmsz' }
   */
  submitCrosspost(options) {
    return this._r.submitCrosspost(_extends({}, options, { subredditName: this.display_name }));
  }

  /**
  * @summary Gets a Listing of hot posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.getSubreddit('snoowrap').getHot().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getHot(options) {
    return this._r.getHot(this.display_name, options);
  }
  /**
  * @summary Gets a Listing of new posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.getSubreddit('snoowrap').getNew().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  *
  */
  getNew(options) {
    return this._r.getNew(this.display_name, options);
  }
  /**
  * @summary Gets a Listing of new comments on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved comments
  * @example
  *
  * r.getSubreddit('snoowrap').getNewComments().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  ...
  * // ]
  */
  getNewComments(options) {
    return this._r.getNewComments(this.display_name, options);
  }
  /**
  * @summary Gets a single random Submission from this subreddit.
  * @desc **Note**: This function will not work when snoowrap is running in a browser, because the reddit server sends a
  redirect which cannot be followed by a CORS request.
  * @returns {Promise} The retrieved Submission object
  * @example
  *
  * r.getSubreddit('snoowrap').getRandomSubmission.then(console.log)
  * // => Submission { ... }
  */
  getRandomSubmission() {
    return this._r.getRandomSubmission(this.display_name);
  }
  /**
  * @summary Gets a Listing of top posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  `hour, day, week, month, year, all`
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.getSubreddit('snoowrap').getTop({time: 'all'}).then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  ...
  * // ]
  */
  getTop(options) {
    return this._r.getTop(this.display_name, options);
  }
  /**
  * @summary Gets a Listing of controversial posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  `hour, day, week, month, year, all`
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.getSubreddit('snoowrap').getControversial({time: 'week'}).then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  ...
  * // ]
  */
  getControversial(options) {
    return this._r.getControversial(this.display_name, options);
  }
  /**
  * @summary Gets a Listing of top posts on this subreddit.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.getSubreddit('snoowrap').getRising().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getRising(options) {
    return this._r.getRising(this.display_name, options);
  }
  /**
  * @summary Gets the moderator mail for this subreddit.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing PrivateMessage objects
  * @example r.getSubreddit('snoowrap').getModmail().then(console.log)
  */
  getModmail(options) {
    return this._getListing({ uri: 'r/' + this.display_name + '/about/message/moderator', qs: options });
  }
  /**
  * @summary Gets the moderation log for this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string[]} [options.mods] An array of moderator names that the results should be restricted to
  * @param {string} [options.type] Restricts the results to the specified type. This should be one of `banuser, unbanuser,
  removelink, approvelink, removecomment, approvecomment, addmoderator, invitemoderator, uninvitemoderator,
  acceptmoderatorinvite, removemoderator, addcontributor, removecontributor, editsettings, editflair, distinguish, marknsfw,
  wikibanned, wikicontributor, wikiunbanned, wikipagelisted, removewikicontributor, wikirevise, wikipermlevel,
  ignorereports, unignorereports, setpermissions, setsuggestedsort, sticky, unsticky, setcontestmode, unsetcontestmode,
  lock, unlock, muteuser, unmuteuser, createrule, editrule, deleterule, spoiler, unspoiler`
  * @returns {Promise} A Listing containing moderation actions
  * @example
  *
  * r.getSubreddit('snoowrap').getModerationLog().then(console.log)
  *
  * // => Listing [
  * //  ModAction { description: null, mod: 'snoowrap_testing', action: 'editflair', ... }
  * //  ModAction { description: null, mod: 'snoowrap_testing', action: 'approvecomment', ... }
  * //  ModAction { description: null, mod: 'snoowrap_testing', action: 'createrule', ... }
  * // ]
  */
  getModerationLog() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var parsedOptions = (0, _omit3.default)(_extends({}, options, { mod: options.mods && options.mods.join(',') }), 'mods');
    return this._getListing({ uri: 'r/' + this.display_name + '/about/log', qs: parsedOptions });
  }
  /**
  * @summary Gets a list of reported items on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing reported items
  * @example
  *
  * r.getSubreddit('snoowrap').getReports().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getReports() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this._getListing({ uri: 'r/' + this.display_name + '/about/reports', qs: options });
  }
  /**
  * @summary Gets a list of removed items on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing removed items
  * @example
  *
  * r.getSubreddit('snoowrap').getSpam().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getSpam() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this._getListing({ uri: 'r/' + this.display_name + '/about/spam', qs: options });
  }
  /**
  * @summary Gets a list of items on the modqueue on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing items on the modqueue
  * @example
  *
  * r.getSubreddit('snoowrap').getModqueue().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getModqueue() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this._getListing({ uri: 'r/' + this.display_name + '/about/modqueue', qs: options });
  }
  /**
  * @summary Gets a list of unmoderated items on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing unmoderated items
  * @example
  *
  * r.getSubreddit('snoowrap').getUnmoderated().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getUnmoderated() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this._getListing({ uri: 'r/' + this.display_name + '/about/unmoderated', qs: options });
  }
  /**
  * @summary Gets a list of edited items on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing edited items
  * @example
  *
  * r.getSubreddit('snoowrap').getEdited().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getEdited() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this._getListing({ uri: 'r/' + this.display_name + '/about/edited', qs: options });
  }
  /**
  * @summary Accepts an invite to become a moderator of this subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').acceptModeratorInvite()
  */
  acceptModeratorInvite() {
    return this._post({
      uri: 'r/' + this.display_name + '/api/accept_moderator_invite',
      form: { api_type }
    }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Abdicates moderator status on this subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').leaveModerator()
  */
  leaveModerator() {
    var _this4 = this;

    return this.fetch().get('name').then(function (name) {
      return _this4._post({ uri: 'api/leavemoderator', form: { id: name } }).then((0, _helpers.handleJsonErrors)(_this4));
    });
  }
  /**
  * @summary Abdicates approved submitter status on this subreddit.
  * @returns {Promise} A Promise that resolves with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').leaveContributor()
  */
  leaveContributor() {
    var _this5 = this;

    return this.fetch().get('name').then(function (name) {
      return _this5._post({ uri: 'api/leavecontributor', form: { id: name } }).return(_this5);
    });
  }
  /**
  * @summary Gets a subreddit's CSS stylesheet.
  * @desc **Note**: This function will not work when snoowrap is running in a browser, because the reddit server sends a
  redirect which cannot be followed by a CORS request.
  * @desc **Note**: This method will return a 404 error if the subreddit in question does not have a custom stylesheet.
  * @returns {Promise} A Promise for a string containing the subreddit's CSS.
  * @example
  *
  * r.getSubreddit('snoowrap').getStylesheet().then(console.log)
  * // => '.md blockquote,.md del,body{color:#121212}.usertext-body ... '
  */
  getStylesheet() {
    return this._get({ uri: 'r/' + this.display_name + '/stylesheet', json: false });
  }
  /**
  * @summary Conducts a search of reddit submissions, restricted to this subreddit.
  * @param {object} options Search options. Can also contain options for the resulting Listing.
  * @param {string} options.query The search query
  * @param {string} [options.time] Describes the timespan that posts should be retrieved frome. One of
  `hour, day, week, month, year, all`
  * @param {string} [options.sort] Determines how the results should be sorted. One of `relevance, hot, top, new, comments`
  * @param {string} [options.syntax='plain'] Specifies a syntax for the search. One of `cloudsearch, lucene, plain`
  * @returns {Promise} A Listing containing the search results.
  * @example
  *
  * r.getSubreddit('snoowrap').search({query: 'blah', sort: 'year'}).then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  search(options) {
    return this._r.search(_extends({}, options, { subreddit: this, restrictSr: true }));
  }
  /**
  * @summary Gets the list of banned users on this subreddit.
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  * @example
  *
  * r.getSubreddit('snoowrap').getBannedUsers().then(console.log)
  * // => Listing [
  * //  { date: 1461720936, note: '', name: 'actually_an_aardvark', id: 't2_q3519' }
  * //  ...
  * // ]
  *
  */
  getBannedUsers(options) {
    return this._getListing({ uri: 'r/' + this.display_name + '/about/banned', qs: (0, _helpers.renameKey)(options, 'name', 'user') });
  }
  /**
  * @summary Gets the list of muted users on this subreddit.
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  * @example
  *
  * r.getSubreddit('snoowrap').getBannedUsers().then(console.log)
  * // => Listing [
  * //  { date: 1461720936, name: 'actually_an_aardvark', id: 't2_q3519' }
  * //  ...
  * // ]
  */
  getMutedUsers(options) {
    return this._getListing({ uri: 'r/' + this.display_name + '/about/muted', qs: (0, _helpers.renameKey)(options, 'name', 'user') });
  }
  /**
  * @summary Gets the list of users banned from this subreddit's wiki.
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  * @example
  *
  * r.getSubreddit('snoowrap').getWikibannedUsers().then(console.log)
  * // => Listing [
  * //  { date: 1461720936, note: '', name: 'actually_an_aardvark', id: 't2_q3519' }
  * //  ...
  * // ]
  */
  getWikibannedUsers(options) {
    return this._getListing({ uri: 'r/' + this.display_name + '/about/wikibanned', qs: (0, _helpers.renameKey)(options, 'name', 'user') });
  }
  /**
  * @summary Gets the list of approved submitters on this subreddit.
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  * @example
  *
  * r.getSubreddit('snoowrap').getContributors().then(console.log)
  * // => Listing [
  * //  { date: 1461720936, name: 'actually_an_aardvark', id: 't2_q3519' }
  * //  ...
  * // ]
  */
  getContributors(options) {
    return this._getListing({ uri: 'r/' + this.display_name + '/about/contributors', qs: (0, _helpers.renameKey)(options, 'name', 'user') });
  }
  /**
  * @summary Gets the list of approved wiki submitters on this subreddit .
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  * @example
  *
  * r.getSubreddit('snoowrap').getWikiContributors().then(console.log)
  * // => Listing [
  * //  { date: 1461720936, name: 'actually_an_aardvark', id: 't2_q3519' }
  * //  ...
  * // ]
  */
  getWikiContributors(options) {
    return this._getListing({ uri: 'r/' + this.display_name + '/about/wikicontributors', qs: (0, _helpers.renameKey)(options, 'name', 'user') });
  }
  /**
  * @summary Gets the list of moderators on this subreddit.
  * @param {object} options
  * @param {string} [options.name] The name of a user to find in the list
  * @returns {Promise} An Array of RedditUsers representing the moderators of this subreddit
  * @example
  *
  * r.getSubreddit('AskReddit').getModerators().then(console.log)
  * // => [
  * //  RedditUser { date: 1453862639, mod_permissions: [ 'all' ], name: 'not_an_aardvark', id: 't2_k83md' },
  * //  ...
  * // ]
  *
  */
  getModerators() {
    var _ref6 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        name = _ref6.name;

    return this._get({ uri: 'r/' + this.display_name + '/about/moderators', qs: { user: name } });
  }
  /**
  * @summary Deletes the banner for this Subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteBanner()
  */
  deleteBanner() {
    return this._post({ uri: 'r/' + this.display_name + '/api/delete_sr_banner', form: { api_type } }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Deletes the header image for this Subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteHeader()
  */
  deleteHeader() {
    return this._post({ uri: 'r/' + this.display_name + '/api/delete_sr_header', form: { api_type } }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Deletes this subreddit's icon.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteIcon()
  */
  deleteIcon() {
    return this._post({ uri: 'r/' + this.display_name + '/api/delete_sr_icon', form: { api_type } }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Deletes an image from this subreddit.
  * @param {object} options
  * @param {string} options.imageName The name of the image.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteImage()
  */
  deleteImage(_ref7) {
    var image_name = _ref7.image_name,
        _ref7$imageName = _ref7.imageName,
        imageName = _ref7$imageName === undefined ? image_name : _ref7$imageName;

    return this._post({
      uri: 'r/' + this.display_name + '/api/delete_sr_img',
      form: { api_type, img_name: imageName }
    }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Gets this subreddit's current settings.
  * @returns {Promise} An Object containing this subreddit's current settings.
  * @example
  *
  * r.getSubreddit('snoowrap').getSettings().then(console.log)
  * // => SubredditSettings { default_set: true, submit_text: '', subreddit_type: 'private', ... }
  */
  getSettings() {
    return this._get({ uri: 'r/' + this.display_name + '/about/edit' });
  }
  /**
  * @summary Edits this subreddit's settings.
  * @param {object} options An Object containing {[option name]: new value} mappings of the options that should be modified.
  Any omitted option names will simply retain their previous values.
  * @param {string} options.title The text that should appear in the header of the subreddit
  * @param {string} options.public_description The text that appears with this Subreddit on the search page, or on the
  blocked-access page if this subreddit is private. (500 characters max)
  * @param {string} options.description The sidebar text for the subreddit. (5120 characters max)
  * @param {string} [options.submit_text=''] The text to show below the submission page (1024 characters max)
  * @param {boolean} [options.hide_ads=false] Determines whether ads should be hidden on this subreddit. (This is only
  allowed for gold-only subreddits.)
  * @param {string} [options.lang='en'] The language of the subreddit (represented as an IETF language tag)
  * @param {string} [options.type='public'] Determines who should be able to access the subreddit. This should be one of
  `public, private, restricted, gold_restricted, gold_only, archived, employees_only`.
  * @param {string} [options.link_type='any'] Determines what types of submissions are allowed on the subreddit. This should
  be one of `any, link, self`.
  * @param {string} [options.submit_link_label=undefined] Custom text to display on the button that submits a link. If
  this is omitted, the default text will be displayed.
  * @param {string} [options.submit_text_label=undefined] Custom text to display on the button that submits a selfpost. If
  this is omitted, the default text will be displayed.
  * @param {string} [options.wikimode='modonly'] Determines who can edit wiki pages on the subreddit. This should be one of
  `modonly, anyone, disabled`.
  * @param {number} [options.wiki_edit_karma=0] The minimum amount of subreddit karma needed for someone to edit this
  subreddit's wiki. (This is only relevant if `options.wikimode` is set to `anyone`.)
  * @param {number} [options.wiki_edit_age=0] The minimum account age (in days) needed for someone to edit this subreddit's
  wiki. (This is only relevant if `options.wikimode` is set to `anyone`.)
  * @param {string} [options.spam_links='high'] The spam filter strength for links on this subreddit. This should be one of
  `low, high, all`.
  * @param {string} [options.spam_selfposts='high'] The spam filter strength for selfposts on this subreddit. This should be
  one of `low, high, all`.
  * @param {string} [options.spam_comments='high'] The spam filter strength for comments on this subreddit. This should be one
  of `low, high, all`.
  * @param {boolean} [options.over_18=false] Determines whether this subreddit should be classified as NSFW
  * @param {boolean} [options.allow_top=true] Determines whether the new subreddit should be able to appear in /r/all and
  trending subreddits
  * @param {boolean} [options.show_media=false] Determines whether image thumbnails should be enabled on this subreddit
  * @param {boolean} [options.show_media_preview=true] Determines whether media previews should be expanded by default on this
  subreddit
  * @param {boolean} [options.allow_images=true] Determines whether image uploads and links to image hosting sites should be
  enabled on this subreddit
  * @param {boolean} [options.exclude_banned_modqueue=false] Determines whether posts by site-wide banned users should be
  excluded from the modqueue.
  * @param {boolean} [options.public_traffic=false] Determines whether the /about/traffic page for this subreddit should be
  viewable by anyone.
  * @param {boolean} [options.collapse_deleted_comments=false] Determines whether deleted and removed comments should be
  collapsed by default
  * @param {string} [options.suggested_comment_sort=undefined] The suggested comment sort for the subreddit. This should be
  one of `confidence, top, new, controversial, old, random, qa`.If left blank, there will be no suggested sort,
  which means that users will see the sort method that is set in their own preferences (usually `confidence`.)
  * @param {boolean} [options.spoilers_enabled=false] Determines whether users can mark their posts as spoilers
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').editSettings({submit_text: 'Welcome! Please be sure to read the rules.'})
  */
  editSettings(options) {
    var _this6 = this;

    return _Promise2.default.join(this.getSettings(), this.fetch().get('name'), function (currentValues, name) {
      return _this6._r._createOrEditSubreddit(_extends({}, (0, _helpers.renameKey)(currentValues, 'subreddit_type', 'type'), options, {
        sr: name
      }));
    }).return(this);
  }
  /**
  * @summary Gets a list of recommended other subreddits given this one.
  * @param {object} [options]
  * @param {Array} [options.omit=[]] An Array of subreddit names that should be excluded from the listing.
  * @returns {Promise} An Array of subreddit names
  * @example
  *
  * r.getSubreddit('AskReddit').getRecommendedSubreddits().then(console.log);
  * // [ 'TheChurchOfRogers', 'Sleepycabin', ... ]
  */
  getRecommendedSubreddits(options) {
    var toOmit = options.omit && options.omit.join(',');
    return this._get({ uri: 'api/recommend/sr/' + this.display_name, qs: { omit: toOmit } }).then(function (names) {
      return (0, _map3.default)(names, 'sr_name');
    });
  }
  /**
  * @summary Gets the submit text (which displays on the submission form) for this subreddit.
  * @returns {Promise} The submit text, represented as a string.
  * @example
  *
  * r.getSubreddit('snoowrap').getSubmitText().then(console.log)
  * // => 'Welcome! Please be sure to read the rules.'
  */
  getSubmitText() {
    return this._get({ uri: 'r/' + this.display_name + '/api/submit_text' }).get('submit_text');
  }
  /**
  * @summary Updates this subreddit's stylesheet.
  * @param {object} options
  * @param {string} options.css The new contents of the stylesheet
  * @param {string} [options.reason] The reason for the change (256 characters max)
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').updateStylesheet({css: 'body {color:#00ff00;}', reason: 'yay green'})
  */
  updateStylesheet(_ref8) {
    var css = _ref8.css,
        reason = _ref8.reason;

    return this._post({
      uri: 'r/' + this.display_name + '/api/subreddit_stylesheet',
      form: { api_type, op: 'save', reason, stylesheet_contents: css }
    }).then((0, _helpers.handleJsonErrors)(this));
  }

  _setSubscribed(status) {
    return this._post({
      uri: 'api/subscribe',
      form: { action: status ? 'sub' : 'unsub', sr_name: this.display_name }
    }).return(this);
  }
  /**
  * @summary Subscribes to this subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').subscribe()
  */
  subscribe() {
    return this._setSubscribed(true);
  }
  /**
  * @summary Unsubscribes from this subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').unsubscribe()
  */
  unsubscribe() {
    var _this7 = this;

    /* Reddit returns a 404 error if the user attempts to unsubscribe to a subreddit that they weren't subscribed to in the
    first place. It also (as one would expect) returns a 404 error if the subreddit in question does not exist. snoowrap
    should swallow the first type of error internally, but it should raise the second type of error. Unfortunately, the errors
    themselves are indistinguishable. So if a 404 error gets thrown, fetch the current subreddit to check if it exists. If it
    does exist, then the 404 error was of the first type, so swallow it and return the current Subreddit object as usual. If
    the subreddit doesn't exist, then the original error was of the second type, so throw it. */
    return this._setSubscribed(false).catch({ statusCode: 404 }, function (err) {
      return _this7.fetch().return(_this7).catchThrow(err);
    });
  }
  _uploadSrImg(_ref9) {
    var _this8 = this;

    var name = _ref9.name,
        file = _ref9.file,
        uploadType = _ref9.uploadType,
        imageType = _ref9.imageType;

    if (typeof file !== 'string' && !(file instanceof _stream.Readable)) {
      throw new _errors.InvalidMethodCallError('Uploaded image filepath must be a string or a ReadableStream.');
    }
    var parsedFile = typeof file === 'string' ? (0, _fs.createReadStream)(file) : file;
    return this._post({
      uri: 'r/' + this.display_name + '/api/upload_sr_img',
      formData: { name, upload_type: uploadType, img_type: imageType, file: parsedFile }
    }).then(function (result) {
      if (result.errors.length) {
        throw result.errors[0];
      }
      return _this8;
    });
  }
  /**
  * @summary Uploads an image for use in this subreddit's stylesheet.
  * @param {object} options
  * @param {string} options.name The name that the new image should have in the stylesheet
  * @param {string|stream.Readable} options.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) in environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [options.imageType='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').uploadSubredditImage({name: 'the cookie monster', file: './cookie_monster.png'})
  */
  uploadStylesheetImage(_ref10) {
    var name = _ref10.name,
        file = _ref10.file,
        _ref10$image_type = _ref10.image_type,
        image_type = _ref10$image_type === undefined ? 'png' : _ref10$image_type,
        _ref10$imageType = _ref10.imageType,
        imageType = _ref10$imageType === undefined ? image_type : _ref10$imageType;

    return this._uploadSrImg({ name, file, imageType, uploadType: 'img' });
  }
  /**
  * @summary Uploads an image to use as this subreddit's header.
  * @param {object} options
  * @param {string|stream.Readable} options.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [options.imageType='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').uploadHeaderImage({name: 'the cookie monster', file: './cookie_monster.png'})
  */
  uploadHeaderImage(_ref11) {
    var file = _ref11.file,
        _ref11$image_type = _ref11.image_type,
        image_type = _ref11$image_type === undefined ? 'png' : _ref11$image_type,
        _ref11$imageType = _ref11.imageType,
        imageType = _ref11$imageType === undefined ? image_type : _ref11$imageType;

    return this._uploadSrImg({ file, imageType, uploadType: 'header' });
  }
  /**
  * @summary Uploads an image to use as this subreddit's mobile icon.
  * @param {object} options
  * @param {string|stream.Readable} options.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [options.imageType='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').uploadIcon({name: 'the cookie monster', file: './cookie_monster.png'})
  */
  uploadIcon(_ref12) {
    var file = _ref12.file,
        _ref12$image_type = _ref12.image_type,
        image_type = _ref12$image_type === undefined ? 'png' : _ref12$image_type,
        _ref12$imageType = _ref12.imageType,
        imageType = _ref12$imageType === undefined ? image_type : _ref12$imageType;

    return this._uploadSrImg({ file, imageType, uploadType: 'icon' });
  }
  /**
  * @summary Uploads an image to use as this subreddit's mobile banner.
  * @param {object} options
  * @param {string|stream.Readable} options.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [options.imageType='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').uploadBannerImage({name: 'the cookie monster', file: './cookie_monster.png'})
  */
  uploadBannerImage(_ref13) {
    var file = _ref13.file,
        _ref13$image_type = _ref13.image_type,
        image_type = _ref13$image_type === undefined ? 'png' : _ref13$image_type,
        _ref13$imageType = _ref13.imageType,
        imageType = _ref13$imageType === undefined ? image_type : _ref13$imageType;

    return this._uploadSrImg({ file, imageType, upload_type: 'banner' });
  }
  /**
  * @summary Gets information on this subreddit's rules.
  * @returns {Promise} A Promise that fulfills with information on this subreddit's rules.
  * @example
  *
  * r.getSubreddit('snoowrap').getRules().then(console.log)
  *
  * // => {
  *   rules: [
  *     {
  *       kind: 'all',
  *       short_name: 'Rule 1: No violating rule 1',
  *       description: 'Breaking this rule is not allowed.',
  *       ...
  *     },
  *     ...
  *   ],
  *   site_rules: [
  *     'Spam',
  *     'Personal and confidential information'',
  *     'Threatening, harassing, or inciting violence'
  *   ]
  * }
  */
  getRules() {
    return this._get({ uri: 'r/' + this.display_name + '/about/rules' });
  }
  /**
  * @summary Gets the stickied post on this subreddit, or throws a 404 error if none exists.
  * @param {object} [options]
  * @param {number} [options.num=1] The number of the sticky to get. Should be either `1` (first sticky) or `2` (second sticky).
  * @returns {Promise} A Submission object representing this subreddit's stickied submission
  * @example
  * r.getSubreddit('snoowrap').getSticky({num: 2})
  * // => Submission { ... }
  */
  getSticky() {
    var _ref14 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref14$num = _ref14.num,
        num = _ref14$num === undefined ? 1 : _ref14$num;

    return this._get({ uri: 'r/' + this.display_name + '/about/sticky', qs: { num } });
  }
  _friend(options) {
    return this._post({
      uri: 'r/' + this.display_name + '/api/friend',
      form: _extends({}, options, { api_type })
    }).then((0, _helpers.handleJsonErrors)(this));
  }
  _unfriend(options) {
    return this._post({
      uri: 'r/' + this.display_name + '/api/unfriend',
      form: _extends({}, options, { api_type })
    }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Invites the given user to be a moderator of this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the account that should be invited
  * @param {Array} [options.permissions] The moderator permissions that this user should have. This should be an array
  containing some combination of `"wiki", "posts", "access", "mail", "config", "flair"`. To add a moderator with full
  permissions, omit this property entirely.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').inviteModerator({name: 'actually_an_aardvark', permissions: ['posts', 'wiki']})
  */
  inviteModerator(_ref15) {
    var name = _ref15.name,
        permissions = _ref15.permissions;

    return this._friend({ name, permissions: (0, _helpers.formatModPermissions)(permissions), type: 'moderator_invite' });
  }
  /**
  * @summary Revokes an invitation for the given user to be a moderator.
  * @param {object} options
  * @param {string} options.name The username of the account whose invitation should be revoked
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').revokeModeratorInvite({name: 'actually_an_aardvark'})
  */
  revokeModeratorInvite(_ref16) {
    var name = _ref16.name;

    return this._unfriend({ name, type: 'moderator_invite' });
  }
  /**
  * @summary Removes the given user's moderator status on this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the account whose moderator status should be removed
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').removeModerator({name: 'actually_an_aardvark'})
  */
  removeModerator(_ref17) {
    var name = _ref17.name;

    return this._unfriend({ name, type: 'moderator' });
  }
  /**
  * @summary Makes the given user an approved submitter of this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the account that should be given this status
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').addContributor({name: 'actually_an_aardvark'})
  */
  addContributor(_ref18) {
    var name = _ref18.name;

    return this._friend({ name, type: 'contributor' });
  }
  /**
  * @summary Revokes this user's approved submitter status on this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the account whose status should be revoked
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').removeContributor({name: 'actually_an_aardvark'})
  */
  removeContributor(_ref19) {
    var name = _ref19.name;

    return this._unfriend({ name, type: 'contributor' });
  }
  /**
  * @summary Bans the given user from this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the account that should be banned
  * @param {string} [options.banMessage] The ban message. This will get sent to the user in a private message, alerting them
  that they have been banned.
  * @param {string} [options.banReason] A string indicating which rule the banned user broke (100 characters max)
  * @param {number} [options.duration] The duration of the ban, in days. For a permanent ban, omit this parameter.
  * @param {string} [options.banNote] A note that appears on the moderation log, usually used to indicate the reason for the
  ban. This is not visible to the banned user. (300 characters max)
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').banUser({name: 'actually_an_aardvark', banMessage: 'You are now banned LOL'})
  */
  banUser(_ref20) {
    var name = _ref20.name,
        ban_message = _ref20.ban_message,
        _ref20$banMessage = _ref20.banMessage,
        banMessage = _ref20$banMessage === undefined ? ban_message : _ref20$banMessage,
        ban_reason = _ref20.ban_reason,
        _ref20$banReason = _ref20.banReason,
        banReason = _ref20$banReason === undefined ? ban_reason : _ref20$banReason,
        duration = _ref20.duration,
        ban_note = _ref20.ban_note,
        _ref20$banNote = _ref20.banNote,
        banNote = _ref20$banNote === undefined ? ban_note : _ref20$banNote;

    return this._friend({
      name, ban_message: banMessage,
      ban_reason: banReason,
      duration,
      note: banNote,
      type: 'banned'
    });
  }
  /**
  * @summary Unbans the given user from this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the account that should be unbanned
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example r.getSubreddit('snoowrap').unbanUser({name: 'actually_an_aardvark'})
  */
  unbanUser(_ref21) {
    var name = _ref21.name;

    return this._unfriend({ name, type: 'banned' });
  }
  /**
  * @summary Mutes the given user from messaging this subreddit for 72 hours.
  * @param {object} options
  * @param {string} options.name The username of the account that should be muted
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').muteUser({name: 'actually_an_aardvark'})
  */
  muteUser(_ref22) {
    var name = _ref22.name;

    return this._friend({ name, type: 'muted' });
  }
  /**
  * @summary Unmutes the given user from messaging this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the account that should be muted
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').unmuteUser({name: 'actually_an_aardvark'})
  */
  unmuteUser(_ref23) {
    var name = _ref23.name;

    return this._unfriend({ name, type: 'muted' });
  }
  /**
  * @summary Bans the given user from editing this subreddit's wiki.
  * @param {object} options
  * @param {string} options.name The username of the account that should be wikibanned
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').wikibanUser({name: 'actually_an_aardvark'})
  */
  wikibanUser(_ref24) {
    var name = _ref24.name;

    return this._friend({ name, type: 'wikibanned' });
  }
  /**
  * @summary Unbans the given user from editing this subreddit's wiki.
  * @param {object} options
  * @param {string} options.name The username of the account that should be unwikibanned
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').unwikibanUser({name: 'actually_an_aardvark'})
  */
  unwikibanUser(_ref25) {
    var name = _ref25.name;

    return this._unfriend({ name, type: 'wikibanned' });
  }
  /**
  * @summary Adds the given user to this subreddit's list of approved wiki editors.
  * @param {object} options
  * @param {string} options.name The username of the account that should be given approved editor status
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').addWikiContributor({name: 'actually_an_aardvark'})
  */
  addWikiContributor(_ref26) {
    var name = _ref26.name;

    return this._friend({ name, type: 'wikicontributor' });
  }
  /**
  * @summary Removes the given user from this subreddit's list of approved wiki editors.
  * @param {object} options
  * @param {string} options.name The username of the account whose approved editor status should be revoked
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').removeWikiContributor({name: 'actually_an_aardvark'})
  */
  removeWikiContributor(_ref27) {
    var name = _ref27.name;

    return this._unfriend({ name, type: 'wikicontributor' });
  }
  /**
  * @summary Sets the permissions for a given moderator on this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the moderator whose permissions are being changed
  * @param {Array} [options.permissions] The new moderator permissions that this user should have. This should be an array
  containing some combination of `"wiki", "posts", "access", "mail", "config", "flair"`. To add a moderator with full
  permissions, omit this property entirely.
  * @returns {Promise} A Promise that fulfills with this Subreddit when this request is complete
  * @example r.getSubreddit('snoowrap').setModeratorPermissions({name: 'actually_an_aardvark', permissions: ['mail']})
  */
  setModeratorPermissions(_ref28) {
    var name = _ref28.name,
        permissions = _ref28.permissions;

    return this._post({
      uri: 'r/' + this.display_name + '/api/setpermissions',
      form: { api_type, name, permissions: (0, _helpers.formatModPermissions)(permissions), type: 'moderator' }
    }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Gets a given wiki page on this subreddit.
  * @param {string} title The title of the desired wiki page.
  * @returns {WikiPage} An unfetched WikiPage object corresponding to the desired wiki page
  * @example
  *
  * r.getSubreddit('snoowrap').getWikiPage('index')
  * // => WikiPage { title: 'index', subreddit: Subreddit { display_name: 'snoowrap' } }
  */
  getWikiPage(title) {
    return this._r._newObject('WikiPage', { subreddit: this, title });
  }
  /**
  * @summary Gets the list of wiki pages on this subreddit.
  * @returns {Promise} An Array containing WikiPage objects
  * @example
  *
  * r.getSubreddit('snoowrap').getWikiPages().then(console.log)
  * // => [
  * //   WikiPage { title: 'index', subreddit: Subreddit { display_name: 'snoowrap'} }
  * //   WikiPage { title: 'config/sidebar', subreddit: Subreddit { display_name: 'snoowrap'} }
  * //   WikiPage { title: 'secret_things', subreddit: Subreddit { display_name: 'snoowrap'} }
  * //   WikiPage { title: 'config/submit_text', subreddit: Subreddit { display_name: 'snoowrap'} }
  * // ]
  */
  getWikiPages() {
    var _this9 = this;

    return this._get({ uri: 'r/' + this.display_name + '/wiki/pages' }).map(function (title) {
      return _this9.getWikiPage(title);
    });
  }
  /**
  * @summary Gets a list of revisions on this subreddit's wiki.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing wiki revisions
  * @example
  *
  * r.getSubreddit('snoowrap').getWikiRevisions().then(console.log)
  * // => Listing [
  * //  { page: 'index', reason: 'added cookies', ... },
  * //  ...
  * // ]
  */
  getWikiRevisions(options) {
    return this._getListing({ uri: 'r/' + this.display_name + '/wiki/revisions', qs: options });
  }
};

exports.default = Subreddit;
},{"../Promise.js":1,"../errors.js":4,"../helpers.js":5,"./RedditContent.js":13,"fs":27,"lodash/chunk":235,"lodash/flatten":246,"lodash/map":273,"lodash/omit":280,"stream":318}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
class UserList {
  constructor(options, _r) {
    return options.children.map(function (user) {
      return _r._newObject('RedditUser', user);
    });
  }
}
exports.default = UserList;
},{}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Promise = require('../Promise.js');

var _Promise2 = _interopRequireDefault(_Promise);

var _helpers = require('../helpers.js');

var _ReplyableContent = require('./ReplyableContent.js');

var _ReplyableContent2 = _interopRequireDefault(_ReplyableContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var api_type = 'json';

/**
* A set of mixin functions that apply to Submissions and Comments.
* <style> #VoteableContent {display: none} </style>
* @extends ReplyableContent
*/
var VoteableContent = class VoteableContent extends _ReplyableContent2.default {
  /**
  * @summary Casts a vote on this Comment or Submission.
  * @private
  * @param {number} direction The direction of the vote. (1 for an upvote, -1 for a downvote, 0 to remove a vote)
  * @returns {Promise} A Promise that fulfills when the request is complete.
  */
  _vote(direction) {
    return this._post({ uri: 'api/vote', form: { dir: direction, id: this.name } }).return(this);
  }
  /**
  * @summary Upvotes this Comment or Submission.
  * @returns {Promise} A Promise that fulfills with this Comment/Submission when the request is complete
  * @desc **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK,
  but bots deciding how to vote on content or amplifying a human's vote are not. See the
  [reddit rules](https://reddit.com/rules) for more details on what constitutes vote cheating. (This guideline is quoted from
  [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
  * @example r.getSubmission('4e62ml').upvote()
  */
  upvote() {
    return this._vote(1);
  }
  /**
  * @summary Downvotes this Comment or Submission.
  * @returns {Promise} A Promise that fulfills with this Comment/Submission when the request is complete.
  * @desc **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK, but
  bots deciding how to vote on content or amplifying a human's vote are not. See the [reddit rules](https://reddit.com/rules)
  for more details on what constitutes vote cheating. (This guideline is quoted from
  [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
  * @example r.getSubmission('4e62ml').downvote()
  */
  downvote() {
    return this._vote(-1);
  }
  /**
  * @summary Removes any existing vote on this Comment or Submission.
  * @returns {Promise} A Promise that fulfills with this Comment/Submission when the request is complete.
  * @desc **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK, but
  bots deciding how to vote on content or amplifying a human's vote are not. See the [reddit rules](https://reddit.com/rules)
  for more details on what constitutes vote cheating. (This guideline is quoted from
  [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
  * @example r.getSubmission('4e62ml').unvote()
  */
  unvote() {
    return this._vote(0);
  }
  /**
  * @summary Saves this Comment or Submission (i.e. adds it to the list at reddit.com/saved)
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example r.getSubmission('4e62ml').save()
  */
  save() {
    return this._post({ uri: 'api/save', form: { id: this.name } }).return(this);
  }
  /**
  * @summary Unsaves this item
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example r.getSubmission('4e62ml').unsave()
  */
  unsave() {
    return this._post({ uri: 'api/unsave', form: { id: this.name } }).return(this);
  }
  /**
  * @summary Distinguishes this Comment or Submission with a sigil.
  * @desc **Note:** This function will only work if the requester is the author of this Comment/Submission.
  * @param {object} options
  * @param {boolean|string} [options.status=true] Determines how the item should be distinguished.
  `true` (default) signifies that the item should be moderator-distinguished, and
  `false` signifies that the item should not be distinguished. Passing a string (e.g.
  `admin`) will cause the item to get distinguished with that string, if possible.
  * @param {boolean} [options.sticky=false] Determines whether this item should be stickied in addition to being
  distinguished. (This only applies to comments; to sticky a submission, use {@link Submission#sticky} instead.)
  * @returns {Promise} A Promise that fulfills when the request is complete.
  * @example r.getComment('d1xclfo').distinguish({status: true, sticky: true})
  */
  distinguish() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$status = _ref.status,
        status = _ref$status === undefined ? true : _ref$status,
        _ref$sticky = _ref.sticky,
        sticky = _ref$sticky === undefined ? false : _ref$sticky;

    return this._post({ uri: 'api/distinguish', form: {
        api_type,
        how: status === true ? 'yes' : status === false ? 'no' : status,
        sticky,
        id: this.name
      } }).return(this);
  }
  /**
  * @summary Undistinguishes this Comment or Submission. Alias for distinguish({status: false})
  * @returns {Promise} A Promise that fulfills when the request is complete.
  * @example r.getSubmission('4e62ml').undistinguish()
  */
  undistinguish() {
    return this.distinguish({ status: false, sticky: false }).return(this);
  }
  /**
  * @summary Edits this Comment or Submission.
  * @param {string} updatedText The updated markdown text to use
  * @returns {Promise} A Promise that fulfills when this request is complete.
  * @example r.getComment('coip909').edit('Blah blah blah this is new updated text')
  */
  edit(updatedText) {
    return this._post({
      uri: 'api/editusertext',
      form: { api_type, text: updatedText, thing_id: this.name }
    }).tap((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Gives reddit gold to the author of this Comment or Submission.
  * @returns {Promise} A Promise that fullfills with this Comment/Submission when this request is complete
  * @example r.getComment('coip909').gild()
  */
  gild() {
    return this._post({ uri: 'api/v1/gold/gild/' + this.name }).return(this);
  }
  _setInboxRepliesEnabled(state) {
    return this._post({ uri: 'api/sendreplies', form: { state, id: this.name } });
  }
  /**
  * @summary Enables inbox replies on this Comment or Submission
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  * @example r.getComment('coip909').enableInboxReplies()
  */
  enableInboxReplies() {
    return this._setInboxRepliesEnabled(true).return(this);
  }
  /**
  * @summary Disables inbox replies on this Comment or Submission
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  * @example r.getComment('coip909').disableInboxReplies()
  */
  disableInboxReplies() {
    return this._setInboxRepliesEnabled(false).return(this);
  }
  _mutateAndExpandReplies(_ref2) {
    var _this = this;

    var limit = _ref2.limit,
        depth = _ref2.depth;

    if (depth <= 0) {
      return _Promise2.default.resolve(this);
    }
    var repliesKey = this.constructor._name === 'Submission' ? 'comments' : 'replies';
    return this[repliesKey].fetchMore({ amount: limit - this[repliesKey].length }).tap(function (replies) {
      _this[repliesKey] = replies;
    }).then(function (replies) {
      return replies.slice(0, limit);
    }).map(function (reply) {
      return reply._mutateAndExpandReplies({ limit, depth: depth - 1 });
    }).return(this);
  }
  /**
  * @summary Expands the reply Listings on this Comment/Submission.
  * @desc This is useful in cases where one wants to enumerate all comments on a
  thread, even the ones that are initially hidden when viewing it (e.g. long comment chains).
  *
  * This function accepts two optional parameters `options.limit` and `options.depth`. `options.limit` sets an upper bound
  for the branching factor of the resulting replies tree, i.e. the number of comments that are fetched in reply to any given
  item. `options.depth` sets an upper bound for the depth of the resulting replies tree (where a depth of 0 signifies that no
  replies should be fetched at all).
  *
  * Note that regardless of the `limit` and `depth` parameters used, any reply that appeared in the original reply tree will
  appear in the expanded reply tree. In certain cases, the depth of the resulting tree may also be larger than `options.depth`,
  if the reddit API returns more of a comment tree than needed.
  *
  * These parameters should primarily be used to keep the request count low; if a precise limit and depth are needed, it is
  recommended to manually verify the comments in the tree afterwards.
  *
  * Both parameters default to `Infinity` if omitted, i.e. the resulting tree contains every single comment available. It should
  be noted that depending on the size and depth of the thread, fetching every single comment can use up a significant number
  of ratelimited requests. (To give an intuitive estimate, consider how many clicks would be needed to view all the
  comments on the thread using the HTML site.)
  * @param {object} [options={}]
  * @param {number} [options.limit=Infinity] An upper-bound for the branching factor of the resulting tree of replies
  * @param {number} [options.depth=Infinity] An upper-bound for the depth of the resulting tree of replies
  * @returns {Promise} A Promise that fulfills with a new version of this object that has an expanded reply tree. The original
  object is not modified
  * @example r.getSubmission('4fuq26').expandReplies().then(console.log)
  * // => (a very large comment tree containing every viewable comment on this thread)
  */
  expandReplies() {
    var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref3$limit = _ref3.limit,
        limit = _ref3$limit === undefined ? Infinity : _ref3$limit,
        _ref3$depth = _ref3.depth,
        depth = _ref3$depth === undefined ? Infinity : _ref3$depth;

    return this._r._promiseWrap(this.fetch().then(function (result) {
      return result._clone({ deep: true })._mutateAndExpandReplies({ limit, depth });
    }));
  }
};

// VoteableContent#delete is not in the class body since Safari 9 can't parse the `delete` function name in class bodies.
/**
* @function
* @name delete
* @summary Deletes this Comment or Submission
* @returns {Promise} A Promise that fulfills with this Comment/Submission when this request is complete
* @example r.getComment('coip909').delete()
* @memberof VoteableContent
* @instance
*/
Object.defineProperty(VoteableContent.prototype, 'delete', { value() {
    return this._post({ uri: 'api/del', form: { id: this.name } }).return(this);
  }, configurable: true, writable: true });

exports.default = VoteableContent;
},{"../Promise.js":1,"../helpers.js":5,"./ReplyableContent.js":15}],20:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _RedditContent = require('./RedditContent.js');

var _RedditContent2 = _interopRequireDefault(_RedditContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* A class representing a wiki page on a subreddit.
*
* **Note:** Due to a bug in reddit's CORS settings, it is not possible to fetch the contents of a wiki page on a private
subreddit while running snoowrap in a browser. (This issue does not apply when running snoowrap in Node.js.)
*
* <style> #WikiPage {display: none} </style>
* @extends RedditContent
* @example
*
* // Get a wiki page on a given subreddit by name
* r.getSubreddit('AskReddit').getWikiPage('rules')
*/
var WikiPage = class WikiPage extends _RedditContent2.default {
  get _uri() {
    return 'r/' + this.subreddit.display_name + '/wiki/' + this.title;
  }
  /**
  * @summary Gets the current settings for this wiki page.
  * @returns {Promise} An Object representing the settings for this page
  * @example
  *
  * r.getSubreddit('snoowrap').getWikiPage('index').getSettings().then(console.log)
  * // => WikiPageSettings { permlevel: 0, editors: [], listed: true }
  */
  getSettings() {
    return this._get({ uri: 'r/' + this.subreddit.display_name + '/wiki/settings/' + this.title });
  }
  /**
  * @summary Edits the settings for this wiki page.
  * @param {object} options
  * @param {boolean} options.listed Determines whether this wiki page should appear on the public list of pages for this
  subreddit.
  * @param {number} options.permissionLevel Determines who should be allowed to access and edit this page `0` indicates that
  this subreddit's default wiki settings should get used, `1` indicates that only approved wiki contributors on this subreddit
  should be able to edit this page, and `2` indicates that only mods should be able to view and edit this page.
  * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
  * @example r.getSubreddit('snoowrap').getWikiPage('index').editSettings({listed: false, permission_level: 1})
  */
  editSettings(_ref) {
    var listed = _ref.listed,
        permission_level = _ref.permission_level,
        _ref$permissionLevel = _ref.permissionLevel,
        permissionLevel = _ref$permissionLevel === undefined ? permission_level : _ref$permissionLevel;

    return this._post({
      uri: 'r/' + this.subreddit.display_name + '/wiki/settings/' + this.title,
      form: { listed, permlevel: permissionLevel }
    }).return(this);
  }
  _modifyEditor(_ref2) {
    var name = _ref2.name,
        action = _ref2.action;

    return this._post({
      uri: 'r/' + this.subreddit.display_name + '/api/wiki/alloweditor/' + action,
      form: { page: this.title, username: name }
    });
  }
  /**
  * @summary Makes the given user an approved editor of this wiki page.
  * @param {object} options
  * @param {string} options.name The name of the user to be added
  * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
  * @example r.getSubreddit('snoowrap').getWikiPage('index').addEditor({name: 'actually_an_aardvark'})
  */
  addEditor(_ref3) {
    var name = _ref3.name;

    return this._modifyEditor({ name, action: 'add' }).return(this);
  }
  /**
  * @summary Revokes this user's approved editor status for this wiki page
  * @param {object} options
  * @param {string} options.name The name of the user to be removed
  * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
  * @example r.getSubreddit('snoowrap').getWikiPage('index').removeEditor({name: 'actually_an_aardvark'})
  */
  removeEditor(_ref4) {
    var name = _ref4.name;

    return this._modifyEditor({ name, action: 'del' }).return(this);
  }
  /**
  * @summary Edits this wiki page, or creates it if it does not exist yet.
  * @param {object} options
  * @param {string} options.text The new content of the page, in markdown.
  * @param {string} [options.reason] The edit reason that will appear in this page's revision history. 256 characters max
  * @param {string} [options.previousRevision] Determines which revision this edit should be added to. If this parameter is
  omitted, this edit is simply added to the most recent revision.
  * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
  * @example r.getSubreddit('snoowrap').getWikiPage('index').edit({text: 'Welcome', reason: 'Added a welcome message'})
  */
  edit(_ref5) {
    var text = _ref5.text,
        reason = _ref5.reason,
        previous_revision = _ref5.previous_revision,
        _ref5$previousRevisio = _ref5.previousRevision,
        previousRevision = _ref5$previousRevisio === undefined ? previous_revision : _ref5$previousRevisio;

    return this._post({
      uri: 'r/' + this.subreddit.display_name + '/api/wiki/edit',
      form: { content: text, page: this.title, previous: previousRevision, reason }
    }).return(this);
  }
  /**
  * @summary Gets a list of revisions for this wiki page.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing revisions of this page
  * @example
  *
  * r.getSubreddit('snoowrap').getRevisions({limit: 1}).then(console.log)
  * // => Listing [
  * //  {
  * //    timestamp: 1460973194,
  * //    reason: 'Added a welcome message',
  * //    author: RedditUser { name: 'not_an_aardvark', id: 'k83md', ... },
  * //    page: 'index',
  * //    id: '506370b4-0508-11e6-b550-0e69f29e0c4d'
  * //  }
  * // ]
  */
  getRevisions(options) {
    return this._getListing({ uri: 'r/' + this.subreddit.display_name + '/wiki/revisions/' + this.title, qs: options });
  }
  /**
  * @summary Hides the given revision from this page's public revision history.
  * @param {object} options
  * @param {string} options.id The revision's id
  * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
  * @example r.getSubreddit('snoowrap').getWikiPage('index').hideRevision({id: '506370b4-0508-11e6-b550-0e69f29e0c4d'})
  */
  hideRevision(_ref6) {
    var id = _ref6.id;

    return this._post({
      uri: 'r/' + this.subreddit.display_name + '/api/wiki/hide',
      qs: { page: this.title, revision: id }
    }).return(this);
  }
  /**
  * @summary Reverts this wiki page to the given point.
  * @param {object} options
  * @param {string} options.id The id of the revision that this page should be reverted to
  * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
  * @example r.getSubreddit('snoowrap').getWikiPage('index').revert({id: '506370b4-0508-11e6-b550-0e69f29e0c4d'})
  */
  revert(_ref7) {
    var id = _ref7.id;

    return this._post({
      uri: 'r/' + this.subreddit.display_name + '/api/wiki/revert',
      qs: { page: this.title, revision: id }
    }).return(this);
  }
  /**
  * @summary Gets a list of discussions about this wiki page.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing discussions about this page
  * @example
  *
  * r.getSubreddit('snoowrap').getWikiPage('index').getDiscussions().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getDiscussions(options) {
    return this._getListing({ uri: 'r/' + this.subreddit.display_name + '/wiki/discussions/' + this.title, qs: options });
  }
};

exports.default = WikiPage;
},{"./RedditContent.js":13}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _RedditContent = require('./RedditContent.js');

Object.defineProperty(exports, 'RedditContent', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_RedditContent).default;
  }
});

var _ReplyableContent = require('./ReplyableContent.js');

Object.defineProperty(exports, 'ReplyableContent', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_ReplyableContent).default;
  }
});

var _VoteableContent = require('./VoteableContent.js');

Object.defineProperty(exports, 'VoteableContent', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_VoteableContent).default;
  }
});

var _Comment = require('./Comment.js');

Object.defineProperty(exports, 'Comment', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_Comment).default;
  }
});

var _RedditUser = require('./RedditUser.js');

Object.defineProperty(exports, 'RedditUser', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_RedditUser).default;
  }
});

var _Submission = require('./Submission.js');

Object.defineProperty(exports, 'Submission', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_Submission).default;
  }
});

var _LiveThread = require('./LiveThread.js');

Object.defineProperty(exports, 'LiveThread', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_LiveThread).default;
  }
});

var _PrivateMessage = require('./PrivateMessage.js');

Object.defineProperty(exports, 'PrivateMessage', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_PrivateMessage).default;
  }
});

var _Subreddit = require('./Subreddit.js');

Object.defineProperty(exports, 'Subreddit', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_Subreddit).default;
  }
});

var _MultiReddit = require('./MultiReddit.js');

Object.defineProperty(exports, 'MultiReddit', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_MultiReddit).default;
  }
});

var _WikiPage = require('./WikiPage.js');

Object.defineProperty(exports, 'WikiPage', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_WikiPage).default;
  }
});

var _Listing = require('./Listing.js');

Object.defineProperty(exports, 'Listing', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_Listing).default;
  }
});

var _More = require('./More.js');

Object.defineProperty(exports, 'More', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_More).default;
  }
});

var _UserList = require('./UserList.js');

Object.defineProperty(exports, 'UserList', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_UserList).default;
  }
});

var _ModmailConversation = require('./ModmailConversation.js');

Object.defineProperty(exports, 'ModmailConversation', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_ModmailConversation).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
},{"./Comment.js":6,"./Listing.js":7,"./LiveThread.js":8,"./ModmailConversation.js":9,"./More.js":10,"./MultiReddit.js":11,"./PrivateMessage.js":12,"./RedditContent.js":13,"./RedditUser.js":14,"./ReplyableContent.js":15,"./Submission.js":16,"./Subreddit.js":17,"./UserList.js":18,"./VoteableContent.js":19,"./WikiPage.js":20}],22:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rawRequest = undefined;

var _merge2 = require('lodash/merge');

var _merge3 = _interopRequireDefault(_merge2);

var _includes2 = require('lodash/includes');

var _includes3 = _interopRequireDefault(_includes2);

exports.oauthRequest = oauthRequest;
exports._awaitExponentialBackoff = _awaitExponentialBackoff;
exports._awaitRatelimit = _awaitRatelimit;
exports._awaitRequestDelay = _awaitRequestDelay;
exports.credentialedClientRequest = credentialedClientRequest;
exports.unauthenticatedRequest = unauthenticatedRequest;
exports.updateAccessToken = updateAccessToken;

var _Promise = require('./Promise.js');

var _Promise2 = _interopRequireDefault(_Promise);

var _constants = require('./constants.js');

var _errors = require('./errors.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
* @summary Sends an oauth-authenticated request to the reddit server, and returns the server's response.
* @desc **Note**: While this function primarily exists for internal use, it is exposed and considered a stable feature.
However, keep in mind that there are usually better alternatives to using this function. For instance, this
function can be used to send a POST request to the 'api/vote' endpoint in order to upvote a comment, but it's generally
easier to just use snoowrap's [upvote function]{@link VoteableContent#upvote}.
*
* If you're using this function to access an API feature/endpoint that is unsupported by snoowrap, please consider [creating an
issue for it](https://github.com/not-an-aardvark/snoowrap/issues) so that the functionality can be added to snoowrap more
directly.
* @param {object} options Options for the request. For documentation on these options, see the
[Request API](https://www.npmjs.com/package/request). Supported options include `uri`, `qs`, `form`, `headers`, `method`,
`auth`, and `body`. A default `baseUrl` parameter of `this.config().endpoint_domain` is internally included by default, so it
is recommended that a `uri` parameter be used, rather than a `url` parameter with a
domain name.
* @returns {Promise} A Promise that fulfills with reddit's response.
* @memberof snoowrap
* @instance
* @example
*
* r.oauthRequest({uri: '/user/spez/about', method: 'get'}).then(console.log)
* // => RedditUser { name: 'spez', link_karma: 9567, ... }
*
* // Note that this is equivalent to:
* r.getUser('spez').fetch().then(console.log)
*
* // ######
*
* r.oauthRequest({uri: '/api/vote', method: 'post', form: {dir: 1, id: 't3_4fzg2k'}})
* // equivalent to:
* r.getSubmission('4fzg2k').upvote()
*
* // ######
*
* r.oauthRequest({uri: '/top', method: 'get', qs: {t: 'all'}})
* // equivalent to:
* r.getTop({time: 'all'})
*/
function oauthRequest(options) {
  var _Promise$resolve$then,
      _this = this;

  var attempts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

  return (_Promise$resolve$then = _Promise2.default.resolve().then(function () {
    return _this._awaitRatelimit();
  }).then(function () {
    return _this._awaitRequestDelay();
  }).then(function () {
    return _awaitExponentialBackoff(attempts);
  }).then(function () {
    return _this.updateAccessToken();
  }).then(function (token) {
    return _this.rawRequest((0, _merge3.default)({
      json: true,
      headers: { 'user-agent': _this.userAgent },
      baseUrl: 'https://oauth.' + _this._config.endpointDomain,
      qs: { raw_json: 1 },
      auth: { bearer: token },
      resolveWithFullResponse: true,
      timeout: _this._config.requestTimeout,
      transform: function (body, response) {
        if (Object.prototype.hasOwnProperty.call(response.headers, 'x-ratelimit-remaining')) {
          _this.ratelimitRemaining = +response.headers['x-ratelimit-remaining'];
          _this.ratelimitExpiration = Date.now() + response.headers['x-ratelimit-reset'] * 1000;
        }
        _this._debug('Received a ' + response.statusCode + ' status code from a `' + response.request.method + '` request', 'sent to ' + response.request.uri.href + '. ratelimitRemaining: ' + _this.ratelimitRemaining);
        return response;
      }
    }, options));
  }).then(function (response) {
    var populated = _this._populate(response.body);
    if (populated && populated.constructor._name === 'Listing') {
      populated._setUri(response.request.uri.href);
    }
    return populated;
  })).catch.apply(_Promise$resolve$then, _toConsumableArray(this._config.retryErrorCodes.map(function (retryCode) {
    return { statusCode: retryCode };
  })).concat([function (e) {
    if (!(0, _includes3.default)(_constants.IDEMPOTENT_HTTP_VERBS, e.response.request.method) || attempts >= _this._config.maxRetryAttempts) {
      throw e;
    }
    /* If the error's status code is in the user's configured `retryStatusCodes` and this request still has attempts
    remaining, retry this request and increment the `attempts` counter. */
    _this._warn('Received status code ' + e.statusCode + ' from reddit.', 'Retrying request (attempt ' + (attempts + 1) + '/' + _this._config.maxRetryAttempts + ')...');
    return _this.oauthRequest(options, attempts + 1);
  }])).catch({ statusCode: 401 }, function (e) {
    /* If the server returns a 401 error, it's possible that the access token expired during the latency period as this
    request was being sent. In this scenario, snoowrap thought that the access token was valid for a few more seconds, so it
    didn't refresh the token, but the token had expired by the time the request reached the server. To handle this issue,
    invalidate the access token and call oauth_request again, automatically causing the token to be refreshed. */
    if (_this.accessToken && _this.tokenExpiration - Date.now() < _constants.MAX_TOKEN_LATENCY) {
      _this.accessToken = null;
      _this.tokenExpiration = null;
      return _this.oauthRequest(options, attempts);
    }
    throw e;
  });
}

function _awaitExponentialBackoff(attempts) {
  if (attempts === 1) {
    return _Promise2.default.resolve();
  }

  return _Promise2.default.delay((Math.pow(2, attempts - 1) + (Math.random() - 0.3)) * 1000);
}

function _awaitRatelimit() {
  if (this.ratelimitRemaining < 1 && Date.now() < this.ratelimitExpiration) {
    // If the ratelimit has been exceeded, delay or abort the request depending on the user's config.
    var timeUntilExpiry = this.ratelimitExpiration - Date.now();
    if (this._config.continueAfterRatelimitError) {
      /* If the `continue_after_ratelimit_error` setting is enabled, queue the request, wait until the next ratelimit
      period, and then send it. */
      this._warn((0, _errors.rateLimitWarning)(timeUntilExpiry));
      return _Promise2.default.delay(timeUntilExpiry);
    }
    // Otherwise, throw an error.
    throw new _errors.RateLimitError(timeUntilExpiry);
  }
  // If the ratelimit hasn't been exceeded, no delay is necessary.
  return _Promise2.default.resolve();
}

function _awaitRequestDelay() {
  var now = Date.now();
  var waitTime = this._nextRequestTimestamp - now;
  this._nextRequestTimestamp = Math.max(now, this._nextRequestTimestamp) + this._config.requestDelay;
  return _Promise2.default.delay(waitTime);
}

/**
* @summary Sends a request to the reddit server, authenticated with the user's client ID and client secret.
* @desc **Note**: This is used internally as part of the authentication process, but it cannot be used to actually fetch
content from reddit. To do that, use {@link snoowrap#oauthRequest} or another of snoowrap's helper functions.
*
* This function can work with alternate `this`-bindings, provided that the binding has the `clientId`, `clientSecret`, and
`userAgent` properties. This allows it be used if no snoowrap requester has been created yet.
* @param {object|string} options Options for the request; these are passed directly to the
[Request API](https://www.npmjs.com/package/request).
* @returns {Promise} The response from the reddit server
* @example
*
* // example: this function could be used to exchange a one-time authentication code for a refresh token.
snoowrap.prototype.credentialedClientRequest.call({
  clientId: 'client id goes here',
  clientSecret: 'client secret goes here',
  userAgent: 'user agent goes here'
}, {
  method: 'post',
  baseUrl: 'https://www.reddit.com',
  uri: 'api/v1/access_token',
  form: {grant_type: 'authorization_code', code: 'code goes here', redirect_uri: 'redirect uri goes here'}
}).then(response => {
  //handle response here
})
* @memberof snoowrap
* @instance
*/
function credentialedClientRequest(options) {
  var requestFunc = this.rawRequest || rawRequest;
  return _Promise2.default.resolve(requestFunc.call(this, (0, _merge3.default)({
    json: true,
    auth: { user: this.clientId || this.client_id || '', pass: this.clientSecret || this.client_secret || '' },
    headers: { 'user-agent': this.userAgent },
    baseUrl: this._config ? 'https://www.' + this._config.endpointDomain : undefined
  }, options)));
}

/**
* @summary Sends a request to the reddit server without authentication.
* @param {object|string} options Options for the request; these are passed directly to the
[Request API](https://www.npmjs.com/package/request).
* @returns {Promise} The response from the reddit server
* @memberof snoowrap
* @instance
*/
function unauthenticatedRequest(options) {
  return _Promise2.default.resolve(this.rawRequest((0, _merge3.default)({
    json: true,
    headers: { 'user-agent': this.userAgent },
    baseUrl: 'https://www.' + this._config.endpointDomain
  }, options)));
}

/**
* @summary Updates this requester's access token if the current one is absent or expired.
* @desc **Note**: This function is automatically called internally when making a request. While the function is exposed as
a stable feature, using it is rarely necessary unless an access token is needed for some external purpose.
* @returns {Promise} A Promise that fulfills with the access token when this request is complete
* @memberof snoowrap
* @instance
* @example r.updateAccessToken()
*/
function updateAccessToken() {
  var _this2 = this;

  // If the current access token is missing or expired, and it is possible to get a new one, do so.
  if ((!this.accessToken || Date.now() > this.tokenExpiration) && (this.refreshToken || this.username && this.password)) {
    return this.credentialedClientRequest({
      method: 'post',
      uri: 'api/v1/access_token',
      form: this.refreshToken ? { grant_type: 'refresh_token', refresh_token: this.refreshToken } : { grant_type: 'password', username: this.username, password: this.password }
    }).then(function (tokenInfo) {
      _this2.accessToken = tokenInfo.access_token;
      _this2.tokenExpiration = Date.now() + tokenInfo.expires_in * 1000;
      if (tokenInfo.error === 'invalid_grant') {
        throw new Error('"Invalid grant" error returned from reddit. (You might have incorrect credentials.)');
      } else if (tokenInfo.error_description !== undefined) {
        throw new Error('Reddit returned an error: ' + tokenInfo.error + ': ' + tokenInfo.error_description);
      } else if (tokenInfo.error !== undefined) {
        throw new Error('Reddit returned an error: ' + tokenInfo.error);
      }
      _this2.scope = tokenInfo.scope.split(' ');
      return _this2.accessToken;
    });
  }
  // Otherwise, just return the existing token.
  return _Promise2.default.resolve(this.accessToken);
}

/**
* @function
* @name rawRequest
* @summary Sends an HTTP request
* @desc **Note**: This function is called internally whenever snoowrap makes a request. You generally should not call this
* function directly; use {@link snoowrap#oauthRequest} or another snoowrap function instead.
*
* This method allows snoowrap's request behavior to be customized via subclassing. If you create a snoowrap subclass and shadow
* this method, all requests from snoowrap will pass through it.
*
* To ensure that all other snoowrap methods work correctly, the API for a shadowed version of this method must match the API for
* the original `makeRequest` method. This method is based on the API of the
* [request-promise](https://www.npmjs.com/package/request-promise) library, so if you do create a subclass, it might be helpful
* to use `request-promise` internally. This will ensure that the API works correctly, so that you don't have to reimplement this
* function's API from scratch.
*
* @param {object} options Options for the request
* @param {boolean} options.json If `true`, the `Content-Type: application/json` header is added, and the response body will be
* parsed as JSON automatically.
* @param {string} options.baseUrl The base URL that a request should be sent to
* @param {string} options.uri The uri that a request should be sent to, using the provided `baseUrl`.
* @param {string} options.method='GET' Method for the request
* @param {object} options.headers Headers for the request
* @param {object} [options.qs] Querystring parameters for the request
* @param {object} [options.form] Form data for the request. If provided, the `Content-Type: application/x-www-form-urlencoded`
* header is set, and the provided object is serialized into URL-encoded form data in the request body.
* @param {object} [options.formData] Multipart form data for the request. If provided, the `Content-Type: multipart/form-data`
* header is set, and the provided object is serialized as multipart form data.
* @param {object} [options.body] The body of the request. Should be converted to a string with JSON.stringify(). This is ignored
* for GET requests, or of `options.form` or `options.formData` are provided.
* @param {Function} [options.transform] A function that is called before the response Promise fulfills. Accepts two parameters:
* `response.body` and `response`. This function should be called regardless of the status code of the response, and the returned
* Promise from `makeRequest` should fulfill with its return value.
* @param {boolean} [options.resolveWithFullResponse=false] If `true`, a Promise for the entire response is returned. If `false`,
* a Promise for only the response body is returned. This is ignored if an `options.transform` function is provided.
* @returns {Promise} A Promise for a response object. Depending on `options.transform` and `options.resolveWithFullResponse`,
* the Promise should settle with either the response object itself, the body of the response, or the value returned by
* `options.transform`. The Promise should be fulfilled if the status code is between 200 and 299, inclusive, and reject
* otherwise. (If a redirect is returned from the server, the function should follow the redirect if possible, otherwise reject
* with an error.) A response object has 4 properties: `statusCode` (number) the status code of the response, `body` (object)
* the body of the response, `headers` (object) the parsed response headers, and `request` (object) an object of the form
* `{method: 'GET', uri: {href: 'https://oauth.reddit.com/full/url'}}` representing information about the original request.
* @memberof snoowrap
* @instance
* @example
*
* const snoowrap = require('snoowrap');
*
* class SnoowrapSubclass extends snoowrap {
*   rawRequest(options) {
*     // do custom behavior with `options` if you want, then call the regular rawRequest function
*     console.log(`made a request with options:`);
*     console.log(options);
*     return super.rawRequest(options)
*   }
* }
*
* const request = require('request-promise');
*
* class AnotherSnoowrapSubclass extends snoowrap {
*   rawRequest(options) {
*     // send all requests through a proxy
*     return request(Object.assign(options, {proxy: 'https://example.com'}))
*   }
* }
*/
var rawRequest = exports.rawRequest = typeof XMLHttpRequest !== 'undefined' ? require('./xhr') : require('request-promise').defaults({ gzip: true });
},{"./Promise.js":1,"./constants.js":2,"./errors.js":4,"./xhr":24,"lodash/includes":252,"lodash/merge":276,"request-promise":27}],23:[function(require,module,exports){
(function (global){
'use strict';

var _values2 = require('lodash/values');

var _values3 = _interopRequireDefault(_values2);

var _snakeCase2 = require('lodash/snakeCase');

var _snakeCase3 = _interopRequireDefault(_snakeCase2);

var _omitBy2 = require('lodash/omitBy');

var _omitBy3 = _interopRequireDefault(_omitBy2);

var _omit2 = require('lodash/omit');

var _omit3 = _interopRequireDefault(_omit2);

var _mapValues2 = require('lodash/mapValues');

var _mapValues3 = _interopRequireDefault(_mapValues2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _includes2 = require('lodash/includes');

var _includes3 = _interopRequireDefault(_includes2);

var _forOwn2 = require('lodash/forOwn');

var _forOwn3 = _interopRequireDefault(_forOwn2);

var _defaults2 = require('lodash/defaults');

var _defaults3 = _interopRequireDefault(_defaults2);

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _Promise = require('./Promise.js');

var _Promise2 = _interopRequireDefault(_Promise);

var _promiseChains = require('promise-chains');

var _promiseChains2 = _interopRequireDefault(_promiseChains);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _request_handler = require('./request_handler.js');

var requestHandler = _interopRequireWildcard(_request_handler);

var _constants = require('./constants.js');

var _errors = require('./errors.js');

var errors = _interopRequireWildcard(_errors);

var _helpers = require('./helpers.js');

var _create_config = require('./create_config.js');

var _create_config2 = _interopRequireDefault(_create_config);

var _index = require('./objects/index.js');

var objects = _interopRequireWildcard(_index);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var api_type = 'json';

/** The class for a snoowrap requester.
 * A requester is the base object that is used to fetch content from reddit. Each requester contains a single set of OAuth
 tokens.

 If constructed with a refresh token, a requester will be able to repeatedly generate access tokens as necessary, without any
 further user intervention. After making at least one request, a requester will have the `access_token` property, which specifies
 the access token currently in use. It will also have a few additional properties such as `scope` (an array of scope strings)
 and `ratelimitRemaining` (the number of requests remaining for the current 10-minute interval, in compliance with reddit's
 [API rules](https://github.com/reddit/reddit/wiki/API).) These properties primarily exist for internal use, but they are
 exposed since they are useful externally as well.
 */
var snoowrap = class snoowrap {
  /**
   * @summary Constructs a new requester.
   * @desc You should use the snoowrap constructor if you are able to authorize a reddit account in advance (e.g. for a Node.js
   script that always uses the same account). If you aren't able to authorize in advance (e.g. acting through an arbitrary user's
   account while running snoowrap in a browser), then you should use {@link snoowrap.getAuthUrl} and
   {@link snoowrap.fromAuthCode} instead.
   *
   * snoowrap supports several different options for pre-existing authentication:
   * 1. *Refresh token*: To authenticate with a refresh token, pass an object with the properties `userAgent`, `clientId`,
   `clientSecret`, and `refreshToken` to the snoowrap constructor. You will need to get the refresh token from reddit
   beforehand. A script to automatically generate refresh tokens for you can be found
   [here](https://github.com/not-an-aardvark/reddit-oauth-helper).
   * 1. *Username/password*: To authenticate with a username and password, pass an object with the properties `userAgent`,
   `clientId`, `clientSecret`, `username`, and `password` to the snoowrap constructor. Note that username/password
   authentication is only possible for `script`-type apps.
   * 1. *Access token*: To authenticate with an access token, pass an object with the properties `userAgent` and `accessToken`
   to the snoowrap constructor. Note that all access tokens expire one hour after being generated, so this method is
   not recommended for long-term use.
   * @param {object} options An object containing authentication options. This should always have the property `userAgent`. It
   must also contain some combination of credentials (see above)
   * @param {string} options.userAgent A unique description of what your app does. This argument is not necessary when snoowrap
   is running in a browser.
   * @param {string} [options.clientId] The client ID of your app (assigned by reddit)
   * @param {string} [options.clientSecret] The client secret of your app (assigned by reddit). If you are using a refresh token
   with an installed app (which does not have a client secret), pass an empty string as your `clientSecret`.
   * @param {string} [options.username] The username of the account to access
   * @param {string} [options.password] The password of the account to access
   * @param {string} [options.refreshToken] A refresh token for your app
   * @param {string} [options.accessToken] An access token for your app
   */
  constructor() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        user_agent = _ref.user_agent,
        _ref$userAgent = _ref.userAgent,
        userAgent = _ref$userAgent === undefined ? user_agent : _ref$userAgent,
        client_id = _ref.client_id,
        _ref$clientId = _ref.clientId,
        clientId = _ref$clientId === undefined ? client_id : _ref$clientId,
        client_secret = _ref.client_secret,
        _ref$clientSecret = _ref.clientSecret,
        clientSecret = _ref$clientSecret === undefined ? client_secret : _ref$clientSecret,
        refresh_token = _ref.refresh_token,
        _ref$refreshToken = _ref.refreshToken,
        refreshToken = _ref$refreshToken === undefined ? refresh_token : _ref$refreshToken,
        access_token = _ref.access_token,
        _ref$accessToken = _ref.accessToken,
        accessToken = _ref$accessToken === undefined ? access_token : _ref$accessToken,
        username = _ref.username,
        password = _ref.password;

    if (!userAgent && !_helpers.isBrowser) {
      return (0, _helpers.requiredArg)('userAgent');
    }
    if ((!accessToken || typeof accessToken !== 'string') && (clientId === undefined || clientSecret === undefined || typeof refreshToken !== 'string') && (clientId === undefined || clientSecret === undefined || username === undefined || password === undefined)) {
      throw new errors.NoCredentialsError();
    }
    if (_helpers.isBrowser) {
      this.userAgent = global.navigator.userAgent;
    }
    (0, _defaults3.default)(this, { userAgent, clientId, clientSecret, refreshToken, accessToken, username, password }, {
      clientId: null,
      clientSecret: null,
      refreshToken: null,
      accessToken: null,
      username: null,
      password: null,
      ratelimitRemaining: null,
      ratelimitExpiration: null,
      tokenExpiration: null,
      scope: null,
      _config: (0, _create_config2.default)(),
      _nextRequestTimestamp: -Infinity
    });
    (0, _helpers.addSnakeCaseShadowProps)(this);
  }

  /**
   * @summary Gets an authorization URL, which allows a user to authorize access to their account
   * @desc This create a URL where a user can authorize an app to act through their account. If the user visits the returned URL
   in a web browser, they will see a page that looks like [this](https://i.gyazo.com/0325534f38b78c1dbd4c84d690dda6c2.png). If
   the user clicks "Allow", they will be redirected to your `redirectUri`, with a `code` querystring parameter containing an
   * *authorization code*. If this code is passed to {@link snoowrap.fromAuthCode}, you can create a requester to make
   requests on behalf of the user.
   *
   * The main use-case here is for running snoowrap in a browser. You can generate a URL, send the user there, and then continue
   after the user authenticates on reddit and is redirected back.
   *
   * @param {object} options
   * @param {string} options.clientId The client ID of your app (assigned by reddit). If your code is running clientside in a
   browser, using an "Installed" app type is recommended.
   * @param {string[]} options.scope An array of scopes (permissions on the user's account) to request on the authentication
   page. A list of possible scopes can be found [here](https://www.reddit.com/api/v1/scopes). You can also get them on-the-fly
   with {@link snoowrap#getOauthScopeList}.
   * @param {string} options.redirectUri The URL where the user should be redirected after authenticating. This **must** be the
   same as the redirect URI that is configured for the reddit app. (If there is a mismatch, the returned URL will display an
   error page instead of an authentication form.)
   * @param {boolean} options.permanent=true If `true`, the app will have indefinite access to the user's account. If `false`,
   access to the user's account will expire after 1 hour.
   * @param {string} [options.state] A string that can be used to verify a user after they are redirected back to the site. When
   the user is redirected from reddit, to the redirect URI after authenticating, the resulting URI will have this same `state`
   value in the querystring. (See [here](http://www.twobotechnologies.com/blog/2014/02/importance-of-state-in-oauth2.html) for
   more information on how to use the `state` value.)
   * @param {string} [options.endpointDomain='reddit.com'] The endpoint domain for the URL. If the user is authenticating on
   reddit.com (as opposed to some other site with a reddit-like API), you can omit this value.
   * @returns {string} A URL where the user can authenticate with the given options
   * @example
   *
   * var authenticationUrl = snoowrap.getAuthUrl({
   *   clientId: 'foobarbazquuux',
   *   scope: ['identity', 'wikiread', 'wikiedit'],
   *   redirectUri: 'https://example.com/reddit_callback',
   *   permanent: false,
   *   state: 'fe211bebc52eb3da9bef8db6e63104d3' // a random string, this could be validated when the user is redirected back
   * });
   * // --> 'https://www.reddit.com/api/v1/authorize?client_id=foobarbaz&response_type=code&state= ...'
   *
   * window.location = authenticationUrl; // send the user to the authentication url
   */
  static getAuthUrl(_ref2) {
    var _ref2$clientId = _ref2.clientId,
        clientId = _ref2$clientId === undefined ? (0, _helpers.requiredArg)('clientId') : _ref2$clientId,
        _ref2$scope = _ref2.scope,
        scope = _ref2$scope === undefined ? (0, _helpers.requiredArg)('scope') : _ref2$scope,
        _ref2$redirectUri = _ref2.redirectUri,
        redirectUri = _ref2$redirectUri === undefined ? (0, _helpers.requiredArg)('redirectUri') : _ref2$redirectUri,
        _ref2$permanent = _ref2.permanent,
        permanent = _ref2$permanent === undefined ? true : _ref2$permanent,
        _ref2$state = _ref2.state,
        state = _ref2$state === undefined ? '_' : _ref2$state,
        _ref2$endpointDomain = _ref2.endpointDomain,
        endpointDomain = _ref2$endpointDomain === undefined ? 'reddit.com' : _ref2$endpointDomain;

    if (!(Array.isArray(scope) && scope.length && scope.every(function (scopeValue) {
      return scopeValue && typeof scopeValue === 'string';
    }))) {
      throw new TypeError('Missing `scope` argument; a non-empty list of OAuth scopes must be provided');
    }
    return ('\n      https://www.' + endpointDomain + '/api/v1/authorize?\n      client_id=' + encodeURIComponent(clientId) + '\n      &response_type=code\n      &state=' + encodeURIComponent(state) + '\n      &redirect_uri=' + encodeURIComponent(redirectUri) + '\n      &duration=' + (permanent ? 'permanent' : 'temporary') + '\n      &scope=' + encodeURIComponent(scope.join(' ')) + '\n    ').replace(/\s/g, '');
  }

  /**
   * @summary Creates a snoowrap requester from an authorization code.
   * @desc An authorization code is the `code` value that appears in the querystring after a user authenticates with reddit and
   is redirected. For more information, see {@link snoowrap.getAuthUrl}.
   *
   * The main use-case for this function is for running snoowrap in a browser. You can generate a URL with
   {@link snoowrap.getAuthUrl} and send the user to that URL, and then use this function to create a requester when
   the user is redirected back with an authorization code.
   * @param {object} options
   * @param {string} options.code The authorization code
   * @param {string} options.userAgent A unique description of what your app does. This argument is not necessary when snoowrap
   is running in a browser.
   * @param {string} options.clientId The client ID of your app (assigned by reddit). If your code is running clientside in a
   browser, using an "Installed" app type is recommended.
   * @param {string} [options.clientSecret] The client secret of your app. If your app has the "Installed" app type, omit
   this parameter.
   * @param {string} options.redirectUri The redirect URI that is configured for the reddit app.
   * @param {string} [options.endpointDomain='reddit.com'] The endpoint domain that the returned requester should be configured
   to use. If the user is authenticating on reddit.com (as opposed to some other site with a reddit-like API), you can omit this
   value.
   * @returns {Promise} A Promise that fulfills with a `snoowrap` instance
   * @example
   *
   * // Get the `code` querystring param (assuming the user was redirected from reddit)
   * var code = new URL(window.location.href).searchParams.get('code');
   *
   * snoowrap.fromAuthCode({
   *   code: code,
   *   userAgent: 'My app',
   *   clientId: 'foobarbazquuux',
   *   redirectUri: 'example.com'
   * }).then(r => {
   *   // Now we have a requester that can access reddit through the user's account
   *   return r.getHot().then(posts => {
   *     // do something with posts from the front page
   *   });
   * })
   */
  static fromAuthCode(_ref3) {
    var _this = this;

    var _ref3$code = _ref3.code,
        code = _ref3$code === undefined ? (0, _helpers.requiredArg)('code') : _ref3$code,
        _ref3$userAgent = _ref3.userAgent,
        userAgent = _ref3$userAgent === undefined ? _helpers.isBrowser ? global.navigator.userAgent : (0, _helpers.requiredArg)('userAgent') : _ref3$userAgent,
        _ref3$clientId = _ref3.clientId,
        clientId = _ref3$clientId === undefined ? (0, _helpers.requiredArg)('clientId') : _ref3$clientId,
        clientSecret = _ref3.clientSecret,
        _ref3$redirectUri = _ref3.redirectUri,
        redirectUri = _ref3$redirectUri === undefined ? (0, _helpers.requiredArg)('redirectUri') : _ref3$redirectUri,
        _ref3$endpointDomain = _ref3.endpointDomain,
        endpointDomain = _ref3$endpointDomain === undefined ? 'reddit.com' : _ref3$endpointDomain;

    return this.prototype.credentialedClientRequest.call({
      userAgent,
      clientId,
      clientSecret,
      // Use `this.prototype.rawRequest` function to allow for custom `rawRequest` method usage in subclasses.
      rawRequest: this.prototype.rawRequest
    }, {
      method: 'post',
      baseUrl: 'https://www.' + endpointDomain + '/',
      uri: 'api/v1/access_token',
      form: { grant_type: 'authorization_code', code, redirect_uri: redirectUri }
    }).then(function (response) {
      if (response.error) {
        throw new Error('API Error: ' + response.error);
      }
      // Use `new this` instead of `new snoowrap` to ensure that subclass instances can be returned
      var requester = new _this(_extends({ userAgent, clientId, clientSecret }, response));
      requester.config({ endpointDomain });
      return requester;
    });
  }

  _newObject(objectType, content) {
    var _hasFetched = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    return Array.isArray(content) ? content : new snoowrap.objects[objectType](content, this, _hasFetched);
  }

  /**
   * @summary Retrieves or modifies the configuration options for this requester.
   * @param {object} [options] A map of `{[config property name]: value}`. Note that any omitted config properties will simply
   retain whatever value they had previously. (In other words, if you only want to change one property, you only need to put
   that one property in this parameter. To get the current configuration without modifying anything, simply omit this
   parameter.)
   * @param {string} [options.endpointDomain='reddit.com'] The endpoint where requests should be sent
   * @param {Number} [options.requestDelay=0] A minimum delay, in milliseconds, to enforce between API calls. If multiple
   api calls are requested during this timespan, they will be queued and sent one at a time. Setting this to more than 1000 will
   ensure that reddit's ratelimit is never reached, but it will make things run slower than necessary if only a few requests
   are being sent. If this is set to zero, snoowrap will not enforce any delay between individual requests. However, it will
   still refuse to continue if reddit's enforced ratelimit (600 requests per 10 minutes) is exceeded.
   * @param {Number} [options.requestTimeout=30000] A timeout for all OAuth requests, in milliseconds. If the reddit server
   fails to return a response within this amount of time, the Promise will be rejected with a timeout error.
   * @param {boolean} [options.continueAfterRatelimitError=false] Determines whether snoowrap should queue API calls if
   reddit's ratelimit is exceeded. If set to `true` when the ratelimit is exceeded, snoowrap will queue all further requests,
   and will attempt to send them again after the current ratelimit period expires (which happens every 10 minutes). If set
   to `false`, snoowrap will simply throw an error when reddit's ratelimit is exceeded.
   * @param {Number[]} [options.retryErrorCodes=[502, 503, 504, 522]] If reddit responds to an idempotent request with one of
   these error codes, snoowrap will retry the request, up to a maximum of `max_retry_attempts` requests in total. (These
   errors usually indicate that there was an temporary issue on reddit's end, and retrying the request has a decent chance of
   success.) This behavior can be disabled by simply setting this property to an empty array.
   * @param {Number} [options.maxRetryAttempts=3] See `retryErrorCodes`.
   * @param {boolean} [options.warnings=true] snoowrap may occasionally log warnings, such as deprecation notices, to the
   console. These can be disabled by setting this to `false`.
   * @param {boolean} [options.debug=false] If set to true, snoowrap will print out potentially-useful information for debugging
   purposes as it runs.
   * @param {boolean} [options.proxies=true] Setting this to `false` disables snoowrap's method-chaining feature. This causes
   the syntax for using snoowrap to become a bit heavier, but allows for consistency between environments that support the ES6
   `Proxy` object and environments that don't. This option is a no-op in environments that don't support the `Proxy` object,
   since method chaining is always disabled in those environments.
   * @returns {object} An updated Object containing all of the configuration values
   * @example
   *
   * r.config({requestDelay: 1000, warnings: false});
   * // sets the request delay to 1000 milliseconds, and suppresses warnings.
   */
  config() {
    var _this2 = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var invalidKey = Object.keys(options).find(function (key) {
      return !(key in _this2._config);
    });
    if (invalidKey) {
      throw new TypeError('Invalid config option \'' + invalidKey + '\'');
    }
    return Object.assign(this._config, options);
  }

  _warn() {
    if (this._config.warnings) {
      var _console;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      (_console = console).warn.apply(_console, ['[warning]'].concat(args)); // eslint-disable-line no-console
    }
  }

  _debug() {
    if (this._config.debug) {
      var _console2;

      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      (_console2 = console).log.apply(_console2, ['[debug]'].concat(args)); // eslint-disable-line no-console
    }
  }

  get _promiseWrap() {
    return this._config.proxies ? _promiseChains2.default : identity;
  }

  /**
   * @summary Gets information on a reddit user with a given name.
   * @param {string} name - The user's username
   * @returns {RedditUser} An unfetched RedditUser object for the requested user
   * @example
   *
   * r.getUser('not_an_aardvark')
   * // => RedditUser { name: 'not_an_aardvark' }
   * r.getUser('not_an_aardvark').link_karma.then(console.log)
   * // => 6
   */
  getUser(name) {
    return this._newObject('RedditUser', { name: (name + '').replace(/^\/?u\//, '') });
  }

  /**
   * @summary Gets information on a comment with a given id.
   * @param {string} commentId - The base36 id of the comment
   * @returns {Comment} An unfetched Comment object for the requested comment
   * @example
   *
   * r.getComment('c0b6xx0')
   * // => Comment { name: 't1_c0b6xx0' }
   * r.getComment('c0b6xx0').author.name.then(console.log)
   * // => 'Kharos'
   */
  getComment(commentId) {
    return this._newObject('Comment', { name: (0, _helpers.addFullnamePrefix)(commentId, 't1_') });
  }

  /**
   * @summary Gets information on a given subreddit.
   * @param {string} displayName - The name of the subreddit (e.g. 'AskReddit')
   * @returns {Subreddit} An unfetched Subreddit object for the requested subreddit
   * @example
   *
   * r.getSubreddit('AskReddit')
   * // => Subreddit { display_name: 'AskReddit' }
   * r.getSubreddit('AskReddit').created_utc.then(console.log)
   * // => 1201233135
   */
  getSubreddit(displayName) {
    return this._newObject('Subreddit', { display_name: displayName.replace(/^\/?r\//, '') });
  }

  /**
   * @summary Gets information on a given submission.
   * @param {string} submissionId - The base36 id of the submission
   * @returns {Submission} An unfetched Submission object for the requested submission
   * @example
   *
   * r.getSubmission('2np694')
   * // => Submission { name: 't3_2np694' }
   * r.getSubmission('2np694').title.then(console.log)
   * // => 'What tasty food would be distusting if eaten over rice?'
   */
  getSubmission(submissionId) {
    return this._newObject('Submission', { name: (0, _helpers.addFullnamePrefix)(submissionId, 't3_') });
  }

  /**
   * @summary Gets a private message by ID.
   * @param {string} messageId The base36 ID of the message
   * @returns {PrivateMessage} An unfetched PrivateMessage object for the requested message
   * @example
   *
   * r.getMessage('51shnw')
   * // => PrivateMessage { name: 't4_51shnw' }
   * r.getMessage('51shnw').subject.then(console.log)
   * // => 'Example'
   * // See here for a screenshot of the PM in question https://i.gyazo.com/24f3b97e55b6ff8e3a74cb026a58b167.png
   */
  getMessage(messageId) {
    return this._newObject('PrivateMessage', { name: (0, _helpers.addFullnamePrefix)(messageId, 't4_') });
  }

  /**
   * Gets a livethread by ID.
   * @param {string} threadId The base36 ID of the livethread
   * @returns {LiveThread} An unfetched LiveThread object
   * @example
   *
   * r.getLivethread('whrdxo8dg9n0')
   * // => LiveThread { id: 'whrdxo8dg9n0' }
   * r.getLivethread('whrdxo8dg9n0').nsfw.then(console.log)
   * // => false
   */
  getLivethread(threadId) {
    return this._newObject('LiveThread', { id: (0, _helpers.addFullnamePrefix)(threadId, 'LiveUpdateEvent_').slice(16) });
  }

  /**
   * @summary Gets information on the requester's own user profile.
   * @returns {RedditUser} A RedditUser object corresponding to the requester's profile
   * @example
   *
   * r.getMe().then(console.log);
   * // => RedditUser { is_employee: false, has_mail: false, name: 'snoowrap_testing', ... }
   */
  getMe() {
    var _this3 = this;

    return this._get({ uri: 'api/v1/me' }).then(function (result) {
      _this3._ownUserInfo = _this3._newObject('RedditUser', result, true);
      return _this3._ownUserInfo;
    });
  }

  _getMyName() {
    return _Promise2.default.resolve(this._ownUserInfo ? this._ownUserInfo.name : this.getMe().get('name'));
  }

  /**
   * @summary Gets a distribution of the requester's own karma distribution by subreddit.
   * @returns {Promise} A Promise for an object with karma information
   * @example
   *
   * r.getKarma().then(console.log)
   * // => [
   * //  { sr: Subreddit { display_name: 'redditdev' }, comment_karma: 16, link_karma: 1 },
   * //  { sr: Subreddit { display_name: 'programming' }, comment_karma: 2, link_karma: 1 },
   * //  ...
   * // ]
   */
  getKarma() {
    return this._get({ uri: 'api/v1/me/karma' });
  }

  /**
   * @summary Gets information on the user's current preferences.
   * @returns {Promise} A promise for an object containing the user's current preferences
   * @example
   *
   * r.getPreferences().then(console.log)
   * // => { default_theme_sr: null, threaded_messages: true, hide_downs: false, ... }
   */
  getPreferences() {
    return this._get({ uri: 'api/v1/me/prefs' });
  }

  /**
   * @summary Updates the user's current preferences.
   * @param {object} updatedPreferences An object of the form {[some preference name]: 'some value', ...}. Any preference
   * not included in this object will simply retain its current value.
   * @returns {Promise} A Promise that fulfills when the request is complete
   * @example
   *
   * r.updatePreferences({threaded_messages: false, hide_downs: true})
   * // => { default_theme_sr: null, threaded_messages: false,hide_downs: true, ... }
   * // (preferences updated on reddit)
   */
  updatePreferences(updatedPreferences) {
    return this._patch({ uri: 'api/v1/me/prefs', body: updatedPreferences });
  }

  /**
   * @summary Gets the currently-authenticated user's trophies.
   * @returns {Promise} A TrophyList containing the user's trophies
   * @example
   *
   * r.getMyTrophies().then(console.log)
   * // => TrophyList { trophies: [
   * //   Trophy { icon_70: 'https://s3.amazonaws.com/redditstatic/award/verified_email-70.png',
   * //     description: null,
   * //     url: null,
   * //     icon_40: 'https://s3.amazonaws.com/redditstatic/award/verified_email-40.png',
   * //     award_id: 'o',
   * //     id: '16fn29',
   * //     name: 'Verified Email'
   * //   }
   * // ] }
   */
  getMyTrophies() {
    return this._get({ uri: 'api/v1/me/trophies' });
  }

  /**
   * @summary Gets the list of the currently-authenticated user's friends.
   * @returns {Promise} A Promise that resolves with a list of friends
   * @example
   *
   * r.getFriends().then(console.log)
   * // => [ [ RedditUser { date: 1457927963, name: 'not_an_aardvark', id: 't2_k83md' } ], [] ]
   */
  getFriends() {
    return this._get({ uri: 'prefs/friends' });
  }

  /**
   * @summary Gets the list of people that the currently-authenticated user has blocked.
   * @returns {Promise} A Promise that resolves with a list of blocked users
   * @example
   *
   * r.getBlockedUsers().then(console.log)
   * // => [ RedditUser { date: 1457928120, name: 'actually_an_aardvark', id: 't2_q3519' } ]
   */
  getBlockedUsers() {
    return this._get({ uri: 'prefs/blocked' });
  }

  /**
   * @summary Determines whether the currently-authenticated user needs to fill out a captcha in order to submit content.
   * @returns {Promise} A Promise that resolves with a boolean value
   * @example
   *
   * r.checkCaptchaRequirement().then(console.log)
   * // => false
   */
  checkCaptchaRequirement() {
    return this._get({ uri: 'api/needs_captcha' });
  }

  /**
   * @summary Gets the identifier (a hex string) for a new captcha image.
   * @returns {Promise} A Promise that resolves with a string
   * @example
   *
   * r.getNewCaptchaIdentifier().then(console.log)
   * // => 'o5M18uy4mk0IW4hs0fu2GNPdXb1Dxe9d'
   */
  getNewCaptchaIdentifier() {
    return this._post({ uri: 'api/new_captcha', form: { api_type } }).then(function (res) {
      return res.json.data.iden;
    });
  }

  /**
   * @summary Gets an image for a given captcha identifier.
   * @param {string} identifier The captcha identifier.
   * @returns {Promise} A string containing raw image data in PNG format
   * @example
   *
   * r.getCaptchaImage('o5M18uy4mk0IW4hs0fu2GNPdXb1Dxe9d').then(console.log)
   // => (A long, incoherent string representing the image in PNG format)
   */
  getCaptchaImage(identifier) {
    return this._get({ uri: 'captcha/' + identifier });
  }

  /**
   * @summary Gets an array of categories that items can be saved in. (Requires reddit gold)
   * @returns {Promise} An array of categories
   * @example
   *
   * r.getSavedCategories().then(console.log)
   * // => [ { category: 'cute cat pictures' }, { category: 'interesting articles' } ]
   */
  getSavedCategories() {
    return this._get({ uri: 'api/saved_categories' }).get('categories');
  }

  /**
   * @summary Marks a list of submissions as 'visited'.
   * @desc **Note**: This endpoint only works if the authenticated user is subscribed to reddit gold.
   * @param {Submission[]} links A list of Submission objects to mark
   * @returns {Promise} A Promise that fulfills when the request is complete
   * @example
   *
   * var submissions = [r.getSubmission('4a9u54'), r.getSubmission('4a95nb')]
   * r.markAsVisited(submissions)
   * // (the links will now appear purple on reddit)
   */
  markAsVisited(links) {
    return this._post({ uri: 'api/store_visits', links: (0, _map3.default)(links, 'name').join(',') });
  }

  _submit(_ref4) {
    var _this4 = this;

    var captcha_response = _ref4.captcha_response,
        _ref4$captchaResponse = _ref4.captchaResponse,
        captchaResponse = _ref4$captchaResponse === undefined ? captcha_response : _ref4$captchaResponse,
        captcha_iden = _ref4.captcha_iden,
        _ref4$captchaIden = _ref4.captchaIden,
        captchaIden = _ref4$captchaIden === undefined ? captcha_iden : _ref4$captchaIden,
        kind = _ref4.kind,
        _ref4$resubmit = _ref4.resubmit,
        resubmit = _ref4$resubmit === undefined ? true : _ref4$resubmit,
        _ref4$send_replies = _ref4.send_replies,
        send_replies = _ref4$send_replies === undefined ? true : _ref4$send_replies,
        _ref4$sendReplies = _ref4.sendReplies,
        sendReplies = _ref4$sendReplies === undefined ? send_replies : _ref4$sendReplies,
        crosspost_fullname = _ref4.crosspost_fullname,
        text = _ref4.text,
        title = _ref4.title,
        url = _ref4.url,
        subreddit_name = _ref4.subreddit_name,
        _ref4$subredditName = _ref4.subredditName,
        subredditName = _ref4$subredditName === undefined ? subreddit_name : _ref4$subredditName;

    return this._post({
      uri: 'api/submit', form: {
        api_type, captcha: captchaResponse, iden: captchaIden, sendreplies: sendReplies, sr: subredditName, kind, resubmit,
        crosspost_fullname, text, title, url
      }
    }).tap((0, _helpers.handleJsonErrors)(this)).then(function (result) {
      return _this4.getSubmission(result.json.data.id);
    });
  }

  /**
   * @summary Creates a new selfpost on the given subreddit.
   * @param {object} options An object containing details about the submission
   * @param {string} options.subredditName The name of the subreddit that the post should be submitted to
   * @param {string} options.title The title of the submission
   * @param {string} [options.text] The selftext of the submission
   * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission
   * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
   requires a captcha to submit posts and comments.
   * @param {string} [options.captchaResponse] The response to the captcha with the given identifier
   * @returns {Promise} The newly-created Submission object
   * @example
   *
   * r.submitSelfpost({
   *   subredditName: 'snoowrap_testing',
   *   title: 'This is a selfpost',
   *   text: 'This is the text body of the selfpost'
   * }).then(console.log)
   * // => Submission { name: 't3_4abmsz' }
   * // (new selfpost created on reddit)
   */
  submitSelfpost(options) {
    return this._submit(_extends({}, options, { kind: 'self' }));
  }

  /**
   * @summary Creates a new link submission on the given subreddit.
   * @param {object} options An object containing details about the submission
   * @param {string} options.subredditName The name of the subreddit that the post should be submitted to
   * @param {string} options.title The title of the submission
   * @param {string} options.url The url that the link submission should point to
   * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission
   * @param {boolean} [options.resubmit=true] If this is false and same link has already been submitted to this subreddit in
   the past, reddit will return an error. This could be used to avoid accidental reposts.
   * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
   requires a captcha to submit posts and comments.
   * @param {string} [options.captchaResponse] The response to the captcha with the given identifier
   * @returns {Promise} The newly-created Submission object
   * @example
   *
   * r.submitLink({
   *   subredditName: 'snoowrap_testing',
   *   title: 'I found a cool website!',
   *   url: 'https://google.com'
   * }).then(console.log)
   * // => Submission { name: 't3_4abnfe' }
   * // (new linkpost created on reddit)
   */
  submitLink(options) {
    return this._submit(_extends({}, options, { kind: 'link' }));
  }

  /**
   * @summary Creates a new crosspost submission on the given subreddit
   * @desc **NOTE**: To create a crosspost, the authenticated account must be subscribed to the subreddit where
   * the crosspost is being submitted, and that subreddit be configured to allow crossposts.
   * @param {object} options An object containing details about the submission
   * @param {string} options.subredditName The name of the subreddit that the crosspost should be submitted to
   * @param {string} options.title The title of the crosspost
   * @param {(string|Submission)} options.originalPost A Submission object or a post ID for the original post which
   is being crossposted
   * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission
   * @param {boolean} [options.resubmit=true] If this is false and same link has already been submitted to this subreddit in
   the past, reddit will return an error. This could be used to avoid accidental reposts.
   * @returns {Promise} The newly-created Submission object
   * @example
   *
   * await r.submitCrosspost({ title: 'I found an interesting post', originalPost: '6vths0', subredditName: 'snoowrap' })
   */
  submitCrosspost(options) {
    return this._submit(_extends({}, options, {
      kind: 'crosspost',
      crosspost_fullname: options.originalPost instanceof snoowrap.objects.Submission ? options.originalPost.name : (0, _helpers.addFullnamePrefix)(options.originalPost, 't3_')
    }));
  }

  _getSortedFrontpage(sortType, subredditName) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    // Handle things properly if only a time parameter is provided but not the subreddit name
    var opts = options;
    var subName = subredditName;
    if (typeof subredditName === 'object' && (0, _isEmpty3.default)((0, _omitBy3.default)(opts, function (option) {
      return option === undefined;
    }))) {
      /* In this case, "subredditName" ends up referring to the second argument, which is not actually a name since the user
      decided to omit that parameter. */
      opts = subredditName;
      subName = undefined;
    }
    var parsedOptions = (0, _omit3.default)(_extends({}, opts, { t: opts.time || opts.t }), 'time');
    return this._getListing({ uri: (subName ? 'r/' + subName + '/' : '') + sortType, qs: parsedOptions });
  }

  /**
   * @summary Gets a Listing of hot posts.
   * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
   the front page of reddit.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns {Promise} A Listing containing the retrieved submissions
   * @example
   *
   * r.getHot().then(console.log)
   * // => Listing [
   * //  Submission { domain: 'imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'pics' }, ... },
   * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'funny' }, ... },
   * //  ...
   * // ]
   *
   * r.getHot('gifs').then(console.log)
   * // => Listing [
   * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'gifs' }, ... },
   * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'gifs' }, ... },
   * //  ...
   * // ]
   *
   * r.getHot('redditdev', {limit: 1}).then(console.log)
   * // => Listing [
   //   Submission { domain: 'self.redditdev', banned_by: null, subreddit: Subreddit { display_name: 'redditdev' }, ...}
   * // ]
   */
  getHot(subredditName, options) {
    return this._getSortedFrontpage('hot', subredditName, options);
  }

  /**
   * @summary Gets a Listing of best posts.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns {Promise<Listing>} A Listing containing the retrieved submissions
   * @example
   *
   * r.getBest().then(console.log)
   * // => Listing [
   * //  Submission { domain: 'imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'pics' }, ... },
   * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'funny' }, ... },
   * //  ...
   * // ]
   *
   * r.getBest({limit: 1}).then(console.log)
   * // => Listing [
   //   Submission { domain: 'self.redditdev', banned_by: null, subreddit: Subreddit { display_name: 'redditdev' }, ...}
   * // ]
   */
  getBest(options) {
    return this._getSortedFrontpage('best', undefined, options);
  }

  /**
   * @summary Gets a Listing of new posts.
   * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
   the front page of reddit.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns {Promise} A Listing containing the retrieved submissions
   * @example
   *
   * r.getNew().then(console.log)
   * // => Listing [
   * //  Submission { domain: 'self.Jokes', banned_by: null, subreddit: Subreddit { display_name: 'Jokes' }, ... },
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  ...
   * // ]
   *
   */
  getNew(subredditName, options) {
    return this._getSortedFrontpage('new', subredditName, options);
  }

  /**
   * @summary Gets a Listing of new comments.
   * @param {string} [subredditName] The subreddit to get comments from. If not provided, posts are fetched from
   the front page of reddit.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns {Promise} A Listing containing the retrieved comments
   * @example
   *
   * r.getNewComments().then(console.log)
   * // => Listing [
   * //  Comment { link_title: 'What amazing book should be made into a movie, but hasn\'t been yet?', ... }
   * //  Comment { link_title: 'How far back in time could you go and still understand English?', ... }
   * // ]
   */
  getNewComments(subredditName, options) {
    return this._getSortedFrontpage('comments', subredditName, options);
  }

  /**
   * @summary Gets a single random Submission.
   * @desc **Note**: This function will not work when snoowrap is running in a browser, because the reddit server sends a
   redirect which cannot be followed by a CORS request.
   * @param {string} [subredditName] The subreddit to get the random submission. If not provided, the post is fetched from
   the front page of reddit.
   * @returns {Promise} The retrieved Submission object
   * @example
   *
   * r.getRandomSubmission('aww').then(console.log)
   * // => Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'aww' }, ... }
   */
  getRandomSubmission(subredditName) {
    return this._get({ uri: (subredditName ? 'r/' + subredditName + '/' : '') + 'random' });
  }

  /**
   * @summary Gets a Listing of top posts.
   * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
   the front page of reddit.
   * @param {object} [options={}] Options for the resulting Listing
   * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
   `hour, day, week, month, year, all`
   * @returns {Promise} A Listing containing the retrieved submissions
   * @example
   *
   * r.getTop({time: 'all', limit: 2}).then(console.log)
   * // => Listing [
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  Submission { domain: 'imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'funny' }, ... }
   * // ]
   *
   * r.getTop('AskReddit').then(console.log)
   * // => Listing [
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  ...
   * // ]
   */
  getTop(subredditName, options) {
    return this._getSortedFrontpage('top', subredditName, options);
  }

  /**
   * @summary Gets a Listing of controversial posts.
   * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
   the front page of reddit.
   * @param {object} [options={}] Options for the resulting Listing
   * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
   `hour, day, week, month, year, all`
   * @returns {Promise} A Listing containing the retrieved submissions
   * @example
   *
   * r.getControversial('technology').then(console.log)
   * // => Listing [
   * //  Submission { domain: 'thenextweb.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... },
   * //  Submission { domain: 'pcmag.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... }
   * // ]
   */
  getControversial(subredditName, options) {
    return this._getSortedFrontpage('controversial', subredditName, options);
  }

  /**
   * @summary Gets a Listing of controversial posts.
   * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
   the front page of reddit.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing the retrieved submissions
   * @example
   *
   * r.getRising('technology').then(console.log)
   * // => Listing [
   * //  Submission { domain: 'thenextweb.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... },
   * //  Submission { domain: 'pcmag.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... }
   * // ]
   */
  getRising(subredditName, options) {
    return this._getSortedFrontpage('rising', subredditName, options);
  }

  /**
   * @summary Gets the authenticated user's unread messages.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns {Promise} A Listing containing unread items in the user's inbox
   * @example
   *
   * r.getUnreadMessages().then(console.log)
   * // => Listing [
   * //  PrivateMessage { body: 'hi!', was_comment: false, first_message: null, ... },
   * //  Comment { body: 'this is a reply', link_title: 'Yay, a selfpost!', was_comment: true, ... }
   * // ]
   */
  getUnreadMessages() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this._getListing({ uri: 'message/unread', qs: options });
  }

  /**
   * @summary Gets the items in the authenticated user's inbox.
   * @param {object} [options={}] Filter options. Can also contain options for the resulting Listing.
   * @param {string} [options.filter] A filter for the inbox items. If provided, it should be one of `unread`, (unread
   items), `messages` (i.e. PMs), `comments` (comment replies), `selfreply` (selfpost replies), or `mentions` (username
   mentions).
   * @returns {Promise} A Listing containing items in the user's inbox
   * @example
   *
   * r.getInbox().then(console.log)
   * // => Listing [
   * //  PrivateMessage { body: 'hi!', was_comment: false, first_message: null, ... },
   * //  Comment { body: 'this is a reply', link_title: 'Yay, a selfpost!', was_comment: true, ... }
   * // ]
   */
  getInbox() {
    var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        filter = _ref5.filter,
        options = _objectWithoutProperties(_ref5, ['filter']);

    return this._getListing({ uri: 'message/' + (filter || 'inbox'), qs: options });
  }

  /**
   * @summary Gets the authenticated user's modmail.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns {Promise} A Listing of the user's modmail
   * @example
   *
   * r.getModmail({limit: 2}).then(console.log)
   * // => Listing [
   * //  PrivateMessage { body: '/u/not_an_aardvark has accepted an invitation to become moderator ... ', ... },
   * //  PrivateMessage { body: '/u/not_an_aardvark has been invited by /u/actually_an_aardvark to ...', ... }
   * // ]
   */
  getModmail() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this._getListing({ uri: 'message/moderator', qs: options });
  }

  /**
   * @summary Gets a list of ModmailConversations from the authenticated user's subreddits.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise<Listing<ModmailConversation>>} A Listing containing Subreddits
   * @example
   *
   * r.getNewModmailConversations({limit: 2}).then(console.log)
   * // => Listing [
   * //  ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... },
   * //  ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... }
   * // ]
   */
  getNewModmailConversations() {
    var _this5 = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this._getListing({
      uri: 'api/mod/conversations', qs: options, _name: 'ModmailConversation', _transform: function (response) {
        response.after = null;
        response.before = null;
        response.children = [];

        for (var conversation of response.conversationIds) {
          response.conversations[conversation].participant = _this5._newObject('ModmailConversationAuthor', _extends({}, response.conversations[conversation].participant));
          var conversationObjects = objects.ModmailConversation._getConversationObjects(response.conversations[conversation], response);
          var data = _extends({}, conversationObjects, response.conversations[conversation]);
          response.children.push(_this5._newObject('ModmailConversation', data));
        }
        return _this5._newObject('Listing', response);
      }
    });
  }

  /**
   * @summary Create a new modmail discussion between moderators
   * @param {object} options
   * @param {string} options.body Body of the discussion
   * @param {string} options.subject Title or subject
   * @param {string} options.srName Subreddit name without fullname
   * @returns {Promise<ModmailConversation>} the created ModmailConversation
   * @example
   *
   * r.createModeratorDiscussion({
   *   body: 'test body',
   *   subject: 'test subject',
   *   srName: 'AskReddit'
   * }).then(console.log)
   * // ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... }
   */
  createModmailDiscussion(_ref6) {
    var _this6 = this;

    var body = _ref6.body,
        subject = _ref6.subject,
        srName = _ref6.srName;

    var parsedFromSr = srName.replace(/^\/?r\//, ''); // Convert '/r/subreddit_name' to 'subreddit_name'
    // _newObject ignores most of the response, no practical way to parse the returned content yet
    return this._post({
      uri: 'api/mod/conversations', form: {
        body, subject, srName: parsedFromSr
      }
    }).then(function (res) {
      return _this6._newObject('ModmailConversation', { id: res.conversation.id });
    });
  }

  /**
   * @summary Get a ModmailConversation by its id
   * @param {string} id of the ModmailConversation
   * @returns {Promise<ModmailConversation>} the requested ModmailConversation
   * @example
   *
   * r.getNewModmailConversation('75hxt').then(console.log)
   * // ModmailConversation { messages: [...], objIds: [...], ... }
   */
  getNewModmailConversation(id) {
    return this._newObject('ModmailConversation', { id });
  }

  /**
   * @summary Marks all conversations in array as read.
   * @param {ModmailConversation[]} conversations to mark as read
   * @example
   *
   * r.markNewModmailConversationsAsRead(['pics', 'sweden'])
   */
  markNewModmailConversationsAsRead(conversations) {
    var conversationIds = conversations.map(function (message) {
      return (0, _helpers.addFullnamePrefix)(message, '');
    });
    return this._post({ uri: 'api/mod/conversations/read', form: { conversationIds: conversationIds.join(',') } });
  }

  /**
   * @summary Marks all conversations in array as unread.
   * @param {ModmailConversation[]} conversations to mark as unread
   * @example
   *
   * r.markNewModmailConversationsAsUnread(['pics', 'sweden'])
   */
  markNewModmailConversationsAsUnread(conversations) {
    var conversationIds = conversations.map(function (message) {
      return (0, _helpers.addFullnamePrefix)(message, '');
    });
    return this._post({ uri: 'api/mod/conversations/unread', form: { conversationIds: conversationIds.join(',') } });
  }

  /**
   * @summary Gets all moderated subreddits that have new Modmail activated
   * @returns {Promise<Listing<Subreddit>>} a Listing of ModmailConversations marked as read
   * @example
   *
   * r.getNewModmailSubreddits().then(console.log)
   * // => Listing [
   * //  Subreddit { display_name: 'tipofmytongue', ... },
   * //  Subreddit { display_name: 'EarthPorn', ... },
   * // ]
   */
  getNewModmailSubreddits() {
    var _this7 = this;

    return this._get({ uri: 'api/mod/conversations/subreddits' }).then(function (response) {
      return Object.values(response.subreddits).map(function (s) {
        return _this7._newObject('Subreddit', s);
      });
    });
  }

  /**
   * @summary Represents the unread count in {ModmailConversation}. Each of these properties
   * correspond to the amount of unread conversations of that type.
   * @typedef {Object} UnreadCount
   * @property {number} highlighted
   * @property {number} notifications
   * @property {number} archived
   * @property {number} new
   * @property {number} inprogress
   * @property {number} mod
   */

  /**
   * @summary Retrieves an object of unread Modmail conversations for each state.
   * @returns {UnreadCount} unreadCount
   * @example
   *
   * r.getUnreadNewModmailConversationsCount().then(console.log)
   * // => {
   * //  highlighted: 1,
   * //  notifications: 0,
   * //  archived: 0,
   * //  new: 2,
   * //  inprogress: 5,
   * //  mod: 1,
   * // }
   */
  getUnreadNewModmailConversationsCount() {
    return this._get({ uri: 'api/mod/conversations/unread/count' });
  }

  /**
   * @summary Mark Modmail conversations as read given the subreddit(s) and state.
   * @param {Subreddit[]|String[]} subreddits
   * @param {('new'|'inprogress'|'mod'|'notifications'|'archived'|'highlighted'|'all')} state selected state to mark as read
   * @returns {Promise<Listing<ModmailConversation>>} a Listing of ModmailConversations marked as read
   * @example
   *
   * r.bulkReadNewModmail(['AskReddit'], 'all').then(console.log)
   * // => Listing [
   * //  ModmailConversation { id: '75hxt' },
   * //  ModmailConversation { id: '75hxg' }
   * // ]
   *
   * r.bulkReadNewModmail([r.getSubreddit('AskReddit')], 'all').then(console.log)
   * // => Listing [
   * //  ModmailConversation { id: '75hxt' },
   * //  ModmailConversation { id: '75hxg' }
   * // ]
   */
  bulkReadNewModmail(subreddits, state) {
    var _this8 = this;

    var subredditNames = subreddits.map(function (s) {
      return typeof s === 'string' ? s.replace(/^\/?r\//, '') : s.display_name;
    });
    return this._post({ uri: 'api/mod/conversations/bulk/read', form: {
        entity: subredditNames.join(','),
        state
      } }).then(function (res) {
      return _this8._newObject('Listing', {
        after: null,
        before: null,
        children: res.conversation_ids.map(function (id) {
          return _this8._newObject('ModmailConversation', { id });
        })
      });
    });
  }

  /**
   * @summary Gets the user's sent messages.
   * @param {object} [options={}] options for the resulting Listing
   * @returns {Promise} A Listing of the user's sent messages
   * @example
   *
   * r.getSentMessages().then(console.log)
   * // => Listing [
   * //  PrivateMessage { body: 'you have been added as an approved submitter to ...', ... },
   * //  PrivateMessage { body: 'you have been banned from posting to ...' ... }
   * // ]
   */
  getSentMessages() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this._getListing({ uri: 'message/sent', qs: options });
  }

  /**
   * @summary Marks all of the given messages as read.
   * @param {PrivateMessage[]|String[]} messages An Array of PrivateMessage or Comment objects. Can also contain strings
   representing message or comment IDs. If strings are provided, they are assumed to represent PrivateMessages unless a fullname
   prefix such as `t1_` is specified.
   * @returns {Promise} A Promise that fulfills when the request is complete
   * @example
   *
   * r.markMessagesAsRead(['51shsd', '51shxv'])
   *
   * // To reference a comment by ID, be sure to use the `t1_` prefix, otherwise snoowrap will be unable to distinguish the
   * // comment ID from a PrivateMessage ID.
   * r.markMessagesAsRead(['t5_51shsd', 't1_d3zhb5k'])
   *
   * // Alternatively, just pass in a comment object directly.
   * r.markMessagesAsRead([r.getMessage('51shsd'), r.getComment('d3zhb5k')])
   */
  markMessagesAsRead(messages) {
    var messageIds = messages.map(function (message) {
      return (0, _helpers.addFullnamePrefix)(message, 't4_');
    });
    return this._post({ uri: 'api/read_message', form: { id: messageIds.join(',') } });
  }

  /**
   * @summary Marks all of the given messages as unread.
   * @param {PrivateMessage[]|String[]} messages An Array of PrivateMessage or Comment objects. Can also contain strings
   representing message IDs. If strings are provided, they are assumed to represent PrivateMessages unless a fullname prefix such
   as `t1_` is included.
   * @returns {Promise} A Promise that fulfills when the request is complete
   * @example
   *
   * r.markMessagesAsUnread(['51shsd', '51shxv'])
   *
   * // To reference a comment by ID, be sure to use the `t1_` prefix, otherwise snoowrap will be unable to distinguish the
   * // comment ID from a PrivateMessage ID.
   * r.markMessagesAsUnread(['t5_51shsd', 't1_d3zhb5k'])
   *
   * // Alternatively, just pass in a comment object directly.
   * r.markMessagesAsRead([r.getMessage('51shsd'), r.getComment('d3zhb5k')])
   */
  markMessagesAsUnread(messages) {
    var messageIds = messages.map(function (message) {
      return (0, _helpers.addFullnamePrefix)(message, 't4_');
    });
    return this._post({ uri: 'api/unread_message', form: { id: messageIds.join(',') } });
  }

  /**
   * @summary Marks all of the user's messages as read.
   * @desc **Note:** The reddit.com site imposes a ratelimit of approximately 1 request every 10 minutes on this endpoint.
   Further requests will cause the API to return a 429 error.
   * @returns {Promise} A Promise that resolves when the request is complete
   * @example
   *
   * r.readAllMessages().then(function () {
   *   r.getUnreadMessages().then(console.log)
   * })
   * // => Listing []
   * // (messages marked as 'read' on reddit)
   */
  readAllMessages() {
    return this._post({ uri: 'api/read_all_messages' });
  }

  /**
   * @summary Composes a new private message.
   * @param {object} options
   * @param {RedditUser|Subreddit|string} options.to The recipient of the message.
   * @param {string} options.subject The message subject (100 characters max)
   * @param {string} options.text The body of the message, in raw markdown text
   * @param {Subreddit|string} [options.fromSubreddit] If provided, the message is sent as a modmail from the specified
   subreddit.
   * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
   requires a captcha to submit posts and comments.
   * @param {string} [options.captchaResponse] The response to the captcha with the given identifier
   * @returns {Promise} A Promise that fulfills when the request is complete
   * @example
   *
   * r.composeMessage({
   *   to: 'actually_an_aardvark',
   *   subject: "Hi, how's it going?",
   *   text: 'Long time no see'
   * })
   * // (message created on reddit)
   */
  composeMessage(_ref7) {
    var captcha = _ref7.captcha,
        from_subreddit = _ref7.from_subreddit,
        _ref7$fromSubreddit = _ref7.fromSubreddit,
        fromSubreddit = _ref7$fromSubreddit === undefined ? from_subreddit : _ref7$fromSubreddit,
        captcha_iden = _ref7.captcha_iden,
        _ref7$captchaIden = _ref7.captchaIden,
        captchaIden = _ref7$captchaIden === undefined ? captcha_iden : _ref7$captchaIden,
        subject = _ref7.subject,
        text = _ref7.text,
        to = _ref7.to;

    var parsedTo = to;
    var parsedFromSr = fromSubreddit;
    if (to instanceof snoowrap.objects.RedditUser) {
      parsedTo = to.name;
    } else if (to instanceof snoowrap.objects.Subreddit) {
      parsedTo = '/r/' + to.display_name;
    }
    if (fromSubreddit instanceof snoowrap.objects.Subreddit) {
      parsedFromSr = fromSubreddit.display_name;
    } else if (typeof fromSubreddit === 'string') {
      parsedFromSr = fromSubreddit.replace(/^\/?r\//, ''); // Convert '/r/subreddit_name' to 'subreddit_name'
    }
    return this._post({
      uri: 'api/compose', form: {
        api_type, captcha, iden: captchaIden, from_sr: parsedFromSr, subject, text, to: parsedTo
      }
    }).tap((0, _helpers.handleJsonErrors)(this)).return({});
  }

  /**
   * @summary Gets a list of all oauth scopes supported by the reddit API.
   * @desc **Note**: This lists every single oauth scope. To get the scope of this requester, use the `scope` property instead.
   * @returns {Promise} An object containing oauth scopes.
   * @example
   *
   * r.getOauthScopeList().then(console.log)
   * // => {
   * //  creddits: {
   * //    description: 'Spend my reddit gold creddits on giving gold to other users.',
   * //    id: 'creddits',
   * //    name: 'Spend reddit gold creddits'
   * //  },
   * //  modcontributors: {
   * //    description: 'Add/remove users to approved submitter lists and ban/unban or mute/unmute users from ...',
   * //    id: 'modcontributors',
   * //    name: 'Approve submitters and ban users'
   * //  },
   * //  ...
   * // }
   */
  getOauthScopeList() {
    return this._get({ uri: 'api/v1/scopes' });
  }

  /**
   * @summary Conducts a search of reddit submissions.
   * @param {object} options Search options. Can also contain options for the resulting Listing.
   * @param {string} options.query The search query
   * @param {string} [options.time] Describes the timespan that posts should be retrieved from. One of
   `hour, day, week, month, year, all`
   * @param {Subreddit|string} [options.subreddit] The subreddit to conduct the search on.
   * @param {boolean} [options.restrictSr=true] Restricts search results to the given subreddit
   * @param {string} [options.sort] Determines how the results should be sorted. One of `relevance, hot, top, new, comments`
   * @param {string} [options.syntax='plain'] Specifies a syntax for the search. One of `cloudsearch, lucene, plain`
   * @returns {Promise} A Listing containing the search results.
   * @example
   *
   * r.search({
   *   query: 'Cute kittens',
   *   subreddit: 'aww',
   *   sort: 'top'
   * }).then(console.log)
   * // => Listing [
   * //  Submission { domain: 'i.imgur.com', banned_by: null, ... },
   * //  Submission { domain: 'imgur.com', banned_by: null, ... },
   * //  ...
   * // ]
   */
  search(options) {
    if (options.subreddit instanceof snoowrap.objects.Subreddit) {
      options.subreddit = options.subreddit.display_name;
    }
    (0, _defaults3.default)(options, { restrictSr: true, syntax: 'plain' });
    var parsedQuery = (0, _omit3.default)(_extends({}, options, { t: options.time, q: options.query, restrict_sr: options.restrictSr }), ['time', 'query']);
    return this._getListing({ uri: (options.subreddit ? 'r/' + options.subreddit + '/' : '') + 'search', qs: parsedQuery });
  }

  /**
   * @summary Searches for subreddits given a query.
   * @param {object} options
   * @param {string} options.query A search query (50 characters max)
   * @param {boolean} [options.exact=false] Determines whether the results shouldbe limited to exact matches.
   * @param {boolean} [options.includeNsfw=true] Determines whether the results should include NSFW subreddits.
   * @returns {Promise} An Array containing subreddit names
   * @example
   *
   * r.searchSubredditNames({query: 'programming'}).then(console.log)
   * // => [
   * //  'programming',
   * //  'programmingcirclejerk',
   * //  'programminghorror',
   * //  ...
   * // ]
   */
  searchSubredditNames(_ref8) {
    var _ref8$exact = _ref8.exact,
        exact = _ref8$exact === undefined ? false : _ref8$exact,
        _ref8$include_nsfw = _ref8.include_nsfw,
        include_nsfw = _ref8$include_nsfw === undefined ? true : _ref8$include_nsfw,
        _ref8$includeNsfw = _ref8.includeNsfw,
        includeNsfw = _ref8$includeNsfw === undefined ? include_nsfw : _ref8$includeNsfw,
        query = _ref8.query;

    return this._post({ uri: 'api/search_reddit_names', qs: { exact, include_over_18: includeNsfw, query } }).get('names');
  }

  _createOrEditSubreddit(_ref9) {
    var _ref9$allow_images = _ref9.allow_images,
        allow_images = _ref9$allow_images === undefined ? true : _ref9$allow_images,
        _ref9$allow_top = _ref9.allow_top,
        allow_top = _ref9$allow_top === undefined ? true : _ref9$allow_top,
        captcha = _ref9.captcha,
        captcha_iden = _ref9.captcha_iden,
        _ref9$collapse_delete = _ref9.collapse_deleted_comments,
        collapse_deleted_comments = _ref9$collapse_delete === undefined ? false : _ref9$collapse_delete,
        _ref9$comment_score_h = _ref9.comment_score_hide_mins,
        comment_score_hide_mins = _ref9$comment_score_h === undefined ? 0 : _ref9$comment_score_h,
        description = _ref9.description,
        _ref9$exclude_banned_ = _ref9.exclude_banned_modqueue,
        exclude_banned_modqueue = _ref9$exclude_banned_ === undefined ? false : _ref9$exclude_banned_,
        header_title = _ref9['header-title'],
        _ref9$hide_ads = _ref9.hide_ads,
        hide_ads = _ref9$hide_ads === undefined ? false : _ref9$hide_ads,
        _ref9$lang = _ref9.lang,
        lang = _ref9$lang === undefined ? 'en' : _ref9$lang,
        _ref9$link_type = _ref9.link_type,
        link_type = _ref9$link_type === undefined ? 'any' : _ref9$link_type,
        name = _ref9.name,
        _ref9$over_ = _ref9.over_18,
        over_18 = _ref9$over_ === undefined ? false : _ref9$over_,
        public_description = _ref9.public_description,
        _ref9$public_traffic = _ref9.public_traffic,
        public_traffic = _ref9$public_traffic === undefined ? false : _ref9$public_traffic,
        _ref9$show_media = _ref9.show_media,
        show_media = _ref9$show_media === undefined ? false : _ref9$show_media,
        _ref9$show_media_prev = _ref9.show_media_preview,
        show_media_preview = _ref9$show_media_prev === undefined ? true : _ref9$show_media_prev,
        _ref9$spam_comments = _ref9.spam_comments,
        spam_comments = _ref9$spam_comments === undefined ? 'high' : _ref9$spam_comments,
        _ref9$spam_links = _ref9.spam_links,
        spam_links = _ref9$spam_links === undefined ? 'high' : _ref9$spam_links,
        _ref9$spam_selfposts = _ref9.spam_selfposts,
        spam_selfposts = _ref9$spam_selfposts === undefined ? 'high' : _ref9$spam_selfposts,
        _ref9$spoilers_enable = _ref9.spoilers_enabled,
        spoilers_enabled = _ref9$spoilers_enable === undefined ? false : _ref9$spoilers_enable,
        sr = _ref9.sr,
        _ref9$submit_link_lab = _ref9.submit_link_label,
        submit_link_label = _ref9$submit_link_lab === undefined ? '' : _ref9$submit_link_lab,
        _ref9$submit_text_lab = _ref9.submit_text_label,
        submit_text_label = _ref9$submit_text_lab === undefined ? '' : _ref9$submit_text_lab,
        _ref9$submit_text = _ref9.submit_text,
        submit_text = _ref9$submit_text === undefined ? '' : _ref9$submit_text,
        _ref9$suggested_comme = _ref9.suggested_comment_sort,
        suggested_comment_sort = _ref9$suggested_comme === undefined ? 'confidence' : _ref9$suggested_comme,
        title = _ref9.title,
        _ref9$type = _ref9.type,
        type = _ref9$type === undefined ? 'public' : _ref9$type,
        wiki_edit_age = _ref9.wiki_edit_age,
        wiki_edit_karma = _ref9.wiki_edit_karma,
        _ref9$wikimode = _ref9.wikimode,
        wikimode = _ref9$wikimode === undefined ? 'modonly' : _ref9$wikimode;

    return this._post({
      uri: 'api/site_admin', form: {
        allow_images, allow_top, api_type, captcha, collapse_deleted_comments, comment_score_hide_mins, description,
        exclude_banned_modqueue, 'header-title': header_title, hide_ads, iden: captcha_iden, lang, link_type, name,
        over_18, public_description, public_traffic, show_media, show_media_preview, spam_comments, spam_links,
        spam_selfposts, spoilers_enabled, sr, submit_link_label, submit_text, submit_text_label, suggested_comment_sort,
        title, type, wiki_edit_age, wiki_edit_karma, wikimode
      }
    }).then((0, _helpers.handleJsonErrors)(this.getSubreddit(name || sr)));
  }

  /**
   * @summary Creates a new subreddit.
   * @param {object} options
   * @param {string} options.name The name of the new subreddit
   * @param {string} options.title The text that should appear in the header of the subreddit
   * @param {string} options.public_description The text that appears with this subreddit on the search page, or on the
   blocked-access page if this subreddit is private. (500 characters max)
   * @param {string} options.description The sidebar text for the subreddit. (5120 characters max)
   * @param {string} [options.submit_text=''] The text to show below the submission page (1024 characters max)
   * @param {boolean} [options.hide_ads=false] Determines whether ads should be hidden on this subreddit. (This is only
   allowed for gold-only subreddits.)
   * @param {string} [options.lang='en'] The language of the subreddit (represented as an IETF language tag)
   * @param {string} [options.type='public'] Determines who should be able to access the subreddit. This should be one of
   `public, private, restricted, gold_restricted, gold_only, archived, employees_only`.
   * @param {string} [options.link_type='any'] Determines what types of submissions are allowed on the subreddit. This should
   be one of `any, link, self`.
   * @param {string} [options.submit_link_label=undefined] Custom text to display on the button that submits a link. If
   this is omitted, the default text will be displayed.
   * @param {string} [options.submit_text_label=undefined] Custom text to display on the button that submits a selfpost. If
   this is omitted, the default text will be displayed.
   * @param {string} [options.wikimode='modonly'] Determines who can edit wiki pages on the subreddit. This should be one of
   `modonly, anyone, disabled`.
   * @param {number} [options.wiki_edit_karma=0] The minimum amount of subreddit karma needed for someone to edit this
   subreddit's wiki. (This is only relevant if `options.wikimode` is set to `anyone`.)
   * @param {number} [options.wiki_edit_age=0] The minimum account age (in days) needed for someone to edit this subreddit's
   wiki. (This is only relevant if `options.wikimode` is set to `anyone`.)
   * @param {string} [options.spam_links='high'] The spam filter strength for links on this subreddit. This should be one of
   `low, high, all`.
   * @param {string} [options.spam_selfposts='high'] The spam filter strength for selfposts on this subreddit. This should be
   one of `low, high, all`.
   * @param {string} [options.spam_comments='high'] The spam filter strength for comments on this subreddit. This should be one
   of `low, high, all`.
   * @param {boolean} [options.over_18=false] Determines whether this subreddit should be classified as NSFW
   * @param {boolean} [options.allow_top=true] Determines whether the new subreddit should be able to appear in /r/all and
   trending subreddits
   * @param {boolean} [options.show_media=false] Determines whether image thumbnails should be enabled on this subreddit
   * @param {boolean} [options.show_media_preview=true] Determines whether media previews should be expanded by default on this
   subreddit
   * @param {boolean} [options.allow_images=true] Determines whether image uploads and links to image hosting sites should be
   enabled on this subreddit
   * @param {boolean} [options.exclude_banned_modqueue=false] Determines whether posts by site-wide banned users should be
   excluded from the modqueue.
   * @param {boolean} [options.public_traffic=false] Determines whether the /about/traffic page for this subreddit should be
   viewable by anyone.
   * @param {boolean} [options.collapse_deleted_comments=false] Determines whether deleted and removed comments should be
   collapsed by default
   * @param {string} [options.suggested_comment_sort=undefined] The suggested comment sort for the subreddit. This should be
   one of `confidence, top, new, controversial, old, random, qa`.If left blank, there will be no suggested sort,
   which means that users will see the sort method that is set in their own preferences (usually `confidence`.)
   * @param {boolean} [options.spoilers_enabled=false] Determines whether users can mark their posts as spoilers
   * @returns {Promise} A Promise for the newly-created subreddit object.
   * @example
   *
   * r.createSubreddit({
   *   name: 'snoowrap_testing2',
   *   title: 'snoowrap testing: the sequel',
   *   public_description: 'thanks for reading the snoowrap docs!',
   *   description: 'This text will go on the sidebar',
   *   type: 'private'
   * }).then(console.log)
   * // => Subreddit { display_name: 'snoowrap_testing2' }
   * // (/r/snoowrap_testing2 created on reddit)
   */
  createSubreddit(options) {
    return this._createOrEditSubreddit(options);
  }

  /**
   * @summary Searches subreddits by topic.
   * @param {object} options
   * @param {string} options.query The search query. (50 characters max)
   * @returns {Promise} An Array of subreddit objects corresponding to the search results
   * @deprecated Reddit no longer provides the corresponding API endpoint.
   * @example
   *
   * r.searchSubredditTopics({query: 'movies'}).then(console.log)
   * // => [
   * //  Subreddit { display_name: 'tipofmytongue' },
   * //  Subreddit { display_name: 'remove' },
   * //  Subreddit { display_name: 'horror' },
   * //  ...
   * // ]
   */
  searchSubredditTopics(_ref10) {
    var _this9 = this;

    var query = _ref10.query;

    return this._get({ uri: 'api/subreddits_by_topic', qs: { query } }).map(function (result) {
      return _this9.getSubreddit(result.name);
    });
  }

  /**
   * @summary Gets a list of subreddits that the currently-authenticated user is subscribed to.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing Subreddits
   * @example
   *
   * r.getSubscriptions({limit: 2}).then(console.log)
   * // => Listing [
   * //  Subreddit {
   * //    display_name: 'gadgets',
   * //    title: 'reddit gadget guide',
   * //    ...
   * //  },
   * //  Subreddit {
   * //    display_name: 'sports',
   * //    title: 'the sportspage of the Internet',
   * //    ...
   * //  }
   * // ]
   */
  getSubscriptions(options) {
    return this._getListing({ uri: 'subreddits/mine/subscriber', qs: options });
  }

  /**
   * @summary Gets a list of subreddits in which the currently-authenticated user is an approved submitter.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing Subreddits
   * @example
   *
   * r.getContributorSubreddits().then(console.log)
   * // => Listing [
   * //  Subreddit {
   * //    display_name: 'snoowrap_testing',
   * //    title: 'snoowrap',
   * //    ...
   * //  }
   * // ]
   *
   */
  getContributorSubreddits(options) {
    return this._getListing({ uri: 'subreddits/mine/contributor', qs: options });
  }

  /**
   * @summary Gets a list of subreddits in which the currently-authenticated user is a moderator.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing Subreddits
   * @example
   *
   * r.getModeratedSubreddits().then(console.log)
   * // => Listing [
   * //  Subreddit {
   * //    display_name: 'snoowrap_testing',
   * //    title: 'snoowrap',
   * //    ...
   * //  }
   * // ]
   */
  getModeratedSubreddits(options) {
    return this._getListing({ uri: 'subreddits/mine/moderator', qs: options });
  }

  /**
   * @summary Searches subreddits by title and description.
   * @param {object} options Options for the search. May also contain Listing parameters.
   * @param {string} options.query The search query
   * @returns {Promise} A Listing containing Subreddits
   * @example
   *
   * r.searchSubreddits({query: 'cookies'}).then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */
  searchSubreddits(options) {
    options.q = options.query;
    return this._getListing({ uri: 'subreddits/search', qs: (0, _omit3.default)(options, 'query') });
  }

  /**
   * @summary Gets a list of subreddits, arranged by popularity.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing Subreddits
   * @example
   *
   * r.getPopularSubreddits().then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */
  getPopularSubreddits(options) {
    return this._getListing({ uri: 'subreddits/popular', qs: options });
  }

  /**
   * @summary Gets a list of subreddits, arranged by age.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing Subreddits
   * @example
   *
   * r.getNewSubreddits().then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */
  getNewSubreddits(options) {
    return this._getListing({ uri: 'subreddits/new', qs: options });
  }

  /**
   * @summary Gets a list of gold-exclusive subreddits.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing Subreddits
   * @example
   *
   * r.getGoldSubreddits().then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */
  getGoldSubreddits(options) {
    return this._getListing({ uri: 'subreddits/gold', qs: options });
  }

  /**
   * @summary Gets a list of default subreddits.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise} A Listing containing Subreddits
   * @example
   *
   * r.getDefaultSubreddits().then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */
  getDefaultSubreddits(options) {
    return this._getListing({ uri: 'subreddits/default', qs: options });
  }

  /**
   * @summary Checks whether a given username is available for registration
   * @desc **Note:** This function will not work when snoowrap is running in a browser, due to an issue with reddit's CORS
   settings.
   * @param {string} name The username in question
   * @returns {Promise} A Promise that fulfills with a Boolean (`true` or `false`)
   * @example
   *
   * r.checkUsernameAvailability('not_an_aardvark').then(console.log)
   * // => false
   * r.checkUsernameAvailability('eqwZAr9qunx7IHqzWVeF').then(console.log)
   * // => true
   */
  checkUsernameAvailability(name) {
    // The oauth endpoint listed in reddit's documentation doesn't actually work, so just send an unauthenticated request.
    return this.unauthenticatedRequest({ uri: 'api/username_available.json', qs: { user: name } });
  }

  /**
   * @summary Creates a new LiveThread.
   * @param {object} options
   * @param {string} options.title The title of the livethread (100 characters max)
   * @param {string} [options.description] A descriptions of the thread. 120 characters max
   * @param {string} [options.resources] Information and useful links related to the thread. 120 characters max
   * @param {boolean} [options.nsfw=false] Determines whether the thread is Not Safe For Work
   * @returns {Promise} A Promise that fulfills with the new LiveThread when the request is complete
   * @example
   *
   * r.createLivethread({title: 'My livethread'}).then(console.log)
   * // => LiveThread { id: 'wpimncm1f01j' }
   */
  createLivethread(_ref11) {
    var _this10 = this;

    var title = _ref11.title,
        description = _ref11.description,
        resources = _ref11.resources,
        _ref11$nsfw = _ref11.nsfw,
        nsfw = _ref11$nsfw === undefined ? false : _ref11$nsfw;

    return this._post({
      uri: 'api/live/create',
      form: { api_type, description, nsfw, resources, title }
    }).tap((0, _helpers.handleJsonErrors)(this)).then(function (result) {
      return _this10.getLivethread(result.json.data.id);
    });
  }

  /**
   * @summary Gets the "happening now" LiveThread, if it exists
   * @desc This is the LiveThread that is occasionally linked at the top of reddit.com, relating to current events.
   * @returns {Promise} A Promise that fulfills with the "happening now" LiveThread if it exists, or rejects with a 404 error
   otherwise.
   * @example r.getCurrentEventsLivethread().then(thread => thread.stream.on('update', console.log))
   */
  getStickiedLivethread() {
    return this._get({ uri: 'api/live/happening_now' });
  }

  /**
   * @summary Gets the user's own multireddits.
   * @returns {Promise} A Promise for an Array containing the requester's MultiReddits.
   * @example
   *
   * r.getMyMultireddits().then(console.log)
   * => [ MultiReddit { ... }, MultiReddit { ... }, ... ]
   */
  getMyMultireddits() {
    return this._get({ uri: 'api/multi/mine', qs: { expand_srs: true } });
  }

  /**
   * @summary Creates a new multireddit.
   * @param {object} options
   * @param {string} options.name The name of the new multireddit. 50 characters max
   * @param {string} options.description A description for the new multireddit, in markdown.
   * @param {Array} options.subreddits An Array of Subreddit objects (or subreddit names) that this multireddit should compose of
   * @param {string} [options.visibility='private'] The multireddit's visibility setting. One of `private`, `public`, `hidden`.
   * @param {string} [options.icon_name=''] One of `art and design`, `ask`, `books`, `business`, `cars`, `comics`,
   `cute animals`, `diy`, `entertainment`, `food and drink`, `funny`, `games`, `grooming`, `health`, `life advice`, `military`,
   `models pinup`, `music`, `news`, `philosophy`, `pictures and gifs`, `science`, `shopping`, `sports`, `style`, `tech`,
   `travel`, `unusual stories`, `video`, `None`
   * @param {string} [options.key_color='#000000'] A six-digit RGB hex color, preceded by '#'
   * @param {string} [options.weighting_scheme='classic'] One of `classic`, `fresh`
   * @returns {Promise} A Promise for the newly-created MultiReddit object
   * @example
   *
   * r.createMultireddit({
   *   name: 'myMulti',
   *   description: 'An example multireddit',
   *   subreddits: ['snoowrap', 'snoowrap_testing']
   * }).then(console.log)
   * => MultiReddit { display_name: 'myMulti', ... }
   */
  createMultireddit(_ref12) {
    var name = _ref12.name,
        description = _ref12.description,
        subreddits = _ref12.subreddits,
        _ref12$visibility = _ref12.visibility,
        visibility = _ref12$visibility === undefined ? 'private' : _ref12$visibility,
        _ref12$icon_name = _ref12.icon_name,
        icon_name = _ref12$icon_name === undefined ? '' : _ref12$icon_name,
        _ref12$key_color = _ref12.key_color,
        key_color = _ref12$key_color === undefined ? '#000000' : _ref12$key_color,
        _ref12$weighting_sche = _ref12.weighting_scheme,
        weighting_scheme = _ref12$weighting_sche === undefined ? 'classic' : _ref12$weighting_sche;

    return this._post({
      uri: 'api/multi', form: {
        model: JSON.stringify({
          display_name: name,
          description_md: description,
          icon_name,
          key_color,
          subreddits: subreddits.map(function (sub) {
            return { name: typeof sub === 'string' ? sub : sub.display_name };
          }),
          visibility,
          weighting_scheme
        })
      }
    });
  }

  _revokeToken(token) {
    return this.credentialedClientRequest({ uri: 'api/v1/revoke_token', form: { token }, method: 'post' });
  }

  /**
   * @summary Invalidates the current access token.
   * @returns {Promise} A Promise that fulfills when this request is complete
   * @desc **Note**: This can only be used if the current requester was supplied with a `client_id` and `client_secret`. If the
   current requester was supplied with a refresh token, it will automatically create a new access token if any more requests
   are made after this one.
   * @example r.revokeAccessToken();
   */
  revokeAccessToken() {
    var _this11 = this;

    return this._revokeToken(this.accessToken).then(function () {
      _this11.accessToken = null;
      _this11.tokenExpiration = null;
    });
  }

  /**
   * @summary Invalidates the current refresh token.
   * @returns {Promise} A Promise that fulfills when this request is complete
   * @desc **Note**: This can only be used if the current requester was supplied with a `client_id` and `client_secret`. All
   access tokens generated by this refresh token will also be invalidated. This effectively de-authenticates the requester and
   prevents it from making any more valid requests. This should only be used in a few cases, e.g. if this token has
   been accidentally leaked to a third party.
   * @example r.revokeRefreshToken();
   */
  revokeRefreshToken() {
    var _this12 = this;

    return this._revokeToken(this.refreshToken).then(function () {
      _this12.refreshToken = null;
      _this12.accessToken = null; // Revoking a refresh token also revokes any associated access tokens.
      _this12.tokenExpiration = null;
    });
  }

  _selectFlair(_ref13) {
    var _this13 = this;

    var flair_template_id = _ref13.flair_template_id,
        link = _ref13.link,
        name = _ref13.name,
        text = _ref13.text,
        subredditName = _ref13.subredditName;

    if (!flair_template_id) {
      throw new errors.InvalidMethodCallError('No flair template ID provided');
    }
    return _Promise2.default.resolve(subredditName).then(function (subName) {
      return _this13._post({ uri: 'r/' + subName + '/api/selectflair', form: { api_type, flair_template_id, link, name, text } });
    });
  }

  _assignFlair(_ref14) {
    var _this14 = this;

    var css_class = _ref14.css_class,
        _ref14$cssClass = _ref14.cssClass,
        cssClass = _ref14$cssClass === undefined ? css_class : _ref14$cssClass,
        link = _ref14.link,
        name = _ref14.name,
        text = _ref14.text,
        subreddit_name = _ref14.subreddit_name,
        _ref14$subredditName = _ref14.subredditName,
        subredditName = _ref14$subredditName === undefined ? subreddit_name : _ref14$subredditName;

    return this._promiseWrap(_Promise2.default.resolve(subredditName).then(function (displayName) {
      return _this14._post({ uri: 'r/' + displayName + '/api/flair', form: { api_type, name, text, link, css_class: cssClass } });
    }));
  }

  _populate(responseTree) {
    var _this15 = this;

    if (typeof responseTree === 'object' && responseTree !== null) {
      // Map {kind: 't2', data: {name: 'some_username', ... }} to a RedditUser (e.g.) with the same properties
      if (Object.keys(responseTree).length === 2 && responseTree.kind && responseTree.data) {
        return this._newObject(_constants.KINDS[responseTree.kind] || 'RedditContent', this._populate(responseTree.data), true);
      }
      var result = (Array.isArray(responseTree) ? _map3.default : _mapValues3.default)(responseTree, function (value, key) {
        // Maps {author: 'some_username'} to {author: RedditUser { name: 'some_username' } }
        if (value !== null && _constants.USER_KEYS.has(key)) {
          return _this15._newObject('RedditUser', { name: value });
        }
        if (value !== null && _constants.SUBREDDIT_KEYS.has(key)) {
          return _this15._newObject('Subreddit', { display_name: value });
        }
        return _this15._populate(value);
      });
      if (result.length === 2 && result[0] instanceof snoowrap.objects.Listing && result[0][0] instanceof snoowrap.objects.Submission && result[1] instanceof snoowrap.objects.Listing) {
        if (result[1]._more && !result[1]._more.link_id) {
          result[1]._more.link_id = result[0][0].name;
        }
        result[0][0].comments = result[1];
        return result[0][0];
      }
      return result;
    }
    return responseTree;
  }

  _getListing(_ref15) {
    var uri = _ref15.uri,
        _ref15$qs = _ref15.qs,
        qs = _ref15$qs === undefined ? {} : _ref15$qs,
        options = _objectWithoutProperties(_ref15, ['uri', 'qs']);

    /* When the response type is expected to be a Listing, add a `count` parameter with a very high number.
    This ensures that reddit returns a `before` property in the resulting Listing to enable pagination.
    (Aside from the additional parameter, this function is equivalent to snoowrap.prototype._get) */
    var mergedQuery = _extends({ count: 9999 }, qs);
    return qs.limit || !(0, _isEmpty3.default)(options) ? this._newObject('Listing', _extends({ _query: mergedQuery, _uri: uri }, options)).fetchMore(qs.limit || _constants.MAX_LISTING_ITEMS)
    /* This second case is used as a fallback in case the endpoint unexpectedly ends up returning something other than a
    Listing (e.g. Submission#getRelated, which used to return a Listing but no longer does due to upstream reddit API
    changes), in which case using fetch_more() as above will throw an error.
     This fallback only works if there are no other meta-properties provided for the Listing, such as _transform. If there are
    other meta-properties,  the function will still end up throwing an error, but there's not really any good way to handle it
    (predicting upstream changes can only go so far). More importantly, in the limited cases where it's used, the fallback
    should have no effect on the returned results */
    : this._get({ uri, qs: mergedQuery }).then(function (listing) {
      if (Array.isArray(listing)) {
        listing.filter(function (item) {
          return item.constructor._name === 'Comment';
        }).forEach(_helpers.addEmptyRepliesListing);
      }
      return listing;
    });
  }

  /**
   * @summary In browsers, restores the `window.snoowrap` property to whatever it was before this instance of snoowrap was
   loaded. This is a no-op in Node.
   * @returns This instance of the snoowrap constructor
   * @example var snoowrap = window.snoowrap.noConflict();
   */
  static noConflict() {
    if (_helpers.isBrowser) {
      global[_constants.MODULE_NAME] = this._previousSnoowrap;
    }
    return this;
  }
};

function identity(value) {
  return value;
}

(0, _helpers.defineInspectFunc)(snoowrap.prototype, function () {
  // Hide confidential information (tokens, client IDs, etc.), as well as private properties, from the console.log output.
  var keysForHiddenValues = ['clientSecret', 'refreshToken', 'accessToken', 'password'];
  var formatted = (0, _mapValues3.default)((0, _omitBy3.default)(this, function (value, key) {
    return typeof key === 'string' && key.startsWith('_');
  }), function (value, key) {
    return (0, _includes3.default)(keysForHiddenValues, key) ? value && '(redacted)' : value;
  });
  return _constants.MODULE_NAME + ' ' + _util2.default.inspect(formatted);
});

var classFuncDescriptors = { configurable: true, writable: true };

/* Add the request_handler functions (oauth_request, credentialed_client_request, etc.) to the snoowrap prototype. Use
Object.defineProperties to ensure that the properties are non-enumerable. */
Object.defineProperties(snoowrap.prototype, (0, _mapValues3.default)(requestHandler, function (func) {
  return _extends({ value: func }, classFuncDescriptors);
}));

_constants.HTTP_VERBS.forEach(function (method) {
  /* Define method shortcuts for each of the HTTP verbs. i.e. `snoowrap.prototype._post` is the same as `oauth_request` except
  that the HTTP method defaults to `post`, and the result is promise-wrapped. Use Object.defineProperty to ensure that the
  properties are non-enumerable. */
  Object.defineProperty(snoowrap.prototype, '_' + method, _extends({
    value(options) {
      return this._promiseWrap(this.oauthRequest(_extends({}, options, { method })));
    } }, classFuncDescriptors));
});

/* `objects` will be an object containing getters for each content type, due to the way objects are exported from
objects/index.js. To unwrap these getters into direct properties, use lodash.mapValues with an identity function. */
snoowrap.objects = (0, _mapValues3.default)(objects, function (value) {
  return value;
});

(0, _forOwn3.default)(_constants.KINDS, function (value) {
  snoowrap.objects[value] = snoowrap.objects[value] || class extends objects.RedditContent {};
  Object.defineProperty(snoowrap.objects[value], '_name', { value, configurable: true });
});

// Alias all functions on snoowrap's prototype and snoowrap's object prototypes in snake_case.
(0, _values3.default)(snoowrap.objects).concat(snoowrap).map(function (func) {
  return func.prototype;
}).forEach(function (funcProto) {
  Object.getOwnPropertyNames(funcProto).filter(function (name) {
    return !name.startsWith('_') && name !== (0, _snakeCase3.default)(name) && typeof funcProto[name] === 'function';
  }).forEach(function (name) {
    return Object.defineProperty(funcProto, (0, _snakeCase3.default)(name), _extends({ value: funcProto[name] }, classFuncDescriptors));
  });
});

snoowrap.errors = errors;
snoowrap.version = _constants.VERSION;

if (!module.parent && _helpers.isBrowser) {
  // check if the code is being run in a browser through browserify, etc.
  snoowrap._previousSnoowrap = global[_constants.MODULE_NAME];
  global[_constants.MODULE_NAME] = snoowrap;
}

module.exports = snoowrap;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./Promise.js":1,"./constants.js":2,"./create_config.js":3,"./errors.js":4,"./helpers.js":5,"./objects/index.js":21,"./request_handler.js":22,"lodash/defaults":241,"lodash/forOwn":248,"lodash/includes":252,"lodash/isEmpty":258,"lodash/map":273,"lodash/mapValues":274,"lodash/omit":280,"lodash/omitBy":281,"lodash/snakeCase":287,"lodash/values":295,"promise-chains":300,"util":27}],24:[function(require,module,exports){
'use strict';

var _Promise = require('./Promise.js');

var _Promise2 = _interopRequireDefault(_Promise);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _querystring = require('querystring');

var _errors = require('./errors.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Provide a shim for some of the functionality of the `request-promise` npm package in browsers.
// Previously, snoowrap depended on browserify to package `request-promise` for the browser bundle, and while this worked
// properly, it caused the snoowrap bundle to be very large since `request-promise` contains many dependencies that snoowrap
// doesn't actually need.

/* eslint-env browser */
function noop() {}

function tryParseJson(maybeJson) {
  try {
    return JSON.parse(maybeJson);
  } catch (e) {
    return maybeJson;
  }
}

function parseHeaders(headerString) {
  return headerString.split('\r\n').filter(function (line) {
    return line;
  }).reduce(function (accumulator, line) {
    var index = line.indexOf(': ');
    accumulator[line.slice(0, index)] = line.slice(index + 2);
    return accumulator;
  }, {});
}

module.exports = function rawRequest(options) {
  // It would be nice to be able to use the `URL` API in browsers, but Safari 9 doesn't support `URLSearchParams`.
  var parsedUrl = _url2.default.parse(options.url || _url2.default.resolve(options.baseUrl, options.uri), true);
  parsedUrl.search = (0, _querystring.stringify)(Object.assign({}, parsedUrl.query, options.qs));
  // create a new url object with the new qs params, to ensure that the `href` value changes (to use later for parsing response)
  var finalUrl = _url2.default.parse(parsedUrl.format());
  var xhr = new XMLHttpRequest();
  var method = options.method ? options.method.toUpperCase() : 'GET';
  xhr.open(method, finalUrl.href);
  Object.keys(options.headers).filter(function (header) {
    return header.toLowerCase() !== 'user-agent';
  }).forEach(function (key) {
    return xhr.setRequestHeader(key, options.headers[key]);
  });
  if (options.auth) {
    xhr.setRequestHeader('Authorization', options.auth.bearer ? 'bearer ' + options.auth.bearer : 'basic ' + btoa(options.auth.user + ':' + options.auth.pass));
  }

  var requestBody = void 0;
  if (options.formData) {
    requestBody = new FormData();
    Object.keys(options.formData).forEach(function (key) {
      return requestBody.append(key, options.formData[key]);
    });
    if (options.form) {
      Object.keys(options.form).forEach(function (key) {
        return requestBody.append(key, options.form[key]);
      });
    }
    xhr.setRequestHeader('Content-Type', 'multipart/form-data');
  } else if (options.form) {
    requestBody = (0, _querystring.stringify)(options.form);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  } else if (options.json) {
    requestBody = JSON.stringify(options.body);
    xhr.setRequestHeader('Content-Type', 'application/json');
  } else {
    requestBody = options.body;
  }

  return new _Promise2.default(function (resolve, reject, onCancel) {
    onCancel(function () {
      return xhr.abort();
    });
    xhr.onload = function () {
      var _this = this;

      var success = this.status >= 200 && this.status < 300;
      var settleFunc = success ? resolve : function (err) {
        return reject(Object.assign(new _errors.StatusCodeError(_this.status + ''), err));
      };
      var response = {
        statusCode: this.status,
        body: (options.json ? tryParseJson : noop)(xhr.response),
        headers: parseHeaders(xhr.getAllResponseHeaders()),
        request: { method, uri: finalUrl }
      };
      if (typeof options.transform === 'function') {
        settleFunc(options.transform(response.body, response));
      } else if (!success || options.resolveWithFullResponse) {
        settleFunc(response);
      } else {
        settleFunc(response.body);
      }
    };
    xhr.onerror = function (err) {
      return reject(Object.assign(new _errors.RequestError(), err));
    };
    xhr.send(requestBody);
  }).timeout(options.timeout || Math.pow(2, 31) - 1, 'Error: ETIMEDOUT').catch(_Promise2.default.TimeoutError, function (err) {
    xhr.abort();
    throw err;
  });
};
},{"./Promise.js":1,"./errors.js":4,"querystring":303,"url":321}],25:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],26:[function(require,module,exports){
(function (process,global,setImmediate){
/* @preserve
 * The MIT License (MIT)
 * 
 * Copyright (c) 2013-2018 Petka Antonov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
/**
 * bluebird build version 3.5.5
 * Features enabled: core, race, call_get, generators, map, nodeify, promisify, props, reduce, settle, some, using, timers, filter, any, each
*/
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Promise=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var SomePromiseArray = Promise._SomePromiseArray;
function any(promises) {
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(1);
    ret.setUnwrap();
    ret.init();
    return promise;
}

Promise.any = function (promises) {
    return any(promises);
};

Promise.prototype.any = function () {
    return any(this);
};

};

},{}],2:[function(_dereq_,module,exports){
"use strict";
var firstLineError;
try {throw new Error(); } catch (e) {firstLineError = e;}
var schedule = _dereq_("./schedule");
var Queue = _dereq_("./queue");
var util = _dereq_("./util");

function Async() {
    this._customScheduler = false;
    this._isTickUsed = false;
    this._lateQueue = new Queue(16);
    this._normalQueue = new Queue(16);
    this._haveDrainedQueues = false;
    this._trampolineEnabled = true;
    var self = this;
    this.drainQueues = function () {
        self._drainQueues();
    };
    this._schedule = schedule;
}

Async.prototype.setScheduler = function(fn) {
    var prev = this._schedule;
    this._schedule = fn;
    this._customScheduler = true;
    return prev;
};

Async.prototype.hasCustomScheduler = function() {
    return this._customScheduler;
};

Async.prototype.enableTrampoline = function() {
    this._trampolineEnabled = true;
};

Async.prototype.disableTrampolineIfNecessary = function() {
    if (util.hasDevTools) {
        this._trampolineEnabled = false;
    }
};

Async.prototype.haveItemsQueued = function () {
    return this._isTickUsed || this._haveDrainedQueues;
};


Async.prototype.fatalError = function(e, isNode) {
    if (isNode) {
        process.stderr.write("Fatal " + (e instanceof Error ? e.stack : e) +
            "\n");
        process.exit(2);
    } else {
        this.throwLater(e);
    }
};

Async.prototype.throwLater = function(fn, arg) {
    if (arguments.length === 1) {
        arg = fn;
        fn = function () { throw arg; };
    }
    if (typeof setTimeout !== "undefined") {
        setTimeout(function() {
            fn(arg);
        }, 0);
    } else try {
        this._schedule(function() {
            fn(arg);
        });
    } catch (e) {
        throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
};

function AsyncInvokeLater(fn, receiver, arg) {
    this._lateQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncInvoke(fn, receiver, arg) {
    this._normalQueue.push(fn, receiver, arg);
    this._queueTick();
}

function AsyncSettlePromises(promise) {
    this._normalQueue._pushOne(promise);
    this._queueTick();
}

if (!util.hasDevTools) {
    Async.prototype.invokeLater = AsyncInvokeLater;
    Async.prototype.invoke = AsyncInvoke;
    Async.prototype.settlePromises = AsyncSettlePromises;
} else {
    Async.prototype.invokeLater = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvokeLater.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                setTimeout(function() {
                    fn.call(receiver, arg);
                }, 100);
            });
        }
    };

    Async.prototype.invoke = function (fn, receiver, arg) {
        if (this._trampolineEnabled) {
            AsyncInvoke.call(this, fn, receiver, arg);
        } else {
            this._schedule(function() {
                fn.call(receiver, arg);
            });
        }
    };

    Async.prototype.settlePromises = function(promise) {
        if (this._trampolineEnabled) {
            AsyncSettlePromises.call(this, promise);
        } else {
            this._schedule(function() {
                promise._settlePromises();
            });
        }
    };
}

function _drainQueue(queue) {
    while (queue.length() > 0) {
        _drainQueueStep(queue);
    }
}

function _drainQueueStep(queue) {
    var fn = queue.shift();
    if (typeof fn !== "function") {
        fn._settlePromises();
    } else {
        var receiver = queue.shift();
        var arg = queue.shift();
        fn.call(receiver, arg);
    }
}

Async.prototype._drainQueues = function () {
    _drainQueue(this._normalQueue);
    this._reset();
    this._haveDrainedQueues = true;
    _drainQueue(this._lateQueue);
};

Async.prototype._queueTick = function () {
    if (!this._isTickUsed) {
        this._isTickUsed = true;
        this._schedule(this.drainQueues);
    }
};

Async.prototype._reset = function () {
    this._isTickUsed = false;
};

module.exports = Async;
module.exports.firstLineError = firstLineError;

},{"./queue":26,"./schedule":29,"./util":36}],3:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise, debug) {
var calledBind = false;
var rejectThis = function(_, e) {
    this._reject(e);
};

var targetRejected = function(e, context) {
    context.promiseRejectionQueued = true;
    context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
};

var bindingResolved = function(thisArg, context) {
    if (((this._bitField & 50397184) === 0)) {
        this._resolveCallback(context.target);
    }
};

var bindingRejected = function(e, context) {
    if (!context.promiseRejectionQueued) this._reject(e);
};

Promise.prototype.bind = function (thisArg) {
    if (!calledBind) {
        calledBind = true;
        Promise.prototype._propagateFrom = debug.propagateFromFunction();
        Promise.prototype._boundValue = debug.boundValueFunction();
    }
    var maybePromise = tryConvertToPromise(thisArg);
    var ret = new Promise(INTERNAL);
    ret._propagateFrom(this, 1);
    var target = this._target();
    ret._setBoundTo(maybePromise);
    if (maybePromise instanceof Promise) {
        var context = {
            promiseRejectionQueued: false,
            promise: ret,
            target: target,
            bindingPromise: maybePromise
        };
        target._then(INTERNAL, targetRejected, undefined, ret, context);
        maybePromise._then(
            bindingResolved, bindingRejected, undefined, ret, context);
        ret._setOnCancel(maybePromise);
    } else {
        ret._resolveCallback(target);
    }
    return ret;
};

Promise.prototype._setBoundTo = function (obj) {
    if (obj !== undefined) {
        this._bitField = this._bitField | 2097152;
        this._boundTo = obj;
    } else {
        this._bitField = this._bitField & (~2097152);
    }
};

Promise.prototype._isBound = function () {
    return (this._bitField & 2097152) === 2097152;
};

Promise.bind = function (thisArg, value) {
    return Promise.resolve(value).bind(thisArg);
};
};

},{}],4:[function(_dereq_,module,exports){
"use strict";
var old;
if (typeof Promise !== "undefined") old = Promise;
function noConflict() {
    try { if (Promise === bluebird) Promise = old; }
    catch (e) {}
    return bluebird;
}
var bluebird = _dereq_("./promise")();
bluebird.noConflict = noConflict;
module.exports = bluebird;

},{"./promise":22}],5:[function(_dereq_,module,exports){
"use strict";
var cr = Object.create;
if (cr) {
    var callerCache = cr(null);
    var getterCache = cr(null);
    callerCache[" size"] = getterCache[" size"] = 0;
}

module.exports = function(Promise) {
var util = _dereq_("./util");
var canEvaluate = util.canEvaluate;
var isIdentifier = util.isIdentifier;

var getMethodCaller;
var getGetter;
if (!true) {
var makeMethodCaller = function (methodName) {
    return new Function("ensureMethod", "                                    \n\
        return function(obj) {                                               \n\
            'use strict'                                                     \n\
            var len = this.length;                                           \n\
            ensureMethod(obj, 'methodName');                                 \n\
            switch(len) {                                                    \n\
                case 1: return obj.methodName(this[0]);                      \n\
                case 2: return obj.methodName(this[0], this[1]);             \n\
                case 3: return obj.methodName(this[0], this[1], this[2]);    \n\
                case 0: return obj.methodName();                             \n\
                default:                                                     \n\
                    return obj.methodName.apply(obj, this);                  \n\
            }                                                                \n\
        };                                                                   \n\
        ".replace(/methodName/g, methodName))(ensureMethod);
};

var makeGetter = function (propertyName) {
    return new Function("obj", "                                             \n\
        'use strict';                                                        \n\
        return obj.propertyName;                                             \n\
        ".replace("propertyName", propertyName));
};

var getCompiled = function(name, compiler, cache) {
    var ret = cache[name];
    if (typeof ret !== "function") {
        if (!isIdentifier(name)) {
            return null;
        }
        ret = compiler(name);
        cache[name] = ret;
        cache[" size"]++;
        if (cache[" size"] > 512) {
            var keys = Object.keys(cache);
            for (var i = 0; i < 256; ++i) delete cache[keys[i]];
            cache[" size"] = keys.length - 256;
        }
    }
    return ret;
};

getMethodCaller = function(name) {
    return getCompiled(name, makeMethodCaller, callerCache);
};

getGetter = function(name) {
    return getCompiled(name, makeGetter, getterCache);
};
}

function ensureMethod(obj, methodName) {
    var fn;
    if (obj != null) fn = obj[methodName];
    if (typeof fn !== "function") {
        var message = "Object " + util.classString(obj) + " has no method '" +
            util.toString(methodName) + "'";
        throw new Promise.TypeError(message);
    }
    return fn;
}

function caller(obj) {
    var methodName = this.pop();
    var fn = ensureMethod(obj, methodName);
    return fn.apply(obj, this);
}
Promise.prototype.call = function (methodName) {
    var args = [].slice.call(arguments, 1);;
    if (!true) {
        if (canEvaluate) {
            var maybeCaller = getMethodCaller(methodName);
            if (maybeCaller !== null) {
                return this._then(
                    maybeCaller, undefined, undefined, args, undefined);
            }
        }
    }
    args.push(methodName);
    return this._then(caller, undefined, undefined, args, undefined);
};

function namedGetter(obj) {
    return obj[this];
}
function indexedGetter(obj) {
    var index = +this;
    if (index < 0) index = Math.max(0, index + obj.length);
    return obj[index];
}
Promise.prototype.get = function (propertyName) {
    var isIndex = (typeof propertyName === "number");
    var getter;
    if (!isIndex) {
        if (canEvaluate) {
            var maybeGetter = getGetter(propertyName);
            getter = maybeGetter !== null ? maybeGetter : namedGetter;
        } else {
            getter = namedGetter;
        }
    } else {
        getter = indexedGetter;
    }
    return this._then(getter, undefined, undefined, propertyName, undefined);
};
};

},{"./util":36}],6:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, PromiseArray, apiRejection, debug) {
var util = _dereq_("./util");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var async = Promise._async;

Promise.prototype["break"] = Promise.prototype.cancel = function() {
    if (!debug.cancellation()) return this._warn("cancellation is disabled");

    var promise = this;
    var child = promise;
    while (promise._isCancellable()) {
        if (!promise._cancelBy(child)) {
            if (child._isFollowing()) {
                child._followee().cancel();
            } else {
                child._cancelBranched();
            }
            break;
        }

        var parent = promise._cancellationParent;
        if (parent == null || !parent._isCancellable()) {
            if (promise._isFollowing()) {
                promise._followee().cancel();
            } else {
                promise._cancelBranched();
            }
            break;
        } else {
            if (promise._isFollowing()) promise._followee().cancel();
            promise._setWillBeCancelled();
            child = promise;
            promise = parent;
        }
    }
};

Promise.prototype._branchHasCancelled = function() {
    this._branchesRemainingToCancel--;
};

Promise.prototype._enoughBranchesHaveCancelled = function() {
    return this._branchesRemainingToCancel === undefined ||
           this._branchesRemainingToCancel <= 0;
};

Promise.prototype._cancelBy = function(canceller) {
    if (canceller === this) {
        this._branchesRemainingToCancel = 0;
        this._invokeOnCancel();
        return true;
    } else {
        this._branchHasCancelled();
        if (this._enoughBranchesHaveCancelled()) {
            this._invokeOnCancel();
            return true;
        }
    }
    return false;
};

Promise.prototype._cancelBranched = function() {
    if (this._enoughBranchesHaveCancelled()) {
        this._cancel();
    }
};

Promise.prototype._cancel = function() {
    if (!this._isCancellable()) return;
    this._setCancelled();
    async.invoke(this._cancelPromises, this, undefined);
};

Promise.prototype._cancelPromises = function() {
    if (this._length() > 0) this._settlePromises();
};

Promise.prototype._unsetOnCancel = function() {
    this._onCancelField = undefined;
};

Promise.prototype._isCancellable = function() {
    return this.isPending() && !this._isCancelled();
};

Promise.prototype.isCancellable = function() {
    return this.isPending() && !this.isCancelled();
};

Promise.prototype._doInvokeOnCancel = function(onCancelCallback, internalOnly) {
    if (util.isArray(onCancelCallback)) {
        for (var i = 0; i < onCancelCallback.length; ++i) {
            this._doInvokeOnCancel(onCancelCallback[i], internalOnly);
        }
    } else if (onCancelCallback !== undefined) {
        if (typeof onCancelCallback === "function") {
            if (!internalOnly) {
                var e = tryCatch(onCancelCallback).call(this._boundValue());
                if (e === errorObj) {
                    this._attachExtraTrace(e.e);
                    async.throwLater(e.e);
                }
            }
        } else {
            onCancelCallback._resultCancelled(this);
        }
    }
};

Promise.prototype._invokeOnCancel = function() {
    var onCancelCallback = this._onCancel();
    this._unsetOnCancel();
    async.invoke(this._doInvokeOnCancel, this, onCancelCallback);
};

Promise.prototype._invokeInternalOnCancel = function() {
    if (this._isCancellable()) {
        this._doInvokeOnCancel(this._onCancel(), true);
        this._unsetOnCancel();
    }
};

Promise.prototype._resultCancelled = function() {
    this.cancel();
};

};

},{"./util":36}],7:[function(_dereq_,module,exports){
"use strict";
module.exports = function(NEXT_FILTER) {
var util = _dereq_("./util");
var getKeys = _dereq_("./es5").keys;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function catchFilter(instances, cb, promise) {
    return function(e) {
        var boundTo = promise._boundValue();
        predicateLoop: for (var i = 0; i < instances.length; ++i) {
            var item = instances[i];

            if (item === Error ||
                (item != null && item.prototype instanceof Error)) {
                if (e instanceof item) {
                    return tryCatch(cb).call(boundTo, e);
                }
            } else if (typeof item === "function") {
                var matchesPredicate = tryCatch(item).call(boundTo, e);
                if (matchesPredicate === errorObj) {
                    return matchesPredicate;
                } else if (matchesPredicate) {
                    return tryCatch(cb).call(boundTo, e);
                }
            } else if (util.isObject(e)) {
                var keys = getKeys(item);
                for (var j = 0; j < keys.length; ++j) {
                    var key = keys[j];
                    if (item[key] != e[key]) {
                        continue predicateLoop;
                    }
                }
                return tryCatch(cb).call(boundTo, e);
            }
        }
        return NEXT_FILTER;
    };
}

return catchFilter;
};

},{"./es5":13,"./util":36}],8:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var longStackTraces = false;
var contextStack = [];

Promise.prototype._promiseCreated = function() {};
Promise.prototype._pushContext = function() {};
Promise.prototype._popContext = function() {return null;};
Promise._peekContext = Promise.prototype._peekContext = function() {};

function Context() {
    this._trace = new Context.CapturedTrace(peekContext());
}
Context.prototype._pushContext = function () {
    if (this._trace !== undefined) {
        this._trace._promiseCreated = null;
        contextStack.push(this._trace);
    }
};

Context.prototype._popContext = function () {
    if (this._trace !== undefined) {
        var trace = contextStack.pop();
        var ret = trace._promiseCreated;
        trace._promiseCreated = null;
        return ret;
    }
    return null;
};

function createContext() {
    if (longStackTraces) return new Context();
}

function peekContext() {
    var lastIndex = contextStack.length - 1;
    if (lastIndex >= 0) {
        return contextStack[lastIndex];
    }
    return undefined;
}
Context.CapturedTrace = null;
Context.create = createContext;
Context.deactivateLongStackTraces = function() {};
Context.activateLongStackTraces = function() {
    var Promise_pushContext = Promise.prototype._pushContext;
    var Promise_popContext = Promise.prototype._popContext;
    var Promise_PeekContext = Promise._peekContext;
    var Promise_peekContext = Promise.prototype._peekContext;
    var Promise_promiseCreated = Promise.prototype._promiseCreated;
    Context.deactivateLongStackTraces = function() {
        Promise.prototype._pushContext = Promise_pushContext;
        Promise.prototype._popContext = Promise_popContext;
        Promise._peekContext = Promise_PeekContext;
        Promise.prototype._peekContext = Promise_peekContext;
        Promise.prototype._promiseCreated = Promise_promiseCreated;
        longStackTraces = false;
    };
    longStackTraces = true;
    Promise.prototype._pushContext = Context.prototype._pushContext;
    Promise.prototype._popContext = Context.prototype._popContext;
    Promise._peekContext = Promise.prototype._peekContext = peekContext;
    Promise.prototype._promiseCreated = function() {
        var ctx = this._peekContext();
        if (ctx && ctx._promiseCreated == null) ctx._promiseCreated = this;
    };
};
return Context;
};

},{}],9:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, Context) {
var getDomain = Promise._getDomain;
var async = Promise._async;
var Warning = _dereq_("./errors").Warning;
var util = _dereq_("./util");
var es5 = _dereq_("./es5");
var canAttachTrace = util.canAttachTrace;
var unhandledRejectionHandled;
var possiblyUnhandledRejection;
var bluebirdFramePattern =
    /[\\\/]bluebird[\\\/]js[\\\/](release|debug|instrumented)/;
var nodeFramePattern = /\((?:timers\.js):\d+:\d+\)/;
var parseLinePattern = /[\/<\(](.+?):(\d+):(\d+)\)?\s*$/;
var stackFramePattern = null;
var formatStack = null;
var indentStackFrames = false;
var printWarning;
var debugging = !!(util.env("BLUEBIRD_DEBUG") != 0 &&
                        (true ||
                         util.env("BLUEBIRD_DEBUG") ||
                         util.env("NODE_ENV") === "development"));

var warnings = !!(util.env("BLUEBIRD_WARNINGS") != 0 &&
    (debugging || util.env("BLUEBIRD_WARNINGS")));

var longStackTraces = !!(util.env("BLUEBIRD_LONG_STACK_TRACES") != 0 &&
    (debugging || util.env("BLUEBIRD_LONG_STACK_TRACES")));

var wForgottenReturn = util.env("BLUEBIRD_W_FORGOTTEN_RETURN") != 0 &&
    (warnings || !!util.env("BLUEBIRD_W_FORGOTTEN_RETURN"));

Promise.prototype.suppressUnhandledRejections = function() {
    var target = this._target();
    target._bitField = ((target._bitField & (~1048576)) |
                      524288);
};

Promise.prototype._ensurePossibleRejectionHandled = function () {
    if ((this._bitField & 524288) !== 0) return;
    this._setRejectionIsUnhandled();
    var self = this;
    setTimeout(function() {
        self._notifyUnhandledRejection();
    }, 1);
};

Promise.prototype._notifyUnhandledRejectionIsHandled = function () {
    fireRejectionEvent("rejectionHandled",
                                  unhandledRejectionHandled, undefined, this);
};

Promise.prototype._setReturnedNonUndefined = function() {
    this._bitField = this._bitField | 268435456;
};

Promise.prototype._returnedNonUndefined = function() {
    return (this._bitField & 268435456) !== 0;
};

Promise.prototype._notifyUnhandledRejection = function () {
    if (this._isRejectionUnhandled()) {
        var reason = this._settledValue();
        this._setUnhandledRejectionIsNotified();
        fireRejectionEvent("unhandledRejection",
                                      possiblyUnhandledRejection, reason, this);
    }
};

Promise.prototype._setUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField | 262144;
};

Promise.prototype._unsetUnhandledRejectionIsNotified = function () {
    this._bitField = this._bitField & (~262144);
};

Promise.prototype._isUnhandledRejectionNotified = function () {
    return (this._bitField & 262144) > 0;
};

Promise.prototype._setRejectionIsUnhandled = function () {
    this._bitField = this._bitField | 1048576;
};

Promise.prototype._unsetRejectionIsUnhandled = function () {
    this._bitField = this._bitField & (~1048576);
    if (this._isUnhandledRejectionNotified()) {
        this._unsetUnhandledRejectionIsNotified();
        this._notifyUnhandledRejectionIsHandled();
    }
};

Promise.prototype._isRejectionUnhandled = function () {
    return (this._bitField & 1048576) > 0;
};

Promise.prototype._warn = function(message, shouldUseOwnTrace, promise) {
    return warn(message, shouldUseOwnTrace, promise || this);
};

Promise.onPossiblyUnhandledRejection = function (fn) {
    var domain = getDomain();
    possiblyUnhandledRejection =
        typeof fn === "function" ? (domain === null ?
                                            fn : util.domainBind(domain, fn))
                                 : undefined;
};

Promise.onUnhandledRejectionHandled = function (fn) {
    var domain = getDomain();
    unhandledRejectionHandled =
        typeof fn === "function" ? (domain === null ?
                                            fn : util.domainBind(domain, fn))
                                 : undefined;
};

var disableLongStackTraces = function() {};
Promise.longStackTraces = function () {
    if (async.haveItemsQueued() && !config.longStackTraces) {
        throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    if (!config.longStackTraces && longStackTracesIsSupported()) {
        var Promise_captureStackTrace = Promise.prototype._captureStackTrace;
        var Promise_attachExtraTrace = Promise.prototype._attachExtraTrace;
        var Promise_dereferenceTrace = Promise.prototype._dereferenceTrace;
        config.longStackTraces = true;
        disableLongStackTraces = function() {
            if (async.haveItemsQueued() && !config.longStackTraces) {
                throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
            }
            Promise.prototype._captureStackTrace = Promise_captureStackTrace;
            Promise.prototype._attachExtraTrace = Promise_attachExtraTrace;
            Promise.prototype._dereferenceTrace = Promise_dereferenceTrace;
            Context.deactivateLongStackTraces();
            async.enableTrampoline();
            config.longStackTraces = false;
        };
        Promise.prototype._captureStackTrace = longStackTracesCaptureStackTrace;
        Promise.prototype._attachExtraTrace = longStackTracesAttachExtraTrace;
        Promise.prototype._dereferenceTrace = longStackTracesDereferenceTrace;
        Context.activateLongStackTraces();
        async.disableTrampolineIfNecessary();
    }
};

Promise.hasLongStackTraces = function () {
    return config.longStackTraces && longStackTracesIsSupported();
};

var fireDomEvent = (function() {
    try {
        if (typeof CustomEvent === "function") {
            var event = new CustomEvent("CustomEvent");
            util.global.dispatchEvent(event);
            return function(name, event) {
                var eventData = {
                    detail: event,
                    cancelable: true
                };
                es5.defineProperty(
                    eventData, "promise", {value: event.promise});
                es5.defineProperty(eventData, "reason", {value: event.reason});
                var domEvent = new CustomEvent(name.toLowerCase(), eventData);
                return !util.global.dispatchEvent(domEvent);
            };
        } else if (typeof Event === "function") {
            var event = new Event("CustomEvent");
            util.global.dispatchEvent(event);
            return function(name, event) {
                var domEvent = new Event(name.toLowerCase(), {
                    cancelable: true
                });
                domEvent.detail = event;
                es5.defineProperty(domEvent, "promise", {value: event.promise});
                es5.defineProperty(domEvent, "reason", {value: event.reason});
                return !util.global.dispatchEvent(domEvent);
            };
        } else {
            var event = document.createEvent("CustomEvent");
            event.initCustomEvent("testingtheevent", false, true, {});
            util.global.dispatchEvent(event);
            return function(name, event) {
                var domEvent = document.createEvent("CustomEvent");
                domEvent.initCustomEvent(name.toLowerCase(), false, true,
                    event);
                return !util.global.dispatchEvent(domEvent);
            };
        }
    } catch (e) {}
    return function() {
        return false;
    };
})();

var fireGlobalEvent = (function() {
    if (util.isNode) {
        return function() {
            return process.emit.apply(process, arguments);
        };
    } else {
        if (!util.global) {
            return function() {
                return false;
            };
        }
        return function(name) {
            var methodName = "on" + name.toLowerCase();
            var method = util.global[methodName];
            if (!method) return false;
            method.apply(util.global, [].slice.call(arguments, 1));
            return true;
        };
    }
})();

function generatePromiseLifecycleEventObject(name, promise) {
    return {promise: promise};
}

var eventToObjectGenerator = {
    promiseCreated: generatePromiseLifecycleEventObject,
    promiseFulfilled: generatePromiseLifecycleEventObject,
    promiseRejected: generatePromiseLifecycleEventObject,
    promiseResolved: generatePromiseLifecycleEventObject,
    promiseCancelled: generatePromiseLifecycleEventObject,
    promiseChained: function(name, promise, child) {
        return {promise: promise, child: child};
    },
    warning: function(name, warning) {
        return {warning: warning};
    },
    unhandledRejection: function (name, reason, promise) {
        return {reason: reason, promise: promise};
    },
    rejectionHandled: generatePromiseLifecycleEventObject
};

var activeFireEvent = function (name) {
    var globalEventFired = false;
    try {
        globalEventFired = fireGlobalEvent.apply(null, arguments);
    } catch (e) {
        async.throwLater(e);
        globalEventFired = true;
    }

    var domEventFired = false;
    try {
        domEventFired = fireDomEvent(name,
                    eventToObjectGenerator[name].apply(null, arguments));
    } catch (e) {
        async.throwLater(e);
        domEventFired = true;
    }

    return domEventFired || globalEventFired;
};

Promise.config = function(opts) {
    opts = Object(opts);
    if ("longStackTraces" in opts) {
        if (opts.longStackTraces) {
            Promise.longStackTraces();
        } else if (!opts.longStackTraces && Promise.hasLongStackTraces()) {
            disableLongStackTraces();
        }
    }
    if ("warnings" in opts) {
        var warningsOption = opts.warnings;
        config.warnings = !!warningsOption;
        wForgottenReturn = config.warnings;

        if (util.isObject(warningsOption)) {
            if ("wForgottenReturn" in warningsOption) {
                wForgottenReturn = !!warningsOption.wForgottenReturn;
            }
        }
    }
    if ("cancellation" in opts && opts.cancellation && !config.cancellation) {
        if (async.haveItemsQueued()) {
            throw new Error(
                "cannot enable cancellation after promises are in use");
        }
        Promise.prototype._clearCancellationData =
            cancellationClearCancellationData;
        Promise.prototype._propagateFrom = cancellationPropagateFrom;
        Promise.prototype._onCancel = cancellationOnCancel;
        Promise.prototype._setOnCancel = cancellationSetOnCancel;
        Promise.prototype._attachCancellationCallback =
            cancellationAttachCancellationCallback;
        Promise.prototype._execute = cancellationExecute;
        propagateFromFunction = cancellationPropagateFrom;
        config.cancellation = true;
    }
    if ("monitoring" in opts) {
        if (opts.monitoring && !config.monitoring) {
            config.monitoring = true;
            Promise.prototype._fireEvent = activeFireEvent;
        } else if (!opts.monitoring && config.monitoring) {
            config.monitoring = false;
            Promise.prototype._fireEvent = defaultFireEvent;
        }
    }
    return Promise;
};

function defaultFireEvent() { return false; }

Promise.prototype._fireEvent = defaultFireEvent;
Promise.prototype._execute = function(executor, resolve, reject) {
    try {
        executor(resolve, reject);
    } catch (e) {
        return e;
    }
};
Promise.prototype._onCancel = function () {};
Promise.prototype._setOnCancel = function (handler) { ; };
Promise.prototype._attachCancellationCallback = function(onCancel) {
    ;
};
Promise.prototype._captureStackTrace = function () {};
Promise.prototype._attachExtraTrace = function () {};
Promise.prototype._dereferenceTrace = function () {};
Promise.prototype._clearCancellationData = function() {};
Promise.prototype._propagateFrom = function (parent, flags) {
    ;
    ;
};

function cancellationExecute(executor, resolve, reject) {
    var promise = this;
    try {
        executor(resolve, reject, function(onCancel) {
            if (typeof onCancel !== "function") {
                throw new TypeError("onCancel must be a function, got: " +
                                    util.toString(onCancel));
            }
            promise._attachCancellationCallback(onCancel);
        });
    } catch (e) {
        return e;
    }
}

function cancellationAttachCancellationCallback(onCancel) {
    if (!this._isCancellable()) return this;

    var previousOnCancel = this._onCancel();
    if (previousOnCancel !== undefined) {
        if (util.isArray(previousOnCancel)) {
            previousOnCancel.push(onCancel);
        } else {
            this._setOnCancel([previousOnCancel, onCancel]);
        }
    } else {
        this._setOnCancel(onCancel);
    }
}

function cancellationOnCancel() {
    return this._onCancelField;
}

function cancellationSetOnCancel(onCancel) {
    this._onCancelField = onCancel;
}

function cancellationClearCancellationData() {
    this._cancellationParent = undefined;
    this._onCancelField = undefined;
}

function cancellationPropagateFrom(parent, flags) {
    if ((flags & 1) !== 0) {
        this._cancellationParent = parent;
        var branchesRemainingToCancel = parent._branchesRemainingToCancel;
        if (branchesRemainingToCancel === undefined) {
            branchesRemainingToCancel = 0;
        }
        parent._branchesRemainingToCancel = branchesRemainingToCancel + 1;
    }
    if ((flags & 2) !== 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
}

function bindingPropagateFrom(parent, flags) {
    if ((flags & 2) !== 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
    }
}
var propagateFromFunction = bindingPropagateFrom;

function boundValueFunction() {
    var ret = this._boundTo;
    if (ret !== undefined) {
        if (ret instanceof Promise) {
            if (ret.isFulfilled()) {
                return ret.value();
            } else {
                return undefined;
            }
        }
    }
    return ret;
}

function longStackTracesCaptureStackTrace() {
    this._trace = new CapturedTrace(this._peekContext());
}

function longStackTracesAttachExtraTrace(error, ignoreSelf) {
    if (canAttachTrace(error)) {
        var trace = this._trace;
        if (trace !== undefined) {
            if (ignoreSelf) trace = trace._parent;
        }
        if (trace !== undefined) {
            trace.attachExtraTrace(error);
        } else if (!error.__stackCleaned__) {
            var parsed = parseStackAndMessage(error);
            util.notEnumerableProp(error, "stack",
                parsed.message + "\n" + parsed.stack.join("\n"));
            util.notEnumerableProp(error, "__stackCleaned__", true);
        }
    }
}

function longStackTracesDereferenceTrace() {
    this._trace = undefined;
}

function checkForgottenReturns(returnValue, promiseCreated, name, promise,
                               parent) {
    if (returnValue === undefined && promiseCreated !== null &&
        wForgottenReturn) {
        if (parent !== undefined && parent._returnedNonUndefined()) return;
        if ((promise._bitField & 65535) === 0) return;

        if (name) name = name + " ";
        var handlerLine = "";
        var creatorLine = "";
        if (promiseCreated._trace) {
            var traceLines = promiseCreated._trace.stack.split("\n");
            var stack = cleanStack(traceLines);
            for (var i = stack.length - 1; i >= 0; --i) {
                var line = stack[i];
                if (!nodeFramePattern.test(line)) {
                    var lineMatches = line.match(parseLinePattern);
                    if (lineMatches) {
                        handlerLine  = "at " + lineMatches[1] +
                            ":" + lineMatches[2] + ":" + lineMatches[3] + " ";
                    }
                    break;
                }
            }

            if (stack.length > 0) {
                var firstUserLine = stack[0];
                for (var i = 0; i < traceLines.length; ++i) {

                    if (traceLines[i] === firstUserLine) {
                        if (i > 0) {
                            creatorLine = "\n" + traceLines[i - 1];
                        }
                        break;
                    }
                }

            }
        }
        var msg = "a promise was created in a " + name +
            "handler " + handlerLine + "but was not returned from it, " +
            "see http://goo.gl/rRqMUw" +
            creatorLine;
        promise._warn(msg, true, promiseCreated);
    }
}

function deprecated(name, replacement) {
    var message = name +
        " is deprecated and will be removed in a future version.";
    if (replacement) message += " Use " + replacement + " instead.";
    return warn(message);
}

function warn(message, shouldUseOwnTrace, promise) {
    if (!config.warnings) return;
    var warning = new Warning(message);
    var ctx;
    if (shouldUseOwnTrace) {
        promise._attachExtraTrace(warning);
    } else if (config.longStackTraces && (ctx = Promise._peekContext())) {
        ctx.attachExtraTrace(warning);
    } else {
        var parsed = parseStackAndMessage(warning);
        warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
    }

    if (!activeFireEvent("warning", warning)) {
        formatAndLogError(warning, "", true);
    }
}

function reconstructStack(message, stacks) {
    for (var i = 0; i < stacks.length - 1; ++i) {
        stacks[i].push("From previous event:");
        stacks[i] = stacks[i].join("\n");
    }
    if (i < stacks.length) {
        stacks[i] = stacks[i].join("\n");
    }
    return message + "\n" + stacks.join("\n");
}

function removeDuplicateOrEmptyJumps(stacks) {
    for (var i = 0; i < stacks.length; ++i) {
        if (stacks[i].length === 0 ||
            ((i + 1 < stacks.length) && stacks[i][0] === stacks[i+1][0])) {
            stacks.splice(i, 1);
            i--;
        }
    }
}

function removeCommonRoots(stacks) {
    var current = stacks[0];
    for (var i = 1; i < stacks.length; ++i) {
        var prev = stacks[i];
        var currentLastIndex = current.length - 1;
        var currentLastLine = current[currentLastIndex];
        var commonRootMeetPoint = -1;

        for (var j = prev.length - 1; j >= 0; --j) {
            if (prev[j] === currentLastLine) {
                commonRootMeetPoint = j;
                break;
            }
        }

        for (var j = commonRootMeetPoint; j >= 0; --j) {
            var line = prev[j];
            if (current[currentLastIndex] === line) {
                current.pop();
                currentLastIndex--;
            } else {
                break;
            }
        }
        current = prev;
    }
}

function cleanStack(stack) {
    var ret = [];
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        var isTraceLine = "    (No stack trace)" === line ||
            stackFramePattern.test(line);
        var isInternalFrame = isTraceLine && shouldIgnore(line);
        if (isTraceLine && !isInternalFrame) {
            if (indentStackFrames && line.charAt(0) !== " ") {
                line = "    " + line;
            }
            ret.push(line);
        }
    }
    return ret;
}

function stackFramesAsArray(error) {
    var stack = error.stack.replace(/\s+$/g, "").split("\n");
    for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        if ("    (No stack trace)" === line || stackFramePattern.test(line)) {
            break;
        }
    }
    if (i > 0 && error.name != "SyntaxError") {
        stack = stack.slice(i);
    }
    return stack;
}

function parseStackAndMessage(error) {
    var stack = error.stack;
    var message = error.toString();
    stack = typeof stack === "string" && stack.length > 0
                ? stackFramesAsArray(error) : ["    (No stack trace)"];
    return {
        message: message,
        stack: error.name == "SyntaxError" ? stack : cleanStack(stack)
    };
}

function formatAndLogError(error, title, isSoft) {
    if (typeof console !== "undefined") {
        var message;
        if (util.isObject(error)) {
            var stack = error.stack;
            message = title + formatStack(stack, error);
        } else {
            message = title + String(error);
        }
        if (typeof printWarning === "function") {
            printWarning(message, isSoft);
        } else if (typeof console.log === "function" ||
            typeof console.log === "object") {
            console.log(message);
        }
    }
}

function fireRejectionEvent(name, localHandler, reason, promise) {
    var localEventFired = false;
    try {
        if (typeof localHandler === "function") {
            localEventFired = true;
            if (name === "rejectionHandled") {
                localHandler(promise);
            } else {
                localHandler(reason, promise);
            }
        }
    } catch (e) {
        async.throwLater(e);
    }

    if (name === "unhandledRejection") {
        if (!activeFireEvent(name, reason, promise) && !localEventFired) {
            formatAndLogError(reason, "Unhandled rejection ");
        }
    } else {
        activeFireEvent(name, promise);
    }
}

function formatNonError(obj) {
    var str;
    if (typeof obj === "function") {
        str = "[function " +
            (obj.name || "anonymous") +
            "]";
    } else {
        str = obj && typeof obj.toString === "function"
            ? obj.toString() : util.toString(obj);
        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
        if (ruselessToString.test(str)) {
            try {
                var newStr = JSON.stringify(obj);
                str = newStr;
            }
            catch(e) {

            }
        }
        if (str.length === 0) {
            str = "(empty array)";
        }
    }
    return ("(<" + snip(str) + ">, no stack trace)");
}

function snip(str) {
    var maxChars = 41;
    if (str.length < maxChars) {
        return str;
    }
    return str.substr(0, maxChars - 3) + "...";
}

function longStackTracesIsSupported() {
    return typeof captureStackTrace === "function";
}

var shouldIgnore = function() { return false; };
var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
function parseLineInfo(line) {
    var matches = line.match(parseLineInfoRegex);
    if (matches) {
        return {
            fileName: matches[1],
            line: parseInt(matches[2], 10)
        };
    }
}

function setBounds(firstLineError, lastLineError) {
    if (!longStackTracesIsSupported()) return;
    var firstStackLines = (firstLineError.stack || "").split("\n");
    var lastStackLines = (lastLineError.stack || "").split("\n");
    var firstIndex = -1;
    var lastIndex = -1;
    var firstFileName;
    var lastFileName;
    for (var i = 0; i < firstStackLines.length; ++i) {
        var result = parseLineInfo(firstStackLines[i]);
        if (result) {
            firstFileName = result.fileName;
            firstIndex = result.line;
            break;
        }
    }
    for (var i = 0; i < lastStackLines.length; ++i) {
        var result = parseLineInfo(lastStackLines[i]);
        if (result) {
            lastFileName = result.fileName;
            lastIndex = result.line;
            break;
        }
    }
    if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName ||
        firstFileName !== lastFileName || firstIndex >= lastIndex) {
        return;
    }

    shouldIgnore = function(line) {
        if (bluebirdFramePattern.test(line)) return true;
        var info = parseLineInfo(line);
        if (info) {
            if (info.fileName === firstFileName &&
                (firstIndex <= info.line && info.line <= lastIndex)) {
                return true;
            }
        }
        return false;
    };
}

function CapturedTrace(parent) {
    this._parent = parent;
    this._promisesCreated = 0;
    var length = this._length = 1 + (parent === undefined ? 0 : parent._length);
    captureStackTrace(this, CapturedTrace);
    if (length > 32) this.uncycle();
}
util.inherits(CapturedTrace, Error);
Context.CapturedTrace = CapturedTrace;

CapturedTrace.prototype.uncycle = function() {
    var length = this._length;
    if (length < 2) return;
    var nodes = [];
    var stackToIndex = {};

    for (var i = 0, node = this; node !== undefined; ++i) {
        nodes.push(node);
        node = node._parent;
    }
    length = this._length = i;
    for (var i = length - 1; i >= 0; --i) {
        var stack = nodes[i].stack;
        if (stackToIndex[stack] === undefined) {
            stackToIndex[stack] = i;
        }
    }
    for (var i = 0; i < length; ++i) {
        var currentStack = nodes[i].stack;
        var index = stackToIndex[currentStack];
        if (index !== undefined && index !== i) {
            if (index > 0) {
                nodes[index - 1]._parent = undefined;
                nodes[index - 1]._length = 1;
            }
            nodes[i]._parent = undefined;
            nodes[i]._length = 1;
            var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;

            if (index < length - 1) {
                cycleEdgeNode._parent = nodes[index + 1];
                cycleEdgeNode._parent.uncycle();
                cycleEdgeNode._length =
                    cycleEdgeNode._parent._length + 1;
            } else {
                cycleEdgeNode._parent = undefined;
                cycleEdgeNode._length = 1;
            }
            var currentChildLength = cycleEdgeNode._length + 1;
            for (var j = i - 2; j >= 0; --j) {
                nodes[j]._length = currentChildLength;
                currentChildLength++;
            }
            return;
        }
    }
};

CapturedTrace.prototype.attachExtraTrace = function(error) {
    if (error.__stackCleaned__) return;
    this.uncycle();
    var parsed = parseStackAndMessage(error);
    var message = parsed.message;
    var stacks = [parsed.stack];

    var trace = this;
    while (trace !== undefined) {
        stacks.push(cleanStack(trace.stack.split("\n")));
        trace = trace._parent;
    }
    removeCommonRoots(stacks);
    removeDuplicateOrEmptyJumps(stacks);
    util.notEnumerableProp(error, "stack", reconstructStack(message, stacks));
    util.notEnumerableProp(error, "__stackCleaned__", true);
};

var captureStackTrace = (function stackDetection() {
    var v8stackFramePattern = /^\s*at\s*/;
    var v8stackFormatter = function(stack, error) {
        if (typeof stack === "string") return stack;

        if (error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    if (typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function") {
        Error.stackTraceLimit += 6;
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        var captureStackTrace = Error.captureStackTrace;

        shouldIgnore = function(line) {
            return bluebirdFramePattern.test(line);
        };
        return function(receiver, ignoreUntil) {
            Error.stackTraceLimit += 6;
            captureStackTrace(receiver, ignoreUntil);
            Error.stackTraceLimit -= 6;
        };
    }
    var err = new Error();

    if (typeof err.stack === "string" &&
        err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
        stackFramePattern = /@/;
        formatStack = v8stackFormatter;
        indentStackFrames = true;
        return function captureStackTrace(o) {
            o.stack = new Error().stack;
        };
    }

    var hasStackAfterThrow;
    try { throw new Error(); }
    catch(e) {
        hasStackAfterThrow = ("stack" in e);
    }
    if (!("stack" in err) && hasStackAfterThrow &&
        typeof Error.stackTraceLimit === "number") {
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        return function captureStackTrace(o) {
            Error.stackTraceLimit += 6;
            try { throw new Error(); }
            catch(e) { o.stack = e.stack; }
            Error.stackTraceLimit -= 6;
        };
    }

    formatStack = function(stack, error) {
        if (typeof stack === "string") return stack;

        if ((typeof error === "object" ||
            typeof error === "function") &&
            error.name !== undefined &&
            error.message !== undefined) {
            return error.toString();
        }
        return formatNonError(error);
    };

    return null;

})([]);

if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
    printWarning = function (message) {
        console.warn(message);
    };
    if (util.isNode && process.stderr.isTTY) {
        printWarning = function(message, isSoft) {
            var color = isSoft ? "\u001b[33m" : "\u001b[31m";
            console.warn(color + message + "\u001b[0m\n");
        };
    } else if (!util.isNode && typeof (new Error().stack) === "string") {
        printWarning = function(message, isSoft) {
            console.warn("%c" + message,
                        isSoft ? "color: darkorange" : "color: red");
        };
    }
}

var config = {
    warnings: warnings,
    longStackTraces: false,
    cancellation: false,
    monitoring: false
};

if (longStackTraces) Promise.longStackTraces();

return {
    longStackTraces: function() {
        return config.longStackTraces;
    },
    warnings: function() {
        return config.warnings;
    },
    cancellation: function() {
        return config.cancellation;
    },
    monitoring: function() {
        return config.monitoring;
    },
    propagateFromFunction: function() {
        return propagateFromFunction;
    },
    boundValueFunction: function() {
        return boundValueFunction;
    },
    checkForgottenReturns: checkForgottenReturns,
    setBounds: setBounds,
    warn: warn,
    deprecated: deprecated,
    CapturedTrace: CapturedTrace,
    fireDomEvent: fireDomEvent,
    fireGlobalEvent: fireGlobalEvent
};
};

},{"./errors":12,"./es5":13,"./util":36}],10:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function returner() {
    return this.value;
}
function thrower() {
    throw this.reason;
}

Promise.prototype["return"] =
Promise.prototype.thenReturn = function (value) {
    if (value instanceof Promise) value.suppressUnhandledRejections();
    return this._then(
        returner, undefined, undefined, {value: value}, undefined);
};

Promise.prototype["throw"] =
Promise.prototype.thenThrow = function (reason) {
    return this._then(
        thrower, undefined, undefined, {reason: reason}, undefined);
};

Promise.prototype.catchThrow = function (reason) {
    if (arguments.length <= 1) {
        return this._then(
            undefined, thrower, undefined, {reason: reason}, undefined);
    } else {
        var _reason = arguments[1];
        var handler = function() {throw _reason;};
        return this.caught(reason, handler);
    }
};

Promise.prototype.catchReturn = function (value) {
    if (arguments.length <= 1) {
        if (value instanceof Promise) value.suppressUnhandledRejections();
        return this._then(
            undefined, returner, undefined, {value: value}, undefined);
    } else {
        var _value = arguments[1];
        if (_value instanceof Promise) _value.suppressUnhandledRejections();
        var handler = function() {return _value;};
        return this.caught(value, handler);
    }
};
};

},{}],11:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseReduce = Promise.reduce;
var PromiseAll = Promise.all;

function promiseAllThis() {
    return PromiseAll(this);
}

function PromiseMapSeries(promises, fn) {
    return PromiseReduce(promises, fn, INTERNAL, INTERNAL);
}

Promise.prototype.each = function (fn) {
    return PromiseReduce(this, fn, INTERNAL, 0)
              ._then(promiseAllThis, undefined, undefined, this, undefined);
};

Promise.prototype.mapSeries = function (fn) {
    return PromiseReduce(this, fn, INTERNAL, INTERNAL);
};

Promise.each = function (promises, fn) {
    return PromiseReduce(promises, fn, INTERNAL, 0)
              ._then(promiseAllThis, undefined, undefined, promises, undefined);
};

Promise.mapSeries = PromiseMapSeries;
};


},{}],12:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5");
var Objectfreeze = es5.freeze;
var util = _dereq_("./util");
var inherits = util.inherits;
var notEnumerableProp = util.notEnumerableProp;

function subError(nameProperty, defaultMessage) {
    function SubError(message) {
        if (!(this instanceof SubError)) return new SubError(message);
        notEnumerableProp(this, "message",
            typeof message === "string" ? message : defaultMessage);
        notEnumerableProp(this, "name", nameProperty);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            Error.call(this);
        }
    }
    inherits(SubError, Error);
    return SubError;
}

var _TypeError, _RangeError;
var Warning = subError("Warning", "warning");
var CancellationError = subError("CancellationError", "cancellation error");
var TimeoutError = subError("TimeoutError", "timeout error");
var AggregateError = subError("AggregateError", "aggregate error");
try {
    _TypeError = TypeError;
    _RangeError = RangeError;
} catch(e) {
    _TypeError = subError("TypeError", "type error");
    _RangeError = subError("RangeError", "range error");
}

var methods = ("join pop push shift unshift slice filter forEach some " +
    "every map indexOf lastIndexOf reduce reduceRight sort reverse").split(" ");

for (var i = 0; i < methods.length; ++i) {
    if (typeof Array.prototype[methods[i]] === "function") {
        AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
    }
}

es5.defineProperty(AggregateError.prototype, "length", {
    value: 0,
    configurable: false,
    writable: true,
    enumerable: true
});
AggregateError.prototype["isOperational"] = true;
var level = 0;
AggregateError.prototype.toString = function() {
    var indent = Array(level * 4 + 1).join(" ");
    var ret = "\n" + indent + "AggregateError of:" + "\n";
    level++;
    indent = Array(level * 4 + 1).join(" ");
    for (var i = 0; i < this.length; ++i) {
        var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "";
        var lines = str.split("\n");
        for (var j = 0; j < lines.length; ++j) {
            lines[j] = indent + lines[j];
        }
        str = lines.join("\n");
        ret += str + "\n";
    }
    level--;
    return ret;
};

function OperationalError(message) {
    if (!(this instanceof OperationalError))
        return new OperationalError(message);
    notEnumerableProp(this, "name", "OperationalError");
    notEnumerableProp(this, "message", message);
    this.cause = message;
    this["isOperational"] = true;

    if (message instanceof Error) {
        notEnumerableProp(this, "message", message.message);
        notEnumerableProp(this, "stack", message.stack);
    } else if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    }

}
inherits(OperationalError, Error);

var errorTypes = Error["__BluebirdErrorTypes__"];
if (!errorTypes) {
    errorTypes = Objectfreeze({
        CancellationError: CancellationError,
        TimeoutError: TimeoutError,
        OperationalError: OperationalError,
        RejectionError: OperationalError,
        AggregateError: AggregateError
    });
    es5.defineProperty(Error, "__BluebirdErrorTypes__", {
        value: errorTypes,
        writable: false,
        enumerable: false,
        configurable: false
    });
}

module.exports = {
    Error: Error,
    TypeError: _TypeError,
    RangeError: _RangeError,
    CancellationError: errorTypes.CancellationError,
    OperationalError: errorTypes.OperationalError,
    TimeoutError: errorTypes.TimeoutError,
    AggregateError: errorTypes.AggregateError,
    Warning: Warning
};

},{"./es5":13,"./util":36}],13:[function(_dereq_,module,exports){
var isES5 = (function(){
    "use strict";
    return this === undefined;
})();

if (isES5) {
    module.exports = {
        freeze: Object.freeze,
        defineProperty: Object.defineProperty,
        getDescriptor: Object.getOwnPropertyDescriptor,
        keys: Object.keys,
        names: Object.getOwnPropertyNames,
        getPrototypeOf: Object.getPrototypeOf,
        isArray: Array.isArray,
        isES5: isES5,
        propertyIsWritable: function(obj, prop) {
            var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
            return !!(!descriptor || descriptor.writable || descriptor.set);
        }
    };
} else {
    var has = {}.hasOwnProperty;
    var str = {}.toString;
    var proto = {}.constructor.prototype;

    var ObjectKeys = function (o) {
        var ret = [];
        for (var key in o) {
            if (has.call(o, key)) {
                ret.push(key);
            }
        }
        return ret;
    };

    var ObjectGetDescriptor = function(o, key) {
        return {value: o[key]};
    };

    var ObjectDefineProperty = function (o, key, desc) {
        o[key] = desc.value;
        return o;
    };

    var ObjectFreeze = function (obj) {
        return obj;
    };

    var ObjectGetPrototypeOf = function (obj) {
        try {
            return Object(obj).constructor.prototype;
        }
        catch (e) {
            return proto;
        }
    };

    var ArrayIsArray = function (obj) {
        try {
            return str.call(obj) === "[object Array]";
        }
        catch(e) {
            return false;
        }
    };

    module.exports = {
        isArray: ArrayIsArray,
        keys: ObjectKeys,
        names: ObjectKeys,
        defineProperty: ObjectDefineProperty,
        getDescriptor: ObjectGetDescriptor,
        freeze: ObjectFreeze,
        getPrototypeOf: ObjectGetPrototypeOf,
        isES5: isES5,
        propertyIsWritable: function() {
            return true;
        }
    };
}

},{}],14:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var PromiseMap = Promise.map;

Promise.prototype.filter = function (fn, options) {
    return PromiseMap(this, fn, options, INTERNAL);
};

Promise.filter = function (promises, fn, options) {
    return PromiseMap(promises, fn, options, INTERNAL);
};
};

},{}],15:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, tryConvertToPromise, NEXT_FILTER) {
var util = _dereq_("./util");
var CancellationError = Promise.CancellationError;
var errorObj = util.errorObj;
var catchFilter = _dereq_("./catch_filter")(NEXT_FILTER);

function PassThroughHandlerContext(promise, type, handler) {
    this.promise = promise;
    this.type = type;
    this.handler = handler;
    this.called = false;
    this.cancelPromise = null;
}

PassThroughHandlerContext.prototype.isFinallyHandler = function() {
    return this.type === 0;
};

function FinallyHandlerCancelReaction(finallyHandler) {
    this.finallyHandler = finallyHandler;
}

FinallyHandlerCancelReaction.prototype._resultCancelled = function() {
    checkCancel(this.finallyHandler);
};

function checkCancel(ctx, reason) {
    if (ctx.cancelPromise != null) {
        if (arguments.length > 1) {
            ctx.cancelPromise._reject(reason);
        } else {
            ctx.cancelPromise._cancel();
        }
        ctx.cancelPromise = null;
        return true;
    }
    return false;
}

function succeed() {
    return finallyHandler.call(this, this.promise._target()._settledValue());
}
function fail(reason) {
    if (checkCancel(this, reason)) return;
    errorObj.e = reason;
    return errorObj;
}
function finallyHandler(reasonOrValue) {
    var promise = this.promise;
    var handler = this.handler;

    if (!this.called) {
        this.called = true;
        var ret = this.isFinallyHandler()
            ? handler.call(promise._boundValue())
            : handler.call(promise._boundValue(), reasonOrValue);
        if (ret === NEXT_FILTER) {
            return ret;
        } else if (ret !== undefined) {
            promise._setReturnedNonUndefined();
            var maybePromise = tryConvertToPromise(ret, promise);
            if (maybePromise instanceof Promise) {
                if (this.cancelPromise != null) {
                    if (maybePromise._isCancelled()) {
                        var reason =
                            new CancellationError("late cancellation observer");
                        promise._attachExtraTrace(reason);
                        errorObj.e = reason;
                        return errorObj;
                    } else if (maybePromise.isPending()) {
                        maybePromise._attachCancellationCallback(
                            new FinallyHandlerCancelReaction(this));
                    }
                }
                return maybePromise._then(
                    succeed, fail, undefined, this, undefined);
            }
        }
    }

    if (promise.isRejected()) {
        checkCancel(this);
        errorObj.e = reasonOrValue;
        return errorObj;
    } else {
        checkCancel(this);
        return reasonOrValue;
    }
}

Promise.prototype._passThrough = function(handler, type, success, fail) {
    if (typeof handler !== "function") return this.then();
    return this._then(success,
                      fail,
                      undefined,
                      new PassThroughHandlerContext(this, type, handler),
                      undefined);
};

Promise.prototype.lastly =
Promise.prototype["finally"] = function (handler) {
    return this._passThrough(handler,
                             0,
                             finallyHandler,
                             finallyHandler);
};


Promise.prototype.tap = function (handler) {
    return this._passThrough(handler, 1, finallyHandler);
};

Promise.prototype.tapCatch = function (handlerOrPredicate) {
    var len = arguments.length;
    if(len === 1) {
        return this._passThrough(handlerOrPredicate,
                                 1,
                                 undefined,
                                 finallyHandler);
    } else {
         var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (util.isObject(item)) {
                catchInstances[j++] = item;
            } else {
                return Promise.reject(new TypeError(
                    "tapCatch statement predicate: "
                    + "expecting an object but got " + util.classString(item)
                ));
            }
        }
        catchInstances.length = j;
        var handler = arguments[i];
        return this._passThrough(catchFilter(catchInstances, handler, this),
                                 1,
                                 undefined,
                                 finallyHandler);
    }

};

return PassThroughHandlerContext;
};

},{"./catch_filter":7,"./util":36}],16:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          apiRejection,
                          INTERNAL,
                          tryConvertToPromise,
                          Proxyable,
                          debug) {
var errors = _dereq_("./errors");
var TypeError = errors.TypeError;
var util = _dereq_("./util");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
var yieldHandlers = [];

function promiseFromYieldHandler(value, yieldHandlers, traceParent) {
    for (var i = 0; i < yieldHandlers.length; ++i) {
        traceParent._pushContext();
        var result = tryCatch(yieldHandlers[i])(value);
        traceParent._popContext();
        if (result === errorObj) {
            traceParent._pushContext();
            var ret = Promise.reject(errorObj.e);
            traceParent._popContext();
            return ret;
        }
        var maybePromise = tryConvertToPromise(result, traceParent);
        if (maybePromise instanceof Promise) return maybePromise;
    }
    return null;
}

function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
    if (debug.cancellation()) {
        var internal = new Promise(INTERNAL);
        var _finallyPromise = this._finallyPromise = new Promise(INTERNAL);
        this._promise = internal.lastly(function() {
            return _finallyPromise;
        });
        internal._captureStackTrace();
        internal._setOnCancel(this);
    } else {
        var promise = this._promise = new Promise(INTERNAL);
        promise._captureStackTrace();
    }
    this._stack = stack;
    this._generatorFunction = generatorFunction;
    this._receiver = receiver;
    this._generator = undefined;
    this._yieldHandlers = typeof yieldHandler === "function"
        ? [yieldHandler].concat(yieldHandlers)
        : yieldHandlers;
    this._yieldedPromise = null;
    this._cancellationPhase = false;
}
util.inherits(PromiseSpawn, Proxyable);

PromiseSpawn.prototype._isResolved = function() {
    return this._promise === null;
};

PromiseSpawn.prototype._cleanup = function() {
    this._promise = this._generator = null;
    if (debug.cancellation() && this._finallyPromise !== null) {
        this._finallyPromise._fulfill();
        this._finallyPromise = null;
    }
};

PromiseSpawn.prototype._promiseCancelled = function() {
    if (this._isResolved()) return;
    var implementsReturn = typeof this._generator["return"] !== "undefined";

    var result;
    if (!implementsReturn) {
        var reason = new Promise.CancellationError(
            "generator .return() sentinel");
        Promise.coroutine.returnSentinel = reason;
        this._promise._attachExtraTrace(reason);
        this._promise._pushContext();
        result = tryCatch(this._generator["throw"]).call(this._generator,
                                                         reason);
        this._promise._popContext();
    } else {
        this._promise._pushContext();
        result = tryCatch(this._generator["return"]).call(this._generator,
                                                          undefined);
        this._promise._popContext();
    }
    this._cancellationPhase = true;
    this._yieldedPromise = null;
    this._continue(result);
};

PromiseSpawn.prototype._promiseFulfilled = function(value) {
    this._yieldedPromise = null;
    this._promise._pushContext();
    var result = tryCatch(this._generator.next).call(this._generator, value);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._promiseRejected = function(reason) {
    this._yieldedPromise = null;
    this._promise._attachExtraTrace(reason);
    this._promise._pushContext();
    var result = tryCatch(this._generator["throw"])
        .call(this._generator, reason);
    this._promise._popContext();
    this._continue(result);
};

PromiseSpawn.prototype._resultCancelled = function() {
    if (this._yieldedPromise instanceof Promise) {
        var promise = this._yieldedPromise;
        this._yieldedPromise = null;
        promise.cancel();
    }
};

PromiseSpawn.prototype.promise = function () {
    return this._promise;
};

PromiseSpawn.prototype._run = function () {
    this._generator = this._generatorFunction.call(this._receiver);
    this._receiver =
        this._generatorFunction = undefined;
    this._promiseFulfilled(undefined);
};

PromiseSpawn.prototype._continue = function (result) {
    var promise = this._promise;
    if (result === errorObj) {
        this._cleanup();
        if (this._cancellationPhase) {
            return promise.cancel();
        } else {
            return promise._rejectCallback(result.e, false);
        }
    }

    var value = result.value;
    if (result.done === true) {
        this._cleanup();
        if (this._cancellationPhase) {
            return promise.cancel();
        } else {
            return promise._resolveCallback(value);
        }
    } else {
        var maybePromise = tryConvertToPromise(value, this._promise);
        if (!(maybePromise instanceof Promise)) {
            maybePromise =
                promiseFromYieldHandler(maybePromise,
                                        this._yieldHandlers,
                                        this._promise);
            if (maybePromise === null) {
                this._promiseRejected(
                    new TypeError(
                        "A value %s was yielded that could not be treated as a promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a\u000a".replace("%s", String(value)) +
                        "From coroutine:\u000a" +
                        this._stack.split("\n").slice(1, -7).join("\n")
                    )
                );
                return;
            }
        }
        maybePromise = maybePromise._target();
        var bitField = maybePromise._bitField;
        ;
        if (((bitField & 50397184) === 0)) {
            this._yieldedPromise = maybePromise;
            maybePromise._proxy(this, null);
        } else if (((bitField & 33554432) !== 0)) {
            Promise._async.invoke(
                this._promiseFulfilled, this, maybePromise._value()
            );
        } else if (((bitField & 16777216) !== 0)) {
            Promise._async.invoke(
                this._promiseRejected, this, maybePromise._reason()
            );
        } else {
            this._promiseCancelled();
        }
    }
};

Promise.coroutine = function (generatorFunction, options) {
    if (typeof generatorFunction !== "function") {
        throw new TypeError("generatorFunction must be a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var yieldHandler = Object(options).yieldHandler;
    var PromiseSpawn$ = PromiseSpawn;
    var stack = new Error().stack;
    return function () {
        var generator = generatorFunction.apply(this, arguments);
        var spawn = new PromiseSpawn$(undefined, undefined, yieldHandler,
                                      stack);
        var ret = spawn.promise();
        spawn._generator = generator;
        spawn._promiseFulfilled(undefined);
        return ret;
    };
};

Promise.coroutine.addYieldHandler = function(fn) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    yieldHandlers.push(fn);
};

Promise.spawn = function (generatorFunction) {
    debug.deprecated("Promise.spawn()", "Promise.coroutine()");
    if (typeof generatorFunction !== "function") {
        return apiRejection("generatorFunction must be a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var spawn = new PromiseSpawn(generatorFunction, this);
    var ret = spawn.promise();
    spawn._run(Promise.spawn);
    return ret;
};
};

},{"./errors":12,"./util":36}],17:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, tryConvertToPromise, INTERNAL, async,
         getDomain) {
var util = _dereq_("./util");
var canEvaluate = util.canEvaluate;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var reject;

if (!true) {
if (canEvaluate) {
    var thenCallback = function(i) {
        return new Function("value", "holder", "                             \n\
            'use strict';                                                    \n\
            holder.pIndex = value;                                           \n\
            holder.checkFulfillment(this);                                   \n\
            ".replace(/Index/g, i));
    };

    var promiseSetter = function(i) {
        return new Function("promise", "holder", "                           \n\
            'use strict';                                                    \n\
            holder.pIndex = promise;                                         \n\
            ".replace(/Index/g, i));
    };

    var generateHolderClass = function(total) {
        var props = new Array(total);
        for (var i = 0; i < props.length; ++i) {
            props[i] = "this.p" + (i+1);
        }
        var assignment = props.join(" = ") + " = null;";
        var cancellationCode= "var promise;\n" + props.map(function(prop) {
            return "                                                         \n\
                promise = " + prop + ";                                      \n\
                if (promise instanceof Promise) {                            \n\
                    promise.cancel();                                        \n\
                }                                                            \n\
            ";
        }).join("\n");
        var passedArguments = props.join(", ");
        var name = "Holder$" + total;


        var code = "return function(tryCatch, errorObj, Promise, async) {    \n\
            'use strict';                                                    \n\
            function [TheName](fn) {                                         \n\
                [TheProperties]                                              \n\
                this.fn = fn;                                                \n\
                this.asyncNeeded = true;                                     \n\
                this.now = 0;                                                \n\
            }                                                                \n\
                                                                             \n\
            [TheName].prototype._callFunction = function(promise) {          \n\
                promise._pushContext();                                      \n\
                var ret = tryCatch(this.fn)([ThePassedArguments]);           \n\
                promise._popContext();                                       \n\
                if (ret === errorObj) {                                      \n\
                    promise._rejectCallback(ret.e, false);                   \n\
                } else {                                                     \n\
                    promise._resolveCallback(ret);                           \n\
                }                                                            \n\
            };                                                               \n\
                                                                             \n\
            [TheName].prototype.checkFulfillment = function(promise) {       \n\
                var now = ++this.now;                                        \n\
                if (now === [TheTotal]) {                                    \n\
                    if (this.asyncNeeded) {                                  \n\
                        async.invoke(this._callFunction, this, promise);     \n\
                    } else {                                                 \n\
                        this._callFunction(promise);                         \n\
                    }                                                        \n\
                                                                             \n\
                }                                                            \n\
            };                                                               \n\
                                                                             \n\
            [TheName].prototype._resultCancelled = function() {              \n\
                [CancellationCode]                                           \n\
            };                                                               \n\
                                                                             \n\
            return [TheName];                                                \n\
        }(tryCatch, errorObj, Promise, async);                               \n\
        ";

        code = code.replace(/\[TheName\]/g, name)
            .replace(/\[TheTotal\]/g, total)
            .replace(/\[ThePassedArguments\]/g, passedArguments)
            .replace(/\[TheProperties\]/g, assignment)
            .replace(/\[CancellationCode\]/g, cancellationCode);

        return new Function("tryCatch", "errorObj", "Promise", "async", code)
                           (tryCatch, errorObj, Promise, async);
    };

    var holderClasses = [];
    var thenCallbacks = [];
    var promiseSetters = [];

    for (var i = 0; i < 8; ++i) {
        holderClasses.push(generateHolderClass(i + 1));
        thenCallbacks.push(thenCallback(i + 1));
        promiseSetters.push(promiseSetter(i + 1));
    }

    reject = function (reason) {
        this._reject(reason);
    };
}}

Promise.join = function () {
    var last = arguments.length - 1;
    var fn;
    if (last > 0 && typeof arguments[last] === "function") {
        fn = arguments[last];
        if (!true) {
            if (last <= 8 && canEvaluate) {
                var ret = new Promise(INTERNAL);
                ret._captureStackTrace();
                var HolderClass = holderClasses[last - 1];
                var holder = new HolderClass(fn);
                var callbacks = thenCallbacks;

                for (var i = 0; i < last; ++i) {
                    var maybePromise = tryConvertToPromise(arguments[i], ret);
                    if (maybePromise instanceof Promise) {
                        maybePromise = maybePromise._target();
                        var bitField = maybePromise._bitField;
                        ;
                        if (((bitField & 50397184) === 0)) {
                            maybePromise._then(callbacks[i], reject,
                                               undefined, ret, holder);
                            promiseSetters[i](maybePromise, holder);
                            holder.asyncNeeded = false;
                        } else if (((bitField & 33554432) !== 0)) {
                            callbacks[i].call(ret,
                                              maybePromise._value(), holder);
                        } else if (((bitField & 16777216) !== 0)) {
                            ret._reject(maybePromise._reason());
                        } else {
                            ret._cancel();
                        }
                    } else {
                        callbacks[i].call(ret, maybePromise, holder);
                    }
                }

                if (!ret._isFateSealed()) {
                    if (holder.asyncNeeded) {
                        var domain = getDomain();
                        if (domain !== null) {
                            holder.fn = util.domainBind(domain, holder.fn);
                        }
                    }
                    ret._setAsyncGuaranteed();
                    ret._setOnCancel(holder);
                }
                return ret;
            }
        }
    }
    var args = [].slice.call(arguments);;
    if (fn) args.pop();
    var ret = new PromiseArray(args).promise();
    return fn !== undefined ? ret.spread(fn) : ret;
};

};

},{"./util":36}],18:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL,
                          debug) {
var getDomain = Promise._getDomain;
var util = _dereq_("./util");
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;
var async = Promise._async;

function MappingPromiseArray(promises, fn, limit, _filter) {
    this.constructor$(promises);
    this._promise._captureStackTrace();
    var domain = getDomain();
    this._callback = domain === null ? fn : util.domainBind(domain, fn);
    this._preservedValues = _filter === INTERNAL
        ? new Array(this.length())
        : null;
    this._limit = limit;
    this._inFlight = 0;
    this._queue = [];
    async.invoke(this._asyncInit, this, undefined);
}
util.inherits(MappingPromiseArray, PromiseArray);

MappingPromiseArray.prototype._asyncInit = function() {
    this._init$(undefined, -2);
};

MappingPromiseArray.prototype._init = function () {};

MappingPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var values = this._values;
    var length = this.length();
    var preservedValues = this._preservedValues;
    var limit = this._limit;

    if (index < 0) {
        index = (index * -1) - 1;
        values[index] = value;
        if (limit >= 1) {
            this._inFlight--;
            this._drainQueue();
            if (this._isResolved()) return true;
        }
    } else {
        if (limit >= 1 && this._inFlight >= limit) {
            values[index] = value;
            this._queue.push(index);
            return false;
        }
        if (preservedValues !== null) preservedValues[index] = value;

        var promise = this._promise;
        var callback = this._callback;
        var receiver = promise._boundValue();
        promise._pushContext();
        var ret = tryCatch(callback).call(receiver, value, index, length);
        var promiseCreated = promise._popContext();
        debug.checkForgottenReturns(
            ret,
            promiseCreated,
            preservedValues !== null ? "Promise.filter" : "Promise.map",
            promise
        );
        if (ret === errorObj) {
            this._reject(ret.e);
            return true;
        }

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            var bitField = maybePromise._bitField;
            ;
            if (((bitField & 50397184) === 0)) {
                if (limit >= 1) this._inFlight++;
                values[index] = maybePromise;
                maybePromise._proxy(this, (index + 1) * -1);
                return false;
            } else if (((bitField & 33554432) !== 0)) {
                ret = maybePromise._value();
            } else if (((bitField & 16777216) !== 0)) {
                this._reject(maybePromise._reason());
                return true;
            } else {
                this._cancel();
                return true;
            }
        }
        values[index] = ret;
    }
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= length) {
        if (preservedValues !== null) {
            this._filter(values, preservedValues);
        } else {
            this._resolve(values);
        }
        return true;
    }
    return false;
};

MappingPromiseArray.prototype._drainQueue = function () {
    var queue = this._queue;
    var limit = this._limit;
    var values = this._values;
    while (queue.length > 0 && this._inFlight < limit) {
        if (this._isResolved()) return;
        var index = queue.pop();
        this._promiseFulfilled(values[index], index);
    }
};

MappingPromiseArray.prototype._filter = function (booleans, values) {
    var len = values.length;
    var ret = new Array(len);
    var j = 0;
    for (var i = 0; i < len; ++i) {
        if (booleans[i]) ret[j++] = values[i];
    }
    ret.length = j;
    this._resolve(ret);
};

MappingPromiseArray.prototype.preservedValues = function () {
    return this._preservedValues;
};

function map(promises, fn, options, _filter) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }

    var limit = 0;
    if (options !== undefined) {
        if (typeof options === "object" && options !== null) {
            if (typeof options.concurrency !== "number") {
                return Promise.reject(
                    new TypeError("'concurrency' must be a number but it is " +
                                    util.classString(options.concurrency)));
            }
            limit = options.concurrency;
        } else {
            return Promise.reject(new TypeError(
                            "options argument must be an object but it is " +
                             util.classString(options)));
        }
    }
    limit = typeof limit === "number" &&
        isFinite(limit) && limit >= 1 ? limit : 0;
    return new MappingPromiseArray(promises, fn, limit, _filter).promise();
}

Promise.prototype.map = function (fn, options) {
    return map(this, fn, options, null);
};

Promise.map = function (promises, fn, options, _filter) {
    return map(promises, fn, options, _filter);
};


};

},{"./util":36}],19:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, INTERNAL, tryConvertToPromise, apiRejection, debug) {
var util = _dereq_("./util");
var tryCatch = util.tryCatch;

Promise.method = function (fn) {
    if (typeof fn !== "function") {
        throw new Promise.TypeError("expecting a function but got " + util.classString(fn));
    }
    return function () {
        var ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._pushContext();
        var value = tryCatch(fn).apply(this, arguments);
        var promiseCreated = ret._popContext();
        debug.checkForgottenReturns(
            value, promiseCreated, "Promise.method", ret);
        ret._resolveFromSyncValue(value);
        return ret;
    };
};

Promise.attempt = Promise["try"] = function (fn) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._pushContext();
    var value;
    if (arguments.length > 1) {
        debug.deprecated("calling Promise.try with more than 1 argument");
        var arg = arguments[1];
        var ctx = arguments[2];
        value = util.isArray(arg) ? tryCatch(fn).apply(ctx, arg)
                                  : tryCatch(fn).call(ctx, arg);
    } else {
        value = tryCatch(fn)();
    }
    var promiseCreated = ret._popContext();
    debug.checkForgottenReturns(
        value, promiseCreated, "Promise.try", ret);
    ret._resolveFromSyncValue(value);
    return ret;
};

Promise.prototype._resolveFromSyncValue = function (value) {
    if (value === util.errorObj) {
        this._rejectCallback(value.e, false);
    } else {
        this._resolveCallback(value, true);
    }
};
};

},{"./util":36}],20:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util");
var maybeWrapAsError = util.maybeWrapAsError;
var errors = _dereq_("./errors");
var OperationalError = errors.OperationalError;
var es5 = _dereq_("./es5");

function isUntypedError(obj) {
    return obj instanceof Error &&
        es5.getPrototypeOf(obj) === Error.prototype;
}

var rErrorKey = /^(?:name|message|stack|cause)$/;
function wrapAsOperationalError(obj) {
    var ret;
    if (isUntypedError(obj)) {
        ret = new OperationalError(obj);
        ret.name = obj.name;
        ret.message = obj.message;
        ret.stack = obj.stack;
        var keys = es5.keys(obj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (!rErrorKey.test(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }
    util.markAsOriginatingFromRejection(obj);
    return obj;
}

function nodebackForPromise(promise, multiArgs) {
    return function(err, value) {
        if (promise === null) return;
        if (err) {
            var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
            promise._attachExtraTrace(wrapped);
            promise._reject(wrapped);
        } else if (!multiArgs) {
            promise._fulfill(value);
        } else {
            var args = [].slice.call(arguments, 1);;
            promise._fulfill(args);
        }
        promise = null;
    };
}

module.exports = nodebackForPromise;

},{"./errors":12,"./es5":13,"./util":36}],21:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
var util = _dereq_("./util");
var async = Promise._async;
var tryCatch = util.tryCatch;
var errorObj = util.errorObj;

function spreadAdapter(val, nodeback) {
    var promise = this;
    if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
    var ret =
        tryCatch(nodeback).apply(promise._boundValue(), [null].concat(val));
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

function successAdapter(val, nodeback) {
    var promise = this;
    var receiver = promise._boundValue();
    var ret = val === undefined
        ? tryCatch(nodeback).call(receiver, null)
        : tryCatch(nodeback).call(receiver, null, val);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}
function errorAdapter(reason, nodeback) {
    var promise = this;
    if (!reason) {
        var newReason = new Error(reason + "");
        newReason.cause = reason;
        reason = newReason;
    }
    var ret = tryCatch(nodeback).call(promise._boundValue(), reason);
    if (ret === errorObj) {
        async.throwLater(ret.e);
    }
}

Promise.prototype.asCallback = Promise.prototype.nodeify = function (nodeback,
                                                                     options) {
    if (typeof nodeback == "function") {
        var adapter = successAdapter;
        if (options !== undefined && Object(options).spread) {
            adapter = spreadAdapter;
        }
        this._then(
            adapter,
            errorAdapter,
            undefined,
            this,
            nodeback
        );
    }
    return this;
};
};

},{"./util":36}],22:[function(_dereq_,module,exports){
"use strict";
module.exports = function() {
var makeSelfResolutionError = function () {
    return new TypeError("circular promise resolution chain\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
};
var reflectHandler = function() {
    return new Promise.PromiseInspection(this._target());
};
var apiRejection = function(msg) {
    return Promise.reject(new TypeError(msg));
};
function Proxyable() {}
var UNDEFINED_BINDING = {};
var util = _dereq_("./util");

var getDomain;
if (util.isNode) {
    getDomain = function() {
        var ret = process.domain;
        if (ret === undefined) ret = null;
        return ret;
    };
} else {
    getDomain = function() {
        return null;
    };
}
util.notEnumerableProp(Promise, "_getDomain", getDomain);

var es5 = _dereq_("./es5");
var Async = _dereq_("./async");
var async = new Async();
es5.defineProperty(Promise, "_async", {value: async});
var errors = _dereq_("./errors");
var TypeError = Promise.TypeError = errors.TypeError;
Promise.RangeError = errors.RangeError;
var CancellationError = Promise.CancellationError = errors.CancellationError;
Promise.TimeoutError = errors.TimeoutError;
Promise.OperationalError = errors.OperationalError;
Promise.RejectionError = errors.OperationalError;
Promise.AggregateError = errors.AggregateError;
var INTERNAL = function(){};
var APPLY = {};
var NEXT_FILTER = {};
var tryConvertToPromise = _dereq_("./thenables")(Promise, INTERNAL);
var PromiseArray =
    _dereq_("./promise_array")(Promise, INTERNAL,
                               tryConvertToPromise, apiRejection, Proxyable);
var Context = _dereq_("./context")(Promise);
 /*jshint unused:false*/
var createContext = Context.create;
var debug = _dereq_("./debuggability")(Promise, Context);
var CapturedTrace = debug.CapturedTrace;
var PassThroughHandlerContext =
    _dereq_("./finally")(Promise, tryConvertToPromise, NEXT_FILTER);
var catchFilter = _dereq_("./catch_filter")(NEXT_FILTER);
var nodebackForPromise = _dereq_("./nodeback");
var errorObj = util.errorObj;
var tryCatch = util.tryCatch;
function check(self, executor) {
    if (self == null || self.constructor !== Promise) {
        throw new TypeError("the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    if (typeof executor !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(executor));
    }

}

function Promise(executor) {
    if (executor !== INTERNAL) {
        check(this, executor);
    }
    this._bitField = 0;
    this._fulfillmentHandler0 = undefined;
    this._rejectionHandler0 = undefined;
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._resolveFromExecutor(executor);
    this._promiseCreated();
    this._fireEvent("promiseCreated", this);
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.caught = Promise.prototype["catch"] = function (fn) {
    var len = arguments.length;
    if (len > 1) {
        var catchInstances = new Array(len - 1),
            j = 0, i;
        for (i = 0; i < len - 1; ++i) {
            var item = arguments[i];
            if (util.isObject(item)) {
                catchInstances[j++] = item;
            } else {
                return apiRejection("Catch statement predicate: " +
                    "expecting an object but got " + util.classString(item));
            }
        }
        catchInstances.length = j;
        fn = arguments[i];

        if (typeof fn !== "function") {
            throw new TypeError("The last argument to .catch() " +
                "must be a function, got " + util.toString(fn));
        }
        return this.then(undefined, catchFilter(catchInstances, fn, this));
    }
    return this.then(undefined, fn);
};

Promise.prototype.reflect = function () {
    return this._then(reflectHandler,
        reflectHandler, undefined, this, undefined);
};

Promise.prototype.then = function (didFulfill, didReject) {
    if (debug.warnings() && arguments.length > 0 &&
        typeof didFulfill !== "function" &&
        typeof didReject !== "function") {
        var msg = ".then() only accepts functions but was passed: " +
                util.classString(didFulfill);
        if (arguments.length > 1) {
            msg += ", " + util.classString(didReject);
        }
        this._warn(msg);
    }
    return this._then(didFulfill, didReject, undefined, undefined, undefined);
};

Promise.prototype.done = function (didFulfill, didReject) {
    var promise =
        this._then(didFulfill, didReject, undefined, undefined, undefined);
    promise._setIsFinal();
};

Promise.prototype.spread = function (fn) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    return this.all()._then(fn, undefined, undefined, APPLY, undefined);
};

Promise.prototype.toJSON = function () {
    var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: undefined,
        rejectionReason: undefined
    };
    if (this.isFulfilled()) {
        ret.fulfillmentValue = this.value();
        ret.isFulfilled = true;
    } else if (this.isRejected()) {
        ret.rejectionReason = this.reason();
        ret.isRejected = true;
    }
    return ret;
};

Promise.prototype.all = function () {
    if (arguments.length > 0) {
        this._warn(".all() was passed arguments but it does not take any");
    }
    return new PromiseArray(this).promise();
};

Promise.prototype.error = function (fn) {
    return this.caught(util.originatesFromRejection, fn);
};

Promise.getNewLibraryCopy = module.exports;

Promise.is = function (val) {
    return val instanceof Promise;
};

Promise.fromNode = Promise.fromCallback = function(fn) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    var multiArgs = arguments.length > 1 ? !!Object(arguments[1]).multiArgs
                                         : false;
    var result = tryCatch(fn)(nodebackForPromise(ret, multiArgs));
    if (result === errorObj) {
        ret._rejectCallback(result.e, true);
    }
    if (!ret._isFateSealed()) ret._setAsyncGuaranteed();
    return ret;
};

Promise.all = function (promises) {
    return new PromiseArray(promises).promise();
};

Promise.cast = function (obj) {
    var ret = tryConvertToPromise(obj);
    if (!(ret instanceof Promise)) {
        ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._setFulfilled();
        ret._rejectionHandler0 = obj;
    }
    return ret;
};

Promise.resolve = Promise.fulfilled = Promise.cast;

Promise.reject = Promise.rejected = function (reason) {
    var ret = new Promise(INTERNAL);
    ret._captureStackTrace();
    ret._rejectCallback(reason, true);
    return ret;
};

Promise.setScheduler = function(fn) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    return async.setScheduler(fn);
};

Promise.prototype._then = function (
    didFulfill,
    didReject,
    _,    receiver,
    internalData
) {
    var haveInternalData = internalData !== undefined;
    var promise = haveInternalData ? internalData : new Promise(INTERNAL);
    var target = this._target();
    var bitField = target._bitField;

    if (!haveInternalData) {
        promise._propagateFrom(this, 3);
        promise._captureStackTrace();
        if (receiver === undefined &&
            ((this._bitField & 2097152) !== 0)) {
            if (!((bitField & 50397184) === 0)) {
                receiver = this._boundValue();
            } else {
                receiver = target === this ? undefined : this._boundTo;
            }
        }
        this._fireEvent("promiseChained", this, promise);
    }

    var domain = getDomain();
    if (!((bitField & 50397184) === 0)) {
        var handler, value, settler = target._settlePromiseCtx;
        if (((bitField & 33554432) !== 0)) {
            value = target._rejectionHandler0;
            handler = didFulfill;
        } else if (((bitField & 16777216) !== 0)) {
            value = target._fulfillmentHandler0;
            handler = didReject;
            target._unsetRejectionIsUnhandled();
        } else {
            settler = target._settlePromiseLateCancellationObserver;
            value = new CancellationError("late cancellation observer");
            target._attachExtraTrace(value);
            handler = didReject;
        }

        async.invoke(settler, target, {
            handler: domain === null ? handler
                : (typeof handler === "function" &&
                    util.domainBind(domain, handler)),
            promise: promise,
            receiver: receiver,
            value: value
        });
    } else {
        target._addCallbacks(didFulfill, didReject, promise, receiver, domain);
    }

    return promise;
};

Promise.prototype._length = function () {
    return this._bitField & 65535;
};

Promise.prototype._isFateSealed = function () {
    return (this._bitField & 117506048) !== 0;
};

Promise.prototype._isFollowing = function () {
    return (this._bitField & 67108864) === 67108864;
};

Promise.prototype._setLength = function (len) {
    this._bitField = (this._bitField & -65536) |
        (len & 65535);
};

Promise.prototype._setFulfilled = function () {
    this._bitField = this._bitField | 33554432;
    this._fireEvent("promiseFulfilled", this);
};

Promise.prototype._setRejected = function () {
    this._bitField = this._bitField | 16777216;
    this._fireEvent("promiseRejected", this);
};

Promise.prototype._setFollowing = function () {
    this._bitField = this._bitField | 67108864;
    this._fireEvent("promiseResolved", this);
};

Promise.prototype._setIsFinal = function () {
    this._bitField = this._bitField | 4194304;
};

Promise.prototype._isFinal = function () {
    return (this._bitField & 4194304) > 0;
};

Promise.prototype._unsetCancelled = function() {
    this._bitField = this._bitField & (~65536);
};

Promise.prototype._setCancelled = function() {
    this._bitField = this._bitField | 65536;
    this._fireEvent("promiseCancelled", this);
};

Promise.prototype._setWillBeCancelled = function() {
    this._bitField = this._bitField | 8388608;
};

Promise.prototype._setAsyncGuaranteed = function() {
    if (async.hasCustomScheduler()) return;
    this._bitField = this._bitField | 134217728;
};

Promise.prototype._receiverAt = function (index) {
    var ret = index === 0 ? this._receiver0 : this[
            index * 4 - 4 + 3];
    if (ret === UNDEFINED_BINDING) {
        return undefined;
    } else if (ret === undefined && this._isBound()) {
        return this._boundValue();
    }
    return ret;
};

Promise.prototype._promiseAt = function (index) {
    return this[
            index * 4 - 4 + 2];
};

Promise.prototype._fulfillmentHandlerAt = function (index) {
    return this[
            index * 4 - 4 + 0];
};

Promise.prototype._rejectionHandlerAt = function (index) {
    return this[
            index * 4 - 4 + 1];
};

Promise.prototype._boundValue = function() {};

Promise.prototype._migrateCallback0 = function (follower) {
    var bitField = follower._bitField;
    var fulfill = follower._fulfillmentHandler0;
    var reject = follower._rejectionHandler0;
    var promise = follower._promise0;
    var receiver = follower._receiverAt(0);
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, promise, receiver, null);
};

Promise.prototype._migrateCallbackAt = function (follower, index) {
    var fulfill = follower._fulfillmentHandlerAt(index);
    var reject = follower._rejectionHandlerAt(index);
    var promise = follower._promiseAt(index);
    var receiver = follower._receiverAt(index);
    if (receiver === undefined) receiver = UNDEFINED_BINDING;
    this._addCallbacks(fulfill, reject, promise, receiver, null);
};

Promise.prototype._addCallbacks = function (
    fulfill,
    reject,
    promise,
    receiver,
    domain
) {
    var index = this._length();

    if (index >= 65535 - 4) {
        index = 0;
        this._setLength(0);
    }

    if (index === 0) {
        this._promise0 = promise;
        this._receiver0 = receiver;
        if (typeof fulfill === "function") {
            this._fulfillmentHandler0 =
                domain === null ? fulfill : util.domainBind(domain, fulfill);
        }
        if (typeof reject === "function") {
            this._rejectionHandler0 =
                domain === null ? reject : util.domainBind(domain, reject);
        }
    } else {
        var base = index * 4 - 4;
        this[base + 2] = promise;
        this[base + 3] = receiver;
        if (typeof fulfill === "function") {
            this[base + 0] =
                domain === null ? fulfill : util.domainBind(domain, fulfill);
        }
        if (typeof reject === "function") {
            this[base + 1] =
                domain === null ? reject : util.domainBind(domain, reject);
        }
    }
    this._setLength(index + 1);
    return index;
};

Promise.prototype._proxy = function (proxyable, arg) {
    this._addCallbacks(undefined, undefined, arg, proxyable, null);
};

Promise.prototype._resolveCallback = function(value, shouldBind) {
    if (((this._bitField & 117506048) !== 0)) return;
    if (value === this)
        return this._rejectCallback(makeSelfResolutionError(), false);
    var maybePromise = tryConvertToPromise(value, this);
    if (!(maybePromise instanceof Promise)) return this._fulfill(value);

    if (shouldBind) this._propagateFrom(maybePromise, 2);

    var promise = maybePromise._target();

    if (promise === this) {
        this._reject(makeSelfResolutionError());
        return;
    }

    var bitField = promise._bitField;
    if (((bitField & 50397184) === 0)) {
        var len = this._length();
        if (len > 0) promise._migrateCallback0(this);
        for (var i = 1; i < len; ++i) {
            promise._migrateCallbackAt(this, i);
        }
        this._setFollowing();
        this._setLength(0);
        this._setFollowee(promise);
    } else if (((bitField & 33554432) !== 0)) {
        this._fulfill(promise._value());
    } else if (((bitField & 16777216) !== 0)) {
        this._reject(promise._reason());
    } else {
        var reason = new CancellationError("late cancellation observer");
        promise._attachExtraTrace(reason);
        this._reject(reason);
    }
};

Promise.prototype._rejectCallback =
function(reason, synchronous, ignoreNonErrorWarnings) {
    var trace = util.ensureErrorObject(reason);
    var hasStack = trace === reason;
    if (!hasStack && !ignoreNonErrorWarnings && debug.warnings()) {
        var message = "a promise was rejected with a non-error: " +
            util.classString(reason);
        this._warn(message, true);
    }
    this._attachExtraTrace(trace, synchronous ? hasStack : false);
    this._reject(reason);
};

Promise.prototype._resolveFromExecutor = function (executor) {
    if (executor === INTERNAL) return;
    var promise = this;
    this._captureStackTrace();
    this._pushContext();
    var synchronous = true;
    var r = this._execute(executor, function(value) {
        promise._resolveCallback(value);
    }, function (reason) {
        promise._rejectCallback(reason, synchronous);
    });
    synchronous = false;
    this._popContext();

    if (r !== undefined) {
        promise._rejectCallback(r, true);
    }
};

Promise.prototype._settlePromiseFromHandler = function (
    handler, receiver, value, promise
) {
    var bitField = promise._bitField;
    if (((bitField & 65536) !== 0)) return;
    promise._pushContext();
    var x;
    if (receiver === APPLY) {
        if (!value || typeof value.length !== "number") {
            x = errorObj;
            x.e = new TypeError("cannot .spread() a non-array: " +
                                    util.classString(value));
        } else {
            x = tryCatch(handler).apply(this._boundValue(), value);
        }
    } else {
        x = tryCatch(handler).call(receiver, value);
    }
    var promiseCreated = promise._popContext();
    bitField = promise._bitField;
    if (((bitField & 65536) !== 0)) return;

    if (x === NEXT_FILTER) {
        promise._reject(value);
    } else if (x === errorObj) {
        promise._rejectCallback(x.e, false);
    } else {
        debug.checkForgottenReturns(x, promiseCreated, "",  promise, this);
        promise._resolveCallback(x);
    }
};

Promise.prototype._target = function() {
    var ret = this;
    while (ret._isFollowing()) ret = ret._followee();
    return ret;
};

Promise.prototype._followee = function() {
    return this._rejectionHandler0;
};

Promise.prototype._setFollowee = function(promise) {
    this._rejectionHandler0 = promise;
};

Promise.prototype._settlePromise = function(promise, handler, receiver, value) {
    var isPromise = promise instanceof Promise;
    var bitField = this._bitField;
    var asyncGuaranteed = ((bitField & 134217728) !== 0);
    if (((bitField & 65536) !== 0)) {
        if (isPromise) promise._invokeInternalOnCancel();

        if (receiver instanceof PassThroughHandlerContext &&
            receiver.isFinallyHandler()) {
            receiver.cancelPromise = promise;
            if (tryCatch(handler).call(receiver, value) === errorObj) {
                promise._reject(errorObj.e);
            }
        } else if (handler === reflectHandler) {
            promise._fulfill(reflectHandler.call(receiver));
        } else if (receiver instanceof Proxyable) {
            receiver._promiseCancelled(promise);
        } else if (isPromise || promise instanceof PromiseArray) {
            promise._cancel();
        } else {
            receiver.cancel();
        }
    } else if (typeof handler === "function") {
        if (!isPromise) {
            handler.call(receiver, value, promise);
        } else {
            if (asyncGuaranteed) promise._setAsyncGuaranteed();
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (receiver instanceof Proxyable) {
        if (!receiver._isResolved()) {
            if (((bitField & 33554432) !== 0)) {
                receiver._promiseFulfilled(value, promise);
            } else {
                receiver._promiseRejected(value, promise);
            }
        }
    } else if (isPromise) {
        if (asyncGuaranteed) promise._setAsyncGuaranteed();
        if (((bitField & 33554432) !== 0)) {
            promise._fulfill(value);
        } else {
            promise._reject(value);
        }
    }
};

Promise.prototype._settlePromiseLateCancellationObserver = function(ctx) {
    var handler = ctx.handler;
    var promise = ctx.promise;
    var receiver = ctx.receiver;
    var value = ctx.value;
    if (typeof handler === "function") {
        if (!(promise instanceof Promise)) {
            handler.call(receiver, value, promise);
        } else {
            this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
    } else if (promise instanceof Promise) {
        promise._reject(value);
    }
};

Promise.prototype._settlePromiseCtx = function(ctx) {
    this._settlePromise(ctx.promise, ctx.handler, ctx.receiver, ctx.value);
};

Promise.prototype._settlePromise0 = function(handler, value, bitField) {
    var promise = this._promise0;
    var receiver = this._receiverAt(0);
    this._promise0 = undefined;
    this._receiver0 = undefined;
    this._settlePromise(promise, handler, receiver, value);
};

Promise.prototype._clearCallbackDataAtIndex = function(index) {
    var base = index * 4 - 4;
    this[base + 2] =
    this[base + 3] =
    this[base + 0] =
    this[base + 1] = undefined;
};

Promise.prototype._fulfill = function (value) {
    var bitField = this._bitField;
    if (((bitField & 117506048) >>> 16)) return;
    if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._reject(err);
    }
    this._setFulfilled();
    this._rejectionHandler0 = value;

    if ((bitField & 65535) > 0) {
        if (((bitField & 134217728) !== 0)) {
            this._settlePromises();
        } else {
            async.settlePromises(this);
        }
        this._dereferenceTrace();
    }
};

Promise.prototype._reject = function (reason) {
    var bitField = this._bitField;
    if (((bitField & 117506048) >>> 16)) return;
    this._setRejected();
    this._fulfillmentHandler0 = reason;

    if (this._isFinal()) {
        return async.fatalError(reason, util.isNode);
    }

    if ((bitField & 65535) > 0) {
        async.settlePromises(this);
    } else {
        this._ensurePossibleRejectionHandled();
    }
};

Promise.prototype._fulfillPromises = function (len, value) {
    for (var i = 1; i < len; i++) {
        var handler = this._fulfillmentHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver, value);
    }
};

Promise.prototype._rejectPromises = function (len, reason) {
    for (var i = 1; i < len; i++) {
        var handler = this._rejectionHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver, reason);
    }
};

Promise.prototype._settlePromises = function () {
    var bitField = this._bitField;
    var len = (bitField & 65535);

    if (len > 0) {
        if (((bitField & 16842752) !== 0)) {
            var reason = this._fulfillmentHandler0;
            this._settlePromise0(this._rejectionHandler0, reason, bitField);
            this._rejectPromises(len, reason);
        } else {
            var value = this._rejectionHandler0;
            this._settlePromise0(this._fulfillmentHandler0, value, bitField);
            this._fulfillPromises(len, value);
        }
        this._setLength(0);
    }
    this._clearCancellationData();
};

Promise.prototype._settledValue = function() {
    var bitField = this._bitField;
    if (((bitField & 33554432) !== 0)) {
        return this._rejectionHandler0;
    } else if (((bitField & 16777216) !== 0)) {
        return this._fulfillmentHandler0;
    }
};

if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
    es5.defineProperty(Promise.prototype, Symbol.toStringTag, {
        get: function () {
            return "Object";
        }
    });
}

function deferResolve(v) {this.promise._resolveCallback(v);}
function deferReject(v) {this.promise._rejectCallback(v, false);}

Promise.defer = Promise.pending = function() {
    debug.deprecated("Promise.defer", "new Promise");
    var promise = new Promise(INTERNAL);
    return {
        promise: promise,
        resolve: deferResolve,
        reject: deferReject
    };
};

util.notEnumerableProp(Promise,
                       "_makeSelfResolutionError",
                       makeSelfResolutionError);

_dereq_("./method")(Promise, INTERNAL, tryConvertToPromise, apiRejection,
    debug);
_dereq_("./bind")(Promise, INTERNAL, tryConvertToPromise, debug);
_dereq_("./cancel")(Promise, PromiseArray, apiRejection, debug);
_dereq_("./direct_resolve")(Promise);
_dereq_("./synchronous_inspection")(Promise);
_dereq_("./join")(
    Promise, PromiseArray, tryConvertToPromise, INTERNAL, async, getDomain);
Promise.Promise = Promise;
Promise.version = "3.5.5";
_dereq_('./call_get.js')(Promise);
_dereq_('./generators.js')(Promise, apiRejection, INTERNAL, tryConvertToPromise, Proxyable, debug);
_dereq_('./map.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
_dereq_('./nodeify.js')(Promise);
_dereq_('./promisify.js')(Promise, INTERNAL);
_dereq_('./props.js')(Promise, PromiseArray, tryConvertToPromise, apiRejection);
_dereq_('./race.js')(Promise, INTERNAL, tryConvertToPromise, apiRejection);
_dereq_('./reduce.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
_dereq_('./settle.js')(Promise, PromiseArray, debug);
_dereq_('./some.js')(Promise, PromiseArray, apiRejection);
_dereq_('./timers.js')(Promise, INTERNAL, debug);
_dereq_('./using.js')(Promise, apiRejection, tryConvertToPromise, createContext, INTERNAL, debug);
_dereq_('./any.js')(Promise);
_dereq_('./each.js')(Promise, INTERNAL);
_dereq_('./filter.js')(Promise, INTERNAL);
                                                         
    util.toFastProperties(Promise);                                          
    util.toFastProperties(Promise.prototype);                                
    function fillTypes(value) {                                              
        var p = new Promise(INTERNAL);                                       
        p._fulfillmentHandler0 = value;                                      
        p._rejectionHandler0 = value;                                        
        p._promise0 = value;                                                 
        p._receiver0 = value;                                                
    }                                                                        
    // Complete slack tracking, opt out of field-type tracking and           
    // stabilize map                                                         
    fillTypes({a: 1});                                                       
    fillTypes({b: 2});                                                       
    fillTypes({c: 3});                                                       
    fillTypes(1);                                                            
    fillTypes(function(){});                                                 
    fillTypes(undefined);                                                    
    fillTypes(false);                                                        
    fillTypes(new Promise(INTERNAL));                                        
    debug.setBounds(Async.firstLineError, util.lastLineError);               
    return Promise;                                                          

};

},{"./any.js":1,"./async":2,"./bind":3,"./call_get.js":5,"./cancel":6,"./catch_filter":7,"./context":8,"./debuggability":9,"./direct_resolve":10,"./each.js":11,"./errors":12,"./es5":13,"./filter.js":14,"./finally":15,"./generators.js":16,"./join":17,"./map.js":18,"./method":19,"./nodeback":20,"./nodeify.js":21,"./promise_array":23,"./promisify.js":24,"./props.js":25,"./race.js":27,"./reduce.js":28,"./settle.js":30,"./some.js":31,"./synchronous_inspection":32,"./thenables":33,"./timers.js":34,"./using.js":35,"./util":36}],23:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, tryConvertToPromise,
    apiRejection, Proxyable) {
var util = _dereq_("./util");
var isArray = util.isArray;

function toResolutionValue(val) {
    switch(val) {
    case -2: return [];
    case -3: return {};
    case -6: return new Map();
    }
}

function PromiseArray(values) {
    var promise = this._promise = new Promise(INTERNAL);
    if (values instanceof Promise) {
        promise._propagateFrom(values, 3);
    }
    promise._setOnCancel(this);
    this._values = values;
    this._length = 0;
    this._totalResolved = 0;
    this._init(undefined, -2);
}
util.inherits(PromiseArray, Proxyable);

PromiseArray.prototype.length = function () {
    return this._length;
};

PromiseArray.prototype.promise = function () {
    return this._promise;
};

PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
    var values = tryConvertToPromise(this._values, this._promise);
    if (values instanceof Promise) {
        values = values._target();
        var bitField = values._bitField;
        ;
        this._values = values;

        if (((bitField & 50397184) === 0)) {
            this._promise._setAsyncGuaranteed();
            return values._then(
                init,
                this._reject,
                undefined,
                this,
                resolveValueIfEmpty
           );
        } else if (((bitField & 33554432) !== 0)) {
            values = values._value();
        } else if (((bitField & 16777216) !== 0)) {
            return this._reject(values._reason());
        } else {
            return this._cancel();
        }
    }
    values = util.asArray(values);
    if (values === null) {
        var err = apiRejection(
            "expecting an array or an iterable object but got " + util.classString(values)).reason();
        this._promise._rejectCallback(err, false);
        return;
    }

    if (values.length === 0) {
        if (resolveValueIfEmpty === -5) {
            this._resolveEmptyArray();
        }
        else {
            this._resolve(toResolutionValue(resolveValueIfEmpty));
        }
        return;
    }
    this._iterate(values);
};

PromiseArray.prototype._iterate = function(values) {
    var len = this.getActualLength(values.length);
    this._length = len;
    this._values = this.shouldCopyValues() ? new Array(len) : this._values;
    var result = this._promise;
    var isResolved = false;
    var bitField = null;
    for (var i = 0; i < len; ++i) {
        var maybePromise = tryConvertToPromise(values[i], result);

        if (maybePromise instanceof Promise) {
            maybePromise = maybePromise._target();
            bitField = maybePromise._bitField;
        } else {
            bitField = null;
        }

        if (isResolved) {
            if (bitField !== null) {
                maybePromise.suppressUnhandledRejections();
            }
        } else if (bitField !== null) {
            if (((bitField & 50397184) === 0)) {
                maybePromise._proxy(this, i);
                this._values[i] = maybePromise;
            } else if (((bitField & 33554432) !== 0)) {
                isResolved = this._promiseFulfilled(maybePromise._value(), i);
            } else if (((bitField & 16777216) !== 0)) {
                isResolved = this._promiseRejected(maybePromise._reason(), i);
            } else {
                isResolved = this._promiseCancelled(i);
            }
        } else {
            isResolved = this._promiseFulfilled(maybePromise, i);
        }
    }
    if (!isResolved) result._setAsyncGuaranteed();
};

PromiseArray.prototype._isResolved = function () {
    return this._values === null;
};

PromiseArray.prototype._resolve = function (value) {
    this._values = null;
    this._promise._fulfill(value);
};

PromiseArray.prototype._cancel = function() {
    if (this._isResolved() || !this._promise._isCancellable()) return;
    this._values = null;
    this._promise._cancel();
};

PromiseArray.prototype._reject = function (reason) {
    this._values = null;
    this._promise._rejectCallback(reason, false);
};

PromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
        return true;
    }
    return false;
};

PromiseArray.prototype._promiseCancelled = function() {
    this._cancel();
    return true;
};

PromiseArray.prototype._promiseRejected = function (reason) {
    this._totalResolved++;
    this._reject(reason);
    return true;
};

PromiseArray.prototype._resultCancelled = function() {
    if (this._isResolved()) return;
    var values = this._values;
    this._cancel();
    if (values instanceof Promise) {
        values.cancel();
    } else {
        for (var i = 0; i < values.length; ++i) {
            if (values[i] instanceof Promise) {
                values[i].cancel();
            }
        }
    }
};

PromiseArray.prototype.shouldCopyValues = function () {
    return true;
};

PromiseArray.prototype.getActualLength = function (len) {
    return len;
};

return PromiseArray;
};

},{"./util":36}],24:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var THIS = {};
var util = _dereq_("./util");
var nodebackForPromise = _dereq_("./nodeback");
var withAppended = util.withAppended;
var maybeWrapAsError = util.maybeWrapAsError;
var canEvaluate = util.canEvaluate;
var TypeError = _dereq_("./errors").TypeError;
var defaultSuffix = "Async";
var defaultPromisified = {__isPromisified__: true};
var noCopyProps = [
    "arity",    "length",
    "name",
    "arguments",
    "caller",
    "callee",
    "prototype",
    "__isPromisified__"
];
var noCopyPropsPattern = new RegExp("^(?:" + noCopyProps.join("|") + ")$");

var defaultFilter = function(name) {
    return util.isIdentifier(name) &&
        name.charAt(0) !== "_" &&
        name !== "constructor";
};

function propsFilter(key) {
    return !noCopyPropsPattern.test(key);
}

function isPromisified(fn) {
    try {
        return fn.__isPromisified__ === true;
    }
    catch (e) {
        return false;
    }
}

function hasPromisified(obj, key, suffix) {
    var val = util.getDataPropertyOrDefault(obj, key + suffix,
                                            defaultPromisified);
    return val ? isPromisified(val) : false;
}
function checkValid(ret, suffix, suffixRegexp) {
    for (var i = 0; i < ret.length; i += 2) {
        var key = ret[i];
        if (suffixRegexp.test(key)) {
            var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
            for (var j = 0; j < ret.length; j += 2) {
                if (ret[j] === keyWithoutAsyncSuffix) {
                    throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\u000a\u000a    See http://goo.gl/MqrFmX\u000a"
                        .replace("%s", suffix));
                }
            }
        }
    }
}

function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
    var keys = util.inheritedDataKeys(obj);
    var ret = [];
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var value = obj[key];
        var passesDefaultFilter = filter === defaultFilter
            ? true : defaultFilter(key, value, obj);
        if (typeof value === "function" &&
            !isPromisified(value) &&
            !hasPromisified(obj, key, suffix) &&
            filter(key, value, obj, passesDefaultFilter)) {
            ret.push(key, value);
        }
    }
    checkValid(ret, suffix, suffixRegexp);
    return ret;
}

var escapeIdentRegex = function(str) {
    return str.replace(/([$])/, "\\$");
};

var makeNodePromisifiedEval;
if (!true) {
var switchCaseArgumentOrder = function(likelyArgumentCount) {
    var ret = [likelyArgumentCount];
    var min = Math.max(0, likelyArgumentCount - 1 - 3);
    for(var i = likelyArgumentCount - 1; i >= min; --i) {
        ret.push(i);
    }
    for(var i = likelyArgumentCount + 1; i <= 3; ++i) {
        ret.push(i);
    }
    return ret;
};

var argumentSequence = function(argumentCount) {
    return util.filledRange(argumentCount, "_arg", "");
};

var parameterDeclaration = function(parameterCount) {
    return util.filledRange(
        Math.max(parameterCount, 3), "_arg", "");
};

var parameterCount = function(fn) {
    if (typeof fn.length === "number") {
        return Math.max(Math.min(fn.length, 1023 + 1), 0);
    }
    return 0;
};

makeNodePromisifiedEval =
function(callback, receiver, originalName, fn, _, multiArgs) {
    var newParameterCount = Math.max(0, parameterCount(fn) - 1);
    var argumentOrder = switchCaseArgumentOrder(newParameterCount);
    var shouldProxyThis = typeof callback === "string" || receiver === THIS;

    function generateCallForArgumentCount(count) {
        var args = argumentSequence(count).join(", ");
        var comma = count > 0 ? ", " : "";
        var ret;
        if (shouldProxyThis) {
            ret = "ret = callback.call(this, {{args}}, nodeback); break;\n";
        } else {
            ret = receiver === undefined
                ? "ret = callback({{args}}, nodeback); break;\n"
                : "ret = callback.call(receiver, {{args}}, nodeback); break;\n";
        }
        return ret.replace("{{args}}", args).replace(", ", comma);
    }

    function generateArgumentSwitchCase() {
        var ret = "";
        for (var i = 0; i < argumentOrder.length; ++i) {
            ret += "case " + argumentOrder[i] +":" +
                generateCallForArgumentCount(argumentOrder[i]);
        }

        ret += "                                                             \n\
        default:                                                             \n\
            var args = new Array(len + 1);                                   \n\
            var i = 0;                                                       \n\
            for (var i = 0; i < len; ++i) {                                  \n\
               args[i] = arguments[i];                                       \n\
            }                                                                \n\
            args[i] = nodeback;                                              \n\
            [CodeForCall]                                                    \n\
            break;                                                           \n\
        ".replace("[CodeForCall]", (shouldProxyThis
                                ? "ret = callback.apply(this, args);\n"
                                : "ret = callback.apply(receiver, args);\n"));
        return ret;
    }

    var getFunctionCode = typeof callback === "string"
                                ? ("this != null ? this['"+callback+"'] : fn")
                                : "fn";
    var body = "'use strict';                                                \n\
        var ret = function (Parameters) {                                    \n\
            'use strict';                                                    \n\
            var len = arguments.length;                                      \n\
            var promise = new Promise(INTERNAL);                             \n\
            promise._captureStackTrace();                                    \n\
            var nodeback = nodebackForPromise(promise, " + multiArgs + ");   \n\
            var ret;                                                         \n\
            var callback = tryCatch([GetFunctionCode]);                      \n\
            switch(len) {                                                    \n\
                [CodeForSwitchCase]                                          \n\
            }                                                                \n\
            if (ret === errorObj) {                                          \n\
                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n\
            }                                                                \n\
            if (!promise._isFateSealed()) promise._setAsyncGuaranteed();     \n\
            return promise;                                                  \n\
        };                                                                   \n\
        notEnumerableProp(ret, '__isPromisified__', true);                   \n\
        return ret;                                                          \n\
    ".replace("[CodeForSwitchCase]", generateArgumentSwitchCase())
        .replace("[GetFunctionCode]", getFunctionCode);
    body = body.replace("Parameters", parameterDeclaration(newParameterCount));
    return new Function("Promise",
                        "fn",
                        "receiver",
                        "withAppended",
                        "maybeWrapAsError",
                        "nodebackForPromise",
                        "tryCatch",
                        "errorObj",
                        "notEnumerableProp",
                        "INTERNAL",
                        body)(
                    Promise,
                    fn,
                    receiver,
                    withAppended,
                    maybeWrapAsError,
                    nodebackForPromise,
                    util.tryCatch,
                    util.errorObj,
                    util.notEnumerableProp,
                    INTERNAL);
};
}

function makeNodePromisifiedClosure(callback, receiver, _, fn, __, multiArgs) {
    var defaultThis = (function() {return this;})();
    var method = callback;
    if (typeof method === "string") {
        callback = fn;
    }
    function promisified() {
        var _receiver = receiver;
        if (receiver === THIS) _receiver = this;
        var promise = new Promise(INTERNAL);
        promise._captureStackTrace();
        var cb = typeof method === "string" && this !== defaultThis
            ? this[method] : callback;
        var fn = nodebackForPromise(promise, multiArgs);
        try {
            cb.apply(_receiver, withAppended(arguments, fn));
        } catch(e) {
            promise._rejectCallback(maybeWrapAsError(e), true, true);
        }
        if (!promise._isFateSealed()) promise._setAsyncGuaranteed();
        return promise;
    }
    util.notEnumerableProp(promisified, "__isPromisified__", true);
    return promisified;
}

var makeNodePromisified = canEvaluate
    ? makeNodePromisifiedEval
    : makeNodePromisifiedClosure;

function promisifyAll(obj, suffix, filter, promisifier, multiArgs) {
    var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$");
    var methods =
        promisifiableMethods(obj, suffix, suffixRegexp, filter);

    for (var i = 0, len = methods.length; i < len; i+= 2) {
        var key = methods[i];
        var fn = methods[i+1];
        var promisifiedKey = key + suffix;
        if (promisifier === makeNodePromisified) {
            obj[promisifiedKey] =
                makeNodePromisified(key, THIS, key, fn, suffix, multiArgs);
        } else {
            var promisified = promisifier(fn, function() {
                return makeNodePromisified(key, THIS, key,
                                           fn, suffix, multiArgs);
            });
            util.notEnumerableProp(promisified, "__isPromisified__", true);
            obj[promisifiedKey] = promisified;
        }
    }
    util.toFastProperties(obj);
    return obj;
}

function promisify(callback, receiver, multiArgs) {
    return makeNodePromisified(callback, receiver, undefined,
                                callback, null, multiArgs);
}

Promise.promisify = function (fn, options) {
    if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
    }
    if (isPromisified(fn)) {
        return fn;
    }
    options = Object(options);
    var receiver = options.context === undefined ? THIS : options.context;
    var multiArgs = !!options.multiArgs;
    var ret = promisify(fn, receiver, multiArgs);
    util.copyDescriptors(fn, ret, propsFilter);
    return ret;
};

Promise.promisifyAll = function (target, options) {
    if (typeof target !== "function" && typeof target !== "object") {
        throw new TypeError("the target of promisifyAll must be an object or a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    options = Object(options);
    var multiArgs = !!options.multiArgs;
    var suffix = options.suffix;
    if (typeof suffix !== "string") suffix = defaultSuffix;
    var filter = options.filter;
    if (typeof filter !== "function") filter = defaultFilter;
    var promisifier = options.promisifier;
    if (typeof promisifier !== "function") promisifier = makeNodePromisified;

    if (!util.isIdentifier(suffix)) {
        throw new RangeError("suffix must be a valid identifier\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }

    var keys = util.inheritedDataKeys(target);
    for (var i = 0; i < keys.length; ++i) {
        var value = target[keys[i]];
        if (keys[i] !== "constructor" &&
            util.isClass(value)) {
            promisifyAll(value.prototype, suffix, filter, promisifier,
                multiArgs);
            promisifyAll(value, suffix, filter, promisifier, multiArgs);
        }
    }

    return promisifyAll(target, suffix, filter, promisifier, multiArgs);
};
};


},{"./errors":12,"./nodeback":20,"./util":36}],25:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, PromiseArray, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util");
var isObject = util.isObject;
var es5 = _dereq_("./es5");
var Es6Map;
if (typeof Map === "function") Es6Map = Map;

var mapToEntries = (function() {
    var index = 0;
    var size = 0;

    function extractEntry(value, key) {
        this[index] = value;
        this[index + size] = key;
        index++;
    }

    return function mapToEntries(map) {
        size = map.size;
        index = 0;
        var ret = new Array(map.size * 2);
        map.forEach(extractEntry, ret);
        return ret;
    };
})();

var entriesToMap = function(entries) {
    var ret = new Es6Map();
    var length = entries.length / 2 | 0;
    for (var i = 0; i < length; ++i) {
        var key = entries[length + i];
        var value = entries[i];
        ret.set(key, value);
    }
    return ret;
};

function PropertiesPromiseArray(obj) {
    var isMap = false;
    var entries;
    if (Es6Map !== undefined && obj instanceof Es6Map) {
        entries = mapToEntries(obj);
        isMap = true;
    } else {
        var keys = es5.keys(obj);
        var len = keys.length;
        entries = new Array(len * 2);
        for (var i = 0; i < len; ++i) {
            var key = keys[i];
            entries[i] = obj[key];
            entries[i + len] = key;
        }
    }
    this.constructor$(entries);
    this._isMap = isMap;
    this._init$(undefined, isMap ? -6 : -3);
}
util.inherits(PropertiesPromiseArray, PromiseArray);

PropertiesPromiseArray.prototype._init = function () {};

PropertiesPromiseArray.prototype._promiseFulfilled = function (value, index) {
    this._values[index] = value;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        var val;
        if (this._isMap) {
            val = entriesToMap(this._values);
        } else {
            val = {};
            var keyOffset = this.length();
            for (var i = 0, len = this.length(); i < len; ++i) {
                val[this._values[i + keyOffset]] = this._values[i];
            }
        }
        this._resolve(val);
        return true;
    }
    return false;
};

PropertiesPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

PropertiesPromiseArray.prototype.getActualLength = function (len) {
    return len >> 1;
};

function props(promises) {
    var ret;
    var castValue = tryConvertToPromise(promises);

    if (!isObject(castValue)) {
        return apiRejection("cannot await properties of a non-object\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    } else if (castValue instanceof Promise) {
        ret = castValue._then(
            Promise.props, undefined, undefined, undefined, undefined);
    } else {
        ret = new PropertiesPromiseArray(castValue).promise();
    }

    if (castValue instanceof Promise) {
        ret._propagateFrom(castValue, 2);
    }
    return ret;
}

Promise.prototype.props = function () {
    return props(this);
};

Promise.props = function (promises) {
    return props(promises);
};
};

},{"./es5":13,"./util":36}],26:[function(_dereq_,module,exports){
"use strict";
function arrayMove(src, srcIndex, dst, dstIndex, len) {
    for (var j = 0; j < len; ++j) {
        dst[j + dstIndex] = src[j + srcIndex];
        src[j + srcIndex] = void 0;
    }
}

function Queue(capacity) {
    this._capacity = capacity;
    this._length = 0;
    this._front = 0;
}

Queue.prototype._willBeOverCapacity = function (size) {
    return this._capacity < size;
};

Queue.prototype._pushOne = function (arg) {
    var length = this.length();
    this._checkCapacity(length + 1);
    var i = (this._front + length) & (this._capacity - 1);
    this[i] = arg;
    this._length = length + 1;
};

Queue.prototype.push = function (fn, receiver, arg) {
    var length = this.length() + 3;
    if (this._willBeOverCapacity(length)) {
        this._pushOne(fn);
        this._pushOne(receiver);
        this._pushOne(arg);
        return;
    }
    var j = this._front + length - 3;
    this._checkCapacity(length);
    var wrapMask = this._capacity - 1;
    this[(j + 0) & wrapMask] = fn;
    this[(j + 1) & wrapMask] = receiver;
    this[(j + 2) & wrapMask] = arg;
    this._length = length;
};

Queue.prototype.shift = function () {
    var front = this._front,
        ret = this[front];

    this[front] = undefined;
    this._front = (front + 1) & (this._capacity - 1);
    this._length--;
    return ret;
};

Queue.prototype.length = function () {
    return this._length;
};

Queue.prototype._checkCapacity = function (size) {
    if (this._capacity < size) {
        this._resizeTo(this._capacity << 1);
    }
};

Queue.prototype._resizeTo = function (capacity) {
    var oldCapacity = this._capacity;
    this._capacity = capacity;
    var front = this._front;
    var length = this._length;
    var moveItemsCount = (front + length) & (oldCapacity - 1);
    arrayMove(this, 0, this, oldCapacity, moveItemsCount);
};

module.exports = Queue;

},{}],27:[function(_dereq_,module,exports){
"use strict";
module.exports = function(
    Promise, INTERNAL, tryConvertToPromise, apiRejection) {
var util = _dereq_("./util");

var raceLater = function (promise) {
    return promise.then(function(array) {
        return race(array, promise);
    });
};

function race(promises, parent) {
    var maybePromise = tryConvertToPromise(promises);

    if (maybePromise instanceof Promise) {
        return raceLater(maybePromise);
    } else {
        promises = util.asArray(promises);
        if (promises === null)
            return apiRejection("expecting an array or an iterable object but got " + util.classString(promises));
    }

    var ret = new Promise(INTERNAL);
    if (parent !== undefined) {
        ret._propagateFrom(parent, 3);
    }
    var fulfill = ret._fulfill;
    var reject = ret._reject;
    for (var i = 0, len = promises.length; i < len; ++i) {
        var val = promises[i];

        if (val === undefined && !(i in promises)) {
            continue;
        }

        Promise.cast(val)._then(fulfill, reject, undefined, ret, null);
    }
    return ret;
}

Promise.race = function (promises) {
    return race(promises, undefined);
};

Promise.prototype.race = function () {
    return race(this, undefined);
};

};

},{"./util":36}],28:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise,
                          PromiseArray,
                          apiRejection,
                          tryConvertToPromise,
                          INTERNAL,
                          debug) {
var getDomain = Promise._getDomain;
var util = _dereq_("./util");
var tryCatch = util.tryCatch;

function ReductionPromiseArray(promises, fn, initialValue, _each) {
    this.constructor$(promises);
    var domain = getDomain();
    this._fn = domain === null ? fn : util.domainBind(domain, fn);
    if (initialValue !== undefined) {
        initialValue = Promise.resolve(initialValue);
        initialValue._attachCancellationCallback(this);
    }
    this._initialValue = initialValue;
    this._currentCancellable = null;
    if(_each === INTERNAL) {
        this._eachValues = Array(this._length);
    } else if (_each === 0) {
        this._eachValues = null;
    } else {
        this._eachValues = undefined;
    }
    this._promise._captureStackTrace();
    this._init$(undefined, -5);
}
util.inherits(ReductionPromiseArray, PromiseArray);

ReductionPromiseArray.prototype._gotAccum = function(accum) {
    if (this._eachValues !== undefined && 
        this._eachValues !== null && 
        accum !== INTERNAL) {
        this._eachValues.push(accum);
    }
};

ReductionPromiseArray.prototype._eachComplete = function(value) {
    if (this._eachValues !== null) {
        this._eachValues.push(value);
    }
    return this._eachValues;
};

ReductionPromiseArray.prototype._init = function() {};

ReductionPromiseArray.prototype._resolveEmptyArray = function() {
    this._resolve(this._eachValues !== undefined ? this._eachValues
                                                 : this._initialValue);
};

ReductionPromiseArray.prototype.shouldCopyValues = function () {
    return false;
};

ReductionPromiseArray.prototype._resolve = function(value) {
    this._promise._resolveCallback(value);
    this._values = null;
};

ReductionPromiseArray.prototype._resultCancelled = function(sender) {
    if (sender === this._initialValue) return this._cancel();
    if (this._isResolved()) return;
    this._resultCancelled$();
    if (this._currentCancellable instanceof Promise) {
        this._currentCancellable.cancel();
    }
    if (this._initialValue instanceof Promise) {
        this._initialValue.cancel();
    }
};

ReductionPromiseArray.prototype._iterate = function (values) {
    this._values = values;
    var value;
    var i;
    var length = values.length;
    if (this._initialValue !== undefined) {
        value = this._initialValue;
        i = 0;
    } else {
        value = Promise.resolve(values[0]);
        i = 1;
    }

    this._currentCancellable = value;

    if (!value.isRejected()) {
        for (; i < length; ++i) {
            var ctx = {
                accum: null,
                value: values[i],
                index: i,
                length: length,
                array: this
            };
            value = value._then(gotAccum, undefined, undefined, ctx, undefined);
        }
    }

    if (this._eachValues !== undefined) {
        value = value
            ._then(this._eachComplete, undefined, undefined, this, undefined);
    }
    value._then(completed, completed, undefined, value, this);
};

Promise.prototype.reduce = function (fn, initialValue) {
    return reduce(this, fn, initialValue, null);
};

Promise.reduce = function (promises, fn, initialValue, _each) {
    return reduce(promises, fn, initialValue, _each);
};

function completed(valueOrReason, array) {
    if (this.isFulfilled()) {
        array._resolve(valueOrReason);
    } else {
        array._reject(valueOrReason);
    }
}

function reduce(promises, fn, initialValue, _each) {
    if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
    }
    var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
    return array.promise();
}

function gotAccum(accum) {
    this.accum = accum;
    this.array._gotAccum(accum);
    var value = tryConvertToPromise(this.value, this.array._promise);
    if (value instanceof Promise) {
        this.array._currentCancellable = value;
        return value._then(gotValue, undefined, undefined, this, undefined);
    } else {
        return gotValue.call(this, value);
    }
}

function gotValue(value) {
    var array = this.array;
    var promise = array._promise;
    var fn = tryCatch(array._fn);
    promise._pushContext();
    var ret;
    if (array._eachValues !== undefined) {
        ret = fn.call(promise._boundValue(), value, this.index, this.length);
    } else {
        ret = fn.call(promise._boundValue(),
                              this.accum, value, this.index, this.length);
    }
    if (ret instanceof Promise) {
        array._currentCancellable = ret;
    }
    var promiseCreated = promise._popContext();
    debug.checkForgottenReturns(
        ret,
        promiseCreated,
        array._eachValues !== undefined ? "Promise.each" : "Promise.reduce",
        promise
    );
    return ret;
}
};

},{"./util":36}],29:[function(_dereq_,module,exports){
"use strict";
var util = _dereq_("./util");
var schedule;
var noAsyncScheduler = function() {
    throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
};
var NativePromise = util.getNativePromise();
if (util.isNode && typeof MutationObserver === "undefined") {
    var GlobalSetImmediate = global.setImmediate;
    var ProcessNextTick = process.nextTick;
    schedule = util.isRecentNode
                ? function(fn) { GlobalSetImmediate.call(global, fn); }
                : function(fn) { ProcessNextTick.call(process, fn); };
} else if (typeof NativePromise === "function" &&
           typeof NativePromise.resolve === "function") {
    var nativePromise = NativePromise.resolve();
    schedule = function(fn) {
        nativePromise.then(fn);
    };
} else if ((typeof MutationObserver !== "undefined") &&
          !(typeof window !== "undefined" &&
            window.navigator &&
            (window.navigator.standalone || window.cordova)) &&
          ("classList" in document.documentElement)) {
    schedule = (function() {
        var div = document.createElement("div");
        var opts = {attributes: true};
        var toggleScheduled = false;
        var div2 = document.createElement("div");
        var o2 = new MutationObserver(function() {
            div.classList.toggle("foo");
            toggleScheduled = false;
        });
        o2.observe(div2, opts);

        var scheduleToggle = function() {
            if (toggleScheduled) return;
            toggleScheduled = true;
            div2.classList.toggle("foo");
        };

        return function schedule(fn) {
            var o = new MutationObserver(function() {
                o.disconnect();
                fn();
            });
            o.observe(div, opts);
            scheduleToggle();
        };
    })();
} else if (typeof setImmediate !== "undefined") {
    schedule = function (fn) {
        setImmediate(fn);
    };
} else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
        setTimeout(fn, 0);
    };
} else {
    schedule = noAsyncScheduler;
}
module.exports = schedule;

},{"./util":36}],30:[function(_dereq_,module,exports){
"use strict";
module.exports =
    function(Promise, PromiseArray, debug) {
var PromiseInspection = Promise.PromiseInspection;
var util = _dereq_("./util");

function SettledPromiseArray(values) {
    this.constructor$(values);
}
util.inherits(SettledPromiseArray, PromiseArray);

SettledPromiseArray.prototype._promiseResolved = function (index, inspection) {
    this._values[index] = inspection;
    var totalResolved = ++this._totalResolved;
    if (totalResolved >= this._length) {
        this._resolve(this._values);
        return true;
    }
    return false;
};

SettledPromiseArray.prototype._promiseFulfilled = function (value, index) {
    var ret = new PromiseInspection();
    ret._bitField = 33554432;
    ret._settledValueField = value;
    return this._promiseResolved(index, ret);
};
SettledPromiseArray.prototype._promiseRejected = function (reason, index) {
    var ret = new PromiseInspection();
    ret._bitField = 16777216;
    ret._settledValueField = reason;
    return this._promiseResolved(index, ret);
};

Promise.settle = function (promises) {
    debug.deprecated(".settle()", ".reflect()");
    return new SettledPromiseArray(promises).promise();
};

Promise.prototype.settle = function () {
    return Promise.settle(this);
};
};

},{"./util":36}],31:[function(_dereq_,module,exports){
"use strict";
module.exports =
function(Promise, PromiseArray, apiRejection) {
var util = _dereq_("./util");
var RangeError = _dereq_("./errors").RangeError;
var AggregateError = _dereq_("./errors").AggregateError;
var isArray = util.isArray;
var CANCELLATION = {};


function SomePromiseArray(values) {
    this.constructor$(values);
    this._howMany = 0;
    this._unwrap = false;
    this._initialized = false;
}
util.inherits(SomePromiseArray, PromiseArray);

SomePromiseArray.prototype._init = function () {
    if (!this._initialized) {
        return;
    }
    if (this._howMany === 0) {
        this._resolve([]);
        return;
    }
    this._init$(undefined, -5);
    var isArrayResolved = isArray(this._values);
    if (!this._isResolved() &&
        isArrayResolved &&
        this._howMany > this._canPossiblyFulfill()) {
        this._reject(this._getRangeError(this.length()));
    }
};

SomePromiseArray.prototype.init = function () {
    this._initialized = true;
    this._init();
};

SomePromiseArray.prototype.setUnwrap = function () {
    this._unwrap = true;
};

SomePromiseArray.prototype.howMany = function () {
    return this._howMany;
};

SomePromiseArray.prototype.setHowMany = function (count) {
    this._howMany = count;
};

SomePromiseArray.prototype._promiseFulfilled = function (value) {
    this._addFulfilled(value);
    if (this._fulfilled() === this.howMany()) {
        this._values.length = this.howMany();
        if (this.howMany() === 1 && this._unwrap) {
            this._resolve(this._values[0]);
        } else {
            this._resolve(this._values);
        }
        return true;
    }
    return false;

};
SomePromiseArray.prototype._promiseRejected = function (reason) {
    this._addRejected(reason);
    return this._checkOutcome();
};

SomePromiseArray.prototype._promiseCancelled = function () {
    if (this._values instanceof Promise || this._values == null) {
        return this._cancel();
    }
    this._addRejected(CANCELLATION);
    return this._checkOutcome();
};

SomePromiseArray.prototype._checkOutcome = function() {
    if (this.howMany() > this._canPossiblyFulfill()) {
        var e = new AggregateError();
        for (var i = this.length(); i < this._values.length; ++i) {
            if (this._values[i] !== CANCELLATION) {
                e.push(this._values[i]);
            }
        }
        if (e.length > 0) {
            this._reject(e);
        } else {
            this._cancel();
        }
        return true;
    }
    return false;
};

SomePromiseArray.prototype._fulfilled = function () {
    return this._totalResolved;
};

SomePromiseArray.prototype._rejected = function () {
    return this._values.length - this.length();
};

SomePromiseArray.prototype._addRejected = function (reason) {
    this._values.push(reason);
};

SomePromiseArray.prototype._addFulfilled = function (value) {
    this._values[this._totalResolved++] = value;
};

SomePromiseArray.prototype._canPossiblyFulfill = function () {
    return this.length() - this._rejected();
};

SomePromiseArray.prototype._getRangeError = function (count) {
    var message = "Input array must contain at least " +
            this._howMany + " items but contains only " + count + " items";
    return new RangeError(message);
};

SomePromiseArray.prototype._resolveEmptyArray = function () {
    this._reject(this._getRangeError(0));
};

function some(promises, howMany) {
    if ((howMany | 0) !== howMany || howMany < 0) {
        return apiRejection("expecting a positive integer\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    var ret = new SomePromiseArray(promises);
    var promise = ret.promise();
    ret.setHowMany(howMany);
    ret.init();
    return promise;
}

Promise.some = function (promises, howMany) {
    return some(promises, howMany);
};

Promise.prototype.some = function (howMany) {
    return some(this, howMany);
};

Promise._SomePromiseArray = SomePromiseArray;
};

},{"./errors":12,"./util":36}],32:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise) {
function PromiseInspection(promise) {
    if (promise !== undefined) {
        promise = promise._target();
        this._bitField = promise._bitField;
        this._settledValueField = promise._isFateSealed()
            ? promise._settledValue() : undefined;
    }
    else {
        this._bitField = 0;
        this._settledValueField = undefined;
    }
}

PromiseInspection.prototype._settledValue = function() {
    return this._settledValueField;
};

var value = PromiseInspection.prototype.value = function () {
    if (!this.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    return this._settledValue();
};

var reason = PromiseInspection.prototype.error =
PromiseInspection.prototype.reason = function () {
    if (!this.isRejected()) {
        throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
    return this._settledValue();
};

var isFulfilled = PromiseInspection.prototype.isFulfilled = function() {
    return (this._bitField & 33554432) !== 0;
};

var isRejected = PromiseInspection.prototype.isRejected = function () {
    return (this._bitField & 16777216) !== 0;
};

var isPending = PromiseInspection.prototype.isPending = function () {
    return (this._bitField & 50397184) === 0;
};

var isResolved = PromiseInspection.prototype.isResolved = function () {
    return (this._bitField & 50331648) !== 0;
};

PromiseInspection.prototype.isCancelled = function() {
    return (this._bitField & 8454144) !== 0;
};

Promise.prototype.__isCancelled = function() {
    return (this._bitField & 65536) === 65536;
};

Promise.prototype._isCancelled = function() {
    return this._target().__isCancelled();
};

Promise.prototype.isCancelled = function() {
    return (this._target()._bitField & 8454144) !== 0;
};

Promise.prototype.isPending = function() {
    return isPending.call(this._target());
};

Promise.prototype.isRejected = function() {
    return isRejected.call(this._target());
};

Promise.prototype.isFulfilled = function() {
    return isFulfilled.call(this._target());
};

Promise.prototype.isResolved = function() {
    return isResolved.call(this._target());
};

Promise.prototype.value = function() {
    return value.call(this._target());
};

Promise.prototype.reason = function() {
    var target = this._target();
    target._unsetRejectionIsUnhandled();
    return reason.call(target);
};

Promise.prototype._value = function() {
    return this._settledValue();
};

Promise.prototype._reason = function() {
    this._unsetRejectionIsUnhandled();
    return this._settledValue();
};

Promise.PromiseInspection = PromiseInspection;
};

},{}],33:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL) {
var util = _dereq_("./util");
var errorObj = util.errorObj;
var isObject = util.isObject;

function tryConvertToPromise(obj, context) {
    if (isObject(obj)) {
        if (obj instanceof Promise) return obj;
        var then = getThen(obj);
        if (then === errorObj) {
            if (context) context._pushContext();
            var ret = Promise.reject(then.e);
            if (context) context._popContext();
            return ret;
        } else if (typeof then === "function") {
            if (isAnyBluebirdPromise(obj)) {
                var ret = new Promise(INTERNAL);
                obj._then(
                    ret._fulfill,
                    ret._reject,
                    undefined,
                    ret,
                    null
                );
                return ret;
            }
            return doThenable(obj, then, context);
        }
    }
    return obj;
}

function doGetThen(obj) {
    return obj.then;
}

function getThen(obj) {
    try {
        return doGetThen(obj);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}

var hasProp = {}.hasOwnProperty;
function isAnyBluebirdPromise(obj) {
    try {
        return hasProp.call(obj, "_promise0");
    } catch (e) {
        return false;
    }
}

function doThenable(x, then, context) {
    var promise = new Promise(INTERNAL);
    var ret = promise;
    if (context) context._pushContext();
    promise._captureStackTrace();
    if (context) context._popContext();
    var synchronous = true;
    var result = util.tryCatch(then).call(x, resolve, reject);
    synchronous = false;

    if (promise && result === errorObj) {
        promise._rejectCallback(result.e, true, true);
        promise = null;
    }

    function resolve(value) {
        if (!promise) return;
        promise._resolveCallback(value);
        promise = null;
    }

    function reject(reason) {
        if (!promise) return;
        promise._rejectCallback(reason, synchronous, true);
        promise = null;
    }
    return ret;
}

return tryConvertToPromise;
};

},{"./util":36}],34:[function(_dereq_,module,exports){
"use strict";
module.exports = function(Promise, INTERNAL, debug) {
var util = _dereq_("./util");
var TimeoutError = Promise.TimeoutError;

function HandleWrapper(handle)  {
    this.handle = handle;
}

HandleWrapper.prototype._resultCancelled = function() {
    clearTimeout(this.handle);
};

var afterValue = function(value) { return delay(+this).thenReturn(value); };
var delay = Promise.delay = function (ms, value) {
    var ret;
    var handle;
    if (value !== undefined) {
        ret = Promise.resolve(value)
                ._then(afterValue, null, null, ms, undefined);
        if (debug.cancellation() && value instanceof Promise) {
            ret._setOnCancel(value);
        }
    } else {
        ret = new Promise(INTERNAL);
        handle = setTimeout(function() { ret._fulfill(); }, +ms);
        if (debug.cancellation()) {
            ret._setOnCancel(new HandleWrapper(handle));
        }
        ret._captureStackTrace();
    }
    ret._setAsyncGuaranteed();
    return ret;
};

Promise.prototype.delay = function (ms) {
    return delay(ms, this);
};

var afterTimeout = function (promise, message, parent) {
    var err;
    if (typeof message !== "string") {
        if (message instanceof Error) {
            err = message;
        } else {
            err = new TimeoutError("operation timed out");
        }
    } else {
        err = new TimeoutError(message);
    }
    util.markAsOriginatingFromRejection(err);
    promise._attachExtraTrace(err);
    promise._reject(err);

    if (parent != null) {
        parent.cancel();
    }
};

function successClear(value) {
    clearTimeout(this.handle);
    return value;
}

function failureClear(reason) {
    clearTimeout(this.handle);
    throw reason;
}

Promise.prototype.timeout = function (ms, message) {
    ms = +ms;
    var ret, parent;

    var handleWrapper = new HandleWrapper(setTimeout(function timeoutTimeout() {
        if (ret.isPending()) {
            afterTimeout(ret, message, parent);
        }
    }, ms));

    if (debug.cancellation()) {
        parent = this.then();
        ret = parent._then(successClear, failureClear,
                            undefined, handleWrapper, undefined);
        ret._setOnCancel(handleWrapper);
    } else {
        ret = this._then(successClear, failureClear,
                            undefined, handleWrapper, undefined);
    }

    return ret;
};

};

},{"./util":36}],35:[function(_dereq_,module,exports){
"use strict";
module.exports = function (Promise, apiRejection, tryConvertToPromise,
    createContext, INTERNAL, debug) {
    var util = _dereq_("./util");
    var TypeError = _dereq_("./errors").TypeError;
    var inherits = _dereq_("./util").inherits;
    var errorObj = util.errorObj;
    var tryCatch = util.tryCatch;
    var NULL = {};

    function thrower(e) {
        setTimeout(function(){throw e;}, 0);
    }

    function castPreservingDisposable(thenable) {
        var maybePromise = tryConvertToPromise(thenable);
        if (maybePromise !== thenable &&
            typeof thenable._isDisposable === "function" &&
            typeof thenable._getDisposer === "function" &&
            thenable._isDisposable()) {
            maybePromise._setDisposable(thenable._getDisposer());
        }
        return maybePromise;
    }
    function dispose(resources, inspection) {
        var i = 0;
        var len = resources.length;
        var ret = new Promise(INTERNAL);
        function iterator() {
            if (i >= len) return ret._fulfill();
            var maybePromise = castPreservingDisposable(resources[i++]);
            if (maybePromise instanceof Promise &&
                maybePromise._isDisposable()) {
                try {
                    maybePromise = tryConvertToPromise(
                        maybePromise._getDisposer().tryDispose(inspection),
                        resources.promise);
                } catch (e) {
                    return thrower(e);
                }
                if (maybePromise instanceof Promise) {
                    return maybePromise._then(iterator, thrower,
                                              null, null, null);
                }
            }
            iterator();
        }
        iterator();
        return ret;
    }

    function Disposer(data, promise, context) {
        this._data = data;
        this._promise = promise;
        this._context = context;
    }

    Disposer.prototype.data = function () {
        return this._data;
    };

    Disposer.prototype.promise = function () {
        return this._promise;
    };

    Disposer.prototype.resource = function () {
        if (this.promise().isFulfilled()) {
            return this.promise().value();
        }
        return NULL;
    };

    Disposer.prototype.tryDispose = function(inspection) {
        var resource = this.resource();
        var context = this._context;
        if (context !== undefined) context._pushContext();
        var ret = resource !== NULL
            ? this.doDispose(resource, inspection) : null;
        if (context !== undefined) context._popContext();
        this._promise._unsetDisposable();
        this._data = null;
        return ret;
    };

    Disposer.isDisposer = function (d) {
        return (d != null &&
                typeof d.resource === "function" &&
                typeof d.tryDispose === "function");
    };

    function FunctionDisposer(fn, promise, context) {
        this.constructor$(fn, promise, context);
    }
    inherits(FunctionDisposer, Disposer);

    FunctionDisposer.prototype.doDispose = function (resource, inspection) {
        var fn = this.data();
        return fn.call(resource, resource, inspection);
    };

    function maybeUnwrapDisposer(value) {
        if (Disposer.isDisposer(value)) {
            this.resources[this.index]._setDisposable(value);
            return value.promise();
        }
        return value;
    }

    function ResourceList(length) {
        this.length = length;
        this.promise = null;
        this[length-1] = null;
    }

    ResourceList.prototype._resultCancelled = function() {
        var len = this.length;
        for (var i = 0; i < len; ++i) {
            var item = this[i];
            if (item instanceof Promise) {
                item.cancel();
            }
        }
    };

    Promise.using = function () {
        var len = arguments.length;
        if (len < 2) return apiRejection(
                        "you must pass at least 2 arguments to Promise.using");
        var fn = arguments[len - 1];
        if (typeof fn !== "function") {
            return apiRejection("expecting a function but got " + util.classString(fn));
        }
        var input;
        var spreadArgs = true;
        if (len === 2 && Array.isArray(arguments[0])) {
            input = arguments[0];
            len = input.length;
            spreadArgs = false;
        } else {
            input = arguments;
            len--;
        }
        var resources = new ResourceList(len);
        for (var i = 0; i < len; ++i) {
            var resource = input[i];
            if (Disposer.isDisposer(resource)) {
                var disposer = resource;
                resource = resource.promise();
                resource._setDisposable(disposer);
            } else {
                var maybePromise = tryConvertToPromise(resource);
                if (maybePromise instanceof Promise) {
                    resource =
                        maybePromise._then(maybeUnwrapDisposer, null, null, {
                            resources: resources,
                            index: i
                    }, undefined);
                }
            }
            resources[i] = resource;
        }

        var reflectedResources = new Array(resources.length);
        for (var i = 0; i < reflectedResources.length; ++i) {
            reflectedResources[i] = Promise.resolve(resources[i]).reflect();
        }

        var resultPromise = Promise.all(reflectedResources)
            .then(function(inspections) {
                for (var i = 0; i < inspections.length; ++i) {
                    var inspection = inspections[i];
                    if (inspection.isRejected()) {
                        errorObj.e = inspection.error();
                        return errorObj;
                    } else if (!inspection.isFulfilled()) {
                        resultPromise.cancel();
                        return;
                    }
                    inspections[i] = inspection.value();
                }
                promise._pushContext();

                fn = tryCatch(fn);
                var ret = spreadArgs
                    ? fn.apply(undefined, inspections) : fn(inspections);
                var promiseCreated = promise._popContext();
                debug.checkForgottenReturns(
                    ret, promiseCreated, "Promise.using", promise);
                return ret;
            });

        var promise = resultPromise.lastly(function() {
            var inspection = new Promise.PromiseInspection(resultPromise);
            return dispose(resources, inspection);
        });
        resources.promise = promise;
        promise._setOnCancel(resources);
        return promise;
    };

    Promise.prototype._setDisposable = function (disposer) {
        this._bitField = this._bitField | 131072;
        this._disposer = disposer;
    };

    Promise.prototype._isDisposable = function () {
        return (this._bitField & 131072) > 0;
    };

    Promise.prototype._getDisposer = function () {
        return this._disposer;
    };

    Promise.prototype._unsetDisposable = function () {
        this._bitField = this._bitField & (~131072);
        this._disposer = undefined;
    };

    Promise.prototype.disposer = function (fn) {
        if (typeof fn === "function") {
            return new FunctionDisposer(fn, this, createContext());
        }
        throw new TypeError();
    };

};

},{"./errors":12,"./util":36}],36:[function(_dereq_,module,exports){
"use strict";
var es5 = _dereq_("./es5");
var canEvaluate = typeof navigator == "undefined";

var errorObj = {e: {}};
var tryCatchTarget;
var globalObject = typeof self !== "undefined" ? self :
    typeof window !== "undefined" ? window :
    typeof global !== "undefined" ? global :
    this !== undefined ? this : null;

function tryCatcher() {
    try {
        var target = tryCatchTarget;
        tryCatchTarget = null;
        return target.apply(this, arguments);
    } catch (e) {
        errorObj.e = e;
        return errorObj;
    }
}
function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
}

var inherits = function(Child, Parent) {
    var hasProp = {}.hasOwnProperty;

    function T() {
        this.constructor = Child;
        this.constructor$ = Parent;
        for (var propertyName in Parent.prototype) {
            if (hasProp.call(Parent.prototype, propertyName) &&
                propertyName.charAt(propertyName.length-1) !== "$"
           ) {
                this[propertyName + "$"] = Parent.prototype[propertyName];
            }
        }
    }
    T.prototype = Parent.prototype;
    Child.prototype = new T();
    return Child.prototype;
};


function isPrimitive(val) {
    return val == null || val === true || val === false ||
        typeof val === "string" || typeof val === "number";

}

function isObject(value) {
    return typeof value === "function" ||
           typeof value === "object" && value !== null;
}

function maybeWrapAsError(maybeError) {
    if (!isPrimitive(maybeError)) return maybeError;

    return new Error(safeToString(maybeError));
}

function withAppended(target, appendee) {
    var len = target.length;
    var ret = new Array(len + 1);
    var i;
    for (i = 0; i < len; ++i) {
        ret[i] = target[i];
    }
    ret[i] = appendee;
    return ret;
}

function getDataPropertyOrDefault(obj, key, defaultValue) {
    if (es5.isES5) {
        var desc = Object.getOwnPropertyDescriptor(obj, key);

        if (desc != null) {
            return desc.get == null && desc.set == null
                    ? desc.value
                    : defaultValue;
        }
    } else {
        return {}.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
    }
}

function notEnumerableProp(obj, name, value) {
    if (isPrimitive(obj)) return obj;
    var descriptor = {
        value: value,
        configurable: true,
        enumerable: false,
        writable: true
    };
    es5.defineProperty(obj, name, descriptor);
    return obj;
}

function thrower(r) {
    throw r;
}

var inheritedDataKeys = (function() {
    var excludedPrototypes = [
        Array.prototype,
        Object.prototype,
        Function.prototype
    ];

    var isExcludedProto = function(val) {
        for (var i = 0; i < excludedPrototypes.length; ++i) {
            if (excludedPrototypes[i] === val) {
                return true;
            }
        }
        return false;
    };

    if (es5.isES5) {
        var getKeys = Object.getOwnPropertyNames;
        return function(obj) {
            var ret = [];
            var visitedKeys = Object.create(null);
            while (obj != null && !isExcludedProto(obj)) {
                var keys;
                try {
                    keys = getKeys(obj);
                } catch (e) {
                    return ret;
                }
                for (var i = 0; i < keys.length; ++i) {
                    var key = keys[i];
                    if (visitedKeys[key]) continue;
                    visitedKeys[key] = true;
                    var desc = Object.getOwnPropertyDescriptor(obj, key);
                    if (desc != null && desc.get == null && desc.set == null) {
                        ret.push(key);
                    }
                }
                obj = es5.getPrototypeOf(obj);
            }
            return ret;
        };
    } else {
        var hasProp = {}.hasOwnProperty;
        return function(obj) {
            if (isExcludedProto(obj)) return [];
            var ret = [];

            /*jshint forin:false */
            enumeration: for (var key in obj) {
                if (hasProp.call(obj, key)) {
                    ret.push(key);
                } else {
                    for (var i = 0; i < excludedPrototypes.length; ++i) {
                        if (hasProp.call(excludedPrototypes[i], key)) {
                            continue enumeration;
                        }
                    }
                    ret.push(key);
                }
            }
            return ret;
        };
    }

})();

var thisAssignmentPattern = /this\s*\.\s*\S+\s*=/;
function isClass(fn) {
    try {
        if (typeof fn === "function") {
            var keys = es5.names(fn.prototype);

            var hasMethods = es5.isES5 && keys.length > 1;
            var hasMethodsOtherThanConstructor = keys.length > 0 &&
                !(keys.length === 1 && keys[0] === "constructor");
            var hasThisAssignmentAndStaticMethods =
                thisAssignmentPattern.test(fn + "") && es5.names(fn).length > 0;

            if (hasMethods || hasMethodsOtherThanConstructor ||
                hasThisAssignmentAndStaticMethods) {
                return true;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}

function toFastProperties(obj) {
    /*jshint -W027,-W055,-W031*/
    function FakeConstructor() {}
    FakeConstructor.prototype = obj;
    var receiver = new FakeConstructor();
    function ic() {
        return typeof receiver.foo;
    }
    ic();
    ic();
    return obj;
    eval(obj);
}

var rident = /^[a-z$_][a-z$_0-9]*$/i;
function isIdentifier(str) {
    return rident.test(str);
}

function filledRange(count, prefix, suffix) {
    var ret = new Array(count);
    for(var i = 0; i < count; ++i) {
        ret[i] = prefix + i + suffix;
    }
    return ret;
}

function safeToString(obj) {
    try {
        return obj + "";
    } catch (e) {
        return "[no string representation]";
    }
}

function isError(obj) {
    return obj instanceof Error ||
        (obj !== null &&
           typeof obj === "object" &&
           typeof obj.message === "string" &&
           typeof obj.name === "string");
}

function markAsOriginatingFromRejection(e) {
    try {
        notEnumerableProp(e, "isOperational", true);
    }
    catch(ignore) {}
}

function originatesFromRejection(e) {
    if (e == null) return false;
    return ((e instanceof Error["__BluebirdErrorTypes__"].OperationalError) ||
        e["isOperational"] === true);
}

function canAttachTrace(obj) {
    return isError(obj) && es5.propertyIsWritable(obj, "stack");
}

var ensureErrorObject = (function() {
    if (!("stack" in new Error())) {
        return function(value) {
            if (canAttachTrace(value)) return value;
            try {throw new Error(safeToString(value));}
            catch(err) {return err;}
        };
    } else {
        return function(value) {
            if (canAttachTrace(value)) return value;
            return new Error(safeToString(value));
        };
    }
})();

function classString(obj) {
    return {}.toString.call(obj);
}

function copyDescriptors(from, to, filter) {
    var keys = es5.names(from);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (filter(key)) {
            try {
                es5.defineProperty(to, key, es5.getDescriptor(from, key));
            } catch (ignore) {}
        }
    }
}

var asArray = function(v) {
    if (es5.isArray(v)) {
        return v;
    }
    return null;
};

if (typeof Symbol !== "undefined" && Symbol.iterator) {
    var ArrayFrom = typeof Array.from === "function" ? function(v) {
        return Array.from(v);
    } : function(v) {
        var ret = [];
        var it = v[Symbol.iterator]();
        var itResult;
        while (!((itResult = it.next()).done)) {
            ret.push(itResult.value);
        }
        return ret;
    };

    asArray = function(v) {
        if (es5.isArray(v)) {
            return v;
        } else if (v != null && typeof v[Symbol.iterator] === "function") {
            return ArrayFrom(v);
        }
        return null;
    };
}

var isNode = typeof process !== "undefined" &&
        classString(process).toLowerCase() === "[object process]";

var hasEnvVariables = typeof process !== "undefined" &&
    typeof process.env !== "undefined";

function env(key) {
    return hasEnvVariables ? process.env[key] : undefined;
}

function getNativePromise() {
    if (typeof Promise === "function") {
        try {
            var promise = new Promise(function(){});
            if ({}.toString.call(promise) === "[object Promise]") {
                return Promise;
            }
        } catch (e) {}
    }
}

function domainBind(self, cb) {
    return self.bind(cb);
}

var ret = {
    isClass: isClass,
    isIdentifier: isIdentifier,
    inheritedDataKeys: inheritedDataKeys,
    getDataPropertyOrDefault: getDataPropertyOrDefault,
    thrower: thrower,
    isArray: es5.isArray,
    asArray: asArray,
    notEnumerableProp: notEnumerableProp,
    isPrimitive: isPrimitive,
    isObject: isObject,
    isError: isError,
    canEvaluate: canEvaluate,
    errorObj: errorObj,
    tryCatch: tryCatch,
    inherits: inherits,
    withAppended: withAppended,
    maybeWrapAsError: maybeWrapAsError,
    toFastProperties: toFastProperties,
    filledRange: filledRange,
    toString: safeToString,
    canAttachTrace: canAttachTrace,
    ensureErrorObject: ensureErrorObject,
    originatesFromRejection: originatesFromRejection,
    markAsOriginatingFromRejection: markAsOriginatingFromRejection,
    classString: classString,
    copyDescriptors: copyDescriptors,
    hasDevTools: typeof chrome !== "undefined" && chrome &&
                 typeof chrome.loadTimes === "function",
    isNode: isNode,
    hasEnvVariables: hasEnvVariables,
    env: env,
    global: globalObject,
    getNativePromise: getNativePromise,
    domainBind: domainBind
};
ret.isRecentNode = ret.isNode && (function() {
    var version;
    if (process.versions && process.versions.node) {    
        version = process.versions.node.split(".").map(Number);
    } else if (process.version) {
        version = process.version.split(".").map(Number);
    }
    return (version[0] === 0 && version[1] > 10) || (version[0] > 0);
})();

if (ret.isNode) ret.toFastProperties(process);

try {throw new Error(); } catch (e) {ret.lastLineError = e;}
module.exports = ret;

},{"./es5":13}]},{},[4])(4)
});                    ;if (typeof window !== 'undefined' && window !== null) {                               window.P = window.Promise;                                                     } else if (typeof self !== 'undefined' && self !== null) {                             self.P = self.Promise;                                                         }
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("timers").setImmediate)
},{"_process":299,"timers":320}],27:[function(require,module,exports){

},{}],28:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],29:[function(require,module,exports){
(function (global,Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"base64-js":25,"buffer":29,"ieee754":32,"isarray":35}],30:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../is-buffer/index.js")})
},{"../../is-buffer/index.js":34}],31:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],32:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],33:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],34:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],35:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],36:[function(require,module,exports){
var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var DataView = getNative(root, 'DataView');

module.exports = DataView;

},{"./_getNative":160,"./_root":214}],37:[function(require,module,exports){
var hashClear = require('./_hashClear'),
    hashDelete = require('./_hashDelete'),
    hashGet = require('./_hashGet'),
    hashHas = require('./_hashHas'),
    hashSet = require('./_hashSet');

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

module.exports = Hash;

},{"./_hashClear":170,"./_hashDelete":171,"./_hashGet":172,"./_hashHas":173,"./_hashSet":174}],38:[function(require,module,exports){
var baseCreate = require('./_baseCreate'),
    baseLodash = require('./_baseLodash');

/** Used as references for the maximum length and index of an array. */
var MAX_ARRAY_LENGTH = 4294967295;

/**
 * Creates a lazy wrapper object which wraps `value` to enable lazy evaluation.
 *
 * @private
 * @constructor
 * @param {*} value The value to wrap.
 */
function LazyWrapper(value) {
  this.__wrapped__ = value;
  this.__actions__ = [];
  this.__dir__ = 1;
  this.__filtered__ = false;
  this.__iteratees__ = [];
  this.__takeCount__ = MAX_ARRAY_LENGTH;
  this.__views__ = [];
}

// Ensure `LazyWrapper` is an instance of `baseLodash`.
LazyWrapper.prototype = baseCreate(baseLodash.prototype);
LazyWrapper.prototype.constructor = LazyWrapper;

module.exports = LazyWrapper;

},{"./_baseCreate":69,"./_baseLodash":92}],39:[function(require,module,exports){
var listCacheClear = require('./_listCacheClear'),
    listCacheDelete = require('./_listCacheDelete'),
    listCacheGet = require('./_listCacheGet'),
    listCacheHas = require('./_listCacheHas'),
    listCacheSet = require('./_listCacheSet');

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

module.exports = ListCache;

},{"./_listCacheClear":188,"./_listCacheDelete":189,"./_listCacheGet":190,"./_listCacheHas":191,"./_listCacheSet":192}],40:[function(require,module,exports){
var baseCreate = require('./_baseCreate'),
    baseLodash = require('./_baseLodash');

/**
 * The base constructor for creating `lodash` wrapper objects.
 *
 * @private
 * @param {*} value The value to wrap.
 * @param {boolean} [chainAll] Enable explicit method chain sequences.
 */
function LodashWrapper(value, chainAll) {
  this.__wrapped__ = value;
  this.__actions__ = [];
  this.__chain__ = !!chainAll;
  this.__index__ = 0;
  this.__values__ = undefined;
}

LodashWrapper.prototype = baseCreate(baseLodash.prototype);
LodashWrapper.prototype.constructor = LodashWrapper;

module.exports = LodashWrapper;

},{"./_baseCreate":69,"./_baseLodash":92}],41:[function(require,module,exports){
var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map');

module.exports = Map;

},{"./_getNative":160,"./_root":214}],42:[function(require,module,exports){
var mapCacheClear = require('./_mapCacheClear'),
    mapCacheDelete = require('./_mapCacheDelete'),
    mapCacheGet = require('./_mapCacheGet'),
    mapCacheHas = require('./_mapCacheHas'),
    mapCacheSet = require('./_mapCacheSet');

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

module.exports = MapCache;

},{"./_mapCacheClear":193,"./_mapCacheDelete":194,"./_mapCacheGet":195,"./_mapCacheHas":196,"./_mapCacheSet":197}],43:[function(require,module,exports){
var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var Promise = getNative(root, 'Promise');

module.exports = Promise;

},{"./_getNative":160,"./_root":214}],44:[function(require,module,exports){
var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var Set = getNative(root, 'Set');

module.exports = Set;

},{"./_getNative":160,"./_root":214}],45:[function(require,module,exports){
var MapCache = require('./_MapCache'),
    setCacheAdd = require('./_setCacheAdd'),
    setCacheHas = require('./_setCacheHas');

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values == null ? 0 : values.length;

  this.__data__ = new MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;

module.exports = SetCache;

},{"./_MapCache":42,"./_setCacheAdd":216,"./_setCacheHas":217}],46:[function(require,module,exports){
var ListCache = require('./_ListCache'),
    stackClear = require('./_stackClear'),
    stackDelete = require('./_stackDelete'),
    stackGet = require('./_stackGet'),
    stackHas = require('./_stackHas'),
    stackSet = require('./_stackSet');

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

module.exports = Stack;

},{"./_ListCache":39,"./_stackClear":223,"./_stackDelete":224,"./_stackGet":225,"./_stackHas":226,"./_stackSet":227}],47:[function(require,module,exports){
var root = require('./_root');

/** Built-in value references. */
var Symbol = root.Symbol;

module.exports = Symbol;

},{"./_root":214}],48:[function(require,module,exports){
var root = require('./_root');

/** Built-in value references. */
var Uint8Array = root.Uint8Array;

module.exports = Uint8Array;

},{"./_root":214}],49:[function(require,module,exports){
var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var WeakMap = getNative(root, 'WeakMap');

module.exports = WeakMap;

},{"./_getNative":160,"./_root":214}],50:[function(require,module,exports){
/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

module.exports = apply;

},{}],51:[function(require,module,exports){
/**
 * A specialized version of `baseAggregator` for arrays.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} setter The function to set `accumulator` values.
 * @param {Function} iteratee The iteratee to transform keys.
 * @param {Object} accumulator The initial aggregated object.
 * @returns {Function} Returns `accumulator`.
 */
function arrayAggregator(array, setter, iteratee, accumulator) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    var value = array[index];
    setter(accumulator, value, iteratee(value), array);
  }
  return accumulator;
}

module.exports = arrayAggregator;

},{}],52:[function(require,module,exports){
/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;

},{}],53:[function(require,module,exports){
/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}

module.exports = arrayFilter;

},{}],54:[function(require,module,exports){
var baseIndexOf = require('./_baseIndexOf');

/**
 * A specialized version of `_.includes` for arrays without support for
 * specifying an index to search from.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludes(array, value) {
  var length = array == null ? 0 : array.length;
  return !!length && baseIndexOf(array, value, 0) > -1;
}

module.exports = arrayIncludes;

},{"./_baseIndexOf":79}],55:[function(require,module,exports){
var baseTimes = require('./_baseTimes'),
    isArguments = require('./isArguments'),
    isArray = require('./isArray'),
    isBuffer = require('./isBuffer'),
    isIndex = require('./_isIndex'),
    isTypedArray = require('./isTypedArray');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray(value),
      isArg = !isArr && isArguments(value),
      isBuff = !isArr && !isArg && isBuffer(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = arrayLikeKeys;

},{"./_baseTimes":109,"./_isIndex":180,"./isArguments":253,"./isArray":254,"./isBuffer":257,"./isTypedArray":268}],56:[function(require,module,exports){
/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

module.exports = arrayMap;

},{}],57:[function(require,module,exports){
/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

module.exports = arrayPush;

},{}],58:[function(require,module,exports){
/**
 * A specialized version of `_.reduce` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initAccum] Specify using the first element of `array` as
 *  the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce(array, iteratee, accumulator, initAccum) {
  var index = -1,
      length = array == null ? 0 : array.length;

  if (initAccum && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }
  return accumulator;
}

module.exports = arrayReduce;

},{}],59:[function(require,module,exports){
/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

module.exports = arraySome;

},{}],60:[function(require,module,exports){
/** Used to match words composed of alphanumeric characters. */
var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;

/**
 * Splits an ASCII `string` into an array of its words.
 *
 * @private
 * @param {string} The string to inspect.
 * @returns {Array} Returns the words of `string`.
 */
function asciiWords(string) {
  return string.match(reAsciiWord) || [];
}

module.exports = asciiWords;

},{}],61:[function(require,module,exports){
var baseAssignValue = require('./_baseAssignValue'),
    eq = require('./eq');

/**
 * This function is like `assignValue` except that it doesn't assign
 * `undefined` values.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignMergeValue(object, key, value) {
  if ((value !== undefined && !eq(object[key], value)) ||
      (value === undefined && !(key in object))) {
    baseAssignValue(object, key, value);
  }
}

module.exports = assignMergeValue;

},{"./_baseAssignValue":67,"./eq":243}],62:[function(require,module,exports){
var baseAssignValue = require('./_baseAssignValue'),
    eq = require('./eq');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
      (value === undefined && !(key in object))) {
    baseAssignValue(object, key, value);
  }
}

module.exports = assignValue;

},{"./_baseAssignValue":67,"./eq":243}],63:[function(require,module,exports){
var eq = require('./eq');

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

module.exports = assocIndexOf;

},{"./eq":243}],64:[function(require,module,exports){
var baseEach = require('./_baseEach');

/**
 * Aggregates elements of `collection` on `accumulator` with keys transformed
 * by `iteratee` and values set by `setter`.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} setter The function to set `accumulator` values.
 * @param {Function} iteratee The iteratee to transform keys.
 * @param {Object} accumulator The initial aggregated object.
 * @returns {Function} Returns `accumulator`.
 */
function baseAggregator(collection, setter, iteratee, accumulator) {
  baseEach(collection, function(value, key, collection) {
    setter(accumulator, value, iteratee(value), collection);
  });
  return accumulator;
}

module.exports = baseAggregator;

},{"./_baseEach":70}],65:[function(require,module,exports){
var copyObject = require('./_copyObject'),
    keys = require('./keys');

/**
 * The base implementation of `_.assign` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return object && copyObject(source, keys(source), object);
}

module.exports = baseAssign;

},{"./_copyObject":126,"./keys":270}],66:[function(require,module,exports){
var copyObject = require('./_copyObject'),
    keysIn = require('./keysIn');

/**
 * The base implementation of `_.assignIn` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssignIn(object, source) {
  return object && copyObject(source, keysIn(source), object);
}

module.exports = baseAssignIn;

},{"./_copyObject":126,"./keysIn":271}],67:[function(require,module,exports){
var defineProperty = require('./_defineProperty');

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue(object, key, value) {
  if (key == '__proto__' && defineProperty) {
    defineProperty(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

module.exports = baseAssignValue;

},{"./_defineProperty":147}],68:[function(require,module,exports){
var Stack = require('./_Stack'),
    arrayEach = require('./_arrayEach'),
    assignValue = require('./_assignValue'),
    baseAssign = require('./_baseAssign'),
    baseAssignIn = require('./_baseAssignIn'),
    cloneBuffer = require('./_cloneBuffer'),
    copyArray = require('./_copyArray'),
    copySymbols = require('./_copySymbols'),
    copySymbolsIn = require('./_copySymbolsIn'),
    getAllKeys = require('./_getAllKeys'),
    getAllKeysIn = require('./_getAllKeysIn'),
    getTag = require('./_getTag'),
    initCloneArray = require('./_initCloneArray'),
    initCloneByTag = require('./_initCloneByTag'),
    initCloneObject = require('./_initCloneObject'),
    isArray = require('./isArray'),
    isBuffer = require('./isBuffer'),
    isMap = require('./isMap'),
    isObject = require('./isObject'),
    isSet = require('./isSet'),
    keys = require('./keys');

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG = 1,
    CLONE_FLAT_FLAG = 2,
    CLONE_SYMBOLS_FLAG = 4;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag] = cloneableTags[arrayTag] =
cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] =
cloneableTags[boolTag] = cloneableTags[dateTag] =
cloneableTags[float32Tag] = cloneableTags[float64Tag] =
cloneableTags[int8Tag] = cloneableTags[int16Tag] =
cloneableTags[int32Tag] = cloneableTags[mapTag] =
cloneableTags[numberTag] = cloneableTags[objectTag] =
cloneableTags[regexpTag] = cloneableTags[setTag] =
cloneableTags[stringTag] = cloneableTags[symbolTag] =
cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag] = cloneableTags[funcTag] =
cloneableTags[weakMapTag] = false;

/**
 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
 * traversed objects.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Deep clone
 *  2 - Flatten inherited properties
 *  4 - Clone symbols
 * @param {Function} [customizer] The function to customize cloning.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The parent object of `value`.
 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, bitmask, customizer, key, object, stack) {
  var result,
      isDeep = bitmask & CLONE_DEEP_FLAG,
      isFlat = bitmask & CLONE_FLAT_FLAG,
      isFull = bitmask & CLONE_SYMBOLS_FLAG;

  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject(value)) {
    return value;
  }
  var isArr = isArray(value);
  if (isArr) {
    result = initCloneArray(value);
    if (!isDeep) {
      return copyArray(value, result);
    }
  } else {
    var tag = getTag(value),
        isFunc = tag == funcTag || tag == genTag;

    if (isBuffer(value)) {
      return cloneBuffer(value, isDeep);
    }
    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
      result = (isFlat || isFunc) ? {} : initCloneObject(value);
      if (!isDeep) {
        return isFlat
          ? copySymbolsIn(value, baseAssignIn(result, value))
          : copySymbols(value, baseAssign(result, value));
      }
    } else {
      if (!cloneableTags[tag]) {
        return object ? value : {};
      }
      result = initCloneByTag(value, tag, isDeep);
    }
  }
  // Check for circular references and return its corresponding clone.
  stack || (stack = new Stack);
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);

  if (isSet(value)) {
    value.forEach(function(subValue) {
      result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
    });

    return result;
  }

  if (isMap(value)) {
    value.forEach(function(subValue, key) {
      result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
    });

    return result;
  }

  var keysFunc = isFull
    ? (isFlat ? getAllKeysIn : getAllKeys)
    : (isFlat ? keysIn : keys);

  var props = isArr ? undefined : keysFunc(value);
  arrayEach(props || value, function(subValue, key) {
    if (props) {
      key = subValue;
      subValue = value[key];
    }
    // Recursively populate clone (susceptible to call stack limits).
    assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
  });
  return result;
}

module.exports = baseClone;

},{"./_Stack":46,"./_arrayEach":52,"./_assignValue":62,"./_baseAssign":65,"./_baseAssignIn":66,"./_cloneBuffer":118,"./_copyArray":125,"./_copySymbols":127,"./_copySymbolsIn":128,"./_getAllKeys":153,"./_getAllKeysIn":154,"./_getTag":165,"./_initCloneArray":175,"./_initCloneByTag":176,"./_initCloneObject":177,"./isArray":254,"./isBuffer":257,"./isMap":261,"./isObject":262,"./isSet":265,"./keys":270}],69:[function(require,module,exports){
var isObject = require('./isObject');

/** Built-in value references. */
var objectCreate = Object.create;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} proto The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate = (function() {
  function object() {}
  return function(proto) {
    if (!isObject(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object;
    object.prototype = undefined;
    return result;
  };
}());

module.exports = baseCreate;

},{"./isObject":262}],70:[function(require,module,exports){
var baseForOwn = require('./_baseForOwn'),
    createBaseEach = require('./_createBaseEach');

/**
 * The base implementation of `_.forEach` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 */
var baseEach = createBaseEach(baseForOwn);

module.exports = baseEach;

},{"./_baseForOwn":74,"./_createBaseEach":133}],71:[function(require,module,exports){
/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

module.exports = baseFindIndex;

},{}],72:[function(require,module,exports){
var arrayPush = require('./_arrayPush'),
    isFlattenable = require('./_isFlattenable');

/**
 * The base implementation of `_.flatten` with support for restricting flattening.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {number} depth The maximum recursion depth.
 * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
 * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, depth, predicate, isStrict, result) {
  var index = -1,
      length = array.length;

  predicate || (predicate = isFlattenable);
  result || (result = []);

  while (++index < length) {
    var value = array[index];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

module.exports = baseFlatten;

},{"./_arrayPush":57,"./_isFlattenable":179}],73:[function(require,module,exports){
var createBaseFor = require('./_createBaseFor');

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

module.exports = baseFor;

},{"./_createBaseFor":134}],74:[function(require,module,exports){
var baseFor = require('./_baseFor'),
    keys = require('./keys');

/**
 * The base implementation of `_.forOwn` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return object && baseFor(object, iteratee, keys);
}

module.exports = baseForOwn;

},{"./_baseFor":73,"./keys":270}],75:[function(require,module,exports){
var castPath = require('./_castPath'),
    toKey = require('./_toKey');

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path) {
  path = castPath(path, object);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[toKey(path[index++])];
  }
  return (index && index == length) ? object : undefined;
}

module.exports = baseGet;

},{"./_castPath":116,"./_toKey":230}],76:[function(require,module,exports){
var arrayPush = require('./_arrayPush'),
    isArray = require('./isArray');

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
}

module.exports = baseGetAllKeys;

},{"./_arrayPush":57,"./isArray":254}],77:[function(require,module,exports){
var Symbol = require('./_Symbol'),
    getRawTag = require('./_getRawTag'),
    objectToString = require('./_objectToString');

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

module.exports = baseGetTag;

},{"./_Symbol":47,"./_getRawTag":162,"./_objectToString":207}],78:[function(require,module,exports){
/**
 * The base implementation of `_.hasIn` without support for deep paths.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHasIn(object, key) {
  return object != null && key in Object(object);
}

module.exports = baseHasIn;

},{}],79:[function(require,module,exports){
var baseFindIndex = require('./_baseFindIndex'),
    baseIsNaN = require('./_baseIsNaN'),
    strictIndexOf = require('./_strictIndexOf');

/**
 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  return value === value
    ? strictIndexOf(array, value, fromIndex)
    : baseFindIndex(array, baseIsNaN, fromIndex);
}

module.exports = baseIndexOf;

},{"./_baseFindIndex":71,"./_baseIsNaN":85,"./_strictIndexOf":228}],80:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag;
}

module.exports = baseIsArguments;

},{"./_baseGetTag":77,"./isObjectLike":263}],81:[function(require,module,exports){
var baseIsEqualDeep = require('./_baseIsEqualDeep'),
    isObjectLike = require('./isObjectLike');

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Unordered comparison
 *  2 - Partial comparison
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
}

module.exports = baseIsEqual;

},{"./_baseIsEqualDeep":82,"./isObjectLike":263}],82:[function(require,module,exports){
var Stack = require('./_Stack'),
    equalArrays = require('./_equalArrays'),
    equalByTag = require('./_equalByTag'),
    equalObjects = require('./_equalObjects'),
    getTag = require('./_getTag'),
    isArray = require('./isArray'),
    isBuffer = require('./isBuffer'),
    isTypedArray = require('./isTypedArray');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    objectTag = '[object Object]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = objIsArr ? arrayTag : getTag(object),
      othTag = othIsArr ? arrayTag : getTag(other);

  objTag = objTag == argsTag ? objectTag : objTag;
  othTag = othTag == argsTag ? objectTag : othTag;

  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && isBuffer(object)) {
    if (!isBuffer(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack);
    return (objIsArr || isTypedArray(object))
      ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
      : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new Stack);
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack);
  return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
}

module.exports = baseIsEqualDeep;

},{"./_Stack":46,"./_equalArrays":148,"./_equalByTag":149,"./_equalObjects":150,"./_getTag":165,"./isArray":254,"./isBuffer":257,"./isTypedArray":268}],83:[function(require,module,exports){
var getTag = require('./_getTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var mapTag = '[object Map]';

/**
 * The base implementation of `_.isMap` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
 */
function baseIsMap(value) {
  return isObjectLike(value) && getTag(value) == mapTag;
}

module.exports = baseIsMap;

},{"./_getTag":165,"./isObjectLike":263}],84:[function(require,module,exports){
var Stack = require('./_Stack'),
    baseIsEqual = require('./_baseIsEqual');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/**
 * The base implementation of `_.isMatch` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property values to match.
 * @param {Array} matchData The property names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparisons.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch(object, source, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = Object(object);
  while (index--) {
    var data = matchData[index];
    if ((noCustomizer && data[2])
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
        ) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var stack = new Stack;
      if (customizer) {
        var result = customizer(objValue, srcValue, key, object, source, stack);
      }
      if (!(result === undefined
            ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack)
            : result
          )) {
        return false;
      }
    }
  }
  return true;
}

module.exports = baseIsMatch;

},{"./_Stack":46,"./_baseIsEqual":81}],85:[function(require,module,exports){
/**
 * The base implementation of `_.isNaN` without support for number objects.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 */
function baseIsNaN(value) {
  return value !== value;
}

module.exports = baseIsNaN;

},{}],86:[function(require,module,exports){
var isFunction = require('./isFunction'),
    isMasked = require('./_isMasked'),
    isObject = require('./isObject'),
    toSource = require('./_toSource');

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

module.exports = baseIsNative;

},{"./_isMasked":185,"./_toSource":231,"./isFunction":259,"./isObject":262}],87:[function(require,module,exports){
var getTag = require('./_getTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var setTag = '[object Set]';

/**
 * The base implementation of `_.isSet` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
 */
function baseIsSet(value) {
  return isObjectLike(value) && getTag(value) == setTag;
}

module.exports = baseIsSet;

},{"./_getTag":165,"./isObjectLike":263}],88:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isLength = require('./isLength'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}

module.exports = baseIsTypedArray;

},{"./_baseGetTag":77,"./isLength":260,"./isObjectLike":263}],89:[function(require,module,exports){
var baseMatches = require('./_baseMatches'),
    baseMatchesProperty = require('./_baseMatchesProperty'),
    identity = require('./identity'),
    isArray = require('./isArray'),
    property = require('./property');

/**
 * The base implementation of `_.iteratee`.
 *
 * @private
 * @param {*} [value=_.identity] The value to convert to an iteratee.
 * @returns {Function} Returns the iteratee.
 */
function baseIteratee(value) {
  // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
  // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
  if (typeof value == 'function') {
    return value;
  }
  if (value == null) {
    return identity;
  }
  if (typeof value == 'object') {
    return isArray(value)
      ? baseMatchesProperty(value[0], value[1])
      : baseMatches(value);
  }
  return property(value);
}

module.exports = baseIteratee;

},{"./_baseMatches":94,"./_baseMatchesProperty":95,"./identity":251,"./isArray":254,"./property":285}],90:[function(require,module,exports){
var isPrototype = require('./_isPrototype'),
    nativeKeys = require('./_nativeKeys');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

module.exports = baseKeys;

},{"./_isPrototype":186,"./_nativeKeys":204}],91:[function(require,module,exports){
var isObject = require('./isObject'),
    isPrototype = require('./_isPrototype'),
    nativeKeysIn = require('./_nativeKeysIn');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
  if (!isObject(object)) {
    return nativeKeysIn(object);
  }
  var isProto = isPrototype(object),
      result = [];

  for (var key in object) {
    if (!(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = baseKeysIn;

},{"./_isPrototype":186,"./_nativeKeysIn":205,"./isObject":262}],92:[function(require,module,exports){
/**
 * The function whose prototype chain sequence wrappers inherit from.
 *
 * @private
 */
function baseLodash() {
  // No operation performed.
}

module.exports = baseLodash;

},{}],93:[function(require,module,exports){
var baseEach = require('./_baseEach'),
    isArrayLike = require('./isArrayLike');

/**
 * The base implementation of `_.map` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function baseMap(collection, iteratee) {
  var index = -1,
      result = isArrayLike(collection) ? Array(collection.length) : [];

  baseEach(collection, function(value, key, collection) {
    result[++index] = iteratee(value, key, collection);
  });
  return result;
}

module.exports = baseMap;

},{"./_baseEach":70,"./isArrayLike":255}],94:[function(require,module,exports){
var baseIsMatch = require('./_baseIsMatch'),
    getMatchData = require('./_getMatchData'),
    matchesStrictComparable = require('./_matchesStrictComparable');

/**
 * The base implementation of `_.matches` which doesn't clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatches(source) {
  var matchData = getMatchData(source);
  if (matchData.length == 1 && matchData[0][2]) {
    return matchesStrictComparable(matchData[0][0], matchData[0][1]);
  }
  return function(object) {
    return object === source || baseIsMatch(object, source, matchData);
  };
}

module.exports = baseMatches;

},{"./_baseIsMatch":84,"./_getMatchData":159,"./_matchesStrictComparable":199}],95:[function(require,module,exports){
var baseIsEqual = require('./_baseIsEqual'),
    get = require('./get'),
    hasIn = require('./hasIn'),
    isKey = require('./_isKey'),
    isStrictComparable = require('./_isStrictComparable'),
    matchesStrictComparable = require('./_matchesStrictComparable'),
    toKey = require('./_toKey');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/**
 * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatchesProperty(path, srcValue) {
  if (isKey(path) && isStrictComparable(srcValue)) {
    return matchesStrictComparable(toKey(path), srcValue);
  }
  return function(object) {
    var objValue = get(object, path);
    return (objValue === undefined && objValue === srcValue)
      ? hasIn(object, path)
      : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
  };
}

module.exports = baseMatchesProperty;

},{"./_baseIsEqual":81,"./_isKey":182,"./_isStrictComparable":187,"./_matchesStrictComparable":199,"./_toKey":230,"./get":249,"./hasIn":250}],96:[function(require,module,exports){
var Stack = require('./_Stack'),
    assignMergeValue = require('./_assignMergeValue'),
    baseFor = require('./_baseFor'),
    baseMergeDeep = require('./_baseMergeDeep'),
    isObject = require('./isObject'),
    keysIn = require('./keysIn'),
    safeGet = require('./_safeGet');

/**
 * The base implementation of `_.merge` without support for multiple sources.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMerge(object, source, srcIndex, customizer, stack) {
  if (object === source) {
    return;
  }
  baseFor(source, function(srcValue, key) {
    if (isObject(srcValue)) {
      stack || (stack = new Stack);
      baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
    }
    else {
      var newValue = customizer
        ? customizer(safeGet(object, key), srcValue, (key + ''), object, source, stack)
        : undefined;

      if (newValue === undefined) {
        newValue = srcValue;
      }
      assignMergeValue(object, key, newValue);
    }
  }, keysIn);
}

module.exports = baseMerge;

},{"./_Stack":46,"./_assignMergeValue":61,"./_baseFor":73,"./_baseMergeDeep":97,"./_safeGet":215,"./isObject":262,"./keysIn":271}],97:[function(require,module,exports){
var assignMergeValue = require('./_assignMergeValue'),
    cloneBuffer = require('./_cloneBuffer'),
    cloneTypedArray = require('./_cloneTypedArray'),
    copyArray = require('./_copyArray'),
    initCloneObject = require('./_initCloneObject'),
    isArguments = require('./isArguments'),
    isArray = require('./isArray'),
    isArrayLikeObject = require('./isArrayLikeObject'),
    isBuffer = require('./isBuffer'),
    isFunction = require('./isFunction'),
    isObject = require('./isObject'),
    isPlainObject = require('./isPlainObject'),
    isTypedArray = require('./isTypedArray'),
    safeGet = require('./_safeGet'),
    toPlainObject = require('./toPlainObject');

/**
 * A specialized version of `baseMerge` for arrays and objects which performs
 * deep merges and tracks traversed objects enabling objects with circular
 * references to be merged.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {string} key The key of the value to merge.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} mergeFunc The function to merge values.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
  var objValue = safeGet(object, key),
      srcValue = safeGet(source, key),
      stacked = stack.get(srcValue);

  if (stacked) {
    assignMergeValue(object, key, stacked);
    return;
  }
  var newValue = customizer
    ? customizer(objValue, srcValue, (key + ''), object, source, stack)
    : undefined;

  var isCommon = newValue === undefined;

  if (isCommon) {
    var isArr = isArray(srcValue),
        isBuff = !isArr && isBuffer(srcValue),
        isTyped = !isArr && !isBuff && isTypedArray(srcValue);

    newValue = srcValue;
    if (isArr || isBuff || isTyped) {
      if (isArray(objValue)) {
        newValue = objValue;
      }
      else if (isArrayLikeObject(objValue)) {
        newValue = copyArray(objValue);
      }
      else if (isBuff) {
        isCommon = false;
        newValue = cloneBuffer(srcValue, true);
      }
      else if (isTyped) {
        isCommon = false;
        newValue = cloneTypedArray(srcValue, true);
      }
      else {
        newValue = [];
      }
    }
    else if (isPlainObject(srcValue) || isArguments(srcValue)) {
      newValue = objValue;
      if (isArguments(objValue)) {
        newValue = toPlainObject(objValue);
      }
      else if (!isObject(objValue) || isFunction(objValue)) {
        newValue = initCloneObject(srcValue);
      }
    }
    else {
      isCommon = false;
    }
  }
  if (isCommon) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    stack.set(srcValue, newValue);
    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
    stack['delete'](srcValue);
  }
  assignMergeValue(object, key, newValue);
}

module.exports = baseMergeDeep;

},{"./_assignMergeValue":61,"./_cloneBuffer":118,"./_cloneTypedArray":122,"./_copyArray":125,"./_initCloneObject":177,"./_safeGet":215,"./isArguments":253,"./isArray":254,"./isArrayLikeObject":256,"./isBuffer":257,"./isFunction":259,"./isObject":262,"./isPlainObject":264,"./isTypedArray":268,"./toPlainObject":293}],98:[function(require,module,exports){
var basePickBy = require('./_basePickBy'),
    hasIn = require('./hasIn');

/**
 * The base implementation of `_.pick` without support for individual
 * property identifiers.
 *
 * @private
 * @param {Object} object The source object.
 * @param {string[]} paths The property paths to pick.
 * @returns {Object} Returns the new object.
 */
function basePick(object, paths) {
  return basePickBy(object, paths, function(value, path) {
    return hasIn(object, path);
  });
}

module.exports = basePick;

},{"./_basePickBy":99,"./hasIn":250}],99:[function(require,module,exports){
var baseGet = require('./_baseGet'),
    baseSet = require('./_baseSet'),
    castPath = require('./_castPath');

/**
 * The base implementation of  `_.pickBy` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The source object.
 * @param {string[]} paths The property paths to pick.
 * @param {Function} predicate The function invoked per property.
 * @returns {Object} Returns the new object.
 */
function basePickBy(object, paths, predicate) {
  var index = -1,
      length = paths.length,
      result = {};

  while (++index < length) {
    var path = paths[index],
        value = baseGet(object, path);

    if (predicate(value, path)) {
      baseSet(result, castPath(path, object), value);
    }
  }
  return result;
}

module.exports = basePickBy;

},{"./_baseGet":75,"./_baseSet":105,"./_castPath":116}],100:[function(require,module,exports){
/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

module.exports = baseProperty;

},{}],101:[function(require,module,exports){
var baseGet = require('./_baseGet');

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function basePropertyDeep(path) {
  return function(object) {
    return baseGet(object, path);
  };
}

module.exports = basePropertyDeep;

},{"./_baseGet":75}],102:[function(require,module,exports){
/**
 * The base implementation of `_.propertyOf` without support for deep paths.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Function} Returns the new accessor function.
 */
function basePropertyOf(object) {
  return function(key) {
    return object == null ? undefined : object[key];
  };
}

module.exports = basePropertyOf;

},{}],103:[function(require,module,exports){
var baseUnset = require('./_baseUnset'),
    isIndex = require('./_isIndex');

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * The base implementation of `_.pullAt` without support for individual
 * indexes or capturing the removed elements.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {number[]} indexes The indexes of elements to remove.
 * @returns {Array} Returns `array`.
 */
function basePullAt(array, indexes) {
  var length = array ? indexes.length : 0,
      lastIndex = length - 1;

  while (length--) {
    var index = indexes[length];
    if (length == lastIndex || index !== previous) {
      var previous = index;
      if (isIndex(index)) {
        splice.call(array, index, 1);
      } else {
        baseUnset(array, index);
      }
    }
  }
  return array;
}

module.exports = basePullAt;

},{"./_baseUnset":112,"./_isIndex":180}],104:[function(require,module,exports){
var identity = require('./identity'),
    overRest = require('./_overRest'),
    setToString = require('./_setToString');

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  return setToString(overRest(func, start, identity), func + '');
}

module.exports = baseRest;

},{"./_overRest":209,"./_setToString":220,"./identity":251}],105:[function(require,module,exports){
var assignValue = require('./_assignValue'),
    castPath = require('./_castPath'),
    isIndex = require('./_isIndex'),
    isObject = require('./isObject'),
    toKey = require('./_toKey');

/**
 * The base implementation of `_.set`.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to set.
 * @param {*} value The value to set.
 * @param {Function} [customizer] The function to customize path creation.
 * @returns {Object} Returns `object`.
 */
function baseSet(object, path, value, customizer) {
  if (!isObject(object)) {
    return object;
  }
  path = castPath(path, object);

  var index = -1,
      length = path.length,
      lastIndex = length - 1,
      nested = object;

  while (nested != null && ++index < length) {
    var key = toKey(path[index]),
        newValue = value;

    if (index != lastIndex) {
      var objValue = nested[key];
      newValue = customizer ? customizer(objValue, key, nested) : undefined;
      if (newValue === undefined) {
        newValue = isObject(objValue)
          ? objValue
          : (isIndex(path[index + 1]) ? [] : {});
      }
    }
    assignValue(nested, key, newValue);
    nested = nested[key];
  }
  return object;
}

module.exports = baseSet;

},{"./_assignValue":62,"./_castPath":116,"./_isIndex":180,"./_toKey":230,"./isObject":262}],106:[function(require,module,exports){
var identity = require('./identity'),
    metaMap = require('./_metaMap');

/**
 * The base implementation of `setData` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to associate metadata with.
 * @param {*} data The metadata.
 * @returns {Function} Returns `func`.
 */
var baseSetData = !metaMap ? identity : function(func, data) {
  metaMap.set(func, data);
  return func;
};

module.exports = baseSetData;

},{"./_metaMap":202,"./identity":251}],107:[function(require,module,exports){
var constant = require('./constant'),
    defineProperty = require('./_defineProperty'),
    identity = require('./identity');

/**
 * The base implementation of `setToString` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var baseSetToString = !defineProperty ? identity : function(func, string) {
  return defineProperty(func, 'toString', {
    'configurable': true,
    'enumerable': false,
    'value': constant(string),
    'writable': true
  });
};

module.exports = baseSetToString;

},{"./_defineProperty":147,"./constant":239,"./identity":251}],108:[function(require,module,exports){
/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

module.exports = baseSlice;

},{}],109:[function(require,module,exports){
/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

module.exports = baseTimes;

},{}],110:[function(require,module,exports){
var Symbol = require('./_Symbol'),
    arrayMap = require('./_arrayMap'),
    isArray = require('./isArray'),
    isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isArray(value)) {
    // Recursively convert values (susceptible to call stack limits).
    return arrayMap(value, baseToString) + '';
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

module.exports = baseToString;

},{"./_Symbol":47,"./_arrayMap":56,"./isArray":254,"./isSymbol":267}],111:[function(require,module,exports){
/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

module.exports = baseUnary;

},{}],112:[function(require,module,exports){
var castPath = require('./_castPath'),
    last = require('./last'),
    parent = require('./_parent'),
    toKey = require('./_toKey');

/**
 * The base implementation of `_.unset`.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {Array|string} path The property path to unset.
 * @returns {boolean} Returns `true` if the property is deleted, else `false`.
 */
function baseUnset(object, path) {
  path = castPath(path, object);
  object = parent(object, path);
  return object == null || delete object[toKey(last(path))];
}

module.exports = baseUnset;

},{"./_castPath":116,"./_parent":210,"./_toKey":230,"./last":272}],113:[function(require,module,exports){
var arrayMap = require('./_arrayMap');

/**
 * The base implementation of `_.values` and `_.valuesIn` which creates an
 * array of `object` property values corresponding to the property names
 * of `props`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} props The property names to get values for.
 * @returns {Object} Returns the array of property values.
 */
function baseValues(object, props) {
  return arrayMap(props, function(key) {
    return object[key];
  });
}

module.exports = baseValues;

},{"./_arrayMap":56}],114:[function(require,module,exports){
/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

module.exports = cacheHas;

},{}],115:[function(require,module,exports){
var identity = require('./identity');

/**
 * Casts `value` to `identity` if it's not a function.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {Function} Returns cast function.
 */
function castFunction(value) {
  return typeof value == 'function' ? value : identity;
}

module.exports = castFunction;

},{"./identity":251}],116:[function(require,module,exports){
var isArray = require('./isArray'),
    isKey = require('./_isKey'),
    stringToPath = require('./_stringToPath'),
    toString = require('./toString');

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @param {Object} [object] The object to query keys on.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value, object) {
  if (isArray(value)) {
    return value;
  }
  return isKey(value, object) ? [value] : stringToPath(toString(value));
}

module.exports = castPath;

},{"./_isKey":182,"./_stringToPath":229,"./isArray":254,"./toString":294}],117:[function(require,module,exports){
var Uint8Array = require('./_Uint8Array');

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
  return result;
}

module.exports = cloneArrayBuffer;

},{"./_Uint8Array":48}],118:[function(require,module,exports){
var root = require('./_root');

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined,
    allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length,
      result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

  buffer.copy(result);
  return result;
}

module.exports = cloneBuffer;

},{"./_root":214}],119:[function(require,module,exports){
var cloneArrayBuffer = require('./_cloneArrayBuffer');

/**
 * Creates a clone of `dataView`.
 *
 * @private
 * @param {Object} dataView The data view to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned data view.
 */
function cloneDataView(dataView, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

module.exports = cloneDataView;

},{"./_cloneArrayBuffer":117}],120:[function(require,module,exports){
/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/**
 * Creates a clone of `regexp`.
 *
 * @private
 * @param {Object} regexp The regexp to clone.
 * @returns {Object} Returns the cloned regexp.
 */
function cloneRegExp(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}

module.exports = cloneRegExp;

},{}],121:[function(require,module,exports){
var Symbol = require('./_Symbol');

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * Creates a clone of the `symbol` object.
 *
 * @private
 * @param {Object} symbol The symbol object to clone.
 * @returns {Object} Returns the cloned symbol object.
 */
function cloneSymbol(symbol) {
  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
}

module.exports = cloneSymbol;

},{"./_Symbol":47}],122:[function(require,module,exports){
var cloneArrayBuffer = require('./_cloneArrayBuffer');

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

module.exports = cloneTypedArray;

},{"./_cloneArrayBuffer":117}],123:[function(require,module,exports){
/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates an array that is the composition of partially applied arguments,
 * placeholders, and provided arguments into a single array of arguments.
 *
 * @private
 * @param {Array} args The provided arguments.
 * @param {Array} partials The arguments to prepend to those provided.
 * @param {Array} holders The `partials` placeholder indexes.
 * @params {boolean} [isCurried] Specify composing for a curried function.
 * @returns {Array} Returns the new array of composed arguments.
 */
function composeArgs(args, partials, holders, isCurried) {
  var argsIndex = -1,
      argsLength = args.length,
      holdersLength = holders.length,
      leftIndex = -1,
      leftLength = partials.length,
      rangeLength = nativeMax(argsLength - holdersLength, 0),
      result = Array(leftLength + rangeLength),
      isUncurried = !isCurried;

  while (++leftIndex < leftLength) {
    result[leftIndex] = partials[leftIndex];
  }
  while (++argsIndex < holdersLength) {
    if (isUncurried || argsIndex < argsLength) {
      result[holders[argsIndex]] = args[argsIndex];
    }
  }
  while (rangeLength--) {
    result[leftIndex++] = args[argsIndex++];
  }
  return result;
}

module.exports = composeArgs;

},{}],124:[function(require,module,exports){
/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * This function is like `composeArgs` except that the arguments composition
 * is tailored for `_.partialRight`.
 *
 * @private
 * @param {Array} args The provided arguments.
 * @param {Array} partials The arguments to append to those provided.
 * @param {Array} holders The `partials` placeholder indexes.
 * @params {boolean} [isCurried] Specify composing for a curried function.
 * @returns {Array} Returns the new array of composed arguments.
 */
function composeArgsRight(args, partials, holders, isCurried) {
  var argsIndex = -1,
      argsLength = args.length,
      holdersIndex = -1,
      holdersLength = holders.length,
      rightIndex = -1,
      rightLength = partials.length,
      rangeLength = nativeMax(argsLength - holdersLength, 0),
      result = Array(rangeLength + rightLength),
      isUncurried = !isCurried;

  while (++argsIndex < rangeLength) {
    result[argsIndex] = args[argsIndex];
  }
  var offset = argsIndex;
  while (++rightIndex < rightLength) {
    result[offset + rightIndex] = partials[rightIndex];
  }
  while (++holdersIndex < holdersLength) {
    if (isUncurried || argsIndex < argsLength) {
      result[offset + holders[holdersIndex]] = args[argsIndex++];
    }
  }
  return result;
}

module.exports = composeArgsRight;

},{}],125:[function(require,module,exports){
/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

module.exports = copyArray;

},{}],126:[function(require,module,exports){
var assignValue = require('./_assignValue'),
    baseAssignValue = require('./_baseAssignValue');

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : undefined;

    if (newValue === undefined) {
      newValue = source[key];
    }
    if (isNew) {
      baseAssignValue(object, key, newValue);
    } else {
      assignValue(object, key, newValue);
    }
  }
  return object;
}

module.exports = copyObject;

},{"./_assignValue":62,"./_baseAssignValue":67}],127:[function(require,module,exports){
var copyObject = require('./_copyObject'),
    getSymbols = require('./_getSymbols');

/**
 * Copies own symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbols(source, object) {
  return copyObject(source, getSymbols(source), object);
}

module.exports = copySymbols;

},{"./_copyObject":126,"./_getSymbols":163}],128:[function(require,module,exports){
var copyObject = require('./_copyObject'),
    getSymbolsIn = require('./_getSymbolsIn');

/**
 * Copies own and inherited symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbolsIn(source, object) {
  return copyObject(source, getSymbolsIn(source), object);
}

module.exports = copySymbolsIn;

},{"./_copyObject":126,"./_getSymbolsIn":164}],129:[function(require,module,exports){
var root = require('./_root');

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

module.exports = coreJsData;

},{"./_root":214}],130:[function(require,module,exports){
/**
 * Gets the number of `placeholder` occurrences in `array`.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} placeholder The placeholder to search for.
 * @returns {number} Returns the placeholder count.
 */
function countHolders(array, placeholder) {
  var length = array.length,
      result = 0;

  while (length--) {
    if (array[length] === placeholder) {
      ++result;
    }
  }
  return result;
}

module.exports = countHolders;

},{}],131:[function(require,module,exports){
var arrayAggregator = require('./_arrayAggregator'),
    baseAggregator = require('./_baseAggregator'),
    baseIteratee = require('./_baseIteratee'),
    isArray = require('./isArray');

/**
 * Creates a function like `_.groupBy`.
 *
 * @private
 * @param {Function} setter The function to set accumulator values.
 * @param {Function} [initializer] The accumulator object initializer.
 * @returns {Function} Returns the new aggregator function.
 */
function createAggregator(setter, initializer) {
  return function(collection, iteratee) {
    var func = isArray(collection) ? arrayAggregator : baseAggregator,
        accumulator = initializer ? initializer() : {};

    return func(collection, setter, baseIteratee(iteratee, 2), accumulator);
  };
}

module.exports = createAggregator;

},{"./_arrayAggregator":51,"./_baseAggregator":64,"./_baseIteratee":89,"./isArray":254}],132:[function(require,module,exports){
var baseRest = require('./_baseRest'),
    isIterateeCall = require('./_isIterateeCall');

/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return baseRest(function(object, sources) {
    var index = -1,
        length = sources.length,
        customizer = length > 1 ? sources[length - 1] : undefined,
        guard = length > 2 ? sources[2] : undefined;

    customizer = (assigner.length > 3 && typeof customizer == 'function')
      ? (length--, customizer)
      : undefined;

    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}

module.exports = createAssigner;

},{"./_baseRest":104,"./_isIterateeCall":181}],133:[function(require,module,exports){
var isArrayLike = require('./isArrayLike');

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    if (collection == null) {
      return collection;
    }
    if (!isArrayLike(collection)) {
      return eachFunc(collection, iteratee);
    }
    var length = collection.length,
        index = fromRight ? length : -1,
        iterable = Object(collection);

    while ((fromRight ? index-- : ++index < length)) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

module.exports = createBaseEach;

},{"./isArrayLike":255}],134:[function(require,module,exports){
/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

module.exports = createBaseFor;

},{}],135:[function(require,module,exports){
var createCtor = require('./_createCtor'),
    root = require('./_root');

/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1;

/**
 * Creates a function that wraps `func` to invoke it with the optional `this`
 * binding of `thisArg`.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createBind(func, bitmask, thisArg) {
  var isBind = bitmask & WRAP_BIND_FLAG,
      Ctor = createCtor(func);

  function wrapper() {
    var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
    return fn.apply(isBind ? thisArg : this, arguments);
  }
  return wrapper;
}

module.exports = createBind;

},{"./_createCtor":137,"./_root":214}],136:[function(require,module,exports){
var arrayReduce = require('./_arrayReduce'),
    deburr = require('./deburr'),
    words = require('./words');

/** Used to compose unicode capture groups. */
var rsApos = "['\u2019]";

/** Used to match apostrophes. */
var reApos = RegExp(rsApos, 'g');

/**
 * Creates a function like `_.camelCase`.
 *
 * @private
 * @param {Function} callback The function to combine each word.
 * @returns {Function} Returns the new compounder function.
 */
function createCompounder(callback) {
  return function(string) {
    return arrayReduce(words(deburr(string).replace(reApos, '')), callback, '');
  };
}

module.exports = createCompounder;

},{"./_arrayReduce":58,"./deburr":240,"./words":296}],137:[function(require,module,exports){
var baseCreate = require('./_baseCreate'),
    isObject = require('./isObject');

/**
 * Creates a function that produces an instance of `Ctor` regardless of
 * whether it was invoked as part of a `new` expression or by `call` or `apply`.
 *
 * @private
 * @param {Function} Ctor The constructor to wrap.
 * @returns {Function} Returns the new wrapped function.
 */
function createCtor(Ctor) {
  return function() {
    // Use a `switch` statement to work with class constructors. See
    // http://ecma-international.org/ecma-262/7.0/#sec-ecmascript-function-objects-call-thisargument-argumentslist
    // for more details.
    var args = arguments;
    switch (args.length) {
      case 0: return new Ctor;
      case 1: return new Ctor(args[0]);
      case 2: return new Ctor(args[0], args[1]);
      case 3: return new Ctor(args[0], args[1], args[2]);
      case 4: return new Ctor(args[0], args[1], args[2], args[3]);
      case 5: return new Ctor(args[0], args[1], args[2], args[3], args[4]);
      case 6: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5]);
      case 7: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
    }
    var thisBinding = baseCreate(Ctor.prototype),
        result = Ctor.apply(thisBinding, args);

    // Mimic the constructor's `return` behavior.
    // See https://es5.github.io/#x13.2.2 for more details.
    return isObject(result) ? result : thisBinding;
  };
}

module.exports = createCtor;

},{"./_baseCreate":69,"./isObject":262}],138:[function(require,module,exports){
var apply = require('./_apply'),
    createCtor = require('./_createCtor'),
    createHybrid = require('./_createHybrid'),
    createRecurry = require('./_createRecurry'),
    getHolder = require('./_getHolder'),
    replaceHolders = require('./_replaceHolders'),
    root = require('./_root');

/**
 * Creates a function that wraps `func` to enable currying.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {number} arity The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createCurry(func, bitmask, arity) {
  var Ctor = createCtor(func);

  function wrapper() {
    var length = arguments.length,
        args = Array(length),
        index = length,
        placeholder = getHolder(wrapper);

    while (index--) {
      args[index] = arguments[index];
    }
    var holders = (length < 3 && args[0] !== placeholder && args[length - 1] !== placeholder)
      ? []
      : replaceHolders(args, placeholder);

    length -= holders.length;
    if (length < arity) {
      return createRecurry(
        func, bitmask, createHybrid, wrapper.placeholder, undefined,
        args, holders, undefined, undefined, arity - length);
    }
    var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
    return apply(fn, this, args);
  }
  return wrapper;
}

module.exports = createCurry;

},{"./_apply":50,"./_createCtor":137,"./_createHybrid":140,"./_createRecurry":142,"./_getHolder":157,"./_replaceHolders":213,"./_root":214}],139:[function(require,module,exports){
var baseIteratee = require('./_baseIteratee'),
    isArrayLike = require('./isArrayLike'),
    keys = require('./keys');

/**
 * Creates a `_.find` or `_.findLast` function.
 *
 * @private
 * @param {Function} findIndexFunc The function to find the collection index.
 * @returns {Function} Returns the new find function.
 */
function createFind(findIndexFunc) {
  return function(collection, predicate, fromIndex) {
    var iterable = Object(collection);
    if (!isArrayLike(collection)) {
      var iteratee = baseIteratee(predicate, 3);
      collection = keys(collection);
      predicate = function(key) { return iteratee(iterable[key], key, iterable); };
    }
    var index = findIndexFunc(collection, predicate, fromIndex);
    return index > -1 ? iterable[iteratee ? collection[index] : index] : undefined;
  };
}

module.exports = createFind;

},{"./_baseIteratee":89,"./isArrayLike":255,"./keys":270}],140:[function(require,module,exports){
var composeArgs = require('./_composeArgs'),
    composeArgsRight = require('./_composeArgsRight'),
    countHolders = require('./_countHolders'),
    createCtor = require('./_createCtor'),
    createRecurry = require('./_createRecurry'),
    getHolder = require('./_getHolder'),
    reorder = require('./_reorder'),
    replaceHolders = require('./_replaceHolders'),
    root = require('./_root');

/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1,
    WRAP_BIND_KEY_FLAG = 2,
    WRAP_CURRY_FLAG = 8,
    WRAP_CURRY_RIGHT_FLAG = 16,
    WRAP_ARY_FLAG = 128,
    WRAP_FLIP_FLAG = 512;

/**
 * Creates a function that wraps `func` to invoke it with optional `this`
 * binding of `thisArg`, partial application, and currying.
 *
 * @private
 * @param {Function|string} func The function or method name to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {Array} [partials] The arguments to prepend to those provided to
 *  the new function.
 * @param {Array} [holders] The `partials` placeholder indexes.
 * @param {Array} [partialsRight] The arguments to append to those provided
 *  to the new function.
 * @param {Array} [holdersRight] The `partialsRight` placeholder indexes.
 * @param {Array} [argPos] The argument positions of the new function.
 * @param {number} [ary] The arity cap of `func`.
 * @param {number} [arity] The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createHybrid(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity) {
  var isAry = bitmask & WRAP_ARY_FLAG,
      isBind = bitmask & WRAP_BIND_FLAG,
      isBindKey = bitmask & WRAP_BIND_KEY_FLAG,
      isCurried = bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG),
      isFlip = bitmask & WRAP_FLIP_FLAG,
      Ctor = isBindKey ? undefined : createCtor(func);

  function wrapper() {
    var length = arguments.length,
        args = Array(length),
        index = length;

    while (index--) {
      args[index] = arguments[index];
    }
    if (isCurried) {
      var placeholder = getHolder(wrapper),
          holdersCount = countHolders(args, placeholder);
    }
    if (partials) {
      args = composeArgs(args, partials, holders, isCurried);
    }
    if (partialsRight) {
      args = composeArgsRight(args, partialsRight, holdersRight, isCurried);
    }
    length -= holdersCount;
    if (isCurried && length < arity) {
      var newHolders = replaceHolders(args, placeholder);
      return createRecurry(
        func, bitmask, createHybrid, wrapper.placeholder, thisArg,
        args, newHolders, argPos, ary, arity - length
      );
    }
    var thisBinding = isBind ? thisArg : this,
        fn = isBindKey ? thisBinding[func] : func;

    length = args.length;
    if (argPos) {
      args = reorder(args, argPos);
    } else if (isFlip && length > 1) {
      args.reverse();
    }
    if (isAry && ary < length) {
      args.length = ary;
    }
    if (this && this !== root && this instanceof wrapper) {
      fn = Ctor || createCtor(fn);
    }
    return fn.apply(thisBinding, args);
  }
  return wrapper;
}

module.exports = createHybrid;

},{"./_composeArgs":123,"./_composeArgsRight":124,"./_countHolders":130,"./_createCtor":137,"./_createRecurry":142,"./_getHolder":157,"./_reorder":212,"./_replaceHolders":213,"./_root":214}],141:[function(require,module,exports){
var apply = require('./_apply'),
    createCtor = require('./_createCtor'),
    root = require('./_root');

/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1;

/**
 * Creates a function that wraps `func` to invoke it with the `this` binding
 * of `thisArg` and `partials` prepended to the arguments it receives.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} partials The arguments to prepend to those provided to
 *  the new function.
 * @returns {Function} Returns the new wrapped function.
 */
function createPartial(func, bitmask, thisArg, partials) {
  var isBind = bitmask & WRAP_BIND_FLAG,
      Ctor = createCtor(func);

  function wrapper() {
    var argsIndex = -1,
        argsLength = arguments.length,
        leftIndex = -1,
        leftLength = partials.length,
        args = Array(leftLength + argsLength),
        fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;

    while (++leftIndex < leftLength) {
      args[leftIndex] = partials[leftIndex];
    }
    while (argsLength--) {
      args[leftIndex++] = arguments[++argsIndex];
    }
    return apply(fn, isBind ? thisArg : this, args);
  }
  return wrapper;
}

module.exports = createPartial;

},{"./_apply":50,"./_createCtor":137,"./_root":214}],142:[function(require,module,exports){
var isLaziable = require('./_isLaziable'),
    setData = require('./_setData'),
    setWrapToString = require('./_setWrapToString');

/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1,
    WRAP_BIND_KEY_FLAG = 2,
    WRAP_CURRY_BOUND_FLAG = 4,
    WRAP_CURRY_FLAG = 8,
    WRAP_PARTIAL_FLAG = 32,
    WRAP_PARTIAL_RIGHT_FLAG = 64;

/**
 * Creates a function that wraps `func` to continue currying.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @param {Function} wrapFunc The function to create the `func` wrapper.
 * @param {*} placeholder The placeholder value.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {Array} [partials] The arguments to prepend to those provided to
 *  the new function.
 * @param {Array} [holders] The `partials` placeholder indexes.
 * @param {Array} [argPos] The argument positions of the new function.
 * @param {number} [ary] The arity cap of `func`.
 * @param {number} [arity] The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createRecurry(func, bitmask, wrapFunc, placeholder, thisArg, partials, holders, argPos, ary, arity) {
  var isCurry = bitmask & WRAP_CURRY_FLAG,
      newHolders = isCurry ? holders : undefined,
      newHoldersRight = isCurry ? undefined : holders,
      newPartials = isCurry ? partials : undefined,
      newPartialsRight = isCurry ? undefined : partials;

  bitmask |= (isCurry ? WRAP_PARTIAL_FLAG : WRAP_PARTIAL_RIGHT_FLAG);
  bitmask &= ~(isCurry ? WRAP_PARTIAL_RIGHT_FLAG : WRAP_PARTIAL_FLAG);

  if (!(bitmask & WRAP_CURRY_BOUND_FLAG)) {
    bitmask &= ~(WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG);
  }
  var newData = [
    func, bitmask, thisArg, newPartials, newHolders, newPartialsRight,
    newHoldersRight, argPos, ary, arity
  ];

  var result = wrapFunc.apply(undefined, newData);
  if (isLaziable(func)) {
    setData(result, newData);
  }
  result.placeholder = placeholder;
  return setWrapToString(result, func, bitmask);
}

module.exports = createRecurry;

},{"./_isLaziable":184,"./_setData":218,"./_setWrapToString":221}],143:[function(require,module,exports){
var baseSetData = require('./_baseSetData'),
    createBind = require('./_createBind'),
    createCurry = require('./_createCurry'),
    createHybrid = require('./_createHybrid'),
    createPartial = require('./_createPartial'),
    getData = require('./_getData'),
    mergeData = require('./_mergeData'),
    setData = require('./_setData'),
    setWrapToString = require('./_setWrapToString'),
    toInteger = require('./toInteger');

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1,
    WRAP_BIND_KEY_FLAG = 2,
    WRAP_CURRY_FLAG = 8,
    WRAP_CURRY_RIGHT_FLAG = 16,
    WRAP_PARTIAL_FLAG = 32,
    WRAP_PARTIAL_RIGHT_FLAG = 64;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a function that either curries or invokes `func` with optional
 * `this` binding and partially applied arguments.
 *
 * @private
 * @param {Function|string} func The function or method name to wrap.
 * @param {number} bitmask The bitmask flags.
 *    1 - `_.bind`
 *    2 - `_.bindKey`
 *    4 - `_.curry` or `_.curryRight` of a bound function
 *    8 - `_.curry`
 *   16 - `_.curryRight`
 *   32 - `_.partial`
 *   64 - `_.partialRight`
 *  128 - `_.rearg`
 *  256 - `_.ary`
 *  512 - `_.flip`
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {Array} [partials] The arguments to be partially applied.
 * @param {Array} [holders] The `partials` placeholder indexes.
 * @param {Array} [argPos] The argument positions of the new function.
 * @param {number} [ary] The arity cap of `func`.
 * @param {number} [arity] The arity of `func`.
 * @returns {Function} Returns the new wrapped function.
 */
function createWrap(func, bitmask, thisArg, partials, holders, argPos, ary, arity) {
  var isBindKey = bitmask & WRAP_BIND_KEY_FLAG;
  if (!isBindKey && typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var length = partials ? partials.length : 0;
  if (!length) {
    bitmask &= ~(WRAP_PARTIAL_FLAG | WRAP_PARTIAL_RIGHT_FLAG);
    partials = holders = undefined;
  }
  ary = ary === undefined ? ary : nativeMax(toInteger(ary), 0);
  arity = arity === undefined ? arity : toInteger(arity);
  length -= holders ? holders.length : 0;

  if (bitmask & WRAP_PARTIAL_RIGHT_FLAG) {
    var partialsRight = partials,
        holdersRight = holders;

    partials = holders = undefined;
  }
  var data = isBindKey ? undefined : getData(func);

  var newData = [
    func, bitmask, thisArg, partials, holders, partialsRight, holdersRight,
    argPos, ary, arity
  ];

  if (data) {
    mergeData(newData, data);
  }
  func = newData[0];
  bitmask = newData[1];
  thisArg = newData[2];
  partials = newData[3];
  holders = newData[4];
  arity = newData[9] = newData[9] === undefined
    ? (isBindKey ? 0 : func.length)
    : nativeMax(newData[9] - length, 0);

  if (!arity && bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG)) {
    bitmask &= ~(WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG);
  }
  if (!bitmask || bitmask == WRAP_BIND_FLAG) {
    var result = createBind(func, bitmask, thisArg);
  } else if (bitmask == WRAP_CURRY_FLAG || bitmask == WRAP_CURRY_RIGHT_FLAG) {
    result = createCurry(func, bitmask, arity);
  } else if ((bitmask == WRAP_PARTIAL_FLAG || bitmask == (WRAP_BIND_FLAG | WRAP_PARTIAL_FLAG)) && !holders.length) {
    result = createPartial(func, bitmask, thisArg, partials);
  } else {
    result = createHybrid.apply(undefined, newData);
  }
  var setter = data ? baseSetData : setData;
  return setWrapToString(setter(result, newData), func, bitmask);
}

module.exports = createWrap;

},{"./_baseSetData":106,"./_createBind":135,"./_createCurry":138,"./_createHybrid":140,"./_createPartial":141,"./_getData":155,"./_mergeData":201,"./_setData":218,"./_setWrapToString":221,"./toInteger":291}],144:[function(require,module,exports){
var baseMerge = require('./_baseMerge'),
    isObject = require('./isObject');

/**
 * Used by `_.defaultsDeep` to customize its `_.merge` use to merge source
 * objects into destination objects that are passed thru.
 *
 * @private
 * @param {*} objValue The destination value.
 * @param {*} srcValue The source value.
 * @param {string} key The key of the property to merge.
 * @param {Object} object The parent object of `objValue`.
 * @param {Object} source The parent object of `srcValue`.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 * @returns {*} Returns the value to assign.
 */
function customDefaultsMerge(objValue, srcValue, key, object, source, stack) {
  if (isObject(objValue) && isObject(srcValue)) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    stack.set(srcValue, objValue);
    baseMerge(objValue, srcValue, undefined, customDefaultsMerge, stack);
    stack['delete'](srcValue);
  }
  return objValue;
}

module.exports = customDefaultsMerge;

},{"./_baseMerge":96,"./isObject":262}],145:[function(require,module,exports){
var isPlainObject = require('./isPlainObject');

/**
 * Used by `_.omit` to customize its `_.cloneDeep` use to only clone plain
 * objects.
 *
 * @private
 * @param {*} value The value to inspect.
 * @param {string} key The key of the property to inspect.
 * @returns {*} Returns the uncloned value or `undefined` to defer cloning to `_.cloneDeep`.
 */
function customOmitClone(value) {
  return isPlainObject(value) ? undefined : value;
}

module.exports = customOmitClone;

},{"./isPlainObject":264}],146:[function(require,module,exports){
var basePropertyOf = require('./_basePropertyOf');

/** Used to map Latin Unicode letters to basic Latin letters. */
var deburredLetters = {
  // Latin-1 Supplement block.
  '\xc0': 'A',  '\xc1': 'A', '\xc2': 'A', '\xc3': 'A', '\xc4': 'A', '\xc5': 'A',
  '\xe0': 'a',  '\xe1': 'a', '\xe2': 'a', '\xe3': 'a', '\xe4': 'a', '\xe5': 'a',
  '\xc7': 'C',  '\xe7': 'c',
  '\xd0': 'D',  '\xf0': 'd',
  '\xc8': 'E',  '\xc9': 'E', '\xca': 'E', '\xcb': 'E',
  '\xe8': 'e',  '\xe9': 'e', '\xea': 'e', '\xeb': 'e',
  '\xcc': 'I',  '\xcd': 'I', '\xce': 'I', '\xcf': 'I',
  '\xec': 'i',  '\xed': 'i', '\xee': 'i', '\xef': 'i',
  '\xd1': 'N',  '\xf1': 'n',
  '\xd2': 'O',  '\xd3': 'O', '\xd4': 'O', '\xd5': 'O', '\xd6': 'O', '\xd8': 'O',
  '\xf2': 'o',  '\xf3': 'o', '\xf4': 'o', '\xf5': 'o', '\xf6': 'o', '\xf8': 'o',
  '\xd9': 'U',  '\xda': 'U', '\xdb': 'U', '\xdc': 'U',
  '\xf9': 'u',  '\xfa': 'u', '\xfb': 'u', '\xfc': 'u',
  '\xdd': 'Y',  '\xfd': 'y', '\xff': 'y',
  '\xc6': 'Ae', '\xe6': 'ae',
  '\xde': 'Th', '\xfe': 'th',
  '\xdf': 'ss',
  // Latin Extended-A block.
  '\u0100': 'A',  '\u0102': 'A', '\u0104': 'A',
  '\u0101': 'a',  '\u0103': 'a', '\u0105': 'a',
  '\u0106': 'C',  '\u0108': 'C', '\u010a': 'C', '\u010c': 'C',
  '\u0107': 'c',  '\u0109': 'c', '\u010b': 'c', '\u010d': 'c',
  '\u010e': 'D',  '\u0110': 'D', '\u010f': 'd', '\u0111': 'd',
  '\u0112': 'E',  '\u0114': 'E', '\u0116': 'E', '\u0118': 'E', '\u011a': 'E',
  '\u0113': 'e',  '\u0115': 'e', '\u0117': 'e', '\u0119': 'e', '\u011b': 'e',
  '\u011c': 'G',  '\u011e': 'G', '\u0120': 'G', '\u0122': 'G',
  '\u011d': 'g',  '\u011f': 'g', '\u0121': 'g', '\u0123': 'g',
  '\u0124': 'H',  '\u0126': 'H', '\u0125': 'h', '\u0127': 'h',
  '\u0128': 'I',  '\u012a': 'I', '\u012c': 'I', '\u012e': 'I', '\u0130': 'I',
  '\u0129': 'i',  '\u012b': 'i', '\u012d': 'i', '\u012f': 'i', '\u0131': 'i',
  '\u0134': 'J',  '\u0135': 'j',
  '\u0136': 'K',  '\u0137': 'k', '\u0138': 'k',
  '\u0139': 'L',  '\u013b': 'L', '\u013d': 'L', '\u013f': 'L', '\u0141': 'L',
  '\u013a': 'l',  '\u013c': 'l', '\u013e': 'l', '\u0140': 'l', '\u0142': 'l',
  '\u0143': 'N',  '\u0145': 'N', '\u0147': 'N', '\u014a': 'N',
  '\u0144': 'n',  '\u0146': 'n', '\u0148': 'n', '\u014b': 'n',
  '\u014c': 'O',  '\u014e': 'O', '\u0150': 'O',
  '\u014d': 'o',  '\u014f': 'o', '\u0151': 'o',
  '\u0154': 'R',  '\u0156': 'R', '\u0158': 'R',
  '\u0155': 'r',  '\u0157': 'r', '\u0159': 'r',
  '\u015a': 'S',  '\u015c': 'S', '\u015e': 'S', '\u0160': 'S',
  '\u015b': 's',  '\u015d': 's', '\u015f': 's', '\u0161': 's',
  '\u0162': 'T',  '\u0164': 'T', '\u0166': 'T',
  '\u0163': 't',  '\u0165': 't', '\u0167': 't',
  '\u0168': 'U',  '\u016a': 'U', '\u016c': 'U', '\u016e': 'U', '\u0170': 'U', '\u0172': 'U',
  '\u0169': 'u',  '\u016b': 'u', '\u016d': 'u', '\u016f': 'u', '\u0171': 'u', '\u0173': 'u',
  '\u0174': 'W',  '\u0175': 'w',
  '\u0176': 'Y',  '\u0177': 'y', '\u0178': 'Y',
  '\u0179': 'Z',  '\u017b': 'Z', '\u017d': 'Z',
  '\u017a': 'z',  '\u017c': 'z', '\u017e': 'z',
  '\u0132': 'IJ', '\u0133': 'ij',
  '\u0152': 'Oe', '\u0153': 'oe',
  '\u0149': "'n", '\u017f': 's'
};

/**
 * Used by `_.deburr` to convert Latin-1 Supplement and Latin Extended-A
 * letters to basic Latin letters.
 *
 * @private
 * @param {string} letter The matched letter to deburr.
 * @returns {string} Returns the deburred letter.
 */
var deburrLetter = basePropertyOf(deburredLetters);

module.exports = deburrLetter;

},{"./_basePropertyOf":102}],147:[function(require,module,exports){
var getNative = require('./_getNative');

var defineProperty = (function() {
  try {
    var func = getNative(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}());

module.exports = defineProperty;

},{"./_getNative":160}],148:[function(require,module,exports){
var SetCache = require('./_SetCache'),
    arraySome = require('./_arraySome'),
    cacheHas = require('./_cacheHas');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(array);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var index = -1,
      result = true,
      seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new SetCache : undefined;

  stack.set(array, other);
  stack.set(other, array);

  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, arrValue, index, other, array, stack)
        : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (seen) {
      if (!arraySome(other, function(othValue, othIndex) {
            if (!cacheHas(seen, othIndex) &&
                (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
              return seen.push(othIndex);
            }
          })) {
        result = false;
        break;
      }
    } else if (!(
          arrValue === othValue ||
            equalFunc(arrValue, othValue, bitmask, customizer, stack)
        )) {
      result = false;
      break;
    }
  }
  stack['delete'](array);
  stack['delete'](other);
  return result;
}

module.exports = equalArrays;

},{"./_SetCache":45,"./_arraySome":59,"./_cacheHas":114}],149:[function(require,module,exports){
var Symbol = require('./_Symbol'),
    Uint8Array = require('./_Uint8Array'),
    eq = require('./eq'),
    equalArrays = require('./_equalArrays'),
    mapToArray = require('./_mapToArray'),
    setToArray = require('./_setToArray');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]';

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag:
      if ((object.byteLength != other.byteLength) ||
          (object.byteOffset != other.byteOffset)) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if ((object.byteLength != other.byteLength) ||
          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
        return false;
      }
      return true;

    case boolTag:
    case dateTag:
    case numberTag:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return eq(+object, +other);

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == (other + '');

    case mapTag:
      var convert = mapToArray;

    case setTag:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
      convert || (convert = setToArray);

      if (object.size != other.size && !isPartial) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG;

      // Recursively compare objects (susceptible to call stack limits).
      stack.set(object, other);
      var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack['delete'](object);
      return result;

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}

module.exports = equalByTag;

},{"./_Symbol":47,"./_Uint8Array":48,"./_equalArrays":148,"./_mapToArray":198,"./_setToArray":219,"./eq":243}],150:[function(require,module,exports){
var getAllKeys = require('./_getAllKeys');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      objProps = getAllKeys(object),
      objLength = objProps.length,
      othProps = getAllKeys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(object);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);

  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    }
    // Recursively compare objects (susceptible to call stack limits).
    if (!(compared === undefined
          ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
          : compared
        )) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack['delete'](object);
  stack['delete'](other);
  return result;
}

module.exports = equalObjects;

},{"./_getAllKeys":153}],151:[function(require,module,exports){
var flatten = require('./flatten'),
    overRest = require('./_overRest'),
    setToString = require('./_setToString');

/**
 * A specialized version of `baseRest` which flattens the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @returns {Function} Returns the new function.
 */
function flatRest(func) {
  return setToString(overRest(func, undefined, flatten), func + '');
}

module.exports = flatRest;

},{"./_overRest":209,"./_setToString":220,"./flatten":246}],152:[function(require,module,exports){
(function (global){
/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

module.exports = freeGlobal;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],153:[function(require,module,exports){
var baseGetAllKeys = require('./_baseGetAllKeys'),
    getSymbols = require('./_getSymbols'),
    keys = require('./keys');

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return baseGetAllKeys(object, keys, getSymbols);
}

module.exports = getAllKeys;

},{"./_baseGetAllKeys":76,"./_getSymbols":163,"./keys":270}],154:[function(require,module,exports){
var baseGetAllKeys = require('./_baseGetAllKeys'),
    getSymbolsIn = require('./_getSymbolsIn'),
    keysIn = require('./keysIn');

/**
 * Creates an array of own and inherited enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeysIn(object) {
  return baseGetAllKeys(object, keysIn, getSymbolsIn);
}

module.exports = getAllKeysIn;

},{"./_baseGetAllKeys":76,"./_getSymbolsIn":164,"./keysIn":271}],155:[function(require,module,exports){
var metaMap = require('./_metaMap'),
    noop = require('./noop');

/**
 * Gets metadata for `func`.
 *
 * @private
 * @param {Function} func The function to query.
 * @returns {*} Returns the metadata for `func`.
 */
var getData = !metaMap ? noop : function(func) {
  return metaMap.get(func);
};

module.exports = getData;

},{"./_metaMap":202,"./noop":279}],156:[function(require,module,exports){
var realNames = require('./_realNames');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Gets the name of `func`.
 *
 * @private
 * @param {Function} func The function to query.
 * @returns {string} Returns the function name.
 */
function getFuncName(func) {
  var result = (func.name + ''),
      array = realNames[result],
      length = hasOwnProperty.call(realNames, result) ? array.length : 0;

  while (length--) {
    var data = array[length],
        otherFunc = data.func;
    if (otherFunc == null || otherFunc == func) {
      return data.name;
    }
  }
  return result;
}

module.exports = getFuncName;

},{"./_realNames":211}],157:[function(require,module,exports){
/**
 * Gets the argument placeholder value for `func`.
 *
 * @private
 * @param {Function} func The function to inspect.
 * @returns {*} Returns the placeholder value.
 */
function getHolder(func) {
  var object = func;
  return object.placeholder;
}

module.exports = getHolder;

},{}],158:[function(require,module,exports){
var isKeyable = require('./_isKeyable');

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

module.exports = getMapData;

},{"./_isKeyable":183}],159:[function(require,module,exports){
var isStrictComparable = require('./_isStrictComparable'),
    keys = require('./keys');

/**
 * Gets the property names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
  var result = keys(object),
      length = result.length;

  while (length--) {
    var key = result[length],
        value = object[key];

    result[length] = [key, value, isStrictComparable(value)];
  }
  return result;
}

module.exports = getMatchData;

},{"./_isStrictComparable":187,"./keys":270}],160:[function(require,module,exports){
var baseIsNative = require('./_baseIsNative'),
    getValue = require('./_getValue');

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

module.exports = getNative;

},{"./_baseIsNative":86,"./_getValue":166}],161:[function(require,module,exports){
var overArg = require('./_overArg');

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

module.exports = getPrototype;

},{"./_overArg":208}],162:[function(require,module,exports){
var Symbol = require('./_Symbol');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

module.exports = getRawTag;

},{"./_Symbol":47}],163:[function(require,module,exports){
var arrayFilter = require('./_arrayFilter'),
    stubArray = require('./stubArray');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return arrayFilter(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable.call(object, symbol);
  });
};

module.exports = getSymbols;

},{"./_arrayFilter":53,"./stubArray":288}],164:[function(require,module,exports){
var arrayPush = require('./_arrayPush'),
    getPrototype = require('./_getPrototype'),
    getSymbols = require('./_getSymbols'),
    stubArray = require('./stubArray');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own and inherited enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
  var result = [];
  while (object) {
    arrayPush(result, getSymbols(object));
    object = getPrototype(object);
  }
  return result;
};

module.exports = getSymbolsIn;

},{"./_arrayPush":57,"./_getPrototype":161,"./_getSymbols":163,"./stubArray":288}],165:[function(require,module,exports){
var DataView = require('./_DataView'),
    Map = require('./_Map'),
    Promise = require('./_Promise'),
    Set = require('./_Set'),
    WeakMap = require('./_WeakMap'),
    baseGetTag = require('./_baseGetTag'),
    toSource = require('./_toSource');

/** `Object#toString` result references. */
var mapTag = '[object Map]',
    objectTag = '[object Object]',
    promiseTag = '[object Promise]',
    setTag = '[object Set]',
    weakMapTag = '[object WeakMap]';

var dataViewTag = '[object DataView]';

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = toSource(DataView),
    mapCtorString = toSource(Map),
    promiseCtorString = toSource(Promise),
    setCtorString = toSource(Set),
    weakMapCtorString = toSource(WeakMap);

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
    (Map && getTag(new Map) != mapTag) ||
    (Promise && getTag(Promise.resolve()) != promiseTag) ||
    (Set && getTag(new Set) != setTag) ||
    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
  getTag = function(value) {
    var result = baseGetTag(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : '';

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag;
        case mapCtorString: return mapTag;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag;
        case weakMapCtorString: return weakMapTag;
      }
    }
    return result;
  };
}

module.exports = getTag;

},{"./_DataView":36,"./_Map":41,"./_Promise":43,"./_Set":44,"./_WeakMap":49,"./_baseGetTag":77,"./_toSource":231}],166:[function(require,module,exports){
/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

module.exports = getValue;

},{}],167:[function(require,module,exports){
/** Used to match wrap detail comments. */
var reWrapDetails = /\{\n\/\* \[wrapped with (.+)\] \*/,
    reSplitDetails = /,? & /;

/**
 * Extracts wrapper details from the `source` body comment.
 *
 * @private
 * @param {string} source The source to inspect.
 * @returns {Array} Returns the wrapper details.
 */
function getWrapDetails(source) {
  var match = source.match(reWrapDetails);
  return match ? match[1].split(reSplitDetails) : [];
}

module.exports = getWrapDetails;

},{}],168:[function(require,module,exports){
var castPath = require('./_castPath'),
    isArguments = require('./isArguments'),
    isArray = require('./isArray'),
    isIndex = require('./_isIndex'),
    isLength = require('./isLength'),
    toKey = require('./_toKey');

/**
 * Checks if `path` exists on `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @param {Function} hasFunc The function to check properties.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 */
function hasPath(object, path, hasFunc) {
  path = castPath(path, object);

  var index = -1,
      length = path.length,
      result = false;

  while (++index < length) {
    var key = toKey(path[index]);
    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }
    object = object[key];
  }
  if (result || ++index != length) {
    return result;
  }
  length = object == null ? 0 : object.length;
  return !!length && isLength(length) && isIndex(key, length) &&
    (isArray(object) || isArguments(object));
}

module.exports = hasPath;

},{"./_castPath":116,"./_isIndex":180,"./_toKey":230,"./isArguments":253,"./isArray":254,"./isLength":260}],169:[function(require,module,exports){
/** Used to detect strings that need a more robust regexp to match words. */
var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;

/**
 * Checks if `string` contains a word composed of Unicode symbols.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {boolean} Returns `true` if a word is found, else `false`.
 */
function hasUnicodeWord(string) {
  return reHasUnicodeWord.test(string);
}

module.exports = hasUnicodeWord;

},{}],170:[function(require,module,exports){
var nativeCreate = require('./_nativeCreate');

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

module.exports = hashClear;

},{"./_nativeCreate":203}],171:[function(require,module,exports){
/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = hashDelete;

},{}],172:[function(require,module,exports){
var nativeCreate = require('./_nativeCreate');

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

module.exports = hashGet;

},{"./_nativeCreate":203}],173:[function(require,module,exports){
var nativeCreate = require('./_nativeCreate');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
}

module.exports = hashHas;

},{"./_nativeCreate":203}],174:[function(require,module,exports){
var nativeCreate = require('./_nativeCreate');

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

module.exports = hashSet;

},{"./_nativeCreate":203}],175:[function(require,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
  var length = array.length,
      result = new array.constructor(length);

  // Add properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

module.exports = initCloneArray;

},{}],176:[function(require,module,exports){
var cloneArrayBuffer = require('./_cloneArrayBuffer'),
    cloneDataView = require('./_cloneDataView'),
    cloneRegExp = require('./_cloneRegExp'),
    cloneSymbol = require('./_cloneSymbol'),
    cloneTypedArray = require('./_cloneTypedArray');

/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag:
      return cloneArrayBuffer(object);

    case boolTag:
    case dateTag:
      return new Ctor(+object);

    case dataViewTag:
      return cloneDataView(object, isDeep);

    case float32Tag: case float64Tag:
    case int8Tag: case int16Tag: case int32Tag:
    case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
      return cloneTypedArray(object, isDeep);

    case mapTag:
      return new Ctor;

    case numberTag:
    case stringTag:
      return new Ctor(object);

    case regexpTag:
      return cloneRegExp(object);

    case setTag:
      return new Ctor;

    case symbolTag:
      return cloneSymbol(object);
  }
}

module.exports = initCloneByTag;

},{"./_cloneArrayBuffer":117,"./_cloneDataView":119,"./_cloneRegExp":120,"./_cloneSymbol":121,"./_cloneTypedArray":122}],177:[function(require,module,exports){
var baseCreate = require('./_baseCreate'),
    getPrototype = require('./_getPrototype'),
    isPrototype = require('./_isPrototype');

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  return (typeof object.constructor == 'function' && !isPrototype(object))
    ? baseCreate(getPrototype(object))
    : {};
}

module.exports = initCloneObject;

},{"./_baseCreate":69,"./_getPrototype":161,"./_isPrototype":186}],178:[function(require,module,exports){
/** Used to match wrap detail comments. */
var reWrapComment = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/;

/**
 * Inserts wrapper `details` in a comment at the top of the `source` body.
 *
 * @private
 * @param {string} source The source to modify.
 * @returns {Array} details The details to insert.
 * @returns {string} Returns the modified source.
 */
function insertWrapDetails(source, details) {
  var length = details.length;
  if (!length) {
    return source;
  }
  var lastIndex = length - 1;
  details[lastIndex] = (length > 1 ? '& ' : '') + details[lastIndex];
  details = details.join(length > 2 ? ', ' : ' ');
  return source.replace(reWrapComment, '{\n/* [wrapped with ' + details + '] */\n');
}

module.exports = insertWrapDetails;

},{}],179:[function(require,module,exports){
var Symbol = require('./_Symbol'),
    isArguments = require('./isArguments'),
    isArray = require('./isArray');

/** Built-in value references. */
var spreadableSymbol = Symbol ? Symbol.isConcatSpreadable : undefined;

/**
 * Checks if `value` is a flattenable `arguments` object or array.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
 */
function isFlattenable(value) {
  return isArray(value) || isArguments(value) ||
    !!(spreadableSymbol && value && value[spreadableSymbol]);
}

module.exports = isFlattenable;

},{"./_Symbol":47,"./isArguments":253,"./isArray":254}],180:[function(require,module,exports){
/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER : length;

  return !!length &&
    (type == 'number' ||
      (type != 'symbol' && reIsUint.test(value))) &&
        (value > -1 && value % 1 == 0 && value < length);
}

module.exports = isIndex;

},{}],181:[function(require,module,exports){
var eq = require('./eq'),
    isArrayLike = require('./isArrayLike'),
    isIndex = require('./_isIndex'),
    isObject = require('./isObject');

/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
 *  else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
        ? (isArrayLike(object) && isIndex(index, object.length))
        : (type == 'string' && index in object)
      ) {
    return eq(object[index], value);
  }
  return false;
}

module.exports = isIterateeCall;

},{"./_isIndex":180,"./eq":243,"./isArrayLike":255,"./isObject":262}],182:[function(require,module,exports){
var isArray = require('./isArray'),
    isSymbol = require('./isSymbol');

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  if (isArray(value)) {
    return false;
  }
  var type = typeof value;
  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
      value == null || isSymbol(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
    (object != null && value in Object(object));
}

module.exports = isKey;

},{"./isArray":254,"./isSymbol":267}],183:[function(require,module,exports){
/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

module.exports = isKeyable;

},{}],184:[function(require,module,exports){
var LazyWrapper = require('./_LazyWrapper'),
    getData = require('./_getData'),
    getFuncName = require('./_getFuncName'),
    lodash = require('./wrapperLodash');

/**
 * Checks if `func` has a lazy counterpart.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` has a lazy counterpart,
 *  else `false`.
 */
function isLaziable(func) {
  var funcName = getFuncName(func),
      other = lodash[funcName];

  if (typeof other != 'function' || !(funcName in LazyWrapper.prototype)) {
    return false;
  }
  if (func === other) {
    return true;
  }
  var data = getData(other);
  return !!data && func === data[0];
}

module.exports = isLaziable;

},{"./_LazyWrapper":38,"./_getData":155,"./_getFuncName":156,"./wrapperLodash":297}],185:[function(require,module,exports){
var coreJsData = require('./_coreJsData');

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

module.exports = isMasked;

},{"./_coreJsData":129}],186:[function(require,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

module.exports = isPrototype;

},{}],187:[function(require,module,exports){
var isObject = require('./isObject');

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable(value) {
  return value === value && !isObject(value);
}

module.exports = isStrictComparable;

},{"./isObject":262}],188:[function(require,module,exports){
/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

module.exports = listCacheClear;

},{}],189:[function(require,module,exports){
var assocIndexOf = require('./_assocIndexOf');

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

module.exports = listCacheDelete;

},{"./_assocIndexOf":63}],190:[function(require,module,exports){
var assocIndexOf = require('./_assocIndexOf');

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

module.exports = listCacheGet;

},{"./_assocIndexOf":63}],191:[function(require,module,exports){
var assocIndexOf = require('./_assocIndexOf');

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

module.exports = listCacheHas;

},{"./_assocIndexOf":63}],192:[function(require,module,exports){
var assocIndexOf = require('./_assocIndexOf');

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

module.exports = listCacheSet;

},{"./_assocIndexOf":63}],193:[function(require,module,exports){
var Hash = require('./_Hash'),
    ListCache = require('./_ListCache'),
    Map = require('./_Map');

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

module.exports = mapCacheClear;

},{"./_Hash":37,"./_ListCache":39,"./_Map":41}],194:[function(require,module,exports){
var getMapData = require('./_getMapData');

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = mapCacheDelete;

},{"./_getMapData":158}],195:[function(require,module,exports){
var getMapData = require('./_getMapData');

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

module.exports = mapCacheGet;

},{"./_getMapData":158}],196:[function(require,module,exports){
var getMapData = require('./_getMapData');

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

module.exports = mapCacheHas;

},{"./_getMapData":158}],197:[function(require,module,exports){
var getMapData = require('./_getMapData');

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

module.exports = mapCacheSet;

},{"./_getMapData":158}],198:[function(require,module,exports){
/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}

module.exports = mapToArray;

},{}],199:[function(require,module,exports){
/**
 * A specialized version of `matchesProperty` for source values suitable
 * for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function matchesStrictComparable(key, srcValue) {
  return function(object) {
    if (object == null) {
      return false;
    }
    return object[key] === srcValue &&
      (srcValue !== undefined || (key in Object(object)));
  };
}

module.exports = matchesStrictComparable;

},{}],200:[function(require,module,exports){
var memoize = require('./memoize');

/** Used as the maximum memoize cache size. */
var MAX_MEMOIZE_SIZE = 500;

/**
 * A specialized version of `_.memoize` which clears the memoized function's
 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
 *
 * @private
 * @param {Function} func The function to have its output memoized.
 * @returns {Function} Returns the new memoized function.
 */
function memoizeCapped(func) {
  var result = memoize(func, function(key) {
    if (cache.size === MAX_MEMOIZE_SIZE) {
      cache.clear();
    }
    return key;
  });

  var cache = result.cache;
  return result;
}

module.exports = memoizeCapped;

},{"./memoize":275}],201:[function(require,module,exports){
var composeArgs = require('./_composeArgs'),
    composeArgsRight = require('./_composeArgsRight'),
    replaceHolders = require('./_replaceHolders');

/** Used as the internal argument placeholder. */
var PLACEHOLDER = '__lodash_placeholder__';

/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1,
    WRAP_BIND_KEY_FLAG = 2,
    WRAP_CURRY_BOUND_FLAG = 4,
    WRAP_CURRY_FLAG = 8,
    WRAP_ARY_FLAG = 128,
    WRAP_REARG_FLAG = 256;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMin = Math.min;

/**
 * Merges the function metadata of `source` into `data`.
 *
 * Merging metadata reduces the number of wrappers used to invoke a function.
 * This is possible because methods like `_.bind`, `_.curry`, and `_.partial`
 * may be applied regardless of execution order. Methods like `_.ary` and
 * `_.rearg` modify function arguments, making the order in which they are
 * executed important, preventing the merging of metadata. However, we make
 * an exception for a safe combined case where curried functions have `_.ary`
 * and or `_.rearg` applied.
 *
 * @private
 * @param {Array} data The destination metadata.
 * @param {Array} source The source metadata.
 * @returns {Array} Returns `data`.
 */
function mergeData(data, source) {
  var bitmask = data[1],
      srcBitmask = source[1],
      newBitmask = bitmask | srcBitmask,
      isCommon = newBitmask < (WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG | WRAP_ARY_FLAG);

  var isCombo =
    ((srcBitmask == WRAP_ARY_FLAG) && (bitmask == WRAP_CURRY_FLAG)) ||
    ((srcBitmask == WRAP_ARY_FLAG) && (bitmask == WRAP_REARG_FLAG) && (data[7].length <= source[8])) ||
    ((srcBitmask == (WRAP_ARY_FLAG | WRAP_REARG_FLAG)) && (source[7].length <= source[8]) && (bitmask == WRAP_CURRY_FLAG));

  // Exit early if metadata can't be merged.
  if (!(isCommon || isCombo)) {
    return data;
  }
  // Use source `thisArg` if available.
  if (srcBitmask & WRAP_BIND_FLAG) {
    data[2] = source[2];
    // Set when currying a bound function.
    newBitmask |= bitmask & WRAP_BIND_FLAG ? 0 : WRAP_CURRY_BOUND_FLAG;
  }
  // Compose partial arguments.
  var value = source[3];
  if (value) {
    var partials = data[3];
    data[3] = partials ? composeArgs(partials, value, source[4]) : value;
    data[4] = partials ? replaceHolders(data[3], PLACEHOLDER) : source[4];
  }
  // Compose partial right arguments.
  value = source[5];
  if (value) {
    partials = data[5];
    data[5] = partials ? composeArgsRight(partials, value, source[6]) : value;
    data[6] = partials ? replaceHolders(data[5], PLACEHOLDER) : source[6];
  }
  // Use source `argPos` if available.
  value = source[7];
  if (value) {
    data[7] = value;
  }
  // Use source `ary` if it's smaller.
  if (srcBitmask & WRAP_ARY_FLAG) {
    data[8] = data[8] == null ? source[8] : nativeMin(data[8], source[8]);
  }
  // Use source `arity` if one is not provided.
  if (data[9] == null) {
    data[9] = source[9];
  }
  // Use source `func` and merge bitmasks.
  data[0] = source[0];
  data[1] = newBitmask;

  return data;
}

module.exports = mergeData;

},{"./_composeArgs":123,"./_composeArgsRight":124,"./_replaceHolders":213}],202:[function(require,module,exports){
var WeakMap = require('./_WeakMap');

/** Used to store function metadata. */
var metaMap = WeakMap && new WeakMap;

module.exports = metaMap;

},{"./_WeakMap":49}],203:[function(require,module,exports){
var getNative = require('./_getNative');

/* Built-in method references that are verified to be native. */
var nativeCreate = getNative(Object, 'create');

module.exports = nativeCreate;

},{"./_getNative":160}],204:[function(require,module,exports){
var overArg = require('./_overArg');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = overArg(Object.keys, Object);

module.exports = nativeKeys;

},{"./_overArg":208}],205:[function(require,module,exports){
/**
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}

module.exports = nativeKeysIn;

},{}],206:[function(require,module,exports){
var freeGlobal = require('./_freeGlobal');

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    // Use `util.types` for Node.js 10+.
    var types = freeModule && freeModule.require && freeModule.require('util').types;

    if (types) {
      return types;
    }

    // Legacy `process.binding('util')` for Node.js < 10.
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

module.exports = nodeUtil;

},{"./_freeGlobal":152}],207:[function(require,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

module.exports = objectToString;

},{}],208:[function(require,module,exports){
/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

module.exports = overArg;

},{}],209:[function(require,module,exports){
var apply = require('./_apply');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * A specialized version of `baseRest` which transforms the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @param {Function} transform The rest array transform.
 * @returns {Function} Returns the new function.
 */
function overRest(func, start, transform) {
  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return apply(func, this, otherArgs);
  };
}

module.exports = overRest;

},{"./_apply":50}],210:[function(require,module,exports){
var baseGet = require('./_baseGet'),
    baseSlice = require('./_baseSlice');

/**
 * Gets the parent value at `path` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} path The path to get the parent value of.
 * @returns {*} Returns the parent value.
 */
function parent(object, path) {
  return path.length < 2 ? object : baseGet(object, baseSlice(path, 0, -1));
}

module.exports = parent;

},{"./_baseGet":75,"./_baseSlice":108}],211:[function(require,module,exports){
/** Used to lookup unminified function names. */
var realNames = {};

module.exports = realNames;

},{}],212:[function(require,module,exports){
var copyArray = require('./_copyArray'),
    isIndex = require('./_isIndex');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMin = Math.min;

/**
 * Reorder `array` according to the specified indexes where the element at
 * the first index is assigned as the first element, the element at
 * the second index is assigned as the second element, and so on.
 *
 * @private
 * @param {Array} array The array to reorder.
 * @param {Array} indexes The arranged array indexes.
 * @returns {Array} Returns `array`.
 */
function reorder(array, indexes) {
  var arrLength = array.length,
      length = nativeMin(indexes.length, arrLength),
      oldArray = copyArray(array);

  while (length--) {
    var index = indexes[length];
    array[length] = isIndex(index, arrLength) ? oldArray[index] : undefined;
  }
  return array;
}

module.exports = reorder;

},{"./_copyArray":125,"./_isIndex":180}],213:[function(require,module,exports){
/** Used as the internal argument placeholder. */
var PLACEHOLDER = '__lodash_placeholder__';

/**
 * Replaces all `placeholder` elements in `array` with an internal placeholder
 * and returns an array of their indexes.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {*} placeholder The placeholder to replace.
 * @returns {Array} Returns the new array of placeholder indexes.
 */
function replaceHolders(array, placeholder) {
  var index = -1,
      length = array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (value === placeholder || value === PLACEHOLDER) {
      array[index] = PLACEHOLDER;
      result[resIndex++] = index;
    }
  }
  return result;
}

module.exports = replaceHolders;

},{}],214:[function(require,module,exports){
var freeGlobal = require('./_freeGlobal');

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

module.exports = root;

},{"./_freeGlobal":152}],215:[function(require,module,exports){
/**
 * Gets the value at `key`, unless `key` is "__proto__".
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function safeGet(object, key) {
  if (key == '__proto__') {
    return;
  }

  return object[key];
}

module.exports = safeGet;

},{}],216:[function(require,module,exports){
/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);
  return this;
}

module.exports = setCacheAdd;

},{}],217:[function(require,module,exports){
/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

module.exports = setCacheHas;

},{}],218:[function(require,module,exports){
var baseSetData = require('./_baseSetData'),
    shortOut = require('./_shortOut');

/**
 * Sets metadata for `func`.
 *
 * **Note:** If this function becomes hot, i.e. is invoked a lot in a short
 * period of time, it will trip its breaker and transition to an identity
 * function to avoid garbage collection pauses in V8. See
 * [V8 issue 2070](https://bugs.chromium.org/p/v8/issues/detail?id=2070)
 * for more details.
 *
 * @private
 * @param {Function} func The function to associate metadata with.
 * @param {*} data The metadata.
 * @returns {Function} Returns `func`.
 */
var setData = shortOut(baseSetData);

module.exports = setData;

},{"./_baseSetData":106,"./_shortOut":222}],219:[function(require,module,exports){
/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

module.exports = setToArray;

},{}],220:[function(require,module,exports){
var baseSetToString = require('./_baseSetToString'),
    shortOut = require('./_shortOut');

/**
 * Sets the `toString` method of `func` to return `string`.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var setToString = shortOut(baseSetToString);

module.exports = setToString;

},{"./_baseSetToString":107,"./_shortOut":222}],221:[function(require,module,exports){
var getWrapDetails = require('./_getWrapDetails'),
    insertWrapDetails = require('./_insertWrapDetails'),
    setToString = require('./_setToString'),
    updateWrapDetails = require('./_updateWrapDetails');

/**
 * Sets the `toString` method of `wrapper` to mimic the source of `reference`
 * with wrapper details in a comment at the top of the source body.
 *
 * @private
 * @param {Function} wrapper The function to modify.
 * @param {Function} reference The reference function.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @returns {Function} Returns `wrapper`.
 */
function setWrapToString(wrapper, reference, bitmask) {
  var source = (reference + '');
  return setToString(wrapper, insertWrapDetails(source, updateWrapDetails(getWrapDetails(source), bitmask)));
}

module.exports = setWrapToString;

},{"./_getWrapDetails":167,"./_insertWrapDetails":178,"./_setToString":220,"./_updateWrapDetails":233}],222:[function(require,module,exports){
/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 800,
    HOT_SPAN = 16;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeNow = Date.now;

/**
 * Creates a function that'll short out and invoke `identity` instead
 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
 * milliseconds.
 *
 * @private
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new shortable function.
 */
function shortOut(func) {
  var count = 0,
      lastCalled = 0;

  return function() {
    var stamp = nativeNow(),
        remaining = HOT_SPAN - (stamp - lastCalled);

    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(undefined, arguments);
  };
}

module.exports = shortOut;

},{}],223:[function(require,module,exports){
var ListCache = require('./_ListCache');

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache;
  this.size = 0;
}

module.exports = stackClear;

},{"./_ListCache":39}],224:[function(require,module,exports){
/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

module.exports = stackDelete;

},{}],225:[function(require,module,exports){
/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

module.exports = stackGet;

},{}],226:[function(require,module,exports){
/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

module.exports = stackHas;

},{}],227:[function(require,module,exports){
var ListCache = require('./_ListCache'),
    Map = require('./_Map'),
    MapCache = require('./_MapCache');

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache) {
    var pairs = data.__data__;
    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

module.exports = stackSet;

},{"./_ListCache":39,"./_Map":41,"./_MapCache":42}],228:[function(require,module,exports){
/**
 * A specialized version of `_.indexOf` which performs strict equality
 * comparisons of values, i.e. `===`.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function strictIndexOf(array, value, fromIndex) {
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

module.exports = strictIndexOf;

},{}],229:[function(require,module,exports){
var memoizeCapped = require('./_memoizeCapped');

/** Used to match property names within property paths. */
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = memoizeCapped(function(string) {
  var result = [];
  if (string.charCodeAt(0) === 46 /* . */) {
    result.push('');
  }
  string.replace(rePropName, function(match, number, quote, subString) {
    result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

module.exports = stringToPath;

},{"./_memoizeCapped":200}],230:[function(require,module,exports){
var isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || isSymbol(value)) {
    return value;
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

module.exports = toKey;

},{"./isSymbol":267}],231:[function(require,module,exports){
/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

module.exports = toSource;

},{}],232:[function(require,module,exports){
/** Used to compose unicode character classes. */
var rsAstralRange = '\\ud800-\\udfff',
    rsComboMarksRange = '\\u0300-\\u036f',
    reComboHalfMarksRange = '\\ufe20-\\ufe2f',
    rsComboSymbolsRange = '\\u20d0-\\u20ff',
    rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange,
    rsDingbatRange = '\\u2700-\\u27bf',
    rsLowerRange = 'a-z\\xdf-\\xf6\\xf8-\\xff',
    rsMathOpRange = '\\xac\\xb1\\xd7\\xf7',
    rsNonCharRange = '\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf',
    rsPunctuationRange = '\\u2000-\\u206f',
    rsSpaceRange = ' \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000',
    rsUpperRange = 'A-Z\\xc0-\\xd6\\xd8-\\xde',
    rsVarRange = '\\ufe0e\\ufe0f',
    rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;

/** Used to compose unicode capture groups. */
var rsApos = "['\u2019]",
    rsBreak = '[' + rsBreakRange + ']',
    rsCombo = '[' + rsComboRange + ']',
    rsDigits = '\\d+',
    rsDingbat = '[' + rsDingbatRange + ']',
    rsLower = '[' + rsLowerRange + ']',
    rsMisc = '[^' + rsAstralRange + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + ']',
    rsFitz = '\\ud83c[\\udffb-\\udfff]',
    rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')',
    rsNonAstral = '[^' + rsAstralRange + ']',
    rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}',
    rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]',
    rsUpper = '[' + rsUpperRange + ']',
    rsZWJ = '\\u200d';

/** Used to compose unicode regexes. */
var rsMiscLower = '(?:' + rsLower + '|' + rsMisc + ')',
    rsMiscUpper = '(?:' + rsUpper + '|' + rsMisc + ')',
    rsOptContrLower = '(?:' + rsApos + '(?:d|ll|m|re|s|t|ve))?',
    rsOptContrUpper = '(?:' + rsApos + '(?:D|LL|M|RE|S|T|VE))?',
    reOptMod = rsModifier + '?',
    rsOptVar = '[' + rsVarRange + ']?',
    rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*',
    rsOrdLower = '\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])',
    rsOrdUpper = '\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])',
    rsSeq = rsOptVar + reOptMod + rsOptJoin,
    rsEmoji = '(?:' + [rsDingbat, rsRegional, rsSurrPair].join('|') + ')' + rsSeq;

/** Used to match complex or compound words. */
var reUnicodeWord = RegExp([
  rsUpper + '?' + rsLower + '+' + rsOptContrLower + '(?=' + [rsBreak, rsUpper, '$'].join('|') + ')',
  rsMiscUpper + '+' + rsOptContrUpper + '(?=' + [rsBreak, rsUpper + rsMiscLower, '$'].join('|') + ')',
  rsUpper + '?' + rsMiscLower + '+' + rsOptContrLower,
  rsUpper + '+' + rsOptContrUpper,
  rsOrdUpper,
  rsOrdLower,
  rsDigits,
  rsEmoji
].join('|'), 'g');

/**
 * Splits a Unicode `string` into an array of its words.
 *
 * @private
 * @param {string} The string to inspect.
 * @returns {Array} Returns the words of `string`.
 */
function unicodeWords(string) {
  return string.match(reUnicodeWord) || [];
}

module.exports = unicodeWords;

},{}],233:[function(require,module,exports){
var arrayEach = require('./_arrayEach'),
    arrayIncludes = require('./_arrayIncludes');

/** Used to compose bitmasks for function metadata. */
var WRAP_BIND_FLAG = 1,
    WRAP_BIND_KEY_FLAG = 2,
    WRAP_CURRY_FLAG = 8,
    WRAP_CURRY_RIGHT_FLAG = 16,
    WRAP_PARTIAL_FLAG = 32,
    WRAP_PARTIAL_RIGHT_FLAG = 64,
    WRAP_ARY_FLAG = 128,
    WRAP_REARG_FLAG = 256,
    WRAP_FLIP_FLAG = 512;

/** Used to associate wrap methods with their bit flags. */
var wrapFlags = [
  ['ary', WRAP_ARY_FLAG],
  ['bind', WRAP_BIND_FLAG],
  ['bindKey', WRAP_BIND_KEY_FLAG],
  ['curry', WRAP_CURRY_FLAG],
  ['curryRight', WRAP_CURRY_RIGHT_FLAG],
  ['flip', WRAP_FLIP_FLAG],
  ['partial', WRAP_PARTIAL_FLAG],
  ['partialRight', WRAP_PARTIAL_RIGHT_FLAG],
  ['rearg', WRAP_REARG_FLAG]
];

/**
 * Updates wrapper `details` based on `bitmask` flags.
 *
 * @private
 * @returns {Array} details The details to modify.
 * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
 * @returns {Array} Returns `details`.
 */
function updateWrapDetails(details, bitmask) {
  arrayEach(wrapFlags, function(pair) {
    var value = '_.' + pair[0];
    if ((bitmask & pair[1]) && !arrayIncludes(details, value)) {
      details.push(value);
    }
  });
  return details.sort();
}

module.exports = updateWrapDetails;

},{"./_arrayEach":52,"./_arrayIncludes":54}],234:[function(require,module,exports){
var LazyWrapper = require('./_LazyWrapper'),
    LodashWrapper = require('./_LodashWrapper'),
    copyArray = require('./_copyArray');

/**
 * Creates a clone of `wrapper`.
 *
 * @private
 * @param {Object} wrapper The wrapper to clone.
 * @returns {Object} Returns the cloned wrapper.
 */
function wrapperClone(wrapper) {
  if (wrapper instanceof LazyWrapper) {
    return wrapper.clone();
  }
  var result = new LodashWrapper(wrapper.__wrapped__, wrapper.__chain__);
  result.__actions__ = copyArray(wrapper.__actions__);
  result.__index__  = wrapper.__index__;
  result.__values__ = wrapper.__values__;
  return result;
}

module.exports = wrapperClone;

},{"./_LazyWrapper":38,"./_LodashWrapper":40,"./_copyArray":125}],235:[function(require,module,exports){
var baseSlice = require('./_baseSlice'),
    isIterateeCall = require('./_isIterateeCall'),
    toInteger = require('./toInteger');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeCeil = Math.ceil,
    nativeMax = Math.max;

/**
 * Creates an array of elements split into groups the length of `size`.
 * If `array` can't be split evenly, the final chunk will be the remaining
 * elements.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Array
 * @param {Array} array The array to process.
 * @param {number} [size=1] The length of each chunk
 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
 * @returns {Array} Returns the new array of chunks.
 * @example
 *
 * _.chunk(['a', 'b', 'c', 'd'], 2);
 * // => [['a', 'b'], ['c', 'd']]
 *
 * _.chunk(['a', 'b', 'c', 'd'], 3);
 * // => [['a', 'b', 'c'], ['d']]
 */
function chunk(array, size, guard) {
  if ((guard ? isIterateeCall(array, size, guard) : size === undefined)) {
    size = 1;
  } else {
    size = nativeMax(toInteger(size), 0);
  }
  var length = array == null ? 0 : array.length;
  if (!length || size < 1) {
    return [];
  }
  var index = 0,
      resIndex = 0,
      result = Array(nativeCeil(length / size));

  while (index < length) {
    result[resIndex++] = baseSlice(array, index, (index += size));
  }
  return result;
}

module.exports = chunk;

},{"./_baseSlice":108,"./_isIterateeCall":181,"./toInteger":291}],236:[function(require,module,exports){
var baseClone = require('./_baseClone');

/** Used to compose bitmasks for cloning. */
var CLONE_SYMBOLS_FLAG = 4;

/**
 * Creates a shallow clone of `value`.
 *
 * **Note:** This method is loosely based on the
 * [structured clone algorithm](https://mdn.io/Structured_clone_algorithm)
 * and supports cloning arrays, array buffers, booleans, date objects, maps,
 * numbers, `Object` objects, regexes, sets, strings, symbols, and typed
 * arrays. The own enumerable properties of `arguments` objects are cloned
 * as plain objects. An empty object is returned for uncloneable values such
 * as error objects, functions, DOM nodes, and WeakMaps.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to clone.
 * @returns {*} Returns the cloned value.
 * @see _.cloneDeep
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var shallow = _.clone(objects);
 * console.log(shallow[0] === objects[0]);
 * // => true
 */
function clone(value) {
  return baseClone(value, CLONE_SYMBOLS_FLAG);
}

module.exports = clone;

},{"./_baseClone":68}],237:[function(require,module,exports){
var baseClone = require('./_baseClone');

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG = 1,
    CLONE_SYMBOLS_FLAG = 4;

/**
 * This method is like `_.clone` except that it recursively clones `value`.
 *
 * @static
 * @memberOf _
 * @since 1.0.0
 * @category Lang
 * @param {*} value The value to recursively clone.
 * @returns {*} Returns the deep cloned value.
 * @see _.clone
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var deep = _.cloneDeep(objects);
 * console.log(deep[0] === objects[0]);
 * // => false
 */
function cloneDeep(value) {
  return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
}

module.exports = cloneDeep;

},{"./_baseClone":68}],238:[function(require,module,exports){
var arrayPush = require('./_arrayPush'),
    baseFlatten = require('./_baseFlatten'),
    copyArray = require('./_copyArray'),
    isArray = require('./isArray');

/**
 * Creates a new array concatenating `array` with any additional arrays
 * and/or values.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Array
 * @param {Array} array The array to concatenate.
 * @param {...*} [values] The values to concatenate.
 * @returns {Array} Returns the new concatenated array.
 * @example
 *
 * var array = [1];
 * var other = _.concat(array, 2, [3], [[4]]);
 *
 * console.log(other);
 * // => [1, 2, 3, [4]]
 *
 * console.log(array);
 * // => [1]
 */
function concat() {
  var length = arguments.length;
  if (!length) {
    return [];
  }
  var args = Array(length - 1),
      array = arguments[0],
      index = length;

  while (index--) {
    args[index - 1] = arguments[index];
  }
  return arrayPush(isArray(array) ? copyArray(array) : [array], baseFlatten(args, 1));
}

module.exports = concat;

},{"./_arrayPush":57,"./_baseFlatten":72,"./_copyArray":125,"./isArray":254}],239:[function(require,module,exports){
/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant(value) {
  return function() {
    return value;
  };
}

module.exports = constant;

},{}],240:[function(require,module,exports){
var deburrLetter = require('./_deburrLetter'),
    toString = require('./toString');

/** Used to match Latin Unicode letters (excluding mathematical operators). */
var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;

/** Used to compose unicode character classes. */
var rsComboMarksRange = '\\u0300-\\u036f',
    reComboHalfMarksRange = '\\ufe20-\\ufe2f',
    rsComboSymbolsRange = '\\u20d0-\\u20ff',
    rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange;

/** Used to compose unicode capture groups. */
var rsCombo = '[' + rsComboRange + ']';

/**
 * Used to match [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks) and
 * [combining diacritical marks for symbols](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks_for_Symbols).
 */
var reComboMark = RegExp(rsCombo, 'g');

/**
 * Deburrs `string` by converting
 * [Latin-1 Supplement](https://en.wikipedia.org/wiki/Latin-1_Supplement_(Unicode_block)#Character_table)
 * and [Latin Extended-A](https://en.wikipedia.org/wiki/Latin_Extended-A)
 * letters to basic Latin letters and removing
 * [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks).
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to deburr.
 * @returns {string} Returns the deburred string.
 * @example
 *
 * _.deburr('déjà vu');
 * // => 'deja vu'
 */
function deburr(string) {
  string = toString(string);
  return string && string.replace(reLatin, deburrLetter).replace(reComboMark, '');
}

module.exports = deburr;

},{"./_deburrLetter":146,"./toString":294}],241:[function(require,module,exports){
var baseRest = require('./_baseRest'),
    eq = require('./eq'),
    isIterateeCall = require('./_isIterateeCall'),
    keysIn = require('./keysIn');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Assigns own and inherited enumerable string keyed properties of source
 * objects to the destination object for all destination properties that
 * resolve to `undefined`. Source objects are applied from left to right.
 * Once a property is set, additional values of the same property are ignored.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @see _.defaultsDeep
 * @example
 *
 * _.defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 });
 * // => { 'a': 1, 'b': 2 }
 */
var defaults = baseRest(function(object, sources) {
  object = Object(object);

  var index = -1;
  var length = sources.length;
  var guard = length > 2 ? sources[2] : undefined;

  if (guard && isIterateeCall(sources[0], sources[1], guard)) {
    length = 1;
  }

  while (++index < length) {
    var source = sources[index];
    var props = keysIn(source);
    var propsIndex = -1;
    var propsLength = props.length;

    while (++propsIndex < propsLength) {
      var key = props[propsIndex];
      var value = object[key];

      if (value === undefined ||
          (eq(value, objectProto[key]) && !hasOwnProperty.call(object, key))) {
        object[key] = source[key];
      }
    }
  }

  return object;
});

module.exports = defaults;

},{"./_baseRest":104,"./_isIterateeCall":181,"./eq":243,"./keysIn":271}],242:[function(require,module,exports){
var apply = require('./_apply'),
    baseRest = require('./_baseRest'),
    customDefaultsMerge = require('./_customDefaultsMerge'),
    mergeWith = require('./mergeWith');

/**
 * This method is like `_.defaults` except that it recursively assigns
 * default properties.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 3.10.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @see _.defaults
 * @example
 *
 * _.defaultsDeep({ 'a': { 'b': 2 } }, { 'a': { 'b': 1, 'c': 3 } });
 * // => { 'a': { 'b': 2, 'c': 3 } }
 */
var defaultsDeep = baseRest(function(args) {
  args.push(undefined, customDefaultsMerge);
  return apply(mergeWith, undefined, args);
});

module.exports = defaultsDeep;

},{"./_apply":50,"./_baseRest":104,"./_customDefaultsMerge":144,"./mergeWith":277}],243:[function(require,module,exports){
/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

module.exports = eq;

},{}],244:[function(require,module,exports){
var createFind = require('./_createFind'),
    findIndex = require('./findIndex');

/**
 * Iterates over elements of `collection`, returning the first element
 * `predicate` returns truthy for. The predicate is invoked with three
 * arguments: (value, index|key, collection).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to inspect.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @param {number} [fromIndex=0] The index to search from.
 * @returns {*} Returns the matched element, else `undefined`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'age': 36, 'active': true },
 *   { 'user': 'fred',    'age': 40, 'active': false },
 *   { 'user': 'pebbles', 'age': 1,  'active': true }
 * ];
 *
 * _.find(users, function(o) { return o.age < 40; });
 * // => object for 'barney'
 *
 * // The `_.matches` iteratee shorthand.
 * _.find(users, { 'age': 1, 'active': true });
 * // => object for 'pebbles'
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.find(users, ['active', false]);
 * // => object for 'fred'
 *
 * // The `_.property` iteratee shorthand.
 * _.find(users, 'active');
 * // => object for 'barney'
 */
var find = createFind(findIndex);

module.exports = find;

},{"./_createFind":139,"./findIndex":245}],245:[function(require,module,exports){
var baseFindIndex = require('./_baseFindIndex'),
    baseIteratee = require('./_baseIteratee'),
    toInteger = require('./toInteger');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * This method is like `_.find` except that it returns the index of the first
 * element `predicate` returns truthy for instead of the element itself.
 *
 * @static
 * @memberOf _
 * @since 1.1.0
 * @category Array
 * @param {Array} array The array to inspect.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @param {number} [fromIndex=0] The index to search from.
 * @returns {number} Returns the index of the found element, else `-1`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'active': false },
 *   { 'user': 'fred',    'active': false },
 *   { 'user': 'pebbles', 'active': true }
 * ];
 *
 * _.findIndex(users, function(o) { return o.user == 'barney'; });
 * // => 0
 *
 * // The `_.matches` iteratee shorthand.
 * _.findIndex(users, { 'user': 'fred', 'active': false });
 * // => 1
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.findIndex(users, ['active', false]);
 * // => 0
 *
 * // The `_.property` iteratee shorthand.
 * _.findIndex(users, 'active');
 * // => 2
 */
function findIndex(array, predicate, fromIndex) {
  var length = array == null ? 0 : array.length;
  if (!length) {
    return -1;
  }
  var index = fromIndex == null ? 0 : toInteger(fromIndex);
  if (index < 0) {
    index = nativeMax(length + index, 0);
  }
  return baseFindIndex(array, baseIteratee(predicate, 3), index);
}

module.exports = findIndex;

},{"./_baseFindIndex":71,"./_baseIteratee":89,"./toInteger":291}],246:[function(require,module,exports){
var baseFlatten = require('./_baseFlatten');

/**
 * Flattens `array` a single level deep.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to flatten.
 * @returns {Array} Returns the new flattened array.
 * @example
 *
 * _.flatten([1, [2, [3, [4]], 5]]);
 * // => [1, 2, [3, [4]], 5]
 */
function flatten(array) {
  var length = array == null ? 0 : array.length;
  return length ? baseFlatten(array, 1) : [];
}

module.exports = flatten;

},{"./_baseFlatten":72}],247:[function(require,module,exports){
var arrayEach = require('./_arrayEach'),
    baseEach = require('./_baseEach'),
    castFunction = require('./_castFunction'),
    isArray = require('./isArray');

/**
 * Iterates over elements of `collection` and invokes `iteratee` for each element.
 * The iteratee is invoked with three arguments: (value, index|key, collection).
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * **Note:** As with other "Collections" methods, objects with a "length"
 * property are iterated like arrays. To avoid this behavior use `_.forIn`
 * or `_.forOwn` for object iteration.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @alias each
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 * @see _.forEachRight
 * @example
 *
 * _.forEach([1, 2], function(value) {
 *   console.log(value);
 * });
 * // => Logs `1` then `2`.
 *
 * _.forEach({ 'a': 1, 'b': 2 }, function(value, key) {
 *   console.log(key);
 * });
 * // => Logs 'a' then 'b' (iteration order is not guaranteed).
 */
function forEach(collection, iteratee) {
  var func = isArray(collection) ? arrayEach : baseEach;
  return func(collection, castFunction(iteratee));
}

module.exports = forEach;

},{"./_arrayEach":52,"./_baseEach":70,"./_castFunction":115,"./isArray":254}],248:[function(require,module,exports){
var baseForOwn = require('./_baseForOwn'),
    castFunction = require('./_castFunction');

/**
 * Iterates over own enumerable string keyed properties of an object and
 * invokes `iteratee` for each property. The iteratee is invoked with three
 * arguments: (value, key, object). Iteratee functions may exit iteration
 * early by explicitly returning `false`.
 *
 * @static
 * @memberOf _
 * @since 0.3.0
 * @category Object
 * @param {Object} object The object to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Object} Returns `object`.
 * @see _.forOwnRight
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.forOwn(new Foo, function(value, key) {
 *   console.log(key);
 * });
 * // => Logs 'a' then 'b' (iteration order is not guaranteed).
 */
function forOwn(object, iteratee) {
  return object && baseForOwn(object, castFunction(iteratee));
}

module.exports = forOwn;

},{"./_baseForOwn":74,"./_castFunction":115}],249:[function(require,module,exports){
var baseGet = require('./_baseGet');

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.get(object, 'a[0].b.c');
 * // => 3
 *
 * _.get(object, ['a', '0', 'b', 'c']);
 * // => 3
 *
 * _.get(object, 'a.b.c', 'default');
 * // => 'default'
 */
function get(object, path, defaultValue) {
  var result = object == null ? undefined : baseGet(object, path);
  return result === undefined ? defaultValue : result;
}

module.exports = get;

},{"./_baseGet":75}],250:[function(require,module,exports){
var baseHasIn = require('./_baseHasIn'),
    hasPath = require('./_hasPath');

/**
 * Checks if `path` is a direct or inherited property of `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 * @example
 *
 * var object = _.create({ 'a': _.create({ 'b': 2 }) });
 *
 * _.hasIn(object, 'a');
 * // => true
 *
 * _.hasIn(object, 'a.b');
 * // => true
 *
 * _.hasIn(object, ['a', 'b']);
 * // => true
 *
 * _.hasIn(object, 'b');
 * // => false
 */
function hasIn(object, path) {
  return object != null && hasPath(object, path, baseHasIn);
}

module.exports = hasIn;

},{"./_baseHasIn":78,"./_hasPath":168}],251:[function(require,module,exports){
/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;

},{}],252:[function(require,module,exports){
var baseIndexOf = require('./_baseIndexOf'),
    isArrayLike = require('./isArrayLike'),
    isString = require('./isString'),
    toInteger = require('./toInteger'),
    values = require('./values');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Checks if `value` is in `collection`. If `collection` is a string, it's
 * checked for a substring of `value`, otherwise
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * is used for equality comparisons. If `fromIndex` is negative, it's used as
 * the offset from the end of `collection`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object|string} collection The collection to inspect.
 * @param {*} value The value to search for.
 * @param {number} [fromIndex=0] The index to search from.
 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.reduce`.
 * @returns {boolean} Returns `true` if `value` is found, else `false`.
 * @example
 *
 * _.includes([1, 2, 3], 1);
 * // => true
 *
 * _.includes([1, 2, 3], 1, 2);
 * // => false
 *
 * _.includes({ 'a': 1, 'b': 2 }, 1);
 * // => true
 *
 * _.includes('abcd', 'bc');
 * // => true
 */
function includes(collection, value, fromIndex, guard) {
  collection = isArrayLike(collection) ? collection : values(collection);
  fromIndex = (fromIndex && !guard) ? toInteger(fromIndex) : 0;

  var length = collection.length;
  if (fromIndex < 0) {
    fromIndex = nativeMax(length + fromIndex, 0);
  }
  return isString(collection)
    ? (fromIndex <= length && collection.indexOf(value, fromIndex) > -1)
    : (!!length && baseIndexOf(collection, value, fromIndex) > -1);
}

module.exports = includes;

},{"./_baseIndexOf":79,"./isArrayLike":255,"./isString":266,"./toInteger":291,"./values":295}],253:[function(require,module,exports){
var baseIsArguments = require('./_baseIsArguments'),
    isObjectLike = require('./isObjectLike');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
  return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

module.exports = isArguments;

},{"./_baseIsArguments":80,"./isObjectLike":263}],254:[function(require,module,exports){
/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

module.exports = isArray;

},{}],255:[function(require,module,exports){
var isFunction = require('./isFunction'),
    isLength = require('./isLength');

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

module.exports = isArrayLike;

},{"./isFunction":259,"./isLength":260}],256:[function(require,module,exports){
var isArrayLike = require('./isArrayLike'),
    isObjectLike = require('./isObjectLike');

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

module.exports = isArrayLikeObject;

},{"./isArrayLike":255,"./isObjectLike":263}],257:[function(require,module,exports){
var root = require('./_root'),
    stubFalse = require('./stubFalse');

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

module.exports = isBuffer;

},{"./_root":214,"./stubFalse":289}],258:[function(require,module,exports){
var baseKeys = require('./_baseKeys'),
    getTag = require('./_getTag'),
    isArguments = require('./isArguments'),
    isArray = require('./isArray'),
    isArrayLike = require('./isArrayLike'),
    isBuffer = require('./isBuffer'),
    isPrototype = require('./_isPrototype'),
    isTypedArray = require('./isTypedArray');

/** `Object#toString` result references. */
var mapTag = '[object Map]',
    setTag = '[object Set]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Checks if `value` is an empty object, collection, map, or set.
 *
 * Objects are considered empty if they have no own enumerable string keyed
 * properties.
 *
 * Array-like values such as `arguments` objects, arrays, buffers, strings, or
 * jQuery-like collections are considered empty if they have a `length` of `0`.
 * Similarly, maps and sets are considered empty if they have a `size` of `0`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is empty, else `false`.
 * @example
 *
 * _.isEmpty(null);
 * // => true
 *
 * _.isEmpty(true);
 * // => true
 *
 * _.isEmpty(1);
 * // => true
 *
 * _.isEmpty([1, 2, 3]);
 * // => false
 *
 * _.isEmpty({ 'a': 1 });
 * // => false
 */
function isEmpty(value) {
  if (value == null) {
    return true;
  }
  if (isArrayLike(value) &&
      (isArray(value) || typeof value == 'string' || typeof value.splice == 'function' ||
        isBuffer(value) || isTypedArray(value) || isArguments(value))) {
    return !value.length;
  }
  var tag = getTag(value);
  if (tag == mapTag || tag == setTag) {
    return !value.size;
  }
  if (isPrototype(value)) {
    return !baseKeys(value).length;
  }
  for (var key in value) {
    if (hasOwnProperty.call(value, key)) {
      return false;
    }
  }
  return true;
}

module.exports = isEmpty;

},{"./_baseKeys":90,"./_getTag":165,"./_isPrototype":186,"./isArguments":253,"./isArray":254,"./isArrayLike":255,"./isBuffer":257,"./isTypedArray":268}],259:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isObject = require('./isObject');

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

module.exports = isFunction;

},{"./_baseGetTag":77,"./isObject":262}],260:[function(require,module,exports){
/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

},{}],261:[function(require,module,exports){
var baseIsMap = require('./_baseIsMap'),
    baseUnary = require('./_baseUnary'),
    nodeUtil = require('./_nodeUtil');

/* Node.js helper references. */
var nodeIsMap = nodeUtil && nodeUtil.isMap;

/**
 * Checks if `value` is classified as a `Map` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
 * @example
 *
 * _.isMap(new Map);
 * // => true
 *
 * _.isMap(new WeakMap);
 * // => false
 */
var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;

module.exports = isMap;

},{"./_baseIsMap":83,"./_baseUnary":111,"./_nodeUtil":206}],262:[function(require,module,exports){
/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],263:[function(require,module,exports){
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],264:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    getPrototype = require('./_getPrototype'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
    funcToString.call(Ctor) == objectCtorString;
}

module.exports = isPlainObject;

},{"./_baseGetTag":77,"./_getPrototype":161,"./isObjectLike":263}],265:[function(require,module,exports){
var baseIsSet = require('./_baseIsSet'),
    baseUnary = require('./_baseUnary'),
    nodeUtil = require('./_nodeUtil');

/* Node.js helper references. */
var nodeIsSet = nodeUtil && nodeUtil.isSet;

/**
 * Checks if `value` is classified as a `Set` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
 * @example
 *
 * _.isSet(new Set);
 * // => true
 *
 * _.isSet(new WeakSet);
 * // => false
 */
var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;

module.exports = isSet;

},{"./_baseIsSet":87,"./_baseUnary":111,"./_nodeUtil":206}],266:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isArray = require('./isArray'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var stringTag = '[object String]';

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a string, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString(value) {
  return typeof value == 'string' ||
    (!isArray(value) && isObjectLike(value) && baseGetTag(value) == stringTag);
}

module.exports = isString;

},{"./_baseGetTag":77,"./isArray":254,"./isObjectLike":263}],267:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && baseGetTag(value) == symbolTag);
}

module.exports = isSymbol;

},{"./_baseGetTag":77,"./isObjectLike":263}],268:[function(require,module,exports){
var baseIsTypedArray = require('./_baseIsTypedArray'),
    baseUnary = require('./_baseUnary'),
    nodeUtil = require('./_nodeUtil');

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

module.exports = isTypedArray;

},{"./_baseIsTypedArray":88,"./_baseUnary":111,"./_nodeUtil":206}],269:[function(require,module,exports){
var baseAssignValue = require('./_baseAssignValue'),
    createAggregator = require('./_createAggregator');

/**
 * Creates an object composed of keys generated from the results of running
 * each element of `collection` thru `iteratee`. The corresponding value of
 * each key is the last element responsible for generating the key. The
 * iteratee is invoked with one argument: (value).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The iteratee to transform keys.
 * @returns {Object} Returns the composed aggregate object.
 * @example
 *
 * var array = [
 *   { 'dir': 'left', 'code': 97 },
 *   { 'dir': 'right', 'code': 100 }
 * ];
 *
 * _.keyBy(array, function(o) {
 *   return String.fromCharCode(o.code);
 * });
 * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
 *
 * _.keyBy(array, 'dir');
 * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
 */
var keyBy = createAggregator(function(result, value, key) {
  baseAssignValue(result, key, value);
});

module.exports = keyBy;

},{"./_baseAssignValue":67,"./_createAggregator":131}],270:[function(require,module,exports){
var arrayLikeKeys = require('./_arrayLikeKeys'),
    baseKeys = require('./_baseKeys'),
    isArrayLike = require('./isArrayLike');

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

module.exports = keys;

},{"./_arrayLikeKeys":55,"./_baseKeys":90,"./isArrayLike":255}],271:[function(require,module,exports){
var arrayLikeKeys = require('./_arrayLikeKeys'),
    baseKeysIn = require('./_baseKeysIn'),
    isArrayLike = require('./isArrayLike');

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
}

module.exports = keysIn;

},{"./_arrayLikeKeys":55,"./_baseKeysIn":91,"./isArrayLike":255}],272:[function(require,module,exports){
/**
 * Gets the last element of `array`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to query.
 * @returns {*} Returns the last element of `array`.
 * @example
 *
 * _.last([1, 2, 3]);
 * // => 3
 */
function last(array) {
  var length = array == null ? 0 : array.length;
  return length ? array[length - 1] : undefined;
}

module.exports = last;

},{}],273:[function(require,module,exports){
var arrayMap = require('./_arrayMap'),
    baseIteratee = require('./_baseIteratee'),
    baseMap = require('./_baseMap'),
    isArray = require('./isArray');

/**
 * Creates an array of values by running each element in `collection` thru
 * `iteratee`. The iteratee is invoked with three arguments:
 * (value, index|key, collection).
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
 *
 * The guarded methods are:
 * `ary`, `chunk`, `curry`, `curryRight`, `drop`, `dropRight`, `every`,
 * `fill`, `invert`, `parseInt`, `random`, `range`, `rangeRight`, `repeat`,
 * `sampleSize`, `slice`, `some`, `sortBy`, `split`, `take`, `takeRight`,
 * `template`, `trim`, `trimEnd`, `trimStart`, and `words`
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 * @example
 *
 * function square(n) {
 *   return n * n;
 * }
 *
 * _.map([4, 8], square);
 * // => [16, 64]
 *
 * _.map({ 'a': 4, 'b': 8 }, square);
 * // => [16, 64] (iteration order is not guaranteed)
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * // The `_.property` iteratee shorthand.
 * _.map(users, 'user');
 * // => ['barney', 'fred']
 */
function map(collection, iteratee) {
  var func = isArray(collection) ? arrayMap : baseMap;
  return func(collection, baseIteratee(iteratee, 3));
}

module.exports = map;

},{"./_arrayMap":56,"./_baseIteratee":89,"./_baseMap":93,"./isArray":254}],274:[function(require,module,exports){
var baseAssignValue = require('./_baseAssignValue'),
    baseForOwn = require('./_baseForOwn'),
    baseIteratee = require('./_baseIteratee');

/**
 * Creates an object with the same keys as `object` and values generated
 * by running each own enumerable string keyed property of `object` thru
 * `iteratee`. The iteratee is invoked with three arguments:
 * (value, key, object).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Object
 * @param {Object} object The object to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Object} Returns the new mapped object.
 * @see _.mapKeys
 * @example
 *
 * var users = {
 *   'fred':    { 'user': 'fred',    'age': 40 },
 *   'pebbles': { 'user': 'pebbles', 'age': 1 }
 * };
 *
 * _.mapValues(users, function(o) { return o.age; });
 * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
 *
 * // The `_.property` iteratee shorthand.
 * _.mapValues(users, 'age');
 * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
 */
function mapValues(object, iteratee) {
  var result = {};
  iteratee = baseIteratee(iteratee, 3);

  baseForOwn(object, function(value, key, object) {
    baseAssignValue(result, key, iteratee(value, key, object));
  });
  return result;
}

module.exports = mapValues;

},{"./_baseAssignValue":67,"./_baseForOwn":74,"./_baseIteratee":89}],275:[function(require,module,exports){
var MapCache = require('./_MapCache');

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache);
  return memoized;
}

// Expose `MapCache`.
memoize.Cache = MapCache;

module.exports = memoize;

},{"./_MapCache":42}],276:[function(require,module,exports){
var baseMerge = require('./_baseMerge'),
    createAssigner = require('./_createAssigner');

/**
 * This method is like `_.assign` except that it recursively merges own and
 * inherited enumerable string keyed properties of source objects into the
 * destination object. Source properties that resolve to `undefined` are
 * skipped if a destination value exists. Array and plain object properties
 * are merged recursively. Other objects and value types are overridden by
 * assignment. Source objects are applied from left to right. Subsequent
 * sources overwrite property assignments of previous sources.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 0.5.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = {
 *   'a': [{ 'b': 2 }, { 'd': 4 }]
 * };
 *
 * var other = {
 *   'a': [{ 'c': 3 }, { 'e': 5 }]
 * };
 *
 * _.merge(object, other);
 * // => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
 */
var merge = createAssigner(function(object, source, srcIndex) {
  baseMerge(object, source, srcIndex);
});

module.exports = merge;

},{"./_baseMerge":96,"./_createAssigner":132}],277:[function(require,module,exports){
var baseMerge = require('./_baseMerge'),
    createAssigner = require('./_createAssigner');

/**
 * This method is like `_.merge` except that it accepts `customizer` which
 * is invoked to produce the merged values of the destination and source
 * properties. If `customizer` returns `undefined`, merging is handled by the
 * method instead. The `customizer` is invoked with six arguments:
 * (objValue, srcValue, key, object, source, stack).
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} sources The source objects.
 * @param {Function} customizer The function to customize assigned values.
 * @returns {Object} Returns `object`.
 * @example
 *
 * function customizer(objValue, srcValue) {
 *   if (_.isArray(objValue)) {
 *     return objValue.concat(srcValue);
 *   }
 * }
 *
 * var object = { 'a': [1], 'b': [2] };
 * var other = { 'a': [3], 'b': [4] };
 *
 * _.mergeWith(object, other, customizer);
 * // => { 'a': [1, 3], 'b': [2, 4] }
 */
var mergeWith = createAssigner(function(object, source, srcIndex, customizer) {
  baseMerge(object, source, srcIndex, customizer);
});

module.exports = mergeWith;

},{"./_baseMerge":96,"./_createAssigner":132}],278:[function(require,module,exports){
/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that negates the result of the predicate `func`. The
 * `func` predicate is invoked with the `this` binding and arguments of the
 * created function.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Function
 * @param {Function} predicate The predicate to negate.
 * @returns {Function} Returns the new negated function.
 * @example
 *
 * function isEven(n) {
 *   return n % 2 == 0;
 * }
 *
 * _.filter([1, 2, 3, 4, 5, 6], _.negate(isEven));
 * // => [1, 3, 5]
 */
function negate(predicate) {
  if (typeof predicate != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  return function() {
    var args = arguments;
    switch (args.length) {
      case 0: return !predicate.call(this);
      case 1: return !predicate.call(this, args[0]);
      case 2: return !predicate.call(this, args[0], args[1]);
      case 3: return !predicate.call(this, args[0], args[1], args[2]);
    }
    return !predicate.apply(this, args);
  };
}

module.exports = negate;

},{}],279:[function(require,module,exports){
/**
 * This method returns `undefined`.
 *
 * @static
 * @memberOf _
 * @since 2.3.0
 * @category Util
 * @example
 *
 * _.times(2, _.noop);
 * // => [undefined, undefined]
 */
function noop() {
  // No operation performed.
}

module.exports = noop;

},{}],280:[function(require,module,exports){
var arrayMap = require('./_arrayMap'),
    baseClone = require('./_baseClone'),
    baseUnset = require('./_baseUnset'),
    castPath = require('./_castPath'),
    copyObject = require('./_copyObject'),
    customOmitClone = require('./_customOmitClone'),
    flatRest = require('./_flatRest'),
    getAllKeysIn = require('./_getAllKeysIn');

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG = 1,
    CLONE_FLAT_FLAG = 2,
    CLONE_SYMBOLS_FLAG = 4;

/**
 * The opposite of `_.pick`; this method creates an object composed of the
 * own and inherited enumerable property paths of `object` that are not omitted.
 *
 * **Note:** This method is considerably slower than `_.pick`.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The source object.
 * @param {...(string|string[])} [paths] The property paths to omit.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.omit(object, ['a', 'c']);
 * // => { 'b': '2' }
 */
var omit = flatRest(function(object, paths) {
  var result = {};
  if (object == null) {
    return result;
  }
  var isDeep = false;
  paths = arrayMap(paths, function(path) {
    path = castPath(path, object);
    isDeep || (isDeep = path.length > 1);
    return path;
  });
  copyObject(object, getAllKeysIn(object), result);
  if (isDeep) {
    result = baseClone(result, CLONE_DEEP_FLAG | CLONE_FLAT_FLAG | CLONE_SYMBOLS_FLAG, customOmitClone);
  }
  var length = paths.length;
  while (length--) {
    baseUnset(result, paths[length]);
  }
  return result;
});

module.exports = omit;

},{"./_arrayMap":56,"./_baseClone":68,"./_baseUnset":112,"./_castPath":116,"./_copyObject":126,"./_customOmitClone":145,"./_flatRest":151,"./_getAllKeysIn":154}],281:[function(require,module,exports){
var baseIteratee = require('./_baseIteratee'),
    negate = require('./negate'),
    pickBy = require('./pickBy');

/**
 * The opposite of `_.pickBy`; this method creates an object composed of
 * the own and inherited enumerable string keyed properties of `object` that
 * `predicate` doesn't return truthy for. The predicate is invoked with two
 * arguments: (value, key).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The source object.
 * @param {Function} [predicate=_.identity] The function invoked per property.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.omitBy(object, _.isNumber);
 * // => { 'b': '2' }
 */
function omitBy(object, predicate) {
  return pickBy(object, negate(baseIteratee(predicate)));
}

module.exports = omitBy;

},{"./_baseIteratee":89,"./negate":278,"./pickBy":284}],282:[function(require,module,exports){
var baseRest = require('./_baseRest'),
    createWrap = require('./_createWrap'),
    getHolder = require('./_getHolder'),
    replaceHolders = require('./_replaceHolders');

/** Used to compose bitmasks for function metadata. */
var WRAP_PARTIAL_FLAG = 32;

/**
 * Creates a function that invokes `func` with `partials` prepended to the
 * arguments it receives. This method is like `_.bind` except it does **not**
 * alter the `this` binding.
 *
 * The `_.partial.placeholder` value, which defaults to `_` in monolithic
 * builds, may be used as a placeholder for partially applied arguments.
 *
 * **Note:** This method doesn't set the "length" property of partially
 * applied functions.
 *
 * @static
 * @memberOf _
 * @since 0.2.0
 * @category Function
 * @param {Function} func The function to partially apply arguments to.
 * @param {...*} [partials] The arguments to be partially applied.
 * @returns {Function} Returns the new partially applied function.
 * @example
 *
 * function greet(greeting, name) {
 *   return greeting + ' ' + name;
 * }
 *
 * var sayHelloTo = _.partial(greet, 'hello');
 * sayHelloTo('fred');
 * // => 'hello fred'
 *
 * // Partially applied with placeholders.
 * var greetFred = _.partial(greet, _, 'fred');
 * greetFred('hi');
 * // => 'hi fred'
 */
var partial = baseRest(function(func, partials) {
  var holders = replaceHolders(partials, getHolder(partial));
  return createWrap(func, WRAP_PARTIAL_FLAG, undefined, partials, holders);
});

// Assign default placeholders.
partial.placeholder = {};

module.exports = partial;

},{"./_baseRest":104,"./_createWrap":143,"./_getHolder":157,"./_replaceHolders":213}],283:[function(require,module,exports){
var basePick = require('./_basePick'),
    flatRest = require('./_flatRest');

/**
 * Creates an object composed of the picked `object` properties.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The source object.
 * @param {...(string|string[])} [paths] The property paths to pick.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.pick(object, ['a', 'c']);
 * // => { 'a': 1, 'c': 3 }
 */
var pick = flatRest(function(object, paths) {
  return object == null ? {} : basePick(object, paths);
});

module.exports = pick;

},{"./_basePick":98,"./_flatRest":151}],284:[function(require,module,exports){
var arrayMap = require('./_arrayMap'),
    baseIteratee = require('./_baseIteratee'),
    basePickBy = require('./_basePickBy'),
    getAllKeysIn = require('./_getAllKeysIn');

/**
 * Creates an object composed of the `object` properties `predicate` returns
 * truthy for. The predicate is invoked with two arguments: (value, key).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The source object.
 * @param {Function} [predicate=_.identity] The function invoked per property.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'a': 1, 'b': '2', 'c': 3 };
 *
 * _.pickBy(object, _.isNumber);
 * // => { 'a': 1, 'c': 3 }
 */
function pickBy(object, predicate) {
  if (object == null) {
    return {};
  }
  var props = arrayMap(getAllKeysIn(object), function(prop) {
    return [prop];
  });
  predicate = baseIteratee(predicate);
  return basePickBy(object, props, function(value, path) {
    return predicate(value, path[0]);
  });
}

module.exports = pickBy;

},{"./_arrayMap":56,"./_baseIteratee":89,"./_basePickBy":99,"./_getAllKeysIn":154}],285:[function(require,module,exports){
var baseProperty = require('./_baseProperty'),
    basePropertyDeep = require('./_basePropertyDeep'),
    isKey = require('./_isKey'),
    toKey = require('./_toKey');

/**
 * Creates a function that returns the value at `path` of a given object.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': 2 } },
 *   { 'a': { 'b': 1 } }
 * ];
 *
 * _.map(objects, _.property('a.b'));
 * // => [2, 1]
 *
 * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
 * // => [1, 2]
 */
function property(path) {
  return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
}

module.exports = property;

},{"./_baseProperty":100,"./_basePropertyDeep":101,"./_isKey":182,"./_toKey":230}],286:[function(require,module,exports){
var baseIteratee = require('./_baseIteratee'),
    basePullAt = require('./_basePullAt');

/**
 * Removes all elements from `array` that `predicate` returns truthy for
 * and returns an array of the removed elements. The predicate is invoked
 * with three arguments: (value, index, array).
 *
 * **Note:** Unlike `_.filter`, this method mutates `array`. Use `_.pull`
 * to pull elements from an array by value.
 *
 * @static
 * @memberOf _
 * @since 2.0.0
 * @category Array
 * @param {Array} array The array to modify.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @returns {Array} Returns the new array of removed elements.
 * @example
 *
 * var array = [1, 2, 3, 4];
 * var evens = _.remove(array, function(n) {
 *   return n % 2 == 0;
 * });
 *
 * console.log(array);
 * // => [1, 3]
 *
 * console.log(evens);
 * // => [2, 4]
 */
function remove(array, predicate) {
  var result = [];
  if (!(array && array.length)) {
    return result;
  }
  var index = -1,
      indexes = [],
      length = array.length;

  predicate = baseIteratee(predicate, 3);
  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result.push(value);
      indexes.push(index);
    }
  }
  basePullAt(array, indexes);
  return result;
}

module.exports = remove;

},{"./_baseIteratee":89,"./_basePullAt":103}],287:[function(require,module,exports){
var createCompounder = require('./_createCompounder');

/**
 * Converts `string` to
 * [snake case](https://en.wikipedia.org/wiki/Snake_case).
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to convert.
 * @returns {string} Returns the snake cased string.
 * @example
 *
 * _.snakeCase('Foo Bar');
 * // => 'foo_bar'
 *
 * _.snakeCase('fooBar');
 * // => 'foo_bar'
 *
 * _.snakeCase('--FOO-BAR--');
 * // => 'foo_bar'
 */
var snakeCase = createCompounder(function(result, word, index) {
  return result + (index ? '_' : '') + word.toLowerCase();
});

module.exports = snakeCase;

},{"./_createCompounder":136}],288:[function(require,module,exports){
/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

module.exports = stubArray;

},{}],289:[function(require,module,exports){
/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

module.exports = stubFalse;

},{}],290:[function(require,module,exports){
var toNumber = require('./toNumber');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0,
    MAX_INTEGER = 1.7976931348623157e+308;

/**
 * Converts `value` to a finite number.
 *
 * @static
 * @memberOf _
 * @since 4.12.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted number.
 * @example
 *
 * _.toFinite(3.2);
 * // => 3.2
 *
 * _.toFinite(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toFinite(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toFinite('3.2');
 * // => 3.2
 */
function toFinite(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber(value);
  if (value === INFINITY || value === -INFINITY) {
    var sign = (value < 0 ? -1 : 1);
    return sign * MAX_INTEGER;
  }
  return value === value ? value : 0;
}

module.exports = toFinite;

},{"./toNumber":292}],291:[function(require,module,exports){
var toFinite = require('./toFinite');

/**
 * Converts `value` to an integer.
 *
 * **Note:** This method is loosely based on
 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3.2);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3.2');
 * // => 3
 */
function toInteger(value) {
  var result = toFinite(value),
      remainder = result % 1;

  return result === result ? (remainder ? result - remainder : result) : 0;
}

module.exports = toInteger;

},{"./toFinite":290}],292:[function(require,module,exports){
var isObject = require('./isObject'),
    isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = toNumber;

},{"./isObject":262,"./isSymbol":267}],293:[function(require,module,exports){
var copyObject = require('./_copyObject'),
    keysIn = require('./keysIn');

/**
 * Converts `value` to a plain object flattening inherited enumerable string
 * keyed properties of `value` to own properties of the plain object.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {Object} Returns the converted plain object.
 * @example
 *
 * function Foo() {
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.assign({ 'a': 1 }, new Foo);
 * // => { 'a': 1, 'b': 2 }
 *
 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
 * // => { 'a': 1, 'b': 2, 'c': 3 }
 */
function toPlainObject(value) {
  return copyObject(value, keysIn(value));
}

module.exports = toPlainObject;

},{"./_copyObject":126,"./keysIn":271}],294:[function(require,module,exports){
var baseToString = require('./_baseToString');

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

module.exports = toString;

},{"./_baseToString":110}],295:[function(require,module,exports){
var baseValues = require('./_baseValues'),
    keys = require('./keys');

/**
 * Creates an array of the own enumerable string keyed property values of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property values.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.values(new Foo);
 * // => [1, 2] (iteration order is not guaranteed)
 *
 * _.values('hi');
 * // => ['h', 'i']
 */
function values(object) {
  return object == null ? [] : baseValues(object, keys(object));
}

module.exports = values;

},{"./_baseValues":113,"./keys":270}],296:[function(require,module,exports){
var asciiWords = require('./_asciiWords'),
    hasUnicodeWord = require('./_hasUnicodeWord'),
    toString = require('./toString'),
    unicodeWords = require('./_unicodeWords');

/**
 * Splits `string` into an array of its words.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to inspect.
 * @param {RegExp|string} [pattern] The pattern to match words.
 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
 * @returns {Array} Returns the words of `string`.
 * @example
 *
 * _.words('fred, barney, & pebbles');
 * // => ['fred', 'barney', 'pebbles']
 *
 * _.words('fred, barney, & pebbles', /[^, ]+/g);
 * // => ['fred', 'barney', '&', 'pebbles']
 */
function words(string, pattern, guard) {
  string = toString(string);
  pattern = guard ? undefined : pattern;

  if (pattern === undefined) {
    return hasUnicodeWord(string) ? unicodeWords(string) : asciiWords(string);
  }
  return string.match(pattern) || [];
}

module.exports = words;

},{"./_asciiWords":60,"./_hasUnicodeWord":169,"./_unicodeWords":232,"./toString":294}],297:[function(require,module,exports){
var LazyWrapper = require('./_LazyWrapper'),
    LodashWrapper = require('./_LodashWrapper'),
    baseLodash = require('./_baseLodash'),
    isArray = require('./isArray'),
    isObjectLike = require('./isObjectLike'),
    wrapperClone = require('./_wrapperClone');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates a `lodash` object which wraps `value` to enable implicit method
 * chain sequences. Methods that operate on and return arrays, collections,
 * and functions can be chained together. Methods that retrieve a single value
 * or may return a primitive value will automatically end the chain sequence
 * and return the unwrapped value. Otherwise, the value must be unwrapped
 * with `_#value`.
 *
 * Explicit chain sequences, which must be unwrapped with `_#value`, may be
 * enabled using `_.chain`.
 *
 * The execution of chained methods is lazy, that is, it's deferred until
 * `_#value` is implicitly or explicitly called.
 *
 * Lazy evaluation allows several methods to support shortcut fusion.
 * Shortcut fusion is an optimization to merge iteratee calls; this avoids
 * the creation of intermediate arrays and can greatly reduce the number of
 * iteratee executions. Sections of a chain sequence qualify for shortcut
 * fusion if the section is applied to an array and iteratees accept only
 * one argument. The heuristic for whether a section qualifies for shortcut
 * fusion is subject to change.
 *
 * Chaining is supported in custom builds as long as the `_#value` method is
 * directly or indirectly included in the build.
 *
 * In addition to lodash methods, wrappers have `Array` and `String` methods.
 *
 * The wrapper `Array` methods are:
 * `concat`, `join`, `pop`, `push`, `shift`, `sort`, `splice`, and `unshift`
 *
 * The wrapper `String` methods are:
 * `replace` and `split`
 *
 * The wrapper methods that support shortcut fusion are:
 * `at`, `compact`, `drop`, `dropRight`, `dropWhile`, `filter`, `find`,
 * `findLast`, `head`, `initial`, `last`, `map`, `reject`, `reverse`, `slice`,
 * `tail`, `take`, `takeRight`, `takeRightWhile`, `takeWhile`, and `toArray`
 *
 * The chainable wrapper methods are:
 * `after`, `ary`, `assign`, `assignIn`, `assignInWith`, `assignWith`, `at`,
 * `before`, `bind`, `bindAll`, `bindKey`, `castArray`, `chain`, `chunk`,
 * `commit`, `compact`, `concat`, `conforms`, `constant`, `countBy`, `create`,
 * `curry`, `debounce`, `defaults`, `defaultsDeep`, `defer`, `delay`,
 * `difference`, `differenceBy`, `differenceWith`, `drop`, `dropRight`,
 * `dropRightWhile`, `dropWhile`, `extend`, `extendWith`, `fill`, `filter`,
 * `flatMap`, `flatMapDeep`, `flatMapDepth`, `flatten`, `flattenDeep`,
 * `flattenDepth`, `flip`, `flow`, `flowRight`, `fromPairs`, `functions`,
 * `functionsIn`, `groupBy`, `initial`, `intersection`, `intersectionBy`,
 * `intersectionWith`, `invert`, `invertBy`, `invokeMap`, `iteratee`, `keyBy`,
 * `keys`, `keysIn`, `map`, `mapKeys`, `mapValues`, `matches`, `matchesProperty`,
 * `memoize`, `merge`, `mergeWith`, `method`, `methodOf`, `mixin`, `negate`,
 * `nthArg`, `omit`, `omitBy`, `once`, `orderBy`, `over`, `overArgs`,
 * `overEvery`, `overSome`, `partial`, `partialRight`, `partition`, `pick`,
 * `pickBy`, `plant`, `property`, `propertyOf`, `pull`, `pullAll`, `pullAllBy`,
 * `pullAllWith`, `pullAt`, `push`, `range`, `rangeRight`, `rearg`, `reject`,
 * `remove`, `rest`, `reverse`, `sampleSize`, `set`, `setWith`, `shuffle`,
 * `slice`, `sort`, `sortBy`, `splice`, `spread`, `tail`, `take`, `takeRight`,
 * `takeRightWhile`, `takeWhile`, `tap`, `throttle`, `thru`, `toArray`,
 * `toPairs`, `toPairsIn`, `toPath`, `toPlainObject`, `transform`, `unary`,
 * `union`, `unionBy`, `unionWith`, `uniq`, `uniqBy`, `uniqWith`, `unset`,
 * `unshift`, `unzip`, `unzipWith`, `update`, `updateWith`, `values`,
 * `valuesIn`, `without`, `wrap`, `xor`, `xorBy`, `xorWith`, `zip`,
 * `zipObject`, `zipObjectDeep`, and `zipWith`
 *
 * The wrapper methods that are **not** chainable by default are:
 * `add`, `attempt`, `camelCase`, `capitalize`, `ceil`, `clamp`, `clone`,
 * `cloneDeep`, `cloneDeepWith`, `cloneWith`, `conformsTo`, `deburr`,
 * `defaultTo`, `divide`, `each`, `eachRight`, `endsWith`, `eq`, `escape`,
 * `escapeRegExp`, `every`, `find`, `findIndex`, `findKey`, `findLast`,
 * `findLastIndex`, `findLastKey`, `first`, `floor`, `forEach`, `forEachRight`,
 * `forIn`, `forInRight`, `forOwn`, `forOwnRight`, `get`, `gt`, `gte`, `has`,
 * `hasIn`, `head`, `identity`, `includes`, `indexOf`, `inRange`, `invoke`,
 * `isArguments`, `isArray`, `isArrayBuffer`, `isArrayLike`, `isArrayLikeObject`,
 * `isBoolean`, `isBuffer`, `isDate`, `isElement`, `isEmpty`, `isEqual`,
 * `isEqualWith`, `isError`, `isFinite`, `isFunction`, `isInteger`, `isLength`,
 * `isMap`, `isMatch`, `isMatchWith`, `isNaN`, `isNative`, `isNil`, `isNull`,
 * `isNumber`, `isObject`, `isObjectLike`, `isPlainObject`, `isRegExp`,
 * `isSafeInteger`, `isSet`, `isString`, `isUndefined`, `isTypedArray`,
 * `isWeakMap`, `isWeakSet`, `join`, `kebabCase`, `last`, `lastIndexOf`,
 * `lowerCase`, `lowerFirst`, `lt`, `lte`, `max`, `maxBy`, `mean`, `meanBy`,
 * `min`, `minBy`, `multiply`, `noConflict`, `noop`, `now`, `nth`, `pad`,
 * `padEnd`, `padStart`, `parseInt`, `pop`, `random`, `reduce`, `reduceRight`,
 * `repeat`, `result`, `round`, `runInContext`, `sample`, `shift`, `size`,
 * `snakeCase`, `some`, `sortedIndex`, `sortedIndexBy`, `sortedLastIndex`,
 * `sortedLastIndexBy`, `startCase`, `startsWith`, `stubArray`, `stubFalse`,
 * `stubObject`, `stubString`, `stubTrue`, `subtract`, `sum`, `sumBy`,
 * `template`, `times`, `toFinite`, `toInteger`, `toJSON`, `toLength`,
 * `toLower`, `toNumber`, `toSafeInteger`, `toString`, `toUpper`, `trim`,
 * `trimEnd`, `trimStart`, `truncate`, `unescape`, `uniqueId`, `upperCase`,
 * `upperFirst`, `value`, and `words`
 *
 * @name _
 * @constructor
 * @category Seq
 * @param {*} value The value to wrap in a `lodash` instance.
 * @returns {Object} Returns the new `lodash` wrapper instance.
 * @example
 *
 * function square(n) {
 *   return n * n;
 * }
 *
 * var wrapped = _([1, 2, 3]);
 *
 * // Returns an unwrapped value.
 * wrapped.reduce(_.add);
 * // => 6
 *
 * // Returns a wrapped value.
 * var squares = wrapped.map(square);
 *
 * _.isArray(squares);
 * // => false
 *
 * _.isArray(squares.value());
 * // => true
 */
function lodash(value) {
  if (isObjectLike(value) && !isArray(value) && !(value instanceof LazyWrapper)) {
    if (value instanceof LodashWrapper) {
      return value;
    }
    if (hasOwnProperty.call(value, '__wrapped__')) {
      return wrapperClone(value);
    }
  }
  return new LodashWrapper(value);
}

// Ensure wrappers are instances of `baseLodash`.
lodash.prototype = baseLodash.prototype;
lodash.prototype.constructor = lodash;

module.exports = lodash;

},{"./_LazyWrapper":38,"./_LodashWrapper":40,"./_baseLodash":92,"./_wrapperClone":234,"./isArray":254,"./isObjectLike":263}],298:[function(require,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = { nextTick: nextTick };
} else {
  module.exports = process
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}


}).call(this,require('_process'))
},{"_process":299}],299:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],300:[function(require,module,exports){
'use strict';
var handlers;

var wrap = function (target) {
  if (typeof target === 'object' && target && typeof target.then === 'function' && typeof Proxy !== 'undefined') {
    // The target needs to be stored internally as a function, so that it can use the `apply` and `construct` handlers.
    var targetFunc = function () {
      return target;
    };
    targetFunc._promise_chain_cache = Object.create(null);
    return new Proxy(targetFunc, handlers);
  }
  return target;
};

if (typeof Proxy !== 'undefined') {
  if (typeof Reflect === 'undefined') {
    require('harmony-reflect');
  }
  handlers = {
    get: function (target, property) {
      if (property === 'inspect') {
        return function () {
          return '[chainable Promise]';
        };
      }
      if (property === '_raw') {
        return target();
      }
      if (typeof property === 'symbol') {
        return target()[property];
      }
      // If the Promise itself has the property ('then', 'catch', etc.), return the property itself, bound to the target.
      // However, wrap the result of calling this function. This allows wrappedPromise.then(something) to also be wrapped.
      if (property in target()) {
        if (property !== 'constructor' && !property.startsWith('_') && typeof target()[property] === 'function') {
          return function () {
            return wrap(target()[property].apply(target(), arguments));
          };
        }
        return target()[property];
      }
      // If the property has a value in the cache, use that value.
      if (Object.prototype.hasOwnProperty.call(target._promise_chain_cache, property)) {
        return target._promise_chain_cache[property];
      }
      // If the Promise library allows synchronous inspection (bluebird, etc.), ensure that properties of resolved
      // Promises are also resolved immediately.
      if (target().isFulfilled && target().isFulfilled() && typeof target().value === 'function') {
        return wrap(target().constructor.resolve(target().value()[property]));
      }
      // Otherwise, return a promise for that property.
      // Store it in the cache so that subsequent references to that property will return the same promise.
      target._promise_chain_cache[property] = wrap(target().then(function (result) {
        if (result && (typeof result === 'object' || typeof result === 'function')) {
          return wrap(result[property]);
        }
        throw new TypeError("Promise chain rejection: Cannot read property '" + property + "' of " + result + '.');
      }));
      return target._promise_chain_cache[property];
    },
    apply: function (target, thisArg, args) {
      // If the wrapped Promise is called, return a Promise that calls the result
      return wrap(target().constructor.all([target(), thisArg]).then(function (results) {
        if (typeof results[0] === 'function') {
          return wrap(Reflect.apply(results[0], results[1], args));
        }
        throw new TypeError('Promise chain rejection: Attempted to call ' + results[0] + ' which is not a function.');
      }));
    },
    construct: function (target, args) {
      return wrap(target().then(function (result) {
        return wrap(Reflect.construct(result, args));
      }));
    }
  };

  // Make sure all other references to the proxied object refer to the promise itself, not the function wrapping it
  Object.getOwnPropertyNames(Reflect).forEach(function (handler) {
    handlers[handler] = handlers[handler] || function (target, arg1, arg2, arg3) {
      return Reflect[handler](target(), arg1, arg2, arg3);
    };
  });
}

module.exports = wrap;

},{"harmony-reflect":27}],301:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],302:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],303:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":301,"./encode":302}],304:[function(require,module,exports){
module.exports = require('./lib/_stream_duplex.js');

},{"./lib/_stream_duplex.js":305}],305:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

{
  // avoid scope creep, the keys array can then be collected
  var keys = objectKeys(Writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  pna.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  pna.nextTick(cb, err);
};
},{"./_stream_readable":307,"./_stream_writable":309,"core-util-is":30,"inherits":33,"process-nextick-args":298}],306:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":308,"core-util-is":30,"inherits":33}],307:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Readable;

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = require('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = require('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = require('./internal/streams/BufferList');
var destroyImpl = require('./internal/streams/destroy');
var StringDecoder;

util.inherits(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var readableHwm = options.readableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    pna.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        pna.nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    pna.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;

  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._readableState.highWaterMark;
  }
});

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    pna.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./_stream_duplex":305,"./internal/streams/BufferList":310,"./internal/streams/destroy":311,"./internal/streams/stream":312,"_process":299,"core-util-is":30,"events":31,"inherits":33,"isarray":35,"process-nextick-args":298,"safe-buffer":317,"string_decoder/":319,"util":27}],308:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return this.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);

  cb(er);

  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function') {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this2 = this;

  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this2.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":305,"core-util-is":30,"inherits":33}],309:[function(require,module,exports){
(function (process,global,setImmediate){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

var destroyImpl = require('./internal/streams/destroy');

util.inherits(Writable, Stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var writableHwm = options.writableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  pna.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    pna.nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    pna.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    pna.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      pna.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("timers").setImmediate)
},{"./_stream_duplex":305,"./internal/streams/destroy":311,"./internal/streams/stream":312,"_process":299,"core-util-is":30,"inherits":33,"process-nextick-args":298,"safe-buffer":317,"timers":320,"util-deprecate":323}],310:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = require('safe-buffer').Buffer;
var util = require('util');

function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

if (util && util.inspect && util.inspect.custom) {
  module.exports.prototype[util.inspect.custom] = function () {
    var obj = util.inspect({ length: this.length });
    return this.constructor.name + ' ' + obj;
  };
}
},{"safe-buffer":317,"util":27}],311:[function(require,module,exports){
'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      pna.nextTick(emitErrorNT, this, err);
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      pna.nextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });

  return this;
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};
},{"process-nextick-args":298}],312:[function(require,module,exports){
module.exports = require('events').EventEmitter;

},{"events":31}],313:[function(require,module,exports){
module.exports = require('./readable').PassThrough

},{"./readable":314}],314:[function(require,module,exports){
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":305,"./lib/_stream_passthrough.js":306,"./lib/_stream_readable.js":307,"./lib/_stream_transform.js":308,"./lib/_stream_writable.js":309}],315:[function(require,module,exports){
module.exports = require('./readable').Transform

},{"./readable":314}],316:[function(require,module,exports){
module.exports = require('./lib/_stream_writable.js');

},{"./lib/_stream_writable.js":309}],317:[function(require,module,exports){
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":29}],318:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":31,"inherits":33,"readable-stream/duplex.js":304,"readable-stream/passthrough.js":313,"readable-stream/readable.js":314,"readable-stream/transform.js":315,"readable-stream/writable.js":316}],319:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":317}],320:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":299,"timers":320}],321:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":322,"punycode":28,"querystring":303}],322:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],323:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[23]);
