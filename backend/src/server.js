import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pool from './db.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: '15mb' }));

function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function esImagenValida(valor) {
  if (valor == null || valor === '') {
    return true;
  }

  return typeof valor === 'string' && valor.startsWith('data:image/');
}

function mapearEncuestaDetallada(filas) {
  if (filas.length === 0) {
    return null;
  }

  const encuestaBase = filas[0];
  const encuesta = {
    id: encuestaBase.encuesta_id,
    usuario_id: encuestaBase.usuario_id,
    titulo: encuestaBase.titulo,
    descripcion: encuestaBase.descripcion,
    imagen_portada: encuestaBase.imagen_portada,
    categoria: encuestaBase.categoria,
    estado: encuestaBase.estado,
    mensaje_confirmacion: encuestaBase.mensaje_confirmacion,
    fecha_creacion: encuestaBase.fecha_creacion,
    nombre_creador: encuestaBase.nombre_creador,
    secciones: []
  };

  const secciones = new Map();

  for (const fila of filas) {
    if (!fila.seccion_id) {
      continue;
    }

    if (!secciones.has(fila.seccion_id)) {
      const seccion = {
        id: fila.seccion_id,
        titulo: fila.seccion_titulo,
        descripcion: fila.seccion_descripcion,
        orden: fila.seccion_orden,
        preguntas: []
      };

      secciones.set(fila.seccion_id, seccion);
      encuesta.secciones.push(seccion);
    }

    if (!fila.pregunta_id) {
      continue;
    }

    const seccion = secciones.get(fila.seccion_id);
    let pregunta = seccion.preguntas.find((item) => item.id === fila.pregunta_id);

    if (!pregunta) {
      pregunta = {
        id: fila.pregunta_id,
        enunciado: fila.enunciado,
        imagen: fila.pregunta_imagen,
        tipo: fila.tipo,
        es_obligatoria: Boolean(fila.es_obligatoria),
        orden: fila.pregunta_orden,
        opciones: []
      };

      seccion.preguntas.push(pregunta);
    }

    if (fila.opcion_id) {
      pregunta.opciones.push({
        id: fila.opcion_id,
        texto: fila.opcion_texto,
        orden: fila.opcion_orden
      });
    }
  }

  encuesta.secciones = encuesta.secciones
    .sort((a, b) => a.orden - b.orden)
    .map((seccion) => ({
      ...seccion,
      preguntas: seccion.preguntas
        .sort((a, b) => a.orden - b.orden)
        .map((pregunta) => ({
          ...pregunta,
          opciones: pregunta.opciones.sort((a, b) => a.orden - b.orden)
        }))
    }));

  return encuesta;
}

function validarSecciones(secciones) {
  if (!Array.isArray(secciones) || secciones.length === 0) {
    return 'Debes agregar al menos una seccion.';
  }

  for (const seccion of secciones) {
    if (!normalizarTexto(seccion.titulo)) {
      return 'Cada seccion debe tener un titulo.';
    }

    if (!Array.isArray(seccion.preguntas) || seccion.preguntas.length === 0) {
      return 'Cada seccion debe incluir al menos una pregunta.';
    }

    for (const pregunta of seccion.preguntas) {
      if (!normalizarTexto(pregunta.enunciado) || !pregunta.tipo) {
        return 'Todas las preguntas deben tener enunciado y tipo.';
      }

      if (!esImagenValida(pregunta.imagen)) {
        return 'La imagen de una pregunta no tiene un formato valido.';
      }

      if (
        ['opcion_unica', 'opcion_multiple'].includes(pregunta.tipo) &&
        (!Array.isArray(pregunta.opciones) || pregunta.opciones.length < 2)
      ) {
        return 'Las preguntas de opcion requieren al menos dos opciones.';
      }

      if (
        ['opcion_unica', 'opcion_multiple'].includes(pregunta.tipo) &&
        pregunta.opciones.some((opcion) => !normalizarTexto(opcion.texto))
      ) {
        return 'Todas las opciones deben tener texto.';
      }
    }
  }

  return '';
}

async function obtenerPreguntasEncuesta(conexion, encuestaId) {
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

async function obtenerOpcionesPreguntas(conexion, encuestaId) {
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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'API funcionando correctamente.' });
});

app.post('/api/auth/register', async (req, res) => {
  const { nombre, correo, password } = req.body;

  if (!nombre || !correo || !password) {
    return res.status(400).json({
      message: 'Nombre, correo y contrasena son obligatorios.'
    });
  }

  try {
    const [usuariosExistentes] = await pool.query(
      'SELECT id FROM usuarios WHERE correo = ? LIMIT 1',
      [correo]
    );

    if (usuariosExistentes.length > 0) {
      return res.status(409).json({
        message: 'Ya existe un usuario registrado con ese correo.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO usuarios (nombre, correo, password_hash) VALUES (?, ?, ?)',
      [nombre, correo, passwordHash]
    );

    return res.status(201).json({
      message: 'Usuario registrado correctamente.'
    });
  } catch (error) {
    console.error('Error en register:', error);
    return res.status(500).json({
      message: 'Error interno del servidor al registrar.'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({
      message: 'Correo y contrasena son obligatorios.'
    });
  }

  try {
    const [usuarios] = await pool.query(
      'SELECT id, nombre, correo, password_hash FROM usuarios WHERE correo = ? LIMIT 1',
      [correo]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        message: 'Credenciales invalidas.'
      });
    }

    const usuario = usuarios[0];
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValido) {
      return res.status(401).json({
        message: 'Credenciales invalidas.'
      });
    }

    return res.json({
      message: `Bienvenido, ${usuario.nombre}.`,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      message: 'Error interno del servidor al iniciar sesion.'
    });
  }
});

app.get('/api/encuestas/resumen/:usuarioId', async (req, res) => {
  const usuarioId = Number(req.params.usuarioId);

  if (!usuarioId) {
    return res.status(400).json({ message: 'Usuario invalido.' });
  }

  try {
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

    const resumen = filas[0];

    return res.json({
      totalEncuestas: Number(resumen.totalEncuestas || 0),
      totalPublicadas: Number(resumen.totalPublicadas || 0),
      totalBorradores: Number(resumen.totalBorradores || 0)
    });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    return res.status(500).json({ message: 'No se pudo obtener el resumen.' });
  }
});

app.get('/api/encuestas', async (req, res) => {
  const usuarioId = Number(req.query.usuarioId);

  if (!usuarioId) {
    return res.status(400).json({ message: 'Usuario invalido.' });
  }

  try {
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

    return res.json(encuestas);
  } catch (error) {
    console.error('Error al obtener encuestas:', error);
    return res.status(500).json({ message: 'No se pudieron obtener las encuestas.' });
  }
});

app.get('/api/encuestas/publicadas', async (_req, res) => {
  try {
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

    return res.json(encuestas);
  } catch (error) {
    console.error('Error al obtener encuestas publicadas:', error);
    return res.status(500).json({ message: 'No se pudieron obtener las encuestas publicadas.' });
  }
});

app.get('/api/encuestas/publicadas/:id', async (req, res) => {
  const encuestaId = Number(req.params.id);

  if (!encuestaId) {
    return res.status(400).json({ message: 'Encuesta invalida.' });
  }

  try {
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

    if (filas.length === 0) {
      return res.status(404).json({ message: 'Encuesta no encontrada.' });
    }

    const encuesta = mapearEncuestaDetallada(filas);
    return res.json(encuesta);
  } catch (error) {
    console.error('Error al obtener detalle de encuesta:', error);
    return res.status(500).json({ message: 'No se pudo obtener la encuesta.' });
  }
});

app.post('/api/encuestas', async (req, res) => {
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
        usuario_id,
        normalizarTexto(titulo),
        normalizarTexto(descripcion),
        imagen_portada || null,
        normalizarTexto(categoria),
        estado,
        normalizarTexto(mensaje_confirmacion) || 'Tu respuesta ha sido enviada correctamente.'
      ]
    );

    const encuestaId = resultadoEncuesta.insertId;

    for (let indiceSeccion = 0; indiceSeccion < secciones.length; indiceSeccion += 1) {
      const seccion = secciones[indiceSeccion];
      const [resultadoSeccion] = await conexion.query(
        `
        INSERT INTO secciones (encuesta_id, titulo, descripcion, orden)
        VALUES (?, ?, ?, ?)
        `,
        [
          encuestaId,
          normalizarTexto(seccion.titulo),
          normalizarTexto(seccion.descripcion) || null,
          indiceSeccion + 1
        ]
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
            normalizarTexto(pregunta.enunciado),
            pregunta.imagen || null,
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
              [preguntaId, normalizarTexto(opcion.texto), indiceOpcion + 1]
            );
          }
        }
      }
    }

    await conexion.commit();
    return res.status(201).json({ message: 'Encuesta creada correctamente.', id: encuestaId });
  } catch (error) {
    await conexion.rollback();
    console.error('Error al crear encuesta:', error);
    return res.status(500).json({ message: 'No se pudo crear la encuesta.' });
  } finally {
    conexion.release();
  }
});

app.post('/api/encuestas/:id/respuestas', async (req, res) => {
  const encuestaId = Number(req.params.id);
  const { usuario_id, respuestas } = req.body;

  if (!encuestaId || !usuario_id || !Array.isArray(respuestas)) {
    return res.status(400).json({ message: 'Datos incompletos para registrar la respuesta.' });
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [encuestas] = await conexion.query(
      'SELECT id, estado, mensaje_confirmacion FROM encuestas WHERE id = ? LIMIT 1',
      [encuestaId]
    );

    if (encuestas.length === 0 || encuestas[0].estado !== 'publicada') {
      await conexion.rollback();
      return res.status(404).json({ message: 'Encuesta no disponible.' });
    }

    const preguntasEncuesta = await obtenerPreguntasEncuesta(conexion, encuestaId);
    const opcionesEncuesta = await obtenerOpcionesPreguntas(conexion, encuestaId);

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

    const [resultadoRespuesta] = await conexion.query(
      `
      INSERT INTO respuestas (encuesta_id, usuario_id)
      VALUES (?, ?)
      `,
      [encuestaId, usuario_id]
    );

    const respuestaId = resultadoRespuesta.insertId;

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
        [
          respuestaId,
          Number(respuesta.pregunta_id),
          respuesta.opcion_id ? Number(respuesta.opcion_id) : null,
          normalizarTexto(respuesta.texto_respuesta) || null
        ]
      );
    }

    await conexion.commit();
    return res.status(201).json({
      message: 'Respuesta enviada correctamente.',
      mensaje_confirmacion: encuestas[0].mensaje_confirmacion
    });
  } catch (error) {
    await conexion.rollback();
    console.error('Error al registrar respuestas:', error);
    return res.status(500).json({ message: 'No se pudo registrar la respuesta.' });
  } finally {
    conexion.release();
  }
});

app.listen(port, () => {
  console.log(`Servidor ejecutandose en http://localhost:${port}`);
});
