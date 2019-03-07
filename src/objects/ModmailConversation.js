import RedditContent from './RedditContent.js';

const ModmailConversation = class ModmailConversation extends RedditContent {
  get _uri () {
    return `api/mod/conversations/${this.id}?markRead=false`;
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
};

export default ModmailConversation;
