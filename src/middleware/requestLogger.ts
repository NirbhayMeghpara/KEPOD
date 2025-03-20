import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const envName = req.body.name || req.params.name || 'unknown';
  logger.info({
    message: `${req.method} ${req.path}`,
    env_name: envName,
    timestamp: new Date().toISOString(),
  });
  next();
};