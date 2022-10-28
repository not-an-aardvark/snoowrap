/* eslint-disable no-console */
import snoowrap from '../src/snoowrap'
import BaseRequester from '../src/BaseRequester'

window.BaseRequester = BaseRequester.default

fetch('../oauth_info.json').then(async response => {
  const oauthInfo = await response.json()

  window.r = new snoowrap({
    user_agent: oauthInfo.user_agent,
    client_id: oauthInfo.client_id,
    client_secret: oauthInfo.client_secret,
    refresh_token: oauthInfo.refresh_token,
    config: {
      debug: true,
      warnings: true
    }
  })

  window.r2 = new snoowrap({
    user_agent: oauthInfo.user_agent,
    client_id: oauthInfo.client_id,
    client_secret: oauthInfo.client_secret,
    username: oauthInfo.username,
    password: oauthInfo.password,
    config: {
      debug: true,
      warnings: true
    }
  })
}).catch(err => console.error(err))

window.files = {}

const fileinput = document.getElementById('file-input')
fileinput.onchange = () => {
  const file = fileinput.files[0]
  if (file) window.files[file.name] = file
}
