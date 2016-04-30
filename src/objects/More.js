import _ from 'lodash';
import Promise from 'bluebird';
import helpers from '../helpers';
import constants from '../constants';
const api_type = 'json';

/**
* The `More` class is a helper representing reddit's exposed `more` type in comment threads, used to fetch additional comments
on a thread.
* No instances of the `More` class are exposed externally by snoowrap; instead, comment lists are exposed as Listings.
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

const More = class {
  constructor (options, _r) {
    _.assign(this, options);
    this._r = _r;
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
      qs: {api_type, children: ids.join(','), link_id: this.link_id || this.parent_id}
    }).tap(helpers._handle_json_errors).then(res => {
      return res.json.data.things;
    }).mapSeries(helpers._add_empty_replies_listing).then(helpers._build_replies_tree);
    /* Sometimes, when sending a request to reddit to get multiple comments from a `more` object, reddit decides to only send
    some of the requested comments, and then stub out the remaining ones in a smaller `more` object. ( ¯\_(ツ)_/¯ )
    In these cases, recursively fetch the smaller `more` objects as well. */
    const child_mores = _.remove(result_trees, c => c instanceof More);
    _.forEach(child_mores, c => {
      c.link_id = this.link_id || this.parent_id;
    });
    const expanded_child_mores = await Promise.mapSeries(child_mores, c => c.fetch_tree({...options, amount: Infinity}, 0));
    result_trees.push(..._.flatten(expanded_child_mores));
    const next_request_options = {...options, amount: options.amount - ids.length};
    return _.toArray(result_trees).concat(await this.fetch_more(next_request_options, start_index + ids.length));
  }
  _clone () {
    return new More(_.clone(_.pick(this, Object.getOwnPropertyNames(this))), this._r);
  }
  _remove_leading_children (new_start_index) {
    this.children = this.children.slice(new_start_index);
  }
  _get_id_slice (amount, start_index) {
    return this.children.slice(start_index, start_index + amount);
  }
};

export const empty_children = new More({children: []});

module.exports = More;
