<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-2" style="overflow: hidden;">
    <q-img
      src="back.jpg"
      class="fit absolute blurred-bg"
    />
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.blurred-bg {
  filter: blur(3px); 
  transform: scale(1.08); 
}
</style>