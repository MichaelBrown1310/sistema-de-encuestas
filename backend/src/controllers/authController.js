import bcrypt from 'bcryptjs';
import { buscarUsuarioPorCorreo, contarUsuarios, crearUsuario } from '../models/userModel.js';
import { generarToken } from '../utils/authUtils.js';

const ROLES_PERMITIDOS = ['usuario', 'admin'];

export async function registrarUsuario(req, res) {
  const { nombre, correo, password, rol, edad} = req.body;

  if (!nombre || !correo || !password|| !edad) {
    return res.status(400).json({
      message: 'Nombre, correo, contrasena y edad son obligatorios.'
    });
  }

if (Number(edad) < 18) {
  return res.status(400).json({
    message: 'Solo se permiten usuarios mayores de 18 anos.'
  });
}
  try {
    const usuarioExistente = await buscarUsuarioPorCorreo(correo);

    if (usuarioExistente) {
      return res.status(409).json({
        message: 'Ya existe un usuario registrado con ese correo.'
      });
    }

    const totalUsuarios = await contarUsuarios();
    const rolSolicitado = typeof rol === 'string' ? rol.trim().toLowerCase() : '';
    const rolAsignado =
      totalUsuarios === 0
        ? 'admin'
        : ROLES_PERMITIDOS.includes(rolSolicitado)
          ? rolSolicitado
          : 'usuario';

    const passwordHash = await bcrypt.hash(password, 10);
    await crearUsuario({ nombre, correo, rol: rolAsignado, passwordHash });

    return res.status(201).json({
      message:
        rolAsignado === 'admin'
          ? 'Usuario registrado correctamente con rol admin.'
          : 'Usuario registrado correctamente.'
    });
  } catch (error) {
    console.error('Error en register:', error);
    return res.status(500).json({
      message: 'Error interno del servidor al registrar.'
    });
  }
}

export async function obtenerSesionActual(req, res) {
  return res.json({
    user: req.user
  });
}

export async function iniciarSesion(req, res) {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({
      message: 'Correo y contrasena son obligatorios.'
    });
  }

  try {
    const usuario = await buscarUsuarioPorCorreo(correo);

    if (!usuario) {
      return res.status(401).json({
        message: 'Credenciales invalidas.'
      });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValido) {
      return res.status(401).json({
        message: 'Credenciales invalidas.'
      });
    }

    const token = generarToken(usuario);

    return res.json({
      message: `Bienvenido, ${usuario.nombre}.`,
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      message: 'Error interno del servidor al iniciar sesion.'
    });
  }
}
