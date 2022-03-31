/** @type {import("snowpack").SnowpackUserConfig } */
module.exports =  {
    mode: 'development',
    plugins: ['@snowpack/plugin-typescript'],
    packageOptions: {
        types: true
    },
    alias: {
        fs: './noop.js',
        stream: './noop.js',
        ws: './noop.js',
    }
}
