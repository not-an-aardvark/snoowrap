'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _helpers = require('../helpers.js');

var _ReplyableContent = require('./ReplyableContent.js');

var _ReplyableContent2 = _interopRequireDefault(_ReplyableContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* A class representing a private message or a modmail.
* <style> #PrivateMessage {display: none} </style>
* @example
*
* // Get a Private Message with a given ID
* r.getMessage('51shnw')
* @extends ReplyableContent
*/
var PrivateMessage = class PrivateMessage extends _ReplyableContent2.default {
  get _uri() {
    return 'message/messages/' + this.name.slice(3);
  }
  _transformApiResponse(response) {
    response[0].replies = (0, _helpers.buildRepliesTree)(response[0].replies || []);
    return (0, _helpers.findMessageInTree)(this.name, response[0]);
  }
  // TODO: Get rid of the repeated code here, most of these methods are exactly the same with the exception of the URIs
  /**
  * @summary Marks this message as read.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  * @example r.getMessage('51shxv').markAsRead()
  */
  markAsRead() {
    return this._r.markMessagesAsRead([this]).return(this);
  }
  /**
  * @summary Marks this message as unread.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  * @example r.getMessage('51shxv').markAsUnread()
  */
  markAsUnread() {
    return this._r.markMessagesAsUnread([this]).return(this);
  }
  /**
  * @summary Mutes the author of this message for 72 hours. This can only be used on moderator mail.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  * @example r.getMessage('51shxv').muteAuthor()
  */
  muteAuthor() {
    return this._post({ uri: 'api/mute_message_author', form: { id: this.name } }).return(this);
  }
  /**
  * @summary Unmutes the author of this message.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  * @example r.getMessage('51shxv').unmuteAuthor()
  */
  unmuteAuthor() {
    return this._post({ uri: 'api/unmute_message_author', form: { id: this.name } }).return(this);
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
  deleteFromInbox() {
    return this._post({ uri: 'api/del_msg', form: { id: this.name } }).return(this);
  }
};

exports.default = PrivateMessage;