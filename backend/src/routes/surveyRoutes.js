import { Router } from 'express';
import { autenticarToken } from '../middleware/authMiddleware.js';
import {
  actualizarEncuestaBorrador,
  crearEncuesta,
  duplicarEncuestaPropia,
  eliminarEncuestaPropia,
  exportarRespuestasEncuesta,
  listarMisRespuestas,
  listarEncuestasPublicadas,
  listarRespuestasRecibidas,
  listarEncuestasUsuario,
  obtenerMiRespuesta,
  obtenerEncuestaPropia,
  obtenerEncuestaPublicada,
  obtenerResumenUsuario,
  ocultarEncuesta,
  publicarEncuesta,
  responderEncuesta
} from '../controllers/surveyController.js';

const router = Router();

router.get('/publicadas', listarEncuestasPublicadas);
router.get('/publicadas/:id', obtenerEncuestaPublicada);
router.use(autenticarToken);
router.get('/resumen', obtenerResumenUsuario);
router.get('/mis-respuestas', listarMisRespuestas);
router.get('/mis-respuestas/:respuestaId', obtenerMiRespuesta);
router.get('/', listarEncuestasUsuario);
router.get('/:id/exportar', exportarRespuestasEncuesta);
router.get('/:id/respuestas', listarRespuestasRecibidas);
router.get('/:id', obtenerEncuestaPropia);
router.post('/', crearEncuesta);
router.post('/:id/duplicar', duplicarEncuestaPropia);
router.put('/:id', actualizarEncuestaBorrador);
router.post('/:id/publicar', publicarEncuesta);
router.post('/:id/ocultar', ocultarEncuesta);
router.post('/:id/respuestas', responderEncuesta);
router.delete('/:id', eliminarEncuestaPropia);

export default router;
