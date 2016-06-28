import {build_replies_tree, find_message_in_tree} from '../helpers.js';
import ReplyableContent from './ReplyableContent.js';

/**
* A class representing a private message or a modmail.
* <style> #PrivateMessage {display: none} </style>
* @example
*
* // Get a Private Message with a given ID
* r.get_message('51shnw')
* @extends ReplyableContent
*/
const PrivateMessage = class PrivateMessage extends ReplyableContent {
  get _uri () {
    return `message/messages/${this.name.slice(3)}`;
  }
  _transform_api_response (response_obj) {
    response_obj[0].replies = build_replies_tree(response_obj[0].replies);
    return find_message_in_tree(this.name, response_obj[0]);
  }
  // TODO: Get rid of the repeated code here, most of these methods are exactly the same with the exception of the URIs
  /**
  * @summary Marks this message as read.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  * @example r.get_message('51shxv').mark_as_read()
  */
  mark_as_read () {
    return this._r.mark_messages_as_read([this]).return(this);
  }
  /**
  * @summary Marks this message as unread.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  * @example r.get_message('51shxv').mark_as_unread()
  */
  mark_as_unread () {
    return this._r.mark_messages_as_unread([this]).return(this);
  }
  /**
  * @summary Mutes the author of this message for 72 hours. This can only be used on moderator mail.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  * @example r.get_message('51shxv').mute_author()
  */
  mute_author () {
    return this._post({uri: 'api/mute_message_author', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Unmutes the author of this message.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  * @example r.get_message('51shxv').unmute_author()
  */
  unmute_author () {
    return this._post({uri: 'api/unmute_message_author', form: {id: this.name}}).return(this);
  }
};

export default PrivateMessage;
