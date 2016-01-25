'use strict';
require('harmony-reflect'); // temp dependency until node implements Proxies properly
let Promise = require('bluebird');
let _ = require('lodash');
let request = require('request-promise').defaults({json: true});
let moment = require('moment');
let promise_wrap = require('promise-chains');
let util = require('util');
let constants = require('./constants');
let errors = require('./errors');
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
  }
  get_user (name) {
    return new objects.RedditUser({name: name}, this);
  }
  get_comment (comment_id) {
    return new objects.Comment({name: `t1_${comment_id}`}, this);
  }
  get_subreddit (display_name) {
    return new objects.Subreddit({display_name: display_name}, this);
  }
  async _update_access_token () {
    let token_response = await request.post({
      url: `https://www.${constants.ENDPOINT_DOMAIN}/api/v1/access_token`,
      headers: {
        Authorization: `Basic ${Buffer(`${this.client_id}:${this.client_secret}`).toString('base64')}`,
        'User-Agent': this.user_agent
      },
      form: {grant_type: 'refresh_token', refresh_token: this.refresh_token}
    });
    this.access_token = token_response.access_token;
    this.token_expiration = moment().add(token_response.expires_in, 'seconds');
    this.scopes = token_response.scope.split(' ');
  }

  get oauth_requester () {
    let request_filter_proxy = (requester, thisArg, args) => {
      if (this.ratelimit_remaining < 1 && this.ratelimit_reset_point.isAfter()) {
        throw new errors.RateLimitError(this.ratelimit_reset_point.diff(moment(), 'seconds'));
      }
      let needs_refresh = !this.token_expiration || moment(this.token_expiration).subtract(10, 'seconds').isBefore();
      return promise_wrap((needs_refresh ? this._update_access_token() : Promise.resolve()).then(() => {
        return requester.defaults({headers: {Authorization: `bearer ${this.access_token}`}}).apply(thisArg, args);
      }));
    };
    let default_requester = request.defaults({
      headers: {'User-Agent': this.user_agent},
      baseUrl: `https://oauth.${constants.ENDPOINT_DOMAIN}`,
      qs: {raw_json: 1}, // This tells reddit to unescape html characters, so that it sends '<' instead of '&lt;'
      resolveWithFullResponse: true,
      transform: (body, response) => {
        this.ratelimit_remaining = response.headers['x-ratelimit-remaining'];
        this.ratelimit_reset_point = moment().add(response.headers['x-ratelimit-reset'], 'seconds');
        return helpers._populate(body, this);
      }
    });
    return new Proxy(default_requester, {
      apply: request_filter_proxy,
      get: (target, key) => { // Allow both request(args) and request.post(args)
        if (_.includes(['get', 'head', 'post', 'put', 'patch', 'del'], key)) {
          return new Proxy(target.defaults({method: key}), {apply: request_filter_proxy});
        }
        return target[key];
      }
    });
  }
};

objects.RedditContent = class RedditContent {
  constructor(options, _fetcher, has_fetched) {
    this._fetcher = _fetcher;
    this.has_fetched = !!has_fetched;
    _.assign(this, options);
    this._fetch = _.once(async () => {
      let response = await this._fetcher.oauth_requester.get({uri: this._uri});
      let transformed = this._transform_api_response(response);
      _.assign(this, transformed);
      this.has_fetched = true;
      return this;
    });
    return new Proxy(this, {get: (target, key) => {
      if (key in target || key === 'length' || key in Promise.prototype || this.has_fetched) {
        return target[key];
      }
      return this.fetch()[key];
    }});
  }
  inspect () { // TODO: Simplify this when lodash fixes _.pickBy
    let property_display = _.pick(this, _.filter(_.keys(this), key => {
      return key.indexOf('_') !== 0 && typeof this[key] !== 'function';
    }));
    return `<${constants.MODULE_NAME}.objects.${this.constructor.name}> ${util.inspect(property_display)}`;
  }
  get oauth_requester () {
    return this._fetcher.oauth_requester;
  }
  fetch () {
    if (this.has_fetched) {
      return this;
    }
    return promise_wrap(this._fetch());
  }
  _transform_api_response (response_obj) {
    return response_obj;
  }
};

objects.Comment = class Comment extends objects.RedditContent {
  constructor (options, _fetcher, has_fetched) {
    super(options, _fetcher, has_fetched);
  }
  _transform_api_response (response_object) {
    return response_object.children[0];
  }
  get _uri () {
    return `/api/info?id=${this.name}`;
  }
};
objects.RedditUser = class RedditUser extends objects.RedditContent {
  constructor (options, _fetcher, has_fetched) {
    super(options, _fetcher, has_fetched);
  }
  get _uri () {
    if (typeof this.name !== 'string' || !constants.username_regex.test(this.name)) {
      throw new errors.InvalidUserError(this.name);
    }
    return `/user/${this.name}/about`;
  }
};

objects.Submission = class Submission extends objects.RedditContent {
  constructor (options, _fetcher, has_fetched) {
    super(options, _fetcher, has_fetched);
  }
  get _uri () {
    return `/api/info?id=${this.name}`;
  }
};

objects.PrivateMessage = class PrivateMessage extends objects.RedditContent {
  constructor (options, _fetcher, has_fetched) {
    super(options, _fetcher, has_fetched);
  }
  get _uri () {
    return `/message/messages/${this.id}`;
  }
};

objects.Subreddit = class Subreddit extends objects.RedditContent {
  constructor (options, _fetcher, has_fetched) {
    super(options, _fetcher, has_fetched);
  }
  get _uri () {
    return `/r/${this.display_name}/about`;
  }
  get_moderators () {
    return this._fetcher.oauth_requester.get(`/r/${this.display_name}/about/moderators`);
  }
};

objects.Trophy = class Trophy extends objects.RedditContent {
  constructor (options, _fetcher, has_fetched) {
    super(options, _fetcher, has_fetched);
  }
};

objects.PromoCampaign = class PromoCampaign extends objects.RedditContent {
  constructor (options, _fetcher, has_fetched) {
    super(options, _fetcher, has_fetched);
  }
};

objects.Listing = class Listing extends objects.RedditContent {
  constructor(options, _fetcher, has_fetched) {
    super(options, _fetcher, has_fetched);
  }
};

objects.UserList = class UserList extends objects.RedditContent {
  constructor(options, _fetcher) {
    return options.children.map(user => {
      return new objects.RedditUser(user, _fetcher);
    });
  }
};

helpers._populate = (response_tree, _fetcher) => {
  if (typeof response_tree === 'object' && response_tree !== null) {
    // Map {kind: 't2', data: {name: 'some_username', ... }} to a RedditUser (e.g.) with the same properties
    if (_.keys(response_tree).length === 2 && response_tree.kind && constants.KINDS[response_tree.kind]) {
      let remainder_of_tree = helpers._populate(response_tree.data, _fetcher);
      return new objects[constants.KINDS[response_tree.kind]](remainder_of_tree, _fetcher, true);
    }
    let mapFunction = Array.isArray(response_tree) ? _.map : _.mapValues;
    return mapFunction(response_tree, (value, key) => {
      // Map {..., author: 'some_username', ...} to {..., author: RedditUser {}, ... } (e.g.)
      if (_.includes(constants.USER_KEYS, key)) {
        return new objects.RedditUser({name: value}, _fetcher);
      }
      if (_.includes(constants.SUBREDDIT_KEYS, key)) {
        return new objects.Subreddit({display_name: value}, _fetcher);
      }
      return helpers._populate(value, _fetcher);
    });
  }
  return response_tree;
};

snoowrap.objects = objects;
snoowrap.helpers = helpers;
module.exports = snoowrap;
