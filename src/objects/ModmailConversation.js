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
    response.conversation.participant = this._r._newObject('ModmailConversationAuthor', {
      modmailConversation: this,
      ...response.user
    });

    for (let author of response.conversation.authors) {
      author = this._r._newObject('ModmailConversationAuthor', {
        ...author
      });
    }

    const messages = [];
    const modActions = [];
    const otherObjects = {};
    for (const objId of response.conversation.objIds) {
      if (objId.key === 'messages') {
        messages.push(response[objId.key][objId.id]);
      } else if (objId.key === 'modActions') {
        modActions.push(response[objId.key][objId.id]);
      } else {
        if (!otherObjects[objId.key]) {
          otherObjects[objId.key] = [];
        }
        otherObjects[objId.key].push(response[objId.key][objId.id]);
      }
    }
    return this._r._newObject('ModmailConversation', {
      messages,
      modActions,
      ...otherObjects,
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

  isHighlighted () {
    return this.isHighlighted;
  }
};

export default ModmailConversation;
