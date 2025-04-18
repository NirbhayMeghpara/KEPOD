import { WebSocketServer, WebSocket } from 'ws';
import { KubeConfig, CoreV1Api, Log } from '@kubernetes/client-node';
import logger, { writeContainerLog } from './utils/logger.js';
import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { dynamoClient } from './awsClients.js';
import { DYNAMODB_TABLE } from './utils/constants.js';
import { Writable } from 'stream';

const wss = new WebSocketServer({ port: 8080 });
const subscriptions = new Map();

const kc = new KubeConfig();
kc.loadFromDefault();
const k8sCoreApi = kc.makeApiClient(CoreV1Api);
const k8sLog = new Log(kc);

wss.on('connection', (ws: WebSocket) => {
  logger.info({ message: 'Client connected to WebSocket' });

  ws.on('message', async (message) => {
    try {
      const { env_id } = JSON.parse(message.toString());
      if (!env_id) {
        ws.send(JSON.stringify({ error: 'Missing env_id' }));
        return;
      }

      logger.info({ message: `Client subscribed to env_id: ${env_id}` });

      const namespace = await getNamespaceFromEnvId(env_id);
      if (!namespace) {
        ws.send(JSON.stringify({ error: `No namespace found for env_id ${env_id}` }));
        return;
      }

      const podList = await k8sCoreApi.listNamespacedPod({ namespace });
      const pod = podList.items.find(pod => pod.metadata?.name?.startsWith(`${namespace}-app`));
      if (!pod) {
        ws.send(JSON.stringify({ error: `No pod found in namespace ${namespace}` }));
        return;
      }

      const podName = pod.metadata?.name;
      if (!podName) {
        ws.send(JSON.stringify({ error: 'Pod name missing' }));
        return;
      }

      const logStream = new Writable({
        write(chunk, encoding, callback) {
          const logLine = chunk.toString();
          ws.send(logLine);
          writeContainerLog(namespace, logLine);
          callback();
        },
      });

      // Stream logs to logStream
      const abortController = await k8sLog.log(
        namespace,
        podName,
        pod.spec?.containers?.[0]?.name || 'main',
        logStream,
        { follow: true }
      );

      subscriptions.set(ws, { env_id, namespace, logStream, abortController });

      logStream.on('error', (err) => {
        ws.send(JSON.stringify({ error: `Log stream error: ${err.message}` }));
        logStream.destroy();
      });

      ws.on('close', () => {
        abortController.abort();
        logStream.destroy();
        subscriptions.delete(ws);
        logger.info({ message: `Client unsubscribed from env_id: ${env_id}`, namespace });
      });
    } catch (error: any) {
      ws.send(JSON.stringify({ error: `Failed to stream logs: ${error.message}` }));
    }
  });

  ws.on('close', () => {
    const subscription = subscriptions.get(ws);
    if (subscription) {
      subscription.abortController.abort();
      subscription.logStream.destroy();
      subscriptions.delete(ws);
      logger.info({ message: `Client unsubscribed from env_id: ${subscription.env_id}`, namespace: subscription.namespace });
    }
  });
});

async function getNamespaceFromEnvId(env_id: string): Promise<string | null> {
  const params = {
    TableName: DYNAMODB_TABLE,
    Key: { env_id: { S: env_id } },
  };
  const result = await dynamoClient.send(new GetItemCommand(params));
  return result.Item?.namespace?.S || null;
}

export default wss;