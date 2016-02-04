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

let snoowrap = class snoowrap {
  constructor ({client_id, client_secret, refresh_token, user_agent}) {
    this.client_id = client_id;
    this.client_secret = client_secret;
    this.refresh_token = refresh_token;
    this.user_agent = user_agent;
    this.config = default_config;
    this.throttle = Promise.resolve();
    constants.REQUEST_TYPES.forEach(type => {
      Object.defineProperty(this, type, {get: () => (this._oauth_requester.defaults({method: type}))});
    });
  }
  async _update_access_token () {
    let token_info = await request.post({
      url: `https://www.${this.config.endpoint_domain}/api/v1/access_token`,
      auth: {user: this.client_id, pass: this.client_secret},
      headers: {'user-agent': this.user_agent},
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
      if (!this.token_expiration || moment(this.token_expiration).subtract(10, 'seconds').isBefore()) {
        await this._update_access_token();
      }
      // Send the request and return the response.
      return await requester.defaults({auth: {bearer: this.access_token}}).apply(self, args).catch(err => {
        if (attempts < this.config.max_retry_attempts && _.includes(this.config.retry_error_codes, err.statusCode)) {
          this.warn(`Warning: Received status code ${err.statusCode} from reddit. Retrying request...`);
          return handle_request(requester, self, args, attempts + 1);
        }
        throw err;
      });
    };
    return new Proxy(default_requester, {apply: (...args) => (promise_wrap(handle_request(...args)))});
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
    return `<${constants.MODULE_NAME}.objects.${this.constructor.name}> ${formatted}`;
  }
  warn (...args) {
    if (!this.config.suppress_warnings) {
      console.warn(...args);
    }
  }
  get_me () {
    return this.get('api/v1/me').then(result => {
      this.own_user_info = new snoowrap.objects.RedditUser(result, this, true);
      return this.own_user_info;
    });
  }
  get_user (name) {
    return new snoowrap.objects.RedditUser({name}, this);
  }
  get_comment (comment_id) {
    return new snoowrap.objects.Comment({name: `t1_${comment_id}`}, this);
  }
  get_subreddit (display_name) {
    return new snoowrap.objects.Subreddit({display_name}, this);
  }
  get_submission (submission_id) {
    return new snoowrap.objects.Submission({name: `t3_${submission_id}`}, this);
  }
  get_karma () {
    return this.get({uri: 'api/v1/me/karma'});
  }
  get_preferences () {
    return this.get({uri: 'api/v1/me/prefs'});
  }
  update_preferences (updated_preferences) {
    // reddit expects all fields to be present in the patch request, so get the current values of the fields
    // and then apply the changes.
    return this.get_preferences().then(current_prefs => {
      return this.patch({uri: 'api/v1/me/prefs', body: _.assign(current_prefs, updated_preferences)});
    });
  }
  get_trophies () {
    return this.get({uri: 'api/v1/me/trophies'});
  }
  get_friends () {
    return this.get({uri: 'prefs/friends'});
  }
  get_blocked () {
    return this.get({uri: 'prefs/blocked'});
  }
  needs_captcha () {
    return this.get({uri: 'api/needs_captcha'});
  }
  get_new_captcha_identifier () {
    return this.post({uri: 'api/new_captcha', form: {api_type: 'json'}}).json.data.iden;
  }
  get_captcha_image ({identifier}) {
    return this.get({uri: `captcha/${identifier}`});
  }
  get_saved_categories () {
    return this.get({uri: 'api/saved_categories'});
  }
  mark_as_visited (links) {
    return this.post({uri: 'api/store_visits', links: links.join(',')});
  }
  _submit ({captcha_response, captcha_iden, kind, resubmit = true, send_replies = true, text, title, url, subreddit_name}) {
    return this.post({uri: 'api/submit', form: {captcha: captcha_response, iden: captcha_iden, sendreplies: send_replies,
      sr: subreddit_name, kind, resubmit, text, title, url}});
  }
  submit_selfpost (options) {
    return this._submit(_.assign(options, {kind: 'self'}));
  }
  submit_link (options) {
    return this._submit(_.assign(options, {kind: 'link'}));
  }
  _get_sorted_frontpage (sort_type, subreddit_name, options = {}) {
    // Handle things properly if only a time parameter is provided but not the subreddit name
    if (typeof subreddit_name === 'object' && !options) {
      /* In this case, "subreddit_name" ends up referring to the second argument, which is not actually a name since the user
      decided to omit that parameter. */
      options = subreddit_name;
      subreddit_name = undefined;
    }
    return this.get({uri: (subreddit_name ? `r/${subreddit_name}/` : '') + sort_type, qs: {t: options.time}});
  }
  get_hot (subreddit_name) {
    return this._get_sorted_frontpage('hot', subreddit_name);
  }
  get_new (subreddit_name) {
    return this._get_sorted_frontpage('new', subreddit_name);
  }
  get_top (subreddit_name, {time} = {}) {
    return this._get_sorted_frontpage('top', subreddit_name, {time});
  }
  get_controversial (subreddit_name, {time} = {}) {
    return this._get_sorted_frontpage('controversial', subreddit_name, {time});
  }
};

objects.RedditContent = class RedditContent {
  constructor(options, _ac, has_fetched) {
    /* `_ac` stands for `Authenticated Client`; it refers to the snoowrap requester that this object is tied to (which is
    also used to make future requests if necessary). */
    this._ac = _ac;
    this.has_fetched = !!has_fetched;
    _.assignIn(this, options);
    this._initialize_fetch_function();
    /* Omit the 'delete' request shortcut, since that property name is used by Comments and Submissions. To send an HTTP DELETE
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
    this.fetch = this.fetch || _.once(() => {
      return promise_wrap(this._ac.get({uri: this._uri}).then(this._transform_api_response.bind(this)).then(response => {
        /* The line below is equivalent to _.assign(this, response);, but _.assign ends up triggering warning messages when
        used on Proxies, since the patched globals from harmony-reflect aren't applied to lodash. This won't be a problem once
        Proxies are correctly implemented natively. https://github.com/tvcutsem/harmony-reflect#dependencies */
        _.forIn(response, (value, key) => {this[key] = value;});
        this.has_fetched = true;
        return this;
      }));
    });
  }
  refresh (...args) {
    delete this.fetch;
    this._initialize_fetch_function();
    return this.fetch(...args);
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
    let _transform = item => (item[1][0].replies);
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
    /* Ideally this would allow for more than 36 months by sending multiple requests, but I wouldn't have the resources to test
    that code, and it's probably better that such a big investment be deliberate anyway. */
    if (typeof months !== 'number' || months < 1 || months > 36) {
      throw new errors.InvalidMethodCallError('Invalid argument to RedditUser.give_gold; `months` must be between 1 and 36.');
    }
    return this.post({uri: `api/v1/gold/give/${this.name}`});
  }
};

objects.Submission = class Submission extends objects.RedditContent {
  constructor (options, _ac, has_fetched) {
    super(options, _ac, has_fetched);
    let _transform = response => (response[1]);
    this.comments = new objects.Listing({uri: `comments/${this.name.slice(3)}`, _transform}, _ac);
  }
  get _uri () {
    return `api/info?id=${this.name}`;
  }
  _transform_api_response (response_object) {
    return response_object[0];
  }
  // TODO: Get rid of the repeated {id: this.name} form parameters
  hide () {
    return this.post({uri: 'api/hide', form: {id: this.name}});
  }
  unhide () {
    return this.post({uri: 'api/unhide', form: {id: this.name}});
  }
  lock () {
    return this.post({uri: 'api/lock', form: {id: this.name}});
  }
  unlock () {
    return this.post({uri: 'api/unlock', form: {id: this.name}});
  }
  mark_nsfw () {
    return this.post({uri: 'api/marknsfw', form: {id: this.name}});
  }
  unmark_nsfw () {
    return this.post({uri: 'api/unmarknsfw', form: {id: this.name}});
  }
  set_contest_mode_enabled (state) {
    return this.post({uri: 'api/set_contest_mode', form: {state, id: this.name}});
  }
  _set_stickied({state, num}) {
    return this.post({uri: 'api/set_subreddit_sticky', form: {state, num, id: this.name}});
  }
  sticky ({num} = {}) {
    return this._set_stickied({state: true, num});
  }
  unsticky () {
    return this._set_stickied({state: false});
  }
  set_suggested_sort (sort) {
    if (typeof sort !== 'string') {
      throw new errors.InvalidMethodCallError('`sort` must be a string (such as "best" or "new") for set_suggested_sort');
    }
    return this.post({uri: 'api/set_suggested_sort', form: {api_type: 'json', id: this.name, sort}});
  }
  mark_as_read () { // Requires reddit gold
    return this.post({uri: 'api/store_visits', form: {links: this.name}});
  }
  get_duplicates () {
    return this.get({uri: `duplicates/${this.name}`});
  }
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

objects.Subreddit = class Subreddit extends objects.RedditContent {
  constructor (options, _ac, has_fetched) {
    super(options, _ac, has_fetched);
  }
  get _uri () {
    return `r/${this.display_name}/about`;
  }
  get_moderators () {
    return this._ac.get(`r/${this.display_name}/about/moderators`);
  }
  _delete_flair_templates ({flair_type}) {
    return this.post({uri: `r/${this.display_name}/api/clearflairtemplates`, form: {api_type: 'json', flair_type}});
  }
  delete_all_user_flair_templates () {
    return this._delete_flair_templates({flair_type: 'USER_FLAIR'});
  }
  delete_all_link_flair_templates () {
    return this._delete_flair_templates({flair_type: 'LINK_FLAIR'});
  }
  delete_flair_template ({flair_template_id}) {
    return this.post({uri: `r/${this.display_name}/api/deleteflairtemplate`, form: {api_type: 'json', flair_template_id}});
  }
  _create_flair_template ({text, css_class, flair_type, text_editable = false}) {
    return this.post({
      uri: `r/${this.display_name}/api/flairtemplate`,
      form: {api_type: 'json', text, css_class, flair_type, text_editable}
    });
  }
  create_user_flair_template ({text, css_class, text_editable = false}) {
    return this._create_flair_template({text, css_class, text_editable, flair_type: 'USER_FLAIR'});
  }
  create_link_flair_template ({text, css_class, text_editable = false}) {
    return this._create_flair_template({text, css_class, text_editable, flair_type: 'LINK_FLAIR'});
  }
  get_flair_options ({name, link} = {}) { // TODO: Add shortcuts for this on RedditUser and Submission
    return this.post({uri: `r/${this.display_name}/api/flairselector`, form: {name, link}});
  }
  get_user_flair_templates () {
    return this.get_flair_options().choices;
  }
  set_flair ({link, name, text, css_class}) {
    return this.post({
      uri: `r/${this.display_name}/api/flair`,
      form: {api_type: 'json', link, name, text: text || '', css_class: css_class || ''}
    });
  }
  delete_user_flair ({name}) {
    return this.post({uri: `r/${this.display_name}/api/deleteflair`, form: {api_type: 'json', name}});
  }
  get_user_flair ({name}) {
    return this.get_flair_options({name}).current;
  }
  _set_flair_from_csv (flair_csv) {
    return this.post({uri: `r/${this.display_name}/api/flaircsv`, form: {flair_csv}});
  }
  set_multiple_user_flairs (flair_array) { // Each entry of flair_array has the properties {name, text, css_class}
    let requests = [];
    while (flair_array.length > 0) {
      // The endpoint only accepts at most 100 lines of csv at a time, so split the array into chunks of 100.
      requests.push(this._set_flair_from_csv(flair_array.splice(0, 100).map(item =>
        (`${item.name},${item.text || ''},${item.css_class || ''}`)).join('\n')
      ));
    }
    return promise_wrap(Promise.all(requests));
  }
  get_user_flair_list () {
    return this.get({uri: `r/${this.display_name}/api/flairlist`}).users;
  }
  configure_flair ({user_flair_enabled, user_flair_position, user_flair_self_assign_enabled, link_flair_position,
      link_flair_self_assign_enabled}) {
    return this.post({
      uri: `r/${this.display_name}/api/flairconfig`,
      form: {
        api_type: 'json',
        flair_enabled: user_flair_enabled,
        flair_position: user_flair_position,
        flair_self_assign_enabled: user_flair_self_assign_enabled,
        link_flair_position, link_flair_self_assign_enabled
      }
    });
  }
  _set_my_flair_visibility (flair_enabled) {
    return this.post({uri: `r/${this.display_name}/api/setflairenabled`, form: {api_type: 'json', flair_enabled}});
  }
  show_my_flair () {
    return this._set_my_flair_visibility(true);
  }
  hide_my_flair () {
    return this._set_my_flair_visibility(false);
  }
  _submit (options) {
    return this._ac._submit(_.assign(options, {subreddit_name: this.display_name}));
  }
  _submit_selfpost (options) {
    return this._ac._submit_selfpost(_.assign(options, {subreddit_name: this.display_name}));
  }
  _submit_link (options) {
    return this._ac._submit_link(_.assign(options, {subreddit_name: this.display_name}));
  }
  get_hot () {
    return this._ac.get_hot(this.display_name);
  }
  get_new () {
    return this._ac.get_new(this.display_name);
  }
  get_comments () {
    return this._ac.get_comments(this.display_name);
  }
  get_top ({time} = {}) {
    return this._ac.get_top(this.display_name, {time});
  }
  get_controversial ({time} = {}) {
    return this._ac.get_controversial(this.display_name, {time});
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
    this._is_comment_list = _is_comment_list;
    return new Proxy(this, {get: (target, key, thisArg) => {
      if (!isNaN(key) && key >= target.length) {
        return promise_wrap(target.fetch(key - target.length + 1).then(_.last));
      }
      return Reflect.get(target, key, thisArg);
    }});
  }
  get _requester () {
    return this._ac._oauth_requester.defaults({uri: this.uri, method: this.method, qs: this.constant_params});
  }
  get is_finished () {
    if (this._is_comment_list) {
      return !this._more || !this._more.children.length;
    }
    return !!this.uri && this.after === null && this.before === null;
  }
  fetch (amount = this.limit) {
    if (typeof amount !== 'number') {
      throw new errors.InvalidMethodCallError('Failed to fetch listing. (amount must be a Number.)');
    }
    if (amount <= 0 || this.is_finished) {
      return [];
    }
    if (this._is_comment_list) {
      return promise_wrap(this._fetch_more_comments(amount));
    }
    return promise_wrap(this._fetch_more_regular(amount));
  }
  async _fetch_more_regular (amount) {
    let limit_for_request = Math.min(amount, this.limit) || this.limit;
    let request_params = {qs: {after: this.after, before: this.before, limit: limit_for_request}};
    let response = await this._requester(request_params).then(this._transform);
    if (this.length === 0 && _.last(response) instanceof objects.more) {
      this._more = response.pop();
      this._is_comment_list = true;
    }
    this.push(..._.toArray(response));
    this.before = response.before;
    this.after = response.after;
    return response.slice(0, amount).concat(await this.fetch(amount - response.length));
  }
  /* Pagination for comments works differently than it does for most other things; rather than sending a link to the next page
  within a listing, reddit sends the last comment in the list as as a `more` object, with links to all the remaining comments
  in the thread. */
  async _fetch_more_comments (...args) {
    let new_comments = this._more ? await this._more.fetch(...args) : [];
    this.push(..._.toArray(new_comments));
    return new_comments;
  }
  fetch_all () {
    return this.fetch(Infinity);
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
  async fetch (amount) {
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
    let promise_for_remaining_items = this.fetch(amount - ids_for_this_request.length);
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
    return mapFunction(response_tree, (value, key) => {
      // Map {..., author: 'some_username', ...} to {..., author: RedditUser {}, ... } (e.g.)
      if (_.includes(constants.USER_KEYS, key)) {
        return new objects.RedditUser({name: value}, _ac);
      }
      if (_.includes(constants.SUBREDDIT_KEYS, key)) {
        return new objects.Subreddit({display_name: value}, _ac);
      }
      return helpers._populate(value, _ac);
    });
  }
  return response_tree;
};

snoowrap.objects = objects;
snoowrap.helpers = helpers;
assign_mixins(snoowrap);
module.exports = snoowrap;
