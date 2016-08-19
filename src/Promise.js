import Promise from 'bluebird';
const PromiseCopy = Promise.getNewLibraryCopy();
PromiseCopy.config({cancellation: true});
export default PromiseCopy;
