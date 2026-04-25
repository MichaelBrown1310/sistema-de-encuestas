<template>
  <AppShell>
    <PageHeader
      v-if="encuesta"
      etiqueta="Responder"
      :titulo="encuesta.titulo"
      :descripcion="encuesta.descripcion"
      :detalle="`${encuesta.categoria} | Creada por ${encuesta.nombre_creador}`"
    />

    <img
      v-if="encuesta?.imagen_portada"
      :src="encuesta.imagen_portada"
      alt="Portada de la encuesta"
      class="encuesta-portada"
    />

    <div v-if="cargando" class="estado-vacio">Cargando encuesta...</div>

    <section v-else-if="encuesta && enviada" class="seccion-panel panel-confirmacion">
      <p class="panel-confirmacion__etiqueta">Encuesta enviada</p>
      <h2>{{ encuesta.titulo }}</h2>
      <p>{{ mensajeConfirmacionMostrado }}</p>
      <ion-button router-link="/encuestas/explorar">Volver a explorar</ion-button>
    </section>

    <section v-else-if="encuesta && seccionActual" class="seccion-panel">
      <div class="secciones-progreso">
        <div
          v-for="(seccion, indice) in encuesta.secciones"
          :key="seccion.id"
          class="secciones-progreso__item"
          :class="{
            'secciones-progreso__item--activa': indice === indiceSeccionActual,
            'secciones-progreso__item--completa': indice < indiceSeccionActual
          }"
        >
          <span>{{ indice + 1 }}</span>
          <strong>{{ seccion.titulo }}</strong>
        </div>
      </div>

      <div class="seccion-actual">
        <p class="seccion-actual__indice">
          Seccion {{ indiceSeccionActual + 1 }} de {{ encuesta.secciones.length }}
        </p>
        <h2 class="seccion-panel__titulo">{{ seccionActual.titulo }}</h2>
        <p v-if="seccionActual.descripcion" class="seccion-actual__descripcion">
          {{ seccionActual.descripcion }}
        </p>
      </div>

      <div class="lista-panel">
        <article
          v-for="(pregunta, indicePregunta) in seccionActual.preguntas"
          :key="pregunta.id"
          class="bloque-pregunta"
        >
          <div class="bloque-pregunta__titulo">
            <h3>Pregunta {{ indicePregunta + 1 }}</h3>
            <span :class="pregunta.es_obligatoria ? 'estado-obligatoria' : 'estado-opcional'">
              {{ pregunta.es_obligatoria ? 'Obligatoria' : 'Opcional' }}
            </span>
          </div>

          <p class="bloque-pregunta__texto">{{ pregunta.enunciado }}</p>

          <img
            v-if="pregunta.imagen"
            :src="pregunta.imagen"
            alt="Imagen de apoyo de la pregunta"
            class="pregunta-imagen"
          />

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

      <ion-text v-if="mensaje" :color="tipoMensaje">
        <p>{{ mensaje }}</p>
      </ion-text>

      <div class="acciones-seccion">
        <ion-button
          fill="outline"
          :disabled="indiceSeccionActual === 0 || enviando"
          @click="irASeccionAnterior"
        >
          Seccion anterior
        </ion-button>

        <ion-button v-if="!esUltimaSeccion" :disabled="enviando" @click="irASiguienteSeccion">
          Siguiente seccion
        </ion-button>

        <ion-button v-else :disabled="enviando" @click="enviarFormulario">
          {{ enviando ? 'Enviando...' : 'Enviar respuestas' }}
        </ion-button>
      </div>
    </section>

    <div v-else class="estado-vacio">No se encontro la encuesta solicitada.</div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonButton, IonItem, IonText, IonTextarea, onIonViewWillEnter } from '@ionic/vue';
import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '../components/AppShell.vue';
import PageHeader from '../components/PageHeader.vue';
import { obtenerUsuarioAutenticado } from '../services/auth';
import {
  enviarRespuestasEncuesta,
  obtenerEncuestaPublicada,
  type EncuestaDetallada,
  type PreguntaEncuesta,
  type RespuestaFormulario
} from '../services/encuestas';

const ruta = useRoute();
const usuario = obtenerUsuarioAutenticado();

const cargando = ref(false);
const enviando = ref(false);
const enviada = ref(false);
const mensaje = ref('');
const tipoMensaje = ref<'success' | 'danger'>('success');
const encuesta = ref<EncuestaDetallada | null>(null);
const indiceSeccionActual = ref(0);
const mensajeConfirmacionMostrado = ref('');

const respuestasTexto = reactive<Record<number, string>>({});
const respuestasUnicas = reactive<Record<number, number | null>>({});
const respuestasMultiples = reactive<Record<number, number[]>>({});

const seccionActual = computed(() => encuesta.value?.secciones[indiceSeccionActual.value] || null);
const esUltimaSeccion = computed(() => {
  if (!encuesta.value) {
    return false;
  }

  return indiceSeccionActual.value === encuesta.value.secciones.length - 1;
});

function resetearRespuestas() {
  for (const clave of Object.keys(respuestasTexto)) {
    delete respuestasTexto[Number(clave)];
  }

  for (const clave of Object.keys(respuestasUnicas)) {
    delete respuestasUnicas[Number(clave)];
  }

  for (const clave of Object.keys(respuestasMultiples)) {
    delete respuestasMultiples[Number(clave)];
  }
}

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

function preguntaTieneRespuesta(pregunta: PreguntaEncuesta) {
  if (!pregunta.id) {
    return false;
  }

  if (pregunta.tipo === 'texto') {
    return Boolean((respuestasTexto[pregunta.id] || '').trim());
  }

  if (pregunta.tipo === 'opcion_unica') {
    return Boolean(respuestasUnicas[pregunta.id]);
  }

  return (respuestasMultiples[pregunta.id] || []).length > 0;
}

function validarSeccionActual() {
  if (!seccionActual.value) {
    return '';
  }

  const faltantes = seccionActual.value.preguntas.filter(
    (pregunta) => pregunta.es_obligatoria && !preguntaTieneRespuesta(pregunta)
  );

  if (faltantes.length > 0) {
    return 'Completa las preguntas obligatorias antes de continuar.';
  }

  return '';
}

function construirPayloadRespuestas() {
  if (!encuesta.value) {
    return [];
  }

  const respuestas: RespuestaFormulario[] = [];

  for (const seccion of encuesta.value.secciones) {
    for (const pregunta of seccion.preguntas) {
      if (!pregunta.id) {
        continue;
      }

      if (pregunta.tipo === 'texto') {
        const texto = (respuestasTexto[pregunta.id] || '').trim();

        if (texto) {
          respuestas.push({
            pregunta_id: pregunta.id,
            texto_respuesta: texto
          });
        }

        continue;
      }

      if (pregunta.tipo === 'opcion_unica') {
        const opcionId = respuestasUnicas[pregunta.id];

        if (opcionId) {
          respuestas.push({
            pregunta_id: pregunta.id,
            opcion_id: opcionId
          });
        }

        continue;
      }

      for (const opcionId of respuestasMultiples[pregunta.id] || []) {
        respuestas.push({
          pregunta_id: pregunta.id,
          opcion_id: opcionId
        });
      }
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
    enviada.value = false;
    mensaje.value = '';
    mensajeConfirmacionMostrado.value = '';
    indiceSeccionActual.value = 0;
    resetearRespuestas();
    encuesta.value = await obtenerEncuestaPublicada(encuestaId);
  } catch (error) {
    console.error('No se pudo cargar la encuesta:', error);
    encuesta.value = null;
  } finally {
    cargando.value = false;
  }
}

function irASeccionAnterior() {
  mensaje.value = '';

  if (indiceSeccionActual.value > 0) {
    indiceSeccionActual.value -= 1;
  }
}

function irASiguienteSeccion() {
  mensaje.value = '';
  const error = validarSeccionActual();

  if (error) {
    tipoMensaje.value = 'danger';
    mensaje.value = error;
    return;
  }

  if (!encuesta.value) {
    return;
  }

  if (indiceSeccionActual.value < encuesta.value.secciones.length - 1) {
    indiceSeccionActual.value += 1;
  }
}

async function enviarFormulario() {
  mensaje.value = '';

  if (!usuario || !encuesta.value) {
    tipoMensaje.value = 'danger';
    mensaje.value = 'No se puede enviar la respuesta.';
    return;
  }

  const error = validarSeccionActual();

  if (error) {
    tipoMensaje.value = 'danger';
    mensaje.value = error;
    return;
  }

  try {
    enviando.value = true;
    const respuesta = await enviarRespuestasEncuesta(
      encuesta.value.id,
      usuario.id,
      construirPayloadRespuestas()
    );
    enviada.value = true;
    tipoMensaje.value = 'success';
    mensajeConfirmacionMostrado.value =
      respuesta.mensaje_confirmacion || encuesta.value.mensaje_confirmacion;
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

<style scoped>
.encuesta-portada,
.pregunta-imagen {
  display: block;
  width: 100%;
  border-radius: 20px;
  object-fit: cover;
}

.encuesta-portada {
  max-height: 340px;
  margin-bottom: 1.25rem;
}

.pregunta-imagen {
  max-width: 320px;
  margin-top: 0.75rem;
}

.secciones-progreso {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.secciones-progreso__item {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  gap: 0.75rem;
  align-items: center;
  padding: 0.85rem 1rem;
  border-radius: 16px;
  background: #e2e8f0;
  color: #334155;
}

.secciones-progreso__item span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  font-weight: 700;
}

.secciones-progreso__item--activa {
  background: #0f766e;
  color: #fff;
}

.secciones-progreso__item--completa {
  background: #d1fae5;
  color: #065f46;
}

.seccion-actual__indice {
  margin: 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.seccion-actual__descripcion {
  margin-top: 0.5rem;
  color: #475569;
}

.bloque-pregunta__titulo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.estado-obligatoria,
.estado-opcional {
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.estado-obligatoria {
  background: #fee2e2;
  color: #b91c1c;
}

.estado-opcional {
  background: #e0f2fe;
  color: #0369a1;
}

.acciones-seccion {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
}

.panel-confirmacion {
  text-align: center;
}

.panel-confirmacion__etiqueta {
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #0f766e;
  font-weight: 700;
}
</style>
