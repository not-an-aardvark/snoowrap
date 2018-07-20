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