'use strict';
const Promise = require('bluebird');
const _ = require('lodash');
const promise_wrap = require('promise-chains');
const request_handler = require('./request_handler');
const constants = require('./constants');
const errors = require('./errors');
const helpers = require('./helpers');
const api_type = 'json';

/** The class for a snoowrap requester.
* A requester is the base object that is used to fetch content from reddit. Each requester contains a single set of OAuth
tokens.

If constructed with a refresh token, a requester will be able to repeatedly generate access tokens as necessary, without any
further user intervention. After making at least one request, a requester will have the `access_token` property, which specifies
the access token currently in use. It will also have a few additional properties such as `scope` (an array of scope strings)
and `ratelimit_remaining` (the number of requests remaining for the current 10-minute interval, in compliance with reddit's
[API rules](https://github.com/reddit/reddit/wiki/API).) These properties primarily exist for internal use, but they are
exposed since they are useful externally as well.
*/
const snoowrap = class {
  /**
  * @summary Constructs a new requester. This will be necessary if you want to do anything.
  * @param {object} $0 An Object containing credentials.  This should have the properties (a) `user_agent`,
  `client_id`, `client_secret`, and `refresh_token`, **or** (b) `user_agent` and `access_token`.
  * @param {string} $0.user_agent A unique description of what your app does
  * @param {string} [$0.client_id] The client ID of your app (assigned by reddit)
  * @param {string} [$0.client_secret] The client secret of your app (assigned by reddit)
  * @param {string} [$0.refresh_token] A refresh token for your app. You will need to get this from reddit beforehand. A
  script to automatically generate refresh tokens for you can be found
  [here](https://github.com/not-an-aardvark/reddit-oauth-helper).
  * @param {string} [$0.access_token] An access token for your app. If this is provided, then the
  client ID/client secret/refresh token are not required. Note that all access tokens expire one hour after being
  generated; if you want to retain access for longer than that, provide the other credentials instead.
  */
  constructor ({user_agent, client_id, client_secret, refresh_token, access_token}) {
    if (!user_agent) {
      throw new errors.MissingUserAgentError();
    }
    if (!access_token && !(client_id && client_secret && refresh_token)) {
      throw new errors.NoCredentialsError();
    }
    _.assign(this, {user_agent, client_id, client_secret, refresh_token, access_token});
    this._config = require('./default_config');
    this._throttle = Promise.resolve();
  }
  static get name () {
    return constants.MODULE_NAME;
  }
  _new_object (object_type, content, _has_fetched) {
    if (Array.isArray(content)) {
      return content;
    }
    return new snoowrap.objects[object_type](content, this, _has_fetched);
  }
  /**
  * @summary Retrieves or modifies the configuration options for this requester.
  * @param {object} [options] A map of `{[config property name]: value}`. Note that any omitted config properties will simply
  retain whatever value they had previously (In other words, if you only want to change one property, you only need to put
  that one property in this parameter. To get the current configuration without modifying anything, simply omit this
  parameter.)
  * @param {string} [options.endpoint_domain='reddit.com'] The endpoint where requests should be sent
  * @param {string} [options.request_delay=0] A minimum delay, in milliseconds, to enforce between API calls. If multiple
  api calls are requested during this timespan, they will be queued and sent one at a time. Setting this to more than 1 will
  ensure that reddit's ratelimit is never reached, but it will make things run slower than necessary if only a few requests
  are being sent. If this is set to zero, snoowrap will not enforce any delay between individual requests. However, it will
  still refuse to continue if reddit's enforced ratelimit (600 requests per 10 minutes) is exceeded.
  * @param {string} [options.continue_after_ratelimit_error=false] Determines whether snoowrap should queue API calls if
  reddit's ratelimit is exceeded. If set to `true` when the ratelimit is exceeded, snoowrap will queue all further requests,
  and will attempt to send them again after the current ratelimit period expires (which happens every 10 minutes). If set
  to `false`, snoowrap will simply throw an error when reddit's ratelimit is exceeded.
  * @param {Number[]} [options.retry_error_codes=[502, 503, 504, 522]] If reddit responds to a request with one of these error
  codes, snoowrap will retry the request, up to a maximum of `options.max_retry_attempts` requests in total. (These errors
  usually indicate that there was an temporary issue on reddit's end, and retrying the request has a decent chance of
  success.) This behavior can be disabled by simply setting this property to an empty array.
  * @param {number} [options.max_retry_attempts=3] See `retry_error_codes`.
  * @param {boolean} [options.suppress_warnings=false] snoowrap may occasionally log relevant warnings, such as deprecation
  notices, to the console. These can be disabled by setting this to `true`.
  * @param {boolean} [options.debug=false] If set to true, snoowrap will print out potentially-useful information for debugging
  purposes as it runs.
  * @returns {object} An updated Object containing all of the configuration values
  * @example
  *
  * r.config({request_delay: 1000, suppress_warnings: true});
  * // sets the request delay to 1000 milliseconds, and suppresses warnings.
  */
  config (options) {
    return _.assign(this._config, options);
  }
  inspect () {
    // Hide confidential information (tokens, client IDs, etc.), as well as private properties, from the console.log output.
    const keys_for_hidden_values = ['client_secret', 'refresh_token', 'access_token'];
    const formatted = _.mapValues(_.omitBy(this, (value, key) => key.startsWith('_')), (value, key) => {
      return _.includes(keys_for_hidden_values, key) ? value && '(redacted)' : value;
    });
    return `${constants.MODULE_NAME} ${require('util').inspect(formatted)}`;
  }
  get log () {
    return {
      warn: (...args) => {
        if (!this._config.suppress_warnings) {
          console.warn('[warning]', ...args);
        }
      },
      debug: (...args) => {
        if (this._config.debug) {
          console.log('[debug]', ...args);
        }
      }
    };
  }
  /**
  * @summary Gets information on a reddit user with a given name.
  * @param {string} name - The user's username
  * @returns {RedditUser} An unfetched RedditUser object for the requested user
  * @example
  *
  * r.get_user('not_an_aardvark')
  * // => RedditUser { name: 'not_an_aardvark' }
  * r.get_user('not_an_aardvark').link_karma.then(console.log)
  * // => 6
  */
  get_user (name) {
    return this._new_object('RedditUser', {name});
  }
  /**
  * @summary Gets information on a comment with a given id.
  * @param {string} comment_id - The base36 id of the comment
  * @returns {Comment} An unfetched Comment object for the requested comment
  * @example
  *
  * r.get_comment('c0b6xx0')
  * // => Comment { name: 't1_c0b6xx0' }
  * r.get_comment('c0b6xx0').author.name.then(console.log)
  * // => 'Kharos'
  */
  get_comment (comment_id) {
    return this._new_object('Comment', {name: `t1_${comment_id}`});
  }
  /**
  * @summary Gets information on a given subreddit.
  * @param {string} display_name - The name of the subreddit (e.g. 'AskReddit')
  * @returns {Subreddit} An unfetched Subreddit object for the requested subreddit
  * @example
  *
  * r.get_subreddit('AskReddit')
  * // => Subreddit { display_name: 'AskReddit' }
  * r.get_subreddit('AskReddit').created_utc.then(console.log)
  * // => 1201233135
  */
  get_subreddit (display_name) {
    return this._new_object('Subreddit', {display_name});
  }
  /**
  * @summary Gets information on a given submission.
  * @param {string} submission_id - The base36 id of the submission
  * @returns {Submission} An unfetched Submission object for the requested submission
  * @example
  *
  * r.get_submission('2np694')
  * // => Submission { name: 't3_2np694' }
  * r.get_submission('2np694').title.then(console.log)
  * // => 'What tasty food would be distusting if eaten over rice?'
  */
  get_submission (submission_id) {
    return this._new_object('Submission', {name: `t3_${submission_id}`});
  }
  /**
  * @summary Gets a private message by ID.
  * @param {string} message_id The base36 ID of the message
  * @returns {PrivateMessage} An unfetched PrivateMessage object for the requested message
  * @example
  *
  * r.get_message('51shnw')
  * // => PrivateMessage { name: 't4_51shnw' }
  * r.get_message('51shnw').subject.then(console.log)
  * // => 'Example'
  * // See here for a screenshot of the PM in question https://i.gyazo.com/24f3b97e55b6ff8e3a74cb026a58b167.png
  */
  get_message (message_id) {
    return this._new_object('PrivateMessage', {name: `t4_${message_id}`});
  }
  /**
  * Gets a livethread by ID.
  * @param {string} thread_id The base36 ID of the livethread
  * @returns {LiveThread} An unfetched LiveThread object
  * @example
  *
  * r.get_livethread('whrdxo8dg9n0')
  * // => LiveThread { id: 'whrdxo8dg9n0' }
  * r.get_livethread('whrdxo8dg9n0').nsfw.then(console.log)
  * // => false
  */
  get_livethread (thread_id) {
    return this._new_object('LiveThread', {id: thread_id});
  }
  /**
  * @summary Gets information on the requester's own user profile.
  * @returns {RedditUser} A RedditUser object corresponding to the requester's profile
  * @example
  *
  * r.get_me().then(console.log);
  * // => RedditUser { is_employee: false, has_mail: false, name: 'snoowrap_testing', ... }
  */
  get_me () {
    return this._get('api/v1/me').then(result => {
      this.own_user_info = this._new_object('RedditUser', result, true);
      return this.own_user_info;
    });
  }
  _get_my_name () {
    return Promise.resolve(this.own_user_info ? this.own_user_info.name : this.get_me().get('name'));
  }
  /**
  * @summary Gets a distribution of the requester's own karma distribution by subreddit.
  * @returns {Promise} A Promise for an object with karma information
  * @example
  *
  * r.get_karma().then(console.log)
  * // => [
  * //  { sr: Subreddit { display_name: 'redditdev' }, comment_karma: 16, link_karma: 1 },
  * //  { sr: Subreddit { display_name: 'programming' }, comment_karma: 2, link_karma: 1 },
  * //  ...
  * // ]
  */
  get_karma () {
    return this._get({uri: 'api/v1/me/karma'});
  }
  /**
  * @summary Gets information on the user's current preferences.
  * @returns {Promise} A promise for an object containing the user's current preferences
  * @example
  *
  * r.get_preferences().then(console.log)
  * // => { default_theme_sr: null, threaded_messages: true, hide_downs: false, ... }
  */
  get_preferences () {
    return this._get({uri: 'api/v1/me/prefs'});
  }
  /**
  * @summary Updates the user's current preferences.
  * @param {object} updated_preferences An object of the form {[some preference name]: 'some value', ...}. Any preference
  * not included in this object will simply retain its current value.
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example
  *
  * r.update_preferences({threaded_messages: false, hide_downs: true})
  * // => { default_theme_sr: null, threaded_messages: false,hide_downs: true, ... }
  * // (preferences updated on reddit)
  */
  update_preferences (updated_preferences) {
    return this._patch({uri: 'api/v1/me/prefs', body: updated_preferences});
  }
  /**
  * @summary Gets the currently-authenticated user's trophies.
  * @returns {Promise} A TrophyList containing the user's trophies
  * @example
  *
  * r.get_my_trophies().then(console.log)
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
  get_my_trophies () {
    return this._get({uri: 'api/v1/me/trophies'});
  }
  /**
  * @summary Gets the list of the currently-authenticated user's friends.
  * @returns {Promise} A Promise that resolves with a list of friends
  * @example
  *
  * r.get_friends().then(console.log)
  * // => [ [ RedditUser { date: 1457927963, name: 'not_an_aardvark', id: 't2_k83md' } ], [] ]
  */
  get_friends () {
    return this._get({uri: 'prefs/friends'});
  }
  /**
  * @summary Gets the list of people that the currently-authenticated user has blocked.
  * @returns {Promise} A Promise that resolves with a list of blocked users
  * @example
  *
  * r.get_blocked_users().then(console.log)
  * // => [ RedditUser { date: 1457928120, name: 'actually_an_aardvark', id: 't2_q3519' } ]
  */
  get_blocked_users () {
    return this._get({uri: 'prefs/blocked'});
  }
  /**
  * @summary Determines whether the currently-authenticated user needs to fill out a captcha in order to submit content.
  * @returns {Promise} A Promise that resolves with a boolean value
  * @example
  *
  * r.check_captcha_requirement().then(console.log)
  * // => false
  */
  check_captcha_requirement () {
    return this._get({uri: 'api/needs_captcha'});
  }
  /**
  * @summary Gets the identifier (a hex string) for a new captcha image.
  * @returns {Promise} A Promise that resolves with a string
  * @example
  *
  * r.get_new_captcha_identifier().then(console.log)
  * // => 'o5M18uy4mk0IW4hs0fu2GNPdXb1Dxe9d'
  */
  get_new_captcha_identifier () {
    return this._post({uri: 'api/new_captcha', form: {api_type}}).then(res => res.json.data.iden);
  }
  /**
  * @summary Gets an image for a given captcha identifier.
  * @param {string} identifier The captcha identifier.
  * @returns {Promise} A string containing raw image data in PNG format
  * @example
  *
  * r.get_captcha_image('o5M18uy4mk0IW4hs0fu2GNPdXb1Dxe9d').then(console.log)
  // => (A long, incoherent string representing the image in PNG format)
  */
  get_captcha_image (identifier) {
    return this._get({uri: `captcha/${identifier}`});
  }
  /**
  * @summary Gets an array of categories that items can be saved in. (Requires reddit gold)
  * @returns {Promise} An array of categories
  * @example
  *
  * r.get_saved_categories().then(console.log)
  * // => [ { category: 'cute cat pictures' }, { category: 'interesting articles' } ]
  */
  get_saved_categories () {
    return this._get({uri: 'api/saved_categories'}).get('categories');
  }
  /**
  * @summary Marks a list of submissions as 'visited'.
  * @desc **Note**: This endpoint only works if the authenticated user is subscribed to reddit gold.
  * @param {Submission[]} links A list of Submission objects to mark
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example
  *
  * var submissions = [r.get_submission('4a9u54'), r.get_submission('4a95nb')]
  * r.mark_as_visited(submissions)
  * // (the links will now appear purple on reddit)
  */
  mark_as_visited (links) {
    return this._post({uri: 'api/store_visits', links: _.map(links, 'name').join(',')});
  }
  _submit ({captcha_response, captcha_iden, kind, resubmit = true, send_replies = true, text, title, url, subreddit_name}) {
    return this._post({uri: 'api/submit', form: {
      api_type, captcha: captcha_response, iden: captcha_iden, sendreplies: send_replies, sr: subreddit_name, kind, resubmit,
      text, title, url
    }}).tap(helpers._handle_json_errors(this)).then(result => this.get_submission(result.json.data.id));
  }
  /**
  * @summary Creates a new selfpost on the given subreddit.
  * @param {object} options An object containing details about the submission
  * @param {string} options.subreddit_name The name of the subreddit that the post should be submitted to
  * @param {string} options.title The title of the submission
  * @param {string} [options.text] The selftext of the submission
  * @param {boolean} [options.send_replies=true] Determines whether inbox replies should be enabled for this submission
  * @param {string} [options.captcha_iden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [options.captcha_response] The response to the captcha with the given identifier
  * @returns {Promise} The newly-created Submission object
  * @example
  *
  * r.submit_selfpost({
  *   subreddit_name: 'snoowrap_testing',
  *   title: 'This is a selfpost',
  *   body: 'This is the body of the selfpost'
  * }).then(console.log)
  * // => Submission { name: 't3_4abmsz' }
  * // (new selfpost created on reddit)
  */
  submit_selfpost (options) {
    return this._submit({...options, kind: 'self'});
  }
  /**
  * @summary Creates a new link submission on the given subreddit.
  * @param {object} options An object containing details about the submission
  * @param {string} options.subreddit_name The name of the subreddit that the post should be submitted to
  * @param {string} options.title The title of the submission
  * @param {string} options.url The url that the link submission should point to
  * @param {boolean} [options.send_replies=true] Determines whether inbox replies should be enabled for this submission
  * @param {boolean} [options.resubmit=true] If this is false and same link has already been submitted to this subreddit in
  the past, reddit will return an error. This could be used to avoid accidental reposts.
  * @param {string} [options.captcha_iden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [options.captcha_response] The response to the captcha with the given identifier
  * @returns {Promise} The newly-created Submission object
  * @example
  *
  * r.submit_link({
  *   subreddit_name: 'snoowrap_testing',
  *   title: 'I found a cool website!',
  *   url: 'https://google.com'
  * }).then(console.log)
  * // => Submission { name: 't3_4abnfe' }
  * // (new linkpost created on reddit)
  */
  submit_link (options) {
    return this._submit({...options, kind: 'link'});
  }
  _get_sorted_frontpage (sort_type, subreddit_name, options = {}) {
    // Handle things properly if only a time parameter is provided but not the subreddit name
    let opts = options;
    let sub_name = subreddit_name;
    if (typeof subreddit_name === 'object' && _(opts).omitBy(_.isUndefined).isEmpty()) {
      /* In this case, "subreddit_name" ends up referring to the second argument, which is not actually a name since the user
      decided to omit that parameter. */
      opts = subreddit_name;
      sub_name = undefined;
    }
    const parsed_options = _.omit({...opts, t: opts.time || opts.t}, 'time');
    return this._get_listing({uri: (sub_name ? `r/${sub_name}/` : '') + sort_type, qs: parsed_options});
  }
  /**
  * @summary Gets a Listing of hot posts.
  * @param {string} [subreddit_name] The subreddit to get posts from. If not provided, posts are fetched from
  the front page of reddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.get_hot().then(console.log)
  * // => Listing [
  * //  Submission { domain: 'imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'pics' }, ... },
  * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'funny' }, ... },
  * //  ...
  * // ]
  *
  * r.get_hot('gifs').then(console.log)
  * // => Listing [
  * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'gifs' }, ... },
  * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'gifs' }, ... },
  * //  ...
  * // ]
  *
  * r.get_hot('redditdev', {limit: 1}).then(console.log)
  * // => Listing [
    //   Submission { domain: 'self.redditdev', banned_by: null, subreddit: Subreddit { display_name: 'redditdev' }, ...}
  * // ]
  */
  get_hot (subreddit_name, options) {
    return this._get_sorted_frontpage('hot', subreddit_name, options);
  }
  /**
  * @summary Gets a Listing of new posts.
  * @param {string} [subreddit_name] The subreddit to get posts from. If not provided, posts are fetched from
  the front page of reddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.get_new().then(console.log)
  * // => Listing [
  * //  Submission { domain: 'self.Jokes', banned_by: null, subreddit: Subreddit { display_name: 'Jokes' }, ... },
  * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
  * //  ...
  * // ]
  *
  */
  get_new (subreddit_name, options) {
    return this._get_sorted_frontpage('new', subreddit_name, options);
  }
  /**
  * @summary Gets a Listing of new comments.
  * @param {string} [subreddit_name] The subreddit to get comments from. If not provided, posts are fetched from
  the front page of reddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved comments
  * @example
  *
  * r.get_new_comments().then(console.log)
  * // => Listing [
  * //  Comment { link_title: 'What amazing book should be made into a movie, but hasn\'t been yet?', ... }
  * //  Comment { link_title: 'How far back in time could you go and still understand English?', ... }
  * // ]
  */
  get_new_comments (subreddit_name, options) {
    return this._get_sorted_frontpage('comments', subreddit_name, options);
  }
  /**
  * @summary Gets a single random Submission.
  * @param {string} [subreddit_name] The subreddit to get the random submission. If not provided, the post is fetched from
  the front page of reddit.
  * @returns {Promise} The retrieved Submission object
  * @example
  *
  * r.get_random_submission('aww').then(console.log)
  * // => Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'aww' }, ... }
  */
  get_random_submission (subreddit_name) {
    return this._get_sorted_frontpage('random', subreddit_name);
  }
  /**
  * @summary Gets a Listing of top posts.
  * @param {string} [subreddit_name] The subreddit to get posts from. If not provided, posts are fetched from
  the front page of reddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  `hour, day, week, month, year, all`
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.get_top({time: 'all', limit: 2}).then(console.log)
  * // => Listing [
  * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
  * //  Submission { domain: 'imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'funny' }, ... }
  * // ]
  *
  * r.get_top('AskReddit').then(console.log)
  * // => Listing [
  * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
  * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
  * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
  * //  ...
  * // ]
  */
  get_top (subreddit_name, options) {
    return this._get_sorted_frontpage('top', subreddit_name, options);
  }
  /**
  * @summary Gets a Listing of controversial posts.
  * @param {string} [subreddit_name] The subreddit to get posts from. If not provided, posts are fetched from
  the front page of reddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  `hour, day, week, month, year, all`
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.get_controversial('technology').then(console.log)
  * // => Listing [
  * //  Submission { domain: 'thenextweb.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... },
  * //  Submission { domain: 'pcmag.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... }
  * // ]
  */
  get_controversial (subreddit_name, options) {
    return this._get_sorted_frontpage('controversial', subreddit_name, options);
  }
  /**
  * @summary Gets the authenticated user's unread messages.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing unread items in the user's inbox
  * @example
  *
  * r.get_unread_messages().then(console.log)
  * // => Listing [
  * //  PrivateMessage { body: 'hi!', was_comment: false, first_message: null, ... },
  * //  Comment { body: 'this is a reply', link_title: 'Yay, a selfpost!', was_comment: true, ... }
  * // ]
  */
  get_unread_messages (options = {}) {
    return this._get_listing({uri: 'message/unread', qs: options});
  }
  /**
  * @summary Gets the items in the authenticated user's inbox.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing items in the user's inbox
  * @example
  *
  * r.get_unread_messages().then(console.log)
  * // => Listing [
  * //  PrivateMessage { body: 'hi!', was_comment: false, first_message: null, ... },
  * //  Comment { body: 'this is a reply', link_title: 'Yay, a selfpost!', was_comment: true, ... }
  * // ]
  */
  get_inbox (options = {}) {
    return this._get_listing({uri: 'message/inbox', qs: options});
  }
  /**
  * @summary Gets the authenticated user's modmail.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing of the user's modmail
  * @example
  *
  * r.get_modmail({limit: 2}).then(console.log)
  * // => Listing [
  * //  PrivateMessage { body: '/u/not_an_aardvark has accepted an invitation to become moderator ... ', ... },
  * //  PrivateMessage { body: '/u/not_an_aardvark has been invited by /u/actually_an_aardvark to ...', ... }
  * // ]
  */
  get_modmail (options = {}) {
    return this._get_listing({uri: 'message/moderator', qs: options});
  }
  /**
  * @summary Gets the user's sent messages.
  * @param {object} [options={}] options for the resulting Listing
  * @returns {Promise} A Listing of the user's sent messages
  * @example
  *
  * r.get_sent_messages().then(console.log)
  * // => Listing [
  * //  PrivateMessage { body: 'you have been added as an approved submitter to ...', ... },
  * //  PrivateMessage { body: 'you have been banned from posting to ...' ... }
  * // ]
  */
  get_sent_messages (options = {}) {
    return this._get_listing({uri: 'message/sent', qs: options});
  }
  /**
  * @summary Marks all of the user's messages as read.
  * @returns {Promise} A Promise that resolves when the request is complete
  * @example
  *
  * r.read_all_messages().then(function () {
  *   r.get_unread_messages().then(console.log)
  * })
  * // => Listing []
  * // (messages marked as 'read' on reddit)
  */
  read_all_messages () {
    return this._post({uri: 'api/read_all_messages'});
  }
  /**
  * @summary Composes a new private message.
  * @param {object} $0
  * @param {RedditUser|Subreddit|string} $0.to The recipient of the message.
  * @param {string} $0.subject The message subject (100 characters max)
  * @param {string} $0.text The body of the message, in raw markdown text_edit
  * @param {Subreddit|string} [$0.from_subreddit] If provided, the message is sent as a modmail from the specified subreddit.
  * @param {string} [$0.captcha_iden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [$0.captcha_response] The response to the captcha with the given identifier
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example
  *
  * r.compose_message({
  *   to: 'actually_an_aardvark',
  *   subject: "Hi, how's it going?",
  *   text: 'Long time no see'
  * })
  * // (message created on reddit)
  */
  compose_message ({captcha, from_subreddit, captcha_iden, subject, text, to}) {
    let parsed_to = to;
    let parsed_from_sr = from_subreddit;
    if (to instanceof snoowrap.objects.RedditUser) {
      parsed_to = to.name;
    } else if (to instanceof snoowrap.objects.Subreddit) {
      parsed_to = `/r/${to.display_name}`;
    }
    if (from_subreddit instanceof snoowrap.objects.Subreddit) {
      parsed_from_sr = from_subreddit.display_name;
    } else if (typeof from_subreddit === 'string') {
      parsed_from_sr = from_subreddit.replace(/^\/?r\//, ''); // Convert '/r/subreddit_name' to 'subreddit_name'
    }
    return this._post({uri: 'api/compose', form: {
      api_type, captcha, iden: captcha_iden, from_sr: parsed_from_sr, subject, text, to: parsed_to
    }}).tap(helpers._handle_json_errors(this)).return({});
  }
  /**
  * @summary Gets a list of all oauth scopes supported by the reddit API.
  * @desc **Note**: This lists every single oauth scope. To get the scope of this requester, use the `scope` property instead.
  * @returns {Promise} An object containing oauth scopes.
  * @example
  *
  * r.get_oauth_scope_list().then(console.log)
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
  get_oauth_scope_list () {
    return this._get({uri: 'api/v1/scopes'});
  }
  /**
  * @summary Conducts a search of reddit submissions.
  * @param {object} options Search options. Can also contain options for the resulting Listing.
  * @param {string} options.query The search query
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. One of
  `hour, day, week, month, year, all`
  * @param {Subreddit|string} [options.subreddit] The subreddit to conduct the search on.
  * @param {boolean} [options.restrict_sr=true] Restricts search results to the given subreddit
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
    options.restrict_sr = options.restrict_sr || true;
    options.syntax = options.syntax || 'plain';
    const parsed_query = _.omit({...options, t: options.time, q: options.query}, ['time', 'query']);
    return this._get_listing({uri: `${options.subreddit ? `r/${options.subreddit}/` : ''}search`, qs: parsed_query});
  }
  /**
  * @summary Searches for subreddits given a query.
  * @param {object} $0
  * @param {string} $0.query A search query (50 characters max)
  * @param {boolean} [$0.exact=false] Determines whether the results shouldbe limited to exact matches.
  * @param {boolean} [$0.include_nsfw=true] Determines whether the results should include NSFW subreddits.
  * @returns {Promise} An Array containing subreddit names
  * @example
  *
  * r.search_subreddit_names({query: 'programming'}).then(console.log)
  * // => [
  * //  'programming',
  * //  'programmingcirclejerk',
  * //  'programminghorror',
  * //  ...
  * // ]
  */
  search_subreddit_names ({exact = false, include_nsfw = true, query}) {
    return this._post({uri: 'api/search_reddit_names', qs: {exact, include_over_18: include_nsfw, query}}).names;
  }
  _create_or_edit_subreddit ({
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
    spam_comments = 'high',
    spam_links = 'high',
    spam_selfposts = 'high',
    sr,
    submit_link_label = '',
    submit_text_label = '',
    submit_text = '',
    suggested_comment_sort = 'confidence',
    title,
    type = 'public',
    subreddit_type, // This is the same as `type`, but for some reason the name is changed when fetching current settings
    wiki_edit_age,
    wiki_edit_karma,
    wikimode = 'modonly'
  }) {
    return this._post({uri: 'api/site_admin', form: {
      allow_top, api_type, captcha, collapse_deleted_comments, comment_score_hide_mins, description, exclude_banned_modqueue,
      'header-title': header_title, hide_ads, iden: captcha_iden, lang, link_type, name, over_18, public_description,
      public_traffic, show_media, spam_comments, spam_links, spam_selfposts, sr, submit_link_label, submit_text,
      submit_text_label, suggested_comment_sort, title, type: subreddit_type || type, wiki_edit_age, wiki_edit_karma, wikimode
    }}).then(helpers._handle_json_errors(this.get_subreddit(name)));
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
  * @param {boolean} [options.exclude_banned_modqueue=false] Determines whether posts by site-wide banned users should be
  excluded from the modqueue.
  * @param {boolean} [options.public_traffic=false] Determines whether the /about/traffic page for this subreddit should be
  viewable by anyone.
  * @param {boolean} [options.collapse_deleted_comments=false] Determines whether deleted and removed comments should be
  collapsed by default
  * @param {string} [options.suggested_comment_sort=undefined] The suggested comment sort for the subreddit. This should be
  one of `confidence, top, new, controversial, old, random, qa`.If left blank, there will be no suggested sort,
  which means that users will see the sort method that is set in their own preferences (usually `confidence`.)
  * @returns {Promise} A Promise for the newly-created subreddit object.
  * @example
  *
  * r.create_subreddit({
  *   name: 'snoowrap_testing2',
  *   title: 'snoowrap testing: the sequel',
  *   public_description: 'thanks for reading the snoowrap docs!',
  *   description: 'This text will go on the sidebar',
  *   type: 'private'
  * }).then(console.log)
  * // => Subreddit { display_name: 'snoowrap_testing2' }
  * // (/r/snoowrap_testing2 created on reddit)
  */
  create_subreddit (options) {
    return this._create_or_edit_subreddit(options);
  }
  /**
  * @summary Searches subreddits by topic.
  * @param {object} $0
  * @param {string} $0.query The search query. (50 characters max)
  * @returns {Promise} An Array of subreddit objects corresponding to the search results
  * @example
  *
  * r.search_subreddit_topics({query: 'movies'}).then(console.log)
  * // => [
  * //  Subreddit { display_name: 'tipofmytongue' },
  * //  Subreddit { display_name: 'remove' },
  * //  Subreddit { display_name: 'horror' },
  * //  ...
  * // ]
  */
  search_subreddit_topics ({query}) {
    return this._get({uri: 'api/subreddits_by_topic', qs: {query}}).then(results =>
      _.map(results, 'name').map(this.get_subreddit.bind(this))
    );
  }
  /**
  * @summary Gets a list of subreddits that the currently-authenticated user is subscribed to.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @example
  *
  * r.get_subscriptions({limit: 2}).then(console.log)
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
  get_subscriptions (options) {
    return this._get_listing({uri: 'subreddits/mine/subscriber', qs: options});
  }
  /**
  * @summary Gets a list of subreddits in which the currently-authenticated user is an approved submitter.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @example
  *
  * r.get_contributor_subreddits().then(console.log)
  * // => Listing [
  * //  Subreddit {
  * //    display_name: 'snoowrap_testing',
  * //    title: 'snoowrap',
  * //    ...
  * //  }
  * // ]
  *
  */
  get_contributor_subreddits (options) {
    return this._get_listing({uri: 'subreddits/mine/contributor', qs: options});
  }
  /**
  * @summary Gets a list of subreddits in which the currently-authenticated user is a moderator.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @example
  *
  * r.get_moderated_subreddits().then(console.log)
  * // => Listing [
  * //  Subreddit {
  * //    display_name: 'snoowrap_testing',
  * //    title: 'snoowrap',
  * //    ...
  * //  }
  * // ]
  */
  get_moderated_subreddits (options) {
    return this._get_listing({uri: 'subreddits/mine/moderator', qs: options});
  }
  /**
  * @summary Searches subreddits by title and description.
  * @param {object} options Options for the search. May also contain Listing parameters.
  * @param {string} options.query The search query
  * @returns {Promise} A Listing containing Subreddits
  * @example
  *
  * r.search_subreddits({query: 'cookies'}).then(console.log)
  * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
  */
  search_subreddits (options) {
    options.q = options.query;
    return this._get_listing({uri: 'subreddits/search', qs: _.omit(options, 'query')});
  }
  /**
  * @summary Gets a list of subreddits, arranged by popularity.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @example
  *
  * r.get_popular_subreddits().then(console.log)
  * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
  */
  get_popular_subreddits (options) {
    return this._get_listing({uri: 'subreddits/popular', qs: options});
  }
  /**
  * @summary Gets a list of subreddits, arranged by age.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @example
  *
  * r.get_new_subreddits().then(console.log)
  * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
  */
  get_new_subreddits (options) {
    return this._get_listing({uri: 'subreddits/new', qs: options});
  }
  /**
  * @summary Gets a list of gold-exclusive subreddits.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @example
  *
  * r.get_gold_subreddits().then(console.log)
  * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
  */
  get_gold_subreddits (options) {
    return this._get_listing({uri: 'subreddits/gold', qs: options});
  }
  /**
  * @summary Gets a list of default subreddits.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @example
  *
  * r.get_default_subreddits().then(console.log)
  * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
  */
  get_default_subreddits (options) {
    return this._get_listing({uri: 'subreddits/default', qs: options});
  }
  /**
  * @summary Checks whether a given username is available for registration
  * @param {string} name The username in question
  * @returns {Promise} A Promise that fulfills with a Boolean (`true` or `false`)
  * @example
  *
  * r.check_username_availability('not_an_aardvark').then(console.log)
  * // => false
  * r.check_username_availability('eqwZAr9qunx7IHqzWVeF').then(console.log)
  * // => true
  */
  check_username_availability (name) {
    // The oauth endpoint listed in reddit's documentation doesn't actually work, so just send an unauthenticated request.
    return request_handler.unauthenticated_request(this, 'get', [{
      uri: 'api/username_available.json',
      qs: {user: name}
    }]);
  }
  /**
  * @summary Creates a new LiveThread.
  * @param {object} $0
  * @param {string} $0.title The title of the livethread (100 characters max)
  * @param {string} [$0.description] A descriptions of the thread. 120 characters max
  * @param {string} [$0.resources] Information and useful links related to the thread. 120 characters max
  * @param {boolean} [$0.nsfw=false] Determines whether the thread is Not Safe For Work
  * @returns {Promise} A Promise that fulfills with the new LiveThread when the request is complete
  * @example
  *
  * r.create_livethread({title: 'My livethread'}).then(console.log)
  * // => LiveThread { id: 'wpimncm1f01j' }
  */
  create_livethread ({title, description, resources, nsfw = false}) {
    return this._post({
      uri: 'api/live/create',
      form: {api_type, description, nsfw, resources, title}
    }).tap(helpers._handle_json_errors(this)).then(result => this.get_livethread(result.json.data.id));
  }
  /**
  * @summary Gets the user's own multireddits.
  * @returns {Promise} A Promise for an Array containing the requester's MultiReddits.
  * @example
  *
  * r.get_my_multireddits().then(console.log)
  * => [ MultiReddit { ... }, MultiReddit { ... }, ... ]
  */
  get_my_multireddits () {
    return this._get({uri: 'api/multi/mine', qs: {expand_srs: true}});
  }
  /**
  * @summary Creates a new multireddit.
  * @param {object} $0
  * @param {string} $0.name The name of the new multireddit. 50 characters max
  * @param {string} $0.description A description for the new multireddit, in markdown.
  * @param {Array} $0.subreddits An Array of Subreddit objects (or subreddit names) that this multireddit should compose of.
  * @param {string} [$0.visibility='private'] The multireddit's visibility setting. One of `private`, `public`, `hidden`.
  * @param {string} [$0.icon_name=''] One of `art and design`, `ask`, `books`, `business`, `cars`, `comics`, `cute animals`,
  `diy`, `entertainment`, `food and drink`, `funny`, `games`, `grooming`, `health`, `life advice`, `military`, `models pinup`,
  `music`, `news`, `philosophy`, `pictures and gifs`, `science`, `shopping`, `sports`, `style`, `tech`, `travel`,
  `unusual stories`, `video`, `None`
  * @param {string} [$0.key_color='#000000'] A six-digit RGB hex color, preceded by '#'
  * @param {string} [$0.weighting_scheme='classic'] One of `classic`, `fresh`
  * @returns {Promise} A Promise for the newly-created MultiReddit object
  * @example
  *
  * r.create_multireddit({
  *   name: 'myMulti',
  *   description: 'An example multireddit',
  *   subreddits: ['snoowrap', 'snoowrap_testing']
  * }).then(console.log)
  * => MultiReddit { display_name: 'myMulti', ... }
  */
  create_multireddit ({name, description, subreddits, visibility = 'private', icon_name = '', key_color = '#000000',
      weighting_scheme = 'classic'}) {
    return this._post({uri: 'api/multi', form: {model: JSON.stringify({
      display_name: name,
      description_md: description,
      icon_name,
      key_color,
      subreddits: subreddits.map(sub => ({name: _.isString(sub) ? sub : sub.display_name})),
      visibility,
      weighting_scheme
    })}});
  }
  _revoke_token (token) {
    return request_handler.base_client_request(this, 'post', [{uri: 'api/v1/revoke_token', form: {token}}]);
  }
  /**
  * @summary Invalidates the current access token.
  * @returns {Promise} A Promise that fulfills when this request is complete
  * @desc **Note**: This can only be used if the current requester was supplied with a `client_id` and `client_secret`. If the
  current requester was supplied with a refresh token, it will automatically create a new access token if any more requests
  are made after this one.
  * @example
  *
  * r.revoke_access_token();
  */
  revoke_access_token () {
    return this._revoke_token(this.access_token).then(() => {
      this.access_token = undefined;
    });
  }
  /**
  * @summary Invalidates the current refresh token.
  * @returns {Promise} A Promise that fulfills when this request is complete
  * @desc **Note**: This can only be used if the current requester was supplied with a `client_id` and `client_secret`. All
  access tokens generated by this refresh token will also be invalidated. This effectively de-authenticates the requester and
  prevents it from making any more valid requests. This should only be used in a few cases, e.g. if this token has
  been accidentally leaked to a third party.
  * @example
  *
  * r.revoke_refresh_token();
  */
  revoke_refresh_token () {
    return this._revoke_token(this.refresh_token).then(() => {
      this.refresh_token = undefined;
      this.access_token = undefined; // Revoking a refresh token also revokes any associated access tokens.
    });
  }
  async _select_flair ({flair_template_id, link, name, text, subreddit_name}) {
    if (!flair_template_id) {
      throw new errors.InvalidMethodCallError('Error: No flair template ID provided');
    }
    return await this._post({uri: `r/${await subreddit_name}/api/selectflair`, form: {
      api_type, flair_template_id, link, name, text}
    });
  }
  _assign_flair ({css_class, link, name, text, subreddit_name}) {
    return promise_wrap(Promise.resolve(subreddit_name).then(display_name => {
      return this._post({uri: `r/${display_name}/api/flair`, form: {api_type, name, text, link, css_class}});
    }));
  }
  _get_listing ({uri, qs}) {
    /* When the response type is expected to be a Listing, add a `count` parameter with a very high number.
    This ensures that reddit returns a `before` property in the resulting Listing to enable pagination.
    (Aside from the additional parameter, this function is equivalent to snoowrap.prototype._get) */
    const merged_query = {count: 9999, ...qs};
    if (qs && qs.limit) {
      return this._new_object('Listing', {_query: merged_query, _uri: uri}).fetch_more(qs.limit);
    }
    return this._get({uri, qs: merged_query});
  }
};

_.forEach(constants.HTTP_VERBS, type => {
  snoowrap.prototype[`_${type}`] = function (...args) {
    return promise_wrap(request_handler.oauth_request(this, type, args));
  };
});

snoowrap.objects = require('./objects');

_.forOwn(constants.KINDS, value => {
  snoowrap.objects[value] = snoowrap.objects[value] || class extends snoowrap.objects.RedditContent {};
});

_.forOwn(snoowrap.objects, (value, key) => {
  /* This is used to allow `objects.something = class {}` as opposed to `objects.something = class something {}`. The
  alternative sets the class name properly under normal circumstances, but it causes issues when the code gets minifified,
  since the class name changes. */
  Object.defineProperty(value, 'name', {get: _.constant(key)});
});

snoowrap.helpers = helpers;
snoowrap.constants = constants;
snoowrap.errors = errors;

if (process.browser) { // check if the code is being run in a browser through browserify
  /* global window */
  window.snoowrap = snoowrap;
}

module.exports = snoowrap;
