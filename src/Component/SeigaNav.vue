<template>
  <header class="nav">
    <div class="nav-inner">
      <router-link to="/" class="nav-logo">Seiga</router-link>

      <nav class="nav-links" aria-label="主导航">
        <router-link
          v-for="item in internalLinks"
          :key="item.url"
          :to="item.url"
          class="nav-link"
          :class="{ 'is-active': isActive(item.url) }"
        >
          {{ item.name }}
        </router-link>

        <a
          v-for="link in socialLinks"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="nav-link nav-external"
        >
          {{ link.label }}
          <svg class="nav-ext-icon" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 9L9 3M9 3H4.5M9 3v4.5" fill="none" stroke="currentColor" stroke-width="1.2"
              stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </a>
      </nav>

      <button
        type="button"
        class="nav-theme"
        :aria-label="theme === 'dark' ? '切换到浅色' : '切换到深色'"
        @click="toggleTheme"
      >
        <svg v-if="theme === 'dark'" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" stroke-width="1.4" />
          <path d="M10 2.4v2M10 15.6v2M2.4 10h2M15.6 10h2M4.6 4.6l1.4 1.4M14 14l1.4 1.4M15.4 4.6L14 6M6 14l-1.4 1.4"
            fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
        </svg>
        <svg v-else viewBox="0 0 20 20" aria-hidden="true">
          <path d="M15.5 12.6A6.2 6.2 0 0 1 7.4 4.5a6.4 6.4 0 1 0 8.1 8.1Z"
            fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { socialLinks } from '@/content/site'
import { theme, toggleTheme } from '@/composables/useTheme'

const route = useRoute()

const internalLinks = [
  { name: '首页', url: '/' },
  { name: '关于', url: '/about' },
  { name: '笔记', url: '/notes' },
  { name: '时间线', url: '/timeline' },
  { name: '项目', url: '/projects' },
]

// 笔记详情页也要高亮"笔记"
const isActive = (url: string) => url === '/'
  ? route.path === '/'
  : route.path === url || route.path.startsWith(`${url}/`)
</script>

<style scoped lang="scss">
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--c-surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--c-border);
}

.nav-inner {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-logo {
  font-size: var(--fs-lg);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--c-text);
  flex-shrink: 0;
}

.nav-logo:hover {
  color: var(--c-accent);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.nav-links::-webkit-scrollbar {
  display: none;
}

.nav-link {
  position: relative;
  padding: 0.35rem 0.6rem;
  font-size: var(--fs-sm);
  color: var(--c-text-2);
  white-space: nowrap;
  border-radius: var(--radius-sm);
  transition: color 0.15s ease, background-color 0.15s ease;
}

.nav-link:hover {
  color: var(--c-text);
  background: var(--c-surface-strong);
}

.nav-link.is-active {
  color: var(--c-text);
}

.nav-link.is-active::after {
  content: "";
  position: absolute;
  left: 0.6rem;
  right: 0.6rem;
  bottom: -0.1rem;
  height: 2px;
  background: var(--c-accent);
  border-radius: 2px;
}

.nav-external {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.nav-ext-icon {
  width: 10px;
  height: 10px;
  opacity: 0.6;
}

.nav-theme {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  color: var(--c-text-2);
  background: transparent;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-theme:hover {
  color: var(--c-accent);
  border-color: var(--c-accent-border);
}

.nav-theme svg {
  width: 16px;
  height: 16px;
}

@media (max-width: 640px) {
  .nav-inner {
    padding: 0.6rem 1rem;
    gap: 0.75rem;
  }

  .nav-logo {
    font-size: var(--fs-base);
  }
}
</style>
