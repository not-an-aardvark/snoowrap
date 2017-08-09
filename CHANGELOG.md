# Changelog

## v1.14.2 (2017-08-09)

* Added an exponential backoff for failed requests

## v1.14.1 (2017-07-07)

* Fixed an issue where `Submission#getDuplicates` would return a 404 error
* Fixed an issue where using an invalid auth code in `snoowrap.fromAuthCode` would result in a confusing error message

## v1.14.0 (2017-05-11)

* Added support for `allow_images` and `show_media_preview` subreddit settings

## v1.13.0 (2017-03-30)

* Added support for marking and unmarking posts as spoilers
* Fixed an issue where comments on some listings did not have a `replies` property
* Fixed an issue where using invalid credentials could result in a confusing error message from snoowrap

## v1.12.0 (2017-01-01)

* Added `snoowrap#getRising` and `subreddit#getRising` to get a list of "rising" posts on reddit
* Fixed an issue where Webpack would throw "missing dependency" errors when including snoowrap

## v1.11.3 (2016-11-16)

* Fixed an issue where `Listing#fetchMore` returned incorrect results when fetching very large Listings with the `append` option

## v1.11.2 (2016-11-15)

* Fixed an issue where snoowrap threw an error when fetching PrivateMessages with no replies.
* Fixed an issue where ratelimit errors caused a confusing error message.
* Fixed an issue where Promises returned by `snoowrap#checkCaptchaRequirement` sometimes fulfilled with something other than a boolean.

## v1.11.1 (2016-10-27)

* Fixed a regression where `snoowrap#oauthRequest` only accepted a `uri` option and did not accept a `url` option.

## v1.11.0 (2016-10-27)

* Added `snoowrap#getStickiedLivethread`, which gets the globally-stickied live-thread if one exists.
* Added `snoowrap#rawRequest`, which exposes raw request functionality. This is useful for snoowrap subclasses that want to use custom request logic.

## v1.10.0 (2016-10-02)

* Added `snoowrap.getAuthUrl` and `snoowrap.fromAuthCode` functions, to allow for easier authorization of arbitrary accounts in browsers.

## v1.9.0 (2016-09-24)

* Added `PrivateMessage#deleteFromInbox`, which deletes a private message from the user's inbox.

## v1.8.1 (2016-09-08)

* Fixed an issue where `snoowrap#credentialedClientRequest` didn't accept `this`-bindings with snake_case key names.

## v1.8.0 (2016-09-08)

* All of snoowrap's methods and parameters are now in camelCase, to be more aligned with idiomatic JS. This is not a breaking change; for backwards compatibility, snake_case aliases are provided for all methods and parameters. Existing code should still work and does not need to be migrated.
* Added a `snoowrap.noConflict` method to avoid relying on global state in browsers

## v1.7.1 (2016-09-03)

* Fixed an issue where Listings sometimes threw errors in Safari

## v1.7.0 (2016-08-31)

* Added a `proxies` config option to explicitly disable method chaining even if the runtime environment supports the `Proxy` object

## v1.6.2 (2016-08-28)

* Fixed an issue where `credentialed_client_request` could not be used in browsers without creating a snoowrap instance

## v1.6.1 (2016-08-26)

* Fixed an issue where snoowrap's package.json file would cause errors when bundling with webpack

## v1.6.0 (2016-08-18)

* Reduced the size of the browser bundle by 77%
* Fixed an issue where snoowrap did not work on iOS Safari
* Fixed an issue where an error could get thrown while fetching comment Listings in newer browsers
* Changed the name of the prebuild browser files to include the snoowrap version, e.g. `snoowrap-v1.6.0.min.js`. Please use these files rather than the default `snoowrap.min.js` file from now on.

## v1.5.0 (2016-08-06)

* Added a `Subreddit#get_modmail` function to get modmail for a specific subreddit
* snoowrap now requests gzipped content for all requests, which should reduce the amount of bandwidth it uses ([#35](https://github.com/not-an-aardvark/snoowrap/pull/35)).
* Fixed an issue where `RedditUser#get_saved` would return hidden content instead of saved content ([#36](https://github.com/not-an-aardvark/snoowrap/issues/36))

## v1.4.2 (2016-07-30)

* Fixed an issue where configurations were shared between snoowrap instances instead of being independent
* Fixed an issue where non-idempotent API requests would be retried after 503 errors, which would occasionally lead to duplicate results. To fix this, only idempotent requests (`GET`, `PUT`, and `DELETE`) are retried.

## v1.4.1 (2016-07-04)

* Fixed an issue where `Subreddit#edit_settings` sometimes threw errors

## v1.4.0 (2016-07-01)

* Added an `append` option to the `Listing#fetch_more` functions indicating whether fetched items should be returned with the existing Listing elements, or returned separately.
* Fixed an issue where snoowrap wasn't working on OSX Safari

## v1.3.0 (2016-06-22)

* Added support for username/password authentication by passing `username` and `password` into the snoowrap constructor

## v1.2.0 (2016-06-07)

* Added camelCase aliases for all exposed snoowrap functions
* Added support for passing comment IDs to `snoowrap#mark_messages_as_read` and `snoowrap#mark_messages_as_unread`
* Added filtering options for `snoowrap#get_inbox`

## v1.1.1 (2016-05-15)

* Fixed an issue where a setting a high `request_delay` would delay script termination
* Fixed an issue where `LiveThread#revoke_contributor_invite` would throw errors if Proxies were disabled
* Fixed an issue where `Subreddit#set_multiple_user_flairs` could incorrectly report success if an error occurred
* Fixed an issue where `Subreddit#set_multiple_user_flairs` would fail if a flair text contained special characters

## v1.1.0 (2016-05-13)

* Added `snoowrap#mark_messages_as_read` and `snoowrap#mark_messages_as_unread` functions for dealing with multiple private messages simultaneously
* Fixed an issue where `snoowrap#credentialed_client_request` would incorrectly fail when given certain `this`-bindings

## v1.0.0 (2016-05-10)

* Added a `request_timeout` config option

If you're upgrading from v0.11.x, note the two small breaking changes introduced in `v1.0.0-rc.1`.

## v1.0.0-rc.2 (2016-05-08)

* Fixed an issue where snoowrap would crash if it received a 401 error from the reddit API
* Fixed an issue where 5xx errors from the reddit API were parsed incorrectly
* Fixed an issue where some methods on `snoowrap.prototype` were enumerable

## v1.0.0-rc.1 (2016-05-07)

* **[breaking]**: Removed the `suppress_warnings` config option in favor of a new `warnings` option.
* **[breaking]**: `Subreddit#get_user_flair_list` now returns a Promise for a Listing instead of a plain Array, which can be extended as usual. The `user` property of each item in this Listing is now a RedditUser object rather than a string.
* Added more lenient input parsing for `snoowrap#get_user`, `snoowrap#get_subreddit`, etc.
* Fixed issues where `snoowrap#search_subreddit_names`, `Subreddit#get_settings`, and `Subreddit#get_submit_text` would fail if Proxies were disabled
* Fixed an issue where requests immediately following a ratelimit warning at the end of a ratelimit period would not be throttled correctly
* Fixed an issue where `Listing#fetch_all()` would consume more requests than necessary
* Fixed an issue where an unsuccessful image upload could incorrectly report success
* Fixed an issue where the `restrict_sr` option on `snoowrap#search` was always set to `true`

## v0.11.6 (2016-04-27)

* Exposed `oauth_request`, `credentialed_client_request`, `unauthenticated_request`, and `update_access_token` functions for sending raw requests to servers
* Fixed an issue where a TypeError would be thrown if the ratelimit was exceeded and `r.config().continue_after_ratelimit_error` was set to `true` (#19)
* Fixed an issue where Submissions fetched from the front page were missing a `.comments` property

## v0.11.5 (2016-04-23)

* Fixed an issue where `Listing#fetch_all()` would sometimes return an incomplete Listing when fetching Comment replies
* Fixed an issue where the snoowrap constructor was not allowing the `client_secret` parameter to be an empty string
* Fixed an issue where RedditContent objects were being converted to JSON incorrectly

## v0.11.4 (2016-04-22)

* Fixed an issue where small comment reply chains were never considered 'finished'

## v0.11.3 (2016-04-22)

* Fixed an issue where Submissions and Comments with a large number of top-level replies could end up with internally-used 'MoreComments' objects in the replies Listing.

## v0.11.2 (2016-04-22)

This update contains a few new features and bugfixes.

* Added a `VoteableContent#expand_replies` function, which makes it easier to fetch and enumerate large comment trees
* Added support for fetching deep comment chains in which a "Continue this thread" link appears on the main site
* Improved the documentation pages:
  * Almost all functions now have usage examples
  * A `snoowrap` global is exposed for use in the dev console
* Improved the validation for `snoowrap#config` parameters
* Added the ability to block the author of any `ReplyableContent` object
* Fixed an issue where unsubscribing from a Subreddit would return a 404 error if the user wasn't subscribed in the first place
* Fixed an issue where `Submission#get_link_flair_templates` would throw errors if Proxies were disabled
* Fixed an issue where `LiveThread#get_contributors` would have an inconsistent structure if there were any pending contributor invitations
* Fixed an issue where `Subreddit#assign_flair` was not returning a chained Promise

## v0.11.1 (2016-04-06)

* Fixed an issue where certain Subreddit functions would throw errors if Proxies were disabled

## v0.11.0 (2016-04-05)

This update contains a small number of breaking changes.

* **[breaking]** Listings are now immutable. This avoids race conditions that could previously occur while expanding Listings. `Listing.prototype.fetch_more` now returns a new Listing containing all fetched items, instead of mutating the original Listing.
* **[breaking]** PrivateMessage replies are now arranged recursively into a tree structure.
* Added support for reverse Listing pagination if the `before` query parameter is set.
* Added the `debug` config option, which logs API calls and ratelimit statistics.
* Added a `skip_replies` option to `Listing.prototype.fetch_more`, for faster comment fetching when comment replies are not needed.
* Added support for Listings to have extended `limit` properties when being initially fetched. For example, `r.get_hot({limit: 150})` will now return a Listing with 150 elements, rather than being capped at 100.

---

*This changelog does not cover versions before v0.11.0.*
