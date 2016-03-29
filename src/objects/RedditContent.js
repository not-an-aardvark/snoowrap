'use strict';
if (typeof Proxy !== 'undefined' && typeof Reflect === 'undefined') {
  require('harmony-reflect'); // temp dependency until node implements Proxies correctly
}
const Promise = require('bluebird');
const _ = require('lodash');
const promise_wrap = require('promise-chains');

/**
* A base class for content from reddit. With the expection of Listings, all content types extend this class.
*/
const RedditContent = class {
  constructor (options, _ac, _has_fetched) {
    // _ac stands for 'authenticated client' -- it refers to the snoowrap requester that is used to fetch this content.
    this._ac = _ac;
    this._has_fetched = !!_has_fetched;
    _.assign(this, options);
    if (typeof Proxy !== 'undefined') {
      return new Proxy(this, {get: (target, key) => {
        if (key === '_raw') {
          return target;
        }
        if (key in target || key === 'length' || key in Promise.prototype || target._has_fetched) {
          return target[key];
        }
        return this.fetch()[key];
      }});
    }
  }
  /**
  * @summary Fetches this content from reddit.
  * @returns {Promise} A version of this object with all of its fetched properties from reddit. This will not mutate the
  object. Once an object has been fetched once, its properties will be cached, so they might end up out-of-date if this
  function is called again. To refresh an object, use refresh().
  */
  fetch () {
    if (!this._fetch) {
      this._fetch = promise_wrap(this._ac._get({uri: this._uri}).bind(this).then(this._transform_api_response));
    }
    return this._fetch;
  }
  /**
  * @summary Refreshes this content.
  * @returns {Promise} A newly-fetched version of this content
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
  */
  toJSON () {
    return _.omitBy(this, (value, key) => key.startsWith('_'));
  }
  inspect () {
    return `${this.constructor.name} ${require('util').inspect(this.toJSON())}`;
  }
  _transform_api_response (response_object) {
    return response_object;
  }
};

_.forEach(require('../constants').HTTP_VERBS, type => {
  RedditContent.prototype[`_${type}`] = function (...args) {
    return this._ac[`_${type}`](...args);
  };
});

module.exports = RedditContent;
