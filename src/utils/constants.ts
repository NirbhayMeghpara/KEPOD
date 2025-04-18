export const STATUS = {
  QUEUED: 'QUEUED',
  PENDING: 'PENDING',
  READY: 'READY',
  DELETED: 'DELETED',
};

export const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
export const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'kepod-environments';
export const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/868610198161/kepod-provisioning-queue';
export const S3_BUCKET = process.env.S3_BUCKET || 'kepod-logs-868610198161';
export const LOG_DIR = '/tmp';
export const KEPOD_API_URL = process.env.API_URL || 'http://kepod-api-service.kepod.svc.cluster.local:3000';
