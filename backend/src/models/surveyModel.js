import pool from '../db.js';

export async function obtenerResumenEncuestasPorUsuario(usuarioId) {
  const [filas] = await pool.query(
    `
    SELECT
      COUNT(*) AS totalEncuestas,
      SUM(CASE WHEN estado = 'publicada' THEN 1 ELSE 0 END) AS totalPublicadas,
      SUM(CASE WHEN estado = 'borrador' THEN 1 ELSE 0 END) AS totalBorradores
    FROM encuestas
    WHERE usuario_id = ?
    `,
    [usuarioId]
  );

  return filas[0];
}

export async function obtenerEncuestasPorUsuario(usuarioId) {
  const [encuestas] = await pool.query(
    `
    SELECT
      id,
      usuario_id,
      titulo,
      descripcion,
      imagen_portada,
      categoria,
      estado,
      mensaje_confirmacion,
      fecha_creacion
    FROM encuestas
    WHERE usuario_id = ?
    ORDER BY fecha_creacion DESC
    `,
    [usuarioId]
  );

  return encuestas;
}

export async function obtenerEncuestasPublicadas() {
  const [encuestas] = await pool.query(
    `
    SELECT
      e.id,
      e.usuario_id,
      e.titulo,
      e.descripcion,
      e.imagen_portada,
      e.categoria,
      e.estado,
      e.mensaje_confirmacion,
      e.fecha_creacion,
      u.nombre AS nombre_creador
    FROM encuestas e
    INNER JOIN usuarios u ON u.id = e.usuario_id
    WHERE e.estado = 'publicada'
    ORDER BY e.fecha_creacion DESC
    `
  );

  return encuestas;
}

export async function obtenerDetalleEncuestaPublicada(encuestaId) {
  const [filas] = await pool.query(
    `
    SELECT
      e.id AS encuesta_id,
      e.usuario_id,
      e.titulo,
      e.descripcion,
      e.imagen_portada,
      e.categoria,
      e.estado,
      e.mensaje_confirmacion,
      e.fecha_creacion,
      u.nombre AS nombre_creador,
      s.id AS seccion_id,
      s.titulo AS seccion_titulo,
      s.descripcion AS seccion_descripcion,
      s.orden AS seccion_orden,
      p.id AS pregunta_id,
      p.enunciado,
      p.imagen AS pregunta_imagen,
      p.tipo,
      p.es_obligatoria,
      p.orden AS pregunta_orden,
      op.id AS opcion_id,
      op.texto AS opcion_texto,
      op.orden AS opcion_orden
    FROM encuestas e
    INNER JOIN usuarios u ON u.id = e.usuario_id
    LEFT JOIN secciones s ON s.encuesta_id = e.id
    LEFT JOIN preguntas p ON p.seccion_id = s.id
    LEFT JOIN opciones_pregunta op ON op.pregunta_id = p.id
    WHERE e.id = ? AND e.estado = 'publicada'
    ORDER BY s.orden ASC, p.orden ASC, op.orden ASC
    `,
    [encuestaId]
  );

  return filas;
}

export async function obtenerEncuestaBase(encuestaId, conexion) {
  const [encuestas] = await conexion.query(
    'SELECT id, estado, mensaje_confirmacion FROM encuestas WHERE id = ? LIMIT 1',
    [encuestaId]
  );

  return encuestas[0] || null;
}

export async function obtenerPreguntasEncuesta(encuestaId, conexion) {
  const [preguntas] = await conexion.query(
    `
    SELECT id, tipo, es_obligatoria
    FROM preguntas
    WHERE encuesta_id = ?
    `,
    [encuestaId]
  );

  return preguntas;
}

export async function obtenerOpcionesPreguntas(encuestaId, conexion) {
  const [opciones] = await conexion.query(
    `
    SELECT op.id, op.pregunta_id
    FROM opciones_pregunta op
    INNER JOIN preguntas p ON p.id = op.pregunta_id
    WHERE p.encuesta_id = ?
    `,
    [encuestaId]
  );

  return opciones;
}

export async function crearEncuestaCompleta(datos, conexion) {
  const [resultadoEncuesta] = await conexion.query(
    `
    INSERT INTO encuestas (
      usuario_id,
      titulo,
      descripcion,
      imagen_portada,
      categoria,
      estado,
      mensaje_confirmacion
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      datos.usuario_id,
      datos.titulo,
      datos.descripcion,
      datos.imagen_portada,
      datos.categoria,
      datos.estado,
      datos.mensaje_confirmacion
    ]
  );

  const encuestaId = resultadoEncuesta.insertId;

  for (let indiceSeccion = 0; indiceSeccion < datos.secciones.length; indiceSeccion += 1) {
    const seccion = datos.secciones[indiceSeccion];
    const [resultadoSeccion] = await conexion.query(
      `
      INSERT INTO secciones (encuesta_id, titulo, descripcion, orden)
      VALUES (?, ?, ?, ?)
      `,
      [encuestaId, seccion.titulo, seccion.descripcion, indiceSeccion + 1]
    );

    const seccionId = resultadoSeccion.insertId;

    for (let indicePregunta = 0; indicePregunta < seccion.preguntas.length; indicePregunta += 1) {
      const pregunta = seccion.preguntas[indicePregunta];
      const [resultadoPregunta] = await conexion.query(
        `
        INSERT INTO preguntas (
          encuesta_id,
          seccion_id,
          enunciado,
          imagen,
          tipo,
          es_obligatoria,
          orden
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          encuestaId,
          seccionId,
          pregunta.enunciado,
          pregunta.imagen,
          pregunta.tipo,
          pregunta.es_obligatoria ? 1 : 0,
          indicePregunta + 1
        ]
      );

      const preguntaId = resultadoPregunta.insertId;

      if (Array.isArray(pregunta.opciones) && pregunta.tipo !== 'texto') {
        for (let indiceOpcion = 0; indiceOpcion < pregunta.opciones.length; indiceOpcion += 1) {
          const opcion = pregunta.opciones[indiceOpcion];

          await conexion.query(
            `
            INSERT INTO opciones_pregunta (pregunta_id, texto, orden)
            VALUES (?, ?, ?)
            `,
            [preguntaId, opcion.texto, indiceOpcion + 1]
          );
        }
      }
    }
  }

  return encuestaId;
}

export async function crearRespuesta(encuestaId, usuarioId, conexion) {
  const [resultado] = await conexion.query(
    `
    INSERT INTO respuestas (encuesta_id, usuario_id)
    VALUES (?, ?)
    `,
    [encuestaId, usuarioId]
  );

  return resultado.insertId;
}

export async function crearDetallesRespuesta(respuestaId, respuestas, conexion) {
  for (const respuesta of respuestas) {
    await conexion.query(
      `
      INSERT INTO detalle_respuestas (
        respuesta_id,
        pregunta_id,
        opcion_id,
        texto_respuesta
      )
      VALUES (?, ?, ?, ?)
      `,
      [respuestaId, respuesta.pregunta_id, respuesta.opcion_id, respuesta.texto_respuesta]
    );
  }
}
