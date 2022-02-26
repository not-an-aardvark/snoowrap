import {includes, merge} from 'lodash';
import {IDEMPOTENT_HTTP_VERBS, MAX_TOKEN_LATENCY} from './constants';
import {rateLimitWarning, RateLimitError} from './errors';

/**
* @summary Sends an oauth-authenticated request to the reddit server, and returns the server's response.
* @desc **Note**: While this function primarily exists for internal use, it is exposed and considered a stable feature.
* However, keep in mind that there are usually better alternatives to using this function. For instance, this
* function can be used to send a POST request to the 'api/vote' endpoint in order to upvote a comment, but it's generally
* easier to just use snoowrap's [upvote function]{@link VoteableContent#upvote}.
*
* If you're using this function to access an API feature/endpoint that is unsupported by snoowrap, please consider [creating an
* issue for it](https://github.com/not-an-aardvark/snoowrap/issues) so that the functionality can be added to snoowrap more
* directly.
* @param {object} options Options for the request. See {@link snoowrap#rawRequest} for more details. A default `baseURL` parameter
* of `this._config.endpoint_domain` is internally included by default, so it is recommended that a relative `url` parameter be used,
* rather than an absolute `url` parameter with a domain name.
* @returns {Promise} A Promise that fulfills with reddit's response.
* @memberof snoowrap
* @instance
* @example
*
* r.oauthRequest({url: '/user/spez/about', method: 'get'}).then(console.log)
* // => RedditUser { name: 'spez', link_karma: 9567, ... }
*
* // Note that this is equivalent to:
* r.getUser('spez').fetch().then(console.log)
*
* // ######
*
* r.oauthRequest({url: '/api/vote', method: 'post', form: {dir: 1, id: 't3_4fzg2k'}})
* // equivalent to:
* r.getSubmission('4fzg2k').upvote()
*
* // ######
*
* r.oauthRequest({url: '/top', method: 'get', params: {t: 'all'}})
* // equivalent to:
* r.getTop({time: 'all'})
*/
export async function oauthRequest (options, attempts = 1) {
  try {
    await this._awaitRatelimit();
    await this._awaitRequestDelay();
    await _awaitExponentialBackoff(attempts);
    const token = await this.updateAccessToken();
    const response = await this.rawRequest(merge({
      baseURL: `https://oauth.${this._config.endpointDomain}`,
      headers: {
        authorization: `Bearer ${token}`,
        'user-agent': this.userAgent
      },
      params: {
        raw_json: 1
      },
      timeout: this._config.requestTimeout,
      _r: this
    }, options));
    if (response.headers['x-ratelimit-remaining']) {
      this.ratelimitRemaining = +response.headers['x-ratelimit-remaining'];
      this.ratelimitExpiration = Date.now() + (response.headers['x-ratelimit-reset'] * 1000);
    }
    this._debug(
      `Received a ${response.status} status code from a \`${response.config.method}\` request`,
      `sent to ${response.config.url}. ratelimitRemaining: ${this.ratelimitRemaining}`
    );
    const populated = this._populate(response.data);
    if (populated && populated.constructor._name === 'Listing') {
      populated._setUri(response.config.url);
    }
    return populated;
  } catch (e) {
    this._debug('Error:', {e});
    if (e.response && this._config.retryErrorCodes.some(retryCode => retryCode === e.response.status)) {
      if (!includes(IDEMPOTENT_HTTP_VERBS, e.config.method) || attempts >= this._config.maxRetryAttempts) {
        throw e;
      }
      /* If the error's status code is in the user's configured `retryStatusCodes` and this request still has attempts
      remaining, retry this request and increment the `attempts` counter. */
      this._warn(
        `Received status code ${e.response.status} from reddit.`,
        `Retrying request (attempt ${attempts + 1}/${this._config.maxRetryAttempts})...`
      );
      return this.oauthRequest(options, attempts + 1);
    } else if (e.response && e.response.status === 401) {
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
    } else {
      throw e;
    }
  }
}

export function _awaitRatelimit () {
  if (this.ratelimitRemaining < 1 && Date.now() < this.ratelimitExpiration) {
    // If the ratelimit has been exceeded, delay or abort the request depending on the user's config.
    const timeUntilExpiry = this.ratelimitExpiration - Date.now();
    if (this._config.continueAfterRatelimitError) {
      /* If the `continue_after_ratelimit_error` setting is enabled, queue the request, wait until the next ratelimit
      period, and then send it. */
      this._warn(rateLimitWarning(timeUntilExpiry));
      return new Promise(resolve => setTimeout(resolve, timeUntilExpiry));
    }
    // Otherwise, throw an error.
    throw new RateLimitError(timeUntilExpiry);
  }
  // If the ratelimit hasn't been exceeded, no delay is necessary.
}

export function _awaitRequestDelay () {
  const now = Date.now();
  const waitTime = this._nextRequestTimestamp - now;
  this._nextRequestTimestamp = Math.max(now, this._nextRequestTimestamp) + this._config.requestDelay;
  return new Promise(resolve => setTimeout(resolve, waitTime));
}

export function _awaitExponentialBackoff (attempts) {
  if (attempts === 1) {
    return;
  }
  const waitTime = (Math.pow(2, attempts - 1) + (Math.random() - 0.3)) * 1000;
  return new Promise(resolve => setTimeout(resolve, waitTime));
}

/**
* @summary Sends a request to the reddit server, authenticated with the user's client ID and client secret.
* @desc **Note**: This is used internally as part of the authentication process, but it cannot be used to actually fetch
* content from reddit. To do that, use {@link snoowrap#oauthRequest} or another of snoowrap's helper functions.
*
* This function can work with alternate `this`-bindings, provided that the binding has the `clientId`, `clientSecret`, and
* `userAgent` properties. This allows it be used if no snoowrap requester has been created yet.
* @param {object|string} options Options for the request; See {@link snoowrap#rawRequest} for more details.
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
  baseURL: 'https://www.reddit.com',
  url: 'api/v1/access_token',
  form: {grant_type: 'authorization_code', code: 'code goes here', redirect_uri: 'redirect uri goes here'}
}).then(response => {
  //handle response here
})
* @memberof snoowrap
* @instance
*/
export function credentialedClientRequest (options) {
  const requestFunc = this.rawRequest || rawRequest;
  return requestFunc.call(this, merge({
    baseURL: this._config ? `https://www.${this._config.endpointDomain}` : undefined,
    headers: {
      'user-agent': this.userAgent
    },
    auth: {
      username: this.clientId || this.client_id || '',
      password: this.clientSecret || this.client_secret || ''
    },
    _r: this
  }, options));
}

/**
* @summary Sends a request to the reddit server without authentication.
* @param {object} options Options for the request; See {@link snoowrap#rawRequest} for more details.
* @returns {Promise} The response from the reddit server
* @memberof snoowrap
* @instance
*/
export function unauthenticatedRequest (options) {
  return this.rawRequest(merge({
    baseURL: `https://www.${this._config.endpointDomain}`,
    headers: {
      'user-agent': this.userAgent
    },
    _r: this
  }, options));
}

/**
* @summary Updates this requester's access token if the current one is absent or expired.
* @desc **Note**: This function is automatically called internally when making a request. While the function is exposed as
* a stable feature, using it is rarely necessary unless an access token is needed for some external purpose, or to test
* the validity of the refresh token.
* @returns {Promise} A Promise that fulfills with the access token when this request is complete
* @memberof snoowrap
* @instance
* @example r.updateAccessToken()
*/
export async function updateAccessToken () {
  // If the current access token is missing or expired, and it is possible to get a new one, do so.
  if ((!this.accessToken || Date.now() > this.tokenExpiration) && (this.refreshToken || (this.username && this.password))) {
    const response = await this.credentialedClientRequest({
      method: 'post',
      url: 'api/v1/access_token',
      form: this.refreshToken
        ? {grant_type: 'refresh_token', refresh_token: this.refreshToken}
        : {grant_type: 'password', username: this.username, password: this.password}
    });
    const tokenInfo = response.data;
    if (tokenInfo.error === 'invalid_grant') {
      throw new Error('"Invalid grant" error returned from reddit. (You might have incorrect credentials.)');
    } else if (tokenInfo.error_description !== undefined) {
      throw new Error(`Reddit returned an error: ${tokenInfo.error}: ${tokenInfo.error_description}`);
    } else if (tokenInfo.error !== undefined) {
      throw new Error(`Reddit returned an error: ${tokenInfo.error}`);
    }
    this.accessToken = tokenInfo.access_token;
    this.tokenExpiration = Date.now() + (tokenInfo.expires_in * 1000);
    this.scope = tokenInfo.scope.split(' ');
    return this.accessToken;
  }
  // Otherwise, just return the existing token.
  return this.accessToken;
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
* the original. This method is based on the API of the [axios](https://www.npmjs.com/package/axios) library, so if you do create
* a subclass, it might be helpful to use `axios` internally. This will ensure that the API works correctly, so that you don't
* have to reimplement this function's API from scratch.
*
* Also, it's recommended to use `axios` [interceptors](https://axios-http.com/docs/interceptors) which provide a simplified way
* for requests/responses customization without having to create a shadowed version of this method.
*
* Originally, snoowrap used to depend on the deprecated [request-promise](https://www.npmjs.com/package/request-promise) library,
* it has been replaced with `axios` which has a different API. For a maximum backward compatibility, this method simulates some
* `request-promise` functionalities, some of them are marked as deprecated and it's recommended to use the `axios` equivalents
* instead.
* @param {object} options Options for the request. For documentation and more information about these options, see the
* [axios API](https://axios-http.com/docs/req_config).
* @param {string} options.baseURL The base URL that a request should be sent to.
* @param {string} options.url The URL that a request should be sent to, using the provided `baseURL`.
* @param {string} options.method='GET' Method for the request.
* @param {object} options.headers Headers for the request.
* @param {object} [options.params] Querystring parameters for the request.
* @param {object} [options.formData] Multipart form data for the request. If provided, the `Content-Type: multipart/form-data`
* header is set, and the provided object is serialized as multipart form data. This is ignored for GET requests.
* @param {object} [options.form] Form data for the request. If provided, the `Content-Type: application/x-www-form-urlencoded`
* header is set, and the provided object is serialized into URL-encoded form data in the request body. This is ignored for GET
* requests, or of `options.formData` is provided.
* @param {object} [options.data] The body of the request. Generally `axios` automatically handle this for you, it sets
* the `Content-Type` header based on the input. This is ignored for GET requests, or of `options.form` or `options.formData`
* are provided.
* @param {string} [options.baseUrl] Deprecated: use `options.baseURL` instead.
* @param {string} [options.uri] Deprecated: use `options.url` instead.
* @param {object} [options.qs] Deprecated: use `options.params` instead. Using both will combine their properties. Note that
* properties from `options.params` will override properties from `options.qs` having the same name.
* @param {object} [options.body] Deprecated: use `options.data` instead.
* @returns {Promise} A Promise for a response object. The Promise should be fulfilled if the status code is between 200 and 299,
* inclusive, and reject otherwise. A response object has 6 properties: `status` (number) the status code of the response, `statusText`
* (string) the status message of the response, `data` (object) the body of the response, `headers` (object) the parsed response
* headers, `request` (object) the request that generated the response, ClientRequest on node.js and XMLHttpRequest on browser
* and `config` (object) the object that was provided to `axios` to create the request.
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
* const axios = require('axios');
*
* class AnotherSnoowrapSubclass extends snoowrap {
*   rawRequest(options) {
*     // send all requests through a proxy
*     return axios({...options, proxy: { protocol: 'https', host: 'example.com', port: 443 }})
*   }
* }
*/
export const rawRequest = require('./axios');
