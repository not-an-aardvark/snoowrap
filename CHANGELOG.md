# Changelog

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
