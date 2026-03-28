<template>
  <ion-page>
    <ion-content class="auth-content" fullscreen>
      <div class="auth-wrapper">
        <ion-card class="auth-card">
          <ion-card-content>
            <h1 class="auth-title">Iniciar sesion</h1>
            <p class="auth-subtitle">Ingresa con tu correo y contrasena.</p>

            <ion-list lines="none">
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
                  label="Contrasena"
                  label-placement="stacked"
                  type="password"
                  placeholder="********"
                />
              </ion-item>
            </ion-list>

            <ion-button expand="block" :disabled="loading" @click="handleLogin">
              {{ loading ? 'Ingresando...' : 'Entrar' }}
            </ion-button>

            <ion-text v-if="message" :color="messageType">
              <p>{{ message }}</p>
            </ion-text>

            <p class="auth-link">
              No tienes cuenta?
              <router-link to="/register">Registrate</router-link>
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
import { useRouter } from 'vue-router';
import { loginUser, saveAuthUser } from '../services/auth';

const router = useRouter();

const form = reactive({
  correo: '',
  password: ''
});

const loading = ref(false);
const message = ref('');
const messageType = ref<'success' | 'danger'>('success');

async function handleLogin() {
  message.value = '';

  if (!form.correo || !form.password) {
    messageType.value = 'danger';
    message.value = 'Debes completar correo y contrasena.';
    return;
  }

  try {
    loading.value = true;
    const response = await loginUser(form);
    saveAuthUser(response.user);
    messageType.value = 'success';
    message.value = response.message;
    await router.push('/home');
  } catch (error: any) {
    messageType.value = 'danger';
    message.value = error.response?.data?.message || 'No se pudo iniciar sesion.';
  } finally {
    loading.value = false;
  }
}
</script>
