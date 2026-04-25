<template>
  <div class="autenticacion-contenedor">
    <ion-card class="autenticacion-tarjeta">
      <ion-card-content>
        <h1 class="autenticacion-titulo">{{ titulo }}</h1>
        <p class="autenticacion-subtitulo">{{ subtitulo }}</p>

        <slot />

        <p class="autenticacion-enlace">
          {{ textoEnlace }}
          <router-link :to="rutaEnlace">{{ etiquetaEnlace }}</router-link>
        </p>
      </ion-card-content>
    </ion-card>
  </div>
</template>

<script setup lang="ts">
import { IonCard, IonCardContent } from '@ionic/vue';

defineProps<{
  titulo: string;
  subtitulo: string;
  textoEnlace: string;
  etiquetaEnlace: string;
  rutaEnlace: string;
}>();
</script>
