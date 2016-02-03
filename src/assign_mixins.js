'use strict';
let _ = require('lodash');
let promise_wrap = require('promise-chains');

/* Given `objects` (an array of classes), and `mixin_methods` (an object containing multiple functions),
* assign all of the functions in `mixin_methods` to the prototype of each class in `objects`. */
let assign_to_prototypes = (objects, mixin_methods) => {
  _.map(objects, 'prototype').forEach(_(_.assign).partialRight(mixin_methods).unary().value());
};

/* Many actions (e.g. replying) are applicable to multiple classes (e.g. Comments, Submissions, PrivateMessages).
* Rather than defining actions on individual classes and having a lot of duplicates, all methods that interact with reddit are
* defined here as mixins (with the exception of a few lower-level tasks, such as updating access tokens). Then the methods
* are explicitly assigned to the prototypes of multiple classes. */
module.exports = snoowrap => {
  assign_to_prototypes([snoowrap], {
    get_me () {
      return this.get('api/v1/me').then(result => {
        this.own_user_info = new snoowrap.objects.RedditUser(result, this, true);
        return this.own_user_info;
      });
    },
    get_user (name) {
      return new snoowrap.objects.RedditUser({name}, this);
    },
    get_comment (comment_id) {
      return new snoowrap.objects.Comment({name: `t1_${comment_id}`}, this);
    },
    get_subreddit (display_name) {
      return new snoowrap.objects.Subreddit({display_name}, this);
    },
    get_submission (submission_id) {
      return new snoowrap.objects.Submission({name: `t3_${submission_id}`}, this);
    },
    get_hot ({subreddit_name} = {}) {
      return new snoowrap.objects.Listing({uri: (subreddit_name ? `r/${subreddit_name}/` : '') + 'hot'}, this);
    },
    get_karma () {
      return this.get({uri: 'api/v1/me/karma'});
    },
    get_preferences () {
      return this.get({uri: 'api/v1/me/prefs'});
    },
    update_preferences (updated_preferences) {
      // reddit expects all fields to be present in the patch request, so get the current values of the fields
      // and then apply the changes.
      return this.get_preferences().then(current_prefs => {
        return this.patch({uri: 'api/v1/me/prefs', body: _.assign(current_prefs, updated_preferences)});
      });
    },
    get_trophies () {
      return this.get({uri: 'api/v1/me/trophies'});
    },
    get_friends () {
      return this.get({uri: 'prefs/friends'});
    },
    get_blocked () {
      return this.get({uri: 'prefs/blocked'});
    },
    needs_captcha () {
      return this.get({uri: 'api/needs_captcha'});
    },
    get_new_captcha_identifier () {
      return this.post({uri: 'api/new_captcha', form: {api_type: 'json'}}).json.data.iden;
    },
    get_captcha_image ({identifier}) {
      return this.get({uri: `captcha/${identifier}`});
    }
  });

  assign_to_prototypes([snoowrap.objects.Comment, snoowrap.objects.Submission], {
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
    }
  });

  assign_to_prototypes([snoowrap.objects.PrivateMessage, snoowrap.objects.Comment, snoowrap.objects.Submission], {
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

  assign_to_prototypes([snoowrap.objects.Subreddit], {
    get_moderators () {
      return this._ac.get(`r/${this.display_name}/about/moderators`);
    },
    _delete_flair_templates ({flair_type}) {
      return this.post({uri: `r/${this.display_name}/api/clearflairtemplates`, form: {api_type: 'json', flair_type}});
    },
    delete_all_user_flair_templates () {
      return this._delete_flair_templates({flair_type: 'USER_FLAIR'});
    },
    delete_all_link_flair_templates () {
      return this._delete_flair_templates({flair_type: 'LINK_FLAIR'});
    },
    delete_flair_template ({flair_template_id}) {
      return this.post({uri: `r/${this.display_name}/api/deleteflairtemplate`, form: {api_type: 'json', flair_template_id}});
    },
    _create_flair_template ({text, css_class, flair_type, text_editable = false}) {
      return this.post({
        uri: `r/${this.display_name}/api/flairtemplate`,
        form: {api_type: 'json',
        text, css_class,
        flair_type,
        text_editable}
      });
    },
    create_user_flair_template ({text, css_class, text_editable = false}) {
      return this._create_flair_template({text, css_class, text_editable, flair_type: 'USER_FLAIR'});
    },
    create_link_flair_template ({text, css_class, text_editable = false}) {
      return this._create_flair_template({text, css_class, text_editable, flair_type: 'LINK_FLAIR'});
    },
    get_flair_options ({name, link} = {}) { // TODO: Add shortcuts for this on RedditUser and Submission
      return this.post({uri: `r/${this.display_name}/api/flairselector`, form: {name, link}});
    },
    get_user_flair_templates () {
      return this.get_flair_options().choices;
    },
    assign_flair ({link, name, text, css_class}) { // TODO: Add shortcuts for this on RedditUser and Submission
      return this.post({uri: `r/${this.display_name}/api/flair`, form: {api_type: 'json', link, name, text, css_class}});
    },
    delete_user_flair ({name}) {
      return this.post({uri: `r/${this.display_name}/api/deleteflair`, form: {api_type: 'json', name}});
    },
    get_user_flair ({name}) {
      return this.get_flair_options({name}).current;
    },
    _assign_flair_from_csv (flair_csv) {
      return this.post({uri: `r/${this.display_name}/api/flaircsv`, form: {flair_csv}});
    },
    assign_multiple_user_flairs (flair_array) { // Each entry of flair_array has the properties {name, text, css_class}
      let requests = [];
      while (flair_array.length > 0) {
        // The endpoint only accepts at most 100 lines of csv at a time, so split the array into chunks of 100.
        requests.push(this._assign_flair_from_csv(flair_array.splice(0, 100).map(item =>
          (`${item.name},${item.text || ''},${item.css_class || ''}`)).join('\n')
        ));
      }
      return promise_wrap(Promise.all(requests));
    },
    get_user_flair_list () {
      return this.get({uri: `r/${this.display_name}/api/flairlist`}).users;
    },
    configure_flair ({user_flair_enabled, user_flair_position, user_flair_self_assign_enabled, link_flair_position,
        link_flair_self_assign_enabled}) {
      return this.post({
        uri: `r/${this.display_name}/api/flairconfig`,
        form: {
          api_type: 'json',
          flair_enabled: user_flair_enabled,
          flair_position: user_flair_position,
          flair_self_assign_enabled: user_flair_self_assign_enabled,
          link_flair_position, link_flair_self_assign_enabled
        }
      });
    }
  });
};
