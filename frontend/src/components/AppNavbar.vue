<template>
  <nav class="app-navbar">
    <div class="app-navbar__marca">
      <router-link to="/home" class="app-navbar__logo">Encuestas USC</router-link>
      <p class="app-navbar__usuario" v-if="usuario">
        Hola, {{ usuario.nombre }} ({{ usuario.rol }})
      </p>
    </div>

    <div class="app-navbar__enlaces">
      <router-link
        v-for="item in enlaces"
        :key="item.to"
        :to="item.to"
        class="app-navbar__enlace"
        :class="{ 'app-navbar__enlace--activa': esEnlaceActivo(item.to) }"
      >
        {{ item.label }}
      </router-link>
    </div>

    <ion-button fill="outline" size="small" @click="cerrarSesion">
      Cerrar sesion
    </ion-button>
  </nav>
</template>

<script setup lang="ts">
import { IonButton } from '@ionic/vue';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const enrutador = useRouter();
const ruta = useRoute();
const authStore = useAuthStore();
const usuario = computed(() => authStore.user);

const enlaces = [
  { to: '/home', label: 'Inicio' },
  { to: '/encuestas', label: 'Mis encuestas' },
  { to: '/encuestas/explorar', label: 'Explorar' },
  { to: '/encuestas/crear', label: 'Crear encuesta' },
  { to: '/respuestas', label: 'Mis respuestas' }
];

function esEnlaceActivo(destino: string) {
  if (destino === '/home' || destino === '/respuestas') {
    return ruta.path === destino;
  }

  return ruta.path === destino || ruta.path.startsWith(`${destino}/`);
}

async function cerrarSesion() {
  authStore.cerrarSesion();
  await enrutador.replace('/login');
}
</script>
