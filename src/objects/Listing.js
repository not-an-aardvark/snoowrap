import {identity, assign, defaults, defaultsDeep, pick, keys, last, isObject, clone, isNumber, isFunction} from 'lodash';
import Promise from 'bluebird';
import promise_wrap from 'promise-chains';
import {inspect} from 'util';
import {parse as url_parse} from 'url';
import {InvalidMethodCallError} from '../errors.js';
import More from './More.js';

const INTERNAL_DEFAULTS = {
  _query: {},
  _transform: identity,
  _method: 'get',
  _is_comment_list: false,
  _link_id: null,
  _uri: null,
  _more: null,
  _cached_lookahead: null
};

/**
* A class representing a list of content. This is a subclass of the native Array object, so it has all the properties of
an Array (length, forEach, etc.) in addition to some added methods. The Listing can be extended by using the
[#fetch_more()]{@link Listing#fetch_more}, [#fetch_until]{@link Listing#fetch_until}, and
[#fetch_all()]{@link Listing#fetch_all} functions. Note that these methods return new Listings, rather than mutating the
original Listing.
*
* Most methods that return Listings will also accept `limit`, `after`, `before`, `show`, and `count` properties.
*
* If you've used the reddit API before (or used other API wrappers like [PRAW](https://praw.readthedocs.org/en/stable/)), you
might know that reddit uses a `MoreComments` object in its raw JSON responses, representing comments that have been stubbed
out of Listings. In snoowrap, there are no exposed `MoreComments` objects; the objects returned by the reddit API are
stripped from Listings and are used internally as sources for the `fetch_more` functions. This means that in snoowrap, Listings
that contain Comments can be used/expanded in the same manner as Listings that don't contain Comments, and for the most part
you don't have to worry about the distinction.

(Incidentally, if you encounter a Listing that *does* contain a `MoreComments` object, then it's a bug so please report it.)

* <style> #Listing {display: none} </style>
* @extends Array
*/
const Listing = class extends Array {
  constructor (options = {}, _r) {
    super();
    this._r = _r;
    this.push(...options.children || []);
    defaults(this, {_cached_lookahead: options._cached_lookahead});
    defaultsDeep(this, pick(options, keys(INTERNAL_DEFAULTS)), INTERNAL_DEFAULTS);
    assign(this._query, pick(options, ['before', 'after']));
    if (last(options.children) instanceof More) {
      this._set_more(this.pop());
    }
  }
  _set_uri (value) {
    const parsed_uri = url_parse(value, true);
    this._uri = parsed_uri.pathname;
    defaultsDeep(this._query, parsed_uri.query);
    if (parsed_uri.query.before) {
      this._query.after = null;
    } else {
      this._query.before = null;
    }
  }
  /**
  * @summary This is a getter that is true if there are no more items left to fetch, and false otherwise.
  */
  get is_finished () {
    if (this._more) {
      return !this._more.children.length;
    }
    if (this._cached_lookahead && this._cached_lookahead.length) {
      return false;
    }
    if (this._is_comment_list && this.length) {
      return true;
    }
    return !this._uri || this._query.after === null && this._query.before === null;
  }
  /**
  * @summary Fetches some more items
  * @param {object} options
  * @param {number} options.amount The number of items to fetch.
  * @param {boolean} [options.skip_replies=false] For a Listing that contains comment objects on a Submission, this option can
  be used to save a few API calls, provided that only top-level comments are being examined. If this is set to `true`, snoowrap
  is able to fetch 100 Comments per API call rather than 20, but all returned Comments will have no fetched replies by default.
  *
  * Internal details: When `skip_replies` is set to `true`, snoowrap uses reddit's `api/info` endpoint to fetch Comments. When
  `skip_replies` is set to `false`, snoowrap uses reddit's `api/morechildren` endpoint. It's worth noting that reddit does
  not allow concurrent requests to the `api/morechildren` endpoint by the same account.
  * @returns {Promise} A new Listing containing all of the elements in this Listing, in addition to the newly-fetched elements.
  Under most circumstances, the newly-fetched elements will appear at the end of the new Listing. However, if reverse pagination
  is enabled (i.e. if this Listing was created with a `before` query parameter), then the newly-fetched elements will appear
  at the beginning. In either case, continuity is maintained, i.e. the order of items in the Listing will be the same as the
  order in which they appear on reddit.
  * @example
  * r.get_hot({limit: 25}).then(my_listing => {
  *   console.log(my_listing.length); // => 25
  *   my_listing.fetch_more({amount: 10}).then(extended_listing => {
  *     console.log(extended_listing.length); // => 35
  *   })
  * });
  */
  fetch_more (options) {
    const parsed_options = defaults(isObject(options) ? clone(options) : {amount: options}, {skip_replies: false});
    if (!isNumber(parsed_options.amount) || Number.isNaN(parsed_options.amount)) {
      throw new InvalidMethodCallError('Failed to fetch Listing. (`amount` parameter was missing or invalid)');
    }
    if (parsed_options.amount <= 0 || this.is_finished) {
      return promise_wrap(Promise.resolve(this._clone()));
    }
    if (this._cached_lookahead) {
      const cloned = this._clone();
      cloned.push(...cloned._cached_lookahead.splice(0, parsed_options.amount));
      return cloned.fetch_more(parsed_options.amount - cloned.length + this.length);
    }
    return promise_wrap(this._more ? this._fetch_more_comments(parsed_options) : this._fetch_more_regular(parsed_options));
  }
  _fetch_more_regular (options) {
    return this._r[`_${this._method}`]({
      uri: this._uri,
      qs: {...this._query, limit: this._is_comment_list ? undefined : options.amount}
    }).then(this._transform).then(response => {
      const cloned = this._clone();
      if (cloned._query.before) {
        cloned.unshift(...Array.from(response));
        cloned._query.before = response._query.before;
        cloned._query.after = null;
      } else {
        cloned.push(...Array.from(response));
        cloned._query.before = null;
        cloned._query.after = response._query.after;
      }
      if (this._is_comment_list) {
        cloned._more = cloned._more || response._more;
        if (response.length > options.amount) {
          cloned._cached_lookahead = cloned.splice(options.amount);
        }
      }
      return cloned.fetch_more({...options, amount: options.amount - response.length});
    });
  }
  /* Pagination for comments works differently than it does for most other things; rather than sending a link to the next page
  within a Listing, reddit sends the last comment in the list as as a `more` object, with links to all the remaining comments
  in the thread. */
  async _fetch_more_comments (options) {
    const cloned = this._clone();
    const more_comments = await this._more.fetch_more(options);
    cloned.push(...Array.from(more_comments));
    cloned._more._remove_leading_children(options.amount);
    return cloned;
  }
  /**
  * @summary Fetches all of the items in this Listing, only stopping when there are none left.
  * @param {object} [options]
  * @param {boolean} [options.skip_replies=false] See {@link Listing#fetch_more}
  * @returns {Promise} A new fully-fetched Listing. Keep in mind that this method has the potential to exhaust your
  ratelimit quickly if the Listing doesn't have a clear end (e.g. with posts on the front page), so use it with discretion.
  * @example
  *
  * r.get_me().get_upvoted_content().fetch_all().then(console.log)
  * // => Listing [ Submission { ... }, Submission { ... }, ... ]
  */
  fetch_all (options) {
    return this.fetch_more({...options, amount: Infinity});
  }
  fetch_until (options) {
    this._r.log.warn('Listing.prototype.fetch_until is deprecated -- use Listing.prototype.fetch_more instead.');
    return this.fetch_more({...options, amount: options.length - this.length});
  }
  inspect () {
    return `Listing ${inspect(Array.from(this))}`;
  }
  _clone ({deep = false} = {}) {
    const properties = pick(this, keys(INTERNAL_DEFAULTS));
    properties._query = clone(properties._query);
    properties._cached_lookahead = clone(properties._cached_lookahead);
    properties._more = this._more && this._more._clone();
    const shallow_children = Array.from(this);
    properties.children = deep ? shallow_children.map(item => {
      return '_clone' in item && isFunction(item._clone) ? item._clone({deep}) : item;
    }) : shallow_children;
    return new Listing(properties, this._r);
  }
  _set_more (more_obj) {
    this._more = more_obj;
    this._is_comment_list = true;
  }
  toJSON () {
    return Array.from(this).map(item => item && item.toJSON ? item.toJSON() : item);
  }
};

export default Listing;
