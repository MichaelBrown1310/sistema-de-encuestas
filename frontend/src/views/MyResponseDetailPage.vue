<template>
  <AppShell>
    <PageHeader
      etiqueta="Mi respuesta"
      :titulo="detalle?.encuesta.titulo || 'Detalle de respuesta'"
      :descripcion="detalle?.encuesta.descripcion || 'Aqui puedes revisar exactamente lo que respondiste.'"
    />

    <div v-if="cargando" class="estado-vacio">Cargando detalle...</div>
    <div v-else-if="!detalle" class="estado-vacio">No se encontro la respuesta solicitada.</div>

    <section v-else class="seccion-panel">
      <div class="seccion-panel__encabezado">
        <div>
          <p class="seccion-panel__etiqueta">Encuesta</p>
          <h2 class="seccion-panel__titulo">{{ detalle.encuesta.titulo }}</h2>
          <p class="subdetalle-encuesta">
            {{ detalle.encuesta.categoria }} | {{ detalle.encuesta.nombre_creador }} | {{ formatearFecha(detalle.fecha_respuesta) }}
          </p>
        </div>
      </div>

      <div class="lista-panel">
        <article
          v-for="detallePregunta in detalle.detalles"
          :key="detallePregunta.pregunta_id"
          class="bloque-pregunta"
        >
          <p class="respuesta-detalle__seccion">{{ detallePregunta.seccion_titulo }}</p>
          <h3>{{ detallePregunta.enunciado }}</h3>
          <p v-if="detallePregunta.texto_respuesta" class="respuesta-detalle__texto">
            {{ detallePregunta.texto_respuesta }}
          </p>
          <ul v-else class="respuesta-detalle__lista">
            <li v-for="opcion in detallePregunta.opciones" :key="opcion.id">{{ opcion.texto }}</li>
          </ul>
        </article>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { onIonViewWillEnter } from '@ionic/vue';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '../components/AppShell.vue';
import PageHeader from '../components/PageHeader.vue';
import { obtenerUsuarioAutenticado } from '../services/auth';
import { obtenerMiRespuesta, type MiRespuestaDetalle } from '../services/encuestas';

const ruta = useRoute();
const usuario = obtenerUsuarioAutenticado();
const cargando = ref(false);
const detalle = ref<MiRespuestaDetalle | null>(null);

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleString('es-CO');
}

async function cargarDetalle() {
  const respuestaId = Number(ruta.params.respuestaId);

  if (!usuario || !respuestaId) {
    detalle.value = null;
    return;
  }

  try {
    cargando.value = true;
    detalle.value = await obtenerMiRespuesta(respuestaId, usuario.id);
  } catch (error) {
    console.error('No se pudo cargar tu respuesta:', error);
    detalle.value = null;
  } finally {
    cargando.value = false;
  }
}

onIonViewWillEnter(() => {
  cargarDetalle();
});
</script>

<style scoped>
.respuesta-detalle__seccion {
  margin: 0 0 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #175cd3;
  font-size: 0.75rem;
  font-weight: 700;
}

.respuesta-detalle__texto {
  margin: 0;
  color: #425067;
  line-height: 1.5;
}

.respuesta-detalle__lista {
  margin: 0;
  padding-left: 1rem;
  color: #425067;
}
</style>
