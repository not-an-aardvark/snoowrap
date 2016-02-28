'use strict';
const _ = require('lodash');
const errors = require('../errors');

module.exports = class extends require('./RedditContent') {
  /* Requests to /api/morechildren are capped at 20 comments at a time, but requests to /api/info are capped at 100, so
  it's easier to send to the latter. The disadvantage is that comment replies are not automatically sent from requests
  to /api/info. */
  async fetch_more (amount) {
    if (isNaN(amount)) {
      throw new errors.InvalidMethodCallError('Failed to fetch Listing. (`amount` must be a Number.)');
    }
    if (amount <= 0 || this.children.length === 0) {
      return [];
    }
    const ids_for_this_request = this.children.splice(0, Math.min(amount, 100)).map(id => `t1_${id}`);
    // Requests are capped at 100 comments. Send lots of requests recursively to get the comments, then concatenate them.
    // (This speed-requesting is only possible with comment Listings since the entire list of ids is present initially.)
    const promise_for_this_batch = this._get({uri: 'api/info', qs: {id: ids_for_this_request.join(',')}});
    const promise_for_remaining_items = this.fetch_more(amount - ids_for_this_request.length);
    return _.toArray(await promise_for_this_batch).concat(await promise_for_remaining_items);
  }
};
