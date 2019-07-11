import {addEmptyRepliesListing, getEmptyRepliesListing} from '../helpers.js';
import Listing from './Listing.js';
import {emptyChildren as emptyMoreObject} from './More.js';
import VoteableContent from './VoteableContent.js';
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
const Comment = class Comment extends VoteableContent {
  constructor (options, _r, _hasFetched) {
    super(options, _r, _hasFetched);
    if (_hasFetched) {
      /* If a comment is in a deep comment chain, reddit will send a single `more` object with name `t1__` in place of the
      comment's replies. This is the equivalent of seeing a 'Continue this thread' link on the HTML site, and it indicates that
      replies should be fetched by sending another request to view the deep comment alone, and parsing the replies from that. */
      if (this.replies instanceof Listing && !this.replies.length && this.replies._more && this.replies._more.name === 't1__') {
        this.replies = getEmptyRepliesListing(this);
      } else if (this.replies === '') {
        /* If a comment has no replies, reddit returns an empty string as its `replies` property rather than an empty Listing.
        This behavior is unexpected, so replace the empty string with an empty Listing. */
        this.replies = this._r._newObject('Listing', {children: [], _more: emptyMoreObject, _isCommentList: true});
      } else if (this.replies._more && !this.replies._more.link_id) {
        this.replies._more.link_id = this.link_id;
      }
    }
  }
  _transformApiResponse (response) {
    return addEmptyRepliesListing(response[0]);
  }
  get _uri () {
    return `api/info?id=${this.name}`;
  }
  /**
  * @summary Locks this Comment, preventing new comments from being posted on it.
  * @returns {Promise} The updated version of this Comment
  * @example r.getComment('d1xclfo').lock()
  */
  lock () {
    return this._post({uri: 'api/lock', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Unlocks this Comment, allowing comments to be posted on it again.
  * @returns {Promise} The updated version of this Comment
  * @example r.getComment('d1xclfo').unlock()
  */
  unlock () {
    return this._post({uri: 'api/unlock', form: {id: this.name}}).return(this);
  }
};

export default Comment;
