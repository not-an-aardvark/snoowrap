import {USERNAME_REGEX} from '../constants.js';
import {InvalidMethodCallError, InvalidUserError} from '../errors.js';
import RedditContent from './RedditContent.js';

/**
* A class representing a reddit user
* <style> #RedditUser {display: none} </style>
* @extends ReplyableContent
* @example
*
* // Get a user with the given username
* r.get_user('spez')
*/
const RedditUser = class RedditUser extends RedditContent {
  get _uri () {
    if (typeof this.name !== 'string' || !USERNAME_REGEX.test(this.name)) {
      throw new InvalidUserError(this.name);
    }
    return `user/${this.name}/about`;
  }
  /**
  * @summary Gives reddit gold to a user
  * @param {number} months The number of months of gold to give. This must be a number between 1 and 36.
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example r.get_user('not_an_aardvark').give_gold(12)
  */
  give_gold (months) {
    /* Ideally this would allow for more than 36 months by sending multiple requests, but I don't have the resources to test
    that code, and it's probably better that such a big investment be deliberate anyway. */
    if (typeof months !== 'number' || months < 1 || months > 36) {
      throw new InvalidMethodCallError('Invalid argument to RedditUser.give_gold; `months` must be between 1 and 36.');
    }
    return this._post({uri: `api/v1/gold/give/${this.name}`, form: {months}});
  }
  /**
  * Assigns flair to this user on a given subreddit (as a moderator).
  * @param {object} options
  * @param {string} options.subreddit_name The subreddit that flair should be assigned on
  * @param {string} [options.text=''] The text that the user's flair should have
  * @param {string} [options.css_class=''] The CSS class that the user's flair should have
  * @returns {Promise} A Promise that fulfills with the current user after the request is complete
  * @example r.get_user('not_an_aardvark').assign_flair({subreddit_name: 'snoowrap', text: "Isn't an aardvark"})
  */
  assign_flair (options) {
    return this._r._assign_flair({...options, name: this.name}).return(this);
  }
  /**
  * @summary Adds this user as a friend, or modifies their friend note.
  * @desc **Note:** reddit.com only permits "notes" to be added on friends if the authenticated account has a subscription to
  reddit gold.
  * @param {object} options
  * @param {string} [options.note] An optional note to add on the user (300 characters max)
  * @returns {Promise} A Promise that fulfills when this request is complete
  * @example r.get_user('actually_an_aardvark').friend({note: 'Is an aardvark'})
  */
  friend ({note} = {}) {
    return this._put({uri: `api/v1/me/friends/${this.name}`, json: {user: this.name, note}}).return(this);
  }
  /**
  * @summary Removes this user from the requester's friend list.
  * @returns {Promise} A Promise that fulfills with this user when the request is complete
  * @example r.get_user('actually_an_aardvark').unfriend()
  */
  unfriend () {
    return this._delete({uri: `api/v1/me/friends/${this.name}`});
  }
  /**
  * @summary Gets information on this user related to their presence on the friend list.
  * @returns {Promise} A Promise that fulfills with an object containing friend information
  * @example
  *
  * r.get_user('not_an_aardvark').get_friend_information().then(console.log)
  * // => { date: 1460318190, note: 'Is an aardvark', name: 'actually_an_aardvark', id: 't2_q3519' }
  */
  get_friend_information () {
    return this._get({uri: `api/v1/me/friends/${this.name}`});
  }
  /**
  * @summary Gets a list of this user's trophies.
  * @returns {Promise} A TrophyList containing this user's trophies
  * @example
  *
  * r.get_user('not_an_aardvark').get_trophies().then(console.log)
  * // => TrophyList { trophies: [
  * //  Trophy { ... },
  * //  Trophy { ... },
  * //  ...
  * // ] }
  */
  get_trophies () {
    return this._get({uri: `api/v1/user/${this.name}/trophies`});
  }
  /**
  * @summary Gets a Listing of the content this user has submitted.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  * @example
  *
  * r.get_user('spez').get_overview().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  get_overview (options) {
    return this._get_listing({uri: `user/${this.name}/overview`, qs: options});
  }
  /**
  * @summary Gets a Listing of this user's submissions.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions
  * @example
  *
  * r.get_user('spez').get_submissions().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  get_submissions (options) {
    return this._get_listing({uri: `user/${this.name}/submitted`, qs: options});
  }
  /**
  * @summary Gets a Listing of this user's comments.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Comments
  * @example
  *
  * r.get_user('spez').get_comments().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Comment { ... },
  * //  ...
  * // ]
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
  * @example
  *
  * r.get_me().get_upvoted_content().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
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
  * @example
  *
  * r.get_me().get_downvoted_content().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
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
  * @example
  *
  * r.get_me().get_hidden_content().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
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
  * @example
  *
  * r.get_me().get_saved_content().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  get_saved_content (options) {
    return this._get_listing({uri: `user/${this.name}/saved`, qs: options});
  }
  /**
  * @summary Gets a Listing of this user's content which has been gilded.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing Submissions and Comments
  * @example
  *
  * r.get_me().get_gilded_content().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  get_gilded_content (options) {
    return this._get_listing({uri: `user/${this.name}/gilded`, qs: options});
  }
  /**
  * @summary Gets a multireddit belonging to this user.
  * @param {string} name The name of the multireddit
  * @returns {MultiReddit} An unfetched MultiReddit object
  * @example
  *
  * r.get_user('multi-mod').get_multireddit('coding_languages')
  * // => MultiReddit {
  * //  name: 'coding_languages',
  * //  curator: RedditUser { name: 'multi-mod' },
  * //  path: '/user/multi-mod/m/coding_languages'
  * // }
  */
  get_multireddit (name) {
    return this._r._new_object('MultiReddit', {name, curator: this});
  }
  /**
  * @summary Gets an Array of all of this user's MultiReddits.
  * @returns {Promise} A Promise that fulfills with an Array containing MultiReddits.
  * @example
  *
  * r.get_user('multi-mod').get_multireddits().then(console.log)
  *
  * // => [
  *   MultiReddit { ... },
  *   MultiReddit { ... },
  *   MultiReddit { ... },
  *   ...
  * ]
  */
  get_multireddits () {
    return this._get({uri: `api/multi/user/${this.name}`, qs: {expand_srs: true}});
  }
};

export default RedditUser;
