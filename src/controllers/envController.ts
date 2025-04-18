import { NextFunction, Request, Response } from 'express';
import { EnvironmentRequest } from '../types/envTypes.js';
import { STATUS, DYNAMODB_TABLE, SQS_QUEUE_URL, LOG_DIR, S3_BUCKET } from '../utils/constants.js';
import { PutItemCommand, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { v4 as uuidv4 } from 'uuid';
import { dynamoClient, s3Client, sqsClient } from '../awsClients.js';
import logger from '../utils/logger.js';
import * as fs from 'fs';
import * as path from 'path';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export const createEnvironment = async (req: Request, res: Response, next: NextFunction) => {
  const { name, image, ttl, targetPort } = req.body as EnvironmentRequest;

  if (!SQS_QUEUE_URL) {
    res.status(500).json({ error: 'SQS queue URL not configured' });
    return;
  }

  const env_id = uuidv4();
  const namespace = `${name}-${env_id}`;

  try {
    const dynamoParams = {
      TableName: DYNAMODB_TABLE,
      Item: {
        env_id: { S: env_id },
        env_name: { S: name },
        image: { S: image },
        ttl: { N: ttl.toString() },
        status: { S: STATUS.PENDING },
        namespace: { S: namespace },
        target_port: { N: targetPort.toString() },
        created_at: { N: Date.now().toString() },
      },
    };
    await dynamoClient.send(new PutItemCommand(dynamoParams));

    const sqsParams = {
      QueueUrl: SQS_QUEUE_URL,
      MessageBody: JSON.stringify({ env_id, env_name: name, image, ttl, namespace, targetPort }),
    };
    await sqsClient.send(new SendMessageCommand(sqsParams));

    res.status(201).json({ env_id, status: STATUS.QUEUED });
  } catch (error) {
    console.error('Error creating environment:', error);
    next(error);
  }
};

export const getEnvironment = async (req: Request, res: Response, next: NextFunction) => {
  const { env_id } = req.params;

  try {
    const dynamoParams = {
      TableName: DYNAMODB_TABLE,
      Key: {
        env_id: { S: env_id },
      },
    };
    const result = await dynamoClient.send(new GetItemCommand(dynamoParams));

    if (!result.Item) {
      res.status(404).json({ error: 'Environment not found' });
      return;
    }

    const env = {
      env_id: result.Item.env_id.S,
      env_name: result.Item.env_name.S,
      image: result.Item.image.S,
      ttl: Number(result.Item.ttl.N),
      status: result.Item.status.S,
      namespace: result.Item.namespace.S,
      target_port: Number(result.Item.target_port.N),
      created_at: Number(result.Item.created_at.N),
      app_url: result.Item.app_url?.S || 'pending',
    };

    res.status(200).json(env);
  } catch (error) {
    console.error('Error fetching environment:', error);
    next(error);
  }
};

export const getAllEnvironments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dynamoParams = {
      TableName: DYNAMODB_TABLE,
    };
    const result = await dynamoClient.send(new ScanCommand(dynamoParams));

    if (!result.Items || result.Items.length === 0) {
      res.status(200).json([]);
      return;
    }

    const environments = result.Items.map((item) => ({
      env_id: item.env_id.S,
      env_name: item.env_name.S,
      image: item.image.S,
      ttl: Number(item.ttl.N),
      status: item.status.S,
      namespace: item.namespace.S,
      targetPort: Number(item.target_port.N),
      created_at: Number(item.created_at.N),
      app_url: item.app_url?.S || 'pending',
    }));

    res.status(200).json(environments);
  } catch (error) {
    console.error('Error fetching all environments:', error);
    next(error);
  }
};

export const cleanupEnvironment = async (req: Request, res: Response, next: NextFunction) => {
  const { env_id } = req.params;
  const { namespace } = req.body;

  try {
    if (!namespace || typeof namespace !== 'string') {
      logger.error({ message: `Invalid namespace for env_id ${env_id}: ${namespace}` });
      res.status(400).json({ error: `Invalid namespace: ${namespace}` });
      return;
    }

    const logFile = path.join(LOG_DIR, `${namespace}.log`);

    if (fs.existsSync(logFile)) {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const s3Key = `logs/${namespace}-${env_id}/${timestamp}.log`;

      await s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: fs.readFileSync(logFile),
        ContentType: 'text/plain',
      }));

      logger.info({ message: `Uploaded log file to s3://${S3_BUCKET}/${s3Key}`, namespace });

      // Delete local log file
      fs.unlinkSync(logFile);
    } else {
      logger.info({ message: `No log file found for namespace ${namespace}`, namespace });
    }

    res.json({ status: 'Logs uploaded' });
  } catch (error: any) {
    logger.error({ message: `Failed to cleanup logs for env_id ${env_id}: ${error.message}`, namespace });
    res.status(500).json({ error: `Failed to cleanup logs: ${error.message}` });
  }
};