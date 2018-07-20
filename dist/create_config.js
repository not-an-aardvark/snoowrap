'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var config = Object.create(null);
  config.endpointDomain = 'reddit.com';
  config.requestDelay = 0;
  config.requestTimeout = 30000;
  config.continueAfterRatelimitError = false;
  config.retryErrorCodes = [502, 503, 504, 522];
  config.maxRetryAttempts = 3;
  config.warnings = true;
  config.debug = false;
  config.proxies = true;

  return (0, _helpers.addSnakeCaseShadowProps)(config);
};

var _helpers = require('./helpers.js');