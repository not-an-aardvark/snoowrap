import RedditContent from './RedditContent';

/**
 * A class representing an author from a modmail conversation
 * <style> #ModmailConversationAuthor {display: none} </style>
 * @example
 *
 * // Get a Modmail Conversation author with a given ID
 * r.getNewModmailConversation('75hxt').getParticipant()
 * @extends RedditContent
 */
const ModmailConversationAuthor = class ModmailParticipant extends RedditContent {
  constructor (options, r, hasFetched) {
    super(options, r, hasFetched);

    options.recentComments = Object.keys(options.recentComments).map(commentId => this._r._newObject('Comment', {
      name: commentId,
      ...options.recentComments[commentId]
    }));

    options.recentPosts = Object.keys(options.recentPosts).map(postId => this._r._newObject('Submission', {
      name: postId,
      ...options.recentPosts[postId]
    }));
  }

  /**
   * @summary Gets information on a Reddit user for the given modmail.
   * @returns {RedditUser} An unfetched RedditUser object for the requested user
   * @example
   *
   * r.getNewModmailConversation('efy3lax').getParticipant().getUser()
   * // => RedditUser { name: 'not_an_aardvark' }
   * r.getNewModmailConversation('efy3lax').getParticipant().getUser().link_karma.then(console.log)
   * // => 6
   */
  getUser () {
    return this._r.getUser(this.name);
  }
};

export default ModmailConversationAuthor;
