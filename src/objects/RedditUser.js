'use strict';
const _ = require('lodash');
const constants = require('../constants');
const errors = require('../errors');

/**
* A class representing a reddit user
* @extends ReplyableContent
*/
const RedditUser = class extends require('./RedditContent') {
  get _uri () {
    if (typeof this.name !== 'string' || !constants.USERNAME_REGEX.test(this.name)) {
      throw new errors.InvalidUserError(this.name);
    }
    return `user/${this.name}/about`;
  }
  /**
  * @summary Gives reddit gold to a user
  * @param {number} months The number of months of gold to give. This must be a number between 1 and 36.
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  give_gold (months) {
    /* Ideally this would allow for more than 36 months by sending multiple requests, but I don't have the resources to test
    that code, and it's probably better that such a big investment be deliberate anyway. */
    if (typeof months !== 'number' || months < 1 || months > 36) {
      throw new errors.InvalidMethodCallError('Invalid argument to RedditUser.give_gold; `months` must be between 1 and 36.');
    }
    return this._post({uri: `api/v1/gold/give/${this.name}`, form: {months}});
  }
  /** Assigns flair to this user on a given subreddit (as a moderator).
  * @param {object} options
  * @param {string} options.subreddit_name The subreddit that flair should be assigned on
  * @param {string} [options.text=''] The text that the user's flair should have
  * @param {string} [options.css_class=''] The CSS class that the user's flair should have
  * @returns {Promise} A Promise that fulfills with the current user after the request is complete
  */
  assign_flair (options) {
    return this._r._assign_flair(_.assign(options, {name: this.name})).return(this);
  }
  /**
  * @summary Adds this user as a friend, or modifies their friend note.
  * @param {object} $0
  * @param {string} [$0.note] An optional note to add on the user (300 characters max)
  */
  friend ({note} = {}) {
    return this._put({uri: `api/v1/me/friends/${this.name}`, json: {user: this.name, note}});
  }
  /**
  * @summary Removes this user from the requester's friend list.
  * @returns {Promise} A Promise that fulfills with this user when the request is complete
  */
  unfriend () {
    return this._del({uri: `api/v1/me/friends/${this.name}`});
  }
  /**
  * @summary Gets information on this user related to their presence on the friend list.
  * @returns {Promise} A Promise that fulfills with an object containing friend information
  */
  get_friend_information () {
    return this._get({uri: `api/v1/me/friends/${this.name}`});
  }
  /**
  * @summary Gets a list of this user's trophies.
  * @returns {Promise} A TrophyList containing this user's trophies
  */
  get_trophies () {
    return this._get({uri: `api/v1/user/${this.name}/trophies`});
  }
  /**
  * @summary Gets a Listing of the content this user has submitted.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  */
  get_overview (options) {
    return this._get_listing({uri: `user/${this.name}/overview`, qs: options});
  }
  /**
  * @summary Gets a Listing of this user's submissions.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions
  */
  get_submissions (options) {
    return this._get_listing({uri: `user/${this.name}/submitted`, qs: options});
  }
  /**
  * @summary Gets a Listing of this user's comments.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Comments
  */
  get_comments (options) {
    return this._get_listing({uri: `user/${this.name}/comments`, qs: options});
  }
  /**
  * @summary Gets a Listing of the content that this user has upvoted.
  * @desc **Note**: This can only be used to view one's own upvoted content, unless the user in question has chosen to
  make this information public in their preferences.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  */
  get_upvoted_content (options) {
    return this._get_listing({uri: `user/${this.name}/upvoted`, qs: options});
  }
  /**
  * @summary Gets a Listing of the content that this user has downvoted.
  * @desc **Note**: This can only be used to view one's own downvoted content, unless the user in question has chosen to
  make this information public in their preferences.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  */
  get_downvoted_content (options) {
    return this._get_listing({uri: `user/${this.name}/downvoted`, qs: options});
  }
  /**
  * @summary Gets a Listing of the submissions that this user has hidden.
  * @desc **Note**: This can only be used to view one's own set of hidden posts, as reddit will return a 403 error when
  attempting to view another users' hidden posts.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions
  */
  get_hidden_content (options) {
    return this._get_listing({uri: `user/${this.name}/hidden`, qs: options});
  }
  /**
  * @summary Gets a Listing of the content that this user has saved.
  * @desc **Note**: This can only be used to view one's own set of saved content, as reddit will return a 403 error when
  attempting to view other users' saved content.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments.
  */
  get_saved_content (options) {
    return this._get_listing({uri: `user/${this.name}/hidden`, qs: options});
  }
  /**
  * @summary Gets a Listing of this user's content which has been gilded.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  */
  get_gilded_content (options) {
    return this._get_listing({uri: `user/${this.name}/gilded`, qs: options});
  }
  /**
  * @summary Gets a multireddit belonging to this user.
  * @param {string} name The name of the multireddit
  * @returns {Promise} An unfetched MultiReddit object
  */
  get_multireddit (name) {
    return this._r._new_object('MultiReddit', {name, curator: this}, false);
  }
  /**
  * @summary Gets an Array of all of this user's MultiReddits.
  * @returns {Promise} A Promise that fulfills with an Array containing MultiReddits.
  */
  get_multireddits () {
    return this._get({uri: `api/multi/user/${this.name}`, qs: {expand_srs: true}});
  }
};

module.exports = RedditUser;
