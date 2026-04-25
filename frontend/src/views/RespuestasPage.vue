<template>
  <AppShell>
    <PageHeader
      etiqueta="Seguimiento"
      titulo="Mis respuestas"
      descripcion="Aqui puedes revisar las encuestas que ya respondiste y entrar al detalle de tus respuestas."
    />

    <div v-if="cargando" class="estado-vacio">Cargando tus respuestas...</div>
    <div v-else-if="respuestas.length === 0" class="estado-vacio">
      Aun no has respondido ninguna encuesta.
    </div>

    <div v-else class="lista-panel">
      <article v-for="respuesta in respuestas" :key="respuesta.respuesta_id" class="tarjeta-encuesta">
        <div>
          <p class="tarjeta-encuesta__estado">Respondida</p>
          <h3 class="tarjeta-encuesta__titulo">{{ respuesta.encuesta.titulo }}</h3>
          <p class="tarjeta-encuesta__descripcion">{{ respuesta.encuesta.descripcion }}</p>
        </div>

        <div class="tarjeta-encuesta__acciones">
          <p class="tarjeta-encuesta__fecha">
            {{ respuesta.encuesta.categoria }} | {{ respuesta.encuesta.nombre_creador }} | {{ formatearFecha(respuesta.fecha_respuesta) }}
          </p>
          <ion-button :router-link="`/respuestas/${respuesta.respuesta_id}`">Ver mis respuestas</ion-button>
        </div>
      </article>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonButton, onIonViewWillEnter } from '@ionic/vue';
import { ref } from 'vue';
import AppShell from '../components/AppShell.vue';
import PageHeader from '../components/PageHeader.vue';
import { obtenerUsuarioAutenticado } from '../services/auth';
import { obtenerMisRespuestas, type MiRespuestaResumen } from '../services/encuestas';

const usuario = obtenerUsuarioAutenticado();
const cargando = ref(false);
const respuestas = ref<MiRespuestaResumen[]>([]);

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleString('es-CO');
}

async function cargarMisRespuestas() {
  if (!usuario) {
    return;
  }

  try {
    cargando.value = true;
    respuestas.value = await obtenerMisRespuestas(usuario.id);
  } catch (error) {
    console.error('No se pudieron cargar tus respuestas:', error);
    respuestas.value = [];
  } finally {
    cargando.value = false;
  }
}

onIonViewWillEnter(() => {
  cargarMisRespuestas();
});
</script>
