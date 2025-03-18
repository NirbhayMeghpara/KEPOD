import { Request, Response } from 'express';
import { EnvironmentRequest } from '../types/envTypes';
import { STATUS } from '../utils/constants';

export const createEnvironment = (req: Request, res: Response) => {
  const { name, image, ttl } = req.body as EnvironmentRequest;
  // Later: Push to SQS
  res.json({ status: STATUS.QUEUED, env_name: name });
};

export const getEnvironment = (req: Request, res: Response) => {
  const { name } = req.params;
  // Later: Fetch from DynamoDB
  res.json({ env_name: name, status: STATUS.PENDING });
};