<template>
  <AppShell>
    <PageHeader
      etiqueta="Resultados"
      :titulo="datosEncuesta?.titulo || 'Respuestas de la encuesta'"
      descripcion="Aqui puedes revisar quienes respondieron, ver sus respuestas y consultar el comportamiento de las preguntas con opciones."
    />

    <div v-if="cargando" class="estado-vacio">Cargando respuestas...</div>
    <div v-else-if="!datosEncuesta" class="estado-vacio">No se encontro la encuesta solicitada.</div>
    <div v-else>
      <section class="seccion-panel resultados-panel">
        <div class="resultados-panel__resumen">
          <article class="tarjeta-metrica">
            <p class="tarjeta-metrica__etiqueta">Personas</p>
            <h2 class="tarjeta-metrica__valor">{{ datosEncuesta.respuestas.length }}</h2>
            <p class="tarjeta-metrica__detalle">Respondieron esta encuesta</p>
          </article>

          <article class="tarjeta-metrica">
            <p class="tarjeta-metrica__etiqueta">Graficas</p>
            <h2 class="tarjeta-metrica__valor">{{ preguntasGraficables.length }}</h2>
            <p class="tarjeta-metrica__detalle">Preguntas de opcion analizadas</p>
          </article>
        </div>

        <div v-if="preguntasGraficables.length === 0" class="estado-vacio estado-vacio--interno">
          No hay preguntas de seleccion unica o multiple con respuestas suficientes para graficar.
        </div>

        <div v-else class="graficas-grid">
          <article
            v-for="pregunta in preguntasGraficables"
            :key="pregunta.preguntaId"
            class="grafica-card"
          >
            <div class="grafica-card__encabezado">
              <p class="grafica-card__seccion">{{ pregunta.seccionTitulo }}</p>
              <h3>{{ pregunta.enunciado }}</h3>
              <p class="grafica-card__tipo">
                {{ pregunta.tipo === 'opcion_unica' ? 'Seleccion unica' : 'Seleccion multiple' }}
              </p>
            </div>

            <div class="grafica-card__contenido">
              <div class="pastel-wrapper">
                <div class="pastel-grafica" :style="{ background: construirGradiente(pregunta.segmentos) }">
                  <div class="pastel-grafica__centro">
                    <strong>{{ pregunta.totalVotos }}</strong>
                    <span>votos</span>
                  </div>
                </div>
              </div>

              <div class="grafica-card__leyenda">
                <div
                  v-for="segmento in pregunta.segmentos"
                  :key="`${pregunta.preguntaId}-${segmento.texto}`"
                  class="leyenda-item"
                >
                  <span class="leyenda-item__color" :style="{ backgroundColor: segmento.color }" />
                  <div>
                    <strong>{{ segmento.texto }}</strong>
                    <p>{{ segmento.cantidad }} votos | {{ segmento.porcentaje.toFixed(1) }}%</p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section v-if="datosEncuesta.respuestas.length === 0" class="estado-vacio">
        Esta encuesta aun no tiene respuestas registradas.
      </section>

      <section v-else class="lista-panel">
        <details
          v-for="respuesta in datosEncuesta.respuestas"
          :key="respuesta.id"
          class="respuesta-card"
        >
          <summary class="respuesta-card__encabezado">
            <div>
              <p class="respuesta-card__etiqueta">Respuesta #{{ respuesta.id }}</p>
              <h3>{{ respuesta.respondedor.nombre }}</h3>
              <p class="respuesta-card__correo">{{ respuesta.respondedor.correo }}</p>
            </div>
            <div class="respuesta-card__meta">
              <p class="respuesta-card__fecha">{{ formatearFecha(respuesta.fecha_respuesta) }}</p>
              <span class="respuesta-card__toggle">Ver respuestas</span>
            </div>
          </summary>

          <div class="respuesta-card__detalle">
            <div
              v-for="detalle in respuesta.detalles"
              :key="`${respuesta.id}-${detalle.pregunta_id}`"
              class="respuesta-card__item"
            >
              <p class="respuesta-card__seccion">{{ detalle.seccion_titulo }}</p>
              <h4>{{ detalle.enunciado }}</h4>
              <p v-if="detalle.texto_respuesta">{{ detalle.texto_respuesta }}</p>
              <ul v-else class="respuesta-card__lista">
                <li v-for="opcion in detalle.opciones" :key="opcion.id">{{ opcion.texto }}</li>
              </ul>
            </div>
          </div>
        </details>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { onIonViewWillEnter } from '@ionic/vue';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from '../components/AppShell.vue';
import PageHeader from '../components/PageHeader.vue';
import { obtenerUsuarioAutenticado } from '../services/auth';
import {
  obtenerRespuestasRecibidas,
  type RespuestasRecibidasEncuesta
} from '../services/encuestas';

interface SegmentoGrafica {
  texto: string;
  cantidad: number;
  porcentaje: number;
  color: string;
}

interface PreguntaGrafica {
  preguntaId: number;
  seccionTitulo: string;
  enunciado: string;
  tipo: string;
  totalVotos: number;
  segmentos: SegmentoGrafica[];
}

const PALETA = ['#175cd3', '#0f766e', '#ea580c', '#7c3aed', '#dc2626', '#0891b2', '#65a30d'];

const ruta = useRoute();
const usuario = obtenerUsuarioAutenticado();
const cargando = ref(false);
const datosEncuesta = ref<RespuestasRecibidasEncuesta | null>(null);

const preguntasGraficables = computed<PreguntaGrafica[]>(() => {
  if (!datosEncuesta.value) {
    return [];
  }

  const preguntas = new Map<
    number,
    {
      preguntaId: number;
      seccionTitulo: string;
      enunciado: string;
      tipo: string;
      conteo: Map<string, number>;
    }
  >();

  for (const respuesta of datosEncuesta.value.respuestas) {
    for (const detalle of respuesta.detalles) {
      if (!['opcion_unica', 'opcion_multiple'].includes(detalle.tipo)) {
        continue;
      }

      if (!preguntas.has(detalle.pregunta_id)) {
        preguntas.set(detalle.pregunta_id, {
          preguntaId: detalle.pregunta_id,
          seccionTitulo: detalle.seccion_titulo,
          enunciado: detalle.enunciado,
          tipo: detalle.tipo,
          conteo: new Map()
        });
      }

      const pregunta = preguntas.get(detalle.pregunta_id)!;

      for (const opcion of detalle.opciones) {
        const clave = opcion.texto;
        pregunta.conteo.set(clave, (pregunta.conteo.get(clave) || 0) + 1);
      }
    }
  }

  return [...preguntas.values()]
    .map((pregunta) => {
      const totalVotos = [...pregunta.conteo.values()].reduce((acumulado, valor) => acumulado + valor, 0);

      if (totalVotos === 0) {
        return null;
      }

      const segmentos = [...pregunta.conteo.entries()].map(([texto, cantidad], indice) => ({
        texto,
        cantidad,
        porcentaje: (cantidad / totalVotos) * 100,
        color: PALETA[indice % PALETA.length]
      }));

      return {
        preguntaId: pregunta.preguntaId,
        seccionTitulo: pregunta.seccionTitulo,
        enunciado: pregunta.enunciado,
        tipo: pregunta.tipo,
        totalVotos,
        segmentos
      };
    })
    .filter((pregunta): pregunta is PreguntaGrafica => Boolean(pregunta));
});

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleString('es-CO');
}

function construirGradiente(segmentos: SegmentoGrafica[]) {
  let acumulado = 0;

  const partes = segmentos.map((segmento) => {
    const inicio = acumulado;
    acumulado += segmento.porcentaje;
    return `${segmento.color} ${inicio}% ${acumulado}%`;
  });

  return `conic-gradient(${partes.join(', ')})`;
}

async function cargarRespuestas() {
  const encuestaId = Number(ruta.params.id);

  if (!usuario || !encuestaId) {
    datosEncuesta.value = null;
    return;
  }

  try {
    cargando.value = true;
    datosEncuesta.value = await obtenerRespuestasRecibidas(encuestaId, usuario.id);
  } catch (error) {
    console.error('No se pudieron cargar las respuestas:', error);
    datosEncuesta.value = null;
  } finally {
    cargando.value = false;
  }
}

onIonViewWillEnter(() => {
  cargarRespuestas();
});
</script>

<style scoped>
.resultados-panel__resumen {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.estado-vacio--interno {
  margin-top: 0;
}

.graficas-grid {
  display: grid;
  gap: 1rem;
}

.grafica-card {
  border: 1px solid rgba(23, 92, 211, 0.08);
  border-radius: 20px;
  padding: 1.25rem;
  background: rgba(248, 251, 255, 0.75);
}

.grafica-card__encabezado h3 {
  margin: 0 0 0.35rem;
  color: #162033;
}

.grafica-card__seccion,
.grafica-card__tipo {
  margin: 0;
  color: #5a6475;
}

.grafica-card__seccion {
  margin-bottom: 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #175cd3;
  font-size: 0.75rem;
  font-weight: 700;
}

.grafica-card__contenido {
  display: grid;
  grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: center;
  margin-top: 1rem;
}

.pastel-wrapper {
  display: flex;
  justify-content: center;
}

.pastel-grafica {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pastel-grafica__centro {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  display: grid;
  place-items: center;
  text-align: center;
  color: #162033;
}

.pastel-grafica__centro strong {
  font-size: 1.4rem;
  line-height: 1;
}

.pastel-grafica__centro span {
  font-size: 0.8rem;
  color: #5a6475;
}

.grafica-card__leyenda {
  display: grid;
  gap: 0.75rem;
}

.leyenda-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.75rem;
  align-items: start;
}

.leyenda-item__color {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  margin-top: 0.25rem;
}

.leyenda-item strong,
.leyenda-item p {
  margin: 0;
}

.leyenda-item p {
  color: #5a6475;
}

.respuesta-card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(23, 92, 211, 0.08);
  box-shadow: 0 16px 40px rgba(22, 32, 51, 0.08);
  border-radius: 24px;
  padding: 0;
  overflow: hidden;
}

.respuesta-card[open] .respuesta-card__toggle {
  color: #175cd3;
}

.respuesta-card__encabezado {
  list-style: none;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.4rem;
  cursor: pointer;
}

.respuesta-card__encabezado::-webkit-details-marker {
  display: none;
}

.respuesta-card__meta {
  text-align: right;
}

.respuesta-card__toggle {
  display: inline-block;
  margin-top: 0.4rem;
  font-weight: 700;
  color: #5a6475;
}

.respuesta-card__etiqueta,
.respuesta-card__seccion {
  margin: 0 0 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #175cd3;
  font-size: 0.75rem;
  font-weight: 700;
}

.respuesta-card__correo,
.respuesta-card__fecha {
  margin: 0;
  color: #5a6475;
}

.respuesta-card__detalle {
  display: grid;
  gap: 0.9rem;
  padding: 0 1.4rem 1.4rem;
}

.respuesta-card__item {
  border-top: 1px solid rgba(148, 163, 184, 0.22);
  padding-top: 0.9rem;
}

.respuesta-card__item h4 {
  margin: 0 0 0.4rem;
  color: #162033;
}

.respuesta-card__item p {
  margin: 0;
  color: #425067;
  line-height: 1.5;
}

.respuesta-card__lista {
  margin: 0;
  padding-left: 1rem;
  color: #425067;
}

@media (max-width: 768px) {
  .grafica-card__contenido,
  .respuesta-card__encabezado {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .respuesta-card__meta {
    text-align: left;
  }
}
</style>
