<template>
  <ion-page>
    <ion-content class="auth-content" fullscreen>
      <div class="auth-wrapper">
        <ion-card class="auth-card">
          <ion-card-content>
            <h1 class="auth-title">Crear cuenta</h1>
            <p class="auth-subtitle">Registra nombre, correo y contraseña.</p>

            <ion-list lines="none">
              <ion-item>
                <ion-input
                  v-model="form.nombre"
                  label="Nombre"
                  label-placement="stacked"
                  type="text"
                  placeholder="Tu nombre"
                />
              </ion-item>

              <ion-item>
                <ion-input
                  v-model="form.correo"
                  label="Correo"
                  label-placement="stacked"
                  type="email"
                  placeholder="correo@ejemplo.com"
                />
              </ion-item>

              <ion-item>
                <ion-input
                  v-model="form.password"
                  label="Contraseña"
                  label-placement="stacked"
                  type="password"
                  placeholder="********"
                />
              </ion-item>
            </ion-list>

            <ion-button expand="block" :disabled="loading" @click="handleRegister">
              {{ loading ? 'Registrando...' : 'Crear cuenta' }}
            </ion-button>

            <ion-text v-if="message" :color="messageType">
              <p>{{ message }}</p>
            </ion-text>

            <p class="auth-link">
              ¿Ya tienes cuenta?
              <router-link to="/login">Inicia sesión</router-link>
            </p>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonText
} from '@ionic/vue';
import { reactive, ref } from 'vue';
import { registerUser } from '../services/auth';

const form = reactive({
  nombre: '',
  correo: '',
  password: ''
});

const loading = ref(false);
const message = ref('');
const messageType = ref<'success' | 'danger'>('success');

async function handleRegister() {
  message.value = '';

  if (!form.nombre || !form.correo || !form.password) {
    messageType.value = 'danger';
    message.value = 'Debes completar todos los campos.';
    return;
  }

  try {
    loading.value = true;
    const response = await registerUser(form);
    messageType.value = 'success';
    message.value = response.message;
    form.nombre = '';
    form.correo = '';
    form.password = '';
  } catch (error: any) {
    messageType.value = 'danger';
    message.value = error.response?.data?.message || 'No se pudo registrar el usuario.';
  } finally {
    loading.value = false;
  }
}
</script>
