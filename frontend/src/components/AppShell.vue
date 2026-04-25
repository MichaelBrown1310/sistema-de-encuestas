<template>
  <ion-page>
    <ion-content :class="contentClass" fullscreen>
      <AppNavbar />
      <div class="pagina-contenedor">
        <slot />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import AppNavbar from './AppNavbar.vue';

withDefaults(
  defineProps<{
    contentClass?: string;
  }>(),
  {
    contentClass: ''
  }
);
</script>
