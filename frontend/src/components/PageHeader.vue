<template>
  <section class="pagina-encabezado">
    <div>
      <p class="pagina-encabezado__etiqueta">{{ etiqueta }}</p>
      <h1 class="pagina-encabezado__titulo">{{ titulo }}</h1>
      <p class="pagina-encabezado__texto">{{ descripcion }}</p>
      <p v-if="detalle" class="subdetalle-encuesta">{{ detalle }}</p>
    </div>

    <div v-if="$slots.actions" class="pagina-encabezado__acciones">
      <slot name="actions" />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  etiqueta: string;
  titulo: string;
  descripcion: string;
  detalle?: string;
}>();
</script>
