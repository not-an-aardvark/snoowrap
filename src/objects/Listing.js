'use strict';
const _ = require('lodash');
const util = require('util');
const promise_wrap = require('promise-chains');
const errors = require('../errors');

/**
* A class representing a list of content. This is a subclass of the native Array object, so it has all the properties of
an Array (length, forEach, etc.) in addition to some added methods. At any given time, each Listing has fetched a specific
number of items, and that number will be its length. The Listing can be extended by using the #fetch_more(), #fetch_until,
and #fetch_all() functions.

Most methods that return Listings will also accept `limit`, `after`, `before`, `show`, and `count` properties.
* @extends Array
*/
const Listing = class extends Array {
  constructor ({children = [], query = {}, show_all = true, limit, _transform = _.identity,
      uri, method = 'get', after, before, _is_comment_list = false} = {}, _ac) {
    super();
    _.assign(this, children);
    const constant_params = _.assign(query, {show: show_all ? 'all' : undefined, limit});
    this._ac = _ac;
    this.uri = uri;
    this.method = method;
    this.constant_params = constant_params;
    this._transform = _transform;
    this.limit = limit;
    this.after = after;
    this.before = before;
    if (_.last(children) instanceof require('./more')) {
      this._more = this.pop();
      this._is_comment_list = true;
    }
  }
  /**
  * @summary This is a getter that is true if there are no more items left to fetch, and false otherwise.
  */
  get is_finished () {
    if (this._is_comment_list) {
      return !this._more || !this._more.children.length;
    }
    return !this.uri || this.after === null && this.before === null;
  }
  /**
  * @summary Fetches some more items and adds them to this Listing.
  * @param {number} [amount] The number of items to fetch. If this is not defined, one more "batch" of items is fetched;
  the size of a batch depends on the type of Listing this is, as well as the requester's reddit preferences.
  * @returns {Promise} An updated version of this listing with `amount` items added on.
  */
  fetch_more (amount = this.limit) {
    if (typeof amount !== 'number') {
      throw new errors.InvalidMethodCallError('Failed to fetch Listing. (amount must be a Number.)');
    }
    if (amount <= 0 || this.is_finished) {
      return [];
    }
    if (this._is_comment_list) {
      return promise_wrap(this._fetch_more_comments(amount).then(() => this));
    }
    if (!this.uri) {
      return [];
    }
    return promise_wrap(this._fetch_more_regular(amount).then(() => this));
  }
  async _fetch_more_regular (amount) {
    const limit_for_request = Math.min(amount, this.limit) || this.limit;
    const request_params = _.merge({after: this.after, before: this.before, limit: limit_for_request}, this.constant_params);
    const response = await this._ac[`_${this.method}`]({
      uri: this.uri,
      qs: request_params,
      limit: limit_for_request
    }).then(this._transform);
    this.push(..._.toArray(response));
    this.before = response.before;
    this.after = response.after;
    return response.slice(0, amount).concat(await this.fetch_more(amount - response.length));
  }
  /* Pagination for comments works differently than it does for most other things; rather than sending a link to the next page
  within a Listing, reddit sends the last comment in the list as as a `more` object, with links to all the remaining comments
  in the thread. */
  async _fetch_more_comments (...args) {
    const new_comments = this._more ? await this._more.fetch_more(...args) : [];
    this.push(..._.toArray(new_comments));
    return new_comments;
  }
  /**
  * @summary Fetches all of the items in this Listing, only stopping when there are none left.
  * @returns {Promise} The updated version of this Listing. Keep in mind that this method has the potential to exhaust your
  ratelimit quickly if the Listing doesn't have a clear end (e.g. with posts on the front page), so use it with discretion.
  */
  fetch_all () {
    return this.fetch_more(Infinity);
  }
  /**
  * @summary Fetches items until a given length is reached.
  * @param {object} $0
  * @param {number} $0.length The maximum length that the Listing should have after completion. The length might end up
  being less than this if the true number of available items in the Listing is less than `$0.length`. For example, this
  can't fetch 200 comments on a Submission that only has 100 comments in total.
  * @returns {Promise} The updated Listing
  */
  fetch_until ({length}) {
    return this.fetch_more(length - this.length);
  }
  inspect () {
    return `Listing ${util.inspect(_.toArray(this))}`;
  }
};

module.exports = Listing;
