import defaultConfig from './defaultConfig'

export interface Common {
  redirect_uri?: string
  user_agent?: string
  device_id?: string
  grant_type?: string
  config?: typeof defaultConfig
}

export interface AppAuth extends Common {
  client_id: string
  client_secret?: string
  refresh_token?: string
  access_token?: string
}

export interface ScriptAuth extends Common {
  client_id: string
  client_secret: string
  username: string
  password: string
  two_factor_code?: number | string
  access_token?: string
}

export interface CodeAuth extends Common {
  client_id: string
  client_secret?: string
  code: string
  redirect_uri: string
}

export interface All extends Common {
  client_id?: string
  client_secret?: string
  refresh_token?: string
  access_token?: string
  username?: string
  password?: string
  two_factor_code?: number | string
  code?: string
  redirect_uri?: string
}

export interface credentialsResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  scope: string,
  token_type: string,
  error: string
  error_description: string
}
