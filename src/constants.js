module.exports = {
  // SCREAMING_SNAKE_CASE MAKES EVERYTHING SEEM I'M SHOUTING AAAAAAAA
  MODULE_NAME: require('../package.json').name,
  ISSUE_REPORT_LINK: require('../package.json').bugs.url,
  DOCS_LINK: 'https://not-an-aardvark.github.io/snoowrap/',
  API_RULES_LINK: 'https://github.com/reddit/reddit/wiki/API',
  USER_KEYS: ['author', 'approved_by', 'banned_by'],
  SUBREDDIT_KEYS: ['subreddit'],
  KINDS: {
    t1: 'Comment',
    t2: 'RedditUser',
    t3: 'Submission',
    t4: 'PrivateMessage',
    t5: 'Subreddit',
    t6: 'Trophy',
    t8: 'PromoCampaign',
    Listing: 'Listing',
    more: 'more',
    UserList: 'UserList',
    KarmaList: 'KarmaList',
    TrophyList: 'TrophyList',
    subreddit_settings: 'SubredditSettings'
  },
  USERNAME_REGEX: /^[\w-]{1,20}$/,
  REQUEST_TYPES: ['get', 'head', 'post', 'put', 'delete', 'trace', 'options', 'connect', 'patch']
};
