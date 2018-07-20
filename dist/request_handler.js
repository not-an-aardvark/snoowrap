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