import { defineStore } from 'pinia';
import {
  limpiarSesionPersistida,
  leerSesionPersistida,
  persistirSesionAutenticada,
  type SesionAutenticada,
  type UsuarioAutenticado
} from '../services/auth';

interface AuthState {
  token: string;
  user: UsuarioAutenticado | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: '',
    user: null
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.user),
    role: (state) => state.user?.rol || 'usuario'
  },
  actions: {
    inicializarDesdePersistencia() {
      const sesion = leerSesionPersistida();

      if (!sesion) {
        this.token = '';
        this.user = null;
        return;
      }

      this.token = sesion.token;
      this.user = sesion.user;
    },
    establecerSesion(sesion: SesionAutenticada) {
      this.token = sesion.token;
      this.user = sesion.user;
      persistirSesionAutenticada(sesion);
    },
    actualizarUsuario(user: UsuarioAutenticado) {
      this.user = user;

      if (this.token) {
        persistirSesionAutenticada({
          token: this.token,
          user
        });
      }
    },
    cerrarSesion() {
      this.token = '';
      this.user = null;
      limpiarSesionPersistida();
    }
  }
});
