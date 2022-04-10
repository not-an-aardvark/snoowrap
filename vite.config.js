var path = require('path')
var noop = path.resolve('./noop.js')

/** @type {import('vite').UserConfig} */
module.exports = {
  resolve: {
    alias: {
      fs: noop,
      path: noop,
      stream: noop,
      url: noop,
      ws: noop
    }
  }
}
