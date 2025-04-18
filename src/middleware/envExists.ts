import { Request, Response, NextFunction } from 'express';

export const envExists = (req: Request, res: Response, next: NextFunction) => {
  const { env_id } = req.params;

  if (!env_id) {
    res.status(400).json({ error: 'Missing env_id parameter' });
    return;
  }

  if (typeof env_id !== 'string') {
    res.status(400).json({ error: 'env_id must be a string' });
    return;
  }

  next();
};