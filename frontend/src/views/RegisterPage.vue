<template>
  <ion-page>
    <ion-content class="autenticacion-contenido" fullscreen>
      <AuthCard
        titulo="Crear cuenta"
        subtitulo="Registra nombre, correo y contrasena."
        textoEnlace="Ya tienes cuenta?"
        etiquetaEnlace="Inicia sesion"
        rutaEnlace="/login"
      >
        <ion-list lines="none">
          <ion-item>
            <ion-input
              v-model="formulario.nombre"
              label="Nombre"
              label-placement="stacked"
              type="text"
              placeholder="Tu nombre"
            />
          </ion-item>

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

        <ion-button expand="block" :disabled="cargando" @click="manejarRegistro">
          {{ cargando ? 'Registrando...' : 'Crear cuenta' }}
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
  IonText
} from '@ionic/vue';
import { reactive, ref } from 'vue';
import AuthCard from '../components/AuthCard.vue';
import { registrarUsuario } from '../services/auth';

const formulario = reactive({
  nombre: '',
  correo: '',
  password: ''
});

const cargando = ref(false);
const mensaje = ref('');
const tipoMensaje = ref<'success' | 'danger'>('success');

async function manejarRegistro() {
  mensaje.value = '';

  if (!formulario.nombre || !formulario.correo || !formulario.password) {
    tipoMensaje.value = 'danger';
    mensaje.value = 'Debes completar todos los campos.';
    return;
  }

  try {
    cargando.value = true;
    const respuesta = await registrarUsuario(formulario);
    tipoMensaje.value = 'success';
    mensaje.value = respuesta.message;
    formulario.nombre = '';
    formulario.correo = '';
    formulario.password = '';
  } catch (error: any) {
    tipoMensaje.value = 'danger';
    mensaje.value = error.response?.data?.message || 'No se pudo registrar el usuario.';
  } finally {
    cargando.value = false;
  }
}
</script>
