/* eslint-env browser */
import axios from 'axios';
import {stringify as createQueryString} from 'querystring';
import {isBrowser} from './helpers';

let FormDataInterface;
if (!isBrowser) {
  FormDataInterface = require('form-data');
} else {
  FormDataInterface = FormData;
}

axios.interceptors.request.use(options => {
  options.baseURL = options.baseURL || options.baseUrl;
  options.url = options.url || options.uri;
  options.params = options.params || options.qs;
  options.headers = options.headers || {};

  const requestHeaders = {};
  Object.keys(options.headers)
    .filter(header => !isBrowser || header.toLowerCase() !== 'user-agent')
    .forEach(key => requestHeaders[key] = options.headers[key]);
  options.headers = requestHeaders;

  let requestBody;
  if (options.formData) {
    requestBody = new FormDataInterface();
    Object.keys(options.formData).forEach(key => requestBody.append(key, options.formData[key]));
    options.headers['Content-Type'] = 'multipart/form-data';
  } else if (options.form) {
    requestBody = createQueryString(options.form);
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  } else {
    requestBody = options.data || options.body;
  }
  options.data = requestBody;

  if (options.auth) {
    if (Object.prototype.hasOwnProperty.call(options.auth, 'bearer')) {
      options.headers.Authorization = `Bearer ${options.auth.bearer}`;
    } else if (Object.prototype.hasOwnProperty.call(options.auth, 'user') &&
      Object.prototype.hasOwnProperty.call(options.auth, 'pass')
    ) {
      options.auth.username = options.auth.user;
      options.auth.password = options.auth.pass;
    }
  }
  return options;
});

module.exports = axios;
