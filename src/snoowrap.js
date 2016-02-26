'use strict';
require('harmony-reflect'); // temp dependency until node implements Proxies correctly
const Promise = require('bluebird');
const _ = require('lodash');
const request = require('request-promise').defaults({json: true});
const moment = require('moment');
const promise_wrap = require('promise-chains');
const util = require('util');
const constants = require('./constants');
const errors = require('./errors');
const api_type = 'json';
const objects = {};
const helpers = require('./helpers');


/** The class for a snoowrap requester */
const snoowrap = class snoowrap {
  /**
  * Constructs a new requester. This will be necessary if you want to do anything.
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
  * @memberof snoowrap
  */
  constructor ({user_agent, client_id, client_secret, refresh_token, access_token}) {
    if (!user_agent) {
      throw new errors.MissingUserAgentError();
    }
    if (!access_token && !(client_id && client_secret && refresh_token)) {
      throw new errors.NoCredentialsError();
    }
    this.user_agent = user_agent;
    this.client_id = client_id;
    this.client_secret = client_secret;
    this.refresh_token = refresh_token;
    this.access_token = access_token;
    this._config = require('./default_config');
    this._throttle = Promise.resolve();
  }
  get _base_client_requester () {
    return request.defaults({
      auth: {user: this.client_id, pass: this.client_secret},
      headers: {'user-agent': this.user_agent},
      baseUrl: `https://www.${this._config.endpoint_domain}/api/v1/`
    });
  }
  async _update_access_token () {
    const token_info = await this._base_client_requester.post({uri: 'access_token', form: {
      grant_type: 'refresh_token',
      refresh_token: this.refresh_token
    }});
    this.access_token = token_info.access_token;
    this.token_expiration = moment().add(token_info.expires_in, 'seconds');
    this.scope = token_info.scope.split(' ');
  }
  get _oauth_requester () {
    return request.defaults({
      headers: {'user-agent': this.user_agent},
      baseUrl: `https://oauth.${this._config.endpoint_domain}`,
      qs: {raw_json: 1}, // This tells reddit to unescape html characters, e.g. it will send '<' instead of '&lt;'
      resolveWithFullResponse: true,
      transform: function (body, response) {
        this.ratelimit_remaining = response.headers['x-ratelimit-remaining'];
        this.ratelimit_reset_point = moment().add(response.headers['x-ratelimit-reset'], 'seconds');
        const populated = helpers._populate(body, this);
        if (populated instanceof objects.Listing) {
          populated.uri = response.request.uri.path;
        }
        return populated;
      }.bind(this)
    });
  }
  async _handle_request (requester, args, attempts = 0) {
    /* this._throttle is a timer that gets reset to this._config.request_delay whenever a request is sent.
    This ensures that requests are throttled correctly according to the user's config settings, and that no requests are
    lost. The await statement is wrapped in a loop to make sure that if the throttle promise resolves while multiple
    requests are pending, only one of the requests is sent, and the others await the throttle again. (The loop is
    non-blocking due to its await statement.) */
    while (!this._throttle.isFulfilled()) {
      await this._throttle;
    }
    this._throttle = Promise.delay(this._config.request_delay);
    if (this.ratelimit_remaining < 1 && this.ratelimit_reset_point.isAfter()) {
      // If the ratelimit has been exceeded, delay or abort the request depending on the user's config.
      const seconds_until_expiry = this.ratelimit_reset_point.diff(moment(), 'seconds');
      if (this._config.continue_after_ratelimit_error) {
        /* If the `continue_after_ratelimit_error` setting is enabled, queue the request, wait until the next ratelimit
        period, and then send it. */
        this.warn(errors.RateLimitWarning(seconds_until_expiry));
        await Promise.delay(this.ratelimit_reset_point.diff());
      } else {
        // Otherwise, throw an error.
        throw new errors.RateLimitError(seconds_until_expiry);
      }
    }
    try {
      // If the access token has expired, refresh it.
      if (this.refresh_token && (!this.access_token || this.token_expiration.isBefore())) {
        await this._update_access_token();
      }
      // Send the request and return the response.
      return await requester.defaults({auth: {bearer: this.access_token}})(...args);
    } catch (err) {
      if (attempts + 1 < this._config.max_retry_attempts && _.includes(this._config.retry_error_codes, err.statusCode)) {
        this.warn(`Warning: Received status code ${err.statusCode} from reddit. Retrying request...`);
        return this._handle_request(requester, args, attempts + 1);
      }
      throw err;
    }
  }
  _new_object (object_type, content, _has_fetched) {
    if (Array.isArray(content)) {
      return content;
    }
    return new objects[object_type](content, this, _has_fetched);
  }
  /**
  * Retrieves or modifies the configuration options for this requester.
  * @param {object} [options={}] A map of {[config property name]: value}. Note that any omitted config properties will simply
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
  * @param {Number[]} [options.retry_error_codes=[502, 503, 504]] If reddit responds to a request with one of these error
  codes, snoowrap will retry the request, up to a maximum of `options.max_retry_attempts` requests in total. (These errors
  usually indicate that there was an temporary issue on reddit's end, and retrying the request has a decent chance of
  success.) This behavior can be disabled by simply setting this property to an empty array.
  * @param {number} [options.max_retry_attempts=3] See `options.retry_error_codes`.
  * @param {boolean} [options.suppress_warnings=false] snoowrap may occasionally log relevant warnings, such as deprecation
  notices, to the console. These can be disabled by setting this to `true`.
  * @returns {object} An updated Object containing all of the configuration values
  * @memberof snoowrap
  * @instance
  */
  config (options) {
    return _.assign(this._config, options);
  }
  _revoke_token (token) {
    return this._base_client_requester.post({uri: 'revoke_token', form: {token}});
  }
  /**
  * Invalidates the current access token.
  * @returns {Promise} A Promise that fulfills when this request is complete<br><br>
  Note: This can only be used if the current requester was supplied with a `client_id` and `client_secret`. If the current
  requester was supplied with a refresh token, it will automatically create a new access token if any more requests are made
  after this one.
  * @memberof snoowrap
  * @instance
  */
  revoke_access_token () {
    return this._revoke_token(this.access_token).then(() => {
      this.access_token = undefined;
    });
  }
  /**
  * Invalidates the current refresh token.
  * @returns {Promise} A Promise that fulfills when this request is complete<br><br>
  Note: This can only be used if the current requester was supplied with a `client_id` and `client_secret`. All access
  tokens generated by this refresh token will also be invalidated. This effectively de-authenticates the requester and
  prevents it from making any more valid requests. This should only be used in a few cases, e.g. if this token has
  been accidentally leaked to a third party.
  * @memberof snoowrap
  * @instance
  */
  revoke_refresh_token () {
    return this._revoke_token(this.refresh_token).then(() => {
      this.refresh_token = undefined;
      this.access_token = undefined; // Revoking a refresh token also revokes any associated access tokens.
    });
  }
  inspect () {
    // Hide confidential information (tokens, client IDs, etc.), as well as private properties, from the console.log output.
    const keys_for_hidden_values = ['client_secret', 'refresh_token', 'access_token'];
    const formatted = _(this).omitBy((value, key) => key.startsWith('_')).mapValues((value, key) => {
      if (_.includes(keys_for_hidden_values, key)) {
        return value && '(redacted)';
      }
      if (value instanceof moment) {
        return value.format();
      }
      return value;
    }).value();
    return `<${constants.MODULE_NAME} authenticated client> ${util.inspect(formatted)}`;
  }
  warn (...args) {
    if (!this._config.suppress_warnings) {
      console.warn(...args);
    }
  }
  /**
  * Gets information on the requester's own user profile.
  * @returns {RedditUser} A RedditUser object corresponding to the requester's profile
  * @memberof snoowrap
  * @instance
  */
  get_me () {
    return promise_wrap(this._get('api/v1/me').then(result => {
      this.own_user_info = new objects.RedditUser(result, this, true);
      return this.own_user_info;
    }));
  }
  /**
  * Gets information on a reddit user with a given name.
  * @param {string} name - The user's username
  * @returns {RedditUser} An unfetched RedditUser object for the requested user
  * @memberof snoowrap
  * @instance
  */
  get_user (name) {
    return this._new_object('RedditUser', {name});
  }
  /**
  * Gets information on a comment with a given id.
  * @param {string} comment_id - The base36 id of the comment
  * @returns {Comment} An unfetched Comment object for the requested comment
  * @memberof snoowrap
  * @instance
  */
  get_comment (comment_id) {
    return this._new_object('Comment', {name: `t1_${comment_id}`});
  }
  /**
  * Gets information on a given subreddit.
  * @param {string} display_name - The name of the subreddit (e.g. 'AskReddit')
  * @returns {Subreddit} An unfetched Subreddit object for the requested subreddit
  * @memberof snoowrap
  * @instance
  */
  get_subreddit (display_name) {
    return this._new_object('Subreddit', {display_name});
  }
  /**
  * Gets information on a given submission.
  * @param {string} submission_id - The base36 id of the submission
  * @returns {Submission} An unfetched Submission object for the requested submission
  * @memberof snoowrap
  * @instance
  */
  get_submission (submission_id) {
    return this._new_object('Submission', {name: `t3_${submission_id}`});
  }
  /**
  * Gets a private message by ID
  * @param {string} message_id The base36 ID of the message
  * @returns {PrivateMessage} An unfetched PrivateMessage object for the requested message
  * @memberof snoowrap
  * @instance
  */
  get_message (message_id) {
    return this._new_object('PrivateMessage', {name: `t4_${message_id}`});
  }
  /**
  * Gets a distribution of the requester's own karma distribution by subreddit.
  * @returns {Promise} A Promise for an object with karma information
  * @memberof snoowrap
  * @instance
  */
  get_karma () {
    return this._get({uri: 'api/v1/me/karma'});
  }
  /**
  * Gets information on the user's current preferences.
  * @returns {Promise} A promise for an object containing the user's current preferences
  * @memberof snoowrap
  * @instance
  */
  get_preferences () {
    return this._get({uri: 'api/v1/me/prefs'});
  }
  /**
  * Updates the user's current preferences.
  * @param {object} updated_preferences An object of the form {[some preference name]: 'some value', ...}. Any preference
  * not included in this object will simply retain its current value.
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @memberof snoowrap
  * @instance
  */
  update_preferences (updated_preferences) {
    return this._patch({uri: 'api/v1/me/prefs', body: updated_preferences});
  }
  /**
  * Gets the currently-authenticated user's trophies.
  * @returns {Promise} A TrophyList containing the user's trophies
  * @memberof snoowrap
  * @instance
  */
  get_my_trophies () {
    return this._get({uri: 'api/v1/me/trophies'});
  }
  /**
  * Gets the list of the currently-authenticated user's friends.
  * @returns {Promise} A Promise that resolves with a list of friends
  * @memberof snoowrap
  * @instance
  */
  get_friends () {
    return this._get({uri: 'prefs/friends'});
  }
  /**
  * Gets the list of people that the currently-authenticated user has blocked.
  * @returns {Promise} A Promise that resolves with a list of blocked users
  * @memberof snoowrap
  * @instance
  */
  get_blocked_users () {
    return this._get({uri: 'prefs/blocked'});
  }
  /**
  * Determines whether the currently-authenticated user needs to fill out a captcha in order to submit a post/comment.
  * @returns {Promise} A Promise that resolves with a boolean value
  * @memberof snoowrap
  * @instance
  */
  check_captcha_requirement () {
    return this._get({uri: 'api/needs_captcha'});
  }
  /**
  * Gets the identifier (a hex string) for a new captcha image.
  * @returns {Promise} A Promise that resolves with a string
  * @memberof snoowrap
  * @instance
  */
  get_new_captcha_identifier () {
    return this._post({uri: 'api/new_captcha', form: {api_type}}).json.data.iden;
  }
  /**
  * Gets an image for a given captcha identifier.
  * @param {string} identifier The captcha identifier.
  * @returns {Promise} A string containing raw image data in PNG format
  * @memberof snoowrap
  * @instance
  */
  get_captcha_image (identifier) {
    return this._get({uri: `captcha/${identifier}`});
  }
  /**
  * Gets an array of categories that items can be saved it. (Requires reddit gold)
  * @returns {Promise} An array of categories
  * @memberof snoowrap
  * @instance
  */
  get_saved_categories () {
    return this._get({uri: 'api/saved_categories'}).categories;
  }
  /**
  * Marks a list of submissions as 'visited'.
  * @param {Submission[]} links A list of Submission objects to mark
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @memberof snoowrap
  * @instance
  */
  mark_as_visited (links) {
    return this._post({uri: 'api/store_visits', links: _.map(links, 'name').join(',')});
  }
  _submit ({captcha_response, captcha_iden, kind, resubmit = true, send_replies = true, text, title, url, subreddit_name}) {
    return promise_wrap(this._post({uri: 'api/submit', form: {
      api_type, captcha: captcha_response, iden: captcha_iden, sendreplies: send_replies, sr: subreddit_name, kind, resubmit,
      text, title, url
    }}).tap(helpers._handle_json_errors).then(result => this.get_submission(result.json.data.id)));
  }
  /**
  * Creates a new selfpost on the given subreddit.
  * @param {object} options An object containing details about the submission
  * @param {string} options.subreddit_name The name of the subreddit that the post should be submitted to
  * @param {string} options.title The title of the submission
  * @param {string} [options.text] The selftext of the submission
  * @param {boolean} [options.send_replies=true] Determines whether inbox replies should be enabled for this submission
  * @param {string} [options.captcha_iden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [options.captcha_response] The response to the captcha with the given identifier
  * @returns {Promise} The newly-created Submission object
  * @memberof snoowrap
  * @instance
  */
  submit_selfpost (options) {
    return this._submit(_.assign(options, {kind: 'self'}));
  }
  /**
  * Creates a new link submission on the given subreddit.
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
  * @memberof snoowrap
  * @instance
  */
  submit_link (options) {
    return this._submit(_.assign(options, {kind: 'link'}));
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
    const parsed_options = _(opts).assign({t: opts.time, time: undefined}).omit(['time']).value();
    return this._get({uri: (sub_name ? `r/${sub_name}/` : '') + sort_type, qs: parsed_options});
  }
  /**
  * Gets a Listing of hot posts.
  * @param {string} [subreddit_name] The subreddit to get posts from. If not provided, posts are fetched from
  the front page of reddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved submissions
  * @memberof snoowrap
  * @instance
  */
  get_hot (subreddit_name, options) {
    return this._get_sorted_frontpage('hot', subreddit_name, options);
  }
  /**
  * Gets a Listing of new posts.
  * @param {string} [subreddit_name] The subreddit to get posts from. If not provided, posts are fetched from
  the front page of reddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved submissions
  * @memberof snoowrap
  * @instance
  */
  get_new (subreddit_name, options) {
    return this._get_sorted_frontpage('new', subreddit_name, options);
  }
  /**
  * Gets a Listing of new comments.
  * @param {string} [subreddit_name] The subreddit to get comments from. If not provided, posts are fetched from
  the front page of reddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved comments
  * @memberof snoowrap
  * @instance
  */
  get_new_comments (subreddit_name, options) {
    return this._get_sorted_frontpage('comments', subreddit_name, options);
  }
  /**
  * Gets a single random Submission.
  * @param {string} [subreddit_name] The subreddit to get the random submission. If not provided, the post is fetched from
  the front page of reddit.
  * @returns {Promise} The retrieved Submission object
  * @memberof snoowrap
  * @instance
  */
  get_random_submission (subreddit_name) {
    return this._get_sorted_frontpage('random', subreddit_name);
  }
  /**
  * Gets a Listing of top posts.
  * @param {string} [subreddit_name] The subreddit to get posts from. If not provided, posts are fetched from
  the front page of reddit.
  * @param {object} [options={}]
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  `hour, day, week, month, year, all`
  * @returns {Promise} A Listing containing the retrieved submissions
  * @memberof snoowrap
  * @instance
  */
  get_top (subreddit_name, options = {}) {
    return this._get_sorted_frontpage('top', subreddit_name, {time: options.time});
  }
  /**
  * Gets a Listing of controversial posts.
  * @param {string} [subreddit_name] The subreddit to get posts from. If not provided, posts are fetched from
  the front page of reddit.
  * @param {object} [options={}]
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  `hour, day, week, month, year, all`
  * @returns {Promise} A Listing containing the retrieved submissions
  * @memberof snoowrap
  * @instance
  */
  get_controversial (subreddit_name, options) {
    return this._get_sorted_frontpage('controversial', subreddit_name, {time: options.time});
  }
  async _select_flair ({flair_template_id, link, name, text, subreddit_name}) {
    if (!flair_template_id) {
      throw new errors.InvalidMethodCallError('Error: No flair template ID provided');
    }
    return await this._post({uri: `r/${await subreddit_name}/api/selectflair`, form: {
      api_type, flair_template_id, link, name, text}
    });
  }
  async _assign_flair ({css_class, link, name, text, subreddit_name}) {
    return await this._post({uri: `r/${await subreddit_name}/api/flair`, form: {api_type, name, text, link, css_class}});
  }
  /**
  * Gets the authenticated user's unread messages.
  * @param {object} options
  * @returns {Promise} A Listing containing unread items in the user's inbox
  * @memberof snoowrap
  * @instance
  */
  get_unread_messages (options = {}) {
    return this._get({uri: 'message/unread', qs: options});
  }
  /**
  * Gets the items in the authenticated user's inbox.
  * @param {object} options
  * @returns {Promise} A Listing containing items in the user's inbox
  * @memberof snoowrap
  * @instance
  */
  get_inbox (options = {}) {
    return this._get({uri: 'message/inbox', qs: options});
  }
  /**
  * Gets the authenticated user's modmail.
  * @param {object} options
  * @returns {Promise} A Listing of the user's modmail
  * @memberof snoowrap
  * @instance
  */
  get_modmail (options = {}) {
    return this._get({uri: 'message/moderator', qs: options});
  }
  /**
  * Gets the user's sent messages.
  * @param {object} [options={}] options for the resulting Listing
  * @returns {Promise} A Listing of the user's sent messages
  * @memberof snoowrap
  * @instance
  */
  get_sent_messages (options = {}) {
    return this._get({uri: 'message/sent', qs: options});
  }
  /**
  * Marks all of the user's messages as read.
  * @returns {Promise} A Promise that resolves when the request is complete
  * @memberof snoowrap
  * @instance
  */
  read_all_messages () {
    return this._post({uri: 'api/read_all_messages'});
  }
  /**
  * Composes a new private message.
  * @param {object} $0
  * @param {RedditUser|Subreddit|string} $0.to The recipient of the message.
  * @param {string} $0.subject The message subject (100 characters max)
  * @param {string} $0.text The body of the message, in raw markdown text_edit
  * @param {Subreddit|string} [$0.from_subreddit] If provided, the message is sent as a modmail from the specified subreddit.
  * @param {string} [$0.captcha_iden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [$0.captcha_response] The response to the captcha with the given identifier
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @memberof snoowrap
  * @instance
  */
  compose_message ({captcha, from_subreddit, captcha_iden, subject, text, to}) {
    let parsed_to = to;
    let parsed_from_sr = from_subreddit;
    if (to instanceof objects.RedditUser) {
      parsed_to = to.name;
    } else if (to instanceof objects.Subreddit) {
      parsed_to = `/r/${to.display_name}`;
    }
    if (from_subreddit instanceof objects.Subreddit) {
      parsed_from_sr = from_subreddit.display_name;
    } else if (typeof from_subreddit === 'string') {
      parsed_from_sr = from_subreddit.replace(/^\/?r\//, ''); // Convert '/r/subreddit_name' to 'subreddit_name'
    }
    return this._post({uri: 'api/compose', form: {
      api_type, captcha, iden: captcha_iden, from_sr: parsed_from_sr, subject, text, to: parsed_to
    }});
  }
  /**
  * Gets a list of all oauth scopes supported by the reddit API.
  * @returns {Promise} An object containing oauth scopes.<br><br>
  * **Note**: To get the scope of this requester, use the `scope` property instead.
  * @memberof snoowrap
  * @instance
  */
  get_oauth_scope_list () {
    return promise_wrap(this._get({uri: 'api/v1/scopes'}));
  }
  /**
  * Conducts a search of reddit submissions.
  * @param {object} options Search options. Can also contain options for the resulting Listing.
  * @param {string} options.query The search query
  * @param {string} [options.time=] Describes the timespan that posts should be retrieved frome. One of
  `hour, day, week, month, year, all`
  * @param {Subreddit|string} [options.subreddit=] The subreddit to conduct the search on.
  * @param {boolean} [options.restrict_sr=true] Restricts search results to the given subreddit
  * @param {string} [options.sort=] Determines how the results should be sorted. One of `relevance, hot, top, new, comments`
  * @param {string} [options.syntax='plain'] Specifies a syntax for the search. One of `cloudsearch, lucene, plain`
  * @returns {Promise} A Listing containing the search results.
  * @memberof snoowrap
  * @instance
  */
  search (options) {
    if (options.subreddit instanceof objects.Subreddit) {
      options.subreddit = options.subreddit.display_name;
    }
    const parsed_query = _(options).assign({t: options.time, q: options.query}).omit(['time', 'query']).value();
    return this._get({uri: `${options.subreddit ? `r/${options.subreddit}/` : ''}search`, qs: parsed_query});
  }
  /**
  * Searches for subreddits given a query.
  * @param {object} $0
  * @param {string} $0.query A search query (50 characters max)
  * @param {boolean} [$0.exact=false] Determines whether the results shouldbe limited to exact matches.
  * @param {boolean} [$0.include_nsfw=true] Determines whether the results should include NSFW subreddits.
  * @returns {Promise} An Array containing subreddit names
  * @memberof snoowrap
  * @instance
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
    return promise_wrap(this._post({uri: 'api/site_admin', form: {
      allow_top, api_type, captcha, collapse_deleted_comments, comment_score_hide_mins, description, exclude_banned_modqueue,
      'header-title': header_title, hide_ads, iden: captcha_iden, lang, link_type, name, over_18, public_description,
      public_traffic, show_media, spam_comments, spam_links, spam_selfposts, sr, submit_link_label, submit_text,
      submit_text_label, suggested_comment_sort, title, type: subreddit_type || type, wiki_edit_age, wiki_edit_karma, wikimode
    }}).bind(this.get_subreddit(name)).then(helpers._handle_json_errors));
  }
  /**
  * Creates a new subreddit.
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
  * @memberof snoowrap
  * @instance
  */
  create_subreddit (options) {
    return this._create_or_edit_subreddit(options);
  }
  /**
  * Searches subreddits by topic.
  * @param {object} $0
  * @param {string} $0.query The search query. (50 characters max)
  * @returns {Promise} An Array of subreddit objects corresponding to the search results
  * @memberof snoowrap
  * @instance
  */
  search_subreddit_topics ({query}) {
    return promise_wrap(this._get({uri: 'api/subreddits_by_topic', qs: {query}}).then(results =>
      _.map(results, 'name').map(this.get_subreddit.bind(this))
    ));
  }
  /**
  * Gets a list of subreddits that the currently-authenticated user is subscribed to.
  * @param {object} [options=] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @memberof snoowrap
  * @instance
  */
  get_subscriptions (options) {
    return this._get({uri: 'subreddits/mine/subscriber', qs: options});
  }
  /**
  * Gets a list of subreddits in which the currently-authenticated user is an approved submitter.
  * @param {object} [options=] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @memberof snoowrap
  * @instance
  */
  get_contributor_subreddits (options) {
    return this._get({uri: 'subreddits/mine/contributor', qs: options});
  }
  /**
  * Gets a list of subreddits in which the currently-authenticated user is a moderator.
  * @param {object} [options=] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @memberof snoowrap
  * @instance
  */
  get_moderated_subreddits (options) {
    return this._get({uri: 'subreddits/mine/moderator', qs: options});
  }
  /**
  * Searches subreddits by title and description.
  * @param {object} options Options for the search. May also contain Listing parameters.
  * @param {string} options.query The search query
  * @returns {Promise} A Listing containing Subreddits
  * @memberof snoowrap
  * @instance
  */
  search_subreddits (options) {
    options.q = options.query;
    return this._get({uri: 'subreddits/search', qs: _.omit(options, ['query'])});
  }
  /**
  * Gets a list of subreddits, arranged by popularity.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @memberof snoowrap
  * @instance
  */
  get_popular_subreddits (options) {
    return this._get({uri: 'subreddits/popular', qs: options});
  }
  /**
  * Gets a list of subreddits, arranged by age.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @memberof snoowrap
  * @instance
  */
  get_new_subreddits (options) {
    return this._get({uri: 'subreddits/new', qs: options});
  }
  /**
  * Gets a list of gold-exclusive subreddits.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @memberof snoowrap
  * @instance
  */
  get_gold_subreddits (options) {
    return this._get({uri: 'subreddits/gold', qs: options});
  }
  /**
  * Gets a list of default subreddits.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Subreddits
  * @memberof snoowrap
  * @instance
  */
  get_default_subreddits (options) {
    return this._get({uri: 'subreddits/default', qs: options});
  }
  _friend (options) {
    return this._post({uri: `${options.sub ? `r/${options.sub}/` : ''}api/friend`, form: _.assign(options, {api_type})});
  }
  _unfriend (options) {
    return this._post({uri: `${options.sub ? `r/${options.sub}/` : ''}api/unfriend`, form: _.assign(options, {api_type})});
  }
  /**
  * Checks whether a given username is available for registration
  * @param {string} name The username in question
  * @returns {Promise} A Promise that fulfills with a Boolean (`true` or `false`)
  * @memberof snoowrap
  * @instance
  */
  check_username_availability (name) {
    // The oauth endpoint listed in reddit's documentation doesn't actually work, so just send an unauthenticated request.
    return request.get({
      url: 'https://www.reddit.com/api/username_available.json',
      qs: {user: name},
      headers: {'user-agent': this.user_agent}
    });
  }
};

_.forEach(constants.HTTP_VERBS, type => {
  snoowrap.prototype[`_${type}`] = function (...args) {
    return promise_wrap(this._handle_request(this._oauth_requester.defaults({method: type}), args));
  };
});

/** A base class for content from reddit. With the expection of Listings, all content types extend this class. */
objects.RedditContent = class RedditContent {
  /**
  * Constructs a new RedditContent instance.
  * @private
  * @param {object} options The properties that the RedditContent should be initialized with
  * @param {object} _ac The authenticated client (i.e. `snoowrap` instance) that is being used to fetch this object
  * @param {boolean} _has_fetched Determines whether this object was created fully-formed (as opposed to lacking information)
  */
  constructor (options, _ac, _has_fetched) {
    this._ac = _ac;
    this._fetch = undefined;
    this._has_fetched = !!_has_fetched;
    _.assign(this, options);
    return new Proxy(this, {get: (target, key) => {
      if (key in target || key === 'length' || key in Promise.prototype || target._has_fetched) {
        return target[key];
      }
      if (key === '_raw') {
        return target;
      }
      return this.fetch()[key];
    }});
  }
  /**
  * Fetches this content from reddit.
  * @returns {Promise} A version of this object with all of its fetched properties from reddit. This will **not** mutate the
  object. and set _has_fetched property to `true`. Once an object has been fetched once, fetching it again will have no
  effect. To refresh an object, use #refresh.
  */
  fetch () {
    if (!this._fetch) {
      this._fetch = promise_wrap(this._ac._get({uri: this._uri}).bind(this).then(this._transform_api_response));
    }
    return this._fetch;
  }
  /**
  * Refreshes this content.
  * @returns {Promise} A newly-fetched version of this content
  */
  refresh () {
    this._fetch = undefined;
    return this.fetch();
  }
  /**
  * Returns a stringifyable version of this object.
  * @returns {object} A version of this object with all the private properties stripped. Note that it is usually not
  necessary to call this method directly; simply running JSON.stringify(some_object) will strip the private properties anyway.
  */
  toJSON () {
    return _.omitBy(this, (value, key) => key.startsWith('_'));
  }
  inspect () {
    return `<${constants.MODULE_NAME}.objects.${this.constructor.name}> ${util.inspect(this.toJSON())}`;
  }
  _transform_api_response (response_object) {
    return response_object;
  }
};

constants.HTTP_VERBS.forEach(type => {
  objects.RedditContent.prototype[`_${type}`] = function (...args) {
    return this._ac[`_${type}`](...args);
  };
});

/**
* A set of mixin functions that apply to Submissions, Comments, and PrivateMessages
* @extends objects.RedditContent
*/
objects.CreatableContent = class CreatableClass extends objects.RedditContent {
  /**
  * Removes this Comment, Submission or PrivateMessage from public listings. Also see: #delete()
  * @param {boolean} [$0.spam=false] Determines whether this should be marked as spam
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  remove ({spam = false} = {}) {
    return promise_wrap(this._post({uri: 'api/remove', form: {spam, id: this.name}}).return(this));
  }
  /**
  * Removes this Comment, Submission, or PrivateMessage and marks it as spam.
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  mark_as_spam () {
    return promise_wrap(this.remove({spam: true, id: this.name}).return(this));
  }
  /**
  * Approves this Comment, Submission, or PrivateMessage, re-adding it to public listings if it had been removed
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  approve () {
    return promise_wrap(this._post({uri: 'api/approve', form: {id: this.name}}).return(this));
  }
  /**
  * Reports this content anonymously to subreddit moderators (for Comments and Submissions)
  or to the reddit admins (for PrivateMessages)
  * @param {string} [$0.reason=] The reason for the report
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  report ({reason} = {}) {
    return promise_wrap(this._post({uri: 'api/report', form: {
      api_type, reason: 'other', other_reason: reason, thing_id: this.name
    }}).return(this));
  }
  /**
  * Ignores reports on this Comment, Submission, or PrivateMessage
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  ignore_reports () {
    return promise_wrap(this._post({uri: 'api/ignore_reports', form: {id: this.name}}).return(this));
  }
  /**
  * Unignores reports on this Comment, Submission, or PrivateMessages
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  unignore_reports () {
    return promise_wrap(this._post({uri: 'api/unignore_reports', form: {id: this.name}}).return(this));
  }
  /**
  * Submits a new reply to this object. (This takes the form of a new Comment if this object is a Submission/Comment, or a
  new PrivateMessage if this object is a PrivateMessage.)
  * @param {string} text The content of the reply, in raw markdown text
  * @returns {Promise} A Promise that fulfills with the newly-created reply
  */
  reply (text) {
    return this._post({uri: 'api/comment', form: {api_type, text, thing_id: this.name}}).json.data.things[0];
  }
};

/**
* A set of mixin functions that apply to Submissions and Comments.
* @extends objects.CreatableContent
*/
objects.VoteableContent = class VoteableContent extends objects.CreatableContent {
  /**
  * Casts a vote on this Comment or Submission.
  * @private
  * @param {number} direction The direction of the vote. (1 for an upvote, -1 for a downvote, 0 to remove a vote)
  * @returns {Promise} A Promise that fulfills when the request is complete.
  */
  _vote (direction) {
    return this._post({uri: 'api/vote', form: {dir: direction, id: this.name}});
  }
  /**
  * Upvotes this Comment or Submission.
  * @returns {Promise} A Promise that fulfills when the request is complete.<br><br>
  * **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK, but
  bots deciding how to vote on content or amplifying a human's vote are not. See the [reddit rules](https://reddit.com/rules)
  for more details on what constitutes vote cheating. (This guideline is quoted from
  [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
  */
  upvote () {
    return this._vote(1);
  }
  /**
  * Downvotes this Comment or Submission.
  * @returns {Promise} A Promise that fulfills when the request is complete.<br><br>
  * **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK, but
  bots deciding how to vote on content or amplifying a human's vote are not. See the [reddit rules](https://reddit.com/rules)
  for more details on what constitutes vote cheating. (This guideline is quoted from
  [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
  */
  downvote () {
    return this._vote(-1);
  }
  /**
  * Removes any existing vote on this Comment or Submission.
  * @returns {Promise} A Promise that fulfills when the request is complete.<br><br>
  * **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK, but
  bots deciding how to vote on content or amplifying a human's vote are not. See the [reddit rules](https://reddit.com/rules)
  for more details on what constitutes vote cheating. (This guideline is quoted from
  [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
  */
  unvote () {
    return this._vote(0);
  }
  /**
  * Saves this Comment or Submission (i.e. adds it to the list at reddit.com/saved)
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  save () {
    return promise_wrap(this._post({uri: 'api/save', form: {id: this.name}}).then(() => {
      this.saved = true;
      return this;
    }));
  }
  /**
  * Unsaves this item
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  unsave () {
    return promise_wrap(this._post({uri: 'api/unsave', form: {id: this.name}}).then(() => {
      this.saved = false;
      return this;
    }));
  }
  /**
  * Distinguishes this Comment or Submission with a sigil.
  * @param {boolean|string} [$0.status=true] Determines how the item should be distinguished.
  `true` (default) signifies that the item should be moderator-distinguished, and
  `false` signifies that the item should not be distinguished. Passing a string (e.g.
  `admin`) will cause the item to get distinguished with that string, if possible.
  * @param {boolean} [$0.sticky=false] Determines whether this item should be stickied in addition to being
  distinguished. (This only applies to comments; to sticky a submission, use the {@link objects.Submission.sticky} method.)
  * @returns {Promise} A Promise that fulfills when the request is complete.
  */
  distinguish ({status = true, sticky = false} = {}) {
    return promise_wrap(this._post({uri: 'api/distinguish', form: {
      api_type,
      how: status === true ? 'yes' : status === false ? 'no' : status,
      sticky,
      id: this.name
    }}).then(response => {
      this._fetch = response.json.data.things[0];
      return this;
    }));
  }
  /**
  * Undistinguishes this Comment or Submission. Alias for distinguish({status: false})
  * @function undistinguish
  * @returns {Promise} A Promise that fulfills when the request is complete.
  */
  undistinguish () {
    return this.distinguish({status: false, sticky: false});
  }
  /**
  * Edits this Comment or Submission.
  * @param {string} updated_text The updated markdown text to use
  * @returns {Promise} A Promise that fulfills when this request is complete.
  */
  edit (updated_text) {
    return promise_wrap(this._post({
      uri: 'api/editusertext',
      form: {api_type, text: updated_text, thing_id: this.name}
    }).then(response => {
      this._fetch = response.json.data.things[0];
      return this;
    }));
  }
  /**
  * Gives reddit gold to the author of this Comment or Submission.
  * @returns {Promise} A Promise that fullfills with this Comment/Submission when this request is complete
  */
  gild () {
    return promise_wrap(this._post({uri: `api/v1/gold/gild/${this.name}`}).return(this));
  }
  /**
  * Deletes this Comment or Submission
  * @returns {Promise} A Promise that fulfills with this Comment/Submission when this request is complete
  */
  delete () {
    return promise_wrap(this._post({uri: 'api/del', form: {id: this.name}}).return(this));
  }
  _set_inbox_replies_enabled (state) {
    return this._post({uri: 'api/sendreplies', form: {state, id: this.name}});
  }
  /**
  * Enables inbox replies on this Comment or Submission
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  enable_inbox_replies () {
    return promise_wrap(this._set_inbox_replies_enabled(true).return(this));
  }
  /**
  * Disables inbox replies on this Comment or Submission
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  disable_inbox_replies () {
    return promise_wrap(this._set_inbox_replies_enabled(false).return(this));
  }
};

/**
* A class representing a reddit comment
* @extends CreatableContent
*/
objects.Comment = class Comment extends objects.VoteableContent {
  _transform_api_response (response_obj) {
    const replies_uri = `comments/${response_obj[0].link_id.slice(3)}`;
    const replies_query = {comment: this.name.slice(3)};
    const _transform = item => item.comments[0].replies;
    response_obj[0].replies = this._ac._new_object('Listing', {uri: replies_uri, query: replies_query, _transform});
    return response_obj[0];
  }
  get _uri () {
    return `api/info?id=${this.name}`;
  }
};

/**
* A class representing a reddit user
* @extends CreatableContent
*/
objects.RedditUser = class RedditUser extends objects.RedditContent {
  get _uri () {
    if (typeof this.name !== 'string' || !constants.USERNAME_REGEX.test(this.name)) {
      throw new errors.InvalidUserError(this.name);
    }
    return `user/${this.name}/about`;
  }
  /**
  * Gives reddit gold to a user
  * @param {number} months The number of months of gold to give. This must be a number between 1 and 36.
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  give_gold (months) {
    /* Ideally this would allow for more than 36 months by sending multiple requests, but I don't have the resources to test
    that code, and it's probably better that such a big investment be deliberate anyway. */
    if (typeof months !== 'number' || months < 1 || months > 36) {
      throw new errors.InvalidMethodCallError('Invalid argument to RedditUser.give_gold; `months` must be between 1 and 36.');
    }
    return this._post({uri: `api/v1/gold/give/${this.name}`, form: {months}});
  }
  /** Assigns flair to this user on a given subreddit (as a moderator).
  * @param {object} options
  * @param {string} options.subreddit_name The subreddit that flair should be assigned on
  * @param {string} [options.text=""] The text that the user's flair should have
  * @param {string} [options.css_class=""] The CSS class that the user's flair should have
  * @returns {Promise} A Promise that fulfills with the current user after the request is complete
  */
  assign_flair (options) {
    return promise_wrap(this._ac._assign_flair(_.assign(options, {name: this.name})).return(this));
  }
  /**
  * Adds this user as a friend, or modifies their friend note.
  * @param {object} $0
  * @param {string} [$0.note] An optional note to add on the user (300 characters max)
  */
  friend ({note} = {}) {
    return this._put({uri: `api/v1/me/friends/${this.name}`, json: {user: this.name, note}});
  }
  /**
  * Removes this user from the requester's friend list.
  * @returns {Promise} A Promise that fulfills with this user when the request is complete
  */
  unfriend () {
    return this._delete({uri: `api/v1/me/friends/${this.name}`});
  }
  /**
  * Gets information on this user related to their presence on the friend list.
  * @returns {Promise} A Promise that fulfills with an object containing friend information
  */
  get_friend_information () {
    return this._get({uri: `api/v1/me/friends/${this.name}`});
  }
  /**
  * Gets a list of this user's trophies.
  * @returns {Promise} A TrophyList containing this user's trophies
  */
  get_trophies () {
    return this._get({uri: `api/v1/user/${this.name}/trophies`});
  }
  /**
  * Gets a Listing of the content this user has submitted.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  */
  get_overview (options) {
    return this._get({uri: `user/${this.name}/overview`, qs: options});
  }
  /**
  * Gets a Listing of this user's submissions.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions
  */
  get_submissions (options) {
    return this._get({uri: `user/${this.name}/submitted`, qs: options});
  }
  /**
  * Gets a Listing of this user's comments.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Comments
  */
  get_comments (options) {
    return this._get({uri: `user/${this.name}/comments`, qs: options});
  }
  /**
  * Gets a Listing of the content that this user has upvoted.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments. Note that this can only be used to view one's own
  upvoted content, unless the user in question has chosen to make this information public in their preferences.
  */
  get_upvoted_content (options) {
    return this._get({uri: `user/${this.name}/upvoted`, qs: options});
  }
  /**
  * Gets a Listing of the content that this user has downvoted.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments. Note that this can only be used to view one's own
  downvoted content, unless the user in question has chosen to make this information public in their preferences.
  */
  get_downvoted_content (options) {
    return this._get({uri: `user/${this.name}/downvoted`, qs: options});
  }
  /**
  * Gets a Listing of the submissions that this user has hidden.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions. Note that this can only be used to view one's own set of hidden
  posts, as reddit will return a 403 error when attempting to view other users' hidden posts.
  */
  get_hidden_content (options) {
    return this._get({uri: `user/${this.name}/hidden`, qs: options});
  }
  /**
  * Gets a Listing of the content that this user has saved.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments. Note that this can only be used to view one's own set
  of saved content, as reddit will return a 403 error when attempting to view other users' saved content.
  */
  get_saved_content (options) {
    return this._get({uri: `user/${this.name}/hidden`, qs: options});
  }
  /**
  * Gets a Listing of this user's content which has been gilded.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  */
  get_gilded_content (options) {
    return this._get({uri: `user/${this.name}/gilded`, qs: options});
  }
};

/**
* A class representing a reddit submission
* @extends CreatableContent
*/
objects.Submission = class Submission extends objects.VoteableContent {
  get _uri () {
    return `comments/${this.name.slice(3)}`;
  }
  // TODO: Get rid of some boilerplate code here
  /**
  * Hides this Submission, preventing it from appearing on most Listings.
  * @returns {Promise} The updated version of this Submission
  */
  hide () {
    return promise_wrap(this._post({uri: 'api/hide', form: {id: this.name}}).then(() => {
      this.hidden = true;
      return this;
    }));
  }
  /**
  * Unhides this Submission, allowing it to reappear on most Listings.
  * @returns {Promise} The updated version of this Submission
  */
  unhide () {
    return promise_wrap(this._post({uri: 'api/unhide', form: {id: this.name}}).then(() => {
      this.hidden = false;
      return this;
    }));
  }
  /**
  * Locks this Submission, preventing new comments from being posted on it.
  * @returns {Promise} The updated version of this Submission
  */
  lock () {
    return promise_wrap(this._post({uri: 'api/lock', form: {id: this.name}}).then(() => {
      this.locked = true;
      return this;
    }));
  }
  /**
  * Unlocks this Submission, allowing comments to be posted on it again.
  * @returns {Promise} The updated version of this Submission
  */
  unlock () {
    return promise_wrap(this._post({uri: 'api/unlock', form: {id: this.name}}).then(() => {
      this.locked = false;
    }).return(this));
  }
  /**
  * Marks this Submission as NSFW (Not Safe For Work).
  * @returns {Promise} The updated version of this Submission
  */
  mark_nsfw () {
    return promise_wrap(this._post({uri: 'api/marknsfw', form: {id: this.name}}).then(() => {
      this.over_18 = true;
    }).return(this));
  }
  /**
  * Unmarks this Submission as NSFW (Not Safe For Work).
  * @returns {Promise} The updated version of this Submission
  */
  unmark_nsfw () {
    return promise_wrap(this._post({uri: 'api/unmarknsfw', form: {id: this.name}}).then(() => {
      this.over_18 = false;
    }).return(this));
  }
  /**
  * Sets the contest mode status of this submission.
  * @private
  * @param {boolean} state The desired contest mode status
  * @returns {Promise} The updated version of this Submission
  */
  _set_contest_mode_enabled (state) {
    return promise_wrap(this._post({
      uri: 'api/set_contest_mode',
      form: {api_type, state, id: this.name}
    }).return(this));
  }
  /**
  * Enables contest mode for this Submission.
  * @returns {Promise} The updated version of this Submission
  */
  enable_contest_mode () {
    return this._set_contest_mode_enabled(true);
  }
  /**
  * Disables contest mode for this Submission.
  * @returns {Promise} The updated version of this Submission
  */
  disable_contest_mode () {
    return this._set_contest_mode_enabled(false);
  }
  _set_stickied ({state, num}) {
    return promise_wrap(this._post({
      uri: 'api/set_subreddit_sticky',
      form: {api_type, state, num, id: this.name}
    }).then(() => {
      this.stickied = state;
    }).return(this));
  }
  /**
  * Stickies this Submission.
  * @param {object} [options]
  * @param {number} [options.num=1] The sticky slot to put this submission in; this should be either 1 or 2.
  * @returns {Promise} The updated version of this Submission
  */
  sticky (options = {num: 1}) {
    return this._set_stickied({state: true, num: options.num});
  }
  /**
  * Unstickies this Submission.
  * @returns {Promise} The updated version of this Submission
  */
  unsticky () {
    return this._set_stickied({state: false});
  }
  /**
  * Sets the suggested comment sort method on this Submission
  * @param {string} sort The suggested sort method. This should be one of
  `confidence, top, new, controversial, old, random, qa, blank`
  * @returns {Promise} The updated version of this Submission
  */
  set_suggested_sort (sort) {
    return promise_wrap(this._post({uri: 'api/set_suggested_sort', form: {api_type, id: this.name, sort}}).then(() => {
      this.suggested_sort = sort;
    }).return(this));
  }
  /**
  * Marks this submission as 'visited'.
  * @returns {Promise} The updated version of this Submission
  */
  mark_as_read () { // Requires reddit gold
    return promise_wrap(this._post({uri: 'api/store_visits', form: {links: this.name}}).return(this));
  }
  /**
  * Gets a Listing of other submissions on reddit that had the same link as this one.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing of other Submission objects
  */
  get_duplicates (options = {}) {
    return this._get({uri: `duplicates/${this.name}`, qs: options});
  }
  /**
  * Gets a Listing of Submissions that are related to this one.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing of other Submission objects
  */
  get_related (options = {}) {
    return this._get({uri: `related/${this.name}`, qs: options});
  }
  /**
  * Gets a list of flair template options for this post.
  * @returns {Promise} An Array of flair templates
  */
  get_link_flair_templates () {
    return this.subreddit.get_link_flair_templates(this.name);
  }
  /**
  * Assigns flair on this Submission (as a moderator; also see select_link_flair)
  * @param {object} options
  * @param {string} options.text The text that this link's flair should have
  * @param {string} options.css_class The CSS class that the link's flair should have
  * @returns {Promise} A Promise that fulfills with an updated version of this Submission
  */
  assign_flair (options) {
    return promise_wrap(this._ac._assign_flair(_.assign(options, {
      link: this.name, subreddit_name: this.subreddit.display_name
    })).then(() => {
      this.link_flair_text = options.text || null;
      this.link_flair_css_class = options.css_class || null;
    }).return(this));
  }

  /**
  * Selects a flair for this Submission (as the OP; also see assign_link_flair)
  * @param {object} options
  * @param {string} options.flair_template_id A flair template ID to use for this Submission. (This should be obtained
  beforehand using {@link get_link_flair_templates}.)
  * @param {string} [options.text] The flair text to use for the submission. (This is only necessary/useful if the given flair
  template has the `text_editable` property set to `true`.)
  * @returns {Promise} A Promise that fulfills with this objects after the request is complete
  */
  select_flair (options) {
    return promise_wrap(this._ac._select_flair(_.assign(options, {
      link: this.name, subreddit_name: this.subreddit.display_name
    })).return(this));
  }
};

/**
* A class representing a private message or a modmail.
* @extends CreatableContent
*/
objects.PrivateMessage = class PrivateMessage extends objects.CreatableContent {
  get _uri () {
    return `message/messages/${this.name.slice(3)}`;
  }
  _transform_api_response (response_obj) {
    return helpers.find_message_in_tree(this.name, response_obj[0]);
  }
  // TODO: Get rid of the repeated code here, most of these methods are exactly the same with the exception of the URIs
  /**
  * Blocks the author of this private message.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  */
  block_author () {
    return promise_wrap(this._post({uri: 'api/block', form: {id: this.name}}).return(this));
  }
  /**
  * Marks this message as read.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  */
  mark_as_read () {
    return promise_wrap(this._post({uri: 'api/read_message', form: {id: this.name}}).return(this));
  }
  /**
  * Marks this message as unread.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  */
  mark_as_unread () {
    return promise_wrap(this._post({uri: 'api/unread_message', form: {id: this.name}}).return(this));
  }
  /**
  * Mutes the author of this message for 72 hours. This should only be used on moderator mail.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  */
  mute_author () {
    return promise_wrap(this._post({uri: 'api/mute_message_author', form: {id: this.name}}).return(this));
  }
  /**
  * Unmutes the author of this message.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  */
  unmute_author () {
    return promise_wrap(this._post({uri: 'api/unmute_message_author', form: {id: this.name}}).return(this));
  }
};

/**
* A class representing a subreddit
* @extends RedditContent
*/
objects.Subreddit = class Subreddit extends objects.RedditContent {
  get _uri () {
    return `r/${this.display_name}/about`;
  }
  _delete_flair_templates ({flair_type}) {
    return this._post({uri: `r/${this.display_name}/api/clearflairtemplates`, form: {api_type, flair_type}});
  }
  /**
  * Deletes all of this subreddit's user flair templates
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  delete_all_user_flair_templates () {
    return this._delete_flair_templates({flair_type: 'USER_FLAIR'});
  }
  /**
  * Deletes all of this subreddit's link flair templates
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  delete_all_link_flair_templates () {
    return this._delete_flair_templates({flair_type: 'LINK_FLAIR'});
  }
  /**
  * Deletes one of this subreddit's flair templates
  * @param {object} options
  * @param {string} options.flair_template_id The ID of the template that should be deleted
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  delete_flair_template (options) {
    return promise_wrap(this._post({
      uri: `r/${this.display_name}/api/deleteflairtemplate`,
      form: {api_type, flair_template_id: options.flair_template_id}
    }).return(this));
  }
  _create_flair_template ({text, css_class, flair_type, text_editable = false}) {
    return promise_wrap(this._post({
      uri: `r/${this.display_name}/api/flairtemplate`,
      form: {api_type, text, css_class, flair_type, text_editable}
    }).return(this));
  }
  /**
  * Creates a new user flair template for this subreddit
  * @param {object} options
  * @param {string} options.text The flair text for this template
  * @param {string} [options.css_class=''] The CSS class for this template
  * @param {boolean} [options.text_editable=false] Determines whether users should be able to edit their flair text
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  when it has this template
  */
  create_user_flair_template (options) {
    return this._create_flair_template(_.assign(options, {flair_type: 'USER_FLAIR'}));
  }
  /**
  * Creates a new link flair template for this subreddit
  * @param {object} options
  * @param {string} options.text The flair text for this template
  * @param {string} [options.css_class=''] The CSS class for this template
  * @param {boolean} [options.text_editable=false] Determines whether users should be able to edit the flair text of their
  links when it has this template
  * @returns {Promise} A Promise that fulfills with this Subredit when the request is complete.
  */
  create_link_flair_template (options) {
    return this._create_flair_template(_.assign(options, {flair_type: 'LINK_FLAIR'}));
  }
  _get_flair_options ({name, link} = {}) { // TODO: Add shortcuts for this on RedditUser and Submission
    return this._post({uri: `r/${this.display_name}/api/flairselector`, form: {name, link}});
  }
  /**
  * Gets the flair templates for a given link.
  * @param {string} link_id The link's base36 ID
  * @returns {Promise} An Array of flair template options
  */
  get_link_flair_templates (link_id) {
    return this._get_flair_options({link: link_id}).choices;
  }
  /**
  * Gets the list of user flair templates on this subreddit.
  * @returns {Promise} An Array of user flair templates
  */
  get_user_flair_templates () {
    return this._get_flair_options().choices;
  }
  /**
  * Clears a user's flair on this subreddit.
  * @param {string} name The user's name
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  delete_user_flair (name) {
    return this._post({uri: `r/${this.display_name}/api/deleteflair`, form: {api_type, name}});
  }
  /**
  * Gets a user's flair on this subreddit.
  * @param {string} name The user's name
  * @returns {Promise} An object representing the user's flair
  */
  get_user_flair (name) {
    return this._get_flair_options({name}).current;
  }
  _set_flair_from_csv (flair_csv) {
    return this._post({uri: `r/${this.display_name}/api/flaircsv`, form: {flair_csv}});
  }
  /**
  * Sets multiple user flairs at the same time
  * @param {object[]} flair_array
  * @param {string} flair_array[].name A user's name
  * @param {string} flair_array[].text The flair text to assign to this user
  * @param {string} flair_array[].css_class The flair CSS class to assign to this user
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  set_multiple_user_flairs (flair_array) {
    const requests = [];
    while (flair_array.length > 0) {
      // The endpoint only accepts at most 100 lines of csv at a time, so split the array into chunks of 100.
      requests.push(this._set_flair_from_csv(flair_array.splice(0, 100).map(item =>
        `${item.name},${item.text || ''},${item.css_class || ''}`).join('\n')
      ));
    }
    return promise_wrap(Promise.all(requests));
  }
  /**
  * Gets a Listing all user flairs on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.name] A specific username to jump to
  * @returns {Promise} A Listing containing user flairs
  */
  get_user_flair_list (options) {
    return this._get({uri: `r/${this.display_name}/api/flairlist`, qs: options}).users;
  }
  /**
  * Configures the flair settings for this subreddit.
  * @param {object} options
  * @param {boolean} options.user_flair_enabled Determines whether user flair should be enabled
  * @param {string} options.user_flair_position Determines the orientation of user flair relative to a given username. This
  should be either the string 'left' or the string 'right'.
  * @param {boolean} options.user_flair_self_assign_enabled Determines whether users should be able to edit their own flair
  * @param {string} options.link_flair_position Determines the orientation of link flair relative to a link title. This should
  be either 'left' or 'right'.
  * @param {boolean} options.link_flair_self_assign_enabled Determines whether users should be able to edit the flair of their
  submissions.
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  configure_flair (options) {
    return this._post({
      uri: `r/${this.display_name}/api/flairconfig`,
      form: {
        api_type,
        flair_enabled: options.user_flair_enabled,
        flair_position: options.user_flair_position,
        flair_self_assign_enabled: options.user_flair_self_assign_enabled,
        link_flair_position: options.link_flair_position,
        link_flair_self_assign_enabled: options.link_flair_self_assign_enabled
      }
    });
  }
  /**
  * Gets the requester's flair on this subreddit.
  * @returns {Promise} An object representing the requester's current flair
  */
  get_my_flair () {
    return this._get_flair_options().current;
  }
  /**
  * Sets the requester's flair on this subreddit.
  * @param {object} options
  * @param {string} options.flair_template_id A flair template ID to use. (This should be obtained beforehand using
  {@link get_user_flair_templates}.)
  * @param {string} [options.text=] The flair text to use. (This is only necessary/useful if the given flair
  template has the `text_editable` property set to `true`.)
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  select_my_flair (options) {
    /* NOTE: This requires `identity` scope in addition to `flair` scope, since the reddit api needs to be passed a username.
    I'm not sure if there's a way to do this without requiring additional scope. */
    return promise_wrap((this._ac.own_user_info ? Promise.resolve() : this._ac.get_me()).then(() =>
      this._ac._select_flair(_.assign(options, {subreddit_name: this.display_name, name: this._ac.own_user_info.name}))
    ));
  }
  _set_my_flair_visibility (flair_enabled) {
    return this._post({uri: `r/${this.display_name}/api/setflairenabled`, form: {api_type, flair_enabled}});
  }
  /**
  * Makes the requester's flair visible on this subreddit.
  * @returns {Promise} A Promise that will resolve when the request is complete
  */
  show_my_flair () {
    return this._set_my_flair_visibility(true);
  }
  /**
  * Makes the requester's flair invisible on this subreddit.
  * @returns {Promise} A Promise that will resolve when the request is complete
  */
  hide_my_flair () {
    return this._set_my_flair_visibility(false);
  }
  /**
  * Creates a new selfpost on this subreddit.
  * @param {object} options An object containing details about the submission
  * @param {string} options.title The title of the submission
  * @param {string} [options.text] The selftext of the submission
  * @param {boolean} [options.send_replies=true] Determines whether inbox replies should be enabled for this submission
  * @param {string} [options.captcha_iden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [options.captcha_response] The response to the captcha with the given identifier
  * @returns {Promise} The newly-created Submission object
  */
  submit_selfpost (options) {
    return this._ac.submit_selfpost(_.assign(options, {subreddit_name: this.display_name}));
  }
  /**
  * Creates a new link submission on this subreddit.
  * @param {object} options An object containing details about the submission
  * @param {string} options.title The title of the submission
  * @param {string} options.url The url that the link submission should point to
  * @param {boolean} [options.send_replies=true] Determines whether inbox replies should be enabled for this submission
  * @param {boolean} [options.resubmit=true] If this is false and same link has already been submitted to this subreddit in
  the past, reddit will return an error. This could be used to avoid accidental reposts.
  * @param {string} [options.captcha_iden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [options.captcha_response] The response to the captcha with the given identifier
  * @returns {Promise} The newly-created Submission object
  */
  submit_link (options) {
    return this._ac.submit_link(_.assign(options, {subreddit_name: this.display_name}));
  }
  /**
  * Gets a Listing of hot posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved submissions
  */
  get_hot (options) {
    return this._ac.get_hot(this.display_name, options);
  }
  /**
  * Gets a Listing of new posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved submissions
  */
  get_new (options) {
    return this._ac.get_new(this.display_name, options);
  }
  /**
  * Gets a Listing of new comments on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved comments
  */
  get_new_comments (options) {
    return this._ac.get_new_comments(this.display_name, options);
  }
  /**
  * Gets a single random Submission from this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} The retrieved Submission object
  */
  get_random_submission () {
    return this._ac.get_random_submission(this.display_name);
  }
  /**
  * Gets a Listing of top posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  `hour, day, week, month, year, all`
  * @returns {Promise} A Listing containing the retrieved submissions
  */
  get_top (options) {
    return this._ac.get_top(this.display_name, options);
  }
  /**
  * Gets a Listing of controversial posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  `hour, day, week, month, year, all`
  * @returns {Promise} A Listing containing the retrieved submissions
  * @memberof snoowrap
  * @instance
  */
  get_controversial (options) {
    return this._ac.get_controversial(this.display_name, options);
  }
  /**
  * Gets the moderation log for this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string[]} [options.mods=] An array of moderator names that the results should be restricted to
  * @param {string} [options.type=] Restricts the results to the specified type. This should be one of `banuser, unbanuser,
  removelink, approvelink, removecomment, approvecomment, addmoderator, invitemoderator, uninvitemoderator,
  acceptmoderatorinvite, removemoderator, addcontributor, removecontributor, editsettings, editflair, distinguish, marknsfw,
  wikibanned, wikicontributor, wikiunbanned, wikipagelisted, removewikicontributor, wikirevise, wikipermlevel,
  ignorereports, unignorereports, setpermissions, setsuggestedsort, sticky, unsticky, setcontestmode, unsetcontestmode,
  lock, unlock, muteuser, unmuteuser, createrule, editrule, deleterule`
  * @returns {Promise} A Listing containing moderation actions
  */
  get_moderation_log (options = {}) {
    const parsed_options = _(options).assign({mod: options.mods && options.mods.join(',')}).omit(['mods']).value();
    return this._get({uri: `r/${this.display_name}/about/log`, qs: parsed_options});
  }
  /**
  * Gets a list of reported items on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only=] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing reported items
  */
  get_reports (options = {}) {
    return this._get({uri: `r/${this.display_name}/about/reports`, qs: options});
  }
  /**
  * Gets a list of removed items on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only=] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing removed items
  */
  get_spam (options = {}) {
    return this._get({uri: `r/${this.display_name}/about/spam`, qs: options});
  }
  /**
  * Gets a list of items on the modqueue on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only=] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing items on the modqueue
  */
  get_modqueue (options = {}) {
    return this._get({uri: `r/${this.display_name}/about/modqueue`, qs: options});
  }
  /**
  * Gets a list of unmoderated items on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only=] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing unmoderated items
  */
  get_unmoderated (options = {}) {
    return this._get({uri: `r/${this.display_name}/about/unmoderated`, qs: options});
  }
  /**
  * Gets a list of edited items on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only=] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing edited items
  */
  get_edited (options = {}) {
    return this._get({uri: `r/${this.display_name}/about/edited`, qs: options});
  }
  /**
  * Accepts an invite to become a moderator of this subreddit.
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete
  */
  accept_moderator_invite () {
    return promise_wrap(this._post({
      uri: `r/${this.display_name}/api/accept_moderator_invite`,
      form: {api_type}
    }).bind(this).then(helpers._handle_json_errors));
  }
  /**
  * Abdicates moderator status on this subreddit.
  * @returns {Promise} A Promise for this subreddit.
  */
  leave_moderator () {
    return promise_wrap(this.name.then(name =>
      this._post({uri: 'api/leavemoderator', form: {id: name}}).bind(this).then(helpers._handle_json_errors)
    ));
  }
  /**
  * Abdicates approved submitter status on this subreddit.
  * @returns {Promise} A Promise that resolves with this subreddit when the request is complete.
  */
  leave_contributor () {
    return promise_wrap(this.name.then(name =>
      this._post({uri: 'api/leavecontributor', form: {id: name}}).return(this)
    ));
  }
  /**
  * Gets a subreddit's CSS stylesheet.
  * @returns {Promise} A Promise for a string containing the subreddit's CSS. Note that this method will return a 404 error
  if the subreddit in question does not have a custom stylesheet.
  */
  get_stylesheet () {
    return this._get({uri: `r/${this.display_name}/stylesheet`, json: false, transform: _.identity});
  }
  /**
  * Conducts a search of reddit submissions, restricted to this subreddit.
  * @param {object} options Search options. Can also contain options for the resulting Listing.
  * @param {string} options.query The search query
  * @param {string} [options.time=] Describes the timespan that posts should be retrieved frome. One of
  `hour, day, week, month, year, all`
  * @param {string} [options.sort=] Determines how the results should be sorted. One of `relevance, hot, top, new, comments`
  * @param {string} [options.syntax='plain'] Specifies a syntax for the search. One of `cloudsearch, lucene, plain`
  * @returns {Promise} A Listing containing the search results.
  * @memberof snoowrap
  * @instance
  */
  search (options) {
    return this._ac.search(_.assign(options, {subreddit: this, restrict_sr: true}));
  }
  /**
  * Gets the list of banned users on this subreddit.
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  */
  get_banned_users (options) { // TODO: Return Listings containing RedditUser objects rather than normal objects with data
    const opts = options instanceof objects.RedditUser ? {name: options.name} : options;
    return this._get({uri: `r/${this.display_name}/about/banned`, qs: helpers.rename_key(opts, 'name', 'user')});
  }
  /**
  * Gets the list of muted users on this subreddit.
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  */
  get_muted_users (options) {
    const opts = options instanceof objects.RedditUser ? {name: options.name} : options;
    return this._get({uri: `r/${this.display_name}/about/muted`, qs: helpers.rename_key(opts, 'name', 'user')});
  }
  /**
  * Gets the list of users banned from this subreddit's wiki.
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  */
  get_wikibanned_users (options) {
    const opts = options instanceof objects.RedditUser ? {name: options.name} : options;
    return this._get({uri: `r/${this.display_name}/about/wikibanned`, qs: helpers.rename_key(opts, 'name', 'user')});
  }
  /**
  * Gets the list of approved submitters on this subreddit.
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  */
  get_contributors (options) {
    const opts = options instanceof objects.RedditUser ? {name: options.name} : options;
    return this._get({uri: `r/${this.display_name}/about/contributors`, qs: helpers.rename_key(opts, 'name', 'user')});
  }
  /**
  * Gets the list of approved wiki submitters on this subreddit .
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  */
  get_wiki_contributors (options) {
    const opts = options instanceof objects.RedditUser ? {name: options.name} : options;
    return this._get({uri: `r/${this.display_name}/about/wikicontributors`, qs: helpers.rename_key(opts, 'name', 'user')});
  }
  /**
  * Gets the list of moderators on this subreddit.
  * @param {object} $0
  * @param {string} [$0.name=] The name of a user to find in the list
  * @returns {Promise} An Array of RedditUsers representing the moderators of this subreddit
  */
  get_moderators (options) {
    const opts = options instanceof objects.RedditUser ? {name: options.name} : options;
    return this._get({uri: `r/${this.display_name}/about/moderators`, qs: helpers.rename_key(opts, 'name', 'user')});
  }
  /**
  * Deletes the banner for this Subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  delete_banner () {
    return promise_wrap(this._post({
      uri: `r/${this.display_name}/api/delete_sr_banner`,
      form: {api_type}
    }).bind(this).then(helpers._handle_json_errors));
  }
  /**
  * Deletes the header image for this Subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  delete_header () {
    return promise_wrap(this._post({
      uri: `r/${this.display_name}/api/delete_sr_header`,
      form: {api_type}
    }).bind(this).then(helpers._handle_json_errors));
  }
  /**
  * Deletes this subreddit's icon.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  delete_icon () {
    return promise_wrap(this._post({
      uri: `r/${this.display_name}/api/delete_sr_icon`,
      form: {api_type}
    }).bind(this).then(helpers._handle_json_errors));
  }
  /**
  * Deletes an image from this subreddit.
  * @param {object} $0
  * @param {string} $0.image_name The name of the image.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  delete_image ({image_name}) {
    return promise_wrap(this._post({
      uri: `r/${this.display_name}/api/delete_sr_image`,
      form: {api_type, img_name: image_name}
    }).bind(this).then(helpers._handle_json_errors));
  }
  /**
  * Gets this subreddit's current settings.
  * @returns {Promise} An Object containing this subreddit's current settings.
  */
  get_settings () {
    return this._get({uri: `r/${this.display_name}/about/edit`});
  }
  /**
  * Edits this subreddit's settings.
  * @param {object} options An Object containing {[option name]: new value} mappings of the options that should be modified.
  Any omitted option names will simply retain their previous values.
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
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  */
  edit_settings (options) {
    return promise_wrap(Promise.join(this.get_settings(), this.name, (current_values, name) =>
      this._ac._create_or_edit_subreddit(_.assign(current_values, options, {sr: name}))
    ).return(this));
  }
  /**
  * Gets a list of recommended other subreddits given this one.
  * @param {object} [$0=]
  * @param {Array} [$0.omit=[]] An Array of subreddit names that should be excluded from the listing.
  * @returns {Promise} An Array of subreddit names
  */
  get_recommended_subreddits ({omit} = {}) {
    return this._get({uri: `api/recommend/sr/${this.display_name}`, qs: {omit: omit && omit.join(',')}}).then(names =>
      _.map(names, 'sr_name')
    );
  }
  /**
  * Gets the submit text (which displays on the submission form) for this subreddit.
  * @returns {Promise} The submit text, represented as a string.
  */
  get_submit_text () {
    return this._get({uri: `r/${this.display_name}/api/submit_text`}).submit_text;
  }
  /**
  * Updates this subreddit's stylesheet.
  * @param {object} $0
  * @param {string} $0.css The new contents of the stylesheet
  * @param {string} [$0.reason=] The reason for the change (256 characters max)
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  update_stylesheet ({css, reason}) {
    return promise_wrap(this._post({
      uri: `r/${this.display_name}/api/subreddit_stylesheet`,
      form: {api_type, op: 'save', reason, stylesheet_contents: css}
    }).bind(this).then(helpers._handle_json_errors));
  }

  _set_subscribed (status) {
    return promise_wrap(this.name.then(name => this._post({
      uri: 'api/subscribe',
      form: {action: status ? 'sub' : 'unsub', sr: name}
    }).return(this)));
  }
  /**
  * Subscribes to this subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  subscribe () {
    return this._set_subscribed(true);
  }
  /**
  * Unsubscribes from this subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  unsubscribe () {
    return this._set_subscribed(false);
  }
  _upload_sr_img ({name, file, upload_type, image_type}) {
    if (typeof file !== 'string' && !(file instanceof require('stream').Readable)) {
      throw new errors.InvalidMethodCallError('Uploaded image filepath must be a string or a ReadableStream.');
    }
    const parsed_file = typeof file === 'string' ? require('fs').createReadStream(file) : file;
    return promise_wrap(this._post({
      uri: `r/${this.display_name}/api/upload_sr_img`,
      formData: {name, upload_type, img_type: image_type, file: parsed_file}
    }).then(result => {
      if (result.errors.length) {
        throw result.errors[0];
      }
      return this;
    }));
  }
  /**
  * Uploads an image for use in this subreddit's stylesheet.
  * @param {object} $0
  * @param {string} $0.name The name that the new image should have in the stylesheet
  * @param {string|stream.Readable} $0.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) in environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [$0.image_type='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete.
  */
  upload_stylesheet_image ({name, file, image_type = 'png'}) {
    return this._upload_sr_img({name, file, image_type, upload_type: 'img'});
  }
  /**
  * Uploads an image to use as this subreddit's header.
  * @param {object} $0
  * @param {string|stream.Readable} $0.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [$0.image_type='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete.
  */
  upload_header_image ({file, image_type = 'png'}) {
    return this._upload_sr_img({file, image_type, upload_type: 'header'});
  }
  /**
  * Uploads an image to use as this subreddit's mobile icon.
  * @param {object} $0
  * @param {string|stream.Readable} $0.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [$0.image_type='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete.
  */
  upload_icon ({file, image_type = 'png'}) {
    return this._upload_sr_img({file, image_type, upload_type: 'icon'});
  }
  /**
  * Uploads an image to use as this subreddit's mobile banner.
  * @param {object} $0
  * @param {string|stream.Readable} $0.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [$0.image_type='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete.
  */
  upload_banner_image ({file, image_type = 'png'}) {
    return this._upload_sr_img({file, image_type, upload_type: 'banner'});
  }
  /**
  * Gets information on this subreddit's rules.
  * @returns {Promise} A Promise that fulfills with information on this subreddit's rules.
  */
  get_rules () {
    return this._get({uri: `r/${this.display_name}/about/rules`});
  }
  /**
  * Gets the stickied post on this subreddit, or throws a 404 error if none exists.
  * @param {object} $0
  * @param {number} [$0.num=1] The number of the sticky to get. Should be either `1` (first sticky) or `2` (second sticky).
  * @returns {Promise} A Submission object representing this subreddit's stickied submission
  */
  get_sticky ({num = 1} = {}) {
    return this._get({uri: `r/${this.display_name}/about/sticky`, qs: {num}});
  }
  _friend (options) {
    return promise_wrap(
      this._ac._friend(_.assign(options, {sub: this.display_name})).bind(this).then(helpers._handle_json_errors)
    );
  }
  _unfriend (options) {
    return promise_wrap(
      this._ac._unfriend(_.assign(options, {sub: this.display_name})).bind(this).then(helpers._handle_json_errors)
    );
  }
  /**
  * Invites the given user to be a moderator of this subreddit.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be invited
  * @param {Array} [$0.permissions] The moderator permissions that this user should have. This should be an array containing
  some combination of `"wiki", "posts", "access", "mail", "config", "flair"`. To add a moderator with full permissions, omit
  this property entirely.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  invite_moderator ({name, permissions}) {
    return this._friend({name, permissions: helpers._format_permissions(permissions), type: 'moderator_invite'});
  }
  /**
  * Revokes an invitation for the given user to be a moderator.
  * @param {object} $0
  * @param {string} $0.name The username of the account whose invitation should be revoked
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  revoke_moderator_invite ({name}) {
    return this._unfriend({name, type: 'moderator_invite'});
  }
  /**
  * Removes the given user's moderator status on this subreddit.
  * @param {object} $0
  * @param {string} $0.name The username of the account whose moderator status should be removed
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  remove_moderator ({name}) {
    return this._unfriend({name, type: 'moderator'});
  }
  /**
  * Makes the given user an approved submitter of this subreddit.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be given this status
  * returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  add_contributor ({name}) {
    return this._friend({name, type: 'contributor'});
  }
  /**
  * Revokes this user's approved submitter status on this subreddit.
  * @param {object} $0
  * @param {string} $0.name The username of the account whose status should be revoked
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  remove_contributor ({name}) {
    return this._unfriend({name, type: 'contributor'});
  }
  /**
  * Bans the given user from this subreddit.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be banned
  * @param {string} [$0.ban_message] The ban message. This will get sent to the user in a private message, alerting them
  that they have been banned.
  * @param {string} [$0.ban_reason] A string indicating which rule the banned user broke (100 characters max)
  * @param {number} [$0.duration] The duration of the ban, in days. For a permanent ban, omit this parameter.
  * @param {string} [$0.ban_note] A note that appears on the moderation log, usually used to indicate the reason for the
  ban. This is not visible to the banned user. (300 characters max)
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete
  */
  ban_user ({name, ban_message, ban_reason, duration, ban_note}) {
    return this._friend({name, ban_message, ban_reason, duration, note: ban_note, type: 'banned'});
  }
  /**
  * Unbans the given user from this subreddit.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be unbanned
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  unban_user ({name}) {
    return this._unfriend({name, type: 'banned'});
  }
  /**
  * Mutes the given user from messaging this subreddit for 72 hours.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be muted
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete
  */
  mute_user ({name}) {
    return this._friend({name, type: 'muted'});
  }
  /**
  * Unmutes the given user from messaging this subreddit.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be muted
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete
  */
  unmute_user ({name}) {
    return this._unfriend({name, type: 'muted'});
  }
  /**
  * Bans the given user from editing this subreddit's wiki.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be wikibanned
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete
  */
  wikiban_user ({name}) {
    return this._friend({name, type: 'wikibanned'});
  }
  /**
  * Unbans the given user from editing this subreddit's wiki.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be unwikibanned
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete
  */
  unwikiban_user ({name}) {
    return this._unfriend({name, type: 'wikibanned'});
  }
  /**
  * Adds the given user to this subreddit's list of approved wiki editors.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be given approved editor status
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete
  */
  add_wiki_contributor ({name}) {
    return this._friend({name, type: 'wikicontributor'});
  }
  /**
  * Removes the given user from this subreddit's list of approved wiki editors.
  * @param {object} $0
  * @param {string} $0.name The username of the account whose approved editor status should be revoked
  * returns {Promise} A Promise that fulfills with this subreddit when the request is complete
  */
  remove_wiki_contributor ({name}) {
    return this._unfriend({name, type: 'wikicontributor'});
  }
  /**
  * Sets the permissions for a given moderator on this subreddit.
  * @param {object} $0
  * @param {string} $0.name The username of the moderator whose permissions are being changed
  * @param {Array} [$0.permissions] The new moderator permissions that this user should have. This should be an array
  containing some combination of `"wiki", "posts", "access", "mail", "config", "flair"`. To add a moderator with full
  permissions, omit this property entirely.
  * @returns {Promise} A Promise that fulfills with this Subreddit when this request is complete
  */
  set_moderator_permissions ({name, permissions}) {
    return this._post({
      uri: `r/${this.display_name}/api/setpermissions`,
      form: {api_type, name, permissions: helpers._format_permissions(permissions), type: 'moderator'}
    }).bind(this).tap(helpers._handle_json_errors);
  }
  /**
  * Gets a given wiki page on this subreddit.
  * @param {string} title The title of the desired wiki page.
  * @returns {WikiPage} An unfetched WikiPage object corresponding to the desired wiki page
  */
  get_wiki_page (title) {
    return this._ac._new_object('WikiPage', {subreddit: this, title});
  }
  /**
  * Gets the list of wiki pages on this subreddit.
  * @returns {Promise} An Array containing WikiPage objects
  */
  get_wiki_pages () {
    return this._get({uri: `r/${this.display_name}/wiki/pages`}).then(result =>
      _.map(result, title => this.get_wiki_page(title))
    );
  }
  /**
  * Gets a list of revisions on this subreddit's wiki.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing wiki revisions
  */
  get_wiki_revisions (options) {
    return this._get({uri: `r/${this.display_name}/wiki/revisions`, qs: options});
  }
};

/**
* A class representing a wiki page on a subreddit.
* @extends objects.RedditContent
*/
objects.WikiPage = class WikiPage extends objects.RedditContent {
  get _uri () {
    return `r/${this.subreddit.display_name}/wiki/${this.title}`;
  }
  /**
  * Gets the current settings for this wiki page.
  * @returns {Promise} An Object representing the settings for this page
  */
  get_settings () {
    return this._get({uri: `r/${this.subreddit.display_name}/wiki/settings/${this.title}`});
  }
  /**
  * Edits the settings for this wiki page.
  * @param {object} $0
  * @param {boolean} $0.listed Determines whether this wiki page should appear on the public list of pages for this subreddit.
  * @param {number} $0.permission_level Determines who should be allowed to access and edit this page `0` indicates that this
  subreddit's default wiki settings should get used, `1` indicates that only approved wiki contributors on this subreddit
  should be able to edit this page, and `2` indicates that only mods should be able to view and edit this page.
  */
  edit_settings ({listed, permission_level}) {
    return promise_wrap(this._post({
      uri: `r/${this.subreddit.display_name}/wiki/settings/${this.title}`,
      form: {listed, permlevel: permission_level}
    }).return(this));
  }
  _modify_editor ({name, action}) {
    return this._post({
      uri: `r/${this.subreddit.display_name}/api/wiki/alloweditor/${action}`,
      form: {page: this.title, username: name}
    });
  }
  /**
  * Makes the given user an approved editor of this wiki page.
  * @param {object} $0
  * @param {string} $0.name The name of the user to be added
  * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
  */
  add_editor ({name}) {
    return promise_wrap(this._modify_editor({name, action: 'add'}).return(this));
  }
  /**
  * Revokes this user's approved editor status for this wiki page
  * @param {object} $0
  * @param {string} $0.name The name of the user to be removed
  * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
  */
  remove_editor ({name}) {
    return promise_wrap(this._modify_editor({name, action: 'del'}).return(this));
  }
  /**
  * Edits this wiki page.
  * @param {object} $0
  * @param {string} $0.text The new content of the page, in markdown.
  * @param {string} [$0.reason] The edit reason that will appear in this page's revision history. 256 characters max
  * @param {string} [$0.previous_revision] Determines which revision this edit should be added to. If this parameter is
  omitted, this edit is simply added to the most recent revision.
  * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
  */
  edit ({text, reason, previous_revision}) {
    return promise_wrap(this._post({
      uri: `r/${this.subreddit.display_name}/api/wiki/edit`,
      form: {content: text, page: this.title, previous: previous_revision, reason}
    }).return(this));
  }
  /**
  * Gets a list of revisions for this wiki page.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing revisions of this page
  */
  get_revisions (options) {
    return this._get({uri: `r/${this.subreddit.display_name}/wiki/revisions/${this.title}`, qs: options});
  }
  /**
  * Hides the given revision from this page's public revision history.
  * @param {object} $0
  * @param {string} $0.id The revision's id
  * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
  */
  hide_revision ({id}) {
    return promise_wrap(this._post({
      uri: `r/${this.subreddit.display_name}/api/wiki/hide`,
      qs: {page: this.title, revision: id}
    }).return(this));
  }
  /**
  * Reverts this wiki page to the given point.
  * @param {object} $0
  * @param {string} $0.id The id of the revision that this page should be reverted to
  * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
  */
  revert ({id}) {
    return promise_wrap(this._post({
      uri: `r/${this.subreddit.display_name}/api/wiki/revert`,
      qs: {page: this.title, revision: id}
    }).return(this));
  }
  /**
  * Gets a list of discussions about this wiki page.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing discussions about this page
  */
  get_discussions (options) {
    return this._get({uri: `r/${this.subreddit.display_name}/wiki/discussions/${this.title}`, qs: options});
  }
};

/**
* A class representing a list of content. This is a subclass of the native Array object, so it has all the properties of
an Array (length, forEach, etc.) in addition to some added methods. At any given time, each Listing has fetched a specific
number of items, and that number will be its length. The Listing  can be extended by using the #fetch_more(), #fetch_until,
and #fetch_all() functions.

Most methods that return Listings will also accept `limit`, `after`, `before`, `show`, and `count` properties.
*/
objects.Listing = class Listing extends Array {
  constructor ({children = [], query = {}, show_all = true, limit, _transform = _.identity,
      uri, method = 'get', after, before, _is_comment_list = false} = {}, _ac) {
    super();
    _.assign(this, children);
    const constant_params = _.assign(query, {show: show_all ? 'all' : undefined, limit});
    this._ac = _ac;
    this.uri = uri;
    this.method = method;
    this.constant_params = constant_params;
    this._transform = _transform;
    this.limit = limit;
    this.after = after;
    this.before = before;
    if (_.last(children) instanceof objects.more) {
      this._more = this.pop();
      this._is_comment_list = true;
    }
  }
  /**
  * This is a getter that is true if there are no more items left to fetch, and false otherwise.
  */
  get is_finished () {
    if (this._is_comment_list) {
      return !this._more || !this._more.children.length;
    }
    return !this.uri || this.after === null && this.before === null;
  }
  /**
  * Fetches some more items and adds them to this Listing.
  * @param {number} [amount] The number of items to fetch. If this is not defined, one more "batch" of items is fetched;
  the size of a batch depends on the type of Listing this is, as well as the requester's reddit preferences.
  * @returns {Promise} An updated version of this listing with `amount` items added on.
  */
  fetch_more (amount = this.limit) {
    if (typeof amount !== 'number') {
      throw new errors.InvalidMethodCallError('Failed to fetch Listing. (amount must be a Number.)');
    }
    if (amount <= 0 || this.is_finished) {
      return [];
    }
    if (this._is_comment_list) {
      return promise_wrap(this._fetch_more_comments(amount).then(() => this));
    }
    if (!this.uri) {
      return [];
    }
    return promise_wrap(this._fetch_more_regular(amount).then(() => this));
  }
  async _fetch_more_regular (amount) {
    const limit_for_request = Math.min(amount, this.limit) || this.limit;
    const request_params = _.merge({after: this.after, before: this.before, limit: limit_for_request}, this.constant_params);
    const response = await this._ac[`_${this.method}`]({
      uri: this.uri,
      qs: request_params,
      limit: limit_for_request
    }).then(this._transform);
    this.push(..._.toArray(response));
    this.before = response.before;
    this.after = response.after;
    return response.slice(0, amount).concat(await this.fetch_more(amount - response.length));
  }
  /* Pagination for comments works differently than it does for most other things; rather than sending a link to the next page
  within a Listing, reddit sends the last comment in the list as as a `more` object, with links to all the remaining comments
  in the thread. */
  async _fetch_more_comments (...args) {
    const new_comments = this._more ? await this._more.fetch_more(...args) : [];
    this.push(..._.toArray(new_comments));
    return new_comments;
  }
  /**
  * Fetches all of the items in this Listing, only stopping when there are none left.
  * @returns {Promise} The updated version of this Listing. Keep in mind that this method has the potential to exhaust your
  ratelimit quickly if the Listing doesn't have a clear end (e.g. with posts on the front page), so use it with discretion.
  */
  fetch_all () {
    return this.fetch_more(Infinity);
  }
  /**
  * Fetches items until a given length is reached.
  * @param {object} $0
  * @param {number} $0.length The maximum length that the Listing should have after completion. The length might end up
  being less than this if the true number of available items in the Listing is less than `$0.length`. For example, this
  can't fetch 200 comments on a Submission that only has 100 comments in total.
  * @returns {Promise} The updated Listing
  */
  fetch_until ({length}) {
    return this.fetch_more(length - this.length);
  }
  inspect () {
    return `<${constants.MODULE_NAME}.objects.${this.constructor.name}> ${util.inspect(_.toArray(this))}`;
  }
};

objects.more = class more extends objects.RedditContent {
  /* Requests to /api/morechildren are capped at 20 comments at a time, but requests to /api/info are capped at 100, so
  it's easier to send to the latter. The disadvantage is that comment replies are not automatically sent from requests
  to /api/info. */
  async fetch_more (amount) {
    if (isNaN(amount)) {
      throw new errors.InvalidMethodCallError('Failed to fetch Listing. (`amount` must be a Number.)');
    }
    if (amount <= 0 || this.children.length === 0) {
      return [];
    }
    const ids_for_this_request = this.children.splice(0, Math.min(amount, 100)).map(id => `t1_${id}`);
    // Requests are capped at 100 comments. Send lots of requests recursively to get the comments, then concatenate them.
    // (This speed-requesting is only possible with comment Listings since the entire list of ids is present initially.)
    const promise_for_this_batch = this._get({uri: 'api/info', qs: {id: ids_for_this_request.join(',')}});
    const promise_for_remaining_items = this.fetch_more(amount - ids_for_this_request.length);
    return _.toArray(await promise_for_this_batch).concat(await promise_for_remaining_items);
  }
};

objects.UserList = class UserList {
  constructor (options, _ac) {
    return options.children.map(user => _ac._new_object('RedditUser', user, false));
  }
};

objects.Trophy = class Trophy extends objects.RedditContent {};
objects.PromoCampaign = class PromoCampaign extends objects.RedditContent {};
objects.KarmaList = class KarmaList extends objects.RedditContent {};
objects.TrophyList = class TrophyList extends objects.RedditContent {};
objects.SubredditSettings = class SubredditSettings extends objects.RedditContent {};
objects.ModAction = class ModAction extends objects.RedditContent {};
objects.WikiPageSettings = class WikiPageSettings extends objects.RedditContent {};
objects.WikiPageListing = class WikiPageListing extends objects.RedditContent {};

snoowrap.objects = objects;
snoowrap.helpers = helpers;
module.exports = snoowrap;
