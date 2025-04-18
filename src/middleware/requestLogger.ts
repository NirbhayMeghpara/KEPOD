import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  logger.info({
    message: `${req.method} ${req.path}`,
    body: req.body || {},
    query: req.query || {},
    params: req.params || {},
  });
  next();
};