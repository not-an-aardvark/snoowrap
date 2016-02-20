'use strict';
const constants = require('./constants');
module.exports = {
  RateLimitError: class extends Error {
    constructor (expiry_time_from_now) {
      super();
      this.name = 'RateLimitError';
      this.message = `${constants.MODULE_NAME}.errors.${this.name}: ${constants.MODULE_NAME} refused to continue because reddit's ratelimit was exceeded. For more information about reddit's ratelimit, please consult reddit's API rules at ${constants.API_RULES_LINK}. To avoid hitting the ratelimit again, you should probably wait at least ${expiry_time_from_now} seconds before making any more requests.`;
    }
  },
  InvalidUserError: class extends Error {
    constructor (username) {
      super();
      this.name = 'InvalidUserError';
      this.message = `${constants.MODULE_NAME}.errors.${this.name}: Cannot fetch information on the user '${username}'. Please be sure you have the right username.`;
    }
  },
  InvalidMethodCallError: class extends Error {
    constructor (reason) {
      super();
      this.name = 'InvalidMethodCallError';
      this.message = `${constants.MODULE_NAME}.errors.${this.name}: ${reason}`;
    }
  },
  RateLimitWarning: time_until_reset => `Warning: ${constants.MODULE_NAME} temporarily stopped sending requests because reddit's ratelimit was exceeded. The request you attempted to send was queued, and will be sent to reddit when the current ratelimit period expires in ${time_until_reset} seconds.`,
  NoCredentialsError: class extends Error {
    constructor () {
      super();
      this.name = 'NoCredentialsError';
      this.message = `${constants.MODULE_NAME}.errors.${this.name}: Missing credentials passed to ${constants.MODULE_NAME} constructor. You must pass an object containing either (a) user_agent, client_id, client_secret, and refresh_token properties, or (b) user_agent and access_token properties. For information, please read the docs at ${constants.DOCS_LINK}.`;
    }
  },
  MissingUserAgentError: class extends Error {
    constructor () {
      super();
      this.name = 'MissingUserAgentError';
      this.message = `${constants.MODULE_NAME}.errors.${this.name}: You must supply an object with the user_agent property to the snoowrap constructor. For more details on user_agent strings, please see: ${constants.API_RULES_LINK}`;
    }
  }
};
