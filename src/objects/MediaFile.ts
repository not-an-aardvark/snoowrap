export interface FileInfo {
    fileUrl: string
    assetId: string
    websocketUrl?: string
    caption?: string
    outboundUrl?: string
}

export default class MediaFile {
    fileUrl: string;
    assetId: string;
    websocketUrl?: string;
    caption?: string;
    outboundUrl?: string;
    type?: string;

    constructor ({fileUrl, assetId, websocketUrl = '', caption = '', outboundUrl = ''}: FileInfo) {
        this.fileUrl = fileUrl;
        this.assetId = assetId;
        this.websocketUrl = websocketUrl;
        this.caption = caption;
        this.outboundUrl = outboundUrl;
    }

    toString (): string {
        return this.type ? `\n\n![${this.type}](${this.assetId} "${this.caption ? this.caption : ''}")\n\n` : '';
    }
}

export class MediaImg extends MediaFile {
    type = 'img';

    constructor(options: FileInfo) {
        super(options)
    }
}

export class MediaVideo extends MediaFile {
    type = 'video';

    constructor(options: FileInfo) {
        super(options)
    }
}

export class MediaGif extends MediaVideo {
    type = 'gif';

    constructor(options: FileInfo, a: boolean) {
        super(options)
    }
}
