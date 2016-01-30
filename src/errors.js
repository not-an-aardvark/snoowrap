'use strict';
let constants = require('./constants');
let e = ''; // Used for newlines within template strings without breaking indentation
let errors = {
  RateLimitError: class extends Error {
    constructor (expiry_time_from_now) {
      super();
      this.name = 'RateLimitError';
      this.message = `ERROR: ${constants.MODULE_NAME}.errors.${this.name}: ${e
      }${constants.MODULE_NAME} refused to continue because reddit's ratelimit was exceeded. ${e
      }For more information about reddit\'s ratelimit, please consult reddit\'s API rules at ${e
      }https://github.com/reddit/reddit/wiki/API. To avoid hitting the ratelimit again, you should probably ${e
      }wait at least ${expiry_time_from_now} seconds before making any more requests.`;
    }
  },
  InvalidUserError: class extends Error {
    constructor (username) {
      super();
      this.name = 'InvalidUserError';
      this.message = `ERROR: ${constants.MODULE_NAME}.errors.${this.name}: ${e
      }Cannot fetch information on the user '${username}'. Please be sure you have the right username.`;
    }
  },
  InvalidMethodCallError: class extends Error {
    constructor(reason) {
      super();
      this.name = 'InvalidMethodCallError';
      this.message = `ERROR: ${constants.MODULE_NAME}.errors.${this.name}: ${reason}`;
    }
  },
  RateLimitWarning: time_until_reset => (`Warning: ${constants.MODULE_NAME} temporarily stopped sending requests because${e
  } reddit's ratelimit was exceeded. The request you attempted to send was queued, and will be${e
  } sent to reddit when the current ratelimit period expires in ${time_until_reset} seconds.`)
};
module.exports = errors;
