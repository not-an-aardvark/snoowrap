import {concat, flatten, forEach, pick, remove} from 'lodash';
import Promise from '../Promise.js';
import {addEmptyRepliesListing, buildRepliesTree, handleJsonErrors} from '../helpers.js';
import {MAX_API_INFO_AMOUNT, MAX_API_MORECHILDREN_AMOUNT} from '../constants.js';

const api_type = 'json';

/**
* The `More` class is a helper representing reddit's exposed `more` type in comment threads, used to fetch additional comments
on a thread.
* No instances of the `More` class are exposed externally by snoowrap; instead, comment lists are exposed as Listings.
Additional replies on an item can be fetched by calling `fetchMore` on a Listing, in the same manner as what would be done
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
    Object.assign(this, options);
    this._r = _r;
  }
  /* Requests to /api/morechildren are capped at 20 comments at a time, but requests to /api/info are capped at 100, so
  it's easier to send to the latter. The disadvantage is that comment replies are not automatically sent from requests
  to /api/info. */
  fetchMore (options, startIndex = 0) {
    if (options.amount <= 0 || startIndex >= this.children.length) {
      return Promise.resolve([]);
    }
    if (!options.skipReplies) {
      return this.fetchTree(options, startIndex);
    }
    const ids = getNextIdSlice(this.children, startIndex, options.amount, MAX_API_INFO_AMOUNT).map(id => `t1_${id}`);
    // Requests are capped at 100 comments. Send lots of requests recursively to get the comments, then concatenate them.
    // (This speed-requesting is only possible with comment Listings since the entire list of ids is present initially.)
    const promiseForThisBatch = this._r._getListing({uri: 'api/info', qs: {id: ids.join(',')}});
    const nextRequestOptions = {...options, amount: options.amount - ids.length};
    const promiseForRemainingItems = this.fetchMore(nextRequestOptions, startIndex + ids.length);
    return Promise.all([promiseForThisBatch, promiseForRemainingItems]).then(flatten);
  }
  fetchTree (options, startIndex) {
    if (options.amount <= 0 || startIndex >= this.children.length) {
      return Promise.resolve([]);
    }
    const ids = getNextIdSlice(this.children, startIndex, options.amount, MAX_API_MORECHILDREN_AMOUNT);
    return this._r._get({
      uri: 'api/morechildren',
      qs: {api_type, children: ids.join(','), link_id: this.link_id || this.parent_id}
    }).tap(handleJsonErrors)
      .then(res => res.json.data.things)
      .map(addEmptyRepliesListing)
      .then(buildRepliesTree)
      .then(resultTrees => {
        /* Sometimes, when sending a request to reddit to get multiple comments from a `more` object, reddit decides to only
        send some of the requested comments, and then stub out the remaining ones in a smaller `more` object. ( ¯\_(ツ)_/¯ )
        In these cases, recursively fetch the smaller `more` objects as well. */
        const childMores = remove(resultTrees, c => c instanceof More);
        forEach(childMores, c => {
          c.link_id = this.link_id || this.parent_id;
        });
        return Promise.mapSeries(childMores, c => c.fetchTree({...options, amount: Infinity}, 0)).then(expandedTrees => {
          return this.fetchMore({...options, amount: options.amount - ids.length}, startIndex + ids.length).then(nexts => {
            return concat(resultTrees, flatten(expandedTrees), nexts);
          });
        });
      });
  }
  _clone () {
    return new More(pick(this, Object.getOwnPropertyNames(this)), this._r);
  }
};

function getNextIdSlice (children, startIndex, desiredAmount, limit) {
  return children.slice(startIndex, startIndex + Math.min(desiredAmount, limit));
}

export const emptyChildren = new More({children: []});
export default More;
