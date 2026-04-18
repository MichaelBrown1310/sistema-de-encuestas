<template>
  <ion-page>
    <ion-content fullscreen>
      <div class="pagina-contenedor">
        <section class="pagina-encabezado">
          <div>
            <p class="pagina-encabezado__etiqueta">Creacion</p>
            <h1 class="pagina-encabezado__titulo">Crear encuesta</h1>
            <p class="pagina-encabezado__texto">
              Diseña tu encuesta con portada, secciones progresivas y preguntas configurables.
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

            <ion-item>
              <ion-textarea
                v-model="formulario.mensaje_confirmacion"
                label="Mensaje de confirmacion"
                label-placement="stacked"
                placeholder="Gracias por responder esta encuesta."
                :auto-grow="true"
              />
            </ion-item>
          </ion-list>

          <div class="campo-archivo">
            <label class="campo-archivo__label" for="imagen-portada">
              Imagen de portada
            </label>
            <input
              id="imagen-portada"
              accept="image/*"
              class="campo-archivo__input"
              type="file"
              @change="manejarCambioImagenPortada"
            />
            <button
              v-if="formulario.imagen_portada"
              class="campo-archivo__accion"
              type="button"
              @click="formulario.imagen_portada = null"
            >
              Quitar imagen
            </button>
          </div>

          <img
            v-if="formulario.imagen_portada"
            :src="formulario.imagen_portada"
            alt="Vista previa de la portada"
            class="vista-previa-imagen"
          />
        </section>

        <section class="seccion-panel">
          <div class="seccion-panel__encabezado">
            <div>
              <p class="seccion-panel__etiqueta">Secciones</p>
              <h2 class="seccion-panel__titulo">Constructor de formulario</h2>
            </div>

            <ion-button fill="outline" @click="agregarSeccion">
              Agregar seccion
            </ion-button>
          </div>

          <div class="lista-secciones">
            <article
              v-for="(seccion, indiceSeccion) in formulario.secciones"
              :key="seccion.id_temporal"
              class="bloque-seccion"
            >
              <div class="bloque-seccion__encabezado">
                <div>
                  <p class="bloque-seccion__indice">Seccion {{ indiceSeccion + 1 }}</p>
                  <h3>{{ seccion.titulo || `Seccion ${indiceSeccion + 1}` }}</h3>
                </div>

                <ion-button
                  color="danger"
                  fill="clear"
                  :disabled="formulario.secciones.length === 1"
                  @click="eliminarSeccion(indiceSeccion)"
                >
                  Eliminar seccion
                </ion-button>
              </div>

              <ion-list lines="none">
                <ion-item>
                  <ion-input
                    v-model="seccion.titulo"
                    label="Titulo de la seccion"
                    label-placement="stacked"
                    placeholder="Ejemplo: Datos generales"
                  />
                </ion-item>

                <ion-item>
                  <ion-textarea
                    v-model="seccion.descripcion"
                    label="Descripcion de la seccion"
                    label-placement="stacked"
                    placeholder="Instrucciones breves para esta seccion"
                    :auto-grow="true"
                  />
                </ion-item>
              </ion-list>

              <div class="bloque-seccion__acciones">
                <ion-button fill="outline" @click="agregarPregunta(indiceSeccion)">
                  Agregar pregunta
                </ion-button>
              </div>

              <div class="lista-preguntas">
                <article
                  v-for="(pregunta, indicePregunta) in seccion.preguntas"
                  :key="pregunta.id_temporal"
                  class="bloque-pregunta"
                  draggable="true"
                  @dragstart="iniciarArrastre(seccion.id_temporal, pregunta.id_temporal)"
                  @dragover.prevent
                  @drop="soltarPregunta(seccion.id_temporal, indicePregunta)"
                >
                  <div class="bloque-pregunta__encabezado">
                    <div>
                      <p class="bloque-pregunta__drag">Arrastra para reordenar</p>
                      <h3>Pregunta {{ indicePregunta + 1 }}</h3>
                    </div>
                    <ion-button
                      color="danger"
                      fill="clear"
                      @click="eliminarPregunta(indiceSeccion, indicePregunta)"
                    >
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
                        @ionChange="cambiarTipoPregunta(indiceSeccion, indicePregunta)"
                      >
                        <ion-select-option value="texto">Texto libre</ion-select-option>
                        <ion-select-option value="opcion_unica">Opcion unica</ion-select-option>
                        <ion-select-option value="opcion_multiple">Opcion multiple</ion-select-option>
                      </ion-select>
                    </ion-item>
                  </ion-list>

                  <label class="alternador-obligatoria">
                    <input v-model="pregunta.es_obligatoria" type="checkbox" />
                    <span>Respuesta obligatoria</span>
                  </label>

                  <div class="campo-archivo">
                    <label class="campo-archivo__label" :for="`imagen-pregunta-${pregunta.id_temporal}`">
                      Imagen de apoyo para la pregunta
                    </label>
                    <input
                      :id="`imagen-pregunta-${pregunta.id_temporal}`"
                      accept="image/*"
                      class="campo-archivo__input"
                      type="file"
                      @change="manejarCambioImagenPregunta($event, indiceSeccion, indicePregunta)"
                    />
                    <button
                      v-if="pregunta.imagen"
                      class="campo-archivo__accion"
                      type="button"
                      @click="pregunta.imagen = null"
                    >
                      Quitar imagen
                    </button>
                  </div>

                  <img
                    v-if="pregunta.imagen"
                    :src="pregunta.imagen"
                    alt="Vista previa de la pregunta"
                    class="vista-previa-imagen vista-previa-imagen--pregunta"
                  />

                  <div v-if="pregunta.tipo !== 'texto'" class="bloque-opciones">
                    <div class="bloque-opciones__encabezado">
                      <p>Opciones de respuesta</p>
                      <ion-button fill="clear" @click="agregarOpcion(indiceSeccion, indicePregunta)">
                        Agregar opcion
                      </ion-button>
                    </div>

                    <div
                      v-for="(opcion, indiceOpcion) in pregunta.opciones"
                      :key="opcion.id_temporal"
                      class="fila-opcion"
                    >
                      <ion-input v-model="opcion.texto" placeholder="Texto de la opcion" />
                      <ion-button
                        color="danger"
                        fill="clear"
                        @click="eliminarOpcion(indiceSeccion, indicePregunta, indiceOpcion)"
                      >
                        Quitar
                      </ion-button>
                    </div>
                  </div>
                </article>
              </div>

              <div
                class="zona-soltar"
                @dragover.prevent
                @drop="soltarPreguntaAlFinal(seccion.id_temporal)"
              >
                Suelta aqui para mover la pregunta al final de esta seccion.
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
  imagen: string | null;
  opciones: OpcionEditable[];
}

interface SeccionEditable {
  id_temporal: number;
  titulo: string;
  descripcion: string;
  preguntas: PreguntaEditable[];
}

const enrutador = useRouter();
const usuario = obtenerUsuarioAutenticado();

let consecutivoSeccion = 1;
let consecutivoPregunta = 1;
let consecutivoOpcion = 1;

const guardando = ref(false);
const mensaje = ref('');
const tipoMensaje = ref<'success' | 'danger'>('success');
const arrastreActual = ref<{ seccionId: number; preguntaId: number } | null>(null);

function crearOpcionBase(): OpcionEditable {
  return {
    id_temporal: consecutivoOpcion++,
    texto: ''
  };
}

function crearPreguntaBase(): PreguntaEditable {
  return {
    id_temporal: consecutivoPregunta++,
    enunciado: '',
    imagen: null,
    tipo: 'texto',
    es_obligatoria: true,
    opciones: []
  };
}

function crearSeccionBase(): SeccionEditable {
  return {
    id_temporal: consecutivoSeccion++,
    titulo: '',
    descripcion: '',
    preguntas: [crearPreguntaBase()]
  };
}

const formulario = reactive({
  titulo: '',
  descripcion: '',
  imagen_portada: null as string | null,
  categoria: '',
  estado: 'borrador',
  mensaje_confirmacion: 'Tu respuesta ha sido enviada correctamente.',
  secciones: [crearSeccionBase()]
});

function limpiarFormulario() {
  formulario.titulo = '';
  formulario.descripcion = '';
  formulario.imagen_portada = null;
  formulario.categoria = '';
  formulario.estado = 'borrador';
  formulario.mensaje_confirmacion = 'Tu respuesta ha sido enviada correctamente.';
  formulario.secciones = [crearSeccionBase()];
}

function agregarSeccion() {
  formulario.secciones.push(crearSeccionBase());
}

function eliminarSeccion(indiceSeccion: number) {
  if (formulario.secciones.length === 1) {
    return;
  }

  formulario.secciones.splice(indiceSeccion, 1);
}

function agregarPregunta(indiceSeccion: number) {
  formulario.secciones[indiceSeccion].preguntas.push(crearPreguntaBase());
}

function eliminarPregunta(indiceSeccion: number, indicePregunta: number) {
  const preguntas = formulario.secciones[indiceSeccion].preguntas;

  if (preguntas.length === 1) {
    return;
  }

  preguntas.splice(indicePregunta, 1);
}

function cambiarTipoPregunta(indiceSeccion: number, indicePregunta: number) {
  const pregunta = formulario.secciones[indiceSeccion].preguntas[indicePregunta];

  if (pregunta.tipo === 'texto') {
    pregunta.opciones = [];
    return;
  }

  if (pregunta.opciones.length < 2) {
    pregunta.opciones = [crearOpcionBase(), crearOpcionBase()];
  }
}

function agregarOpcion(indiceSeccion: number, indicePregunta: number) {
  formulario.secciones[indiceSeccion].preguntas[indicePregunta].opciones.push(crearOpcionBase());
}

function eliminarOpcion(indiceSeccion: number, indicePregunta: number, indiceOpcion: number) {
  const opciones = formulario.secciones[indiceSeccion].preguntas[indicePregunta].opciones;

  if (opciones.length <= 2) {
    return;
  }

  opciones.splice(indiceOpcion, 1);
}

function leerArchivoComoBase64(archivo: File) {
  return new Promise<string>((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result || ''));
    lector.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    lector.readAsDataURL(archivo);
  });
}

async function manejarCambioImagenPortada(evento: Event) {
  const input = evento.target as HTMLInputElement;
  const archivo = input.files?.[0];

  if (!archivo) {
    return;
  }

  formulario.imagen_portada = await leerArchivoComoBase64(archivo);
  input.value = '';
}

async function manejarCambioImagenPregunta(
  evento: Event,
  indiceSeccion: number,
  indicePregunta: number
) {
  const input = evento.target as HTMLInputElement;
  const archivo = input.files?.[0];

  if (!archivo) {
    return;
  }

  formulario.secciones[indiceSeccion].preguntas[indicePregunta].imagen =
    await leerArchivoComoBase64(archivo);
  input.value = '';
}

function iniciarArrastre(seccionId: number, preguntaId: number) {
  arrastreActual.value = { seccionId, preguntaId };
}

function encontrarPreguntaArrastrada() {
  if (!arrastreActual.value) {
    return null;
  }

  const indiceSeccion = formulario.secciones.findIndex(
    (seccion) => seccion.id_temporal === arrastreActual.value?.seccionId
  );

  if (indiceSeccion === -1) {
    return null;
  }

  const indicePregunta = formulario.secciones[indiceSeccion].preguntas.findIndex(
    (pregunta) => pregunta.id_temporal === arrastreActual.value?.preguntaId
  );

  if (indicePregunta === -1) {
    return null;
  }

  return { indiceSeccion, indicePregunta };
}

function moverPregunta(destinoSeccionId: number, indiceDestino?: number) {
  const origen = encontrarPreguntaArrastrada();

  if (!origen) {
    return;
  }

  const destinoSeccion = formulario.secciones.find(
    (seccion) => seccion.id_temporal === destinoSeccionId
  );

  if (!destinoSeccion) {
    return;
  }

  const [preguntaMovida] = formulario.secciones[origen.indiceSeccion].preguntas.splice(
    origen.indicePregunta,
    1
  );

  let posicionDestino =
    indiceDestino == null ? destinoSeccion.preguntas.length : Math.max(indiceDestino, 0);

  if (
    formulario.secciones[origen.indiceSeccion].id_temporal === destinoSeccionId &&
    origen.indicePregunta < posicionDestino
  ) {
    posicionDestino -= 1;
  }

  destinoSeccion.preguntas.splice(posicionDestino, 0, preguntaMovida);
  arrastreActual.value = null;
}

function soltarPregunta(destinoSeccionId: number, indicePregunta: number) {
  moverPregunta(destinoSeccionId, indicePregunta);
}

function soltarPreguntaAlFinal(destinoSeccionId: number) {
  moverPregunta(destinoSeccionId);
}

function validarFormulario() {
  if (!usuario) {
    return 'Debes iniciar sesion.';
  }

  if (!formulario.titulo.trim() || !formulario.descripcion.trim() || !formulario.categoria.trim()) {
    return 'Completa todos los campos principales.';
  }

  if (!formulario.mensaje_confirmacion.trim()) {
    return 'Debes configurar el mensaje de confirmacion.';
  }

  for (const seccion of formulario.secciones) {
    if (!seccion.titulo.trim()) {
      return 'Todas las secciones deben tener titulo.';
    }

    if (seccion.preguntas.length === 0) {
      return 'Cada seccion debe tener al menos una pregunta.';
    }

    for (const pregunta of seccion.preguntas) {
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
  }

  return '';
}

async function guardarEncuesta() {
  mensaje.value = '';

  const error = validarFormulario();

  if (error || !usuario) {
    tipoMensaje.value = 'danger';
    mensaje.value = error || 'Debes iniciar sesion.';
    return;
  }

  try {
    guardando.value = true;

    await crearEncuesta({
      usuario_id: usuario.id,
      titulo: formulario.titulo.trim(),
      descripcion: formulario.descripcion.trim(),
      imagen_portada: formulario.imagen_portada,
      categoria: formulario.categoria.trim(),
      estado: formulario.estado,
      mensaje_confirmacion: formulario.mensaje_confirmacion.trim(),
      secciones: formulario.secciones.map((seccion, indiceSeccion) => ({
        titulo: seccion.titulo.trim(),
        descripcion: seccion.descripcion.trim(),
        orden: indiceSeccion + 1,
        preguntas: seccion.preguntas.map((pregunta, indicePregunta) => ({
          enunciado: pregunta.enunciado.trim(),
          imagen: pregunta.imagen,
          tipo: pregunta.tipo,
          es_obligatoria: pregunta.es_obligatoria,
          orden: indicePregunta + 1,
          opciones:
            pregunta.tipo === 'texto'
              ? []
              : pregunta.opciones.map((opcion, indiceOpcion) => ({
                  texto: opcion.texto.trim(),
                  orden: indiceOpcion + 1
                }))
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

<style scoped>
.lista-secciones {
  display: grid;
  gap: 1.5rem;
}

.bloque-seccion {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 20px;
  padding: 1rem;
  background: #fff;
}

.bloque-seccion__encabezado,
.bloque-pregunta__encabezado,
.bloque-opciones__encabezado,
.bloque-seccion__acciones {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.bloque-seccion__indice,
.bloque-pregunta__drag {
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}

.lista-preguntas {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.bloque-pregunta {
  border: 1px dashed rgba(14, 116, 144, 0.28);
  border-radius: 18px;
  padding: 1rem;
  background: #f8fafc;
}

.alternador-obligatoria {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  margin: 0.75rem 0 0;
  color: #0f172a;
}

.campo-archivo {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-top: 1rem;
}

.campo-archivo__label {
  font-weight: 600;
  color: #0f172a;
}

.campo-archivo__input {
  max-width: 100%;
}

.campo-archivo__accion {
  border: 0;
  border-radius: 999px;
  padding: 0.5rem 0.85rem;
  background: #e2e8f0;
  color: #0f172a;
  cursor: pointer;
}

.vista-previa-imagen {
  display: block;
  width: 100%;
  max-width: 420px;
  margin-top: 1rem;
  border-radius: 18px;
  object-fit: cover;
}

.vista-previa-imagen--pregunta {
  max-width: 280px;
}

.bloque-opciones {
  margin-top: 1rem;
}

.fila-opcion {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
}

.zona-soltar {
  margin-top: 1rem;
  border: 1px dashed rgba(148, 163, 184, 0.9);
  border-radius: 16px;
  padding: 0.9rem;
  text-align: center;
  color: #475569;
  background: #f8fafc;
}
</style>
