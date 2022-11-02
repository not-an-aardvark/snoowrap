import type stream from 'stream'
import type snoowrap from './snoowrap'
import type {Comment} from './objects'
import type {MediaImg, MediaVideo, MediaGif} from './objects/MediaFile'
import type {COMMENT_SORTS} from './constants'

export type OmitProps<T, K extends PropertyKey> = {
  [P in keyof T as Exclude<P, K>]: T[P]
}

export interface CredentialsResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  scope: string
  token_type: string
  error: string
  error_description: string
}

export interface JSONResponse<T> {
  json: {
    data?: {
      things: T[]
      drafts_count: number
      id: string
      name: string
      url: string
      [key: string]: any
    }
    error: string[][]
  }
  /** Custom */
  _children: {[id: string]: Comment}
}

export interface Fancypants {
  assets: {
    caption: string|null
    id: string
    obfuscation_descriptor: any[]
    obfuscation_reason: string|null
  }[]
  output: {
    document: {
      c?: string|Fancypants['output']['document']
      e?: string
      f?: number[][]
      id?: string
      t?: string
    }[]
  }
  /** @example 'rtjson' */
  output_mode: string
}

export interface UploadResponse {
  args: {
    /** @example '//reddit-uploaded-video.s3-accelerate.amazonaws.com' */
    action: string
    /** Headers */
    fields: {
      name: string
      value: string
    }[]
  }
  asset: {
    asset_id: string
    payload: {
      filepath: string
    }
    processing_state: string
    /** @example 'wss://ws-0ffbcc476ebd6c972.wss.redditmedia.com/<asset_id>?m=<random-base64-string>' */
    websocket_url: string
  }
}

export interface Children {
  [key: string]: Comment
}

// #region Submit

export interface UploadMediaOptions {
  /**
   * The media file to upload. This should either be the path to the file (as a `string`),
   * or a [stream.Readable](https://nodejs.org/api/stream.html#stream_class_stream_readable),
   * or a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob),
   * or a [File](https://developer.mozilla.org/en-US/docs/Web/API/File) in environments where
   * the filesystem is unavailable (e.g. browsers).
   */
  file: string|stream.Readable|Blob|File
  /**
   * The name that the file should have. Required when it cannot get diractly extracted from the provided
   * file (e.g ReadableStream, Blob).
   */
  name?: string
  /** Determines the media file type. This should be one of `img, video, gif`. */
  type?: 'img'|'video'|'gif'
  /**
   * A caption for the embedded file to be used on selfposts bodies and gallery items.
   * @desc **NOTE**: Captions on gallery items must be 180 characters or less.
   */
  caption?: string
  /** An external URL to be used on gallery items. */
  outboundUrl?: string
  /**
   * If `true`, the file won't get uploaded, and this method will return `null`. Useful if you only want
   * to validate the parameters before actually uploading the file.
   */
  validateOnly?: boolean
}

export interface UploadInlineMediaOptions extends UploadMediaOptions {
  type: 'img'|'video'|'gif'
}

export interface MediaType {
  readonly img: MediaImg
  readonly video: MediaVideo
  readonly gif: MediaGif
}

export interface SubmitOptions {
  /** The name of the subreddit where to submit the post. */
  sr: string
  /** The submission kind. */
  kind: 'link'|'image'|'video'|'videogif'|'gallery'|'self'|'poll'|'crosspost'
  /** The title of the submission. */
  title: string
  /** The url that the link submission should point to. */
  url: string
  /** The video thumbnail url. */
  video_poster_url: string
  /** The url of the websocket used to obtain the id of the newly-created submission. */
  websocketUrl: string
  /** An array containing raw gallery items.*/
  items: {
    media_id: string
    caption?: string
    outbound_url?: string
  }[]
  /** The selftext of the submission. */
  text?: string
  /**
   * The body of the submission in `richtext_json` format. See {@link snoowrap#convertToFancypants}
   * for more details. This will override `options.text` and `options.inlineMedia`.
   */
  richtext_json?: {[key: string]: any}
  /** An array of 2 to 6 poll options. */
  options: string[]
  /** The number of days the poll should accept votes. Valid values are between 1 and 7, inclusive. */
  duration: number
  /** The fullname of the original post which is being crossposted. */
  crosspost_fullname: string
  /**
   * If this is `false` and same link has already been submitted to this subreddit in the past,
   * reddit will return an error. This could be used to avoid accidental reposts.
   */
  resubmit?: boolean
  /** Determines whether inbox replies should be enabled for this submission. */
  sendreplies?: boolean
  /** Whether or not the submission should be marked NSFW. */
  nsfw?: boolean
  /** Whether or not the submission should be marked as a spoiler. */
  spoiler?: boolean
  /** The flair template to select. */
  flair_id?: string
  /**
   * If a flair template is selected and its property `flair_text_editable` is `true`, this will
   * customize the flair text.
   */
  flair_text?: string
  /** The UUID of a collection to add the newly-submitted post to. */
  collection_id?: string
  /** Set to `CHAT` to enable live discussion instead of traditional comments. */
  discussion_type?: string
  /**
   * A captcha identifier. This is only necessary if the authenticated account
   * requires a captcha to submit posts and comments.
   */
  iden?: string
  /** The response to the captcha with the given identifier. */
  captcha?: string
  [key: string]: any
}

export interface SubmitLinkOptions extends OmitProps<
  SubmitOptions,
  'kind'|'video_poster_url'|'websocketUrl'|'items'|'text'|'richtext_json'|'options'|'duration'|'crosspost_fullname'
> {}

export interface SubmitImageOptions extends OmitProps<
  SubmitOptions,
  'kind'|'url'|'video_poster_url'|'websocketUrl'|'items'|'text'|'richtext_json'|'options'|'duration'|'crosspost_fullname'
> {
  /**
   * The image to submit. This should either be the path to the image file you want to upload,
   * or a [stream.Readable](https://nodejs.org/api/stream.html#stream_class_stream_readable),
   * or a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob),
   * or a [File](https://developer.mozilla.org/en-US/docs/Web/API/File) in environments where
   * the filesystem is unavailable (e.g. browsers). Alternatively you can just pass a ready-to-use
   * {@link MediaImg} instead. See {@link snoowrap#uploadMedia} for more details.
   */
  imageFile: MediaImg|UploadMediaOptions['file']
  /**
   * The name that the image file should have. Required when it cannot get diractly extracted from
   * the provided file (e.g ReadableStream, Blob).
   */
  imageFileName?: string
  /**
   * Set to `true` to disable the use of WebSockets. If `true`, this method will return `null`.
   */
  noWebsockets: boolean
}

export interface SubmitVideoOptions extends OmitProps<
  SubmitOptions,
  'kind'|'url'|'video_poster_url'|'websocketUrl'|'items'|'text'|'richtext_json'|'options'|'duration'|'crosspost_fullname'
> {
  /**
   * The video to submit. This should either be the path to the video file you want to upload,
   * or a [stream.Readable](https://nodejs.org/api/stream.html#stream_class_stream_readable),
   * or a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob),
   * or a [File](https://developer.mozilla.org/en-US/docs/Web/API/File) in environments where
   * the filesystem is unavailable (e.g. browsers). Alternatively you can just pass a ready-to-use
   * {@link MediaVideo} instead. See {@link snoowrap#uploadMedia} for more details.
   */
  videoFile: string|stream.Readable|Blob|File|MediaVideo
  /**
   * The name that the video file should have. Required when it cannot get diractly extracted from
   * the provided file (e.g ReadableStream, Blob).
   */
  videoFileName?: string
  /**
   * The thumbnail image to use. This should either be the path to the image file you want to upload,
   * or a [stream.Readable](https://nodejs.org/api/stream.html#stream_class_stream_readable),
   * or a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob),
   * or a [File](https://developer.mozilla.org/en-US/docs/Web/API/File) in environments where
   * the filesystem is unavailable (e.g. browsers). Alternatively you can just pass a ready-to-use
   * {@link MediaImg} instead. See {@link snoowrap#uploadMedia} for more details.
   */
  thumbnailFile: string|stream.Readable|Blob|File|MediaImg
  /**
   * The name that the thumbnail file should have. Required when it cannot be diractly extracted from
   * the provided file (e.g ReadableStream, Blob).
   */
  thumbnailFileName?: string
  /**
   * If `true`, the video is submitted as a `videogif`, which is essentially a silent video.
   */
  videogif: boolean
  /**
   * Set to `true` to disable the use of WebSockets. If `true`, this method will return `null`.
   */
  noWebsockets: boolean
}

export interface SubmitGalleryOptions extends OmitProps<
  SubmitOptions,
  'kind'|'url'|'video_poster_url'|'websocketUrl'|'text'|'richtext_json'|'options'|'duration'|'crosspost_fullname'
> {
  /**
   * An array containing 2 to 20 gallery items. Currently only images are accepted. A gallery item should
   * either be a {@link MediaImg}, or an {@link UploadMediaOptions} object to be passed to {@link snoowrap#uploadMedia}
   * (`UploadMediaOptions.type` will be enforced to be `img`).
   */
  gallery: Array<MediaImg|UploadMediaOptions>
}

export interface SubmitSelfpostOptions extends OmitProps<
  SubmitOptions,
  'kind'|'url'|'video_poster_url'|'websocketUrl'|'items'|'options'|'duration'|'crosspost_fullname'
> {
  /**
   * An object containing inctances of {@link MediaFile} subclasses, or {@link UploadInlineMediaOptions} objects
   * to be passed to {@link snoowrap#uploadMedia} where `options.type` is required.
   * The keys of this object can be used as placeholders to embed media in `options.text` with the format `{key}`.
   */
  inlineMedia: {[key: string]: MediaImg|MediaVideo|MediaGif|UploadInlineMediaOptions}
}

export interface SubmitPollOptions extends OmitProps<
  SubmitOptions,
  'kind'|'url'|'video_poster_url'|'websocketUrl'|'items'|'text'|'richtext_json'|'crosspost_fullname'
> {}

export interface SubmitCrosspostOptions extends OmitProps<
  SubmitOptions,
  'kind'|'url'|'video_poster_url'|'websocketUrl'|'items'|'text'|'richtext_json'|'options'|'duration'
> {
  /* A Submission object or a post ID for the original post which is being crossposted **/
  originalPost: InstanceType<typeof snoowrap.objects.Submission>|string
}

// #endregion

export interface SubredditOptions {
  name: string
  title: string
  public_description: string
  default_set: boolean
  description: string
  allow_images: boolean
  allow_top: boolean
  captcha: string
  captcha_iden: string
  collapse_deleted_comments: boolean
  comment_score_hide_mins: number
  exclude_banned_modqueue: boolean
  'header-title': string
  hide_ads: boolean
  lang: string
  link_type: 'any'|'link'|'self'
  over_18: boolean
  public_traffic: boolean
  show_media: boolean
  show_media_preview: boolean
  spam_comments: 'low'|'high'|'all'
  spam_links: 'low'|'high'|'all'
  spam_selfposts: 'low'|'high'|'all'
  spoilers_enabled: boolean
  sr: string
  submit_link_label: string
  submit_text_label: string
  submit_text: string
  suggested_comment_sort: typeof COMMENT_SORTS[number]
  type: 'public'|'private'|'restricted'|'gold_restricted'|'gold_only'|'archived'|'employees_only'
  wiki_edit_age: number
  wiki_edit_karma: number
  wikimode: string
  [key: string]: any
}

export interface Gildings {
  /** Number of Reddit Silver awarded */
  gid_1: number
  /** Number of Reddit Gold awarded */
  gid_2: number
  /** Number of Reddit Platinum awarded */
  gid_3: number
}

export type SubredditType = 'public'|'private'|'restricted'|'gold_restricted'|'gold_only'|'archived'|'employees_only'|'user'

// #region Submission

export interface RichTextFlair {
  /** The string representation of the emoji */
  a?: string
  /** The type of the flair entry */
  e: 'text'|'emoji'
  /** URL of the emoji image */
  u?: string
  /** The text content of a text flair */
  t?: string
}

export interface Media {
  oembed?: {
    /** The username of the uploader of the source media */
    author_name?: string
    /** URL to the author's profile on the source website */
    author_url?: string
    description?: string
    height: number
    html: string
    /** Name of the source website, e.g. "gfycat", "YouTube" */
    provider_name: string
    /** URL of the source website, e.g. "https://www.youtube.com" */
    provider_url: string
    thumbnail_height: number
    thumbnail_url: string
    thumbnail_width: number
    /** Name of the media on the content site, e.g. YouTube video title */
    title: string
    type: 'video'|'rich'
    version: string
    width: number
  }
  reddit_video?: {
    dash_url: string
    duration: number
    fallback_url: string
    height: number
    hls_url: string
    is_gif: boolean
    scrubber_media_url: string
    transcoding_status: string
  }
  type?: string
}

export interface MediaEmbed {
  /** HTML string of the media, usually an iframe */
  content?: string
  height?: number
  scrolling?: boolean
  width?: number
}

export interface SecureMediaEmbed extends MediaEmbed {
  media_domain_url?: string
}

export interface ImagePreviewSource {
  url: string
  width: number
  height: number
}

export interface ImagePreview {
  source: ImagePreviewSource
  resolutions: ImagePreviewSource[]
  variants: any // ?
  id: string
}

// #endregion


export interface AssignFlairOptions {
  /** The text that the flair should have */
  text?: string
  /** The CSS class that the user's flair should have */
  css_class?: string
  /** The name of the user that flair should be assigned to */
  name?: string
  /** The name of the submission that flair should be assigned to */
  link?: string
  /** The subreddit that flair should be assigned on */
  subredditName: string
  [key: string]: any
}

export interface SelectFlairOptions {
  /**
   * The text that the flair should have. (This is only necessary/useful if the given flair
   * template has the `text_editable` property set to `true`.)
   */
  text?: string
  /**
   * A flair template ID to use. (This should be obtained beforehand using
   * {@link Subreddit#getUserFlairTemplates}.)
   */
  flair_template_id: string
  /** The name of the user that flair should be assigned to */
  name?: string
  /** The name of the submission that flair should be assigned to */
  link?: string
  /** The subreddit that flair should be assigned on */
  subredditName: string
  [key: string]: any
}

export interface CreateFlairOptions {
  /** The text that the flair should have */
  text: string
  /** The CSS class that the user's flair should have */
  css_class?: string
  /** The type that the flair should have */
  flair_type: 'USER_FLAIR'|'LINK_FLAIR'
  /**
   * Determines whether users should be able to edit their flair text
   * when it has this template
   */
  text_editable?: boolean
  [key: string]: any
}

export interface FlairSelectorOptions {
  name?: string
  link?: string
  is_newlink?: boolean
}

export type FlairCSVOptions = {
  /** The text that the flair should have */
  text?: string
  /** The CSS class that the user's flair should have */
  css_class?: string
  /** The name of the user that flair should be assigned to */
  name: string
}[]
