import RedditContent from './objects/RedditContent'
import {KINDS} from './constants'

const extendRedditContent = (name: string) => {
  return {
    [name]: class extends RedditContent<any> {
      static _name = name
    }
  }[name]
}

const defaultObjects: {
  [Key in typeof KINDS[keyof typeof KINDS]]: ReturnType<typeof extendRedditContent>
} = (() => {
  const obj: any = {}
  for (const key of Object.keys(KINDS)) {
    const value = KINDS[<keyof typeof KINDS>key]
    obj[value] = extendRedditContent(value)
  }
  return obj
})()

export default defaultObjects
