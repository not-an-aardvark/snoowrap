import Subreddit from './Subreddit';
import RedditContent from './RedditContent';
import RedditUser from './RedditUser';

export interface BanStatus {
    endDate?: string | null;
    reason: string;
    isBanned: boolean;
    isPermanent: boolean;
}

export interface RecentPost {
    date: string;
    permalink: string;
    title: string;
}

export interface RecentConvo {
    date: string;
    permalink: string;
    id: string;
    subject: string;
}

export interface RecentComment {
    date: string;
    permalink: string;
    title: string;
    comment: string;
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
    recentComments?: { [id: string]: RecentComment };

    getUser(): Promise<RedditUser>;
}
