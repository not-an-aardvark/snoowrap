'use strict';
let assert = require('chai').use(require('chai-as-promised')).assert;
let Promise = require('bluebird');
let snoowrap = require('../src/snoowrap');
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
    it('gets a user profile', async () => {
      await user.fetch();
      assert.strictEqual(user.name, 'not_an_aardvark');
      assert.strictEqual(user.created_utc, 1419104352);
      assert.strictEqual(user.nonexistent_property, undefined);
    });
    it('returns individual properties as Promises', async () => {
      assert.strictEqual(await user.has_verified_email, true);
    });
    it('ensures that someone keeps buying me reddit gold so that the tests will pass', async () => { // :D
      assert.strictEqual(await user.is_gold, true);
    });
    it('returns a promise that resolves as undefined when fetching a nonexistent property', async () => {
      assert.strictEqual(await user.nonexistent_property, undefined);
    });
    it('throws an error if it tries to fetch the profile of a deleted/invalid account', () => {
      return r.get_user('[deleted]').fetch().then(assert.fail, err => {
        return assert.instanceOf(err, errors.InvalidUserError);
      });
    });
  });

  describe('getting a comment', () => {
    let comment;
    beforeEach(() => {
      comment = r.get_comment('coip909');
    });
    it('should retrieve a comment and get its text', async () => {
      assert.strictEqual(await comment.body, '`RuntimeError: maximum humor depth exceeded`');
    });
    it('should convert the comment author to a RedditUser object and be able to get its properties', async () => {
      assert.strictEqual(await comment.author.has_verified_email, true);
    });
  });

  describe('getting a subreddit', () => {
    let subreddit;
    beforeEach(() => {
      subreddit = r.get_subreddit('askreddit');
    });
    it('can fetch information directly from a subreddit\'s info page', async () => {
      assert.strictEqual(await subreddit.created_utc, 1201233135);
    });
  });

  describe('misc/general behavior', () => {
    it('can chain properties together before they get resolved', async () => {
      let comment = r.get_comment('coip909');
      let first_mod_of_that_subreddit = await comment.subreddit.get_moderators()[0];
      assert.strictEqual(first_mod_of_that_subreddit.name, 'krispykrackers');
      assert.strictEqual(await first_mod_of_that_subreddit.created_utc, 1211483632);
    });
    it('throttles requests as specified by the config parameters', async () => {
      r.config.request_delay = 2000;
      let timer = Promise.delay(1999);
      await r.get_user('not_an_aardvark').fetch();
      await r.get_user('actually_an_aardvark').fetch();
      assert.strictEqual(timer.isFulfilled(), true);
    });
  });
});
