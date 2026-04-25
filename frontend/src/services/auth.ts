import api from './api';

export interface DatosRegistro {
  nombre: string;
  correo: string;
  password: string;
}

export interface DatosInicioSesion {
  correo: string;
  password: string;
}

export interface UsuarioAutenticado {
  id: number;
  nombre: string;
  correo: string;
}

const CLAVE_USUARIO_AUTENTICADO = 'encuestas_usuario_autenticado';

export async function registrarUsuario(datos: DatosRegistro) {
  const { data } = await api.post('/auth/register', datos);
  return data;
}

export async function iniciarSesion(datos: DatosInicioSesion) {
  const { data } = await api.post('/auth/login', datos);
  return data;
}

export function guardarUsuarioAutenticado(usuario: UsuarioAutenticado) {
  localStorage.setItem(CLAVE_USUARIO_AUTENTICADO, JSON.stringify(usuario));
}

export function obtenerUsuarioAutenticado(): UsuarioAutenticado | null {
  const usuarioGuardado = localStorage.getItem(CLAVE_USUARIO_AUTENTICADO);

  if (!usuarioGuardado) {
    return null;
  }

  try {
    return JSON.parse(usuarioGuardado) as UsuarioAutenticado;
  } catch {
    localStorage.removeItem(CLAVE_USUARIO_AUTENTICADO);
    return null;
  }
}

export function limpiarUsuarioAutenticado() {
  localStorage.removeItem(CLAVE_USUARIO_AUTENTICADO);
}
