<template>
  <article class="tarjeta-encuesta">
    <div>
      <p class="tarjeta-encuesta__estado">{{ estado }}</p>
      <h3 class="tarjeta-encuesta__titulo">{{ titulo }}</h3>
      <p class="tarjeta-encuesta__descripcion">{{ descripcion }}</p>
    </div>

    <div class="tarjeta-encuesta__acciones">
      <p class="tarjeta-encuesta__fecha">{{ detalle }}</p>
      <slot name="actions" />
    </div>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  estado: string;
  titulo: string;
  descripcion: string;
  detalle: string;
}>();
</script>
