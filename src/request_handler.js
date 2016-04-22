'use strict';
const Promise = require('bluebird');
const request = require('request-promise').defaults({json: true});
const helpers = require('./helpers');
const constants = require('./constants');
const errors = require('./errors');

module.exports = {
  async oauth_request (r, method, args, attempts = 0) {
    /* r._throttle is a timer that gets reset to r._config.request_delay whenever a request is sent. This ensures that
    requests are throttled correctly according to the user's config settings, and that no requests are lost. The await
    statement is wrapped in a loop to make sure that if the throttle promise resolves while multiple requests are pending,
    only one of the requests is sent, and the others await the throttle again. (The loop is non-blocking due to its await
    statement.) */
    while (!r._throttle.isFulfilled()) {
      await r._throttle;
    }
    r._throttle = Promise.delay(r._config.request_delay);
    if (r.ratelimit_remaining < 1 && Date.now() < r.ratelimit_expiration) {
      // If the ratelimit has been exceeded, delay or abort the request depending on the user's config.
      const time_until_expiry = r.ratelimit_expiration - Date.now();
      if (r._config.continue_after_ratelimit_error) {
        /* If the `continue_after_ratelimit_error` setting is enabled, queue the request, wait until the next ratelimit
        period, and then send it. */
        r.warn(errors.RateLimitWarning(time_until_expiry));
        await Promise.delay(time_until_expiry);
      } else {
        // Otherwise, throw an error.
        throw new errors.RateLimitError(time_until_expiry);
      }
    }
    try {
      // If the access token has expired, refresh it.
      if (r.refresh_token && (!r.access_token || Date.now() > r.token_expiration)) {
        await module.exports.update_access_token(r);
      }
      // Send the request and return the response.
      return await request.defaults({
        headers: {'user-agent': r.user_agent},
        baseUrl: `https://oauth.${r._config.endpoint_domain}`,
        qs: {raw_json: 1},
        auth: {bearer: r.access_token},
        transform (body, response) {
          r.ratelimit_remaining = +response.headers['x-ratelimit-remaining'];
          r.ratelimit_expiration = Date.now() + response.headers['x-ratelimit-reset'] * 1000;
          if (!response.statusCode.toString().startsWith(2)) {
            return response;
          }
          const populated = helpers._populate(body, r);
          if (populated && populated.constructor && populated.constructor.name === 'Listing') {
            populated._set_uri(response.request.uri.path);
          }
          r.log.debug(`Received a ${response.statusCode} status code from a \`${method.toUpperCase()}\` request sent to ${
            response.request.uri.href}. ratelimit_remaining: ${r.ratelimit_remaining}`);
          return populated;
        }
      })[method](...args);
    } catch (err) {
      if (err.statusCode === 401 && r.token_expiration - Date.now() < constants.MAX_TOKEN_LATENCY && r.refresh_token) {
        /* If the server returns a 401 error, it's possible that the access token expired during the latency period
        as this request was being sent. In this scenario, snoowrap thought that the access token was valid
        for a few more seconds, so it didn't refresh the token, but the token had expired by the time the request
        reached the server. To handle this issue, invalidate the access token and call oauth_request again,
        automatically causing the token to be refreshed. */
        r.access_token = undefined;
        return await module.exports.oauth_request(r, method, args, attempts);
      }
      if (attempts + 1 >= r._config.max_retry_attempts || r._config.retry_error_codes.indexOf(err.statusCode) === -1) {
        r.log.debug(`Received a ${err.statusCode} status code from a \`${method.toUpperCase()}\` request sent to ${
          err.response.request.uri.href}. ratelimit_remaining: ${r.ratelimit_remaining}`);
        throw err;
      }
      r.log.warn(`Received status code ${err.statusCode} from reddit. Retrying request...`);
      return await module.exports.oauth_request(r, method, args, attempts + 1);
    }
  },

  base_client_request (r, method, args) {
    return request.defaults({
      auth: {user: r.client_id, pass: r.client_secret},
      headers: {'user-agent': r.user_agent},
      baseUrl: `https://www.${r._config.endpoint_domain}`
    })[method](...args);
  },

  unauthenticated_request (r, method, args) {
    return request.defaults({
      headers: {'user-agent': r.user_agent},
      baseUrl: `https://www.${r._config.endpoint_domain}`
    })[method](...args);
  },

  async update_access_token (r) {
    const token_info = await module.exports.base_client_request(r, 'post', [{
      uri: 'api/v1/access_token',
      form: {grant_type: 'refresh_token', refresh_token: r.refresh_token}
    }]);
    r.access_token = token_info.access_token;
    r.token_expiration = Date.now() + token_info.expires_in * 1000;
    r.scope = token_info.scope.split(' ');
  }
};
