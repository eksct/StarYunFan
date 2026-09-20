<template>
  <div class="page container fade-in">
    <section class="hero">
      <img :src="profile.avatar" :alt="profile.name" class="avatar" />

      <div class="hero-text">
        <h1 class="hero-name">{{ profile.name }}</h1>
        <p class="hero-tagline">{{ profile.tagline }}</p>
        <p class="hero-intro">{{ profile.intro }}</p>

        <div class="row hero-actions">
          <router-link to="/notes" class="btn btn-primary">浏览笔记</router-link>
          <a
            v-for="link in socialLinks"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn"
          >
            {{ link.label }}
          </a>
        </div>
      </div>
    </section>

    <section class="latest card card-pad">
      <div class="latest-head">
        <h2 class="section-title">最近更新</h2>
        <router-link to="/notes" class="latest-all">全部笔记 →</router-link>
      </div>

      <ul class="latest-list">
        <li v-for="note in latestNotes" :key="note.path">
          <a :href="noteUrl(note.path)" class="latest-item">
            <span class="latest-title">{{ note.title }}</span>
            <span class="latest-meta">{{ note.category }} · {{ formatDate(note.date) }}</span>
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { profile, socialLinks } from '@/content/site'
import { formatDate, getNotes, noteUrl } from '@/utils/notes'

defineOptions({ name: 'HomeView' })

const latestNotes = getNotes().slice(0, 5)
</script>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.hero {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  padding: 3rem 0 1rem;
}

.avatar {
  width: 6rem;
  height: 6rem;
  flex-shrink: 0;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--c-border);
}

.hero-name {
  font-size: var(--fs-3xl);
  margin-bottom: 0.25rem;
}

.hero-tagline {
  font-size: var(--fs-lg);
  color: var(--c-text);
  margin-bottom: 0.75rem;
}

.hero-intro {
  max-width: 46ch;
  margin-bottom: 1.5rem;
}

.hero-actions {
  gap: 0.5rem;
}

.latest-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.latest-head .section-title {
  margin-bottom: 0;
}

.latest-all {
  font-size: var(--fs-sm);
}

.latest-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.latest-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--c-border);
  color: var(--c-text);
}

.latest-list li:last-child .latest-item {
  border-bottom: 0;
}

.latest-item:hover .latest-title {
  color: var(--c-accent);
}

.latest-title {
  font-weight: 500;
  transition: color 0.15s ease;
}

.latest-meta {
  flex-shrink: 0;
  font-size: var(--fs-sm);
  color: var(--c-text-3);
}

@media (max-width: 640px) {
  .hero {
    flex-direction: column;
    gap: 1.25rem;
    padding-top: 1.5rem;
  }

  .hero-name {
    font-size: var(--fs-2xl);
  }

  .latest-item {
    flex-direction: column;
    gap: 0.15rem;
  }
}
</style>
