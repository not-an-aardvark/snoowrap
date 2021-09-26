/**
 * @summary An Interface representing params to pass to the {@link MediaFile} constructor.
 */
export interface FileInfo {
    fileUrl: string
    assetId: string
    websocketUrl?: string
    caption?: string
    outboundUrl?: string
}

/**
 * A class representing media files uploaded to reddit to be embedded on submissions. See {@link snoowrap#uploadMedia} for more details.
 */
export default class MediaFile {
    /**
     * @summary The media type. Only available on {@link MediaImg}, {@link MediaVideo} and {@link MediaGif}.
     */
    type?: string;
    /**
     * @summary A direct URL to the uploaded file. Used to embed the file on image/video submissions.
     */
    fileUrl: string;
    /**
     * @summary A unique identifier for the uploaded file. Used to embed the file on selfposts and galleries.
     */
    assetId: string;
    /**
     * @summary The websocket URL can be used to determine when media processing is finished and to obtain the newly created submission ID.
     */
    websocketUrl?: string;
    /**
     * @summary A caption for the embedded file to be used on selfposts bodies and gallery items.
     * @desc **NOTE**: Captions on gallery items must be 180 characters or less.
     */
    caption?: string;
    /**
     * @summary An external URL to be used on gallery items.
     */
    outboundUrl?: string;

    /**
     * @summary Constructs a new media file. In most cases you should call {@link snoowrap#uploadMedia} instead.
     * @param {FileInfo} options An object containing `fileUrl`, `assetId` along with optional `websocketUrl`, `caption` and `outboundUrl`.
     */
    constructor ({fileUrl, assetId, websocketUrl = '', caption = '', outboundUrl = ''}: FileInfo) {
        this.fileUrl = fileUrl;
        this.assetId = assetId;
        this.websocketUrl = websocketUrl;
        this.caption = caption;
        this.outboundUrl = outboundUrl;
    }

    /**
     * @summary This method allows to embed media files on selfposts bodies. This only works with {@link MediaImg}, {@link MediaVideo}
     * and {@link MediaGif} where the `type` property is set.
     * @desc **NOTE**: Embedded media will have a padding of `\n\n` automatically added. This is due to the weirdness with Reddit's API.
     * @returns {string} A string representation of the media file in Markdown format.
     * @example
     * 
     * const mediaImg = await r.uploadMedia({ // Usage as a `MediaImg`.
     *   file: './image.png',
     *   type: 'img',
     *   caption: 'optional caption'
     * })
     * 
     * const body = `This is an inline image: ${mediaImg} Cool huh?`
     * => "This is an inline image: \n\n![img](qwertyuiop \"optional caption\")\n\n Cool huh?"
     */
    toString (): string {
        return this.type ? `\n\n![${this.type}](${this.assetId} "${this.caption ? this.caption : ''}")\n\n` : '';
    }
}

/**
 * A subclass of {@link MediaFile} representing an image. The only difference is that the `type` property is set to `img`
 */
export class MediaImg extends MediaFile {
    /**
     * @summary The media type.
     */
    type = 'img';

    constructor(options: FileInfo) {
        super(options)
    }
}

/**
 * A subclass of {@link MediaFile} representing a video. The only difference is that the `type` property is set to `video`
 */
export class MediaVideo extends MediaFile {
    /**
     * @summary The media type.
     */
    type = 'video';

    constructor(options: FileInfo) {
        super(options)
    }
}

/**
 * A subclass of {@link MediaFile} representing a videogif. The only difference is that the `type` property is set to `gif`
 */
export class MediaGif extends MediaVideo {
    /**
     * @summary The media type.
     */
    type = 'gif';

    constructor(options: FileInfo, a: boolean) {
        super(options)
    }
}
