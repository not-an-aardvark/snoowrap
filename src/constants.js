import package_info from '../package';
// SCREAMING_SNAKE_CASE MAKES EVERYTHING SEEM LIKE I'M SHOUTING AAAAAAAA
export const MODULE_NAME = package_info.name;
export const VERSION = package_info.version;
export const ISSUE_REPORT_LINK = package_info.bugs.url;
export const DOCS_LINK = 'https://not-an-aardvark.github.io/snoowrap/';
export const API_RULES_LINK = 'https://github.com/reddit/reddit/wiki/API';
export const USER_KEYS = ['author', 'approved_by', 'banned_by'];
export const SUBREDDIT_KEYS = ['subreddit', 'sr'];
export const KINDS = {
  t1: 'Comment',
  t2: 'RedditUser',
  t3: 'Submission',
  t4: 'PrivateMessage',
  t5: 'Subreddit',
  t6: 'Trophy',
  t8: 'PromoCampaign',
  Listing: 'Listing',
  more: 'More',
  UserList: 'UserList',
  KarmaList: 'KarmaList',
  TrophyList: 'TrophyList',
  subreddit_settings: 'SubredditSettings',
  modaction: 'ModAction',
  wikipage: 'WikiPage',
  wikipagesettings: 'WikiPageSettings',
  wikipagelisting: 'WikiPageListing',
  LiveUpdateEvent: 'LiveThread',
  LiveUpdate: 'LiveUpdate',
  LabeledMulti: 'MultiReddit'
};
export const USERNAME_REGEX = /^[\w-]{1,20}$/;
export const MODERATOR_PERMISSIONS = ['wiki', 'posts', 'access', 'mail', 'config', 'flair'];
export const LIVETHREAD_PERMISSIONS = ['update', 'edit', 'manage'];
export const HTTP_VERBS = ['delete', 'get', 'head', 'patch', 'post', 'put'];
export const MAX_TOKEN_LATENCY = 10000;
export const MAX_API_INFO_AMOUNT = 100;
export const MAX_API_MORECHILDREN_AMOUNT = 20;
export const MAX_LISTING_ITEMS = 100;
