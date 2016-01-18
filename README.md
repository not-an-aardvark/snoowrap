# snoowrap

A Node.js wrapper for the reddit API. Inspired by [PRAW](https://praw.readthedocs.org/en/stable/).

### To run the tests:
1. `npm install`
1. `npm test`

### To include in a project:
1. `npm install snoowrap --save`
1. (In some file): `var snoowrap = require('snoowrap');`

Note: snoowrap uses the `Proxy` object introduced in ES6. Since Node has not yet deployed this as a default feature, you will need to run your project with the `--harmony-proxies` flag. E.g. `node --harmony-proxies yourProject.js`

snoowrap is currently in development and is far from feature-complete.
