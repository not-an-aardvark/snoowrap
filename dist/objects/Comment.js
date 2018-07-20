'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _helpers = require('../helpers.js');

var _Listing = require('./Listing.js');

var _Listing2 = _interopRequireDefault(_Listing);

var _More = require('./More.js');

var _VoteableContent = require('./VoteableContent.js');

var _VoteableContent2 = _interopRequireDefault(_VoteableContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* A class representing a reddit comment
* <style> #Comment {display: none} </style>
* @example
*
* // Get a comment with the given ID
* r.getComment('c0hkuyq')
*
* @extends VoteableContent
*/
var Comment = class Comment extends _VoteableContent2.default {
  constructor(options, _r, _hasFetched) {
    super(options, _r, _hasFetched);
    if (_hasFetched) {
      /* If a comment is in a deep comment chain, reddit will send a single `more` object with name `t1__` in place of the
      comment's replies. This is the equivalent of seeing a 'Continue this thread' link on the HTML site, and it indicates that
      replies should be fetched by sending another request to view the deep comment alone, and parsing the replies from that. */
      if (this.replies instanceof _Listing2.default && !this.replies.length && this.replies._more && this.replies._more.name === 't1__') {
        this.replies = (0, _helpers.getEmptyRepliesListing)(this);
      } else if (this.replies === '') {
        /* If a comment has no replies, reddit returns an empty string as its `replies` property rather than an empty Listing.
        This behavior is unexpected, so replace the empty string with an empty Listing. */
        this.replies = this._r._newObject('Listing', { children: [], _more: _More.emptyChildren, _isCommentList: true });
      } else if (this.replies._more && !this.replies._more.link_id) {
        this.replies._more.link_id = this.link_id;
      }
    }
  }
  _transformApiResponse(response) {
    return (0, _helpers.addEmptyRepliesListing)(response[0]);
  }
  get _uri() {
    return 'api/info?id=' + this.name;
  }
};

exports.default = Comment;