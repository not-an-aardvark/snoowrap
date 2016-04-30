import RedditContent from './RedditContent.js';

/**
* A class representing a wiki page on a subreddit.
* <style> #WikiPage {display: none} </style>
* @extends RedditContent
* @example
*
* // Get a wiki page on a given subreddit by name
* r.get_subreddit('AskReddit').get_wiki_page('rules')
*/
const WikiPage = class extends RedditContent {
  get _uri () {
    return `r/${this.subreddit.display_name}/wiki/${this.title}`;
  }
  /**
  * @summary Gets the current settings for this wiki page.
  * @returns {Promise} An Object representing the settings for this page
  * @example
  *
  * r.get_subreddit('snoowrap').get_wiki_page('index').get_settings().then(console.log)
  * // => WikiPageSettings { permlevel: 0, editors: [], listed: true }
  */
  get_settings () {
    return this._get({uri: `r/${this.subreddit.display_name}/wiki/settings/${this.title}`});
  }
  /**
  * @summary Edits the settings for this wiki page.
  * @param {object} $0
  * @param {boolean} $0.listed Determines whether this wiki page should appear on the public list of pages for this subreddit.
  * @param {number} $0.permission_level Determines who should be allowed to access and edit this page `0` indicates that this
  subreddit's default wiki settings should get used, `1` indicates that only approved wiki contributors on this subreddit
  should be able to edit this page, and `2` indicates that only mods should be able to view and edit this page.
  * @example r.get_subreddit('snoowrap').get_wiki_page('index').edit_settings({listed: false, permission_level: 1})
  */
  edit_settings ({listed, permission_level}) {
    return this._post({
      uri: `r/${this.subreddit.display_name}/wiki/settings/${this.title}`,
      form: {listed, permlevel: permission_level}
    }).return(this);
  }
  _modify_editor ({name, action}) {
    return this._post({
      uri: `r/${this.subreddit.display_name}/api/wiki/alloweditor/${action}`,
      form: {page: this.title, username: name}
    });
  }
  /**
  * @summary Makes the given user an approved editor of this wiki page.
  * @param {object} $0
  * @param {string} $0.name The name of the user to be added
  * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
  * @example r.get_subreddit('snoowrap').get_wiki_page('index').add_editor({name: 'actually_an_aardvark'})
  */
  add_editor ({name}) {
    return this._modify_editor({name, action: 'add'}).return(this);
  }
  /**
  * @summary Revokes this user's approved editor status for this wiki page
  * @param {object} $0
  * @param {string} $0.name The name of the user to be removed
  * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
  * @example r.get_subreddit('snoowrap').get_wiki_page('index').remove_editor({name: 'actually_an_aardvark'})
  */
  remove_editor ({name}) {
    return this._modify_editor({name, action: 'del'}).return(this);
  }
  /**
  * @summary Edits this wiki page, or creates it if it does not exist yet.
  * @param {object} $0
  * @param {string} $0.text The new content of the page, in markdown.
  * @param {string} [$0.reason] The edit reason that will appear in this page's revision history. 256 characters max
  * @param {string} [$0.previous_revision] Determines which revision this edit should be added to. If this parameter is
  omitted, this edit is simply added to the most recent revision.
  * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
  * @example r.get_subreddit('snoowrap').get_wiki_page('index').edit({text: 'Welcome', reason: 'Added a welcome message'})
  */
  edit ({text, reason, previous_revision}) {
    return this._post({
      uri: `r/${this.subreddit.display_name}/api/wiki/edit`,
      form: {content: text, page: this.title, previous: previous_revision, reason}
    }).return(this);
  }
  /**
  * @summary Gets a list of revisions for this wiki page.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing revisions of this page
  * @example
  *
  * r.get_subreddit('snoowrap').get_revisions({limit: 1}).then(console.log)
  * // => Listing [
  * //  {
  * //    timestamp: 1460973194,
  * //    reason: 'Added a welcome message',
  * //    author: RedditUser { name: 'not_an_aardvark', id: 'k83md', ... },
  * //    page: 'index',
  * //    id: '506370b4-0508-11e6-b550-0e69f29e0c4d'
  * //  }
  * // ]
  */
  get_revisions (options) {
    return this._get_listing({uri: `r/${this.subreddit.display_name}/wiki/revisions/${this.title}`, qs: options});
  }
  /**
  * @summary Hides the given revision from this page's public revision history.
  * @param {object} $0
  * @param {string} $0.id The revision's id
  * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
  * @example r.get_subreddit('snoowrap').get_wiki_page('index').hide_revision({id: '506370b4-0508-11e6-b550-0e69f29e0c4d'})
  */
  hide_revision ({id}) {
    return this._post({
      uri: `r/${this.subreddit.display_name}/api/wiki/hide`,
      qs: {page: this.title, revision: id}
    }).return(this);
  }
  /**
  * @summary Reverts this wiki page to the given point.
  * @param {object} $0
  * @param {string} $0.id The id of the revision that this page should be reverted to
  * @returns {Promise} A Promise that fulfills with this WikiPage when the request is complete
  * @example r.get_subreddit('snoowrap').get_wiki_page('index').revert({id: '506370b4-0508-11e6-b550-0e69f29e0c4d'})
  */
  revert ({id}) {
    return this._post({
      uri: `r/${this.subreddit.display_name}/api/wiki/revert`,
      qs: {page: this.title, revision: id}
    }).return(this);
  }
  /**
  * @summary Gets a list of discussions about this wiki page.
  * @param {object} [options] Options for the resulting Listing
  * @returns {Promise} A Listing containing discussions about this page
  * @example
  *
  * r.get_subreddit('snoowrap').get_wiki_page('index').get_discussions().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  get_discussions (options) {
    return this._get_listing({uri: `r/${this.subreddit.display_name}/wiki/discussions/${this.title}`, qs: options});
  }
};

export default WikiPage;
