'use strict';
const helpers = require('../helpers');

/**
* A class representing a private message or a modmail.
* @extends ReplyableContent
*/
const PrivateMessage = class extends require('./ReplyableContent') {
  get _uri () {
    return `message/messages/${this.name.slice(3)}`;
  }
  _transform_api_response (response_obj) {
    response_obj[0].replies = helpers._build_replies_tree(response_obj[0].replies);
    return helpers.find_message_in_tree(this.name, response_obj[0]);
  }
  // TODO: Get rid of the repeated code here, most of these methods are exactly the same with the exception of the URIs
  /**
  * @summary Blocks the author of this private message.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  */
  block_author () {
    return this._post({uri: 'api/block', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Marks this message as read.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  */
  mark_as_read () {
    return this._post({uri: 'api/read_message', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Marks this message as unread.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  */
  mark_as_unread () {
    return this._post({uri: 'api/unread_message', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Mutes the author of this message for 72 hours. This should only be used on moderator mail.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  */
  mute_author () {
    return this._post({uri: 'api/mute_message_author', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Unmutes the author of this message.
  * @returns {Promise} A Promise that fulfills with this message after the request is complete
  */
  unmute_author () {
    return this._post({uri: 'api/unmute_message_author', form: {id: this.name}}).return(this);
  }
};

module.exports = PrivateMessage;
