import { Router } from 'express';
import {
  iniciarSesion,
  obtenerSesionActual,
  registrarUsuario
} from '../controllers/authController.js';
import { autenticarToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', registrarUsuario);
router.post('/login', iniciarSesion);
router.get('/me', autenticarToken, obtenerSesionActual);

export default router;
