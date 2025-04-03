import { NextFunction, Request, Response } from 'express';
import { EnvironmentRequest } from '../types/envTypes';
import { STATUS, AWS_REGION, DYNAMODB_TABLE, SQS_QUEUE_URL } from '../utils/constants';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { fromEnv } from '@aws-sdk/credential-providers';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({ region: AWS_REGION, credentials: fromEnv() });
const sqsClient = new SQSClient({ region: AWS_REGION, credentials: fromEnv() });

export const createEnvironment = async (req: Request, res: Response, next: NextFunction) => {
  const { name, image, ttl } = req.body as EnvironmentRequest;

  if (!SQS_QUEUE_URL) {
    res.status(500).json({ error: 'SQS queue URL not configured' });
    return;
  }

  const env_id = uuidv4();
  const namespace = `env-${env_id}`;

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
        created_at: { N: Date.now().toString() },
      },
    };
    await dynamoClient.send(new PutItemCommand(dynamoParams));

    const sqsParams = {
      QueueUrl: SQS_QUEUE_URL,
      MessageBody: JSON.stringify({ env_id, env_name: name, image, ttl, namespace }),
    };
    await sqsClient.send(new SendMessageCommand(sqsParams));

    res.status(201).json({ env_id, status: STATUS.QUEUED });
  } catch (error) {
    console.error('Error creating environment:', error);
    next(error);
  }
};

export const getEnvironment = (req: Request, res: Response) => {
  const { name } = req.params;
  res.json({ env_name: name, status: STATUS.PENDING }); // TODO: Implement DynamoDB fetch
};