module.exports = {
  MODULE_NAME: 'snoowrap',
  ISSUE_REPORT_LINK: require('../package.json').bugs.url,
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
    UserList: 'UserList'
  },
  USERNAME_REGEX: /^[\w-]{1,20}$/
};
