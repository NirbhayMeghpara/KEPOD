import { Request, Response, NextFunction } from 'express';
import { EnvironmentRequest } from '../types/envTypes';

export const validateEnvRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { name, image, ttl, targetPort } = req.body as Partial<EnvironmentRequest>;

  if (!name) {
    res.status(400).json({ error: 'Environment name is required' });
    return;
  }
  if (typeof name !== 'string') {
    res.status(400).json({ error: 'Environment name must be a string' });
    return;
  }
  if (name.length < 3) {
    res.status(400).json({ error: 'Environment name must be at least 3 characters long' });
    return;
  }

  if (!image) {
    res.status(400).json({ error: 'Image is required' });
    return;
  }
  if (typeof image !== 'string') {
    res.status(400).json({ error: 'Image must be a string' });
    return;
  }

  if (!ttl) {
    res.status(400).json({ error: 'TTL is required' });
    return;
  }
  if (typeof ttl !== 'number') {
    res.status(400).json({ error: 'TTL must be a number' });
    return;
  }
  if (ttl <= 0) {
    res.status(400).json({ error: 'TTL must be greater than 0' });
    return;
  }

  if (!targetPort) {
    res.status(400).json({ error: 'Target port is required' });
    return;
  }
  if (typeof targetPort !== 'number') {
    res.status(400).json({ error: 'Target port must be a number' });
    return;
  }
  if (targetPort <= 0 || targetPort > 65535) {
    res.status(400).json({ error: 'Target port must be between 1 and 65535' });
    return;
  }

  next();
};