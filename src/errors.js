/* eslint-disable max-len */
import {isString} from 'lodash';
import {API_RULES_LINK, DOCS_LINK, MODULE_NAME} from './constants.js';

function subError (name, defaultMessage) {
  function SubclassedError (message) {
    if (!(this instanceof SubclassedError)) {
      return new SubclassedError(message);
    }
    const propertyOptions = {configurable: true, writable: true, enumerable: false};
    Object.defineProperty(this, 'message', {...propertyOptions, value: isString(message) ? message : defaultMessage});
    Object.defineProperty(this, 'name', {...propertyOptions, value: name});
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      Error.call(this);
    }
  }
  function TempSubclass () {
    this.constructor = SubclassedError;
  }
  TempSubclass.prototype = Error.prototype;
  SubclassedError.prototype = new TempSubclass();
  return SubclassedError;
}

export const RateLimitError = subError('RateLimitError', `${MODULE_NAME} refused to continue because reddit's ratelimit was exceeded. For more information about reddit's ratelimit, please consult reddit's API rules at ${API_RULES_LINK}.`);
export const InvalidUserError = subError('InvalidUserError', 'Cannot fetch information on the given user. Please be sure you have the right username.');
export const InvalidMethodCallError = subError('InvalidMethodCallError', '');
export const NoCredentialsError = subError('NoCredentialsError', `Missing credentials passed to ${MODULE_NAME} constructor. You must pass an object containing either (a) userAgent, clientId, clientSecret, and refreshToken properties, (b) userAgent and accessToken properties, or (c) userAgent, clientId, clientSecret, username, and password properties. For information, please read the docs at ${DOCS_LINK}.`);
export const MissingUserAgentError = subError('MissingUserAgentError', `You must supply an object with the userAgent property to the snoowrap constructor. For more details on userAgent strings, please see: ${API_RULES_LINK}`);
export const RequestError = subError('RequestError', '');
export const StatusCodeError = subError('StatusCodeError', '');
export const RateLimitWarning = millisecondsUntilReset => `Warning: ${MODULE_NAME} temporarily stopped sending requests because reddit's ratelimit was exceeded. The request you attempted to send was queued, and will be sent to reddit when the current ratelimit period expires in ${millisecondsUntilReset / 1000} seconds.`;
