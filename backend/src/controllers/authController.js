import bcrypt from 'bcryptjs';
import { buscarUsuarioPorCorreo, crearUsuario } from '../models/userModel.js';

export async function registrarUsuario(req, res) {
  const { nombre, correo, password } = req.body;

  if (!nombre || !correo || !password) {
    return res.status(400).json({
      message: 'Nombre, correo y contrasena son obligatorios.'
    });
  }

  try {
    const usuarioExistente = await buscarUsuarioPorCorreo(correo);

    if (usuarioExistente) {
      return res.status(409).json({
        message: 'Ya existe un usuario registrado con ese correo.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await crearUsuario({ nombre, correo, passwordHash });

    return res.status(201).json({
      message: 'Usuario registrado correctamente.'
    });
  } catch (error) {
    console.error('Error en register:', error);
    return res.status(500).json({
      message: 'Error interno del servidor al registrar.'
    });
  }
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
}
