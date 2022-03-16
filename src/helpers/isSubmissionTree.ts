import {Listing, Submission, Comment} from '../objects'

interface SubmissionTree {
  0: Listing<Submission>,
  1: Listing<Comment>
}

const isSubmissionTree = (obj: any) => {
  if (
    Array.isArray(obj) &&
    obj.length === 2 &&
    obj[0] instanceof Listing &&
    obj[0][0] instanceof Submission &&
    obj[1] instanceof Listing
  ) {
    return true
  }
  return false
}

export default isSubmissionTree
export {SubmissionTree}
