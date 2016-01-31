# snoowrap

A simple Node.js wrapper for the reddit API.

### To include in a project:
1. `npm install snoowrap --save`
1. (In some file): `var snoowrap = require('snoowrap');`

Note: snoowrap uses the `Proxy` object introduced in ES6. Since Node has not yet deployed this as a default feature, you will need to run your project with the `--harmony-proxies` flag. E.g. `node --harmony-proxies yourProject.js`

snoowrap is currently in development and is far from feature-complete.

### Features

* If you've used [PRAW](https://praw.readthedocs.org/en/stable/), you'll probably find a lot of snoowrap's syntax to be familiar. Aside from being written in a different language, there are a few important differences. For example, unlike PRAW, snoowrap is **non-blocking**; all API calls are async and return bluebird Promises. This means that you can handle asynchronous events however you want, and you can use snoowrap as part of a larger process without it holding everything back.
* Even though everything is asynchronous, snoowrap's objects are structured to keep the syntax as simple as possible. So the following expression:

```javascript
r.get_submission('2np694').body
```
...will return a Promise. So will this one:
```javascript
 r.get_submission('2np694').author.name
 // --> returns a Promise for the string 'DO_U_EVN_SPAGHETTI'
 // (this submission's author's name)
 ```
The above will return a Promise for the author's name, without having to deal with callback hell or `.then` statements. You can even chain multiple API calls together:

```javascript
r.get_submission('2np694').subreddit.get_moderators()[0].name
// --> returns a Promise for the string 'krispykrackers'
// (this submission's subreddit's first mod's name)
```
* In a similar vein, each snoowrap object is completely independent. If you want, you can have scripts from separate accounts make requests at the same time.
* snoowrap uses lazy objects, so it never fetches more than it needs to.
* snoowrap has built-in ratelimit protection. If you hit reddit's ratelimit, the request will be queued, and then run after the current ratelimit period runs out. That way you won't lose a request if you go a bit too fast.
* snoowrap will retry its request a few times if it gets an error because reddit's servers are overloaded.
* After you provide a token once, snoowrap will refresh it on its own from then on -- you won't have to worry about authentication again.

More complete documentation is in progress, and will be available sometime in the future. For now, here are a few examples of things that you can do with snoowrap.

```javascript
'use strict';
let snoowrap = require('snoowrap');
let r = new snoowrap({
  user_agent: 'Example snoowrap script',
  client_id: 'put a client id here',
  client_secret: 'put a client secret here',
  refresh_token: 'put your refresh token here'
});

do_example_things();

async function do_example_things () {
  // Get the top posts from the front page
  let top_posts = r.get_hot({subreddit: 'CasualConversation'});

  /* `top_posts` is now a Listing. There's no need to deal with how reddit handles pagination -- snoowrap will do that internally. So now you can do something like: */
  for (let i = 0; i < 30; i++) {
    console.log(await top_posts[i].body); // When you retrieve a top post by index, snoowrap will fetch it and return a Promise
    await top_posts[i].save(); // Save all the top posts so you can view them later
  }


  // snoowrap will also handle comment tree pagination for you, so you can almost just access them as if they were regular objects. In this example, it is used to moderate comments
  example_post = r.get_submission('2np694');
  for (let comment in (await comments.fetch_all())) { // iterate over all the top-level comments
    if (comment.body.match(/bannedword1|bannedord2|bannedword3/)) {
      comment.remove(); // As a moderator, remove any comments that contain selected bad words
    }
  }
}
```

For more examples of what can be done with snoowrap, take a look at the [test file](/not-an-aardvark/snoowrap/blob/master/test/snoowrap.spec.js).

___
### To build/run the tests independently:
1. `git clone https://github.com/not-an-aardvark/snoowrap.git`
1. `cd snoowrap`
1. `npm install`
1. `npm test`
