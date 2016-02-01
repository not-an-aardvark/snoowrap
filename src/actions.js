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
    get_new_captcha () {
      return this.post({uri: 'api/new_captcha', body: {api_type: 'json'}});
    },
    get_captcha_image (iden) {
      return this.get({uri: `captcha/${iden}`});
    }
  },
  subreddit_config: {
    clear_flair_templates ({flair_type}) {
      return this.post({uri: `r/${this.display_name}/api/clearflairtemplates`, body: {api_type: 'json', flair_type}});
    },
    clear_all_user_flair_templates () {
      return this.clear_flair_templates({flair_type: 'USER_FLAIR'});
    },
    clear_all_link_flair_templates () {
      return this.clear_flair_templates({flair_type: 'LINK_FLAIR'});
    },
    delete_user_flair ({username}) {
      return this.post({uri: `r/${this.display_name}/api/deleteflair`, body: {api_type: 'json', name: username}});
    },
    delete_flair_template ({flair_template_id}) {
      return this.post({uri: `r/${this.display_name}/api/deleteflair`, body: {api_type: 'json', flair_template_id}});
    },
    assign_flair ({link, username, text, css_class}) { // TODO: Add shortcuts for this on RedditUser and Submission
      return this.post({uri: `r/${this.display_name}/api/flair`, body: {api_type: 'json', link, name: username, text, css_class}});
    },
    configure_flair ({user_flair_enabled, user_flair_position, user_flair_self_assign_enabled, link_flair_position, link_flair_self_assign_enabled}) {
      return this.post({uri: `r/${this.display_name}/api/flairconfig`, body: {api_type: 'json', flair_enabled: user_flair_enabled, flair_position: user_flair_position, flair_self_assign_enabled: user_flair_self_assign_enabled, link_flair_position, link_flair_self_assign_enabled}});
    },
    assign_flair_from_csv ({flair_csv}) { // TODO: Add a shortcut here to assign multiple flairs from javascript objects
      return this.post({uri: `r/${this.display_name}/api/flaircsv`, body: {flair_csv}});
    },
    get_flair_list () {
      return this.get({uri: `r/${this.display_name}/api/flairlist`});
    },
    get_current_flair ({name, link} = {}) { // TODO: Add shortcuts for this on RedditUser and Submission
      return this.post({uri: `r/${this.display_name}/api/flairselector`, body: {name, link}});
    },
    create_flair_template ({text, css_class, flair_type, text_editable = false}) {
      return this.post({uri: `r/${this.display_name}/api/flairtemplate`, body: {api_type: 'json', text, css_class, flair_type, text_editable}});
    },
    create_new_user_flair_template ({text, css_class, text_editable = false}) {
      return this.create_flair_template({text, css_class, text_editable, flair_type: 'USER_FLAIR'});
    },
    create_new_link_flair_template ({text, css_class, text_editable = false}) {
      return this.create_flair_template({text, css_class, text_editable, flair_type: 'LINK_FLAIR'});
    }
  },
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
    },
    save () {
      return this._ac.post({uri: 'api/save', form: {id: this.name}});
    },
    unsave () {
      return this._ac.post({uri: 'api/unsave', form: {id: this.name}});
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
