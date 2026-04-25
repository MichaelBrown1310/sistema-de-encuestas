import { Router } from 'express';
import { obtenerEstado } from '../controllers/healthController.js';

const router = Router();

router.get('/health', obtenerEstado);

export default router;
