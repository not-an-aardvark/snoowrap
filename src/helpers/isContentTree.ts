import {KINDS} from '../constants'

interface ContentTree {
  kind: keyof typeof KINDS
  data: any
}

const isContentTree = (obj: any) => {
  if (
    Object.keys(obj).length === 2 &&
    obj.kind &&
    obj.data
  ) {
    return true
  }
  return false
}

export default isContentTree
export {ContentTree}
