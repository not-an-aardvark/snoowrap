'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.emptyChildren = undefined;

var _remove2 = require('lodash/remove');

var _remove3 = _interopRequireDefault(_remove2);

var _pick2 = require('lodash/pick');

var _pick3 = _interopRequireDefault(_pick2);

var _forEach2 = require('lodash/forEach');

var _forEach3 = _interopRequireDefault(_forEach2);

var _flatten2 = require('lodash/flatten');

var _flatten3 = _interopRequireDefault(_flatten2);

var _concat2 = require('lodash/concat');

var _concat3 = _interopRequireDefault(_concat2);

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _Promise = require('../Promise.js');

var _Promise2 = _interopRequireDefault(_Promise);

var _helpers = require('../helpers.js');

var _constants = require('../constants.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var api_type = 'json';

/**
* The `More` class is a helper representing reddit's exposed `more` type in comment threads, used to fetch additional comments
on a thread.
* No instances of the `More` class are exposed externally by snoowrap; instead, comment lists are exposed as Listings.
Additional replies on an item can be fetched by calling `fetchMore` on a Listing, in the same manner as what would be done
with a Listing of posts. snoowrap should handle the differences internally, and expose a nearly-identical interface for the
two use-cases.

Combining reddit's `Listing` and `more` objects has the advantage of having a more consistent exposed interface; for example,
if a consumer iterates over the comments on a Submission, all of the iterated items will actually be Comment objects, so the
consumer won't encounter an unexpected `more` object at the end. However, there are a few disadvantages, namely that (a) this
leads to an increase in internal complexity, and (b) there are a few cases where reddit's `more` objects have different amounts
of available information (e.g. all the child IDs of a `more` object are known on creation), which leads to different optimal
behavior.
*/

var More = class More {
  constructor(options, _r) {
    Object.assign(this, options);
    this._r = _r;
  }
  /* Requests to /api/morechildren are capped at 20 comments at a time, but requests to /api/info are capped at 100, so
  it's easier to send to the latter. The disadvantage is that comment replies are not automatically sent from requests
  to /api/info. */
  fetchMore(options) {
    var startIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    if (options.amount <= 0 || startIndex >= this.children.length) {
      return _Promise2.default.resolve([]);
    }
    if (!options.skipReplies) {
      return this.fetchTree(options, startIndex);
    }
    var ids = getNextIdSlice(this.children, startIndex, options.amount, _constants.MAX_API_INFO_AMOUNT).map(function (id) {
      return 't1_' + id;
    });
    // Requests are capped at 100 comments. Send lots of requests recursively to get the comments, then concatenate them.
    // (This speed-requesting is only possible with comment Listings since the entire list of ids is present initially.)
    var promiseForThisBatch = this._r._getListing({ uri: 'api/info', qs: { id: ids.join(',') } });
    var nextRequestOptions = _extends({}, options, { amount: options.amount - ids.length });
    var promiseForRemainingItems = this.fetchMore(nextRequestOptions, startIndex + ids.length);
    return _Promise2.default.all([promiseForThisBatch, promiseForRemainingItems]).then(_flatten3.default);
  }
  fetchTree(options, startIndex) {
    var _this = this;

    if (options.amount <= 0 || startIndex >= this.children.length) {
      return _Promise2.default.resolve([]);
    }
    var ids = getNextIdSlice(this.children, startIndex, options.amount, _constants.MAX_API_MORECHILDREN_AMOUNT);
    return this._r._get({
      uri: 'api/morechildren',
      qs: { api_type, children: ids.join(','), link_id: this.link_id || this.parent_id }
    }).tap(_helpers.handleJsonErrors).then(function (res) {
      return res.json.data.things;
    }).map(_helpers.addEmptyRepliesListing).then(_helpers.buildRepliesTree).then(function (resultTrees) {
      /* Sometimes, when sending a request to reddit to get multiple comments from a `more` object, reddit decides to only
      send some of the requested comments, and then stub out the remaining ones in a smaller `more` object. ( ¯\_(ツ)_/¯ )
      In these cases, recursively fetch the smaller `more` objects as well. */
      var childMores = (0, _remove3.default)(resultTrees, function (c) {
        return c instanceof More;
      });
      (0, _forEach3.default)(childMores, function (c) {
        c.link_id = _this.link_id || _this.parent_id;
      });
      return _Promise2.default.mapSeries(childMores, function (c) {
        return c.fetchTree(_extends({}, options, { amount: Infinity }), 0);
      }).then(function (expandedTrees) {
        return _this.fetchMore(_extends({}, options, { amount: options.amount - ids.length }), startIndex + ids.length).then(function (nexts) {
          return (0, _concat3.default)(resultTrees, (0, _flatten3.default)(expandedTrees), nexts);
        });
      });
    });
  }
  _clone() {
    return new More((0, _pick3.default)(this, Object.getOwnPropertyNames(this)), this._r);
  }
};

function getNextIdSlice(children, startIndex, desiredAmount, limit) {
  return children.slice(startIndex, startIndex + Math.min(desiredAmount, limit));
}

var emptyChildren = exports.emptyChildren = new More({ children: [] });
exports.default = More;