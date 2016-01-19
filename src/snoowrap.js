'use strict';
require('harmony-reflect'); // temp dependency until node implements Proxies properly
let Promise = require('bluebird');
let _ = require('lodash');
let request = require('request-promise').defaults({json: true});
let moment = require('moment');
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
  get helpers () {
    return helpers;
  }
  get objects () {
    return objects;
  }
  get_user (name) {
    return new snoowrap.objects.RedditUser({name: name}, this);
  }
  get_comment (comment_id) {
    return new snoowrap.objects.Comment({name: `t1_${comment_id}`}, this);
  }
  get_subreddit (display_name) {
    return new snoowrap.objects.Subreddit({display_name: display_name}, this);
  }
  _update_access_token () {
    return request.post({
      url: `https://www.${constants.ENDPOINT_DOMAIN}/api/v1/access_token`,
      headers: {
        Authorization: `Basic ${Buffer(`${this.client_id}:${this.client_secret}`).toString('base64')}`,
        'User-Agent': this.user_agent
      },
      form: {grant_type: 'refresh_token', refresh_token: this.refresh_token}
    }).then(response => {
      this.access_token = response.access_token;
      this.token_expiration = moment().add(response.expires_in, 'seconds');
      this.scopes = response.scope.split(' ');
    });
  }
  _handle_full_response (body, response) {
    this.ratelimit_remaining = response.headers['x-ratelimit-remaining'];
    this.ratelimit_reset_point = moment().add(response.headers['x-ratelimit-reset'], 'seconds');
    return body;
  }

  get oauth_requester () {
    let request_filter_proxy = (target, thisArg, args) => {
      if (this.ratelimit_remaining < 500 && this.ratelimit_reset_point.isAfter()) {
        throw errors.ratelimit_exceeded(this.ratelimit_reset_point.diff(moment(), 'seconds'));
      }
      let update_token_if_necessary = Promise.resolve();
      if (!this.token_expiration || moment(this.token_expiration).subtract(10, 'seconds').isBefore()) {
        update_token_if_necessary = this._update_access_token();
      }
      let promise_path_proxy = {
        get: (target, key) => {
          // Allow a path to be defined on a promise before it's actually resolved.
          if (key in target || key === 'inspect') {
            return target[key];
          }
          new Proxy(target.then(_.property(key)), promise_path_proxy);
        },
        apply: (target_promise, self, result_args) => {
          return target_promise.then(result => result.apply(self, result_args));
        }
      };
      return new Proxy(update_token_if_necessary.then(() => {
        return target.defaults({headers: {Authorization: `bearer ${this.access_token}`}}).apply(this, args);
      }), promise_path_proxy);
    };
    let default_requester = request.defaults({
      headers: {'User-Agent': this.user_agent},
      baseUrl: `https://oauth.${constants.ENDPOINT_DOMAIN}`,
      qs: {raw_json: 1},
      resolveWithFullResponse: true,
      transform: this._handle_full_response.bind(this)
    });
    return new Proxy(default_requester, {
      apply: request_filter_proxy,
      get: (target, key) => { // Allow both request(args) and request.post(args)
        if (['get', 'head', 'post', 'put', 'patch', 'del'].indexOf(key) !== -1) {
          return new Proxy(target.defaults({method: key}), {apply: request_filter_proxy});
        }
        return target[key];
      }
    });
  }
};
snoowrap.objects = {};
snoowrap.helpers = {};

snoowrap.objects.RedditContent = class RedditContent {
  constructor(options, _fetcher, _fetch_promise) {
    this._fetcher = _fetcher;
    this._fetch_promise = _fetch_promise;
    _.forEach(snoowrap.helpers._populate(options, this._fetcher, this._fetch_promise), (value, key) => {
      this[key] = value;
    });
    // If an unknown property is accessed, fetch it from reddit and return a Promise for that property
    return new Proxy(this, {get: (target, key, self) => {
      // Apparently _.merge checks the length of an object, which was mistakenly causing it to get fetched from reddit
      if (key in target || key === 'length') {
        return target[key];
      }
      if (!target.has_fetched) {
        return self.fetch().then(result => (result[key]));
      }
    }});
  }
  fetch () {
    if (!this._fetch_promise) {
      this._fetch_promise = this._fetcher.oauth_requester.get({uri: this._uri}).then(response_object => {
        let transformed = this.transform_api_response(response_object);
        let temp = snoowrap.helpers._populate(transformed, this._fetcher, this._fetch_promise);
        _.forEach(temp, (value, key) => {
          this[key] = value;
        });
        return this;
      });
      return this._fetch_promise;
    }
    return this._fetch_promise;
  }
  get has_fetched () {
    return this._fetch_promise && this._fetch_promise.isFulfilled();
  }
  get inspect () {
    return this; // TODO: hide internal variables when content is inspected
  }
  transform_api_response (response_obj) {
    return response_obj.data;
  }
};
snoowrap.objects.Comment = class Comment extends snoowrap.objects.RedditContent {
  constructor (options, _fetcher, _fetch_promise) {
    super(options, _fetcher, _fetch_promise);
  }
  get _uri () {
    return `/api/info?id=${this.name}`;
  }
  transform_api_response (response_object) {
    return response_object.data.children[0];
  }
};
snoowrap.objects.RedditUser = class RedditUser extends snoowrap.objects.RedditContent {
  constructor (options, _fetcher, _fetch_promise) {
    super(options, _fetcher, _fetch_promise);
  }
  get _uri () {
    return `/user/${this.name}/about`;
  }
};

snoowrap.objects.Submission = class Submission extends snoowrap.objects.RedditContent {
  constructor (options, _fetcher, _fetch_promise) {
    super(options, _fetcher, _fetch_promise);
  }
  get _uri () {
    return `/api/info?id=${this.name}`;
  }
};

snoowrap.objects.PrivateMessage = class PrivateMessage extends snoowrap.objects.RedditContent {
  constructor (options, _fetcher, _fetch_promise) {
    super(options, _fetcher, _fetch_promise);
  }
  get _uri () {
    return `/message/messages/${this.id}`;
  }
};

snoowrap.objects.Subreddit = class Subreddit extends snoowrap.objects.RedditContent {
  constructor (options, _fetcher, _fetch_promise) {
    super(options, _fetcher, _fetch_promise);
  }
  get _uri () {
    return `/r/${this.display_name}/about`;
  }
  get_moderators () {
    return this._fetcher.oauth_requester.get({uri: `/r/${this.display_name}/about/moderators`}).data.children;
  }
};

snoowrap.objects.Trophy = class Trophy {
  constructor (options, _fetcher, _fetch_promise) {
    _.merge(this, snoowrap.helpers._populate(options, _fetcher, _fetch_promise));
  }
};

snoowrap.objects.PromoCampaign = class PromoCampaign {
  constructor (options, _fetcher, _fetch_promise) {
    _.merge(this, snoowrap.helpers._populate(options, _fetcher, _fetch_promise));
  }
};

snoowrap.objects.Listing = class Listing {
  constructor(options, _fetcher, _fetch_promise) {
    _.merge(this, snoowrap.helpers._populate(options, _fetcher, _fetch_promise));
  }
};

let KINDS = {
  t1: snoowrap.objects.Comment,
  t2: snoowrap.objects.RedditUser,
  t3: snoowrap.objects.Submission,
  t4: snoowrap.objects.PrivateMessage,
  t5: snoowrap.objects.Subreddit,
  t6: snoowrap.objects.Trophy,
  t8: snoowrap.objects.PromoCampaign,
  Listing: snoowrap.objects.Listing
};

const USER_KEYS = ['author', 'approved_by', 'banned_by'];
const SUBREDDIT_KEYS = ['subreddit'];

snoowrap.helpers._populate = function (response_tree, _fetcher, _fetch_promise) {
  let _new_fetch_promise;
  if (typeof response_tree === 'object' && response_tree !== null) {
    // Map {kind: 't2', data: {name: 'some_username', ... }} to a RedditUser (e.g.) with the same properties
    if (_.keys(response_tree).length === 2 && response_tree.kind && response_tree.data) {
      _new_fetch_promise = _fetch_promise && _fetch_promise.then(_.property('data'));
      return new KINDS[response_tree.kind](response_tree.data, _fetcher, _new_fetch_promise);
    }
    let mapFunction = Array.isArray(response_tree) ? _.map : _.mapValues;
    return mapFunction(response_tree, (value, key) => {
      // Map {..., author: 'some_username', ...} to {..., author: RedditUser {}, ... } (e.g.)
      if (_.includes(USER_KEYS, key)) {
        return new snoowrap.objects.RedditUser({name: value}, _fetcher);
      }
      if (_.includes(SUBREDDIT_KEYS, key)) {
        return new snoowrap.objects.Subreddit({display_name: value});
      }
      return snoowrap.helpers._populate(value, _fetcher, _fetch_promise && _fetch_promise.then(_.property(key)));
    });
  }
  return response_tree;
};

module.exports = snoowrap;
