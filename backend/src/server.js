import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pool from './db.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

function mapearEncuestaConPreguntas(filas) {
  const encuestas = new Map();

  for (const fila of filas) {
    if (!encuestas.has(fila.encuesta_id)) {
      encuestas.set(fila.encuesta_id, {
        id: fila.encuesta_id,
        usuario_id: fila.usuario_id,
        titulo: fila.titulo,
        descripcion: fila.descripcion,
        categoria: fila.categoria,
        estado: fila.estado,
        fecha_creacion: fila.fecha_creacion,
        nombre_creador: fila.nombre_creador,
        preguntas: []
      });
    }

    const encuesta = encuestas.get(fila.encuesta_id);

    if (!fila.pregunta_id) {
      continue;
    }

    let pregunta = encuesta.preguntas.find((item) => item.id === fila.pregunta_id);

    if (!pregunta) {
      pregunta = {
        id: fila.pregunta_id,
        enunciado: fila.enunciado,
        tipo: fila.tipo,
        orden: fila.pregunta_orden,
        opciones: []
      };

      encuesta.preguntas.push(pregunta);
    }

    if (fila.opcion_id) {
      pregunta.opciones.push({
        id: fila.opcion_id,
        texto: fila.opcion_texto,
        orden: fila.opcion_orden
      });
    }
  }

  return Array.from(encuestas.values()).map((encuesta) => ({
    ...encuesta,
    preguntas: encuesta.preguntas
      .sort((a, b) => a.orden - b.orden)
      .map((pregunta) => ({
        ...pregunta,
        opciones: pregunta.opciones.sort((a, b) => a.orden - b.orden)
      }))
  }));
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
      SELECT id, usuario_id, titulo, descripcion, categoria, estado, fecha_creacion
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
        e.categoria,
        e.estado,
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
        e.categoria,
        e.estado,
        e.fecha_creacion,
        u.nombre AS nombre_creador,
        p.id AS pregunta_id,
        p.enunciado,
        p.tipo,
        p.orden AS pregunta_orden,
        op.id AS opcion_id,
        op.texto AS opcion_texto,
        op.orden AS opcion_orden
      FROM encuestas e
      INNER JOIN usuarios u ON u.id = e.usuario_id
      LEFT JOIN preguntas p ON p.encuesta_id = e.id
      LEFT JOIN opciones_pregunta op ON op.pregunta_id = p.id
      WHERE e.id = ? AND e.estado = 'publicada'
      ORDER BY p.orden ASC, op.orden ASC
      `,
      [encuestaId]
    );

    if (filas.length === 0) {
      return res.status(404).json({ message: 'Encuesta no encontrada.' });
    }

    const encuesta = mapearEncuestaConPreguntas(filas)[0];
    return res.json(encuesta);
  } catch (error) {
    console.error('Error al obtener detalle de encuesta:', error);
    return res.status(500).json({ message: 'No se pudo obtener la encuesta.' });
  }
});

app.post('/api/encuestas', async (req, res) => {
  const { usuario_id, titulo, descripcion, categoria, estado, preguntas } = req.body;

  if (!usuario_id || !titulo || !descripcion || !categoria || !estado) {
    return res.status(400).json({ message: 'Todos los campos principales son obligatorios.' });
  }

  if (!Array.isArray(preguntas) || preguntas.length === 0) {
    return res.status(400).json({ message: 'Debes agregar al menos una pregunta.' });
  }

  if (!['borrador', 'publicada'].includes(estado)) {
    return res.status(400).json({ message: 'Estado invalido.' });
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [resultadoEncuesta] = await conexion.query(
      `
      INSERT INTO encuestas (usuario_id, titulo, descripcion, categoria, estado)
      VALUES (?, ?, ?, ?, ?)
      `,
      [usuario_id, titulo, descripcion, categoria, estado]
    );

    const encuestaId = resultadoEncuesta.insertId;

    for (let indice = 0; indice < preguntas.length; indice += 1) {
      const pregunta = preguntas[indice];

      if (!pregunta.enunciado || !pregunta.tipo) {
        throw new Error('Pregunta invalida.');
      }

      if (
        ['opcion_unica', 'opcion_multiple'].includes(pregunta.tipo) &&
        (!Array.isArray(pregunta.opciones) || pregunta.opciones.length < 2)
      ) {
        throw new Error('Las preguntas de opcion requieren al menos dos opciones.');
      }

      const [resultadoPregunta] = await conexion.query(
        `
        INSERT INTO preguntas (encuesta_id, enunciado, tipo, orden)
        VALUES (?, ?, ?, ?)
        `,
        [encuestaId, pregunta.enunciado, pregunta.tipo, indice + 1]
      );

      const preguntaId = resultadoPregunta.insertId;

      if (Array.isArray(pregunta.opciones)) {
        for (let indiceOpcion = 0; indiceOpcion < pregunta.opciones.length; indiceOpcion += 1) {
          const opcion = pregunta.opciones[indiceOpcion];

          if (!opcion.texto) {
            throw new Error('Opcion invalida.');
          }

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

    await conexion.commit();
    return res.status(201).json({ message: 'Encuesta creada correctamente.', id: encuestaId });
  } catch (error) {
    await conexion.rollback();
    console.error('Error al crear encuesta:', error);
    return res.status(500).json({
      message:
        error.message === 'Pregunta invalida.' ||
        error.message === 'Opcion invalida.' ||
        error.message === 'Las preguntas de opcion requieren al menos dos opciones.'
          ? error.message
          : 'No se pudo crear la encuesta.'
    });
  } finally {
    conexion.release();
  }
});

app.post('/api/encuestas/:id/respuestas', async (req, res) => {
  const encuestaId = Number(req.params.id);
  const { usuario_id, respuestas } = req.body;

  if (!encuestaId || !usuario_id || !Array.isArray(respuestas) || respuestas.length === 0) {
    return res.status(400).json({ message: 'Datos incompletos para registrar la respuesta.' });
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [encuestas] = await conexion.query(
      'SELECT id, estado FROM encuestas WHERE id = ? LIMIT 1',
      [encuestaId]
    );

    if (encuestas.length === 0 || encuestas[0].estado !== 'publicada') {
      throw new Error('Encuesta no disponible.');
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
      if (!respuesta.pregunta_id) {
        throw new Error('Respuesta invalida.');
      }

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
          respuesta.pregunta_id,
          respuesta.opcion_id || null,
          respuesta.texto_respuesta || null
        ]
      );
    }

    await conexion.commit();
    return res.status(201).json({ message: 'Respuesta enviada correctamente.' });
  } catch (error) {
    await conexion.rollback();
    console.error('Error al registrar respuestas:', error);
    return res.status(500).json({
      message:
        error.message === 'Encuesta no disponible.' || error.message === 'Respuesta invalida.'
          ? error.message
          : 'No se pudo registrar la respuesta.'
    });
  } finally {
    conexion.release();
  }
});

app.listen(port, () => {
  console.log(`Servidor ejecutandose en http://localhost:${port}`);
});
