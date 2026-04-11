<template>
  <ion-page>
    <ion-content fullscreen>
      <div class="panel-contenedor">
        <section class="hero-panel">
          <div>
            <p class="hero-panel__etiqueta">Tu espacio de encuestas</p>
            <h1 class="hero-panel__titulo">Bienvenido {{ nombreUsuario }}</h1>
            <p class="hero-panel__texto">
              Desde aqui puedes crear encuestas, revisar tus formularios publicados
              y seguir el avance de tus respuestas.
            </p>
          </div>

          <div class="hero-panel__acciones">
            <ion-button router-link="/encuestas/crear">Crear encuesta</ion-button>
            <ion-button fill="outline" router-link="/encuestas/explorar">
              Explorar encuestas
            </ion-button>
          </div>
        </section>

        <section class="metricas-grid">
          <article class="tarjeta-metrica">
            <p class="tarjeta-metrica__etiqueta">Mis encuestas</p>
            <h2 class="tarjeta-metrica__valor">{{ resumen.totalEncuestas }}</h2>
            <p class="tarjeta-metrica__detalle">Encuestas creadas por ti</p>
          </article>

          <article class="tarjeta-metrica">
            <p class="tarjeta-metrica__etiqueta">Publicadas</p>
            <h2 class="tarjeta-metrica__valor">{{ resumen.totalPublicadas }}</h2>
            <p class="tarjeta-metrica__detalle">Listas para recibir respuestas</p>
          </article>

          <article class="tarjeta-metrica">
            <p class="tarjeta-metrica__etiqueta">Borradores</p>
            <h2 class="tarjeta-metrica__valor">{{ resumen.totalBorradores }}</h2>
            <p class="tarjeta-metrica__detalle">Pendientes por completar</p>
          </article>
        </section>

        <section class="seccion-panel">
          <div class="seccion-panel__encabezado">
            <div>
              <p class="seccion-panel__etiqueta">Actividad reciente</p>
              <h2 class="seccion-panel__titulo">Tus ultimas encuestas</h2>
            </div>

            <ion-button fill="clear" router-link="/encuestas">Ver todas</ion-button>
          </div>

          <div v-if="cargando" class="estado-vacio">Cargando informacion...</div>
          <div v-else-if="encuestas.length === 0" class="estado-vacio">
            Aun no has creado encuestas. Comienza con tu primera encuesta.
          </div>
          <div v-else class="lista-panel">
            <article v-for="encuesta in encuestas" :key="encuesta.id" class="tarjeta-encuesta">
              <div>
                <p class="tarjeta-encuesta__estado">{{ encuesta.estado }}</p>
                <h3 class="tarjeta-encuesta__titulo">{{ encuesta.titulo }}</h3>
                <p class="tarjeta-encuesta__descripcion">{{ encuesta.descripcion }}</p>
              </div>
              <p class="tarjeta-encuesta__fecha">
                Creada el {{ formatearFecha(encuesta.fecha_creacion) }}
              </p>
            </article>
          </div>
        </section>

        <section class="accesos-grid">
          <router-link to="/encuestas" class="acceso-panel">
            <p class="acceso-panel__etiqueta">Gestion</p>
            <h3>Mis encuestas</h3>
            <span>Consulta tus formularios y su estado.</span>
          </router-link>

          <router-link to="/encuestas/explorar" class="acceso-panel">
            <p class="acceso-panel__etiqueta">Descubrir</p>
            <h3>Explorar</h3>
            <span>Encuentra encuestas publicadas para responder.</span>
          </router-link>

          <router-link to="/respuestas" class="acceso-panel">
            <p class="acceso-panel__etiqueta">Seguimiento</p>
            <h3>Mis respuestas</h3>
            <span>Revisa el historial de participaciones.</span>
          </router-link>

          <button class="acceso-panel acceso-panel--boton" @click="cerrarSesion">
            <p class="acceso-panel__etiqueta">Sesion</p>
            <h3>Cerrar sesion</h3>
            <span>Salir y volver al inicio de sesion.</span>
          </button>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonContent, IonPage, onIonViewWillEnter } from '@ionic/vue';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { limpiarUsuarioAutenticado, obtenerUsuarioAutenticado } from '../services/auth';
import { obtenerEncuestasUsuario, obtenerResumenUsuario, type Encuesta } from '../services/encuestas';

const enrutador = useRouter();
const usuario = obtenerUsuarioAutenticado();
const nombreUsuario = usuario?.nombre || 'usuario';

const cargando = ref(false);
const encuestas = ref<Encuesta[]>([]);
const resumen = reactive({
  totalEncuestas: 0,
  totalPublicadas: 0,
  totalBorradores: 0
});

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-CO');
}

async function cargarPanel() {
  if (!usuario) {
    return;
  }

  try {
    cargando.value = true;

    const [datosResumen, datosEncuestas] = await Promise.all([
      obtenerResumenUsuario(usuario.id),
      obtenerEncuestasUsuario(usuario.id)
    ]);

    resumen.totalEncuestas = datosResumen.totalEncuestas;
    resumen.totalPublicadas = datosResumen.totalPublicadas;
    resumen.totalBorradores = datosResumen.totalBorradores;
    encuestas.value = datosEncuestas.slice(0, 3);
  } catch (error) {
    console.error('No se pudo cargar el panel:', error);
  } finally {
    cargando.value = false;
  }
}

async function cerrarSesion() {
  limpiarUsuarioAutenticado();
  await enrutador.replace('/login');
}

onIonViewWillEnter(() => {
  cargarPanel();
});
</script>
