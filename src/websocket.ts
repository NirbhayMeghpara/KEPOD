import { WebSocketServer, WebSocket } from 'ws';
import logger from './utils/logger.js';

const wss = new WebSocketServer({ port: 8080 });
const subscriptions = new Map<WebSocket, string>();

wss.on('connection', (ws: WebSocket) => {
  logger.info({ message: 'Client connected to WebSocket' });
  ws.on('message', (message) => {
    const { env_name } = JSON.parse(message.toString());
    logger.info({ message: `Client subscribed to env: ${env_name}` });
    subscriptions.set(ws, env_name);
  });
  ws.on('close', () => subscriptions.delete(ws));
});

export const broadcastLog = (log: { message: string; env_name: string; timestamp: string }) => {
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === 1 && subscriptions.get(client) === log.env_name) {
      client.send(JSON.stringify(log));
    }
  });
};

export default wss;