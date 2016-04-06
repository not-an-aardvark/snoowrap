'use strict';
const _ = require('lodash');
const Promise = require('bluebird');
const helpers = require('../helpers');
const errors = require('../errors');
const api_type = 'json';

/**
* A class representing a subreddit
* @extends RedditContent
*/
const Subreddit = class extends require('./RedditContent') {
  get _uri () {
    return `r/${this.display_name}/about`;
  }
  _delete_flair_templates ({flair_type}) {
    return this._post({uri: `r/${this.display_name}/api/clearflairtemplates`, form: {api_type, flair_type}});
  }
  /**
  * @summary Deletes all of this subreddit's user flair templates
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  delete_all_user_flair_templates () {
    return this._delete_flair_templates({flair_type: 'USER_FLAIR'});
  }
  /**
  * @summary Deletes all of this subreddit's link flair templates
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  delete_all_link_flair_templates () {
    return this._delete_flair_templates({flair_type: 'LINK_FLAIR'});
  }
  /**
  * @summary Deletes one of this subreddit's flair templates
  * @param {object} options
  * @param {string} options.flair_template_id The ID of the template that should be deleted
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  delete_flair_template (options) {
    return this._post({
      uri: `r/${this.display_name}/api/deleteflairtemplate`,
      form: {api_type, flair_template_id: options.flair_template_id}
    }).return(this);
  }
  _create_flair_template ({text, css_class, flair_type, text_editable = false}) {
    return this._post({
      uri: `r/${this.display_name}/api/flairtemplate`,
      form: {api_type, text, css_class, flair_type, text_editable}
    }).return(this);
  }
  /**
  * @summary Creates a new user flair template for this subreddit
  * @param {object} options
  * @param {string} options.text The flair text for this template
  * @param {string} [options.css_class=''] The CSS class for this template
  * @param {boolean} [options.text_editable=false] Determines whether users should be able to edit their flair text
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  when it has this template
  */
  create_user_flair_template (options) {
    return this._create_flair_template({...options, flair_type: 'USER_FLAIR'});
  }
  /**
  * @summary Creates a new link flair template for this subreddit
  * @param {object} options
  * @param {string} options.text The flair text for this template
  * @param {string} [options.css_class=''] The CSS class for this template
  * @param {boolean} [options.text_editable=false] Determines whether users should be able to edit the flair text of their
  links when it has this template
  * @returns {Promise} A Promise that fulfills with this Subredit when the request is complete.
  */
  create_link_flair_template (options) {
    return this._create_flair_template({...options, flair_type: 'LINK_FLAIR'});
  }
  _get_flair_options ({name, link} = {}) { // TODO: Add shortcuts for this on RedditUser and Submission
    return this._post({uri: `r/${this.display_name}/api/flairselector`, form: {name, link}});
  }
  /**
  * @summary Gets the flair templates for a given link.
  * @param {string} link_id The link's base36 ID
  * @returns {Promise} An Array of flair template options
  */
  get_link_flair_templates (link_id) {
    return this._get_flair_options({link: link_id}).choices;
  }
  /**
  * @summary Gets the list of user flair templates on this subreddit.
  * @returns {Promise} An Array of user flair templates
  */
  get_user_flair_templates () {
    return this._get_flair_options().choices;
  }
  /**
  * @summary Clears a user's flair on this subreddit.
  * @param {string} name The user's name
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  delete_user_flair (name) {
    return this._post({uri: `r/${this.display_name}/api/deleteflair`, form: {api_type, name}});
  }
  /**
  * @summary Gets a user's flair on this subreddit.
  * @param {string} name The user's name
  * @returns {Promise} An object representing the user's flair
  */
  get_user_flair (name) {
    return this._get_flair_options({name}).current;
  }
  _set_flair_from_csv (flair_csv) {
    return this._post({uri: `r/${this.display_name}/api/flaircsv`, form: {flair_csv}});
  }
  /**
  * @summary Sets multiple user flairs at the same time
  * @param {object[]} flair_array
  * @param {string} flair_array[].name A user's name
  * @param {string} flair_array[].text The flair text to assign to this user
  * @param {string} flair_array[].css_class The flair CSS class to assign to this user
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  set_multiple_user_flairs (flair_array) {
    const requests = [];
    while (flair_array.length > 0) {
      // The endpoint only accepts at most 100 lines of csv at a time, so split the array into chunks of 100.
      requests.push(this._set_flair_from_csv(flair_array.splice(0, 100).map(item =>
        `${item.name},${item.text || ''},${item.css_class || ''}`).join('\n')
      ));
    }
    return Promise.all(requests).return(this);
  }
  /**
  * @summary Gets a Listing all user flairs on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.name] A specific username to jump to
  * @returns {Promise} A Listing containing user flairs
  */
  get_user_flair_list (options) {
    return this._get_listing({uri: `r/${this.display_name}/api/flairlist`, qs: options}).users;
  }
  /**
  * @summary Configures the flair settings for this subreddit.
  * @param {object} options
  * @param {boolean} options.user_flair_enabled Determines whether user flair should be enabled
  * @param {string} options.user_flair_position Determines the orientation of user flair relative to a given username. This
  should be either the string 'left' or the string 'right'.
  * @param {boolean} options.user_flair_self_assign_enabled Determines whether users should be able to edit their own flair
  * @param {string} options.link_flair_position Determines the orientation of link flair relative to a link title. This should
  be either 'left' or 'right'.
  * @param {boolean} options.link_flair_self_assign_enabled Determines whether users should be able to edit the flair of their
  submissions.
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  configure_flair (options) {
    return this._post({
      uri: `r/${this.display_name}/api/flairconfig`,
      form: {
        api_type,
        flair_enabled: options.user_flair_enabled,
        flair_position: options.user_flair_position,
        flair_self_assign_enabled: options.user_flair_self_assign_enabled,
        link_flair_position: options.link_flair_position,
        link_flair_self_assign_enabled: options.link_flair_self_assign_enabled
      }
    });
  }
  /**
  * @summary Gets the requester's flair on this subreddit.
  * @returns {Promise} An object representing the requester's current flair
  */
  get_my_flair () {
    return this._get_flair_options().current;
  }
  /**
  * @summary Sets the requester's flair on this subreddit.
  * @param {object} options
  * @param {string} options.flair_template_id A flair template ID to use. (This should be obtained beforehand using
  {@link get_user_flair_templates}.)
  * @param {string} [options.text] The flair text to use. (This is only necessary/useful if the given flair
  template has the `text_editable` property set to `true`.)
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  select_my_flair (options) {
    /* NOTE: This requires `identity` scope in addition to `flair` scope, since the reddit api needs to be passed a username.
    I'm not sure if there's a way to do this without requiring additional scope. */
    return (this._r.own_user_info ? Promise.resolve() : this._r.get_me()).then(() => {
      return this._r._select_flair({...options, subreddit_name: this.display_name, name: this._r.own_user_info.name});
    });
  }
  _set_my_flair_visibility (flair_enabled) {
    return this._post({uri: `r/${this.display_name}/api/setflairenabled`, form: {api_type, flair_enabled}});
  }
  /**
  * @summary Makes the requester's flair visible on this subreddit.
  * @returns {Promise} A Promise that will resolve when the request is complete
  */
  show_my_flair () {
    return this._set_my_flair_visibility(true);
  }
  /**
  * @summary Makes the requester's flair invisible on this subreddit.
  * @returns {Promise} A Promise that will resolve when the request is complete
  */
  hide_my_flair () {
    return this._set_my_flair_visibility(false);
  }
  /**
  * @summary Creates a new selfpost on this subreddit.
  * @param {object} options An object containing details about the submission
  * @param {string} options.title The title of the submission
  * @param {string} [options.text] The selftext of the submission
  * @param {boolean} [options.send_replies=true] Determines whether inbox replies should be enabled for this submission
  * @param {string} [options.captcha_iden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [options.captcha_response] The response to the captcha with the given identifier
  * @returns {Promise} The newly-created Submission object
  */
  submit_selfpost (options) {
    return this._r.submit_selfpost({...options, subreddit_name: this.display_name});
  }
  /**
  * @summary Creates a new link submission on this subreddit.
  * @param {object} options An object containing details about the submission
  * @param {string} options.title The title of the submission
  * @param {string} options.url The url that the link submission should point to
  * @param {boolean} [options.send_replies=true] Determines whether inbox replies should be enabled for this submission
  * @param {boolean} [options.resubmit=true] If this is false and same link has already been submitted to this subreddit in
  the past, reddit will return an error. This could be used to avoid accidental reposts.
  * @param {string} [options.captcha_iden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [options.captcha_response] The response to the captcha with the given identifier
  * @returns {Promise} The newly-created Submission object
  */
  submit_link (options) {
    return this._r.submit_link({...options, subreddit_name: this.display_name});
  }
  /**
  * @summary Gets a Listing of hot posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved submissions
  */
  get_hot (options) {
    return this._r.get_hot(this.display_name, options);
  }
  /**
  * @summary Gets a Listing of new posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved submissions
  */
  get_new (options) {
    return this._r.get_new(this.display_name, options);
  }
  /**
  * @summary Gets a Listing of new comments on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} A Listing containing the retrieved comments
  */
  get_new_comments (options) {
    return this._r.get_new_comments(this.display_name, options);
  }
  /**
  * @summary Gets a single random Submission from this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise} The retrieved Submission object
  */
  get_random_submission () {
    return this._r.get_random_submission(this.display_name);
  }
  /**
  * @summary Gets a Listing of top posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  `hour, day, week, month, year, all`
  * @returns {Promise} A Listing containing the retrieved submissions
  */
  get_top (options) {
    return this._r.get_top(this.display_name, options);
  }
  /**
  * @summary Gets a Listing of controversial posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of
  `hour, day, week, month, year, all`
  * @returns {Promise} A Listing containing the retrieved submissions
  */
  get_controversial (options) {
    return this._r.get_controversial(this.display_name, options);
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
  lock, unlock, muteuser, unmuteuser, createrule, editrule, deleterule`
  * @returns {Promise} A Listing containing moderation actions
  */
  get_moderation_log (options = {}) {
    const parsed_options = _(options).assign({mod: options.mods && options.mods.join(',')}).omit('mods').value();
    return this._get_listing({uri: `r/${this.display_name}/about/log`, qs: parsed_options});
  }
  /**
  * @summary Gets a list of reported items on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing reported items
  */
  get_reports (options = {}) {
    return this._get_listing({uri: `r/${this.display_name}/about/reports`, qs: options});
  }
  /**
  * @summary Gets a list of removed items on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing removed items
  */
  get_spam (options = {}) {
    return this._get_listing({uri: `r/${this.display_name}/about/spam`, qs: options});
  }
  /**
  * @summary Gets a list of items on the modqueue on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing items on the modqueue
  */
  get_modqueue (options = {}) {
    return this._get_listing({uri: `r/${this.display_name}/about/modqueue`, qs: options});
  }
  /**
  * @summary Gets a list of unmoderated items on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing unmoderated items
  */
  get_unmoderated (options = {}) {
    return this._get_listing({uri: `r/${this.display_name}/about/unmoderated`, qs: options});
  }
  /**
  * @summary Gets a list of edited items on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.only] Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns {Promise} A Listing containing edited items
  */
  get_edited (options = {}) {
    return this._get_listing({uri: `r/${this.display_name}/about/edited`, qs: options});
  }
  /**
  * @summary Accepts an invite to become a moderator of this subreddit.
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete
  */
  accept_moderator_invite () {
    return this._post({
      uri: `r/${this.display_name}/api/accept_moderator_invite`,
      form: {api_type}
    }).then(helpers._handle_json_errors(this));
  }
  /**
  * @summary Abdicates moderator status on this subreddit.
  * @returns {Promise} A Promise for this subreddit.
  */
  leave_moderator () {
    return this.name.then(name =>
      this._post({uri: 'api/leavemoderator', form: {id: name}}).then(helpers._handle_json_errors(this))
    );
  }
  /**
  * @summary Abdicates approved submitter status on this subreddit.
  * @returns {Promise} A Promise that resolves with this subreddit when the request is complete.
  */
  leave_contributor () {
    return this.name.then(name =>
      this._post({uri: 'api/leavecontributor', form: {id: name}}).return(this)
    );
  }
  /**
  * @summary Gets a subreddit's CSS stylesheet.
  * @desc **Note**: This method will return a 404 error if the subreddit in question does not have a custom stylesheet.
  * @returns {Promise} A Promise for a string containing the subreddit's CSS.
  */
  get_stylesheet () {
    return this._get({uri: `r/${this.display_name}/stylesheet`, json: false, transform: _.identity});
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
  */
  search (options) {
    return this._r.search({...options, subreddit: this, restrict_sr: true});
  }
  /**
  * @summary Gets the list of banned users on this subreddit.
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  */
  get_banned_users (options) { // TODO: Return Listings containing RedditUser objects rather than normal objects with data
    const opts = typeof options === 'string' ? options : options && {name: options.name};
    return this._get_listing({uri: `r/${this.display_name}/about/banned`, qs: helpers.rename_key(opts, 'name', 'user')});
  }
  /**
  * @summary Gets the list of muted users on this subreddit.
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  */
  get_muted_users (options) {
    const opts = typeof options === 'string' ? options : options && {name: options.name};
    return this._get_listing({uri: `r/${this.display_name}/about/muted`, qs: helpers.rename_key(opts, 'name', 'user')});
  }
  /**
  * @summary Gets the list of users banned from this subreddit's wiki.
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  */
  get_wikibanned_users (options) {
    const opts = typeof options === 'string' ? options : options && {name: options.name};
    return this._get_listing({uri: `r/${this.display_name}/about/wikibanned`, qs: helpers.rename_key(opts, 'name', 'user')});
  }
  /**
  * @summary Gets the list of approved submitters on this subreddit.
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  */
  get_contributors (options) {
    const opts = typeof options === 'string' ? options : options && {name: options.name};
    return this._get_listing({uri: `r/${this.display_name}/about/contributors`, qs: helpers.rename_key(opts, 'name', 'user')});
  }
  /**
  * @summary Gets the list of approved wiki submitters on this subreddit .
  * @param {object} options Filtering options. Can also contain options for the resulting Listing.
  * @param {string} options.name A username on the list to jump to.
  * @returns {Promise} A Listing of users
  */
  get_wiki_contributors (options) {
    const opts = typeof options === 'string' ? options : options && {name: options.name};
    const query = helpers.rename_key(opts, 'name', 'user');
    return this._get_listing({uri: `r/${this.display_name}/about/wikicontributors`, qs: query});
  }
  /**
  * @summary Gets the list of moderators on this subreddit.
  * @param {object} $0
  * @param {string} [$0.name] The name of a user to find in the list
  * @returns {Promise} An Array of RedditUsers representing the moderators of this subreddit
  */
  get_moderators (options) {
    const opts = typeof options === 'string' ? options : options && {name: options.name};
    return this._get({uri: `r/${this.display_name}/about/moderators`, qs: helpers.rename_key(opts, 'name', 'user')});
  }
  /**
  * @summary Deletes the banner for this Subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  delete_banner () {
    return this._post({
      uri: `r/${this.display_name}/api/delete_sr_banner`,
      form: {api_type}
    }).then(helpers._handle_json_errors(this));
  }
  /**
  * @summary Deletes the header image for this Subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  delete_header () {
    return this._post({
      uri: `r/${this.display_name}/api/delete_sr_header`,
      form: {api_type}
    }).then(helpers._handle_json_errors(this));
  }
  /**
  * @summary Deletes this subreddit's icon.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  delete_icon () {
    return this._post({
      uri: `r/${this.display_name}/api/delete_sr_icon`,
      form: {api_type}
    }).then(helpers._handle_json_errors(this));
  }
  /**
  * @summary Deletes an image from this subreddit.
  * @param {object} $0
  * @param {string} $0.image_name The name of the image.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  delete_image ({image_name}) {
    return this._post({
      uri: `r/${this.display_name}/api/delete_sr_image`,
      form: {api_type, img_name: image_name}
    }).then(helpers._handle_json_errors(this));
  }
  /**
  * @summary Gets this subreddit's current settings.
  * @returns {Promise} An Object containing this subreddit's current settings.
  */
  get_settings () {
    return this._get({uri: `r/${this.display_name}/about/edit`});
  }
  /**
  * @summary Edits this subreddit's settings.
  * @param {object} options An Object containing {[option name]: new value} mappings of the options that should be modified.
  Any omitted option names will simply retain their previous values.
  * @param {string} options.title The text that should appear in the header of the subreddit
  * @param {string} options.public_description The text that appears with this subreddit on the search page, or on the
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
  * @param {boolean} [options.exclude_banned_modqueue=false] Determines whether posts by site-wide banned users should be
  excluded from the modqueue.
  * @param {boolean} [options.public_traffic=false] Determines whether the /about/traffic page for this subreddit should be
  viewable by anyone.
  * @param {boolean} [options.collapse_deleted_comments=false] Determines whether deleted and removed comments should be
  collapsed by default
  * @param {string} [options.suggested_comment_sort=undefined] The suggested comment sort for the subreddit. This should be
  one of `confidence, top, new, controversial, old, random, qa`.If left blank, there will be no suggested sort,
  which means that users will see the sort method that is set in their own preferences (usually `confidence`.)
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete.
  */
  edit_settings (options) {
    return Promise.join(this.get_settings(), this.name, (current_values, name) => {
      return this._r._create_or_edit_subreddit({...current_values, ...options, sr: name});
    }).return(this);
  }
  /**
  * @summary Gets a list of recommended other subreddits given this one.
  * @param {object} [$0]
  * @param {Array} [$0.omit=[]] An Array of subreddit names that should be excluded from the listing.
  * @returns {Promise} An Array of subreddit names
  */
  get_recommended_subreddits ({omit} = {}) {
    return this._get({uri: `api/recommend/sr/${this.display_name}`, qs: {omit: omit && omit.join(',')}}).then(names =>
      _.map(names, 'sr_name')
    );
  }
  /**
  * @summary Gets the submit text (which displays on the submission form) for this subreddit.
  * @returns {Promise} The submit text, represented as a string.
  */
  get_submit_text () {
    return this._get({uri: `r/${this.display_name}/api/submit_text`}).submit_text;
  }
  /**
  * @summary Updates this subreddit's stylesheet.
  * @param {object} $0
  * @param {string} $0.css The new contents of the stylesheet
  * @param {string} [$0.reason] The reason for the change (256 characters max)
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  update_stylesheet ({css, reason}) {
    return this._post({
      uri: `r/${this.display_name}/api/subreddit_stylesheet`,
      form: {api_type, op: 'save', reason, stylesheet_contents: css}
    }).then(helpers._handle_json_errors(this));
  }

  _set_subscribed (status) {
    return this.name.then(name => this._post({
      uri: 'api/subscribe',
      form: {action: status ? 'sub' : 'unsub', sr: name}
    }).return(this));
  }
  /**
  * @summary Subscribes to this subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  subscribe () {
    return this._set_subscribed(true);
  }
  /**
  * @summary Unsubscribes from this subreddit.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  unsubscribe () {
    return this._set_subscribed(false);
  }
  _upload_sr_img ({name, file, upload_type, image_type}) {
    if (typeof file !== 'string' && !(file instanceof require('stream').Readable)) {
      throw new errors.InvalidMethodCallError('Uploaded image filepath must be a string or a ReadableStream.');
    }
    const parsed_file = typeof file === 'string' ? require('fs').createReadStream(file) : file;
    return this._post({
      uri: `r/${this.display_name}/api/upload_sr_img`,
      formData: {name, upload_type, img_type: image_type, file: parsed_file}
    }).then(result => {
      if (result.errors.length) {
        throw result.errors[0];
      }
      return this;
    });
  }
  /**
  * @summary Uploads an image for use in this subreddit's stylesheet.
  * @param {object} $0
  * @param {string} $0.name The name that the new image should have in the stylesheet
  * @param {string|stream.Readable} $0.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) in environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [$0.image_type='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete.
  */
  upload_stylesheet_image ({name, file, image_type = 'png'}) {
    return this._upload_sr_img({name, file, image_type, upload_type: 'img'});
  }
  /**
  * @summary Uploads an image to use as this subreddit's header.
  * @param {object} $0
  * @param {string|stream.Readable} $0.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [$0.image_type='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete.
  */
  upload_header_image ({file, image_type = 'png'}) {
    return this._upload_sr_img({file, image_type, upload_type: 'header'});
  }
  /**
  * @summary Uploads an image to use as this subreddit's mobile icon.
  * @param {object} $0
  * @param {string|stream.Readable} $0.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [$0.image_type='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete.
  */
  upload_icon ({file, image_type = 'png'}) {
    return this._upload_sr_img({file, image_type, upload_type: 'icon'});
  }
  /**
  * @summary Uploads an image to use as this subreddit's mobile banner.
  * @param {object} $0
  * @param {string|stream.Readable} $0.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [$0.image_type='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete.
  */
  upload_banner_image ({file, image_type = 'png'}) {
    return this._upload_sr_img({file, image_type, upload_type: 'banner'});
  }
  /**
  * @summary Gets information on this subreddit's rules.
  * @returns {Promise} A Promise that fulfills with information on this subreddit's rules.
  */
  get_rules () {
    return this._get({uri: `r/${this.display_name}/about/rules`});
  }
  /**
  * @summary Gets the stickied post on this subreddit, or throws a 404 error if none exists.
  * @param {object} $0
  * @param {number} [$0.num=1] The number of the sticky to get. Should be either `1` (first sticky) or `2` (second sticky).
  * @returns {Promise} A Submission object representing this subreddit's stickied submission
  */
  get_sticky ({num = 1} = {}) {
    return this._get({uri: `r/${this.display_name}/about/sticky`, qs: {num}});
  }
  _friend (options) {
    return this._r._friend({...options, sub: this.display_name}).then(helpers._handle_json_errors(this))
    ;
  }
  _unfriend (options) {
    return this._r._unfriend({...options, sub: this.display_name}).then(helpers._handle_json_errors(this));
  }
  /**
  * @summary Invites the given user to be a moderator of this subreddit.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be invited
  * @param {Array} [$0.permissions] The moderator permissions that this user should have. This should be an array containing
  some combination of `"wiki", "posts", "access", "mail", "config", "flair"`. To add a moderator with full permissions, omit
  this property entirely.
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  invite_moderator ({name, permissions}) {
    return this._friend({name, permissions: helpers._format_mod_permissions(permissions), type: 'moderator_invite'});
  }
  /**
  * @summary Revokes an invitation for the given user to be a moderator.
  * @param {object} $0
  * @param {string} $0.name The username of the account whose invitation should be revoked
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  revoke_moderator_invite ({name}) {
    return this._unfriend({name, type: 'moderator_invite'});
  }
  /**
  * @summary Removes the given user's moderator status on this subreddit.
  * @param {object} $0
  * @param {string} $0.name The username of the account whose moderator status should be removed
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  remove_moderator ({name}) {
    return this._unfriend({name, type: 'moderator'});
  }
  /**
  * @summary Makes the given user an approved submitter of this subreddit.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be given this status
  * returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  add_contributor ({name}) {
    return this._friend({name, type: 'contributor'});
  }
  /**
  * @summary Revokes this user's approved submitter status on this subreddit.
  * @param {object} $0
  * @param {string} $0.name The username of the account whose status should be revoked
  * @returns {Promise} A Promise that fulfills with this Subreddit when the request is complete
  */
  remove_contributor ({name}) {
    return this._unfriend({name, type: 'contributor'});
  }
  /**
  * @summary Bans the given user from this subreddit.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be banned
  * @param {string} [$0.ban_message] The ban message. This will get sent to the user in a private message, alerting them
  that they have been banned.
  * @param {string} [$0.ban_reason] A string indicating which rule the banned user broke (100 characters max)
  * @param {number} [$0.duration] The duration of the ban, in days. For a permanent ban, omit this parameter.
  * @param {string} [$0.ban_note] A note that appears on the moderation log, usually used to indicate the reason for the
  ban. This is not visible to the banned user. (300 characters max)
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete
  */
  ban_user ({name, ban_message, ban_reason, duration, ban_note}) {
    return this._friend({name, ban_message, ban_reason, duration, note: ban_note, type: 'banned'});
  }
  /**
  * @summary Unbans the given user from this subreddit.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be unbanned
  * @returns {Promise} A Promise that fulfills when the request is complete
  */
  unban_user ({name}) {
    return this._unfriend({name, type: 'banned'});
  }
  /**
  * @summary Mutes the given user from messaging this subreddit for 72 hours.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be muted
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete
  */
  mute_user ({name}) {
    return this._friend({name, type: 'muted'});
  }
  /**
  * @summary Unmutes the given user from messaging this subreddit.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be muted
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete
  */
  unmute_user ({name}) {
    return this._unfriend({name, type: 'muted'});
  }
  /**
  * @summary Bans the given user from editing this subreddit's wiki.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be wikibanned
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete
  */
  wikiban_user ({name}) {
    return this._friend({name, type: 'wikibanned'});
  }
  /**
  * @summary Unbans the given user from editing this subreddit's wiki.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be unwikibanned
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete
  */
  unwikiban_user ({name}) {
    return this._unfriend({name, type: 'wikibanned'});
  }
  /**
  * @summary Adds the given user to this subreddit's list of approved wiki editors.
  * @param {object} $0
  * @param {string} $0.name The username of the account that should be given approved editor status
  * @returns {Promise} A Promise that fulfills with this subreddit when the request is complete
  */
  add_wiki_contributor ({name}) {
    return this._friend({name, type: 'wikicontributor'});
  }
  /**
  * @summary Removes the given user from this subreddit's list of approved wiki editors.
  * @param {object} $0
  * @param {string} $0.name The username of the account whose approved editor status should be revoked
  * returns {Promise} A Promise that fulfills with this subreddit when the request is complete
  */
  remove_wiki_contributor ({name}) {
    return this._unfriend({name, type: 'wikicontributor'});
  }
  /**
  * @summary Sets the permissions for a given moderator on this subreddit.
  * @param {object} $0
  * @param {string} $0.name The username of the moderator whose permissions are being changed
  * @param {Array} [$0.permissions] The new moderator permissions that this user should have. This should be an array
  containing some combination of `"wiki", "posts", "access", "mail", "config", "flair"`. To add a moderator with full
  permissions, omit this property entirely.
  * @returns {Promise} A Promise that fulfills with this Subreddit when this request is complete
  */
  set_moderator_permissions ({name, permissions}) {
    return this._post({
      uri: `r/${this.display_name}/api/setpermissions`,
      form: {api_type, name, permissions: helpers._format_mod_permissions(permissions), type: 'moderator'}
    }).tap(helpers._handle_json_errors(this));
  }
  /**
  * @summary Gets a given wiki page on this subreddit.
  * @param {string} title The title of the desired wiki page.
  * @returns {WikiPage} An unfetched WikiPage object corresponding to the desired wiki page
  */
  get_wiki_page (title) {
    return this._r._new_object('WikiPage', {subreddit: this, title});
  }
  /**
  * @summary Gets the list of wiki pages on this subreddit.
  * @returns {Promise} An Array containing WikiPage objects
  */
  get_wiki_pages () {
    return this._get({uri: `r/${this.display_name}/wiki/pages`}).then(result =>
      _.map(result, title => this.get_wiki_page(title))
    );
  }
  /**
  * @summary Gets a list of revisions on this subreddit's wiki.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing wiki revisions
  */
  get_wiki_revisions (options) {
    return this._get_listing({uri: `r/${this.display_name}/wiki/revisions`, qs: options});
  }
};

module.exports = Subreddit;
