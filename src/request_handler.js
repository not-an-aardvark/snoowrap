import {includes, merge} from 'lodash';
import Promise from './Promise.js';
import {IDEMPOTENT_HTTP_VERBS, MAX_TOKEN_LATENCY} from './constants.js';
import {rateLimitWarning, RateLimitError} from './errors.js';

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
export function oauthRequest (options, attempts = 1) {
  return Promise.resolve()
    .then(() => this._awaitRatelimit())
    .then(() => this._awaitRequestDelay())
    .then(() => this.updateAccessToken())
    .then(token => {
      return this.rawRequest(merge({
        json: true,
        headers: {'user-agent': this.userAgent},
        baseUrl: `https://oauth.${this._config.endpointDomain}`,
        qs: {raw_json: 1},
        auth: {bearer: token},
        resolveWithFullResponse: true,
        timeout: this._config.requestTimeout,
        transform: (body, response) => {
          if (Object.prototype.hasOwnProperty.call(response.headers, 'x-ratelimit-remaining')) {
            this.ratelimitRemaining = +response.headers['x-ratelimit-remaining'];
            this.ratelimitExpiration = Date.now() + (response.headers['x-ratelimit-reset'] * 1000);
          }
          this._debug(
            `Received a ${response.statusCode} status code from a \`${response.request.method}\` request`,
            `sent to ${response.request.uri.href}. ratelimitRemaining: ${this.ratelimitRemaining}`
          );
          return response;
        }
      }, options));
    }).then(response => {
      const populated = this._populate(response.body);
      if (populated && populated.constructor._name === 'Listing') {
        populated._setUri(response.request.uri.href);
      }
      return populated;
    }).catch(...this._config.retryErrorCodes.map(retryCode => ({statusCode: retryCode})), e => {
      if (!includes(IDEMPOTENT_HTTP_VERBS, e.response.request.method) || attempts >= this._config.maxRetryAttempts) {
        throw e;
      }
      /* If the error's status code is in the user's configured `retryStatusCodes` and this request still has attempts
      remaining, retry this request and increment the `attempts` counter. */
      this._warn(
        `Received status code ${e.statusCode} from reddit.`,
        `Retrying request (attempt ${attempts + 1}/${this._config.maxRetryAttempts})...`
      );
      return this.oauthRequest(options, attempts + 1);
    }).catch({statusCode: 401}, e => {
      /* If the server returns a 401 error, it's possible that the access token expired during the latency period as this
      request was being sent. In this scenario, snoowrap thought that the access token was valid for a few more seconds, so it
      didn't refresh the token, but the token had expired by the time the request reached the server. To handle this issue,
      invalidate the access token and call oauth_request again, automatically causing the token to be refreshed. */
      if (this.accessToken && this.tokenExpiration - Date.now() < MAX_TOKEN_LATENCY) {
        this.accessToken = null;
        this.tokenExpiration = null;
        return this.oauthRequest(options, attempts);
      }
      throw e;
    });
}

export function _awaitRatelimit () {
  if (this.ratelimitRemaining < 1 && Date.now() < this.ratelimitExpiration) {
    // If the ratelimit has been exceeded, delay or abort the request depending on the user's config.
    const timeUntilExpiry = this.ratelimitExpiration - Date.now();
    if (this._config.continueAfterRatelimitError) {
      /* If the `continue_after_ratelimit_error` setting is enabled, queue the request, wait until the next ratelimit
      period, and then send it. */
      this._warn(rateLimitWarning(timeUntilExpiry));
      return Promise.delay(timeUntilExpiry);
    }
    // Otherwise, throw an error.
    throw new RateLimitError(timeUntilExpiry);
  }
  // If the ratelimit hasn't been exceeded, no delay is necessary.
  return Promise.resolve();
}

export function _awaitRequestDelay () {
  const now = Date.now();
  const waitTime = this._nextRequestTimestamp - now;
  this._nextRequestTimestamp = Math.max(now, this._nextRequestTimestamp) + this._config.requestDelay;
  return Promise.delay(waitTime);
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
export function credentialedClientRequest (options) {
  const requestFunc = this.rawRequest || rawRequest;
  return Promise.resolve(requestFunc.call(this, merge({
    json: true,
    auth: {user: this.clientId || this.client_id || '', pass: this.clientSecret || this.client_secret || ''},
    headers: {'user-agent': this.userAgent},
    baseUrl: this._config ? `https://www.${this._config.endpointDomain}` : undefined
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
export function unauthenticatedRequest (options) {
  return Promise.resolve(this.rawRequest(merge({
    json: true,
    headers: {'user-agent': this.userAgent},
    baseUrl: `https://www.${this._config.endpointDomain}`
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
export function updateAccessToken () {
  // If the current access token is missing or expired, and it is possible to get a new one, do so.
  if ((!this.accessToken || Date.now() > this.tokenExpiration) && (this.refreshToken || (this.username && this.password))) {
    return this.credentialedClientRequest({
      method: 'post',
      uri: 'api/v1/access_token',
      form: this.refreshToken
        ? {grant_type: 'refresh_token', refresh_token: this.refreshToken}
        : {grant_type: 'password', username: this.username, password: this.password}
    }).then(tokenInfo => {
      this.accessToken = tokenInfo.access_token;
      this.tokenExpiration = Date.now() + (tokenInfo.expires_in * 1000);
      this.scope = tokenInfo.scope.split(' ');
      return this.accessToken;
    });
  }
  // Otherwise, just return the existing token.
  return Promise.resolve(this.accessToken);
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
export const rawRequest = typeof XMLHttpRequest !== 'undefined'
  ? require('./xhr')
  : require('request-promise').defaults({gzip: true});
