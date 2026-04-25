import pool from '../db.js';
import {
  crearDetallesRespuesta,
  crearEncuestaCompleta,
  crearRespuesta,
  obtenerDetalleEncuestaPublicada,
  obtenerEncuestaBase,
  obtenerEncuestasPorUsuario,
  obtenerEncuestasPublicadas,
  obtenerOpcionesPreguntas,
  obtenerPreguntasEncuesta,
  obtenerResumenEncuestasPorUsuario
} from '../models/surveyModel.js';
import {
  esImagenValida,
  mapearEncuestaDetallada,
  normalizarTexto,
  validarSecciones
} from '../utils/surveyUtils.js';

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

export async function crearEncuesta(req, res) {
  const {
    usuario_id,
    titulo,
    descripcion,
    imagen_portada,
    categoria,
    estado,
    mensaje_confirmacion,
    secciones
  } = req.body;

  if (!usuario_id || !titulo || !descripcion || !categoria || !estado) {
    return res.status(400).json({ message: 'Todos los campos principales son obligatorios.' });
  }

  if (!['borrador', 'publicada'].includes(estado)) {
    return res.status(400).json({ message: 'Estado invalido.' });
  }

  if (!esImagenValida(imagen_portada)) {
    return res.status(400).json({ message: 'La imagen de portada no tiene un formato valido.' });
  }

  const errorValidacion = validarSecciones(secciones);

  if (errorValidacion) {
    return res.status(400).json({ message: errorValidacion });
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const encuestaId = await crearEncuestaCompleta(
      {
        usuario_id,
        titulo: normalizarTexto(titulo),
        descripcion: normalizarTexto(descripcion),
        imagen_portada: imagen_portada || null,
        categoria: normalizarTexto(categoria),
        estado,
        mensaje_confirmacion:
          normalizarTexto(mensaje_confirmacion) || 'Tu respuesta ha sido enviada correctamente.',
        secciones: secciones.map((seccion) => ({
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
      },
      conexion
    );

    await conexion.commit();
    return res.status(201).json({ message: 'Encuesta creada correctamente.', id: encuestaId });
  } catch (error) {
    await conexion.rollback();
    console.error('Error al crear encuesta:', error);
    return res.status(500).json({ message: 'No se pudo crear la encuesta.' });
  } finally {
    conexion.release();
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

    if (!encuesta || encuesta.estado !== 'publicada') {
      await conexion.rollback();
      return res.status(404).json({ message: 'Encuesta no disponible.' });
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
        await conexion.rollback();
        return res.status(400).json({ message: 'Hay respuestas asociadas a preguntas invalidas.' });
      }

      if (pregunta.tipo === 'texto') {
        const texto = normalizarTexto(respuesta.texto_respuesta);

        if (!texto) {
          await conexion.rollback();
          return res.status(400).json({ message: 'Las respuestas de texto no pueden ir vacias.' });
        }

        preguntasRespondidas.add(preguntaId);
        continue;
      }

      const opcionId = Number(respuesta.opcion_id);
      const opcion = opcionesPorId.get(opcionId);

      if (!opcion || opcion.pregunta_id !== preguntaId) {
        await conexion.rollback();
        return res.status(400).json({ message: 'Hay opciones que no pertenecen a la pregunta.' });
      }

      preguntasRespondidas.add(preguntaId);
    }

    const faltantesObligatorias = preguntasEncuesta.filter(
      (pregunta) => pregunta.es_obligatoria && !preguntasRespondidas.has(pregunta.id)
    );

    if (faltantesObligatorias.length > 0) {
      await conexion.rollback();
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
    await conexion.rollback();
    console.error('Error al registrar respuestas:', error);
    return res.status(500).json({ message: 'No se pudo registrar la respuesta.' });
  } finally {
    conexion.release();
  }
}
