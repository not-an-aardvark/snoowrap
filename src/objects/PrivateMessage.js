import {buildRepliesTree, findMessageInTree} from '../helpers.js';
import ReplyableContent from './ReplyableContent.js';

/**
* A class representing a private message or a modmail.
* <style> #PrivateMessage {display: none} </style>
* @example
*
* // Get a Private Message with a given ID
* r.getMessage('51shnw')
* @extends ReplyableContent
*/
const PrivateMessage = class PrivateMessage extends ReplyableContent {
  get _uri () {
    return `message/messages/${this.name.slice(3)}`;
  }
  _transformApiResponse (response) {
    response[0].replies = buildRepliesTree(response[0].replies || []);
    return findMessageInTree(this.name, response[0]);
  }
  // TODO: Get rid of the repeated code here, most of these methods are exactly the same with the exception of the URIs
  /**
  * @summary Marks this message as read.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  * @example r.getMessage('51shxv').markAsRead()
  */
  markAsRead () {
    return this._r.markMessagesAsRead([this]).return(this);
  }
  /**
  * @summary Marks this message as unread.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  * @example r.getMessage('51shxv').markAsUnread()
  */
  markAsUnread () {
    return this._r.markMessagesAsUnread([this]).return(this);
  }
  /**
  * @summary Mutes the author of this message for 72 hours. This can only be used on moderator mail.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  * @example r.getMessage('51shxv').muteAuthor()
  */
  muteAuthor () {
    return this._post({uri: 'api/mute_message_author', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Unmutes the author of this message.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  * @example r.getMessage('51shxv').unmuteAuthor()
  */
  unmuteAuthor () {
    return this._post({uri: 'api/unmute_message_author', form: {id: this.name}}).return(this);
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
  deleteFromInbox () {
    return this._post({uri: 'api/del_msg', form: {id: this.name}}).return(this);
  }
};

export default PrivateMessage;
