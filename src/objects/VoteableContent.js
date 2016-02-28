'use strict';
const promise_wrap = require('promise-chains');
const helpers = require('../helpers.js');
const api_type = 'json';

/**
* A set of mixin functions that apply to Submissions and Comments.
* @extends ReplyableContent
*/
const VoteableContent = class extends require('./ReplyableContent') {
  /**
  * @summary Casts a vote on this Comment or Submission.
  * @private
  * @param {number} direction The direction of the vote. (1 for an upvote, -1 for a downvote, 0 to remove a vote)
  * @returns {Promise} A Promise that fulfills when the request is complete.
  */
  _vote (direction) {
    return this._post({uri: 'api/vote', form: {dir: direction, id: this.name}});
  }
  /**
  * @summary Upvotes this Comment or Submission.
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @desc **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK,
  but bots deciding how to vote on content or amplifying a human's vote are not. See the
  [reddit rules](https://reddit.com/rules) for more details on what constitutes vote cheating. (This guideline is quoted from
  [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
  */
  upvote () {
    return this._vote(1);
  }
  /**
  * @summary Downvotes this Comment or Submission.
  * @returns {Promise} A Promise that fulfills when the request is complete.
  * @desc **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK, but
  bots deciding how to vote on content or amplifying a human's vote are not. See the [reddit rules](https://reddit.com/rules)
  for more details on what constitutes vote cheating. (This guideline is quoted from
  [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
  */
  downvote () {
    return this._vote(-1);
  }
  /**
  * @summary Removes any existing vote on this Comment or Submission.
  * @returns {Promise} A Promise that fulfills when the request is complete.
  * @desc **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK, but
  bots deciding how to vote on content or amplifying a human's vote are not. See the [reddit rules](https://reddit.com/rules)
  for more details on what constitutes vote cheating. (This guideline is quoted from
  [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
  */
  unvote () {
    return this._vote(0);
  }
  /**
  * @summary Saves this Comment or Submission (i.e. adds it to the list at reddit.com/saved)
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  save () {
    return promise_wrap(this._post({uri: 'api/save', form: {id: this.name}}).then(() => {
      this.saved = true;
      return this;
    }));
  }
  /**
  * @summary Unsaves this item
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  unsave () {
    return promise_wrap(this._post({uri: 'api/unsave', form: {id: this.name}}).then(() => {
      this.saved = false;
      return this;
    }));
  }
  /**
  * @summary Distinguishes this Comment or Submission with a sigil.
  * @param {boolean|string} [$0.status=true] Determines how the item should be distinguished.
  `true` (default) signifies that the item should be moderator-distinguished, and
  `false` signifies that the item should not be distinguished. Passing a string (e.g.
  `admin`) will cause the item to get distinguished with that string, if possible.
  * @param {boolean} [$0.sticky=false] Determines whether this item should be stickied in addition to being
  distinguished. (This only applies to comments; to sticky a submission, use the {@link objects.Submission.sticky} method.)
  * @returns {Promise} A Promise that fulfills when the request is complete.
  */
  distinguish ({status = true, sticky = false} = {}) {
    return promise_wrap(this._post({uri: 'api/distinguish', form: {
      api_type,
      how: status === true ? 'yes' : status === false ? 'no' : status,
      sticky,
      id: this.name
    }}).then(response => {
      this._fetch = response.json.data.things[0];
      return this;
    }));
  }
  /**
  * @summary Undistinguishes this Comment or Submission. Alias for distinguish({status: false})
  * @returns {Promise} A Promise that fulfills when the request is complete.
  */
  undistinguish () {
    return this.distinguish({status: false, sticky: false});
  }
  /**
  * @summary Edits this Comment or Submission.
  * @param {string} updated_text The updated markdown text to use
  * @returns {Promise} A Promise that fulfills when this request is complete.
  */
  edit (updated_text) {
    return promise_wrap(this._post({
      uri: 'api/editusertext',
      form: {api_type, text: updated_text, thing_id: this.name}
    }).tap(helpers._handle_json_errors).then(response => {
      this._fetch = Promise.resolve(response.json.data.things[0]);
      return this;
    }));
  }
  /**
  * @summary Gives reddit gold to the author of this Comment or Submission.
  * @returns {Promise} A Promise that fullfills with this Comment/Submission when this request is complete
  */
  gild () {
    return promise_wrap(this._post({uri: `api/v1/gold/gild/${this.name}`}).return(this));
  }
  /**
  * @summary Deletes this Comment or Submission
  * @returns {Promise} A Promise that fulfills with this Comment/Submission when this request is complete
  */
  delete () {
    return promise_wrap(this._post({uri: 'api/del', form: {id: this.name}}).return(this));
  }
  _set_inbox_replies_enabled (state) {
    return this._post({uri: 'api/sendreplies', form: {state, id: this.name}});
  }
  /**
  * @summary Enables inbox replies on this Comment or Submission
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  enable_inbox_replies () {
    return promise_wrap(this._set_inbox_replies_enabled(true).return(this));
  }
  /**
  * @summary Disables inbox replies on this Comment or Submission
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  disable_inbox_replies () {
    return promise_wrap(this._set_inbox_replies_enabled(false).return(this));
  }
};

module.exports = VoteableContent;
