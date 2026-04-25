<template>
  <AppShell>
    <PageHeader
      etiqueta="Descubrir"
      titulo="Explorar encuestas"
      descripcion="Estas son algunas encuestas publicadas disponibles para responder."
    />

    <div v-if="cargando" class="estado-vacio">Buscando encuestas publicadas...</div>
    <div v-else-if="encuestas.length === 0" class="estado-vacio">
      No hay encuestas publicadas por el momento.
    </div>

    <div v-else class="lista-panel">
      <SurveyCard
        v-for="encuesta in encuestas"
        :key="encuesta.id"
        estado="Publicada"
        :titulo="encuesta.titulo"
        :descripcion="encuesta.descripcion"
        :detalle="`${encuesta.categoria} | ${encuesta.nombre_creador}`"
      >
        <template #actions>
          <ion-button :router-link="`/encuestas/${encuesta.id}/responder`">Responder</ion-button>
        </template>
      </SurveyCard>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonButton, onIonViewWillEnter } from '@ionic/vue';
import { ref } from 'vue';
import AppShell from '../components/AppShell.vue';
import PageHeader from '../components/PageHeader.vue';
import SurveyCard from '../components/SurveyCard.vue';
import { obtenerEncuestasPublicadas, type EncuestaPublica } from '../services/encuestas';

const cargando = ref(false);
const encuestas = ref<EncuestaPublica[]>([]);

async function cargarEncuestasPublicadas() {
  try {
    cargando.value = true;
    encuestas.value = await obtenerEncuestasPublicadas();
  } catch (error) {
    console.error('No se pudieron cargar las encuestas publicadas:', error);
  } finally {
    cargando.value = false;
  }
}

onIonViewWillEnter(() => {
  cargarEncuestasPublicadas();
});
</script>
