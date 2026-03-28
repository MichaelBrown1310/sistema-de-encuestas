import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export interface RegisterPayload {
  nombre: string;
  correo: string;
  password: string;
}

export interface LoginPayload {
  correo: string;
  password: string;
}

export interface AuthUser {
  id: number;
  nombre: string;
  correo: string;
}

const AUTH_USER_KEY = 'encuestas_auth_user';

export async function registerUser(payload: RegisterPayload) {
  const { data } = await api.post('/auth/register', payload);
  return data;
}

export async function loginUser(payload: LoginPayload) {
  const { data } = await api.post('/auth/login', payload);
  return data;
}

export function saveAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function getAuthUser(): AuthUser | null {
  const savedUser = localStorage.getItem(AUTH_USER_KEY);

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

export function clearAuthUser() {
  localStorage.removeItem(AUTH_USER_KEY);
}
