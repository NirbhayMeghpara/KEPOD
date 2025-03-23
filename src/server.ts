import express, { Request, Response } from 'express';
import { config } from './config/config';
import envRoutes from './routes/envRoutes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import './websocket';

const app = express();
app.use(express.json());
app.use(requestLogger);
app.use('/api', envRoutes);
app.use(errorHandler);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json('OK')
  return
});

app.listen(config.port, '0.0.0.0', () => console.log(`Server running on port ${config.port}`));