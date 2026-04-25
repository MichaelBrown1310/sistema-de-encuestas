import { Router } from 'express';
import {
  crearEncuesta,
  listarEncuestasPublicadas,
  listarEncuestasUsuario,
  obtenerEncuestaPublicada,
  obtenerResumenUsuario,
  responderEncuesta
} from '../controllers/surveyController.js';

const router = Router();

router.get('/resumen/:usuarioId', obtenerResumenUsuario);
router.get('/', listarEncuestasUsuario);
router.get('/publicadas', listarEncuestasPublicadas);
router.get('/publicadas/:id', obtenerEncuestaPublicada);
router.post('/', crearEncuesta);
router.post('/:id/respuestas', responderEncuesta);

export default router;
