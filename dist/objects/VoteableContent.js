'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Promise = require('../Promise.js');

var _Promise2 = _interopRequireDefault(_Promise);

var _helpers = require('../helpers.js');

var _ReplyableContent = require('./ReplyableContent.js');

var _ReplyableContent2 = _interopRequireDefault(_ReplyableContent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var api_type = 'json';

/**
* A set of mixin functions that apply to Submissions and Comments.
* <style> #VoteableContent {display: none} </style>
* @extends ReplyableContent
*/
var VoteableContent = class VoteableContent extends _ReplyableContent2.default {
  /**
  * @summary Casts a vote on this Comment or Submission.
  * @private
  * @param {number} direction The direction of the vote. (1 for an upvote, -1 for a downvote, 0 to remove a vote)
  * @returns {Promise} A Promise that fulfills when the request is complete.
  */
  _vote(direction) {
    return this._post({ uri: 'api/vote', form: { dir: direction, id: this.name } }).return(this);
  }
  /**
  * @summary Upvotes this Comment or Submission.
  * @returns {Promise} A Promise that fulfills with this Comment/Submission when the request is complete
  * @desc **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK,
  but bots deciding how to vote on content or amplifying a human's vote are not. See the
  [reddit rules](https://reddit.com/rules) for more details on what constitutes vote cheating. (This guideline is quoted from
  [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
  * @example r.getSubmission('4e62ml').upvote()
  */
  upvote() {
    return this._vote(1);
  }
  /**
  * @summary Downvotes this Comment or Submission.
  * @returns {Promise} A Promise that fulfills with this Comment/Submission when the request is complete.
  * @desc **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK, but
  bots deciding how to vote on content or amplifying a human's vote are not. See the [reddit rules](https://reddit.com/rules)
  for more details on what constitutes vote cheating. (This guideline is quoted from
  [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
  * @example r.getSubmission('4e62ml').downvote()
  */
  downvote() {
    return this._vote(-1);
  }
  /**
  * @summary Removes any existing vote on this Comment or Submission.
  * @returns {Promise} A Promise that fulfills with this Comment/Submission when the request is complete.
  * @desc **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK, but
  bots deciding how to vote on content or amplifying a human's vote are not. See the [reddit rules](https://reddit.com/rules)
  for more details on what constitutes vote cheating. (This guideline is quoted from
  [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
  * @example r.getSubmission('4e62ml').unvote()
  */
  unvote() {
    return this._vote(0);
  }
  /**
  * @summary Saves this Comment or Submission (i.e. adds it to the list at reddit.com/saved)
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example r.getSubmission('4e62ml').save()
  */
  save() {
    return this._post({ uri: 'api/save', form: { id: this.name } }).return(this);
  }
  /**
  * @summary Unsaves this item
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example r.getSubmission('4e62ml').unsave()
  */
  unsave() {
    return this._post({ uri: 'api/unsave', form: { id: this.name } }).return(this);
  }
  /**
  * @summary Distinguishes this Comment or Submission with a sigil.
  * @desc **Note:** This function will only work if the requester is the author of this Comment/Submission.
  * @param {object} options
  * @param {boolean|string} [options.status=true] Determines how the item should be distinguished.
  `true` (default) signifies that the item should be moderator-distinguished, and
  `false` signifies that the item should not be distinguished. Passing a string (e.g.
  `admin`) will cause the item to get distinguished with that string, if possible.
  * @param {boolean} [options.sticky=false] Determines whether this item should be stickied in addition to being
  distinguished. (This only applies to comments; to sticky a submission, use {@link Submission#sticky} instead.)
  * @returns {Promise} A Promise that fulfills when the request is complete.
  * @example r.getComment('d1xclfo').distinguish({status: true, sticky: true})
  */
  distinguish() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$status = _ref.status,
        status = _ref$status === undefined ? true : _ref$status,
        _ref$sticky = _ref.sticky,
        sticky = _ref$sticky === undefined ? false : _ref$sticky;

    return this._post({ uri: 'api/distinguish', form: {
        api_type,
        how: status === true ? 'yes' : status === false ? 'no' : status,
        sticky,
        id: this.name
      } }).return(this);
  }
  /**
  * @summary Undistinguishes this Comment or Submission. Alias for distinguish({status: false})
  * @returns {Promise} A Promise that fulfills when the request is complete.
  * @example r.getSubmission('4e62ml').undistinguish()
  */
  undistinguish() {
    return this.distinguish({ status: false, sticky: false }).return(this);
  }
  /**
  * @summary Edits this Comment or Submission.
  * @param {string} updatedText The updated markdown text to use
  * @returns {Promise} A Promise that fulfills when this request is complete.
  * @example r.getComment('coip909').edit('Blah blah blah this is new updated text')
  */
  edit(updatedText) {
    return this._post({
      uri: 'api/editusertext',
      form: { api_type, text: updatedText, thing_id: this.name }
    }).tap((0, _helpers.handleJsonErrors)(this));
  }
  /**
  * @summary Gives reddit gold to the author of this Comment or Submission.
  * @returns {Promise} A Promise that fullfills with this Comment/Submission when this request is complete
  * @example r.getComment('coip909').gild()
  */
  gild() {
    return this._post({ uri: 'api/v1/gold/gild/' + this.name }).return(this);
  }
  _setInboxRepliesEnabled(state) {
    return this._post({ uri: 'api/sendreplies', form: { state, id: this.name } });
  }
  /**
  * @summary Enables inbox replies on this Comment or Submission
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  * @example r.getComment('coip909').enableInboxReplies()
  */
  enableInboxReplies() {
    return this._setInboxRepliesEnabled(true).return(this);
  }
  /**
  * @summary Disables inbox replies on this Comment or Submission
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  * @example r.getComment('coip909').disableInboxReplies()
  */
  disableInboxReplies() {
    return this._setInboxRepliesEnabled(false).return(this);
  }
  _mutateAndExpandReplies(_ref2) {
    var _this = this;

    var limit = _ref2.limit,
        depth = _ref2.depth;

    if (depth <= 0) {
      return _Promise2.default.resolve(this);
    }
    var repliesKey = this.constructor._name === 'Submission' ? 'comments' : 'replies';
    return this[repliesKey].fetchMore({ amount: limit - this[repliesKey].length }).tap(function (replies) {
      _this[repliesKey] = replies;
    }).then(function (replies) {
      return replies.slice(0, limit);
    }).map(function (reply) {
      return reply._mutateAndExpandReplies({ limit, depth: depth - 1 });
    }).return(this);
  }
  /**
  * @summary Expands the reply Listings on this Comment/Submission.
  * @desc This is useful in cases where one wants to enumerate all comments on a
  thread, even the ones that are initially hidden when viewing it (e.g. long comment chains).
  *
  * This function accepts two optional parameters `options.limit` and `options.depth`. `options.limit` sets an upper bound
  for the branching factor of the resulting replies tree, i.e. the number of comments that are fetched in reply to any given
  item. `options.depth` sets an upper bound for the depth of the resulting replies tree (where a depth of 0 signifies that no
  replies should be fetched at all).
  *
  * Note that regardless of the `limit` and `depth` parameters used, any reply that appeared in the original reply tree will
  appear in the expanded reply tree. In certain cases, the depth of the resulting tree may also be larger than `options.depth`,
  if the reddit API returns more of a comment tree than needed.
  *
  * These parameters should primarily be used to keep the request count low; if a precise limit and depth are needed, it is
  recommended to manually verify the comments in the tree afterwards.
  *
  * Both parameters default to `Infinity` if omitted, i.e. the resulting tree contains every single comment available. It should
  be noted that depending on the size and depth of the thread, fetching every single comment can use up a significant number
  of ratelimited requests. (To give an intuitive estimate, consider how many clicks would be needed to view all the
  comments on the thread using the HTML site.)
  * @param {object} [options={}]
  * @param {number} [options.limit=Infinity] An upper-bound for the branching factor of the resulting tree of replies
  * @param {number} [options.depth=Infinity] An upper-bound for the depth of the resulting tree of replies
  * @returns {Promise} A Promise that fulfills with a new version of this object that has an expanded reply tree. The original
  object is not modified
  * @example r.getSubmission('4fuq26').expandReplies().then(console.log)
  * // => (a very large comment tree containing every viewable comment on this thread)
  */
  expandReplies() {
    var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref3$limit = _ref3.limit,
        limit = _ref3$limit === undefined ? Infinity : _ref3$limit,
        _ref3$depth = _ref3.depth,
        depth = _ref3$depth === undefined ? Infinity : _ref3$depth;

    return this._r._promiseWrap(this.fetch().then(function (result) {
      return result._clone({ deep: true })._mutateAndExpandReplies({ limit, depth });
    }));
  }
};

// VoteableContent#delete is not in the class body since Safari 9 can't parse the `delete` function name in class bodies.
/**
* @function
* @name delete
* @summary Deletes this Comment or Submission
* @returns {Promise} A Promise that fulfills with this Comment/Submission when this request is complete
* @example r.getComment('coip909').delete()
* @memberof VoteableContent
* @instance
*/
Object.defineProperty(VoteableContent.prototype, 'delete', { value() {
    return this._post({ uri: 'api/del', form: { id: this.name } }).return(this);
  }, configurable: true, writable: true });

exports.default = VoteableContent;