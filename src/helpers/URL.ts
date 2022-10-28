import url from 'url'
import isBrowser from './isBrowser'

const URL = isBrowser ? self.URL : url.URL
export default URL
