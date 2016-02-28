'use strict';
const _ = require('lodash');
const promise_wrap = require('promise-chains');

const MultiReddit = class extends require('./RedditContent') {
  constructor (options, _ac, _has_fetched) {
    super(options, _ac, _has_fetched);
    if (_has_fetched) {
      this.curator = _ac.get_user(this.path.split('/')[2]);
    } else {
      this.path = `/user/${this.curator.name}/m/${this.name}`;
    }
  }
  get _uri () {
    return `api/multi${this.path}`;
  }
  _transform_api_response (response_obj) {
    return _.assign(response_obj, {subreddits: response_obj.subreddits.map(item => this._ac.get_subreddit(item.name))});
  }
  /**
  * @summary Copies this multireddit to the requester's own account.
  * @param {object} $0
  * @param {string} $0.new_name The new name for the copied multireddit
  * @returns {Promise} A Promise for the newly-copied multireddit
  */
  copy ({new_name}) {
    return this._ac._get_my_name().then(name =>
      this._post({
        uri: 'api/multi/copy',
        form: {from: this.path, to: `/user/${name}/m/${new_name}`}
      })
    );
  }
  /**
  * @summary Renames this multireddit.
  * @desc **Note**: This method mutates this MultiReddit.
  * @param {object} $0
  * @param {string} $0.new_name The new name for this multireddit.
  */
  rename ({new_name}) {
    return promise_wrap(this._post({
      uri: 'api/multi/rename',
      form: {from: this.path, to: `/user/${this.curator.name}/m/${new_name}`}
    }).then(res => {
      Object.keys(res).forEach(key => {
        this[key] = res[key];
      });
      return this;
    }));
  }
  /**
  * @summary Deletes this multireddit.
  * @returns {Promise} A Promise that fulfills when this request is complete
  */
  delete () {
    return this._del({uri: `api/multi/${this.path}`});
  }
};

module.exports = MultiReddit;
