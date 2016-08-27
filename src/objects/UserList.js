export default class UserList {
  constructor (options, _r) {
    return options.children.map(user => _r._newObject('RedditUser', user));
  }
}
