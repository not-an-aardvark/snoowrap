import {addSnakeCaseShadowProps} from './helpers.js';

export const consoleLogger = Object.freeze({
  warn (...args) {
    // eslint-disable-next-line no-console
    console.warn('[warning]', ...args);
  },

  info (...args) {
    // eslint-disable-next-line no-console
    console.info('[info]', ...args);
  },

  debug (...args) {
    // eslint-disable-next-line no-console
    console.debug('[debug]', ...args);
  },

  trace (...args) {
    // eslint-disable-next-line no-console
    console.trace('[trace]', ...args);
  }
});

export default function () {
  const config = Object.create(null);
  config.endpointDomain = 'reddit.com';
  config.requestDelay = 0;
  config.requestTimeout = 30000;
  config.continueAfterRatelimitError = false;
  config.retryErrorCodes = [502, 503, 504, 522];
  config.maxRetryAttempts = 3;
  config.warnings = true;
  config.debug = false;
  config.logger = consoleLogger;
  config.proxies = true;

  return addSnakeCaseShadowProps(config);
}
