import { Router } from 'express';
import {
  actualizarEncuestaBorrador,
  crearEncuesta,
  eliminarEncuestaPropia,
  listarEncuestasPublicadas,
  listarRespuestasRecibidas,
  listarEncuestasUsuario,
  obtenerEncuestaPropia,
  obtenerEncuestaPublicada,
  obtenerResumenUsuario,
  ocultarEncuesta,
  publicarEncuesta,
  responderEncuesta
} from '../controllers/surveyController.js';

const router = Router();

router.get('/resumen/:usuarioId', obtenerResumenUsuario);
router.get('/', listarEncuestasUsuario);
router.get('/publicadas', listarEncuestasPublicadas);
router.get('/publicadas/:id', obtenerEncuestaPublicada);
router.get('/:id/respuestas', listarRespuestasRecibidas);
router.get('/:id', obtenerEncuestaPropia);
router.post('/', crearEncuesta);
router.put('/:id', actualizarEncuestaBorrador);
router.post('/:id/publicar', publicarEncuesta);
router.post('/:id/ocultar', ocultarEncuesta);
router.post('/:id/respuestas', responderEncuesta);
router.delete('/:id', eliminarEncuestaPropia);

export default router;
