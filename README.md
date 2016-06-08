# snoowrap [![Build Status](https://travis-ci.org/not-an-aardvark/snoowrap.svg?branch=v1.2.0)](https://travis-ci.org/not-an-aardvark/snoowrap)

A fully-featured Node.js wrapper for the reddit API. ([Documentation](https://not-an-aardvark.github.io/snoowrap))

### Features

* snoowrap provides a simple interface to access every reddit API endpoint. For example, the method to get a user profile is just `get_user()`, and the method to upvote something is just `upvote()`.
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
r.get_submission('2np694').body
```
...will return a Promise. So will this one:
```js
 r.get_submission('2np694').author.name
 // --> returns a Promise for the string 'DO_U_EVN_SPAGHETTI'
 // (this submission's author's name)
 ```
The above will return a Promise for the author's name, without having to deal with callback hell or `.then` statements. You can chain multiple API calls together:

```js
r.get_submission('2np694').subreddit.get_moderators()[0].name
// --> returns a Promise for the string 'krispykrackers'
// (this submission's subreddit's first mod's name)
```
...or chain actions together with fluent syntax:

```js
r.get_subreddit('snoowrap')
  .submit_selfpost({title: 'Discussion Thread', text: 'Hello! This is a thread'})
  .sticky()
  .distinguish()
  .ignore_reports()
  .assign_flair({text: 'Exciting Flair Text', css_class: 'modpost'})
```

snoowrap works on Node.js 4+, as well as most common browsers.

---

### Examples

```js
'use strict';
const snoowrap = require('snoowrap');

/* Create a new snoowrap requester. If you're uncomfortable storing confidential info in your file, one solution is to
simply store it in a json file and require() it. For more information on how to get valid credentials, see here: https://github.com/not-an-aardvark/reddit-oauth-helper */
const r = new snoowrap({
  client_id: 'put your client id here',
  client_secret: 'put your client secret here',
  refresh_token: 'put your refresh token here',
  user_agent: 'put your user-agent string here' // for more information, see: https://github.com/reddit/reddit/wiki/API
});

/* That's the entire setup process, now you can just make requests. I would recommend including async functions in your project
by using babel.js (or some equivalent), but this example file uses vanilla Promises for simplicity. */

// Submitting a link to a subreddit
r.get_subreddit('gifs').submit_link({
  title: 'Mt. Cameramanjaro',
  url: 'https://i.imgur.com/n5iOc72.gifv'
});

// Printing a list of the titles on the front page
r.get_hot().map(post => post.title).then(console.log);

// Extracting every comment on a thread
r.get_submission('4j8p6d').expand_replies({limit: Infinity, depth: Infinity}).then(console.log)

// Automating moderation tasks
r.get_subreddit('some_subreddit_name').get_modqueue({limit: 100}).filter(/some-removal-condition/.test).forEach(flaggedItem => {
  flaggedItem.remove();
  flaggedItem.subreddit.ban_user(flaggedItem.author);
});

// Automatically creating a stickied thread for a moderated subreddit
r.get_subreddit('some_subreddit_name')
  .create_selfpost({title: 'Daily thread', text: 'Discuss things here'})
  .sticky()
  .distinguish()
  .approve()
  .assign_flair({text: 'Daily Thread flair text', css_class: 'daily-thread'})
  .reply('This is a comment that appears on that daily thread');
  // etc. etc.

// Printing the content of a wiki page
r.get_subreddit('AskReddit').get_wiki_page('bestof').content_md.then(console.log);

```

For more examples of what can be done with snoowrap, take a look at the [documentation](https://not-an-aardvark.github.io/snoowrap).

---

### Live threads

Reddit's [live threads](https://www.reddit.com/r/live/wiki/index) are different from most other content, in that messages are distributed through websockets instead of a RESTful API. snoowrap supports this protocol under the hood by representing the content stream as an [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter). For example, the following script will stream all livethread updates to the console as they appear:

```js
r.get_livethread('whrdxo8dg9n0').stream.on('update', console.log);
```

For more information, see the [LiveThread documentation page](https://not-an-aardvark.github.io/snoowrap/LiveThread.html).

---

### Important note on ES6

snoowrap uses the `Proxy` object introduced in ES6.

If your target environment does not support Proxies, snoowrap will still function. However, method chaining as described above won't work, so your syntax will need to be a bit heavier.

#### Environments that support the ES6 Proxy object

* Node 6+
* Chrome 49+
* Firefox 4+
* Edge
* Node 4 and 5 (requires the `--harmony_proxies` runtime flag to be enabled. e.g. `node --harmony_proxies yourFile.js`)

Example of how Proxy support affects behavior:

```js
// This works in environments that support Proxies.
// However, it throws a TypeError if Proxies are not available.
r.get_submission('47v7tm').comments[0].upvote();

// ----------

// This is equivalent and works on all platforms, but the syntax isn't as nice.
r.get_submission('47v7tm').fetch().then(submission => {
  return submission.comments[0].upvote();
});

```

---

### To include in a project
```bash
npm install snoowrap --save
```
```js
var snoowrap = require('snoowrap');
```

### To build/run the tests independently
See the [contributing guide](https://github.com/not-an-aardvark/snoowrap/blob/master/CONTRIBUTING.md) and the [getting started](https://github.com/not-an-aardvark/snoowrap/blob/master/src/README.md) page.

---

### License

This software is freely distributable under the [MIT License](https://github.com/not-an-aardvark/snoowrap/blob/master/LICENSE.md).
