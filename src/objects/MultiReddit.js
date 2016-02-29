'use strict';
const _ = require('lodash');
const promise_wrap = require('promise-chains');

/**
* @summary A class representing a multireddit.
*/
const MultiReddit = class extends require('./RedditContent') {
  constructor (options, _ac, _has_fetched) {
    super(options, _ac, _has_fetched);
    if (_has_fetched) {
      this.curator = _ac.get_user(this.path.split('/')[2]);
      this.subreddits = this.subreddits.map(item =>
        this._ac._new_object('Subreddit', item.data || {display_name: item.name}, false)
      );
    } else {
      this.path = `/user/${this.curator.name}/m/${this.name}`;
    }
  }
  get _uri () {
    return `api/multi${this.path}?expand_srs=true`;
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
        form: {from: this.path, to: `/user/${name}/m/${new_name}`, display_name: new_name}
      })
    );
  }
  /**
  * @summary Renames this multireddit.
  * @desc **Note**: This method mutates this MultiReddit.
  * @param {object} $0
  * @param {string} $0.new_name The new name for this multireddit.
  * @returns {Promise} A Promise that fulfills with this multireddit
  */
  rename ({new_name}) {
    return promise_wrap(this._ac._get_my_name().then(my_name => this._post({
      uri: 'api/multi/rename',
      form: {from: this.path, to: `/user/${my_name}/m/${new_name}`, display_name: new_name}
    })).then(res => {
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
    return this._del({uri: `api/multi${this.path}`});
  }
  /**
  * @summary Edits the properties of this multireddit.
  * @desc **Note**: Any omitted properties here will simply retain their previous values.
  * @param {object} $0
  * @param {string} [$0.name] The name of the new multireddit. 50 characters max
  * @param {string} [$0.description] A description for the new multireddit, in markdown.
  * @param {string} [$0.visibility] The multireddit's visibility setting. One of `private`, `public`, `hidden`.
  * @param {string} [$0.icon_name] One of `art and design`, `ask`, `books`, `business`, `cars`, `comics`, `cute animals`,
  `diy`, `entertainment`, `food and drink`, `funny`, `games`, `grooming`, `health`, `life advice`, `military`, `models pinup`,
  `music`, `news`, `philosophy`, `pictures and gifs`, `science`, `shopping`, `sports`, `style`, `tech`, `travel`,
  `unusual stories`, `video`, `None`
  * @param {string} [$0.key_color] A six-digit RGB hex color, preceded by '#'
  * @param {string} [$0.weighting_scheme] One of 'classic', 'fresh'
  * @returns {Promise} The updated version of this multireddit
  */
  edit ({description, icon_name, key_color, visibility, weighting_scheme}) {
    return this._put({uri: `api/multi${this.path}`, form: {model: JSON.stringify({
      description_md: description,
      display_name: this.name,
      icon_name,
      key_color,
      visibility,
      weighting_scheme
    })}});
  }
  /**
  * @summary Adds a subreddit to this multireddit.
  * @param {Subreddit} The Subreddit object to add (or a string representing a subreddit name)
  * @returns {Promise} A Promise that fulfills with this multireddit when the reuqest is complete
  */
  add_subreddit (sub) {
    const sub_name = _.isString(sub) ? sub : sub.display_name;
    return promise_wrap(this._put({
      uri: `api/multi${this.path}/r/${sub_name}`,
      form: {model: JSON.stringify({name: sub_name})}
    }).return(this));
  }
  /**
  * @summary Removes a subreddit from this multireddit.
  * @param {Subreddit} The Subreddit object to remove (or a string representing a subreddit name)
  * @returns {Promise} A Promise that fulfills with this multireddit when the request is complete
  */
  remove_subreddit (sub) {
    return promise_wrap(this._del({uri: `api/multi${this.path}/r/${_.isString(sub) ? sub : sub.display_name}`}).return(this));
  }
  /* Note: The endpoints GET/PUT /api/multi/multipath/description and GET /api/multi/multipath/r/srname are intentionally not
  included, because they're redundant and the same thing can be achieved by simply using fetch() and edit(). */
};

module.exports = MultiReddit;
