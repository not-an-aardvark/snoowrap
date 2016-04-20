'use strict';
const helpers = require('../helpers');
const Listing = require('./Listing');
/**
* A class representing a reddit comment
* <style> #Comment {display: none} </style>
* @example
*
* // Get a comment with the given ID
* r.get_comment('c0hkuyq')
*
* @extends VoteableContent
*/
const Comment = class extends require('./VoteableContent') {
  constructor (options, _r, _has_fetched) {
    super(options, _r, _has_fetched);
    /* If a comment is in a deep comment chain, reddit will send a single `more` object with name `t1__` in place of the
    comment's replies. This is the equivalent of seeing a 'Continue this thread' link on the HTML site, and it indicates that
    replies should be fetched by sending another request to view the deep comment alone, and parsing the replies from that. */
    if (_has_fetched && this.replies instanceof Listing && !this.replies.length
        && this.replies._more && this.replies._more.name === 't1__') {
      this.replies = helpers._get_empty_replies_listing(this);
    }
  }
  _transform_api_response (response_obj) {
    return response_obj[0].replies ? response_obj[0] : helpers._add_empty_replies_listing(response_obj[0]);
  }
  get _uri () {
    return `api/info?id=${this.name}`;
  }
};

module.exports = Comment;
