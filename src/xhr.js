/* eslint-env browser */
import Promise from './Promise.js';
import url from 'url';
import {stringify as createQueryString} from 'querystring';
import {RequestError, StatusCodeError} from './errors.js';

// Provide a shim for some of the functionality of the `request-promise` npm package in browsers.
// Previously, snoowrap depended on browserify to package `request-promise` for the browser bundle, and while this worked
// properly, it caused the snoowrap bundle to be very large since `request-promise` contains many dependencies that snoowrap
// doesn't actually need.

function noop () {}

function tryParseJson (maybeJson) {
  try {
    return JSON.parse(maybeJson);
  } catch (e) {
    return maybeJson;
  }
}

function parseHeaders (headerString) {
  return headerString.split('\r\n').filter(line => line).reduce((accumulator, line) => {
    const index = line.indexOf(': ');
    accumulator[line.slice(0, index)] = line.slice(index + 2);
    return accumulator;
  }, {});
}

module.exports = function rawRequest (options) {
  // It would be nice to be able to use the `URL` API in browsers, but Safari 9 doesn't support `URLSearchParams`.
  const parsedUrl = url.parse(options.url || url.resolve(options.baseUrl, options.uri), true);
  parsedUrl.search = createQueryString(Object.assign({}, parsedUrl.query, options.qs));
  // create a new url object with the new qs params, to ensure that the `href` value changes (to use later for parsing response)
  const finalUrl = url.parse(parsedUrl.format());
  const xhr = new XMLHttpRequest();
  const method = options.method ? options.method.toUpperCase() : 'GET';
  xhr.open(method, finalUrl.href);
  Object.keys(options.headers)
    .filter(header => header.toLowerCase() !== 'user-agent')
    .forEach(key => xhr.setRequestHeader(key, options.headers[key]));
  if (options.auth) {
    xhr.setRequestHeader(
      'Authorization',
      options.auth.bearer ? `bearer ${options.auth.bearer}` : 'basic ' + btoa(`${options.auth.user}:${options.auth.pass}`)
    );
  }

  let requestBody;
  if (options.formData) {
    requestBody = new FormData();
    Object.keys(options.formData).forEach(key => requestBody.append(key, options.formData[key]));
    if (options.form) {
      Object.keys(options.form).forEach(key => requestBody.append(key, options.form[key]));
    }
    xhr.setRequestHeader('Content-Type', 'multipart/form-data');
  } else if (options.form) {
    requestBody = createQueryString(options.form);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  } else if (options.json) {
    requestBody = JSON.stringify(options.body);
    xhr.setRequestHeader('Content-Type', 'application/json');
  } else {
    requestBody = options.body;
  }

  return new Promise((resolve, reject, onCancel) => {
    onCancel(() => xhr.abort());
    xhr.onload = function () {
      const success = this.status >= 200 && this.status < 300;
      const settleFunc = success ? resolve : err => reject(Object.assign(new StatusCodeError(this.status + ''), err));
      const response = {
        statusCode: this.status,
        body: (options.json ? tryParseJson : noop)(xhr.response),
        headers: parseHeaders(xhr.getAllResponseHeaders()),
        request: {method, uri: finalUrl}
      };
      if (typeof options.transform === 'function') {
        settleFunc(options.transform(response.body, response));
      } else if (!success || options.resolveWithFullResponse) {
        settleFunc(response);
      } else {
        settleFunc(response.body);
      }
    };
    xhr.onerror = err => reject(Object.assign(new RequestError(), err));
    xhr.send(requestBody);
  }).timeout(options.timeout || Math.pow(2, 31) - 1, 'Error: ETIMEDOUT')
    .catch(Promise.TimeoutError, err => {
      xhr.abort();
      throw err;
    });
};
