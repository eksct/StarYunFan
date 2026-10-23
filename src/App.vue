<script setup lang="ts">
import SeigaNav from './Component/SeigaNav.vue'
import CathedralBackground from './Component/CathedralBackground.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
function focusMain() { document.getElementById('main-content')?.focus() }
</script>

<template>
  <div class="app-shell" :data-page="route.name">
    <cathedral-background />
    <a href="#main-content" class="skip-link" @click.prevent="focusMain">跳到正文</a>
    <seiga-nav />
    <main id="main-content" tabindex="-1"><router-view /></main>
  </div>
</template>

<style>
.app-shell {
  min-height: 100vh;
  isolation: isolate;
}
.app-shell[data-page="about"] .card { box-shadow: -10px 0 36px -28px #9ba7df, 12px 0 36px -28px #d3b693; }
</style>
