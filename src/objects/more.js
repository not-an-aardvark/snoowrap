'use strict';
const _ = require('lodash');
const helpers = require('../helpers');
const constants = require('../constants');
const api_type = 'json';

const more = class {
  constructor (options, _r) {
    _.assign(this, options);
    this._r = _r;
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
      if (!this._continued_replies_cache) {
        this._continued_replies_cache = await this._r.get_comment(this.parent_id.slice(3)).fetch().get('replies');
      }
      if (this._continued_replies_cache.length - this._continued_start_index < options.amount) {
        this._continued_replies_cache = await this._continued_replies_cache.fetch_more({
          amount: options.amount - this._continued_replies_cache.length - this._continued_start_index
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
