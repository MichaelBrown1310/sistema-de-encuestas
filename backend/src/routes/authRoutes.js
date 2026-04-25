import { Router } from 'express';
import { iniciarSesion, registrarUsuario } from '../controllers/authController.js';

const router = Router();

router.post('/register', registrarUsuario);
router.post('/login', iniciarSesion);

export default router;
