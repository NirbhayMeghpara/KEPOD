import { Consumer } from 'sqs-consumer';
import { provisionEnvironment } from './provisioner.js';
import { SQS_QUEUE_URL } from '../utils/constants.js';
import { sqsClient } from '../awsClients.js';

const app = Consumer.create({
  queueUrl: SQS_QUEUE_URL,
  sqs: sqsClient,
  handleMessage: async (message) => {
    const body = JSON.parse(message.Body || '{}');
    console.log(`Received message for env_id: ${body.env_id}`);
    await provisionEnvironment(body, message);
  },
});

app.on('error', (err) => {
  console.error('Queue listener error:', err);
});

app.on('processing_error', (err) => {
  console.error('Message processing error:', err);
});

console.log('Starting SQS listener...');
app.start();