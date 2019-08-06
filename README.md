# snoowrap [![Build Status](https://travis-ci.org/not-an-aardvark/snoowrap.svg?branch=master)](https://travis-ci.org/not-an-aardvark/snoowrap) [![Gitter chat](https://badges.gitter.im/not-an-aardvark/snoowrap.svg)](https://gitter.im/not-an-aardvark/snoowrap 'Join the chat at https://gitter.im/not-an-aardvark/snoowrap')

A fully-featured JavaScript wrapper for the reddit API. ([Documentation](https://not-an-aardvark.github.io/snoowrap))

### Features

* snoowrap provides a simple interface to access every reddit API endpoint. For example, the method to get a user profile is just `getUser()`, and the method to upvote something is just `upvote()`.
* snoowrap is non-blocking; all of its API calls are asynchronous and return bluebird Promises. This means that you can handle concurrent requests however you want to, and you can use snoowrap as part of a larger process without it holding everything back.
* Each snoowrap object is completely independent. This means that you can have scripts from separate accounts making requests at the same time.
* After you provide a token once, snoowrap will refresh it on its own from then on -- you won't have to worry about authentication again.
* snoowrap uses lazy objects, so it never fetches more than it needs to.
* snoowrap has built-in ratelimit protection. If you hit reddit's ratelimit, you can choose to queue the request, and then run it after the current ratelimit period runs out. That way you won't lose a request if you go a bit too fast.
* snoowrap will retry its request a few times if reddit returns an error due to its servers being overloaded.

These features ensure that you can write less boilerplate code and focus more on actually doing what you want to do.

---

snoowrap's methods are designed to be as simple and consistent as possible. So the following expression:

```js
r.getSubmission('2np694').body
```
...will return a Promise. So will this one:
```js
 r.getSubmission('2np694').author.name
 // --> returns a Promise for the string 'DO_U_EVN_SPAGHETTI'
 // (this submission's author's name)
 ```
The above will return a Promise for the author's name, without having to deal with callback hell or `.then` statements. You can chain multiple API calls together:

```js
r.getSubmission('2np694').subreddit.getModerators()[0].name
// --> returns a Promise for the string 'krispykrackers'
// (this submission's subreddit's first mod's name)
```
...or chain actions together with fluent syntax:

```js
r.getSubreddit('snoowrap')
  .submitSelfpost({title: 'Discussion Thread', text: 'Hello! This is a thread'})
  .sticky()
  .distinguish()
  .ignoreReports()
  .assignFlair({text: 'Exciting Flair Text', css_class: 'modpost'})
```

snoowrap works on Node.js 4+, as well as most common browsers.

---

### Examples

```js
'use strict';
const snoowrap = require('snoowrap');

// NOTE: The following examples illustrate how to use snoowrap. However, hardcoding
// credentials directly into your source code is generally a bad idea in practice (especially
// if you're also making your source code public). Instead, it's better to either (a) use a separate
// config file that isn't committed into version control, or (b) use environment variables.

// Create a new snoowrap requester with OAuth credentials.
// For more information on getting credentials, see here: https://github.com/not-an-aardvark/reddit-oauth-helper
const r = new snoowrap({
  userAgent: 'put your user-agent string here',
  clientId: 'put your client id here',
  clientSecret: 'put your client secret here',
  refreshToken: 'put your refresh token here'
});

// Alternatively, just pass in a username and password for script-type apps.
const otherRequester = new snoowrap({
  userAgent: 'put your user-agent string here',
  clientId: 'put your client id here',
  clientSecret: 'put your client secret here',
  username: 'put your username here',
  password: 'put your password here'
});

// That's the entire setup process, now you can just make requests.

// Submitting a link to a subreddit
r.getSubreddit('gifs').submitLink({
  title: 'Mt. Cameramanjaro',
  url: 'https://i.imgur.com/n5iOc72.gifv'
});

// Printing a list of the titles on the front page
r.getHot().map(post => post.title).then(console.log);

// Extracting every comment on a thread
r.getSubmission('4j8p6d').expandReplies({limit: Infinity, depth: Infinity}).then(console.log)

// Automating moderation tasks
r.getSubreddit('some_subreddit_name').getModqueue({limit: 100}).filter(someRemovalCondition).forEach(flaggedItem => {
  flaggedItem.remove();
  flaggedItem.subreddit.banUser(flaggedItem.author);
});

// Automatically creating a stickied thread for a moderated subreddit
r.getSubreddit('some_subreddit_name')
  .submitSelfpost({title: 'Daily thread', text: 'Discuss things here'})
  .sticky()
  .distinguish()
  .approve()
  .assignFlair({text: 'Daily Thread flair text', css_class: 'daily-thread'})
  .reply('This is a comment that appears on that daily thread');
  // etc. etc.

// Printing the content of a wiki page
r.getSubreddit('AskReddit').getWikiPage('bestof').content_md.then(console.log);

```

For more examples of what can be done with snoowrap, take a look at the [documentation](https://not-an-aardvark.github.io/snoowrap).

---

### Live threads

Reddit's [live threads](https://www.reddit.com/r/live/wiki/index) are different from most other content, in that messages are distributed through websockets instead of a RESTful API. snoowrap supports this protocol under the hood by representing the content stream as an [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter). For example, the following script will stream all livethread updates to the console as they appear:

```js
r.getLivethread('whrdxo8dg9n0').stream.on('update', console.log);
```

For more information, see the [LiveThread documentation page](https://not-an-aardvark.github.io/snoowrap/LiveThread.html).

---

### Important note on ES6

snoowrap uses the `Proxy` object introduced in ES6.

If your target environment does not support Proxies, snoowrap will still function. However, method chaining as described above won't work, so your syntax will need to be a bit heavier.

#### Environments that support the ES6 Proxy object

* Node 6+
* Chrome 49+
* Firefox 18+
* Edge
* Node 4 and 5 (requires the `--harmony_proxies` runtime flag to be enabled. e.g. `node --harmony_proxies yourFile.js`)

Example of how Proxy support affects behavior:

```js
// This works in environments that support Proxies.
// However, it throws a TypeError if Proxies are not available.
r.getSubmission('47v7tm').comments[0].upvote();

// ----------

// This is equivalent and works on all platforms, but the syntax isn't as nice.
r.getSubmission('47v7tm').fetch().then(submission => {
  return submission.comments[0].upvote();
});

```

You can explicitly disable method chaining with `r.config({proxies: false})`.

---

### To include in a project

**Node:**

```bash
npm install snoowrap --save
```
```js
var snoowrap = require('snoowrap');
```

**Browsers:**

snoowrap is usable with module bundlers such as [browserify](http://browserify.org/).

Alternatively, prebuilt versions are available:

* [snoowrap-v1.js](https://not-an-aardvark.github.io/snoowrap/snoowrap-v1.js)
* [snoowrap-v1.min.js](https://not-an-aardvark.github.io/snoowrap/snoowrap-v1.min.js) (89kB gzipped)

These files will occasionally be updated as new versions of snoowrap 1 are released. Since snoowrap follows semantic versioning, the changes should not break your code. However, if you would prefer to pin the version, you can specify a version number in the URL (e.g. [snoowrap-v1.11.3.min.js](https://not-an-aardvark.github.io/snoowrap/snoowrap-v1.11.3.min.js)). For a list of all available prebuilt versions, see the [gh-pages branch](https://github.com/not-an-aardvark/snoowrap/tree/gh-pages) of this repository.

When run in a browser, snoowrap will be assigned to the global variable `window.snoowrap`. If you want to avoid global state (or you're using two versions of snoowrap on the same page for some reason), use `snoowrap.noConflict()` to restore `window.snoowrap` to its previous value.

### To build/run the tests independently
See the [contributing guide](https://github.com/not-an-aardvark/snoowrap/blob/master/CONTRIBUTING.md) and the [getting started](https://github.com/not-an-aardvark/snoowrap/blob/master/src/README.md) page.

---

### License

This software is freely distributable under the [MIT License](https://github.com/not-an-aardvark/snoowrap/blob/master/LICENSE.md).
