# snoowrap internal layout

This file is intended to be a general explanation of snoowrap's internal layout, for any potential contributors who aren't familiar with the codebase.

## Build tools
snoowrap's source code is written with some ES7 syntax. It gets transpiled by [babel](https://babeljs.io/) from the `src/` folder into a `lib/` folder (which is on gitigngore). The resulting `lib/` folder is the only code that is actually included when the module is installed with npm.

The documentation is generated automatically from inline comments with [ink-docstrap](https://github.com/docstrap/docstrap).

Whenever the version number is bumped and a tag is pushed to github, a new version of the module is automatically deployed to npm, and a new version of the docs is automatically deployed to [the docs page](https://not-an-aardvark.github.io/snoowrap). This is handled by [Travis](https://travis-ci.org/not-an-aardvark/snoowrap).

## The code

### Request handling

All OAuth credentials and HTTP requests are handled by the [request_handler.js](./request_handler.js) file.

For almost all endpoints, reddit's response takes the form of some JSON data. Before being returned, this data is passed into `helpers._populate`, which is found in [helpers.js](./helpers.js). `helpers._populate` replaces reddit's representation of data with snoowrap objects.

For example, `helpers._populate` transforms this JSON response:

```json
{
    "kind": "t1",
    "data": {
        "author": "not_an_aardvark",
        "approved_by": "not_an_aardvark",
        "subreddit": "AskReddit",
    }
}
```

...into this `Comment` object:

```
Comment {
  author: RedditUser {name: 'not_an_aardvark'},
  approved_by: RedditUser {name: 'not_an_aardvark'},
  subreddit: Subreddit {display_name: 'AskReddit'}
}
```

`request_handler.js` also handles everything else required to make requests, including ratelimiting and fetching/updating access tokens.

### Base requester

The base class for a snoowrap requester is found in `snoowrap.js`. There are a few convenient helper functions to be aware of:

```js
// `r` is an instance of the snoowrap class

// --> send a GET request to reddit.com/r/snoowrap/about/moderators, and
// return a Promise for the populated response
r._get({uri: 'r/snoowrap/about/moderators'})

// --> send a POST request to reddit.com/api/remove with form data {id: 't3_2np694'}
r._post({uri: 'api/remove', form: {id: 't3_2np694'}})
```

The helper functions are `_get`, `_post`, `_put`, `_del`, etc., corresponding to all the HTTP verbs. Parameters from these functions are passed directly to [request-promise](https://github.com/request/request-promise), so all of the request options from the [request API](https://www.npmjs.com/package/request) are easily available. Note that `request_handlers.js` already provides the following default options:

```js
{
  auth: {bearer: "(the user's access token)"},
  headers: {'user-agent': "(the user's user-agent string)"},
  baseUrl: "the user's specified endpoint domain, usually https://oauth.reddit.com",
  qs: {raw_json: 1} // (prevents reddit from escaping HTML characters)
}
```

The process of getting an access token from a refresh token is handled internally by `request_handler.js`, so it doesn't need to be dealt with elsewhere.

### Content objects

TODO
