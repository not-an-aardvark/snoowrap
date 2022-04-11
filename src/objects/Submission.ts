import {getEmptyRepliesListing, addFullnamePrefix} from '../helper'
import Comment from './Comment'
import VoteableContent from './VoteableContent'
import type snoowrap from '../snoowrap'
import type {Listing} from './'
import type {FetchMoreOptions, FetchAllOptions, ListingQuery} from './Listing'
import type {
  OmitProps, RichTextFlair, Media, MediaEmbed, SecureMediaEmbed, ImagePreview,
  SubmitCrosspostOptions, AssignFlairOptions, SelectFlairOptions
} from '../interfaces'
import type {COMMENT_SORTS} from '../constants'

const api_type = 'json'


interface StickyOptions {
  num?: number
  state: boolean
  [key: string]: any
}

interface Submission {
  clicked: boolean
  comments: Listing<Comment>
  /** Categories for original content, e.g. "comics", "drawing_and_painting" */
  content_categories: string[]|null
  contest_mode: boolean
  created: number
  created_utc: number
  domain: string
  hidden: boolean
  hide_score: boolean
  id: string
  is_crosspostable: boolean
  is_meta: boolean
  is_original_content: boolean
  is_reddit_media_domain: boolean
  is_robot_indexable: boolean
  is_self: boolean
  is_video: boolean
  link_flair_background_color: string
  link_flair_css_class: string|null
  link_flair_richtext: RichTextFlair[]
  link_flair_template_id: string|null
  link_flair_text: string|null
  link_flair_text_color: 'dark'|'light'
  link_flair_type: 'text'|'richtext'
  media: Media|null
  media_embed: MediaEmbed
  media_only: boolean;
  name: string
  num_comments: number
  num_crossposts: number
  over_18: boolean
  parent_whitelist_status: string
  pinned: boolean
  previous_visits: number[]
  pwls: number
  post_hint: string
  preview: { enabled: boolean; images: ImagePreview[] }
  quarantine: boolean
  removal_reason: string|null
  removed_by_category: string|null
  /** Same content as media, except HTTPS */
  secure_media: Media|null
  secure_media_embed: SecureMediaEmbed
  selftext: string
  selftext_html: string|null
  spam?: boolean
  spoiler: boolean
  subreddit_subscribers: number
  suggested_sort: typeof COMMENT_SORTS[number]|null
  thumbnail: string
  thumbnail_height?: number|null
  thumbnail_width?: number|null
  title: string
  upvote_ratio: number
  url: string
  view_count: number|null
  visited: boolean
  whitelist_status: string
  wls: number
}

/**
 * A class representing a reddit submission
 * @example
 *
 * // Get a submission by ID
 * r.getSubmission('2np694')
 */
class Submission extends VoteableContent<Submission> {
  static _name = 'Submission'

  _sort?: typeof COMMENT_SORTS[number]
  _children: {[id: string]: Comment}

  constructor (
    options: {[key: string]: any},
    _r: snoowrap,
    _hasFetched = false
  ) {
    super(options, _r, _hasFetched)
    this._callback = this._callback.bind(this)
    this._children = {}
    if (_hasFetched) {
      this.comments = this.comments || getEmptyRepliesListing(this)
    }
  }
  _transformApiResponse (response: Submission) {
    response._sort = this._sort
    for (const id in response._children) {
      const child = response._children[id]
      child._sort = response._sort
      child._cb = response._callback
    }
    return response
  }
  /**
   * A function used to cache children to the `Submission._children` property. By "children" we mean
   * all nested comments/replies that belong to the submission. `Submission._children` used by
   * the function `Submission.getComment()` to get children that are in deep chains. We pass this function
   * to children as `Comment._cb()`.
   */
  _callback (child: {_children: {[id: string]: Comment}}) {
    if (child instanceof Comment) {
      const parent = child.parent_id.startsWith('t1_') ? this._children[child.parent_id.slice(3)] : this
      if (parent) {
        const listing: Listing<Comment> = parent.replies || parent.comments
        const index = listing.findIndex(c => c.id === child.id)
        if (index !== -1) {
          listing[index] = child
        }
      }
      child._children[child.id] = child
      this._callback({_children: child._children})
    } else {
      for (const id in child._children) {
        child._children[id]._sort = this._sort
        child._children[id]._cb = this._callback
      }
      Object.assign(this._children, child._children)
    }
  }
  get _uri () {
    return `comments/${this.name.slice(3)}${this._sort ? `?sort=${this._sort}` : ''}`
  }
  /**
   * @summary Pick a comment from the comments tree or fetch it with a given id.
   * @param {string} commentId - The base36 id of the comment
   * @param {boolean} [fetch] - If true, this function will return an unfetched Comment object
   * instead. Calling `.fetch()` will make it replace the one with the same id on the tree if exists.
   * It will also expose all the children on its replies tree to this function.
   * @returns {Comment|null} A Comment object for the requested comment, or `null` when it's not available
   * on the comments tree.
   * @example
   *
   * const og = submission.comments[0].replies[0]
   * const comment = submission.getComment(og.id)
   * console.log(comment === og)
   * // => true
   */
  getComment (commentId: string, fetch: boolean) {
    let comment = this._children[commentId] || null
    if (fetch) {
      comment = this._r._newObject('Comment', {
        name: addFullnamePrefix(commentId, 't1_'),
        link_id: this.name,
        _sort: this._sort,
        _cb: this._callback
      })
    }
    return comment
  }
  /**
   * @summary Fetch more comments and append them automatically to the comments listing. All comments and their
   * children will be exposed automatically to {@link Submission#getComment}.
   * @param options - Object of fetching options or the number of comments to fetch. see
   * {@link Listing#fetchMore} for more details.
   * @returns A Promise that fulfills with the comments listing.
   */
  async fetchMore (options: Partial<OmitProps<FetchMoreOptions, 'append'>>|number) {
    if (typeof options !== 'number') {
      options.append = true
    }
    const comments = await this.comments.fetchMore(options)
    this._callback({_children: comments._children})
    this.comments = comments
    return comments
  }
  /**
   * @summary Fetch all comments and append them automatically to the comments listing. All comments and their
   * children will be exposed automatically to {@link Submission#getComment}.
   * @param {object} [options] - Fetching options. see {@link Listing#fetchAll} for more details.
   * @returns A Promise that fulfills with the comments listing.
   */
  fetchAll (options?: OmitProps<FetchAllOptions, 'append'>) {
    return this.fetchMore({...options, amount: Infinity})
  }
  /**
   * @summary Hides this Submission, preventing it from appearing on most Listings.
   * @returns The updated version of this Submission
   * @example r.getSubmission('2np694').hide()
   */
  async hide () {
    await this._post({url: 'api/hide', form: {id: this.name}})
    return this
  }
  /**
   * @summary Unhides this Submission, allowing it to reappear on most Listings.
   * @returns The updated version of this Submission
   * @example r.getSubmission('2np694').unhide()
   */
  async unhide () {
    await this._post({url: 'api/unhide', form: {id: this.name}})
    return this
  }
  /**
   * @summary Locks this Submission, preventing new comments from being posted on it.
   * @returns The updated version of this Submission
   * @example r.getSubmission('2np694').lock()
   */
  async lock () {
    await this._post({url: 'api/lock', form: {id: this.name}})
    return this
  }
  /**
   * @summary Unlocks this Submission, allowing comments to be posted on it again.
   * @returns The updated version of this Submission
   * @example r.getSubmission('2np694').unlock()
   */
  async unlock () {
    await this._post({url: 'api/unlock', form: {id: this.name}})
    return this
  }
  /**
   * @summary Marks this Submission as NSFW (Not Safe For Work).
   * @returns The updated version of this Submission
   * @example r.getSubmission('2np694').markNsfw()
   */
  async markNsfw () {
    await this._post({url: 'api/marknsfw', form: {id: this.name}})
    return this
  }
  /**
   * @summary Unmarks this Submission as NSFW (Not Safe For Work).
   * @returns The updated version of this Submission
   * @example r.getSubmission('2np694').unmarkNsfw()
   */
  async unmarkNsfw () {
    await this._post({url: 'api/unmarknsfw', form: {id: this.name}})
    return this
  }
  /**
   * @summary Mark a submission as a spoiler
   * @desc **Note:** This will silently fail if the subreddit has disabled spoilers.
   * @returns A Promise that fulfills with this Submission when the request is complete
   * @example r.getSubmission('2np694').markSpoiler()
   */
  async markSpoiler () {
    await this._post({url: 'api/spoiler', form: {id: this.name}})
    return this
  }

  /**
   * @summary Unmark a submission as a spoiler
   * @returns A Promise that fulfills with this Submission when the request is complete
   * @example r.getSubmission('2np694').unmarkSpoiler()
   */
  async unmarkSpoiler () {
    await this._post({url: 'api/unspoiler', form: {id: this.name}})
    return this
  }

  /**
   * @summary Sets the contest mode status of this submission.
   * @private
   * @param {boolean} state The desired contest mode status
   * @returns The updated version of this Submission
   */
  async _setContestModeEnabled (state: boolean) {
    await this._post({url: 'api/set_contest_mode', form: {api_type, state, id: this.name}})
    return this
  }
  /**
   * @summary Enables contest mode for this Submission.
   * @returns The updated version of this Submission
   * @example r.getSubmission('2np694').enableContestMode()
   */
  enableContestMode () {
    return this._setContestModeEnabled(true)
  }
  /**
   * @summary Disables contest mode for this Submission.
   * @returns The updated version of this Submission
   * @example r.getSubmission('2np694').disableContestMode()
   */
  disableContestMode () {
    return this._setContestModeEnabled(false)
  }
  async _setStickied ({num, state, ...opts}: StickyOptions) {
    await this._post({url: 'api/set_subreddit_sticky', form: {...opts, api_type, num, state, id: this.name}})
    return this
  }
  /**
   * @summary Stickies this Submission.
   * @param {object} [options]
   * @param {number} [options.num=1] The sticky slot to put this submission in; this should be either 1 or 2.
   * @returns The updated version of this Submission
   * @example r.getSubmission('2np694').sticky({num: 2})
   */
  async sticky ({num = 1} = {}) {
    await this._setStickied({num, state: true})
    return this
  }
  /**
   * @summary Unstickies this Submission.
   * @returns The updated version of this Submission
   * @example r.getSubmission('2np694').unsticky()
   */
  async unsticky () {
    await this._setStickied({state: false})
    return this
  }
  /**
   * @summary Sets the suggested comment sort method on this Submission
   * @desc **Note**: To enable contest mode, use {@link Submission#enableContestMode} instead.
   * @param {string} sort The suggested sort method.
   * @returns The updated version of this Submission
   * @example r.getSubmission('2np694').setSuggestedSort('new')
   */
  async setSuggestedSort (sort?: typeof COMMENT_SORTS[number]) {
    await this._post({url: 'api/set_suggested_sort', form: {api_type, id: this.name, sort}})
    return this
  }
  /**
   * @summary Marks this submission as 'visited'.
   * @desc **Note**: This function only works if the authenticated account has a subscription to reddit gold.
   * @returns The updated version of this Submission
   * @example r.getSubmission('2np694').markAsRead()
   */
  async markAsRead () {
    await this._post({url: 'api/store_visits', form: {links: this.name}})
    return this
  }
  /**
   * @summary Gets a Listing of other submissions on reddit that had the same link as this one.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns A Listing of other Submission objects
   * @example r.getSubmission('2np694').getDuplicates()
   */
  getDuplicates (options: ListingQuery = {}) {
    return this._getListing({uri: `duplicates/${this.name.slice(3)}`, qs: options})
  }
  /**
   * @summary Gets a list of flair template options for this post.
   * @returns An Array of flair templates
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
  async getLinkFlairTemplates () {
    await this.fetch()
    return this.subreddit.getLinkFlairTemplates(this.name)
  }
  /**
   * @summary Assigns flair on this Submission (as a moderator; also see [selectFlair]{@link Submission#selectFlair})
   * @param {object} options
   * @returns A Promise that fulfills with an updated version of this Submission
   * @example r.getSubmission('2np694').assignFlair({text: 'this is a flair text', cssClass: 'these are css classes'})
   */
  async assignFlair (options: OmitProps<AssignFlairOptions, 'name'|'link'|'subredditName'>) {
    await this.fetch()
    await this._r._assignFlair({...options, link: this.name, subredditName: this.subreddit.display_name})
    return this
  }

  /**
   * @summary Selects a flair for this Submission (as the OP; also see [assignFlair]{@link Submission#assignFlair})
   * @param options
   * @returns A Promise that fulfills with this objects after the request is complete
   * @example r.getSubmission('2np694').selectFlair({flair_template_id: 'e3340d80-8152-11e4-a76a-22000bc1096c'})
   */
  async selectFlair (options: OmitProps<SelectFlairOptions, 'name'|'link'|'subredditName'>) {
    await this.fetch()
    await this._r._selectFlair({...options, link: this.name, subredditName: this.subreddit.display_name})
    return this
  }

  /**
   * @summary Crossposts this submission to a different subreddit
   * @desc **NOTE**: To create a crosspost, the authenticated account must be subscribed to the subreddit where
   * the crosspost is being submitted, and that subreddit be configured to allow crossposts.
   * @param options An object containing details about the submission
   * @returns The newly-created Submission object
   * @example
   *
   * await r.getSubmission('6vths0').submitCrosspost({ title: 'I found an interesting post', subredditName: 'snoowrap' })
   */
  submitCrosspost (options: OmitProps<SubmitCrosspostOptions, 'originalPost'>) {
    return this._r.submitCrosspost({...options, originalPost: this})
  }
}

export default Submission
export {StickyOptions}
