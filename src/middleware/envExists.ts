import { Request, Response, NextFunction } from 'express';

export const envExists = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params;

  if (!name) {
    res.status(400).json({ error: 'Environment name is required' });
    return;
  }

  const exists = true;
  if (!exists) {
    res.status(404).json({ error: `Environment ${name} not found` });
    return;
  }

  next();
};