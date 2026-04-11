<template>
  <ion-page>
    <ion-content fullscreen>
      <div class="pagina-contenedor">
        <section class="pagina-encabezado">
          <div>
            <p class="pagina-encabezado__etiqueta">Seguimiento</p>
            <h1 class="pagina-encabezado__titulo">Mis respuestas</h1>
            <p class="pagina-encabezado__texto">
              Esta seccion quedo lista como base para mostrar el historial de
              respuestas del usuario.
            </p>
          </div>
        </section>

        <div class="estado-vacio">
          Aun no hay respuestas registradas en esta base inicial.
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
</script>
