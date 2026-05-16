import api from './api';

export interface DatosRegistro {
  nombre: string;
  correo: string;
  password: string;
  rol?: 'usuario' | 'admin';
}

export interface DatosInicioSesion {
  correo: string;
  password: string;
}

export interface UsuarioAutenticado {
  id: number;
  nombre: string;
  correo: string;
  rol: 'usuario' | 'admin';
}

export interface SesionAutenticada {
  token: string;
  user: UsuarioAutenticado;
}

const CLAVE_SESION_AUTENTICADA = 'encuestas_sesion_autenticada';

export async function registrarUsuario(datos: DatosRegistro) {
  const { data } = await api.post('/auth/register', datos);
  return data;
}

export async function iniciarSesion(datos: DatosInicioSesion) {
  const { data } = await api.post<SesionAutenticada & { message: string }>('/auth/login', datos);
  return data;
}

export async function obtenerSesionActual() {
  const { data } = await api.get<{ user: UsuarioAutenticado }>('/auth/me');
  return data;
}

export function persistirSesionAutenticada(sesion: SesionAutenticada) {
  localStorage.setItem(CLAVE_SESION_AUTENTICADA, JSON.stringify(sesion));
}

export function leerSesionPersistida(): SesionAutenticada | null {
  const sesionGuardada = localStorage.getItem(CLAVE_SESION_AUTENTICADA);

  if (!sesionGuardada) {
    return null;
  }

  try {
    return JSON.parse(sesionGuardada) as SesionAutenticada;
  } catch {
    localStorage.removeItem(CLAVE_SESION_AUTENTICADA);
    return null;
  }
}

export function obtenerUsuarioAutenticado(): UsuarioAutenticado | null {
  return leerSesionPersistida()?.user || null;
}

export function obtenerTokenAutenticado(): string {
  return leerSesionPersistida()?.token || '';
}

export function limpiarSesionPersistida() {
  localStorage.removeItem(CLAVE_SESION_AUTENTICADA);
}
