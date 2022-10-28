import {handleJsonErrors} from '../helper'
import ReplyableContent from './ReplyableContent'
import type {RedditUser, Subreddit} from './'
import type {RichTextFlair, Gildings, SubredditType} from '../interfaces'

const api_type = 'json'


interface VoteableContent {
  approved?: boolean
  approved_at_utc: number|null
  approved_by: RedditUser|null
  archived: boolean
  author: RedditUser
  author_flair_background_color: string|null
  author_flair_css_class: string|null
  author_flair_richtext: RichTextFlair[]
  author_flair_template_id: string|null
  author_flair_text: string|null
  author_flair_text_color: string|null
  author_flair_type: 'text'|'richtext'
  author_fullname: string
  author_patreon_flair: boolean
  banned_at_utc: number|null
  banned_by: RedditUser|null
  can_gild: boolean
  can_mod_post: boolean
  created: number
  created_utc: number
  distinguished: 'admin'|'moderator'|null
  downs: number
  edited: number|boolean
  gilded: number
  gildings: Gildings
  id: string
  locked: boolean
  /** true = upvoted, false = downvoted, null = hasn't voted */
  likes: boolean|null
  mod_note: string
  /** The name of the user that added the mod_note */
  mod_reason_by: string
  mod_reason_title: string
  mod_reports: string[]
  name: string
  no_follow: boolean
  num_reports: number
  permalink: string
  removal_reason: any // ?
  report_reasons: string[]
  saved: boolean
  score: number
  send_replies: boolean
  stickied: boolean
  subreddit: Subreddit
  subreddit_id: string
  subreddit_name_prefixed: string
  subreddit_type: SubredditType
  ups: number
  user_reports: string[]
  delete(): Promise<this>
}

/**
 * A set of mixin functions that apply to Submissions and Comments.
 */
class VoteableContent<T extends VoteableContent = VoteableContent<any>> extends ReplyableContent<T> {
  static _name = 'VoteableContent'

  async _mutateAndExpandReplies (limit: number, depth: number) {
    if (depth <= 0) {
      return this
    }
    const repliesKey = this.constructor._name === 'Submission' ? 'comments' : 'replies'
    const replies = await this[repliesKey].fetchMore({amount: limit - this[repliesKey].length})
    this[repliesKey] = replies
    replies.slice(0, limit).map((reply: any) => reply._mutateAndExpandReplies(limit, depth - 1))
    return this
  }

  _setInboxRepliesEnabled (state: boolean) {
    return this._post({url: 'api/sendreplies', form: {state, id: this.name}})
  }

  /**
   * @summary Casts a vote on this Comment or Submission.
   * @private
   * @param direction The direction of the vote. (1 for an upvote, -1 for a downvote, 0 to remove a vote)
   * @returns A Promise that fulfills when the request is complete.
   */
  async _vote (direction: number) {
    await this._post({url: 'api/vote', form: {dir: direction, id: this.name}})
    return this
  }

  /**
   * @summary Disables inbox replies on this Comment or Submission
   * @returns A Promise that fulfills with this content when the request is complete
   * @example r.getComment('coip909').disableInboxReplies()
   */
  async disableInboxReplies () {
    await this._setInboxRepliesEnabled(false)
    return this
  }

  /**
   * @summary Distinguishes this Comment or Submission with a sigil.
   * @desc **Note:** This function will only work if the requester is the author of this Comment/Submission.
   * @param {boolean|string} [status=true] Determines how the item should be distinguished.
   * `true` (default) signifies that the item should be moderator-distinguished, and
   * `false` signifies that the item should not be distinguished. Passing a string (e.g.
   * `admin`) will cause the item to get distinguished with that string, if possible.
   * @param {boolean} [sticky=false] Determines whether this item should be stickied in addition to being
   * distinguished. (This only applies to comments; to sticky a submission, use {@link Submission#sticky} instead.)
   * @returns A Promise that fulfills when the request is complete.
   * @example r.getComment('d1xclfo').distinguish({status: true, sticky: true})
   */
  async distinguish (status: boolean|string = true, sticky = false) {
    await this._post({url: 'api/distinguish', form: {
      api_type,
      how: status === true ? 'yes' : status === false ? 'no' : status,
      sticky,
      id: this.name
    }})
    return this
  }

  /**
   * @summary Downvotes this Comment or Submission.
   * @returns A Promise that fulfills with this Comment/Submission when the request is complete.
   * @desc **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK, but
   * bots deciding how to vote on content or amplifying a human's vote are not. See the [reddit rules](https://reddit.com/rules)
   * for more details on what constitutes vote cheating. (This guideline is quoted from
   * [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
   * @example r.getSubmission('4e62ml').downvote()
   */
  downvote () {
    return this._vote(-1)
  }

  /**
   * @summary Edits this Comment or Submission.
   * @param {string} updatedText The updated markdown text to use
   * @returns A Promise that fulfills when this request is complete.
   * @example r.getComment('coip909').edit('Blah blah blah this is new updated text')
   */
  async edit (updatedText: string) {
    const res = await this._post({
      url: 'api/editusertext',
      form: {api_type, text: updatedText, thing_id: this.name}
    })
    handleJsonErrors(res)
    return this
  }

  /**
   * @summary Enables inbox replies on this Comment or Submission
   * @returns A Promise that fulfills with this content when the request is complete
   * @example r.getComment('coip909').enableInboxReplies()
   */
  async enableInboxReplies () {
    await this._setInboxRepliesEnabled(true)
    return this
  }

  /**
   * @summary Expands the reply Listings on this Comment/Submission.
   * @desc This is useful in cases where one wants to enumerate all comments on a
   * thread, even the ones that are initially hidden when viewing it (e.g. long comment chains).
   *
   * This function accepts two optional parameters `options.limit` and `options.depth`. `options.limit` sets an upper bound
   * for the branching factor of the resulting replies tree, i.e. the number of comments that are fetched in reply to any given
   * item. `options.depth` sets an upper bound for the depth of the resulting replies tree (where a depth of 0 signifies that no
   * replies should be fetched at all).
   *
   * Note that regardless of the `limit` and `depth` parameters used, any reply that appeared in the original reply tree will
   * appear in the expanded reply tree. In certain cases, the depth of the resulting tree may also be larger than `options.depth`,
   * if the reddit API returns more of a comment tree than needed.
   *
   * These parameters should primarily be used to keep the request count low; if a precise limit and depth are needed, it is
   * recommended to manually verify the comments in the tree afterwards.
   *
   * Both parameters default to `Infinity` if omitted, i.e. the resulting tree contains every single comment available. It should
   * be noted that depending on the size and depth of the thread, fetching every single comment can use up a significant number
   * of ratelimited requests. (To give an intuitive estimate, consider how many clicks would be needed to view all the
   * comments on the thread using the HTML site.)
   * @param {number} [limit=Infinity] An upper-bound for the branching factor of the resulting tree of replies
   * @param {number} [depth=Infinity] An upper-bound for the depth of the resulting tree of replies
   * @returns A Promise that fulfills with a new version of this object that has an expanded reply tree. The original
   * object is not modified
   * @example r.getSubmission('4fuq26').expandReplies().then(console.log)
   * // => (a very large comment tree containing every viewable comment on this thread)
   */
  async expandReplies (limit = Infinity, depth = Infinity) {
    await this.fetch()
    return this._clone(true)._mutateAndExpandReplies(limit, depth)
  }

  /**
   * @summary Gives reddit gold to the author of this Comment or Submission.
   * @returns A Promise that fullfills with this Comment/Submission when this request is complete
   * @example r.getComment('coip909').gild()
   */
  async gild () {
    await this._post({url: `api/v1/gold/gild/${this.name}`})
    return this
  }

  /**
   * @summary Saves this Comment or Submission (i.e. adds it to the list at reddit.com/saved)
   * @returns A Promise that fulfills when the request is complete
   * @example r.getSubmission('4e62ml').save()
   */
  async save () {
    await this._post({url: 'api/save', form: {id: this.name}})
    return this
  }

  /**
   * @summary Undistinguishes this Comment or Submission. Alias for distinguish({status: false})
   * @returns A Promise that fulfills when the request is complete.
   * @example r.getSubmission('4e62ml').undistinguish()
   */
  undistinguish () {
    return this.distinguish(false, false)
  }

  /**
   * @summary Unsaves this item
   * @returns A Promise that fulfills when the request is complete
   * @example r.getSubmission('4e62ml').unsave()
   */
  async unsave () {
    await this._post({url: 'api/unsave', form: {id: this.name}})
    return this
  }

  /**
   * @summary Removes any existing vote on this Comment or Submission.
   * @returns A Promise that fulfills with this Comment/Submission when the request is complete.
   * @desc **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK, but
   * bots deciding how to vote on content or amplifying a human's vote are not. See the [reddit rules](https://reddit.com/rules)
   * for more details on what constitutes vote cheating. (This guideline is quoted from
   * [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
   * @example r.getSubmission('4e62ml').unvote()
   */
  unvote () {
    return this._vote(0)
  }

  /**
   * @summary Upvotes this Comment or Submission.
   * @returns A Promise that fulfills with this Comment/Submission when the request is complete
   * @desc **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK,
   * but bots deciding how to vote on content or amplifying a human's vote are not. See the
   * [reddit rules](https://reddit.com/rules) for more details on what constitutes vote cheating. (This guideline is quoted from
   * [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
   * @example r.getSubmission('4e62ml').upvote()
   */
  upvote () {
    return this._vote(1)
  }
}

// VoteableContent#delete is not in the class body since Safari 9 can't parse the `delete` function name in class bodies.
/**
 * @function
 * @name delete
 * @summary Deletes this Comment or Submission
 * @returns A Promise that fulfills with this Comment/Submission when this request is complete
 * @example r.getComment('coip909').delete()
 * @memberof VoteableContent
 * @instance
 */
Object.defineProperty(VoteableContent.prototype, 'delete', {async value () {
  await this._post({url: 'api/del', form: {id: this.name}})
  return this
}, configurable: true, writable: true})

export default VoteableContent
