import RedditContent from './RedditContent.js';

const ModmailConversation = class ModmailConversation extends RedditContent {
  get _uri () {
    return `api/mod/conversations/${this.id}?markRead=false`;
  }

  _transformApiResponse (response) {
    response.conversation.owner = this._r._newObject('Subreddit', {
      id: response.conversation.owner.id,
      display_name: response.conversation.owner.displayName
    });
    const messages = [];
    const modActions = [];
    for (const objId of response.conversation.objIds) {
      if (objId.key === 'messages') {
        messages.push(response.messages[objId.id]);
      } else if (objId.key === 'modActions') {
        messages.push(response.modActions[objId.id]);
      }
    }
    return this._r._newObject('ModmailConversation',{
      messages,
      modActions,
      ...response.conversation
    });
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
    return this._post({uri: `api/mod/conversations/${this.id}/read`});
  }
  unread () {
    return this._post({uri: `api/mod/conversations/${this.id}/unread`});
  }
  getModmailsByAuthor () {
    return this._get({uri: `api/mod/conversations/${this.id}/user`});
  }

  getSubject () {
    return this.subject;
  }

  getParticipant () {
    return this.participant;
  }
};

export default ModmailConversation;
