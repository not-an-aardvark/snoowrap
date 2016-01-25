module.exports = {
  ENDPOINT_DOMAIN: 'reddit.com',
  MODULE_NAME: 'snoowrap',
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
    UserList: 'UserList'
  },
  username_regex: /^[\w-]{1,20}$/
};
