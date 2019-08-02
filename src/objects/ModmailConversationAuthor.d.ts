import Subreddit from './Subreddit';
import RedditContent from './RedditContent';
import RedditUser from './RedditUser';

export interface BanStatus {
    endDate?: string | null;
    reason: string;
    isBanned: boolean;
    isPermanent: boolean;
}

// TODO: I couldn't find any definitions for this, nor
// get the field to appear in testing
export type RecentPost = any;

export interface RecentConvo {
    date: Date;
    permalink: string;
    id: string;
    subject: string;
}

export default class ModmailConversationAuthor extends RedditContent<ModmailConversationAuthor> {
    name: string;
    isMod?: boolean;
    isAdmin?: boolean;
    isOp?: boolean;
    isParticipant?: boolean;
    isHidden?: boolean;
    isDeleted?: boolean;

    // these fields only show up sometimes
    banStatus?: BanStatus;
    isSuspended?: boolean;
    isShadowBanned?: boolean;
    recentPosts?: { [id: string]: RecentPost };
    recentConvos?: { [id: string]: RecentConvo };

    getUser(): Promise<RedditUser>;
}
