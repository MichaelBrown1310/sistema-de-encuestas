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
        :estado="obtenerEtiquetaEstado(encuesta)"
        :titulo="encuesta.titulo"
        :descripcion="encuesta.descripcion"
        :detalle="`${encuesta.categoria} | ${formatearFecha(encuesta.fecha_creacion)}`"
      >
        <template #actions>
          <div class="acciones-encuesta">
            <ion-button
              v-if="encuesta.estado === 'borrador'"
              fill="outline"
              size="small"
              :router-link="`/encuestas/${encuesta.id}/editar`"
            >
              Editar
            </ion-button>

            <ion-button
              v-if="encuesta.estado === 'borrador'"
              size="small"
              :disabled="procesandoId === encuesta.id"
              @click="manejarPublicacion(encuesta.id)"
            >
              Publicar
            </ion-button>

            <ion-button
              v-if="encuesta.estado === 'publicada'"
              fill="outline"
              size="small"
              :disabled="procesandoId === encuesta.id"
              @click="manejarOcultamiento(encuesta)"
            >
              {{ encuesta.esta_oculta ? 'Mostrar' : 'Ocultar' }}
            </ion-button>

            <ion-button
              v-if="encuesta.estado === 'publicada'"
              fill="outline"
              size="small"
              :router-link="`/encuestas/${encuesta.id}/respuestas`"
            >
              Ver respuestas
            </ion-button>

            <ion-button
              color="danger"
              fill="clear"
              size="small"
              :disabled="procesandoId === encuesta.id"
              @click="manejarEliminacion(encuesta.id)"
            >
              Eliminar
            </ion-button>
          </div>
        </template>
      </SurveyCard>
    </div>

    <ion-text v-if="mensaje" :color="tipoMensaje">
      <p>{{ mensaje }}</p>
    </ion-text>
  </AppShell>
</template>

<script setup lang="ts">
import { IonButton, IonText, onIonViewWillEnter } from '@ionic/vue';
import { ref } from 'vue';
import AppShell from '../components/AppShell.vue';
import PageHeader from '../components/PageHeader.vue';
import SurveyCard from '../components/SurveyCard.vue';
import { obtenerUsuarioAutenticado } from '../services/auth';
import {
  cambiarOcultamientoEncuesta,
  eliminarEncuesta,
  obtenerEncuestasUsuario,
  publicarEncuesta,
  type Encuesta
} from '../services/encuestas';

const usuario = obtenerUsuarioAutenticado();
const cargando = ref(false);
const procesandoId = ref<number | null>(null);
const encuestas = ref<Encuesta[]>([]);
const mensaje = ref('');
const tipoMensaje = ref<'success' | 'danger'>('success');

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-CO');
}

function obtenerEtiquetaEstado(encuesta: Encuesta) {
  if (encuesta.estado === 'publicada' && encuesta.esta_oculta) {
    return 'publicada oculta';
  }

  return encuesta.estado;
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
    tipoMensaje.value = 'danger';
    mensaje.value = 'No se pudieron cargar las encuestas.';
  } finally {
    cargando.value = false;
  }
}

async function manejarPublicacion(encuestaId: number) {
  if (!usuario) {
    return;
  }

  const confirmar = window.confirm(
    'Al publicar esta encuesta ya no podras editarla. Deseas continuar?'
  );

  if (!confirmar) {
    return;
  }

  try {
    procesandoId.value = encuestaId;
    const respuesta = await publicarEncuesta(encuestaId, usuario.id);
    tipoMensaje.value = 'success';
    mensaje.value = respuesta.message;
    await cargarEncuestas();
  } catch (error: any) {
    tipoMensaje.value = 'danger';
    mensaje.value = error.response?.data?.message || 'No se pudo publicar la encuesta.';
  } finally {
    procesandoId.value = null;
  }
}

async function manejarOcultamiento(encuesta: Encuesta) {
  if (!usuario) {
    return;
  }

  try {
    procesandoId.value = encuesta.id;
    const respuesta = await cambiarOcultamientoEncuesta(
      encuesta.id,
      usuario.id,
      !encuesta.esta_oculta
    );
    tipoMensaje.value = 'success';
    mensaje.value = respuesta.message;
    await cargarEncuestas();
  } catch (error: any) {
    tipoMensaje.value = 'danger';
    mensaje.value = error.response?.data?.message || 'No se pudo cambiar la visibilidad.';
  } finally {
    procesandoId.value = null;
  }
}

async function manejarEliminacion(encuestaId: number) {
  if (!usuario) {
    return;
  }

  const confirmar = window.confirm('Esta accion eliminara la encuesta y sus respuestas. Deseas continuar?');

  if (!confirmar) {
    return;
  }

  try {
    procesandoId.value = encuestaId;
    const respuesta = await eliminarEncuesta(encuestaId, usuario.id);
    tipoMensaje.value = 'success';
    mensaje.value = respuesta.message;
    await cargarEncuestas();
  } catch (error: any) {
    tipoMensaje.value = 'danger';
    mensaje.value = error.response?.data?.message || 'No se pudo eliminar la encuesta.';
  } finally {
    procesandoId.value = null;
  }
}

onIonViewWillEnter(() => {
  cargarEncuestas();
});
</script>

<style scoped>
.acciones-encuesta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
