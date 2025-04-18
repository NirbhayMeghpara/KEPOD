import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { KubeConfig, CoreV1Api, AppsV1Api, V1Namespace, V1Deployment, V1Service } from '@kubernetes/client-node';
import { DYNAMODB_TABLE, SQS_QUEUE_URL, STATUS } from '../utils/constants.js';
import { SQSMessageBody } from '../types/sqsMessageBodyTypes.js';
import { DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { dynamoClient, sqsClient } from '../awsClients.js';
import logger from '../utils/logger.js';

const kc = new KubeConfig();
kc.loadFromDefault();
const k8sCoreApi = kc.makeApiClient(CoreV1Api);
const k8sAppsApi = kc.makeApiClient(AppsV1Api);

export async function provisionEnvironment({ env_id, env_name, image, ttl, namespace, targetPort }: SQSMessageBody, message: any) {
  try {
    await createNamespace(k8sCoreApi, namespace);
    await createDeployment(k8sAppsApi, namespace, env_name, image);
    const appUrl = await createService(k8sCoreApi, namespace, env_name, targetPort);

    const dynamoParams = {
      TableName: DYNAMODB_TABLE,
      Key: { env_id: { S: env_id } },
      UpdateExpression: 'SET #status = :status, #url = :url',
      ExpressionAttributeNames: { '#status': 'status', '#url': 'app_url' },
      ExpressionAttributeValues: {
        ':status': { S: STATUS.READY },
        ':url': { S: appUrl },
      },
    };

    await dynamoClient.send(new UpdateItemCommand(dynamoParams));

    await sqsClient.send(new DeleteMessageCommand({
      QueueUrl: SQS_QUEUE_URL,
      ReceiptHandle: message.ReceiptHandle,
    }));

    console.log(`Environment ${env_id} provisioned with URL: ${appUrl}`);
  } catch (error) {
    console.error(`Failed to provision env_id ${env_id}:`, error);
    throw error;
  }
}

async function createNamespace(k8sCoreApi: CoreV1Api, namespace: string) {
  const namespaceSpec: V1Namespace = {
    metadata: { name: namespace },
  };

  try {
    await k8sCoreApi.createNamespace({ body: namespaceSpec });
    
    console.log(`Created namespace: ${namespace}`);
  } catch (err: any) {
    if (err.response?.statusCode !== 409) throw err;
    console.log(`Namespace ${namespace} already exists`);
  }
}

async function createDeployment(k8sAppsApi: AppsV1Api, namespace: string, env_name: string, image: string) {
  const deploymentSpec: V1Deployment = {
    metadata: { name: `${namespace}-app`, namespace },
    spec: {
      replicas: 1,
      selector: { matchLabels: { app: env_name } },
      template: {
        metadata: { labels: { app: env_name } },
        spec: { containers: [{ name: env_name, image, resources: { requests: { cpu: '100m', memory: '128Mi' } } }] },
      },
    },
  };

  try {
    await k8sAppsApi.createNamespacedDeployment({ namespace, body: deploymentSpec });
    console.log(`Created deployment: ${namespace}-app`);
  } catch (err: any) {
    if (err.response?.statusCode !== 409) throw err;
    console.log(`Deployment ${namespace}-app already exists`);
  }
}

async function createService(k8sCoreApi: CoreV1Api, namespace: string, env_name: string, targetPort: number): Promise<string> {
  const serviceSpec: V1Service = {
    metadata: { name: `${namespace}-svc`, namespace },
    spec: {
      selector: { app: env_name },
      ports: [{ port: 80, targetPort }],
      type: 'LoadBalancer',
    },
  };

  try {
    await k8sCoreApi.createNamespacedService({ namespace, body: serviceSpec });
    logger.info({ message: `Created service: ${namespace}-svc`, namespace });
  } catch (err: any) {
    if (err.response?.statusCode !== 409) throw err;
    logger.info({ message: `Service ${namespace}-svc already exists`, namespace });
    return 'existing-service';
  }

  // Poll for LoadBalancer ingress
  const maxAttempts = 12; // 2 minutes (12 * 10s)
  const pollInterval = 10000; // 10s
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const service = await k8sCoreApi.readNamespacedService({ name: `${namespace}-svc`, namespace });
      const ingress = service.status?.loadBalancer?.ingress?.[0];
      const hostname = ingress?.hostname;
      if (hostname) {
        logger.info({ message: `Service ingress available: ${hostname}`, namespace });
        return hostname;
      }
      logger.info({ message: `Waiting for service ingress (attempt ${attempt}/${maxAttempts})`, namespace });
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (err: any) {
      logger.error({ message: `Error polling service ${namespace}-svc: ${err.message}`, namespace });
    }
  }

  logger.warn({ message: `Service ingress not available after ${maxAttempts} attempts`, namespace });
  return 'pending';
}