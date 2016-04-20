'use strict';
const _ = require('lodash');
const helpers = require('../helpers');
const constants = require('../constants');
const api_type = 'json';

/**
* The `more` class is a helper representing reddit's exposed `more` type in comment threads, used to fetch additional comments
on a thread.
* No instances of the `more` class are exposed externally by snoowrap; instead, comment lists are exposed as Listings.
Additional replies on an item can be fetched by calling `fetch_more` on a Listing, in the same manner as what would be done
with a Listing of posts. snoowrap should handle the differences internally, and expose a nearly-identical interface for the
two use-cases.

Combining reddit's `Listing` and `more` objects has the advantage of having a more consistent exposed interface; for example,
if a consumer iterates over the comments on a Submission, all of the iterated items will actually be Comment objects, so the
consumer won't encounter an unexpected `more` object at the end. However, there are a few disadvantages, namely that (a) this
leads to an increase in internal complexity, and (b) there are a few cases where reddit's `more` objects have different amounts
of available information (e.g. all the child IDs of a `more` object are known on creation), which leads to different optimal
behavior.
*/

const more = class {
  constructor (options, _r) {
    _.assign(this, options);
    this._r = _r;
    /* Reddit's `more` objects behave a bit differently for deep comment chains -- at a certain point, the `more` objects
    become empty, with name `t1__`. At this point, it is necessary to load the parent comment manually in order to continue
    traversing the comment tree. (On the HTML site, this is what occurs when a "Continue this thread" link appears.)
    Items in these "continued threads" need to be fetched a bit differently, since the child IDs aren't already provided by
    the reddit site. */
    this._is_continued_thread = this.name === 't1__';
    this._continued_replies_cache = null;
    this._continued_start_index = 0;
  }
  /* Requests to /api/morechildren are capped at 20 comments at a time, but requests to /api/info are capped at 100, so
  it's easier to send to the latter. The disadvantage is that comment replies are not automatically sent from requests
  to /api/info. */
  async fetch_more (options, start_index = 0) {
    if (options.amount <= 0 || !this._is_continued_thread && start_index >= this.children.length) {
      return [];
    }
    if (this._is_continued_thread) {
      /* Cache the replies to continued threads to avoid having to make repeated requests. `this._continued_replies_cache`
      will be a Listing containing Comment objects which are children of the current `more` object. `this._continued_start_index
      is a number (default 0) determining where in the cache this `more` object should start reading comments. (For
      example, a `this._continued_start_index` of 2 indicates that when this.fetch_more() is called, the first element in the
      returned list of comments will be the element at index 2 in the cache.) This is necessary because if fetch_more() is
      called from a Listing, the new Listing that gets returned must have a different `more` object internally (since it should
      fetch items starting at a different point), but it can still retain the same cache, so it is easiest to represent the
      difference with a numerical offset in the cache. */
      if (!this._continued_replies_cache) {
        // If the cache doesn't exist yet, initialize it by fetching a listing of replies to the given parent.
        this._continued_replies_cache = await this._r.get_comment(this.parent_id.slice(3)).fetch().get('replies');
      }
      if (this._continued_replies_cache.length - this._continued_start_index < options.amount) {
        /* It's possible that the cache will not contain enough elements to satisfy the desired amount, so update
        the cache to fetch the remaining elements. The total number of items to return should be `options.amount`, and
        the number of cached replies that will be returned in this batch is the total number of cached items minus the start
        index, i.e. `this._continued_replies_cache.length - this._continued_start_index`. Therefore, the number of additional
        items that should be fetched is `options.amount - (this._continued_replies_cache.length - this._continued_start_index)`
        ` = options.amount - this._continued_replies_cache.length + this._continued_start_index`. */
        this._continued_replies_cache = await this._continued_replies_cache.fetch_more({
          amount: options.amount - this._continued_replies_cache.length + this._continued_start_index
        });
      }
      const end_index = this._continued_start_index + options.amount;
      return _.toArray(this._continued_replies_cache).slice(this._continued_start_index, end_index);
    }
    if (!options.skip_replies) {
      return this.fetch_tree(options, start_index);
    }
    const ids = this._get_id_slice(Math.min(options.amount, constants.MAX_API_INFO_AMOUNT), start_index).map(id => `t1_${id}`);
    // Requests are capped at 100 comments. Send lots of requests recursively to get the comments, then concatenate them.
    // (This speed-requesting is only possible with comment Listings since the entire list of ids is present initially.)
    const promise_for_this_batch = this._r._get_listing({uri: 'api/info', qs: {id: ids.join(',')}});
    const next_request_options = {...options, amount: options.amount - ids.length};
    const promise_for_remaining_items = this.fetch_more(next_request_options, start_index + ids.length);
    return _.toArray(await promise_for_this_batch).concat(await promise_for_remaining_items);
  }
  async fetch_tree (options, start_index) {
    if (options.amount <= 0 || start_index >= this.children.length) {
      return [];
    }
    const ids = this._get_id_slice(Math.min(options.amount, constants.MAX_API_MORECHILDREN_AMOUNT), start_index);
    const result_trees = await this._r._get({
      uri: 'api/morechildren',
      qs: {api_type, children: ids.join(','), link_id: this.link_id}
    }).tap(helpers._handle_json_errors).then(res => {
      return res.json.data.things;
    }).mapSeries(helpers._add_empty_replies_listing).then(helpers._build_replies_tree);
    const next_request_options = {...options, amount: options.amount - ids.length};
    return _.toArray(result_trees).concat(await this.fetch_more(next_request_options, start_index + ids.length));
  }
  _clone () {
    return new more(_.clone(_.pick(this, Object.getOwnPropertyNames(this))), this._r);
  }
  _remove_leading_children (new_start_index) {
    if (this._is_continued_thread) {
      this._continued_start_index += new_start_index;
    } else {
      this.children = this.children.slice(new_start_index);
    }
  }
  get is_finished () {
    if (this._is_continued_thread) {
      return !!this._continued_replies_cache
        && this._continued_replies_cache.length === this._continued_start_index
        && this._continued_replies_cache.is_finished;
    }
    return !this.children.length;
  }
  _get_id_slice (amount, start_index) {
    return this.children.slice(start_index, start_index + amount);
  }
};

module.exports = more;
