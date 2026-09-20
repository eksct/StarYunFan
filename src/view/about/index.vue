<template>
  <div class="page container fade-in">
    <section class="head">
      <img :src="profile.avatar" :alt="profile.name" class="avatar" />
      <div>
        <h1 class="name">{{ profile.name }}</h1>
        <p class="tagline">{{ profile.tagline }}</p>
        <p class="meta">
          <span>{{ profile.location }}</span>
          <template v-if="profile.email">
            <span class="dot">·</span>
            <a :href="`mailto:${profile.email}`">{{ profile.email }}</a>
          </template>
        </p>
      </div>
    </section>

    <section class="block">
      <h2 class="section-title">关于我</h2>
      <p class="intro">{{ profile.intro }}</p>
    </section>

    <section class="block">
      <h2 class="section-title">技能</h2>
      <div class="skill-grid">
        <div v-for="group in skillGroups" :key="group.name" class="card card-pad skill-card">
          <div class="skill-head">
            <h3>{{ group.name }}</h3>
            <span class="dim">{{ group.summary }}</span>
          </div>
          <div class="row chips">
            <span v-for="item in group.items" :key="item" class="chip chip-static">{{ item }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="block">
      <h2 class="section-title">经历</h2>
      <ol class="timeline">
        <li v-for="item in experiences" :key="item.role" class="timeline-item">
          <span class="timeline-dot" aria-hidden="true"></span>
          <div class="timeline-body">
            <div class="timeline-top">
              <h3>{{ item.role }}</h3>
              <span class="dim">{{ item.period }}</span>
            </div>
            <p class="dim org">{{ item.org }}</p>
            <p>{{ item.description }}</p>
          </div>
        </li>
      </ol>
    </section>

    <section class="block">
      <h2 class="section-title">教育</h2>
      <ol class="timeline">
        <li v-for="item in education" :key="item.school" class="timeline-item">
          <span class="timeline-dot" aria-hidden="true"></span>
          <div class="timeline-body">
            <div class="timeline-top">
              <h3>{{ item.school }}</h3>
              <span class="dim">{{ item.period }}</span>
            </div>
            <p class="dim">{{ item.major }}</p>
          </div>
        </li>
      </ol>
    </section>

    <section class="block">
      <h2 class="section-title">兴趣</h2>
      <div class="row chips">
        <span v-for="hobby in hobbies" :key="hobby" class="chip chip-static">{{ hobby }}</span>
      </div>
    </section>

    <section class="block">
      <h2 class="section-title">联系</h2>
      <div class="row">
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
    </section>
  </div>
</template>

<script setup lang="ts">
import { education, experiences, hobbies, profile, skillGroups, socialLinks } from '@/content/site'

defineOptions({ name: 'AboutView' })
</script>

<style scoped lang="scss">
.page {
  max-width: 820px;
}

.head {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--c-border);
}

.avatar {
  width: 5rem;
  height: 5rem;
  flex-shrink: 0;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--c-border);
}

.name {
  font-size: var(--fs-2xl);
}

.tagline {
  color: var(--c-text);
}

.meta {
  font-size: var(--fs-sm);
  color: var(--c-text-3);
}

.dot {
  margin: 0 0.4rem;
}

.block {
  margin-top: 2.5rem;
}

.intro {
  line-height: 1.7;
}

.skill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.skill-head {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.skill-head h3 {
  font-size: var(--fs-base);
}

.skill-head span {
  font-size: var(--fs-xs);
}

.chips {
  gap: 0.4rem;
}

.chip-static {
  cursor: default;
}

.timeline {
  list-style: none;
  padding: 0;
  margin: 0;
  border-left: 1px solid var(--c-border);
}

.timeline-item {
  position: relative;
  padding: 0 0 1.5rem 1.5rem;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -4px;
  top: 0.55rem;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--c-accent);
}

.timeline-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.timeline-top h3 {
  font-size: var(--fs-base);
}

.timeline-top span {
  font-size: var(--fs-sm);
  flex-shrink: 0;
}

.timeline-body p {
  margin: 0;
  font-size: var(--fs-sm);
}

.org {
  margin-bottom: 0.25rem !important;
}

@media (max-width: 640px) {
  .timeline-top {
    flex-direction: column;
    gap: 0.1rem;
  }
}
</style>
