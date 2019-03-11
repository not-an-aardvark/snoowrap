import RedditContent from './RedditContent';

const ModmailConversationAuthor = class ModmailParticipant extends RedditContent {
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
