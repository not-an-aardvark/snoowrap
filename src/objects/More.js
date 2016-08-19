import {assign, concat, flatten, forEach, pick, remove} from 'lodash';
import Promise from '../Promise.js';
import {add_empty_replies_listing, build_replies_tree, handle_json_errors} from '../helpers.js';
import {MAX_API_INFO_AMOUNT, MAX_API_MORECHILDREN_AMOUNT} from '../constants.js';
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

const More = class More {
  constructor (options, _r) {
    assign(this, options);
    this._r = _r;
  }
  /* Requests to /api/morechildren are capped at 20 comments at a time, but requests to /api/info are capped at 100, so
  it's easier to send to the latter. The disadvantage is that comment replies are not automatically sent from requests
  to /api/info. */
  fetch_more (options, start_index = 0) {
    if (options.amount <= 0 || start_index >= this.children.length) {
      return Promise.resolve([]);
    }
    if (!options.skip_replies) {
      return this.fetch_tree(options, start_index);
    }
    const ids = get_next_id_slice(this.children, start_index, options.amount, MAX_API_INFO_AMOUNT).map(id => `t1_${id}`);
    // Requests are capped at 100 comments. Send lots of requests recursively to get the comments, then concatenate them.
    // (This speed-requesting is only possible with comment Listings since the entire list of ids is present initially.)
    const promise_for_this_batch = this._r._get_listing({uri: 'api/info', qs: {id: ids.join(',')}});
    const next_request_options = {...options, amount: options.amount - ids.length};
    const promise_for_remaining_items = this.fetch_more(next_request_options, start_index + ids.length);
    return Promise.all([promise_for_this_batch, promise_for_remaining_items]).then(flatten);
  }
  fetch_tree (options, start_index) {
    if (options.amount <= 0 || start_index >= this.children.length) {
      return Promise.resolve([]);
    }
    const ids = get_next_id_slice(this.children, start_index, options.amount, MAX_API_MORECHILDREN_AMOUNT);
    return this._r._get({
      uri: 'api/morechildren',
      qs: {api_type, children: ids.join(','), link_id: this.link_id || this.parent_id}
    }).tap(handle_json_errors)
      .then(res => res.json.data.things)
      .map(add_empty_replies_listing)
      .then(build_replies_tree)
      .then(result_trees => {
        /* Sometimes, when sending a request to reddit to get multiple comments from a `more` object, reddit decides to only
        send some of the requested comments, and then stub out the remaining ones in a smaller `more` object. ( ¯\_(ツ)_/¯ )
        In these cases, recursively fetch the smaller `more` objects as well. */
        const child_mores = remove(result_trees, c => c instanceof More);
        forEach(child_mores, c => {
          c.link_id = this.link_id || this.parent_id;
        });
        return Promise.mapSeries(child_mores, c => c.fetch_tree({...options, amount: Infinity}, 0)).then(expanded_trees => {
          return this.fetch_more({...options, amount: options.amount - ids.length}, start_index + ids.length).then(nexts => {
            return concat(result_trees, flatten(expanded_trees), nexts);
          });
        });
      });
  }
  _clone () {
    return new More(pick(this, Object.getOwnPropertyNames(this)), this._r);
  }
};

function get_next_id_slice (children, start_index, desired_amount, limit) {
  return children.slice(start_index, start_index + Math.min(desired_amount, limit));
}

export const empty_children = new More({children: []});
export default More;
