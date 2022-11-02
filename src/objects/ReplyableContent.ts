import RedditContent from './RedditContent'
import {handleJsonErrors} from '../helper'
import type {JSONResponse} from '../interfaces'

const api_type = 'json'

/**
 * A set of mixin functions that apply to Submissions, Comments, and PrivateMessages
 */
class ReplyableContent<T extends ReplyableContent = ReplyableContent<any>> extends RedditContent<T> {
  static _name = 'ReplyableContent'

  /**
   * @summary Approves this Comment, Submission, or PrivateMessage, re-adding it to public listings if it had been removed
   * @returns A Promise that fulfills with this content when the request is complete
   * @example r.getComment('c08pp5z').approve()
   */
  async approve () {
    await this._post({url: 'api/approve', form: {id: this.name}})
    return this
  }

  /**
   * @summary Blocks the author of this content.
   * @desc **Note:** In order for this function to have an effect, this item **must** be in the authenticated account's inbox or
   * modmail somewhere. The reddit API gives no outward indication of whether this condition is satisfied, so the returned Promise
   * will fulfill even if this is not the case.
   * @returns A Promise that fulfills with this message after the request is complete
   * @example
   *
   * r.getInbox({limit: 1}).then(messages =>
   *   messages[0].blockAuthor();
   * );
   */
  async blockAuthor () {
    await this._post({url: 'api/block', form: {id: this.name}})
    return this
  }

  /**
   * @summary Ignores reports on this Comment, Submission, or PrivateMessage
   * @returns A Promise that fulfills with this content when the request is complete
   * @example r.getComment('c08pp5z').ignoreReports()
   */
  async ignoreReports () {
    await this._post({url: 'api/ignore_reports', form: {id: this.name}})
    return this
  }

  /**
   * @summary Removes this Comment, Submission or PrivateMessage from listings.
   * @desc This requires the authenticated user to be a moderator of the subreddit with the `posts` permission.
   * @param {boolean} [options.spam=false] Determines whether this should be marked as spam
   * @returns A Promise that fulfills with this content when the request is complete
   * @example r.getComment('c08pp5z').remove({spam: true})
   */
  async remove (spam = false) {
    await this._post({url: 'api/remove', form: {spam, id: this.name}})
    return this
  }

  /**
   * @summary Submits a new reply to this object. (This takes the form of a new Comment if this object is a Submission/Comment,
   * or a new PrivateMessage if this object is a PrivateMessage.)
   * @param text The content of the reply, in raw markdown text
   * @returns A Promise that fulfills with the newly-created reply
   * @example r.getSubmission('4e60m3').reply('This was an interesting post. Thanks.');
   */
  async reply (text: string) {
    const res: JSONResponse<ReplyableContent<T>> = await this._post({
      url: 'api/comment',
      form: {api_type, text, thing_id: this.name}
    })
    handleJsonErrors(res)
    return res.json.data!.things[0]
  }

  /**
   * @summary Reports this content anonymously to subreddit moderators (for Comments and Submissions)
   * or to the reddit admins (for PrivateMessages)
   * @param {string} [reason] The reason for the report
   * @returns A Promise that fulfills with this content when the request is complete
   * @example r.getComment('c08pp5z').report({reason: 'Breaking the subreddit rules'})
   */
  async report (reason?: string) {
    await this._post({url: 'api/report', form: {
      api_type, reason: 'other', other_reason: reason, thing_id: this.name
    }})
    return this
  }

  /**
   * @summary Unignores reports on this Comment, Submission, or PrivateMessages
   * @returns A Promise that fulfills with this content when the request is complete
   * @example r.getComment('c08pp5z').unignoreReports()
   */
  async unignoreReports () {
    await this._post({url: 'api/unignore_reports', form: {id: this.name}})
    return this
  }
}

export default ReplyableContent
