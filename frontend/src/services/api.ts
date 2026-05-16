import axios from 'axios';

const CLAVE_SESION_AUTENTICADA = 'encuestas_sesion_autenticada';

function leerTokenPersistido() {
  const sesionGuardada = localStorage.getItem(CLAVE_SESION_AUTENTICADA);

  if (!sesionGuardada) {
    return '';
  }

  try {
    return JSON.parse(sesionGuardada)?.token || '';
  } catch {
    localStorage.removeItem(CLAVE_SESION_AUTENTICADA);
    return '';
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://sistema-de-encuestas.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = leerTokenPersistido();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
