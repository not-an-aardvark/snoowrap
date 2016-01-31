'use strict';
require('harmony-reflect'); // temp dependency until v8 implements Proxies properly
let Promise = require('bluebird');
Promise.config({longStackTraces: true});
let _ = require('lodash');
let request = require('request-promise').defaults({json: true});
let moment = require('moment');
let promise_wrap = require('promise-chains');
let util = require('util');
let constants = require('./constants');
let errors = require('./errors');
let default_config = require('./default_config');
let actions = require('./actions');
let objects = {};
let helpers = {};

let snoowrap = class AuthenticatedClient {
  constructor (options) {
    this.client_id = options.client_id;
    this.client_secret = options.client_secret;
    this.refresh_token = options.refresh_token;
    this.user_agent = options.user_agent;
    this.access_token = options.access_token;
    this.token_expiration = options.token_expiration;
    this.ratelimit_remaining = options.ratelimit_remaining;
    this.ratelimit_reset_point = options.ratelimit_reset_point;
    this.config = default_config;
    this.throttle = Promise.resolve();
  }
  get_me () {
    return this.get('api/v1/me').then(result => {
      this.own_user_info = new objects.RedditUser(result, this, true);
      return this.own_user_info;
    });
  }
  get_user (name) {
    return new objects.RedditUser({name}, this);
  }
  get_comment (comment_id) {
    return new objects.Comment({name: `t1_${comment_id}`}, this);
  }
  get_subreddit (display_name) {
    return new objects.Subreddit({display_name}, this);
  }
  get_submission (submission_id) {
    return new objects.Submission({name: `t3_${submission_id}`}, this);
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
    this.scopes = token_info.scope.split(' ');
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
        return helpers._populate(body, this);
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
          return handle_request(requester, self, args, attempts + 1);
        }
        throw err;
      });
    };
    return new Proxy(default_requester, {apply: handle_request});
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
  /*gotta*/ get get () {
    return this._oauth_requester.defaults({method: 'get'});
  }
  get post () {
    return this._oauth_requester.defaults({method: 'post'});
  }
  get patch () {
    return this._oauth_requester.defaults({method: 'patch'});
  }
  get put () {
    return this._oauth_requester.defaults({method: 'put'});
  }
  get delete () {
    return this._oauth_requester.defaults({method: 'delete'});
  }
  // TODO: probably combine the above getters to avoid repetition, though that would require deleting the 'get get' joke :\
  warn (...args) {
    if (!this.config.suppress_warnings) {
      console.warn(...args);
    }
  }
};

objects.RedditContent = class RedditContent {
  constructor(options, _ac, has_fetched) {
    this._ac = _ac;
    this.has_fetched = !!has_fetched;
    _.assignIn(this, options);
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
    return new Proxy(this, {get: (target, key) => {
      if (key in target || key === 'length' || key in Promise.prototype || target.has_fetched) {
        return target[key];
      }
      if (key === '_raw') {
        return target;
      }
      return this.fetch()[key];
    }});
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
    response_obj[0].replies = new objects.Listing({_uri: replies_uri, query: replies_query, _transform}, this._ac);
    return response_obj[0];
  }
  get _uri () {
    return `api/info?id=${this.name}`;
  }
  static get inherited_action_categories () {
    return ['reply', 'vote', 'moderate', 'more_comments'];
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
  static get inherited_action_categories () {
    return [];
  }
};

objects.Submission = class Submission extends objects.RedditContent {
  constructor (options, _ac, has_fetched) {
    super(options, _ac, has_fetched);
    let _transform = response => (response[1]);
    this.comments = new objects.Listing({_uri: `comments/${this.name.slice(3)}`, _transform}, _ac);
  }
  get _uri () {
    return `api/info?id=${this.name}`;
  }
  _transform_api_response (response_object) {
    return response_object[0];
  }
  static get inherited_action_categories () {
    return ['reply', 'vote', 'moderate', 'more_comments'];
  }
};

objects.PrivateMessage = class PrivateMessage extends objects.RedditContent {
  constructor (options, _ac, has_fetched) {
    super(options, _ac, has_fetched);
  }
  get _uri () {
    return `message/messages/${this.id}`;
  }
  static get inherited_action_categories () {
    return ['reply', 'moderate']; // more_comments? Need to check whether this ever applies with PMs
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
  static get inherited_action_categories () {
    return [];
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
      _uri, method, after, before, _is_comment_list = false} = {}, _ac) {
    super();
    _.assign(this, children);
    let constant_params = _.assign(query, {show: show_all ? 'all' : undefined, limit});
    this._ac = _ac;
    this._requester = _ac._oauth_requester.defaults({uri: _uri, method, qs: constant_params});
    this._transform = _transform;
    this.limit = limit;
    this.after = after;
    this.before = before;
    this._is_comment_list = _is_comment_list;
    return new Proxy(this, {get: (target, key, thisArg) => {
      if (!isNaN(key) && key >= target.length) {
        return promise_wrap(target.fetch({amount: key - target.length + 1}).then(_.last));
      }
      return Reflect.get(target, key, thisArg);
    }});
  }
  get is_finished () {
    if (this._is_comment_list) {
      return !this._more || !this._more.children.length;
    }
    return !!this.uri && this.after === null && this.before === null;
  }
  fetch ({amount = this.limit}) {
    if (typeof amount !== 'number') {
      throw new errors.InvalidMethodCallError('Failed to fetch listing. (amount must be a Number.)');
    }
    if (amount <= 0 || this.is_finished) {
      return [];
    }
    if (this._is_comment_list) {
      return promise_wrap(this._fetch_more_comments({amount}));
    }
    return promise_wrap(this._fetch_more_regular({amount}));
  }
  async _fetch_more_regular ({amount}) {
    let limit_for_request = Math.min(amount, this.limit || 0);
    let request_params = {qs: {after: this.after, before: this.before, limit: limit_for_request}};
    let response = await this._requester(request_params).then(this._transform);
    if (this.length === 0 && _.last(response) instanceof objects.more) {
      this._more = response.pop();
      this._is_comment_list = true;
    }
    this.push(..._.toArray(response));
    this.before = response.before;
    this.after = response.after;
    return this.slice(0, amount).concat(await this.fetch({amount: amount - response.length}));
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
    return this.fetch({amount: Infinity});
  }
  inspect () {
    return util.inspect(_.omitBy(this, (value, key) => (key.startsWith('_'))));
  }
};

objects.more = class more extends objects.RedditContent {
  constructor (properties, _ac) {
    super(properties, _ac);
  }
  /* Requests to /api/morechildren are capped at 20 comments at a time, but requests to /api/info are capped at 100, so
  it's easier to send to the latter. The disadvantage is that comment replies are not automatically sent from requests
  to /api/info. */
  async fetch ({amount = Infinity}) {
    if (isNaN(amount)) {
      throw new errors.InvalidMethodCallError('Failed to fetch listing. (`amount` must be a Number.)');
    }
    if (amount <= 0 || this.children.length === 0) {
      return [];
    }
    let ids_for_this_request = this.children.splice(0, Math.min(amount, 100)).map(id => (`t1_${id}`));
    // Requests are capped at 100 comments. Send lots of requests recursively to get the comments, then concatenate them.
    // (This speed-requesting is only possible with comment listings since the entire list of ids is present initially.)
    let promise_for_this_batch = this._ac.get({uri: 'api/info', qs: {id: ids_for_this_request.join(',')}});
    let promise_for_remaining_items = this.fetch({amount: amount - ids_for_this_request.length});
    return _.toArray(await promise_for_this_batch).concat(await promise_for_remaining_items);
  }
};

objects.UserList = class UserList {
  constructor(options, _ac) {
    return options.children.map(user => {
      return new objects.RedditUser(user, _ac);
    });
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

/* Assign all the action functions to the class prototypes. Actions are split into categories (moderation, voting, etc.),
which are defined in actions.js. Each class should have the inherited_action_categories property, which is a list of strings
corresponding to the action categories which apply to objects of that class. */
_(objects).forOwn(object_class => {
  _(actions).pick(object_class.inherited_action_categories || []).forOwn(action_category => {
    _.assign(object_class.prototype, action_category);
  });
});

snoowrap.objects = objects;
snoowrap.helpers = helpers;
module.exports = snoowrap;
