import ws from 'ws'
import isBrowser from './isBrowser'

const WebSocket = isBrowser ? self.WebSocket : ws
export default WebSocket
