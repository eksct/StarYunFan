<template>
  <div class="page container fade-in">
    <h1>404</h1>
    <p class="muted">这个地址没有对应的页面。</p>
    <div class="row actions">
      <router-link to="/" class="btn btn-primary">回首页</router-link>
      <router-link to="/notes" class="btn">看笔记</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'NotFoundView' })
</script>

<style scoped lang="scss">
h1 {
  font-size: var(--fs-3xl);
}

.actions {
  margin-top: 1.5rem;
}
</style>
