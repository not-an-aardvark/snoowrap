'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _RedditContent = require('./RedditContent.js');

var _RedditContent2 = _interopRequireDefault(_RedditContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* @summary A class representing a multireddit.
* <style> #MultiReddit {display: none} </style>
* @example
*
* // Get a multireddit belonging to a specific user
* r.getUser('multi-mod').getMultireddit('coding_languages')
*/
var MultiReddit = class MultiReddit extends _RedditContent2.default {
  constructor(options, _r, _hasFetched) {
    var _this;

    _this = super(options, _r, _hasFetched);
    if (_hasFetched) {
      this.curator = _r.getUser(this.path.split('/')[2]);
      this.subreddits = this.subreddits.map(function (item) {
        return _this._r._newObject('Subreddit', item.data || { display_name: item.name });
      });
    }
  }
  get _uri() {
    return 'api/multi' + this._path + '?expand_srs=true';
  }
  get _path() {
    return '/user/' + this.curator.name + '/m/' + this.name;
  }
  /**
  * @summary Copies this multireddit to the requester's own account.
  * @param {object} options
  * @param {string} options.newName The new name for the copied multireddit
  * @returns {Promise} A Promise for the newly-copied multireddit
  * @example r.getUser('multi-mod').getMultireddit('coding_languages').copy({newName: 'my_coding_languages_copy'})
  */
  copy(_ref) {
    var _this2 = this;

    var new_name = _ref.new_name,
        _ref$newName = _ref.newName,
        newName = _ref$newName === undefined ? new_name : _ref$newName;

    return this._r._getMyName().then(function (name) {
      return _this2._post({ uri: 'api/multi/copy', form: {
          from: _this2._path,
          to: '/user/' + name + '/m/' + newName,
          display_name: newName
        } });
    });
  }
  /**
  * @summary Renames this multireddit.
  * @desc **Note**: This method mutates this MultiReddit.
  * @param {object} options
  * @param {string} options.newName The new name for this multireddit.
  * @returns {Promise} A Promise that fulfills with this multireddit
  * @example r.getUser('multi-mod').getMultireddit('coding_languages').copy({newName: 'cookie_languages '})
  */
  rename(_ref2) {
    var _this3 = this;

    var new_name = _ref2.new_name,
        _ref2$newName = _ref2.newName,
        newName = _ref2$newName === undefined ? new_name : _ref2$newName;

    return this._r._getMyName().then(function (name) {
      return _this3._post({
        uri: 'api/multi/rename',
        form: { from: _this3._path, to: '/user/' + name + '/m/' + newName, display_name: newName }
      });
    }).then(function (res) {
      _this3.name = res.name;
    }).return(this);
  }
  /**
  * @summary Edits the properties of this multireddit.
  * @desc **Note**: Any omitted properties here will simply retain their previous values.
  * @param {object} options
  * @param {string} [options.name] The name of the new multireddit. 50 characters max
  * @param {string} [options.description] A description for the new multireddit, in markdown.
  * @param {string} [options.visibility] The multireddit's visibility setting. One of `private`, `public`, `hidden`.
  * @param {string} [options.icon_name] One of `art and design`, `ask`, `books`, `business`, `cars`, `comics`, `cute animals`,
  `diy`, `entertainment`, `food and drink`, `funny`, `games`, `grooming`, `health`, `life advice`, `military`, `models pinup`,
  `music`, `news`, `philosophy`, `pictures and gifs`, `science`, `shopping`, `sports`, `style`, `tech`, `travel`,
  `unusual stories`, `video`, `None`
  * @param {string} [options.key_color] A six-digit RGB hex color, preceded by '#'
  * @param {string} [options.weighting_scheme] One of 'classic', 'fresh'
  * @returns {Promise} The updated version of this multireddit
  * @example r.getUser('not_an_aardvark').getMultireddit('cookie_languages').edit({visibility: 'hidden'})
  */
  edit(_ref3) {
    var description = _ref3.description,
        icon_name = _ref3.icon_name,
        key_color = _ref3.key_color,
        visibility = _ref3.visibility,
        weighting_scheme = _ref3.weighting_scheme;

    return this._put({ uri: 'api/multi' + this._path, form: { model: JSON.stringify({
          description_md: description,
          display_name: this.name,
          icon_name,
          key_color,
          visibility,
          weighting_scheme
        }) } });
  }
  /**
  * @summary Adds a subreddit to this multireddit.
  * @param {Subreddit} sub The Subreddit object to add (or a string representing a subreddit name)
  * @returns {Promise} A Promise that fulfills with this multireddit when the reuqest is complete
  * @example r.getUser('not_an_aardvark').getMultireddit('cookie_languages').addSubreddit('cookies')
  */
  addSubreddit(sub) {
    sub = typeof sub === 'string' ? sub : sub.display_name;
    return this._put({ uri: 'api/multi' + this._path + '/r/' + sub, form: { model: JSON.stringify({ name: sub }) } }).return(this);
  }
  /**
  * @summary Removes a subreddit from this multireddit.
  * @param {Subreddit} sub The Subreddit object to remove (or a string representing a subreddit name)
  * @returns {Promise} A Promise that fulfills with this multireddit when the request is complete
  * @example r.getUser('not_an_aardvark').getMultireddit('cookie_languages').removeSubreddit('cookies')
  */
  removeSubreddit(sub) {
    return this._delete({ uri: 'api/multi' + this._path + '/r/' + (typeof sub === 'string' ? sub : sub.display_name) }).return(this);
  }
  /* Note: The endpoints GET/PUT /api/multi/multipath/description and GET /api/multi/multipath/r/srname are intentionally not
  included, because they're redundant and the same thing can be achieved by simply using fetch() and edit(). */
};

// MultiReddit#delete is not in the class body since Safari 9 can't parse the `delete` function name in class bodies.
/**
* @function
* @name delete
* @summary Deletes this multireddit.
* @returns {Promise} A Promise that fulfills when this request is complete
* @example r.getUser('not_an_aardvark').getMultireddit('cookie_languages').delete()
* @memberof MultiReddit
* @instance
*/
Object.defineProperty(MultiReddit.prototype, 'delete', { value() {
    return this._delete({ uri: 'api/multi' + this._path });
  }, configurable: true, writable: true });

exports.default = MultiReddit;