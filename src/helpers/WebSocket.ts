import ws from 'ws'
import isBrowser from './isBrowser'

const WebSocket: typeof self.WebSocket = isBrowser ? self.WebSocket : ws as any
export default WebSocket
