import RedditContent from './RedditContent'
import type {RedditUser, Subreddit, Listing} from './'
import type {ListingQuery} from './Listing'


interface Settings {
  listed: boolean
  permissionLevel: 0 | 1 | 2
  [key: string]: any
}

interface EditorSettings {
  action: 'add'|'del'
  username: string,
  [key: string]: any
}

interface WikiSettings {
  action: 'hide'|'revert',
  revision: string,
  [key: string]: any
}

interface EditOptions {
  content: string
  reason?: string
  previous?: string
  [key: string]: any
}

interface WikiPageRevision {
  reason: string|null
  revision_hidden: boolean
  page: string
  id: string
  author: RedditUser
  [key: string]: any
}

interface WikiPage {
  /** Custom */
  title: string
  /** Custom */
  subreddit: Subreddit
  content_html: string
  content_md: string
  may_revise: boolean
  reason: string|null
  revision_by: RedditUser
  revision_date: number
  revision_id: string
}

/**
 * A class representing a wiki page on a subreddit.
 *
 * **Note:** Due to a bug in reddit's CORS settings, it is not possible to fetch the contents of a wiki page on a private
 * subreddit while running snoowrap in a browser. (This issue does not apply when running snoowrap in Node.js.)
 *
 * @example
 *
 * // Get a wiki page on a given subreddit by name
 * r.getSubreddit('AskReddit').getWikiPage('rules')
 */
class WikiPage extends RedditContent<WikiPage> {
  static _name = 'WikiPage'

  _transformApiResponse (res: WikiPage) {
    res.title = this.title
    res.subreddit = this.subreddit
    return res
  }
  get _uri () {
    return `r/${this.subreddit.display_name}/wiki/${this.title}`
  }
  /**
   * @summary Gets the current settings for this wiki page.
   * @returns An Object representing the settings for this page
   * @example
   *
   * r.getSubreddit('snoowrap').getWikiPage('index').getSettings().then(console.log)
   * // => WikiPageSettings { permlevel: 0, editors: [], listed: true }
   */
  getSettings () {
    return this._get({url: `r/${this.subreddit.display_name}/wiki/settings/${this.title}`})
  }
  /**
   * @summary Edits the settings for this wiki page.
   * @param options
   * @param options.listed Determines whether this wiki page should appear on the public list of pages for this
   * subreddit.
   * @param options.permlevel Determines who should be allowed to access and edit this page `0` indicates that
   * this subreddit's default wiki settings should get used, `1` indicates that only approved wiki contributors on this subreddit
   * should be able to edit this page, and `2` indicates that only mods should be able to view and edit this page.
   * @returns A Promise that fulfills with this WikiPage when the request is complete
   * @example r.getSubreddit('snoowrap').getWikiPage('index').editSettings({listed: false, permission_level: 1})
   */
  async editSettings ({listed, permlevel, ...opts}: Settings) {
    await this._post({
      url: `r/${this.subreddit.display_name}/wiki/settings/${this.title}`,
      form: {...opts, listed, permlevel}
    })
    return this
  }
  _modifyEditor ({action, username, ...opts}: EditorSettings) {
    return this._post({
      url: `r/${this.subreddit.display_name}/api/wiki/alloweditor/${action}`,
      form: {...opts, page: this.title, username}
    })
  }
  /**
   * @summary Makes the given user an approved editor of this wiki page.
   * @param username The name of the user to be added
   * @returns A Promise that fulfills with this WikiPage when the request is complete
   * @example r.getSubreddit('snoowrap').getWikiPage('index').addEditor({name: 'actually_an_aardvark'})
   */
  async addEditor (username: string) {
    await this._modifyEditor({username, action: 'add'})
    return this
  }
  /**
   * @summary Revokes this user's approved editor status for this wiki page
   * @param username The name of the user to be removed
   * @returns A Promise that fulfills with this WikiPage when the request is complete
   * @example r.getSubreddit('snoowrap').getWikiPage('index').removeEditor({name: 'actually_an_aardvark'})
   */
  async removeEditor (username: string) {
    await this._modifyEditor({username, action: 'del'})
    return this
  }
  /**
   * @summary Edits this wiki page, or creates it if it does not exist yet.
   * @param options
   * @param options.text The new content of the page, in markdown.
   * @param {string} [options.reason] The edit reason that will appear in this page's revision history. 256 characters max
   * @param {string} [options.previousRevision] Determines which revision this edit should be added to. If this parameter is
   * omitted, this edit is simply added to the most recent revision.
   * @returns A Promise that fulfills with this WikiPage when the request is complete
   * @example r.getSubreddit('snoowrap').getWikiPage('index').edit({text: 'Welcome', reason: 'Added a welcome message'})
   */
  async edit ({content, reason, previous, ...opts}: EditOptions) {
    await this._post({
      url: `r/${this.subreddit.display_name}/api/wiki/edit`,
      form: {...opts, content, page: this.title, previous, reason}
    })
    return this
  }
  /**
   * @summary Gets a list of revisions for this wiki page.
   * @param options Options for the resulting Listing
   * @returns A Listing containing revisions of this page
   * @example
   *
   * r.getSubreddit('snoowrap').getRevisions({limit: 1}).then(console.log)
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
  getRevisions (options: ListingQuery): Promise<Listing<WikiPageRevision>> {
    return this._getListing({uri: `r/${this.subreddit.display_name}/wiki/revisions/${this.title}`, qs: options})
  }
  _modifyWiki ({action, revision, ...opts}: WikiSettings) {
    return this._post({
      url: `r/${this.subreddit.display_name}/api/wiki/${action}`,
      params: {...opts, page: this.title, revision}
    })
  }
  /**
   * @summary Hides the given revision from this page's public revision history.
   * @param revision The revision's id
   * @returns A Promise that fulfills with this WikiPage when the request is complete
   * @example r.getSubreddit('snoowrap').getWikiPage('index').hideRevision({id: '506370b4-0508-11e6-b550-0e69f29e0c4d'})
   */
  async hideRevision (revision: string) {
    await this._modifyWiki({action: 'hide', revision})
    return this
  }
  /**
   * @summary Reverts this wiki page to the given point.
   * @param revision The id of the revision that this page should be reverted to
   * @returns A Promise that fulfills with this WikiPage when the request is complete
   * @example r.getSubreddit('snoowrap').getWikiPage('index').revert({id: '506370b4-0508-11e6-b550-0e69f29e0c4d'})
   */
  async revert (revision: string) {
    await this._modifyWiki({action: 'revert', revision})
    return this
  }
  /**
   * @summary Gets a list of discussions about this wiki page.
   * @param options Options for the resulting Listing
   * @returns A Listing containing discussions about this page
   * @example
   *
   * r.getSubreddit('snoowrap').getWikiPage('index').getDiscussions().then(console.log)
   * // => Listing [
   * //  Submission { ... },
   * //  Submission { ... },
   * //  ...
   * // ]
   */
  getDiscussions (options?: ListingQuery) {
    return this._getListing({uri: `r/${this.subreddit.display_name}/wiki/discussions/${this.title}`, qs: options})
  }
}

export default WikiPage
export {Settings, EditorSettings, WikiSettings, EditOptions, WikiPageRevision}
