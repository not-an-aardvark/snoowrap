'use strict';
module.exports = {
  // Note: Make sure to set request.defaults to include {, id: this.name}
  reply: {
    reply (text) {
      return this._ac.post({uri: 'api/comment', form: {api_type: 'json', text, thing_id: this.name}});
    }
  },
  vote: {
    vote (direction) {
      return this._ac.post({uri: 'api/vote', form: {dir: direction, id: this.name}});
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
      return this._ac.post({uri: 'api/remove', form: {spam: is_spam, id: this.name}});
    },
    mark_as_spam () {
      return this.remove({spam: true, id: this.name});
    },
    approve () {
      return this._ac.post({uri: 'api/approve', form: {id: this.name}});
    },
    report ({reason, other_reason, site_reason}) {
      return this._ac.post({uri: 'api/report', form: {api_type: 'json', reason, other_reason, site_reason, thing_id: this.name}});
    },
    ignore_reports () {
      return this._ac.post({uri: 'api/ignore_reports', form: {id: this.name}});
    },
    unignore_reports () {
      return this._ac.post({uri: 'api/unignore_reports', form: {id: this.name}});
    },
    set_ignore_reports (ignore_status) {
      return this[ignore_status ? 'ignore_reports' : 'unignore_reports']();
    },
    distinguish ({status = true, sticky = false}) {
      return this._ac.post({uri: 'api/distinguish', form: {how: status === true ? 'yes' : status === false ? 'no' : status, sticky, id: this.name}});
    },
    undistinguish () {
      return this.distinguish({type: false, sticky: false, id: this.name});
    }
  }
};
