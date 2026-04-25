<template>
  <AppShell>
    <PageHeader
      etiqueta="Gestion"
      titulo="Mis encuestas"
      descripcion="Aqui veras las encuestas que has creado y su estado actual."
    >
      <template #actions>
        <ion-button router-link="/encuestas/crear">Nueva encuesta</ion-button>
      </template>
    </PageHeader>

    <div v-if="cargando" class="estado-vacio">Cargando encuestas...</div>
    <div v-else-if="encuestas.length === 0" class="estado-vacio">
      Aun no tienes encuestas creadas.
    </div>

    <div v-else class="lista-panel">
      <SurveyCard
        v-for="encuesta in encuestas"
        :key="encuesta.id"
        :estado="encuesta.estado"
        :titulo="encuesta.titulo"
        :descripcion="encuesta.descripcion"
        :detalle="`${encuesta.categoria} | ${formatearFecha(encuesta.fecha_creacion)}`"
      />
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonButton, onIonViewWillEnter } from '@ionic/vue';
import { ref } from 'vue';
import AppShell from '../components/AppShell.vue';
import PageHeader from '../components/PageHeader.vue';
import SurveyCard from '../components/SurveyCard.vue';
import { obtenerUsuarioAutenticado } from '../services/auth';
import { obtenerEncuestasUsuario, type Encuesta } from '../services/encuestas';

const usuario = obtenerUsuarioAutenticado();
const cargando = ref(false);
const encuestas = ref<Encuesta[]>([]);

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-CO');
}

async function cargarEncuestas() {
  if (!usuario) {
    return;
  }

  try {
    cargando.value = true;
    encuestas.value = await obtenerEncuestasUsuario(usuario.id);
  } catch (error) {
    console.error('No se pudieron cargar las encuestas:', error);
  } finally {
    cargando.value = false;
  }
}

onIonViewWillEnter(() => {
  cargarEncuestas();
});
</script>
