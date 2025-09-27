<script setup lang="ts">
import SeigaNav from './Component/SeigaNav.vue';
</script>

<template>
  <div id="app">
    <seiga-nav />
    <router-view />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  background-image: url('/src/assets/img/bg001.jpeg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

#app {
  min-height: 100vh;
  background: rgba(0, 0, 0, 0.2);
}

</style>
