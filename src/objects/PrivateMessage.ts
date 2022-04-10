import {buildRepliesTree, findMessageInTree} from '../helper'
import ReplyableContent from './ReplyableContent'
import type Listing from './Listing'
import type RedditUser from './RedditUser'
import type Subreddit from './Subreddit'
//

interface PrivateMessage {
  author: RedditUser
  body_html: string
  body: string
  context: string
  dest: string
  distinguished: string | null
  first_message_name: string
  first_message: number
  likes: any // ?
  new: boolean
  num_comments: number
  parent_id: string
  replies: Listing<PrivateMessage>
  score: number
  subject: string
  subreddit_name_prefixed: string
  subreddit: Subreddit
  was_comment: boolean
}

/**
 * A class representing a private message or a modmail.
 * @example
 *
 * // Get a Private Message with a given ID
 * r.getMessage('51shnw')
 */
class PrivateMessage extends ReplyableContent<PrivateMessage> {
  static _name = 'PrivateMessage'

  get _uri () {
    return `message/messages/${this.name.slice(3)}`
  }
  _transformApiResponse (response: any) {
    response[0].replies = buildRepliesTree(response[0].replies || [])
    return findMessageInTree(this.name, response[0])
  }
  // TODO: Get rid of the repeated code here, most of these methods are exactly the same with the exception of the URIs
  /**
   * @summary Marks this message as read.
   * @returns {Promise} A Promise that fulfills with this message after the request is complete
   * @example r.getMessage('51shxv').markAsRead()
   */
  async markAsRead () {
    await this._r.markMessagesAsRead([this])
    return this
  }
  /**
   * @summary Marks this message as unread.
   * @returns {Promise} A Promise that fulfills with this message after the request is complete
   * @example r.getMessage('51shxv').markAsUnread()
   */
  async markAsUnread () {
    await this._r.markMessagesAsUnread([this])
    return this
  }
  /**
   * @summary Mutes the author of this message for 72 hours. This can only be used on moderator mail.
   * @returns {Promise} A Promise that fulfills with this message after the request is complete
   * @example r.getMessage('51shxv').muteAuthor()
   */
  async muteAuthor () {
    await this._post({url: 'api/mute_message_author', form: {id: this.name}})
    return this
  }
  /**
   * @summary Unmutes the author of this message.
   * @returns {Promise} A Promise that fulfills with this message after the request is complete
   * @example r.getMessage('51shxv').unmuteAuthor()
   */
  async unmuteAuthor () {
    await this._post({url: 'api/unmute_message_author', form: {id: this.name}})
    return this
  }
  /**
   * @summary Deletes this message from the authenticated user's inbox.
   * @desc This only removes the item from the authenticated user's inbox. It has no effect on how the item looks to the sender.
   * @returns {Promise} A Promise that fulfills with this message when the request is complete.
   * @example
   *
   * const firstMessage = r.getInbox().get(0);
   * firstMessage.deleteFromInbox();
   */
  async deleteFromInbox () {
    await this._post({url: 'api/del_msg', form: {id: this.name}})
    return this
  }
}

export default PrivateMessage
