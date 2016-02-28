'use strict';
/**
* A class representing a reddit comment
* @extends VoteableContent
*/
const Comment = class extends require('./VoteableContent') {
  _transform_api_response (response_obj) {
    const replies_uri = `comments/${response_obj[0].link_id.slice(3)}`;
    const replies_query = {comment: this.name.slice(3)};
    const _transform = item => item.comments[0].replies;
    response_obj[0].replies = this._ac._new_object('Listing', {uri: replies_uri, query: replies_query, _transform});
    return response_obj[0];
  }
  get _uri () {
    return `api/info?id=${this.name}`;
  }
};

module.exports = Comment;
