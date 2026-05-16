import jwt from 'jsonwebtoken';

const DEFAULT_EXPIRES_IN = '8h';

function obtenerJwtSecret() {
  return process.env.JWT_SECRET || 'dev-secret-change-me';
}

export function generarToken(usuario) {
  return jwt.sign(
    {
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol
    },
    obtenerJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN
    }
  );
}

export function verificarToken(token) {
  return jwt.verify(token, obtenerJwtSecret());
}
