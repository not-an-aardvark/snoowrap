/* eslint-disable max-len */
import _ from 'lodash';
import constants from './constants';

function sub_error (name, default_message) {
  function SubclassedError (message) {
    if (!(this instanceof SubclassedError)) {
      return new SubclassedError(message);
    }
    const property_options = {configurable: true, writable: true, enumerable: false};
    Object.defineProperty(this, 'message', {...property_options, value: _.isString(message) ? message : default_message});
    Object.defineProperty(this, 'name', {...property_options, value: name});
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

module.exports = {
  RateLimitError: sub_error('RateLimitError', `${constants.MODULE_NAME} refused to continue because reddit's ratelimit was exceeded. For more information about reddit's ratelimit, please consult reddit's API rules at ${constants.API_RULES_LINK}.`),
  InvalidUserError: sub_error('InvalidUserError, Cannot fetch information on the given user. Please be sure you have the right username.'),
  InvalidMethodCallError: sub_error('InvalidMethodCallError', ''),
  NoCredentialsError: sub_error('NoCredentialsError', `Missing credentials passed to ${constants.MODULE_NAME} constructor. You must pass an object containing either (a) user_agent, client_id, client_secret, and refresh_token properties, or (b) user_agent and access_token properties. For information, please read the docs at ${constants.DOCS_LINK}.`),
  MissingUserAgentError: sub_error('MissingUserAgentError', `You must supply an object with the user_agent property to the snoowrap constructor. For more details on user_agent strings, please see: ${constants.API_RULES_LINK}`),
  RateLimitWarning: milliseconds_until_reset => `Warning: ${constants.MODULE_NAME} temporarily stopped sending requests because reddit's ratelimit was exceeded. The request you attempted to send was queued, and will be sent to reddit when the current ratelimit period expires in ${milliseconds_until_reset / 1000} seconds.`
};
