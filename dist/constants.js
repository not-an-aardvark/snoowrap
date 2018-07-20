'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var MODULE_NAME = exports.MODULE_NAME = 'snoowrap';
var VERSION = exports.VERSION = '1.15.2';
var DOCS_LINK = exports.DOCS_LINK = 'https://not-an-aardvark.github.io/snoowrap/';
var API_RULES_LINK = exports.API_RULES_LINK = 'https://github.com/reddit/reddit/wiki/API';
/* USER_KEYS and SUBREDDIT_KEYS are keys that are replaced by RedditUser and Subreddit objects when encountered in
`snoowrap#_populate`. `author`, `approved_by`, `banned_by`, and `subreddit` all appear in fetched Submissions, among other
places. `user` appears in responses from the api/flairlist endpoint, and `sr` appears in responses from the `api/v1/me/karma`
endpoint. */
var USER_KEYS = exports.USER_KEYS = new Set(['author', 'approved_by', 'banned_by', 'user']);
var SUBREDDIT_KEYS = exports.SUBREDDIT_KEYS = new Set(['subreddit', 'sr']);
var KINDS = exports.KINDS = {
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
var USERNAME_REGEX = exports.USERNAME_REGEX = /^[\w-]{1,20}$/;
var MODERATOR_PERMISSIONS = exports.MODERATOR_PERMISSIONS = ['wiki', 'posts', 'access', 'mail', 'config', 'flair'];
var LIVETHREAD_PERMISSIONS = exports.LIVETHREAD_PERMISSIONS = ['update', 'edit', 'manage'];
var HTTP_VERBS = exports.HTTP_VERBS = ['delete', 'get', 'head', 'patch', 'post', 'put'];
var IDEMPOTENT_HTTP_VERBS = exports.IDEMPOTENT_HTTP_VERBS = ['delete', 'get', 'head', 'put'];
var MAX_TOKEN_LATENCY = exports.MAX_TOKEN_LATENCY = 10000;
var MAX_API_INFO_AMOUNT = exports.MAX_API_INFO_AMOUNT = 100;
var MAX_API_MORECHILDREN_AMOUNT = exports.MAX_API_MORECHILDREN_AMOUNT = 20;
var MAX_LISTING_ITEMS = exports.MAX_LISTING_ITEMS = 100;