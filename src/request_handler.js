'use strict';
const Promise = require('bluebird');
const request = require('request-promise').defaults({json: true});
const helpers = require('./helpers');
const constants = require('./constants');
const errors = require('./errors');

module.exports = {
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
  async oauth_request (options, attempts = 0) {
    /* r._throttle is a timer that gets reset to r._config.request_delay whenever a request is sent. This ensures that
    requests are throttled correctly according to the user's config settings, and that no requests are lost. The await
    statement is wrapped in a loop to make sure that if the throttle promise resolves while multiple requests are pending,
    only one of the requests is sent, and the others await the throttle again. (The loop is non-blocking due to its await
    statement.) */
    while (!this._throttle.isFulfilled()) {
      await this._throttle;
    }
    this._throttle = Promise.delay(this._config.request_delay);
    if (this.ratelimit_remaining < 1 && Date.now() < this.ratelimit_expiration) {
      // If the ratelimit has been exceeded, delay or abort the request depending on the user's config.
      const time_until_expiry = this.ratelimit_expiration - Date.now();
      if (this._config.continue_after_ratelimit_error) {
        /* If the `continue_after_ratelimit_error` setting is enabled, queue the request, wait until the next ratelimit
        period, and then send it. */
        this.warn(errors.RateLimitWarning(time_until_expiry));
        await Promise.delay(time_until_expiry);
      } else {
        // Otherwise, throw an error.
        throw new errors.RateLimitError(time_until_expiry);
      }
    }
    try {
      // If the access token has expired, refresh it.
      if (this.refresh_token && (!this.access_token || Date.now() > this.token_expiration)) {
        await this.update_access_token();
      }
      // Send the request and return the response.
      return await request.defaults({
        headers: {'user-agent': this.user_agent},
        baseUrl: `https://oauth.${this._config.endpoint_domain}`,
        qs: {raw_json: 1},
        auth: {bearer: this.access_token},
        transform: (body, response) => {
          if (response.headers['x-ratelimit-remaining']) {
            this.ratelimit_remaining = +response.headers['x-ratelimit-remaining'];
            this.ratelimit_expiration = Date.now() + response.headers['x-ratelimit-reset'] * 1000;
          }
          this.log.debug(`Received a ${response.statusCode} status code from a \`${response.request.method}\` request sent to ${
            response.request.uri.href}. ratelimit_remaining: ${this.ratelimit_remaining}`);
          if (!response.statusCode.toString().startsWith(2)) {
            return response;
          }
          const populated = helpers._populate(body, this);
          if (populated && populated.constructor && populated.constructor.name === 'Listing') {
            populated._set_uri(response.request.uri.path);
          }
          return populated;
        }
      })(options);
    } catch (err) {
      if (err.statusCode === 401 && this.token_expiration - Date.now() < constants.MAX_TOKEN_LATENCY && this.refresh_token) {
        /* If the server returns a 401 error, it's possible that the access token expired during the latency period
        as this request was being sent. In this scenario, snoowrap thought that the access token was valid
        for a few more seconds, so it didn't refresh the token, but the token had expired by the time the request
        reached the server. To handle this issue, invalidate the access token and call oauth_request again,
        automatically causing the token to be refreshed. */
        this.access_token = undefined;
        return await this.oauth_request(this, options, attempts);
      }
      if (attempts + 1 >= this._config.max_retry_attempts || this._config.retry_error_codes.indexOf(err.statusCode) === -1) {
        throw err;
      }
      this.log.warn(`Received status code ${err.statusCode} from reddit. Retrying request...`);
      return await this.oauth_request(options, attempts + 1);
    }
  },

  /**
  * @summary Sends a request to the reddit server, authenticated with the user's client ID and client secret.
  * @desc **Note**: This is used internally as part of the authentication process, but it cannot be used to actually fetch
  content from reddit. To do that, use {@link snoowrap#oauth_request} or another of snoowrap's helper functions.
  * @param {object|string} options Options for the request; these are passed directly to the
  [Request API](https://www.npmjs.com/package/request).
  * @returns {Promise} The response from the reddit server
  * @memberof snoowrap
  * @instance
  */
  credentialed_client_request (options) {
    return request.defaults({
      auth: {user: this.client_id, pass: this.client_secret},
      headers: {'user-agent': this.user_agent},
      baseUrl: `https://www.${this._config.endpoint_domain}`
    })(options);
  },

  /**
  * @summary Sends a request to the reddit server without authentication.
  * @param {object|string} options Options for the request; these are passed directly to the
  [Request API](https://www.npmjs.com/package/request).
  * @returns {Promise} The response from the reddit server
  * @memberof snoowrap
  * @instance
  */
  unauthenticated_request (options) {
    return request.defaults({
      headers: {'user-agent': this.user_agent},
      baseUrl: `https://www.${this._config.endpoint_domain}`
    })(options);
  },

  /**
  * @summary Updates this requester's access token.
  * @desc **Note**: This function is automatically called internally when making a request. While the function is exposed as
  a stable feature, using it is rarely necessary unless an access token is needed for some external purpose.
  * @returns {Promise} A Promise fulfills when this request is complete
  * @memberof snoowrap
  * @instance
  * @example r.update_access_token()
  */
  update_access_token () {
    return this.credentialed_client_request({
      method: 'post',
      uri: 'api/v1/access_token',
      form: {grant_type: 'refresh_token', refresh_token: this.refresh_token}
    }).then(token_info => {
      this.access_token = token_info.access_token;
      this.token_expiration = Date.now() + token_info.expires_in * 1000;
      this.scope = token_info.scope.split(' ');
    });
  }
};
