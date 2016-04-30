import {_get_empty_replies_listing} from '../helpers';
import VoteableContent from './VoteableContent';
const api_type = 'json';

/**
* A class representing a reddit submission
* <style> #Submission {display: none} </style>
* @extends VoteableContent
* @example
*
* // Get a submission by ID
* r.get_submission('2np694')
*/
const Submission = class extends VoteableContent {
  constructor (data, _r, _has_fetched) {
    super(data, _r, _has_fetched);
    if (_has_fetched) {
      this.comments = this.comments || _get_empty_replies_listing(this);
    }
  }
  get _uri () {
    return `comments/${this.name.slice(3)}`;
  }
  /**
  * @summary Hides this Submission, preventing it from appearing on most Listings.
  * @returns {Promise} The updated version of this Submission
  * @example r.get_submission('2np694').hide()
  */
  hide () {
    return this._post({uri: 'api/hide', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Unhides this Submission, allowing it to reappear on most Listings.
  * @returns {Promise} The updated version of this Submission
  * @example r.get_submission('2np694').unhide()
  */
  unhide () {
    return this._post({uri: 'api/unhide', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Locks this Submission, preventing new comments from being posted on it.
  * @returns {Promise} The updated version of this Submission
  * @example r.get_submission('2np694').lock()
  */
  lock () {
    return this._post({uri: 'api/lock', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Unlocks this Submission, allowing comments to be posted on it again.
  * @returns {Promise} The updated version of this Submission
  * @example r.get_submission('2np694').unlock()
  */
  unlock () {
    return this._post({uri: 'api/unlock', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Marks this Submission as NSFW (Not Safe For Work).
  * @returns {Promise} The updated version of this Submission
  * @example r.get_submission('2np694').mark_nsfw()
  */
  mark_nsfw () {
    return this._post({uri: 'api/marknsfw', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Unmarks this Submission as NSFW (Not Safe For Work).
  * @returns {Promise} The updated version of this Submission
  * @example r.get_submission('2np694').unmark_nsfw()
  */
  unmark_nsfw () {
    return this._post({uri: 'api/unmarknsfw', form: {id: this.name}}).return(this);
  }
  /**
  * @summary Sets the contest mode status of this submission.
  * @private
  * @param {boolean} state The desired contest mode status
  * @returns {Promise} The updated version of this Submission
  */
  _set_contest_mode_enabled (state) {
    return this._post({
      uri: 'api/set_contest_mode',
      form: {api_type, state, id: this.name}
    }).return(this);
  }
  /**
  * @summary Enables contest mode for this Submission.
  * @returns {Promise} The updated version of this Submission
  * @example r.get_submission('2np694').enable_contest_mode()
  */
  enable_contest_mode () {
    return this._set_contest_mode_enabled(true);
  }
  /**
  * @summary Disables contest mode for this Submission.
  * @returns {Promise} The updated version of this Submission
  * @example r.get_submission('2np694').disable_contest_mode()
  */
  disable_contest_mode () {
    return this._set_contest_mode_enabled(false);
  }
  _set_stickied ({state, num}) {
    return this._post({
      uri: 'api/set_subreddit_sticky',
      form: {api_type, state, num, id: this.name}
    }).return(this);
  }
  /**
  * @summary Stickies this Submission.
  * @param {object} [options]
  * @param {number} [options.num=1] The sticky slot to put this submission in; this should be either 1 or 2.
  * @returns {Promise} The updated version of this Submission
  * @example r.get_submission('2np694').sticky({num: 2})
  */
  sticky ({num = 1} = {}) {
    return this._set_stickied({state: true, num});
  }
  /**
  * @summary Unstickies this Submission.
  * @returns {Promise} The updated version of this Submission
  * @example r.get_submission('2np694').unsticky()
  */
  unsticky () {
    return this._set_stickied({state: false});
  }
  /**
  * @summary Sets the suggested comment sort method on this Submission
  * @desc **Note**: To enable contest mode, use {@link Submission#enable_contest_mode} instead.
  * @param {string} sort The suggested sort method. This should be one of
  `confidence, top, new, controversial, old, random, qa, blank`
  * @returns {Promise} The updated version of this Submission
  * @example r.get_submission('2np694').set_suggested_sort('new')
  */
  set_suggested_sort (sort) {
    return this._post({uri: 'api/set_suggested_sort', form: {api_type, id: this.name, sort}}).return(this);
  }
  /**
  * @summary Marks this submission as 'visited'.
  * @desc **Note**: This function only works if the authenticated account has a subscription to reddit gold.
  * @returns {Promise} The updated version of this Submission
  * @example r.get_submission('2np694').mark_as_read()
  */
  mark_as_read () {
    return this._post({uri: 'api/store_visits', form: {links: this.name}}).return(this);
  }
  /**
  * @summary Gets a Listing of other submissions on reddit that had the same link as this one.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing of other Submission objects
  * @example r.get_submission('2np694').get_duplicates()
  */
  get_duplicates (options = {}) {
    return this._get_listing({uri: `duplicates/${this.name}`, qs: options});
  }
  /**
  * @summary Gets a Listing of Submissions that are related to this one.
  * @deprecated This function uses the <code>/related/submission_id</code> endpoint, which was recently changed on reddit.com;
  instead of returning a Listing containing related posts, the reddit API now simply returns the post itself. As such, this
  function only exists for backwards compatability and should not be used in practice.
  * @param {object} [options={}] ~~Options for the resulting Listing~~
  * @returns {Promise} ~~A Listing of other Submission objects~~ The submission in question.
  * @example r.get_submission('2np694').get_related()
  */
  get_related (options = {}) {
    return this._get_listing({uri: `related/${this.name.slice(3)}`, qs: options}).tap(result => {
      if (result.constructor.name === 'Submission') {
        this._r.log.warn('Submission.prototype.get_related has been deprecated upstream, and will not work as expected.');
      }
    });
  }
  /**
  * @summary Gets a list of flair template options for this post.
  * @returns {Promise} An Array of flair templates
  * @example
  *
  * r.get_submission('2np694').get_link_flair_templates().then(console.log)
  *
  * // => [
  * //   { flair_text: 'Text 1', flair_css_class: '', flair_text_editable: false, flair_template_id: '(UUID not shown)' ... },
  * //   { flair_text: 'Text 2', flair_css_class: 'aa', flair_text_editable: false, flair_template_id: '(UUID not shown)' ... },
  * //   ...
  * // ]
  */
  get_link_flair_templates () {
    return this.fetch().get('subreddit').get_link_flair_templates(this.name);
  }
  /**
  * @summary Assigns flair on this Submission (as a moderator; also see [select_flair]{@link Submission#select_flair})
  * @param {object} options
  * @param {string} options.text The text that this link's flair should have
  * @param {string} options.css_class The CSS class that the link's flair should have
  * @returns {Promise} A Promise that fulfills with an updated version of this Submission
  * @example r.get_submission('2np694').assign_flair({text: 'this is a flair text', css_class: 'these are css classes'})
  */
  assign_flair (options) {
    return this._r._assign_flair({...options, link: this.name, subreddit_name: this.subreddit.display_name}).return(this);
  }

  /**
  * @summary Selects a flair for this Submission (as the OP; also see [assign_flair]{@link Submission#assign_flair})
  * @param {object} options
  * @param {string} options.flair_template_id A flair template ID to use for this Submission. (This should be obtained
  beforehand using {@link get_link_flair_templates}.)
  * @param {string} [options.text] The flair text to use for the submission. (This is only necessary/useful if the given flair
  template has the `text_editable` property set to `true`.)
  * @returns {Promise} A Promise that fulfills with this objects after the request is complete
  * @example r.get_submission('2np694').select_flair({flair_template_id: 'e3340d80-8152-11e4-a76a-22000bc1096c'})
  */
  select_flair (options) {
    return this._r._select_flair({...options, link: this.name, subreddit_name: this.subreddit.display_name}).return(this);
  }
};

export default Submission;
