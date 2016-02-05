'use strict';
require('harmony-reflect'); // temp dependency until v8 implements Proxies properly
let Promise = require('bluebird');
let _ = require('lodash');
let request = require('request-promise').defaults({json: true});
let moment = require('moment');
let promise_wrap = require('promise-chains');
let util = require('util');
let constants = require('./constants');
let errors = require('./errors');
let default_config = require('./default_config');
let assign_mixins = require('./assign_mixins');
let objects = {};
let helpers = {};

/** The class for a snoowrap requester */
let snoowrap = class snoowrap {
  /**
  * Constructs a new requester. This will be necessary if you want to do anything.
  * @param {object} options A set of credentials to authenticate with
  * @param {string} options.client_id The client ID of your app (assigned by reddit)
  * @param {string} options.client_secret The client secret of your app (assigned by reddit)
  * @param {string} options.refresh_token A refresh token for your app. You will need to get this from reddit beforehand.
  * @param {string} options.user_agent A unique description of what your app does
  * @memberof snoowrap
  */
  constructor(options) {
    this.client_id = options.client_id;
    this.client_secret = options.client_secret;
    this.refresh_token = options.refresh_token;
    this.user_agent = options.user_agent;
    this.config = default_config;
    this.throttle = Promise.resolve();
    constants.REQUEST_TYPES.forEach(type => {
      Object.defineProperty(this, type, {get: () => (this._oauth_requester.defaults({method: type}))});
    });
  }
  get _base_client_requester () {
    return request.defaults({
      auth: {user: this.client_id, pass: this.client_secret},
      headers: {'user-agent': this.user_agent}
    });
  }
  async _update_access_token () {
    let token_info = await this._base_client_requester.post({
      url: `https://www.${this.config.endpoint_domain}/api/v1/access_token`,
      form: {grant_type: 'refresh_token', refresh_token: this.refresh_token}
    });
    this.access_token = token_info.access_token;
    this.token_expiration = moment().add(token_info.expires_in, 'seconds');
    this.scope = token_info.scope.split(' ');
  }
  get _oauth_requester () {
    let default_requester = request.defaults({
      headers: {'user-agent': this.user_agent},
      baseUrl: `https://oauth.${this.config.endpoint_domain}`,
      qs: {raw_json: 1}, // This tells reddit to unescape html characters, e.g. it will send '<' instead of '&lt;'
      resolveWithFullResponse: true,
      transform: (body, response) => {
        this.ratelimit_remaining = response.headers['x-ratelimit-remaining'];
        this.ratelimit_reset_point = moment().add(response.headers['x-ratelimit-reset'], 'seconds');
        let populated = helpers._populate(body, this);
        if (populated instanceof objects.Listing) {
          populated.uri = response.request.uri.path;
        }
        return populated;
      }
    });
    let handle_request = async (requester, self, args, attempts = 0) => {
      if (this.ratelimit_remaining < 1 && this.ratelimit_reset_point.isAfter()) {
        let seconds_until_expiry = this.ratelimit_reset_point.diff(moment(), 'seconds');
        if (this.config.continue_after_ratelimit_error) {
          this.warn(errors.RateLimitWarning(seconds_until_expiry));
          await Promise.delay(this.ratelimit_reset_point.diff());
        } else {
          throw new errors.RateLimitError(seconds_until_expiry);
        }
      }
      /* this.throttle is a timer that gets reset to this.config.request_delay whenever a request is sent.
      This ensures that requests are ratelimited and that no requests are lost. The await statement is wrapped
      in a loop to make sure that if the throttle promise resolves while multiple requests are pending, only
      one of the requests will be sent, and the others will await the throttle again. (The loop is non-blocking
      due to its await statement.) */
      while (!this.throttle.isFulfilled()) {
        await this.throttle;
      }
      this.throttle = Promise.delay(this.config.request_delay);

      // If the access token has expired (or will expire in the next 10 seconds), refresh it.
      let update = (!this.access_token || this.token_expiration.isBefore()) ? this._update_access_token() : Promise.resolve();

      // Send the request and return the response.
      return await update.then(() => (requester.defaults({auth: {bearer: this.access_token}}).apply(self, args))).catch(e => {
        // If there was an error on reddit's end, retry the request up to a maximum of this.config.max_retry_attempts times.
        if (attempts + 1 < this.config.max_retry_attempts && _.includes(this.config.retry_error_codes, e.statusCode)) {
          this.warn(`Warning: Received status code ${e.statusCode} from reddit. Retrying request...`);
          return handle_request(requester, self, args, attempts + 1);
        }
        throw e;
      });
    };
    return new Proxy(default_requester, {apply: (...args) => (promise_wrap(handle_request(...args)))});
  }
  _revoke_token (token) {
    return this._base_client_requester.post({
      url: `https://www.${this.config.endpoint_domain}/api/v1/revoke_token`,
      form: {token}
    });
  }
  revoke_access_token () {
    return this._revoke_token(this.access_token).then(() => {
      this.access_token = undefined;
    });
  }
  revoke_refresh_token () {
    return this._revoke_token(this.refresh_token).then(() => {
      this.refresh_token = undefined;
    });
  }
  inspect () {
    // Hide confidential information (tokens, client IDs, etc.) from the console.log output.
    // Also, hide some things that aren't converted to text well.
    let keys_for_hidden_values = ['client_secret', 'refresh_token', 'access_token'];
    let hidden_keys = ['throttle'];
    let formatted = util.inspect(_(this).omit(hidden_keys).mapValues((value, key) => {
      if (_.includes(keys_for_hidden_values, key)) {
        return value && '(redacted)';
      }
      if (value instanceof moment) {
        return value.format();
      }
      return value;
    }).value());
    return `<${constants.MODULE_NAME} authenticated client> ${formatted}`;
  }
  warn (...args) {
    if (!this.config.suppress_warnings) {
      console.warn(...args);
    }
  }
  get_me () {
    return this.get('api/v1/me').then(result => {
      this.own_user_info = new objects.RedditUser(result, this, true);
      return this.own_user_info;
    });
  }
  /**
  * Gets information on a reddit user with a given name.
  * @param {string} name - The user's username
  * @returns {RedditUser} An unfetched RedditUser object for the requested user
  * @memberof snoowrap
  * @instance
  */
  get_user (name) {
    return new snoowrap.objects.RedditUser({name}, this);
  }
  /**
  * Gets information on a comment with a given id.
  * @param {string} comment_id - The base36 id of the comment
  * @returns {Comment} An unfetched Comment object for the requested comment
  * @memberof snoowrap
  * @instance
  */
  get_comment (comment_id) {
    return new snoowrap.objects.Comment({name: `t1_${comment_id}`}, this);
  }
  /**
  * Gets information on a given subreddit.
  * @param {string} name - The name of the subreddit (e.g. 'AskReddit')
  * @returns {Subreddit} An unfetched Subreddit object for the requested subreddit
  * @memberof snoowrap
  * @instance
  */
  get_subreddit (name) {
    return new snoowrap.objects.Subreddit({display_name: name}, this);
  }
  /**
  * Gets information on a given submission.
  * @param {string} submission_id - The base36 id of the submission
  * @returns {Submission} An unfetched Submission object for the requested submission
  * @memberof snoowrap
  * @instance
  */
  get_submission (submission_id) {
    return new snoowrap.objects.Submission({name: `t3_${submission_id}`}, this);
  }
  /**
  * Gets a distribution of the requester's own karma distribution by subreddit.
  * @returns {Promise} A Promise for an object with karma information
  * @memberof snoowrap
  * @instance
  */
  get_karma () {
    return this.get({uri: 'api/v1/me/karma'});
  }
  /**
  * Gets information on the user's current preferences.
  * @returns {Promise} A promise for an object containing the user's current preferences
  * @memberof snoowrap
  * @instance
  */
  get_preferences () {
    return this.get({uri: 'api/v1/me/prefs'});
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
    // reddit expects all fields to be present in the patch request, so get the current values of the fields
    // and then apply the changes.
    return this.get_preferences().then(current_prefs => {
      return this.patch({uri: 'api/v1/me/prefs', body: _.assign(current_prefs, updated_preferences)});
    });
  }
  /**
  * Gets the currently-authenticated user's trophies.
  * @returns {Promise} A TrophyList containing the user's trophies
  * @memberof snoowrap
  * @instance
  */
  get_trophies () {
    return this.get({uri: 'api/v1/me/trophies'});
  }
  /**
  * Gets the list of the currently-authenticated user's friends.
  * @returns {Promise} A Promise that resolves with a list of friends
  * @memberof snoowrap
  * @instance
  */
  get_friends () {
    return this.get({uri: 'prefs/friends'});
  }
  /**
  * Gets the list of people that the currently-authenticated user has blocked.
  * @returns {Promise} A Promise that resolves with a list of blocked users
  * @memberof snoowrap
  * @instance
  */
  get_blocked_users () {
    return this.get({uri: 'prefs/blocked'});
  }
  /**
  * Determines whether the currently-authenticated user needs to fill out a captcha in order to submit a post/comment.
  * @returns {Promise} A Promise that resolves with a boolean value
  * @memberof snoowrap
  * @instance
  */
  check_captcha_requirement () {
    return this.get({uri: 'api/needs_captcha'});
  }
  /**
  * Gets the identifier (which takes the form of a hex string) for a new captcha image.
  * @returns {Promise} A Promise that resolves with a string
  * @memberof snoowrap
  * @instance
  */
  get_new_captcha_identifier () {
    return this.post({uri: 'api/new_captcha', form: {api_type: 'json'}}).json.data.iden;
  }
  /**
  * Gets an image for a given captcha identifier.
  * @param {string} identifier The captcha identifier.
  * @returns {Promise} A string containing raw image data in PNG format
  * @memberof snoowrap
  * @instance
  */
  get_captcha_image (identifier) {
    return this.get({uri: `captcha/${identifier}`});
  }
  /**
  * Gets an array of categories that items can be saved it.
  * Note: This feature is only enabled on reddit for accounts that have reddit gold.
  * @returns {Promise} An array of categories
  * @memberof snoowrap
  * @instance
  */
  get_saved_categories () {
    return this.get({uri: 'api/saved_categories'}).categories;
  }
  /**
  * Marks a list of submissions as 'visited'.
  * @param {Submission[]} links A list of Submission objects to mark
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @memberof snoowrap
  * @instance
  */
  mark_as_visited (links) {
    return this.post({uri: 'api/store_visits', links: _.map(links, 'name').join(',')});
  }
  _submit ({captcha_response, captcha_iden, kind, resubmit = true, send_replies = true, text, title, url, subreddit_name}) {
    return promise_wrap(this.post({uri: 'api/submit', form: {captcha: captcha_response, iden: captcha_iden,
        sendreplies: send_replies, sr: subreddit_name, kind, resubmit, text, title, url}}).then(response => {
      return response.json.data.things[0];
    }));
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
    if (typeof subreddit_name === 'object' && _(options).omitBy(_.isUndefined).isEmpty()) {
      /* In this case, "subreddit_name" ends up referring to the second argument, which is not actually a name since the user
      decided to omit that parameter. */
      options = subreddit_name;
      subreddit_name = undefined;
    }
    return this.get({uri: (subreddit_name ? `r/${subreddit_name}/` : '') + sort_type, qs: {t: options.time}});
  }
  /**
  * Gets a Listing of hot posts.
  * @param {string} [subreddit_name] The subreddit to get posts from. If not provided, posts are fetched from
  the front page of reddit.
  * @returns {Promise} A Listing containing the retrieved submissions
  * @memberof snoowrap
  * @instance
  */
  get_hot (subreddit_name) {
    return this._get_sorted_frontpage('hot', subreddit_name);
  }
  /**
  * Gets a Listing of new posts.
  * @param {string} [subreddit_name] The subreddit to get posts from. If not provided, posts are fetched from
  the front page of reddit.
  * @returns {Promise} A Listing containing the retrieved submissions
  * @memberof snoowrap
  * @instance
  */
  get_new (subreddit_name) {
    return this._get_sorted_frontpage('new', subreddit_name);
  }
  /**
  * Gets a Listing of new comments.
  * @param {string} [subreddit_name] The subreddit to get comments from. If not provided, posts are fetched from
  the front page of reddit.
  * @returns {Promise} A Listing containing the retrieved comments
  * @memberof snoowrap
  * @instance
  */
  get_new_comments (subreddit_name) {
    return this._get_sorted_frontpage('comments', subreddit_name);
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
  <pre><code>hour, day, week, month, year, all</code></pre>
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
  <pre><code>hour, day, week, month, year, all</code></pre>
  * @returns {Promise} A Listing containing the retrieved submissions
  * @memberof snoowrap
  * @instance
  */
  get_controversial (subreddit_name, options) {
    return this._get_sorted_frontpage('controversial', subreddit_name, {time: options.time});
  }
};
/** A base class for content from reddit. With the expection of Listings, all content types extend this class. */
objects.RedditContent = class RedditContent {
  /**
  * Constructs a new RedditContent instance.
  * @private
  * @param {object} options The properties that the RedditContent should be initialized with
  * @param {object} _ac The authenticated client (i.e. `snoowrap` instance) that is being used to fetch this object
  * @param {boolean} has_fetched Determines whether this object was created fully-formed (as opposed to lacking information)
  */
  constructor(options, _ac, has_fetched) {
    this._ac = _ac;
    this.has_fetched = !!has_fetched;
    _.assignIn(this, options);
    this._initialize_fetch_function();
    /* Omit the 'delete' request shortcut, since the property name is used by Comments and Submissions. To send an HTTP DELETE
    request, use `this._ac.delete` rather than the shortcut `this.delete`. */
    _.without(constants.REQUEST_TYPES, 'delete').forEach(type => {
      Object.defineProperty(this, type, {get: () => (this._ac[type])});
    });
    return new Proxy(this, {get: (target, key) => {
      if (key in target || key === 'length' || key in Promise.prototype || target.has_fetched) {
        return target[key];
      }
      if (key === '_raw') {
        return target;
      }
      if (_.includes(constants.REQUEST_TYPES, key)) {
        return target._ac[key];
      }
      return this.fetch()[key];
    }});
  }
  _initialize_fetch_function () {
    /**
    * Fetches this content from reddit.
    * @function fetch
    * @returns {Promise} The updated version of this object with all of its fetched properties. This will update the object
    with all of its properties from reddit, and set has_fetched property to true. Once an object has been fetched, any
    reference to an unknown property will simply return <pre><code>undefined</code></pre> instead of a Promise. Calling this
    on an already-fetched object will have no effect; to refresh an object, use <pre><code>refresh()</code></pre> instead.
    * @memberof objects.RedditContent
    * @instance
    */
    this.fetch = 'fetch' in this ? this.fetch : _.once(() => {
      return promise_wrap(this._ac.get({uri: this._uri}).then(this._transform_api_response.bind(this)).then(response => {
        helpers._assign_proxy(this, response);
        _.forIn(response, (value, key) => {this[key] = value;});
        this.has_fetched = true;
        return this;
      }));
    });
  }
  /**
  * Refreshes this content.
  * @returns {Promise} A newly-fetched version of this content
  * @memberof objects.RedditContent
  * @instance
  */
  refresh () {
    delete this.fetch;
    this._initialize_fetch_function();
    return this.fetch();
  }
  inspect () {
    let public_properties = _.omitBy(this, (value, key) => (key.startsWith('_') || typeof value === 'function'));
    return `<${constants.MODULE_NAME}.objects.${this.constructor.name}> ${util.inspect(public_properties)}`;
  }
  _transform_api_response (response_object) {
    return response_object;
  }
};

objects.Comment = class Comment extends objects.RedditContent {
  constructor (options, _ac, has_fetched) {
    super(options, _ac, has_fetched);
  }
  _transform_api_response (response_obj) {
    let replies_uri = `comments/${response_obj[0].link_id.slice(3)}`;
    let replies_query = {comment: this.name.slice(3)};
    let _transform = item => (item.comments[0].replies);
    response_obj[0].replies = new objects.Listing({uri: replies_uri, query: replies_query, _transform}, this._ac);
    return response_obj[0];
  }
  get _uri () {
    return `api/info?id=${this.name}`;
  }
};

objects.RedditUser = class RedditUser extends objects.RedditContent {
  constructor (options, _ac, has_fetched) {
    super(options, _ac, has_fetched);
  }
  get _uri () {
    if (typeof this.name !== 'string' || !constants.USERNAME_REGEX.test(this.name)) {
      throw new errors.InvalidUserError(this.name);
    }
    return `user/${this.name}/about`;
  }
  give_gold({months}) {
    /* Ideally this would allow for more than 36 months by sending multiple requests, but I don't have the resources to test
    that code, and it's probably better that such a big investment be deliberate anyway. */
    if (typeof months !== 'number' || months < 1 || months > 36) {
      throw new errors.InvalidMethodCallError('Invalid argument to RedditUser.give_gold; `months` must be between 1 and 36.');
    }
    return this.post({uri: `api/v1/gold/give/${this.name}`});
  }
};

/**
* A class representing a reddit submission
* @extends RedditContent
*/
objects.Submission = class Submission extends objects.RedditContent {
  constructor (options, _ac, has_fetched) {
    super(options, _ac, has_fetched);
  }
  get _uri () {
    return `comments/${this.name.slice(3)}`;
  }
  // TODO: Get rid of some boilerplate code here
  /**
  * Hides this Submission, preventing it from appearing on most Listings.
  * @returns {Promise} The updated version of this Submission
  * @memberof objects.Submission
  * @instance
  */
  hide () {
    return promise_wrap(this.post({uri: 'api/hide', form: {id: this.name}}).then(() => {
      this.hidden = true;
      return this;
    }));
  }
  /**
  * Unhides this Submission, allowing it to reappear on most Listings.
  * @returns {Promise} The updated version of this Submission
  * @memberof objects.Submission
  * @instance
  */
  unhide () {
    return promise_wrap(this.post({uri: 'api/unhide', form: {id: this.name}}).then(() => {
      this.hidden = false;
      return this;
    }));
  }
  /**
  * Locks this Submission, preventing new comments from being posted on it.
  * @returns {Promise} The updated version of this Submission
  * @memberof objects.Submission
  * @instance
  */
  lock () {
    return promise_wrap(this.post({uri: 'api/lock', form: {id: this.name}}).then(() => {
      this.locked = true;
      return this;
    }));
  }
  /**
  * Unlocks this Submission, allowing comments to be posted on it again.
  * @returns {Promise} The updated version of this Submission
  * @memberof objects.Submission
  * @instance
  */
  unlock () {
    return promise_wrap(this.post({uri: 'api/unlock', form: {id: this.name}}).then(() => {
      this.locked = false;
    }).return(this));
  }
  /**
  * Marks this Submission as NSFW (Not Safe For Work).
  * @returns {Promise} The updated version of this Submission
  * @memberof objects.Submission
  * @instance
  */
  mark_nsfw () {
    return promise_wrap(this.post({uri: 'api/marknsfw', form: {id: this.name}}).then(() => {
      this.over_18 = true;
    }).return(this));
  }
  /**
  * Unmarks this Submission as NSFW (Not Safe For Work).
  * @returns {Promise} The updated version of this Submission
  * @memberof objects.Submission
  * @instance
  */
  unmark_nsfw () {
    return promise_wrap(this.post({uri: 'api/unmarknsfw', form: {id: this.name}}).then(() => {
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
    return promise_wrap(this.post({
      uri: 'api/set_contest_mode',
      form: {api_type: 'json', state, id: this.name}
    }).return(this));
  }
  /**
  * Enables contest mode for this Submission.
  * @returns {Promise} The updated version of this Submission
  * @memberof objects.Submission
  * @instance
  */
  enable_contest_mode () {
    return this._set_contest_mode_enabled(true);
  }
  /**
  * Disables contest mode for this Submission.
  * @returns {Promise} The updated version of this Submission
  * @memberof objects.Submission
  * @instance
  */
  disable_contest_mode () {
    return this._set_contest_mode_enabled(false);
  }
  _set_stickied({state, num}) {
    return promise_wrap(this.post({
      uri: 'api/set_subreddit_sticky',
      form: {api_type: 'json', state, num, id: this.name}
    }).then(() => {
      this.stickied = state;
    }).return(this));
  }
  /**
  * Stickies this Submission.
  * @param {object} [options]
  * @param {number} [options.num=1] The sticky slot to put this submission in; this should be either 1 or 2.
  * @returns {Promise} The updated version of this Submission
  * @memberof objects.Submission
  * @instance
  */
  sticky (options = {num: 1}) {
    return this._set_stickied({state: true, num: options.num});
  }
  /**
  * Unstickies this Submission.
  * @returns {Promise} The updated version of this Submission
  * @memberof objects.Submission
  * @instance
  */
  unsticky () {
    return this._set_stickied({state: false});
  }
  /**
  * Sets the suggested comment sort method on this Submission
  * @param {string} sort The suggested sort method. This should be one of
  <pre><code>confidence, top, new, controversial, old, random, qa, blank</code></pre>
  * @returns {Promise} The updated version of this Submission
  * @memberof objects.Submission
  * @instance
  */
  set_suggested_sort (sort) {
    return promise_wrap(this.post({uri: 'api/set_suggested_sort', form: {api_type: 'json', id: this.name, sort}}).then(() => {
      this.suggested_sort = sort;
    }).return(this));
  }
  /**
  * Marks this submission as 'visited'.
  * @returns {Promise} The updated version of this Submission
  * @memberof objects.Submission
  * @instance
  */
  mark_as_read () { // Requires reddit gold
    return promise_wrap(this.post({uri: 'api/store_visits', form: {links: this.name}}).return(this));
  }
  /**
  * Gets a Listing of other submissions on reddit that had the same link as this one.
  * @returns {Promise} A Listing of other Submission objects
  * @memberof objects.Submission
  * @instance
  */
  get_duplicates () {
    return this.get({uri: `duplicates/${this.name}`});
  }
  /**
  * Gets a Listing of Submissions that are related to this one.
  * @returns {Promise} A Listing of other Submission objects
  * @memberof objects.Submission
  * @instance
  */
  get_related () {
    return this.get({uri: `related/${this.name}`});
  }
};

objects.PrivateMessage = class PrivateMessage extends objects.RedditContent {
  constructor (options, _ac, has_fetched) {
    super(options, _ac, has_fetched);
  }
  get _uri () {
    return `message/messages/${this.id}`;
  }
};

/**
* A class representing a subreddit
* @extends RedditContent
*/
objects.Subreddit = class Subreddit extends objects.RedditContent {
  constructor (options, _ac, has_fetched) {
    super(options, _ac, has_fetched);
  }
  get _uri () {
    return `r/${this.display_name}/about`;
  }
  /**
  * Gets the list of moderators on this subreddit.
  * @returns {Promise} An Array of RedditUsers representing the moderators of this subreddit
  * @memberof objects.Subreddit
  * @instance
  */
  get_moderators () {
    return this._ac.get(`r/${this.display_name}/about/moderators`);
  }
  _delete_flair_templates ({flair_type}) {
    return this.post({uri: `r/${this.display_name}/api/clearflairtemplates`, form: {api_type: 'json', flair_type}});
  }
  /**
  * Deletes all of this subreddit's user flair templates
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @memberof objects.Subreddit
  * @instance
  */
  delete_all_user_flair_templates () {
    return this._delete_flair_templates({flair_type: 'USER_FLAIR'});
  }
  /**
  * Deletes all of this subreddit's link flair templates
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @memberof objects.Subreddit
  * @instance
  */
  delete_all_link_flair_templates () {
    return this._delete_flair_templates({flair_type: 'LINK_FLAIR'});
  }
  /**
  * Deletes one of this subreddit's flair templates
  * @param {object} options
  * @param {string} options.flair_template_id The ID of the template that should be deleted
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @memberof objects.Subreddit
  * @instance
  */
  delete_flair_template (options) {
    return this.post({
      uri: `r/${this.display_name}/api/deleteflairtemplate`,
      form: {api_type: 'json', flair_template_id: options.flair_template_id}
    });
  }
  _create_flair_template ({text, css_class, flair_type, text_editable = false}) {
    return this.post({
      uri: `r/${this.display_name}/api/flairtemplate`,
      form: {api_type: 'json', text, css_class, flair_type, text_editable}
    });
  }
  /**
  * Creates a new user flair template for this subreddit
  * @param {object} options
  * @param {string} options.text The flair text for this template
  * @param {string} [options.css_class=''] The CSS class for this template
  * @param {boolean} [options.text_editable=false] Determines whether users should be able to edit their flair text
  when it has this template
  * @memberof objects.Subreddit
  * @instance
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
  * @memberof objects.Subreddit
  * @instance
  */
  create_link_flair_template (options) {
    return this._create_flair_template(_.assign(options, {flair_type: 'LINK_FLAIR'}));
  }
  _get_flair_options ({name, link} = {}) { // TODO: Add shortcuts for this on RedditUser and Submission
    return this.post({uri: `r/${this.display_name}/api/flairselector`, form: {name, link}});
  }
  /**
  * Gets the flair templates for a given link.
  * @param {string} link_id The link's base36 ID
  * @returns {Promise} An Array of flair template options
  * @memberof objects.Subreddit
  * @instance
  */
  get_link_flair_options (link_id) {
    return this._get_flair_options({link: link_id});
  }
  /**
  * Gets the list of user flair templates on this subreddit.
  * @returns {Promise} An Array of user flair templates
  * @memberof objects.Subreddit
  * @instance
  */
  get_user_flair_templates () {
    return this._get_flair_options().choices;
  }
  /**
  * Assigns flair to a user or submission.
  * @param {object} options
  * @param {string} [options.link_id] The base36 ID of the submisison. (Omit this parameter if assigning flair to a user.)
  * @param {string} [options.name] The name of the user whose flair is being assigned. (Omit this parameter if assigning
  flair to a submission.)
  * @param {string} [options.text=""] The flair text that should be assigned
  * @param {string} [options.css_class=""] The flair CSS class that should be assigned
  * @returns {Promise} A Promise that fulfills when this request is complete
  * @memberof objects.Subreddit
  * @instance
  */
  set_flair (options) {
    return this.post({uri: `r/${this.display_name}/api/flair`, form: {
      api_type: 'json',
      link: options.link_id,
      name: options.name,
      text: options.text || '',
      css_class: options.css_class || ''
    }});
  }
  /**
  * Clears a user's flair on this subreddit.
  * @param {string} name The user's name
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @memberof objects.Subreddit
  * @instance
  */
  delete_user_flair (name) {
    return this.post({uri: `r/${this.display_name}/api/deleteflair`, form: {api_type: 'json', name}});
  }
  /**
  * Gets a user's flair on this subreddit.
  * @param {string} name The user's name
  * @returns {Promise} An object representing the user's flair
  * @memberof objects.Subreddit
  * @instance
  */
  get_user_flair (name) {
    return this._get_flair_options({name}).current;
  }
  _set_flair_from_csv (flair_csv) {
    return this.post({uri: `r/${this.display_name}/api/flaircsv`, form: {flair_csv}});
  }
  /**
  * Sets multiple user flairs at the same time
  * @param {object[]} flair_array
  * @param {string} flair_array[].name A user's name
  * @param {string} flair_array[].text The flair text to assign to this user
  * @param {string} flair_array[].css_class The flair CSS class to assign to this user
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @memberof objects.Subreddit
  * @instance
  */
  set_multiple_user_flairs (flair_array) {
    let requests = [];
    while (flair_array.length > 0) {
      // The endpoint only accepts at most 100 lines of csv at a time, so split the array into chunks of 100.
      requests.push(this._set_flair_from_csv(flair_array.splice(0, 100).map(item =>
        (`${item.name},${item.text || ''},${item.css_class || ''}`)).join('\n')
      ));
    }
    return promise_wrap(Promise.all(requests));
  }
  /**
  * Gets a Listing of all user flairs on this subreddit.
  * @returns {Promise} A Listing containing user flairs
  * @memberof objects.Subreddit
  * @instance
  */
  get_user_flair_list () {
    return this.get({uri: `r/${this.display_name}/api/flairlist`}).users;
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
  * @memberof objects.Subreddit
  * @instance
  */
  configure_flair (options) {
    return this.post({
      uri: `r/${this.display_name}/api/flairconfig`,
      form: {
        api_type: 'json',
        flair_enabled: options.user_flair_enabled,
        flair_position: options.user_flair_position,
        flair_self_assign_enabled: options.user_flair_self_assign_enabled,
        link_flair_position: options.link_flair_position,
        link_flair_self_assign_enabled: options.link_flair_self_assign_enabled
      }
    });
  }
  _set_my_flair_visibility (flair_enabled) {
    return this.post({uri: `r/${this.display_name}/api/setflairenabled`, form: {api_type: 'json', flair_enabled}});
  }
  /**
  * Makes the requester's flair visible on this subreddit.
  * @returns {Promise} A Promise that will resolve when the request is complete
  * @memberof objects.Subreddit
  * @instance
  */
  show_my_flair () {
    return this._set_my_flair_visibility(true);
  }
  /**
  * Makes the requester's flair invisible on this subreddit.
  * @returns {Promise} A Promise that will resolve when the request is complete
  * @memberof objects.Subreddit
  * @instance
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
  * @memberof objects.Subreddit
  * @instance
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
  * @memberof objects.Subreddit
  * @instance
  */
  submit_link (options) {
    return this._ac.submit_link(_.assign(options, {subreddit_name: this.display_name}));
  }
  /**
  * Gets a Listing of hot posts on this subreddit.
  * @returns {Promise} A Listing containing the retrieved submissions
  * @memberof objects.Subreddit
  * @instance
  */
  get_hot () {
    return this._ac.get_hot(this.display_name);
  }
  /**
  * Gets a Listing of new posts on this subreddit.
  * @returns {Promise} A Listing containing the retrieved submissions
  * @memberof objects.Subreddit
  * @instance
  */
  get_new () {
    return this._ac.get_new(this.display_name);
  }
  /**
  * Gets a Listing of new comments on this subreddit.
  * @returns {Promise} A Listing containing the retrieved comments
  * @memberof objects.Subreddit
  * @instance
  */
  get_new_comments () {
    return this._ac.get_new_comments(this.display_name);
  }
  /**
  * Gets a single random Submission from this subreddit.
  * @returns {Promise} The retrieved Submission object
  * @memberof objects.Subreddit
  * @instance
  */
  get_random_submission () {
    return this._ac.get_random_submission(this.display_name);
  }
  /**
  * Gets a Listing of top posts on this subreddit.
  * @param {object} [options={}]
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  <pre><code>hour, day, week, month, year, all</code></pre>
  * @returns {Promise} A Listing containing the retrieved submissions
  * @memberof objects.Subreddit
  * @instance
  */
  get_top (options) {
    return this._ac.get_top(this.display_name, options);
  }
  /**
  * Gets a Listing of controversial posts on this subreddit.
  * @param {object} [options={}]
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  <pre><code>hour, day, week, month, year, all</code></pre>
  * @returns {Promise} A Listing containing the retrieved submissions
  * @memberof snoowrap
  * @instance
  */
  get_controversial (options) {
    return this._ac.get_controversial(this.display_name, options);
  }
};

objects.Trophy = class Trophy extends objects.RedditContent {
  constructor (options, _ac, has_fetched) {
    super(options, _ac, has_fetched);
  }
};

objects.PromoCampaign = class PromoCampaign extends objects.RedditContent {
  constructor (options, _ac, has_fetched) {
    super(options, _ac, has_fetched);
  }
};

/**
* A class representing a list of content. This is a subclass of the native Array object, so it has all the properties of
an Array (length, forEach, etc.) in addition to some added methods. At any given time, each Listing has fetched a specific
number of items, and that number will be its length. However, if a value greater than the length is accessed (e.g. with
<pre><code>some_listing[very_high_index]</code></pre>), then the Listing will automatically fetch more items until either
(a) it has an item at the requested index, or (b) it runs out of items to fetch. In the meantime, the expression that
referenced the high index will return a Promise for that value, which will get resolved after the entries are fetched.
*/
objects.Listing = class Listing extends Array {
  constructor ({children = [], query = {}, show_all = true, limit, _transform = _.identity,
      uri, method, after, before, _is_comment_list = false} = {}, _ac) {
    super();
    _.assign(this, children);
    let constant_params = _.assign(query, {show: show_all ? 'all' : undefined, limit});
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
    return new Proxy(this, {get: (target, key, thisArg) => {
      if (!isNaN(key) && key >= target.length) {
        return promise_wrap(target.fetch_more(key - target.length + 1).get(key));
      }
      return Reflect.get(target, key, thisArg);
    }});
  }
  get _requester () {
    return this._ac._oauth_requester.defaults({uri: this.uri, method: this.method, qs: this.constant_params});
  }
  /**
  * This is a getter that is true if there are no more items left to fetch, and false otherwise.
  * @type {number}
  * @memberof objects.Listing
  * @instance
  */
  get is_finished () {
    if (this._is_comment_list) {
      return !this._more || !this._more.children.length;
    }
    return !!this.uri && this.after === null && this.before === null;
  }
  /**
  * Fetches some more items and adds them to this Listing.
  * @param {number} [amount] The number of items to fetch. If this is not defined, one more "batch" of items is fetched;
  the size of a batch depends on the type of Listing this is, as well as the requester's reddit preferences.
  * @returns {Promise} An updated version of this listing with <pre><code>amount</code></pre> items added on.
  * @memberof objects.Listing
  * @instance
  */
  fetch_more (amount = this.limit) {
    if (typeof amount !== 'number') {
      throw new errors.InvalidMethodCallError('Failed to fetch listing. (amount must be a Number.)');
    }
    if (amount <= 0 || this.is_finished) {
      return [];
    }
    if (this._is_comment_list) {
      return this._fetch_more_comments(amount).return(this);
    }
    if (!this.uri) {
      return [];
    }
    return this._fetch_more_regular(amount).return(this);
  }
  async _fetch_more_regular (amount) {
    let limit_for_request = Math.min(amount, this.limit) || this.limit;
    let request_params = {qs: {after: this.after, before: this.before, limit: limit_for_request}};
    let response = await this._requester(request_params).then(this._transform);
    this.push(..._.toArray(response));
    this.before = response.before;
    this.after = response.after;
    return response.slice(0, amount).concat(await this.fetch_more(amount - response.length));
  }
  /* Pagination for comments works differently than it does for most other things; rather than sending a link to the next page
  within a listing, reddit sends the last comment in the list as as a `more` object, with links to all the remaining comments
  in the thread. */
  async _fetch_more_comments (...args) {
    let new_comments = this._more ? await this._more.fetch_more(...args) : [];
    this.push(..._.toArray(new_comments));
    return new_comments;
  }
  /**
  * Fetches all of the items in this Listing, only stopping when there are none left.
  * @returns {Promise} The updated version of this Listing. Keep in mind that this method has the potential to exhaust your
  ratelimit quickly if the Listing doesn't have a clear end (e.g. with posts on the front page), so use it with discretion.
  * @memberof objects.Listing
  * @instance
  */
  fetch_all () {
    return this.fetch_more(Infinity);
  }
  inspect () {
    return `<${constants.MODULE_NAME}.objects.${this.constructor.name}> ${util.inspect(_.toArray(this))}`;
  }
};

objects.more = class more extends objects.RedditContent {
  constructor (properties, _ac) {
    super(properties, _ac);
  }
  /* Requests to /api/morechildren are capped at 20 comments at a time, but requests to /api/info are capped at 100, so
  it's easier to send to the latter. The disadvantage is that comment replies are not automatically sent from requests
  to /api/info. */
  async fetch_more (amount) {
    if (isNaN(amount)) {
      throw new errors.InvalidMethodCallError('Failed to fetch listing. (`amount` must be a Number.)');
    }
    if (amount <= 0 || this.children.length === 0) {
      return [];
    }
    let ids_for_this_request = this.children.splice(0, Math.min(amount, 100)).map(id => (`t1_${id}`));
    // Requests are capped at 100 comments. Send lots of requests recursively to get the comments, then concatenate them.
    // (This speed-requesting is only possible with comment listings since the entire list of ids is present initially.)
    let promise_for_this_batch = this.get({uri: 'api/info', qs: {id: ids_for_this_request.join(',')}});
    let promise_for_remaining_items = this.fetch_more(amount - ids_for_this_request.length);
    return _.toArray(await promise_for_this_batch).concat(await promise_for_remaining_items);
  }
};

objects.UserList = class UserList {
  constructor (options, _ac) {
    return options.children.map(user => {
      return new objects.RedditUser(user, _ac);
    });
  }
};

objects.KarmaList = class KarmaList extends objects.RedditContent {
  constructor (options, _ac) {
    super(options, _ac);
  }
};

objects.TrophyList = class TrophyList extends objects.RedditContent {
  constructor (options, _ac) {
    super(options, _ac);
  }
};

helpers._populate = (response_tree, _ac) => {
  if (typeof response_tree === 'object' && response_tree !== null) {
    // Map {kind: 't2', data: {name: 'some_username', ... }} to a RedditUser (e.g.) with the same properties
    if (_.keys(response_tree).length === 2 && response_tree.kind) {
      let remainder_of_tree = helpers._populate(response_tree.data, _ac);
      if (constants.KINDS[response_tree.kind]) {
        return new objects[constants.KINDS[response_tree.kind]](remainder_of_tree, _ac, true);
      }
      _ac.warn(`Unknown type ${response_tree.kind}. This may be a bug; please report it at ${constants.ISSUE_REPORT_LINK}.`);
      return remainder_of_tree;
    }
    let mapFunction = Array.isArray(response_tree) ? _.map : _.mapValues;
    let result = mapFunction(response_tree, (value, key) => {
      // Map {..., author: 'some_username', ...} to {..., author: RedditUser {}, ... } (e.g.)
      if (_.includes(constants.USER_KEYS, key) && value !== null) {
        return new objects.RedditUser({name: value}, _ac);
      }
      if (_.includes(constants.SUBREDDIT_KEYS, key) && value !== null) {
        return new objects.Subreddit({display_name: value}, _ac);
      }
      return helpers._populate(value, _ac);
    });
    if (result.length === 2 && result[0] instanceof objects.Listing && result[0][0] instanceof objects.Submission &&
        result[1] instanceof objects.Listing) {
      helpers._assign_proxy(result[0][0], {comments: result[1]});
      return result[0][0];
    }
    return result;
  }
  return response_tree;
};
helpers._assign_proxy = (proxied_object, values) => {
  /* The line below is equivalent to _.assign(this, response);, but _.assign ends up triggering warning messages when
  used on Proxies, since the patched globals from harmony-reflect aren't applied to lodash. This won't be a problem once
  Proxies are correctly implemented natively. https://github.com/tvcutsem/harmony-reflect#dependencies */
  _.forIn(values, (value, key) => {proxied_object[key] = value;});
};

snoowrap.objects = objects;
snoowrap.helpers = helpers;
assign_mixins(snoowrap);
module.exports = snoowrap;
