import {buildRepliesTree, handleJsonErrors} from '../helper'
import {MAX_API_INFO_AMOUNT, MAX_API_MORECHILDREN_AMOUNT} from '../constants'
import snoowrap from '../snoowrap'
import type Comment from './Comment'
import Listing, {FetchMoreOptions} from './Listing'
import {JSONResponse} from '../interfaces'

export interface Options {
  children: string[]
  count: number
  depth: number
  id: string
  name: string
  parent_id: string
  link_id?: string
}

/**
 * The `More` class is a helper representing reddit's exposed `more` type in comment threads, used to fetch additional comments
 * on a thread.
 * No instances of the `More` class are exposed externally by snoowrap; instead, comment lists are exposed as Listings.
 * Additional replies on an item can be fetched by calling `fetchMore` on a Listing, in the same manner as what would be done
 * with a Listing of posts. snoowrap should handle the differences internally, and expose a nearly-identical interface for the
 * two use-cases.
 *
 * Combining reddit's `Listing` and `more` objects has the advantage of having a more consistent exposed interface; for example,
 * if a consumer iterates over the comments on a Submission, all of the iterated items will actually be Comment objects, so the
 * consumer won't encounter an unexpected `more` object at the end. However, there are a few disadvantages, namely that (a) this
 * leads to an increase in internal complexity, and (b) there are a few cases where reddit's `more` objects have different amounts
 * of available information (e.g. all the child IDs of a `more` object are known on creation), which leads to different optimal
 * behavior.
 */
interface More extends Partial<Options> {}
class More {
  children: string[]
  _r: snoowrap

  constructor ({children = [], ...options}: Partial<Options>, _r: snoowrap) {
    this.children = children
    this.count = options.count
    this.depth = options.depth
    this.id = options.id
    this.name = options.name
    this.parent_id = options.parent_id
    this.link_id = options.link_id
    this._r = _r
  }

  /**
   * Requests to /api/morechildren are capped at 20 comments at a time, but requests to /api/info are capped at 100, so
   * it's easier to send to the latter. The disadvantage is that comment replies are not automatically sent from requests
   * to /api/info.
   */
  async fetchMore (
    options: FetchMoreOptions,
    startIndex = 0,
    children: {[id: string]: Comment} = {},
    nested = false
  ): Promise<Listing<Comment>> {
    if (options.amount <= 0 || startIndex >= this.children.length) {
      return new Listing({}, this._r)
    }
    if (!options.skipReplies) {
      return this.fetchTree(options, startIndex, children, nested)
    }
    const ids = this.children.slice(
      startIndex,
      startIndex + Math.min(options.amount, MAX_API_INFO_AMOUNT)
    ).map((id: String) => `t1_${id}`)
    /**
     * Requests are capped at 100 comments. Send lots of requests recursively to get the comments, then concatenate them.
     * (This speed-requesting is only possible with comment Listings since the entire list of ids is present initially.)
    */
    const response: Listing<Comment> = await this._r._getListing({uri: 'api/info', qs: {id: ids.join(',')}})
    Object.assign(children, response._children)
    const nexts = await this.fetchMore(
      {...options, amount: options.amount - ids.length},
      startIndex + ids.length,
      children,
      true
    )
    nexts.unshift(...response)
    if (!nested) nexts._children = children
    return nexts
  }

  async fetchTree (
    options: FetchMoreOptions,
    startIndex = 0,
    children: {[id: string]: Comment} = {},
    nested = false
  ): Promise<Listing<Comment>> {
    if (options.amount <= 0 || startIndex >= this.children.length) {
      return new Listing({}, this._r)
    }
    const ids = this.children.slice(
      startIndex,
      startIndex + Math.min(options.amount, MAX_API_MORECHILDREN_AMOUNT)
    )
    const response: JSONResponse<Comment> = await this._r._get({
      url: 'api/morechildren',
      params: {api_type: 'json', children: ids.join(','), link_id: this.link_id || this.parent_id}
    })
    handleJsonErrors(response)
    Object.assign(children, response._children)
    const resultTrees: Comment[] = buildRepliesTree(response.json.data!.things)
    /**
     * Sometimes, when sending a request to reddit to get multiple comments from a `more` object, reddit decides to only
     * send some of the requested comments, and then stub out the remaining ones in a smaller `more` object. ( ¯\_(ツ)_/¯ )
     * In these cases, recursively fetch the smaller `more` objects as well.
     *
     * (Maybe we should merge the smaller More objects into one big More object to save API requests?)
     */
    const childMores: More[] = []
    const filteredComments: Comment[] = resultTrees.filter(child => {
      if (child instanceof More) {
        child.link_id = (this.link_id || this.parent_id)!
        childMores.push(child)
        return false
      }
      return true
    })
    const moreComments: Comment[] = []
    for (const child of childMores) {
      const expandedTree = await child.fetchTree({...options, amount: Infinity}, 0, children, true)
      moreComments.push(...expandedTree)
    }
    const nexts = await this.fetchTree({...options, amount: options.amount - ids.length}, startIndex + ids.length, children, true)
    nexts.unshift(...filteredComments, ...moreComments)
    if (!nested) nexts._children = children
    return nexts
  }

  _clone () {
    return new More(
      {
        children: [...this.children],
        count: this.count,
        depth: this.depth,
        id: this.id,
        name: this.name,
        parent_id: this.parent_id,
        link_id: this.link_id
      },
      this._r
    )
  }
}

export const emptyChildren = (r: snoowrap) => new More({}, r)
export default More
