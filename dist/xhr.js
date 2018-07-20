'use strict';

var _Promise = require('./Promise.js');

var _Promise2 = _interopRequireDefault(_Promise);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _querystring = require('querystring');

var _errors = require('./errors.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Provide a shim for some of the functionality of the `request-promise` npm package in browsers.
// Previously, snoowrap depended on browserify to package `request-promise` for the browser bundle, and while this worked
// properly, it caused the snoowrap bundle to be very large since `request-promise` contains many dependencies that snoowrap
// doesn't actually need.

/* eslint-env browser */
function noop() {}

function tryParseJson(maybeJson) {
  try {
    return JSON.parse(maybeJson);
  } catch (e) {
    return maybeJson;
  }
}

function parseHeaders(headerString) {
  return headerString.split('\r\n').filter(function (line) {
    return line;
  }).reduce(function (accumulator, line) {
    var index = line.indexOf(': ');
    accumulator[line.slice(0, index)] = line.slice(index + 2);
    return accumulator;
  }, {});
}

module.exports = function rawRequest(options) {
  // It would be nice to be able to use the `URL` API in browsers, but Safari 9 doesn't support `URLSearchParams`.
  var parsedUrl = _url2.default.parse(options.url || _url2.default.resolve(options.baseUrl, options.uri), true);
  parsedUrl.search = (0, _querystring.stringify)(Object.assign({}, parsedUrl.query, options.qs));
  // create a new url object with the new qs params, to ensure that the `href` value changes (to use later for parsing response)
  var finalUrl = _url2.default.parse(parsedUrl.format());
  var xhr = new XMLHttpRequest();
  var method = options.method ? options.method.toUpperCase() : 'GET';
  xhr.open(method, finalUrl.href);
  Object.keys(options.headers).filter(function (header) {
    return header.toLowerCase() !== 'user-agent';
  }).forEach(function (key) {
    return xhr.setRequestHeader(key, options.headers[key]);
  });
  if (options.auth) {
    xhr.setRequestHeader('Authorization', options.auth.bearer ? 'bearer ' + options.auth.bearer : 'basic ' + btoa(options.auth.user + ':' + options.auth.pass));
  }

  var requestBody = void 0;
  if (options.formData) {
    requestBody = new FormData();
    Object.keys(options.formData).forEach(function (key) {
      return requestBody.append(key, options.formData[key]);
    });
    if (options.form) {
      Object.keys(options.form).forEach(function (key) {
        return requestBody.append(key, options.form[key]);
      });
    }
    xhr.setRequestHeader('Content-Type', 'multipart/form-data');
  } else if (options.form) {
    requestBody = (0, _querystring.stringify)(options.form);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  } else if (options.json) {
    requestBody = JSON.stringify(options.body);
    xhr.setRequestHeader('Content-Type', 'application/json');
  } else {
    requestBody = options.body;
  }

  return new _Promise2.default(function (resolve, reject, onCancel) {
    onCancel(function () {
      return xhr.abort();
    });
    xhr.onload = function () {
      var _this = this;

      var success = this.status >= 200 && this.status < 300;
      var settleFunc = success ? resolve : function (err) {
        return reject(Object.assign(new _errors.StatusCodeError(_this.status + ''), err));
      };
      var response = {
        statusCode: this.status,
        body: (options.json ? tryParseJson : noop)(xhr.response),
        headers: parseHeaders(xhr.getAllResponseHeaders()),
        request: { method, uri: finalUrl }
      };
      if (typeof options.transform === 'function') {
        settleFunc(options.transform(response.body, response));
      } else if (!success || options.resolveWithFullResponse) {
        settleFunc(response);
      } else {
        settleFunc(response.body);
      }
    };
    xhr.onerror = function (err) {
      return reject(Object.assign(new _errors.RequestError(), err));
    };
    xhr.send(requestBody);
  }).timeout(options.timeout || Math.pow(2, 31) - 1, 'Error: ETIMEDOUT').catch(_Promise2.default.TimeoutError, function (err) {
    xhr.abort();
    throw err;
  });
};