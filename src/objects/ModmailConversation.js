import RedditContent from './RedditContent.js';

export const conversationStates = Object.freeze({
  New: 0,
  InProgress: 1,
  Archived: 2
});

export const modActionStates = Object.freeze({
  Highlight: 0,
  UnHighlight: 1,
  Archive: 2,
  UnArchive: 3,
  ReportedToAdmins: 4,
  Mute: 5,
  Unmute: 6
});

const ModmailConversation = class ModmailConversation extends RedditContent {

  static get conversationStates () {
    return conversationStates;
  }

  static get modActionStates () {
    return modActionStates;
  }

  get _uri () {
    return `api/mod/conversations/${this.id}?markRead=false`;
  }

  /**
   * @summary Converts relevant fields in the ModmailConversation to snoowrap models.
   * @param response API Response
   * @return {ModmailConversation}
   * @private
   */
  _transformApiResponse (response) {
    response.conversation.owner = this._r._newObject('Subreddit', {
      id: response.conversation.owner.id,
      display_name: response.conversation.owner.displayName
    });
    response.conversation.participant = this._r._newObject('ModmailConversationAuthor', response.user.name, true);
    for (let author of response.conversation.authors) {
      author = this._r._newObject('ModmailConversationAuthor', author, true);
    }

    const conversationObjects = ModmailConversation._getConversationObjects(response.conversation, response);
    return this._r._newObject('ModmailConversation', {
      ...conversationObjects,
      ...response.conversation
    }, true);
  }

  static _getConversationObjects (conversation, response) {
    const objects = {};
    for (const objId of conversation.objIds) {
      if (!objects[objId.key]) {
        objects[objId.key] = [];
      }
      objects[objId.key].push(response[objId.key][objId.id]);
    }
    return objects;
  }

  archive () {
    return this._post({uri: `api/mod/conversations/${this.id}/archive`});
  }

  unarchive () {
    return this._post({uri: `api/mod/conversations/${this.id}/unarchive`});
  }

  highlight () {
    return this._post({uri: `api/mod/conversations/${this.id}/highlight`});
  }

  unhighlight () {
    return this._delete({uri: `api/mod/conversations/${this.id}/highlight`});
  }

  mute () {
    return this._post({uri: `api/mod/conversations/${this.id}/mute`});
  }

  unmute () {
    return this._post({uri: `api/mod/conversations/${this.id}/unmute`});
  }

  read () {
    return this._post({uri: 'api/mod/conversations/read', form: {conversationIds: this.id}});
  }

  unread () {
    return this._post({uri: 'api/mod/conversations/unread', form: {conversationIds: this.id}});
  }

  getAuthor () {
    return this._get({uri: `api/mod/conversations/${this.id}/user`})
      .then(res => {
        return this._r._newObject('ModmailConversationAuthor', res, true);
      });
  }

  getSubject () {
    return this.subject;
  }

  getParticipant () {
    return this.participant;
  }

  getCurrentState () {
    return this.state;
  }
};

export default ModmailConversation;
