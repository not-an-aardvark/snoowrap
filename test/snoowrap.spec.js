'use strict';
let assert = require('chai').assert;
let snoowrap = require('../src/snoowrap');
let constants = require('../src/constants.js');
describe('snoowrap', function () {
  this.timeout(10000);
  var user;
  let config = require('../oauth_info.json'); // This is just a JSON file with the three properties below
  let r = new snoowrap.AuthenticatedClient({
    refresh_token: config.refresh_token,
    client_id: config.client_id,
    client_secret: config.client_secret,
    user_agent: `${constants.MODULE_NAME} unit tests`
  });
  beforeEach(() => {
    user = r.get_user('not_an_aardvark');
  });
  it('should get a user profile', done => {
    user.fetch().then(() => {
      assert.strictEqual(user.name, 'not_an_aardvark');
      assert.strictEqual(user.created_utc, 1419104352);
      assert.strictEqual(user.nonexistent_property, undefined);
      done();
    }, done);
  });
  it('should return individual properties as Promises', done => {
    user.has_verified_email.then(response => {
      assert.strictEqual(response, true);
      done();
    }, done);
  });
  it('should ensure that someone keeps buying me reddit gold so that the tests will pass', done => { // :D
    user.is_gold.then(response => {
      assert.strictEqual(response, true);
      done();
    }, done);
  });
  it('should return a promise that resolves as undefined if given a nonexistent property before fetching', done => {
    user.nonexistent_property.then(response => {
      assert.strictEqual(response, undefined);
      done();
    }, done);
  });
});
