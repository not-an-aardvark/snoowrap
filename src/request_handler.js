import {includes} from 'lodash';
import Promise from 'bluebird';
import request_promise from 'request-promise';
import {IDEMPOTENT_HTTP_VERBS, MAX_TOKEN_LATENCY} from './constants.js';
import {RateLimitWarning, RateLimitError} from './errors.js';
const request = request_promise.defaults({json: true, gzip: true});

/**
* @summary Sends an oauth-authenticated request to the reddit server, and returns the server's response.
* @desc **Note**: While this function primarily exists for internal use, it is exposed and considered a stable feature.
However, keep in mind that there are usually better alternatives to using this function. For instance, this
function can be used to send a POST request to the 'api/vote' endpoint in order to upvote a comment, but it's generally
easier to just use snoowrap's [upvote function]{@link VoteableContent#upvote}.
* @param {object|string} options Options for the request. These options will be passed directly to the
[Request API](https://www.npmjs.com/package/request). A default `baseUrl` parameter of `this.config().endpoint_domain` is
internally included by default, so it is recommended that a `uri` parameter be used, rather than a `url` parameter with a
domain name.
* @returns {Promise} A Promise that fulfills with reddit's response.
* @memberof snoowrap
* @instance
* @example
*
* r.oauth_request({uri: '/user/spez/about', method: 'get'}).then(console.log)
* // => RedditUser { name: 'spez', link_karma: 9567, ... }
*
* // Note that this is equivalent to:
* r.get_user('spez').fetch().then(console.log)
*
* // ######
*
* r.oauth_request({uri: '/api/vote', method: 'post', form: {dir: 1, id: 't3_4fzg2k'}})
* // equivalent to:
* r.get_submission('4fzg2k').upvote()
*
* // ######
*
* r.oauth_request({uri: '/top', method: 'get', qs: {t: 'all'}})
* // equivalent to:
* r.get_top({time: 'all'})
*/
export function oauth_request (options, attempts = 1) {
  return Promise.resolve()
    .then(() => this._await_ratelimit())
    .then(() => this._await_request_delay())
    .then(() => this.update_access_token())
    .then(token => {
      return request.defaults({
        headers: {'user-agent': this.user_agent},
        baseUrl: `https://oauth.${this._config.endpoint_domain}`,
        qs: {raw_json: 1},
        auth: {bearer: token},
        resolveWithFullResponse: true,
        timeout: this._config.request_timeout,
        transform: (body, response) => {
          if (Object.prototype.hasOwnProperty.call(response.headers, 'x-ratelimit-remaining')) {
            this.ratelimit_remaining = +response.headers['x-ratelimit-remaining'];
            this.ratelimit_expiration = Date.now() + (response.headers['x-ratelimit-reset'] * 1000);
          }
          this._log.debug(
            `Received a ${response.statusCode} status code from a \`${response.request.method}\` request`,
            `sent to ${response.request.uri.href}. ratelimit_remaining: ${this.ratelimit_remaining}`
          );
          return response;
        }
      })(options);
    }).then(response => {
      const populated = this._populate(response.body);
      if (populated && populated.constructor._name === 'Listing') {
        populated._set_uri(response.request.uri.path);
      }
      return populated || response;
    }).catch(...this._config.retry_error_codes.map(retry_code => ({statusCode: retry_code})), e => {
      if (!includes(IDEMPOTENT_HTTP_VERBS, e.response.request.method) || attempts >= this._config.max_retry_attempts) {
        throw e;
      }
      /* If the error's status code is in the user's configured `retry_status_codes` and this request still has attempts
      remaining, retry this request and increment the `attempts` counter. */
      this._log.warn(
        `Received status code ${e.statusCode} from reddit.`,
        `Retrying request (attempt ${attempts + 1}/${this._config.max_retry_attempts})...`
      );
      return this.oauth_request(options, attempts + 1);
    }).catch({statusCode: 401}, e => {
      /* If the server returns a 401 error, it's possible that the access token expired during the latency period as this
      request was being sent. In this scenario, snoowrap thought that the access token was valid for a few more seconds, so it
      didn't refresh the token, but the token had expired by the time the request reached the server. To handle this issue,
      invalidate the access token and call oauth_request again, automatically causing the token to be refreshed. */
      if (this.access_token && this.token_expiration - Date.now() < MAX_TOKEN_LATENCY) {
        this.access_token = null;
        this.token_expiration = null;
        return this.oauth_request(options, attempts);
      }
      throw e;
    });
}

export function _await_ratelimit () {
  if (this.ratelimit_remaining < 1 && Date.now() < this.ratelimit_expiration) {
    // If the ratelimit has been exceeded, delay or abort the request depending on the user's config.
    const time_until_expiry = this.ratelimit_expiration - Date.now();
    if (this._config.continue_after_ratelimit_error) {
      /* If the `continue_after_ratelimit_error` setting is enabled, queue the request, wait until the next ratelimit
      period, and then send it. */
      this._log.warn(RateLimitWarning(time_until_expiry));
      return Promise.delay(time_until_expiry);
    }
    // Otherwise, throw an error.
    throw new RateLimitError(time_until_expiry);
  }
  // If the ratelimit hasn't been exceeded, no delay is necessary.
  return Promise.resolve();
}

export function _await_request_delay () {
  const now = Date.now();
  const wait_time = this._next_request_timestamp - now;
  this._next_request_timestamp = Math.max(now, this._next_request_timestamp) + this._config.request_delay;
  return Promise.delay(wait_time);
}

/**
* @summary Sends a request to the reddit server, authenticated with the user's client ID and client secret.
* @desc **Note**: This is used internally as part of the authentication process, but it cannot be used to actually fetch
content from reddit. To do that, use {@link snoowrap#oauth_request} or another of snoowrap's helper functions.
*
* This function can work with alternate `this`-bindings, provided that the binding has the `client_id`, `client_secret`, and
`user_agent` properties. This allows it be used if no snoowrap requester has been created yet.
* @param {object|string} options Options for the request; these are passed directly to the
[Request API](https://www.npmjs.com/package/request).
* @returns {Promise} The response from the reddit server
* @example
*
* // example: this function could be used to exchange a one-time authentication code for a refresh token.
snoowrap.prototype.credentialed_client_request.call({
  client_id: 'client id goes here',
  client_secret: 'client secret goes here',
  user_agent: 'user agent goes here'
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
export function credentialed_client_request (options) {
  return request.defaults({
    auth: {user: this.client_id, pass: this.client_secret},
    headers: {'user-agent': this.user_agent},
    baseUrl: this._config ? `https://www.${this._config.endpoint_domain}` : undefined
  })(options);
}

/**
* @summary Sends a request to the reddit server without authentication.
* @param {object|string} options Options for the request; these are passed directly to the
[Request API](https://www.npmjs.com/package/request).
* @returns {Promise} The response from the reddit server
* @memberof snoowrap
* @instance
*/
export function unauthenticated_request (options) {
  return request.defaults({
    headers: {'user-agent': this.user_agent},
    baseUrl: `https://www.${this._config.endpoint_domain}`
  })(options);
}

/**
* @summary Updates this requester's access token if the current one is absent or expired.
* @desc **Note**: This function is automatically called internally when making a request. While the function is exposed as
a stable feature, using it is rarely necessary unless an access token is needed for some external purpose.
* @returns {Promise} A Promise fulfills with the access token when this request is complete
* @memberof snoowrap
* @instance
* @example r.update_access_token()
*/
export function update_access_token () {
  // If the current access token is missing or expired, and it is possible to get a new one, do so.
  if ((!this.access_token || Date.now() > this.token_expiration) && (this.refresh_token || (this.username && this.password))) {
    return this.credentialed_client_request({
      method: 'post',
      uri: 'api/v1/access_token',
      form: this.refresh_token
        ? {grant_type: 'refresh_token', refresh_token: this.refresh_token}
        : {grant_type: 'password', username: this.username, password: this.password}
    }).then(token_info => {
      this.access_token = token_info.access_token;
      this.token_expiration = Date.now() + (token_info.expires_in * 1000);
      this.scope = token_info.scope.split(' ');
      return this.access_token;
    });
  }
  // Otherwise, just return the existing token.
  return Promise.resolve(this.access_token);
}
