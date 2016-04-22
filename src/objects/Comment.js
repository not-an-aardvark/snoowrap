'use strict';
const helpers = require('../helpers');
const Listing = require('./Listing');
const More = require('./More');
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
    if (_has_fetched) {
      /* If a comment is in a deep comment chain, reddit will send a single `more` object with name `t1__` in place of the
      comment's replies. This is the equivalent of seeing a 'Continue this thread' link on the HTML site, and it indicates that
      replies should be fetched by sending another request to view the deep comment alone, and parsing the replies from that. */
      if (this.replies instanceof Listing && !this.replies.length && this.replies._more && this.replies._more.name === 't1__') {
        this.replies = helpers._get_empty_replies_listing(this);
      } else if (this.replies === '') {
        /* If a comment has no replies, reddit returns an empty string as its `replies` property rather than an empty Listing.
        This behavior is unexpected, so replace the empty string with an empty Listing. */
        this.replies = this._r._new_object('Listing', {children: [], _more: More.empty_children(), _is_comment_list: true});
      } else if (this.replies._more && !this.replies._more.link_id) {
        this.replies._more.link_id = this.link_id;
      }
    }
  }
  _transform_api_response (response_obj) {
    return helpers._add_empty_replies_listing(response_obj[0]);
  }
  get _uri () {
    return `api/info?id=${this.name}`;
  }
};

module.exports = Comment;
