import { Router } from 'express';
import { createEnvironment, getEnvironment } from '../controllers/envController.js';
import { validateEnvRequest } from '../middleware/validateEnvRequest.js';
import { envExists } from '../middleware/envExists.js';

const router = Router();

router.post('/create-env', validateEnvRequest, createEnvironment);
router.get('/envs/:name', envExists, getEnvironment);

export default router;