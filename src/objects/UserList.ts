import type snoowrap from '../snoowrap'

export interface Options {
  children: {[key: string]: any}[]
  [key: string]: any
}

export default class UserList {
  constructor (options: Options, _r: snoowrap) {
    return options.children.map(user => _r._newObject('RedditUser', user))
  }
}
