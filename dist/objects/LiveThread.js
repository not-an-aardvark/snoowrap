'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _events = require('events');

var _helpers = require('../helpers.js');

var _RedditContent = require('./RedditContent.js');

var _RedditContent2 = _interopRequireDefault(_RedditContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var WebSocket = _helpers.isBrowser ? global.WebSocket : require('ws');

var api_type = 'json';

/**
* A class representing a live reddit thread
* <style> #LiveThread {display: none} </style>
* @example
*
* // Get a livethread with the given ID
* r.getLivethread('whrdxo8dg9n0')
* @desc For the most part, reddit distributes the content of live threads via websocket, rather than through the REST API.
As such, snoowrap assigns each fetched LiveThread object a `stream` property, which takes the form of an
[EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter). To listen for new thread updates, simply
add listeners to that emitter.

The following events can be emitted:
- `update`: Occurs when a new update has been posted in this thread. Emits a `LiveUpdate` object containing information
about the new update.
- `activity`: Occurs periodically when the viewer count for this thread changes.
- `settings`: Occurs when the thread's settings change. Emits an object containing the new settings.
- `delete`: Occurs when an update has been deleted. Emits the ID of the deleted update.
- `strike`: Occurs when an update has been striken (marked incorrect and crossed out). Emits the ID of the striken update.
- `embeds_ready`: Occurs when embedded media is now available for a previously-posted update.
- `complete`: Occurs when this LiveThread has been marked as complete, and no more updates will be sent.

(Note: These event types are mapped directly from reddit's categorization of the updates. The descriptions above are
paraphrased from reddit's descriptions [here](https://www.reddit.com/dev/api#section_live).)

As an example, this would log all new livethread updates to the console:

```javascript
someLivethread.stream.on('update', data => {
  console.log(data.body);
});
```

* @extends RedditContent
*/
var LiveThread = class LiveThread extends _RedditContent2.default {
  constructor(options, _r, _hasFetched) {
    var _this;

    _this = super(options, _r, _hasFetched);
    this._rawStream = null;
    this._populatedStream = null;
    if (_hasFetched) {
      Object.defineProperty(this, 'stream', { get: function () {
          if (!_this._populatedStream && _this.websocket_url) {
            _this._setupWebSocket();
          }
          return _this._populatedStream;
        } });
    }
  }
  get _uri() {
    return 'live/' + this.id + '/about';
  }
  _setupWebSocket() {
    var _this2 = this;

    this._rawStream = new WebSocket(this.websocket_url);
    this._populatedStream = new _events.EventEmitter();
    var handler = function (data) {
      var parsed = _this2._r._populate(JSON.parse(data));
      _this2._populatedStream.emit(parsed.type, parsed.payload);
    };
    if (typeof this._rawStream.on === 'function') {
      this._rawStream.on('message', handler);
    } else {
      this._rawStream.onmessage = function (messageEvent) {
        return handler(messageEvent.data);
      };
    }
  }
  /**
  * @summary Adds a new update to this thread.
  * @param {string} body The body of the new update
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').addUpdate('Breaking: Someone is reading the snoowrap documentation \\o/')
  */
  addUpdate(body) {
    return this._post({ uri: 'api/live/' + this.id + '/update', form: { api_type, body } }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Strikes (marks incorrect and crosses out) the given update.
  * @param {object} options
  * @param {string} options.id The ID of the update that should be striked.
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').strikeUpdate({id: 'LiveUpdate_edc34446-faf0-11e5-a1b4-0e858bca33cd'})
  */
  strikeUpdate(_ref) {
    var id = _ref.id;

    return this._post({
      uri: 'api/live/' + this.id + '/strike_update',
      form: { api_type, id: '' + (id.startsWith('LiveUpdate_') ? '' : 'LiveUpdate_') + id }
    }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Deletes an update from this LiveThread.
  * @param {object} options
  * @param {string} options.id The ID of the LiveUpdate that should be deleted
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').deleteUpdate({id: 'LiveUpdate_edc34446-faf0-11e5-a1b4-0e858bca33cd'})
  */
  deleteUpdate(_ref2) {
    var id = _ref2.id;

    return this._post({
      uri: 'api/live/' + this.id + '/delete_update',
      form: { api_type, id: '' + (id.startsWith('LiveUpdate_') ? '' : 'LiveUpdate_') + id }
    }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Gets a list of this LiveThread's contributors
  * @returns {Promise} An Array containing RedditUsers
  * @example
  *
  * r.getLivethread('whrdxo8dg9n0').getContributors().then(console.log)
  * // => [
  * //  RedditUser { permissions: ['edit'], name: 'not_an_aardvark', id: 't2_k83md' },
  * //  RedditUser { permissions: ['all'], id: 't2_u3l80', name: 'snoowrap_testing' }
  * // ]
  */
  getContributors() {
    return this._get({ uri: 'live/' + this.id + '/contributors' }).then(function (contributors) {
      return Array.isArray(contributors[0]) ? contributors[0] : contributors;
    });
  }
  /**
  * @summary Invites a contributor to this LiveThread.
  * @param {object} options
  * @param {string} options.name The name of the user who should be invited
  * @param {Array} options.permissions The permissions that the invited user should receive. This should be an Array containing
  some combination of `'update', 'edit', 'manage'`. To invite a contributor with full permissions, omit this property.
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').inviteContributor({name: 'actually_an_aardvark', permissions: ['update']})
  */
  inviteContributor(_ref3) {
    var name = _ref3.name,
        permissions = _ref3.permissions;

    return this._post({ uri: 'api/live/' + this.id + '/invite_contributor', form: {
        api_type,
        name,
        permissions: (0, _helpers.formatLivethreadPermissions)(permissions),
        type: 'liveupdate_contributor_invite'
      } }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Revokes an invitation for the given user to become a contributor on this LiveThread.
  * @param {object} options
  * @param {string} options.name The username of the account whose invitation should be revoked
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').revokeContributorInvite({name: 'actually_an_aardvark'});
  */
  revokeContributorInvite(_ref4) {
    var _this3 = this;

    var name = _ref4.name;

    return this._r.getUser(name).fetch().get('id').then(function (userId) {
      return _this3._post({ uri: 'api/live/' + _this3.id + '/rm_contributor_invite', form: { api_type, id: 't2_' + userId } });
    }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Accepts a pending contributor invitation on this LiveThread.
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').acceptContributorInvite()
  */
  acceptContributorInvite() {
    return this._post({ uri: 'api/live/' + this.id + '/accept_contributor_invite', form: { api_type } }).return(this);
  }
  /**
  * @summary Abdicates contributor status on this LiveThread.
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').leaveContributor()
  */
  leaveContributor() {
    return this._post({ uri: 'api/live/' + this.id + '/leave_contributor', form: { api_type } }).return(this);
  }
  /**
  * @summary Removes the given user from contributor status on this LiveThread.
  * @param {object} options
  * @param {string} options.name The username of the account who should be removed
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').removeContributor({name: 'actually_an_aardvark'})
  */
  removeContributor(_ref5) {
    var _this4 = this;

    var name = _ref5.name;

    return this._r.getUser(name).fetch().get('id').then(function (userId) {
      return _this4._post({ uri: 'api/live/' + _this4.id + '/rm_contributor', form: { api_type, id: 't2_' + userId } });
    }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Sets the permissions of the given contributor.
  * @param {object} options
  * @param {string} options.name The name of the user whose permissions should be changed
  * @param {Array} options.permissions The updated permissions that the user should have. This should be an Array containing
  some combination of `'update', 'edit', 'manage'`. To give the contributor with full permissions, omit this property.
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').setContributorPermissions({name: 'actually_an_aardvark', permissions: ['edit']})
  */
  setContributorPermissions(_ref6) {
    var name = _ref6.name,
        permissions = _ref6.permissions;

    return this._post({
      uri: 'api/live/' + this.id + '/set_contributor_permissions',
      form: { api_type, name, permissions: (0, _helpers.formatLivethreadPermissions)(permissions), type: 'liveupdate_contributor' }
    }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Edits the settings on this LiveThread.
  * @param {object} options
  * @param {string} options.title The title of the thread
  * @param {string} [options.description] A descriptions of the thread. 120 characters max
  * @param {string} [options.resources] Information and useful links related to the thread.
  * @param {boolean} options.nsfw Determines whether the thread is Not Safe For Work
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').editSettings({title: 'My livethread', description: 'an updated description'})
  */
  editSettings(_ref7) {
    var title = _ref7.title,
        description = _ref7.description,
        resources = _ref7.resources,
        nsfw = _ref7.nsfw;

    return this._post({
      uri: 'api/live/' + this.id + '/edit',
      form: { api_type, description, nsfw, resources, title }
    }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Permanently closes this thread, preventing any more updates from being added.
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').closeThread()
  */
  closeThread() {
    return this._post({ uri: 'api/live/' + this.id + '/close_thread', form: { api_type } }).return(this);
  }
  /**
  * @summary Reports this LiveThread for breaking reddit's rules.
  * @param {object} options
  * @param {string} options.reason The reason for the report. One of `spam`, `vote-manipulation`, `personal-information`,
  `sexualizing-minors`, `site-breaking`
  * @returns {Promise} A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').report({reason: 'Breaking a rule blah blah blah'})
  */
  report(_ref8) {
    var reason = _ref8.reason;

    return this._post({ uri: 'api/live/' + this.id + '/report', form: { api_type, type: reason } }).then((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Gets a Listing containing past updates to this LiveThread.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing LiveUpdates
  * @example
  *
  * r.getLivethread('whrdxo8dg9n0').getRecentUpdates().then(console.log)
  * // => Listing [
  * //  LiveUpdate { ... },
  * //  LiveUpdate { ... },
  * //  ...
  * // ]
  */
  getRecentUpdates(options) {
    return this._getListing({ uri: 'live/' + this.id, qs: options });
  }
  /**
  * @summary Gets a list of reddit submissions linking to this LiveThread.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions
  * @example
  *
  * r.getLivethread('whrdxo8dg9n0').getDiscussions().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getDiscussions(options) {
    return this._getListing({ uri: 'live/' + this.id + '/discussions', qs: options });
  }
  /**
  * @summary Stops listening for new updates on this LiveThread.
  * @desc To avoid memory leaks that can result from open sockets, it's recommended that you call this method when you're
  finished listening for updates on this LiveThread.
  *
  * This should not be confused with {@link LiveThread#closeThread}, which marks the thread as "closed" on reddit.
  * @returns undefined
  * @example
  *
  * var myThread = r.getLivethread('whrdxo8dg9n0');
  * myThread.stream.on('update', content => {
  *   console.log(content);
  *   myThread.closeStream();
  * })
  *
  */
  closeStream() {
    if (this._rawStream) {
      this._rawStream.close();
    }
  }
};

exports.default = LiveThread;