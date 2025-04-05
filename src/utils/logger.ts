import { createLogger, format, transports } from 'winston';
import { config } from '../config/config.js';

const logger = createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
  ],
});

export default logger;