import util from 'util'
import {defineInspectFunc} from '../helper'
import {isBrowser, URL} from '../helpers'
import {InvalidMethodCallError} from '../errors'
import More, {emptyChildren} from './More'
import type snoowrap from '../snoowrap'
import type {RedditContent, Comment} from './'
import type {HTTP_VERBS} from '../constants'
import type {Children} from '../interfaces'


interface ListingQuery {
  after?: string|null
  before?: string|null
  limit?: number
  show?: string
  count?: number
  t?: 'all'|'hour'|'day'|'week'|'month'|'year'
  time?: 'all'|'hour'|'day'|'week'|'month' |'year'
  [key: string]: any
}

interface ListingProps {
  _query: ListingQuery,
  _transform: (value: any) => any,
  _method: typeof HTTP_VERBS[number],
  _isCommentList: boolean,
  _link_id?: string,
  _uri?: string,
  _more?: More,
  _cachedLookahead: Comment[]
  _children: {[id: string]: Comment}
}

interface Options extends Partial<ListingProps> {
  after: string|null
  before: string|null
  children: any[]
  dist: number
  geo_filter: string|null
  modhash: string|null
}

interface FetchMoreOptions {
  amount: number
  skipReplies: boolean
  append: boolean
}

interface FetchAllOptions {
  skipReplies?: boolean
  append?: boolean
}

/**
 * A class representing a list of content. This is a subclass of the native Array object, so it has all the properties of
 * an Array (length, forEach, etc.) in addition to some added methods. The Listing can be extended by using the
 * [#fetchMore()]{@link Listing#fetchMore} and [#fetchAll()]{@link Listing#fetchAll} functions.
 * Note that these methods return new Listings, rather than mutating the original Listing.
 *
 * Most methods that return Listings will also accept `limit`, `after`, `before`, `show`, and `count` properties.
 *
 * If you've used the reddit API before (or used other API wrappers like [PRAW](https://praw.readthedocs.org/en/stable/)), you
 * might know that reddit uses a `More` object in its raw JSON responses, representing comments that have been stubbed
 * out of Listings. In snoowrap, there are no exposed `More` objects; the objects returned by the reddit API are
 * stripped from Listings and are used internally as sources for the `fetchMore` functions. This means that in snoowrap, Listings
 * that contain Comments can be used/expanded in the same manner as Listings that don't contain Comments, and for the most part
 * you don't have to worry about the distinction.
 *
 * (Incidentally, if you encounter a Listing that *does* contain a `More` object then it's a bug, so please report it.)
 *
 * <style> #Listing {display: none} </style>
 * @extends Array
 */
interface Listing extends ListingProps {}
class Listing<T extends RedditContent|{[key: string]: any} = RedditContent> extends Array<T> {
  ['constructor']: typeof Listing
  static _name = 'Listing'

  _r!: snoowrap

  constructor (
    {
      _transform = value => value,
      _method = 'get',
      _isCommentList = false,
      _cachedLookahead = [],
      _children = {},
      children = [],
      ...options
    } : Partial<Options> = {},
    _r?: snoowrap,
    public _hasFetched?: boolean
  ) {
    super()
    if (!(this instanceof Listing)) {
      /**
       * Safari 9 has an incorrect implementation of classes that extend Arrays. As a workaround,
       * manually set the constructor and prototype.
       */
      // @ts-ignore
      this.constructor = Listing
      Object.setPrototypeOf(this, Listing.prototype)
    }
    this.push(...children || [])
    this._r = _r!

    this._query = {...options._query}
    if (options.after !== undefined) this._query.after = options.after
    if (options.before !== undefined) this._query.before = options.before

    this._transform = _transform
    this._method = _method
    this._isCommentList = _isCommentList
    this._link_id = options._link_id
    this._uri = options._uri
    this._more = options._more
    this._cachedLookahead = _cachedLookahead
    this._children = _children

    if (children && children[children.length - 1] instanceof More) {
      this._setMore(children.pop())
    }
  }

  _setMore (moreObj: More) {
    this._more = moreObj
    this._isCommentList = true
  }

  _setUri (uri: string) {
    const parsedUri = new URL(uri)
    this._uri = parsedUri.pathname
    parsedUri.searchParams.forEach((value, key) => {
      // Why not just overriding all of them?
      if (this._query[key] === undefined) this._query[key] = value
    })
    if (parsedUri.searchParams.get('before')) {
      this._query.after = null
    } else {
      this._query.before = null
    }
  }

  /**
  * @summary A getter that indicates whether this Listing has any more items to fetch.
  */
  get isFinished () {
    // The process of checking whether a Listing is 'finished' varies depending on what kind of Listing it is.
    return this._isCommentList
      /**
       * For comment Listings (i.e. Listings containing comments and comment replies, sourced by `More` objects): A Listing is
       * *never* finished if it has a cached lookahead (i.e. extra items that were fetched from a previous request). If there is
       * no cached lookahead, a Listing is finished iff it has an empty `More` object.
       */
      ? !this._cachedLookahead.length && this._more && !this._more.children.length
      /**
       * For non-comment Listings: A Listing is always finished if it has no URI (since there would be nowhere to fetch items
       * from). If it has a URI, a Listing is finished iff its `before` and `after` query are both `null`. This is because reddit
       * returns a value of `null` as the `after` and `before` parameters to signify that a Listing is complete.
       *
       * It is important to check for `null` here rather than any falsey value, because when an empty Listing is initialized, its
       * `after` and `before` properties are both `undefined`, but calling these empty Listings `finished` would be incorrect.
       */
      : !this._uri || (this._query.after === null && this._query.before === null)
  }

  /**
   * @summary Fetches some more items
   * @param options Object of fetching options or the number of items to fetch.
   * @param options.amount The number of items to fetch.
   * @param {boolean} [options.append=true] If `true`, the resulting Listing will contain the existing elements in addition to
   * the newly-fetched elements. If `false`, the resulting Listing will only contain the newly-fetched elements.
   * @param {boolean} [options.skipReplies=false] For a Listing that contains comment objects on a Submission, this option can
   * be used to save a few API calls, provided that only top-level comments are being examined. If this is set to `true`, snoowrap
   * is able to fetch 100 Comments per API call rather than 20, but all returned Comments will have no fetched replies by default.
   *
   * Internal details: When `skipReplies` is set to `true`, snoowrap uses reddit's `api/info` endpoint to fetch Comments. When
   * `skipReplies` is set to `false`, snoowrap uses reddit's `api/morechildren` endpoint. It's worth noting that reddit does
   * not allow concurrent requests to the `api/morechildren` endpoint by the same account.
   * @returns A new Listing containing the newly-fetched elements. If `options.append` is `true`, the new Listing will
   * also contain all elements that were in the original Listing. Under most circumstances, the newly-fetched elements will appear
   * at the end of the new Listing. However, if reverse pagination is enabled (i.e. if this Listing was created with a `before`
   * query parameter), then the newly-fetched elements will appear at the beginning. In any case, continuity is maintained, i.e.
   * the order of items in the Listing will be the same as the order in which they appear on reddit.
   * @example
   * r.getHot({limit: 25}).then(myListing => {
   *   console.log(myListing.length) // => 25
   *   myListing.fetchMore({amount: 10}).then(extendedListing => {
   *     console.log(extendedListing.length) // => 35
   *   })
   * })
   */
  async fetchMore (options: Partial<FetchMoreOptions>|FetchMoreOptions['amount']): Promise<Listing<T>> {
    const {
      amount,
      append = true,
      skipReplies = false
    } = typeof options === 'number' ? {amount: options} : options
    if (typeof amount !== 'number' || Number.isNaN(amount)) {
      throw new InvalidMethodCallError('Failed to fetch Listing. (\'amount\' parameter was missing or invalid)')
    }
    if (amount <= 0 || this.isFinished) {
      return append ? this._clone() : this._clone()._empty()
    }
    if (this._cachedLookahead.length) {
      const cloned = this._clone()
      cloned.push(...<unknown>cloned._cachedLookahead.splice(0, amount) as T[])
      return cloned.fetchMore(amount - cloned.length + this.length)
    }
    const parsedOptions = {amount, append, skipReplies}
    return this._more ? this._fetchMoreComments(parsedOptions) : this._fetchMoreRegular(parsedOptions)
  }

  /**
   * @summary Fetches all of the items in this Listing, only stopping when there are none left.
   * @param options Fetching options -- see {@link Listing#fetchMore}
   * @returns A new fully-fetched Listing. Keep in mind that this method has the potential to exhaust your
   * ratelimit quickly if the Listing doesn't have a clear end (e.g. with posts on the front page), so use it with discretion.
   * @example
   *
   * r.getMe().getUpvotedContent().fetchAll().then(console.log)
   * // => Listing [ Submission { ... }, Submission { ... }, ... ]
   */
  fetchAll ({append = true, skipReplies = false}: FetchAllOptions = {}) {
    return this.fetchMore({append, skipReplies, amount: Infinity})
  }

  async _fetchMoreRegular (options: FetchMoreOptions) {
    const query: ListingProps['_query'] = {}
    for (const key of Object.keys(this._query)) {
      const value = this._query[key]
      if (value !== null && value !== undefined) query[key] = value
    }
    /**
     * Reddit returns a different number of items per request depending on the `limit` querystring property specified in the
     * request. If no `limit` property is specified, reddit returns some number of items depending on the user's preferences
     * (currently 25 items with default preferences). If a `limit` property is specified, then reddit returns `limit` items per
     * batch. However, this is capped at 100, so if a `limit` larger than 100 items is specified, reddit will only return 100
     * items in the batch. (The cap of 100 could plausibly change to a different amount in the future.)
     *
     * However, one caveat is that reddit's parser doesn't understand the javascript `Infinity` global. If `limit=Infinity` is
     * provided in the querystring, reddit won't understand the parameter so it'll just act as if no parameter was provided, and
     * will return 25 items in the batch. This is suboptimal behavior as far as snoowrap is concerned, because it means that 4
     * times as many requests are needed to fetch the entire listing.
     *
     * To get around the issue, snoowrap caps the `limit` property at Number.MAX_SAFE_INTEGER when sending requests. This ensures
     * that `Infinity` will never be sent as part of the querystring, so reddit will always return the maximal 100 items per
     * request if the desired amount of items is large.
     *
     * Keep in mind that the `limit` property is only specified when fetching non-comment listings. Any extra items within comment
     * listings will be sliced off and pushed to `this._cachedLookahead`.
     */
    if (!this._isCommentList) query.limit = Math.min(options.amount, Number.MAX_SAFE_INTEGER)
    let response: Listing<T> = await this._r.oauthRequest({
      url: this._uri,
      params: query,
      method: this._method
    })
    response = this._transform(response)
    const cloned = this._clone()
    if (!options.append) cloned._empty()
    if (cloned._query.before) {
      cloned.unshift(...response)
      cloned._query.before = response._query.before
      cloned._query.after = null
    } else {
      cloned.push(...response)
      cloned._query.before = null
      cloned._query.after = response._query.after
    }
    if (this._isCommentList) {
      cloned._more = cloned._more || response._more || emptyChildren()
      if (response.length > options.amount) {
        cloned._cachedLookahead = <unknown>Array.from(cloned.splice(options.amount)) as Comment[]
      }
    }
    cloned._children = {...cloned._children, ...response._children}
    return cloned.fetchMore({...options, append: true, amount: options.amount - response.length})
  }

  /**
   * Pagination for comments works differently than it does for most other things; rather than sending a link to the next page
   * within a Listing, reddit sends the last comment in the list as as a `more` object, with links to all the remaining comments
   * in the thread.
   */
  async _fetchMoreComments (options: FetchMoreOptions) {
    if (!this._more) throw new InvalidMethodCallError('Failed to fetch more comments. (More object is missing)')
    const moreComments = await this._more.fetchMore(options)
    const children = moreComments._children
    const cloned = this._clone()
    if (!options.append) cloned._empty()
    // Rebuild comments listing since Reddit doesn't return it in the right order sometimes
    for (const id of cloned._more!.children.splice(0, options.amount)) {
      const comment = children[id]
      // Ignore comments removed from listing
      if (comment) cloned.push(<unknown>comment as T)
    }
    cloned._children = {...cloned._children, ...children}
    cloned._more!.children = cloned._more!.children.slice(options.amount)
    return cloned
  }

  _empty () {
    this.splice(0, this.length)
    return this
  }

  _clone (deep = false, _children: Children = {}) {
    const properties: Partial<Options> = {
      _query: {...this._query},
      _transform: this._transform,
      _method: this._method,
      _isCommentList: this._isCommentList,
      _link_id: this._link_id,
      _uri: this._uri,
      _more: this._more && this._more._clone(),
      _cachedLookahead: [...this._cachedLookahead]
    }
    if (!deep) {
      properties._children = this._children
      properties.children = Array.from(this)
      return new Listing<T>(properties, this._r)
    }
    properties._children = _children
    properties.children = Array.from(this).map(item => item && item._clone ? item._clone(deep, _children) : item)
    return new Listing<T>(properties, this._r)
  }

  toJSON () {
    return Array.from(this).map(item => item && item.toJSON ? item.toJSON() : item)
  }
}

if (!isBrowser) {
  defineInspectFunc(Listing.prototype, function (this: Listing) { // Fake param
    return `Listing ${util.inspect(Array.from(this))}`
  })
}

export default Listing
export {ListingProps, Options, FetchMoreOptions, FetchAllOptions, ListingQuery}
