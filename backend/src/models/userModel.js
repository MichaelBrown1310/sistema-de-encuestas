import pool from '../db.js';

export async function buscarUsuarioPorCorreo(correo, conexion = pool) {
  const [usuarios] = await conexion.query(
    'SELECT id, nombre, correo, password_hash FROM usuarios WHERE correo = ? LIMIT 1',
    [correo]
  );

  return usuarios[0] || null;
}

export async function crearUsuario({ nombre, correo, passwordHash }, conexion = pool) {
  const [resultado] = await conexion.query(
    'INSERT INTO usuarios (nombre, correo, password_hash) VALUES (?, ?, ?)',
    [nombre, correo, passwordHash]
  );

  return resultado.insertId;
}
