# Changelog

## v0.11.1 (2016-04-06)

* Fix an issue where certain Subreddit functions would throw errors if Proxies were disabled

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
