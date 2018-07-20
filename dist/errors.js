'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StatusCodeError = exports.RequestError = exports.InvalidMethodCallError = exports.NoCredentialsError = exports.InvalidUserError = exports.RateLimitError = undefined;
exports.rateLimitWarning = rateLimitWarning;

var _constants = require('./constants.js');

class RateLimitError extends Error {
  constructor() {
    super(_constants.MODULE_NAME + ' refused to continue because reddit\'s ratelimit was exceeded. For more information about reddit\'s ratelimit, please consult reddit\'s API rules at ' + _constants.API_RULES_LINK + '.');
  }
}

exports.RateLimitError = RateLimitError; /* eslint-disable max-len */

class InvalidUserError extends Error {
  constructor() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Cannot fetch information on the given user. Please be sure you have the right username.';

    super(message);
  }
}

exports.InvalidUserError = InvalidUserError;
class NoCredentialsError extends Error {
  constructor() {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Missing credentials passed to ' + _constants.MODULE_NAME + ' constructor. You must pass an object containing either (a) userAgent, clientId, clientSecret, and refreshToken properties, (b) userAgent and accessToken properties, or (c) userAgent, clientId, clientSecret, username, and password properties. For information, please read the docs at ' + _constants.DOCS_LINK + '.';

    super(message);
  }
}

exports.NoCredentialsError = NoCredentialsError;
class InvalidMethodCallError extends Error {}
exports.InvalidMethodCallError = InvalidMethodCallError;
class RequestError extends Error {}
exports.RequestError = RequestError;
class StatusCodeError extends Error {}

exports.StatusCodeError = StatusCodeError;
function rateLimitWarning(millisecondsUntilReset) {
  return 'Warning: ' + _constants.MODULE_NAME + ' temporarily stopped sending requests because reddit\'s ratelimit was exceeded. The request you attempted to send was queued, and will be sent to reddit when the current ratelimit period expires in ' + millisecondsUntilReset / 1000 + ' seconds.';
}