import {USERNAME_REGEX} from '../constants'
import {InvalidMethodCallError, InvalidUserError} from '../errors'
import RedditContent from './RedditContent'
import type {AssignFlairOptions, OmitProps} from '../interfaces'
import type {ListingQuery} from './Listing'


/**
 * A class representing a reddit user
 * @example
 *
 * // Get a user with the given username
 * r.getUser('spez')
 */
class RedditUser extends RedditContent<RedditUser> {
  static _name = 'RedditUser'

  get _uri () {
    if (typeof this.name !== 'string' || !USERNAME_REGEX.test(this.name)) {
      throw new InvalidUserError(this.name)
    }
    return `user/${this.name}/about`
  }

  /**
   * @summary Gives reddit gold to a user
   * @param months The number of months of gold to give. This must be a number between 1 and 36.
   * @returns A Promise that fulfills when the request is complete
   * @example r.getUser('not_an_aardvark').giveGold(12)
   */
  giveGold (months: number) {
    /**
     * Ideally this would allow for more than 36 months by sending multiple requests, but I don't have the resources to test
     * that code, and it's probably better that such a big investment be deliberate anyway.
     */
    if (typeof months !== 'number' || months < 1 || months > 36) {
      throw new InvalidMethodCallError('Invalid argument to RedditUser#giveGold; `months` must be between 1 and 36.')
    }
    return this._post({url: `api/v1/gold/give/${this.name}`, form: {months: months + ''}})
  }

  /**
   * Assigns flair to this user on a given subreddit (as a moderator).
   * @param {object} options
   * @returns A Promise that fulfills with the current user after the request is complete
   * @example r.getUser('not_an_aardvark').assignFlair({subredditName: 'snoowrap', text: "Isn't an aardvark"})
   */
  async assignFlair (options: OmitProps<AssignFlairOptions, 'link'|'name'>) {
    await this._r._assignFlair({...options, name: this.name})
    return this
  }

  /**
   * @summary Adds this user as a friend, or modifies their friend note.
   * @desc **Note:** reddit.com only permits "notes" to be added on friends if the authenticated account has a subscription to
   * reddit gold.
   * @param note An optional note to add on the user (300 characters max)
   * @returns A Promise that fulfills when this request is complete
   * @example r.getUser('actually_an_aardvark').friend({note: 'Is an aardvark'})
   */
  async friend (note?: string) {
    await this._put({url: `api/v1/me/friends/${this.name}`, data: {user: this.name, note}})
    return this
  }

  /**
   * @summary Removes this user from the requester's friend list.
   * @returns A Promise that fulfills with this user when the request is complete
   * @example r.getUser('actually_an_aardvark').unfriend()
   */
  unfriend () {
    return this._delete({url: `api/v1/me/friends/${this.name}`})
  }

  /**
   * @summary Gets information on this user related to their presence on the friend list.
   * @returns A Promise that fulfills with an object containing friend information
   * @example
   *
   * r.getUser('not_an_aardvark').getFriendInformation().then(console.log)
   * // => { date: 1460318190, note: 'Is an aardvark', name: 'actually_an_aardvark', id: 't2_q3519' }
   */
  getFriendInformation () {
    return this._get({url: `api/v1/me/friends/${this.name}`})
  }

  /**
   * @summary Gets a list of this user's trophies.
   * @returns A TrophyList containing this user's trophies
   * @example
   *
   * r.getUser('not_an_aardvark').getTrophies().then(console.log)
   * // => TrophyList { trophies: [
   * //  Trophy { ... },
   * //  Trophy { ... },
   * //  ...
   * // ] }
   */
  getTrophies () {
    return this._get({url: `api/v1/user/${this.name}/trophies`})
  }

  /**
   * @summary Gets a Listing of the content this user has submitted.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Submissions and Comments
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
  getOverview (options: ListingQuery) {
    return this._getListing({uri: `user/${this.name}/overview`, qs: options})
  }

  /**
   * @summary Gets a Listing of this user's submissions.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Submissions
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
  getSubmissions (options: ListingQuery) {
    return this._getListing({uri: `user/${this.name}/submitted`, qs: options})
  }

  /**
   * @summary Gets a Listing of this user's comments.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Comments
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
  getComments (options: ListingQuery) {
    return this._getListing({uri: `user/${this.name}/comments`, qs: options})
  }

  /**
   * @summary Gets a Listing of the content that this user has upvoted.
   * @desc **Note**: This can only be used to view one's own upvoted content, unless the user in question has chosen to
   * make this information public in their preferences.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Submissions and Comments
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
  getUpvotedContent (options: ListingQuery) {
    return this._getListing({uri: `user/${this.name}/upvoted`, qs: options})
  }

  /**
   * @summary Gets a Listing of the content that this user has downvoted.
   * @desc **Note**: This can only be used to view one's own downvoted content, unless the user in question has chosen to
   * make this information public in their preferences.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Submissions and Comments
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
  getDownvotedContent (options: ListingQuery) {
    return this._getListing({uri: `user/${this.name}/downvoted`, qs: options})
  }

  /**
   * @summary Gets a Listing of the submissions that this user has hidden.
   * @desc **Note**: This can only be used to view one's own set of hidden posts, as reddit will return a 403 error when
   * attempting to view another users' hidden posts.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Submissions
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
  getHiddenContent (options: ListingQuery) {
    return this._getListing({uri: `user/${this.name}/hidden`, qs: options})
  }

  /**
   * @summary Gets a Listing of the content that this user has saved.
   * @desc **Note**: This can only be used to view one's own set of saved content, as reddit will return a 403 error when
   * attempting to view other users' saved content.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Submissions and Comments.
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
  getSavedContent (options: ListingQuery) {
    return this._getListing({uri: `user/${this.name}/saved`, qs: options})
  }

  /**
   * @summary Gets a Listing of this user's content which has been gilded.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Submissions and Comments
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
  getGildedContent (options: ListingQuery) {
    return this._getListing({uri: `user/${this.name}/gilded`, qs: options})
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
  getMultireddit (name: string) {
    return this._r._newObject('MultiReddit', {name, curator: this})
  }

  /**
   * @summary Gets an Array of all of this user's MultiReddits.
   * @returns A Promise that fulfills with an Array containing MultiReddits.
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
  getMultireddits () {
    return this._get({url: `api/multi/user/${this.name}`, params: {expand_srs: true}})
  }
}

export default RedditUser
