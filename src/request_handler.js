'use strict';
const Promise = require('bluebird');
const request = require('request-promise').defaults({json: true});
const helpers = require('./helpers');
const errors = require('./errors');

exports.oauth_request = async (r, method, args, attempts = 0) => {
  /* r._throttle is a timer that gets reset to r.config().request_delay whenever a request is sent. This ensures that requests
  are throttled correctly according to the user's config settings, and that no requests are lost. The await statement is
  wrapped in a loop to make sure that if the throttle promise resolves while multiple requests are pending, only one of the
  requests is sent, and the others await the throttle again. (The loop is non-blocking due to its await statement.) */
  while (!r._throttle.isFulfilled()) {
    await r._throttle;
  }
  r._throttle = Promise.delay(r.config().request_delay);
  if (r.ratelimit_remaining < 1 && Date.now() < r.ratelimit_reset_point) {
    // If the ratelimit has been exceeded, delay or abort the request depending on the user's config.
    const time_until_expiry = r.ratelimit_reset_point - Date.now();
    if (r.config().continue_after_ratelimit_error) {
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
      await exports.update_access_token(r);
    }
    // Send the request and return the response.
    return await request.defaults({
      headers: {'user-agent': r.user_agent},
      baseUrl: `https://oauth.${r.config().endpoint_domain}`,
      qs: {raw_json: 1},
      auth: {bearer: r.access_token},
      transform (body, response) {
        r.ratelimit_remaining = response.headers['x-ratelimit-remaining'];
        r.ratelimit_reset_point = Date.now() + response.headers['x-ratelimit-reset'] * 1000;
        const populated = helpers._populate(body, r);
        if (populated && populated.constructor && populated.constructor.name === 'Listing') {
          populated.uri = response.request.uri.path;
        }
        return populated;
      }
    })[method](...args);
  } catch (err) {
    if (attempts + 1 >= r.config().max_retry_attempts || r.config().retry_error_codes.indexOf(err.statusCode) === -1) {
      throw err;
    }
    r.warn(`Warning: Received status code ${err.statusCode} from reddit. Retrying request...`);
    return await exports.oauth_request(r, method, args, attempts + 1);
  }
};

exports.base_client_request = (r, method, args) => request.defaults({
  auth: {user: r.client_id, pass: r.client_secret},
  headers: {'user-agent': r.user_agent},
  baseUrl: `https://www.${r.config().endpoint_domain}`
})[method](...args);

exports.unauthenticated_request = (r, method, args) => request.defaults({
  headers: {'user-agent': r.user_agent},
  baseUrl: `https://www.${r.config().endpoint_domain}`
})[method](...args);

exports.update_access_token = async r => {
  const token_info = await exports.base_client_request(r, 'post', [{
    uri: 'api/v1/access_token',
    form: {grant_type: 'refresh_token', refresh_token: r.refresh_token}
  }]);
  r.access_token = token_info.access_token;
  r.token_expiration = Date.now() + token_info.expires_in * 1000;
  r.scope = token_info.scope.split(' ');
};
