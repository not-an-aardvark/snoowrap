/* eslint-env browser */
import axios from 'axios';
import {stringify as createQueryString} from 'querystring';
import {isBrowser} from './helpers';

const Form_Data = isBrowser ? FormData : require('form-data');

axios.interceptors.request.use(config => {
  const isSpreadable = val => typeof val !== 'string' && !(val instanceof Array);
  const has = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

  config.baseURL = config.baseURL || config.baseUrl;
  config.url = config.url || config.uri;
  config.headers = isSpreadable(config.headers) ? {...config.headers} : {};
  config.params = isSpreadable(config.params) ? {...config.params} : {};
  config.params = isSpreadable(config.qs) ? {...config.qs, ...config.params} : config.params;
  config.formData = isSpreadable(config.formData) ? {...config.formData} : {};
  config.form = isSpreadable(config.form) ? {...config.form} : {};

  if (isBrowser) {
    const requestHeaders = {};
    Object.keys(config.headers)
      .filter(header => header.toLowerCase() !== 'user-agent')
      .forEach(key => requestHeaders[key] = config.headers[key]);
    config.headers = requestHeaders;
  }

  let requestBody;
  if (Object.keys(config.formData).length) {
    requestBody = new Form_Data();
    Object.keys(config.formData).forEach(key => requestBody.append(key, config.formData[key]));
    config.headers['Content-Type'] = 'multipart/form-data';
  } else if (Object.keys(config.form).length) {
    requestBody = createQueryString(config.form);
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  } else {
    requestBody = config.data || config.body;
  }
  config.data = requestBody;

  if (config.auth) {
    if (has(config.auth, 'bearer')) {
      config.headers.Authorization = `Bearer ${config.auth.bearer}`;
    } else if (has(config.auth, 'user') && has(config.auth, 'pass')) {
      config.auth.username = config.auth.user;
      config.auth.password = config.auth.pass;
    }
  }

  if (config._r && config._r._debug) {
    config._r._debug('Request:', config);
  }
  return config;
});

axios.interceptors.response.use(response => {
  if (response.config._r && response.config._r._debug) {
    response.config._r._debug('Response:', response);
  }
  return response;
});

module.exports = axios;
