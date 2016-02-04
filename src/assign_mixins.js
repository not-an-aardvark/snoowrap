'use strict';
let _ = require('lodash');
let errors = require('./errors');
let promise_wrap = require('promise-chains');

/* Given `objects` (an array of classes), and `mixin_methods` (an object containing multiple functions),
* assign all of the functions in `mixin_methods` to the prototype of each class in `objects`. */
let assign = (objects, mixin_methods) => {
  objects.forEach(obj => {
    _.assign(obj.prototype, mixin_methods);
  });
};

/* Many actions (e.g. replying) are applicable to multiple classes (e.g. Comments, Submissions, PrivateMessages).
* Rather than defining actions on individual classes and having a lot of duplicates, all methods that apply to multiple
classes are assigned here as mixins, where they are explicitly assigned to the prototypes of multiple classes. */
module.exports = snoowrap => {
  assign([snoowrap.objects.RedditUser, snoowrap.objects.Submission], {
    set_flair({subreddit, text, css_class}) {
      if (typeof subreddit === 'string') {
        subreddit = this._ac.get_subreddit(subreddit);
      }
      if (!subreddit) {
        throw new errors.InvalidMethodCallError(`Failed to call RedditUser.set_flair; no subreddit specified.`);
      }
      return subreddit.set_flair({name: this.name, text, css_class});
    }
  });
  assign([snoowrap.objects.Comment, snoowrap.objects.Submission], {
    _vote (direction) {
      return this.post({uri: 'api/vote', form: {dir: direction, id: this.name}});
    },
    upvote () {
      return this._vote(1);
    },
    downvote () {
      return this._vote(-1);
    },
    unvote () {
      return this._vote(0);
    },
    save () {
      return promise_wrap(this.post({uri: 'api/save', form: {id: this.name}}).then(() => {
        this.saved = true;
        return this;
      }));
    },
    unsave () {
      return promise_wrap(this.post({uri: 'api/unsave', form: {id: this.name}}).then(() => {
        this.saved = false;
        return this;
      }));
    },
    distinguish ({status = true, sticky = false} = {}) {
      return promise_wrap(this._ac.post({
        uri: 'api/distinguish',
        form: {api_type: 'json', how: status === true ? 'yes' : status === false ? 'no' : status, sticky, id: this.name}
      }).then(response => {
        snoowrap.helpers._assign_proxy(this, response.json.data.things[0]);
        return this;
      }));
    },
    undistinguish () {
      return this.distinguish({status: false, sticky: false, id: this.name});
    },
    edit (updated_text) {
      return promise_wrap(this.post({
        uri: 'api/editusertext',
        form: {api_type: 'json', text: updated_text, thing_id: this.name}
      }).then(response => {
        snoowrap.helpers._assign_proxy(this, response.json.data.things[0]);
        return this;
      }));
    },
    gild () {
      return this.post({uri: `api/v1/gold/gild/${this.name}`});
    },
    delete () {
      return this.post({uri: 'api/del', form: {id: this.name}});
    },
    set_inbox_replies_enabled(state) {
      return this.post({uri: 'api/sendreplies', form: {state, id: this.name}});
    },
    enable_inbox_replies () {
      return this.set_inbox_replies_enabled(true);
    },
    disable_inbox_replies () {
      return this.set_inbox_replies_enabled(false);
    }
  });
  assign([snoowrap.objects.Comment, snoowrap.objects.PrivateMessage, snoowrap.objects.Submission], {
    remove ({spam: is_spam = false} = {}) {
      return this.post({uri: 'api/remove', form: {spam: is_spam, id: this.name}});
    },
    mark_as_spam () {
      return this.remove({spam: true, id: this.name});
    },
    approve () {
      return this.post({uri: 'api/approve', form: {id: this.name}});
    },
    report ({reason, other_reason, site_reason} = {}) {
      return this.post({
        uri: 'api/report',
        form: {api_type: 'json', reason, other_reason, site_reason, thing_id: this.name}
      });
    },
    ignore_reports () {
      return promise_wrap(this.post({uri: 'api/ignore_reports', form: {id: this.name}}).return(this));
    },
    unignore_reports () {
      return promise_wrap(this.post({uri: 'api/unignore_reports', form: {id: this.name}}).return(this));
    },
    reply (text) {
      return this.post({uri: 'api/comment',form: {api_type: 'json', text, thing_id: this.name}}).json.data.things[0];
    }
  });
};
