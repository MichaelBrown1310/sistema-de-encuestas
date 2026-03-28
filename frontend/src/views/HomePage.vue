<template>
  <ion-page>
    <ion-content fullscreen>
      <div class="home-wrapper">
        <ion-card class="home-card">
          <ion-card-content>
            <p class="home-eyebrow">Panel principal</p>
            <h1 class="home-title">Bienvenido {{ userName }}</h1>
            <p class="home-text">
              Pagina principal para encuestas
            </p>

            <ion-button expand="block" @click="handleLogout">
              Cerrar sesion
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonContent, IonPage } from '@ionic/vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { clearAuthUser, getAuthUser } from '../services/auth';

const router = useRouter();
const user = getAuthUser();

const userName = computed(() => user?.nombre || 'usuario');

async function handleLogout() {
  clearAuthUser();
  await router.replace('/login');
}
</script>
