<template>
  <div class="page container fade-in">
    <header class="page-head">
      <h1>项目</h1>
      <p class="muted">记录做过的东西，包括还在维护的。</p>
    </header>

    <div class="grid">
      <article v-for="project in projects" :key="project.name" class="card card-pad project">
        <div class="project-top">
          <h2>{{ project.name }}</h2>
          <span class="chip chip-static status">{{ project.status }}</span>
        </div>

        <p class="project-period dim">{{ project.period }}</p>
        <p class="project-desc">{{ project.description }}</p>

        <div class="row chips">
          <span v-for="item in project.stack" :key="item" class="chip chip-static">{{ item }}</span>
        </div>

        <div v-if="project.url" class="project-link">
          <a :href="project.url" target="_blank" rel="noopener noreferrer" class="btn">查看</a>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { projects } from '@/content/site'

defineOptions({ name: 'ProjectsView' })
</script>

<style scoped lang="scss">
.page-head {
  margin-bottom: 2rem;
}

.page-head h1 {
  font-size: var(--fs-2xl);
}

.page-head p {
  margin-top: 0.35rem;
  font-size: var(--fs-sm);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.project-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.project-top h2 {
  font-size: var(--fs-lg);
}

.status {
  flex-shrink: 0;
  font-size: var(--fs-xs);
  color: var(--c-accent);
  background: var(--c-accent-soft);
  border-color: var(--c-accent-border);
}

.project-period {
  margin: 0.25rem 0 0.75rem;
  font-size: var(--fs-sm);
}

.project-desc {
  font-size: var(--fs-sm);
  margin-bottom: 1rem;
}

.chips {
  gap: 0.35rem;
}

.project-link {
  margin-top: 1rem;
}
</style>
