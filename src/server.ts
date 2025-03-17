import express from 'express';
import { config } from './config/config';
import envRoutes from './routes/envRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
app.use(express.json());
app.use('/api', envRoutes);
app.use(errorHandler);

app.listen(config.port, () => console.log(`Server running on port ${config.port}`));