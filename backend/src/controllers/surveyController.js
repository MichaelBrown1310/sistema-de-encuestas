import pool from '../db.js';
import {
  actualizarEncuesta,
  actualizarEstadoEncuesta,
  actualizarOcultamientoEncuesta,
  crearDetallesRespuesta,
  crearEncuestaCompleta,
  crearRespuesta,
  eliminarEncuesta,
  obtenerDetalleEncuestaPublicada,
  obtenerDetalleEncuestaPorUsuario,
  obtenerDetalleRespuestaUsuario,
  obtenerEncuestaBase,
  obtenerEncuestasRespondidasPorUsuario,
  obtenerEncuestasPorUsuario,
  obtenerEncuestasPublicadas,
  obtenerOpcionesPreguntas,
  obtenerPreguntasEncuesta,
  obtenerRespuestasRecibidas,
  obtenerResumenEncuestasPorUsuario
  ,
  usuarioYaRespondioEncuesta
} from '../models/surveyModel.js';
import {
  esImagenValida,
  mapearEncuestaDetallada,
  mapearDetalleRespuestaUsuario,
  mapearEncuestasRespondidas,
  mapearRespuestasRecibidas,
  normalizarTexto,
  validarPesoImagenes,
  validarSecciones
} from '../utils/surveyUtils.js';

async function rollbackSeguro(conexion, contexto) {
  try {
    await conexion.rollback();
  } catch (rollbackError) {
    console.error(`No se pudo revertir la transaccion en ${contexto}:`, rollbackError);
  }
}

export async function obtenerResumenUsuario(req, res) {
  const usuarioId = Number(req.params.usuarioId);

  if (!usuarioId) {
    return res.status(400).json({ message: 'Usuario invalido.' });
  }

  try {
    const resumen = await obtenerResumenEncuestasPorUsuario(usuarioId);

    return res.json({
      totalEncuestas: Number(resumen.totalEncuestas || 0),
      totalPublicadas: Number(resumen.totalPublicadas || 0),
      totalBorradores: Number(resumen.totalBorradores || 0)
    });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    return res.status(500).json({ message: 'No se pudo obtener el resumen.' });
  }
}

export async function listarEncuestasUsuario(req, res) {
  const usuarioId = Number(req.query.usuarioId);

  if (!usuarioId) {
    return res.status(400).json({ message: 'Usuario invalido.' });
  }

  try {
    const encuestas = await obtenerEncuestasPorUsuario(usuarioId);
    return res.json(encuestas);
  } catch (error) {
    console.error('Error al obtener encuestas:', error);
    return res.status(500).json({ message: 'No se pudieron obtener las encuestas.' });
  }
}

export async function listarEncuestasPublicadas(_req, res) {
  try {
    const encuestas = await obtenerEncuestasPublicadas();
    return res.json(encuestas);
  } catch (error) {
    console.error('Error al obtener encuestas publicadas:', error);
    return res.status(500).json({ message: 'No se pudieron obtener las encuestas publicadas.' });
  }
}

export async function obtenerEncuestaPublicada(req, res) {
  const encuestaId = Number(req.params.id);

  if (!encuestaId) {
    return res.status(400).json({ message: 'Encuesta invalida.' });
  }

  try {
    const filas = await obtenerDetalleEncuestaPublicada(encuestaId);

    if (filas.length === 0) {
      return res.status(404).json({ message: 'Encuesta no encontrada.' });
    }

    return res.json(mapearEncuestaDetallada(filas));
  } catch (error) {
    console.error('Error al obtener detalle de encuesta:', error);
    return res.status(500).json({ message: 'No se pudo obtener la encuesta.' });
  }
}

function construirPayloadEncuesta(body) {
  return {
    usuario_id: body.usuario_id,
    titulo: normalizarTexto(body.titulo),
    descripcion: normalizarTexto(body.descripcion),
    imagen_portada: body.imagen_portada || null,
    categoria: normalizarTexto(body.categoria),
    estado: body.estado,
    mensaje_confirmacion:
      normalizarTexto(body.mensaje_confirmacion) || 'Tu respuesta ha sido enviada correctamente.',
    respuesta_unica_usuario: Boolean(body.respuesta_unica_usuario),
    secciones: body.secciones.map((seccion) => ({
      titulo: normalizarTexto(seccion.titulo),
      descripcion: normalizarTexto(seccion.descripcion) || null,
      preguntas: seccion.preguntas.map((pregunta) => ({
        enunciado: normalizarTexto(pregunta.enunciado),
        imagen: pregunta.imagen || null,
        tipo: pregunta.tipo,
        es_obligatoria: pregunta.es_obligatoria,
        opciones: (pregunta.opciones || []).map((opcion) => ({
          texto: normalizarTexto(opcion.texto)
        }))
      }))
    }))
  };
}

function validarDatosEncuesta(body) {
  const {
    usuario_id,
    titulo,
    descripcion,
    imagen_portada,
    categoria,
    estado,
    secciones
  } = body;

  if (!usuario_id || !titulo || !descripcion || !categoria || !estado) {
    return 'Todos los campos principales son obligatorios.';
  }

  if (!['borrador', 'publicada'].includes(estado)) {
    return 'Estado invalido.';
  }

  if (!esImagenValida(imagen_portada)) {
    return 'La imagen de portada no tiene un formato valido.';
  }

  const errorSecciones = validarSecciones(secciones);

  if (errorSecciones) {
    return errorSecciones;
  }

  return validarPesoImagenes(imagen_portada, secciones);
}

export async function crearEncuesta(req, res) {
  const errorValidacion = validarDatosEncuesta(req.body);

  if (errorValidacion) {
    return res.status(400).json({ message: errorValidacion });
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const encuestaId = await crearEncuestaCompleta(construirPayloadEncuesta(req.body), conexion);

    await conexion.commit();
    return res.status(201).json({ message: 'Encuesta creada correctamente.', id: encuestaId });
  } catch (error) {
    await rollbackSeguro(conexion, 'crearEncuesta');
    console.error('Error al crear encuesta:', error);
    return res.status(500).json({ message: 'No se pudo crear la encuesta.' });
  } finally {
    conexion.release();
  }
}

export async function obtenerEncuestaPropia(req, res) {
  const encuestaId = Number(req.params.id);
  const usuarioId = Number(req.query.usuarioId);

  if (!encuestaId || !usuarioId) {
    return res.status(400).json({ message: 'Datos invalidos.' });
  }

  try {
    const filas = await obtenerDetalleEncuestaPorUsuario(encuestaId, usuarioId);

    if (filas.length === 0) {
      return res.status(404).json({ message: 'Encuesta no encontrada.' });
    }

    return res.json(mapearEncuestaDetallada(filas));
  } catch (error) {
    console.error('Error al obtener encuesta propia:', error);
    return res.status(500).json({ message: 'No se pudo obtener la encuesta.' });
  }
}

export async function actualizarEncuestaBorrador(req, res) {
  const encuestaId = Number(req.params.id);
  const usuarioId = Number(req.body.usuario_id);
  const errorValidacion = validarDatosEncuesta(req.body);

  if (!encuestaId || !usuarioId) {
    return res.status(400).json({ message: 'Datos invalidos.' });
  }

  if (errorValidacion) {
    return res.status(400).json({ message: errorValidacion });
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const encuesta = await obtenerEncuestaBase(encuestaId, conexion);

    if (!encuesta || encuesta.usuario_id !== usuarioId) {
      await rollbackSeguro(conexion, 'actualizarEncuestaBorrador');
      return res.status(404).json({ message: 'Encuesta no encontrada.' });
    }

    if (encuesta.estado !== 'borrador') {
      await rollbackSeguro(conexion, 'actualizarEncuestaBorrador');
      return res.status(409).json({ message: 'Solo los borradores se pueden editar.' });
    }

    await actualizarEncuesta(encuestaId, construirPayloadEncuesta(req.body), conexion);
    await conexion.commit();

    return res.json({ message: 'Borrador actualizado correctamente.' });
  } catch (error) {
    await rollbackSeguro(conexion, 'actualizarEncuestaBorrador');
    console.error('Error al actualizar borrador:', error);
    return res.status(500).json({ message: 'No se pudo actualizar la encuesta.' });
  } finally {
    conexion.release();
  }
}

export async function publicarEncuesta(req, res) {
  const encuestaId = Number(req.params.id);
  const usuarioId = Number(req.body.usuario_id);

  if (!encuestaId || !usuarioId) {
    return res.status(400).json({ message: 'Datos invalidos.' });
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const encuesta = await obtenerEncuestaBase(encuestaId, conexion);

    if (!encuesta || encuesta.usuario_id !== usuarioId) {
      await rollbackSeguro(conexion, 'publicarEncuesta');
      return res.status(404).json({ message: 'Encuesta no encontrada.' });
    }

    if (encuesta.estado !== 'borrador') {
      await rollbackSeguro(conexion, 'publicarEncuesta');
      return res.status(409).json({ message: 'La encuesta ya fue publicada.' });
    }

    await actualizarEstadoEncuesta(encuestaId, 'publicada', conexion);
    await conexion.commit();

    return res.json({ message: 'Encuesta publicada correctamente.' });
  } catch (error) {
    await rollbackSeguro(conexion, 'publicarEncuesta');
    console.error('Error al publicar encuesta:', error);
    return res.status(500).json({ message: 'No se pudo publicar la encuesta.' });
  } finally {
    conexion.release();
  }
}

export async function ocultarEncuesta(req, res) {
  const encuestaId = Number(req.params.id);
  const usuarioId = Number(req.body.usuario_id);
  const estaOculta = Boolean(req.body.esta_oculta);

  if (!encuestaId || !usuarioId) {
    return res.status(400).json({ message: 'Datos invalidos.' });
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const encuesta = await obtenerEncuestaBase(encuestaId, conexion);

    if (!encuesta || encuesta.usuario_id !== usuarioId) {
      await rollbackSeguro(conexion, 'ocultarEncuesta');
      return res.status(404).json({ message: 'Encuesta no encontrada.' });
    }

    if (encuesta.estado !== 'publicada') {
      await rollbackSeguro(conexion, 'ocultarEncuesta');
      return res.status(409).json({ message: 'Solo las encuestas publicadas se pueden ocultar.' });
    }

    await actualizarOcultamientoEncuesta(encuestaId, estaOculta, conexion);
    await conexion.commit();

    return res.json({
      message: estaOculta ? 'Encuesta oculta correctamente.' : 'Encuesta visible nuevamente.'
    });
  } catch (error) {
    await rollbackSeguro(conexion, 'ocultarEncuesta');
    console.error('Error al ocultar encuesta:', error);
    return res.status(500).json({ message: 'No se pudo cambiar la visibilidad.' });
  } finally {
    conexion.release();
  }
}

export async function eliminarEncuestaPropia(req, res) {
  const encuestaId = Number(req.params.id);
  const usuarioId = Number(req.query.usuarioId);

  if (!encuestaId || !usuarioId) {
    return res.status(400).json({ message: 'Datos invalidos.' });
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const encuesta = await obtenerEncuestaBase(encuestaId, conexion);

    if (!encuesta || encuesta.usuario_id !== usuarioId) {
      await rollbackSeguro(conexion, 'eliminarEncuestaPropia');
      return res.status(404).json({ message: 'Encuesta no encontrada.' });
    }

    await eliminarEncuesta(encuestaId, conexion);
    await conexion.commit();

    return res.json({ message: 'Encuesta eliminada correctamente.' });
  } catch (error) {
    await rollbackSeguro(conexion, 'eliminarEncuestaPropia');
    console.error('Error al eliminar encuesta:', error);
    return res.status(500).json({ message: 'No se pudo eliminar la encuesta.' });
  } finally {
    conexion.release();
  }
}

export async function listarRespuestasRecibidas(req, res) {
  const encuestaId = Number(req.params.id);
  const usuarioId = Number(req.query.usuarioId);

  if (!encuestaId || !usuarioId) {
    return res.status(400).json({ message: 'Datos invalidos.' });
  }

  try {
    const filas = await obtenerRespuestasRecibidas(encuestaId, usuarioId);

    if (filas.length === 0) {
      const encuesta = await obtenerDetalleEncuestaPorUsuario(encuestaId, usuarioId);

      if (encuesta.length === 0) {
        return res.status(404).json({ message: 'Encuesta no encontrada.' });
      }

      return res.json({
        id: encuestaId,
        titulo: encuesta[0].titulo,
        estado: encuesta[0].estado,
        respuestas: []
      });
    }

    return res.json(mapearRespuestasRecibidas(filas));
  } catch (error) {
    console.error('Error al obtener respuestas recibidas:', error);
    return res.status(500).json({ message: 'No se pudieron obtener las respuestas.' });
  }
}

export async function listarMisRespuestas(req, res) {
  const usuarioId = Number(req.query.usuarioId);

  if (!usuarioId) {
    return res.status(400).json({ message: 'Usuario invalido.' });
  }

  try {
    const filas = await obtenerEncuestasRespondidasPorUsuario(usuarioId);
    return res.json(mapearEncuestasRespondidas(filas));
  } catch (error) {
    console.error('Error al obtener mis respuestas:', error);
    return res.status(500).json({ message: 'No se pudo obtener el historial de respuestas.' });
  }
}

export async function obtenerMiRespuesta(req, res) {
  const respuestaId = Number(req.params.respuestaId);
  const usuarioId = Number(req.query.usuarioId);

  if (!respuestaId || !usuarioId) {
    return res.status(400).json({ message: 'Datos invalidos.' });
  }

  try {
    const filas = await obtenerDetalleRespuestaUsuario(respuestaId, usuarioId);

    if (filas.length === 0) {
      return res.status(404).json({ message: 'Respuesta no encontrada.' });
    }

    return res.json(mapearDetalleRespuestaUsuario(filas));
  } catch (error) {
    console.error('Error al obtener detalle de mi respuesta:', error);
    return res.status(500).json({ message: 'No se pudo obtener la respuesta.' });
  }
}

export async function responderEncuesta(req, res) {
  const encuestaId = Number(req.params.id);
  const { usuario_id, respuestas } = req.body;

  if (!encuestaId || !usuario_id || !Array.isArray(respuestas)) {
    return res.status(400).json({ message: 'Datos incompletos para registrar la respuesta.' });
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const encuesta = await obtenerEncuestaBase(encuestaId, conexion);

    if (!encuesta || encuesta.estado !== 'publicada' || encuesta.esta_oculta) {
      await rollbackSeguro(conexion, 'responderEncuesta');
      return res.status(404).json({ message: 'Encuesta no disponible.' });
    }

    if (encuesta.respuesta_unica_usuario) {
      const yaRespondio = await usuarioYaRespondioEncuesta(encuestaId, usuario_id, conexion);

      if (yaRespondio) {
        await rollbackSeguro(conexion, 'responderEncuesta');
        return res.status(409).json({
          message: 'Esta encuesta solo permite una respuesta por usuario.'
        });
      }
    }

    const preguntasEncuesta = await obtenerPreguntasEncuesta(encuestaId, conexion);
    const opcionesEncuesta = await obtenerOpcionesPreguntas(encuestaId, conexion);
    const preguntasPorId = new Map(preguntasEncuesta.map((pregunta) => [pregunta.id, pregunta]));
    const opcionesPorId = new Map(opcionesEncuesta.map((opcion) => [opcion.id, opcion]));
    const preguntasRespondidas = new Set();

    for (const respuesta of respuestas) {
      const preguntaId = Number(respuesta.pregunta_id);
      const pregunta = preguntasPorId.get(preguntaId);

      if (!pregunta) {
        await rollbackSeguro(conexion, 'responderEncuesta');
        return res.status(400).json({ message: 'Hay respuestas asociadas a preguntas invalidas.' });
      }

      if (pregunta.tipo === 'texto') {
        const texto = normalizarTexto(respuesta.texto_respuesta);

        if (!texto) {
          await rollbackSeguro(conexion, 'responderEncuesta');
          return res.status(400).json({ message: 'Las respuestas de texto no pueden ir vacias.' });
        }

        preguntasRespondidas.add(preguntaId);
        continue;
      }

      const opcionId = Number(respuesta.opcion_id);
      const opcion = opcionesPorId.get(opcionId);

      if (!opcion || opcion.pregunta_id !== preguntaId) {
        await rollbackSeguro(conexion, 'responderEncuesta');
        return res.status(400).json({ message: 'Hay opciones que no pertenecen a la pregunta.' });
      }

      preguntasRespondidas.add(preguntaId);
    }

    const faltantesObligatorias = preguntasEncuesta.filter(
      (pregunta) => pregunta.es_obligatoria && !preguntasRespondidas.has(pregunta.id)
    );

    if (faltantesObligatorias.length > 0) {
      await rollbackSeguro(conexion, 'responderEncuesta');
      return res.status(400).json({
        message: 'Debes responder todas las preguntas obligatorias antes de enviar.'
      });
    }

    const respuestaId = await crearRespuesta(encuestaId, usuario_id, conexion);

    await crearDetallesRespuesta(
      respuestaId,
      respuestas.map((respuesta) => ({
        pregunta_id: Number(respuesta.pregunta_id),
        opcion_id: respuesta.opcion_id ? Number(respuesta.opcion_id) : null,
        texto_respuesta: normalizarTexto(respuesta.texto_respuesta) || null
      })),
      conexion
    );

    await conexion.commit();
    return res.status(201).json({
      message: 'Respuesta enviada correctamente.',
      mensaje_confirmacion: encuesta.mensaje_confirmacion
    });
  } catch (error) {
    await rollbackSeguro(conexion, 'responderEncuesta');
    console.error('Error al registrar respuestas:', error);
    return res.status(500).json({ message: 'No se pudo registrar la respuesta.' });
  } finally {
    conexion.release();
  }
}
