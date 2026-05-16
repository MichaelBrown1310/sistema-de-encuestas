import { verificarToken } from '../utils/authUtils.js';

function extraerToken(headerAutorizacion) {
  if (!headerAutorizacion || !headerAutorizacion.startsWith('Bearer ')) {
    return null;
  }

  return headerAutorizacion.slice('Bearer '.length).trim();
}

export function autenticarToken(req, res, next) {
  const token = extraerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      message: 'Debes iniciar sesion para continuar.'
    });
  }

  try {
    const payload = verificarToken(token);

    req.user = {
      id: Number(payload.sub),
      correo: payload.correo,
      rol: payload.rol
    };

    return next();
  } catch {
    return res.status(401).json({
      message: 'Tu sesion ya no es valida. Inicia sesion nuevamente.'
    });
  }
}

export function autorizarRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Debes iniciar sesion para continuar.'
      });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta accion.'
      });
    }

    return next();
  };
}
