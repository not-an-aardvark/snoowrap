import nodePath from 'path'
import browserPath from 'path-browserify'
import isBrowser from './isBrowser'

const path = isBrowser ? browserPath : nodePath
export default path
