<script setup lang="ts">
import SeigaNav from './Component/SeigaNav.vue'
import VoronoiBackground from './Component/VoronoiBackground.vue'
function focusMain() { document.getElementById('main-content')?.focus() }
</script>

<template>
  <div class="app-shell">
    <voronoi-background />
    <a href="#main-content" class="skip-link" @click.prevent="focusMain">跳到正文</a>
    <seiga-nav />
    <main id="main-content" tabindex="-1"><router-view /></main>
  </div>
</template>

<style>
.app-shell {
  min-height: 100vh;
}
</style>
