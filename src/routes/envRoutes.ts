import { Router } from 'express';
import { createEnvironment, getAllEnvironments, getEnvironment } from '../controllers/envController.js';
import { validateEnvRequest } from '../middleware/validateEnvRequest.js';
import { envExists } from '../middleware/envExists.js';

const router = Router();

router.post('/create-env', validateEnvRequest, createEnvironment);
router.get('/envs/:env_id', envExists, getEnvironment);
router.get('/envs', getAllEnvironments);

export default router;