'use strict';
let constants = require('./constants');
let errors = {
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
    constructor(reason) {
      super();
      this.name = 'InvalidMethodCallError';
      this.message = `${constants.MODULE_NAME}.errors.${this.name}: ${reason}`;
    }
  },
  RateLimitWarning: time_until_reset => (`Warning: ${constants.MODULE_NAME} temporarily stopped sending requests because reddit's ratelimit was exceeded. The request you attempted to send was queued, and will be sent to reddit when the current ratelimit period expires in ${time_until_reset} seconds.`)
};
module.exports = errors;
