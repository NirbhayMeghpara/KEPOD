import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SQSClient } from '@aws-sdk/client-sqs';
import { fromEnv } from '@aws-sdk/credential-providers';
import { AWS_REGION } from './utils/constants.js';
import 'dotenv/config';
import { S3Client } from '@aws-sdk/client-s3';

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

const s3Client = new S3Client({ 
  region: "us-east-1",
  credentials: fromEnv() 
});

export { dynamoClient, sqsClient, s3Client };
