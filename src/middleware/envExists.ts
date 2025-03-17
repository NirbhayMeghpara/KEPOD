import { Request, Response, NextFunction } from 'express';

export const envExists = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params;

  if (!name) {
    return res.status(400).json({ error: 'Environment name is required' });
  }

  // Placeholder: Check DynamoDB later
  const exists = true;
  if (!exists) {
    return res.status(404).json({ error: `Environment ${name} not found` });
  }

  next();
};