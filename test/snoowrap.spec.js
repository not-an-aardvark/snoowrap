'use strict';
let expect = require('chai').use(require('chai-as-promised')).expect;
let Promise = require('bluebird');
let snoowrap = require('..');
let errors = require('../src/errors');
describe('snoowrap', function () {
  this.timeout(10000);
  // oauth_info.json has the properties `user_agent`, `client_id`, `client_secret`, and `refresh_token`.
  let r = new snoowrap(require('../oauth_info.json'));

  describe('getting a user profile', () => {
    let user;
    beforeEach(() => {
      user = r.get_user('not_an_aardvark');
    });
    it('gets information from a user profile', async () => {
      await user.fetch();
      expect(user.name).to.equal('not_an_aardvark');
      expect(user.created_utc).to.equal(1419104352);
      expect(user.nonexistent_property).to.equal(undefined);
    });
    it('gets information from the requester\'s own profile', async () => {
      let me = await r.get_me();
      expect(me.name).to.equal(r.own_user_info.name); // (this doesn't necessarily mean that the name is correct)
      expect(me.name).to.be.a('string');
    });
    it('returns individual properties as Promises', async () => {
      expect(await user.has_verified_email).to.equal(true);
    });
    it('ensures that someone keeps buying me reddit gold so that the tests will pass', async () => { // :D
      expect(await user.is_gold).to.equal(true);
    });
    it('returns a promise that resolves as undefined when fetching a nonexistent property', async () => {
      expect(await user.nonexistent_property).to.equal(undefined);
    });
    it('throws an error if it tries to fetch the profile of a deleted/invalid account', () => {
      let deleted_account = r.get_user('[deleted]');
      // Ideally this would just be expect(...).to.throw(errors.InvalidUserError), but that fails due to a bug in chai
      expect(deleted_account.fetch.bind(deleted_account)).to.throw(Error, /Cannot fetch information on/);
    });
  });

  describe('getting a comment', () => {
    let comment;
    beforeEach(() => {
      comment = r.get_comment('coip909');
    });
    it('should retrieve a comment and get its text', async () => {
      expect(await comment.body).to.equal('`RuntimeError: maximum humor depth exceeded`');
    });
    it('should convert the comment author to a RedditUser object and be able to get its properties', async () => {
      expect(await comment.author.has_verified_email).to.equal(true);
    });
  });

  describe('getting a subreddit', () => {
    let subreddit;
    beforeEach(() => {
      subreddit = r.get_subreddit('askreddit');
    });
    it('can fetch information directly from a subreddit\'s info page', async () => {
      expect(await subreddit.created_utc).to.equal(1201233135);
    });
  });

  describe('misc/general behavior', () => {
    it('can chain properties together before they get resolved', async () => {
      let comment = r.get_comment('coip909');
      let first_mod_of_that_subreddit = await comment.subreddit.get_moderators()[0];
      expect(first_mod_of_that_subreddit.name).to.equal('krispykrackers');
      expect(await first_mod_of_that_subreddit.created_utc).to.equal(1211483632);
    });
    it('throttles requests as specified by the config parameters', async () => {
      r.config.request_delay = 2000;
      let timer = Promise.delay(1999);
      await r.get_user('not_an_aardvark').fetch();
      await r.get_user('actually_an_aardvark').fetch();
      expect(timer.isFulfilled()).to.equal(true);
    });
  });
});
