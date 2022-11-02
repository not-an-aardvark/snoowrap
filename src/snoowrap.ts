import stream from 'stream'
import fs from 'fs'
import {omit} from 'lodash'

import BaseRequester from './BaseRequester'
import type {Common, AppAuth, ScriptAuth, CodeAuth, All} from './BaseRequester'

import defaultObjects from './defaultObjects'
import * as objects from './objects'
import * as errors from './errors'
import {
  KINDS, MAX_LISTING_ITEMS, MODULE_NAME, USER_KEYS, SUBREDDIT_KEYS, VERSION, MIME_TYPES, SUBMISSION_ID_REGEX,
  MEDIA_TYPES, PLACEHOLDER_REGEX, type COMMENT_SORTS, type FRONTPAGE_SORTS, type SUBMISSION_SORTS
} from './constants'

import {addEmptyRepliesListing, addFullnamePrefix, handleJsonErrors} from './helper'
import {isBrowser, path, requiredArg, FormData, WebSocket} from './helpers'
import isAxiosResponse, {type AxiosResponse} from './helpers/isAxiosResponse'
import isContentTree, {type ContentTree} from './helpers/isContentTree'
import isSubmissionTree, {type SubmissionTree} from './helpers/isSubmissionTree'

import type {
  Children, Fancypants, UploadResponse, SubredditOptions, UploadMediaOptions,
  UploadInlineMediaOptions, MediaType, SubmitOptions, SubmitLinkOptions, SubmitImageOptions, SubmitVideoOptions,
  SubmitGalleryOptions, SubmitSelfpostOptions, SubmitPollOptions, SubmitCrosspostOptions, AssignFlairOptions, SelectFlairOptions
} from './interfaces'

import type {Listing, RedditUser, Submission, Subreddit, ModmailConversation, PrivateMessage} from './objects'
import type {ListingQuery, SortedListingQuery, Options} from './objects/Listing'
import MediaFile, {MediaImg, MediaVideo, MediaGif} from './objects/MediaFile'

const fetch = self.fetch
const Blob = self.Blob
const api_type = 'json'


export interface ListingOptions extends Partial<Options> {
  qs: Options['_query']
  uri: Options['_uri']
}

export interface InboxFilterQuery extends ListingQuery {
  /**
   * A filter for the inbox items. If provided, it should be one of `unread`, (unread
   * items), `messages` (i.e. PMs), `comments` (comment replies), `selfreply` (selfpost replies),
   * or `mentions` (username mentions).
   */
  filter?: 'inbox'|'unread'|'messages'|'comments'|'selfreply'|'mentions'
}

export interface SearchOptions extends SortedListingQuery {
  /** The subreddit to conduct the search on. (Custom)*/
  subreddit?: Subreddit|string
  /** The query string to search for. A string no longer than 512 characters. */
  q: string
  /** Determines how the results should be sorted. */
  sort?: typeof SUBMISSION_SORTS[number]|'relevance'|'comments'
  /** Specifies a syntax for the search. */
  syntax?: 'cloudsearch'|'lucene'|'plain'
  /** Restricts search results to the given subreddit */
  restrict_sr?: boolean
  /** A string no longer than 5 characters */
  category?: string
  include_facets?: boolean
  /** Expand subreddits */
  sr_detail?: string
  /** Comma-delimited list of result types (sr, link, user) */
  type?: string
}

type ObjectType = keyof typeof snoowrap['objects']
type Objects = {
  [Key in ObjectType]: InstanceType<typeof snoowrap['objects'][Key]>
}

/**
 * The class for a snoowrap requester.
 * A requester is the base object that is used to fetch content from reddit. Each requester contains a single set of OAuth
 * tokens.
 *
 * If constructed with a refresh token, a requester will be able to repeatedly generate access tokens as necessary, without any
 * further user intervention. After making at least one request, a requester will have the `accessToken` property, which specifies
 * the access token currently in use. It will also have a few additional properties such as `scope` (an array of scope strings)
 * and `ratelimitRemaining` (the number of requests remaining for the current 10-minute interval, in compliance with reddit's
 * [API rules](https://github.com/reddit/reddit/wiki/API).) These properties primarily exist for internal use, but they are
 * exposed since they are useful externally as well.
 */
class snoowrap extends BaseRequester {
  ['constructor']: typeof snoowrap
  static _previousSnoowrap: typeof snoowrap
  static errors = errors
  static objects = {...defaultObjects, ...objects}
  static version = VERSION
  _ownUserInfo?: RedditUser

  /**
   * @summary In browsers, restores the `window.snoowrap` property to whatever it was before this instance of snoowrap was
   * loaded. This is a no-op in Node.
   * @returns This instance of the snoowrap constructor
   * @example var snoowrap = window.snoowrap.noConflict();
   */
  static noConflict () {
    if (isBrowser) (self as any)[MODULE_NAME] = this._previousSnoowrap
    return snoowrap
  }

  _newObject<T extends ObjectType> (objectType: T, content: any[], _hasFetched?: boolean): any[]
  _newObject<T extends ObjectType> (objectType: T, content: any, _hasFetched?: boolean): Objects[T]
  _newObject<T extends ObjectType> (objectType: T, content: any[]|any, _hasFetched = false) {
    if (Array.isArray(content)) return content
    const object = snoowrap.objects[objectType] || snoowrap.objects.RedditContent
    // @ts-ignore
    return new object(content, this, _hasFetched)
  }

  _populate (responseTree: any, children: Children = {}): any {
    let nested = true, url: string

    if (isAxiosResponse(responseTree)) {
      const axiosResponse: AxiosResponse = responseTree
      url = `${axiosResponse.config.baseURL}/${axiosResponse.config.url}`
      responseTree = axiosResponse.data
      nested = false
    }

    if (typeof responseTree !== 'object' || responseTree === null) {
      return responseTree
    }

    // Map {kind: 't2', data: {name: 'some_username', ... }} to a RedditUser (e.g.) with the same properties
    if (isContentTree(responseTree)) {
      const contentTree: ContentTree = responseTree
      const populated = this._newObject(
        KINDS[contentTree.kind] || 'RedditContent',
        this._populate(contentTree.data, children),
        true
      )
      if (populated instanceof snoowrap.objects.Comment) {
        children[populated.id] = populated
      }
      if (!nested && Object.keys(children).length) {
        // @ts-ignore
        populated._children = children
      }
      if (!nested && populated instanceof snoowrap.objects.Listing) {
        populated._setUri(url!)
      }
      return populated
    }

    for (const key of Object.keys(responseTree)) {
      const value = responseTree[key]
      // Maps {author: 'some_username'} to {author: RedditUser { name: 'some_username' } }
      if (value !== null && USER_KEYS.has(key)) {
        responseTree[key] = this._newObject('RedditUser', {name: value})
      }
      if (value !== null && SUBREDDIT_KEYS.has(key)) {
        responseTree[key] = this._newObject('Subreddit', {display_name: value})
      }
      responseTree[key] = this._populate(value, children)
    }

    if (isSubmissionTree(responseTree)) {
      const submissionTree: SubmissionTree = responseTree
      if (submissionTree[1]._more && !submissionTree[1]._more.link_id) {
        submissionTree[1]._more.link_id = submissionTree[0][0].name
      }
      submissionTree[0][0].comments = submissionTree[1]
      submissionTree[0][0]._children = children
      return submissionTree[0][0]
    }

    if (!nested && Object.keys(children).length) {
      responseTree._children = children
    }

    return responseTree
  }

  async _assignFlair ({
    text,
    css_class,
    name,
    link,
    subredditName,
    ...opts
  }: AssignFlairOptions) {
    if (!name && !link) {
      throw new errors.InvalidMethodCallError('Either `name` or `link` should be provided')
    }
    return this._post({url: `r/${subredditName}/api/flair`, form: {...opts, api_type, text, css_class, link, name}})
  }

  async _selectFlair ({
    text,
    flair_template_id,
    name,
    link,
    subredditName,
    ...opts
  }: SelectFlairOptions) {
    if (!flair_template_id) {
      throw new errors.InvalidMethodCallError('No flair template ID provided')
    }
    if (!name && !link) {
      throw new errors.InvalidMethodCallError('Either `name` or `link` should be provided')
    }
    return this._post({url: `r/${subredditName}/api/selectflair`, form: {...opts, api_type, text, flair_template_id, link, name}})
  }

  // #region _getListing

  async _getListing ({uri = '', qs = {}, ...opts}: ListingOptions) {
    /**
     * When the response type is expected to be a Listing, add a `count` parameter with a very high number.
     * This ensures that reddit returns a `before` property in the resulting Listing to enable pagination.
     * (Aside from the additional parameter, this function is equivalent to snoowrap.prototype._get)
     */
    const query = {count: 9999, ...qs}
    if (qs.limit || Object.keys(opts).length) {
      const listing: Listing<any> = this._newObject('Listing', {_query: query, _uri: uri, ...opts})
      return listing.fetchMore(qs.limit || MAX_LISTING_ITEMS)
    }
    /**
     * This second case is used as a fallback in case the endpoint unexpectedly ends up returning something other than a
     * Listing (e.g. Submission#getRelated, which used to return a Listing but no longer does due to upstream reddit API
     * changes), in which case using fetchMore() as above will throw an error.
     *
     * This fallback only works if there are no other meta-properties provided for the Listing, such as _transform. If there are
     * other meta-properties,  the function will still end up throwing an error, but there's not really any good way to handle it
     * (predicting upstream changes can only go so far). More importantly, in the limited cases where it's used, the fallback
     * should have no effect on the returned results
     */
    const listing: Listing<any> = await this._get({url: uri, params: query})
    if (Array.isArray(listing)) {
      listing.filter(item => item instanceof snoowrap.objects.Comment).forEach(addEmptyRepliesListing)
    }
    return listing
  }

  /**
   * @summary Gets a list of subreddits in which the currently-authenticated user is an approved submitter.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.getContributorSubreddits().then(console.log)
   * // => Listing [
   * //  Subreddit {
   * //    display_name: 'snoowrap_testing',
   * //    title: 'snoowrap',
   * //    ...
   * //  }
   * // ]
   *
   */
  getContributorSubreddits (options: ListingQuery): Promise<Listing<Subreddit>> {
    return this._getListing({uri: 'subreddits/mine/contributor', qs: options})
  }

  /**
   * @summary Gets a list of default subreddits.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.getDefaultSubreddits().then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */
  getDefaultSubreddits (options: ListingQuery): Promise<Listing<Subreddit>> {
    return this._getListing({uri: 'subreddits/default', qs: options})
  }

  /**
   * @summary Gets a list of gold-exclusive subreddits.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.getGoldSubreddits().then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */
  getGoldSubreddits (options: ListingQuery): Promise<Listing<Subreddit>> {
    return this._getListing({uri: 'subreddits/gold', qs: options})
  }

  /**
   * @summary Gets the items in the authenticated user's inbox.
   * @param {object} [options] Filter options. Can also contain options for the resulting Listing.
   * @returns A Listing containing items in the user's inbox
   * @example
   *
   * r.getInbox().then(console.log)
   * // => Listing [
   * //  PrivateMessage { body: 'hi!', was_comment: false, first_message: null, ... },
   * //  Comment { body: 'this is a reply', link_title: 'Yay, a selfpost!', was_comment: true, ... }
   * // ]
   */
  getInbox ({filter, ...options}: InboxFilterQuery) {
    return this._getListing({uri: `message/${filter || 'inbox'}`, qs: options})
  }

  /**
   * @summary Gets a list of subreddits in which the currently-authenticated user is a moderator.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.getModeratedSubreddits().then(console.log)
   * // => Listing [
   * //  Subreddit {
   * //    display_name: 'snoowrap_testing',
   * //    title: 'snoowrap',
   * //    ...
   * //  }
   * // ]
   */
  getModeratedSubreddits (options: ListingQuery): Promise<Listing<Subreddit>> {
    return this._getListing({uri: 'subreddits/mine/moderator', qs: options})
  }

  /**
   * @summary Gets the authenticated user's modmail.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing of the user's modmail
   * @example
   *
   * r.getModmail({limit: 2}).then(console.log)
   * // => Listing [
   * //  PrivateMessage { body: '/u/not_an_aardvark has accepted an invitation to become moderator ... ', ... },
   * //  PrivateMessage { body: '/u/not_an_aardvark has been invited by /u/actually_an_aardvark to ...', ... }
   * // ]
   */
  getModmail (options: ListingQuery): Promise<Listing<PrivateMessage>> {
    return this._getListing({uri: 'message/moderator', qs: options})
  }

  /**
   * @summary Gets a list of ModmailConversations from the authenticated user's subreddits.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.getNewModmailConversations({limit: 2}).then(console.log)
   * // => Listing [
   * //  ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... },
   * //  ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... }
   * // ]
   */
  getNewModmailConversations (options: ListingQuery): Promise<Listing<ModmailConversation>> {
    return this._getListing({
      uri: 'api/mod/conversations',
      qs: options,
      _transform: (response: any) => {
        response.after = null
        response.before = null
        response.children = []

        for (const conversation of response.conversationIds) {
          response.conversations[conversation].participant = this._newObject('ModmailConversationAuthor', {
            ...response.conversations[conversation].participant
          })
          const conversationObjects = objects.ModmailConversation._getConversationObjects(
            response.conversations[conversation],
            response
          )
          const data = {
            ...conversationObjects,
            ...response.conversations[conversation]
          }
          response.children.push(this._newObject('ModmailConversation', data))
        }
        return this._newObject('Listing', response)
      }
    })
  }

  /**
   * @summary Gets a list of subreddits, arranged by age.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.getNewSubreddits().then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */
  getNewSubreddits (options: ListingQuery): Promise<Listing<Subreddit>> {
    return this._getListing({uri: 'subreddits/new', qs: options})
  }

  /**
   * @summary Gets a list of subreddits, arranged by popularity.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.getPopularSubreddits().then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */
  getPopularSubreddits (options: ListingQuery): Promise<Listing<Subreddit>> {
    return this._getListing({uri: 'subreddits/popular', qs: options})
  }

  /**
   * @summary Gets the user's sent messages.
   * @param {object} [options] options for the resulting Listing
   * @returns A Listing of the user's sent messages
   * @example
   *
   * r.getSentMessages().then(console.log)
   * // => Listing [
   * //  PrivateMessage { body: 'you have been added as an approved submitter to ...', ... },
   * //  PrivateMessage { body: 'you have been banned from posting to ...' ... }
   * // ]
   */
  getSentMessages (options?: ListingQuery): Promise<Listing<PrivateMessage>> {
    return this._getListing({uri: 'message/sent', qs: options})
  }

  /**
   * @summary Gets a list of subreddits that the currently-authenticated user is subscribed to.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.getSubscriptions({limit: 2}).then(console.log)
   * // => Listing [
   * //  Subreddit {
   * //    display_name: 'gadgets',
   * //    title: 'reddit gadget guide',
   * //    ...
   * //  },
   * //  Subreddit {
   * //    display_name: 'sports',
   * //    title: 'the sportspage of the Internet',
   * //    ...
   * //  }
   * // ]
   */
  getSubscriptions (options: ListingQuery): Promise<Listing<Subreddit>> {
    return this._getListing({uri: 'subreddits/mine/subscriber', qs: options})
  }

  /**
   * @summary Gets the authenticated user's unread messages.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing unread items in the user's inbox
   * @example
   *
   * r.getUnreadMessages().then(console.log)
   * // => Listing [
   * //  PrivateMessage { body: 'hi!', was_comment: false, first_message: null, ... },
   * //  Comment { body: 'this is a reply', link_title: 'Yay, a selfpost!', was_comment: true, ... }
   * // ]
   */
  getUnreadMessages (options?: ListingQuery) {
    return this._getListing({uri: 'message/unread', qs: options})
  }

  /**
   * @summary Conducts a search of reddit submissions.
   * @param {object} options Search options. Can also contain options for the resulting Listing.
   * @returns A Listing containing the search results.
   * @example
   *
   * r.search({
   *   q: 'Cute kittens',
   *   subreddit: 'aww',
   *   sort: 'top'
   * }).then(console.log)
   * // => Listing [
   * //  Submission { domain: 'i.imgur.com', banned_by: null, ... },
   * //  Submission { domain: 'imgur.com', banned_by: null, ... },
   * //  ...
   * // ]
   */
  search (options: SearchOptions) {
    const subreddit = options.subreddit instanceof snoowrap.objects.Subreddit
      ? options.subreddit.display_name
      : options.subreddit
    delete options.subreddit
    const qs = {syntax: 'plain', ...options}
    return this._getListing({uri: `${subreddit ? `r/${subreddit}/` : ''}search`, qs})
  }

  /**
   * @summary Searches subreddits by title and description.
   * @param {object} options Options for the search. May also contain Listing parameters.
   * @param {string} options.query The search query
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.searchSubreddits({query: 'cookies'}).then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */
  searchSubreddits (options: any) {
    options.q = options.query
    return this._getListing({uri: 'subreddits/search', qs: omit(options, 'query')})
  }

  // #endregion

  // #region _getSortedFrontpage

  _getSortedFrontpage (
    sortType: typeof FRONTPAGE_SORTS[number]|'comments',
    subredditName?: string,
    options: SortedListingQuery = {}
  ) {
    return this._getListing({uri: (subredditName ? `r/${subredditName}/` : '') + sortType, qs: options})
  }

  /**
   * @summary Gets a Listing of best posts.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing the retrieved submissions
   * @example
   *
   * r.getBest().then(console.log)
   * // => Listing [
   * //  Submission { domain: 'imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'pics' }, ... },
   * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'funny' }, ... },
   * //  ...
   * // ]
   *
   * r.getBest({limit: 1}).then(console.log)
   * // => Listing [
   * //   Submission { domain: 'self.redditdev', banned_by: null, subreddit: Subreddit { display_name: 'redditdev' }, ...}
   * // ]
   */
  getBest (options?: ListingQuery): Promise<Listing<Submission>> {
    return this._getSortedFrontpage('best', undefined, options)
  }

  /**
   * @summary Gets a Listing of controversial posts.
   * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
   * the front page of reddit.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing the retrieved submissions
   * @example
   *
   * r.getControversial('technology').then(console.log)
   * // => Listing [
   * //  Submission { domain: 'thenextweb.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... },
   * //  Submission { domain: 'pcmag.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... }
   * // ]
   */
  getControversial (subredditName?: string, options?: SortedListingQuery): Promise<Listing<Submission>> {
    return this._getSortedFrontpage('controversial', subredditName, options)
  }

  /**
   * @summary Gets a Listing of hot posts.
   * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
   * the front page of reddit.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing the retrieved submissions
   * @example
   *
   * r.getHot().then(console.log)
   * // => Listing [
   * //  Submission { domain: 'imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'pics' }, ... },
   * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'funny' }, ... },
   * //  ...
   * // ]
   *
   * r.getHot('gifs').then(console.log)
   * // => Listing [
   * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'gifs' }, ... },
   * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'gifs' }, ... },
   * //  ...
   * // ]
   *
   * r.getHot('redditdev', {limit: 1}).then(console.log)
   * // => Listing [
   * //   Submission { domain: 'self.redditdev', banned_by: null, subreddit: Subreddit { display_name: 'redditdev' }, ...}
   * // ]
   */
  getHot (subredditName?: string, options?: ListingQuery): Promise<Listing<Submission>> {
    return this._getSortedFrontpage('hot', subredditName, options)
  }

  /**
   * @summary Gets a Listing of new posts.
   * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
   * the front page of reddit.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing the retrieved submissions
   * @example
   *
   * r.getNew().then(console.log)
   * // => Listing [
   * //  Submission { domain: 'self.Jokes', banned_by: null, subreddit: Subreddit { display_name: 'Jokes' }, ... },
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  ...
   * // ]
   *
   */
  getNew (subredditName?: string, options?: ListingQuery): Promise<Listing<Submission>> {
    return this._getSortedFrontpage('new', subredditName, options)
  }

  /**
   * @summary Gets a Listing of rising posts.
   * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
   * the front page of reddit.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing the retrieved submissions
   * @example
   *
   * r.getRising('technology').then(console.log)
   * // => Listing [
   * //  Submission { domain: 'thenextweb.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... },
   * //  Submission { domain: 'pcmag.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... }
   * // ]
   */
  getRising (subredditName?: string, options?: ListingQuery): Promise<Listing<Submission>> {
    return this._getSortedFrontpage('rising', subredditName, options)
  }

  /**
   * @summary Gets a Listing of top posts.
   * @param {string} [subredditName] The subreddit to get posts from. If not provided, posts are fetched from
   * the front page of reddit.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing the retrieved submissions
   * @example
   *
   * r.getTop({t: 'all', limit: 2}).then(console.log)
   * // => Listing [
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  Submission { domain: 'imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'funny' }, ... }
   * // ]
   *
   * r.getTop('AskReddit').then(console.log)
   * // => Listing [
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  ...
   * // ]
   */
  getTop (subredditName?: string, options?: SortedListingQuery): Promise<Listing<Submission>> {
    return this._getSortedFrontpage('top', subredditName, options)
  }

  /**
   * @summary Gets a Listing of new comments.
   * @param {string} [subredditName] The subreddit to get comments from. If not provided, posts are fetched from
   * the front page of reddit.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing the retrieved comments
   * @example
   *
   * r.getNewComments().then(console.log)
   * // => Listing [
   * //  Comment { link_title: 'What amazing book should be made into a movie, but hasn\'t been yet?', ... }
   * //  Comment { link_title: 'How far back in time could you go and still understand English?', ... }
   * // ]
   */
  getNewComments (subredditName?: string, options?: ListingQuery): Promise<Listing<Comment>> {
    return this._getSortedFrontpage('comments', subredditName, options)
  }

  // #endregion

  // #region _newObject

  /**
   * @summary Mark Modmail conversations as read given the subreddit(s) and state.
   * @param subreddits
   * @param state selected state to mark as read
   * @returns {Promise<Listing<ModmailConversation>>} a Listing of ModmailConversations marked as read
   * @example
   *
   * r.bulkReadNewModmail(['AskReddit'], 'all').then(console.log)
   * // => Listing [
   * //  ModmailConversation { id: '75hxt' },
   * //  ModmailConversation { id: '75hxg' }
   * // ]
   *
   * r.bulkReadNewModmail([r.getSubreddit('AskReddit')], 'all').then(console.log)
   * // => Listing [
   * //  ModmailConversation { id: '75hxt' },
   * //  ModmailConversation { id: '75hxg' }
   * // ]
   */
  async bulkReadNewModmail (
    subreddits: (InstanceType<typeof snoowrap.objects.Subreddit>)[]|string[],
    state: 'archived'|'appeals'|'highlighted'|'notifications'|'join_requests'|'new'|'inprogress'|'mod'|'all'
  ) {
    const subredditNames = subreddits.map(s => typeof s === 'string' ? s.replace(/^\/?r\//, '') : s.display_name)
    const res = await this._post({url: 'api/mod/conversations/bulk/read', form: {
      entity: subredditNames.join(','),
      state
    }})
    return this._newObject('Listing', {
      after: null,
      before: null,
      children: res.conversation_ids.map((id: string) => this._newObject('ModmailConversation', {id}))
    }) as Listing<InstanceType<typeof snoowrap.objects.ModmailConversation>>
  }

  /**
   * @summary Create a new modmail discussion between moderators
   * @param {object} options
   * @param {string} options.body Body of the discussion
   * @param {string} options.subject Title or subject
   * @param {string} options.srName Subreddit name without fullname
   * @returns {Promise<ModmailConversation>} the created ModmailConversation
   * @example
   *
   * r.createModeratorDiscussion({
   *   body: 'test body',
   *   subject: 'test subject',
   *   srName: 'AskReddit'
   * }).then(console.log)
   * // ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... }
   */
  async createModmailDiscussion ({
    body,
    subject,
    srName
  }: {
    body: string,
    subject: string,
    srName: string
  }) {
    const parsedFromSr = srName.replace(/^\/?r\//, ''); // Convert '/r/subreddit_name' to 'subreddit_name'
    const res = await this._post({
      url: 'api/mod/conversations', form: {
        body, subject, srName: parsedFromSr
      }
    })
    // _newObject ignores most of the response, no practical way to parse the returned content yet
    return this._newObject('ModmailConversation', {id: res.conversation.id})
  }


  /**
   * @summary Gets information on a comment with a given id.
   * @param {string} commentId - The base36 id of the comment
   * @param {string|null} [submissionId] - The id of the submission that the comment belongs to. The replies
   * tree will only be available when providing this param. However you still can fetch it separately
   * @param {string} [sort] - Determines how the replies tree should be sorted. One of `confidence,
   * top, new, controversial, old, random, qa, live`
   * @returns {Comment} An unfetched Comment object for the requested comment
   * @example
   *
   * const comment = r.getComment('c0b6xx0', '92dd8', 'new')
   * // => Comment { name: 't1_c0b6xx0', link_id: 't3_92dd8', _sort: 'new' }
   * comment.fetch().then(cmt => console.log(cmt.author.name))
   * // => 'Kharos'
   */
  getComment (commentId: string, submissionId: string, sort: typeof COMMENT_SORTS[number]) {
    return this._newObject('Comment', {
      name: addFullnamePrefix(commentId, 't1_'),
      link_id: submissionId ? addFullnamePrefix(submissionId, 't3_') : null,
      _sort: sort
    })
  }

  /**
   * Gets a livethread by ID.
   * @param {string} threadId The base36 ID of the livethread
   * @returns {LiveThread} An unfetched LiveThread object
   * @example
   *
   * r.getLivethread('whrdxo8dg9n0')
   * // => LiveThread { id: 'whrdxo8dg9n0' }
   * r.getLivethread('whrdxo8dg9n0').nsfw.then(console.log)
   * // => false
   */
  getLivethread (threadId: string) {
    return this._newObject('LiveThread', {id: addFullnamePrefix(threadId, 'LiveUpdateEvent_').slice(16)})
  }

  /**
   * @summary Gets information on the requester's own user profile.
   * @returns {RedditUser} A RedditUser object corresponding to the requester's profile
   * @example
   *
   * r.getMe().then(console.log);
   * // => RedditUser { is_employee: false, has_mail: false, name: 'snoowrap_testing', ... }
   */
  async getMe () {
    const result = await this._get({url: 'api/v1/me'})
    this._ownUserInfo = this._newObject('RedditUser', result, true)
    return this._ownUserInfo!
  }

  async _getMyName () {
    return this._ownUserInfo ? this._ownUserInfo.name : (await this.getMe()).name
  }

  /**
   * @summary Gets a private message by ID.
   * @param {string} messageId The base36 ID of the message
   * @returns {PrivateMessage} An unfetched PrivateMessage object for the requested message
   * @example
   *
   * r.getMessage('51shnw')
   * // => PrivateMessage { name: 't4_51shnw' }
   * r.getMessage('51shnw').subject.then(console.log)
   * // => 'Example'
   * // See here for a screenshot of the PM in question https://i.gyazo.com/24f3b97e55b6ff8e3a74cb026a58b167.png
   */
  getMessage (messageId: string) {
    return this._newObject('PrivateMessage', {name: addFullnamePrefix(messageId, 't4_')})
  }

  /**
   * @summary Get a ModmailConversation by its id
   * @param {string} id of the ModmailConversation
   * @returns {Promise<ModmailConversation>} the requested ModmailConversation
   * @example
   *
   * r.getNewModmailConversation('75hxt').then(console.log)
   * // ModmailConversation { messages: [...], objIds: [...], ... }
   */
  getNewModmailConversation (id: string) {
    return this._newObject('ModmailConversation', {id})
  }

  /**
   * @summary Gets all moderated subreddits that have new Modmail activated
   * @returns {Promise<Listing<Subreddit>>} a Listing of ModmailConversations marked as read
   * @example
   *
   * r.getNewModmailSubreddits().then(console.log)
   * // => Listing [
   * //  Subreddit { display_name: 'tipofmytongue', ... },
   * //  Subreddit { display_name: 'EarthPorn', ... },
   * // ]
   */
  async getNewModmailSubreddits () {
    const response = await this._get({url: 'api/mod/conversations/subreddits'})
    return Object.values(response.subreddits).map(s => this._newObject('Subreddit', s))
  }

  /**
   * @summary Gets information on a given submission.
   * @param {string} submissionId - The base36 id of the submission
   * @param {string} [sort] - Determines how the comments tree should be sorted. One of `confidence,
   * top, new, controversial, old, random, qa, live`
   * @returns {Submission} An unfetched Submission object for the requested submission
   * @example
   *
   * const submission = r.getSubmission('2np694', 'top')
   * // => Submission { name: 't3_2np694', _sort: 'top' }
   * submission.fetch().then(sub => console.log(sub.title))
   * // => 'What tasty food would be distusting if eaten over rice?'
   */
  getSubmission (submissionId: string, sort?: typeof COMMENT_SORTS[number]) {
    return this._newObject('Submission', {name: addFullnamePrefix(submissionId, 't3_'), _sort: sort})
  }

  /**
   * @summary Gets information on a given subreddit.
   * @param {string} displayName - The name of the subreddit (e.g. 'AskReddit')
   * @returns {Subreddit} An unfetched Subreddit object for the requested subreddit
   * @example
   *
   * r.getSubreddit('AskReddit')
   * // => Subreddit { display_name: 'AskReddit' }
   * r.getSubreddit('AskReddit').created_utc.then(console.log)
   * // => 1201233135
   */
  getSubreddit (displayName: string) {
    return this._newObject('Subreddit', {display_name: displayName.replace(/^\/?r\//, '')})
  }

  /**
   * @summary Gets information on a reddit user with a given name.
   * @param {string} name - The user's username
   * @returns {RedditUser} An unfetched RedditUser object for the requested user
   * @example
   *
   * r.getUser('not_an_aardvark')
   * // => RedditUser { name: 'not_an_aardvark' }
   * r.getUser('not_an_aardvark').link_karma.then(console.log)
   * // => 6
   */
  getUser (name: string) {
    return this._newObject('RedditUser', {name: (name + '').replace(/^\/?u\//, '')})
  }

  // #endregion

  // #region rest

  /**
   * @summary Determines whether the currently-authenticated user needs to fill out a captcha in order to submit content.
   * @returns A Promise that resolves with a boolean value
   * @example
   *
   * r.checkCaptchaRequirement().then(console.log)
   * // => false
   */
  checkCaptchaRequirement () {
    return this._get({url: 'api/needs_captcha'})
  }

  /**
   * @summary Gets the identifier (a hex string) for a new captcha image.
   * @returns A Promise that resolves with a string
   * @example
   *
   * r.getNewCaptchaIdentifier().then(console.log)
   * // => 'o5M18uy4mk0IW4hs0fu2GNPdXb1Dxe9d'
   */
  async getNewCaptchaIdentifier () {
    const res = await this._post({url: 'api/new_captcha', form: {api_type}})
    return res.json.data.iden
  }

  /**
   * @summary Gets an image for a given captcha identifier.
   * @param {string} identifier The captcha identifier.
   * @returns A string containing raw image data in PNG format
   * @example
   *
   * r.getCaptchaImage('o5M18uy4mk0IW4hs0fu2GNPdXb1Dxe9d').then(console.log)
   // => (A long, incoherent string representing the image in PNG format)
   */
  getCaptchaImage (identifier: string) {
    return this._get({url: `captcha/${identifier}`})
  }

  /**
   * @summary Checks whether a given username is available for registration
   * @desc **Note:** This function will not work when snoowrap is running in a browser, due to an issue with reddit's CORS
   * settings.
   * @param {string} name The username in question
   * @returns A Promise that fulfills with a Boolean (`true` or `false`)
   * @example
   *
   * r.checkUsernameAvailability('not_an_aardvark').then(console.log)
   * // => false
   * r.checkUsernameAvailability('eqwZAr9qunx7IHqzWVeF').then(console.log)
   * // => true
   */
  checkUsernameAvailability (name: string) {
    // The oauth endpoint listed in reddit's documentation doesn't actually work, so just send an unauthenticated request.
    return this.unauthenticatedRequest({url: 'api/username_available.json', params: {user: name}})
  }

  /**
   * @summary Composes a new private message.
   * @param {object} options
   * @param {RedditUser|Subreddit|string} options.to The recipient of the message.
   * @param {string} options.subject The message subject (100 characters max)
   * @param {string} options.text The body of the message, in raw markdown text
   * @param {Subreddit|string} [options.fromSubreddit] If provided, the message is sent as a modmail from the specified
   * subreddit.
   * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
   * requires a captcha to submit posts and comments.
   * @param {string} [options.captchaResponse] The response to the captcha with the given identifier
   * @returns A Promise that fulfills when the request is complete
   * @example
   *
   * r.composeMessage({
   *   to: 'actually_an_aardvark',
   *   subject: "Hi, how's it going?",
   *   text: 'Long time no see'
   * })
   * // (message created on reddit)
   */
  async composeMessage ({
    to,
    subject,
    text,
    fromSubreddit,
    captchaIden,
    captchaResponse
  }: {
    to: InstanceType<typeof snoowrap.objects.RedditUser|typeof snoowrap.objects.Subreddit>|string,
    subject: string,
    text: string,
    fromSubreddit: InstanceType<typeof snoowrap.objects.Subreddit>|string,
    captchaIden: string,
    captchaResponse: string
  }) {
    let parsedTo = to
    let parsedFromSr = fromSubreddit
    if (to instanceof snoowrap.objects.RedditUser) {
      parsedTo = to.name
    } else if (to instanceof snoowrap.objects.Subreddit) {
      parsedTo = `/r/${to.display_name}`
    }
    if (fromSubreddit instanceof snoowrap.objects.Subreddit) {
      parsedFromSr = fromSubreddit.display_name
    } else if (typeof fromSubreddit === 'string') {
      parsedFromSr = fromSubreddit.replace(/^\/?r\//, '') // Convert '/r/subreddit_name' to 'subreddit_name'
    }
    const result = await this._post({
      url: 'api/compose', form: {
        api_type, captcha: captchaResponse, iden: captchaIden, from_sr: parsedFromSr, subject, text, to: parsedTo
      }
    })
    handleJsonErrors(result)
    return result
  }

  /**
   * @summary Creates a new LiveThread.
   * @param {object} options
   * @param {string} options.title The title of the livethread (100 characters max)
   * @param {string} [options.description] A descriptions of the thread. 120 characters max
   * @param {string} [options.resources] Information and useful links related to the thread. 120 characters max
   * @param {boolean} [options.nsfw=false] Determines whether the thread is Not Safe For Work
   * @returns A Promise that fulfills with the new LiveThread when the request is complete
   * @example
   *
   * r.createLivethread({title: 'My livethread'}).then(console.log)
   * // => LiveThread { id: 'wpimncm1f01j' }
   */
  async createLivethread ({
    title,
    description,
    resources,
    nsfw = false
  }: {
    title: string,
    description: string,
    resources: string,
    nsfw: boolean
  }) {
    const result = await this._post({
      url: 'api/live/create',
      form: {api_type, description, nsfw, resources, title}
    })
    handleJsonErrors(result)
    return this.getLivethread(result.json.data.id)
  }

  /**
   * @summary Creates a new multireddit.
   * @param {object} options
   * @param {string} options.name The name of the new multireddit. 50 characters max
   * @param {string} options.description A description for the new multireddit, in markdown.
   * @param {Array} options.subreddits An Array of Subreddit objects (or subreddit names) that this multireddit should compose of
   * @param {string} [options.visibility='private'] The multireddit's visibility setting. One of `private`, `public`, `hidden`.
   * @param {string} [options.icon_name=''] One of `art and design`, `ask`, `books`, `business`, `cars`, `comics`,
   * `cute animals`, `diy`, `entertainment`, `food and drink`, `funny`, `games`, `grooming`, `health`, `life advice`, `military`,
   * `models pinup`, `music`, `news`, `philosophy`, `pictures and gifs`, `science`, `shopping`, `sports`, `style`, `tech`,
   * `travel`, `unusual stories`, `video`, `None`
   * @param {string} [options.key_color='#000000'] A six-digit RGB hex color, preceded by '#'
   * @param {string} [options.weighting_scheme='classic'] One of `classic`, `fresh`
   * @returns A Promise for the newly-created MultiReddit object
   * @example
   *
   * r.createMultireddit({
   *   name: 'myMulti',
   *   description: 'An example multireddit',
   *   subreddits: ['snoowrap', 'snoowrap_testing']
   * }).then(console.log)
   * => MultiReddit { display_name: 'myMulti', ... }
   */
  createMultireddit ({
    name,
    description,
    subreddits,
    visibility = 'private',
    icon_name = '',
    key_color = '#000000',
    weighting_scheme = 'classic'
  }: {
    name: string,
    description: string,
    subreddits: InstanceType<typeof snoowrap.objects.Subreddit>[]|string[],
    visibility: string,
    icon_name: string,
    key_color: string,
    weighting_scheme:string
  }) {
    return this._post({
      url: 'api/multi', form: {
        model: JSON.stringify({
          display_name: name,
          description_md: description,
          icon_name,
          key_color,
          subreddits: subreddits.map(sub => ({name: typeof sub === 'string' ? sub : sub.display_name})),
          visibility,
          weighting_scheme
        })
      }
    })
  }

  async _createOrEditSubreddit ({
    name,
    title,
    public_description,
    description,
    allow_images = true,
    allow_top = true,
    captcha,
    captcha_iden,
    collapse_deleted_comments = false,
    comment_score_hide_mins = 0,
    exclude_banned_modqueue = false,
    'header-title': header_title,
    hide_ads = false,
    lang = 'en',
    link_type = 'any',
    over_18 = false,
    public_traffic = false,
    show_media = false,
    show_media_preview = true,
    spam_comments = 'high',
    spam_links = 'high',
    spam_selfposts = 'high',
    spoilers_enabled = false,
    sr,
    submit_link_label = '',
    submit_text_label = '',
    submit_text = '',
    suggested_comment_sort = 'confidence',
    type = 'public',
    wiki_edit_age,
    wiki_edit_karma,
    wikimode = 'modonly',
    ...otherKeys
  }: SubredditOptions) {
    const res = await this._post({
      url: 'api/site_admin', form: {
        allow_images, allow_top, api_type, captcha, collapse_deleted_comments, comment_score_hide_mins, description,
        exclude_banned_modqueue, 'header-title': header_title, hide_ads, iden: captcha_iden, lang, link_type, name,
        over_18, public_description, public_traffic, show_media, show_media_preview, spam_comments, spam_links,
        spam_selfposts, spoilers_enabled, sr, submit_link_label, submit_text, submit_text_label, suggested_comment_sort,
        title, type, wiki_edit_age, wiki_edit_karma, wikimode,
        ...otherKeys
      }
    })
    handleJsonErrors(res)
    return this.getSubreddit(name || sr)
  }

  /**
   * @summary Creates a new subreddit.
   * @param {object} options
   * @param {string} options.name The name of the new subreddit
   * @param {string} options.title The text that should appear in the header of the subreddit
   * @param {string} options.public_description The text that appears with this subreddit on the search page, or on the
   * blocked-access page if this subreddit is private. (500 characters max)
   * @param {string} options.description The sidebar text for the subreddit. (5120 characters max)
   * @param {string} [options.submit_text=''] The text to show below the submission page (1024 characters max)
   * @param {boolean} [options.hide_ads=false] Determines whether ads should be hidden on this subreddit. (This is only
   * allowed for gold-only subreddits.)
   * @param {string} [options.lang='en'] The language of the subreddit (represented as an IETF language tag)
   * @param {string} [options.type='public'] Determines who should be able to access the subreddit. This should be one of
   * `public, private, restricted, gold_restricted, gold_only, archived, employees_only`.
   * @param {string} [options.link_type='any'] Determines what types of submissions are allowed on the subreddit. This should
   * be one of `any, link, self`.
   * @param {string} [options.submit_link_label=undefined] Custom text to display on the button that submits a link. If
   * this is omitted, the default text will be displayed.
   * @param {string} [options.submit_text_label=undefined] Custom text to display on the button that submits a selfpost. If
   * this is omitted, the default text will be displayed.
   * @param {string} [options.wikimode='modonly'] Determines who can edit wiki pages on the subreddit. This should be one of
   * `modonly, anyone, disabled`.
   * @param {number} [options.wiki_edit_karma=0] The minimum amount of subreddit karma needed for someone to edit this
   * subreddit's wiki. (This is only relevant if `options.wikimode` is set to `anyone`.)
   * @param {number} [options.wiki_edit_age=0] The minimum account age (in days) needed for someone to edit this subreddit's
   * wiki. (This is only relevant if `options.wikimode` is set to `anyone`.)
   * @param {string} [options.spam_links='high'] The spam filter strength for links on this subreddit. This should be one of
   * `low, high, all`.
   * @param {string} [options.spam_selfposts='high'] The spam filter strength for selfposts on this subreddit. This should be
   * one of `low, high, all`.
   * @param {string} [options.spam_comments='high'] The spam filter strength for comments on this subreddit. This should be one
   * of `low, high, all`.
   * @param {boolean} [options.over_18=false] Determines whether this subreddit should be classified as NSFW
   * @param {boolean} [options.allow_top=true] Determines whether the new subreddit should be able to appear in /r/all and
   * trending subreddits
   * @param {boolean} [options.show_media=false] Determines whether image thumbnails should be enabled on this subreddit
   * @param {boolean} [options.show_media_preview=true] Determines whether media previews should be expanded by default on this
   * subreddit
   * @param {boolean} [options.allow_images=true] Determines whether image uploads and links to image hosting sites should be
   * enabled on this subreddit
   * @param {boolean} [options.exclude_banned_modqueue=false] Determines whether posts by site-wide banned users should be
   * excluded from the modqueue.
   * @param {boolean} [options.public_traffic=false] Determines whether the /about/traffic page for this subreddit should be
   * viewable by anyone.
   * @param {boolean} [options.collapse_deleted_comments=false] Determines whether deleted and removed comments should be
   * collapsed by default
   * @param {string} [options.suggested_comment_sort=undefined] The suggested comment sort for the subreddit. This should be
   * one of `confidence, top, new, controversial, old, random, qa`. If left blank, there will be no suggested sort,
   * which means that users will see the sort method that is set in their own preferences (usually `confidence`.)
   * @param {boolean} [options.spoilers_enabled=false] Determines whether users can mark their posts as spoilers
   * @returns A Promise for the newly-created subreddit object.
   * @example
   *
   * r.createSubreddit({
   *   name: 'snoowrap_testing2',
   *   title: 'snoowrap testing: the sequel',
   *   public_description: 'thanks for reading the snoowrap docs!',
   *   description: 'This text will go on the sidebar',
   *   type: 'private'
   * }).then(console.log)
   * // => Subreddit { display_name: 'snoowrap_testing2' }
   * // (/r/snoowrap_testing2 created on reddit)
   */
  createSubreddit (options: SubredditOptions) {
    return this._createOrEditSubreddit(options)
  }


  /**
   * @summary Gets the list of people that the currently-authenticated user has blocked.
   * @returns A Promise that resolves with a list of blocked users
   * @example
   *
   * r.getBlockedUsers().then(console.log)
   * // => [ RedditUser { date: 1457928120, name: 'actually_an_aardvark', id: 't2_q3519' } ]
   */
  getBlockedUsers () {
    return this._get({url: 'prefs/blocked'})
  }

  /**
   *  @summary Get list of content by IDs. Returns a listing of the requested content.
   *  @param ids An array of content IDs. Can include the id itself, or a Submission or Comment object.
   *  can get a post and a comment
   *  @returns {Promise<Listing<Submission|Comment>>} A listing of content requested, can be any class fetchable by API. e.g. Comment, Submission
   *  @example
   *
   * r.getContentByIds(['t3_9l9vof', 't3_9la341']).then(console.log);
   * // => Listing [
   * //  Submission { approved_at_utc: null, ... }
   * //  Submission { approved_at_utc: null, ... }
   * // ]
   *
   * r.getContentByIds([r.getSubmission('9l9vof'), r.getSubmission('9la341')]).then(console.log);
   * // => Listing [
   * //  Submission { approved_at_utc: null, ... }
   * //  Submission { approved_at_utc: null, ... }
   * // ]
  */
  getContentByIds (ids: (string|Submission|Comment)[]) {
    if (!Array.isArray(ids)) {
      throw new TypeError('Invalid argument: Argument needs to be an array.')
    }

    const prefixedIds = ids.map(id => {
      if (id instanceof snoowrap.objects.Submission || id instanceof snoowrap.objects.Comment) {
        return id.name
      } else if (typeof id === 'string') {
        if (!/t(1|3)_/g.test(id)) {
          throw new TypeError('Invalid argument: Ids need to include Submission or Comment prefix, e.g. t1_, t3_.');
        }
        return id
      }
      throw new TypeError('Id must be either a string, Submission, or Comment.')
    })

    return this._get({url: '/api/info', params: {id: prefixedIds.join(',')}})
  }

  /**
   * @summary Gets the list of the currently-authenticated user's friends.
   * @returns A Promise that resolves with a list of friends
   * @example
   *
   * r.getFriends().then(console.log)
   * // => [ [ RedditUser { date: 1457927963, name: 'not_an_aardvark', id: 't2_k83md' } ], [] ]
   */
  getFriends () {
    return this._get({url: 'prefs/friends'})
  }

  /**
   * @summary Gets a distribution of the requester's own karma distribution by subreddit.
   * @returns A Promise for an object with karma information
   * @example
   *
   * r.getKarma().then(console.log)
   * // => [
   * //  { sr: Subreddit { display_name: 'redditdev' }, comment_karma: 16, link_karma: 1 },
   * //  { sr: Subreddit { display_name: 'programming' }, comment_karma: 2, link_karma: 1 },
   * //  ...
   * // ]
   */
  getKarma () {
    return this._get({url: 'api/v1/me/karma'})
  }



  /**
   * @summary Gets the user's own multireddits.
   * @returns A Promise for an Array containing the requester's MultiReddits.
   * @example
   *
   * r.getMyMultireddits().then(console.log)
   * => [ MultiReddit { ... }, MultiReddit { ... }, ... ]
   */
  getMyMultireddits () {
    return this._get({url: 'api/multi/mine', params: {expand_srs: true}})
  }

  /**
   * @summary Gets the currently-authenticated user's trophies.
   * @returns A TrophyList containing the user's trophies
   * @example
   *
   * r.getMyTrophies().then(console.log)
   * // => TrophyList { trophies: [
   * //   Trophy { icon_70: 'https://s3.amazonaws.com/redditstatic/award/verified_email-70.png',
   * //     description: null,
   * //     url: null,
   * //     icon_40: 'https://s3.amazonaws.com/redditstatic/award/verified_email-40.png',
   * //     award_id: 'o',
   * //     id: '16fn29',
   * //     name: 'Verified Email'
   * //   }
   * // ] }
   */
  getMyTrophies () {
    return this._get({url: 'api/v1/me/trophies'})
  }

  /**
   * @summary Gets a list of all oauth scopes supported by the reddit API.
   * @desc **Note**: This lists every single oauth scope. To get the scope of this requester, use the `scope` property instead.
   * @returns An object containing oauth scopes.
   * @example
   *
   * r.getOauthScopeList().then(console.log)
   * // => {
   * //  creddits: {
   * //    description: 'Spend my reddit gold creddits on giving gold to other users.',
   * //    id: 'creddits',
   * //    name: 'Spend reddit gold creddits'
   * //  },
   * //  modcontributors: {
   * //    description: 'Add/remove users to approved submitter lists and ban/unban or mute/unmute users from ...',
   * //    id: 'modcontributors',
   * //    name: 'Approve submitters and ban users'
   * //  },
   * //  ...
   * // }
   */
  getOauthScopeList () {
    return this._get({url: 'api/v1/scopes'})
  }

  /**
   * @summary Gets information on the user's current preferences.
   * @returns A promise for an object containing the user's current preferences
   * @example
   *
   * r.getPreferences().then(console.log)
   * // => { default_theme_sr: null, threaded_messages: true, hide_downs: false, ... }
   */
  getPreferences () {
    return this._get({url: 'api/v1/me/prefs'})
  }

  /**
   * @summary Gets a single random Submission.
   * @desc **Notes**: This function will not work when snoowrap is running in a browser, because the reddit server sends a
   * redirect which cannot be followed by a CORS request. Also, due to a known API issue, this function won't work with subreddits
   * excluded from /r/all, since the reddit server returns the subreddit itself instead of a random submission, in this case
   * the function will return `null`.
   * @param {string} [subredditName] The subreddit to get the random submission. If not provided, the post is fetched from
   * the front page of reddit.
   * @returns {Promise|null} The retrieved Submission object when available
   * @example
   *
   * r.getRandomSubmission('aww').then(console.log)
   * // => Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'aww' }, ... }
   */
  async getRandomSubmission (subredditName: string) {
    const res = await this._get({url: `${subredditName ? `r/${subredditName}/` : ''}random`})
    return res instanceof snoowrap.objects.Submission ? res : null
  }

  /**
   * @summary Gets an array of categories that items can be saved in. (Requires reddit gold)
   * @returns An array of categories
   * @example
   *
   * r.getSavedCategories().then(console.log)
   * // => [ { category: 'cute cat pictures' }, { category: 'interesting articles' } ]
   */
  async getSavedCategories () {
    const res = await this._get({url: 'api/saved_categories'})
    return res.categories
  }

  /**
   * @summary Gets the "happening now" LiveThread, if it exists
   * @desc This is the LiveThread that is occasionally linked at the top of reddit.com, relating to current events.
   * @returns A Promise that fulfills with the "happening now" LiveThread if it exists, or rejects with a 404 error
   * otherwise.
   * @example r.getCurrentEventsLivethread().then(thread => thread.stream.on('update', console.log))
   */
  getStickiedLivethread () {
    return this._get({url: 'api/live/happening_now'})
  }

  /**
   * @summary Represents the unread count in a {@link ModmailConversation}. Each of these properties
   * correspond to the amount of unread conversations of that type.
   * @typedef {Object} UnreadCount
   * @property {number} highlighted
   * @property {number} notifications
   * @property {number} archived
   * @property {number} new
   * @property {number} inprogress
   * @property {number} mod
   */

  /**
   * @summary Retrieves an object of unread Modmail conversations for each state.
   * @returns {UnreadCount} unreadCount
   * @example
   *
   * r.getUnreadNewModmailConversationsCount().then(console.log)
   * // => {
   * //  archived: 1,
   * //  appeals: 1,
   * //  highlighted: 0,
   * //  notifications: 0,
   * //  join_requests: 0,
   * //  new: 2,
   * //  inprogress: 5,
   * //  mod: 1,
   * // }
   */
  getUnreadNewModmailConversationsCount () {
    return this._get({url: 'api/mod/conversations/unread/count'})
  }

  /**
   * @summary Marks a list of submissions as 'visited'.
   * @desc **Note**: This endpoint only works if the authenticated user is subscribed to reddit gold.
   * @param {Submission[]} submission A list of Submission objects to mark
   * @returns A Promise that fulfills when the request is complete
   * @example
   *
   * var submissions = [r.getSubmission('4a9u54'), r.getSubmission('4a95nb')]
   * r.markAsVisited(submissions)
   * // (the links will now appear purple on reddit)
   */
  markAsVisited (submission: Submission[]) {
    return this._post({url: 'api/store_visits', form: {links: submission.map(sub => sub.name).join(',')}})
  }

  /**
   * @summary Marks all of the given messages as read.
   * @param {PrivateMessage[]|String[]} messages An Array of PrivateMessage or Comment objects. Can also contain strings
   * representing message or comment IDs. If strings are provided, they are assumed to represent PrivateMessages unless a fullname
   * prefix such as `t1_` is specified.
   * @returns A Promise that fulfills when the request is complete
   * @example
   *
   * r.markMessagesAsRead(['51shsd', '51shxv'])
   *
   * // To reference a comment by ID, be sure to use the `t1_` prefix, otherwise snoowrap will be unable to distinguish the
   * // comment ID from a PrivateMessage ID.
   * r.markMessagesAsRead(['t5_51shsd', 't1_d3zhb5k'])
   *
   * // Alternatively, just pass in a comment object directly.
   * r.markMessagesAsRead([r.getMessage('51shsd'), r.getComment('d3zhb5k')])
   */
  markMessagesAsRead (messages: InstanceType<typeof snoowrap.objects.PrivateMessage>[]|string[]) {
    const messageIds = messages.map(message => addFullnamePrefix(message, 't4_'))
    return this._post({url: 'api/read_message', form: {id: messageIds.join(',')}})
  }

  /**
   * @summary Marks all of the given messages as unread.
   * @param {PrivateMessage[]|String[]} messages An Array of PrivateMessage or Comment objects. Can also contain strings
   * representing message IDs. If strings are provided, they are assumed to represent PrivateMessages unless a fullname prefix such
   * as `t1_` is included.
   * @returns A Promise that fulfills when the request is complete
   * @example
   *
   * r.markMessagesAsUnread(['51shsd', '51shxv'])
   *
   * // To reference a comment by ID, be sure to use the `t1_` prefix, otherwise snoowrap will be unable to distinguish the
   * // comment ID from a PrivateMessage ID.
   * r.markMessagesAsUnread(['t5_51shsd', 't1_d3zhb5k'])
   *
   * // Alternatively, just pass in a comment object directly.
   * r.markMessagesAsRead([r.getMessage('51shsd'), r.getComment('d3zhb5k')])
   */
  markMessagesAsUnread (messages: InstanceType<typeof snoowrap.objects.PrivateMessage>[]|string[]) {
    const messageIds = messages.map(message => addFullnamePrefix(message, 't4_'));
    return this._post({url: 'api/unread_message', form: {id: messageIds.join(',')}});
  }

  /**
   * @summary Marks all conversations in array as read.
   * @param {ModmailConversation[]} conversations to mark as read
   * @example
   *
   * r.markNewModmailConversationsAsRead(['pics', 'sweden'])
   */
  markNewModmailConversationsAsRead (conversations: InstanceType<typeof snoowrap.objects.ModmailConversation>[]|string[]) {
    const conversationIds = conversations.map(message => addFullnamePrefix(message, ''));
    return this._post({url: 'api/mod/conversations/read', form: {conversationIds: conversationIds.join(',')}});
  }

  /**
   * @summary Marks all conversations in array as unread.
   * @param {ModmailConversation[]} conversations to mark as unread
   * @example
   *
   * r.markNewModmailConversationsAsUnread(['pics', 'sweden'])
   */
  markNewModmailConversationsAsUnread (conversations: InstanceType<typeof snoowrap.objects.ModmailConversation>[]|string[]) {
    const conversationIds = conversations.map(message => addFullnamePrefix(message, ''));
    return this._post({url: 'api/mod/conversations/unread', form: {conversationIds: conversationIds.join(',')}});
  }

  /**
   * @summary Marks all of the user's messages as read.
   * @desc **Note:** The reddit.com site imposes a ratelimit of approximately 1 request every 10 minutes on this endpoint.
   * Further requests will cause the API to return a 429 error.
   * @returns A Promise that resolves when the request is complete
   * @example
   *
   * r.readAllMessages().then(function () {
   *   r.getUnreadMessages().then(console.log)
   * })
   * // => Listing []
   * // (messages marked as 'read' on reddit)
   */
  readAllMessages () {
    return this._post({url: 'api/read_all_messages'});
  }

  /**
   * @summary Searches for subreddits given a query.
   * @param {object} options
   * @param {string} options.query A search query (50 characters max)
   * @param {boolean} [options.exact=false] Determines whether the results shouldbe limited to exact matches.
   * @param {boolean} [options.includeNsfw=true] Determines whether the results should include NSFW subreddits.
   * @returns An Array containing subreddit names
   * @example
   *
   * r.searchSubredditNames({query: 'programming'}).then(console.log)
   * // => [
   * //  'programming',
   * //  'programmingcirclejerk',
   * //  'programminghorror',
   * //  ...
   * // ]
   */
  async searchSubredditNames ({exact = false, include_nsfw = true, query = ''}) {
    const res = await this._post({url: 'api/search_reddit_names', params: {exact, include_over_18: include_nsfw, query}});
    return res.names;
  }

  /**
   * @summary Updates the user's current preferences.
   * @param {object} updatedPreferences An object of the form {[some preference name]: 'some value', ...}. Any preference
   * not included in this object will simply retain its current value.
   * @returns A Promise that fulfills when the request is complete
   * @example
   *
   * r.updatePreferences({threaded_messages: false, hide_downs: true})
   * // => { default_theme_sr: null, threaded_messages: false, hide_downs: true, ... }
   * // (preferences updated on reddit)
   */
  updatePreferences (updatedPreferences: any) {
    return this._patch({url: 'api/v1/me/prefs', data: updatedPreferences})
  }

  // #endregion

  // #region _submit

  /**
   * @summary Convert `markdown` to `richtext_json` format that used on the fancypants editor. This format allows
   * to embed inline media on selfposts.
   * @param {string} markdown The Markdown text to convert.
   * @returns A Promise that fulfills with an object in `richtext_json` format.
   * @example
   *
   * r.convertToFancypants('Hello **world**!').then(console.log)
   * // => object {document: Array(1)}
   */
  async convertToFancypants (markdown: string) {
    const response: Fancypants = await this._post({
      url: 'api/convert_rte_body_format',
      form: {
        output_mode: 'rtjson',
        markdown_text: markdown
      }
    })
    return response
  }

  /**
   * @summary Upload media to reddit (Undocumented endpoint).
   * @desc **NOTE**: This method won't work on browsers that don't support the Fetch API natively since it requires to perform
   * a 'no-cors' request which is impossible with the XMLHttpRequest API.
   * @param options An object contains the media file to upload.
   * @return A Promise that fulfills with an instance of {@link MediaImg} / {@link MediaVideo} / {@link MediaGif} / {@link MediaFile}
   * depending on the value of `options.type`. Or `null` when `options.validateOnly` is set to `true`.
   * @example
   *
   * const blob = await (await fetch("https://example.com/video.mp4")).blob()
   * r.uploadMedia({
   *   file: blob,
   *   name: 'video.mp4',
   *   type: 'gif',
   *   caption: 'This is a silent video!'
   * }).then(console.log)
   * // => MediaGif
   *
   * r.uploadMedia({
   *   file: './meme.jpg',
   *   caption: 'Funny!',
   *   outboundUrl: 'https://example.com'
   * }).then(console.log)
   * // => MediaFile
   */
  async uploadMedia<T extends UploadMediaOptions & {validateOnly: true}>(options: T): Promise<null>
  async uploadMedia<T extends UploadMediaOptions & {type?: undefined}>(options: T): Promise<MediaFile>
  async uploadMedia<T extends UploadMediaOptions>(options: T): Promise<MediaType[Exclude<T['type'], undefined>]>
  async uploadMedia ({file, name, type, caption, outboundUrl, validateOnly = false}: UploadMediaOptions) {
    if (isBrowser && !fetch) {
      throw new errors.InvalidMethodCallError('Your browser doesn\'t support \'no-cors\' requests')
    }
    if (isBrowser && typeof file === 'string') {
      throw new errors.InvalidMethodCallError('\'options.file\' cannot be a \'string\' on browser')
    }
    // `File` is an instance of `Blob`, so one check for `Blob` is enough
    if (typeof file !== 'string' && !(stream && file instanceof stream.Readable) && !(Blob && file instanceof Blob)) {
      throw new errors.InvalidMethodCallError('\'options.file\' must be one of: \'string\', \'stream.Readable\', \'Blob\', or a \'File\'')
    }
    const parsedFile = typeof file === 'string' ? fs && fs.createReadStream(file) : file
    const fileName = typeof file === 'string' ? path.basename(file) : (file as {name?: string}).name || name
    if (!fileName) requiredArg('options.name')
    const fileExt = path.extname(fileName!).replace('.', '') || 'jpeg' // Default to JPEG
    const mimetype = Blob && file instanceof Blob ? file.type || MIME_TYPES[fileExt as keyof typeof MIME_TYPES] : ''
    const expectedPrefix = MEDIA_TYPES[type!]
    if (expectedPrefix && mimetype.split('/')[0] !== expectedPrefix) {
      throw new errors.InvalidMethodCallError(`Expected a MIMETYPE for the file '${fileName}' starting with '${expectedPrefix}' but got '${mimetype}'`)
    }
    // Todo: The file size should be checked
    if (validateOnly) return null
    const uploadResponse: UploadResponse = await this._post({
      url: 'api/media/asset.json',
      form: {
        filepath: fileName,
        mimetype
      }
    })
    const uploadURL = 'https:' + uploadResponse.args.action
    const fileDetails = {
      fileUrl: uploadURL + '/' + uploadResponse.asset.asset_id,
      mediaId: uploadResponse.asset.asset_id,
      websocketUrl: uploadResponse.asset.websocket_url,
      caption,
      outboundUrl
    }
    const formdata = new FormData()
    uploadResponse.args.fields.forEach(item => formdata.append(item.name, item.value))
    formdata.append('file', parsedFile, fileName)
    let res
    if (isBrowser) {
      res = await fetch(uploadURL, {
        method: 'post',
        mode: 'no-cors',
        body: formdata as any
      })
      this._debug('Response:', res)
      /**
       * Todo: Since the response of 'no-cors' requests cannot contain the status code, the uploaded file should be validated
       * by setting `fileDetails.fileUrl` as the `src` attribute of an img/video element and listening to the load event.
       */
    } else {
      const contentLength = await new Promise<number>((resolve, reject) => {
        formdata.getLength((err, length) => {
          if (err) reject(err)
          resolve(length)
        })
      })
      res = await this.rawRequest({
        url: uploadURL,
        method: 'post',
        headers: {
          'user-agent': this.user_agent,
          'content-type': `multipart/form-data; boundary=${formdata.getBoundary()}`,
          'content-length': contentLength
        },
        data: formdata,
        _r: this
      })
    }
    let media
    switch (type) {
      case 'img':
        media = new MediaImg(fileDetails)
        break
      case 'video':
        media = new MediaVideo(fileDetails)
        break
      case 'gif':
        media = new MediaGif(fileDetails)
        break
      default:
        media = new MediaFile(fileDetails)
        break
    }
    return media
  }

  async _submit ({
    sr,
    kind,
    title,
    url,
    video_poster_url,
    websocketUrl,
    items,
    text,
    richtext_json,
    options,
    duration,
    crosspost_fullname,
    resubmit = true,
    sendreplies = true,
    nsfw = false,
    spoiler = false,
    flair_id,
    flair_text,
    collection_id,
    discussion_type,
    iden,
    captcha,
    ...opts
  }: Partial<SubmitOptions>) {
    let ws: WebSocket
    if (websocketUrl) {
      ws = new WebSocket(websocketUrl)
      await new Promise((resolve, reject) => {
        ws.onopen = resolve
        ws.onerror = () => reject(new errors.WebSocketError('Websocket error.'))
      })
      ws.onerror = null
    }

    /**
     * Todo: still unsure if `options.resubmit` is supported on gallery/poll submissions
     */
    let result
    switch (kind) {
      case 'gallery':
        result = await this._post({
          url: 'api/submit_gallery_post.json', data: {
            api_type, sr, title, items, resubmit, sendreplies, nsfw, spoiler,
            flair_id, flair_text, collection_id, discussion_type,
            iden, captcha, ...opts
          }
        })
        break
      case 'poll':
        result = await this._post({
          url: 'api/submit_poll_post', data: {
            api_type, sr, title, text, options, duration, resubmit, sendreplies,
            nsfw, spoiler, flair_id, flair_text, collection_id, discussion_type,
            iden, captcha, ...opts
          }
        })
        break
      default:
        result = await this._post({
          url: 'api/submit', form: {
            api_type, sr, kind, title, url, video_poster_url, text, richtext_json: JSON.stringify(richtext_json),
            crosspost_fullname, resubmit, sendreplies, nsfw, spoiler, flair_id, flair_text,
            collection_id, discussion_type, iden, captcha, ...opts
          }
        })
        break
    }
    handleJsonErrors(result)

    if (ws!) {
      if (ws.readyState !== WebSocket.OPEN) {
        throw new errors.WebSocketError('Websocket error. Your post may still have been created.')
      }
      return new Promise<InstanceType<typeof snoowrap.objects.Submission>>((resolve, reject) => {
        ws.onmessage = event => {
          ws.onclose = null
          ws.close()
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'failed') reject(new errors.MediaPostFailedError())
            const submissionUrl = data.payload.redirect
            const submissionId = SUBMISSION_ID_REGEX.exec(submissionUrl)![1]
            resolve(this.getSubmission(submissionId))
          } catch (err) {
            reject(err)
          }
        }
        ws.onerror = () => {
          reject(new errors.WebSocketError('Websocket error. Your post may still have been created.'))
          ws.onclose = null
        }
        ws.onclose = () => reject(new errors.WebSocketError('Websocket closed. Your post may still have been created.'))
      })
    }
    return result.json.data.id ? this.getSubmission(result.json.data.id) : null
  }

  /**
   * @summary Creates a new link submission on the given subreddit.
   * @param options An object containing details about the submission.
   * @returns The newly-created Submission object.
   * @example
   *
   * r.submitLink({
   *   subredditName: 'snoowrap_testing',
   *   title: 'I found a cool website!',
   *   url: 'https://google.com'
   * }).then(console.log)
   * // => Submission { name: 't3_4abnfe' }
   * // (new linkpost created on reddit)
   */
  submitLink (options: SubmitLinkOptions) {
    // Todo: Add `options.url` validation.
    return this._submit({...options, kind: 'link'})
  }

  /**
   * @summary Submit an image submission to the given subreddit. (Undocumented endpoint).
   * @desc **NOTE**: This method won't work on browsers that don't support the Fetch API natively since it requires to perform
   * a 'no-cors' request which is impossible with the XMLHttpRequest API.
   * @param options An object containing details about the submission.
   * @returns The newly-created Submission object, or `null` if `options.noWebsockets` is `true`.
   * @example
   *
   * const blob = await (await fetch("https://example.com/kittens.jpg")).blob()
   * r.submitImage({
   *   subredditName: 'snoowrap_testing',
   *   title: 'Take a look at those cute kittens <3',
   *   imageFile: blob, // Usage as a `Blob`.
   *   imageFileName: 'kittens.jpg'
   * }).then(console.log)
   * // => Submission
   * // (new image submission created on reddit)
   */
  async submitImage ({imageFile, imageFileName, noWebsockets, ...opts}: SubmitImageOptions) {
    let url, websocketUrl
    try {
      const image = imageFile instanceof MediaImg
        ? imageFile
        : await this.uploadMedia({
          file: imageFile,
          name: imageFileName,
          type: 'img'
        })
      url = image.fileUrl
      websocketUrl = image.websocketUrl
    } catch (err) {
      throw new Error('An error has occurred with the image file: ' + (err as Error).message)
    }
    return this._submit({...opts, kind: 'image', url, websocketUrl: noWebsockets ? undefined : websocketUrl})
  }

  /**
   * @summary Submit a video or videogif submission to the given subreddit. (Undocumented endpoint).
   * @desc **NOTE**: This method won't work on browsers that don't support the Fetch API natively since it requires to perform
   * a 'no-cors' request which is impossible with the XMLHttpRequest API.
   * @param options An object containing details about the submission.
   * @returns The newly-created Submission object, or `null` if `options.noWebsockets` is `true`.
   * @example
   *
   * const mediaVideo = await r.uploadMedia({
   *   file: './video.mp4',
   *   type: 'video'
   * })
   * r.submitVideo({
   *   subredditName: 'snoowrap_testing',
   *   title: 'This is a video!',
   *   videoFile: mediaVideo, // Usage as a `MediaVideo`.
   *   thumbnailFile: fs.createReadStream('./thumbnail.png'), // Usage as a `stream.Readable`.
   *   thumbnailFileName: 'thumbnail.png'
   * }).then(console.log)
   * // => Submission
   * // (new video submission created on reddit)
   */
  async submitVideo ({
    videoFile,
    videoFileName,
    thumbnailFile,
    thumbnailFileName,
    videogif = false,
    noWebsockets,
    ...opts
  }: SubmitVideoOptions) {
    let url, video_poster_url, websocketUrl
    const kind = videogif ? 'videogif' : 'video'

    /**
     * Imagin you just finished uploading a large video, then oops! you faced this error: "An error has occurred with the thumbnail file"!
     * In this case we should validate the thumbnail parameters first to ensure that no accidental uploads will happen.
     */
    if (!(thumbnailFile instanceof MediaImg)) {
      try {
        await this.uploadMedia({
          file: thumbnailFile,
          name: thumbnailFileName,
          type: 'img',
          validateOnly: true
        })
      } catch (err) {
        throw new Error('An error has occurred with the thumbnail file: ' + (err as Error).message)
      }
    }

    /**
     * Now we are safe to start uploading. If the provided video is invalid, the error can be easly catched.
     */
    try {
      const video = videoFile instanceof MediaVideo
        ? videoFile
        : await this.uploadMedia({
          file: videoFile,
          name: videoFileName,
          type: videogif ? 'gif' : 'video'
        })
      url = video.fileUrl
      websocketUrl = video.websocketUrl
    } catch (err) {
      throw new Error('An error has occurred with the video file: ' + (err as Error).message)
    }

    try {
      const thumbnail = thumbnailFile instanceof MediaImg
        ? thumbnailFile
        : await this.uploadMedia({
          file: thumbnailFile,
          name: thumbnailFileName,
          type: 'img'
        })
      video_poster_url = thumbnail.fileUrl
    } catch (err) {
      throw new Error('An error occurred with the thumbnail file: ' + (err as Error).message)
    }

    return this._submit({...opts, kind, url, video_poster_url, websocketUrl: noWebsockets ? undefined : websocketUrl})
  }

  /**
   * @summary Submit a gallery to the given subreddit. (Undocumented endpoint).
   * @desc **NOTE**: This method won't work on browsers that don't support the Fetch API natively since it requires to perform
   * a 'no-cors' request which is impossible with the XMLHttpRequest API.
   * @param options An object containing details about the submission.
   * @returns The newly-created Submission object, or `null` if `options.noWebsockets` is `true`.
   * @example
   *
   * const fileinput = document.getElementById('file-input')
   * const files = fileinput.files.map(file => { // Usage as an array of `File`s.
   *   return {
   *     imageFile: file,
   *     caption: file.name
   *   }
   * })
   * const blob = await (await fetch("https://example.com/kittens.jpg")).blob()
   * const mediaImg = await r.uploadMedia({ // Usage as a `MediaImg`.
   *   file: blob,
   *   type: 'img',
   *   caption: 'cute :3',
   *   outboundUrl: 'https://example.com/kittens.html'
   * })
   * r.submitGallery({
   *   subredditName: 'snoowrap_testing',
   *   title: 'This is a gallery!',
   *   gallery: [mediaImg, ...files]
   * }).then(console.log)
   * // => Submission
   * // (new gallery submission created on reddit)
   */
  async submitGallery ({gallery, ...opts}: SubmitGalleryOptions) {
    /**
     * Validate every single gallery item to ensure that no accidental uploads will happen.
     */
    await Promise.all(gallery.map(async (item, index) => {
      try {
        if (item.caption && item.caption.length > 180) {
          throw new Error('Caption must be 180 characters or less.')
        }
        // Todo: Add outboundUrl validation.
        if (!(item instanceof MediaImg)) {
          await this.uploadMedia({
            file: item.file,
            name: item.name,
            type: 'img',
            validateOnly: true,
            caption: item.caption,
            outboundUrl: item.outboundUrl
          })
        }
      } catch (err) {
        throw new Error(`An error has occurred with the gallery item at the index ${index}: ` + (err as Error).message)
      }
    }))

    /**
     * Now we are safe to upload. It still depends on network conditions tho, that's why it is recommended to pass the gallery items
     * as ready-to-use `MediaImg`s instead.
     */
    const items = await Promise.all(gallery.map(async (item, index) => {
      try {
        if (!(item instanceof MediaImg)) {
          item = await this.uploadMedia({
            file: item.file,
            name: item.name,
            type: 'img',
            caption: item.caption,
            outboundUrl: item.outboundUrl
          })
        }
      } catch (err) {
        throw new Error(`An error occurred with a gallery item at the index ${index}: ` + (err as Error).message)
      }
      return {
        caption: item.caption,
        outbound_url: item.outboundUrl,
        media_id: item.mediaId
      }
    }))

    return this._submit({...opts, kind: 'gallery', items})
  }

  /**
   * @summary Creates a new selfpost on the given subreddit.
   * @param options An object containing details about the submission.
   * @returns The newly-created Submission object.
   * @example
   *
   * const mediaVideo = await r.uploadMedia({
   *   file: './video.mp4',
   *   type: 'video',
   *   caption: 'Short video!'
   * })
   * r.submitSelfpost({
   *   subredditName: 'snoowrap_testing',
   *   title: 'This is a selfpost',
   *   text: 'This is the text body of the selfpost.\n\nAnd This is an inline image {img} And also a video! {vid}',
   *   inlineMedia: {
   *     img: {
   *       file: './animated.gif', // Usage as a file path.
   *       type: 'img'
   *     },
   *     vid: mediaVideo
   *   }
   * }).then(console.log)
   * // => Submission
   * // (new selfpost created on reddit)
   */
  async submitSelfpost ({text, inlineMedia, richtext_json, ...opts}: SubmitSelfpostOptions) {
    /* eslint-disable require-atomic-updates */
    if (richtext_json) {
      text = undefined
    }
    if (text && inlineMedia) {
      const placeholders = Object.keys(inlineMedia)

      // Validate inline media
      await Promise.all(placeholders.map(async placeholder => {
        if (!text!.includes(`{${placeholder}}`)) {
          return
        }
        if (!(inlineMedia[placeholder] instanceof MediaFile)) {
          await this.uploadMedia({
            ...inlineMedia[placeholder] as UploadInlineMediaOptions,
            validateOnly: true
          })
        }
      }))

      // Upload if necessary
      await Promise.all(placeholders.map(async placeholder => {
        if (!text!.includes(`{${placeholder}}`)) {
          return
        }
        if (!(inlineMedia[placeholder] instanceof MediaFile)) {
          inlineMedia[placeholder] = await this.uploadMedia({
            ...inlineMedia[placeholder] as UploadInlineMediaOptions
          })
        }
      }))

      const body = text.replace(PLACEHOLDER_REGEX, (_m, g1: string) => inlineMedia[g1].toString())
      richtext_json = (await this.convertToFancypants(body)).output
      text = undefined
    }
    return this._submit({...opts, kind: 'self', text, richtext_json})
    /* eslint-enable require-atomic-updates */
  }

  /**
   * @summary Submit a poll to the given subreddit. (Undocumented endpoint).
   * @param options An object containing details about the submission.
   * @returns The newly-created Submission object.
   * @example
   *
   * r.submitPoll({
   *   subredditName: 'snoowrap_testing',
   *   title: 'Survey!',
   *   text: 'Do you like snoowrap?',
   *   choices: ['YES!', 'NOPE!'],
   *   duration: 3
   * }).then(console.log)
   * // => Submission
   * // (new poll submission created on reddit)
   */
  submitPoll (options: SubmitPollOptions) {
    return this._submit({...options, kind: 'poll'})
  }

  /**
   * @summary Creates a new crosspost submission on the given subreddit
   * @desc **NOTE**: To create a crosspost, the authenticated account must be subscribed to the subreddit where
   * the crosspost is being submitted, and that subreddit be configured to allow crossposts.
   * @param options An object containing details about the submission
   * @returns The newly-created Submission object
   * @example
   *
   * r.submitCrosspost({
   *  title: 'I found an interesting post',
   *  originalPost: '6vths0',
   *  subredditName: 'snoowrap'
   * }).then(console.log)
   * // => Submission
   * // (new crosspost submission created on reddit)
   */
  submitCrosspost ({originalPost, ...opts}: SubmitCrosspostOptions) {
    const crosspost_fullname = originalPost instanceof snoowrap.objects.Submission
      ? originalPost.name
      : originalPost
        ? addFullnamePrefix(originalPost, 't3_')
        : opts.crosspost_fullname
    if (!crosspost_fullname) requiredArg('options.originalPost')
    return this._submit({...opts, kind: 'crosspost', crosspost_fullname})
  }
  // #endregion
}

if ((typeof module === 'undefined' || !module.parent) && isBrowser) { // check if the code is being run in a browser through browserify, etc.
  snoowrap._previousSnoowrap = (self as any)[MODULE_NAME]
  ;(self as any)[MODULE_NAME] = snoowrap
}

export default snoowrap
export {Common, AppAuth, ScriptAuth, CodeAuth, All}
