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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'API funcionando correctamente.' });
});

app.post('/api/auth/register', async (req, res) => {
  const { nombre, correo, password } = req.body;

  if (!nombre || !correo || !password) {
    return res.status(400).json({
      message: 'Nombre, correo y contraseña son obligatorios.'
    });
  }

  try {
    const [existingUsers] = await pool.query(
      'SELECT id FROM usuarios WHERE correo = ? LIMIT 1',
      [correo]
    );

    if (existingUsers.length > 0) {
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
      message: 'Correo y contraseña son obligatorios.'
    });
  }

  try {
    const [users] = await pool.query(
      'SELECT id, nombre, correo, password_hash FROM usuarios WHERE correo = ? LIMIT 1',
      [correo]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: 'Credenciales inválidas.'
      });
    }

    const user = users[0];
    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      return res.status(401).json({
        message: 'Credenciales inválidas.'
      });
    }

    return res.json({
      message: `Bienvenido, ${user.nombre}.`,
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      message: 'Error interno del servidor al iniciar sesión.'
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
