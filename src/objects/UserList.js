export default class UserList {
  constructor (options, _r) {
    return options.children.map(user => _r._new_object('RedditUser', user));
  }
}
