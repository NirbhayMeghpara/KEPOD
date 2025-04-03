export const STATUS = {
  QUEUED: 'QUEUED',
  PENDING: 'PENDING',
  READY: 'READY',
  DELETED: 'DELETED',
};

export const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
export const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'kepod-environments';
export const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL || '';