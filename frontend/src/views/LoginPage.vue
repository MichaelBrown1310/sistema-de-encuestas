<template>
  <ion-page>
    <ion-content class="autenticacion-contenido" fullscreen>
      <AuthCard
        titulo="Iniciar sesion"
        subtitulo="Ingresa con tu correo y contrasena."
        textoEnlace="No tienes cuenta?"
        etiquetaEnlace="Registrate"
        rutaEnlace="/register"
      >
        <ion-list lines="none">
          <ion-item>
            <ion-input
              v-model="formulario.correo"
              label="Correo"
              label-placement="stacked"
              type="email"
              placeholder="correo@ejemplo.com"
            />
          </ion-item>

          <ion-item>
            <ion-input
              v-model="formulario.password"
              label="Contrasena"
              label-placement="stacked"
              type="password"
              placeholder="********"
            />
          </ion-item>
        </ion-list>

        <ion-button expand="block" :disabled="cargando" @click="manejarInicioSesion">
          {{ cargando ? 'Ingresando...' : 'Entrar' }}
        </ion-button>

        <ion-text v-if="mensaje" :color="tipoMensaje">
          <p>{{ mensaje }}</p>
        </ion-text>
      </AuthCard>
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
  IonText,
  onIonViewWillEnter
} from '@ionic/vue';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthCard from '../components/AuthCard.vue';
import { guardarUsuarioAutenticado, iniciarSesion } from '../services/auth';

const enrutador = useRouter();

const formulario = reactive({
  correo: '',
  password: ''
});

const cargando = ref(false);
const mensaje = ref('');
const tipoMensaje = ref<'success' | 'danger'>('success');

function limpiarFormulario() {
  formulario.correo = '';
  formulario.password = '';
  mensaje.value = '';
  tipoMensaje.value = 'success';
}

onIonViewWillEnter(() => {
  limpiarFormulario();
});

async function manejarInicioSesion() {
  mensaje.value = '';

  if (!formulario.correo || !formulario.password) {
    tipoMensaje.value = 'danger';
    mensaje.value = 'Debes completar correo y contrasena.';
    return;
  }

  try {
    cargando.value = true;
    const respuesta = await iniciarSesion(formulario);
    guardarUsuarioAutenticado(respuesta.user);
    tipoMensaje.value = 'success';
    mensaje.value = respuesta.message;
    await enrutador.push('/home');
  } catch (error: any) {
    tipoMensaje.value = 'danger';
    mensaje.value = error.response?.data?.message || 'No se pudo iniciar sesion.';
  } finally {
    cargando.value = false;
  }
}
</script>
