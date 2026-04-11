<template>
  <ion-page>
    <ion-content fullscreen>
      <div class="pagina-contenedor">
        <section class="pagina-encabezado">
          <div>
            <p class="pagina-encabezado__etiqueta">Creacion</p>
            <h1 class="pagina-encabezado__titulo">Crear encuesta</h1>
            <p class="pagina-encabezado__texto">
              Define la informacion principal de la encuesta y luego construye sus preguntas.
            </p>
          </div>
        </section>

        <section class="formulario-panel">
          <ion-list lines="none">
            <ion-item>
              <ion-input
                v-model="formulario.titulo"
                label="Titulo"
                label-placement="stacked"
                placeholder="Ejemplo: Habitos de estudio"
              />
            </ion-item>

            <ion-item>
              <ion-textarea
                v-model="formulario.descripcion"
                label="Descripcion"
                label-placement="stacked"
                placeholder="Cuenta de que trata la encuesta"
                :auto-grow="true"
              />
            </ion-item>

            <ion-item>
              <ion-input
                v-model="formulario.categoria"
                label="Categoria"
                label-placement="stacked"
                placeholder="Educacion, tecnologia, salud..."
              />
            </ion-item>

            <ion-item>
              <ion-select v-model="formulario.estado" label="Estado" label-placement="stacked">
                <ion-select-option value="borrador">Borrador</ion-select-option>
                <ion-select-option value="publicada">Publicada</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </section>

        <section class="seccion-panel">
          <div class="seccion-panel__encabezado">
            <div>
              <p class="seccion-panel__etiqueta">Preguntas</p>
              <h2 class="seccion-panel__titulo">Constructor de preguntas</h2>
            </div>

            <ion-button fill="outline" @click="agregarPregunta">
              Agregar pregunta
            </ion-button>
          </div>

          <div class="lista-panel">
            <article
              v-for="(pregunta, indicePregunta) in formulario.preguntas"
              :key="pregunta.id_temporal"
              class="bloque-pregunta"
            >
              <div class="bloque-pregunta__encabezado">
                <h3>Pregunta {{ indicePregunta + 1 }}</h3>
                <ion-button color="danger" fill="clear" @click="eliminarPregunta(indicePregunta)">
                  Eliminar
                </ion-button>
              </div>

              <ion-list lines="none">
                <ion-item>
                  <ion-input
                    v-model="pregunta.enunciado"
                    label="Enunciado"
                    label-placement="stacked"
                    placeholder="Escribe tu pregunta"
                  />
                </ion-item>

                <ion-item>
                  <ion-select
                    v-model="pregunta.tipo"
                    label="Tipo de pregunta"
                    label-placement="stacked"
                    @ionChange="cambiarTipoPregunta(indicePregunta)"
                  >
                    <ion-select-option value="texto">Texto libre</ion-select-option>
                    <ion-select-option value="opcion_unica">Opcion unica</ion-select-option>
                    <ion-select-option value="opcion_multiple">Opcion multiple</ion-select-option>
                  </ion-select>
                </ion-item>
              </ion-list>

              <div v-if="pregunta.tipo !== 'texto'" class="bloque-opciones">
                <div class="bloque-opciones__encabezado">
                  <p>Opciones de respuesta</p>
                  <ion-button fill="clear" @click="agregarOpcion(indicePregunta)">
                    Agregar opcion
                  </ion-button>
                </div>

                <div
                  v-for="(opcion, indiceOpcion) in pregunta.opciones"
                  :key="opcion.id_temporal"
                  class="fila-opcion"
                >
                  <ion-input
                    v-model="opcion.texto"
                    placeholder="Texto de la opcion"
                  />
                  <ion-button
                    color="danger"
                    fill="clear"
                    @click="eliminarOpcion(indicePregunta, indiceOpcion)"
                  >
                    Quitar
                  </ion-button>
                </div>
              </div>
            </article>
          </div>

          <ion-button expand="block" :disabled="guardando" @click="guardarEncuesta">
            {{ guardando ? 'Guardando...' : 'Guardar encuesta' }}
          </ion-button>

          <ion-text v-if="mensaje" :color="tipoMensaje">
            <p>{{ mensaje }}</p>
          </ion-text>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTextarea
} from '@ionic/vue';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { obtenerUsuarioAutenticado } from '../services/auth';
import { crearEncuesta, type PreguntaEncuesta } from '../services/encuestas';

interface OpcionEditable {
  id_temporal: number;
  texto: string;
}

interface PreguntaEditable extends Omit<PreguntaEncuesta, 'opciones'> {
  id_temporal: number;
  opciones: OpcionEditable[];
}

const enrutador = useRouter();
const usuario = obtenerUsuarioAutenticado();
let consecutivoPregunta = 1;
let consecutivoOpcion = 1;

function crearPreguntaBase(): PreguntaEditable {
  return {
    id_temporal: consecutivoPregunta++,
    enunciado: '',
    tipo: 'texto',
    opciones: []
  };
}

function crearOpcionBase(): OpcionEditable {
  return {
    id_temporal: consecutivoOpcion++,
    texto: ''
  };
}

const formulario = reactive({
  titulo: '',
  descripcion: '',
  categoria: '',
  estado: 'borrador',
  preguntas: [crearPreguntaBase()]
});

const guardando = ref(false);
const mensaje = ref('');
const tipoMensaje = ref<'success' | 'danger'>('success');

function agregarPregunta() {
  formulario.preguntas.push(crearPreguntaBase());
}

function eliminarPregunta(indicePregunta: number) {
  if (formulario.preguntas.length === 1) {
    return;
  }

  formulario.preguntas.splice(indicePregunta, 1);
}

function cambiarTipoPregunta(indicePregunta: number) {
  const pregunta = formulario.preguntas[indicePregunta];

  if (pregunta.tipo === 'texto') {
    pregunta.opciones = [];
    return;
  }

  if (pregunta.opciones.length < 2) {
    pregunta.opciones = [crearOpcionBase(), crearOpcionBase()];
  }
}

function agregarOpcion(indicePregunta: number) {
  formulario.preguntas[indicePregunta].opciones.push(crearOpcionBase());
}

function eliminarOpcion(indicePregunta: number, indiceOpcion: number) {
  const pregunta = formulario.preguntas[indicePregunta];

  if (pregunta.opciones.length <= 2) {
    return;
  }

  pregunta.opciones.splice(indiceOpcion, 1);
}

function limpiarFormulario() {
  formulario.titulo = '';
  formulario.descripcion = '';
  formulario.categoria = '';
  formulario.estado = 'borrador';
  formulario.preguntas = [crearPreguntaBase()];
}

function validarPreguntas() {
  for (const pregunta of formulario.preguntas) {
    if (!pregunta.enunciado.trim()) {
      return 'Todas las preguntas deben tener enunciado.';
    }

    if (pregunta.tipo !== 'texto') {
      if (pregunta.opciones.length < 2) {
        return 'Las preguntas con opciones deben tener al menos dos opciones.';
      }

      if (pregunta.opciones.some((opcion) => !opcion.texto.trim())) {
        return 'Todas las opciones deben tener texto.';
      }
    }
  }

  return '';
}

async function guardarEncuesta() {
  mensaje.value = '';

  if (!usuario) {
    tipoMensaje.value = 'danger';
    mensaje.value = 'Debes iniciar sesion.';
    return;
  }

  if (!formulario.titulo || !formulario.descripcion || !formulario.categoria) {
    tipoMensaje.value = 'danger';
    mensaje.value = 'Completa todos los campos principales.';
    return;
  }

  const errorPreguntas = validarPreguntas();

  if (errorPreguntas) {
    tipoMensaje.value = 'danger';
    mensaje.value = errorPreguntas;
    return;
  }

  try {
    guardando.value = true;

    await crearEncuesta({
      usuario_id: usuario.id,
      titulo: formulario.titulo,
      descripcion: formulario.descripcion,
      categoria: formulario.categoria,
      estado: formulario.estado,
      preguntas: formulario.preguntas.map((pregunta, indicePregunta) => ({
        enunciado: pregunta.enunciado.trim(),
        tipo: pregunta.tipo,
        orden: indicePregunta + 1,
        opciones:
          pregunta.tipo === 'texto'
            ? []
            : pregunta.opciones.map((opcion, indiceOpcion) => ({
                texto: opcion.texto.trim(),
                orden: indiceOpcion + 1
              }))
      }))
    });

    tipoMensaje.value = 'success';
    mensaje.value = 'Encuesta creada correctamente.';
    limpiarFormulario();
    await enrutador.replace('/encuestas');
  } catch (error: any) {
    tipoMensaje.value = 'danger';
    mensaje.value = error.response?.data?.message || 'No se pudo guardar la encuesta.';
  } finally {
    guardando.value = false;
  }
}
</script>
