'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _constants = require('../constants.js');

var _errors = require('../errors.js');

var _RedditContent = require('./RedditContent.js');

var _RedditContent2 = _interopRequireDefault(_RedditContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* A class representing a reddit user
* <style> #RedditUser {display: none} </style>
* @extends ReplyableContent
* @example
*
* // Get a user with the given username
* r.getUser('spez')
*/
var RedditUser = class RedditUser extends _RedditContent2.default {
  get _uri() {
    if (typeof this.name !== 'string' || !_constants.USERNAME_REGEX.test(this.name)) {
      throw new _errors.InvalidUserError(this.name);
    }
    return 'user/' + this.name + '/about';
  }
  /**
  * @summary Gives reddit gold to a user
  * @param {number} months The number of months of gold to give. This must be a number between 1 and 36.
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example r.getUser('not_an_aardvark').giveGold(12)
  */
  giveGold(months) {
    /* Ideally this would allow for more than 36 months by sending multiple requests, but I don't have the resources to test
    that code, and it's probably better that such a big investment be deliberate anyway. */
    if (typeof months !== 'number' || months < 1 || months > 36) {
      throw new _errors.InvalidMethodCallError('Invalid argument to RedditUser#giveGold; `months` must be between 1 and 36.');
    }
    return this._post({ uri: 'api/v1/gold/give/' + this.name, form: { months } });
  }
  /**
  * Assigns flair to this user on a given subreddit (as a moderator).
  * @param {object} options
  * @param {string} options.subredditName The subreddit that flair should be assigned on
  * @param {string} [options.text=''] The text that the user's flair should have
  * @param {string} [options.cssClass=''] The CSS class that the user's flair should have
  * @returns {Promise} A Promise that fulfills with the current user after the request is complete
  * @example r.getUser('not_an_aardvark').assignFlair({subredditName: 'snoowrap', text: "Isn't an aardvark"})
  */
  assignFlair(options) {
    return this._r._assignFlair(_extends({}, options, { name: this.name })).return(this);
  }
  /**
  * @summary Adds this user as a friend, or modifies their friend note.
  * @desc **Note:** reddit.com only permits "notes" to be added on friends if the authenticated account has a subscription to
  reddit gold.
  * @param {object} options
  * @param {string} [options.note] An optional note to add on the user (300 characters max)
  * @returns {Promise} A Promise that fulfills when this request is complete
  * @example r.getUser('actually_an_aardvark').friend({note: 'Is an aardvark'})
  */
  friend() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        note = _ref.note;

    return this._put({ uri: 'api/v1/me/friends/' + this.name, body: { user: this.name, note } }).return(this);
  }
  /**
  * @summary Removes this user from the requester's friend list.
  * @returns {Promise} A Promise that fulfills with this user when the request is complete
  * @example r.getUser('actually_an_aardvark').unfriend()
  */
  unfriend() {
    return this._delete({ uri: 'api/v1/me/friends/' + this.name });
  }
  /**
  * @summary Gets information on this user related to their presence on the friend list.
  * @returns {Promise} A Promise that fulfills with an object containing friend information
  * @example
  *
  * r.getUser('not_an_aardvark').getFriendInformation().then(console.log)
  * // => { date: 1460318190, note: 'Is an aardvark', name: 'actually_an_aardvark', id: 't2_q3519' }
  */
  getFriendInformation() {
    return this._get({ uri: 'api/v1/me/friends/' + this.name });
  }
  /**
  * @summary Gets a list of this user's trophies.
  * @returns {Promise} A TrophyList containing this user's trophies
  * @example
  *
  * r.getUser('not_an_aardvark').getTrophies().then(console.log)
  * // => TrophyList { trophies: [
  * //  Trophy { ... },
  * //  Trophy { ... },
  * //  ...
  * // ] }
  */
  getTrophies() {
    return this._get({ uri: 'api/v1/user/' + this.name + '/trophies' });
  }
  /**
  * @summary Gets a Listing of the content this user has submitted.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  * @example
  *
  * r.getUser('spez').getOverview().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getOverview(options) {
    return this._getListing({ uri: 'user/' + this.name + '/overview', qs: options });
  }
  /**
  * @summary Gets a Listing of this user's submissions.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions
  * @example
  *
  * r.getUser('spez').getSubmissions().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getSubmissions(options) {
    return this._getListing({ uri: 'user/' + this.name + '/submitted', qs: options });
  }
  /**
  * @summary Gets a Listing of this user's comments.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Comments
  * @example
  *
  * r.getUser('spez').getComments().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Comment { ... },
  * //  ...
  * // ]
  */
  getComments(options) {
    return this._getListing({ uri: 'user/' + this.name + '/comments', qs: options });
  }
  /**
  * @summary Gets a Listing of the content that this user has upvoted.
  * @desc **Note**: This can only be used to view one's own upvoted content, unless the user in question has chosen to
  make this information public in their preferences.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  * @example
  *
  * r.getMe().getUpvotedContent().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getUpvotedContent(options) {
    return this._getListing({ uri: 'user/' + this.name + '/upvoted', qs: options });
  }
  /**
  * @summary Gets a Listing of the content that this user has downvoted.
  * @desc **Note**: This can only be used to view one's own downvoted content, unless the user in question has chosen to
  make this information public in their preferences.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  * @example
  *
  * r.getMe().getDownvotedContent().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getDownvotedContent(options) {
    return this._getListing({ uri: 'user/' + this.name + '/downvoted', qs: options });
  }
  /**
  * @summary Gets a Listing of the submissions that this user has hidden.
  * @desc **Note**: This can only be used to view one's own set of hidden posts, as reddit will return a 403 error when
  attempting to view another users' hidden posts.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions
  * @example
  *
  * r.getMe().getHiddenContent().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getHiddenContent(options) {
    return this._getListing({ uri: 'user/' + this.name + '/hidden', qs: options });
  }
  /**
  * @summary Gets a Listing of the content that this user has saved.
  * @desc **Note**: This can only be used to view one's own set of saved content, as reddit will return a 403 error when
  attempting to view other users' saved content.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments.
  * @example
  *
  * r.getMe().getSavedContent().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getSavedContent(options) {
    return this._getListing({ uri: 'user/' + this.name + '/saved', qs: options });
  }
  /**
  * @summary Gets a Listing of this user's content which has been gilded.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  * @example
  *
  * r.getMe().getGildedContent().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getGildedContent(options) {
    return this._getListing({ uri: 'user/' + this.name + '/gilded', qs: options });
  }
  /**
  * @summary Gets a multireddit belonging to this user.
  * @param {string} name The name of the multireddit
  * @returns {MultiReddit} An unfetched MultiReddit object
  * @example
  *
  * r.getUser('multi-mod').getMultireddit('coding_languages')
  * // => MultiReddit {
  * //  name: 'coding_languages',
  * //  curator: RedditUser { name: 'multi-mod' },
  * //  path: '/user/multi-mod/m/coding_languages'
  * // }
  */
  getMultireddit(name) {
    return this._r._newObject('MultiReddit', { name, curator: this });
  }
  /**
  * @summary Gets an Array of all of this user's MultiReddits.
  * @returns {Promise} A Promise that fulfills with an Array containing MultiReddits.
  * @example
  *
  * r.getUser('multi-mod').getMultireddits().then(console.log)
  *
  * // => [
  *   MultiReddit { ... },
  *   MultiReddit { ... },
  *   MultiReddit { ... },
  *   ...
  * ]
  */
  getMultireddits() {
    return this._get({ uri: 'api/multi/user/' + this.name, qs: { expand_srs: true } });
  }
};

exports.default = RedditUser;