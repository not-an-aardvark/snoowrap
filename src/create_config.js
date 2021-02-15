import {addSnakeCaseShadowProps} from './helpers.js';

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
  config.logger = console;
  config.proxies = true;

  return addSnakeCaseShadowProps(config);
}
