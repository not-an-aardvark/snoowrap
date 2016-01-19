'use strict';
let assert = require('chai').assert;
let snoowrap = require('../src/snoowrap');
describe('snoowrap', function () {
  this.timeout(10000);
  let config = require('../oauth_info.json'); // This is just a JSON file with the four properties below
  let r = new snoowrap({
    refresh_token: config.refresh_token,
    client_id: config.client_id,
    client_secret: config.client_secret,
    user_agent: config.user_agent
  });
  describe('getting a user profile', () => {
    let user;
    beforeEach(() => {
      user = r.get_user('not_an_aardvark');
    });
    it('gets a user profile', async done => {
      try {
        await user.fetch();
        assert.strictEqual(user.name, 'not_an_aardvark');
        assert.strictEqual(user.created_utc, 1419104352);
        assert.strictEqual(user.nonexistent_property, undefined);
        done();
      } catch (err) {
        done(err);
      }
    });
    it('returns individual properties as Promises', async done => {
      try {
        assert.strictEqual(await user.has_verified_email, true);
        done();
      } catch (err) {
        done(err);
      }
    });
    it('ensures that someone keeps buying me reddit gold so that the tests will pass', async done => { // :D
      try {
        assert.strictEqual(await user.is_gold, true);
        done();
      } catch (err) {
        done(err);
      }
    });
    it('returns a promise that resolves as undefined when fetching a nonexistent property', async done => {
      try {
        assert.strictEqual(await user.nonexistent_property, undefined);
        done();
      } catch (err) {
        done(err);
      }
    });
  });
  describe('getting a comment', () => {
    let comment;
    beforeEach(() => {
      comment = r.get_comment('coip909');
    });
    it('should retrieve a comment and get its text', async done => {
      try {
        await comment.fetch;
        assert.strictEqual(await comment.body, '`RuntimeError: maximum humor depth exceeded`');
        done();
      } catch (err) {
        done(err);
      }
    });
    it('should convert the comment author to a RedditUser object and be able to get its properties', async done => {
      try {
        let author = await comment.author;
        assert.strictEqual(await author.has_verified_email, true);
        done();
      } catch (err) {
        done(err);
      }
    });
  });
});
