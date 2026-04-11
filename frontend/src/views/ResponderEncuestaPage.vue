<template>
  <ion-page>
    <ion-content fullscreen>
      <div class="pagina-contenedor">
        <section class="pagina-encabezado" v-if="encuesta">
          <div>
            <p class="pagina-encabezado__etiqueta">Responder</p>
            <h1 class="pagina-encabezado__titulo">{{ encuesta.titulo }}</h1>
            <p class="pagina-encabezado__texto">{{ encuesta.descripcion }}</p>
            <p class="subdetalle-encuesta">
              {{ encuesta.categoria }} · Creada por {{ encuesta.nombre_creador }}
            </p>
          </div>
        </section>

        <div v-if="cargando" class="estado-vacio">Cargando encuesta...</div>

        <section v-else-if="encuesta" class="seccion-panel">
          <div class="lista-panel">
            <article
              v-for="(pregunta, indicePregunta) in encuesta.preguntas"
              :key="pregunta.id"
              class="bloque-pregunta"
            >
              <h3>Pregunta {{ indicePregunta + 1 }}</h3>
              <p class="bloque-pregunta__texto">{{ pregunta.enunciado }}</p>

              <div v-if="pregunta.tipo === 'texto'">
                <ion-item>
                  <ion-textarea
                    v-model="respuestasTexto[pregunta.id!]"
                    label="Tu respuesta"
                    label-placement="stacked"
                    :auto-grow="true"
                  />
                </ion-item>
              </div>

              <div v-else-if="pregunta.tipo === 'opcion_unica'" class="grupo-opciones">
                <label
                  v-for="opcion in pregunta.opciones"
                  :key="opcion.id"
                  class="opcion-respuesta"
                >
                  <input
                    v-model="respuestasUnicas[pregunta.id!]"
                    type="radio"
                    :name="`pregunta-${pregunta.id}`"
                    :value="opcion.id"
                  />
                  <span>{{ opcion.texto }}</span>
                </label>
              </div>

              <div v-else class="grupo-opciones">
                <label
                  v-for="opcion in pregunta.opciones"
                  :key="opcion.id"
                  class="opcion-respuesta"
                >
                  <input
                    type="checkbox"
                    :checked="opcionSeleccionada(pregunta.id!, opcion.id!)"
                    @change="alternarOpcionMultiple(pregunta.id!, opcion.id!)"
                  />
                  <span>{{ opcion.texto }}</span>
                </label>
              </div>
            </article>
          </div>

          <ion-button expand="block" :disabled="enviando" @click="enviarFormulario">
            {{ enviando ? 'Enviando...' : 'Enviar respuestas' }}
          </ion-button>

          <ion-text v-if="mensaje" :color="tipoMensaje">
            <p>{{ mensaje }}</p>
          </ion-text>
        </section>

        <div v-else class="estado-vacio">No se encontro la encuesta solicitada.</div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonItem,
  IonPage,
  IonText,
  IonTextarea,
  onIonViewWillEnter
} from '@ionic/vue';
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { obtenerUsuarioAutenticado } from '../services/auth';
import {
  enviarRespuestasEncuesta,
  obtenerEncuestaPublicada,
  type EncuestaDetallada,
  type RespuestaFormulario
} from '../services/encuestas';

const ruta = useRoute();
const enrutador = useRouter();
const usuario = obtenerUsuarioAutenticado();

const cargando = ref(false);
const enviando = ref(false);
const mensaje = ref('');
const tipoMensaje = ref<'success' | 'danger'>('success');
const encuesta = ref<EncuestaDetallada | null>(null);

const respuestasTexto = reactive<Record<number, string>>({});
const respuestasUnicas = reactive<Record<number, number | null>>({});
const respuestasMultiples = reactive<Record<number, number[]>>({});

function opcionSeleccionada(preguntaId: number, opcionId: number) {
  return (respuestasMultiples[preguntaId] || []).includes(opcionId);
}

function alternarOpcionMultiple(preguntaId: number, opcionId: number) {
  const seleccionadas = respuestasMultiples[preguntaId] || [];

  if (seleccionadas.includes(opcionId)) {
    respuestasMultiples[preguntaId] = seleccionadas.filter((id) => id !== opcionId);
  } else {
    respuestasMultiples[preguntaId] = [...seleccionadas, opcionId];
  }
}

function construirPayloadRespuestas() {
  if (!encuesta.value) {
    return [];
  }

  const respuestas: RespuestaFormulario[] = [];

  for (const pregunta of encuesta.value.preguntas) {
    if (!pregunta.id) {
      continue;
    }

    if (pregunta.tipo === 'texto') {
      const texto = (respuestasTexto[pregunta.id] || '').trim();

      if (!texto) {
        return [];
      }

      respuestas.push({
        pregunta_id: pregunta.id,
        texto_respuesta: texto
      });
      continue;
    }

    if (pregunta.tipo === 'opcion_unica') {
      const opcionId = respuestasUnicas[pregunta.id];

      if (!opcionId) {
        return [];
      }

      respuestas.push({
        pregunta_id: pregunta.id,
        opcion_id: opcionId
      });
      continue;
    }

    const opciones = respuestasMultiples[pregunta.id] || [];

    if (opciones.length === 0) {
      return [];
    }

    for (const opcionId of opciones) {
      respuestas.push({
        pregunta_id: pregunta.id,
        opcion_id: opcionId
      });
    }
  }

  return respuestas;
}

async function cargarEncuesta() {
  const encuestaId = Number(ruta.params.id);

  if (!encuestaId) {
    encuesta.value = null;
    return;
  }

  try {
    cargando.value = true;
    encuesta.value = await obtenerEncuestaPublicada(encuestaId);
  } catch (error) {
    console.error('No se pudo cargar la encuesta:', error);
    encuesta.value = null;
  } finally {
    cargando.value = false;
  }
}

async function enviarFormulario() {
  mensaje.value = '';

  if (!usuario || !encuesta.value) {
    tipoMensaje.value = 'danger';
    mensaje.value = 'No se puede enviar la respuesta.';
    return;
  }

  const respuestas = construirPayloadRespuestas();

  if (respuestas.length === 0) {
    tipoMensaje.value = 'danger';
    mensaje.value = 'Debes responder todas las preguntas.';
    return;
  }

  try {
    enviando.value = true;
    await enviarRespuestasEncuesta(encuesta.value.id, usuario.id, respuestas);
    tipoMensaje.value = 'success';
    mensaje.value = 'Respuesta enviada correctamente.';
    await enrutador.replace('/respuestas');
  } catch (error: any) {
    tipoMensaje.value = 'danger';
    mensaje.value = error.response?.data?.message || 'No se pudo enviar la respuesta.';
  } finally {
    enviando.value = false;
  }
}

onIonViewWillEnter(() => {
  cargarEncuesta();
});
</script>
