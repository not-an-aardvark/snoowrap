'use strict';
const helpers = require('../helpers');
/**
* A class representing a reddit comment
* @example
*
* // Get a comment with the given ID
* r.get_comment('c0hkuyq')
* @extends VoteableContent
*/
const Comment = class extends require('./VoteableContent') {
  _transform_api_response (response_obj) {
    return response_obj[0].replies ? response_obj[0] : helpers._add_empty_replies_listing(response_obj[0]);
  }
  get _uri () {
    return `api/info?id=${this.name}`;
  }
};

module.exports = Comment;
