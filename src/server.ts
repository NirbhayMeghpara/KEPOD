import express, { Request, Response } from 'express';
import { config } from './config/config.js';
import envRoutes from './routes/envRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import './websocket.js';
import cors from 'cors';

const app = express();

app.use(cors());

app.use(express.json());
app.use(requestLogger);
app.use('/api', envRoutes);
app.use(errorHandler);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json('OK')
  return
});

app.listen(config.port, '0.0.0.0', () => console.log(`Server running on port ${config.port}`));