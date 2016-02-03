'use strict';
let expect = require('chai').use(require('chai-as-promised')).expect;
let Promise = require('bluebird');
let _ = require('lodash');
let moment = require('moment');
let snoowrap = require('../src/snoowrap');
let errors = require('../src/errors');
describe('snoowrap', function () {
  this.timeout(10000);
  let r;
  before(() => {
    // oauth_info.json has the properties `user_agent`, `client_id`, `client_secret`, and `refresh_token`.
    r = new snoowrap(require('../oauth_info.json'));
  });

  describe('getting a user profile', () => {
    let user;
    beforeEach(() => {
      user = r.get_user('not_an_aardvark');
    });
    it('gets information from a user profile', async () => {
      await user.fetch();
      expect(user.name).to.equal('not_an_aardvark');
      expect(user.created_utc).to.equal(1419104352);
      expect(user.nonexistent_property).to.be.undefined;
    });
    it('returns individual properties as Promises', async () => {
      expect(await user.has_verified_email).to.be.true;
    });
    it('returns a promise that resolves as undefined when fetching a nonexistent property', async () => {
      expect(await user.nonexistent_property).to.be.undefined;
    });
    it('throws an error if it tries to fetch the profile of a deleted/invalid account', () => {
      expect(r.get_user('[deleted]').fetch).to.throw(errors.InvalidUserError);
      expect(r.get_user(null).fetch).to.throw(errors.InvalidUserError);
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
      expect(await comment.author.has_verified_email).to.be.true;
    });
    it('should be able to fetch replies to comments', async () => {
      await comment.replies.fetch({amount: 5});
      expect(comment.replies[0].body).to.equal('Let\'s knock the humor down to 65%.');
    });
    it('should be able to get promise for listing items before they\'re fetched', async () => {
      expect(await comment.replies[0].body).to.equal('Let\'s knock the humor down to 65%.');
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

  describe('getting a submission', () => {
    let submission;
    beforeEach(() => {
      submission = r.get_submission('2np694');
    });
    it('can get details on a submission', async () => {
      expect(await submission.title).to.equal('What tasty food would be distusting if eaten over rice?');
      expect(submission.author.name).to.equal('DO_U_EVN_SPAGHETTI');
    });
    it('can get comments on a submission', async () => {
      expect(submission.comments.is_finished).to.be.false;
      expect(await submission.comments.fetch({amount: 5})).to.have.length(5);
      expect(submission.comments).to.have.length.within(6, 100);
      expect(submission.comments[0]).to.be.an.instanceof(snoowrap.objects.Comment);
      expect(_.last(submission.comments)).to.be.an.instanceof(snoowrap.objects.Comment);
      await submission.comments.fetch_all();
      expect(submission.comments).to.have.length.above(1000);
      expect(submission.comments.is_finished).to.be.true;
    });
    it('can get comments by index before they\'re fetched', async () => {
      expect(await submission.comments[6].body).to.equal('pumpkin pie');
    });
  });

  describe('getting a list of posts', () => {
    it('can get posts from the front page', async () => {
      let posts = r.get_hot();
      expect(posts).to.have.length(0);
      await posts.fetch({amount: 101});
      expect(posts).to.have.length.of.at.least(101);
    });
  });

  describe('self-property fetching', () => {
    it('gets information from the requester\'s own profile', async () => {
      let me = await r.get_me();
      expect(me.name).to.equal(r.own_user_info.name); // (this doesn't necessarily mean that the name is correct)
      expect(me.name).to.be.a('string');
    });
    it('gets the requester\'s karma', async () => {
      expect(await r.get_karma()).to.be.an.instanceof(snoowrap.objects.KarmaList);
    });
    it('gets current preferences', async () => {
      let prefs = await r.get_preferences();
      expect(prefs.lang).to.be.a('string');
    });
    it('modifies current preferences', async () => {
      let current_prefs = await r.get_preferences().min_link_score;
      await r.update_preferences({min_link_score: current_prefs - 1});
      let fixed_prefs = await r.get_preferences().min_link_score;
      expect(fixed_prefs).not.to.equal(current_prefs);
      // (Fix the preferences afterwards, since I'd rather this value not decrease every time I run these tests)
      await r.update_preferences({min_link_score: current_prefs});
    });
    it('gets the current user\'s trophies', async () => {
      expect(await r.get_trophies()).to.be.an.instanceof(snoowrap.objects.TrophyList);
    });
    it('gets the user\'s friends', async () => {
      expect(await r.get_friends()).to.be.an.instanceof(Array);
    });
    it('gets a list of blocked users', async () => {
      expect(await r.get_blocked()).to.be.an.instanceof(Array);
    });
    it('checks whether the current account needs to fill out a captcha to post', async () => {
      expect(await r.needs_captcha()).to.be.a('boolean');
    });
    it('can fetch a new captcha on request', async () => {
      let iden = await r.get_new_captcha_identifier();
      expect(iden).to.be.a('string');
      let image = await r.get_captcha_image(iden);
      expect(image).to.be.ok;
    });
  });

  describe('subreddit flair', () => {
    let sub;
    before(() => {
      sub = r.get_subreddit('snoowrap_testing');
    });
    it('can add/delete/fetch user flair templates', async () => {
      let text = moment().format(); // Use the current timestamp as the flair text to make it easy to distinguish from others
      await sub.create_user_flair_template({text, css_class: ''});
      let added_flair = _.last(await sub.get_user_flair_templates());
      expect(added_flair.flair_text).to.equal(text);
      await sub.delete_flair_template(added_flair);
      let user_flairs_afterwards = await sub.get_user_flair_templates();
      expect(user_flairs_afterwards.length === 0 || _.last(user_flairs_afterwards).flair_text !== text).to.be.true;
    });
    it('can add/delete/fetch link flair templates', async () => {
      let text = moment().format();
      await sub.create_link_flair_template({text, css_class: '', text_editable: true});
      // Use a random link on the sub -- it doesn't seem to be possible to get the link flair options without providing a link
      let added_flair = _.last(await sub.get_flair_options({link: 't3_43qlu8'}).choices);
      expect(added_flair.flair_text).to.equal(text);
      await sub.delete_flair_template(added_flair);
      let link_flairs_afterwards= await sub.get_flair_options({link: 't3_43qlu8'}).choices;
      expect(link_flairs_afterwards.length === 0 || _.last(link_flairs_afterwards).flair_text !== text).to.be.true;
    });
    it('can delete all user flair templates', async () => {
      await Promise.all([
        sub.create_user_flair_template({text: 'some user flair text'}),
        sub.create_user_flair_template({text: 'some user other flair text'})
      ]);
      await sub.delete_all_user_flair_templates();
      expect(await sub.get_user_flair_templates()).to.eql([]);
    });
    it('can delete all link flair templates', async () => {
      await Promise.all([
        sub.create_link_flair_template({text: 'some link flair text'}),
        sub.create_link_flair_template({text: 'some other link flair text'})
      ]);
      await sub.delete_all_link_flair_templates();
      expect(await await sub.get_flair_options({link: 't3_43qlu8'}).choices).to.eql([]);
    });
    it('can add, delete, and fetch user flair', async () => {
      let text = moment().format();
      let test_username = 'not_an_aardvark';
      await sub.set_flair({name: test_username, text, css_class: ''});
      expect(await sub.get_user_flair({name: test_username}).flair_text).to.equal(text);
      let current_list = await sub.get_user_flair_list();
      expect(current_list.filter(result => (result.user === test_username))[0].flair_text).to.equal(text);
      await sub.delete_user_flair({name: test_username});
      expect(await sub.get_user_flair({name: 'not_an_aardvark'}).flair_text).to.be.null;
    });
    it('can change multiple user flairs at once', async () => {
      let naa_flair = 'not_an_aardvark\'s flair';
      let aaa_flair = 'actually_an_aardvark\'s flair';
      await sub.set_multiple_user_flairs([
        {name: 'not_an_aardvark', text: naa_flair},
        {name: 'actually_an_aardvark', text: aaa_flair}
      ]);
      expect(await sub.get_user_flair({name: 'not_an_aardvark'}).flair_text).to.equal(naa_flair);
      expect(await sub.get_user_flair({name: 'actually_an_aardvark'}).flair_text).to.equal(aaa_flair);
    });
    it('can change flair from a RedditUser object', async () => {
      let user1 = r.get_user('not_an_aardvark');
      let user2 = r.get_user('actually_an_aardvark');
      let flair_text = moment().format();
      await user1.set_flair({subreddit: sub, text: flair_text});
      expect(await sub.get_user_flair(user1).flair_text).to.equal(flair_text);
      await user2.set_flair({subreddit: sub, text: flair_text});
      expect(await sub.get_user_flair(user2).flair_text).to.equal(flair_text);
    });
  });

  describe('moderation actions', () => {
    it('can remove and approve posts', async () => {
      if (!r.own_user_info) {
        await r.get_me();
      }
      let submission = r.get_submission('43kfuy');
      await submission.remove();
      expect(await submission.banned_by.name).to.equal(r.own_user_info.name);
      await submission.approve();
      expect(await submission.refresh().approved_by.name).to.equal(r.own_user_info.name);
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
      expect(timer.isFulfilled()).to.be.true;
    });
  });
});
