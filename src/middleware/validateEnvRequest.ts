import { Request, Response, NextFunction } from 'express';
import { EnvironmentRequest } from '../types/envTypes'; // Updated import

export const validateEnvRequest = (req: Request, res: Response, next: NextFunction) => {
  const { name, image, ttl } = req.body as Partial<EnvironmentRequest>;

  if (!name || typeof name !== 'string' || name.length < 3) {
    return res.status(400).json({ error: 'Invalid or missing environment name (min 3 chars)' });
  }
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing image' });
  }
  if (!ttl || typeof ttl !== 'number' || ttl <= 0) {
    return res.status(400).json({ error: 'Invalid or missing TTL (must be positive number)' });
  }

  next();
};