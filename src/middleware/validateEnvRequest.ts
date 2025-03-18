import { Request, Response, NextFunction } from 'express';
import { EnvironmentRequest } from '../types/envTypes';

export const validateEnvRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { name, image, ttl } = req.body as Partial<EnvironmentRequest>;

  if (!name || typeof name !== 'string' || name.length < 3) {
    res.status(400).json({ error: 'Invalid or missing environment name (min 3 chars)' });
    return;
  }
  if (!image || typeof image !== 'string') {
    res.status(400).json({ error: 'Invalid or missing image' });
    return;
  }
  if (!ttl || typeof ttl !== 'number' || ttl <= 0) {
    res.status(400).json({ error: 'Invalid or missing TTL (must be positive number)' });
    return;
  }

  next();
};