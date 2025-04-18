import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import fetch from 'node-fetch';
import logger from '../utils/logger.js';
import { DYNAMODB_TABLE, KEPOD_API_URL, STATUS } from '../utils/constants.js';

const dynamoClient = new DynamoDBClient({});
const kc = new KubeConfig();
kc.loadFromDefault();
const k8sCoreApi = kc.makeApiClient(CoreV1Api);

async function cleanupExpiredEnvironments() {
  try {
    const scanParams = {
      TableName: DYNAMODB_TABLE,
      FilterExpression: '#status = :readyStatus',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':readyStatus': { S: STATUS.READY } },
    };

    const scanResult = await dynamoClient.send(new ScanCommand(scanParams));
    const items = scanResult.Items || [];

    if (items.length === 0) {
      logger.info({ message: 'No READY environments found for cleanup' });
      process.exit(0);
    }

    for (const item of items) {
      const env = unmarshall(item);
      const { env_id, namespace, created_at, ttl } = env;

      const createdAt = new Date(created_at).getTime();

      if (createdAt + ttl * 1000 <= Date.now()) {
        logger.info({ message: `Cleaning up expired environment: ${env_id}`, namespace });

        try {
          if (!namespace || typeof namespace !== 'string') {
            logger.error({ message: `Invalid namespace for env_id ${env_id}: ${namespace}`, namespace });
            continue;
          }

          // Signal kepod-api to upload logs
          try {
            const response = await fetch(`${KEPOD_API_URL}/api/cleanup/${env_id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ namespace }),
            });

            if (!response.ok) {
              logger.error({ message: `Failed to signal cleanup for env_id ${env_id}: ${response.statusText}`, namespace });
            } else {
              logger.info({ message: `Signaled cleanup for env_id ${env_id}`, namespace });
            }
          } catch (error: any) {
            logger.error({ message: `Failed to call cleanup API for env_id ${env_id}: ${error.message}`, namespace });
          }

          // Delete namespace
          await k8sCoreApi.deleteNamespace({ name: namespace }).catch(err => {
            if (err.statusCode === 404) {
              logger.info({ message: `Namespace ${namespace} already deleted`, namespace });
              return;
            }
            throw err;
          });

          const updateParams = {
            TableName: DYNAMODB_TABLE,
            Key: marshall({ env_id }),
            UpdateExpression: 'SET #status = :deleted',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':deleted': { S: STATUS.DELETED },
            },
          };

          await dynamoClient.send(new UpdateItemCommand(updateParams));
          logger.info({ message: `Marked env_id ${env_id} as DELETED and removed namespace ${namespace}`, namespace });
        } catch (error: any) {
          logger.error({ message: `Failed to clean up namespace ${namespace}: ${error.message}`, namespace });
        }
      }
    }

    process.exit(0);
  } catch (error: any) {
    logger.error({ message: `Cleanup error: ${error.message}` });
    process.exit(1);
  }
}

cleanupExpiredEnvironments().catch(err => {
  logger.error({ message: `Cleanup failed: ${err.message}` });
  process.exit(1);
});
