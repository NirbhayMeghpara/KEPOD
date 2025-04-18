import { Router } from 'express';
import { cleanupEnvironment, createEnvironment, getAllEnvironments, getEnvironment } from '../controllers/envController.js';
import { validateEnvRequest } from '../middleware/validateEnvRequest.js';
import { envExists } from '../middleware/envExists.js';

const router = Router();

router.post('/create-env', validateEnvRequest, createEnvironment);
router.get('/envs/:env_id', envExists, getEnvironment);
router.get('/envs', getAllEnvironments);
router.post('/cleanup/:env_id', envExists, cleanupEnvironment);

export default router;