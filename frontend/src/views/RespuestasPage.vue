<template>
  <AppShell>
    <PageHeader
      etiqueta="Seguimiento"
      titulo="Mis respuestas"
      descripcion="Esta seccion quedo lista como base para mostrar el historial de respuestas del usuario."
    />

    <div class="estado-vacio">
      Aun no hay respuestas registradas en esta base inicial.
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '../components/AppShell.vue';
import PageHeader from '../components/PageHeader.vue';
</script>
