'use strict';
let _ = require('lodash');
let errors = require('./errors');

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
      return this.post({uri: 'api/save', form: {id: this.name}});
    },
    unsave () {
      return this.post({uri: 'api/unsave', form: {id: this.name}});
    },
    distinguish ({status = true, sticky = false}) {
      return this._ac.post({
        uri: 'api/distinguish',
        form: {how: status === true ? 'yes' : status === false ? 'no' : status, sticky, id: this.name}
      });
    },
    undistinguish () {
      return this.distinguish({type: false, sticky: false, id: this.name});
    },
    edit (updated_text) {
      return this.post({uri: 'api/editusertext', text: updated_text, thing_id: this.name});
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
    report ({reason, other_reason, site_reason}) {
      return this.post({
        uri: 'api/report',
        form: {api_type: 'json', reason, other_reason, site_reason, thing_id: this.name}
      });
    },
    ignore_reports () {
      return this.post({uri: 'api/ignore_reports', form: {id: this.name}});
    },
    unignore_reports () {
      return this.post({uri: 'api/unignore_reports', form: {id: this.name}});
    },
    reply (text) {
      return this.post({uri: 'api/comment', form: {api_type: 'json', text, thing_id: this.name}});
    }
  });
};
