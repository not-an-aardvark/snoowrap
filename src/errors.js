'use strict';
let constants = require('./constants');
let e = ''; // Used for newlines in template strings without breaking indentation
let errors = {
  RateLimitError: class extends Error {
    constructor (expiry_time_from_now) {
      super();
      this.message = `ERROR: ${constants.MODULE_NAME}.errors.ratelimit_exceeded: ${e
      }${constants.MODULE_NAME} refused to continue because reddit's ratelimit was exceeded. ${e
      }For more information about reddit\'s ratelimit, please consult reddit\'s API rules at ${e
      }https://github.com/reddit/reddit/wiki/API. To avoid hitting the ratelimit again, you should probably ${e
      }wait at least ${expiry_time_from_now} seconds before making any more requests.`;
      this.name = 'RateLimitError';
    }
  },
  InvalidUserError: class extends Error {
    constructor (username) {
      super();
      this.message = `Cannot fetch information on the user '${username}'. Please be sure you have the right username.`;
      this.name = 'InvalidUserError';
    }
  }
};
module.exports = errors;
