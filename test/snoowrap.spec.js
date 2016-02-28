'use strict';
const expect = require('chai').use(require('dirty-chai')).expect;
const Promise = require('bluebird');
const _ = require('lodash');
const moment = require('moment');
const snoowrap = require('..');
const errors = require('../lib/errors');
describe('snoowrap', function () {
  this.timeout(30000);
  this.slow(20000);
  let r;
  before(() => {
    try {
      // oauth_info.json has the properties `user_agent`, `client_id`, `client_secret`, and `refresh_token`.
      r = new snoowrap(require('../oauth_info.json'));
    } catch (err) {
      if (process.env.CI) {
        r = new snoowrap({
          user_agent: process.env.SNOOWRAP_USER_AGENT,
          client_id: process.env.SNOOWRAP_CLIENT_ID,
          client_secret: process.env.SNOOWRAP_CLIENT_SECRET,
          refresh_token: process.env.SNOOWRAP_REFRESH_TOKEN
        });
      } else {
        throw err;
      }
    }
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
      user = r.get_user('snoowrap_testing');
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
    it('throws an error if it tries to fetch the profile of a deleted/invalid account', () => {
      expect(() => r.get_user('[deleted]').fetch()).to.throw(errors.InvalidUserError);
      expect(() => r.get_user(null).fetch()).to.throw(errors.InvalidUserError);
    });
    it("can get a user's trophies", async () => {
      expect(await user.get_trophies()).to.be.an.instanceof(snoowrap.objects.TrophyList);
    });
    it("can get a user's overview", async () => {
      expect(await user.get_overview()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it("can get a user's submissions", async () => {
      const submissions = await user.get_submissions();
      expect(submissions).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(submissions[0]).to.be.an.instanceof(snoowrap.objects.Submission);
    });
    it("can get a user's comments", async () => {
      const comments = await user.get_comments();
      expect(comments).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(comments[0]).to.be.an.instanceof(snoowrap.objects.Comment);
    });
    it("can get a user's upvoted content", async () => {
      expect(await user.get_upvoted_content()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it("can get a user's downvoted content", async () => {
      expect(await user.get_downvoted_content()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it("can get a user's hidden content", async () => {
      expect(await user.get_hidden_content()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it("can get a user's saved content", async () => {
      expect(await user.get_saved_content()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it("can get a user's gilded content", async () => {
      expect(await user.get_gilded_content()).to.be.an.instanceof(snoowrap.objects.Listing);
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
      expect(await comment.author.has_verified_email).to.be.true();
    });
    it('should be able to fetch replies to comments', async () => {
      expect(await comment.replies.fetch_until({length: 1})[0].body).to.equal("Let's knock the humor down to 65%.");
    });
  });

  describe("getting a subreddit's information", () => {
    let subreddit;
    beforeEach(() => {
      subreddit = r.get_subreddit('snoowrap_testing');
    });
    it("can fetch information directly from a subreddit's info page", async () => {
      expect(await subreddit.created_utc).to.equal(1453703345);
    });
    it('can get and modify a subreddit stylesheet', async () => {
      const gibberish = require('crypto').randomBytes(4).toString('hex');
      const new_stylesheet = `.stylesheet-${gibberish}{}`; // it has to be valid CSS or reddit returns a 404 when fetching it
      await subreddit.update_stylesheet({css: new_stylesheet});
      // Reddit caches stylesheets for awhile, so this is annoying to test reliably. Make sure the sheet is fetched, at least
      expect(await subreddit.get_stylesheet()).to.match(/^\.stylesheet-[0-9a-f]{8}/);
    });
    it("can get and modify a subreddit's settings", async function () {
      if (await r.check_captcha_requirement()) {
        return this.skip();
      }
      await subreddit.edit_settings({public_traffic: false});
      expect(await subreddit.get_settings().public_traffic).to.be.false();
      await subreddit.edit_settings({public_traffic: true});
      expect(await subreddit.get_settings().public_traffic).to.be.true();
    });
    it("can get a subreddit's submit text", async () => {
      expect(await subreddit.get_submit_text()).to.equal('snoowrap_testing submit text');
    });
    it('can subscribe/unsubscribe from a subreddit', async () => {
      await subreddit.subscribe();
      expect(await subreddit.refresh().user_is_subscriber).to.be.true();
      await subreddit.unsubscribe();
      expect(await subreddit.refresh().user_is_subscriber).to.be.false();
    });
    it('can upload images to a subreddit', async () => {
      await subreddit.upload_header_image({file: 'test/test_image.png'});
    });
    it("can get a subreddit's rules", async () => {
      const rules_obj = await subreddit.get_rules();
      expect(rules_obj.rules[0].short_name).to.equal('Rule 1: No breaking the rules');
    });
    it('can get a stickied post on a subreddit', async () => {
      const stickied_post = await subreddit.get_sticky();
      expect(stickied_post).to.be.an.instanceof(snoowrap.objects.Submission);
      expect(stickied_post.title).to.equal('This post is stickied');
    });
  });

  describe('getting a submission', () => {
    let submission;
    beforeEach(() => {
      submission = r.get_submission('2np694');
    });
    it('can get details on a submission', async () => {
      expect(await submission.title).to.equal('What tasty food would be distusting if eaten over rice?');
      expect(submission.author.name.value()).to.equal('DO_U_EVN_SPAGHETTI');
    });
    it('can get comments on a submission', async () => {
      const comments = await submission.comments;
      expect(comments.is_finished).to.be.false();
      expect(await comments.fetch_more(5)).to.have.length.within(6, 100);
      expect(comments[0]).to.be.an.instanceof(snoowrap.objects.Comment);
      expect(_.last(await comments)).to.be.an.instanceof(snoowrap.objects.Comment);
      await comments.fetch_all();
      expect(comments).to.have.length.above(1000);
      expect(comments.is_finished).to.be.true();
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
      expect(moment.unix(posts[0].created_utc).add(30, 'minutes').isAfter()).to.be.true();
      // i.e. the first post should be newer than 1 hour old, to be sure that this is actually the 'new' listing
    });
    it('can get top posts from the front page or a subreddit given a certain timespan', async () => {
      const top_alltime = await r.get_subreddit('all').get_top({time: 'all'})[0];
      const top_alltime_v2 = await r.get_top('all', {time: 'all'})[0];
      expect(top_alltime.name).to.eql(top_alltime_v2.name);
      expect(top_alltime.ups).to.be.above(50000);
      const top_in_last_day = await r.get_top({time: 'day'})[0];
      expect(moment.unix(top_in_last_day.created_utc).add(24, 'hours').isAfter()).to.be.true();
    });
  });

  describe('self-property fetching', () => {
    it("gets information from the requester's own profile", async () => {
      const me = await r.get_me();
      expect(me.name).to.equal(r.own_user_info.name); // (this doesn't necessarily mean that the name is correct)
      expect(me.name).to.be.a('string');
    });
    it("gets the requester's karma", async () => {
      expect(await r.get_karma()).to.be.an.instanceof(Array);
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
      expect(await r.get_my_trophies()).to.be.an.instanceof(snoowrap.objects.TrophyList);
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
      expect(image).to.be.ok();
    });
  });

  describe('subreddit flair', () => {
    let sub;
    before(() => {
      sub = r.get_subreddit('snoowrap_testing');
    });
    it('can add/delete/fetch user flair templates', async () => {
      const text = moment().format(); // Use the current timestamp as the flair text to make it easy to distinguish
      await sub.create_user_flair_template({text, css_class: ''});
      const added_flair = _.last(await sub.get_user_flair_templates());
      expect(added_flair.flair_text).to.equal(text);
      await sub.delete_flair_template(added_flair);
      const user_flairs_afterwards = await sub.get_user_flair_templates();
      expect(user_flairs_afterwards.length === 0 || _.last(user_flairs_afterwards).flair_text !== text).to.be.true();
    });
    it('can add/delete/fetch link flair templates', async () => {
      const text = moment().format();
      await sub.create_link_flair_template({text, css_class: '', text_editable: true});
      // Use a random link on the sub -- it doesn't seem to be possible to get the link flair options without providing a link
      const added_flair = _.last(await sub._get_flair_options({link: 't3_43qlu8'}).choices);
      expect(added_flair.flair_text).to.equal(text);
      await sub.delete_flair_template(added_flair);
      const link_flairs_afterwards = await sub._get_flair_options({link: 't3_43qlu8'}).choices;
      expect(link_flairs_afterwards.length === 0 || _.last(link_flairs_afterwards).flair_text !== text).to.be.true();
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
      await user1.assign_flair({subreddit_name: sub.display_name, text: flair_text});
      expect(await sub.get_user_flair(user1.name).flair_text).to.equal(flair_text);
      await user2.assign_flair({subreddit_name: sub.display_name, text: flair_text});
      expect(await sub.get_user_flair(user2.name).flair_text).to.equal(flair_text);
    });
    it('can assign flair to a submission', async () => {
      /* The submission's flair is cached by reddit for a few minutes, so there's not really any reliable way to verify that
      the flair text was set successfully while still having the tests run in a reasonable amount of time. If nothing else,
      send the request and make sure no error is returned. */
      await r.get_submission('443bn7').assign_flair({text: moment().format()});
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
      const text = `${moment().format()} (self-selected)`;
      await sub.create_link_flair_template({text});
      const submission = r.get_submission('443bn7');
      const flair_template_id = _.last(await submission.get_link_flair_templates()).flair_template_id;
      await submission.select_flair({flair_template_id});
      expect(await submission.refresh().link_flair_text).to.equal(text);
      await sub.delete_all_link_flair_templates();
    });
  });

  describe('lists of subreddits', () => {
    it('can get my subscriptions', async () => {
      const subs = await r.get_subscriptions({limit: 3});
      expect(subs).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(subs).to.have.length.of.at.most(3);
      expect(subs[0]).to.be.an.instanceof(snoowrap.objects.Subreddit);
    });
    it('can get my contributor subreddits', async () => {
      const subs = await r.get_contributor_subreddits({limit: 3});
      expect(subs).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(subs).to.have.length.of.at.most(3);
      expect(subs[0]).to.be.an.instanceof(snoowrap.objects.Subreddit);
    });
    it('can get my moderated subreddits', async () => {
      const subs = await r.get_moderated_subreddits({limit: 3});
      expect(subs).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(subs).to.have.length.of.at.most(3);
      expect(subs[0]).to.be.an.instanceof(snoowrap.objects.Subreddit);
    });
    it('can get popular subreddits', async () => {
      const subs = await r.get_popular_subreddits({limit: 3});
      expect(subs).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(subs).to.have.length.of.at.most(3);
      expect(subs[0]).to.be.an.instanceof(snoowrap.objects.Subreddit);
    });
    it('can get new subreddits', async () => {
      const subs = await r.get_new_subreddits({limit: 3});
      expect(subs).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(subs).to.have.length.of.at.most(3);
      expect(subs[0]).to.be.an.instanceof(snoowrap.objects.Subreddit);
    });
    it('can get default subreddits', async () => {
      const subs = await r.get_default_subreddits({limit: 3});
      expect(subs).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(subs).to.have.length.of.at.most(3);
      expect(subs[0]).to.be.an.instanceof(snoowrap.objects.Subreddit);
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
      expect(log2).to.be.empty();
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
      post = r.get_submission('47ybh5');
      comment = r.get_comment('d0g704c');
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
      await comment.distinguish();
      expect(comment.distinguished).to.equal('moderator');
      expect(comment.stickied).to.be.false();
      await comment.distinguish({sticky: true});
      expect(comment.distinguished).to.equal('moderator');
      expect(comment.stickied).to.be.true();
      await comment.undistinguish();
      expect(comment.distinguished).to.be.null();
    });
    it('can save/unsave a post', async () => {
      await post.save().refresh();
      expect(post.saved).to.be.true();
      await post.unsave().refresh();
      expect(post.saved).to.be.false();
    });
    it('can save/unsave a comment', async () => {
      await comment.save().refresh();
      expect(comment.saved).to.be.true();
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
      // There's no way to differentiate posts marked as spam with the API, but make sure the function doesn't throw an error.
      await post.mark_as_spam().approve();
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
    let message1, message2, message3;
    beforeEach(() => {
      message1 = r.get_message('51shnw');
      message2 = r.get_message('51shsd');
      message3 = r.get_message('51shxv');
    });
    it('can get the contents of the first message in a chain', async () => {
      expect(await message1.body).to.equal('PM 1: snoowrap_testing --> not_an_aardvark');
    });
    it('can get the contents of a message later in a chain', async () => {
      expect(await message2.body).to.equal('PM 2 (re: PM 1): not_an_aardvark --> snoowrap_testing');
    });
    it('can get replies to a message', async () => {
      expect(await message1.replies[0].name).to.equal(message2.name);
    });
    it('can mark a message as unread', async () => {
      expect(await message3.mark_as_unread().refresh().new).to.be.true();
    });
    it('can mark a message as read', async () => {
      expect(await message3.mark_as_read().refresh().new).to.be.false();
    });
  });

  describe('inbox operations', () => {
    let message;
    before(async () => {
      message = r.get_message('51shsd');
      await message.mark_as_unread(); // Used to make sure things can be marked properly from the inbox
    });
    it('can get a list of new messages in an inbox', async () => {
      const new_messages = await r.get_unread_messages({mark: false, limit: 1});
      expect(await new_messages[0].refresh().new).to.be.true();
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
    it('can search a given subreddit for posts', async () => {
      const results = await r.get_subreddit('askreddit').search({query: 'e', limit: 5});
      expect(results).to.have.lengthOf(5);
      for (let i = 0; i < results.length; i++) {
        expect(results[i].subreddit.display_name).to.equal('AskReddit');
      }
    });
    it('can search for a list of subreddits by name', async () => {
      const results = await r.search_subreddit_names({query: 'AskReddit'});
      expect(Array.isArray(results)).to.be.true();
    });
    it('can search for a list of subreddits by topic', async () => {
      const results = await r.search_subreddit_topics({query: 'snoowrap'});
      expect(Array.isArray(results)).to.be.true();
      expect(results[0]).to.be.an.instanceof(snoowrap.objects.Subreddit);
    });
    // honestly I have no idea why there are three separate subreddit search functions
    it('can search for a list of subreddits by name and description', async () => {
      const results = await r.search_subreddits({query: 'AskReddit', limit: 5});
      expect(results).to.have.length.of.at.most(5);
      expect(results).to.be.an.instanceof(snoowrap.objects.Listing);
      expect(results[0]).to.be.an.instanceof(snoowrap.objects.Subreddit);
    });
  });

  describe('modifying user status', () => {
    let sub, victim;
    beforeEach(() => {
      sub = r.get_subreddit('snoowrap_testing');
      victim = r.get_user('actually_an_aardvark');
    });
    it('can ban/unban a user from a subreddit', async () => {
      await sub.ban_user({name: victim.name, ban_message: 'banned for stuff', ban_note: 'test note'});
      expect(await sub.get_banned_users(victim)).to.have.lengthOf(1);
      await sub.unban_user(victim);
      expect(await sub.get_banned_users(victim)).to.have.lengthOf(0);
    });
    it('can add/remove an approved submitter from a subreddit', async () => {
      await sub.add_contributor(victim);
      expect(await sub.get_contributors(victim)).to.have.lengthOf(1);
      await sub.remove_contributor(victim);
      expect(await sub.get_contributors(victim)).to.have.lengthOf(0);
    });
    it('can wikiban/unwikiban a user from a subreddit', async () => {
      await sub.wikiban_user(victim);
      expect(await sub.get_wikibanned_users(victim)).to.have.lengthOf(1);
      await sub.unwikiban_user(victim);
      expect(await sub.get_wikibanned_users(victim)).to.have.lengthOf(0);
    });
    it('can add/remove a user from approved wiki editor status on a subreddit', async () => {
      await sub.add_wiki_contributor(victim);
      expect(await sub.get_wiki_contributors(victim)).to.have.lengthOf(1);
      await sub.remove_wiki_contributor(victim);
      expect(await sub.get_wiki_contributors(victim)).to.have.lengthOf(0);
    });
    it("can change a moderator's permissions on a subreddit", async () => {
      await sub.set_moderator_permissions({name: 'not_an_aardvark', permissions: ['flair', 'wiki']});
      expect(await sub.get_moderators({name: 'not_an_aardvark'})[0].mod_permissions.sort()).to.eql(['flair', 'wiki']);
      await sub.set_moderator_permissions({name: 'not_an_aardvark'});
      expect(await sub.get_moderators({name: 'not_an_aardvark'})[0].mod_permissions).to.eql(['all']);
    });
    it('can add/remove a user as a friend', async () => {
      await victim.friend();
      expect(await victim.get_friend_information().name).to.equal(victim.name);
      await victim.unfriend();
      await victim.get_friend_information().then(expect.fail, res => expect(res.statusCode).to.equal(400));
    });
  });

  describe('miscellaneous API calls', () => {
    it('can get a list of oauth scopes', async () => {
      expect(await r.get_oauth_scope_list()).to.have.property('creddits');
    });
    it('can check whether a given username is available', async () => {
      expect(await r.check_username_availability('not_an_aardvark')).to.be.false();
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
      expect(timer.isFulfilled()).to.be.true();
    });
    after(() => {
      r.config({request_delay: 0});
    });
  });

  describe('wiki content', () => {
    let page1, page2;
    before(() => {
      const sub = r.get_subreddit('snoowrap_testing');
      page1 = sub.get_wiki_page('exciting_page_name');
      page2 = sub.get_wiki_page('another_exciting_page_name');
    });
    it('can get the content of a wiki page', async () => {
      expect(page1).to.be.an.instanceof(snoowrap.objects.WikiPage);
      expect(await page1.content_md).to.equal('blah blah blah content');
    });
    it('can add/remove an editor to a wiki page', async () => {
      await page1.add_editor({name: 'actually_an_aardvark'});
      expect(_.find(await page1.get_settings().editors, {name: 'actually_an_aardvark'})).to.not.be.undefined();
      await page1.remove_editor({name: 'actually_an_aardvark'});
      expect(_.find(await page1.get_settings().editors, {name: 'actually_an_aardvark'})).to.be.undefined();
    });
    it('can edit the settings on a wiki page', async () => {
      await page1.edit_settings({listed: true, permission_level: 2});
      expect(await page1.get_settings().permlevel).to.equal(2);
      await page1.edit_settings({listed: true, permission_level: 0});
      expect(await page1.get_settings().permlevel).to.equal(0);
    });
    it('can edit a wiki page', async () => {
      const new_content = moment().format();
      await page2.edit({text: new_content, reason: `unit tests ${new_content}`});
      expect(await page2.refresh().content_md).to.equal(new_content);
    });
    it('can get the revision history for a wiki page', async () => {
      expect(await page2.get_revisions()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can get the wiki revision history for a subreddit', async () => {
      expect(await r.get_subreddit('snoowrap_testing').get_wiki_revisions()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can revert to a given revision', async () => {
      const history = await page2.get_revisions();
      await page2.revert(history[1]);
      const updated_history = await page2.get_revisions();
      expect(history[0].id).to.equal(updated_history[1].id);
      expect(_.find(history, updated_history[0])).to.be.undefined();
    });
    it('can get the discussions for a wiki page', async () => {
      expect(await page2.get_discussions()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can get a list of wiki pages on a subreddit', async () => {
      const pages = await r.get_subreddit('snoowrap_testing').get_wiki_pages();
      expect(pages).to.be.an.instanceof(Array);
      expect(pages[0]).to.be.an.instanceof(snoowrap.objects.WikiPage);
    });
  });

  describe('livethreads', () => {
    let thread;
    before(async () => {
      thread = r.get_livethread('whrdxo8dg9n0');
      await thread.fetch();
    });
    it('can add and listen for content on a livethread using websockets', done => {
      const new_update = moment().format();
      thread.add_update(new_update);
      thread.stream.once('update', data => {
        expect(data.body).to.equal(new_update);
        done();
      });
    });
    it('can delete an update', done => {
      thread.get_recent_updates()[0].then(most_recent_update => {
        thread.delete_update(most_recent_update);
      });
      thread.stream.once('delete', () => done());
    });
    it('can edit the settings on a livethread', async () => {
      const new_description = moment().format();
      await thread.edit_settings({description: new_description, title: 'test livethread'});
      expect(await thread.refresh().description).to.equal(new_description);
    });
    it('can invite a contributor, then revoke the invitation', async () => {
      await thread.invite_contributor({name: 'actually_an_aardvark'});
      await thread.revoke_contributor_invite({name: 'actually_an_aardvark'});
    });
    it('can strike an update', done => {
      thread.get_recent_updates()[0].then(most_recent_update => {
        thread.strike_update(most_recent_update);
      });
      thread.stream.once('strike', () => done());
    });
    it('can get recent updates on a livethread', async () => {
      expect(await thread.get_recent_updates()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can get the discussions on a livethread', async () => {
      expect(await thread.get_discussions()).to.be.an.instanceof(snoowrap.objects.Listing);
    });
    it('can modify the permissions of contributors on a livethread', async () => {
      await thread.set_contributor_permissions({name: 'not_an_aardvark', permissions: ['edit']});
      expect(_.find(await thread.get_contributors()[0], {name: 'not_an_aardvark'}).permissions).to.eql(['edit']);
      await thread.set_contributor_permissions({name: 'not_an_aardvark'});
      expect(_.find(await thread.get_contributors()[0], {name: 'not_an_aardvark'}).permissions).to.eql(['all']);
    });
    after(() => {
      thread.close_stream();
    });
  });

  describe('multireddits', () => {
    let multi, my_multi;
    before(() => {
      multi = r.get_user('Lapper').get_multireddit('depthhub');
      my_multi = r.get_user('snoowrap_testing').get_multireddit('perma_multi');
    });
    it('can get information about a multireddit', async () => {
      const subs = await multi.subreddits;
      expect(subs).to.be.an.instanceof(Array);
      expect(subs[0]).to.be.an.instanceof(snoowrap.objects.Subreddit);
      expect(subs[0].display_name).to.equal('AcademicPhilosophy');
    });
    it('can copy a and delete a multireddit', async () => {
      const copied = await multi.copy({new_name: 'copied_multi'});
      expect(copied).to.be.an.instanceof(snoowrap.objects.MultiReddit);
      expect(copied.name).to.equal('copied_multi');
      await copied.delete();
      await r.get_me().get_multireddit('copied_multi').fetch().then(expect.fail, err => {
        expect(err.statusCode).to.equal(404);
      });
    });
    it("can get a list of the requester's multireddits", async () => {
      const mine = await r.get_my_multireddits();
      expect(mine).to.be.an.instanceof(Array);
      expect(mine[0]).to.be.an.instanceof(snoowrap.objects.MultiReddit);
    });
    it('can rename a multireddit', async () => {
      await my_multi.rename({new_name: 'perma_multi2'});
      expect(my_multi.name).to.equal('perma_multi2');
      await my_multi.rename({new_name: 'perma_multi'});
      expect(my_multi.name).to.equal('perma_multi');
    });
    xit('can create a multireddit', async () => {
      console.log(await r.create_multireddit({name: 'just_created', subreddits: ['snoowrap_testing', 'cookies']}
    ).then(console.log, console.log));
    });
    it('can delete a multireddit', async () => {
      const temp_multi = await my_multi.copy({new_name: 'temp_multi'});
      await temp_multi.delete();
      await temp_multi.refresh().then(expect.fail, err => {
        expect(err.statusCode).to.equal(404);
      });
    });
  });

  describe('Creating new content', () => {
    // These should all pass, but they're skipped by default to avoid spam since they permanently write content to reddit.
    it.skip('can create a linkpost given a subreddit object, and then delete the post', async () => {
      const title = `snoowrap unit tests: ${moment().format()}`;
      const new_link = await r.get_subreddit('snoowrap_testing').submit_link({title, url: 'https://reddit.com'});
      expect(new_link).to.be.an.instanceof(snoowrap.objects.Submission);
      expect(await new_link.title).to.equal(title);
      await new_link.delete();
      expect(await new_link.refresh().author.name).to.equal('[deleted]');
    });
    it.skip('can create a selfpost given a subreddit object, and then delete the post', async () => {
      const title = `snoowrap unit tests: ${moment().format()}`;
      const new_selfpost = await r.get_subreddit('snoowrap_testing').submit_selfpost({title, text: 'yay cookies'});
      expect(new_selfpost).to.be.an.instanceof(snoowrap.objects.Submission);
      expect(await new_selfpost.title).to.equal(title);
      await new_selfpost.delete();
      expect(await new_selfpost.refresh().author.name).to.equal('[deleted]');
    });
    it.skip('can create a subreddit', async () => {
      const sub_name = moment().format().slice(0, 19).replace(/[-:]/g, '_');
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
      expect(_.find(mute_list, {name: await modmail.author.name})).to.be.defined();
    });
    it.skip('can unmute the author of a modmail', async () => {
      const modmail = r.get_message('4zop6r');
      await modmail.unmute_author();
      const mute_list = await modmail.subreddit.get_muted_users();
      expect(_.find(mute_list, {name: await modmail.author.name})).to.be.undefined();
    });
    it.skip('can mute/unmute a user from a subreddit', async () => {
      const sub = r.get_subreddit('snoowrap_testing');
      const victim = r.get_user('actually_an_aardvark');
      await sub.mute_user(victim);
      expect(await sub.get_muted_users(victim)).to.have.lengthOf(1);
      await sub.unmute_user(victim);
      expect(await sub.get_muted_users(victim)).to.have.lengthOf(0);
    });
    it.skip('can comment on a submission', async () => {
      const comment_body = moment().format();
      const new_comment = await r.get_submission('43qlu8').reply(comment_body);
      expect(new_comment).to.be.an.instanceof(snoowrap.objects.Comment);
      expect(await new_comment.body).to.equal(comment_body);
    });
    it.skip('can gild a submission/comment', async () => {
      // I think this test should work, but I have no creddits so I can't test it.
      // If anyone wants to try it out, be my guest.
      const submission = r.get_submission('43qlu8');
      const initial_gilding_amount = await submission.gilded;
      await submission.gild();
      expect(await submission.refresh().gilded).to.be.above(initial_gilding_amount);
    });
  });
});
