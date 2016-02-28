# snoowrap [![Build Status](https://travis-ci.org/not-an-aardvark/snoowrap.svg?branch=master)](https://travis-ci.org/not-an-aardvark/snoowrap)

A simple Node.js wrapper for the reddit API. ([Documentation](https://not-an-aardvark.github.io/snoowrap))

### Features

* If you've used [PRAW](https://praw.readthedocs.org/en/stable/), you'll probably find a lot of snoowrap's syntax to be familiar. However, aside from being written in a different language, there are a few important differences.
* For example, unlike PRAW, snoowrap is non-blocking; all API calls are async and return bluebird Promises. This means that you can handle asynchronous events however you want, and you can use snoowrap as part of a larger process without it holding everything back.
* Each snoowrap object is completely independent. If you want, you can have scripts from separate accounts make requests at the same time.
* snoowrap's objects are structured to keep the syntax as simple as possible. So the following expression:

```javascript
r.get_submission('2np694').body
```
...will return a Promise. So will this one:
```javascript
 r.get_submission('2np694').author.name
 // --> returns a Promise for the string 'DO_U_EVN_SPAGHETTI'
 // (this submission's author's name)
 ```
The above will return a Promise for the author's name, without having to deal with callback hell or `.then` statements. You can chain multiple API calls together:

```javascript
r.get_submission('2np694').subreddit.get_moderators()[0].name
// --> returns a Promise for the string 'krispykrackers'
// (this submission's subreddit's first mod's name)
```
...or chain actions together with fluent syntax:

```javascript
r.get_subreddit('snoowrap')
  .submit_selfpost({title: 'Discussion Thread', text: 'Hello! This is a thread'})
  .sticky()
  .distinguish()
  .ignore_reports()
  .assign_flair({text: 'Exciting Flair Text', css_class: 'modpost'})
```

* snoowrap handles many API interactions such as authentication, ratelimiting, error correction, and HTTP requests internally, so that you can write less boilerplate code and focus more on doing what you want to do.
 * After you provide a token once, snoowrap will refresh it on its own from then on -- you won't have to worry about authentication again.
 * snoowrap uses lazy objects, so it never fetches more than it needs to.
 * snoowrap has built-in ratelimit protection. If you hit reddit's ratelimit, you can choose to queue the request, and then run it after the current ratelimit period runs out. That way you won't lose a request if you go a bit too fast.
 * snoowrap will retry its request a few times if reddit returns an error due to its servers being overloaded.

For more examples of what can be done with snoowrap, take a look at the [documentation](https://not-an-aardvark.github.io/snoowrap) or the [test file](https://github.com/not-an-aardvark/snoowrap/blob/master/test/snoowrap.spec.js).

### Quick example file

```javascript
'use strict';
const snoowrap = require('snoowrap');

/* Create a new snoowrap requester. If you're uncomfortable storing confidential info in your file, one solution is to
simply store it in a json file and require() it. For more information on how to get valid credentials, see here: https://github.com/not-an-aardvark/reddit-oauth-helper */
const r = new snoowrap({
  client_id: 'put your client id here',
  client_secret: 'put your client secret here',
  refresh_token: 'put your refresh token here'
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

// Replying to comments that match certain criteria
r.get_new_comments().fetch_until(500).forEach(comment => {
  if (comment.body === 'ayy') {
    comment.reply('lmao'); // (look at me I'm so original)
  }
});

// Automating moderation tasks
r.get_subreddit('some_subreddit_name').get_modqueue({limit: 100}).filter(/some-removal-condition/.test).forEach(flaggedItem => {
  flaggedItem.remove();
  flaggedItem.subreddit.ban_user(flaggedItem.author);
  // (Probably overkill here, but that's none of my business and pretty much any functionality is there if you want it)
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

```

---

### To include in a project:
1. `npm install snoowrap --save`
1. `var snoowrap = require('snoowrap');`

### To build/run the tests independently:
1. `git clone https://github.com/not-an-aardvark/snoowrap.git`
1. `cd snoowrap`
1. `npm install`
1. `npm test`

---

Note: snoowrap uses the `Proxy` object introduced in ES6. Since this is not yet included in Node by default, you will need to run your project with the `--harmony-proxies` flag. E.g. `node --harmony-proxies yourProject.js`

snoowrap is currently in active development; while it provides shortcuts for a large number of API endpoints, it is not yet feature-complete. See [here](https://not-an-aardvark.github.io/snoowrap) for full documentation.
