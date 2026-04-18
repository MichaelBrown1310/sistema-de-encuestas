<template>
  <ion-page>
    <ion-content fullscreen>
      <div class="pagina-contenedor">
        <section class="pagina-encabezado">
          
          <div>
            
            <p class="pagina-encabezado__etiqueta">Descubrir</p>
            <h1 class="pagina-encabezado__titulo">Explorar encuestas</h1>
            <p class="pagina-encabezado__texto">
              Estas son algunas encuestas publicadas disponibles para responder.
            </p>
          </div>
          <ion-button router-link="/home">Volver a la principal</ion-button>
        </section>

        <div v-if="cargando" class="estado-vacio">Buscando encuestas publicadas...</div>
        <div v-else-if="encuestas.length === 0" class="estado-vacio">
          No hay encuestas publicadas por el momento.
        </div>

        <div v-else class="lista-panel">
          <article v-for="encuesta in encuestas" :key="encuesta.id" class="tarjeta-encuesta">
            <div>
              <p class="tarjeta-encuesta__estado">Publicada</p>
              <h3 class="tarjeta-encuesta__titulo">{{ encuesta.titulo }}</h3>
              <p class="tarjeta-encuesta__descripcion">{{ encuesta.descripcion }}</p>
            </div>
            <div class="tarjeta-encuesta__acciones">
              <p class="tarjeta-encuesta__fecha">
                {{ encuesta.categoria }} | {{ encuesta.nombre_creador }}
              </p>
              <ion-button :router-link="`/encuestas/${encuesta.id}/responder`">
                Responder
              </ion-button>
            </div>
          </article>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonContent, IonPage, onIonViewWillEnter } from '@ionic/vue';
import { ref } from 'vue';
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
