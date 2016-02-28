'use strict';
const promise_wrap = require('promise-chains');
const helpers = require('../helpers');
const api_type = 'json';

/**
* A set of mixin functions that apply to Submissions, Comments, and PrivateMessages
* @extends RedditContent
*/
const ReplyableContent = class extends require('./RedditContent') {
  /**
  * @summary Removes this Comment, Submission or PrivateMessage from public listings.
  * @desc This requires the authenticated user to be a moderator of the subreddit with the `posts` permission.
  * @param {object} $0
  * @param {boolean} [$0.spam=false] Determines whether this should be marked as spam
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  remove ({spam = false} = {}) {
    return promise_wrap(this._post({uri: 'api/remove', form: {spam, id: this.name}}).return(this));
  }
  /**
  * @summary Removes this Comment, Submission, or PrivateMessage and marks it as spam.
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  mark_as_spam () {
    return promise_wrap(this.remove({spam: true, id: this.name}).return(this));
  }
  /**
  * @summary Approves this Comment, Submission, or PrivateMessage, re-adding it to public listings if it had been removed
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  approve () {
    return promise_wrap(this._post({uri: 'api/approve', form: {id: this.name}}).return(this));
  }
  /**
  * @summary Reports this content anonymously to subreddit moderators (for Comments and Submissions)
  or to the reddit admins (for PrivateMessages)
  * @param {string} [$0.reason] The reason for the report
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  report ({reason} = {}) {
    return promise_wrap(this._post({uri: 'api/report', form: {
      api_type, reason: 'other', other_reason: reason, thing_id: this.name
    }}).return(this));
  }
  /**
  * @summary Ignores reports on this Comment, Submission, or PrivateMessage
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  ignore_reports () {
    return promise_wrap(this._post({uri: 'api/ignore_reports', form: {id: this.name}}).return(this));
  }
  /**
  * @summary Unignores reports on this Comment, Submission, or PrivateMessages
  * @returns {Promise} A Promise that fulfills with this content when the request is complete
  */
  unignore_reports () {
    return promise_wrap(this._post({uri: 'api/unignore_reports', form: {id: this.name}}).return(this));
  }
  /**
  * @summary Submits a new reply to this object. (This takes the form of a new Comment if this object is a Submission/Comment,
  or a new PrivateMessage if this object is a PrivateMessage.)
  * @param {string} text The content of the reply, in raw markdown text
  * @returns {Promise} A Promise that fulfills with the newly-created reply
  */
  reply (text) {
    return promise_wrap(this._post({
      uri: 'api/comment',
      form: {api_type, text, thing_id: this.name}
    }).tap(helpers._handle_json_errors)).json.data.things[0];
  }
};

module.exports = ReplyableContent;
