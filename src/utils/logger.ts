import { createLogger, format, transports } from 'winston';
import Transport from 'winston-transport';
import { config } from '../config/config.js';
import { broadcastLog } from '../websocket.js';

// Custom WebSocket Transport
class WebSocketTransport extends Transport {
  constructor() {
    super();
  }
  log(info: any, callback: () => void) {
    broadcastLog({ message: info.message, env_name: info.env_name || 'unknown', timestamp: info.timestamp });
    callback();
  }
}

const logger = createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new WebSocketTransport(),
  ],
});

export default logger;