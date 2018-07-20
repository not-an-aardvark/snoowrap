'use strict';

var _values2 = require('lodash/values');

var _values3 = _interopRequireDefault(_values2);

var _snakeCase2 = require('lodash/snakeCase');

var _snakeCase3 = _interopRequireDefault(_snakeCase2);

var _omitBy2 = require('lodash/omitBy');

var _omitBy3 = _interopRequireDefault(_omitBy2);

var _omit2 = require('lodash/omit');

var _omit3 = _interopRequireDefault(_omit2);

var _mapValues2 = require('lodash/mapValues');

var _mapValues3 = _interopRequireDefault(_mapValues2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _includes2 = require('lodash/includes');

var _includes3 = _interopRequireDefault(_includes2);

var _forOwn2 = require('lodash/forOwn');

var _forOwn3 = _interopRequireDefault(_forOwn2);

var _defaults2 = require('lodash/defaults');

var _defaults3 = _interopRequireDefault(_defaults2);

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _Promise = require('./Promise.js');

var _Promise2 = _interopRequireDefault(_Promise);

var _promiseChains = require('promise-chains');

var _promiseChains2 = _interopRequireDefault(_promiseChains);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _request_handler = require('./request_handler.js');

var requestHandler = _interopRequireWildcard(_request_handler);

var _constants = require('./constants.js');

var _errors = require('./errors.js');

var errors = _interopRequireWildcard(_errors);

var _helpers = require('./helpers.js');

var _create_config = require('./create_config.js');

var _create_config2 = _interopRequireDefault(_create_config);

var _index = require('./objects/index.js');

var objects = _interopRequireWildcard(_index);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var api_type = 'json';

/** The class for a snoowrap requester.
* A requester is the base object that is used to fetch content from reddit. Each requester contains a single set of OAuth
tokens.

If constructed with a refresh token, a requester will be able to repeatedly generate access tokens as necessary, without any
further user intervention. After making at least one request, a requester will have the `access_token` property, which specifies
the access token currently in use. It will also have a few additional properties such as `scope` (an array of scope strings)
and `ratelimitRemaining` (the number of requests remaining for the current 10-minute interval, in compliance with reddit's
[API rules](https://github.com/reddit/reddit/wiki/API).) These properties primarily exist for internal use, but they are
exposed since they are useful externally as well.
*/
var snoowrap = class snoowrap {
  /**
  * @summary Constructs a new requester.
  * @desc You should use the snoowrap constructor if you are able to authorize a reddit account in advance (e.g. for a Node.js
  script that always uses the same account). If you aren't able to authorize in advance (e.g. acting through an arbitrary user's
  account while running snoowrap in a browser), then you should use {@link snoowrap.getAuthUrl} and
  {@link snoowrap.fromAuthCode} instead.
  *
  * snoowrap supports several different options for pre-existing authentication:
  * 1. *Refresh token*: To authenticate with a refresh token, pass an object with the properties `userAgent`, `clientId`,
  `clientSecret`, and `refreshToken` to the snoowrap constructor. You will need to get the refresh token from reddit
  beforehand. A script to automatically generate refresh tokens for you can be found
  [here](https://github.com/not-an-aardvark/reddit-oauth-helper).
  * 1. *Username/password*: To authenticate with a username and password, pass an object with the properties `userAgent`,
  `clientId`, `clientSecret`, `username`, and `password` to the snoowrap constructor. Note that username/password
  authentication is only possible for `script`-type apps.
  * 1. *Access token*: To authenticate with an access token, pass an object with the properties `userAgent` and `accessToken`
  to the snoowrap constructor. Note that all access tokens expire one hour after being generated, so this method is
  not recommended for long-term use.
  * @param {object} options An object containing authentication options. This should always have the property `userAgent`. It
  must also contain some combination of credentials (see above)
  * @param {string} options.userAgent A unique description of what your app does. This argument is not necessary when snoowrap
  is running in a browser.
  * @param {string} [options.clientId] The client ID of your app (assigned by reddit)
  * @param {string} [options.clientSecret] The client secret of your app (assigned by reddit). If you are using a refresh token
  with an installed app (which does not have a client secret), pass an empty string as your `clientSecret`.
  * @param {string} [options.username] The username of the account to access
  * @param {string} [options.password] The password of the account to access
  * @param {string} [options.refreshToken] A refresh token for your app
  * @param {string} [options.accessToken] An access token for your app
  */
  constructor() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        user_agent = _ref.user_agent,
        _ref$userAgent = _ref.userAgent,
        userAgent = _ref$userAgent === undefined ? user_agent : _ref$userAgent,
        client_id = _ref.client_id,
        _ref$clientId = _ref.clientId,
        clientId = _ref$clientId === undefined ? client_id : _ref$clientId,
        client_secret = _ref.client_secret,
        _ref$clientSecret = _ref.clientSecret,
        clientSecret = _ref$clientSecret === undefined ? client_secret : _ref$clientSecret,
        refresh_token = _ref.refresh_token,
        _ref$refreshToken = _ref.refreshToken,
        refreshToken = _ref$refreshToken === undefined ? refresh_token : _ref$refreshToken,
        access_token = _ref.access_token,
        _ref$accessToken = _ref.accessToken,
        accessToken = _ref$accessToken === undefined ? access_token : _ref$accessToken,
        username = _ref.username,
        password = _ref.password;

    if (!userAgent && !_helpers.isBrowser) {
      return (0, _helpers.requiredArg)('userAgent');
    }
    if (!accessToken && (clientId === undefined || clientSecret === undefined || refreshToken === undefined) && (clientId === undefined || clientSecret === undefined || username === undefined || password === undefined)) {
      throw new errors.NoCredentialsError();
    }
    if (_helpers.isBrowser) {
      this.userAgent = global.navigator.userAgent;
    }
    (0, _defaults3.default)(this, { userAgent, clientId, clientSecret, refreshToken, accessToken, username, password }, {
      clientId: null,
      clientSecret: null,
      refreshToken: null,
      accessToken: null,
      username: null,
      password: null,
      ratelimitRemaining: null,
      ratelimitExpiration: null,
      tokenExpiration: null,
      scope: null,
      _config: (0, _create_config2.default)(),
      _nextRequestTimestamp: -Infinity
    });
    (0, _helpers.addSnakeCaseShadowProps)(this);
  }
  /**
  * @summary Gets an authorization URL, which allows a user to authorize access to their account
  * @desc This create a URL where a user can authorize an app to act through their account. If the user visits the returned URL
  in a web browser, they will see a page that looks like [this](https://i.gyazo.com/0325534f38b78c1dbd4c84d690dda6c2.png). If
  the user clicks "Allow", they will be redirected to your `redirectUri`, with a `code` querystring parameter containing an
  * *authorization code*. If this code is passed to {@link snoowrap.fromAuthCode}, you can create a requester to make
  requests on behalf of the user.
  *
  * The main use-case here is for running snoowrap in a browser. You can generate a URL, send the user there, and then continue
  after the user authenticates on reddit and is redirected back.
  *
  * @param {object} options
  * @param {string} options.clientId The client ID of your app (assigned by reddit). If your code is running clientside in a
  browser, using an "Installed" app type is recommended.
  * @param {string[]} options.scope An array of scopes (permissions on the user's account) to request on the authentication
  page. A list of possible scopes can be found [here](https://www.reddit.com/api/v1/scopes). You can also get them on-the-fly
  with {@link snoowrap#getOauthScopeList}.
  * @param {string} options.redirectUri The URL where the user should be redirected after authenticating. This **must** be the
  same as the redirect URI that is configured for the reddit app. (If there is a mismatch, the returned URL will display an
  error page instead of an authentication form.)
  * @param {boolean} options.permanent=true If `true`, the app will have indefinite access to the user's account. If `false`,
  access to the user's account will expire after 1 hour.
  * @param {string} [options.state] A string that can be used to verify a user after they are redirected back to the site. When
  the user is redirected from reddit, to the redirect URI after authenticating, the resulting URI will have this same `state`
  value in the querystring. (See [here](http://www.twobotechnologies.com/blog/2014/02/importance-of-state-in-oauth2.html) for
  more information on how to use the `state` value.)
  * @param {string} [options.endpointDomain='reddit.com'] The endpoint domain for the URL. If the user is authenticating on
  reddit.com (as opposed to some other site with a reddit-like API), you can omit this value.
  * @returns {string} A URL where the user can authenticate with the given options
  * @example
  *
  * var authenticationUrl = snoowrap.getAuthUrl({
  *   clientId: 'foobarbazquuux',
  *   scope: ['identity', 'wikiread', 'wikiedit'],
  *   redirectUri: 'https://example.com/reddit_callback',
  *   permanent: false,
  *   state: 'fe211bebc52eb3da9bef8db6e63104d3' // a random string, this could be validated when the user is redirected back
  * });
  * // --> 'https://www.reddit.com/api/v1/authorize?client_id=foobarbaz&response_type=code&state= ...'
  *
  * window.location = authenticationUrl; // send the user to the authentication url
  */
  static getAuthUrl(_ref2) {
    var _ref2$clientId = _ref2.clientId,
        clientId = _ref2$clientId === undefined ? (0, _helpers.requiredArg)('clientId') : _ref2$clientId,
        _ref2$scope = _ref2.scope,
        scope = _ref2$scope === undefined ? (0, _helpers.requiredArg)('scope') : _ref2$scope,
        _ref2$redirectUri = _ref2.redirectUri,
        redirectUri = _ref2$redirectUri === undefined ? (0, _helpers.requiredArg)('redirectUri') : _ref2$redirectUri,
        _ref2$permanent = _ref2.permanent,
        permanent = _ref2$permanent === undefined ? true : _ref2$permanent,
        _ref2$state = _ref2.state,
        state = _ref2$state === undefined ? '_' : _ref2$state,
        _ref2$endpointDomain = _ref2.endpointDomain,
        endpointDomain = _ref2$endpointDomain === undefined ? 'reddit.com' : _ref2$endpointDomain;

    if (!(Array.isArray(scope) && scope.length && scope.every(function (scopeValue) {
      return scopeValue && typeof scopeValue === 'string';
    }))) {
      throw new TypeError('Missing `scope` argument; a non-empty list of OAuth scopes must be provided');
    }
    return ('\n      https://www.' + endpointDomain + '/api/v1/authorize?\n      client_id=' + encodeURIComponent(clientId) + '\n      &response_type=code\n      &state=' + encodeURIComponent(state) + '\n      &redirect_uri=' + encodeURIComponent(redirectUri) + '\n      &duration=' + (permanent ? 'permanent' : 'temporary') + '\n      &scope=' + encodeURIComponent(scope.join(' ')) + '\n    ').replace(/\s/g, '');
  }
  /**
  * @summary Creates a snoowrap requester from an authorization code.
  * @desc An authorization code is the `code` value that appears in the querystring after a user authenticates with reddit and
  is redirected. For more information, see {@link snoowrap.getAuthUrl}.
  *
  * The main use-case for this function is for running snoowrap in a browser. You can generate a URL with
  {@link snoowrap.getAuthUrl} and send the user to that URL, and then use this function to create a requester when
  the user is redirected back with an authorization code.
  * @param {object} options
  * @param {string} options.code The authorization code
  * @param {string} options.userAgent A unique description of what your app does. This argument is not necessary when snoowrap
  is running in a browser.
  * @param {string} options.clientId The client ID of your app (assigned by reddit). If your code is running clientside in a
  browser, using an "Installed" app type is recommended.
  * @param {string} [options.clientSecret] The client secret of your app. If your app has the "Installed" app type, omit
  this parameter.
  * @param {string} options.redirectUri The redirect URI that is configured for the reddit app.
  * @param {string} [options.endpointDomain='reddit.com'] The endpoint domain that the returned requester should be configured
  to use. If the user is authenticating on reddit.com (as opposed to some other site with a reddit-like API), you can omit this
  value.
  * @returns {Promise} A Promise that fulfills with a `snoowrap` instance
  * @example
  *
  * // Get the `code` querystring param (assuming the user was redirected from reddit)
  * var code = new URL(window.location.href).searchParams.get('code');
  *
  * snoowrap.fromAuthCode({
  *   code: code,
  *   userAgent: 'My app',
  *   clientId: 'foobarbazquuux',
  *   redirectUri: 'example.com'
  * }).then(r => {
  *   // Now we have a requester that can access reddit through the user's account
  *   return r.getHot().then(posts => {
  *     // do something with posts from the front page
  *   });
  * })
  */
  static fromAuthCode(_ref3) {
    var _this = this;

    var _ref3$code = _ref3.code,
        code = _ref3$code === undefined ? (0, _helpers.requiredArg)('code') : _ref3$code,
        _ref3$userAgent = _ref3.userAgent,
        userAgent = _ref3$userAgent === undefined ? _helpers.isBrowser ? global.navigator.userAgent : (0, _helpers.requiredArg)('userAgent') : _ref3$userAgent,
        _ref3$clientId = _ref3.clientId,
        clientId = _ref3$clientId === undefined ? (0, _helpers.requiredArg)('clientId') : _ref3$clientId,
        clientSecret = _ref3.clientSecret,
        _ref3$redirectUri = _ref3.redirectUri,
        redirectUri = _ref3$redirectUri === undefined ? (0, _helpers.requiredArg)('redirectUri') : _ref3$redirectUri,
        _ref3$endpointDomain = _ref3.endpointDomain,
        endpointDomain = _ref3$endpointDomain === undefined ? 'reddit.com' : _ref3$endpointDomain;

    return this.prototype.credentialedClientRequest.call({
      userAgent,
      clientId,
      clientSecret,
      // Use `this.prototype.rawRequest` function to allow for custom `rawRequest` method usage in subclasses.
      rawRequest: this.prototype.rawRequest
    }, {
      method: 'post',
      baseUrl: 'https://www.' + endpointDomain + '/',
      uri: 'api/v1/access_token',
      form: { grant_type: 'authorization_code', code, redirect_uri: redirectUri }
    }).then(function (response) {
      if (response.error) {
        throw new Error('API Error: ' + response.error);
      }
      // Use `new this` instead of `new snoowrap` to ensure that subclass instances can be returned
      var requester = new _this(_extends({ userAgent, clientId, clientSecret }, response));
      requester.config({ endpointDomain });
      return requester;
    });
  }
  _newObject(objectType, content) {
    var _hasFetched = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    return Array.isArray(content) ? content : new snoowrap.objects[objectType](content, this, _hasFetched);
  }
  /**
  * @summary Retrieves or modifies the configuration options for this requester.
  * @param {object} [options] A map of `{[config property name]: value}`. Note that any omitted config properties will simply
  retain whatever value they had previously. (In other words, if you only want to change one property, you only need to put
  that one property in this parameter. To get the current configuration without modifying anything, simply omit this
  parameter.)
  * @param {string} [options.endpointDomain='reddit.com'] The endpoint where requests should be sent
  * @param {Number} [options.requestDelay=0] A minimum delay, in milliseconds, to enforce between API calls. If multiple
  api calls are requested during this timespan, they will be queued and sent one at a time. Setting this to more than 1000 will
  ensure that reddit's ratelimit is never reached, but it will make things run slower than necessary if only a few requests
  are being sent. If this is set to zero, snoowrap will not enforce any delay between individual requests. However, it will
  still refuse to continue if reddit's enforced ratelimit (600 requests per 10 minutes) is exceeded.
  * @param {Number} [options.requestTimeout=30000] A timeout for all OAuth requests, in milliseconds. If the reddit server
  fails to return a response within this amount of time, the Promise will be rejected with a timeout error.
  * @param {boolean} [options.continueAfterRatelimitError=false] Determines whether snoowrap should queue API calls if
  reddit's ratelimit is exceeded. If set to `true` when the ratelimit is exceeded, snoowrap will queue all further requests,
  and will attempt to send them again after the current ratelimit period expires (which happens every 10 minutes). If set
  to `false`, snoowrap will simply throw an error when reddit's ratelimit is exceeded.
  * @param {Number[]} [options.retryErrorCodes=[502, 503, 504, 522]] If reddit responds to an idempotent request with one of
  these error codes, snoowrap will retry the request, up to a maximum of `max_retry_attempts` requests in total. (These
   errors usually indicate that there was an temporary issue on reddit's end, and retrying the request has a decent chance of
  success.) This behavior can be disabled by simply setting this property to an empty array.
  * @param {Number} [options.maxRetryAttempts=3] See `retryErrorCodes`.
  * @param {boolean} [options.warnings=true] snoowrap may occasionally log warnings, such as deprecation notices, to the
  console. These can be disabled by setting this to `false`.
  * @param {boolean} [options.debug=false] If set to true, snoowrap will print out potentially-useful information for debugging
  purposes as it runs.
  * @param {boolean} [options.proxies=true] Setting this to `false` disables snoowrap's method-chaining feature. This causes
  the syntax for using snoowrap to become a bit heavier, but allows for consistency between environments that support the ES6
  `Proxy` object and environments that don't. This option is a no-op in environments that don't support the `Proxy` object,
  since method chaining is always disabled in those environments.
  * @returns {object} An updated Object containing all of the configuration values
  * @example
  *
  * r.config({requestDelay: 1000, warnings: false});
  * // sets the request delay to 1000 milliseconds, and suppresses warnings.
  */
  config() {
    var _this2 = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var invalidKey = Object.keys(options).find(function (key) {
      return !(key in _this2._config);
    });
    if (invalidKey) {
      throw new TypeError('Invalid config option \'' + invalidKey + '\'');
    }
    return Object.assign(this._config, options);
  }
  _warn() {
    if (this._config.warnings) {
      var _console;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      (_console = console).warn.apply(_console, ['[warning]'].concat(args)); // eslint-disable-line no-console
    }
  }
  _debug() {
    if (this._config.debug) {
      var _console2;

      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      (_console2 = console).log.apply(_console2, ['[debug]'].concat(args)); // eslint-disable-line no-console
    }
  }
  get _promiseWrap() {
    return this._config.proxies ? _promiseChains2.default : identity;
  }
  /**
  * @summary Gets information on a reddit user with a given name.
  * @param {string} name - The user's username
  * @returns {RedditUser} An unfetched RedditUser object for the requested user
  * @example
  *
  * r.getUser('not_an_aardvark')
  * // => RedditUser { name: 'not_an_aardvark' }
  * r.getUser('not_an_aardvark').link_karma.then(console.log)
  * // => 6
  */
  getUser(name) {
    return this._newObject('RedditUser', { name: (name + '').replace(/^\/?u\//, '') });
  }
  /**
  * @summary Gets information on a comment with a given id.
  * @param {string} commentId - The base36 id of the comment
  * @returns {Comment} An unfetched Comment object for the requested comment
  * @example
  *
  * r.getComment('c0b6xx0')
  * // => Comment { name: 't1_c0b6xx0' }
  * r.getComment('c0b6xx0').author.name.then(console.log)
  * // => 'Kharos'
  */
  getComment(commentId) {
    return this._newObject('Comment', { name: (0, _helpers.addFullnamePrefix)(commentId, 't1_') });
  }
  /**
  * @summary Gets information on a given subreddit.
  * @param {string} displayName - The name of the subreddit (e.g. 'AskReddit')
  * @returns {Subreddit} An unfetched Subreddit object for the requested subreddit
  * @example
  *
  * r.getSubreddit('AskReddit')
  * // => Subreddit { display_name: 'AskReddit' }
  * r.getSubreddit('AskReddit').created_utc.then(console.log)
  * // => 1201233135
  */
  getSubreddit(displayName) {
    return this._newObject('Subreddit', { display_name: displayName.replace(/^\/?r\//, '') });
  }
  /**
  * @summary Gets information on a given submission.
  * @param {string} submissionId - The base36 id of the submission
  * @returns {Submission} An unfetched Submission object for the requested submission
  * @example
  *
  * r.getSubmission('2np694')
  * // => Submission { name: 't3_2np694' }
  * r.getSubmission('2np694').title.then(console.log)
  * // => 'What tasty food would be distusting if eaten over rice?'
  */
  getSubmission(submissionId) {
    return this._newObject('Submission', { name: (0, _helpers.addFullnamePrefix)(submissionId, 't3_') });
  }
  /**
  * @summary Gets a private message by ID.
  * @param {string} messageId The base36 ID of the message
  * @returns {PrivateMessage} An unfetched PrivateMessage object for the requested message
  * @example
  *
  * r.getMessage('51shnw')
  * // => PrivateMessage { name: 't4_51shnw' }
  * r.getMessage('51shnw').subject.then(console.log)
  * // => 'Example'
  * // See here for a screenshot of the PM in question https://i.gyazo.com/24f3b97e55b6ff8e3a74cb026a58b167.png
  */
  getMessage(messageId) {
    return this._newObject('PrivateMessage', { name: (0, _helpers.addFullnamePrefix)(messageId, 't4_') });
  }
  /**
  * Gets a livethread by ID.
  * @param {string} threadId The base36 ID of the livethread
  * @returns {LiveThread} An unfetched LiveThread object
  * @example
  *
  * r.getLivethread('whrdxo8dg9n0')
  * // => LiveThread { id: 'whrdxo8dg9n0' }
  * r.getLivethread('whrdxo8dg9n0').nsfw.then(console.log)
  * // => false
  */
  getLivethread(threadId) {
    return this._newObject('LiveThread', { id: (0, _helpers.addFullnamePrefix)(threadId, 'LiveUpdateEvent_').slice(16) });
  }
  /**
  * @summary Gets information on the requester's own user profile.
  * @returns {RedditUser} A RedditUser object corresponding to the requester's profile
  * @example
  *
  * r.getMe().then(console.log);
  * // => RedditUser { is_employee: false, has_mail: false, name: 'snoowrap_testing', ... }
  */
  getMe() {
    var _this3 = this;

    return this._get({ uri: 'api/v1/me' }).then(function (result) {
      _this3._ownUserInfo = _this3._newObject('RedditUser', result, true);
      return _this3._ownUserInfo;
    });
  }
  _getMyName() {
    return _Promise2.default.resolve(this._ownUserInfo ? this._ownUserInfo.name : this.getMe().get('name'));
  }
  /**
  * @summary Gets a distribution of the requester's own karma distribution by subreddit.
  * @returns {Promise} A Promise for an object with karma information
  * @example
  *
  * r.getKarma().then(console.log)
  * // => [
  * //  { sr: Subreddit { display_name: 'redditdev' }, comment_karma: 16, link_karma: 1 },
  * //  { sr: Subreddit { display_name: 'programming' }, comment_karma: 2, link_karma: 1 },
  * //  ...
  * // ]
  */
  getKarma() {
    return this._get({ uri: 'api/v1/me/karma' });
  }
  /**
  * @summary Gets information on the user's current preferences.
  * @returns {Promise} A promise for an object containing the user's current preferences
  * @example
  *
  * r.getPreferences().then(console.log)
  * // => { default_theme_sr: null, threaded_messages: true, hide_downs: false, ... }
  */
  getPreferences() {
    return this._get({ uri: 'api/v1/me/prefs' });
  }
  /**
  * @summary Updates the user's current preferences.
  * @param {object} updatedPreferences An object of the form {[some preference name]: 'some value', ...}. Any preference
  * not included in this object will simply retain its current value.
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example
  *
  * r.updatePreferences({threaded_messages: false, hide_downs: true})
  * // => { default_theme_sr: null, threaded_messages: false,hide_downs: true, ... }
  * // (preferences updated on reddit)
  */
  updatePreferences(updatedPreferences) {
    return this._patch({ uri: 'api/v1/me/prefs', body: updatedPreferences });
  }
  /**
  * @summary Gets the currently-authenticated user's trophies.
  * @returns {Promise} A TrophyList containing the user's trophies
  * @example
  *
  * r.getMyTrophies().then(console.log)
  * // => TrophyList { trophies: [
  * //   Trophy { icon_70: 'https://s3.amazonaws.com/redditstatic/award/verified_email-70.png',
  * //     description: null,
  * //     url: null,
  * //     icon_40: 'https://s3.amazonaws.com/redditstatic/award/verified_email-40.png',
  * //     award_id: 'o',
  * //     id: '16fn29',
  * //     name: 'Verified Email'
  * //   }
  * // ] }
  */
  getMyTrophies() {
    return this._get({ uri: 'api/v1/me/trophies' });
  }
  /**
  * @summary Gets the list of the currently-authenticated user's friends.
  * @returns {Promise} A Promise that resolves with a list of friends
  * @example
  *
  * r.getFriends().then(console.log)
  * // => [ [ RedditUser { date: 1457927963, name: 'not_an_aardvark', id: 't2_k83md' } ], [] ]
  */
  getFriends() {
    return this._get({ uri: 'prefs/friends' });
  }
  /**
  * @summary Gets the list of people that the currently-authenticated user has blocked.
  * @returns {Promise} A Promise that resolves with a list of blocked users
  * @example
  *
  * r.getBlockedUsers().then(console.log)
  * // => [ RedditUser { date: 1457928120, name: 'actually_an_aardvark', id: 't2_q3519' } ]
  */
  getBlockedUsers() {
    return this._get({ uri: 'prefs/blocked' });
  }
  /**
  * @summary Determines whether the currently-authenticated user needs to fill out a captcha in order to submit content.
  * @returns {Promise} A Promise that resolves with a boolean value
  * @example
  *
  * r.checkCaptchaRequirement().then(console.log)
  * // => false
  */
  checkCaptchaRequirement() {
    return this._get({ uri: 'api/needs_captcha' });
  }
  /**
  * @summary Gets the identifier (a hex string) for a new captcha image.
  * @returns {Promise} A Promise that resolves with a string
  * @example
  *
  * r.getNewCaptchaIdentifier().then(console.log)
  * // => 'o5M18uy4mk0IW4hs0fu2GNPdXb1Dxe9d'
  */
  getNewCaptchaIdentifier() {
    return this._post({ uri: 'api/new_captcha', form: { api_type } }).then(function (res) {
      return res.json.data.iden;
    });
  }
  /**
  * @summary Gets an image for a given captcha identifier.
  * @param {string} identifier The captcha identifier.
  * @returns {Promise} A string containing raw image data in PNG format
  * @example
  *
  * r.getCaptchaImage('o5M18uy4mk0IW4hs0fu2GNPdXb1Dxe9d').then(console.log)
  // => (A long, incoherent string representing the image in PNG format)
  */
  getCaptchaImage(identifier) {
    return this._get({ uri: 'captcha/' + identifier });
  }
  /**
  * @summary Gets an array of categories that items can be saved in. (Requires reddit gold)
  * @returns {Promise} An array of categories
  * @example
  *
  * r.getSavedCategories().then(console.log)
  * // => [ { category: 'cute cat pictures' }, { category: 'interesting articles' } ]
  */
  getSavedCategories() {
    return this._get({ uri: 'api/saved_categories' }).get('categories');
  }
  /**
  * @summary Marks a list of submissions as 'visited'.
  * @desc **Note**: This endpoint only works if the authenticated user is subscribed to reddit gold.
  * @param {Submission[]} links A list of Submission objects to mark
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example
  *
  * var submissions = [r.getSubmission('4a9u54'), r.getSubmission('4a95nb')]
  * r.markAsVisited(submissions)
  * // (the links will now appear purple on reddit)
  */
  markAsVisited(links) {
    return this._post({ uri: 'api/store_visits', links: (0, _map3.default)(links, 'name').join(',') });
  }
  _submit(_ref4) {
    var _this4 = this;

    var captcha_response = _ref4.captcha_response,
        _ref4$captchaResponse = _ref4.captchaResponse,
        captchaResponse = _ref4$captchaResponse === undefined ? captcha_response : _ref4$captchaResponse,
        captcha_iden = _ref4.captcha_iden,
        _ref4$captchaIden = _ref4.captchaIden,
        captchaIden = _ref4$captchaIden === undefined ? captcha_iden : _ref4$captchaIden,
        kind = _ref4.kind,
        _ref4$resubmit = _ref4.resubmit,
        resubmit = _ref4$resubmit === undefined ? true : _ref4$resubmit,
        _ref4$send_replies = _ref4.send_replies,
        send_replies = _ref4$send_replies === undefined ? true : _ref4$send_replies,
        _ref4$sendReplies = _ref4.sendReplies,
        sendReplies = _ref4$sendReplies === undefined ? send_replies : _ref4$sendReplies,
        crosspost_fullname = _ref4.crosspost_fullname,
        text = _ref4.text,
        title = _ref4.title,
        url = _ref4.url,
        subreddit_name = _ref4.subreddit_name,
        _ref4$subredditName = _ref4.subredditName,
        subredditName = _ref4$subredditName === undefined ? subreddit_name : _ref4$subredditName;

    return this._post({ uri: 'api/submit', form: {
        api_type, captcha: captchaResponse, iden: captchaIden, sendreplies: sendReplies, sr: subredditName, kind, resubmit,
        crosspost_fullname, text, title, url
      } }).tap((0, _helpers.handleJsonErrors)(this)).then(function (result) {
      return _this4.getSubmission(result.json.data.id);
    });
  }
  /**
  * @summary Creates a new selfpost on the given subreddit.
  * @param {object} options An object containing details about the submission
  * @param {string} options.subredditName The name of the subreddit that the post should be submitted to
  * @param {string} options.title The title of the submission
  * @param {string} [options.text] The selftext of the submission
  * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission
  * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [options.captchaResponse] The response to the captcha with the given identifier
  * @returns {Promise} The newly-created Submission object
  * @example
  *
  * r.submitSelfpost({
  *   subredditName: 'snoowrap_testing',
  *   title: 'This is a selfpost',
  *   text: 'This is the text body of the selfpost'
  * }).then(console.log)
  * // => Submission { name: 't3_4abmsz' }
  * // (new selfpost created on reddit)
  */
  submitSelfpost(options) {
    return this._submit(_extends({}, options, { kind: 'self' }));
  }
  /**
  * @summary Creates a new link submission on the given subreddit.
  * @param {object} options An object containing details about the submission
  * @param {string} options.subredditName The name of the subreddit that the post should be submitted to
  * @param {string} options.title The title of the submission
  * @param {string} options.url The url that the link submission should point to
  * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission
  * @param {boolean} [options.resubmit=true] If this is false and same link has already been submitted to this subreddit in
  the past, reddit will return an error. This could be used to avoid accidental reposts.
  * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [options.captchaResponse] The response to the captcha with the given identifier
  * @returns {Promise} The newly-created Submission object
  * @example
  *
  * r.submitLink({
  *   subredditName: 'snoowrap_testing',
  *   title: 'I found a cool website!',
  *   url: 'https://google.com'
  * }).then(console.log)
  * // => Submission { name: 't3_4abnfe' }
  * // (new linkpost created on reddit)
  */
  submitLink(options) {
    return this._submit(_extends({}, options, { kind: 'link' }));
  }

  /**
   * @summary Creates a new crosspost submission on the given subreddit
   * @desc **NOTE**: To create a crosspost, the authenticated account must be subscribed to the subreddit where
   * the crosspost is being submitted, and that subreddit be configured to allow crossposts.
   * @param {object} options An object containing details about the submission
   * @param {string} options.subredditName The name of the subreddit that the crosspost should be submitted to
   * @param {string} options.title The title of the crosspost
   * @param {(string|Submission)} options.originalPost A Submission object or a post ID for the original post which
   is being crossposted
   * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission
   * @param {boolean} [options.resubmit=true] If this is false and same link has already been submitted to this subreddit in
   the past, reddit will return an error. This could be used to avoid accidental reposts.
   * @returns {Promise} The newly-created Submission object
   * @example
   *
   * await r.submitCrosspost({ title: 'I found an interesting post', originalPost: '6vths0', subredditName: 'snoowrap' })
   */
  submitCrosspost(options) {
    return this._submit(_extends({}, options, {
      kind: 'crosspost',
      crosspost_fullname: options.originalPost instanceof snoowrap.objects.Submission ? options.originalPost.name : (0, _helpers.addFullnamePrefix)(options.originalPost, 't3_')
    }));
  }

  _getSortedFrontpage(sortType, subredditName) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    // Handle things properly if only a time parameter is provided but not the subreddit name
    var opts = options;
    var subName = subredditName;
    if (typeof subredditName === 'object' && (0, _isEmpty3.default)((0, _omitBy3.default)(opts, function (option) {
      return option === undefined;
    }))) {
      /* In this case, "subredditName" ends up referring to the second argument, which is not actually a name since the user
      decided to omit that parameter. */
      opts = subredditName;
      subName = undefined;
    }
    var parsedOptions = (0, _omit3.default)(_extends({}, opts, { t: opts.time || opts.t }), 'time');
    return this._getListing({ uri: (subName ? 'r/' + subName + '/' : '') + sortType, qs: parsedOptions });
  }
  /**
  * @summary Gets a Listing of hot posts.
  * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
  the front page of reddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.getHot().then(console.log)
  * // => Listing [
  * //  Submission { domain: 'imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'pics' }, ... },
  * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'funny' }, ... },
  * //  ...
  * // ]
  *
  * r.getHot('gifs').then(console.log)
  * // => Listing [
  * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'gifs' }, ... },
  * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'gifs' }, ... },
  * //  ...
  * // ]
  *
  * r.getHot('redditdev', {limit: 1}).then(console.log)
  * // => Listing [
    //   Submission { domain: 'self.redditdev', banned_by: null, subreddit: Subreddit { display_name: 'redditdev' }, ...}
  * // ]
  */
  getHot(subredditName, options) {
    return this._getSortedFrontpage('hot', subredditName, options);
  }
  /**
  * @summary Gets a Listing of new posts.
  * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
  the front page of reddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.getNew().then(console.log)
  * // => Listing [
  * //  Submission { domain: 'self.Jokes', banned_by: null, subreddit: Subreddit { display_name: 'Jokes' }, ... },
  * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
  * //  ...
  * // ]
  *
  */
  getNew(subredditName, options) {
    return this._getSortedFrontpage('new', subredditName, options);
  }
  /**
  * @summary Gets a Listing of new comments.
  * @param {string} [subredditName] The subreddit to get comments from. If not provided, posts are fetched from
  the front page of reddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved comments
  * @example
  *
  * r.getNewComments().then(console.log)
  * // => Listing [
  * //  Comment { link_title: 'What amazing book should be made into a movie, but hasn\'t been yet?', ... }
  * //  Comment { link_title: 'How far back in time could you go and still understand English?', ... }
  * // ]
  */
  getNewComments(subredditName, options) {
    return this._getSortedFrontpage('comments', subredditName, options);
  }
  /**
  * @summary Gets a single random Submission.
  * @desc **Note**: This function will not work when snoowrap is running in a browser, because the reddit server sends a
  redirect which cannot be followed by a CORS request.
  * @param {string} [subredditName] The subreddit to get the random submission. If not provided, the post is fetched from
  the front page of reddit.
  * @returns {Promise} The retrieved Submission object
  * @example
  *
  * r.getRandomSubmission('aww').then(console.log)
  * // => Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'aww' }, ... }
  */
  getRandomSubmission(subredditName) {
    return this._get({ uri: (subredditName ? 'r/' + subredditName + '/' : '') + 'random' });
  }
  /**
  * @summary Gets a Listing of top posts.
  * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
  the front page of reddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  `hour, day, week, month, year, all`
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.getTop({time: 'all', limit: 2}).then(console.log)
  * // => Listing [
  * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
  * //  Submission { domain: 'imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'funny' }, ... }
  * // ]
  *
  * r.getTop('AskReddit').then(console.log)
  * // => Listing [
  * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
  * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
  * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
  * //  ...
  * // ]
  */
  getTop(subredditName, options) {
    return this._getSortedFrontpage('top', subredditName, options);
  }
  /**
  * @summary Gets a Listing of controversial posts.
  * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
  the front page of reddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  `hour, day, week, month, year, all`
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.getControversial('technology').then(console.log)
  * // => Listing [
  * //  Submission { domain: 'thenextweb.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... },
  * //  Submission { domain: 'pcmag.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... }
  * // ]
  */
  getControversial(subredditName, options) {
    return this._getSortedFrontpage('controversial', subredditName, options);
  }
  /**
  * @summary Gets a Listing of controversial posts.
  * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
  the front page of reddit.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.getRising('technology').then(console.log)
  * // => Listing [
  * //  Submission { domain: 'thenextweb.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... },
  * //  Submission { domain: 'pcmag.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... }
  * // ]
  */
  getRising(subredditName, options) {
    return this._getSortedFrontpage('rising', subredditName, options);
  }
  /**
  * @summary Gets the authenticated user's unread messages.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing unread items in the user's inbox
  * @example
  *
  * r.getUnreadMessages().then(console.log)
  * // => Listing [
  * //  PrivateMessage { body: 'hi!', was_comment: false, first_message: null, ... },
  * //  Comment { body: 'this is a reply', link_title: 'Yay, a selfpost!', was_comment: true, ... }
  * // ]
  */
  getUnreadMessages() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this._getListing({ uri: 'message/unread', qs: options });
  }
  /**
  * @summary Gets the items in the authenticated user's inbox.
  * @param {object} [options={}] Filter options. Can also contain options for the resulting Listing.
  * @param {string} [options.filter] A filter for the inbox items. If provided, it should be one of `unread`, (unread
  items), `messages` (i.e. PMs), `comments` (comment replies), `selfreply` (selfpost replies), or `mentions` (username
  mentions).
  * @returns {Promise} A Listing containing items in the user's inbox
  * @example
  *
  * r.getInbox().then(console.log)
  * // => Listing [
  * //  PrivateMessage { body: 'hi!', was_comment: false, first_message: null, ... },
  * //  Comment { body: 'this is a reply', link_title: 'Yay, a selfpost!', was_comment: true, ... }
  * // ]
  */
  getInbox() {
    var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        filter = _ref5.filter,
        options = _objectWithoutProperties(_ref5, ['filter']);

    return this._getListing({ uri: 'message/' + (filter || 'inbox'), qs: options });
  }
  /**
  * @summary Gets the authenticated user's modmail.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing of the user's modmail
  * @example
  *
  * r.getModmail({limit: 2}).then(console.log)
  * // => Listing [
  * //  PrivateMessage { body: '/u/not_an_aardvark has accepted an invitation to become moderator ... ', ... },
  * //  PrivateMessage { body: '/u/not_an_aardvark has been invited by /u/actually_an_aardvark to ...', ... }
  * // ]
  */
  getModmail() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this._getListing({ uri: 'message/moderator', qs: options });
  }
  /**
  * @summary Gets the user's sent messages.
  * @param {object} [options={}] options for the resulting Listing
  * @returns {Promise} A Listing of the user's sent messages
  * @example
  *
  * r.getSentMessages().then(console.log)
  * // => Listing [
  * //  PrivateMessage { body: 'you have been added as an approved submitter to ...', ... },
  * //  PrivateMessage { body: 'you have been banned from posting to ...' ... }
  * // ]
  */
  getSentMessages() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this._getListing({ uri: 'message/sent', qs: options });
  }
  /**
  * @summary Marks all of the given messages as read.
  * @param {PrivateMessage[]|String[]} messages An Array of PrivateMessage or Comment objects. Can also contain strings
  representing message or comment IDs. If strings are provided, they are assumed to represent PrivateMessages unless a fullname
  prefix such as `t1_` is specified.
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example
  *
  * r.markMessagesAsRead(['51shsd', '51shxv'])
  *
  * // To reference a comment by ID, be sure to use the `t1_` prefix, otherwise snoowrap will be unable to distinguish the
  * // comment ID from a PrivateMessage ID.
  * r.markMessagesAsRead(['t5_51shsd', 't1_d3zhb5k'])
  *
  * // Alternatively, just pass in a comment object directly.
  * r.markMessagesAsRead([r.getMessage('51shsd'), r.getComment('d3zhb5k')])
  */
  markMessagesAsRead(messages) {
    var messageIds = messages.map(function (message) {
      return (0, _helpers.addFullnamePrefix)(message, 't4_');
    });
    return this._post({ uri: 'api/read_message', form: { id: messageIds.join(',') } });
  }
  /**
  * @summary Marks all of the given messages as unread.
  * @param {PrivateMessage[]|String[]} messages An Array of PrivateMessage or Comment objects. Can also contain strings
  representing message IDs. If strings are provided, they are assumed to represent PrivateMessages unless a fullname prefix such
  as `t1_` is included.
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example
  *
  * r.markMessagesAsUnread(['51shsd', '51shxv'])
  *
  * // To reference a comment by ID, be sure to use the `t1_` prefix, otherwise snoowrap will be unable to distinguish the
  * // comment ID from a PrivateMessage ID.
  * r.markMessagesAsUnread(['t5_51shsd', 't1_d3zhb5k'])
  *
  * // Alternatively, just pass in a comment object directly.
  * r.markMessagesAsRead([r.getMessage('51shsd'), r.getComment('d3zhb5k')])
  */
  markMessagesAsUnread(messages) {
    var messageIds = messages.map(function (message) {
      return (0, _helpers.addFullnamePrefix)(message, 't4_');
    });
    return this._post({ uri: 'api/unread_message', form: { id: messageIds.join(',') } });
  }
  /**
  * @summary Marks all of the user's messages as read.
  * @desc **Note:** The reddit.com site imposes a ratelimit of approximately 1 request every 10 minutes on this endpoint.
  Further requests will cause the API to return a 429 error.
  * @returns {Promise} A Promise that resolves when the request is complete
  * @example
  *
  * r.readAllMessages().then(function () {
  *   r.getUnreadMessages().then(console.log)
  * })
  * // => Listing []
  * // (messages marked as 'read' on reddit)
  */
  readAllMessages() {
    return this._post({ uri: 'api/read_all_messages' });
  }
  /**
  * @summary Composes a new private message.
  * @param {object} options
  * @param {RedditUser|Subreddit|string} options.to The recipient of the message.
  * @param {string} options.subject The message subject (100 characters max)
  * @param {string} options.text The body of the message, in raw markdown text
  * @param {Subreddit|string} [options.fromSubreddit] If provided, the message is sent as a modmail from the specified
  subreddit.
  * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [options.captchaResponse] The response to the captcha with the given identifier
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example
  *
  * r.composeMessage({
  *   to: 'actually_an_aardvark',
  *   subject: "Hi, how's it going?",
  *   text: 'Long time no see'
  * })
  * // (message created on reddit)
  */
  composeMessage(_ref6) {
    var captcha = _ref6.captcha,
        from_subreddit = _ref6.from_subreddit,
        _ref6$fromSubreddit = _ref6.fromSubreddit,
        fromSubreddit = _ref6$fromSubreddit === undefined ? from_subreddit : _ref6$fromSubreddit,
        captcha_iden = _ref6.captcha_iden,
        _ref6$captchaIden = _ref6.captchaIden,
        captchaIden = _ref6$captchaIden === undefined ? captcha_iden : _ref6$captchaIden,
        subject = _ref6.subject,
        text = _ref6.text,
        to = _ref6.to;

    var parsedTo = to;
    var parsedFromSr = fromSubreddit;
    if (to instanceof snoowrap.objects.RedditUser) {
      parsedTo = to.name;
    } else if (to instanceof snoowrap.objects.Subreddit) {
      parsedTo = '/r/' + to.display_name;
    }
    if (fromSubreddit instanceof snoowrap.objects.Subreddit) {
      parsedFromSr = fromSubreddit.display_name;
    } else if (typeof fromSubreddit === 'string') {
      parsedFromSr = fromSubreddit.replace(/^\/?r\//, ''); // Convert '/r/subreddit_name' to 'subreddit_name'
    }
    return this._post({ uri: 'api/compose', form: {
        api_type, captcha, iden: captchaIden, from_sr: parsedFromSr, subject, text, to: parsedTo
      } }).tap((0, _helpers.handleJsonErrors)(this)).return({});
  }
  /**
  * @summary Gets a list of all oauth scopes supported by the reddit API.
  * @desc **Note**: This lists every single oauth scope. To get the scope of this requester, use the `scope` property instead.
  * @returns {Promise} An object containing oauth scopes.
  * @example
  *
  * r.getOauthScopeList().then(console.log)
  * // => {
  * //  creddits: {
  * //    description: 'Spend my reddit gold creddits on giving gold to other users.',
  * //    id: 'creddits',
  * //    name: 'Spend reddit gold creddits'
  * //  },
  * //  modcontributors: {
  * //    description: 'Add/remove users to approved submitter lists and ban/unban or mute/unmute users from ...',
  * //    id: 'modcontributors',
  * //    name: 'Approve submitters and ban users'
  * //  },
  * //  ...
  * // }
  */
  getOauthScopeList() {
    return this._get({ uri: 'api/v1/scopes' });
  }
  /**
  * @summary Conducts a search of reddit submissions.
  * @param {object} options Search options. Can also contain options for the resulting Listing.
  * @param {string} options.query The search query
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. One of
  `hour, day, week, month, year, all`
  * @param {Subreddit|string} [options.subreddit] The subreddit to conduct the search on.
  * @param {boolean} [options.restrictSr=true] Restricts search results to the given subreddit
  * @param {string} [options.sort] Determines how the results should be sorted. One of `relevance, hot, top, new, comments`
  * @param {string} [options.syntax='plain'] Specifies a syntax for the search. One of `cloudsearch, lucene, plain`
  * @returns {Promise} A Listing containing the search results.
  * @example
  *
  * r.search({
  *   query: 'Cute kittens',
  *   subreddit: 'aww',
  *   sort: 'top'
  * }).then(console.log)
  * // => Listing [
  * //  Submission { domain: 'i.imgur.com', banned_by: null, ... },
  * //  Submission { domain: 'imgur.com', banned_by: null, ... },
  * //  ...
  * // ]
  */
  search(options) {
    if (options.subreddit instanceof snoowrap.objects.Subreddit) {
      options.subreddit = options.subreddit.display_name;
    }
    (0, _defaults3.default)(options, { restrictSr: true, syntax: 'plain' });
    var parsedQuery = (0, _omit3.default)(_extends({}, options, { t: options.time, q: options.query, restrict_sr: options.restrictSr }), ['time', 'query']);
    return this._getListing({ uri: (options.subreddit ? 'r/' + options.subreddit + '/' : '') + 'search', qs: parsedQuery });
  }
  /**
  * @summary Searches for subreddits given a query.
  * @param {object} options
  * @param {string} options.query A search query (50 characters max)
  * @param {boolean} [options.exact=false] Determines whether the results shouldbe limited to exact matches.
  * @param {boolean} [options.includeNsfw=true] Determines whether the results should include NSFW subreddits.
  * @returns {Promise} An Array containing subreddit names
  * @example
  *
  * r.searchSubredditNames({query: 'programming'}).then(console.log)
  * // => [
  * //  'programming',
  * //  'programmingcirclejerk',
  * //  'programminghorror',
  * //  ...
  * // ]
  */
  searchSubredditNames(_ref7) {
    var _ref7$exact = _ref7.exact,
        exact = _ref7$exact === undefined ? false : _ref7$exact,
        _ref7$include_nsfw = _ref7.include_nsfw,
        include_nsfw = _ref7$include_nsfw === undefined ? true : _ref7$include_nsfw,
        _ref7$includeNsfw = _ref7.includeNsfw,
        includeNsfw = _ref7$includeNsfw === undefined ? include_nsfw : _ref7$includeNsfw,
        query = _ref7.query;

    return this._post({ uri: 'api/search_reddit_names', qs: { exact, include_over_18: includeNsfw, query } }).get('names');
  }

  _createOrEditSubreddit() {
    var form = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var safe = ['all_original_content', 'allow_discovery', 'allow_images', 'allow_post_crossposts', 'allow_top', 'allow_videos', 'api_type', 'collapse_deleted_comments', 'comment_score_hide_mins', 'description', 'exclude_banned_modqueue', 'free_form_reports', 'g-recaptcha-response ', 'header-title', 'hide_ads', 'key_color', 'lang', 'link_type', 'name', 'original_content_tag_enabled', 'over_18', 'public_description', 'show_media', 'show_media_preview', 'spam_comments', 'spam_links', 'spam_selfposts', 'spoilers_enabled', 'sr', 'submit_link_label', 'submit_text', 'submit_text_label', 'suggested_comment_sort', 'theme_sr', 'theme_sr_update', 'title', 'type', 'uh / X-Modhash header', 'wiki_edit_age', 'wiki_edit_karma', 'wikimode'];

    var setForm = {};
    safe.forEach(function (key) {
      return setForm[key] = form[key];
    });

    return this._post({ uri: 'api/site_admin', form: setForm }).then((0, _helpers.handleJsonErrors)(this.getSubreddit(form.name || form.sr))).catch(console.error);
  }

  /**
  * @summary Creates a new subreddit.
  * @param {object} options
  * @param {string} options.name The name of the new subreddit
  * @param {string} options.title The text that should appear in the header of the subreddit
  * @param {string} options.public_description The text that appears with this subreddit on the search page, or on the
  blocked-access page if this subreddit is private. (500 characters max)
  * @param {string} options.description The sidebar text for the subreddit. (5120 characters max)
  * @param {string} [options.submit_text=''] The text to show below the submission page (1024 characters max)
  * @param {boolean} [options.hide_ads=false] Determines whether ads should be hidden on this subreddit. (This is only
  allowed for gold-only subreddits.)
  * @param {string} [options.lang='en'] The language of the subreddit (represented as an IETF language tag)
  * @param {string} [options.type='public'] Determines who should be able to access the subreddit. This should be one of
  `public, private, restricted, gold_restricted, gold_only, archived, employees_only`.
  * @param {string} [options.link_type='any'] Determines what types of submissions are allowed on the subreddit. This should
  be one of `any, link, self`.
  * @param {string} [options.submit_link_label=undefined] Custom text to display on the button that submits a link. If
  this is omitted, the default text will be displayed.
  * @param {string} [options.submit_text_label=undefined] Custom text to display on the button that submits a selfpost. If
  this is omitted, the default text will be displayed.
  * @param {string} [options.wikimode='modonly'] Determines who can edit wiki pages on the subreddit. This should be one of
  `modonly, anyone, disabled`.
  * @param {number} [options.wiki_edit_karma=0] The minimum amount of subreddit karma needed for someone to edit this
  subreddit's wiki. (This is only relevant if `options.wikimode` is set to `anyone`.)
  * @param {number} [options.wiki_edit_age=0] The minimum account age (in days) needed for someone to edit this subreddit's
  wiki. (This is only relevant if `options.wikimode` is set to `anyone`.)
  * @param {string} [options.spam_links='high'] The spam filter strength for links on this subreddit. This should be one of
  `low, high, all`.
  * @param {string} [options.spam_selfposts='high'] The spam filter strength for selfposts on this subreddit. This should be
  one of `low, high, all`.
  * @param {string} [options.spam_comments='high'] The spam filter strength for comments on this subreddit. This should be one
  of `low, high, all`.
  * @param {boolean} [options.over_18=false] Determines whether this subreddit should be classified as NSFW
  * @param {boolean} [options.allow_top=true] Determines whether the new subreddit should be able to appear in /r/all and
  trending subreddits
  * @param {boolean} [options.show_media=false] Determines whether image thumbnails should be enabled on this subreddit
  * @param {boolean} [options.show_media_preview=true] Determines whether media previews should be expanded by default on this
  subreddit
  * @param {boolean} [options.allow_images=true] Determines whether image uploads and links to image hosting sites should be
  enabled on this subreddit
  * @param {boolean} [options.exclude_banned_modqueue=false] Determines whether posts by site-wide banned users should be
  excluded from the modqueue.
  * @param {boolean} [options.public_traffic=false] Determines whether the /about/traffic page for this subreddit should be
  viewable by anyone.
  * @param {boolean} [options.collapse_deleted_comments=false] Determines whether deleted and removed comments should be
  collapsed by default
  * @param {string} [options.suggested_comment_sort=undefined] The suggested comment sort for the subreddit. This should be
  one of `confidence, top, new, controversial, old, random, qa`.If left blank, there will be no suggested sort,
  which means that users will see the sort method that is set in their own preferences (usually `confidence`.)
  * @param {boolean} [options.spoilers_enabled=false] Determines whether users can mark their posts as spoilers
  * @returns {Promise} A Promise for the newly-created subreddit object.
  * @example
  *
  * r.createSubreddit({
  *   name: 'snoowrap_testing2',
  *   title: 'snoowrap testing: the sequel',
  *   public_description: 'thanks for reading the snoowrap docs!',
  *   description: 'This text will go on the sidebar',
  *   type: 'private'
  * }).then(console.log)
  * // => Subreddit { display_name: 'snoowrap_testing2' }
  * // (/r/snoowrap_testing2 created on reddit)
  */
  createSubreddit(options) {
    return this._createOrEditSubreddit(options);
  }
  /**
  * @summary Searches subreddits by topic.
  * @param {object} options
  * @param {string} options.query The search query. (50 characters max)
  * @returns {Promise} An Array of subreddit objects corresponding to the search results
  * @example
  *
  * r.searchSubredditTopics({query: 'movies'}).then(console.log)
  * // => [
  * //  Subreddit { display_name: 'tipofmytongue' },
  * //  Subreddit { display_name: 'remove' },
  * //  Subreddit { display_name: 'horror' },
  * //  ...
  * // ]
  */
  searchSubredditTopics(_ref8) {
    var _this5 = this;

    var query = _ref8.query;

    return this._get({ uri: 'api/subreddits_by_topic', qs: { query } }).map(function (result) {
      return _this5.getSubreddit(result.name);
    });
  }
  /**
  * @summary Gets a list of subreddits that the currently-authenticated user is subscribed to.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @example
  *
  * r.getSubscriptions({limit: 2}).then(console.log)
  * // => Listing [
  * //  Subreddit {
  * //    display_name: 'gadgets',
  * //    title: 'reddit gadget guide',
  * //    ...
  * //  },
  * //  Subreddit {
  * //    display_name: 'sports',
  * //    title: 'the sportspage of the Internet',
  * //    ...
  * //  }
  * // ]
  */
  getSubscriptions(options) {
    return this._getListing({ uri: 'subreddits/mine/subscriber', qs: options });
  }
  /**
  * @summary Gets a list of subreddits in which the currently-authenticated user is an approved submitter.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @example
  *
  * r.getContributorSubreddits().then(console.log)
  * // => Listing [
  * //  Subreddit {
  * //    display_name: 'snoowrap_testing',
  * //    title: 'snoowrap',
  * //    ...
  * //  }
  * // ]
  *
  */
  getContributorSubreddits(options) {
    return this._getListing({ uri: 'subreddits/mine/contributor', qs: options });
  }
  /**
  * @summary Gets a list of subreddits in which the currently-authenticated user is a moderator.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @example
  *
  * r.getModeratedSubreddits().then(console.log)
  * // => Listing [
  * //  Subreddit {
  * //    display_name: 'snoowrap_testing',
  * //    title: 'snoowrap',
  * //    ...
  * //  }
  * // ]
  */
  getModeratedSubreddits(options) {
    return this._getListing({ uri: 'subreddits/mine/moderator', qs: options });
  }
  /**
  * @summary Searches subreddits by title and description.
  * @param {object} options Options for the search. May also contain Listing parameters.
  * @param {string} options.query The search query
  * @returns {Promise} A Listing containing Subreddits
  * @example
  *
  * r.searchSubreddits({query: 'cookies'}).then(console.log)
  * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
  */
  searchSubreddits(options) {
    options.q = options.query;
    return this._getListing({ uri: 'subreddits/search', qs: (0, _omit3.default)(options, 'query') });
  }
  /**
  * @summary Gets a list of subreddits, arranged by popularity.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @example
  *
  * r.getPopularSubreddits().then(console.log)
  * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
  */
  getPopularSubreddits(options) {
    return this._getListing({ uri: 'subreddits/popular', qs: options });
  }
  /**
  * @summary Gets a list of subreddits, arranged by age.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @example
  *
  * r.getNewSubreddits().then(console.log)
  * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
  */
  getNewSubreddits(options) {
    return this._getListing({ uri: 'subreddits/new', qs: options });
  }
  /**
  * @summary Gets a list of gold-exclusive subreddits.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @example
  *
  * r.getGoldSubreddits().then(console.log)
  * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
  */
  getGoldSubreddits(options) {
    return this._getListing({ uri: 'subreddits/gold', qs: options });
  }
  /**
  * @summary Gets a list of default subreddits.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @example
  *
  * r.getDefaultSubreddits().then(console.log)
  * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
  */
  getDefaultSubreddits(options) {
    return this._getListing({ uri: 'subreddits/default', qs: options });
  }
  /**
  * @summary Checks whether a given username is available for registration
  * @desc **Note:** This function will not work when snoowrap is running in a browser, due to an issue with reddit's CORS
  settings.
  * @param {string} name The username in question
  * @returns {Promise} A Promise that fulfills with a Boolean (`true` or `false`)
  * @example
  *
  * r.checkUsernameAvailability('not_an_aardvark').then(console.log)
  * // => false
  * r.checkUsernameAvailability('eqwZAr9qunx7IHqzWVeF').then(console.log)
  * // => true
  */
  checkUsernameAvailability(name) {
    // The oauth endpoint listed in reddit's documentation doesn't actually work, so just send an unauthenticated request.
    return this.unauthenticatedRequest({ uri: 'api/username_available.json', qs: { user: name } });
  }
  /**
  * @summary Creates a new LiveThread.
  * @param {object} options
  * @param {string} options.title The title of the livethread (100 characters max)
  * @param {string} [options.description] A descriptions of the thread. 120 characters max
  * @param {string} [options.resources] Information and useful links related to the thread. 120 characters max
  * @param {boolean} [options.nsfw=false] Determines whether the thread is Not Safe For Work
  * @returns {Promise} A Promise that fulfills with the new LiveThread when the request is complete
  * @example
  *
  * r.createLivethread({title: 'My livethread'}).then(console.log)
  * // => LiveThread { id: 'wpimncm1f01j' }
  */
  createLivethread(_ref9) {
    var _this6 = this;

    var title = _ref9.title,
        description = _ref9.description,
        resources = _ref9.resources,
        _ref9$nsfw = _ref9.nsfw,
        nsfw = _ref9$nsfw === undefined ? false : _ref9$nsfw;

    return this._post({
      uri: 'api/live/create',
      form: { api_type, description, nsfw, resources, title }
    }).tap((0, _helpers.handleJsonErrors)(this)).then(function (result) {
      return _this6.getLivethread(result.json.data.id);
    });
  }
  /**
  * @summary Gets the "happening now" LiveThread, if it exists
  * @desc This is the LiveThread that is occasionally linked at the top of reddit.com, relating to current events.
  * @returns {Promise} A Promise that fulfills with the "happening now" LiveThread if it exists, or rejects with a 404 error
  otherwise.
  * @example r.getCurrentEventsLivethread().then(thread => thread.stream.on('update', console.log))
  */
  getStickiedLivethread() {
    return this._get({ uri: 'api/live/happening_now' });
  }
  /**
  * @summary Gets the user's own multireddits.
  * @returns {Promise} A Promise for an Array containing the requester's MultiReddits.
  * @example
  *
  * r.getMyMultireddits().then(console.log)
  * => [ MultiReddit { ... }, MultiReddit { ... }, ... ]
  */
  getMyMultireddits() {
    return this._get({ uri: 'api/multi/mine', qs: { expand_srs: true } });
  }
  /**
  * @summary Creates a new multireddit.
  * @param {object} options
  * @param {string} options.name The name of the new multireddit. 50 characters max
  * @param {string} options.description A description for the new multireddit, in markdown.
  * @param {Array} options.subreddits An Array of Subreddit objects (or subreddit names) that this multireddit should compose of
  * @param {string} [options.visibility='private'] The multireddit's visibility setting. One of `private`, `public`, `hidden`.
  * @param {string} [options.icon_name=''] One of `art and design`, `ask`, `books`, `business`, `cars`, `comics`,
  `cute animals`, `diy`, `entertainment`, `food and drink`, `funny`, `games`, `grooming`, `health`, `life advice`, `military`,
  `models pinup`, `music`, `news`, `philosophy`, `pictures and gifs`, `science`, `shopping`, `sports`, `style`, `tech`,
  `travel`, `unusual stories`, `video`, `None`
  * @param {string} [options.key_color='#000000'] A six-digit RGB hex color, preceded by '#'
  * @param {string} [options.weighting_scheme='classic'] One of `classic`, `fresh`
  * @returns {Promise} A Promise for the newly-created MultiReddit object
  * @example
  *
  * r.createMultireddit({
  *   name: 'myMulti',
  *   description: 'An example multireddit',
  *   subreddits: ['snoowrap', 'snoowrap_testing']
  * }).then(console.log)
  * => MultiReddit { display_name: 'myMulti', ... }
  */
  createMultireddit(_ref10) {
    var name = _ref10.name,
        description = _ref10.description,
        subreddits = _ref10.subreddits,
        _ref10$visibility = _ref10.visibility,
        visibility = _ref10$visibility === undefined ? 'private' : _ref10$visibility,
        _ref10$icon_name = _ref10.icon_name,
        icon_name = _ref10$icon_name === undefined ? '' : _ref10$icon_name,
        _ref10$key_color = _ref10.key_color,
        key_color = _ref10$key_color === undefined ? '#000000' : _ref10$key_color,
        _ref10$weighting_sche = _ref10.weighting_scheme,
        weighting_scheme = _ref10$weighting_sche === undefined ? 'classic' : _ref10$weighting_sche;

    return this._post({ uri: 'api/multi', form: { model: JSON.stringify({
          display_name: name,
          description_md: description,
          icon_name,
          key_color,
          subreddits: subreddits.map(function (sub) {
            return { name: typeof sub === 'string' ? sub : sub.display_name };
          }),
          visibility,
          weighting_scheme
        }) } });
  }
  _revokeToken(token) {
    return this.credentialedClientRequest({ uri: 'api/v1/revoke_token', form: { token }, method: 'post' });
  }
  /**
  * @summary Invalidates the current access token.
  * @returns {Promise} A Promise that fulfills when this request is complete
  * @desc **Note**: This can only be used if the current requester was supplied with a `client_id` and `client_secret`. If the
  current requester was supplied with a refresh token, it will automatically create a new access token if any more requests
  are made after this one.
  * @example r.revokeAccessToken();
  */
  revokeAccessToken() {
    var _this7 = this;

    return this._revokeToken(this.accessToken).then(function () {
      _this7.accessToken = null;
      _this7.tokenExpiration = null;
    });
  }
  /**
  * @summary Invalidates the current refresh token.
  * @returns {Promise} A Promise that fulfills when this request is complete
  * @desc **Note**: This can only be used if the current requester was supplied with a `client_id` and `client_secret`. All
  access tokens generated by this refresh token will also be invalidated. This effectively de-authenticates the requester and
  prevents it from making any more valid requests. This should only be used in a few cases, e.g. if this token has
  been accidentally leaked to a third party.
  * @example r.revokeRefreshToken();
  */
  revokeRefreshToken() {
    var _this8 = this;

    return this._revokeToken(this.refreshToken).then(function () {
      _this8.refreshToken = null;
      _this8.accessToken = null; // Revoking a refresh token also revokes any associated access tokens.
      _this8.tokenExpiration = null;
    });
  }
  _selectFlair(_ref11) {
    var _this9 = this;

    var flair_template_id = _ref11.flair_template_id,
        link = _ref11.link,
        name = _ref11.name,
        text = _ref11.text,
        subredditName = _ref11.subredditName;

    if (!flair_template_id) {
      throw new errors.InvalidMethodCallError('No flair template ID provided');
    }
    return _Promise2.default.resolve(subredditName).then(function (subName) {
      return _this9._post({ uri: 'r/' + subName + '/api/selectflair', form: { api_type, flair_template_id, link, name, text } });
    });
  }
  _assignFlair(_ref12) {
    var _this10 = this;

    var css_class = _ref12.css_class,
        _ref12$cssClass = _ref12.cssClass,
        cssClass = _ref12$cssClass === undefined ? css_class : _ref12$cssClass,
        link = _ref12.link,
        name = _ref12.name,
        text = _ref12.text,
        subreddit_name = _ref12.subreddit_name,
        _ref12$subredditName = _ref12.subredditName,
        subredditName = _ref12$subredditName === undefined ? subreddit_name : _ref12$subredditName;

    return this._promiseWrap(_Promise2.default.resolve(subredditName).then(function (displayName) {
      return _this10._post({ uri: 'r/' + displayName + '/api/flair', form: { api_type, name, text, link, css_class: cssClass } });
    }));
  }
  _populate(responseTree) {
    var _this11 = this;

    if (typeof responseTree === 'object' && responseTree !== null) {
      // Map {kind: 't2', data: {name: 'some_username', ... }} to a RedditUser (e.g.) with the same properties
      if (Object.keys(responseTree).length === 2 && responseTree.kind && responseTree.data) {
        return this._newObject(_constants.KINDS[responseTree.kind] || 'RedditContent', this._populate(responseTree.data), true);
      }
      var result = (Array.isArray(responseTree) ? _map3.default : _mapValues3.default)(responseTree, function (value, key) {
        // Maps {author: 'some_username'} to {author: RedditUser { name: 'some_username' } }
        if (value !== null && _constants.USER_KEYS.has(key)) {
          return _this11._newObject('RedditUser', { name: value });
        }
        if (value !== null && _constants.SUBREDDIT_KEYS.has(key)) {
          return _this11._newObject('Subreddit', { display_name: value });
        }
        return _this11._populate(value);
      });
      if (result.length === 2 && result[0] instanceof snoowrap.objects.Listing && result[0][0] instanceof snoowrap.objects.Submission && result[1] instanceof snoowrap.objects.Listing) {
        if (result[1]._more && !result[1]._more.link_id) {
          result[1]._more.link_id = result[0][0].name;
        }
        result[0][0].comments = result[1];
        return result[0][0];
      }
      return result;
    }
    return responseTree;
  }
  _getListing(_ref13) {
    var uri = _ref13.uri,
        _ref13$qs = _ref13.qs,
        qs = _ref13$qs === undefined ? {} : _ref13$qs,
        options = _objectWithoutProperties(_ref13, ['uri', 'qs']);

    /* When the response type is expected to be a Listing, add a `count` parameter with a very high number.
    This ensures that reddit returns a `before` property in the resulting Listing to enable pagination.
    (Aside from the additional parameter, this function is equivalent to snoowrap.prototype._get) */
    var mergedQuery = _extends({ count: 9999 }, qs);
    return qs.limit || !(0, _isEmpty3.default)(options) ? this._newObject('Listing', _extends({ _query: mergedQuery, _uri: uri }, options)).fetchMore(qs.limit || _constants.MAX_LISTING_ITEMS)
    /* This second case is used as a fallback in case the endpoint unexpectedly ends up returning something other than a
    Listing (e.g. Submission#getRelated, which used to return a Listing but no longer does due to upstream reddit API
    changes), in which case using fetch_more() as above will throw an error.
     This fallback only works if there are no other meta-properties provided for the Listing, such as _transform. If there are
    other meta-properties,  the function will still end up throwing an error, but there's not really any good way to handle it
    (predicting upstream changes can only go so far). More importantly, in the limited cases where it's used, the fallback
    should have no effect on the returned results */
    : this._get({ uri, qs: mergedQuery }).then(function (listing) {
      if (Array.isArray(listing)) {
        listing.filter(function (item) {
          return item.constructor._name === 'Comment';
        }).forEach(_helpers.addEmptyRepliesListing);
      }
      return listing;
    });
  }
  /**
  * @summary In browsers, restores the `window.snoowrap` property to whatever it was before this instance of snoowrap was
  loaded. This is a no-op in Node.
  * @returns This instance of the snoowrap constructor
  * @example var snoowrap = window.snoowrap.noConflict();
  */
  static noConflict() {
    if (_helpers.isBrowser) {
      global[_constants.MODULE_NAME] = this._previousSnoowrap;
    }
    return this;
  }
};

function identity(value) {
  return value;
}

(0, _helpers.defineInspectFunc)(snoowrap.prototype, function () {
  // Hide confidential information (tokens, client IDs, etc.), as well as private properties, from the console.log output.
  var keysForHiddenValues = ['clientSecret', 'refreshToken', 'accessToken', 'password'];
  var formatted = (0, _mapValues3.default)((0, _omitBy3.default)(this, function (value, key) {
    return typeof key === 'string' && key.startsWith('_');
  }), function (value, key) {
    return (0, _includes3.default)(keysForHiddenValues, key) ? value && '(redacted)' : value;
  });
  return _constants.MODULE_NAME + ' ' + _util2.default.inspect(formatted);
});

var classFuncDescriptors = { configurable: true, writable: true };

/* Add the request_handler functions (oauth_request, credentialed_client_request, etc.) to the snoowrap prototype. Use
Object.defineProperties to ensure that the properties are non-enumerable. */
Object.defineProperties(snoowrap.prototype, (0, _mapValues3.default)(requestHandler, function (func) {
  return _extends({ value: func }, classFuncDescriptors);
}));

_constants.HTTP_VERBS.forEach(function (method) {
  /* Define method shortcuts for each of the HTTP verbs. i.e. `snoowrap.prototype._post` is the same as `oauth_request` except
  that the HTTP method defaults to `post`, and the result is promise-wrapped. Use Object.defineProperty to ensure that the
  properties are non-enumerable. */
  Object.defineProperty(snoowrap.prototype, '_' + method, _extends({ value(options) {
      return this._promiseWrap(this.oauthRequest(_extends({}, options, { method })));
    } }, classFuncDescriptors));
});

/* `objects` will be an object containing getters for each content type, due to the way objects are exported from
objects/index.js. To unwrap these getters into direct properties, use lodash.mapValues with an identity function. */
snoowrap.objects = (0, _mapValues3.default)(objects, function (value) {
  return value;
});

(0, _forOwn3.default)(_constants.KINDS, function (value) {
  snoowrap.objects[value] = snoowrap.objects[value] || class extends objects.RedditContent {};
  Object.defineProperty(snoowrap.objects[value], '_name', { value, configurable: true });
});

// Alias all functions on snoowrap's prototype and snoowrap's object prototypes in snake_case.
(0, _values3.default)(snoowrap.objects).concat(snoowrap).map(function (func) {
  return func.prototype;
}).forEach(function (funcProto) {
  Object.getOwnPropertyNames(funcProto).filter(function (name) {
    return !name.startsWith('_') && name !== (0, _snakeCase3.default)(name) && typeof funcProto[name] === 'function';
  }).forEach(function (name) {
    return Object.defineProperty(funcProto, (0, _snakeCase3.default)(name), _extends({ value: funcProto[name] }, classFuncDescriptors));
  });
});

snoowrap.errors = errors;
snoowrap.version = _constants.VERSION;

if (!module.parent && _helpers.isBrowser) {
  // check if the code is being run in a browser through browserify, etc.
  snoowrap._previousSnoowrap = global[_constants.MODULE_NAME];
  global[_constants.MODULE_NAME] = snoowrap;
}

module.exports = snoowrap;