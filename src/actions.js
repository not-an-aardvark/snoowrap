'use strict';
let _ = require('lodash');
module.exports = {
  self_getters: {
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
  },
  subreddit_flair: {
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
      return this.post({uri: `r/${this.display_name}/api/flairtemplate`, form: {api_type: 'json', text, css_class, flair_type, text_editable}});
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
    assign_flair_from_csv ({flair_csv}) { // TODO: Add a shortcut here to assign multiple flairs from javascript objects
      return this.post({uri: `r/${this.display_name}/api/flaircsv`, form: {flair_csv}});
    },
    get_user_flair_list () {
      return this.get({uri: `r/${this.display_name}/api/flairlist`}).users;
    },
    configure_flair ({user_flair_enabled, user_flair_position, user_flair_self_assign_enabled, link_flair_position, link_flair_self_assign_enabled}) {
      return this.post({uri: `r/${this.display_name}/api/flairconfig`, form: {api_type: 'json', flair_enabled: user_flair_enabled, flair_position: user_flair_position, flair_self_assign_enabled: user_flair_self_assign_enabled, link_flair_position, link_flair_self_assign_enabled}});
    }
  },
  reply: {
    reply (text) {
      return this.post({uri: 'api/comment', form: {api_type: 'json', text, thing_id: this.name}});
    }
  },
  vote: {
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
    }
  },
  moderate_posts: {
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
    distinguish ({status = true, sticky = false}) {
      return this._ac.post({uri: 'api/distinguish', form: {how: status === true ? 'yes' : status === false ? 'no' : status, sticky, id: this.name}});
    },
    undistinguish () {
      return this.distinguish({type: false, sticky: false, id: this.name});
    }
  }
};
