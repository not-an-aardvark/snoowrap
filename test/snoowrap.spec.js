'use strict';
const expect = require('chai').expect;
const Promise = require('bluebird');
const _ = require('lodash');
const moment = require('moment');
const snoowrap = require('..');
const errors = require('../lib/errors');
describe('snoowrap', function () {
  this.timeout(20000);
  let r;
  before(() => {
    // oauth_info.json has the properties `user_agent`, `client_id`, `client_secret`, and `refresh_token`.
    r = new snoowrap(require('../oauth_info.json'));
  });

  describe('.constructor', () => {
    it('throws an error if no user-agent is provided', () => {
      expect(() => new snoowrap({})).to.throw(errors.MissingUserAgentError);
    });
    it('throws an error if insufficient credentials are provided', () => {
      expect(() => new snoowrap({user_agent: 'a', client_id: 'b', client_secret: 'c'})).to.throw(errors.NoCredentialsError);
    });
    it('does not throw an error if only an access token is provided', () => {
      expect(() => new snoowrap({user_agent: 'a', access_token: 'blah'})).not.to.throw();
    });
    it('does not throw an error if a user_agent, client_id, client_secret, and refresh_token are provided', () => {
      expect(() => new snoowrap({user_agent: 'a', client_id: 'b', client_secret: 'c', refresh_token: 'd'})).not.to.throw();
    });
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
      expect(() => r.get_user('[deleted]').fetch()).to.throw(errors.InvalidUserError);
      expect(() => r.get_user(null).fetch()).to.throw(errors.InvalidUserError);
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
      await comment.replies.fetch_more(5);
      expect(comment.replies[0].body).to.equal("Let's knock the humor down to 65%.");
    });
    it("should be able to get promise for listing items before they're fetched", async () => {
      expect(await comment.replies[0].body).to.equal("Let's knock the humor down to 65%.");
    });
  });

  describe('getting a subreddit', () => {
    let subreddit;
    beforeEach(() => {
      subreddit = r.get_subreddit('askreddit');
    });
    it("can fetch information directly from a subreddit's info page", async () => {
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
      expect(await submission.comments.is_finished).to.be.false;
      expect(await submission.comments.fetch_more(5)).to.have.length.within(6, 100);
      expect(submission.comments[0]).to.be.an.instanceof(snoowrap.objects.Comment);
      expect(_.last(submission.comments)).to.be.an.instanceof(snoowrap.objects.Comment);
      await submission.comments.fetch_all();
      expect(submission.comments).to.have.length.above(1000);
      expect(submission.comments.is_finished).to.be.true;
    });
    it("can get comments by index before they're fetched", async () => {
      expect(await submission.comments[6].body).to.equal('pumpkin pie');
    });
    it('can get a random submission from a particular subreddit', async () => {
      const random_post = await r.get_subreddit('gifs').get_random_submission();
      expect(random_post).to.be.an.instanceof(snoowrap.objects.Submission);
      expect(random_post.subreddit.display_name).to.equal('gifs');
    });
    it('can get a random submission from any subreddit', async () => {
      const random_post = await r.get_random_submission();
      expect(random_post).to.be.an.instanceof(snoowrap.objects.Submission);
    });
    it('can enable/disable inbox replies on a submission', async () => {
      // There's no way to tell whether inbox replies are enabled/disabled with the API, but make sure no errors are thrown
      await r.get_submission('443v2b').enable_inbox_replies().disable_inbox_replies();
    });
  });

  describe('getting a list of posts', () => {
    it('can get hot posts from the front page', async () => {
      const posts = await r.get_hot();
      expect(posts).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(posts).to.have.length.above(0).and.at.most(100);
      await posts.fetch_more(101);
      expect(posts).to.have.length.above(100);
    });
    it('can get new posts from the front page', async () => {
      const posts = await r.get_new();
      expect(moment.unix(posts[0].created_utc).add(30, 'minutes').isAfter()).to.be.true;
      // i.e. the first post should be newer than 1 hour old, to be sure that this is actually the 'new' listing
    });
    it('can get top posts from the front page or a subreddit given a certain timespan', async () => {
      const top_alltime = await r.get_subreddit('all').get_top({time: 'all'})[0];
      const top_alltime_v2 = await r.get_top('all', {time: 'all'})[0];
      expect(top_alltime.name).to.eql(top_alltime_v2.name);
      expect(top_alltime.ups).to.be.above(50000);
      const top_in_last_day = await r.get_top({time: 'day'})[0];
      expect(moment.unix(top_in_last_day.created_utc).add(24, 'hours').isAfter()).to.be.true;
    });
  });

  describe('self-property fetching', () => {
    it("gets information from the requester's own profile", async () => {
      const me = await r.get_me();
      expect(me.name).to.equal(r.own_user_info.name); // (this doesn't necessarily mean that the name is correct)
      expect(me.name).to.be.a('string');
    });
    it("gets the requester's karma", async () => {
      expect(await r.get_karma()).to.be.an.instanceof(snoowrap.objects.KarmaList);
    });
    it('gets current preferences', async () => {
      const prefs = await r.get_preferences();
      expect(prefs.lang).to.be.a('string');
    });
    it('modifies current preferences', async () => {
      const current_prefs = await r.get_preferences().min_link_score;
      await r.update_preferences({min_link_score: current_prefs - 1});
      const fixed_prefs = await r.get_preferences().min_link_score;
      expect(fixed_prefs).not.to.equal(current_prefs);
      // (Fix the preferences afterwards, since I'd rather this value not decrease every time I run these tests)
      await r.update_preferences({min_link_score: current_prefs});
    });
    it("gets the current user's trophies", async () => {
      expect(await r.get_trophies()).to.be.an.instanceof(snoowrap.objects.TrophyList);
    });
    it("gets the user's friends", async () => {
      expect(await r.get_friends()).to.be.an.instanceof(Array);
    });
    it('gets a list of blocked users', async () => {
      expect(await r.get_blocked_users()).to.be.an.instanceof(Array);
    });
    it('checks whether the current account needs to fill out a captcha to post', async () => {
      expect(await r.check_captcha_requirement()).to.be.a('boolean');
    });
    it('can fetch a new captcha on request', async () => {
      const iden = await r.get_new_captcha_identifier();
      expect(iden).to.be.a('string');
      const image = await r.get_captcha_image(iden);
      expect(image).to.be.ok;
    });
  });

  describe('subreddit flair', () => {
    let sub;
    before(() => {
      sub = r.get_subreddit('snoowrap_testing');
    });
    it('can add/delete/fetch user flair templates', async () => {
      const text = moment().format(); // Use the current timestamp as the flair text to make it easy to distinguish from others
      await sub.create_user_flair_template({text, css_class: ''});
      const added_flair = _.last(await sub.get_user_flair_templates());
      expect(added_flair.flair_text).to.equal(text);
      await sub.delete_flair_template(added_flair);
      const user_flairs_afterwards = await sub.get_user_flair_templates();
      expect(user_flairs_afterwards.length === 0 || _.last(user_flairs_afterwards).flair_text !== text).to.be.true;
    });
    it('can add/delete/fetch link flair templates', async () => {
      const text = moment().format();
      await sub.create_link_flair_template({text, css_class: '', text_editable: true});
      // Use a random link on the sub -- it doesn't seem to be possible to get the link flair options without providing a link
      const added_flair = _.last(await sub._get_flair_options({link: 't3_43qlu8'}).choices);
      expect(added_flair.flair_text).to.equal(text);
      await sub.delete_flair_template(added_flair);
      const link_flairs_afterwards= await sub._get_flair_options({link: 't3_43qlu8'}).choices;
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
      expect(await await sub._get_flair_options({link: 't3_43qlu8'}).choices).to.eql([]);
    });
    it('can change multiple user flairs at once', async () => {
      const naa_flair = "not_an_aardvark's flair";
      const aaa_flair = "actually_an_aardvark's flair";
      await sub.set_multiple_user_flairs([
        {name: 'not_an_aardvark', text: naa_flair},
        {name: 'actually_an_aardvark', text: aaa_flair}
      ]);
      expect(await sub.get_user_flair('not_an_aardvark').flair_text).to.equal(naa_flair);
      expect(await sub.get_user_flair('actually_an_aardvark').flair_text).to.equal(aaa_flair);
    });
    it('can assign flair to a user', async () => {
      const user1 = r.get_user('not_an_aardvark');
      const user2 = r.get_user('actually_an_aardvark');
      const flair_text = moment().format();
      await user1.assign_user_flair({subreddit_name: sub.display_name, text: flair_text});
      expect(await sub.get_user_flair(user1.name).flair_text).to.equal(flair_text);
      await user2.assign_user_flair({subreddit_name: sub.display_name, text: flair_text});
      expect(await sub.get_user_flair(user2.name).flair_text).to.equal(flair_text);
    });
    it('can assign flair to a submission', async () => {
      /* The submission's flair is cached by reddit for a few minutes, so there's not really any reliable way to verify that
      the flair text was set successfully while still having the tests run in a reasonable amount of time. If nothing else,
      send the request and make sure no error is returned. */
      await r.get_submission('443bn7').assign_link_flair({text: moment().format()});
    });
    it('can select its own user flair', async () => {
      const text = moment().format();
      await sub.create_user_flair_template({text});
      const flair_template_id = _.last(await sub.get_user_flair_templates()).flair_template_id;
      await sub.select_my_flair({flair_template_id});
      expect(await sub.get_my_flair().flair_text).to.equal(text);
      await sub.delete_all_user_flair_templates();
    });
    it('can select link flair for its post', async () => {
      const text = moment().format() + ' (self-selected)';
      await sub.create_link_flair_template({text});
      const submission = r.get_submission('443bn7');
      const flair_template_id = _.last(await submission.get_link_flair_templates()).flair_template_id;
      await submission.select_link_flair({flair_template_id});
      expect(await submission.refresh().link_flair_text).to.equal(text);
      await sub.delete_all_link_flair_templates();
    });
  });

  describe('getting subreddit mod listings', () => {
    let sub;
    before(async () => {
      sub = r.get_subreddit('snoowrap_testing');
      await r.get_comment('czn0rpn').remove().approve(); // Adds some events to the modlog for easier confirmation tests
    });
    it('can get the full modlog', async () => {
      const log = await sub.get_moderation_log();
      expect(log[0].action).to.equal('approvecomment');
      expect(log[1].action).to.equal('removecomment');
    });
    it('can filter the modlog by event type', async () => {
      const log = await sub.get_moderation_log({type: 'removecomment'});
      expect(log[0].action).to.equal('removecomment');
    });
    it('can filter the modlog by moderator', async () => {
      const log = await sub.get_moderation_log({mods: [await r.get_me().name]});
      expect(log[0].action).to.equal('approvecomment');
      const log2 = await sub.get_moderation_log({mods: ['not_a_mod']});
      expect(log2).to.be.empty;
    });
    it('can get reported items', async () => {
      expect(await sub.get_reports()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can get removed items', async () => {
      expect(await sub.get_spam()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can get the modqueue', async () => {
      expect(await sub.get_modqueue()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can get unmoderated items', async () => {
      expect(await sub.get_unmoderated()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can get edited items', async () => {
      expect(await sub.get_edited()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
  });

  describe('comment/post actions', () => {
    let post, comment;
    beforeEach(() => {
      post = r.get_submission('43qlu8');
      comment = r.get_comment('czn0rpn');
    });
    it('can edit a selfpost', async () => {
      const new_text = moment().format();
      await post.edit(new_text);
      expect(post.selftext).to.equal(new_text);
    });
    it('can edit a comment', async () => {
      const new_text = moment().format();
      await comment.edit(new_text);
      expect(comment.body).to.equal(new_text);
    });
    it('can distinguish/undistinguish/sticky a comment', async () => {
      await comment.distinguish();
      expect(comment.distinguished).to.equal('moderator');
      expect(comment.stickied).to.be.false;
      await comment.distinguish({sticky: true});
      expect(comment.distinguished).to.equal('moderator');
      expect(comment.stickied).to.be.true;
      await comment.undistinguish();
      expect(comment.distinguished).to.be.null;
    });
    it('can save/unsave a post', async () => {
      await post.save().refresh();
      expect(post.saved).to.be.true;
      await post.unsave().refresh();
      expect(post.saved).to.be.false;
    });
    it('can save/unsave a comment', async () => {
      await comment.save().refresh();
      expect(comment.saved).to.be.true;
      await comment.unsave().refresh();
      expect(await comment.saved).to.be.false;
    });
    it('can remove/approve a post', async () => {
      await post.remove().refresh();
      expect(post.banned_by).to.not.be.null;
      expect(post.approved_by).to.be.null;
      await post.approve().refresh();
      expect(post.banned_by).to.be.null;
      expect(post.approved_by).to.not.be.null;
      // There's no way to differentiate posts marked as spam with the API, but make sure the function doesn't throw an error.
      await post.mark_as_spam().approve();
    });
    it('can remove/approve a comment', async () => {
      await comment.remove().refresh();
      expect(comment.banned_by).to.not.be.null;
      expect(comment.approved_by).to.be.null;
      await comment.approve().refresh();
      expect(comment.banned_by).to.be.null;
      expect(comment.approved_by).to.not.be.null;
    });
  });

  describe('private messages', () => {
    // Threads used for these tests:
    // PMs: https://i.gyazo.com/d05f5cf5999e270b64c389984bc06f3e.png
    // Modmails: https://i.gyazo.com/f0e6de4190c7eef5368f9d12c25bacc7.png
    let message1, message2, message3;
    beforeEach(() => {
      message1 = r.get_message('4wwx80');
      message2 = r.get_message('4wwxe3');
      message3 = r.get_message('4wwxhp');
    });
    it('can get the contents of the first message in a chain', async () => {
      expect(await message1.body).to.equal('PM 1: not_an_aardvark --> actually_an_aardvark');
    });
    it('can get the contents of a message later in a chain', async () => {
      expect(await message2.body).to.equal('PM 2 (re: PM 1): actually_an_aardvark --> not_an_aardvark');
    });
    it('can get replies to a message', async () => {
      expect(await message1.replies[0].name).to.equal(message2.name);
    });
    it('can mark a message as unread', async () => {
      expect(await message3.mark_as_unread().refresh().new).to.be.true;
    });
    it('can mark a message as read', async () => {
      expect(await message3.mark_as_read().refresh().new).to.be.false;
    });
  });

  describe('inbox operations', () => {
    let message;
    before(async () => {
      message = r.get_message('4wwxe3');
      await message.mark_as_unread(); // Used to make sure things can be marked properly from the inbox
    });
    it('can get a list of new messages in an inbox', async () => {
      const new_messages = await r.get_unread_messages({mark: false, limit: 1});
      expect(await new_messages[0].refresh().new).to.be.true;
      await r.get_unread_messages({mark: true});
    });
    it('can get modmail for all moderated subs', async () => {
      const modmail = await r.get_modmail({limit: 1});
      expect(modmail).to.have.lengthOf(1);
      expect(modmail[0]).to.be.an.instanceof(snoowrap.objects.PrivateMessage);
      expect(modmail[0].subreddit).to.be.an.instanceof(snoowrap.objects.Subreddit);
    });
    it('can get a list of sent messages', async () => {
      const sent = await r.get_sent_messages({limit: 1});
      expect(sent).to.have.lengthOf(1);
      expect(sent[0]).to.be.an.instanceof(snoowrap.objects.PrivateMessage);
      expect(sent[0].author.name).to.equal(await r.get_me().name);
    });
    after(async () => {
      await message.mark_as_read();
    });
  });

  describe('search', () => {
    it('can search for posts based on various parameters', async () => {
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
      await results.fetch_more(2);
      expect(results).to.have.lengthOf(4);
    });
    it('can search for a list of subreddits', async () => {
      const results = await r.search_subreddits({query: 'AskReddit'});
      expect(Array.isArray(results)).to.be.true;
    });
  });

  describe('miscellaneous API calls', () => {
    it('can get a list of oauth scopes', async () => {
      expect(await r.get_oauth_scope_list()).to.have.property('creddits');
    });
  });

  describe('general snoowrap behavior', () => {
    it('can chain properties together before they get resolved', async () => {
      const comment = r.get_comment('coip909');
      const first_mod_of_that_subreddit = await comment.subreddit.get_moderators()[0];
      expect(first_mod_of_that_subreddit.name).to.equal('krispykrackers');
      expect(await first_mod_of_that_subreddit.created_utc).to.equal(1211483632);
    });
    it('throttles requests as specified by the config parameters', async () => {
      r.config({request_delay: 2000});
      const timer = Promise.delay(1999);
      await r.get_user('not_an_aardvark').fetch();
      await r.get_user('actually_an_aardvark').fetch();
      expect(timer.isFulfilled()).to.be.true;
    });
  });
  describe('Creating new content', () => {
    // All of the tests here are skipped by default to avoid spam, since they involve permanently writing content to reddit.
    it.skip('can create a selfpost given a subreddit object');
    it.skip('can create a linkpost given a subreddit object');
    it.skip('can create a selfpost on a particular subreddit');
    it.skip('can create a linkpost on a particular subreddit');
    it.skip('can create a subreddit', async () => {
      const sub_name = moment().format().slice(0,19).replace(/[-:]/g,'_');
      const new_sub = await r.create_subreddit({
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
      await r.compose_message({
        to: 'actually_an_aardvark',
        subject: 'snoowrap unit test message',
        text: timestamp,
        from_subreddit: 'snoowrap_testing'
      });
      expect(await r.get_sent_messages()[0].body).to.equal(timestamp);
    });
    it.skip('can mute the author of a modmail', async () => {
      const modmail = r.get_message('4zop6r');
      await modmail.mute_author();
      const mute_list = await modmail.subreddit.get_muted_users();
      expect(_.find(mute_list, {name: await modmail.author.name})).to.be.defined;
    });
    it.skip('can unmute the author of a modmail', async () => {
      const modmail = r.get_message('4zop6r');
      await modmail.unmute_author();
      const mute_list = await modmail.subreddit.get_muted_users();
      expect(_.find(mute_list, {name: await modmail.author.name})).to.be.undefined;
    });
    it.skip('can comment on a submission');
    it.skip('can reply to a comment');
    it.skip('can report a submission/comment');
    it.skip('can reply to a private message');
    it.skip('can delete a submission');
    it.skip('can delete a comment');
    it.skip('can gild a submission/comment');
    it.skip('can delete a comment or submission');
  });
});
