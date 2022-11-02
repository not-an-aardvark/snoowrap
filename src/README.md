# snoowrap internal layout/building instructions

This guide is aimed at people who are interested in contributing to snoowrap itself, or getting a general idea of how snoowrap works.

If you just want to use snoowrap, check out the [readme](https://github.com/not-an-aardvark/snoowrap/blob/master/README.md) or [the documentation](https://not-an-aardvark.github.io/snoowrap/) instead.

## Getting started

First, clone snoowrap:

```bash
git clone https://github.com/not-an-aardvark/snoowrap.git
cd snoowrap/
npm install
```

The unit tests are run live on Reddit. As a result, you will need to generate a reddit.com OAuth token the first time in order to run the tests on your own machine. This can be done using [reddit-oauth-helper](https://github.com/not-an-aardvark/reddit-oauth-helper).

Put these credentials in a file called `oauth_info.json` in the project root directory. The file should look something like this:

```json
{
  "client_id": "put_your_client_id_here",
  "client_secret": "put_your_client_secret_here",
  "refresh_token": "put_your_refresh_token_here",
  "user_agent": "put_a_descriptive_useragent_string_here",
  "username": "put a username here",
  "password": "put a password here",
  "redirect_uri": "put the redirect URI here",
  "installed_app_client_id": "put_your_installed_app_client_id_here"
}
```

After you create your file, use `npm test` to run the linter and the test suite.

Note: A few of the tests will certainly fail when run on your machine; for tests such as retrieving private messages, reddit.com will return a 403 error, since your account won't have access to those messages.

A few other useful commands:

```bash
npm run lint # runs only the linter
npm run test:browser # runs the unit tests in your browser
npm run smoketest # runs two tests and then stops. This is useful to make sure your setup is correct.
npm run browser # to test and debug snoowrap on browser console manually.
npm run compile # compiles the source code using babel. This automatically gets run before the tests are run, but it's useful if you want to use `require('.')` in the node REPL.
npm run build-docs # builds the documentation into a doc/ folder
```

## Build tools
snoowrap's source code is written with some ES7 syntax. It gets transpiled by [babel](https://babeljs.io/) from the `src/` folder into a `dist/` folder (which is on gitignore). The resulting `dist/` folder is the only code that is actually included when the module is installed with npm.

The documentation is generated automatically from inline comments with [ink-docstrap](https://github.com/docstrap/docstrap).

Whenever the version number is bumped and a tag is pushed to github, a new version of the module is automatically deployed to npm, and a new version of the docs is automatically deployed to [the docs page](https://not-an-aardvark.github.io/snoowrap). This is handled by [Travis](https://travis-ci.org/not-an-aardvark/snoowrap).

## The code

### Request handling

All OAuth credentials and HTTP requests are handled by the [request_handler.js](./request_handler.js) file.

For almost all endpoints, reddit's response takes the form of some JSON data. Before being returned, this data is passed into `snoowrap#_populate`, which is found in [snoowrap.js](./snoowrap.js). `snoowrap#_populate` replaces reddit's representation of data with snoowrap objects.

For example, `snoowrap#_populate` transforms this JSON response:

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
r._get({url: 'r/snoowrap/about/moderators'})

// --> send a POST request to reddit.com/api/remove with form data {id: 't3_2np694'}
r._post({url: 'api/remove', form: {id: 't3_2np694'}})
```

The helper functions are `_get`, `_post`, `_put`, `_delete`, etc., corresponding to all the HTTP verbs. Parameters from these functions are passed directly to [axios](https://www.npmjs.com/package/axios), so all of the request options from the [axios API](https://www.npmjs.com/package/axios) are easily available in addition of snoowrap specific options such as `formData` and `form` (check `snoowrap#rawRequest` for more details). Note that `request_handlers.js` already provides the following default options:

```js
{
  auth: {bearer: "(the user's access token)"},
  headers: {'user-agent': "(the user's user-agent string)"},
  baseURL: "the user's specified endpoint domain, usually https://oauth.reddit.com",
  params: {raw_json: 1} // (prevents reddit from escaping HTML characters),
  timeout: "(the user's timeout)"
}
```

The process of getting an access token from a refresh token is handled internally by `request_handler.js`, so it doesn't need to be dealt with elsewhere.

### Content objects

Most content constructors (`Comment`, `Submission`, etc.) are subclasses of the [RedditContent](./objects/RedditContent.js) class. (Note: The `Listing` and `More` constructors are exceptions to this rule.) Every `RedditContent` instance carries a reference to the snoowrap instance that initially created it. This allows further requests to be made directly from the content objects. (For example, `Comment#upvote` works by sending an OAuth request from the snoowrap instance that initially created the given comment.) This snoowrap can be accessed through the `_r` property, i.e. `r.getComment('abcdef')._r === r`.

`RedditContent` instances carry shortcut functions such as `_get`, `_post`, etc. These do the same thing as the corresponding functions on the snoowrap prototype.

`RedditContent` objects also have a `_fetch` property. This starts out as `null` when the object is created, and gets set to a Promise and returned when `fetch()` is called for the first time. All subsequent calls to `fetch()` return the same Promise. This ensures that no objects get fetched more than once (unless it is explicitly re-fetched using `refresh()`).

## Releases

To do a release:

1. Decide on the version number of the new release, based on the changes since the last release.
1. Prepare the package for the release:
    * Update the `version` field in `package.json`
    * Update the `VERSION` constant in `src/constants.js`
    * Add a new entry to `CHANGELOG.md` describing the release
    * Run `npm run bundle-size` and update `README.md` with the new size of `snoowrap-v1.min.js` in the "Browsers" section, if needed. (This doesn't need to be kept up to date every release, but running it once in a while is nice to make sure the advertised size isn't wildly off.)
1. Consider running `npm test`, or making sure the latest build on master is passing.
1. Run `npm publish` to publish the package to npm.
1. Push the released to GitHub (`git commit` followed by `git push`)
1. Create a tag for the release (e.g. `git tag v1.20.0`) and push the tag to GitHub (`git push --tag`)
1. To update the docs website and the browser build, run `scripts/deploy/deploy_docs.sh`. Note that this script will create a git commit and push it to GitHub.
