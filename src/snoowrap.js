'use strict';
require('harmony-reflect'); // temp dependency until v8 implements Proxies properly
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
  * @param {object} $0 An Object containing credentials.  This should have the properties (a) <code>user_agent</code>,
  <code>client_id</code>, <code>client_secret</code>, and <code>refresh_token</code>, <strong>or</strong>
  (b) <code>user_agent</code> and <code>access_token</code>.
  * @param {string} $0.user_agent A unique description of what your app does
  * @param {string} [$0.client_id] The client ID of your app (assigned by reddit)
  * @param {string} [$0.client_secret] The client secret of your app (assigned by reddit)
  * @param {string} [$0.refresh_token] A refresh token for your app. You will need to get this from reddit beforehand.
  * @param {string} [$0.access_token] An access token for your app. If this is provided, then the
  client ID/client secret/refresh token are not required. Note that all access tokens expire one hour after being
  generated; if you want to retain access for longer than that, provide the other credentials instead.
  * @memberof snoowrap
  */
  constructor({user_agent, client_id, client_secret, refresh_token, access_token}) {
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
    this.config = require('./default_config');
    this._throttle = Promise.resolve();
    constants.HTTP_VERBS.forEach(type => {
      Object.defineProperty(this, type, {get: () => this._oauth_requester.defaults({method: type})});
    });
  }
  get _base_client_requester () {
    return request.defaults({
      auth: {user: this.client_id, pass: this.client_secret},
      headers: {'user-agent': this.user_agent}
    });
  }
  async _update_access_token () {
    const token_info = await this._base_client_requester.post({
      url: `https://www.${this.config.endpoint_domain}/api/v1/access_token`,
      form: {grant_type: 'refresh_token', refresh_token: this.refresh_token}
    });
    this.access_token = token_info.access_token;
    this.token_expiration = moment().add(token_info.expires_in, 'seconds');
    this.scope = token_info.scope.split(' ');
  }
  get _oauth_requester () {
    const default_requester = request.defaults({
      headers: {'user-agent': this.user_agent},
      baseUrl: `https://oauth.${this.config.endpoint_domain}`,
      qs: {raw_json: 1}, // This tells reddit to unescape html characters, e.g. it will send '<' instead of '&lt;'
      resolveWithFullResponse: true,
      transform: (body, response) => {
        this.ratelimit_remaining = response.headers['x-ratelimit-remaining'];
        this.ratelimit_reset_point = moment().add(response.headers['x-ratelimit-reset'], 'seconds');
        const populated = helpers._populate(body, this);
        if (populated instanceof objects.Listing) {
          populated.uri = response.request.uri.path;
        }
        return populated;
      }
    });
    const handle_request = async (requester, self, args, attempts = 0) => {
      if (this.ratelimit_remaining < 1 && this.ratelimit_reset_point.isAfter()) {
        const seconds_until_expiry = this.ratelimit_reset_point.diff(moment(), 'seconds');
        if (this.config.continue_after_ratelimit_error) {
          this.warn(errors.RateLimitWarning(seconds_until_expiry));
          await Promise.delay(this.ratelimit_reset_point.diff());
        } else {
          throw new errors.RateLimitError(seconds_until_expiry);
        }
      }
      /* this._throttle is a timer that gets reset to this.config.request_delay whenever a request is sent.
      This ensures that requests are ratelimited and that no requests are lost. The await statement is wrapped
      in a loop to make sure that if the throttle promise resolves while multiple requests are pending, only
      one of the requests will be sent, and the others will await the throttle again. (The loop is non-blocking
      due to its await statement.) */
      while (!this._throttle.isFulfilled()) {
        await this._throttle;
      }
      this._throttle = Promise.delay(this.config.request_delay);

      try {
        // If the access token has expired (or will expire in the next 10 seconds), refresh it.
        if (this.refresh_token && (!this.access_token || this.token_expiration.isBefore())) {
          await this._update_access_token();
        }
        // Send the request and return the response.
        return await requester.defaults({auth: {bearer: this.access_token}})(...args);
      } catch (err) {
        if (attempts + 1 < this.config.max_retry_attempts && _.includes(this.config.retry_error_codes, err.statusCode)) {
          this.warn(`Warning: Received status code ${err.statusCode} from reddit. Retrying request...`);
          return handle_request(requester, self, args, attempts + 1);
        }
        throw err;
      }
    };
    return new Proxy(default_requester, {apply: (...args) => promise_wrap(handle_request(...args))});
  }
  _new_object(object_type, content, has_fetched) {
    return new objects[object_type](content, this, has_fetched);
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
    const keys_for_hidden_values = ['client_secret', 'refresh_token', 'access_token'];
    const formatted = _.mapValues(this, (value, key) => {
      if (_.includes(keys_for_hidden_values, key)) {
        return value && '(redacted)';
      }
      if (value instanceof moment) {
        return value.format();
      }
      return value;
    });
    return `<${constants.MODULE_NAME} authenticated client> ${util.inspect(formatted)}`;
  }
  warn (...args) {
    if (!this.config.suppress_warnings) {
      console.warn(...args);
    }
  }
  /**
  * Gets information on the requester's own user profile.
  * @returns {objects.RedditUser} A RedditUser object corresponding to the requester's profile
  * @memberof snoowrap
  * @instance
  */
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
  * Gets the identifier (a hex string) for a new captcha image.
  * @returns {Promise} A Promise that resolves with a string
  * @memberof snoowrap
  * @instance
  */
  get_new_captcha_identifier () {
    return this.post({uri: 'api/new_captcha', form: {api_type}}).json.data.iden;
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
  * Gets an array of categories that items can be saved it. (Requires reddit gold)
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
      sendreplies: send_replies, sr: subreddit_name, kind, resubmit, text, title, url}})).json.data.things[0];
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
  <code>hour, day, week, month, year, all</code>
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
  <code>hour, day, week, month, year, all</code>
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
    return await this.post({uri: `r/${await subreddit_name}/api/selectflair`, form: {
      api_type, flair_template_id, link, name, text}
    });
  }
  async _assign_flair ({css_class, link, name, text, subreddit_name}) {
    return await this.post({uri: `r/${await subreddit_name}/api/flair`, form: {api_type, name, text, link, css_class}});
  }
  get_unread_messages ({mark = false} = {}) {
    return this.get({uri: 'message/unread', qs: {mark}});
  }
  get_inbox ({mark = false} = {}) {
    return this.get({uri: 'message/inbox', qs: {mark}});
  }
  get_modmail ({mark = false} = {}) {
    return this.get({uri: 'message/moderator', qs: {mark}});
  }
  get_sent_messages () {
    return this.get({uri: 'message/sent'});
  }
  read_all_messages () {
    return this.post({uri: 'api/read_all_messages'});
  }
  compose_message ({captcha, from_subreddit, captcha_iden, subject, text, to} = {}) {
    if (to instanceof objects.RedditUser) {
      to = to.name;
    } else if (to instanceof objects.Subreddit) {
      to = `/r/${to.display_name}`;
    }
    if (from_subreddit instanceof objects.Subreddit) {
      from_subreddit = from_subreddit.display_name;
    }
    return this.post({uri: 'api/compose', form: {
      api_type, captcha, iden: captcha_iden, from_sr: from_subreddit, subject, text, to
    }});
  }
  get_oauth_scope_list () {
    return this.get({uri: 'api/v1/scopes'});
  }
  search ({query, restrict_sr = true, sort, time, sr_detail, include_facets, type, syntax, subreddit}) {
    if (subreddit instanceof objects.Subreddit) {
      subreddit = subreddit.display_name;
    }
    return this.get({uri: `${subreddit ? `r/${subreddit}/` : ''}search`, qs: {
      include_facets, q: query, restrict_sr, sort, sr_detail, syntax, t: time, type
    }});
  }
  get_recommended_subreddits ({sr_names, omit_names}) {
    return this.get({uri: `api/recommend/sr/${sr_names.join(',')}`, qs: {omit: omit_names.join(',')}});
  }
  search_subreddits ({exact = false, include_nsfw = true, query}) {
    return this.post({uri: `api/search_reddit_names`, qs: {exact, include_over_18: include_nsfw, query}});
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
    hide_ads = true, // Only allowed for gold-exclusive subreddits
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
    wiki_edit_age,
    wiki_edit_karma,
    wikimode = 'modonly'
  }) {
    return this.post({uri: 'api/siteadmin', form: {
      allow_top, api_type, captcha, collapse_deleted_comments, comment_score_hide_mins, description, exclude_banned_modqueue,
      'header-title': header_title, hide_ads, iden: captcha_iden, lang, link_type, name, over_18, public_description,
      public_traffic, show_media, spam_comments, spam_links, spam_selfposts, sr, submit_link_label, submit_text,
      submit_text_label, suggested_comment_sort, title, type, wiki_edit_age, wiki_edit_karma, wikimode
    }});
  }
  /**
  * Creates a new subreddit.
  * @param {object} options
  * @param {string} options.name The name of the new subreddit
  * @param {string} options.title The text that should appear in the new header of the subreddit
  * @param {string} options.public_description The text that appears with this subreddit on the search page, or on the
  blocked-access page if this subreddit is private. (500 characters max)
  * @param {string} options.description The sidebar text for the subreddit. (5120 characters max)
  * @param {string} [options.submit_text=''] The text to show below the submission page (1024 characters max)
  * @param {string} [options.lang='en'] The language of the subreddit (represented as an IETF language tag)
  * @param {string} [options.type='public'] Determines who should be able to access the subreddit. This should be one of
  <code>public, private, restricted, gold_restricted, gold_only, archived, employees_only</code>.
  * @param {string} [options.link_type='any'] Determines what types of submissions are allowed on the subreddit. This should
  be one of <code>any, link, self</code>.
  * @param {string} [options.submit_link_label=undefined] Custom text to display on the button that submits a link. If
  this is omitted, the default text will be displayed.
  * @param {string} [options.submit_text_label=undefined] Custom text to display on the button that submits a selfpost. If
  this is omitted, the default text will be displayed.
  * @param {string} [options.wikimode='modonly'] Determines who can edit wiki pages on the subreddit. This should be one of
  <code>modonly, anyone, disabled</code>.
  * @param {number} [options.wiki_edit_karma=0] The minimum amount of subreddit karma needed for someone to edit this
  subreddit's wiki. (This is only relevant if <code>options.wikimode</code> is set to <code>anyone</code>.)
  * @param {number} [options.wiki_edit_age=0] The minimum account age (in days) needed for someone to edit this subreddit's
  wiki. (This is only relevant if <code>options.wikimode</code> is set to <code>anyone</code>.)
  * @param {string} [options.spam_links='high'] The spam filter strength for links on this subreddit. This should be one of
  <code>low, high, all</code>.
  * @param {string} [options.spam_selfposts='high'] The spam filter strength for selfposts on this subreddit. This should be
  one of <code>low, high, all</code>.
  * @param {string} [options.spam_comments='high'] The spam filter strength for comments on this subreddit. This should be one
  of <code>low, high, all</code>.
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
  one of <code>confidence, top, new, controversial, old, random, qa</code>.If left blank, there will be no suggested sort,
  which means that users will see the sort method that is set in their own preferences (usually <code>confidence</code>.)
  * @returns {Promise} A Promise for the newly-created subreddit object.
  * @memberof snoowrap
  * @instance
  */
  create_subreddit (options) {
    return this._create_or_edit_subreddit(options);
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
    _.without(constants.HTTP_VERBS, 'delete').forEach(type => {
      Object.defineProperty(this, type, {get: () => this._ac[type]});
    });
    return new Proxy(this, {get: (target, key) => {
      if (key in target || key === 'length' || key in Promise.prototype || target.has_fetched) {
        return target[key];
      }
      if (key === '_raw') {
        return target;
      }
      if (_.includes(constants.HTTP_VERBS, key)) {
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
    reference to an unknown property will simply return <code>undefined</code> instead of a Promise. Calling this
    on an already-fetched object will have no effect; to refresh an object, use <code>refresh()</code> instead.
    * @memberof objects.RedditContent
    * @instance
    */
    this.fetch = 'fetch' in this ? this.fetch : _.once(() => {
      return promise_wrap(this._ac.get({uri: this._uri}).then(this._transform_api_response.bind(this)).then(response => {
        helpers.assign_to_proxy(this, response);
        this.has_fetched = true;
        return this;
      }));
    });
  }
  /**
  * Refreshes this content.
  * @returns {Promise} A newly-fetched version of this content
  */
  refresh () {
    delete this.fetch;
    this._initialize_fetch_function();
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

/**
* A set of mixin functions that applies to Submissions, Comments, and PrivateMessages
* @extends objects.RedditContent
*/
objects.CreatableContent = class CreatableClass extends objects.RedditContent {
  /**
  * Removes this Comment, Submission or PrivateMessage from public listings. Also see: #delete()
  * @param {boolean} [$0.spam=false] Determines whether this should be marked as spam
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  remove ({spam = false} = {}) {
    return promise_wrap(this.post({uri: 'api/remove', form: {spam, id: this.name}}).return(this));
  }
  /**
  * Removes this Comment, Submission, or PrivateMessage and marks it as spam. Equivalent to #remove({spam: true})
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
    return promise_wrap(this.post({uri: 'api/approve', form: {id: this.name}}).return(this));
  }
  /**
  * Reports this content anonymously to subreddit moderators (for Comments and Submissions)
  or to the reddit admins (for PrivateMessages)
  * @param {string} [$0.reason=] The reason for the report
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  report ({reason} = {}) {
    return promise_wrap(this.post({uri: 'api/report', form: {
      api_type, reason: 'other', other_reason: reason, thing_id: this.name
    }}).return(this));
  }
  /**
  * Ignores reports on this Comment, Submission, or PrivateMessage
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  ignore_reports () {
    return promise_wrap(this.post({uri: 'api/ignore_reports', form: {id: this.name}}).return(this));
  }
  /**
  * Unignores reports on this Comment, Submission, or PrivateMessages
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  unignore_reports () {
    return promise_wrap(this.post({uri: 'api/unignore_reports', form: {id: this.name}}).return(this));
  }
  /**
  * Submits a new reply to this object. (This takes the form of a new Comment if this object is a Submission/Comment, or a
  new PrivateMessage if this object is a PrivateMessage.)
  * @param {string} text The content of the reply, in raw markdown text
  * @returns {Promise} A Promise that fulfills with the newly-created reply
  */
  reply (text) {
    return this.post({uri: 'api/comment',form: {api_type, text, thing_id: this.name}}).json.data.things[0];
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
    return this.post({uri: 'api/vote', form: {dir: direction, id: this.name}});
  }
  /**
  * Upvotes this Comment or Submission.
  * @returns {Promise} A Promise that fulfills when the request is complete.<br><br>
  <strong>Note: votes must be cast by humans.</strong> That is, API clients proxying a human's action one-for-one are OK, but
  bots deciding how to vote on content or amplifying a human's vote are not. See the
  <a href="https://reddit.com/rules">reddit rules</a> for more details on what constitutes vote cheating. (This guideline
  is quoted from <a href="https://www.reddit.com/dev/api#POST_api_vote">the official reddit API documentation page</a>.)
  */
  upvote () {
    return this._vote(1);
  }
  /**
  * Downvotes this Comment or Submission.
  * @returns {Promise} A Promise that fulfills when the request is complete.<br><br>
  <strong>Note: votes must be cast by humans.</strong> That is, API clients proxying a human's action one-for-one are OK, but
  bots deciding how to vote on content or amplifying a human's vote are not. See the
  <a href="https://reddit.com/rules">reddit rules</a> for more details on what constitutes vote cheating. (This guideline
  is quoted from <a href="https://www.reddit.com/dev/api#POST_api_vote">the official reddit API documentation page</a>.)
  */
  downvote () {
    return this._vote(-1);
  }
  /**
  * Removes any existing vote on this Comment or Submission.
  * @returns {Promise} A Promise that fulfills when the request is complete.<br><br>
  <strong>Note: votes must be cast by humans.</strong> That is, API clients proxying a human's action one-for-one are OK, but
  bots deciding how to vote on content or amplifying a human's vote are not. See the
  <a href="https://reddit.com/rules">reddit rules</a> for more details on what constitutes vote cheating. (This guideline
  is quoted from <a href="https://www.reddit.com/dev/api#POST_api_vote">the official reddit API documentation page</a>.)
  */
  unvote () {
    return this._vote(0);
  }
  /**
  * Saves this Comment or Submission (i.e. adds it to the list at reddit.com/saved)
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  save () {
    return promise_wrap(this.post({uri: 'api/save', form: {id: this.name}}).then(() => {
      this.saved = true;
      return this;
    }));
  }
  /**
  * Unsaves this item
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  unsave () {
    return promise_wrap(this.post({uri: 'api/unsave', form: {id: this.name}}).then(() => {
      this.saved = false;
      return this;
    }));
  }
  /**
  * Distinguishes this Comment or Submission with a sigil.
  * @param {boolean|string} [$0.status=true] Determines how the item should be distinguished.
  <code>true</code> (default) signifies that the item should be moderator-distinguished, and
  <code>false</code> signifies that the item should not be distinguished. Passing a string (e.g.
  <code>admin</code>) will cause the item to get distinguished with that string, if possible.
  * @param {boolean} [$0.sticky=false] Determines whether this item should be stickied in addition to being
  distinguished. (This only applies to comments; to sticky a submission, use the {@link objects.Submission.sticky} method.)
  * @returns {Promise} A Promise that fulfills when the request is complete.
  */
  distinguish ({status = true, sticky = false} = {}) {
    return promise_wrap(this._ac.post({uri: 'api/distinguish', form: {
      api_type,
      how: status === true ? 'yes' : status === false ? 'no' : status,
      sticky: sticky,
      id: this.name
    }}).then(response => {
      helpers.assign_to_proxy(this, response.json.data.things[0]);
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
    return promise_wrap(this.post({
      uri: 'api/editusertext',
      form: {api_type, text: updated_text, thing_id: this.name}
    }).then(response => {
      helpers.assign_to_proxy(this, response.json.data.things[0]);
      return this;
    }));
  }
  /**
  * Gives reddit gold to the author of this Comment or Submission.
  * @returns {Promise} A Promise that fullfills with this Comment/Submission when this request is complete
  */
  gild () {
    return promise_wrap(this.post({uri: `api/v1/gold/gild/${this.name}`}).return(this));
  }
  /**
  * Deletes this Comment or Submission
  * @returns {Promise} A Promise that fulfills with this Comment/Submission when this request is complete
  */
  delete () {
    return promise_wrap(this.post({uri: 'api/del', form: {id: this.name}}).return(this));
  }
  _set_inbox_replies_enabled(state) {
    return this.post({uri: 'api/sendreplies', form: {state, id: this.name}});
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
    response_obj[0].replies = new objects.Listing({uri: replies_uri, query: replies_query, _transform}, this._ac);
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
  give_gold(months) {
    /* Ideally this would allow for more than 36 months by sending multiple requests, but I don't have the resources to test
    that code, and it's probably better that such a big investment be deliberate anyway. */
    if (typeof months !== 'number' || months < 1 || months > 36) {
      throw new errors.InvalidMethodCallError('Invalid argument to RedditUser.give_gold; `months` must be between 1 and 36.');
    }
    return this.post({uri: `api/v1/gold/give/${this.name}`, form: {months}});
  }
  /** Assigns flair to this user on a given subreddit (as a moderator).
  * @param {object} options
  * @param {string} options.subreddit_name The subreddit that flair should be assigned on
  * @param {string} [options.text=""] The text that the user's flair should have
  * @param {string} [options.css_class=""] The CSS class that the user's flair should have
  * @returns {Promise} A Promise that fulfills with the current user after the request is complete
  */
  assign_user_flair (options) {
    return promise_wrap(this._ac._assign_flair(_.assign(options, {name: this.name})).return(this));
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
    return promise_wrap(this.post({uri: 'api/hide', form: {id: this.name}}).then(() => {
      this.hidden = true;
      return this;
    }));
  }
  /**
  * Unhides this Submission, allowing it to reappear on most Listings.
  * @returns {Promise} The updated version of this Submission
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
  */
  unlock () {
    return promise_wrap(this.post({uri: 'api/unlock', form: {id: this.name}}).then(() => {
      this.locked = false;
    }).return(this));
  }
  /**
  * Marks this Submission as NSFW (Not Safe For Work).
  * @returns {Promise} The updated version of this Submission
  */
  mark_nsfw () {
    return promise_wrap(this.post({uri: 'api/marknsfw', form: {id: this.name}}).then(() => {
      this.over_18 = true;
    }).return(this));
  }
  /**
  * Unmarks this Submission as NSFW (Not Safe For Work).
  * @returns {Promise} The updated version of this Submission
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
  _set_stickied({state, num}) {
    return promise_wrap(this.post({
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
  <code>confidence, top, new, controversial, old, random, qa, blank</code>
  * @returns {Promise} The updated version of this Submission
  */
  set_suggested_sort (sort) {
    return promise_wrap(this.post({uri: 'api/set_suggested_sort', form: {api_type, id: this.name, sort}}).then(() => {
      this.suggested_sort = sort;
    }).return(this));
  }
  /**
  * Marks this submission as 'visited'.
  * @returns {Promise} The updated version of this Submission
  */
  mark_as_read () { // Requires reddit gold
    return promise_wrap(this.post({uri: 'api/store_visits', form: {links: this.name}}).return(this));
  }
  /**
  * Gets a Listing of other submissions on reddit that had the same link as this one.
  * @returns {Promise} A Listing of other Submission objects
  */
  get_duplicates () {
    return this.get({uri: `duplicates/${this.name}`});
  }
  /**
  * Gets a Listing of Submissions that are related to this one.
  * @returns {Promise} A Listing of other Submission objects
  */
  get_related () {
    return this.get({uri: `related/${this.name}`});
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
  assign_link_flair (options) {
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
  template has the <code>text_editable</code> property set to <code>true</code>.)
  * @returns {Promise} A Promise that fulfills with this objects after the request is complete
  */
  select_link_flair (options) {
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
  //TODO: Get rid of the repeated code here, most of these methods are exactly the same with the exception of the URIs
  /**
  * Blocks the author of this private message.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  */
  block_author () {
    return promise_wrap(this.post({uri: 'api/block', form: {id: this.name}}).return(this));
  }
  /**
  * Marks this message as read.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  */
  mark_as_read () {
    return promise_wrap(this.post({uri: 'api/read_message', form: {id: this.name}}).return(this));
  }
  /**
  * Marks this message as unread.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  */
  mark_as_unread () {
    return promise_wrap(this.post({uri: 'api/unread_message', form: {id: this.name}}).return(this));
  }
  /**
  * Mutes the author of this message for 72 hours. This should only be used on moderator mail.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  */
  mute_author () {
    return promise_wrap(this.post({uri: 'api/mute_message_author', form: {id: this.name}}).return(this));
  }
  /**
  * Unmutes the author of this message.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  */
  unmute_author () {
    return promise_wrap(this.post({uri: 'api/unmute_message_author', form: {id: this.name}}).return(this));
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
    return this.post({uri: `r/${this.display_name}/api/clearflairtemplates`, form: {api_type, flair_type}});
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
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  delete_flair_template (options) {
    return this.post({
      uri: `r/${this.display_name}/api/deleteflairtemplate`,
      form: {api_type, flair_template_id: options.flair_template_id}
    });
  }
  _create_flair_template ({text, css_class, flair_type, text_editable = false}) {
    return this.post({
      uri: `r/${this.display_name}/api/flairtemplate`,
      form: {api_type, text, css_class, flair_type, text_editable}
    });
  }
  /**
  * Creates a new user flair template for this subreddit
  * @param {object} options
  * @param {string} options.text The flair text for this template
  * @param {string} [options.css_class=''] The CSS class for this template
  * @param {boolean} [options.text_editable=false] Determines whether users should be able to edit their flair text
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
    return this.post({uri: `r/${this.display_name}/api/deleteflair`, form: {api_type, name}});
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
    return this.post({uri: `r/${this.display_name}/api/flaircsv`, form: {flair_csv}});
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
  * Gets a Listing of all user flairs on this subreddit.
  * @returns {Promise} A Listing containing user flairs
  */
  get_user_flair_list ({user}) {
    return this.get({uri: `r/${this.display_name}/api/flairlist`, qs: {name: user}}).users;
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
    return this.post({
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
  template has the <code>text_editable</code> property set to <code>true</code>.)
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  async select_my_flair (options) {
    /* NOTE: This requires `identity` scope in addition to `flair` scope, since the reddit api needs to be passed a username.
    I'm not sure if there's a way to do this without requiring additional scope. */
    if (!this._ac.own_user_info) {
      await this._ac.get_me();
    }
    return await this._ac._select_flair(_.assign(options, {
      subreddit_name: this.display_name, name: this._ac.own_user_info.name
    }));
  }
  _set_my_flair_visibility (flair_enabled) {
    return this.post({uri: `r/${this.display_name}/api/setflairenabled`, form: {api_type, flair_enabled}});
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
  * @returns {Promise} A Listing containing the retrieved submissions
  */
  get_hot () {
    return this._ac.get_hot(this.display_name);
  }
  /**
  * Gets a Listing of new posts on this subreddit.
  * @returns {Promise} A Listing containing the retrieved submissions
  */
  get_new () {
    return this._ac.get_new(this.display_name);
  }
  /**
  * Gets a Listing of new comments on this subreddit.
  * @returns {Promise} A Listing containing the retrieved comments
  */
  get_new_comments () {
    return this._ac.get_new_comments(this.display_name);
  }
  /**
  * Gets a single random Submission from this subreddit.
  * @returns {Promise} The retrieved Submission object
  */
  get_random_submission () {
    return this._ac.get_random_submission(this.display_name);
  }
  /**
  * Gets a Listing of top posts on this subreddit.
  * @param {object} [options={}]
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  <code>hour, day, week, month, year, all</code>
  * @returns {Promise} A Listing containing the retrieved submissions
  */
  get_top (options) {
    return this._ac.get_top(this.display_name, options);
  }
  /**
  * Gets a Listing of controversial posts on this subreddit.
  * @param {object} [options={}]
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  <code>hour, day, week, month, year, all</code>
  * @returns {Promise} A Listing containing the retrieved submissions
  * @memberof snoowrap
  * @instance
  */
  get_controversial (options) {
    return this._ac.get_controversial(this.display_name, options);
  }
  get_moderation_log ({mod, type} = {}) {
    return this.get({uri: `r/${this.display_name}/about/log`, qs: {mod, type}});
  }
  get_reports ({only} = {}) {
    return this.get({uri: `r/${this.display_name}/about/reports`, qs: {only}});
  }
  get_spam ({only} = {}) {
    return this.get({uri: `r/${this.display_name}/about/spam`, qs: {only}});
  }
  get_modqueue ({only} = {}) {
    return this.get({uri: `r/${this.display_name}/about/modqueue`, qs: {only}});
  }
  get_unmoderated ({only} = {}) {
    return this.get({uri: `r/${this.display_name}/about/unmoderated`, qs: {only}});
  }
  get_edited ({only} = {}) {
    return this.get({uri: `r/${this.display_name}/about/edited`, qs: {only}});
  }
  accept_moderator_invite () {
    return this.post({uri: `r/${this.display_name}/api/accept_moderator_invite`, form: {api_type}});
  }
  async leave_contributor () {
    return await this.post({uri: `api/leavecontributor`, form: {id: await this.name}});
  }
  async leave_moderator () {
    return await this.post({uri: `api/leavemoderator`, form: {id: await this.name}});
  }
  get_subreddit_stylesheet () {
    return this.get({uri: `r/${this.display_name}/stylesheet`, json: false, transform: _.identity});
  }
  search (options) {
    return this._ac.search(_.assign(options, {subreddit: this, restrict_sr: true}));
  }
  get_banned_users ({user} = {}) {
    return this.get({uri: `r/${this.display_name}/about/banned`, qs: {user}});
  }
  get_muted_users ({user} = {}) {
    return this.get({uri: `r/${this.display_name}/about/muted`, qs: {user}});
  }
  get_wikibanned_users ({user} = {}) {
    return this.get({uri: `r/${this.display_name}/about/wikibanned`, qs: {user}});
  }
  get_contributors ({user} = {}) {
    return this.get({uri: `r/${this.display_name}/about/contributors`, qs: {user}});
  }
  get_wiki_contributors ({user} = {}) {
    return this.get({uri: `r/${this.display_name}/about/wikicontributors`, qs: {user}});
  }
  /**
  * Gets the list of moderators on this subreddit.
  * @param {string} [$0.user=] The name of a user to find in the list
  * @returns {Promise} An Array of RedditUsers representing the moderators of this subreddit
  */
  get_moderators ({user} = {}) {
    return this.get({uri: `r/${this.display_name}/about/moderators`, qs: {user}});
  }
  delete_banner () {
    return this.post({uri: `r/${this.display_name}/api/delete_sr_banner`, form: {api_type}});
  }
  delete_header () {
    return this.post({uri: `r/${this.display_name}/api/delete_sr_header`, form: {api_type}});
  }
  delete_icon () {
    return this.post({uri: `r/${this.display_name}/api/delete_sr_icon`, form: {api_type}});
  }
  delete_image ({image_name}) {
    return this.post({uri: `r/${this.display_name}/api/delete_sr_image`, form: {api_type, img_name: image_name}});
  }
  get_subreddit_settings () {
    return this.get({uri: `r/${this.display_name}/about/edit`});
  }
  async edit_settings (options) {
    const current_settings = await this.get_subreddit_settings();
    return this._ac._create_or_edit_subreddit(_.assign(current_settings, options, {sr: this.display_name}));
  }
  get_muted_users () {
    return this.get({uri: `r/${this.display_name}/about/muted`});
  }
};

objects.Trophy = class Trophy extends objects.RedditContent {
};

objects.PromoCampaign = class PromoCampaign extends objects.RedditContent {
};

/**
* A class representing a list of content. This is a subclass of the native Array object, so it has all the properties of
an Array (length, forEach, etc.) in addition to some added methods. At any given time, each Listing has fetched a specific
number of items, and that number will be its length. However, if a value greater than the length is accessed (e.g. with
<code>some_listing[very_high_index]</code>), then the Listing will automatically fetch more items until either
(a) it has an item at the requested index, or (b) it runs out of items to fetch. In the meantime, the expression that
referenced the high index will return a Promise for that value, which will get resolved after the entries are fetched.
*/
objects.Listing = class Listing extends Array {
  constructor ({children = [], query = {}, show_all = true, limit, _transform = _.identity,
      uri, method, after, before, _is_comment_list = false} = {}, _ac) {
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
  * @returns {Promise} An updated version of this listing with <code>amount</code> items added on.
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
    const limit_for_request = Math.min(amount, this.limit) || this.limit;
    const request_params = {qs: {after: this.after, before: this.before, limit: limit_for_request}};
    const response = await this._requester(request_params).then(this._transform);
    this.push(..._.toArray(response));
    this.before = response.before;
    this.after = response.after;
    return response.slice(0, amount).concat(await this.fetch_more(amount - response.length));
  }
  /* Pagination for comments works differently than it does for most other things; rather than sending a link to the next page
  within a listing, reddit sends the last comment in the list as as a `more` object, with links to all the remaining comments
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
      throw new errors.InvalidMethodCallError('Failed to fetch listing. (`amount` must be a Number.)');
    }
    if (amount <= 0 || this.children.length === 0) {
      return [];
    }
    const ids_for_this_request = this.children.splice(0, Math.min(amount, 100)).map(id => `t1_${id}`);
    // Requests are capped at 100 comments. Send lots of requests recursively to get the comments, then concatenate them.
    // (This speed-requesting is only possible with comment listings since the entire list of ids is present initially.)
    const promise_for_this_batch = this.get({uri: 'api/info', qs: {id: ids_for_this_request.join(',')}});
    const promise_for_remaining_items = this.fetch_more(amount - ids_for_this_request.length);
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

objects.KarmaList = class KarmaList extends objects.RedditContent {};
objects.TrophyList = class TrophyList extends objects.RedditContent {};
objects.SubredditSettings = class SubredditSettings extends objects.RedditContent {};

snoowrap.objects = objects;
snoowrap.helpers = helpers;
module.exports = snoowrap;
