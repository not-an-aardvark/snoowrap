module.exports = {
  /* This is the minimum delay between requests, in milliseconds. Setting this to more than 1 will ensure that the
    ratelimit is never reached, but it will make things run slower than necessary if only a few requests are being sent.
    If this is set to zero, snoowrap will not enforce any delay between individual requests, but it will still refuse
    to continue if reddit's enforced ratelimit (600 requests per 10 minutes) is exceeded. */
  request_delay: 0,

  /* If this is set to true, all requests will be queued if the ratelimit is exceeded, and then they will be executed
    after the current ratelimit window expires. If false, requests will not be queued, and an error will be thrown
    if the ratelimit is exceeded. */
  continue_after_ratelimit_error: false,

  // If this is set to true, snoowrap's default warnings for this instance will be suppressed.
  suppress_warnings: false
};
