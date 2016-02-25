// Defines the default config values. For more information on these, see the documentation for snoowrap#config()
module.exports = {
  endpoint_domain: 'reddit.com',
  request_delay: 0,
  continue_after_ratelimit_error: false,
  retry_error_codes: [502, 503, 504, 522],
  max_retry_attempts: 3,
  suppress_warnings: false
};
