/* eslint-env mocha */
// eslint-disable-next-line strict
'use strict'; // (this is not a module, so 'use strict' is required)
const expect = require('chai').use(require('dirty-chai')).expect;
const Promise = require('bluebird');
const _ = require('lodash');
const moment = require('moment');
const request = require('request-promise');
const util = require('util');
const snoowrap = require('..');

const isBrowser = typeof self !== 'undefined';
describe('snoowrap', function () {
  // TODO: split this test into multiple files
  this.timeout(60000);
  this.slow(Infinity);
  let oauthInfo, r, r2, cookieAgent;
  before(async () => {
    oauthInfo = process.env.CI ? {
      user_agent: process.env.SNOOWRAP_USER_AGENT,
      client_id: process.env.SNOOWRAP_CLIENT_ID,
      client_secret: process.env.SNOOWRAP_CLIENT_SECRET,
      refresh_token: process.env.SNOOWRAP_REFRESH_TOKEN,
      username: process.env.SNOOWRAP_USERNAME,
      password: process.env.SNOOWRAP_PASSWORD,
      redirect_uri: process.env.SNOOWRAP_REDIRECT_URI,
      installed_app_client_id: process.env.SNOOWRAP_INSTALLED_APP_CLIENT_ID,
      device_id: process.env.SNOOWRAP_DEVICE_ID
    } : require('../oauth_info.json');

    r = new snoowrap({
      user_agent: oauthInfo.user_agent,
      client_id: oauthInfo.client_id,
      client_secret: oauthInfo.client_secret,
      refresh_token: oauthInfo.refresh_token
    });
    r2 = new snoowrap({
      user_agent: oauthInfo.user_agent,
      client_id: oauthInfo.client_id,
      client_secret: oauthInfo.client_secret,
      username: oauthInfo.username,
      password: oauthInfo.password
    });
    if (process.env.CI) {
      this.retries(3);
    }
    r.config({request_delay: 1000});

    if (!isBrowser) {
      const defaultRequest = request.defaults({
        headers: {'user-agent': oauthInfo.user_agent},
        json: true,
        jar: request.jar(),
        baseUrl: 'https://www.reddit.com/'
      });

      const loginResponse = await defaultRequest.post({
        uri: 'api/login',
        form: {user: oauthInfo.username, passwd: oauthInfo.password, api_type: 'json'}
      });

      expect(loginResponse.json.errors.length).to.equal(0);
      cookieAgent = defaultRequest.defaults({headers: {'X-Modhash': loginResponse.json.data.modhash}});
    }
  });

  describe('.constructor', () => {
    (isBrowser ? it.skip : it)('throws an error if no user-agent is provided in node', () => {
      expect(() => new snoowrap({})).to.throw(snoowrap.errors.MissingUserAgentError);
    });
    (isBrowser ? it : it.skip)('always uses navigator.userAgent in browsers', () => {
      expect(new snoowrap({userAgent: 'foo', accessToken: 'bar'}).userAgent).to.equal(global.navigator.userAgent);
    });
    (isBrowser ? it : it.skip)('does not throw an error if no user-agent is provided in a browser', () => {
      expect(() => new snoowrap({clientId: 'a', clientSecret: 'b', refreshToken: 'c'})).to.not.throw();
    });
    it('throws an error if insufficient credentials are provided', () => {
      expect(() => new snoowrap({
        user_agent: 'a',
        client_id: 'b',
        client_secret: 'c'
      })).to.throw(snoowrap.errors.NoCredentialsError);
    });
    it('does not throw an error if only an access token is provided', () => {
      expect(() => new snoowrap({user_agent: 'a', access_token: 'blah'})).not.to.throw();
    });
    it('throws an error if the access token is not a string', () => {
      expect(() => new snoowrap({user_agent: 'a', access_token: {}})).to.throw();
      expect(() => new snoowrap({user_agent: 'a', access_token: []})).to.throw();
      expect(() => new snoowrap({user_agent: 'a', access_token: 123})).to.throw();
    });
    it('does not throw an error if a user_agent, client_id, client_secret, and refresh_token are provided', () => {
      expect(() => new snoowrap({user_agent: 'a', client_id: 'b', client_secret: 'c', refresh_token: 'd'})).not.to.throw();
    });
    it('throws an error if refresh_token is not a string', () => {
      expect(() => new snoowrap({user_agent: 'a', client_id: 'b', client_secret: 'c', refresh_token: {}})).to.throw();
      expect(() => new snoowrap({user_agent: 'a', client_id: 'b', client_secret: 'c', refresh_token: []})).to.throw();
      expect(() => new snoowrap({user_agent: 'a', client_id: 'b', client_secret: 'c', refresh_token: 123})).to.throw();
    });
    it('does not throw an error if a user_agent, client_id, client_secret, username, and password are provided', () => {
      expect(() => {
        return new snoowrap({user_agent: 'a', client_id: 'b', client_secret: 'c', username: 'd', password: 'e'});
      }).not.to.throw();
    });
    it('allows the client_secret to be an empty string', () => {
      expect(() => new snoowrap({user_agent: 'a', client_id: 'b', client_secret: '', refresh_token: 'd'})).not.to.throw();
    });
  });

  describe('.getAuthUrl()', () => {
    it('returns an authentication URL as a string', () => {
      expect(snoowrap.getAuthUrl({
        clientId: 'foo',
        scope: ['bar', 'baz'],
        redirectUri: 'http://example.com/callback'
      })).to.equal(
        'https://www.reddit.com/api/v1/authorize?client_id=foo&response_type=code&state=_&redirect_uri=' +
        'http%3A%2F%2Fexample.com%2Fcallback&duration=permanent&scope=bar%20baz'
      );
    });
    it('throws an error if the scope list is empty', () => {
      expect(() => {
        snoowrap.getAuthUrl({clientId: 'foo', scope: [], redirectUri: 'http://example.com/callback'});
      }).to.throw(TypeError);
    });
    it('throws an error if the scope list is missing', () => {
      expect(() => {
        snoowrap.getAuthUrl({clientId: 'foo', redirectUri: 'http://example.com/callback'});
      }).to.throw(TypeError);
    });
    it('throws an error if the scope list contains non-strings', () => {
      expect(() => {
        snoowrap.getAuthUrl({clientId: 'foo', scope: [5], redirectUri: 'http://example.com/callback'});
      }).to.throw(TypeError);
    });
    it('throws an error if the scope param is not an array', () => {
      expect(() => {
        snoowrap.getAuthUrl({clientId: 'foo', scope: 'read', redirectUri: 'http://example.com/callback'});
      }).to.throw(TypeError);
    });
    it('throws an error if the clientId is missing', () => {
      expect(() => {
        snoowrap.getAuthUrl({scope: ['read'], redirectUri: 'http://example.com/callback'});
      }).to.throw(TypeError);
    });
    it('throws an error if the redirectUri is missing', () => {
      expect(() => {
        snoowrap.getAuthUrl({clientId: 'foo', scope: ['read']});
      }).to.throw(TypeError);
    });
    it('allows a state param to be provided', () => {
      const state = require('crypto').randomBytes(16).toString('hex');
      expect(snoowrap.getAuthUrl({clientId: 'a', scope: ['read'], redirectUri: 'http://example.com', state})).to.include(state);
    });
    it('url-encodes the state parameter', () => {
      const state = 'ding\x07';
      expect(snoowrap.getAuthUrl({clientId: 'a', scope: ['read'], redirectUri: 'http://example.co', state}))
        .to.include('ding%07');
    });
    it('allows the duration to be either temporary or permanent', () => {
      expect(
        snoowrap.getAuthUrl({clientId: 'a', scope: ['read'], redirectUri: 'http://example.com'})
      ).to.include('&duration=permanent');

      expect(
        snoowrap.getAuthUrl({clientId: 'a', scope: ['read'], redirectUri: 'http://example.com', permanent: false})
      ).to.include('&duration=temporary');
    });
  });

  describe('.fromAuthCode', () => {
    it('throws a TypeError if no code is provided', () => {
      expect(() => {
        snoowrap.fromAuthCode({userAgent: 'foo', clientId: 'bar', clientSecret: 'baz', redirectUri: 'qux'});
      }).to.throw(TypeError);
    });
    it('throws a TypeError if no userAgent is provided in node', function () {
      if (isBrowser) {
        return this.skip();
      }
      expect(() => {
        snoowrap.fromAuthCode({code: 'foo', clientId: 'bar', clientSecret: 'baz', redirectUri: 'qux'});
      }).to.throw(TypeError);
    });
    it('throws a TypeError if no redirectUri is provided', () => {
      expect(() => {
        snoowrap.fromAuthCode({code: 'foo', userAgent: 'bar', clientId: 'baz', clientSecret: 'qux'});
      }).to.throw(TypeError);
    });
    it('throws a TypeError if no clientId is provided', () => {
      expect(() => {
        snoowrap.fromAuthCode({code: 'foo', userAgent: 'bar', clientSecret: 'qux', redirectUri: 'qux2'});
      }).to.throw(TypeError);
    });
    (isBrowser ? it.skip : it)('returns a Promise for a valid requester', async () => {
      const authResponse = await cookieAgent.post({
        uri: 'api/v1/authorize',
        simple: false,
        resolveWithFullResponse: true,
        form: {
          client_id: oauthInfo.client_id,
          redirect_uri: oauthInfo.redirect_uri,
          scope: 'identity',
          state: '_',
          response_type: 'code',
          duration: 'temporary',
          authorize: 'Allow'
        }
      });
      expect(authResponse.statusCode).to.equal(302);

      const newRequester = await snoowrap.fromAuthCode({
        code: require('url').parse(authResponse.headers.location, true).query.code,
        userAgent: oauthInfo.user_agent,
        clientId: oauthInfo.client_id,
        clientSecret: oauthInfo.client_secret,
        redirectUri: oauthInfo.redirect_uri
      });

      expect(await newRequester.getMe().name).to.equal(oauthInfo.username);
    });
  });

  describe('.fromApplicationOnlyAuth', () => {
    it('throws a TypeError if no userAgent is provided in node', function () {
      if (isBrowser) {
        return this.skip();
      }
      expect(() => {
        snoowrap.fromApplicationOnlyAuth({clientId: 'bar', deviceId: 'baz'});
      }).to.throw(TypeError);
    });
    it('throws a TypeError if no clientId is provided', () => {
      expect(() => {
        snoowrap.fromApplicationOnlyAuth({userAgent: 'bar'});
      }).to.throw(TypeError);
    });
    it('throws a TypeError if no grantType is provided', () => {
      expect(() => {
        snoowrap.fromApplicationOnlyAuth({userAgent: 'bar'});
      }).to.throw(TypeError);
    });
    it('returns a snoowrap instance for a valid installed requester', async () => {
      const newRequester = await snoowrap.fromApplicationOnlyAuth({
        userAgent: oauthInfo.user_agent,
        grantType: snoowrap.grantType.INSTALLED_CLIENT,
        clientId: oauthInfo.installed_app_client_id,
        deviceId: oauthInfo.device_id
      });
      expect(await newRequester.getHot('redditdev', {limit: 1})).to.have.length.above(0).and.at.most(3);
    });
    it('returns a snoowrap instance for a valid client requester', async () => {
      const newRequester = await snoowrap.fromApplicationOnlyAuth({
        userAgent: oauthInfo.user_agent,
        grantType: snoowrap.grantType.CLIENT_CREDENTIALS,
        clientId: oauthInfo.client_id,
        clientSecret: oauthInfo.client_secret
      });
      // We may get no posts, or we maybe have 2 stickies and a post - 3 in total.
      expect(await newRequester.getHot('redditdev', {limit: 1})).to.have.length.above(0).and.at.most(3);
    });
  });

  describe('internal helpers', () => {
    it('can deeply clone a RedditContent instance', async () => {
      const some_user = r.getUser('someone');
      const cloned_user = some_user._clone({deep: true});
      expect(some_user.name).to.equal(cloned_user.name);
      expect(cloned_user).to.be.an.instanceof(snoowrap.objects.RedditUser);
      expect(cloned_user._hasFetched).to.be.false();

      const sub = await r.getSubmission('4fp36y').fetch();
      const cloned = sub._clone({deep: true});
      expect(sub).to.not.equal(cloned);
      expect(sub.comments).to.not.equal(cloned.comments);
      expect(sub.comments[0]).to.not.equal(cloned.comments[0]);
      expect(sub.comments[0].replies).to.not.equal(cloned.comments[0].replies);
      expect(sub.comments[0].replies[0]).to.not.equal(cloned.comments[0].replies[0]);
    });
    it('can convert a RedditContent instance to JSON', async () => {
      const some_user = r.getUser('someone');
      expect(JSON.stringify(some_user)).to.equal('{"name":"someone"}');
      const fetched_user = await r.getUser('snoowrap_testing').fetch();
      const reparsed = JSON.parse(JSON.stringify(fetched_user));
      expect(fetched_user).to.have.property('_r');
      expect(reparsed).to.not.have.property('_r');
      expect(reparsed.name).to.equal(fetched_user.name);
      expect(reparsed.created_utc).to.equal(fetched_user.created_utc);
    });
    it('de-populates a RedditContent object when converting it to JSON', async () => {
      const some_submission = await r.getSubmission('4abn1k').fetch();
      expect(some_submission.author).to.be.an('object');
      expect(some_submission.subreddit).to.be.an('object');
      const jsonified = some_submission.toJSON();
      expect(jsonified.author).to.be.a('string');
      expect(jsonified.author).to.equal(some_submission.author.name);
      expect(jsonified.subreddit).to.be.a('string');
      expect(jsonified.subreddit).to.equal(some_submission.subreddit.display_name);
    });
    it('does not de-populate a RedditContent object when inspecting it', async function () {
      if (isBrowser) {
        return this.skip();
      }
      const some_submission = await r.getSubmission('4abn1k').fetch();
      expect(some_submission.author).to.be.an('object');
      expect(some_submission.subreddit).to.be.an('object');
      const inspected = util.inspect(some_submission);
      expect(inspected).to.be.a('string');
      expect(_.includes(inspected, "author: RedditUser { name: 'not_an_aardvark' }")).to.be.true();
    });
    it('does exponential backoff', async () => {
      let start = Date.now();
      await r._awaitExponentialBackoff(1);
      let end = Date.now();
      expect(end - start).to.be.lessThan(500);

      start = Date.now();
      await r._awaitExponentialBackoff(2);
      end = Date.now();
      expect(end - start).to.be.within(1600, 2800);

      start = Date.now();
      await r._awaitExponentialBackoff(3);
      end = Date.now();
      expect(end - start).to.be.within(3600, 4800);
    });
  });

  describe('general snoowrap behavior', () => {
    let previous_request_delay, previous_request_timeout;
    before(() => {
      previous_request_delay = r.config().request_delay;
      previous_request_timeout = r.config().request_timeout;
    });
    it('can chain properties together before they get resolved', async () => {
      const comment = r.getComment('coip909');
      const first_mod_of_that_subreddit = await comment.subreddit.getModerators()[0];
      expect(first_mod_of_that_subreddit.name).to.equal('krispykrackers');
      expect(await first_mod_of_that_subreddit.created_utc).to.equal(1211483632);
    });
    it('throttles requests as specified by the config parameters', async () => {
      r.config({request_delay: 2000});
      const timer = Promise.delay(1999);
      await r.getUser('not_an_aardvark').fetch();
      await r.getUser('actually_an_aardvark').fetch();
      expect(timer.isFulfilled()).to.be.true();
    });
    it('throws a timeout error if a request takes too long', async () => {
      r.config({request_timeout: 1});
      await r.getMe().then(expect.fail).catch(_.noop);
    });
    it('does not throw a timeout error if time accumulates while waiting to send a request', async () => {
      r.config({request_timeout: 5000, request_delay: 5500});
      await Promise.all([r.getMe(), r.getMe()]);
    });
    it('stores the version number as a constant', () => {
      expect(snoowrap.version).to.equal(require('../package.json').version);
    });
    it('throws a TypeError if an invalid config option is set', () => {
      expect(() => r.config({invalid_config_option: true})).to.throw(TypeError);
    });
    it('does not share config properties between snoowrap instances', () => {
      const initial_delay = r2.config().request_delay;
      r.config({request_delay: 100000});
      expect(r.config().request_delay).to.equal(100000);
      expect(r2.config().request_delay).to.equal(initial_delay);
    });
    it('does not use Object.prototype for the config object', () => {
      expect(Object.getPrototypeOf(r.config())).to.be.null();
    });
    it('sets all prototype functions as non-enumerable', () => {
      const ensure_prototype_funcs_arent_enumerable = obj => {
        Object.getOwnPropertyNames(obj.prototype).forEach(funcName => {
          expect(Object.prototype.propertyIsEnumerable.call(obj, funcName)).to.be.false();
        });
      };
      ensure_prototype_funcs_arent_enumerable(snoowrap);
      _.forOwn(snoowrap.objects, ensure_prototype_funcs_arent_enumerable);
    });
    it('adds all object types to snoowrap.objects', () => {
      Object.keys(snoowrap.objects).forEach(key => {
        // Ensure that each object is a direct property of snoowrap (as opposed to a getter)
        expect(Object.getOwnPropertyDescriptor(snoowrap.objects, key).value).to.equal(snoowrap.objects[key]);
      });
      expect(snoowrap.objects.RedditContent).to.exist();
      expect(snoowrap.objects.Comment).to.exist();
    });
    it('exposes camelCase aliases for all prototype functions', () => {
      expect(r.get_user).to.equal(r.getUser);
      expect(r.get_subreddit('AskReddit').getTop).to.equal(r.getSubreddit('AskReddit').getTop);
      expect(snoowrap.objects.Listing.prototype.fetch_more).to.equal(snoowrap.objects.Listing.prototype.fetchMore);
    });
    describe('`proxies` config option', async () => {
      it('allows method chaining when set to true', async () => {
        r.config({proxies: true});
        const chained_prop = r.getUser('snoowrap_testing').created_utc;
        expect(chained_prop).to.be.ok();
        expect(chained_prop.then).to.be.a('function');

        const sub = await r.getSubmission('4abn1k').fetch();
        expect(sub.author.created_utc.then).to.be.a('function');

        expect(r.getHot({limit: 1})[0].then).to.be.a('function');
      });
      it('does not allow method chaining when set to false', async () => {
        r.config({proxies: false});
        expect(r.getUser('snoowrap_testing').created_utc).to.be.undefined();

        const sub = await r.getSubmission('4abn1k').fetch();
        expect(sub.author.created_utc).to.be.undefined();

        expect(r.getHot({limit: 1})[0]).to.be.undefined();
      });
      afterEach(() => {
        r.config({proxies: true});
      });
    });
    it('exposes a noConflict function to restore the previous version of window.snoowrap', () => {
      expect(snoowrap.noConflict()).to.equal(snoowrap);
    });
    describe('subclassing', () => {
      it('allows snoowrap to be subclassed, and makes requests based on shadowed functions', async () => {
        const requestLog = [];
        class SnoowrapSubclass extends snoowrap {
          rawRequest (options) {
            requestLog.push(options);
            return super.rawRequest(options);
          }
        }
        const subclassedRequester = new SnoowrapSubclass({
          user_agent: oauthInfo.user_agent,
          client_id: oauthInfo.client_id,
          client_secret: oauthInfo.client_secret,
          refresh_token: oauthInfo.refresh_token
        });
        const response = await subclassedRequester.getMe();
        expect(response.name).to.equal(oauthInfo.username);
        expect(requestLog.length).to.equal(2);
        expect(requestLog[0].uri).to.equal('api/v1/access_token');
        expect(requestLog[1].uri).to.equal('api/v1/me');
      });
    });
    afterEach(() => {
      r.config({request_delay: previous_request_delay, request_timeout: previous_request_timeout});
    });
  });

  describe('lenient parsing on object creation', () => {
    it('allows an optional t1_ comment prefix', () => {
      expect(r.getComment('coip909').name).to.equal('t1_coip909');
      expect(r.getComment('t1_coip909').name).to.equal('t1_coip909');
    });
    it('allows an optional /u/ user prefix', () => {
      expect(r.getUser('snoowrap_testing').name).to.equal('snoowrap_testing');
      expect(r.getUser('u/snoowrap_testing').name).to.equal('snoowrap_testing');
      expect(r.getUser('/u/snoowrap_testing').name).to.equal('snoowrap_testing');
    });
    it('allows an optional t3_ submission prefix', () => {
      expect(r.getSubmission('2np694').name).to.equal('t3_2np694');
      expect(r.getSubmission('t3_2np694').name).to.equal('t3_2np694');
    });
    it('allows an optional t4_ privatemessage prefix', () => {
      expect(r.getMessage('51shnw').name).to.equal('t4_51shnw');
      expect(r.getMessage('t4_51shnw').name).to.equal('t4_51shnw');
    });
    it('allows an optional /r/ subreddit prefix', () => {
      expect(r.getSubreddit('snoowrap_testing').display_name).to.equal('snoowrap_testing');
      expect(r.getSubreddit('r/snoowrap_testing').display_name).to.equal('snoowrap_testing');
      expect(r.getSubreddit('/r/snoowrap_testing').display_name).to.equal('snoowrap_testing');
    });
    it('allows an optional LiveUpdateEvent_ livethread prefix', () => {
      expect(r.getLivethread('whrdxo8dg9n0').id).to.equal('whrdxo8dg9n0');
      expect(r.getLivethread('LiveUpdateEvent_whrdxo8dg9n0').id).to.equal('whrdxo8dg9n0');
    });
  });

  describe('requester metadata', () => {
    /* When running tests on private info such as access tokens, always use an expression that evaluates to true or false
    instead of using chai's shortcuts.
    * GOOD: expect(typeof r.access_token === 'string').to.be.true();
    * BAD: expect(r.access_token).to.be.a('string');
    *
    * If the first test fails, the error message will simply say `expected false to be true`, but if the second test fails,
    * the error message will say `expected <the access token's value> to be a string`. Since the unit tests are run on a
    * public travis server, this would have the effect of leaking the private credentials.
    */
    before(async () => {
      await r.getMe();
    });
    it('stores the client id, client secret, refresh token, and access token on the requester', () => {
      expect(r.client_id).to.be.a('string');
      expect(typeof r.client_secret === 'string').to.be.true();
      expect(typeof r.refresh_token === 'string').to.be.true();
      expect(typeof r.access_token === 'string').to.be.true();
    });
    it('redacts the client secret, the refresh token, and the access token from the console.log view', function () {
      if (isBrowser) {
        return this.skip();
      }
      const inspected = util.inspect(r);
      expect(_.includes(inspected, r.client_secret)).to.be.false();
      expect(_.includes(inspected, r.refresh_token)).to.be.false();
      expect(_.includes(inspected, r.access_token)).to.be.false();
    });
    it('stores the ratelimit expiration and access token expiration as unix ms timestamps', () => {
      expect(r.ratelimitExpiration).to.be.a('number');
      expect(moment(r.ratelimitExpiration).isAfter()).to.be.true();
      expect(moment(r.ratelimitExpiration).subtract({minutes: 10}).isBefore()).to.be.true();
      expect(r.tokenExpiration).to.be.a('number');
      expect(moment(r.tokenExpiration).isAfter()).to.be.true();
      expect(moment(r.tokenExpiration).subtract({hours: 1}).isBefore()).to.be.true();
    });
    it("stores the token's scope on the requester after making a request", () => {
      expect(r.scope).to.be.an.instanceof(Array);
      expect(r.scope).to.include('account');
      expect(r.scope).to.include('creddits');
    });
    it('stores the ratelimit remaining as a number returned from reddit', () => {
      expect(r.ratelimitRemaining).to.be.a('number');
      expect(r.ratelimitRemaining).to.be.at.least(0).and.at.most(600);
    });
    it("stores a user's own info on the requester after calling getMe()", async () => {
      await r.getMe();
      expect(r._ownUserInfo).to.be.an.instanceof(snoowrap.objects.RedditUser);
    });
    it('stores the access token and the access token expiration properly', () => {
      expect(typeof r.access_token === 'string').to.be.true();
      expect(r.tokenExpiration).to.be.a('number');
      expect(moment(r.tokenExpiration).isAfter()).to.be.true();
      expect(moment(r.tokenExpiration).subtract({hours: 1}).isBefore()).to.be.true();
    });
  });

  describe('smoketest', () => {
    it("can get the requester's profile", async () => {
      expect(await r.getMe()).to.be.an.instanceof(snoowrap.objects.RedditUser);
      expect(await r2.getMe()).to.be.an.instanceof(snoowrap.objects.RedditUser);
    });
    it("can get a user's overview", async () => {
      expect(await r.getMe().getOverview()).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(await r2.getMe().getOverview()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
  });

  describe('getting a user profile', () => {
    let user;
    beforeEach(() => {
      user = r.getUser('snoowrap_testing');
    });
    it('gets information from a user profile', async () => {
      const fetched_user = await user.fetch();
      expect(fetched_user.name).to.equal('snoowrap_testing');
      expect(fetched_user.created_utc).to.equal(1453703196);
      expect(fetched_user.nonexistent_property).to.be.undefined();
    });
    it('returns individual properties as Promises', async () => {
      expect(await user.has_verified_email).to.be.true();
    });
    it('returns a promise that resolves as undefined when fetching a nonexistent property', async () => {
      expect(await user.nonexistent_property).to.be.undefined();
    });
    it('casts non-string names to strings', () => {
      expect(r.getUser(null).name).to.equal('null');
    });
    it('throws an error if it tries to fetch the profile of a deleted/invalid account', () => {
      expect(() => r.getUser('[deleted]').fetch()).to.throw(snoowrap.errors.InvalidUserError);
    });
    it("can get a user's trophies", async () => {
      expect(await user.getTrophies()).to.be.an.instanceof(snoowrap.objects.TrophyList);
    });
    it("can get a user's overview", async () => {
      expect(await user.getOverview()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it("can get a user's submissions", async () => {
      const submissions = await user.getSubmissions();
      expect(submissions).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(submissions[0]).to.be.an.instanceof(snoowrap.objects.Submission);
    });
    it("can get a user's comments", async () => {
      const comments = await user.getComments();
      expect(comments).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(comments[0]).to.be.an.instanceof(snoowrap.objects.Comment);
    });
    it("can get a user's upvoted content", async () => {
      expect(await user.getUpvotedContent()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it("can get a user's downvoted content", async () => {
      expect(await user.getDownvotedContent()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it("can get a user's hidden content", async () => {
      expect(await user.getHiddenContent()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it("can get a user's saved content", async () => {
      expect(await user.getSavedContent()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it("can get a user's gilded content", async () => {
      expect(await user.getGildedContent()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
  });

  describe('getting a comment', () => {
    let comment;
    beforeEach(() => {
      comment = r.getComment('coip909');
    });
    it('should retrieve a comment and get its text', async () => {
      expect(await comment.body).to.equal('`RuntimeError: maximum humor depth exceeded`');
    });
    it('should convert the comment author to a RedditUser object and be able to get its properties', async () => {
      expect(await comment.author.has_verified_email).to.be.true();
    });
    it('should be able to fetch replies to comments', async () => {
      expect(await comment.replies.fetchUntil({length: 1})[0].body).to.equal("Let's knock the humor down to 65%.");
    });
    it('should stop searching for replies to a comment if none are initially found', async () => {
      const comment_with_no_replies = r.getComment('c0bggv9');
      expect(await comment_with_no_replies.replies.fetchAll()).to.be.empty();
    });
    it('should correctly identify when a comment has no more replies to fetch', async () => {
      expect(await r.getComment('d2dof1c').expandReplies().replies.is_finished).to.be.true();
    });
  });

  describe('acting on a comment', () => {
    let comment;
    beforeEach(() => {
      comment = r.getComment('dchbcq5');
    });
    it('can lock/unlock a comment', async () => {
      await comment.lock();
      expect(await comment.refresh().locked).to.be.true();
      await comment.unlock();
      expect(await comment.refresh().locked).to.be.false();
    });
  });

  describe("getting a subreddit's information", () => {
    let subreddit;
    beforeEach(() => {
      subreddit = r.getSubreddit('snoowrap_testing');
    });
    it("can fetch information directly from a subreddit's info page", async () => {
      expect(await subreddit.created_utc).to.equal(1453703345);
    });
    it('can get and modify a subreddit stylesheet', async function () {
      const gibberish = require('crypto').randomBytes(4).toString('hex');
      const new_stylesheet = `.stylesheet-${gibberish}{}`; // it has to be valid CSS or reddit returns a 404 when fetching it
      await subreddit.updateStylesheet({css: new_stylesheet});
      // Reddit caches stylesheets for awhile, so this is annoying to test reliably. Make sure the sheet is fetched, at least
      if (isBrowser) {
        return this.skip();
      }
      expect(await subreddit.getStylesheet()).to.match(/^\.stylesheet-[0-9a-f]{8}/);
    });
    it.skip("can get and modify a subreddit's settings (test skipped depending on captcha requirement)", async () => {
      await subreddit.editSettings({public_traffic: false});
      expect(await subreddit.getSettings().public_traffic).to.be.false();
      await subreddit.editSettings({public_traffic: true});
      expect(await subreddit.getSettings().public_traffic).to.be.true();
    });
    it("can get a subreddit's submit text", async () => {
      expect(await subreddit.getSubmitText()).to.equal('snoowrap_testing submit text');
    });
    it('can subscribe/unsubscribe from a subreddit', async () => {
      await subreddit.subscribe();
      expect(await subreddit.refresh().user_is_subscriber).to.be.true();
      await subreddit.unsubscribe();
      expect(await subreddit.refresh().user_is_subscriber).to.be.false();
    });
    it('can unsubscribe twice from a subreddit without an error', async () => {
      await subreddit.unsubscribe();
      await subreddit.unsubscribe();
    });
    it('will still throw an error when attempting to unsubscribe from a nonexistent subreddit', async () => {
      const gibberish = require('crypto').randomBytes(10).toString('hex');
      await r.getSubreddit(gibberish).unsubscribe().then(expect.fail, err => expect(err.statusCode).to.equal(404));
    });
    it('can upload images to a subreddit from the filesystem', async function () {
      if (isBrowser) {
        return this.skip();
      }
      await subreddit.uploadHeaderImage({file: 'test/test_image.png'});
    });
    it('can upload/delete images to a subreddit from the filesystem', async function () {
      if (isBrowser) {
        return this.skip();
      }
      await subreddit.uploadStylesheetImage({name: 'foo', file: 'test/test_image.png', imageType: 'png'});
      await subreddit.deleteImage({imageName: 'foo'});
    });
    it("can get a subreddit's rules", async () => {
      const rules_obj = await subreddit.getRules();
      expect(rules_obj.rules[0].short_name).to.equal('Rule 1: No breaking the rules');
    });
    it.skip("can get a stickied post on a subreddit (skipped due to issues with reddit's cache)", async () => {
      const submission = r.getSubmission('474t3u');
      await submission.sticky({num: 1}).catch({statusCode: 409}, _.noop);
      const stickied_post = await subreddit.getSticky({num: 1});
      expect(stickied_post).to.be.an.instanceof(snoowrap.objects.Submission);
      expect(stickied_post.title).to.equal('This post is stickied');
      await submission.unsticky();
      await subreddit.getSticky().then(expect.fail).catch({statusCode: 404}, _.noop);
    });
  });

  describe('getting a submission', () => {
    let submission;
    beforeEach(() => {
      submission = r.getSubmission('2np694');
    });
    it('can get details on a submission', async () => {
      expect(await submission.title).to.equal('What tasty food would be distusting if eaten over rice?');
      expect(submission.author.name.value()).to.equal('DO_U_EVN_SPAGHETTI');
    });
    it('can get comments on a submission', async () => {
      const comments = await submission.comments;
      expect(comments.is_finished).to.be.false();
      expect(await comments.fetchMore(5)).to.have.length.within(6, 100);
      expect(comments[0]).to.be.an.instanceof(snoowrap.objects.Comment);
      expect(_.last(await comments)).to.be.an.instanceof(snoowrap.objects.Comment);
      const all_comments = await comments.fetchAll({skip_replies: true});
      expect(all_comments).to.have.length.above(1000);
      expect(all_comments.is_finished).to.be.true();
    });
    it("can get comments by index before they're fetched", async () => {
      expect(await submission.comments[6].body).to.equal('pumpkin pie');
    });
    it('can get a random submission from a particular subreddit', async function () {
      if (isBrowser) {
        return this.skip();
      }
      const random_post = await r.getSubreddit('gifs').getRandomSubmission();
      expect(random_post).to.be.an.instanceof(snoowrap.objects.Submission);
      expect(random_post.subreddit.display_name).to.equal('gifs');
    });
    it('can get a random submission from any subreddit', async function () {
      if (isBrowser) {
        return this.skip();
      }
      const random_post = await r.getRandomSubmission();
      expect(random_post).to.be.an.instanceof(snoowrap.objects.Submission);
    });
    it('can enable/disable inbox replies on a submission', async () => {
      // There's no way to tell whether inbox replies are enabled/disabled with the API, but make sure no errors are thrown
      await r.getSubmission('443v2b').enableInboxReplies().disableInboxReplies();
    });
  });

  describe('acting on a submission', () => {
    let submission;
    beforeEach(() => {
      submission = r.getSubmission('6ahrs4');
    });
    it('can hide/unhide a submission', async () => {
      await submission.hide();
      expect(await submission.refresh().hidden).to.be.true();
      await submission.unhide();
      expect(await submission.refresh().hidden).to.be.false();
    });
    it.skip('can lock/unlock a submission', async () => {
      await submission.lock();
      expect(await submission.refresh().locked).to.be.true();
      await submission.unlock();
      expect(await submission.refresh().locked).to.be.false();
    });
    it('can mark/unmark a submission as NSFW', async () => {
      await submission.markNsfw();
      expect(await submission.refresh().over_18).to.be.true();
      await submission.unmarkNsfw();
      expect(await submission.refresh().over_18).to.be.false();
    });
    it('can mark/unmark a submission as a spoiler', async () => {
      await submission.markSpoiler();
      expect(await submission.refresh().get('spoiler')).to.be.true();
      await submission.unmarkSpoiler();
      expect(await submission.refresh().get('spoiler')).to.be.false();
    });
    it('can enable/disable contest mode on a submission', async () => {
      /* There's no way to check whether a submission is in contest mode using the OAuth API, so just make sure the functions
      don't throw errors. */
      await submission.enableContestMode();
      await submission.disableContestMode();
    });
    it('can sticky/unsticky a submission', async () => {
      // Make sure the submission starts out unstickied for this test.
      await submission.unsticky();
      await submission.sticky();
      expect(await submission.refresh().stickied).to.be.true();
      await submission.unsticky();
      expect(await submission.refresh().stickied).to.be.false();
    });
    it('can set suggested sort on a submission', async () => {
      await submission.setSuggestedSort('new');
      expect(await submission.refresh().suggested_sort).to.equal('new');
      await submission.setSuggestedSort('top');
      expect(await submission.refresh().suggested_sort).to.equal('top');
    });
    it.skip('can get the "related submissions" endpoint (deprecated on reddit.com)', async function () {
      if (isBrowser) {
        return this.skip();
      }
      expect(await submission.getRelated()).to.be.an.instanceof(snoowrap.objects.Submission);
    });
  });

  describe('general Listing behavior', () => {
    let comments, initial_request_delay;
    before(async () => {
      comments = await r.getSubmission('2np694').comments;
      initial_request_delay = r.config().request_delay;
    });
    it('can store elements and inherit Array functions', async () => {
      expect(comments).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(comments.length).to.be.above(0).and.below(200);
      expect(comments.map).to.equal(Array.prototype.map);
    });
    it('can fetch more comment items and get a new Listing without modifying the original Listing', async () => {
      const initial_comments_length = comments.length;
      const initial_comments_morechildren_length = comments._more.children.length;
      const more_comments = await comments.fetchMore(5);
      expect(comments).to.have.lengthOf(initial_comments_length);
      expect(comments._more.children).to.have.lengthOf(initial_comments_morechildren_length);
      expect(more_comments).to.have.lengthOf(comments.length + 5);
      expect(more_comments._more.children).to.have.lengthOf(initial_comments_morechildren_length - 5);
      expect(comments[0].name).to.equal(more_comments[0].name);
      expect(_.map(more_comments.slice(-5), 'id').sort()).to.eql(comments._more.children.slice(0, 5).sort());
      const more_comments_duplicate = await comments.fetchMore(5);
      expect(_.map(more_comments, 'name').sort()).to.eql(_.map(more_comments_duplicate, 'name').sort());
      const even_more_comments = await more_comments.fetchMore(5);
      expect(even_more_comments).to.have.lengthOf(comments.length + 10);
      expect(_.map(even_more_comments.slice(0, -5), 'name').sort()).to.eql(_.map(more_comments, 'name').sort());
      expect(_.map(even_more_comments.slice(-5), 'name').sort()).to.not.eql(_.map(more_comments.slice(-5), 'name').sort());
    });
    it('can fetch more regular items and get a new Listing without modifying the original Listing', async () => {
      const initial_list = await r.getTop({t: 'all'});
      const original_length = initial_list.length;
      expect(original_length).to.be.at.least(1).and.at.most(100);
      const expanded_list = await initial_list.fetchMore(5);
      expect(initial_list).to.have.lengthOf(original_length);
      expect(expanded_list).to.have.lengthOf(original_length + 5);
      const expanded_list_duplicate = await initial_list.fetchMore(5);
      expect(_.map(expanded_list, 'name')).to.eql(_.map(expanded_list_duplicate, 'name'));
      const double_expanded_list = await expanded_list.fetchMore(5);
      expect(double_expanded_list).to.have.lengthOf(original_length + 10);
      expect(_.map(double_expanded_list.slice(0, -5), 'name')).to.eql(_.map(expanded_list, 'name'));
      expect(_.map(double_expanded_list.slice(-5), 'name')).to.not.eql(_.map(expanded_list.slice(-5), 'name'));
    });
    it('allows fetchMore() et al. to be chained', async () => {
      expect(await comments.fetchMore(1)[0]).to.exist();
    });
    it('allows an `append` parameter indicating whether new elements should be appended to regular Listings', async () => {
      const initial_list = await r.getTop({t: 'all', limit: 20});
      expect(initial_list).to.have.lengthOf(20);
      const expanded_list = await initial_list.fetchMore({amount: 30});
      expect(expanded_list).to.have.lengthOf(50);
      const next_list_part = await initial_list.fetchMore({amount: 30, append: false});
      expect(next_list_part).to.have.lengthOf(30);
      expect(initial_list).to.have.lengthOf(20);
      expect(_.map(expanded_list, 'id').slice(0, 20)).to.eql(_.map(initial_list, 'id'));
      expect(_.map(expanded_list, 'id').slice(20)).to.eql(_.map(next_list_part, 'id'));
    });
    it('returns an empty list if `append` is provided and there are no remaining items', async () => {
      const initialList = await r.getTop({t: 'all', limit: 5});
      expect(initialList).to.have.lengthOf(5);
      const additionalItems = await initialList.fetchMore({amount: 0, append: false});
      expect(additionalItems).to.have.lengthOf(0);
    });
    it('allows an `append` parameter indicating whether new elements should be passed to comment Listings', async () => {
      const initial_comment_length = comments.length;
      const expanded_comments = await comments.fetchMore({amount: 10});
      expect(expanded_comments).to.have.lengthOf(initial_comment_length + 10);
      const next_comments = await comments.fetchMore({amount: 10, append: false});
      expect(next_comments).to.have.lengthOf(10);
      expect(_.map(expanded_comments, 'id').slice(0, initial_comment_length)).to.eql(_.map(comments, 'id'));
      expect(_.map(expanded_comments, 'id').slice(initial_comment_length)).to.eql(_.map(next_comments, 'id'));
    });
    it('allows backwards pagination by supplying a `count` parameter to Listing fetches', async () => {
      const top_twenty_posts = await r.getTop({time: 'all', limit: 20});
      expect(top_twenty_posts).to.have.lengthOf(20);
      const reverse_listing = await r.getTop({time: 'all', limit: 10, before: _.last(top_twenty_posts).name});
      expect(reverse_listing).to.have.lengthOf(10);
      expect(reverse_listing._query.before).to.exist();
      const extended_reverse_listing = await reverse_listing.fetchMore(20);
      expect(extended_reverse_listing).to.have.lengthOf(19);
      expect(_.map(extended_reverse_listing, 'name').slice(-10)).to.eql(_.map(reverse_listing, 'name'));
    });
    it('allows an `append` parameter with backwards pagination', async () => {
      const top_twenty_posts = await r.getTop({time: 'all', limit: 20});
      expect(top_twenty_posts).to.have.lengthOf(20);
      const reverse_listing = await r.getTop({time: 'all', limit: 10, before: _.last(top_twenty_posts).name});
      expect(reverse_listing).to.have.lengthOf(10);
      const extended_reverse_listing = await reverse_listing.fetchMore(20);
      const next_listing_part = await reverse_listing.fetchMore({amount: 20, append: false});
      expect(extended_reverse_listing).to.have.lengthOf(19);
      expect(next_listing_part).to.have.lengthOf(9);
      expect(_.map(extended_reverse_listing, 'id').slice(0, 9)).to.eql(_.map(next_listing_part, 'id'));
      expect(_.map(extended_reverse_listing, 'id').slice(9)).to.eql(_.map(reverse_listing, 'id'));
    });
    it('allows more than 100 items to be fetched initially by repeatedly making requests', async () => {
      const lots_of_top_posts = await r.getTop({time: 'all', limit: 120});
      expect(lots_of_top_posts).to.have.lengthOf(120);
    });
    it('retrieves 100 items at a time when fetching a large listing', async () => {
      const l = await r.getTop({time: 'all', limit: 1});
      expect(l).to.have.lengthOf(1);
      r.config({request_delay: 5000});
      const timer_promise = Promise.delay(9999);
      const expanded_l = await l.fetchMore({amount: 200});
      expect(expanded_l).to.have.lengthOf(201);
      expect(timer_promise.isFulfilled()).to.be.false();
    });
    afterEach(() => {
      r.config({request_delay: initial_request_delay});
    });
  });

  describe('api/morechildren behavior', () => {
    let submission;
    beforeEach(() => {
      submission = r.getSubmission('2np694');
    });
    it('allows replies to be expanded by default for comment listings', async () => {
      const comments = await submission.comments;
      const initial_length = comments.length;
      const expanded_comments = await comments.fetchMore(10);
      expect(expanded_comments).to.have.lengthOf(initial_length + 10);
      expect(_.last(expanded_comments).replies).to.be.an.instanceof(snoowrap.objects.Listing);
      const nested_replies = _.compact(_.flatMap(expanded_comments, 'replies'));
      expect(nested_replies).to.not.be.empty();
      expect(nested_replies[0].replies).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('allows replies to not be expanded if an option is set', async () => {
      const comments = await submission.comments;
      const initial_length = comments.length;
      const expanded_comments = await comments.fetchMore({amount: 15, skip_replies: true});
      expect(expanded_comments).to.have.lengthOf(initial_length + 15);
      const nested_replies = _.compact(_.flatMap(expanded_comments.slice(-15), 'replies'));
      expect(nested_replies).to.be.empty();
    });
    it('can sequentially fetch more than 20 comment trees at a time', async () => {
      const comments = await submission.comments;
      const initial_length = comments.length;
      const expanded_comments = await comments.fetchMore(25);
      expect(expanded_comments.length).to.be.above(initial_length + 20);
    });
    it('correctly handles `more` objects in non-top-level comments', async () => {
      const initial_comment = await r._get({uri: 'comments/4fp36y/-/d2c5bbk', qs: {limit: 2}}).comments[0];
      expect(initial_comment.replies).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(initial_comment.replies.length).to.equal(1);
      expect(initial_comment.replies.is_finished).to.be.false();
      const expanded_replies = await initial_comment.replies.fetchAll();
      expect(expanded_replies).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(expanded_replies.length).to.be.at.least(2);
      expect(expanded_replies.is_finished).to.be.true();
    });
    it('correctly handles cases where retrieving all the top-level comments request more than two requests', async () => {
      const comments = await r.getSubmission('4fy9o0').comments.fetchMore({amount: 20});
      expect(comments.every(c => c instanceof snoowrap.objects.Comment)).to.be.true();
    });
  });

  describe("getting Listings containing 'continue this thread' messages", () => {
    it("correctly handles deep comment chains containing 'continue this thread' messages", async () => {
      const top_comment = r.getComment('d1apujx');
      const reps = await top_comment.replies.fetchAll();
      /* `l` is the replies Listing for the last visible comment in the chain; further replies must be fetched from
      the `continue this thread` link. */
      const l = reps[0].replies[0].replies[0].replies[0].replies[0].replies[0].replies[0].replies[0].replies[0].replies;
      expect(l).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(l.is_finished).to.be.false();
      const next_comment_list = await l.fetchMore({amount: 1});
      expect(l.is_finished).to.be.false();
      expect(next_comment_list).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(next_comment_list).to.have.lengthOf(1);
      // Check that next_comment_list can also fetch items and store them accordingly
      expect((await next_comment_list.fetchMore({amount: 1}))[0]).to.equal(next_comment_list[0]);
    });
    it('allows continued listings to be sequentially fetched', async () => {
      const reps = await r.getSubmission('4fp36y').comments[0].replies;
      const l = reps[0].replies[0].replies[0].replies[0].replies[0].replies[0].replies[0].replies[0].replies[0].replies;
      expect(l).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(l.is_finished).to.be.false();
      const l2 = await l.fetchMore({amount: 2});
      expect(l2).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(l2.length).to.equal(2);
      expect(_.map(l2, 'body')).to.eql(['Comment 11 (re: Comment 10)', 'Comment 12 (re: Comment 10)']);
      expect(l2.is_finished).to.be.false();
      const l3 = await l.fetchMore({amount: 3});
      const l21 = await l2.fetchMore({amount: 1});
      expect(_.map(l3, 'body')).to.eql(_.map(l21, 'body'));
    });
  });

  describe('expanding replies on an item', () => {
    it('can fetch all comments on a Submission', async () => {
      const sub = await r.getSubmission('4fp36y').fetch();
      const stripped_sub = sub.toJSON();
      const expanded = await sub.expandReplies();
      // Ensure that the original submission is unchanged.
      // Test the stringified versions rather than doing a deep comparison, because some private properties might have changed
      expect(sub.toJSON()).to.eql(stripped_sub);
      expect(expanded.toJSON()).to.not.eql(stripped_sub);
      expect(expanded.comments).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(expanded.comments.is_finished).to.be.true();
      expect(expanded.comments[0].replies).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(expanded.comments[0].replies.is_finished).to.be.true();
      const last_visible_path = `comments[0]${_.repeat('.replies[0]', 9)}`;
      const last_comment_on_original = _.get(sub, last_visible_path);
      const matching_comment_on_expanded = _.get(expanded, last_visible_path);
      expect(last_comment_on_original.body).to.equal(matching_comment_on_expanded.body);
      expect(last_comment_on_original.replies).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(last_comment_on_original.replies.is_finished).to.be.false();
      expect(matching_comment_on_expanded.replies).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(matching_comment_on_expanded.replies.is_finished).to.be.true();
      expect(matching_comment_on_expanded.replies[0]).to.be.an.instanceof(snoowrap.objects.Comment);
      // recursively check that all `replies` listings are finished
      const check_replies_finished = item => item.replies.is_finished && item.replies.every(check_replies_finished);
      expect(expanded.comments.every(check_replies_finished)).to.be.true();
      expect(sub.comments.every(check_replies_finished)).to.be.false();
    });
    it('can specify a depth limit when expanding replies', async () => {
      const sub = await r.getSubmission('4fp36y').fetch();
      const expanded_sub = await sub.expandReplies({depth: 10});
      const last_visible_path = `comments[0]${_.repeat('.replies[0]', 9)}`;
      const last_replies_listing = _.get(expanded_sub, last_visible_path).replies;
      expect(last_replies_listing).to.be.empty();
      expect(last_replies_listing.is_finished).to.be.false();
      const deeper_expanded_sub = await sub.expandReplies({depth: 11});
      const matching_last_listing = _.get(deeper_expanded_sub, last_visible_path).replies;
      expect(matching_last_listing).to.not.be.empty();
      expect(matching_last_listing.is_finished).to.be.true();
    });
    it('can specify a length limit when expanding replies', async () => {
      const sub = r.getSubmission('2np694');
      const expanded_sub = await sub.expandReplies({limit: 2, depth: 20});
      const fetched_sub = await sub.fetch();
      const getLastVisiblePath = comment => {
        return comment.replies.length ? 'replies[0]' + getLastVisiblePath(comment.replies[0]) : '';
      };
      const first_path = getLastVisiblePath(fetched_sub.comments[0]);
      const second_path = getLastVisiblePath(fetched_sub.comments[1]);
      const third_path = getLastVisiblePath(fetched_sub.comments[2]);
      const first_comment_deep_child = _.get(fetched_sub.comments[0], first_path);
      const first_comment_expanded_deep_child = _.get(expanded_sub.comments[0], first_path);
      const second_comment_deep_child = _.get(fetched_sub.comments[1], second_path);
      const second_comment_expanded_deep_child = _.get(expanded_sub.comments[1], second_path);
      const third_comment_deep_child = _.get(fetched_sub.comments[2], third_path);
      const third_comment_expanded_deep_child = _.get(expanded_sub.comments[2], third_path);
      expect(first_comment_deep_child.replies).to.be.empty();
      expect(first_comment_expanded_deep_child.replies).to.not.be.empty();
      expect(second_comment_deep_child.replies).to.be.empty();
      expect(second_comment_expanded_deep_child.replies).to.not.be.empty();
      expect(third_comment_deep_child.replies).to.be.empty();
      expect(third_comment_expanded_deep_child.replies).to.be.empty();
    });
  });

  describe('getting a list of posts', () => {
    it('can get hot posts from the front page', async () => {
      const posts = await r.getHot();
      expect(posts).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(posts).to.have.length.above(0).and.at.most(100);
      expect(await posts.fetchMore(101)).to.have.length.above(100);
    });
    it('can get best posts from the front page', async () => {
      const posts = await r.getBest();
      expect(posts).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(posts).to.have.length.above(0).and.at.most(100);
      expect(await posts.fetchMore(101)).to.have.length.above(100);
    });
    it('can get best posts when specifying limit', async () => {
      expect(await r.getBest({limit: 2})).to.have.lengthOf(2);
    });
    it('can get new posts from the front page', async () => {
      const posts = await r.getNew();
      expect(moment.unix(posts[0].created_utc).add(60, 'minutes').isAfter()).to.be.true();
      // i.e. the first post should be newer than 1 hour old, to be sure that this is actually the 'new' listing
    });
    it('can get top posts from the front page or a subreddit given a certain timespan', async () => {
      const top_alltime = await r.getSubreddit('all').getTop({time: 'all'})[0];
      const top_alltime_v2 = await r.getTop('all', {time: 'all'})[0];
      expect(top_alltime.name).to.eql(top_alltime_v2.name);
      expect(top_alltime.ups).to.be.above(50000);
      const top_in_last_day = await r.getTop({time: 'day'})[0];
      expect(moment.unix(top_in_last_day.created_utc).add(24, 'hours').isAfter()).to.be.true();
    });
    it('can get listings of posts without specifying a time or subreddit', async () => {
      expect(await r.getTop('gifs', {limit: 2})).to.have.lengthOf(2);
      expect(await r.getTop('gifs')).to.have.length.above(2);
      expect(await r.getTop({limit: 2})).to.have.lengthOf(2);
      expect(await r.getControversial('AskReddit', {limit: 2})).to.have.lengthOf(2);
      expect(await r.getControversial('AskReddit')).to.have.length.above(2);
      expect(await r.getNew({limit: 3})).to.have.lengthOf(3);
    });
    it('adds empty comment listings to a submission on the front page', async () => {
      const list = await r.getTop('gifs', {limit: 2});
      expect(list).to.have.lengthOf(2);
      expect(list[0]).to.be.an.instanceof(snoowrap.objects.Submission);
      expect(list[0].comments).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(list[0].comments).to.be.empty();
      expect(list[0].comments.is_finished).to.be.false();
      const comments = await list[0].comments.fetchMore({amount: 1});
      expect(comments).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(comments).to.have.lengthOf(1);
      expect(comments[0]).to.be.an.instanceof(snoowrap.objects.Comment);
      expect(comments.is_finished).to.be.false();
      const additional_comments = await comments.fetchMore({amount: 1});
      expect(additional_comments).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(additional_comments).to.have.lengthOf(2);
      expect(additional_comments.is_finished).to.be.false();
      expect(additional_comments._cachedLookahead).to.have.lengthOf(comments._cachedLookahead.length - 1);
    });
    it('can get rising posts', async () => {
      const list = await r.getRising('gifs', {limit: 2});
      expect(list).to.have.lengthOf(2);
      expect(list.every(post => post instanceof snoowrap.objects.Submission)).to.be.true();
      const list2 = await r.getSubreddit('gifs').getRising({limit: 2});
      expect(list2).to.have.lengthOf(2);
      expect(list2.every(post => post instanceof snoowrap.objects.Submission)).to.be.true();
      const list3 = await r.getRising({limit: 2});
      expect(list3).to.have.lengthOf(2);
      expect(list3.every(post => post instanceof snoowrap.objects.Submission)).to.be.true();
    });
    it('can get a post and a comment by fullname id', async () => {
      const listing = await r.getContentByIds(['t3_9l9vof', 't1_erx7tl8']);
      expect(listing).to.have.lengthOf(2);
      expect(listing[0] instanceof snoowrap.objects.Submission).to.be.true();
      expect(listing[1] instanceof snoowrap.objects.Comment).to.be.true();
    });
    it('can get a post and a comment by submission and comment object', async () => {
      const listing = await r.getContentByIds([r.getSubmission('9l9vof'), r.getComment('erx7tl8')]);
      expect(listing).to.have.lengthOf(2);
      expect(listing[0] instanceof snoowrap.objects.Submission).to.be.true();
      expect(listing[1] instanceof snoowrap.objects.Comment).to.be.true();
    });
    it('cant get multiple posts by regular id', async () => {
      const posts = () => r.getContentByIds(['9l9vof', '9la341']);
      expect(await posts).to.throw(TypeError);
    });
  });

  describe('self-property fetching', () => {
    it("gets information from the requester's own profile", async () => {
      const me = await r.getMe();
      expect(me).to.be.an.instanceof(snoowrap.objects.RedditUser);
      expect(me.name).to.equal(r._ownUserInfo.name); // (this doesn't necessarily mean that the name is correct)
      expect(me.name).to.be.a('string');
    });
    it("gets the requester's karma", async () => {
      const karma = await r.getKarma();
      expect(karma).to.be.an.instanceof(Array);
      if (karma.length) {
        expect(karma[0].sr).to.be.an.instanceof(snoowrap.objects.Subreddit);
      }
    });
    it('gets current preferences', async () => {
      const prefs = await r.getPreferences();
      expect(prefs.lang).to.be.a('string');
    });
    it('modifies current preferences', async () => {
      const current_prefs = await r.getPreferences().min_link_score;
      await r.updatePreferences({min_link_score: current_prefs - 1});
      const fixed_prefs = await r.getPreferences().min_link_score;
      expect(fixed_prefs).not.to.equal(current_prefs);
      // (Fix the preferences afterwards, since I'd rather this value not decrease every time I run these tests)
      await r.updatePreferences({min_link_score: current_prefs});
    });
    it("gets the current user's trophies", async () => {
      expect(await r.getMyTrophies()).to.be.an.instanceof(snoowrap.objects.TrophyList);
    });
    it("gets the user's friends", async () => {
      expect(await r.getFriends()).to.be.an.instanceof(Array);
    });
    it('gets a list of blocked users', async () => {
      expect(await r.getBlockedUsers()).to.be.an.instanceof(Array);
    });
    it.skip('checks whether the current account needs to fill out a captcha to post', async () => {
      expect(await r.checkCaptchaRequirement()).to.be.a('boolean');
    });
    it.skip('can fetch a new captcha on request', async () => {
      const iden = await r.getNewCaptchaIdentifier();
      expect(iden).to.be.a('string');
      const image = await r.getCaptchaImage(iden);
      expect(image).to.be.ok();
    });
  });

  describe('subreddit flair', () => {
    let sub;
    before(() => {
      sub = r.getSubreddit('snoowrap_testing');
    });
    it('can add/delete/fetch user flair templates', async () => {
      const text = moment().format(); // Use the current timestamp as the flair text to make it easy to distinguish
      await sub.createUserFlairTemplate({text, css_class: ''});
      const added_flair = _.last(await sub.getUserFlairTemplates());
      expect(added_flair.flair_text).to.equal(text);
      await sub.deleteFlairTemplate(added_flair);
      const user_flairs_afterwards = await sub.getUserFlairTemplates();
      expect(user_flairs_afterwards.length === 0 || _.last(user_flairs_afterwards).flair_text !== text).to.be.true();
    });
    it('can add/delete/fetch link flair templates', async () => {
      const text = moment().format();
      await sub.createLinkFlairTemplate({text, css_class: '', text_editable: true});
      // Use a random link on the sub -- it doesn't seem to be possible to get the link flair options without providing a link
      const added_flair = _.last(await sub._getFlairOptions({link: 't3_43qlu8'}).choices);
      expect(added_flair.flair_text).to.equal(text);
      await sub.deleteFlairTemplate(added_flair);
      const link_flairs_afterwards = await sub._getFlairOptions({link: 't3_43qlu8'}).choices;
      expect(link_flairs_afterwards.length === 0 || _.last(link_flairs_afterwards).flair_text !== text).to.be.true();
    });
    it('can delete all user flair templates', async () => {
      await Promise.all([
        sub.createUserFlairTemplate({text: 'some user flair text'}),
        sub.createUserFlairTemplate({text: 'some user other flair text'})
      ]);
      await sub.deleteAllUserFlairTemplates();
      expect(await sub.getUserFlairTemplates()).to.eql([]);
    });
    it('can delete all link flair templates', async () => {
      await Promise.all([
        sub.createLinkFlairTemplate({text: 'some link flair text'}),
        sub.createLinkFlairTemplate({text: 'some other link flair text'})
      ]);
      await sub.deleteAllLinkFlairTemplates();
      expect(await sub._getFlairOptions({link: 't3_43qlu8'}).choices).to.eql([]);
    });
    it('can assign flair to a user', async () => {
      const user1 = r.getUser('not_an_aardvark');
      const user2 = r.getUser('actually_an_aardvark');
      const flair_text = moment().format();
      await user1.assignFlair({subreddit_name: sub.display_name, text: flair_text});
      expect(await sub.getUserFlair(user1.name).flair_text).to.equal(flair_text);
      await user2.assignFlair({subreddit_name: sub.display_name, text: flair_text});
      expect(await sub.getUserFlair(user2.name).flair_text).to.equal(flair_text);
    });
    it('can assign flair to a submission', async () => {
      /* The submission's flair is cached by reddit for a few minutes, so there's not really any reliable way to verify that
      the flair text was set successfully while still having the tests run in a reasonable amount of time. If nothing else,
      send the request and make sure no error is returned. */
      await r.getSubmission('443bn7').assignFlair({text: moment().format()});
    });
    it('can select its own user flair', async () => {
      const text = moment().format();
      await sub.createUserFlairTemplate({text});
      const flair_template_id = _.last(await sub.getUserFlairTemplates()).flair_template_id;
      await sub.selectMyFlair({flair_template_id});
      expect(await sub.getMyFlair().flair_text).to.equal(text);
      await sub.deleteAllUserFlairTemplates();
    });
    it('can select link flair for its post', async () => {
      const text = `${moment().format()} (self-selected)`;
      await sub.createLinkFlairTemplate({text});
      const submission = r.getSubmission('443bn7');
      const flair_template_id = _.last(await submission.getLinkFlairTemplates()).flair_template_id;
      await submission.selectFlair({flair_template_id});
      expect(await submission.refresh().link_flair_text).to.equal(text);
      await sub.deleteAllLinkFlairTemplates();
    });
  });

  describe.skip('Subreddit#setMultipleUserFlairs', () => {
    let sub;
    beforeEach(async () => {
      sub = r.getSubreddit('snoowrap_testing');
      await r.getUser('not_an_aardvark').assignFlair({subreddit_name: sub.display_name, text: 'foo', css_class: 'bar'});
      await r.getUser('actually_an_aardvark').assignFlair({subreddit_name: sub.display_name, text: 'baz', css_class: 'quux'});
      await Promise.delay(3000);
      const naa_previous_flair = await sub.getUserFlair('not_an_aardvark');
      const aaa_previous_flair = await sub.getUserFlair('actually_an_aardvark');
      expect(naa_previous_flair.flair_text).to.equal('foo');
      expect(naa_previous_flair.flair_css_class).to.equal('bar');
      expect(aaa_previous_flair.flair_text).to.equal('baz');
      expect(aaa_previous_flair.flair_css_class).to.equal('quux');
    });
    it('can change multiple user flairs at once', async () => {
      await sub.setMultipleUserFlairs([
        {name: 'not_an_aardvark', text: "not_an_aardvark's flair", css_class: 'naa-css-class'},
        {name: 'actually_an_aardvark', text: "actually_an_aardvark's flair", css_class: 'aaa-css-class'}
      ]);
      await Promise.delay(3000);
      const naa_afterwards_flair = await sub.getUserFlair('not_an_aardvark');
      const aaa_afterwards_flair = await sub.getUserFlair('actually_an_aardvark');
      expect(naa_afterwards_flair.flair_text).to.equal("not_an_aardvark's flair");
      expect(naa_afterwards_flair.flair_css_class).to.equal('naa-css-class');
      expect(aaa_afterwards_flair.flair_text).to.equal("actually_an_aardvark's flair");
      expect(aaa_afterwards_flair.flair_css_class).to.equal('aaa-css-class');
    });
    it('rejects with an array if a flair is invalid', async () => {
      await sub.setMultipleUserFlairs([
        {name: 'not_an_aardvark', text: "not_an_aardvark's flair", css_class: 'naa-css-class'},
        {name: 'actually_an_aardvark', text: "actually_an_aardvark's flair", css_class: "this isn't a valid css class"}
      ]).then(expect.fail, err => {
        expect(err).to.eql([{
          status: 'skipped',
          errors: {css: "invalid css class `this isn't a valid css class', ignoring"},
          ok: false,
          warnings: {}
        }]);
      });
      await Promise.delay(3000);
      const naa_afterwards_flair = await sub.getUserFlair('not_an_aardvark');
      const aaa_afterwards_flair = await sub.getUserFlair('actually_an_aardvark');
      expect(naa_afterwards_flair.flair_text).to.equal("not_an_aardvark's flair");
      expect(naa_afterwards_flair.flair_css_class).to.equal('naa-css-class');
      expect(aaa_afterwards_flair.flair_text).to.equal('baz');
      expect(aaa_afterwards_flair.flair_css_class).to.equal('quux');
    });
    it('can set multiple user flairs even if the flair text contains special characters', async () => {
      const special_chars_string = '!@#$%^&*();\'\\"""∑œ´®œçœ∑|\\"""",<.>>.<,"\\\';)(*%$#@!';
      await sub.setMultipleUserFlairs([
        {name: 'not_an_aardvark', text: special_chars_string, css_class: 'naa-css-class'},
        {name: 'actually_an_aardvark', text: "actually_an_aardvark's flair", css_class: 'aaa-css-class'}
      ]);
      await Promise.delay(3000);
      const naa_afterwards_flair = await sub.getUserFlair('not_an_aardvark');
      const aaa_afterwards_flair = await sub.getUserFlair('actually_an_aardvark');
      expect(naa_afterwards_flair.flair_text).to.equal(special_chars_string);
      expect(naa_afterwards_flair.flair_css_class).to.equal('naa-css-class');
      expect(aaa_afterwards_flair.flair_text).to.equal("actually_an_aardvark's flair");
      expect(aaa_afterwards_flair.flair_css_class).to.equal('aaa-css-class');
    });
  });

  describe('api/flairlist Listings', () => {
    let sub;
    beforeEach(() => {
      sub = r.getSubreddit('snoowrap_testing');
    });
    it('treats responses from the api/flairlist endpoint as Listings', async () => {
      expect(await sub.getUserFlairList()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('passes query parameters from getUserFlairList() to the resulting Listing', async () => {
      expect(await sub.getUserFlairList({limit: 10})).to.have.lengthOf(10);
      expect(await sub.getUserFlairList({limit: 20})).to.have.lengthOf(20);
    });
    it('parses the `next` and `prev` properties from the JSON response correctly', async () => {
      expect(await sub.getUserFlairList().is_finished).to.be.false();
    });
    it('casts the users in the list to RedditUser objects', async () => {
      expect(await sub.getUserFlairList({limit: 1})[0].user).to.be.an.instanceof(snoowrap.objects.RedditUser);
    });
    it('can fetch more items in a flair list', async () => {
      const initial = await sub.getUserFlairList({limit: 1});
      expect(initial).to.have.lengthOf(1);
      expect(await initial.fetchMore({amount: 201})).to.have.lengthOf(202);
    });
    it('can start from a specific point in the flair list', async () => {
      const initial = await sub.getUserFlairList({limit: 1});
      const after_id = initial._query.after;
      const next_username = await initial.fetchMore({amount: 1})[1].user.name;
      expect(await sub.getUserFlairList({limit: 1, after: after_id})[0].user.name).to.equal(next_username);
    });
    it('can paginate in reverse through the flair list', async () => {
      const initial = await sub.getUserFlairList({limit: 10});
      const before_id = initial._query.after;
      const reversed = await sub.getUserFlairList({limit: 5, before: before_id});
      expect(reversed).to.have.lengthOf(5);
      expect(reversed.is_finished).to.be.false();
      expect(_.map(reversed, 'user.name')).to.eql(_.map(initial, 'user.name').slice(4, -1));
      const reversed_expanded = await reversed.fetchMore({amount: 2});
      expect(reversed_expanded).to.have.lengthOf(7);
      expect(reversed_expanded.is_finished).to.be.false();
      expect(_.map(reversed_expanded, 'user.name')).to.eql(_.map(initial, 'user.name').slice(2, -1));
      const reversed_fully_expanded = await reversed_expanded.fetchMore({amount: 10});
      expect(reversed_fully_expanded).to.have.lengthOf(9);
      expect(reversed_fully_expanded.is_finished).to.be.true();
      expect(_.map(reversed_fully_expanded, 'user.name')).to.eql(_.map(initial, 'user.name').slice(0, -1));
      const reversed_fully_expanded_v2 = await sub.getUserFlairList({limit: 20, before: before_id});
      expect(reversed_fully_expanded_v2.is_finished).to.be.true();
      expect(_.map(reversed_fully_expanded_v2, 'user.name')).to.eql(_.map(reversed_fully_expanded, 'user.name'));
    });
  });

  describe('lists of subreddits', () => {
    it('can get my subscriptions', async () => {
      const subs = await r.getSubscriptions({limit: 3});
      expect(subs).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(subs).to.have.length.of.at.most(3);
      expect(subs[0]).to.be.an.instanceof(snoowrap.objects.Subreddit);
    });
    it('can get my contributor subreddits', async () => {
      const subs = await r.getContributorSubreddits({limit: 3});
      expect(subs).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(subs).to.have.length.of.at.most(3);
      expect(subs[0]).to.be.an.instanceof(snoowrap.objects.Subreddit);
    });
    it('can get my moderated subreddits', async () => {
      const subs = await r.getModeratedSubreddits({limit: 3});
      expect(subs).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(subs).to.have.length.of.at.most(3);
      expect(subs[0]).to.be.an.instanceof(snoowrap.objects.Subreddit);
    });
    it('can get popular subreddits', async () => {
      const subs = await r.getPopularSubreddits({limit: 3});
      expect(subs).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(subs).to.have.length.of.at.most(3);
      expect(subs[0]).to.be.an.instanceof(snoowrap.objects.Subreddit);
    });
    it('can get new subreddits', async () => {
      const subs = await r.getNewSubreddits({limit: 3});
      expect(subs).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(subs).to.have.length.of.at.most(3);
      expect(subs[0]).to.be.an.instanceof(snoowrap.objects.Subreddit);
    });
    it('can get default subreddits', async () => {
      const subs = await r.getDefaultSubreddits({limit: 3});
      expect(subs).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(subs).to.have.length.of.at.most(3);
      expect(subs[0]).to.be.an.instanceof(snoowrap.objects.Subreddit);
    });
  });

  describe('getting subreddit mod listings', () => {
    let sub;
    before(async () => {
      sub = r.getSubreddit('snoowrap_testing');
      await r.getComment('czn0rpn').remove().approve(); // Adds some events to the modlog for easier confirmation tests
    });
    it('can get the full modlog', async () => {
      const log = await sub.getModerationLog();
      expect(log[0].action).to.equal('approvecomment');
      expect(log[1].action).to.equal('removecomment');
    });
    it('can filter the modlog by event type', async () => {
      const log = await sub.getModerationLog({type: 'removecomment'});
      expect(log[0].action).to.equal('removecomment');
    });
    it('can filter the modlog by moderator', async () => {
      const log = await sub.getModerationLog({mods: [await r.getMe().name]});
      expect(log[0].action).to.equal('approvecomment');
      const log2 = await sub.getModerationLog({mods: ['not_a_mod']});
      expect(log2).to.be.empty();
    });
    it('can get reported items', async () => {
      expect(await sub.getReports()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can get removed items', async () => {
      expect(await sub.getSpam()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can get the modqueue', async () => {
      expect(await sub.getModqueue()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can get unmoderated items', async () => {
      expect(await sub.getUnmoderated()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can get edited items', async () => {
      expect(await sub.getEdited()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can get replies to edited items', async () => {
      const editedItems = await sub.getEdited();
      const editedCommentWithReply = editedItems.find(comment => comment.body === 'foo bar (edited)');
      expect(editedCommentWithReply.replies.isFinished).to.be.false();
      expect(await editedCommentWithReply.replies.fetchAll().get('length')).to.be.above(0);
    });
  });

  describe('comment/post actions', () => {
    let post, comment;
    beforeEach(() => {
      post = r.getSubmission('47ybh5');
      comment = r.getComment('d0g704c');
    });
    it('can edit a selfpost', async () => {
      const new_text = moment().format();
      await post.edit(new_text);
      expect(await post.refresh().selftext).to.equal(new_text);
    });
    it('can edit a comment', async () => {
      const new_text = moment().format();
      await comment.edit(new_text);
      expect(await comment.refresh().body).to.equal(new_text);
    });
    it('can distinguish/undistinguish/sticky a comment', async () => {
      await comment.undistinguish();
      await comment.distinguish().refresh();
      expect(await comment.distinguished).to.equal('moderator');
      expect(await comment.stickied).to.be.false();
      await comment.distinguish({sticky: true}).refresh();
      expect(await comment.distinguished).to.equal('moderator');
      await comment.undistinguish().refresh();
      expect(await comment.distinguished).to.be.null();
    });
    it('can save/unsave a post', async () => {
      await post.save();
      expect(await post.saved).to.be.true();
      await post.unsave().refresh();
      expect(await post.saved).to.be.false();
    });
    it('can save/unsave a comment', async () => {
      await comment.save();
      expect(await comment.saved).to.be.true();
      await comment.unsave().refresh();
      expect(await comment.saved).to.be.false();
    });
    it('can remove/approve a post', async () => {
      await post.remove().refresh();
      expect(post.banned_by.value()).to.not.be.null();
      expect(post.approved_by.value()).to.be.null();
      await post.approve().refresh();
      expect(post.banned_by.value()).to.be.null();
      expect(post.approved_by.value()).to.not.be.null();
    });
    it('can remove/approve a comment', async () => {
      await comment.remove().refresh();
      expect(comment.banned_by.value()).to.not.be.null();
      expect(comment.approved_by.value()).to.be.null();
      await comment.approve().refresh();
      expect(comment.banned_by.value()).to.be.null();
      expect(comment.approved_by.value()).to.not.be.null();
    });
  });

  describe('private messages', () => {
    // Threads used for these tests:
    // PMs: https://i.gyazo.com/24f3b97e55b6ff8e3a74cb026a58b167.png
    // Modmails: https://i.gyazo.com/f0e6de4190c7eef5368f9d12c25bacc7.png
    let message1, message2, message3, message4;
    beforeEach(() => {
      message1 = r.getMessage('51shnw');
      message2 = r.getMessage('51shsd');
      message3 = r.getMessage('51shxv');
      message4 = r.getMessage('51si23');
    });
    it('can get the contents of the first message in a chain', async () => {
      expect(await message1.body).to.equal('PM 1: snoowrap_testing --> not_an_aardvark');
    });
    it('can get the contents of a message later in a chain', async () => {
      expect(await message2.body).to.equal('PM 2 (re: PM 1): not_an_aardvark --> snoowrap_testing');
      expect(await message4.body).to.equal('PM 4 (re: PM 2): snoowrap_testing --> not_an_aardvark');
    });
    it('arranges PM replies into a tree', async () => {
      const root = await message1.fetch();
      expect(root.replies).to.have.lengthOf(2);
      expect(root.replies[0].name).to.equal(message2.name);
      expect(root.replies[1].name).to.equal(message3.name);
      expect(root.replies[0].replies).to.have.lengthOf(1);
      expect(root.replies[0].replies[0].name).to.equal(message4.name);
    });
    it('can get replies to a message', async () => {
      expect(await message1.replies[0].name).to.equal(message2.name);
    });
    it('can mark a message as unread/read', async () => {
      expect(await message3.markAsUnread().refresh().new).to.be.true();
      expect(await message3.markAsRead().refresh().new).to.be.false();
    });
    it('can read/unread multiple messages simultaneously', async () => {
      await r.markMessagesAsUnread([message2, message3]);
      expect(await message2.new).to.be.true();
      expect(await message3.new).to.be.true();
      await r.markMessagesAsRead([message2.name, message3.name.slice(3)]);
      expect(await message2.refresh().new).to.be.false();
      expect(await message3.refresh().new).to.be.false();
    });
    it('can handle comment objects in mark_messages_as_[un]read', async () => {
      await r.markMessagesAsUnread([message2.name, 't1_d403ctb']);
      expect(await message2.new).to.be.true();
      expect(_.map(await r.getUnreadMessages(), 'name')).to.include('t1_d403ctb');
      await r.markMessagesAsRead([message2.name, 't1_d403ctb']);
      expect(await message2.refresh().new).to.be.false();
      expect(_.map(await r.getUnreadMessages(), 'name')).to.not.include('t1_d403ctb');
    });
    it("doesn't throw an error when fetching messages without replies", async () => {
      // https://i.gyazo.com/ea5c7e9e4224805665f71571c1abc5f4.png
      const message = await r.getMessage('6vp176').fetch();
      expect(message.body).to.equal('foo bar');
      expect(message.replies.length).to.equal(0);
    });
  });

  describe('inbox operations', () => {
    let message;
    before(async () => {
      message = r.getMessage('51shsd');
      await message.markAsUnread(); // Used to make sure things can be marked properly from the inbox
    });
    it('can get a list of new messages in an inbox', async () => {
      const new_messages = await r.getUnreadMessages({mark: false, limit: 1});
      expect(await new_messages[0].refresh().new).to.be.true();
      await r.getUnreadMessages({mark: true});
    });
    it('can get modmail for all moderated subs', async () => {
      const modmail = await r.getModmail({limit: 1});
      expect(modmail).to.have.lengthOf(1);
      expect(modmail[0]).to.be.an.instanceof(snoowrap.objects.PrivateMessage);
      expect(modmail[0].subreddit).to.be.an.instanceof(snoowrap.objects.Subreddit);
    });
    it('can get modmail for a specific sub', async () => {
      const modmail = await r.getSubreddit('snoowrap_testing').getModmail({limit: 1});
      expect(modmail).to.have.lengthOf(1);
      expect(modmail[0]).to.be.an.instanceof(snoowrap.objects.PrivateMessage);
      expect(modmail[0].subreddit.display_name).to.equal('snoowrap_testing');
    });
    it('can get a list of sent messages', async () => {
      const sent = await r.getSentMessages({limit: 1});
      expect(sent).to.have.lengthOf(1);
      expect(sent[0]).to.be.an.instanceof(snoowrap.objects.PrivateMessage);
      expect(sent[0].author.name).to.equal(await r.getMe().name);
    });
    it('can use a filter parameter to categorize messages', async () => {
      const messages = await r.getInbox({filter: 'messages'});
      expect(messages.every(m => m instanceof snoowrap.objects.PrivateMessage)).to.be.true();
      const self_replies = await r.getInbox({filter: 'comments'});
      expect(self_replies.every(m => m instanceof snoowrap.objects.Comment)).to.be.true();
    });
    after(async () => {
      await message.markAsRead();
    });
  });

  describe('search', () => {
    it.skip('can search for posts based on various parameters', async () => {
      const results = await r.search({
        subreddit: 'AskReddit',
        query: 'What tasty food would be distusting if eaten over rice?', // (sic)
        sort: 'relevance',
        time: 'all',
        limit: 2
      });
      expect(results).to.have.lengthOf(2);
      expect(results[0]).to.be.an.instanceof(snoowrap.objects.Submission);
      expect(results[0].author.name).to.equal('DO_U_EVN_SPAGHETTI');
      expect(await results.fetchMore(2)).to.have.lengthOf(4);
    });
    it.skip('can search a given subreddit for posts', async () => {
      const results = await r.getSubreddit('askreddit').search({query: 'e', limit: 5});
      expect(results).to.have.lengthOf(5);
      for (let i = 0; i < results.length; i++) {
        expect(results[i].subreddit.display_name).to.equal('AskReddit');
      }
    });
    it('can search for a list of subreddits by name', async () => {
      const results = await r.searchSubredditNames({query: 'AskReddit'});
      expect(Array.isArray(results)).to.be.true();
    });
    // honestly I have no idea why there are three separate subreddit search functions
    it('can search for a list of subreddits by name and description', async () => {
      const results = await r.searchSubreddits({query: 'AskReddit', limit: 5});
      expect(results).to.have.length.of.at.most(5);
      expect(results).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(results[0]).to.be.an.instanceof(snoowrap.objects.Subreddit);
    });
  });

  describe('modifying user status', () => {
    let sub, victim;
    beforeEach(() => {
      sub = r.getSubreddit('snoowrap_testing');
      victim = r.getUser('actually_an_aardvark');
    });
    it('can ban/unban a user from a subreddit', async () => {
      await sub.banUser({name: victim.name, ban_message: 'banned for stuff', ban_note: 'test note'});
      await Promise.delay(3000);
      expect(await sub.getBannedUsers({name: victim.name})).to.have.lengthOf(1);
      await sub.unbanUser(victim);
      await Promise.delay(3000);
      expect(await sub.getBannedUsers({name: victim.name})).to.have.lengthOf(0);
    });
    it('can add/remove an approved submitter from a subreddit', async () => {
      await sub.addContributor(victim);
      await Promise.delay(3000);
      expect(await sub.getContributors({name: victim.name})).to.have.lengthOf(1);
      await sub.removeContributor(victim);
      await Promise.delay(3000);
      expect(await sub.getContributors({name: victim.name})).to.have.lengthOf(0);
    });
    it('can wikiban/unwikiban a user from a subreddit', async () => {
      await sub.wikibanUser(victim);
      await Promise.delay(3000);
      expect(await sub.getWikibannedUsers({name: victim.name})).to.have.lengthOf(1);
      await sub.unwikibanUser(victim);
      await Promise.delay(3000);
      expect(await sub.getWikibannedUsers({name: victim.name})).to.have.lengthOf(0);
    });
    it('can add/remove a user from approved wiki editor status on a subreddit', async () => {
      await sub.addWikiContributor(victim);
      await Promise.delay(3000);
      expect(await sub.getWikiContributors({name: victim.name})).to.have.lengthOf(1);
      await sub.removeWikiContributor(victim);
      await Promise.delay(3000);
      expect(await sub.getWikiContributors({name: victim.name})).to.have.lengthOf(0);
    });
    it("can change a moderator's permissions on a subreddit", async () => {
      await sub.setModeratorPermissions({name: 'not_an_aardvark', permissions: ['flair', 'wiki']});
      await Promise.delay(3000);
      expect(await sub.getModerators({name: 'not_an_aardvark'})[0].mod_permissions.sort()).to.eql(['flair', 'wiki']);
      await sub.setModeratorPermissions({name: 'not_an_aardvark'});
      await Promise.delay(3000);
      expect(await sub.getModerators({name: 'not_an_aardvark'})[0].mod_permissions).to.eql(['all']);
    });
    it('can add/remove a user as a friend', async () => {
      await victim.friend();
      await Promise.delay(3000);
      expect(await victim.getFriendInformation().name).to.equal(victim.name);
      await victim.unfriend();
      await Promise.delay(3000);
      await victim.getFriendInformation().then(expect.fail, res => expect(res.statusCode).to.equal(400));
    });
  });

  describe('miscellaneous API calls', () => {
    it('can get a list of oauth scopes', async () => {
      expect(await r.getOauthScopeList()).to.have.property('creddits');
    });
    it('can check whether a given username is available', async function () {
      if (isBrowser) {
        return this.skip();
      }
      expect(await r.checkUsernameAvailability('not_an_aardvark')).to.be.false();
    });
  });

  (isBrowser ? describe.skip : describe)('wiki content', () => {
    let page1, page2;
    before(() => {
      const sub = r.getSubreddit('snoowrap_testing');
      page1 = sub.getWikiPage('exciting_page_name');
      page2 = sub.getWikiPage('another_exciting_page_name');
    });
    it('can get the content of a wiki page', async () => {
      expect(page1).to.be.an.instanceof(snoowrap.objects.WikiPage);
      expect(await page1.content_md).to.equal('blah blah blah content');
    });
    it('can add/remove an editor to a wiki page', async () => {
      await page1.addEditor({name: 'actually_an_aardvark'});
      expect(_.map(await page1.getSettings().editors, 'name')).to.include('actually_an_aardvark');
      await page1.removeEditor({name: 'actually_an_aardvark'});
      expect(_.map(await page1.getSettings().editors, 'name')).to.not.include('actually_an_aardvark');
    });
    it('can edit the settings on a wiki page', async () => {
      await page1.editSettings({listed: true, permission_level: 2});
      expect(await page1.getSettings().permlevel).to.equal(2);
      await page1.editSettings({listed: true, permission_level: 0});
      expect(await page1.getSettings().permlevel).to.equal(0);
    });
    it('can edit a wiki page', async () => {
      const new_content = moment().format();
      await page2.edit({text: new_content, reason: `unit tests ${new_content}`});
      expect(await page2.refresh().content_md).to.equal(new_content);
    });
    it('can get the revision history for a wiki page', async () => {
      expect(await page2.getRevisions()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can get the wiki revision history for a subreddit', async () => {
      expect(await r.getSubreddit('snoowrap_testing').getWikiRevisions()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can revert to a given revision', async () => {
      const history = await page2.getRevisions();
      await page2.revert(history[1]);
      const updated_history = await page2.getRevisions();
      expect(history[0].id).to.equal(updated_history[1].id);
      expect(_.find(history, updated_history[0])).to.be.undefined();
    });
    it('can get the discussions for a wiki page', async () => {
      expect(await page2.getDiscussions()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can get a list of wiki pages on a subreddit', async () => {
      const pages = await r.getSubreddit('snoowrap_testing').getWikiPages();
      expect(pages).to.be.an.instanceof(Array);
      expect(pages[0]).to.be.an.instanceof(snoowrap.objects.WikiPage);
    });
  });

  describe.skip('livethreads', () => {
    let thread;
    before(async () => {
      // Since these tests were added, reddit introduced a change where livethreads are automatically closed after a week
      // of inactivity. As a result, the tests usually fail unless they're run more than once per week, because the
      // hardcoded livethread ID is closed. Eventually it would be good to have a better solution to this, but for now
      // the tests can be run by creating a livethread and replacing the id in the line below with the id of the livethread.
      // The authenticated account must be a contributor on the livethread.
      thread = r.getLivethread('yogc2rqi1dmc');
      await thread.fetch();
    });
    it('can add and listen for content on a livethread using websockets', done => {
      const new_update = moment().format();
      thread.addUpdate(new_update);
      thread.stream.once('update', data => {
        expect(data.body).to.equal(new_update);
        done();
      });
    });
    it('can delete an update', done => {
      // eslint-disable-next-line promise/catch-or-return
      thread.getRecentUpdates()[0].then(most_recent_update => {
        thread.deleteUpdate(most_recent_update);
      });
      thread.stream.once('delete', () => done());
    });
    it('can edit the settings on a livethread', async () => {
      const new_description = moment().format();
      await thread.editSettings({description: new_description, title: 'test livethread'});
      expect(await thread.refresh().description).to.equal(new_description);
    });
    it('can invite a contributor, then revoke the invitation', async () => {
      await thread.revokeContributorInvite({name: 'actually_an_aardvark'});
      await thread.inviteContributor({name: 'actually_an_aardvark'});
      await thread.inviteContributor({name: 'actually_an_aardvark'}).then(expect.fail, _.noop);
    });
    it('can strike an update', done => {
      // eslint-disable-next-line promise/catch-or-return
      thread.getRecentUpdates()[0].then(most_recent_update => {
        thread.strikeUpdate(most_recent_update);
      });
      thread.stream.once('strike', () => done());
    });
    it('can get recent updates on a livethread', async () => {
      expect(await thread.getRecentUpdates()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can get the discussions on a livethread', async () => {
      expect(await thread.getDiscussions()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can modify the permissions of contributors on a livethread', async () => {
      await thread.setContributorPermissions({name: 'not_an_aardvark', permissions: ['edit']});
      expect(_.find(await thread.getContributors(), {name: 'not_an_aardvark'}).permissions).to.eql(['edit']);
      await thread.setContributorPermissions({name: 'not_an_aardvark'});
      expect(_.find(await thread.getContributors(), {name: 'not_an_aardvark'}).permissions).to.eql(['all']);
    });
    it('can get the "happening now" livethread, if it exists', async () => {
      // Sometimes there won't be a thread, in which case a 404 error will be returned.
      await r.getStickiedLivethread().catch({statusCode: 404}, _.noop);
    });
    after(() => {
      thread.closeStream();
    });
  });

  describe('multireddits', () => {
    let multi, my_multi;
    before(async () => {
      multi = r.getUser('Lapper').getMultireddit('depthhub');
      await r.getMe().getMultireddits().then(my_multis => Promise.map(my_multis, m => m.delete()));
      my_multi = await multi.copy({new_name: require('crypto').randomBytes(8).toString('hex')});
    });
    it('can get information about a multireddit', async () => {
      const subs = await multi.subreddits;
      expect(subs).to.be.an.instanceof(Array);
      expect(subs[0]).to.be.an.instanceof(snoowrap.objects.Subreddit);
      expect(subs.map(sub => sub.display_name)).to.include('linguistics');
    });
    it('can copy and delete a multireddit', async () => {
      const copied = await multi.copy({new_name: 'copied_multi'});
      expect(copied).to.be.an.instanceof(snoowrap.objects.MultiReddit);
      expect(copied.name).to.equal('copied_multi');
    });
    it("can get a list of the requester's multireddits", async () => {
      const mine = await r.getMyMultireddits();
      expect(mine).to.be.an.instanceof(Array);
      expect(mine[0]).to.be.an.instanceof(snoowrap.objects.MultiReddit);
    });
    it('can get a list of multireddits belonging to a given user', async () => {
      const multis = await r.getUser('snoowrap_testing').getMultireddits();
      expect(multis).to.be.an.instanceof(Array);
      expect(multis[0]).to.be.an.instanceof(snoowrap.objects.MultiReddit);
    });
    // deprecated endpoint
    it.skip('can rename a multireddit', async () => {
      const new_name = require('crypto').randomBytes(8).toString('hex');
      await my_multi.rename({new_name});
      expect(my_multi.name).to.equal(new_name);
    });
    it('can create a multireddit', async () => {
      const multi_name = require('crypto').randomBytes(8).toString('hex');
      const new_multi = await r.createMultireddit({name: multi_name, subreddits: ['snoowrap_testing', 'Cookies']});
      expect(new_multi.name).to.equal(multi_name);
      expect(_.map(new_multi.subreddits, 'display_name').sort()).to.eql(['Cookies', 'snoowrap_testing']);
    });
    it('can rename a multireddit\'s display name', async () => {
      const new_name = require('crypto').randomBytes(8).toString('hex');
      const edited_multi = await my_multi.edit({name: new_name});
      expect(edited_multi.display_name).to.equal(new_name);
    });
    it('can delete a multireddit', async () => {
      // Deleting a multi seems to randomly fail on Reddit's end sometimes, even when it returns a 200 response.
      const new_name = require('crypto').randomBytes(8).toString('hex');
      const temp_multi = await my_multi.copy({new_name});
      await temp_multi.delete();
    });
    it("can update a multireddit's information", async () => {
      const timestamp = moment().format();
      await my_multi.edit({description: timestamp});
      expect(await my_multi.refresh().description_md).to.equal(timestamp);
    });
    it('can add/remove a subreddit from a multireddit', async () => {
      await my_multi.addSubreddit('gifs');
      expect(_.map(await my_multi.refresh().subreddits, 'display_name')).to.include('gifs');
      await my_multi.removeSubreddit('gifs');
      expect(_.map(await my_multi.refresh().subreddits, 'display_name')).to.not.include('gifs');
    });
  });

  describe('Creating new content (tests skipped by default to avoid spam)', () => {
    // These should all pass, but they're skipped by default to avoid spam since they permanently write content to reddit.
    it.skip('can create a linkpost given a subreddit object, and then delete the post', async () => {
      const title = `snoowrap unit tests: ${moment().format()}`;
      const new_link = await r.getSubreddit('snoowrap_testing').submitLink({title, url: 'https://reddit.com'});
      expect(new_link).to.be.an.instanceof(snoowrap.objects.Submission);
      expect(await new_link.title).to.equal(title);
      await new_link.delete();
      expect(await new_link.refresh().author.name).to.equal('[deleted]');
    });
    it.skip('can create a selfpost given a subreddit object, and then delete the post', async () => {
      const title = `snoowrap unit tests: ${moment().format()}`;
      const new_selfpost = await r.getSubreddit('snoowrap_testing').submitSelfpost({title, text: 'yay cookies'});
      expect(new_selfpost).to.be.an.instanceof(snoowrap.objects.Submission);
      expect(await new_selfpost.title).to.equal(title);
      await new_selfpost.delete();
      expect(await new_selfpost.refresh().author.name).to.equal('[deleted]');
    });
    describe.skip('crossposts', () => {
      before(async () => {
        await r.getSubreddit('snoowrap_testing').subscribe();
      });
      after(async () => {
        await r.getSubreddit('snoowrap_testing').unsubscribe();
      });
      it('can create a crosspost', async () => {
        const title = 'foo';
        const newPost = await r.submitCrosspost({title, subredditName: 'snoowrap_testing', originalPost: '6vths0'});
        expect(newPost).to.be.an.instanceof(snoowrap.objects.Submission);
        expect(await newPost.title).to.equal(title);
      });
      it('can create a crosspost from a subreddit instance', async () => {
        const title = 'foo';
        const newPost = await r.getSubreddit('snoowrap_testing').submitCrosspost({title, originalPost: '6vths0'});
        expect(newPost).to.be.an.instanceof(snoowrap.objects.Submission);
        expect(await newPost.title).to.equal(title);
      });
      it('can create a crosspost from a submission instance', async () => {
        const title = 'foo';
        const newPost = await r.getSubmission('6vths0').submitCrosspost({title, subredditName: 'snoowrap_testing'});
        expect(newPost).to.be.an.instanceof(snoowrap.objects.Submission);
        expect(await newPost.title).to.equal(title);
      });
    });
    it.skip('can create a subreddit', async () => {
      const sub_name = moment().format().slice(0, 19).replace(/[-:]/g, '_');
      const new_sub = await r.createSubreddit({
        description: 'a test subreddit for snoowrap',
        name: sub_name,
        public_description: 'a test subreddit for snoowrap',
        type: 'private',
        title: 'yay another test sub'
      });
      expect(new_sub).to.be.an.instanceof(snoowrap.objects.Subreddit);
    });
    it.skip('can compose a message', async () => {
      const timestamp = moment().format();
      await r.composeMessage({
        to: 'actually_an_aardvark',
        subject: 'snoowrap unit test message',
        text: timestamp,
        from_subreddit: 'snoowrap_testing'
      });
      expect(await r.getSentMessages()[0].body).to.equal(timestamp);
    });
    it.skip('can delete a message from its inbox', async () => {
      const firstMessage = await r.getInbox()[0];
      await firstMessage.deleteFromInbox();
      const inbox = await r.getInbox();
      if (inbox.length) {
        expect(await r.getInbox()[0].body).to.not.equal(firstMessage.body);
      }
    });
    it.skip('can mute the author of a modmail', async () => {
      const modmail = r.getMessage('4zop6r');
      await modmail.muteAuthor();
      const mute_list = await modmail.subreddit.getMutedUsers();
      expect(_.find(mute_list, {name: await modmail.author.name})).to.exist();
    });
    it.skip('can unmute the author of a modmail', async () => {
      const modmail = r.getMessage('4zop6r');
      await modmail.unmuteAuthor();
      const mute_list = await modmail.subreddit.getMutedUsers();
      expect(_.find(mute_list, {name: await modmail.author.name})).to.be.undefined();
    });
    it.skip('can mute/unmute a user from a subreddit', async () => {
      const sub = r.getSubreddit('snoowrap_testing');
      const victim = r.getUser('actually_an_aardvark');
      await sub.muteUser(victim);
      expect(await sub.getMutedUsers(victim)).to.have.lengthOf(1);
      await sub.unmuteUser(victim);
      expect(await sub.getMutedUsers(victim)).to.have.lengthOf(0);
    });
    it.skip('can comment on a submission', async () => {
      const comment_body = moment().format();
      const new_comment = await r.getSubmission('4gfapt').reply(comment_body);
      expect(new_comment).to.be.an.instanceof(snoowrap.objects.Comment);
      expect(await new_comment.body).to.equal(comment_body);
    });
    it.skip('can gild a submission/comment', async () => {
      // I think this test should work, but I have no creddits so I can't test it.
      // If anyone wants to try it out, be my guest.
      const submission = r.getSubmission('43qlu8');
      const initial_gilding_amount = await submission.gilded;
      await submission.gild();
      expect(await submission.refresh().gilded).to.be.above(initial_gilding_amount);
    });
  });
  describe('new modmail', () => {
    it('can view a list of conversations', async () => {
      const conversations = await r.getNewModmailConversations({limit: 2});
      expect(conversations).to.have.lengthOf(2);
      expect(conversations).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(conversations[0]).to.be.an.instanceof(snoowrap.objects.ModmailConversation);
      expect(await conversations[0].participant).to.be.an.instanceof(snoowrap.objects.ModmailConversationAuthor);
    });

    it('can view a list of conversation from a subreddit', async () => {
      const conversations = await r.getSubreddit('SpyTecSnoowrapTesting').getNewModmailConversations({limit: 1});
      expect(conversations).to.have.lengthOf(1);
      expect(conversations).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(conversations[0]).to.be.an.instanceof(snoowrap.objects.ModmailConversation);
      expect(await conversations[0].participant).to.be.an.instanceof(snoowrap.objects.ModmailConversationAuthor);
    });

    it('can view a specific conversation', async () => {
      const conversation = await r.getNewModmailConversation('75hxt').fetch();
      expect(conversation).to.be.an.instanceof(snoowrap.objects.ModmailConversation);
      expect(conversation.participant).to.be.an.instanceof(snoowrap.objects.ModmailConversationAuthor);
    });

    it('can reply to a conversation', async () => {
      let conversation = r.getNewModmailConversation('75hxt');
      await conversation.reply('testing1', true, true);
      conversation = await conversation.refresh();
      expect(conversation.messages[conversation.messages.length - 1].bodyMarkdown).to.equal('testing1');
      // replying auto-unarchives. Archive to restore to default
      await conversation.archive();
    });

    it('can archive a conversation', async () => {
      let conversation = await r.getNewModmailConversation('75hxt').fetch();
      await conversation.archive();
      conversation = await conversation.refresh();
      expect(conversation.state).to.equal(snoowrap.objects.ModmailConversation.conversationStates.Archived);

      await conversation.unarchive();
      conversation = await conversation.refresh();
      expect(conversation.state).to.not.equal(snoowrap.objects.ModmailConversation.conversationStates.Archived);
    });

    it('can highlight a conversation', async () => {
      let conversation = await r.getNewModmailConversation('75hxt').fetch();
      expect(conversation.isHighlighted).to.be.false();

      await conversation.highlight();
      conversation = await conversation.refresh();
      expect(conversation.isHighlighted).to.be.true();

      await conversation.unhighlight();
      conversation = await conversation.refresh();
      expect(conversation.isHighlighted).to.be.false();
    });

    it('can mark a conversation as read', async () => {
      let conversation = r.getNewModmailConversation('75hxt');
      await conversation.read();
      conversation = await conversation.refresh();
      expect(conversation.lastUnread).to.be.null();

      await conversation.unread();
      conversation = await conversation.refresh();
      expect(conversation.lastUnread).to.be.a('string');
    });

    // skip to avoid spamming
    it.skip('create a mod discussion', async () => {
      const conversation = await r.createModmailDiscussion({
        body: 'testBody',
        subject: 'testSubject',
        srName: 'SpyTecSnoowrapTesting'
      }).fetch();
      expect(conversation).to.be.an.instanceof(snoowrap.objects.ModmailConversation);
      expect(conversation.subject).to.equal('testSubject');
      expect(conversation.messages[0].bodyMarkdown).to.equal('testBody');
      expect(conversation.owner.display_name).to.equal('SpyTecSnoowrapTesting');
    });

    it('can mute a user', async () => {
      let conversation = await r.getNewModmailConversation('75hxt').fetch();

      await conversation.mute();
      conversation = await conversation.refresh();
      expect(conversation.participant.muteStatus.isMuted).to.be.true();

      await conversation.unmute();
      conversation = await conversation.refresh();
      expect(conversation.participant.muteStatus.isMuted).to.be.false();
    });

    it('can get the user from modmail', async () => {
      const conversation = r.getNewModmailConversation('75hxt');
      const author = await conversation.getParticipant();
      expect(author).to.be.an.instanceof(snoowrap.objects.ModmailConversationAuthor);
    });

    it('can mark a conversation as read', async () => {
      let conversation = r.getNewModmailConversation('75hxt');
      await conversation.unread();
      conversation = await conversation.refresh();
      expect(conversation.isRead()).to.be.false();

      await conversation.read();
      conversation = await conversation.refresh();
      expect(conversation.isRead()).to.be.true();
    });

    it('can mark a list of conversations objects as read', async () => {
      const conversations = [
        r.getNewModmailConversation('75hxt'),
        r.getNewModmailConversation('7b8oj')
      ];
      await r.markNewModmailConversationsAsUnread(conversations);
      for (let conversation of conversations) {
        conversation = await conversation.fetch();
        expect(conversation.isRead()).to.be.false();
      }

      await r.markNewModmailConversationsAsRead(conversations);
      for (let conversation of conversations) {
        conversation = await conversation.refresh();
        expect(conversation.isRead()).to.be.true();
      }
    });

    it('can mark a list of conversations strings as read', async () => {
      const conversationIds = [
        '75hxt',
        '7b8oj'
      ];
      await r.markNewModmailConversationsAsUnread(conversationIds);
      for (const id of conversationIds) {
        const conversation = await r.getNewModmailConversation(id).fetch();
        expect(conversation.isRead()).to.be.false();
      }

      await r.markNewModmailConversationsAsRead(conversationIds);
      for (const id of conversationIds) {
        const conversation = await r.getNewModmailConversation(id).fetch();
        expect(conversation.isRead()).to.be.true();
      }
    });

    it('can get a list of subreddits', async () => {
      const subreddits = await r.getNewModmailSubreddits();
      expect(subreddits).to.be.an('array');
      expect(subreddits.length).to.be.greaterThan(1);
      for (let i = 0; i < subreddits.length; i++) {
        expect(subreddits[i]).to.be.instanceof(snoowrap.objects.Subreddit);
      }
    });

    it('can retrieve amount of of unread Modmail conversations', async () => {
      const count = await r.getUnreadNewModmailConversationsCount();
      expect(Object.keys(count)).to.have.members([
        'highlighted',
        'notifications',
        'archived',
        'new',
        'inprogress',
        'mod'
      ]);
    });

    it('can bulk read defined states', async () => {
      const conversation = r.getNewModmailConversation('75hxt'); // '75hxt' is an inprogress discussion
      await conversation.unread();
      let count = await r.getUnreadNewModmailConversationsCount();
      expect(count.inprogress).to.be.greaterThan(0);

      const checkCount = count.inprogress;
      await r.bulkReadNewModmail(['SpyTecSnoowrapTesting'], 'new');
      count = await r.getUnreadNewModmailConversationsCount();
      expect(count.inprogress).to.equal(checkCount);

      await r.bulkReadNewModmail([r.getSubreddit('SpyTecSnoowrapTesting')], 'inprogress');
      count = await r.getUnreadNewModmailConversationsCount();
      expect(count.inprogress).to.equal(checkCount - 1);
    });
  });
});
