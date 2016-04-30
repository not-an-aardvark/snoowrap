import {assign, mapValues, includes, pick, keys, cloneDeep, forEach} from 'lodash';
import Promise from 'bluebird';
import promise_wrap from 'promise-chains';
import {inspect} from 'util';
import {USER_KEYS, SUBREDDIT_KEYS, HTTP_VERBS} from '../constants.js';
import Listing from './Listing.js';

/**
* A base class for content from reddit. With the expection of Listings, all content types extend this class.
* This class should be considered 'abstract', to the extend that JavaScript classes can be -- it should not be necessary to
* instantiate it directly.
* <style> #RedditContent {display: none} </style>
*/
const RedditContent = class {
  constructor (options, _r, _has_fetched) {
    // _r refers to the snoowrap requester that is used to fetch this content.
    this._r = _r;
    this._fetch = undefined;
    this._has_fetched = !!_has_fetched;
    assign(this, options);
    if (typeof Proxy !== 'undefined' && !this._has_fetched) {
      return new Proxy(this, {get (target, key) {
        if (key === '_raw') {
          return target;
        }
        if (key in target || key === 'length' || key in Promise.prototype) {
          return target[key];
        }
        return target.fetch()[key];
      }});
    }
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
  object. Once an object has been fetched once, its properties will be cached, so they might end up out-of-date if this
  function is called again. To refresh an object, use refresh().
  * @example
  *
  * r.get_user('not_an_aardvark').fetch().then(user_info => {
  *   console.log(user_info.name); // 'not_an_aardvark'
  *   console.log(user_info.created_utc); // 1419104352
  * });
  *
  * r.get_comment('d1xchqn').fetch().then(comment => comment.body).then(console.log)
  * // => 'This is a little too interesting for my liking'
  *
  * // In environments that support ES2015 Proxies, the above line is equivalent to:
  * r.get_comment('d1xchqn').body.then(console.log);
  * // => 'This is a little too interesting for my liking'
  */
  fetch () {
    if (!this._fetch) {
      this._fetch = promise_wrap(this._r._get({uri: this._uri}).bind(this).then(this._transform_api_response));
    }
    return this._fetch;
  }
  /**
  * @summary Refreshes this content.
  * @returns {Promise} A newly-fetched version of this content
  * @example
  *
  * var some_comment = r.get_comment('cmfkyus');
  * var initial_comment_body = some_comment.fetch().then(comment => comment.body);
  *
  * setTimeout(() => {
  *   some_comment.refresh().then(refreshed_comment => {
  *     if (initial_comment_body.value() !== refreshed_comment.body) {
  *       console.log('This comment has changed since 10 seconds ago.');
  *     }
  *   });
  * }, 10000);
  */
  refresh () {
    this._fetch = undefined;
    return this.fetch();
  }
  /**
  * @summary Returns a stringifyable version of this object.
  * @desc It is usually not necessary to call this method directly; simply running JSON.stringify(some_object) will strip the
  private properties anyway.
  * @returns {object} A version of this object with all the private properties stripped
  * @example
  *
  * var user = r.get_user('not_an_aardvark');
  * JSON.stringify(user) // => '{"name":"not_an_aardvark"}'
  */
  toJSON () {
    return mapValues(this._strip_private_props(), (value, key) => {
      if (value instanceof RedditContent && !value._has_fetched) {
        if (value.constructor.name === 'RedditUser' && includes(USER_KEYS, key)) {
          return value.name;
        }
        if (value.constructor.name === 'Subreddit' && includes(SUBREDDIT_KEYS, key)) {
          return value.display_name;
        }
      }
      return value && value.toJSON ? value.toJSON() : value;
    });
  }
  inspect () {
    return `${this.constructor.name} ${inspect(this._strip_private_props())}`;
  }
  _strip_private_props () {
    return pick(this, keys(this).filter(key => !key.startsWith('_')));
  }
  _transform_api_response (response_object) {
    return response_object;
  }
  _clone ({deep = false} = {}) {
    const cloned_props = mapValues(this, value => {
      if (deep) {
        return value instanceof RedditContent || value instanceof Listing ? value._clone({deep}) : cloneDeep(value);
      }
      return value;
    });
    return this._r._new_object(this.constructor.name, cloned_props, this._has_fetched);
  }
  _get_listing (...args) {
    return this._r._get_listing(...args);
  }
};

forEach(HTTP_VERBS, type => {
  RedditContent.prototype[`_${type}`] = function (...args) {
    return this._r[`_${type}`](...args);
  };
});

export default RedditContent;
