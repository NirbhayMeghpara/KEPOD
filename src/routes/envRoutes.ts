import { Router } from 'express';
import { createEnvironment, getEnvironment } from '../controllers/envController';
import { validateEnvRequest, envExists } from '../middleware';

const router = Router();

router.post('/create-env', validateEnvRequest, createEnvironment);
router.get('/envs/:name', envExists, getEnvironment);

export default router;