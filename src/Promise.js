import Promise from 'bluebird';

const PromiseCopy = Promise.getNewLibraryCopy();
PromiseCopy.config({cancellation: true, warnings: false});
export default PromiseCopy;
