<template>
  <div class="page container fade-in">
    <header class="page-head">
      <h1>工具</h1>
      <p class="muted">常用的在线工具入口，点卡片直达。</p>
    </header>

    <div class="grid">
      <a
        v-for="tool in tools"
        :key="tool.url"
        class="card card-pad tool"
        :href="tool.url"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="tool-top">
          <span class="tool-badge" aria-hidden="true">{{ tool.name.slice(0, 1) }}</span>
          <span class="tool-name">{{ tool.name }}</span>
        </div>
        <p class="tool-desc">{{ tool.description }}</p>
        <p class="tool-host dim">{{ hostOf(tool.url) }}</p>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { tools } from '@/content/site'

defineOptions({ name: 'ToolsView' })

function hostOf(url: string) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
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
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.tool {
  display: block;
  color: inherit;
  text-decoration: none;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.tool:hover {
  border-color: var(--c-accent-border);
  transform: translateY(-2px);
}

.tool-top {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.tool-badge {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--c-accent);
  background: var(--c-accent-soft);
  border: 1px solid var(--c-accent-border);
  border-radius: var(--radius-sm);
}

.tool-name {
  font-size: var(--fs-lg);
  font-weight: 600;
  color: var(--c-text);
}

.tool-desc {
  margin: 0.65rem 0 0.5rem;
  font-size: var(--fs-sm);
  color: var(--c-text-2);
  line-height: 1.6;
}

.tool-host {
  margin: 0;
  font-size: var(--fs-xs);
  font-family: var(--font-mono);
}
</style>
