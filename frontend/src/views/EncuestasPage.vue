<template>
  <ion-page>
    <ion-content fullscreen>
      <div class="pagina-contenedor">
        <section class="pagina-encabezado">
          <div>
            <p class="pagina-encabezado__etiqueta">Gestion</p>
            <h1 class="pagina-encabezado__titulo">Mis encuestas</h1>
            <p class="pagina-encabezado__texto">
              Aqui veras las encuestas que has creado y su estado actual.
            </p>
          </div>
          <div>
            <ion-button router-link="/home">Volver a la principal</ion-button>
          <ion-button router-link="/encuestas/crear">Nueva encuesta</ion-button>

          </div>
          
        </section>

        <div v-if="cargando" class="estado-vacio">Cargando encuestas...</div>
        <div v-else-if="encuestas.length === 0" class="estado-vacio">
          Aun no tienes encuestas creadas.
        </div>

        <div v-else class="lista-panel">
          <article v-for="encuesta in encuestas" :key="encuesta.id" class="tarjeta-encuesta">
            <div>
              <p class="tarjeta-encuesta__estado">{{ encuesta.estado }}</p>
              <h3 class="tarjeta-encuesta__titulo">{{ encuesta.titulo }}</h3>
              <p class="tarjeta-encuesta__descripcion">{{ encuesta.descripcion }}</p>
            </div>
            <p class="tarjeta-encuesta__fecha">
              {{ encuesta.categoria }} | {{ formatearFecha(encuesta.fecha_creacion) }}
            </p>
          </article>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonContent, IonPage, onIonViewWillEnter } from '@ionic/vue';
import { ref } from 'vue';
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
