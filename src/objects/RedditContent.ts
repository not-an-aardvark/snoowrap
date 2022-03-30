import util from 'util'
import {defineInspectFunc} from '../helper'
import {USER_KEYS, SUBREDDIT_KEYS} from '../constants'
import snoowrap from '../snoowrap'
import Listing from './Listing'
import Comment from './Comment'
import RedditUser from './RedditUser'
import Subreddit from './Subreddit.js'
import {Children} from '../interfaces'

/**
 * A base class for content from reddit. With the expection of Listings, all content types extend this class.
 * This class should be considered 'abstract', to the extend that JavaScript classes can be -- it should not be necessary to
 * instantiate it directly.
 * <style> #RedditContent {display: none} </style>
 */
class RedditContent<T> {
  ['constructor']: typeof RedditContent
  static _name = 'RedditContent'

  _r: snoowrap
  _hasFetched: boolean
  _fetch?: T
  __uri?: string
  get _uri () {
    return this.__uri
  }
  set _uri (uri) {
    this.__uri = uri
  }
  [key: string]: any
  created_utc: number = 0
  created: number = 0
  id: string = ''
  name: string = ''

  constructor (options: any, _r: snoowrap, _hasFetched = false) {
    // _r refers to the snoowrap requester that is used to fetch this content.
    this._r = _r
    this._hasFetched = _hasFetched
    Object.assign(this, options)
  }

  /**
   * @summary Fetches this content from reddit.
   * @desc This will not mutate the original content object; all Promise properties will remain as Promises after the content has
   * been fetched. However, the information on this object will be cached, so it may become out-of-date with the content on
   * reddit. To clear the cache and fetch this object from reddit again, use `refresh()`.
   *
   * If snoowrap is running in an environment that supports ES2015 Proxies (e.g. Chrome 49+), then `fetch()` will get
   * automatically called when an unknown property is accessed on an unfetched content object.
   * @returns {Promise} A version of this object with all of its fetched properties from reddit. This will not mutate the
   * object. Once an object has been fetched once, its properties will be cached, so they might end up out-of-date if this
   * function is called again. To refresh an object, use refresh().
   * @example
   *
   * r.getUser('not_an_aardvark').fetch().then(userInfo => {
   *   console.log(userInfo.name); // 'not_an_aardvark'
   *   console.log(userInfo.created_utc); // 1419104352
   * });
   *
   * r.getComment('d1xchqn').fetch().then(comment => comment.body).then(console.log)
   * // => 'This is a little too interesting for my liking'
   *
   * // In environments that support ES2015 Proxies, the above line is equivalent to:
   * r.getComment('d1xchqn').body.then(console.log);
   * // => 'This is a little too interesting for my liking'
   */
  async fetch () {
    if (!this._fetch) {
      let res = await this._r._get({url: this._uri})
      res = this._transformApiResponse(res)
      this._fetch = res
    }
    return this._fetch
  }

  /**
   * @summary Refreshes this content.
   * @returns {Promise} A newly-fetched version of this content
   * @example
   *
   * var someComment = r.getComment('cmfkyus');
   * var initialCommentBody = some_comment.fetch().then(comment => comment.body);
   *
   * setTimeout(() => {
   *   someComment.refresh().then(refreshedComment => {
   *     if (initialCommentBody.value() !== refreshedComment.body) {
   *       console.log('This comment has changed since 10 seconds ago.');
   *     }
   *   });
   * }, 10000);
   */
  refresh () {
    this._fetch = undefined
    return this.fetch()
  }

  _clone (deep = false, _children: Children = {}): T {
    const clonedProps = this._cloneProps(deep, _children)
    const name = this.constructor._name as keyof typeof snoowrap.objects
    return this._r._newObject(name, clonedProps, this._hasFetched)
  }

  _cloneProps (deep = false, _children: Children = {}) {
    const clonedProps: {[key: string]: any} = {}
    for (const key of Object.keys(this)) {
      let value = this[key]
      if (deep) {
        value = value instanceof RedditContent || value instanceof Listing
          ? value._clone(deep, _children)
          : typeof value === 'object' && value !== null
            ? this._cloneProps.call(value, deep, _children)
            : value
      }
      if (value instanceof Comment) {
        _children[value.id] = value
      }
      clonedProps[key] = value
    }
    return clonedProps
  }

  /**
   * @summary Returns a stringifyable version of this object.
   * @desc It is usually not necessary to call this method directly; simply running JSON.stringify(some_object) will strip the
   * private properties anyway.
   * @returns {object} A version of this object with all the private properties stripped
   * @example
   *
   * var user = r.getUser('not_an_aardvark');
   * JSON.stringify(user) // => '{"name":"not_an_aardvark"}'
   */
  toJSON () {
    const object: {[key: string]: any} = {}
    for (const key of Object.keys(this)) {
      if (key.startsWith('_')) continue
      let value = this[key]
      if (value instanceof RedditContent && !value._hasFetched) {
        if (value instanceof RedditUser && USER_KEYS.has(key)) value = value.name
        if (value instanceof Subreddit && SUBREDDIT_KEYS.has(key)) value = value.display_name
      }
      object[key] = value && value.toJSON ? value.toJSON() : value
    }
    return object
  }

  _transformApiResponse (response: any) {
    return response
  }

  get _getListing () {
    return this._r._getListing
  }

  get _get () {
    return this._r._get
  }
  get _post () {
    return this._r._post
  }
  get _put () {
    return this._r._put
  }
  get _delete () {
    return this._r._delete
  }
  get _head () {
    return this._r._head
  }
  get _patch () {
    return this._r._patch
  }
}

defineInspectFunc(RedditContent.prototype, function (this: RedditContent<any>) { // Fake param
  return `${this.constructor._name} ${util.inspect(this)}`
})

export default RedditContent
