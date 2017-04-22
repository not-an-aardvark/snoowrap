import {chunk, flatten, map, omit} from 'lodash';
import Promise from '../Promise.js';
import {Readable} from 'stream';
import {createReadStream} from 'fs';
import {formatModPermissions, handleJsonErrors, renameKey} from '../helpers.js';
import {InvalidMethodCallError} from '../errors.js';
import RedditContent from './RedditContent.js';

const api_type = 'json';

/**
* A class representing a subreddit
* <style> #Subreddit {display: none} </style>
* @extends RedditContent
* @example
*
* // Get a subreddit by name
* r.getSubreddit('AskReddit')
*/
const Subreddit = class Subreddit extends RedditContent {
  get _uri () {
    return `r/${this.display_name}/about`;
  }
  _transformApiResponse (response) {
    if (!(response instanceof Subreddit)) {
      throw new TypeError(`The subreddit /r/${this.display_name} does not exist.`);
    }
    return response;
  }
  _deleteFlairTemplates ({flair_type}) {
    return this._post({uri: `r/${this.display_name}/api/clearflairtemplates`, form: {api_type, flair_type}}).return(this);
  }
  /**
  * @summary Deletes all of this subreddit's user flair templates
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteAllUserFlairTemplates()
  */
  deleteAllUserFlairTemplates () {
    return this._deleteFlairTemplates({flair_type: 'USER_FLAIR'});
  }
  /**
  * @summary Deletes all of this subreddit's link flair templates
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteAllLinkFlairTemplates()
  */
  deleteAllLinkFlairTemplates () {
    return this._deleteFlairTemplates({flair_type: 'LINK_FLAIR'});
  }
  /**
  * @summary Deletes one of this subreddit's flair templates
  * @param {object} options
  * @param {string} options.flair_template_id The ID of the template that should be deleted
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteFlairTemplate({flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721'})
  */
  deleteFlairTemplate ({flair_template_id}) {
    return this._post({
      uri: `r/${this.display_name}/api/deleteflairtemplate`,
      form: {api_type, flair_template_id}
    }).return(this);
  }
  _createFlairTemplate ({
    text, css_class, cssClass = css_class, flair_type, text_editable = false, textEditable = text_editable
  }) {
    return this._post({
      uri: `r/${this.display_name}/api/flairtemplate`,
      form: {api_type, text, css_class: cssClass, flair_type, text_editable: textEditable}
    }).return(this);
  }
  /**
  * @summary Creates a new user flair template for this subreddit
  * @param {object} options
  * @param {string} options.text The flair text for this template
  * @param {string} [options.cssClass=''] The CSS class for this template
  * @param {boolean} [options.textEditable=false] Determines whether users should be able to edit their flair text
  when it has this template
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').createUserFlairTemplate({text: 'Some Flair Text', cssClass: 'some-css-class'})
  */
  createUserFlairTemplate (options) {
    return this._createFlairTemplate({...options, flair_type: 'USER_FLAIR'});
  }
  /**
  * @summary Creates a new link flair template for this subreddit
  * @param {object} options
  * @param {string} options.text The flair text for this template
  * @param {string} [options.cssClass=''] The CSS class for this template
  * @param {boolean} [options.textEditable=false] Determines whether users should be able to edit the flair text of their
  links when it has this template
  * @returns {Promise} A Promise that fulfills with this Subredit when the request is complete.
  * @example r.getSubreddit('snoowrap').createLinkFlairTemplate({text: 'Some Flair Text', cssClass: 'some-css-class'})
  */
  createLinkFlairTemplate (options) {
    return this._createFlairTemplate({...options, flair_type: 'LINK_FLAIR'});
  }
  _getFlairOptions ({name, link} = {}) { // TODO: Add shortcuts for this on RedditUser and Submission
    return this._post({uri: `r/${this.display_name}/api/flairselector`, form: {name, link}});
  }
  /**
  * @summary Gets the flair templates for a given link.
  * @param {string} linkId The link's base36 ID
  * @returns {Promise} An Array of flair template options
  * @example
  *
  * r.getSubreddit('snoowrap').getLinkFlairTemplates('4fp36y').then(console.log)
  // => [ { flair_css_class: '',
  //  flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721',
  //  flair_text_editable: true,
  //  flair_position: 'right',
  //  flair_text: '' },
  //  { flair_css_class: '',
  //  flair_template_id: '03821f62-c920-11e5-b608-0e309fbcf863',
  //  flair_text_editable: true,
  //  flair_position: 'right',
  //  flair_text: '' },
  //  ...
  // ]
  */
  getLinkFlairTemplates (linkId) {
    return this._getFlairOptions({link: linkId}).get('choices');
  }
  /**
  * @summary Gets the list of user flair templates on this subreddit.
  * @returns {Promise} An Array of user flair templates
  * @example
  *
  * r.getSubreddit('snoowrap').getUserFlairTemplates().then(console.log)
  // => [ { flair_css_class: '',
  //  flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721',
  //  flair_text_editable: true,
  //  flair_position: 'right',
  //  flair_text: '' },
  //  { flair_css_class: '',
  //  flair_template_id: '03821f62-c920-11e5-b608-0e309fbcf863',
  //  flair_text_editable: true,
  //  flair_position: 'right',
  //  flair_text: '' },
  //  ...
  // ]
  */
  getUserFlairTemplates () {
    return this._getFlairOptions().get('choices');
  }
  /**
  * @summary Clears a user's flair on this subreddit.
  * @param {string} name The user's name
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteUserFlair('actually_an_aardvark')
  */
  deleteUserFlair (name) {
    return this._post({uri: `r/${this.display_name}/api/deleteflair`, form: {api_type, name}}).return(this);
  }
  /**
  * @summary Gets a user's flair on this subreddit.
  * @param {string} name The user's name
  * @returns {Promise} An object representing the user's flair
  * @example
  *
  * r.getSubreddit('snoowrap').getUserFlair('actually_an_aardvark').then(console.log)
  // => { flair_css_class: '',
  //  flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721',
  //  flair_text: '',
  //  flair_position: 'right'
  // }
  */
  getUserFlair (name) {
    return this._getFlairOptions({name}).get('current');
  }
  /**
  * @summary Sets multiple user flairs at the same time
  * @desc Due to the behavior of the reddit API endpoint that this function uses, if any of the provided user flairs are
  invalid, reddit will make note of this in its response, but it will still attempt to set the remaining user flairs. If this
  occurs, the Promise returned by snoowrap will be rejected, and the rejection reason will be an array containing the 'error'
  responses from reddit.
  * @param {object[]} flairArray
  * @param {string} flairArray[].name A user's name
  * @param {string} flairArray[].text The flair text to assign to this user
  * @param {string} flairArray[].cssClass The flair CSS class to assign to this user
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example
  * r.getSubreddit('snoowrap').setMultipleUserFlairs([
  *   {name: 'actually_an_aardvark', text: "this is /u/actually_an_aardvark's flair text", cssClass: 'some-css-class'},
  *   {name: 'snoowrap_testing', text: "this is /u/snoowrap_testing's flair text", cssClass: 'some-css-class'}
  * ]);
  * // the above request gets completed successfully
  *
  * r.getSubreddit('snoowrap').setMultipleUserFlairs([
  *   {name: 'actually_an_aardvark', text: 'foo', cssClass: 'valid-css-class'},
  *   {name: 'snoowrap_testing', text: 'bar', cssClass: "this isn't a valid css class"},
  *   {name: 'not_an_aardvark', text: 'baz', cssClass: "this also isn't a valid css class"}
  * ])
  * // the Promise from the above request gets rejected, with the following rejection reason:
  * [
  *   {
  *     status: 'skipped',
  *     errors: { css: 'invalid css class `this isn\'t a valid css class\', ignoring' },
  *     ok: false,
  *     warnings: {}
  *   },
  *   {
  *     status: 'skipped',
  *     errors: { css: 'invalid css class `this also isn\'t a valid css class\', ignoring' },
  *     ok: false,
  *     warnings: {}
  *   }
  * ]
  * // note that /u/actually_an_aardvark's flair still got set by the request, even though the other two flairs caused errors.
  */
  setMultipleUserFlairs (flairArray) {
    const csvLines = flairArray.map(item => {
      // reddit expects to receive valid CSV data, which each line having the form `username,flair_text,css_class`.
      return [
        item.name, item.text || item.flairText || item.flair_text || '',
        item.cssClass || item.css_class || item.flairCssClass || item.flair_css_class || ''
      ].map(str => {
        /* To escape special characters in the lines (e.g. if the flair text itself contains a comma), surround each
        part of the line with double quotes before joining the parts together with commas (in accordance with how special
        characters are usually escaped in CSV). If double quotes are themselves part of the flair text, replace them with a
        pair of consecutive double quotes. */
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',');
    });
    /* Due to an API limitation, this endpoint can only set the flair of 100 users at a time.
    Send multiple requests if necessary to ensure that all users in the array are accounted for. */
    return Promise.map(chunk(csvLines, 100), flairChunk => {
      return this._post({uri: `r/${this.display_name}/api/flaircsv`, form: {flair_csv: flairChunk.join('\n')}});
    }).then(flatten).tap(results => {
      const errorRows = results.filter(row => !row.ok);
      if (errorRows.length) {
        throw errorRows;
      }
    }).return(this);
  }
  /**
  * @summary Gets a list of all user flairs on this subreddit.
  * @param {object} options
  * @param {string} [options.name] A specific username to jump to
  * @returns {Promise} A Listing containing user flairs
  * @example
  *
  * r.getSubreddit('snoowrap').getUserFlairList().then(console.log)
  // => Listing [
  //  { flair_css_class: null,
  //  user: 'not_an_aardvark',
  //  flair_text: 'Isn\'t an aardvark' },
  //  { flair_css_class: 'some-css-class',
  //    user: 'actually_an_aardvark',
  //    flair_text: 'this is /u/actually_an_aardvark\'s flair text' },
  //  { flair_css_class: 'some-css-class',
  //    user: 'snoowrap_testing',
  //    flair_text: 'this is /u/snoowrap_testing\'s flair text' }
  // ]
  */
  getUserFlairList (options = {}) {
    return this._getListing({uri: `r/${this.display_name}/api/flairlist`, qs: options, _transform: response => {
      /* For unknown reasons, responses from the api/flairlist endpoint are formatted differently than responses from all other
      Listing endpoints. Most Listing endpoints return an object with a `children` property containing the Listing's children,
      and `after` and `before` properties corresponding to the `after` and `before` querystring parameters that a client should
      use in the next request. However, the api/flairlist endpoint returns an objecti with a `users` property containing the
      Listing's children, and `next` and `prev` properties corresponding to the `after` and `before` querystring parameters. As
      far as I can tell, there's no actual reason for this difference. >_> */
      response.after = response.next || null;
      response.before = response.prev || null;
      response.children = response.users;
      return this._r._newObject('Listing', response);
    }});
  }
  /**
  * @summary Configures the flair settings for this subreddit.
  * @param {object} options
  * @param {boolean} options.userFlairEnabled Determines whether user flair should be enabled
  * @param {string} options.userFlairPosition Determines the orientation of user flair relative to a given username. This
  should be either the string 'left' or the string 'right'.
  * @param {boolean} options.userFlairSelfAssignEnabled Determines whether users should be able to edit their own flair
  * @param {string} options.linkFlairPosition Determines the orientation of link flair relative to a link title. This should
  be either 'left' or 'right'.
  * @param {boolean} options.linkFlairSelfAssignEnabled Determines whether users should be able to edit the flair of their
  submissions.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').configure_flair({
    userFlairEnabled: true,
    userFlairPosition: 'left',
    userFlairSelfAssignEnabled: false,
    linkFlairPosition: 'right',
    linkFlairSelfAssignEnabled: false
  * })
  */
  configureFlair ({
    user_flair_enabled, userFlairEnabled = user_flair_enabled,
    user_flair_position, userFlairPosition = user_flair_position,
    user_flair_self_assign_enabled, userFlairSelfAssignEnabled = user_flair_self_assign_enabled,
    link_flair_position, linkFlairPosition = link_flair_position,
    link_flair_self_assign_enabled, linkFlairSelfAssignEnabled = link_flair_self_assign_enabled
  }) {
    return this._post({uri: `r/${this.display_name}/api/flairconfig`, form: {
      api_type,
      flair_enabled: userFlairEnabled,
      flair_position: userFlairPosition,
      flair_self_assign_enabled: userFlairSelfAssignEnabled,
      link_flair_position: linkFlairPosition,
      link_flair_self_assign_enabled: linkFlairSelfAssignEnabled
    }}).return(this);
  }
  /**
  * @summary Gets the requester's flair on this subreddit.
  * @returns {Promise} An object representing the requester's current flair
  * @example
  *
  * r.getSubreddit('snoowrap').getMyFlair().then(console.log)
  // => { flair_css_class: 'some-css-class',
  //  flair_template_id: null,
  //  flair_text: 'this is /u/snoowrap_testing\'s flair text',
  //  flair_position: 'right'
  // }
  */
  getMyFlair () {
    return this._getFlairOptions().get('current');
  }
  /**
  * @summary Sets the requester's flair on this subreddit.
  * @param {object} options
  * @param {string} options.flair_template_id A flair template ID to use. (This should be obtained beforehand using
  {@link getUserFlairTemplates}.)
  * @param {string} [options.text] The flair text to use. (This is only necessary/useful if the given flair
  template has the `text_editable` property set to `true`.)
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').selectMyFlair({flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721'})
  */
  selectMyFlair (options) {
    /* NOTE: This requires `identity` scope in addition to `flair` scope, since the reddit api needs to be passed a username.
    I'm not sure if there's a way to do this without requiring additional scope. */
    return this._r._getMyName().then(name => {
      return this._r._selectFlair({...options, subredditName: this.display_name, name});
    }).return(this);
  }
  _setMyFlairVisibility (flair_enabled) {
    return this._post({uri: `r/${this.display_name}/api/setflairenabled`, form: {api_type, flair_enabled}}).return(this);
  }
  /**
  * @summary Makes the requester's flair visible on this subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').showMyFlair()
  */
  showMyFlair () {
    return this._setMyFlairVisibility(true);
  }
  /**
  * @summary Makes the requester's flair invisible on this subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').hideMyFlair()
  */
  hideMyFlair () {
    return this._setMyFlairVisibility(false);
  }
  /**
  * @summary Creates a new selfpost on this subreddit.
  * @param {object} options An object containing details about the submission
  * @param {string} options.title The title of the submission
  * @param {string} [options.text] The selftext of the submission
  * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission
  * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [options.captchaResponse] The response to the captcha with the given identifier
  * @returns {Promise} The newly-created Submission object
  * @example
  *
  * r.getSubreddit('snoowrap').submitSelfpost({title: 'this is a selfpost', text: "hi, how's it going?"}).then(console.log)
  * // => Submission { name: 't3_4abmsz' }
  */
  submitSelfpost (options) {
    return this._r.submitSelfpost({...options, subredditName: this.display_name});
  }
  /**
  * @summary Creates a new link submission on this subreddit.
  * @param {object} options An object containing details about the submission
  * @param {string} options.title The title of the submission
  * @param {string} options.url The url that the link submission should point to
  * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission
  * @param {boolean} [options.resubmit=true] If this is false and same link has already been submitted to this subreddit in
  the past, reddit will return an error. This could be used to avoid accidental reposts.
  * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [options.captchaResponse] The response to the captcha with the given identifier
  * @returns {Promise} The newly-created Submission object
  * @example
  *
  * r.getSubreddit('snoowrap').submitLink({title: 'I found a cool website', url: 'https://google.com'}).then(console.log)
  * // => Submission { name: 't3_4abmsz' }
  */
  submitLink (options) {
    return this._r.submitLink({...options, subredditName: this.display_name});
  }
  /**
  * @summary Gets a Listing of hot posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.getSubreddit('snoowrap').getHot().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getHot (options) {
    return this._r.getHot(this.display_name, options);
  }
  /**
  * @summary Gets a Listing of new posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.getSubreddit('snoowrap').getNew().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  *
  */
  getNew (options) {
    return this._r.getNew(this.display_name, options);
  }
  /**
  * @summary Gets a Listing of new comments on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved comments
  * @example
  *
  * r.getSubreddit('snoowrap').getNewComments().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  ...
  * // ]
  */
  getNewComments (options) {
    return this._r.getNewComments(this.display_name, options);
  }
  /**
  * @summary Gets a single random Submission from this subreddit.
  * @desc **Note**: This function will not work when snoowrap is running in a browser, because the reddit server sends a
  redirect which cannot be followed by a CORS request.
  * @returns {Promise} The retrieved Submission object
  * @example
  *
  * r.getSubreddit('snoowrap').getRandomSubmission.then(console.log)
  * // => Submission { ... }
  */
  getRandomSubmission () {
    return this._r.getRandomSubmission(this.display_name);
  }
  /**
  * @summary Gets a Listing of top posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  `hour, day, week, month, year, all`
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.getSubreddit('snoowrap').getTop({time: 'all'}).then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  ...
  * // ]
  */
  getTop (options) {
    return this._r.getTop(this.display_name, options);
  }
  /**
  * @summary Gets a Listing of controversial posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  `hour, day, week, month, year, all`
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.getSubreddit('snoowrap').getControversial({time: 'week'}).then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  ...
  * // ]
  */
  getControversial (options) {
    return this._r.getControversial(this.display_name, options);
  }
  /**
  * @summary Gets a Listing of top posts on this subreddit.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved submissions
  * @example
  *
  * r.getSubreddit('snoowrap').getRising().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getRising (options) {
    return this._r.getRising(this.display_name, options);
  }
  /**
  * @summary Gets the moderator mail for this subreddit.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing PrivateMessage objects
  * @example r.getSubreddit('snoowrap').getModmail().then(console.log)
  */
  getModmail (options) {
    return this._getListing({uri: `r/${this.display_name}/about/message/moderator`, qs: options});
  }
  /**
  * @summary Gets the moderation log for this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string[]} [options.mods] An array of moderator names that the results should be restricted to
  * @param {string} [options.type] Restricts the results to the specified type. This should be one of `banuser, unbanuser,
  removelink, approvelink, removecomment, approvecomment, addmoderator, invitemoderator, uninvitemoderator,
  acceptmoderatorinvite, removemoderator, addcontributor, removecontributor, editsettings, editflair, distinguish, marknsfw,
  wikibanned, wikicontributor, wikiunbanned, wikipagelisted, removewikicontributor, wikirevise, wikipermlevel,
  ignorereports, unignorereports, setpermissions, setsuggestedsort, sticky, unsticky, setcontestmode, unsetcontestmode,
  lock, unlock, muteuser, unmuteuser, createrule, editrule, deleterule, spoiler, unspoiler`
  * @returns {Promise} A Listing containing moderation actions
  * @example
  *
  * r.getSubreddit('snoowrap').getModerationLog().then(console.log)
  *
  * // => Listing [
  * //  ModAction { description: null, mod: 'snoowrap_testing', action: 'editflair', ... }
  * //  ModAction { description: null, mod: 'snoowrap_testing', action: 'approvecomment', ... }
  * //  ModAction { description: null, mod: 'snoowrap_testing', action: 'createrule', ... }
  * // ]
  */
  getModerationLog (options = {}) {
    const parsedOptions = omit({...options, mod: options.mods && options.mods.join(',')}, 'mods');
    return this._getListing({uri: `r/${this.display_name}/about/log`, qs: parsedOptions});
  }
  /**
  * @summary Gets a list of reported items on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing reported items
  * @example
  *
  * r.getSubreddit('snoowrap').getReports().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getReports (options = {}) {
    return this._getListing({uri: `r/${this.display_name}/about/reports`, qs: options});
  }
  /**
  * @summary Gets a list of removed items on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing removed items
  * @example
  *
  * r.getSubreddit('snoowrap').getSpam().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getSpam (options = {}) {
    return this._getListing({uri: `r/${this.display_name}/about/spam`, qs: options});
  }
  /**
  * @summary Gets a list of items on the modqueue on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing items on the modqueue
  * @example
  *
  * r.getSubreddit('snoowrap').getModqueue().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getModqueue (options = {}) {
    return this._getListing({uri: `r/${this.display_name}/about/modqueue`, qs: options});
  }
  /**
  * @summary Gets a list of unmoderated items on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing unmoderated items
  * @example
  *
  * r.getSubreddit('snoowrap').getUnmoderated().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getUnmoderated (options = {}) {
    return this._getListing({uri: `r/${this.display_name}/about/unmoderated`, qs: options});
  }
  /**
  * @summary Gets a list of edited items on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing edited items
  * @example
  *
  * r.getSubreddit('snoowrap').getEdited().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  getEdited (options = {}) {
    return this._getListing({uri: `r/${this.display_name}/about/edited`, qs: options});
  }
  /**
  * @summary Accepts an invite to become a moderator of this subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').acceptModeratorInvite()
  */
  acceptModeratorInvite () {
    return this._post({
      uri: `r/${this.display_name}/api/accept_moderator_invite`,
      form: {api_type}
    }).then(handleJsonErrors(this));
  }
  /**
  * @summary Abdicates moderator status on this subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').leaveModerator()
  */
  leaveModerator () {
    return this.fetch().get('name').then(name => {
      return this._post({uri: 'api/leavemoderator', form: {id: name}}).then(handleJsonErrors(this));
    });
  }
  /**
  * @summary Abdicates approved submitter status on this subreddit.
  * @returns {Promise} A Promise that resolves with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').leaveContributor()
  */
  leaveContributor () {
    return this.fetch().get('name').then(name => this._post({uri: 'api/leavecontributor', form: {id: name}}).return(this));
  }
  /**
  * @summary Gets a subreddit's CSS stylesheet.
  * @desc **Note**: This function will not work when snoowrap is running in a browser, because the reddit server sends a
  redirect which cannot be followed by a CORS request.
  * @desc **Note**: This method will return a 404 error if the subreddit in question does not have a custom stylesheet.
  * @returns {Promise} A Promise for a string containing the subreddit's CSS.
  * @example
  *
  * r.getSubreddit('snoowrap').getStylesheet().then(console.log)
  * // => '.md blockquote,.md del,body{color:#121212}.usertext-body ... '
  */
  getStylesheet () {
    return this._get({uri: `r/${this.display_name}/stylesheet`, json: false});
  }
  /**
  * @summary Conducts a search of reddit submissions, restricted to this subreddit.
  * @param {object} options Search options. Can also contain options for the resulting Listing.
  * @param {string} options.query The search query
  * @param {string} [options.time] Describes the timespan that posts should be retrieved frome. One of
  `hour, day, week, month, year, all`
  * @param {string} [options.sort] Determines how the results should be sorted. One of `relevance, hot, top, new, comments`
  * @param {string} [options.syntax='plain'] Specifies a syntax for the search. One of `cloudsearch, lucene, plain`
  * @returns {Promise} A Listing containing the search results.
  * @example
  *
  * r.getSubreddit('snoowrap').search({query: 'blah', sort: 'year'}).then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  search (options) {
    return this._r.search({...options, subreddit: this, restrictSr: true});
  }
  /**
  * @summary Gets the list of banned users on this subreddit.
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  * @example
  *
  * r.getSubreddit('snoowrap').getBannedUsers().then(console.log)
  * // => Listing [
  * //  { date: 1461720936, note: '', name: 'actually_an_aardvark', id: 't2_q3519' }
  * //  ...
  * // ]
  *
  */
  getBannedUsers (options) {
    return this._getListing({uri: `r/${this.display_name}/about/banned`, qs: renameKey(options, 'name', 'user')});
  }
  /**
  * @summary Gets the list of muted users on this subreddit.
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  * @example
  *
  * r.getSubreddit('snoowrap').getBannedUsers().then(console.log)
  * // => Listing [
  * //  { date: 1461720936, name: 'actually_an_aardvark', id: 't2_q3519' }
  * //  ...
  * // ]
  */
  getMutedUsers (options) {
    return this._getListing({uri: `r/${this.display_name}/about/muted`, qs: renameKey(options, 'name', 'user')});
  }
  /**
  * @summary Gets the list of users banned from this subreddit's wiki.
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  * @example
  *
  * r.getSubreddit('snoowrap').getWikibannedUsers().then(console.log)
  * // => Listing [
  * //  { date: 1461720936, note: '', name: 'actually_an_aardvark', id: 't2_q3519' }
  * //  ...
  * // ]
  */
  getWikibannedUsers (options) {
    return this._getListing({uri: `r/${this.display_name}/about/wikibanned`, qs: renameKey(options, 'name', 'user')});
  }
  /**
  * @summary Gets the list of approved submitters on this subreddit.
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  * @example
  *
  * r.getSubreddit('snoowrap').getContributors().then(console.log)
  * // => Listing [
  * //  { date: 1461720936, name: 'actually_an_aardvark', id: 't2_q3519' }
  * //  ...
  * // ]
  */
  getContributors (options) {
    return this._getListing({uri: `r/${this.display_name}/about/contributors`, qs: renameKey(options, 'name', 'user')});
  }
  /**
  * @summary Gets the list of approved wiki submitters on this subreddit .
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  * @example
  *
  * r.getSubreddit('snoowrap').getWikiContributors().then(console.log)
  * // => Listing [
  * //  { date: 1461720936, name: 'actually_an_aardvark', id: 't2_q3519' }
  * //  ...
  * // ]
  */
  getWikiContributors (options) {
    return this._getListing({uri: `r/${this.display_name}/about/wikicontributors`, qs: renameKey(options, 'name', 'user')});
  }
  /**
  * @summary Gets the list of moderators on this subreddit.
  * @param {object} options
  * @param {string} [options.name] The name of a user to find in the list
  * @returns {Promise} An Array of RedditUsers representing the moderators of this subreddit
  * @example
  *
  * r.getSubreddit('AskReddit').getModerators().then(console.log)
  * // => [
  * //  RedditUser { date: 1453862639, mod_permissions: [ 'all' ], name: 'not_an_aardvark', id: 't2_k83md' },
  * //  ...
  * // ]
  *
  */
  getModerators ({name} = {}) {
    return this._get({uri: `r/${this.display_name}/about/moderators`, qs: {user: name}});
  }
  /**
  * @summary Deletes the banner for this Subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteBanner()
  */
  deleteBanner () {
    return this._post({uri: `r/${this.display_name}/api/delete_sr_banner`, form: {api_type}}).then(handleJsonErrors(this));
  }
  /**
  * @summary Deletes the header image for this Subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteHeader()
  */
  deleteHeader () {
    return this._post({uri: `r/${this.display_name}/api/delete_sr_header`, form: {api_type}}).then(handleJsonErrors(this));
  }
  /**
  * @summary Deletes this subreddit's icon.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteIcon()
  */
  deleteIcon () {
    return this._post({uri: `r/${this.display_name}/api/delete_sr_icon`, form: {api_type}}).then(handleJsonErrors(this));
  }
  /**
  * @summary Deletes an image from this subreddit.
  * @param {object} options
  * @param {string} options.imageName The name of the image.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteImage()
  */
  deleteImage ({image_name, imageName = image_name}) {
    return this._post({
      uri: `r/${this.display_name}/api/delete_sr_image`,
      form: {api_type, img_name: imageName}
    }).then(handleJsonErrors(this));
  }
  /**
  * @summary Gets this subreddit's current settings.
  * @returns {Promise} An Object containing this subreddit's current settings.
  * @example
  *
  * r.getSubreddit('snoowrap').getSettings().then(console.log)
  * // => SubredditSettings { default_set: true, submit_text: '', subreddit_type: 'private', ... }
  */
  getSettings () {
    return this._get({uri: `r/${this.display_name}/about/edit`});
  }
  /**
  * @summary Edits this subreddit's settings.
  * @param {object} options An Object containing {[option name]: new value} mappings of the options that should be modified.
  Any omitted option names will simply retain their previous values.
  * @param {string} options.title The text that should appear in the header of the subreddit
  * @param {string} options.public_description The text that appears with this Subreddit on the search page, or on the
  blocked-access page if this subreddit is private. (500 characters max)
  * @param {string} options.description The sidebar text for the subreddit. (5120 characters max)
  * @param {string} [options.submit_text=''] The text to show below the submission page (1024 characters max)
  * @param {boolean} [options.hide_ads=false] Determines whether ads should be hidden on this subreddit. (This is only
  allowed for gold-only subreddits.)
  * @param {string} [options.lang='en'] The language of the subreddit (represented as an IETF language tag)
  * @param {string} [options.type='public'] Determines who should be able to access the subreddit. This should be one of
  `public, private, restricted, gold_restricted, gold_only, archived, employees_only`.
  * @param {string} [options.link_type='any'] Determines what types of submissions are allowed on the subreddit. This should
  be one of `any, link, self`.
  * @param {string} [options.submit_link_label=undefined] Custom text to display on the button that submits a link. If
  this is omitted, the default text will be displayed.
  * @param {string} [options.submit_text_label=undefined] Custom text to display on the button that submits a selfpost. If
  this is omitted, the default text will be displayed.
  * @param {string} [options.wikimode='modonly'] Determines who can edit wiki pages on the subreddit. This should be one of
  `modonly, anyone, disabled`.
  * @param {number} [options.wiki_edit_karma=0] The minimum amount of subreddit karma needed for someone to edit this
  subreddit's wiki. (This is only relevant if `options.wikimode` is set to `anyone`.)
  * @param {number} [options.wiki_edit_age=0] The minimum account age (in days) needed for someone to edit this subreddit's
  wiki. (This is only relevant if `options.wikimode` is set to `anyone`.)
  * @param {string} [options.spam_links='high'] The spam filter strength for links on this subreddit. This should be one of
  `low, high, all`.
  * @param {string} [options.spam_selfposts='high'] The spam filter strength for selfposts on this subreddit. This should be
  one of `low, high, all`.
  * @param {string} [options.spam_comments='high'] The spam filter strength for comments on this subreddit. This should be one
  of `low, high, all`.
  * @param {boolean} [options.over_18=false] Determines whether this subreddit should be classified as NSFW
  * @param {boolean} [options.allow_top=true] Determines whether the new subreddit should be able to appear in /r/all and
  trending subreddits
  * @param {boolean} [options.show_media=false] Determines whether image thumbnails should be enabled on this subreddit
  * @param {boolean} [options.show_media_preview=true] Determines whether media previews should be expanded by default on this
  subreddit
  * @param {boolean} [options.allow_images=true] Determines whether image uploads and links to image hosting sites should be
  enabled on this subreddit
  * @param {boolean} [options.exclude_banned_modqueue=false] Determines whether posts by site-wide banned users should be
  excluded from the modqueue.
  * @param {boolean} [options.public_traffic=false] Determines whether the /about/traffic page for this subreddit should be
  viewable by anyone.
  * @param {boolean} [options.collapse_deleted_comments=false] Determines whether deleted and removed comments should be
  collapsed by default
  * @param {string} [options.suggested_comment_sort=undefined] The suggested comment sort for the subreddit. This should be
  one of `confidence, top, new, controversial, old, random, qa`.If left blank, there will be no suggested sort,
  which means that users will see the sort method that is set in their own preferences (usually `confidence`.)
  * @param {boolean} [options.spoilers_enabled=false] Determines whether users can mark their posts as spoilers
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').editSettings({submit_text: 'Welcome! Please be sure to read the rules.'})
  */
  editSettings (options) {
    return Promise.join(this.getSettings(), this.fetch().get('name'), (currentValues, name) => {
      return this._r._createOrEditSubreddit({...currentValues, ...options, sr: name});
    }).return(this);
  }
  /**
  * @summary Gets a list of recommended other subreddits given this one.
  * @param {object} [options]
  * @param {Array} [options.omit=[]] An Array of subreddit names that should be excluded from the listing.
  * @returns {Promise} An Array of subreddit names
  * @example
  *
  * r.getSubreddit('AskReddit').getRecommendedSubreddits().then(console.log);
  * // [ 'TheChurchOfRogers', 'Sleepycabin', ... ]
  */
  getRecommendedSubreddits (options) {
    const toOmit = options.omit && options.omit.join(',');
    return this._get({uri: `api/recommend/sr/${this.display_name}`, qs: {omit: toOmit}}).then(names => map(names, 'sr_name'));
  }
  /**
  * @summary Gets the submit text (which displays on the submission form) for this subreddit.
  * @returns {Promise} The submit text, represented as a string.
  * @example
  *
  * r.getSubreddit('snoowrap').getSubmitText().then(console.log)
  * // => 'Welcome! Please be sure to read the rules.'
  */
  getSubmitText () {
    return this._get({uri: `r/${this.display_name}/api/submit_text`}).get('submit_text');
  }
  /**
  * @summary Updates this subreddit's stylesheet.
  * @param {object} options
  * @param {string} options.css The new contents of the stylesheet
  * @param {string} [options.reason] The reason for the change (256 characters max)
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').updateStylesheet({css: 'body {color:#00ff00;}', reason: 'yay green'})
  */
  updateStylesheet ({css, reason}) {
    return this._post({
      uri: `r/${this.display_name}/api/subreddit_stylesheet`,
      form: {api_type, op: 'save', reason, stylesheet_contents: css}
    }).then(handleJsonErrors(this));
  }

  _setSubscribed (status) {
    return this._post({
      uri: 'api/subscribe',
      form: {action: status ? 'sub' : 'unsub', sr_name: this.display_name}
    }).return(this);
  }
  /**
  * @summary Subscribes to this subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').subscribe()
  */
  subscribe () {
    return this._setSubscribed(true);
  }
  /**
  * @summary Unsubscribes from this subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').unsubscribe()
  */
  unsubscribe () {
    /* Reddit returns a 404 error if the user attempts to unsubscribe to a subreddit that they weren't subscribed to in the
    first place. It also (as one would expect) returns a 404 error if the subreddit in question does not exist. snoowrap
    should swallow the first type of error internally, but it should raise the second type of error. Unfortunately, the errors
    themselves are indistinguishable. So if a 404 error gets thrown, fetch the current subreddit to check if it exists. If it
    does exist, then the 404 error was of the first type, so swallow it and return the current Subreddit object as usual. If
    the subreddit doesn't exist, then the original error was of the second type, so throw it. */
    return this._setSubscribed(false).catch({statusCode: 404}, err => this.fetch().return(this).catchThrow(err));
  }
  _uploadSrImg ({name, file, uploadType, imageType}) {
    if (typeof file !== 'string' && !(file instanceof Readable)) {
      throw new InvalidMethodCallError('Uploaded image filepath must be a string or a ReadableStream.');
    }
    const parsedFile = typeof file === 'string' ? createReadStream(file) : file;
    return this._post({
      uri: `r/${this.display_name}/api/upload_sr_img`,
      formData: {name, upload_type: uploadType, img_type: imageType, file: parsedFile}
    }).then(result => {
      if (result.errors.length) {
        throw result.errors[0];
      }
      return this;
    });
  }
  /**
  * @summary Uploads an image for use in this subreddit's stylesheet.
  * @param {object} options
  * @param {string} options.name The name that the new image should have in the stylesheet
  * @param {string|stream.Readable} options.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) in environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [options.imageType='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').uploadSubredditImage({name: 'the cookie monster', file: './cookie_monster.png'})
  */
  uploadStylesheetImage ({name, file, image_type = 'png', imageType = image_type}) {
    return this._uploadSrImg({name, file, imageType, uploadType: 'img'});
  }
  /**
  * @summary Uploads an image to use as this subreddit's header.
  * @param {object} options
  * @param {string|stream.Readable} options.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [options.imageType='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').uploadHeaderImage({name: 'the cookie monster', file: './cookie_monster.png'})
  */
  uploadHeaderImage ({file, image_type = 'png', imageType = image_type}) {
    return this._uploadSrImg({file, imageType, uploadType: 'header'});
  }
  /**
  * @summary Uploads an image to use as this subreddit's mobile icon.
  * @param {object} options
  * @param {string|stream.Readable} options.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [options.imageType='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').uploadIcon({name: 'the cookie monster', file: './cookie_monster.png'})
  */
  uploadIcon ({file, image_type = 'png', imageType = image_type}) {
    return this._uploadSrImg({file, imageType, uploadType: 'icon'});
  }
  /**
  * @summary Uploads an image to use as this subreddit's mobile banner.
  * @param {object} options
  * @param {string|stream.Readable} options.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [options.imageType='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').uploadBannerImage({name: 'the cookie monster', file: './cookie_monster.png'})
  */
  uploadBannerImage ({file, image_type = 'png', imageType = image_type}) {
    return this._uploadSrImg({file, imageType, upload_type: 'banner'});
  }
  /**
  * @summary Gets information on this subreddit's rules.
  * @returns {Promise} A Promise that fulfills with information on this subreddit's rules.
  * @example
  *
  * r.getSubreddit('snoowrap').getRules().then(console.log)
  *
  * // => {
  *   rules: [
  *     {
  *       kind: 'all',
  *       short_name: 'Rule 1: No violating rule 1',
  *       description: 'Breaking this rule is not allowed.',
  *       ...
  *     },
  *     ...
  *   ],
  *   site_rules: [
  *     'Spam',
  *     'Personal and confidential information'',
  *     'Threatening, harassing, or inciting violence'
  *   ]
  * }
  */
  getRules () {
    return this._get({uri: `r/${this.display_name}/about/rules`});
  }
  /**
  * @summary Gets the stickied post on this subreddit, or throws a 404 error if none exists.
  * @param {object} [options]
  * @param {number} [options.num=1] The number of the sticky to get. Should be either `1` (first sticky) or `2` (second sticky).
  * @returns {Promise} A Submission object representing this subreddit's stickied submission
  * @example
  * r.getSubreddit('snoowrap').getSticky({num: 2})
  * // => Submission { ... }
  */
  getSticky ({num = 1} = {}) {
    return this._get({uri: `r/${this.display_name}/about/sticky`, qs: {num}});
  }
  _friend (options) {
    return this._post({
      uri: `r/${this.display_name}/api/friend`,
      form: {...options, api_type}
    }).then(handleJsonErrors(this));
  }
  _unfriend (options) {
    return this._post({
      uri: `r/${this.display_name}/api/unfriend`,
      form: {...options, api_type}
    }).then(handleJsonErrors(this));
  }
  /**
  * @summary Invites the given user to be a moderator of this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the account that should be invited
  * @param {Array} [options.permissions] The moderator permissions that this user should have. This should be an array
  containing some combination of `"wiki", "posts", "access", "mail", "config", "flair"`. To add a moderator with full
  permissions, omit this property entirely.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').inviteModerator({name: 'actually_an_aardvark', permissions: ['posts', 'wiki']})
  */
  inviteModerator ({name, permissions}) {
    return this._friend({name, permissions: formatModPermissions(permissions), type: 'moderator_invite'});
  }
  /**
  * @summary Revokes an invitation for the given user to be a moderator.
  * @param {object} options
  * @param {string} options.name The username of the account whose invitation should be revoked
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').revokeModeratorInvite({name: 'actually_an_aardvark'})
  */
  revokeModeratorInvite ({name}) {
    return this._unfriend({name, type: 'moderator_invite'});
  }
  /**
  * @summary Removes the given user's moderator status on this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the account whose moderator status should be removed
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').removeModerator({name: 'actually_an_aardvark'})
  */
  removeModerator ({name}) {
    return this._unfriend({name, type: 'moderator'});
  }
  /**
  * @summary Makes the given user an approved submitter of this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the account that should be given this status
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').addContributor({name: 'actually_an_aardvark'})
  */
  addContributor ({name}) {
    return this._friend({name, type: 'contributor'});
  }
  /**
  * @summary Revokes this user's approved submitter status on this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the account whose status should be revoked
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').removeContributor({name: 'actually_an_aardvark'})
  */
  removeContributor ({name}) {
    return this._unfriend({name, type: 'contributor'});
  }
  /**
  * @summary Bans the given user from this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the account that should be banned
  * @param {string} [options.banMessage] The ban message. This will get sent to the user in a private message, alerting them
  that they have been banned.
  * @param {string} [options.banReason] A string indicating which rule the banned user broke (100 characters max)
  * @param {number} [options.duration] The duration of the ban, in days. For a permanent ban, omit this parameter.
  * @param {string} [options.banNote] A note that appears on the moderation log, usually used to indicate the reason for the
  ban. This is not visible to the banned user. (300 characters max)
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').banUser({name: 'actually_an_aardvark', banMessage: 'You are now banned LOL'})
  */
  banUser ({
    name,
    ban_message, banMessage = ban_message,
    ban_reason, banReason = ban_reason,
    duration,
    ban_note, banNote = ban_note
  }) {
    return this._friend({
      name, ban_message: banMessage,
      ban_reason: banReason,
      duration,
      note: banNote,
      type: 'banned'
    });
  }
  /**
  * @summary Unbans the given user from this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the account that should be unbanned
  * @returns {Promise} A Promise that fulfills when the request is complete
  * @example r.getSubreddit('snoowrap').unbanUser({name: 'actually_an_aardvark'})
  */
  unbanUser ({name}) {
    return this._unfriend({name, type: 'banned'});
  }
  /**
  * @summary Mutes the given user from messaging this subreddit for 72 hours.
  * @param {object} options
  * @param {string} options.name The username of the account that should be muted
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').muteUser({name: 'actually_an_aardvark'})
  */
  muteUser ({name}) {
    return this._friend({name, type: 'muted'});
  }
  /**
  * @summary Unmutes the given user from messaging this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the account that should be muted
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').unmuteUser({name: 'actually_an_aardvark'})
  */
  unmuteUser ({name}) {
    return this._unfriend({name, type: 'muted'});
  }
  /**
  * @summary Bans the given user from editing this subreddit's wiki.
  * @param {object} options
  * @param {string} options.name The username of the account that should be wikibanned
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').wikibanUser({name: 'actually_an_aardvark'})
  */
  wikibanUser ({name}) {
    return this._friend({name, type: 'wikibanned'});
  }
  /**
  * @summary Unbans the given user from editing this subreddit's wiki.
  * @param {object} options
  * @param {string} options.name The username of the account that should be unwikibanned
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').unwikibanUser({name: 'actually_an_aardvark'})
  */
  unwikibanUser ({name}) {
    return this._unfriend({name, type: 'wikibanned'});
  }
  /**
  * @summary Adds the given user to this subreddit's list of approved wiki editors.
  * @param {object} options
  * @param {string} options.name The username of the account that should be given approved editor status
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').addWikiContributor({name: 'actually_an_aardvark'})
  */
  addWikiContributor ({name}) {
    return this._friend({name, type: 'wikicontributor'});
  }
  /**
  * @summary Removes the given user from this subreddit's list of approved wiki editors.
  * @param {object} options
  * @param {string} options.name The username of the account whose approved editor status should be revoked
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').removeWikiContributor({name: 'actually_an_aardvark'})
  */
  removeWikiContributor ({name}) {
    return this._unfriend({name, type: 'wikicontributor'});
  }
  /**
  * @summary Sets the permissions for a given moderator on this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the moderator whose permissions are being changed
  * @param {Array} [options.permissions] The new moderator permissions that this user should have. This should be an array
  containing some combination of `"wiki", "posts", "access", "mail", "config", "flair"`. To add a moderator with full
  permissions, omit this property entirely.
  * @returns {Promise} A Promise that fulfills with this Subreddit when this request is complete
  * @example r.getSubreddit('snoowrap').setModeratorPermissions({name: 'actually_an_aardvark', permissions: ['mail']})
  */
  setModeratorPermissions ({name, permissions}) {
    return this._post({
      uri: `r/${this.display_name}/api/setpermissions`,
      form: {api_type, name, permissions: formatModPermissions(permissions), type: 'moderator'}
    }).then(handleJsonErrors(this));
  }
  /**
  * @summary Gets a given wiki page on this subreddit.
  * @param {string} title The title of the desired wiki page.
  * @returns {WikiPage} An unfetched WikiPage object corresponding to the desired wiki page
  * @example
  *
  * r.getSubreddit('snoowrap').getWikiPage('index')
  * // => WikiPage { title: 'index', subreddit: Subreddit { display_name: 'snoowrap' } }
  */
  getWikiPage (title) {
    return this._r._newObject('WikiPage', {subreddit: this, title});
  }
  /**
  * @summary Gets the list of wiki pages on this subreddit.
  * @returns {Promise} An Array containing WikiPage objects
  * @example
  *
  * r.getSubreddit('snoowrap').getWikiPages().then(console.log)
  * // => [
  * //   WikiPage { title: 'index', subreddit: Subreddit { display_name: 'snoowrap'} }
  * //   WikiPage { title: 'config/sidebar', subreddit: Subreddit { display_name: 'snoowrap'} }
  * //   WikiPage { title: 'secret_things', subreddit: Subreddit { display_name: 'snoowrap'} }
  * //   WikiPage { title: 'config/submit_text', subreddit: Subreddit { display_name: 'snoowrap'} }
  * // ]
  */
  getWikiPages () {
    return this._get({uri: `r/${this.display_name}/wiki/pages`}).map(title => this.getWikiPage(title));
  }
  /**
  * @summary Gets a list of revisions on this subreddit's wiki.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing wiki revisions
  * @example
  *
  * r.getSubreddit('snoowrap').getWikiRevisions().then(console.log)
  * // => Listing [
  * //  { page: 'index', reason: 'added cookies', ... },
  * //  ...
  * // ]
  */
  getWikiRevisions (options) {
    return this._getListing({uri: `r/${this.display_name}/wiki/revisions`, qs: options});
  }
};

export default Subreddit;
