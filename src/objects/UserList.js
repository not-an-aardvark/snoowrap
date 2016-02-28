'use strict';
module.exports = class {
  constructor (options, _ac) {
    return options.children.map(user => _ac._new_object('RedditUser', user, false));
  }
};
