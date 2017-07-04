import {getEmptyRepliesListing} from '../helpers.js';
import VoteableContent from './VoteableContent.js';

const api_type = 'json';

/**
* A class representing a reddit submission
* <style> #Submission {display: none} </style>
* @extends VoteableContent
* @example
*
* // Get a submission by ID
* r.getSubmission('2np694')
*/
const Submission = class Submission extends VoteableContent {
  constructor (data, _r, _hasFetched) {
    super(data, _r, _hasFetched);
    if (_hasFetched) {
      this.comments = this.comments || getEmptyRepliesListing(this);
    }
  }
  get _uri () {
    return `comments/${this.name.slice(3)}`;
  }
  /**
  * @summary Hides this Submission, preventing it from appearing on most Listings.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').hide()
  */
  hide () {
    return this._post({uri: 'api/hide', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Unhides this Submission, allowing it to reappear on most Listings.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').unhide()
  */
  unhide () {
    return this._post({uri: 'api/unhide', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Locks this Submission, preventing new comments from being posted on it.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').lock()
  */
  lock () {
    return this._post({uri: 'api/lock', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Unlocks this Submission, allowing comments to be posted on it again.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').unlock()
  */
  unlock () {
    return this._post({uri: 'api/unlock', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Marks this Submission as NSFW (Not Safe For Work).
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').markNsfw()
  */
  markNsfw () {
    return this._post({uri: 'api/marknsfw', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Unmarks this Submission as NSFW (Not Safe For Work).
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').unmarkNsfw()
  */
  unmarkNsfw () {
    return this._post({uri: 'api/unmarknsfw', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Mark a submission as a spoiler
  * @desc **Note:** This will silently fail if the subreddit has disabled spoilers.
  * @returns {Promise} A Promise that fulfills with this Submission when the request is complete
  * @example r.getSubmission('2np694').markSpoiler()
  */
  markSpoiler () {
    return this._post({uri: 'api/spoiler', form: {id: this.name}}).return(this);
  }

  /**
  * @summary Unmark a submission as a spoiler
  * @returns {Promise} A Promise that fulfills with this Submission when the request is complete
  * @example r.getSubmission('2np694').unmarkSpoiler()
  */
  unmarkSpoiler () {
    return this._post({uri: 'api/unspoiler', form: {id: this.name}}).return(this);
  }

  /**
  * @summary Sets the contest mode status of this submission.
  * @private
  * @param {boolean} state The desired contest mode status
  * @returns {Promise} The updated version of this Submission
  */
  _setContestModeEnabled (state) {
    return this._post({uri: 'api/set_contest_mode', form: {api_type, state, id: this.name}}).return(this);
  }
  /**
  * @summary Enables contest mode for this Submission.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').enableContestMode()
  */
  enableContestMode () {
    return this._setContestModeEnabled(true);
  }
  /**
  * @summary Disables contest mode for this Submission.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').disableContestMode()
  */
  disableContestMode () {
    return this._setContestModeEnabled(false);
  }
  _setStickied ({state, num}) {
    return this._post({uri: 'api/set_subreddit_sticky', form: {api_type, state, num, id: this.name}}).return(this);
  }
  /**
  * @summary Stickies this Submission.
  * @param {object} [options]
  * @param {number} [options.num=1] The sticky slot to put this submission in; this should be either 1 or 2.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').sticky({num: 2})
  */
  sticky ({num = 1} = {}) {
    return this._setStickied({state: true, num});
  }
  /**
  * @summary Unstickies this Submission.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').unsticky()
  */
  unsticky () {
    return this._setStickied({state: false});
  }
  /**
  * @summary Sets the suggested comment sort method on this Submission
  * @desc **Note**: To enable contest mode, use {@link Submission#enableContestMode} instead.
  * @param {string} sort The suggested sort method. This should be one of
  `confidence, top, new, controversial, old, random, qa, blank`
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').setSuggestedSort('new')
  */
  setSuggestedSort (sort) {
    return this._post({uri: 'api/set_suggested_sort', form: {api_type, id: this.name, sort}}).return(this);
  }
  /**
  * @summary Marks this submission as 'visited'.
  * @desc **Note**: This function only works if the authenticated account has a subscription to reddit gold.
  * @returns {Promise} The updated version of this Submission
  * @example r.getSubmission('2np694').markAsRead()
  */
  markAsRead () {
    return this._post({uri: 'api/store_visits', form: {links: this.name}}).return(this);
  }
  /**
  * @summary Gets a Listing of other submissions on reddit that had the same link as this one.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing of other Submission objects
  * @example r.getSubmission('2np694').getDuplicates()
  */
  getDuplicates (options = {}) {
    return this._getListing({uri: `duplicates/${this.name.slice(3)}`, qs: options});
  }
  /**
  * @summary Gets a Listing of Submissions that are related to this one.
  * @deprecated This function uses the <code>/related/submission_id</code> endpoint, which was recently changed on reddit.com;
  instead of returning a Listing containing related posts, the reddit API now simply returns the post itself. As such, this
  function only exists for backwards compatability and should not be used in practice.
  * @param {object} [options={}] ~~Options for the resulting Listing~~
  * @returns {Promise} ~~A Listing of other Submission objects~~ The submission in question.
  * @example r.getSubmission('2np694').getRelated()
  */
  getRelated (options = {}) {
    return this._getListing({uri: `related/${this.name.slice(3)}`, qs: options}).tap(result => {
      if (result.constructor._name === 'Submission') {
        this._r._warn('Submission#getRelated has been deprecated upstream, and will not work as expected.');
      }
    });
  }
  /**
  * @summary Gets a list of flair template options for this post.
  * @returns {Promise} An Array of flair templates
  * @example
  *
  * r.getSubmission('2np694').getLinkFlairTemplates().then(console.log)
  *
  * // => [
  * //   { flair_text: 'Text 1', flair_css_class: '', flair_text_editable: false, flair_template_id: '(UUID not shown)' ... },
  * //   { flair_text: 'Text 2', flair_css_class: 'aa', flair_text_editable: false, flair_template_id: '(UUID not shown)' ... },
  * //   ...
  * // ]
  */
  getLinkFlairTemplates () {
    return this.fetch().get('subreddit').then(sub => sub.getLinkFlairTemplates(this.name));
  }
  /**
  * @summary Assigns flair on this Submission (as a moderator; also see [selectFlair]{@link Submission#selectFlair})
  * @param {object} options
  * @param {string} options.text The text that this link's flair should have
  * @param {string} options.cssClass The CSS class that the link's flair should have
  * @returns {Promise} A Promise that fulfills with an updated version of this Submission
  * @example r.getSubmission('2np694').assignFlair({text: 'this is a flair text', cssClass: 'these are css classes'})
  */
  assignFlair (options) {
    return this._r._assignFlair({...options, link: this.name, subredditName: this.subreddit.display_name}).return(this);
  }

  /**
  * @summary Selects a flair for this Submission (as the OP; also see [assignFlair]{@link Submission#assignFlair})
  * @param {object} options
  * @param {string} options.flair_template_id A flair template ID to use for this Submission. (This should be obtained
  beforehand using {@link getLinkFlairTemplates}.)
  * @param {string} [options.text] The flair text to use for the submission. (This is only necessary/useful if the given flair
  template has the `text_editable` property set to `true`.)
  * @returns {Promise} A Promise that fulfills with this objects after the request is complete
  * @example r.getSubmission('2np694').selectFlair({flair_template_id: 'e3340d80-8152-11e4-a76a-22000bc1096c'})
  */
  selectFlair (options) {
    return this._r._selectFlair({...options, link: this.name, subredditName: this.subreddit.display_name}).return(this);
  }
};

export default Submission;
