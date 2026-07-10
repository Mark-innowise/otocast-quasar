<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-2" style="overflow: hidden;">
    <q-img
      src="back.jpg"
      class="fit absolute blurred-bg"
    />
    <div class="bg-overlay fit absolute" />
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.blurred-bg {
  filter: blur(8px);
  transform: scale(1.08);
}

/* Flattens the photo gradient into a calmer, more even backdrop. */
.bg-overlay {
  background: rgba(28, 32, 40, 0.72);
}
</style>