'use strict';
require('harmony-reflect'); // temp dependency until node implements Proxies properly
let Promise = require('bluebird');
let _ = require('lodash');
let request = require('request-promise').defaults({json: true});
let moment = require('moment');
let constants = require('./constants');
module.exports.RedditContent = class RedditContent {
  constructor(auth) {
    this._fetcher = auth;
    this._fetch_promise = null;
    return new Proxy(this, {get: (target, key, self) => {
      if (key in target) {
        return target[key];
      }
      if (!target._fetch_promise || !this.has_fetched) {
        return self.fetch().then(() => (target[key]));
      }
    }});
  }
  fetch () {
    if (!this._fetch_promise) {
      this._fetch_promise = this._fetcher.oauth_requester().get({uri: this._uri});
    }
    return this._fetch_promise.then(json_response => {
      _.merge(this, json_response.data);
    });
  }
  get has_fetched () {
    return !!this._fetch_promise && this._fetch_promise.isFulfilled();
  }
};
module.exports.RedditUser = class RedditUser extends exports.RedditContent {
  constructor(name, auth) {
    super(auth);
    this.name = name;
  }
  get _uri() {
    return `/user/${this.name}/about`;
  }
};

module.exports.AuthenticatedClient = class AuthenticatedClient {
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
    return new exports.RedditUser(name, this);
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

  oauth_requester () {
    let request_filter_proxy = (target, thisArg, args) => {
      if (this.ratelimit_remaining < 1 && this.ratelimit_reset_point.isAfter()) {
        throw `${constants.MODULE_NAME}_error: Ratelimit exceeded`;
      }
      let update_token_if_necessary = Promise.resolve();
      if (!this.token_expiration || moment(this.token_expiration).subtract(10, 'seconds').isBefore()) {
        update_token_if_necessary = this._update_access_token();
      }
      return update_token_if_necessary.then(() => {
        return target.defaults({headers: {Authorization: `bearer ${this.access_token}`}}).apply(this, args);
      });
    };
    let default_requester = request.defaults({
      headers: {'User-Agent': this.user_agent},
      baseUrl: `https://oauth.${constants.ENDPOINT_DOMAIN}`,
      qs: {raw_json: 1},
      resolveWithFullResponse: true,
      transform: this._handle_full_response
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
