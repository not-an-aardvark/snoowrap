import {Comment} from './objects'

export interface CredentialsResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  scope: string,
  token_type: string,
  error: string
  error_description: string
}

export interface Children {
  [key: string]: Comment
}
