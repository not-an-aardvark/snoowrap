/* eslint-env browser */
"use strict";

const snoowrap = require('..');
const oauthInfo = require('../oauth_info.json');

const r = new snoowrap({
  user_agent: oauthInfo.user_agent,
  client_id: oauthInfo.client_id,
  client_secret: oauthInfo.client_secret,
  refresh_token: oauthInfo.refresh_token
});

r.config({
  debug: true,
  warnings: true
});

window.r = r;

const r2 = new snoowrap({
  user_agent: oauthInfo.user_agent,
  client_id: oauthInfo.client_id,
  client_secret: oauthInfo.client_secret,
  username: oauthInfo.username,
  password: oauthInfo.password
});

r2.config({
  debug: true,
  warnings: true
});

window.r2 = r2;
