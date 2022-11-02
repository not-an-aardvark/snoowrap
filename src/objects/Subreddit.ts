import {chunk, flatten, map} from 'lodash'
import stream from 'stream'
import fs from 'fs'
import {formatModPermissions, handleJsonErrors, renameKey} from '../helper'
import {InvalidMethodCallError} from '../errors'
import RedditContent from './RedditContent'
import type {
  CreateFlairOptions, FlairCSVOptions, FlairSelectorOptions, OmitProps, RichTextFlair, SelectFlairOptions, SubmitLinkOptions,
  SubmitImageOptions, SubmitVideoOptions, SubmitGalleryOptions, SubmitSelfpostOptions, SubmitPollOptions,
  SubmitCrosspostOptions,
  SubredditOptions
} from '../interfaces'
import type {ListingQuery} from './Listing'
import type {SearchOptions} from '../snoowrap'
import type {AxiosError} from '../axiosCreate'
import type {COMMENT_SORTS} from '../constants'
//
const api_type = 'json'


interface FlairListingQuery extends ListingQuery {
  /** A specific username to jump to. */
  name?: string
}

interface FlairSettings {
  /** Determines whether user flair should be enabled. */
  flair_enabled: boolean
  /** Determines the orientation of user flair relative to a given username. */
  flair_position: 'left'|'right'
  /** Determines whether users should be able to edit their own flair. */
  flair_self_assign_enabled: boolean
  /** Determines the orientation of link flair relative to a link title. */
  link_flair_position: 'left'|'right'
  /** Determines whether users should be able to edit the flair of their. */
  link_flair_self_assign_enabled: boolean
  [key: string]: any
}

interface ModerationLogQuery extends ListingQuery {
  /** An array of moderator names that the results should be restricted to. */
  mods?: string[]
  /** A string of comma-separated moderator names. */
  mod?: string
  /** Restricts the results to the specified type. */
  type?: 'banuser'|'unbanuser'|'removelink'|'approvelink'|'removecomment'|'approvecomment'
    |'addmoderator'|'invitemoderator'|'uninvitemoderator'|'acceptmoderatorinvite'|'removemoderator'
    |'addcontributor'|'removecontributor'|'editsettings'|'editflair'|'distinguish'|'marknsfw'
    |'wikibanned'|'wikicontributor'|'wikiunbanned'|'wikipagelisted'|'removewikicontributor'
    |'wikirevise'|'wikipermlevel'|'ignorereports'|'unignorereports'|'setpermissions'
    |'setsuggestedsort'|'sticky'|'unsticky'|'setcontestmode'|'unsetcontestmode'|'lock'|'unlock'
    |'muteuser'|'unmuteuser'|'createrule'|'editrule'|'deleterule'|'spoiler'|'unspoiler'
}

interface FilterableListingQuery extends ListingQuery {
  /** Restricts the Listing to the specified type of item. */
  only?: 'links'|'comments'
}

interface UserListingQuery extends ListingQuery {
  /** A username on the list to jump to. */
  user?: string
  /** Expand subreddits. */
  sr_detail?: boolean
}

interface Subreddit {
  accounts_active_is_fuzzed: boolean
  accounts_active: number
  active_user_count: number
  advertiser_category: string|null
  all_original_content: boolean
  allow_discovery: boolean
  allow_images: boolean
  allow_videogifs: boolean
  allow_videos: boolean
  /** HEX color code */
  banner_background_color: string
  /** URL of the banner image used on desktop Reddit */
  banner_background_image: string
  /** URL of the banner image used on the mobile Reddit app */
  banner_img: string
  banner_size: [number, number]|null
  can_assign_link_flair: boolean
  can_assign_user_flair: boolean
  collapse_deleted_comments: boolean
  comment_score_hide_mins: number
  /** Image URL of the subreddit icon */
  community_icon: string
  created_utc: number
  created: number
  description_html: string
  description: string
  display_name: string
  display_name_prefixed: string
  emojis_custom_size: [number, number]|null
  emojis_enabled: boolean
  has_menu_widget: boolean
  header_img: string|null
  header_size: [number, number]|null
  header_title: string|null
  hide_ads: boolean
  id: string
  icon_img: string
  icon_size: [number, number]|null
  is_enrolled_in_new_modmail: boolean|null
  key_color: string
  lang: string
  link_flair_enabled: boolean
  link_flair_position: ''|'left'|'right'
  name: string
  /** Will be null if user is not subscribed to this subreddit */
  notification_level: string|null
  over18: boolean
  /** HEX color code */
  primary_color: string
  public_description_html: string
  public_description: string
  public_traffic: boolean
  quarantine: boolean
  show_media_preview: boolean
  show_media: boolean
  spoilers_enabled: boolean
  submission_type: 'any'|'link'|'self'
  submit_link_label: string|null
  submit_text_html: string
  submit_text_label: string|null
  submit_text: string
  subreddit_type: 'public'|'private'|'restricted'|'gold_restricted'|'gold_only'|'archived'|'employees_only'
  subscribers: number
  suggested_comment_sort: typeof COMMENT_SORTS[number]|null
  title: string
  url: string
  user_can_flair_in_sr: boolean
  user_flair_background_color: string|null
  user_flair_css_class: string|null
  user_flair_enabled_in_sr: boolean
  user_flair_position: ''|'left'|'right'
  user_flair_richtext: RichTextFlair[]
  user_flair_template_id: string|null
  user_flair_text: string|null
  user_flair_text_color: 'dark'|'light'|null
  user_has_favorited: boolean
  user_is_banned: boolean
  user_is_contributor: boolean
  user_is_moderator: boolean
  user_is_muted: boolean
  user_is_subscriber: boolean
  user_sr_flair_enabled: boolean
  user_sr_theme_enabled: boolean
  whitelist_status: string
  wiki_enabled: boolean
  wls: number
}

/**
 * A class representing a subreddit
 * @example
 *
 * // Get a subreddit by name
 * r.getSubreddit('AskReddit')
 */
class Subreddit extends RedditContent<Subreddit> {
  static _name = 'Subreddit'

  get _uri () {
    return `r/${this.display_name}/about`
  }
  _transformApiResponse (response: Subreddit) {
    if (!(response instanceof Subreddit)) {
      throw new TypeError(`The subreddit /r/${this.display_name} does not exist.`)
    }
    return response
  }
  async _deleteFlairTemplates (flair_type: string) {
    await this._post({url: `r/${this.display_name}/api/clearflairtemplates`, form: {api_type, flair_type}})
    return this
  }
  /**
   * @summary Deletes all of this subreddit's user flair templates
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').deleteAllUserFlairTemplates()
   */
  deleteAllUserFlairTemplates () {
    return this._deleteFlairTemplates('USER_FLAIR')
  }
  /**
   * @summary Deletes all of this subreddit's link flair templates
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').deleteAllLinkFlairTemplates()
   */
  deleteAllLinkFlairTemplates () {
    return this._deleteFlairTemplates('LINK_FLAIR')
  }
  /**
   * @summary Deletes one of this subreddit's flair templates
   * @param {object} options
   * @param {string} options.flair_template_id The ID of the template that should be deleted
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').deleteFlairTemplate({flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721'})
   */
  async deleteFlairTemplate (flair_template_id: string) {
    await this._post({
      url: `r/${this.display_name}/api/deleteflairtemplate`,
      form: {api_type, flair_template_id}
    })
    return this
  }
  async _createFlairTemplate ({
    text,
    css_class,
    flair_type,
    text_editable = false,
    ...opts
  }: CreateFlairOptions) {
    await this._post({
      url: `r/${this.display_name}/api/flairtemplate`,
      form: {...opts, api_type, text, css_class, flair_type, text_editable}
    })
    return this
  }
  /**
   * @summary Creates a new user flair template for this subreddit
   * @param {object} options
   * @returns A Promise that fulfills with this Subreddit when the request is complete.
   * @example r.getSubreddit('snoowrap').createUserFlairTemplate({text: 'Some Flair Text', cssClass: 'some-css-class'})
   */
  createUserFlairTemplate (options: OmitProps<CreateFlairOptions, 'flair_type'>) {
    return this._createFlairTemplate({...options, flair_type: 'USER_FLAIR'})
  }
  /**
   * @summary Creates a new link flair template for this subreddit
   * @param {object} options
   * @returns A Promise that fulfills with this Subredit when the request is complete.
   * @example r.getSubreddit('snoowrap').createLinkFlairTemplate({text: 'Some Flair Text', cssClass: 'some-css-class'})
   */
  createLinkFlairTemplate (options: OmitProps<CreateFlairOptions, 'flair_type'>) {
    return this._createFlairTemplate({...options, flair_type: 'LINK_FLAIR'})
  }
  _getFlairOptions ({name, link, is_newlink}: FlairSelectorOptions = {}) { // TODO: Add shortcuts for this on RedditUser and Submission
    return this._post({url: `r/${this.display_name}/api/flairselector`, form: {name, link, is_newlink}})
  }
  /**
   * @summary Gets the flair templates for the subreddit or a given link.
   * @param {string} [linkId] The link's base36 ID
   * @returns An Array of flair template options
   * @example
   *
   * r.getSubreddit('snoowrap').getLinkFlairTemplates('4fp36y').then(console.log)
   * // => [ { flair_css_class: '',
   * //  flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721',
   * //  flair_text_editable: true,
   * //  flair_position: 'right',
   * //  flair_text: '' },
   * //  { flair_css_class: '',
   * //  flair_template_id: '03821f62-c920-11e5-b608-0e309fbcf863',
   * //  flair_text_editable: true,
   * //  flair_position: 'right',
   * //  flair_text: '' },
   * //  ...
   * // ]
   */
  async getLinkFlairTemplates (link: string) {
    const options = link ? {link} : {is_newlink: true}
    const res = await this._getFlairOptions(options)
    return res.choices
  }
  /**
   * @summary Gets the list of user flair templates on this subreddit.
   * @returns An Array of user flair templates
   * @example
   *
   * r.getSubreddit('snoowrap').getUserFlairTemplates().then(console.log)
   * // => [ { flair_css_class: '',
   * //  flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721',
   * //  flair_text_editable: true,
   * //  flair_position: 'right',
   * //  flair_text: '' },
   * //  { flair_css_class: '',
   * //  flair_template_id: '03821f62-c920-11e5-b608-0e309fbcf863',
   * //  flair_text_editable: true,
   * //  flair_position: 'right',
   * //  flair_text: '' },
   * //  ...
   * // ]
   */
  async getUserFlairTemplates () {
    const res = await this._getFlairOptions()
    return res.choices
  }
  /**
   * @summary Clears a user's flair on this subreddit.
   * @param name The user's name
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').deleteUserFlair('actually_an_aardvark')
   */
  async deleteUserFlair (name: string) {
    await this._post({url: `r/${this.display_name}/api/deleteflair`, form: {api_type, name}})
    return this
  }
  /**
   * @summary Gets a user's flair on this subreddit.
   * @param name The user's name
   * @returns An object representing the user's flair
   * @example
   *
   * r.getSubreddit('snoowrap').getUserFlair('actually_an_aardvark').then(console.log)
   * // => { flair_css_class: '',
   * //  flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721',
   * //  flair_text: '',
   * //  flair_position: 'right'
   * // }
   */
  async getUserFlair (name: string) {
    const res = await this._getFlairOptions({name})
    return res.current
  }
  /**
   * @summary Sets multiple user flairs at the same time
   * @desc Due to the behavior of the reddit API endpoint that this function uses, if any of the provided user flairs are
   * invalid, reddit will make note of this in its response, but it will still attempt to set the remaining user flairs. If this
   * occurs, the Promise returned by snoowrap will be rejected, and the rejection reason will be an array containing the 'error'
   * responses from reddit.
   * @param {object[]} flairArray
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example
   * r.getSubreddit('snoowrap').setMultipleUserFlairs([
   *   {name: 'actually_an_aardvark', text: "this is /u/actually_an_aardvark's flair text", css_class: 'some-css-class'},
   *   {name: 'snoowrap_testing', text: "this is /u/snoowrap_testing's flair text", css_class: 'some-css-class'}
   * ])
   * // the above request gets completed successfully
   *
   * r.getSubreddit('snoowrap').setMultipleUserFlairs([
   *   {name: 'actually_an_aardvark', text: 'foo', css_class: 'valid-css-class'},
   *   {name: 'snoowrap_testing', text: 'bar', css_class: "this isn't a valid css class"},
   *   {name: 'not_an_aardvark', text: 'baz', css_class: "this also isn't a valid css class"}
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
  async setMultipleUserFlairs (flairArray: FlairCSVOptions) {
    const csvLines = flairArray.map(item => {
      // reddit expects to receive valid CSV data, which each line having the form `username,flair_text,css_class`.
      return [
        item.name,
        item.text || '',
        item.css_class || ''
      ].map(str => {
        /**
         * To escape special characters in the lines (e.g. if the flair text itself contains a comma), surround each
         * part of the line with double quotes before joining the parts together with commas (in accordance with how special
         * characters are usually escaped in CSV). If double quotes are themselves part of the flair text, replace them with a
         * pair of consecutive double quotes.
         */
        return `"${str.replace(/"/g, '""')}"`
      }).join(',')
    })
    /**
     * Due to an API limitation, this endpoint can only set the flair of 100 users at a time.
     * Send multiple requests if necessary to ensure that all users in the array are accounted for.
     */
    const flairChunks = await Promise.all(chunk(csvLines, 100).map(flairChunk => {
      return this._post({url: `r/${this.display_name}/api/flaircsv`, form: {flair_csv: flairChunk.join('\n')}})
    }))
    const results = flatten(flairChunks)
    const errorRows = results.filter(row => !row.ok)
    if (errorRows.length) {
      throw errorRows
    }
    return this
  }
  /**
   * @summary Gets a list of all user flairs on this subreddit.
   * @param {object} options
   * @returns A Listing containing user flairs
   * @example
   *
   * r.getSubreddit('snoowrap').getUserFlairList().then(console.log)
   * // => Listing [
   * //  { flair_css_class: null,
   * //  user: 'not_an_aardvark',
   * //  flair_text: 'Isn\'t an aardvark' },
   * //  { flair_css_class: 'some-css-class',
   * //    user: 'actually_an_aardvark',
   * //    flair_text: 'this is /u/actually_an_aardvark\'s flair text' },
   * //  { flair_css_class: 'some-css-class',
   * //    user: 'snoowrap_testing',
   * //    flair_text: 'this is /u/snoowrap_testing\'s flair text' }
   * // ]
   */
  getUserFlairList (options: FlairListingQuery = {}) {
    return this._getListing({uri: `r/${this.display_name}/api/flairlist`, qs: options, _transform: response => {
      /**
       * For unknown reasons, responses from the api/flairlist endpoint are formatted differently than responses from all other
       * Listing endpoints. Most Listing endpoints return an object with a `children` property containing the Listing's children,
       * and `after` and `before` properties corresponding to the `after` and `before` querystring parameters that a client should
       * use in the next request. However, the api/flairlist endpoint returns an object with a `users` property containing the
       * Listing's children, and `next` and `prev` properties corresponding to the `after` and `before` querystring parameters. As
       * far as I can tell, there's no actual reason for this difference. >_>
       */
      response.after = response.next || null
      response.before = response.prev || null
      response.children = response.users
      return this._r._newObject('Listing', response)
    }})
  }
  /**
   * @summary Configures the flair settings for this subreddit.
   * @param {object} options
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').configure_flair({
   *   flair_enabled: true,
   *   flair_position: 'left',
   *   flair_self_assign_enabled: false,
   *   link_flair_position: 'right',
   *   link_flair_self_assign_enabled: false
   * })
   */
  async configureFlair ({
    flair_enabled,
    flair_position,
    flair_self_assign_enabled,
    link_flair_position,
    link_flair_self_assign_enabled,
    ...opts
  }: FlairSettings) {
    await this._post({url: `r/${this.display_name}/api/flairconfig`, form: {
      ...opts,
      api_type,
      flair_enabled,
      flair_position,
      flair_self_assign_enabled,
      link_flair_position,
      link_flair_self_assign_enabled
    }})
    return this
  }
  /**
   * @summary Gets the requester's flair on this subreddit.
   * @returns An object representing the requester's current flair
   * @example
   *
   * r.getSubreddit('snoowrap').getMyFlair().then(console.log)
   * // => { flair_css_class: 'some-css-class',
   * //  flair_template_id: null,
   * //  flair_text: 'this is /u/snoowrap_testing\'s flair text',
   * //  flair_position: 'right'
   * // }
   */
  async getMyFlair () {
    return (await this._getFlairOptions()).current
  }
  /**
   * @summary Sets the requester's flair on this subreddit.
   * @param options
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').selectMyFlair({flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721'})
   */
  async selectMyFlair (options: OmitProps<SelectFlairOptions, 'name'|'link'|'subredditName'>) {
    /**
     * NOTE: This requires `identity` scope in addition to `flair` scope, since the reddit api needs to be passed a username.
     * I'm not sure if there's a way to do this without requiring additional scope.
     */
    const name = await this._r._getMyName()
    await this._r._selectFlair({...options, name, subredditName: this.display_name})
    return this
  }
  async _setMyFlairVisibility (flair_enabled: boolean) {
    await this._post({url: `r/${this.display_name}/api/setflairenabled`, form: {api_type, flair_enabled}})
    return this
  }
  /**
   * @summary Makes the requester's flair visible on this subreddit.
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').showMyFlair()
   */
  showMyFlair () {
    return this._setMyFlairVisibility(true)
  }
  /**
   * @summary Makes the requester's flair invisible on this subreddit.
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').hideMyFlair()
   */
  hideMyFlair () {
    return this._setMyFlairVisibility(false)
  }
  /**
   * @summary Creates a new link submission on this subreddit.
   * @param {object} options An object containing details about the submission.
   * @returns The newly-created Submission object.
   * @example
   *
   * subreddit.submitLink({
   *   title: 'I found a cool website!',
   *   url: 'https://google.com'
   * }).then(console.log)
   * // => Submission { name: 't3_4abnfe' }
   * // (new linkpost created on reddit)
   */
  submitLink (options: OmitProps<SubmitLinkOptions, 'sr'>) {
    return this._r.submitLink({...options, sr: this.display_name})
  }
  /**
   * @summary Submit an image submission to this subreddit. (Undocumented endpoint).
   * @desc **NOTE**: This method won't work on browsers that don't support the Fetch API natively since it requires to perform
   * a 'no-cors' request which is impossible with the XMLHttpRequest API.
   * @param {object} options An object containing details about the submission.
   * @returns The newly-created Submission object, or `null` if `options.noWebsockets` is `true`.
   * @example
   *
   * const blob = await (await fetch("https://example.com/kittens.jpg")).blob()
   * subreddit.submitImage({
   *   title: 'Take a look at those cute kittens <3',
   *   imageFile: blob, // Usage as a `Blob`.
   *   imageFileName: 'kittens.jpg'
   * }).then(console.log)
   * // => Submission
   * // (new image submission created on reddit)
   */
  submitImage (options: OmitProps<SubmitImageOptions, 'sr'>) {
    return this._r.submitImage({...options, sr: this.display_name})
  }
  /**
   * @summary Submit a video or videogif submission to this subreddit. (Undocumented endpoint).
   * @desc **NOTE**: This method won't work on browsers that don't support the Fetch API natively since it requires to perform
   * a 'no-cors' request which is impossible with the XMLHttpRequest API.
   * @param {object} options An object containing details about the submission.
   * @returns The newly-created Submission object, or `null` if `options.noWebsockets` is `true`.
   * @example
   *
   * const mediaVideo = await r.uploadMedia({
   *   file: './video.mp4',
   *   type: 'video'
   * })
   * subreddit.submitVideo({
   *   title: 'This is a video!',
   *   videoFile: mediaVideo, // Usage as a `MediaVideo`.
   *   thumbnailFile: fs.createReadStream('./thumbnail.png'), // Usage as a `stream.Readable`.
   *   thumbnailFileName: 'thumbnail.png'
   * }).then(console.log)
   * // => Submission
   * // (new video submission created on reddit)
   */
  submitVideo (options: OmitProps<SubmitVideoOptions, 'sr'>) {
    return this._r.submitVideo({...options, sr: this.display_name})
  }
  /**
   * @summary Submit a gallery to this subreddit. (Undocumented endpoint).
   * @desc **NOTE**: This method won't work on browsers that don't support the Fetch API natively since it requires to perform
   * a 'no-cors' request which is impossible with the XMLHttpRequest API.
   * @param {object} options An object containing details about the submission.
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
   * subreddit.submitGallery({
   *   title: 'This is a gallery!',
   *   gallery: [mediaImg, ...files]
   * }).then(console.log)
   * // => Submission
   * // (new gallery submission created on reddit)
   */
  submitGallery (options: OmitProps<SubmitGalleryOptions, 'sr'>) {
    return this._r.submitGallery({...options, sr: this.display_name})
  }
  /**
   * @summary Creates a new selfpost on this subreddit.
   * @param {object} options An object containing details about the submission.
   * @returns The newly-created Submission object.
   * @example
   *
   * const mediaVideo = await r.uploadMedia({
   *   file: './video.mp4',
   *   type: 'video',
   *   caption: 'Short video!'
   * })
   * subreddit.submitSelfpost({
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
  submitSelfpost (options: OmitProps<SubmitSelfpostOptions, 'sr'>) {
    return this._r.submitSelfpost({...options, sr: this.display_name})
  }
  /**
   * @summary Submit a poll to this subreddit. (Undocumented endpoint).
   * @param {object} options An object containing details about the submission.
   * @returns The newly-created Submission object.
   * @example
   *
   * subreddit.submitPoll({
   *   title: 'Survey!',
   *   text: 'Do you like snoowrap?',
   *   choices: ['YES!', 'NOPE!'],
   *   duration: 3
   * }).then(console.log)
   * // => Submission
   * // (new poll submission created on reddit)
   */
  submitPoll (options: OmitProps<SubmitPollOptions, 'sr'>) {
    return this._r.submitPoll({...options, sr: this.display_name})
  }
  /**
   * @summary Creates a new crosspost submission on this subreddit
   * @desc **NOTE**: To create a crosspost, the authenticated account must be subscribed to the subreddit where
   * the crosspost is being submitted, and that subreddit be configured to allow crossposts.
   * @param {object} options An object containing details about the submission
   * @returns The newly-created Submission object
   * @example
   *
   * subreddit.submitCrosspost({
   *  title: 'I found an interesting post',
   *  originalPost: '6vths0'
   * }).then(console.log)
   * // => Submission
   * // (new crosspost submission created on reddit)
   */
  submitCrosspost (options: OmitProps<SubmitCrosspostOptions, 'sr'>) {
    return this._r.submitCrosspost({...options, sr: this.display_name})
  }
  /**
   * @summary Gets a Listing of hot posts on this subreddit.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing the retrieved submissions
   * @example
   *
   * r.getSubreddit('snoowrap').getHot().then(console.log)
   * // => Listing [
   * //  Submission { ... },
   * //  Submission { ... },
   * //  ...
   * // ]
   */
  getHot (options?: ListingQuery) {
    return this._r.getHot(this.display_name, options)
  }
  /**
   * @summary Gets a Listing of new posts on this subreddit.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing the retrieved submissions
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
  getNew (options?: ListingQuery) {
    return this._r.getNew(this.display_name, options)
  }
  /**
   * @summary Gets a Listing of new comments on this subreddit.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing the retrieved comments
   * @example
   *
   * r.getSubreddit('snoowrap').getNewComments().then(console.log)
   * // => Listing [
   * //  Comment { ... },
   * //  Comment { ... },
   * //  ...
   * // ]
   */
  getNewComments (options?: ListingQuery) {
    return this._r.getNewComments(this.display_name, options)
  }
  /**
   * @summary Gets a single random Submission from this subreddit.
   * @desc **Note**: This function will not work when snoowrap is running in a browser, because the reddit server sends a
   * redirect which cannot be followed by a CORS request.
   * @returns The retrieved Submission object
   * @example
   *
   * r.getSubreddit('snoowrap').getRandomSubmission().then(console.log)
   * // => Submission { ... }
   */
  getRandomSubmission () {
    return this._r.getRandomSubmission(this.display_name)
  }
  /**
   * @summary Gets a Listing of top posts on this subreddit.
   * @param {object} [option] Options for the resulting Listing
   * @returns A Listing containing the retrieved submissions
   * @example
   *
   * r.getSubreddit('snoowrap').getTop({time: 'all'}).then(console.log)
   * // => Listing [
   * //  Comment { ... },
   * //  Comment { ... },
   * //  ...
   * // ]
   */
  getTop (options?: ListingQuery) {
    return this._r.getTop(this.display_name, options)
  }
  /**
   * @summary Gets a Listing of controversial posts on this subreddit.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing the retrieved submissions
   * @example
   *
   * r.getSubreddit('snoowrap').getControversial({time: 'week'}).then(console.log)
   * // => Listing [
   * //  Comment { ... },
   * //  Comment { ... },
   * //  ...
   * // ]
   */
  getControversial (options?: ListingQuery) {
    return this._r.getControversial(this.display_name, options)
  }
  /**
   * @summary Gets a Listing of top posts on this subreddit.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing the retrieved submissions
   * @example
   *
   * r.getSubreddit('snoowrap').getRising().then(console.log)
   * // => Listing [
   * //  Submission { ... },
   * //  Submission { ... },
   * //  ...
   * // ]
   */
  getRising (options?: ListingQuery) {
    return this._r.getRising(this.display_name, options)
  }
  /**
   * @summary Gets the moderator mail for this subreddit.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing PrivateMessage objects
   * @example r.getSubreddit('snoowrap').getModmail().then(console.log)
   */
  getModmail (options?: ListingQuery) {
    return this._getListing({uri: `r/${this.display_name}/about/message/moderator`, qs: options})
  }
  /**
   * @summary Gets a list of ModmailConversations from the subreddit.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.getSubreddit('snoowrap').getNewModmailConversations({limit: 2}).then(console.log)
   * // => Listing [
   * //  ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... },
   * //  ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... }
   * // ]
   */
  getNewModmailConversations (options?: ListingQuery) {
    return this._r.getNewModmailConversations({...options, entity: this.display_name})
  }
  /**
   * @summary Gets the moderation log for this subreddit.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns A Listing containing moderation actions
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
  getModerationLog (options: ModerationLogQuery = {}) {
    if (options.mods && !options.mod) options.mod = options.mods.join(',')
    delete options.mods
    return this._getListing({uri: `r/${this.display_name}/about/log`, qs: options})
  }
  /**
   * @summary Gets a list of reported items on this subreddit.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns A Listing containing reported items
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
  getReports (options: FilterableListingQuery = {}) {
    return this._getListing({uri: `r/${this.display_name}/about/reports`, qs: options})
  }
  /**
   * @summary Gets a list of removed items on this subreddit.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns A Listing containing removed items
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
  getSpam (options: FilterableListingQuery = {}) {
    return this._getListing({uri: `r/${this.display_name}/about/spam`, qs: options})
  }
  /**
   * @summary Gets a list of items on the modqueue on this subreddit.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns A Listing containing items on the modqueue
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
  getModqueue (options: FilterableListingQuery = {}) {
    return this._getListing({uri: `r/${this.display_name}/about/modqueue`, qs: options})
  }
  /**
   * @summary Gets a list of unmoderated items on this subreddit.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns A Listing containing unmoderated items
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
  getUnmoderated (options: FilterableListingQuery = {}) {
    return this._getListing({uri: `r/${this.display_name}/about/unmoderated`, qs: options})
  }
  /**
   * @summary Gets a list of edited items on this subreddit.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns A Listing containing edited items
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
  getEdited (options: FilterableListingQuery = {}) {
    return this._getListing({uri: `r/${this.display_name}/about/edited`, qs: options})
  }
  /**
   * @summary Accepts an invite to become a moderator of this subreddit.
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').acceptModeratorInvite()
   */
  async acceptModeratorInvite () {
    const res = await this._post({
      url: `r/${this.display_name}/api/accept_moderator_invite`,
      form: {api_type}
    })
    handleJsonErrors(res)
    return this
  }
  /**
   * @summary Abdicates moderator status on this subreddit.
   * @returns A Promise that fulfills with this Subreddit when the request is complete.
   * @example r.getSubreddit('snoowrap').leaveModerator()
   */
  async leaveModerator () {
    const name = (await this.fetch())!.name
    const res = await this._post({url: 'api/leavemoderator', form: {id: name}})
    handleJsonErrors(res)
    return this
  }
  /**
   * @summary Abdicates approved submitter status on this subreddit.
   * @returns A Promise that resolves with this Subreddit when the request is complete.
   * @example r.getSubreddit('snoowrap').leaveContributor()
   */
  async leaveContributor () {
    const name = (await this.fetch())!.name
    const res = await this._post({url: 'api/leavecontributor', form: {id: name}})
    handleJsonErrors(res)
    return this
  }
  /**
   * @summary Gets a subreddit's CSS stylesheet.
   * @desc **Note**: This function will not work when snoowrap is running in a browser, because the reddit server sends a
   * redirect which cannot be followed by a CORS request.
   * @desc **Note**: This method will return a 404 error if the subreddit in question does not have a custom stylesheet.
   * @returns A Promise for a string containing the subreddit's CSS.
   * @example
   *
   * r.getSubreddit('snoowrap').getStylesheet().then(console.log)
   * // => '.md blockquote,.md del,body{color:#121212}.usertext-body ... '
   */
  getStylesheet (): Promise<string> {
    return this._get({url: `r/${this.display_name}/stylesheet`})
  }
  /**
   * @summary Conducts a search of reddit submissions, restricted to this subreddit.
   * @param {object} options Search options. Can also contain options for the resulting Listing.
   * @example
   *
   * r.getSubreddit('snoowrap').search({q: 'blah', sort: 'year'}).then(console.log)
   * // => Listing [
   * //  Submission { ... },
   * //  Submission { ... },
   * //  ...
   * // ]
   */
  search (options: OmitProps<SearchOptions, 'subreddit'|'restrict_sr'>) {
    return this._r.search({...options, subreddit: this, restrict_sr: true})
  }
  /**
   * @summary Gets the list of banned users on this subreddit.
   * @param {object} options Filtering options. Can also contain options for the resulting Listing.
   * @returns A Listing of users
   * @example
   *
   * r.getSubreddit('snoowrap').getBannedUsers().then(console.log)
   * // => Listing [
   * //  { date: 1461720936, note: '', name: 'actually_an_aardvark', id: 't2_q3519' }
   * //  ...
   * // ]
   *
   */
  getBannedUsers (options?: UserListingQuery) {
    return this._getListing({uri: `r/${this.display_name}/about/banned`, qs: options})
  }
  /**
   * @summary Gets the list of muted users on this subreddit.
   * @param {object} options Filtering options. Can also contain options for the resulting Listing.
   * @returns A Listing of users
   * @example
   *
   * r.getSubreddit('snoowrap').getBannedUsers().then(console.log)
   * // => Listing [
   * //  { date: 1461720936, name: 'actually_an_aardvark', id: 't2_q3519' }
   * //  ...
   * // ]
   */
  getMutedUsers (options?: UserListingQuery) {
    return this._getListing({uri: `r/${this.display_name}/about/muted`, qs: options})
  }
  /**
   * @summary Gets the list of users banned from this subreddit's wiki.
   * @param {object} options Filtering options. Can also contain options for the resulting Listing.
   * @returns A Listing of users
   * @example
   *
   * r.getSubreddit('snoowrap').getWikibannedUsers().then(console.log)
   * // => Listing [
   * //  { date: 1461720936, note: '', name: 'actually_an_aardvark', id: 't2_q3519' }
   * //  ...
   * // ]
   */
  getWikibannedUsers (options?: UserListingQuery) {
    return this._getListing({uri: `r/${this.display_name}/about/wikibanned`, qs: options})
  }
  /**
   * @summary Gets the list of approved submitters on this subreddit.
   * @param {object} options Filtering options. Can also contain options for the resulting Listing.
   * @returns A Listing of users
   * @example
   *
   * r.getSubreddit('snoowrap').getContributors().then(console.log)
   * // => Listing [
   * //  { date: 1461720936, name: 'actually_an_aardvark', id: 't2_q3519' }
   * //  ...
   * // ]
   */
  getContributors (options?: UserListingQuery) {
    return this._getListing({uri: `r/${this.display_name}/about/contributors`, qs: options})
  }
  /**
   * @summary Gets the list of approved wiki submitters on this subreddit .
   * @param {object} options Filtering options. Can also contain options for the resulting Listing.
   * @returns A Listing of users
   * @example
   *
   * r.getSubreddit('snoowrap').getWikiContributors().then(console.log)
   * // => Listing [
   * //  { date: 1461720936, name: 'actually_an_aardvark', id: 't2_q3519' }
   * //  ...
   * // ]
   */
  getWikiContributors (options?: UserListingQuery) {
    return this._getListing({uri: `r/${this.display_name}/about/wikicontributors`, qs: options})
  }
  /**
   * @summary Gets the list of moderators on this subreddit.
   * @param {object} options
   * @returns An Array of RedditUsers representing the moderators of this subreddit
   * @example
   *
   * r.getSubreddit('AskReddit').getModerators().then(console.log)
   * // => [
   * //  RedditUser { date: 1453862639, mod_permissions: [ 'all' ], name: 'not_an_aardvark', id: 't2_k83md' },
   * //  ...
   * // ]
   *
   */
  getModerators (options?: UserListingQuery) {
    return this._get({url: `r/${this.display_name}/about/moderators`, params: options})
  }
  /**
   * @summary Deletes the banner for this Subreddit.
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').deleteBanner()
   */
  async deleteBanner () {
    const res = await this._post({url: `r/${this.display_name}/api/delete_sr_banner`, form: {api_type}})
    handleJsonErrors(res)
    return this
  }
  /**
   * @summary Deletes the header image for this Subreddit.
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').deleteHeader()
   */
  async deleteHeader () {
    const res = await this._post({url: `r/${this.display_name}/api/delete_sr_header`, form: {api_type}})
    handleJsonErrors(res)
    return this
  }
  /**
   * @summary Deletes this subreddit's icon.
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').deleteIcon()
   */
  async deleteIcon () {
    const res = await this._post({url: `r/${this.display_name}/api/delete_sr_icon`, form: {api_type}})
    handleJsonErrors(res)
    return this
  }
  /**
   * @summary Deletes an image from this subreddit.
   * @param {string} img_name The name of the image.
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').deleteImage()
   */
  async deleteImage (img_name: string) {
    const res = await this._post({
      url: `r/${this.display_name}/api/delete_sr_img`,
      form: {api_type, img_name}
    })
    handleJsonErrors(res)
    return this
  }
  /**
   * @summary Gets this subreddit's current settings.
   * @returns An Object containing this subreddit's current settings.
   * @example
   *
   * r.getSubreddit('snoowrap').getSettings().then(console.log)
   * // => SubredditSettings { default_set: true, submit_text: '', subreddit_type: 'private', ... }
   */
  getSettings () {
    return this._get({url: `r/${this.display_name}/about`})
  }
  /**
   * @summary Edits this subreddit's settings.
   * @param {object} options An Object containing {[option name]: new value} mappings of the options that should be modified.
   * Any omitted option names will simply retain their previous values.
   * @param {string} options.title The text that should appear in the header of the subreddit
   * @param {string} options.public_description The text that appears with this Subreddit on the search page, or on the
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
   * one of `confidence, top, new, controversial, old, random, qa, live`. If left blank, there will be no suggested sort,
   * which means that users will see the sort method that is set in their own preferences (usually `confidence`.)
   * @param {boolean} [options.spoilers_enabled=false] Determines whether users can mark their posts as spoilers
   * @returns A Promise that fulfills with this Subreddit when the request is complete.
   * @example r.getSubreddit('snoowrap').editSettings({submit_text: 'Welcome! Please be sure to read the rules.'})
   */
  async editSettings (options: SubredditOptions) {
    const currentValues = await this.getSettings()
    const name = (await this.fetch())!.name
    await this._r._createOrEditSubreddit({
      ...renameKey(currentValues, 'subreddit_type', 'type'),
      ...options,
      sr: name
    })
    return this
  }
  /**
   * @summary Gets a list of recommended other subreddits given this one.
   * @param {object} [options]
   * @param {Array} [options.omit=[]] An Array of subreddit names that should be excluded from the listing.
   * @returns An Array of subreddit names
   * @example
   *
   * r.getSubreddit('AskReddit').getRecommendedSubreddits().then(console.log)
   * // [ 'TheChurchOfRogers', 'Sleepycabin', ... ]
   */
  async getRecommendedSubreddits (options: {omit: string[], [key: string]: any}) {
    const toOmit = options.omit && options.omit.join(',')
    const names = await this._get({url: `api/recommend/sr/${this.display_name}`, params: {omit: toOmit}})
    return map(names, 'sr_name')
  }
  /**
   * @summary Gets the submit text (which displays on the submission form) for this subreddit.
   * @returns The submit text, represented as a string.
   * @example
   *
   * r.getSubreddit('snoowrap').getSubmitText().then(console.log)
   * // => 'Welcome! Please be sure to read the rules.'
   */
  async getSubmitText () {
    const res = await this._get({url: `r/${this.display_name}/api/submit_text`})
    return res.submit_text
  }
  /**
   * @summary Updates this subreddit's stylesheet.
   * @param {object} options
   * @param {string} options.css The new contents of the stylesheet
   * @param {string} [options.reason] The reason for the change (256 characters max)
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').updateStylesheet({css: 'body {color:#00ff00;}', reason: 'yay green'})
   */
  async updateStylesheet ({css, reason}) {
    const res = await this._post({
      url: `r/${this.display_name}/api/subreddit_stylesheet`,
      form: {api_type, op: 'save', reason, stylesheet_contents: css}
    })
    handleJsonErrors(res)
    return this
  }

  async _setSubscribed (status: boolean) {
    await this._post({
      url: 'api/subscribe',
      form: {action: status ? 'sub' : 'unsub', sr_name: this.display_name}
    })
    return this
  }
  /**
   * @summary Subscribes to this subreddit.
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').subscribe()
   */
  subscribe () {
    return this._setSubscribed(true)
  }
  /**
   * @summary Unsubscribes from this subreddit.
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').unsubscribe()
   */
  async unsubscribe () {
    /**
     * Reddit returns a 404 error if the user attempts to unsubscribe to a subreddit that they weren't subscribed to in the
     * first place. It also (as one would expect) returns a 404 error if the subreddit in question does not exist. snoowrap
     * should swallow the first type of error internally, but it should raise the second type of error. Unfortunately, the errors
     * themselves are indistinguishable. So if a 404 error gets thrown, fetch the current subreddit to check if it exists. If it
     * does exist, then the 404 error was of the first type, so swallow it and return the current Subreddit object as usual. If
     * the subreddit doesn't exist, then the original error was of the second type, so throw it.
     */
    try {
      await this._setSubscribed(false)
    } catch (e) {
      if ((e as AxiosError).response!.status === 404) {
        return await this.fetch()
      }
      throw e
    }
    return this
  }
  async _uploadSrImg ({name, file, uploadType, imageType}) {
    if (typeof file !== 'string' && !(stream && file instanceof stream.Readable)) {
      throw new InvalidMethodCallError('Uploaded image filepath must be a string or a ReadableStream.')
    }
    const parsedFile = typeof file === 'string' ? fs && fs.createReadStream(file) : file
    const result = await this._post({
      url: `r/${this.display_name}/api/upload_sr_img`,
      formData: {name, upload_type: uploadType, img_type: imageType, file: parsedFile}
    })
    if (result.errors.length) {
      throw result.errors[0]
    }
    return this
  }
  /**
   * @summary Uploads an image for use in this subreddit's stylesheet.
   * @param {object} options
   * @param {string} options.name The name that the new image should have in the stylesheet
   * @param {string|stream.Readable} options.file The image file that should get uploaded. This should either be the path to an
   * image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) in environments (e.g.
   * browsers) where the filesystem is unavailable.
   * @param {string} [options.imageType='png'] Determines how the uploaded image should be stored. One of `png, jpg`
   * @returns A Promise that fulfills with this Subreddit when the request is complete.
   * @example r.getSubreddit('snoowrap').uploadSubredditImage({name: 'the cookie monster', file: './cookie_monster.png'})
   */
  uploadStylesheetImage ({name, file, image_type = 'png', imageType = image_type}) {
    return this._uploadSrImg({name, file, imageType, uploadType: 'img'})
  }
  /**
   * @summary Uploads an image to use as this subreddit's header.
   * @param {object} options
   * @param {string|stream.Readable} options.file The image file that should get uploaded. This should either be the path to an
   * image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
   * browsers) where the filesystem is unavailable.
   * @param {string} [options.imageType='png'] Determines how the uploaded image should be stored. One of `png, jpg`
   * @returns A Promise that fulfills with this Subreddit when the request is complete.
   * @example r.getSubreddit('snoowrap').uploadHeaderImage({name: 'the cookie monster', file: './cookie_monster.png'})
   */
  uploadHeaderImage ({file, image_type = 'png', imageType = image_type}) {
    return this._uploadSrImg({file, imageType, uploadType: 'header'})
  }
  /**
   * @summary Uploads an image to use as this subreddit's mobile icon.
   * @param {object} options
   * @param {string|stream.Readable} options.file The image file that should get uploaded. This should either be the path to an
   * image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
   * browsers) where the filesystem is unavailable.
   * @param {string} [options.imageType='png'] Determines how the uploaded image should be stored. One of `png, jpg`
   * @returns A Promise that fulfills with this Subreddit when the request is complete.
   * @example r.getSubreddit('snoowrap').uploadIcon({name: 'the cookie monster', file: './cookie_monster.png'})
   */
  uploadIcon ({file, image_type = 'png', imageType = image_type}) {
    return this._uploadSrImg({file, imageType, uploadType: 'icon'})
  }
  /**
   * @summary Uploads an image to use as this subreddit's mobile banner.
   * @param {object} options
   * @param {string|stream.Readable} options.file The image file that should get uploaded. This should either be the path to an
   * image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
   * browsers) where the filesystem is unavailable.
   * @param {string} [options.imageType='png'] Determines how the uploaded image should be stored. One of `png, jpg`
   * @returns A Promise that fulfills with this Subreddit when the request is complete.
   * @example r.getSubreddit('snoowrap').uploadBannerImage({name: 'the cookie monster', file: './cookie_monster.png'})
   */
  uploadBannerImage ({file, image_type = 'png', imageType = image_type}) {
    return this._uploadSrImg({file, imageType, upload_type: 'banner'})
  }
  /**
   * @summary Gets information on this subreddit's rules.
   * @returns A Promise that fulfills with information on this subreddit's rules.
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
    return this._get({url: `r/${this.display_name}/about/rules`})
  }
  /**
   * @summary Gets the stickied post on this subreddit, or throws a 404 error if none exists.
   * @param {object} [options]
   * @param {number} [options.num=1] The number of the sticky to get. Should be either `1` (first sticky) or `2` (second sticky).
   * @returns A Submission object representing this subreddit's stickied submission
   * @example
   * r.getSubreddit('snoowrap').getSticky({num: 2})
   * // => Submission { ... }
   */
  getSticky ({num = 1} = {}) {
    return this._get({url: `r/${this.display_name}/about/sticky`, params: {num}})
  }
  async _friend (options) {
    const res = await this._post({
      url: `r/${this.display_name}/api/friend`,
      form: {...options, api_type}
    })
    handleJsonErrors(res)
    return this
  }
  async _unfriend (options) {
    const res = await this._post({
      url: `r/${this.display_name}/api/unfriend`,
      form: {...options, api_type}
    })
    handleJsonErrors(res)
    return this
  }
  /**
   * @summary Invites the given user to be a moderator of this subreddit.
   * @param {object} options
   * @param {string} options.name The username of the account that should be invited
   * @param {Array} [options.permissions] The moderator permissions that this user should have. This should be an array
   * containing some combination of `"wiki", "posts", "access", "mail", "config", "flair"`. To add a moderator with full
   * permissions, omit this property entirely.
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').inviteModerator({name: 'actually_an_aardvark', permissions: ['posts', 'wiki']})
   */
  inviteModerator ({name, permissions}) {
    return this._friend({name, permissions: formatModPermissions(permissions), type: 'moderator_invite'})
  }
  /**
   * @summary Revokes an invitation for the given user to be a moderator.
   * @param {object} options
   * @param {string} options.name The username of the account whose invitation should be revoked
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').revokeModeratorInvite({name: 'actually_an_aardvark'})
   */
  revokeModeratorInvite ({name}) {
    return this._unfriend({name, type: 'moderator_invite'})
  }
  /**
   * @summary Removes the given user's moderator status on this subreddit.
   * @param {object} options
   * @param {string} options.name The username of the account whose moderator status should be removed
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').removeModerator({name: 'actually_an_aardvark'})
   */
  removeModerator ({name}) {
    return this._unfriend({name, type: 'moderator'})
  }
  /**
   * @summary Makes the given user an approved submitter of this subreddit.
   * @param {object} options
   * @param {string} options.name The username of the account that should be given this status
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').addContributor({name: 'actually_an_aardvark'})
   */
  addContributor ({name}) {
    return this._friend({name, type: 'contributor'})
  }
  /**
   * @summary Revokes this user's approved submitter status on this subreddit.
   * @param {object} options
   * @param {string} options.name The username of the account whose status should be revoked
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').removeContributor({name: 'actually_an_aardvark'})
   */
  removeContributor ({name}) {
    return this._unfriend({name, type: 'contributor'})
  }
  /**
   * @summary Bans the given user from this subreddit.
   * @param {object} options
   * @param {string} options.name The username of the account that should be banned
   * @param {string} [options.banMessage] The ban message. This will get sent to the user in a private message, alerting them
   * that they have been banned.
   * @param {string} [options.banReason] A string indicating which rule the banned user broke (100 characters max)
   * @param {number} [options.duration] The duration of the ban, in days. For a permanent ban, omit this parameter.
   * @param {string} [options.banNote] A note that appears on the moderation log, usually used to indicate the reason for the
   * ban. This is not visible to the banned user. (300 characters max)
   * @returns A Promise that fulfills with this Subreddit when the request is complete
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
    })
  }
  /**
   * @summary Unbans the given user from this subreddit.
   * @param {object} options
   * @param {string} options.name The username of the account that should be unbanned
   * @returns A Promise that fulfills when the request is complete
   * @example r.getSubreddit('snoowrap').unbanUser({name: 'actually_an_aardvark'})
   */
  unbanUser ({name}) {
    return this._unfriend({name, type: 'banned'})
  }
  /**
   * @summary Mutes the given user from messaging this subreddit for 72 hours.
   * @param {object} options
   * @param {string} options.name The username of the account that should be muted
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').muteUser({name: 'actually_an_aardvark'})
   */
  muteUser ({name}) {
    return this._friend({name, type: 'muted'})
  }
  /**
   * @summary Unmutes the given user from messaging this subreddit.
   * @param {object} options
   * @param {string} options.name The username of the account that should be muted
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').unmuteUser({name: 'actually_an_aardvark'})
   */
  unmuteUser ({name}) {
    return this._unfriend({name, type: 'muted'})
  }
  /**
   * @summary Bans the given user from editing this subreddit's wiki.
   * @param {object} options
   * @param {string} options.name The username of the account that should be wikibanned
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').wikibanUser({name: 'actually_an_aardvark'})
   */
  wikibanUser ({name}) {
    return this._friend({name, type: 'wikibanned'})
  }
  /**
   * @summary Unbans the given user from editing this subreddit's wiki.
   * @param {object} options
   * @param {string} options.name The username of the account that should be unwikibanned
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').unwikibanUser({name: 'actually_an_aardvark'})
   */
  unwikibanUser ({name}) {
    return this._unfriend({name, type: 'wikibanned'})
  }
  /**
   * @summary Adds the given user to this subreddit's list of approved wiki editors.
   * @param {object} options
   * @param {string} options.name The username of the account that should be given approved editor status
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').addWikiContributor({name: 'actually_an_aardvark'})
   */
  addWikiContributor ({name}) {
    return this._friend({name, type: 'wikicontributor'})
  }
  /**
   * @summary Removes the given user from this subreddit's list of approved wiki editors.
   * @param {object} options
   * @param {string} options.name The username of the account whose approved editor status should be revoked
   * @returns A Promise that fulfills with this Subreddit when the request is complete
   * @example r.getSubreddit('snoowrap').removeWikiContributor({name: 'actually_an_aardvark'})
   */
  removeWikiContributor ({name}) {
    return this._unfriend({name, type: 'wikicontributor'})
  }
  /**
   * @summary Sets the permissions for a given moderator on this subreddit.
   * @param {object} options
   * @param {string} options.name The username of the moderator whose permissions are being changed
   * @param {Array} [options.permissions] The new moderator permissions that this user should have. This should be an array
   * containing some combination of `"wiki", "posts", "access", "mail", "config", "flair"`. To add a moderator with full
   * permissions, omit this property entirely.
   * @returns A Promise that fulfills with this Subreddit when this request is complete
   * @example r.getSubreddit('snoowrap').setModeratorPermissions({name: 'actually_an_aardvark', permissions: ['mail']})
   */
  async setModeratorPermissions ({name, permissions}) {
    const res = await this._post({
      url: `r/${this.display_name}/api/setpermissions`,
      form: {api_type, name, permissions: formatModPermissions(permissions), type: 'moderator'}
    })
    handleJsonErrors(res)
    return this
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
  getWikiPage (title: string) {
    return this._r._newObject('WikiPage', {subreddit: this, title})
  }
  /**
   * @summary Gets the list of wiki pages on this subreddit.
   * @returns An Array containing WikiPage objects
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
  async getWikiPages () {
    const res: string[] = await this._get({url: `r/${this.display_name}/wiki/pages`})
    return res.map(title => this.getWikiPage(title))
  }
  /**
   * @summary Gets a list of revisions on this subreddit's wiki.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing wiki revisions
   * @example
   *
   * r.getSubreddit('snoowrap').getWikiRevisions().then(console.log)
   * // => Listing [
   * //  { page: 'index', reason: 'added cookies', ... },
   * //  ...
   * // ]
   */
  getWikiRevisions (options: ListingQuery) {
    return this._getListing({uri: `r/${this.display_name}/wiki/revisions`, qs: options})
  }
}

export default Subreddit
