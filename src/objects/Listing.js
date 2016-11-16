import {clone, defaults, defaultsDeep, isEmpty, omitBy, pick} from 'lodash';
import Promise from '../Promise.js';
import util from 'util';
import {parse as urlParse} from 'url';
import {defineInspectFunc} from '../helpers.js';
import {InvalidMethodCallError} from '../errors.js';
import {default as More, emptyChildren} from './More.js';

const INTERNAL_DEFAULTS = {
  _query: {},
  _transform: value => value,
  _method: 'get',
  _isCommentList: false,
  _link_id: null,
  _uri: null,
  _more: null,
  _cachedLookahead: null
};

/**
* A class representing a list of content. This is a subclass of the native Array object, so it has all the properties of
an Array (length, forEach, etc.) in addition to some added methods. The Listing can be extended by using the
[#fetchMore()]{@link Listing#fetchMore} and
[#fetchAll()]{@link Listing#fetchAll} functions. Note that these methods return new Listings, rather than mutating the
original Listing.
*
* Most methods that return Listings will also accept `limit`, `after`, `before`, `show`, and `count` properties.
*
* If you've used the reddit API before (or used other API wrappers like [PRAW](https://praw.readthedocs.org/en/stable/)), you
might know that reddit uses a `MoreComments` object in its raw JSON responses, representing comments that have been stubbed
out of Listings. In snoowrap, there are no exposed `MoreComments` objects; the objects returned by the reddit API are
stripped from Listings and are used internally as sources for the `fetchMore` functions. This means that in snoowrap, Listings
that contain Comments can be used/expanded in the same manner as Listings that don't contain Comments, and for the most part
you don't have to worry about the distinction.

(Incidentally, if you encounter a Listing that *does* contain a `MoreComments` object then it's a bug, so please report it.)

* <style> #Listing {display: none} </style>
* @extends Array
*/
const Listing = class Listing extends Array {
  constructor (options = {}, _r) {
    super();
    if (!(this instanceof Listing)) {
      // Safari 9 has an incorrect implementation of classes that extend Arrays. As a workaround,
      // manually set the constructor and prototype.
      this.constructor = Listing;
      Object.setPrototypeOf(this, Listing.prototype);
    }
    this.push(...options.children || []);
    this._r = _r;
    this._cachedLookahead = options._cachedLookahead;
    defaultsDeep(this, pick(options, Object.keys(INTERNAL_DEFAULTS)), INTERNAL_DEFAULTS);
    Object.assign(this._query, pick(options, ['before', 'after']));
    if (options.children && options.children[options.children.length - 1] instanceof More) {
      this._setMore(this.pop());
    }
  }
  _setUri (value) {
    const parsedUri = urlParse(value, true);
    this._uri = parsedUri.pathname;
    defaultsDeep(this._query, parsedUri.query);
    if (parsedUri.query.before) {
      this._query.after = null;
    } else {
      this._query.before = null;
    }
  }
  /**
  * @summary A getter that indicates whether this Listing has any more items to fetch.
  * @type {boolean}
  */
  get isFinished () {
    // The process of checking whether a Listing is 'finished' varies depending on what kind of Listing it is.
    return this._isCommentList
      /* For comment Listings (i.e. Listings containing comments and comment replies, sourced by `more` objects): A Listing is
      *never* finished if it has a cached lookahead (i.e. extra items that were fetched from a previous request). If there is
      no cached lookahead, a Listing is finished iff it has an empty `more` object. */
      ? isEmpty(this._cachedLookahead) && !!this._more && isEmpty(this._more.children)
      /* For non-comment Listings: A Listing is always finished if it has no URI (since there would be nowhere to fetch items
      from). If it has a URI, a Listing is finished iff its `before` and `after` query are both `null`. This is because reddit
      returns a value of `null` as the `after` and `before` parameters to signify that a Listing is complete.

      It is important to check for `null` here rather than any falsey value, because when an empty Listing is initialized, its
      `after` and `before` properties are both `undefined`, but calling these empty Listings `finished` would be incorrect. */
      : !this._uri || (this._query.after === null && this._query.before === null);
  }
  get is_finished () {
    // camel-case alias for backwards-compatibility.
    // As a getter, the `isFinished` property doesn't have an alias like everything else.
    return this.isFinished;
  }
  /**
  * @summary Fetches some more items
  * @param {object} options
  * @param {number} options.amount The number of items to fetch.
  * @param {boolean} [options.skipReplies=false] For a Listing that contains comment objects on a Submission, this option can
  be used to save a few API calls, provided that only top-level comments are being examined. If this is set to `true`, snoowrap
  is able to fetch 100 Comments per API call rather than 20, but all returned Comments will have no fetched replies by default.
  *
  * Internal details: When `skipReplies` is set to `true`, snoowrap uses reddit's `api/info` endpoint to fetch Comments. When
  `skipReplies` is set to `false`, snoowrap uses reddit's `api/morechildren` endpoint. It's worth noting that reddit does
  not allow concurrent requests to the `api/morechildren` endpoint by the same account.
  * @param {boolean} [options.append=true] If `true`, the resulting Listing will contain the existing elements in addition to
  the newly-fetched elements. If `false`, the resulting Listing will only contain the newly-fetched elements.
  * @returns {Promise} A new Listing containing the newly-fetched elements. If `options.append` is `true`, the new Listing will
  also contain all elements that were in the original Listing. Under most circumstances, the newly-fetched elements will appear
  at the end of the new Listing. However, if reverse pagination is enabled (i.e. if this Listing was created with a `before`
  query parameter), then the newly-fetched elements will appear at the beginning. In any case, continuity is maintained, i.e.
  the order of items in the Listing will be the same as the order in which they appear on reddit.
  * @example
  * r.getHot({limit: 25}).then(myListing => {
  *   console.log(myListing.length); // => 25
  *   myListing.fetchMore({amount: 10}).then(extendedListing => {
  *     console.log(extendedListing.length); // => 35
  *   })
  * });
  */
  fetchMore (options) {
    const parsedOptions = defaults(
      typeof options === 'number' ? {amount: options} : clone(options),
      // Accept either `skip_replies` or `skipReplies` for backwards compatibility.
      {append: true, skipReplies: options.skip_replies}
    );
    if (typeof parsedOptions.amount !== 'number' || Number.isNaN(parsedOptions.amount)) {
      throw new InvalidMethodCallError('Failed to fetch Listing. (`amount` parameter was missing or invalid)');
    }
    if (parsedOptions.amount <= 0 || this.isFinished) {
      return this._r._promiseWrap(Promise.resolve(parsedOptions.append ? this._clone() : this._clone()._empty()));
    }
    if (this._cachedLookahead) {
      const cloned = this._clone();
      cloned.push(...cloned._cachedLookahead.splice(0, parsedOptions.amount));
      return cloned.fetchMore(parsedOptions.amount - cloned.length + this.length);
    }
    return this._r._promiseWrap(
      this._more ? this._fetchMoreComments(parsedOptions) : this._fetchMoreRegular(parsedOptions)
    );
  }
  _fetchMoreRegular (options) {
    const query = omitBy(clone(this._query), value => value === null || value === undefined);
    if (!this._isCommentList) {
      /* Reddit returns a different number of items per request depending on the `limit` querystring property specified in the
      request. If no `limit` property is specified, reddit returns some number of items depending on the user's preferences
      (currently 25 items with default preferences). If a `limit` property is specified, then reddit returns `limit` items per
      batch. However, this is capped at 100, so if a `limit` larger than 100 items is specified, reddit will only return 100
      items in the batch. (The cap of 100 could plausibly change to a different amount in the future.)

      However, one caveat is that reddit's parser doesn't understand the javascript `Infinity` global. If `limit=Infinity` is
      provided in the querystring, reddit won't understand the parameter so it'll just act as if no parameter was provided, and
      will return 25 items in the batch. This is suboptimal behavior as far as snoowrap is concerned, because it means that 4
      times as many requests are needed to fetch the entire listing.

      To get around the issue, snoowrap caps the `limit` property at Number.MAX_SAFE_INTEGER when sending requests. This ensures
      that `Infinity` will never be sent as part of the querystring, so reddit will always return the maximal 100 items per
      request if the desired amount of items is large. */
      query.limit = Math.min(options.amount, Number.MAX_SAFE_INTEGER);
    }
    return this._r.oauthRequest({
      uri: this._uri,
      qs: query,
      method: this._method
    }).then(this._transform).then(response => {
      const cloned = this._clone();
      if (!options.append) {
        cloned._empty();
      }
      if (cloned._query.before) {
        cloned.unshift(...response);
        cloned._query.before = response._query.before;
        cloned._query.after = null;
      } else {
        cloned.push(...response);
        cloned._query.before = null;
        cloned._query.after = response._query.after;
      }
      if (this._isCommentList) {
        cloned._more = cloned._more || response._more || emptyChildren;
        if (response.length > options.amount) {
          cloned._cachedLookahead = Array.from(cloned.splice(options.amount));
        }
      }
      return cloned.fetchMore({...options, append: true, amount: options.amount - response.length});
    });
  }
  /* Pagination for comments works differently than it does for most other things; rather than sending a link to the next page
  within a Listing, reddit sends the last comment in the list as as a `more` object, with links to all the remaining comments
  in the thread. */
  _fetchMoreComments (options) {
    return this._more.fetchMore(options).then(moreComments => {
      const cloned = this._clone();
      if (!options.append) {
        cloned._empty();
      }
      cloned.push(...moreComments);
      cloned._more.children = cloned._more.children.slice(options.amount);
      return cloned;
    });
  }
  /**
  * @summary Fetches all of the items in this Listing, only stopping when there are none left.
  * @param {object} [options] Fetching options -- see {@link Listing#fetchMore}
  * @returns {Promise} A new fully-fetched Listing. Keep in mind that this method has the potential to exhaust your
  ratelimit quickly if the Listing doesn't have a clear end (e.g. with posts on the front page), so use it with discretion.
  * @example
  *
  * r.getMe().getUpvotedContent().fetchAll().then(console.log)
  * // => Listing [ Submission { ... }, Submission { ... }, ... ]
  */
  fetchAll (options) {
    return this.fetchMore({...options, amount: Infinity});
  }
  fetchUntil (options) {
    this._r._warn('Listing#fetchUntil is deprecated -- use Listing#fetchMore instead.');
    return this.fetchMore({...options, append: true, amount: options.length - this.length});
  }
  _clone ({deep = false} = {}) {
    const properties = pick(this, Object.keys(INTERNAL_DEFAULTS));
    properties._query = clone(properties._query);
    properties._cachedLookahead = clone(properties._cachedLookahead);
    properties._more = this._more && this._more._clone();
    const shallowChildren = Array.from(this);
    properties.children = deep
      ? shallowChildren.map(item => '_clone' in item && typeof item._clone === 'function' ? item._clone({deep}) : item)
      : shallowChildren;
    return new Listing(properties, this._r);
  }
  _setMore (moreObj) {
    this._more = moreObj;
    this._isCommentList = true;
  }
  _empty () {
    this.splice(0, this.length);
    return this;
  }
  toJSON () {
    return Array.from(this).map(item => item && item.toJSON ? item.toJSON() : item);
  }
};

defineInspectFunc(Listing.prototype, function () {
  return `Listing ${util.inspect(Array.from(this))}`;
});

export default Listing;
