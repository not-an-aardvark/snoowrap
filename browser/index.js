/* eslint-env browser */
/* eslint-disable no-console */
const snoowrap = require('..');

fetch('../oauth_info.json').then(async response => {
  const oauthInfo = await response.json();

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
}).catch(err => console.error(err));

window.files = {};

const fileinput = document.getElementById('file-input');
fileinput.onchange = () => {
  const file = fileinput.files[0];
  if (file) {
    window.files[file.name] = file;
  }
};
