import Subreddit from './Subreddit';
import RedditContent from './RedditContent';
import RedditUser from './RedditUser';
import ModmailConversationAuthor from './ModmailConversationAuthor';

export enum conversationStates {
    New = 0,
    InProgress = 1,
    Archived = 2,
}

export enum modActionStates {
    Highlight = 0,
    UnHighlight = 1,
    Archive = 2,
    UnArchive = 3,
    ReportedToAdmins = 4,
    Mute = 5,
    Unmute = 6,
}

export interface ModmailMessage {
    body: string;
    bodyMarkdown: string;
    author: RedditUser;
    isInternal: boolean;
    date: string;
    id: string;
}

export interface Author {
    isMod: boolean;
    isAdmin: boolean;
    name: string;
    isOp: boolean;
    isParticipant: boolean;
    isHidden: boolean;
    id: any;
    isDeleted: boolean;
}

export interface Owner {
    displayName: string;
    type: string;
    id: string;
}

export interface ObjId {
    id: string;
    key: string;
}

export default class ModmailConversation extends RedditContent<ModmailConversation> {
    static conversationStates: conversationStates;
    static modActionStats: modActionStates;

    isAuto: boolean;
    objIds: ObjId[];
    isRepliable: boolean;
    lastUserUpdate?: any;
    isInternal: boolean;
    lastModUpdate: Date;
    lastUpdated: Date;
    authors: Author[];
    // sometimes an Owner, sometimes a Subreddit
    owner: Owner | Subreddit;
    id: string;
    isHighlighted: boolean;
    subject: string;
    participant: ModmailConversationAuthor;
    state: number;
    lastUnread?: any;
    numMessages: number;
    messages?: ModmailMessage[];

    reply(body: string, isAuthorHidden?: boolean, isInternal?: boolean): Promise<this>

    getParticipant(): Promise<ModmailConversationAuthor>;

    isRead(): boolean;

    read(): Promise<this>;
    unread(): Promise<this>;
    mute(): Promise<this>;
    unmute(): Promise<this>;
    highlight(): Promise<this>;
    unhighlight(): Promise<this>;
    archive(): Promise<this>;
    unarchive(): Promise<this>;
}
