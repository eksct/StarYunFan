<template>
  <div class="page container fade-in">
    <header class="page-head">
      <h1>友链</h1>
      <p class="muted">朋友们的小站。</p>
    </header>

    <div class="grid">
      <a
        v-for="friend in friends"
        :key="friend.url"
        class="card card-pad friend"
        :href="friend.url"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="friend-top">
          <span class="friend-badge" aria-hidden="true">{{ friend.name.slice(0, 1) }}</span>
          <span class="friend-name">{{ friend.name }}</span>
        </div>
        <p class="friend-desc">{{ friend.description }}</p>
        <p class="dim friend-host">{{ hostOf(friend.url) }}</p>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { friends } from '@/content/site'

defineOptions({ name: 'FriendsView' })

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
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.friend {
  display: block;
  color: inherit;
  text-decoration: none;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.friend:hover {
  border-color: var(--c-accent-border);
  transform: translateY(-2px);
}

.friend-top {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.friend-badge {
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
  border-radius: 50%;
}

.friend-name {
  font-size: var(--fs-lg);
  font-weight: 600;
  color: var(--c-text);
}

.friend-desc {
  margin: 0.65rem 0 0.5rem;
  font-size: var(--fs-sm);
  color: var(--c-text-2);
  line-height: 1.6;
}

.friend-host {
  margin: 0;
  font-size: var(--fs-xs);
  font-family: var(--font-mono);
}
</style>
