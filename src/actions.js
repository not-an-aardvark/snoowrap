'use strict';
module.exports = {
  // Note: Make sure to set request.defaults to include {id: this.name}
  reply: {
    reply (text) {
      return this._ac.post({uri: '/api/comment', formData: {api_type: 'json', text, id: undefined, thing_id: this.name}});
    }
  },
  vote: {
    vote (direction) {
      return this._ac.post({uri: '/api/vote', formData: {dir: direction}});
    },
    upvote () {
      return this.vote(1);
    },
    downvote () {
      return this.vote(-1);
    },
    unvote () {
      return this.vote(0);
    }
  },
  moderate: {
    remove ({spam: is_spam = false} = {}) {
      return this._ac.post({uri: '/api/remove', formData: {spam: is_spam}});
    },
    mark_as_spam () {
      return this.remove({spam: true});
    },
    approve () {
      return this._ac.post({uri: '/api/approve', formData: {id: this.name}});
    },
    ignore_reports () {
      return this._ac.post({uri: '/api/ignore_reports', formData: {id: this.name}});
    },
    unignore_reports () {
      return this._ac.post({uri: '/api/unignore_reports', formData: {id: this.name}});
    },
    set_ignore_reports (ignore_status) {
      return this[ignore_status ? 'ignore_reports' : 'unignore_reports']();
    },
    distinguish ({status = true, sticky = false}) {
      return this._ac.post({uri: '/api/distinguish', formData: {how: status === true ? 'yes' : status === false ? 'no' : status, sticky}});
    },
    undistinguish () {
      return this.distinguish({type: false, sticky: false});
    }
  }
};
