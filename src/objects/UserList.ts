import snoowrap from '../snoowrap'

interface Options {
  children: any[]
}

export default class UserList {
  constructor (options: Options, _r: snoowrap) {
    return options.children.map(user => _r._newObject('RedditUser', user))
  }
}
