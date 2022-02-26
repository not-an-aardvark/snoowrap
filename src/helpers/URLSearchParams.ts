import url from 'url'
import isBrowser from './isBrowser'

const URLSearchParams = isBrowser ? self.URLSearchParams : url.URLSearchParams
export default URLSearchParams
