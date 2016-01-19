'use strict';
let constants = require('./constants');
module.exports = {
  ratelimit_exceeded: expiry_distance => (`ERROR: ${constants.MODULE_NAME}.errors.ratelimit_exceeded: ` +
    `${constants.MODULE_NAME} refused to continue because reddit's ratelimit was exceeded. ` +
    `For more information about reddit's ratelimit, read reddit's API rules at ${constants.API_RULES_LINK}. ` +
    `To avoid hitting the ratelimit again, you should probably wait at least ${expiry_distance} seconds before ` +
    `making any more requests.`)
};
