import { createLogger, format, transports, Logger } from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import { LOG_DIR } from './constants.js';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
  ],
});

// Write log to file named after namespace
function writeToFile(namespace: string, level: string, message: string): void {
  try {
    const timestamp = new Date().toISOString();
    const logFile = path.join(LOG_DIR, `${namespace}.log`);
    const logEntry = `${timestamp} [${level}] ${message}\n`;

    // Append to file (create if doesn't exist)
    fs.appendFileSync(logFile, logEntry, { encoding: 'utf8' });
  } catch (error: any) {
    console.error(`Failed to write to file for namespace ${namespace}: ${error.message}`);
  }
}

// Write WebSocket container log (raw log line from pod)
function writeContainerLog(namespace: string, message: string): void {
  try {
    const timestamp = new Date().toISOString();
    const logFile = path.join(LOG_DIR, `${namespace}.log`);
    const logEntry = `${timestamp} ${message}\n`;

    fs.appendFileSync(logFile, logEntry, { encoding: 'utf8' });
  } catch (error: any) {
    console.error(`Failed to write container log for namespace ${namespace}: ${error.message}`);
  }
}

// Store original methods
const originalInfo = logger.info.bind(logger);
const originalError = logger.error.bind(logger);

// Override logger methods for app logs
logger.info = (message: any, meta: { namespace?: string } = {}, ...rest: any[]): Logger => {
  const namespace = meta.namespace || 'default';
  originalInfo(message, meta, ...rest);
  writeToFile(namespace, 'INFO', message);
  return logger;
};

logger.error = (message: any, meta: { namespace?: string } = {}, ...rest: any[]): Logger => {
  const namespace = meta.namespace || 'default';
  originalError(message, meta, ...rest);
  writeToFile(namespace, 'ERROR', message);
  return logger;
};

export default logger;
export { writeContainerLog };