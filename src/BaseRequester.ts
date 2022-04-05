import {CredentialsResponse} from './interfaces'
import axiosCreate, {AxiosRequestConfig, AxiosResponse, AxiosError} from './axiosCreate'
import {isBrowser, requiredArg} from './helpers'
import defaultConfig from './defaultConfig'
import {GRANT_TYPES, DEVICE_ID, IDEMPOTENT_HTTP_VERBS, MAX_TOKEN_LATENCY} from './constants'
import {rateLimitWarning, RateLimitError} from './errors'

interface Common {
  redirect_uri?: string
  user_agent?: string
  device_id?: string
  grant_type?: string
  config?: typeof defaultConfig
}

interface AppAuth extends Common {
  client_id: string
  client_secret?: string
  refresh_token?: string
  access_token?: string
}

interface ScriptAuth extends Common {
  client_id: string
  client_secret: string
  username: string
  password: string
  two_factor_code?: number | string
  access_token?: string
}

interface CodeAuth extends Common {
  client_id: string
  client_secret?: string
  code: string
  redirect_uri: string
}

interface All extends Common, Partial<AppAuth>, Partial<ScriptAuth>, Partial<CodeAuth> {}

/**
 * The BaseRequester class.
 * This is an internal class that is responsible for authentication stuff, sending API requests to Reddit,
 * and other basic functionalities needed by snoowrap.
 *
 * This class neither contains API methods nor transforms API responses into populated objects.
 * Use {@link snoowrap} instead.
 */
interface BaseRequester extends All {}
class BaseRequester {
  scope?: string[]
  tokenExpiration!: number
  ratelimitRemaining!: number
  ratelimitExpiration!: number
  _nextRequestTimestamp!: number
  _config = {...defaultConfig}

  constructor (options?: AppAuth)
  constructor (options?: ScriptAuth)
  constructor (options?: CodeAuth)
  constructor (options?: Common)
  constructor (options: All = {}) {
    this.setOptions(options)
  }

  /**
   * @summary A method use to set/update requester options
   */
  setOptions (options: All) {
    this.client_id = options.client_id
    this.client_secret = options.client_secret || ''
    this.refresh_token = options.refresh_token
    this.access_token = options.access_token
    this.username = options.username
    this.password = options.password
    this.two_factor_code = options.two_factor_code
    this.code = options.code
    this.redirect_uri = options.redirect_uri
    this.user_agent = isBrowser ? self.navigator.userAgent : options.user_agent || requiredArg('user_agent')
    this.device_id = options.device_id || DEVICE_ID
    this.grant_type = options.grant_type || BaseRequester.grantTypes.INSTALLED_CLIENT
    this.scope = undefined
    this.tokenExpiration = Infinity
    this.ratelimitRemaining = Infinity
    this.ratelimitExpiration = Infinity
    this._nextRequestTimestamp = -Infinity
    this._config = {
      ...defaultConfig,
      ...options.config
    }
  }

  /**
   * @summary Returns the grant types available for authentication
   * @returns The enumeration of possible grant_type values
   */
  static get grantTypes () {
    return {...GRANT_TYPES}
  }

  /**
   * @summary An internal method to objectify reddit api responses
   */
  _populate (response: AxiosResponse) {
    return response
  }

  /**
   * @summary An internal method used to log warnings
   */
  _warn (...args: any[]) {
    if (this._config.warnings) {
      this._config.logger.warn(...args)
    }
  }

  /**
   * @summary An internal method used to log debug messages
   */
  _debug (...args: any[]) {
    if (this._config.debug) {
      this._config.logger.debug(...args)
    }
  }

  /**
   * @summary Gets an authorization URL, which allows a user to authorize access to their account
   * @desc This create a URL where a user can authorize an app to act through their account. If the user visits the returned URL
   * in a web browser, they will see a page that looks like [this](https://i.gyazo.com/0325534f38b78c1dbd4c84d690dda6c2.png). If
   * the user clicks "Allow", they will be redirected to your `redirect_uri`, with a `code` querystring parameter containing an
   * *authorization code*. If this code is passed to {@link BaseRequester}, you can make requests on behalf of the user.
   *
   * The main use-case here is for running snoowrap in a browser. You can generate a URL, send the user there, and then continue
   * after the user authenticates on reddit and is redirected back.
   *
   * @param options
   * @param options.client_id The client ID of your app (assigned by reddit). If your code is running clientside in a
   * browser, using an "Installed" app type is recommended.
   * @param options.scope An array of scopes (permissions on the user's account) to request on the authentication
   * page. A list of possible scopes can be found [here](https://www.reddit.com/api/v1/scopes). You can also get them on-the-fly
   * with {@link snoowrap#getOauthScopeList}. Passing an array with a single asterisk `['*']` gives you full scope.
   * @param options.redirect_uri The URL where the user should be redirected after authenticating. This **must** be the
   * same as the redirect URI that is configured for the reddit app. (If there is a mismatch, the returned URL will display an
   * error page instead of an authentication form.)
   * @param options.permanent If `true`, the app will have indefinite access to the user's account. If `false`,
   * access to the user's account will expire after 1 hour.
   * @param options.state A string that can be used to verify a user after they are redirected back to the site. When
   * the user is redirected from reddit, to the redirect URI after authenticating, the resulting URI will have this same `state`
   * value in the querystring. (See [here](http://www.twobotechnologies.com/blog/2014/02/importance-of-state-in-oauth2.html) for
   * more information on how to use the `state` value.)
   * @param options.compact If `true`, the mobile version of the authorization URL will be used instead.
   * @returns A URL where the user can authenticate with the given options
   * @example
   *
   * const authenticationUrl = r.getAuthUrl({
   *   scope: ['identity', 'wikiread', 'wikiedit'],
   *   redirect_uri: 'https://example.com/reddit_callback',
   *   permanent: false,
   *   state: 'fe211bebc52eb3da9bef8db6e63104d3' // a random string, this could be validated when the user is redirected back
   * });
   * // --> 'https://www.reddit.com/api/v1/authorize?client_id=foobarbaz&response_type=code&state= ...'
   *
   * window.location.href = authenticationUrl; // send the user to the authentication url
   */
  getAuthUrl ({
    client_id = this.client_id || requiredArg('client_id'),
    scope = ['*'],
    redirect_uri = this.redirect_uri || requiredArg('redirect_uri'),
    permanent = true,
    state = '_',
    compact = false
  }) {
    if (!(Array.isArray(scope) && scope.length && scope.every(scopeValue => scopeValue && typeof scopeValue === 'string'))) {
      throw new TypeError('Missing `scope` argument; a non-empty list of OAuth scopes must be provided');
    }
    return [
      `https://www.${this._config.endpointDomain}/api/v1/authorize`,
      `${compact ? '.compact' : ''}`,
      `?client_id=${encodeURIComponent(client_id)}`,
      '&response_type=code',
      `&state=${encodeURIComponent(state)}`,
      `&redirect_uri=${encodeURIComponent(redirect_uri)}`,
      `&duration=${permanent ? 'permanent' : 'temporary'}`,
      `&scope=${encodeURIComponent(scope.join(' '))}`
    ].join('')
  }

  /**
   * @summary Sends an oauth-authenticated request to the reddit server, and returns the server's response.
   * @desc **Note**: While this function primarily exists for internal use, it is exposed and considered a stable feature.
   * However, keep in mind that there are usually better alternatives to using this function. For instance, this
   * function can be used to send a POST request to the 'api/vote' endpoint in order to upvote a comment, but it's generally
   * easier to just use snoowrap's [upvote function]{@link VoteableContent#upvote}.
   *
   * If you're using this function to access an API feature/endpoint that is unsupported by snoowrap, please consider [creating an
   * issue for it](https://github.com/not-an-aardvark/snoowrap/issues) so that the functionality can be added to snoowrap more
   * directly.
   * @param options Options for the request. See {@link snoowrap#rawRequest} for more details. A default `baseURL` parameter
   * of `this._config.endpoint_domain` is internally included by default, so it is recommended that a relative `url` parameter be used,
   * rather than an absolute `url` parameter with a domain name.
   * @returns A Promise that fulfills with reddit's response.
   * @memberof snoowrap
   * @instance
   * @example
   *
   * r.oauthRequest({url: '/user/spez/about', method: 'get'}).then(console.log)
   * // => RedditUser { name: 'spez', link_karma: 9567, ... }
   *
   * // Note that this is equivalent to:
   * r.getUser('spez').fetch().then(console.log)
   *
   * // ######
   *
   * r.oauthRequest({url: '/api/vote', method: 'post', form: {dir: 1, id: 't3_4fzg2k'}})
   * // equivalent to:
   * r.getSubmission('4fzg2k').upvote()
   *
   * // ######
   *
   * r.oauthRequest({url: '/top', method: 'get', params: {t: 'all'}})
   * // equivalent to:
   * r.getTop({time: 'all'})
   */
  async oauthRequest (config: AxiosRequestConfig, attempts = 1): Promise<any> {
    try {
      await this._awaitRatelimit()
      await this._awaitRequestDelay()
      await this._awaitExponentialBackoff(attempts)

      const token = await this.updateAccessToken()

      const response = await this.axiosCreate({
        baseURL: `https://oauth.${this._config.endpointDomain}`,
        headers: {
          authorization: `Bearer ${token}`,
          'user-agent': this.user_agent!
        },
        params: {
          raw_json: 1
        },
        timeout: this._config.requestTimeout,
        _r: this
      })(config)

      if (response.headers['x-ratelimit-remaining']) {
        this.ratelimitRemaining = Number(response.headers['x-ratelimit-remaining'])
        this.ratelimitExpiration = Date.now() + (Number(response.headers['x-ratelimit-reset']) * 1000)
      }

      this._debug(
        `Received a ${response.status} status code from a \`${response.config.method}\` request` +
        `sent to ${response.config.url}. ratelimitRemaining: ${this.ratelimitRemaining}`
      )

      return this._populate(response)
    } catch (e) {
      const err = <AxiosError>e
      this._debug('Error:', {err})

      if (
        err.response &&
        this._config.retryErrorCodes.some(retryCode => retryCode === err.response!.status) &&
        IDEMPOTENT_HTTP_VERBS.some(verb => verb === err.config.method) &&
        attempts < this._config.maxRetryAttempts
      ) {
        /**
         * If the error's status code is in the user's configured `retryStatusCodes` and this request still has attempts
         * remaining, retry this request and increment the `attempts` counter.
         */
        this._warn(
          `Received status code ${err.response.status} from reddit.`,
          `Retrying request (attempt ${attempts + 1}/${this._config.maxRetryAttempts})...`
        )
        return this.oauthRequest(config, attempts + 1)
      } else if (
        err.response &&
        err.response.status === 401 &&
        this.access_token &&
        this.tokenExpiration - Date.now() < MAX_TOKEN_LATENCY
      ) {
        /**
         * If the server returns a 401 error, it's possible that the access token expired during the latency period as this
         * request was being sent. In this scenario, snoowrap thought that the access token was valid for a few more seconds, so it
         * didn't refresh the token, but the token had expired by the time the request reached the server. To handle this issue,
         * invalidate the access token and call oauth_request again, automatically causing the token to be refreshed.
         */
        this.tokenExpiration = -Infinity
        return this.oauthRequest(config, attempts)
      }
      throw err
    }
  }

  _awaitRatelimit () {
    if (this.ratelimitRemaining < 1 && Date.now() < this.ratelimitExpiration) {
      // If the ratelimit has been exceeded, delay or abort the request depending on the user's config.
      if (this._config.continueAfterRatelimitError) {
        /**
         * If the `continue_after_ratelimit_error` setting is enabled, queue the request, wait until the next ratelimit
         * period, and then send it.
         */
        const timeUntilExpiry = this.ratelimitExpiration - Date.now()
        this._warn(rateLimitWarning(timeUntilExpiry))
        return new Promise(resolve => setTimeout(resolve, timeUntilExpiry))
      }
      // Otherwise, throw an error.
      throw new RateLimitError()
    }
    // If the ratelimit hasn't been exceeded, no delay is necessary.
  }

  _awaitRequestDelay () {
    const now = Date.now()
    const waitTime = this._nextRequestTimestamp - now
    this._nextRequestTimestamp = Math.max(now, this._nextRequestTimestamp) + this._config.requestDelay
    return new Promise(resolve => setTimeout(resolve, waitTime))
  }

  _awaitExponentialBackoff (attempts: number) {
    if (attempts === 1) {
      return
    }
    const waitTime = (Math.pow(2, attempts - 1) + (Math.random() - 0.3)) * 1000
    return new Promise(resolve => setTimeout(resolve, waitTime))
  }

  /**
   * @summary Sends a request to the reddit server, authenticated with the user's client ID and client secret.
   * @desc **Note**: This is used internally as part of the authentication process, but it cannot be used to actually fetch
   * content from reddit. To do that, use {@link snoowrap#oauthRequest} or another of snoowrap's helper functions.
   *
   * This function can work with alternate `this`-bindings, provided that the binding has the `clientId`, `clientSecret`, and
   * `userAgent` properties. This allows it be used if no snoowrap requester has been created yet.
   * @param options Options for the request; See {@link snoowrap#rawRequest} for more details.
   * @returns The response from the reddit server
   * @example
   *
   * // example: this function could be used to exchange a one-time authentication code for a refresh token.
   * snoowrap.prototype.credentialedClientRequest.call({
   *   clientId: 'client id goes here',
   *   clientSecret: 'client secret goes here',
   *   userAgent: 'user agent goes here'
   * }, {
   *   method: 'post',
   *   baseURL: 'https://www.reddit.com',
   *   url: 'api/v1/access_token',
   *   form: {grant_type: 'authorization_code', code: 'code goes here', redirect_uri: 'redirect uri goes here'}
   * }).then(response => {
   *   //handle response here
   * })
   * @memberof snoowrap
   * @instance
   */
  credentialedClientRequest (config: AxiosRequestConfig) {
    if (!this.client_id) {
      throw new Error('Missing access_token')
    }
    return this.axiosCreate({
      baseURL: `https://www.${this._config.endpointDomain}`,
      headers: {
        'user-agent': this.user_agent!
      },
      auth: {
        username: this.client_id!,
        password: this.client_secret!
      },
      timeout: this._config.requestTimeout,
      _r: this
    }).request(config)
  }

  /**
   * @summary Updates this requester's access token if the current one is absent or expired.
   * @desc **Note**: This function is automatically called internally when making a request. While the function is exposed as
   * a stable feature, using it is rarely necessary unless an access token is needed for some external purpose, or to test
   * the validity of the refresh token.
   * @returns A Promise that fulfills with the access token when this request is complete
   * @memberof snoowrap
   * @instance
   * @example r.updateAccessToken()
   */
  async updateAccessToken () {
    if (!this.access_token || Date.now() > this.tokenExpiration) {
      let form: AxiosRequestConfig['form']

      if (this.refresh_token) {
        form = {
          grant_type: BaseRequester.grantTypes.REFRESH_TOKEN,
          refresh_token: this.refresh_token
        }
      } else if (this.username && this.password) {
        const password = this.two_factor_code ? `${this.password}:${this.two_factor_code}` : this.password
        form = {
          grant_type: BaseRequester.grantTypes.PASSWORD,
          username: this.username,
          password
        }
      } else if (this.code && this.redirect_uri) {
        form = {
          grant_type: BaseRequester.grantTypes.AUTHORIZATION_CODE,
          code: this.code,
          redirect_uri: this.redirect_uri
        }
      } else if (this.grant_type && this.device_id) { // fallback
        form = {
          grant_type: this.grant_type,
          device_id: this.device_id
        }
      }

      const response = await this.credentialedClientRequest({
        method: 'post',
        url: 'api/v1/access_token',
        form
      })

      const {
        access_token,
        refresh_token,
        expires_in,
        scope,
        error,
        error_description
      }: CredentialsResponse = response.data

      if (error) throw new Error(error_description ? `${error} - ${error_description}` : error)

      this.access_token = access_token
      this.refresh_token = refresh_token
      this.tokenExpiration = Date.now() + (expires_in * 1000)
      this.scope = scope.split(' ')
    }
    return this.access_token
  }

  /**
   * @summary Invalidates the given API token
   * @returns A Promise that fulfills when this request is complete
   */
  revokeToken (token: string) {
    return this.credentialedClientRequest({url: 'api/v1/revoke_token', form: {token}, method: 'post'})
  }

  /**
   * @summary Invalidates the current access token.
   * @returns A Promise that fulfills when this request is complete
   * @desc **Note**: This can only be used if the current requester was supplied with a `client_id` and `client_secret`. If the
   * current requester was supplied with a refresh token, it will automatically create a new access token if any more requests
   * are made after this one.
   * @example r.revokeAccessToken();
   */
  async revokeAccessToken () {
    if (!this.access_token) {
      throw new Error('Missing access_token')
    }
    await this.revokeToken(this.access_token)
    this.access_token = undefined
    this.tokenExpiration = Infinity
    this.scope = undefined
  }

  /**
   * @summary Invalidates the current refresh token.
   * @returns {Promise} A Promise that fulfills when this request is complete
   * @desc **Note**: This can only be used if the current requester was supplied with a `client_id` and `client_secret`. All
   * access tokens generated by this refresh token will also be invalidated. This effectively de-authenticates the requester and
   * prevents it from making any more valid requests. This should only be used in a few cases, e.g. if this token has
   * been accidentally leaked to a third party.
   * @example r.revokeRefreshToken();
   */
  async revokeRefreshToken () {
    if (!this.refresh_token) {
      throw new Error('Missing refresh_token')
    }
    await this.revokeToken(this.refresh_token)
    this.refresh_token = undefined
    this.access_token = undefined // Revoking a refresh token also revokes any associated access tokens.
    this.tokenExpiration = Infinity
    this.scope = undefined
  }

  /**
   * @summary Sends a request to the reddit server without authentication.
   * @param options Options for the request
   * @returns {Promise} The response from the reddit server
   * @memberof snoowrap
   * @instance
   */
  unauthenticatedRequest (config: AxiosRequestConfig) {
    return this.axiosCreate({
      baseURL: 'https://www.reddit.com',
      headers: {
        'user-agent': this.user_agent
      },
      params: {
        raw_json: 1
      },
      timeout: this._config.requestTimeout,
      _r: this
    })(config)
  }

  get request () {
    return this.client_id || this.access_token ? this.oauthRequest : this.unauthenticatedRequest
  }

  _get (config: AxiosRequestConfig) {
    config.method = 'GET'
    return this.request(config)
  }
  _post (config: AxiosRequestConfig) {
    config.method = 'POST'
    return this.request(config)
  }
  _put (config: AxiosRequestConfig) {
    config.method = 'PUT'
    return this.request(config)
  }
  _delete (config: AxiosRequestConfig) {
    config.method = 'DELETE'
    return this.request(config)
  }
  _head (config: AxiosRequestConfig) {
    config.method = 'HEAD'
    return this.request(config)
  }
  _patch (config: AxiosRequestConfig) {
    config.method = 'PATCH'
    return this.request(config)
  }

  axiosCreate = axiosCreate
  rawRequest = this.axiosCreate()
}

export default BaseRequester
export {Common, AppAuth, ScriptAuth, CodeAuth, All}
