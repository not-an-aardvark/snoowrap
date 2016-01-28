module.exports = {
  // Note: Make sure to set request.defaults to include {id: this.name}
  reply: {
    reply: text => (this._ac.post({uri: '/api/comment', formData: {api_type: 'json', text: text, id: undefined, thing_id: this.name}}))
  },
  vote: {
    vote: direction => (this._ac.post({uri: '/api/vote', formData: {dir: direction}})),
    upvote: () => (this.vote(1)),
    downvote: () => (this.vote(-1)),
    unvote: () => (this.vote(0))
  },
  moderate: {
    remove: ({spam: is_spam} = {spam: false}) => (this._ac.post({uri: '/api/remove', formData: {spam: is_spam}})),
    mark_as_spam: () => (this.remove({spam: true})),
    approve: () => (this._ac.post({uri: '/api/approve', formData: {id: this.name}})),
    ignore_reports: () => (this._ac.post({uri: '/api/ignore_reports', formData: {id: this.name}})),
    unignore_reports: () => (this._ac.post({uri: '/api/unignore_reports', formData: {id: this.name}})),
    set_ignore_reports: ignore_status => (this[ignore_status ? 'ignore_reports' : 'unignore_reports']()),
    distinguish: ({status: status, sticky: sticky} = {status: true, sticky: false}) => (this._ac.post({uri: '/api/distinguish', formData: {how: status === true ? 'yes' : status === false ? 'no' : status, sticky: sticky}})),
    undistinguish: () => (this.distinguish({type: false, sticky: false}))
  }
};
