export const consoleLogger = Object.freeze({
  warn (...args: any[]) {
    // eslint-disable-next-line no-console
    console.warn('[warning]', ...args)
  },
  info (...args: any[]) {
    // eslint-disable-next-line no-console
    console.info('[info]', ...args)
  },
  debug (...args: any[]) {
    // eslint-disable-next-line no-console
    console.debug('[debug]', ...args)
  },
  trace (...args: any[]) {
    // eslint-disable-next-line no-console
    console.trace('[trace]', ...args)
  }
})

export default {
  endpointDomain: 'reddit.com',
  requestDelay: 0,
  requestTimeout: 30000,
  continueAfterRatelimitError: false,
  retryErrorCodes: [502, 503, 504, 522],
  maxRetryAttempts: 3,
  warnings: true,
  debug: false,
  logger: consoleLogger
}
