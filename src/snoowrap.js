import {defaults, forOwn, includes, isEmpty, map, mapValues, omit, omitBy, snakeCase, values} from 'lodash';
import Promise from './Promise.js';
import promiseWrap from 'promise-chains';
import util from 'util';
import * as requestHandler from './request_handler.js';
import {HTTP_VERBS, KINDS, MAX_LISTING_ITEMS, MODULE_NAME, USER_KEYS, SUBREDDIT_KEYS, VERSION} from './constants.js';
import * as errors from './errors.js';
import {
  addEmptyRepliesListing,
  addFullnamePrefix,
  addSnakeCaseShadowProps,
  defineInspectFunc,
  handleJsonErrors,
  isBrowser,
  requiredArg
} from './helpers.js';
import createConfig from './create_config.js';
import * as objects from './objects/index.js';

const api_type = 'json';

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
const snoowrap = class snoowrap {
  /**
   * @summary Constructs a new requester.
   * @desc You should use the snoowrap constructor if you are able to authorize a reddit account in advance (e.g. for a Node.js
   script that always uses the same account). If you aren't able to authorize in advance (e.g. acting through an arbitrary user's
   account while running snoowrap in a browser), then you should use {@link snoowrap.getAuthUrl} and
   {@link snoowrap.fromAuthCode} instead.
   *
   * To edit snoowrap specific settings, see {@link snoowrap#config}.
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
  constructor ({
    // The function signature for the constructor is a bit large due to the snake_case aliases. Essentially, it accepts an
    // object with properties {userAgent, clientId, clientSecret, refreshToken, accessToken, username, password}.
    // Additionally, if snake_case properties are provided and camelCase properties are not (e.g. `user_agent` is provided but
    // `userAgent` is not), then the `userAgent` identifier gets set to the provided `user_agent` property. This is needed for
    // backwards compatibility; snoowrap previously only accepted snake_case props, but now it also accepts camelCase props.
    user_agent, userAgent = user_agent,
    client_id, clientId = client_id,
    client_secret, clientSecret = client_secret,
    refresh_token, refreshToken = refresh_token,
    access_token, accessToken = access_token,
    username,
    password
  } = {}) {
    if (!userAgent && !isBrowser) {
      return requiredArg('userAgent');
    }
    if ((!accessToken || typeof accessToken !== 'string') &&
      (clientId === undefined || clientSecret === undefined || typeof refreshToken !== 'string') &&
      (clientId === undefined || clientSecret === undefined || username === undefined || password === undefined)
    ) {
      throw new errors.NoCredentialsError();
    }
    if (isBrowser) {
      this.userAgent = global.navigator.userAgent;
    }
    defaults(this, {userAgent, clientId, clientSecret, refreshToken, accessToken, username, password}, {
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
      _config: createConfig(),
      _nextRequestTimestamp: -Infinity
    });
    addSnakeCaseShadowProps(this);
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
   * @param {boolean} [options.permanent=true] If `true`, the app will have indefinite access to the user's account. If `false`,
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
   * window.location.href = authenticationUrl; // send the user to the authentication url
   */
  static getAuthUrl ({
    clientId = requiredArg('clientId'),
    scope = requiredArg('scope'),
    redirectUri = requiredArg('redirectUri'),
    permanent = true,
    state = '_',
    endpointDomain = 'reddit.com'
  }) {
    if (!(Array.isArray(scope) && scope.length && scope.every(scopeValue => scopeValue && typeof scopeValue === 'string'))) {
      throw new TypeError('Missing `scope` argument; a non-empty list of OAuth scopes must be provided');
    }
    return `
      https://www.${endpointDomain}/api/v1/authorize?
      client_id=${encodeURIComponent(clientId)}
      &response_type=code
      &state=${encodeURIComponent(state)}
      &redirect_uri=${encodeURIComponent(redirectUri)}
      &duration=${permanent ? 'permanent' : 'temporary'}
      &scope=${encodeURIComponent(scope.join(' '))}
    `.replace(/\s/g, '');
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
   * @returns {Promise<snoowrap>} A Promise that fulfills with a `snoowrap` instance
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
  static fromAuthCode ({
    code = requiredArg('code'),
    userAgent = isBrowser ? global.navigator.userAgent : requiredArg('userAgent'),
    clientId = requiredArg('clientId'),
    clientSecret,
    redirectUri = requiredArg('redirectUri'),
    endpointDomain = 'reddit.com'
  }) {
    return this.prototype.credentialedClientRequest.call({
      userAgent,
      clientId,
      clientSecret,
      // Use `this.prototype.rawRequest` function to allow for custom `rawRequest` method usage in subclasses.
      rawRequest: this.prototype.rawRequest
    }, {
      method: 'post',
      baseUrl: `https://www.${endpointDomain}/`,
      uri: 'api/v1/access_token',
      form: {grant_type: 'authorization_code', code, redirect_uri: redirectUri}
    }).then(response => {
      if (response.error) {
        throw new errors.RequestError(`API Error: ${response.error} - ${response.error_description}`);
      }
      // Use `new this` instead of `new snoowrap` to ensure that subclass instances can be returned
      const requester = new this({userAgent, clientId, clientSecret, ...response});
      requester.config({endpointDomain});
      return requester;
    });
  }

  /**
   * @summary Returns the grant types available for app-only authentication
   * @desc Per the Reddit API OAuth docs, there are two different grant types depending on whether the app is an installed client
   * or a confidential client such as a web app or string. This getter returns the possible values for the "grant_type" field
   * in application-only auth.
   * @returns {object} The enumeration of possible grant_type values
   */
  static get grantType () {
    return {
      CLIENT_CREDENTIALS: 'client_credentials',
      INSTALLED_CLIENT: 'https://oauth.reddit.com/grants/installed_client'
    };
  }
  /**
  * @summary Creates a snoowrap requester from a "user-less" Authorization token
  * @desc In some cases, 3rd party app clients may wish to make API requests without a user context. App clients can request
  * a "user-less" Authorization token via either the standard client_credentials grant, or the reddit specific
  * extension to this grant, https://oauth.reddit.com/grants/installed_client. Which grant type an app uses depends on
  * the app-type and its use case.
  * @param {object} options
  * @param {string} options.userAgent A unique description of what your app does. This argument is not necessary when snoowrap
  is running in a browser.
  * @param {string} options.clientId The client ID of your app (assigned by reddit). If your code is running clientside in a
  * browser, using an "Installed" app type is recommended.
  * @param {string} [options.clientSecret] The client secret of your app. Only required for "client_credentials" grant type.
  * @param {string} [options.deviceId] A unique, per-device ID generated by your client. Only required
  * for "Installed" grant type, needs to be between 20-30 characters long. From the reddit docs: "reddit *may* choose to use
  * this ID to generate aggregate data about user counts. Clients that wish to remain anonymous should use the value
  * DO_NOT_TRACK_THIS_DEVICE."
  * @param {string} [options.grantType=snoowrap.grantType.INSTALLED_CLIENT] The type of "user-less"
  * token to use {@link snoowrap.grantType}
  * @param {boolean} [options.permanent=true] If `true`, the app will have indefinite access. If `false`,
  access will expire after 1 hour.
  * @param {string} [options.endpointDomain='reddit.com'] The endpoint domain that the returned requester should be configured
  to use. If the user is authenticating on reddit.com (as opposed to some other site with a reddit-like API), you can omit this
  value.
  * @returns {Promise<snoowrap>} A Promise that fulfills with a `snoowrap` instance
  * @example
  *
  * snoowrap.fromApplicationOnlyAuth({
  *   userAgent: 'My app',
  *   clientId: 'foobarbazquuux',
  *   deviceId: 'unique id between 20-30 chars',
  *   grantType: snoowrap.grantType.INSTALLED_CLIENT
  * }).then(r => {
  *   // Now we have a requester that can access reddit through a "user-less" Auth token
  *   return r.getHot().then(posts => {
  *     // do something with posts from the front page
  *   });
  * })
  *
  * snoowrap.fromApplicationOnlyAuth({
  *   userAgent: 'My app',
  *   clientId: 'foobarbazquuux',
  *   clientSecret: 'your web app secret',
  *   grantType: snoowrap.grantType.CLIENT_CREDENTIALS
  * }).then(r => {
  *   // Now we have a requester that can access reddit through a "user-less" Auth token
  *   return r.getHot().then(posts => {
  *     // do something with posts from the front page
  *   });
  * })
  */
  static fromApplicationOnlyAuth ({
    userAgent = isBrowser ? global.navigator.userAgent : requiredArg('userAgent'),
    clientId = requiredArg('clientId'),
    clientSecret,
    deviceId,
    grantType = snoowrap.grantType.INSTALLED_CLIENT,
    permanent = true,
    endpointDomain = 'reddit.com'
  }) {
    return this.prototype.credentialedClientRequest.call({
      clientId,
      clientSecret,
      // Use `this.prototype.rawRequest` function to allow for custom `rawRequest` method usage in subclasses.
      rawRequest: this.prototype.rawRequest
    }, {
      method: 'post',
      baseUrl: `https://www.${endpointDomain}/`,
      uri: 'api/v1/access_token',
      form: {grant_type: grantType, device_id: deviceId, duration: permanent ? 'permanent' : 'temporary'}
    }).then(response => {
      if (response.error) {
        throw new errors.RequestError(`API Error: ${response.error} - ${response.error_description}`);
      }
      // Use `new this` instead of `new snoowrap` to ensure that subclass instances can be returned
      const requester = new this({userAgent, clientId, clientSecret, ...response});
      requester.config({endpointDomain});
      return requester;
    });
  }
  _newObject (objectType, content, _hasFetched = false) {
    return Array.isArray(content) ? content : new snoowrap.objects[objectType](content, this, _hasFetched);
  }

  /**
   * @summary Retrieves or modifies the configuration options for this snoowrap instance.
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
   since method chaining is always disabled in those environments. Note, changing this setting must be done before making
   any requests.
   * @returns {object} An updated Object containing all of the configuration values
   * @example
   *
   * r.config({requestDelay: 1000, warnings: false});
   * // sets the request delay to 1000 milliseconds, and suppresses warnings.
   */
  config (options = {}) {
    const invalidKey = Object.keys(options).find(key => !(key in this._config));
    if (invalidKey) {
      throw new TypeError(`Invalid config option '${invalidKey}'`);
    }
    return Object.assign(this._config, options);
  }

  _warn (...args) {
    if (this._config.warnings) {
      console.warn('[warning]', ...args); // eslint-disable-line no-console
    }
  }

  _debug (...args) {
    if (this._config.debug) {
      console.log('[debug]', ...args); // eslint-disable-line no-console
    }
  }

  get _promiseWrap () {
    return this._config.proxies ? promiseWrap : identity;
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
  getUser (name) {
    return this._newObject('RedditUser', {name: (name + '').replace(/^\/?u\//, '')});
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
  getComment (commentId) {
    return this._newObject('Comment', {name: addFullnamePrefix(commentId, 't1_')});
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
  getSubreddit (displayName) {
    return this._newObject('Subreddit', {display_name: displayName.replace(/^\/?r\//, '')});
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
  getSubmission (submissionId) {
    return this._newObject('Submission', {name: addFullnamePrefix(submissionId, 't3_')});
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
  getMessage (messageId) {
    return this._newObject('PrivateMessage', {name: addFullnamePrefix(messageId, 't4_')});
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
  getLivethread (threadId) {
    return this._newObject('LiveThread', {id: addFullnamePrefix(threadId, 'LiveUpdateEvent_').slice(16)});
  }

  /**
   * @summary Gets information on the requester's own user profile.
   * @returns {RedditUser} A RedditUser object corresponding to the requester's profile
   * @example
   *
   * r.getMe().then(console.log);
   * // => RedditUser { is_employee: false, has_mail: false, name: 'snoowrap_testing', ... }
   */
  getMe () {
    return this._get({uri: 'api/v1/me'}).then(result => {
      this._ownUserInfo = this._newObject('RedditUser', result, true);
      return this._ownUserInfo;
    });
  }

  _getMyName () {
    return Promise.resolve(this._ownUserInfo ? this._ownUserInfo.name : this.getMe().get('name'));
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
  getKarma () {
    return this._get({uri: 'api/v1/me/karma'});
  }

  /**
   * @summary Gets information on the user's current preferences.
   * @returns {Promise} A promise for an object containing the user's current preferences
   * @example
   *
   * r.getPreferences().then(console.log)
   * // => { default_theme_sr: null, threaded_messages: true, hide_downs: false, ... }
   */
  getPreferences () {
    return this._get({uri: 'api/v1/me/prefs'});
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
  updatePreferences (updatedPreferences) {
    return this._patch({uri: 'api/v1/me/prefs', body: updatedPreferences});
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
  getMyTrophies () {
    return this._get({uri: 'api/v1/me/trophies'});
  }

  /**
   * @summary Gets the list of the currently-authenticated user's friends.
   * @returns {Promise} A Promise that resolves with a list of friends
   * @example
   *
   * r.getFriends().then(console.log)
   * // => [ [ RedditUser { date: 1457927963, name: 'not_an_aardvark', id: 't2_k83md' } ], [] ]
   */
  getFriends () {
    return this._get({uri: 'prefs/friends'});
  }

  /**
   * @summary Gets the list of people that the currently-authenticated user has blocked.
   * @returns {Promise} A Promise that resolves with a list of blocked users
   * @example
   *
   * r.getBlockedUsers().then(console.log)
   * // => [ RedditUser { date: 1457928120, name: 'actually_an_aardvark', id: 't2_q3519' } ]
   */
  getBlockedUsers () {
    return this._get({uri: 'prefs/blocked'});
  }

  /**
   * @summary Determines whether the currently-authenticated user needs to fill out a captcha in order to submit content.
   * @returns {Promise} A Promise that resolves with a boolean value
   * @example
   *
   * r.checkCaptchaRequirement().then(console.log)
   * // => false
   */
  checkCaptchaRequirement () {
    return this._get({uri: 'api/needs_captcha'});
  }

  /**
   * @summary Gets the identifier (a hex string) for a new captcha image.
   * @returns {Promise} A Promise that resolves with a string
   * @example
   *
   * r.getNewCaptchaIdentifier().then(console.log)
   * // => 'o5M18uy4mk0IW4hs0fu2GNPdXb1Dxe9d'
   */
  getNewCaptchaIdentifier () {
    return this._post({uri: 'api/new_captcha', form: {api_type}}).then(res => res.json.data.iden);
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
  getCaptchaImage (identifier) {
    return this._get({uri: `captcha/${identifier}`});
  }

  /**
   * @summary Gets an array of categories that items can be saved in. (Requires reddit gold)
   * @returns {Promise} An array of categories
   * @example
   *
   * r.getSavedCategories().then(console.log)
   * // => [ { category: 'cute cat pictures' }, { category: 'interesting articles' } ]
   */
  getSavedCategories () {
    return this._get({uri: 'api/saved_categories'}).get('categories');
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
  markAsVisited (links) {
    return this._post({uri: 'api/store_visits', links: map(links, 'name').join(',')});
  }

  _submit ({
    captcha_response, captchaResponse = captcha_response,
    captcha_iden, captchaIden = captcha_iden,
    kind,
    resubmit = true,
    send_replies = true, sendReplies = send_replies,
    crosspost_fullname,
    text,
    title,
    url,
    subreddit_name, subredditName = subreddit_name
  }) {
    return this._post({
      uri: 'api/submit', form: {
        api_type, captcha: captchaResponse, iden: captchaIden, sendreplies: sendReplies, sr: subredditName, kind, resubmit,
        crosspost_fullname, text, title, url
      }
    }).tap(handleJsonErrors(this)).then(result => this.getSubmission(result.json.data.id));
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
  submitSelfpost (options) {
    return this._submit({...options, kind: 'self'});
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
  submitLink (options) {
    return this._submit({...options, kind: 'link'});
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
  submitCrosspost (options) {
    return this._submit({
      ...options,
      kind: 'crosspost',
      crosspost_fullname: options.originalPost instanceof snoowrap.objects.Submission
        ? options.originalPost.name
        : addFullnamePrefix(options.originalPost, 't3_')
    });
  }

  _getSortedFrontpage (sortType, subredditName, options = {}) {
    // Handle things properly if only a time parameter is provided but not the subreddit name
    let opts = options;
    let subName = subredditName;
    if (typeof subredditName === 'object' && isEmpty(omitBy(opts, option => option === undefined))) {
      /* In this case, "subredditName" ends up referring to the second argument, which is not actually a name since the user
      decided to omit that parameter. */
      opts = subredditName;
      subName = undefined;
    }
    const parsedOptions = omit({...opts, t: opts.time || opts.t}, 'time');
    return this._getListing({uri: (subName ? `r/${subName}/` : '') + sortType, qs: parsedOptions});
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
  getHot (subredditName, options) {
    return this._getSortedFrontpage('hot', subredditName, options);
  }

  /**
   * @summary Gets a Listing of best posts.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns {Promise<Listing>} A Listing containing the retrieved submissions
   * @example
   *
   * r.getBest().then(console.log)
   * // => Listing [
   * //  Submission { domain: 'imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'pics' }, ... },
   * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'funny' }, ... },
   * //  ...
   * // ]
   *
   * r.getBest({limit: 1}).then(console.log)
   * // => Listing [
   //   Submission { domain: 'self.redditdev', banned_by: null, subreddit: Subreddit { display_name: 'redditdev' }, ...}
   * // ]
   */
  getBest (options) {
    return this._getSortedFrontpage('best', undefined, options);
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
  getNew (subredditName, options) {
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
  getNewComments (subredditName, options) {
    return this._getSortedFrontpage('comments', subredditName, options);
  }

  /**
   *  @summary Get list of content by IDs. Returns a listing of the requested content.
   *  @param {Array<string|Submission|Comment>} ids An array of content IDs. Can include the id itself, or a Submission or Comment object.
can get a post and a comment   *  @returns {Promise<Listing<Submission|Comment>>} A listing of content requested, can be any class fetchable by API. e.g. Comment, Submission
   *  @example
   *
   * r.getContentByIds(['t3_9l9vof','t3_9la341']).then(console.log);
   * // => Listing [
   * //  Submission { approved_at_utc: null, ... }
   * //  Submission { approved_at_utc: null, ... }
   * // ]
   *
   * r.getContentByIds([r.getSubmission('9l9vof'), r.getSubmission('9la341')]).then(console.log);
   * // => Listing [
   * //  Submission { approved_at_utc: null, ... }
   * //  Submission { approved_at_utc: null, ... }
   * // ]
  */
  getContentByIds (ids) {
    if (!Array.isArray(ids)) {
      throw new TypeError('Invalid argument: Argument needs to be an array.');
    }

    const prefixedIds = ids.map(id => {
      if (id instanceof snoowrap.objects.Submission || id instanceof snoowrap.objects.Comment) {
        return id.name;
      } else if (typeof id === 'string') {
        if (!/t(1|3)_/g.test(ids)) {
          throw new TypeError('Invalid argument: Ids need to include Submission or Comment prefix, e.g. t1_, t3_.');
        }
        return id;
      }
      throw new TypeError('Id must be either a string, Submission, or Comment.');
    });

    return this._get({uri: '/api/info', method: 'get', qs: {id: prefixedIds.join(',')}});
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
  getRandomSubmission (subredditName) {
    return this._get({uri: `${subredditName ? `r/${subredditName}/` : ''}random`});
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
  getTop (subredditName, options) {
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
  getControversial (subredditName, options) {
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
  getRising (subredditName, options) {
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
  getUnreadMessages (options = {}) {
    return this._getListing({uri: 'message/unread', qs: options});
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
  getInbox ({filter, ...options} = {}) {
    return this._getListing({uri: `message/${filter || 'inbox'}`, qs: options});
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
  getModmail (options = {}) {
    return this._getListing({uri: 'message/moderator', qs: options});
  }

  /**
   * @summary Gets a list of ModmailConversations from the authenticated user's subreddits.
   * @param {object} [options] Options for the resulting Listing
   * @returns {Promise<Listing<ModmailConversation>>} A Listing containing Subreddits
   * @example
   *
   * r.getNewModmailConversations({limit: 2}).then(console.log)
   * // => Listing [
   * //  ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... },
   * //  ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... }
   * // ]
   */
  getNewModmailConversations (options = {}) {
    return this._getListing({
      uri: 'api/mod/conversations', qs: options, _name: 'ModmailConversation', _transform: response => {
        response.after = null;
        response.before = null;
        response.children = [];

        for (const conversation of response.conversationIds) {
          response.conversations[conversation].participant = this._newObject('ModmailConversationAuthor', {
            ...response.conversations[conversation].participant
          });
          const conversationObjects = objects.ModmailConversation._getConversationObjects(
            response.conversations[conversation],
            response
          );
          const data = {
            ...conversationObjects,
            ...response.conversations[conversation]
          };
          response.children.push(this._newObject('ModmailConversation', data));
        }
        return this._newObject('Listing', response);
      }
    });
  }

  /**
   * @summary Create a new modmail discussion between moderators
   * @param {object} options
   * @param {string} options.body Body of the discussion
   * @param {string} options.subject Title or subject
   * @param {string} options.srName Subreddit name without fullname
   * @returns {Promise<ModmailConversation>} the created ModmailConversation
   * @example
   *
   * r.createModeratorDiscussion({
   *   body: 'test body',
   *   subject: 'test subject',
   *   srName: 'AskReddit'
   * }).then(console.log)
   * // ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... }
   */
  createModmailDiscussion ({
    body,
    subject,
    srName
  }) {
    const parsedFromSr = srName.replace(/^\/?r\//, ''); // Convert '/r/subreddit_name' to 'subreddit_name'
    // _newObject ignores most of the response, no practical way to parse the returned content yet
    return this._post({
      uri: 'api/mod/conversations', form: {
        body, subject, srName: parsedFromSr
      }
    }).then(res => this._newObject('ModmailConversation', {id: res.conversation.id}));
  }

  /**
   * @summary Get a ModmailConversation by its id
   * @param {string} id of the ModmailConversation
   * @returns {Promise<ModmailConversation>} the requested ModmailConversation
   * @example
   *
   * r.getNewModmailConversation('75hxt').then(console.log)
   * // ModmailConversation { messages: [...], objIds: [...], ... }
   */
  getNewModmailConversation (id) {
    return this._newObject('ModmailConversation', {id});
  }

  /**
   * @summary Marks all conversations in array as read.
   * @param {ModmailConversation[]} conversations to mark as read
   * @example
   *
   * r.markNewModmailConversationsAsRead(['pics', 'sweden'])
   */
  markNewModmailConversationsAsRead (conversations) {
    const conversationIds = conversations.map(message => addFullnamePrefix(message, ''));
    return this._post({uri: 'api/mod/conversations/read', form: {conversationIds: conversationIds.join(',')}});
  }

  /**
   * @summary Marks all conversations in array as unread.
   * @param {ModmailConversation[]} conversations to mark as unread
   * @example
   *
   * r.markNewModmailConversationsAsUnread(['pics', 'sweden'])
   */
  markNewModmailConversationsAsUnread (conversations) {
    const conversationIds = conversations.map(message => addFullnamePrefix(message, ''));
    return this._post({uri: 'api/mod/conversations/unread', form: {conversationIds: conversationIds.join(',')}});
  }

  /**
   * @summary Gets all moderated subreddits that have new Modmail activated
   * @returns {Promise<Listing<Subreddit>>} a Listing of ModmailConversations marked as read
   * @example
   *
   * r.getNewModmailSubreddits().then(console.log)
   * // => Listing [
   * //  Subreddit { display_name: 'tipofmytongue', ... },
   * //  Subreddit { display_name: 'EarthPorn', ... },
   * // ]
   */
  getNewModmailSubreddits () {
    return this._get({uri: 'api/mod/conversations/subreddits'}).then(response => {
      return Object.values(response.subreddits).map(s => {
        return this._newObject('Subreddit', s);
      });
    });
  }

  /**
   * @summary Represents the unread count in a {@link ModmailConversation}. Each of these properties
   * correspond to the amount of unread conversations of that type.
   * @typedef {Object} UnreadCount
   * @property {number} highlighted
   * @property {number} notifications
   * @property {number} archived
   * @property {number} new
   * @property {number} inprogress
   * @property {number} mod
   */

  /**
   * @summary Retrieves an object of unread Modmail conversations for each state.
   * @returns {UnreadCount} unreadCount
   * @example
   *
   * r.getUnreadNewModmailConversationsCount().then(console.log)
   * // => {
   * //  highlighted: 1,
   * //  notifications: 0,
   * //  archived: 0,
   * //  new: 2,
   * //  inprogress: 5,
   * //  mod: 1,
   * // }
   */
  getUnreadNewModmailConversationsCount () {
    return this._get({uri: 'api/mod/conversations/unread/count'});
  }

  /**
   * @summary Mark Modmail conversations as read given the subreddit(s) and state.
   * @param {Subreddit[]|String[]} subreddits
   * @param {('new'|'inprogress'|'mod'|'notifications'|'archived'|'highlighted'|'all')} state selected state to mark as read
   * @returns {Promise<Listing<ModmailConversation>>} a Listing of ModmailConversations marked as read
   * @example
   *
   * r.bulkReadNewModmail(['AskReddit'], 'all').then(console.log)
   * // => Listing [
   * //  ModmailConversation { id: '75hxt' },
   * //  ModmailConversation { id: '75hxg' }
   * // ]
   *
   * r.bulkReadNewModmail([r.getSubreddit('AskReddit')], 'all').then(console.log)
   * // => Listing [
   * //  ModmailConversation { id: '75hxt' },
   * //  ModmailConversation { id: '75hxg' }
   * // ]
   */
  bulkReadNewModmail (subreddits, state) {
    const subredditNames = subreddits.map(s => typeof s === 'string' ? s.replace(/^\/?r\//, '') : s.display_name);
    return this._post({uri: 'api/mod/conversations/bulk/read', form: {
      entity: subredditNames.join(','),
      state
    }}).then(res => {
      return this._newObject('Listing', {
        after: null,
        before: null,
        children: res.conversation_ids.map(id => {
          return this._newObject('ModmailConversation', {id});
        })
      });
    });
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
  getSentMessages (options = {}) {
    return this._getListing({uri: 'message/sent', qs: options});
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
  markMessagesAsRead (messages) {
    const messageIds = messages.map(message => addFullnamePrefix(message, 't4_'));
    return this._post({uri: 'api/read_message', form: {id: messageIds.join(',')}});
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
  markMessagesAsUnread (messages) {
    const messageIds = messages.map(message => addFullnamePrefix(message, 't4_'));
    return this._post({uri: 'api/unread_message', form: {id: messageIds.join(',')}});
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
  readAllMessages () {
    return this._post({uri: 'api/read_all_messages'});
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
  composeMessage ({
    captcha,
    from_subreddit, fromSubreddit = from_subreddit,
    captcha_iden, captchaIden = captcha_iden,
    subject,
    text,
    to
  }) {
    let parsedTo = to;
    let parsedFromSr = fromSubreddit;
    if (to instanceof snoowrap.objects.RedditUser) {
      parsedTo = to.name;
    } else if (to instanceof snoowrap.objects.Subreddit) {
      parsedTo = `/r/${to.display_name}`;
    }
    if (fromSubreddit instanceof snoowrap.objects.Subreddit) {
      parsedFromSr = fromSubreddit.display_name;
    } else if (typeof fromSubreddit === 'string') {
      parsedFromSr = fromSubreddit.replace(/^\/?r\//, ''); // Convert '/r/subreddit_name' to 'subreddit_name'
    }
    return this._post({
      uri: 'api/compose', form: {
        api_type, captcha, iden: captchaIden, from_sr: parsedFromSr, subject, text, to: parsedTo
      }
    }).tap(handleJsonErrors(this)).return({});
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
  getOauthScopeList () {
    return this._get({uri: 'api/v1/scopes'});
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
  search (options) {
    if (options.subreddit instanceof snoowrap.objects.Subreddit) {
      options.subreddit = options.subreddit.display_name;
    }
    defaults(options, {restrictSr: true, syntax: 'plain'});
    const parsedQuery = omit(
      {...options, t: options.time, q: options.query, restrict_sr: options.restrictSr},
      ['time', 'query']
    );
    return this._getListing({uri: `${options.subreddit ? `r/${options.subreddit}/` : ''}search`, qs: parsedQuery});
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
  searchSubredditNames ({exact = false, include_nsfw = true, includeNsfw = include_nsfw, query}) {
    return this._post({uri: 'api/search_reddit_names', qs: {exact, include_over_18: includeNsfw, query}}).get('names');
  }

  _createOrEditSubreddit ({
    allow_images = true,
    allow_top = true,
    captcha,
    captcha_iden,
    collapse_deleted_comments = false,
    comment_score_hide_mins = 0,
    description,
    exclude_banned_modqueue = false,
    'header-title': header_title,
    hide_ads = false,
    lang = 'en',
    link_type = 'any',
    name,
    over_18 = false,
    public_description,
    public_traffic = false,
    show_media = false,
    show_media_preview = true,
    spam_comments = 'high',
    spam_links = 'high',
    spam_selfposts = 'high',
    spoilers_enabled = false,
    sr,
    submit_link_label = '',
    submit_text_label = '',
    submit_text = '',
    suggested_comment_sort = 'confidence',
    title,
    type = 'public',
    wiki_edit_age,
    wiki_edit_karma,
    wikimode = 'modonly'
  }) {
    return this._post({
      uri: 'api/site_admin', form: {
        allow_images, allow_top, api_type, captcha, collapse_deleted_comments, comment_score_hide_mins, description,
        exclude_banned_modqueue, 'header-title': header_title, hide_ads, iden: captcha_iden, lang, link_type, name,
        over_18, public_description, public_traffic, show_media, show_media_preview, spam_comments, spam_links,
        spam_selfposts, spoilers_enabled, sr, submit_link_label, submit_text, submit_text_label, suggested_comment_sort,
        title, type, wiki_edit_age, wiki_edit_karma, wikimode
      }
    }).then(handleJsonErrors(this.getSubreddit(name || sr)));
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
  createSubreddit (options) {
    return this._createOrEditSubreddit(options);
  }

  /**
   * @summary Searches subreddits by topic.
   * @param {object} options
   * @param {string} options.query The search query. (50 characters max)
   * @returns {Promise} An Array of subreddit objects corresponding to the search results
   * @deprecated Reddit no longer provides the corresponding API endpoint.
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
  searchSubredditTopics ({query}) {
    return this._get({uri: 'api/subreddits_by_topic', qs: {query}}).map(result => this.getSubreddit(result.name));
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
  getSubscriptions (options) {
    return this._getListing({uri: 'subreddits/mine/subscriber', qs: options});
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
  getContributorSubreddits (options) {
    return this._getListing({uri: 'subreddits/mine/contributor', qs: options});
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
  getModeratedSubreddits (options) {
    return this._getListing({uri: 'subreddits/mine/moderator', qs: options});
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
  searchSubreddits (options) {
    options.q = options.query;
    return this._getListing({uri: 'subreddits/search', qs: omit(options, 'query')});
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
  getPopularSubreddits (options) {
    return this._getListing({uri: 'subreddits/popular', qs: options});
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
  getNewSubreddits (options) {
    return this._getListing({uri: 'subreddits/new', qs: options});
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
  getGoldSubreddits (options) {
    return this._getListing({uri: 'subreddits/gold', qs: options});
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
  getDefaultSubreddits (options) {
    return this._getListing({uri: 'subreddits/default', qs: options});
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
  checkUsernameAvailability (name) {
    // The oauth endpoint listed in reddit's documentation doesn't actually work, so just send an unauthenticated request.
    return this.unauthenticatedRequest({uri: 'api/username_available.json', qs: {user: name}});
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
  createLivethread ({title, description, resources, nsfw = false}) {
    return this._post({
      uri: 'api/live/create',
      form: {api_type, description, nsfw, resources, title}
    }).tap(handleJsonErrors(this)).then(result => this.getLivethread(result.json.data.id));
  }

  /**
   * @summary Gets the "happening now" LiveThread, if it exists
   * @desc This is the LiveThread that is occasionally linked at the top of reddit.com, relating to current events.
   * @returns {Promise} A Promise that fulfills with the "happening now" LiveThread if it exists, or rejects with a 404 error
   otherwise.
   * @example r.getCurrentEventsLivethread().then(thread => thread.stream.on('update', console.log))
   */
  getStickiedLivethread () {
    return this._get({uri: 'api/live/happening_now'});
  }

  /**
   * @summary Gets the user's own multireddits.
   * @returns {Promise} A Promise for an Array containing the requester's MultiReddits.
   * @example
   *
   * r.getMyMultireddits().then(console.log)
   * => [ MultiReddit { ... }, MultiReddit { ... }, ... ]
   */
  getMyMultireddits () {
    return this._get({uri: 'api/multi/mine', qs: {expand_srs: true}});
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
  createMultireddit ({
    name, description, subreddits, visibility = 'private', icon_name = '', key_color = '#000000',
    weighting_scheme = 'classic'
  }) {
    return this._post({
      uri: 'api/multi', form: {
        model: JSON.stringify({
          display_name: name,
          description_md: description,
          icon_name,
          key_color,
          subreddits: subreddits.map(sub => ({name: typeof sub === 'string' ? sub : sub.display_name})),
          visibility,
          weighting_scheme
        })
      }
    });
  }

  _revokeToken (token) {
    return this.credentialedClientRequest({uri: 'api/v1/revoke_token', form: {token}, method: 'post'});
  }

  /**
   * @summary Invalidates the current access token.
   * @returns {Promise} A Promise that fulfills when this request is complete
   * @desc **Note**: This can only be used if the current requester was supplied with a `client_id` and `client_secret`. If the
   current requester was supplied with a refresh token, it will automatically create a new access token if any more requests
   are made after this one.
   * @example r.revokeAccessToken();
   */
  revokeAccessToken () {
    return this._revokeToken(this.accessToken).then(() => {
      this.accessToken = null;
      this.tokenExpiration = null;
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
  revokeRefreshToken () {
    return this._revokeToken(this.refreshToken).then(() => {
      this.refreshToken = null;
      this.accessToken = null; // Revoking a refresh token also revokes any associated access tokens.
      this.tokenExpiration = null;
    });
  }

  _selectFlair ({flair_template_id, link, name, text, subredditName}) {
    if (!flair_template_id) {
      throw new errors.InvalidMethodCallError('No flair template ID provided');
    }
    return Promise.resolve(subredditName).then(subName => {
      return this._post({uri: `r/${subName}/api/selectflair`, form: {api_type, flair_template_id, link, name, text}});
    });
  }

  _assignFlair ({css_class, cssClass = css_class, link, name, text, subreddit_name, subredditName = subreddit_name}) {
    return this._promiseWrap(Promise.resolve(subredditName).then(displayName => {
      return this._post({uri: `r/${displayName}/api/flair`, form: {api_type, name, text, link, css_class: cssClass}});
    }));
  }

  _populate (responseTree) {
    if (typeof responseTree === 'object' && responseTree !== null) {
      // Map {kind: 't2', data: {name: 'some_username', ... }} to a RedditUser (e.g.) with the same properties
      if (Object.keys(responseTree).length === 2 && responseTree.kind && responseTree.data) {
        return this._newObject(KINDS[responseTree.kind] || 'RedditContent', this._populate(responseTree.data), true);
      }
      const result = (Array.isArray(responseTree) ? map : mapValues)(responseTree, (value, key) => {
        // Maps {author: 'some_username'} to {author: RedditUser { name: 'some_username' } }
        if (value !== null && USER_KEYS.has(key)) {
          return this._newObject('RedditUser', {name: value});
        }
        if (value !== null && SUBREDDIT_KEYS.has(key)) {
          return this._newObject('Subreddit', {display_name: value});
        }
        return this._populate(value);
      });
      if (result.length === 2 && result[0] instanceof snoowrap.objects.Listing
        && result[0][0] instanceof snoowrap.objects.Submission && result[1] instanceof snoowrap.objects.Listing) {
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

  _getListing ({uri, qs = {}, ...options}) {
    /* When the response type is expected to be a Listing, add a `count` parameter with a very high number.
    This ensures that reddit returns a `before` property in the resulting Listing to enable pagination.
    (Aside from the additional parameter, this function is equivalent to snoowrap.prototype._get) */
    const mergedQuery = {count: 9999, ...qs};
    return qs.limit || !isEmpty(options)
      ? this._newObject('Listing', {_query: mergedQuery, _uri: uri, ...options}).fetchMore(qs.limit || MAX_LISTING_ITEMS)
      /* This second case is used as a fallback in case the endpoint unexpectedly ends up returning something other than a
      Listing (e.g. Submission#getRelated, which used to return a Listing but no longer does due to upstream reddit API
      changes), in which case using fetch_more() as above will throw an error.

      This fallback only works if there are no other meta-properties provided for the Listing, such as _transform. If there are
      other meta-properties,  the function will still end up throwing an error, but there's not really any good way to handle it
      (predicting upstream changes can only go so far). More importantly, in the limited cases where it's used, the fallback
      should have no effect on the returned results */
      : this._get({uri, qs: mergedQuery}).then(listing => {
        if (Array.isArray(listing)) {
          listing.filter(item => item.constructor._name === 'Comment').forEach(addEmptyRepliesListing);
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
  static noConflict () {
    if (isBrowser) {
      global[MODULE_NAME] = this._previousSnoowrap;
    }
    return this;
  }
};

function identity (value) {
  return value;
}

defineInspectFunc(snoowrap.prototype, function () {
  // Hide confidential information (tokens, client IDs, etc.), as well as private properties, from the console.log output.
  const keysForHiddenValues = ['clientSecret', 'refreshToken', 'accessToken', 'password'];
  const formatted = mapValues(omitBy(this, (value, key) => typeof key === 'string' && key.startsWith('_')), (value, key) => {
    return includes(keysForHiddenValues, key) ? value && '(redacted)' : value;
  });
  return `${MODULE_NAME} ${util.inspect(formatted)}`;
});

const classFuncDescriptors = {configurable: true, writable: true};

/* Add the request_handler functions (oauth_request, credentialed_client_request, etc.) to the snoowrap prototype. Use
Object.defineProperties to ensure that the properties are non-enumerable. */
Object.defineProperties(snoowrap.prototype, mapValues(requestHandler, func => ({value: func, ...classFuncDescriptors})));

HTTP_VERBS.forEach(method => {
  /* Define method shortcuts for each of the HTTP verbs. i.e. `snoowrap.prototype._post` is the same as `oauth_request` except
  that the HTTP method defaults to `post`, and the result is promise-wrapped. Use Object.defineProperty to ensure that the
  properties are non-enumerable. */
  Object.defineProperty(snoowrap.prototype, `_${method}`, {
    value (options) {
      return this._promiseWrap(this.oauthRequest({...options, method}));
    }, ...classFuncDescriptors
  });
});

/* `objects` will be an object containing getters for each content type, due to the way objects are exported from
objects/index.js. To unwrap these getters into direct properties, use lodash.mapValues with an identity function. */
snoowrap.objects = mapValues(objects, value => value);

forOwn(KINDS, value => {
  snoowrap.objects[value] = snoowrap.objects[value] || class extends objects.RedditContent {
  };
  Object.defineProperty(snoowrap.objects[value], '_name', {value, configurable: true});
});

// Alias all functions on snoowrap's prototype and snoowrap's object prototypes in snake_case.
values(snoowrap.objects).concat(snoowrap).map(func => func.prototype).forEach(funcProto => {
  Object.getOwnPropertyNames(funcProto)
    .filter(name => !name.startsWith('_') && name !== snakeCase(name) && typeof funcProto[name] === 'function')
    .forEach(name => Object.defineProperty(funcProto, snakeCase(name), {value: funcProto[name], ...classFuncDescriptors}));
});

snoowrap.errors = errors;
snoowrap.version = VERSION;

if (!module.parent && isBrowser) { // check if the code is being run in a browser through browserify, etc.
  snoowrap._previousSnoowrap = global[MODULE_NAME];
  global[MODULE_NAME] = snoowrap;
}

module.exports = snoowrap;
