/* eslint-disable max-len */
import {API_RULES_LINK, DOCS_LINK, MODULE_NAME} from './constants.js';

export class RateLimitError extends Error {
  constructor () {
    super(`${MODULE_NAME} refused to continue because reddit's ratelimit was exceeded. For more information about reddit's ratelimit, please consult reddit's API rules at ${API_RULES_LINK}.`);
  }
}

export class InvalidUserError extends Error {
  constructor (message = 'Cannot fetch information on the given user. Please be sure you have the right username.') {
    super(message);
  }
}

export class NoCredentialsError extends Error {
  constructor (message = `Missing credentials passed to ${MODULE_NAME} constructor. You must pass an object containing either (a) userAgent, clientId, clientSecret, and refreshToken properties, (b) userAgent and accessToken properties, or (c) userAgent, clientId, clientSecret, username, and password properties. For information, please read the docs at ${DOCS_LINK}.`) {
    super(message);
  }
}

export class InvalidMethodCallError extends Error {}
export class RequestError extends Error {}
export class StatusCodeError extends Error {}

export function rateLimitWarning (millisecondsUntilReset) {
  return `Warning: ${MODULE_NAME} temporarily stopped sending requests because reddit's ratelimit was exceeded. The request you attempted to send was queued, and will be sent to reddit when the current ratelimit period expires in ${millisecondsUntilReset / 1000} seconds.`;
}
