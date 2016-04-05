'use strict';
const _ = require('lodash');
const helpers = require('../helpers');
const constants = require('../constants');
const api_type = 'json';

const more = class {
  constructor (options, _ac) {
    _.assign(this, options);
    this._ac = _ac;
  }
  /* Requests to /api/morechildren are capped at 20 comments at a time, but requests to /api/info are capped at 100, so
  it's easier to send to the latter. The disadvantage is that comment replies are not automatically sent from requests
  to /api/info. */
  async fetch_more (options, start_index = 0) {
    if (options.amount <= 0 || start_index >= this.children.length) {
      return [];
    }
    if (!options.skip_replies) {
      return this.fetch_tree(options, start_index);
    }
    const ids = this._get_id_slice(Math.min(options.amount, constants.MAX_API_INFO_AMOUNT), start_index).map(id => `t1_${id}`);
    // Requests are capped at 100 comments. Send lots of requests recursively to get the comments, then concatenate them.
    // (This speed-requesting is only possible with comment Listings since the entire list of ids is present initially.)
    const promise_for_this_batch = this._ac._get_listing({uri: 'api/info', qs: {id: ids.join(',')}});
    const next_request_options = {...options, amount: options.amount - ids.length};
    const promise_for_remaining_items = this.fetch_more(next_request_options, start_index + ids.length);
    return _.toArray(await promise_for_this_batch).concat(await promise_for_remaining_items);
  }
  async fetch_tree (options, start_index) {
    if (options.amount <= 0 || start_index >= this.children.length) {
      return [];
    }
    const ids = this._get_id_slice(Math.min(options.amount, constants.MAX_API_MORECHILDREN_AMOUNT), start_index);
    const result_trees = await this._ac._get({
      uri: 'api/morechildren',
      qs: {api_type, children: ids.join(','), link_id: this.link_id}
    }).tap(helpers._handle_json_errors).then(res => {
      return res.json.data.things;
    }).mapSeries(helpers._add_empty_replies_listing).then(helpers._build_replies_tree);
    const next_request_options = {...options, amount: options.amount - ids.length};
    return _.toArray(result_trees).concat(await this.fetch_more(next_request_options, start_index + ids.length));
  }
  _clone () {
    return new more({
      count: this.count,
      link_id: this.link_id,
      parent_id: this.parent_id,
      id: this.id,
      name: this.name,
      children: _.clone(this.children)
    }, this._ac);
  }
  _get_id_slice (amount, start_index) {
    return this.children.slice(start_index, start_index + amount);
  }
};

module.exports = more;
