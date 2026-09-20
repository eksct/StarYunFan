<script setup lang="ts">
import SeigaNav from './Component/SeigaNav.vue'
import VoronoiBackground from './Component/VoronoiBackground.vue'
</script>

<template>
  <div id="app">
    <voronoi-background />
    <seiga-nav />
    <router-view />
  </div>
</template>

<style>
#app {
  min-height: 100vh;
}
</style>
