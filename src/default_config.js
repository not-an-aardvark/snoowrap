module.exports = {
  // The domain that requests should be sent to
  ENDPOINT_DOMAIN: 'reddit.com',

  /* This is the minimum delay between requests, in milliseconds. Setting this to more than 1 will ensure that the
  ratelimit is never reached, but it will make things run slower than necessary if only a few requests are being sent.
  If this is set to zero, snoowrap will not enforce any delay between individual requests, but it will still refuse
  to continue if reddit's enforced ratelimit (600 requests per 10 minutes) is exceeded. */
  request_delay: 0,

  /* If set to true, all requests will be queued if the ratelimit is exceeded, and then they will be executed
  after the current ratelimit window expires. If false, requests will not be queued, and an error will be thrown
  if the ratelimit is exceeded. */
  continue_after_ratelimit_error: false,

  // If set to true, snoowrap's default warnings for this instance will be suppressed.
  suppress_warnings: false,

  // If any of the following status codes are received on an unsuccessful request, the request will be retried.
  retry_error_codes: [502, 503, 504],

  /* The maximum number of times to attempt a request before giving up and throwing the error. Note that the request will
  always be sent at least once. */
  max_retry_attempts: 3
};
