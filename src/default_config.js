// Defines the default config values. For more information on these, see the documentation for snoowrap#config()
export default {
  endpoint_domain: 'reddit.com',
  request_delay: 0,
  request_timeout: 30000,
  continue_after_ratelimit_error: false,
  retry_error_codes: [502, 503, 504, 522],
  max_retry_attempts: 3,
  warnings: true,
  debug: false,
  proxies: true
};
