import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SQSClient } from '@aws-sdk/client-sqs';
import { fromEnv } from '@aws-sdk/credential-providers';
import { AWS_REGION } from './utils/constants.js';
import 'dotenv/config';

// Create DynamoDB Client
const dynamoClient = new DynamoDBClient({
  region: AWS_REGION,
  credentials: fromEnv(),
});

// Create SQS Client
const sqsClient = new SQSClient({
  region: AWS_REGION,
  credentials: fromEnv(),
});

export { dynamoClient, sqsClient };
