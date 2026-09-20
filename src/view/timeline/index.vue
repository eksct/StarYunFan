<template>
  <div class="page container fade-in">
    <header class="page-head">
      <h1>时间线</h1>
      <p class="muted">学习历程按时间倒序排列，笔记部分由构建脚本按文件时间自动生成。</p>
    </header>

    <section class="block">
      <h2 class="section-title">历程</h2>
      <ol class="tl">
        <li v-for="item in milestones" :key="item.date" class="tl-item">
          <div class="tl-date">{{ item.date }}</div>
          <div class="tl-body">
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </div>
        </li>
      </ol>
    </section>

    <section class="block">
      <h2 class="section-title">笔记归档</h2>
      <div v-for="group in monthGroups" :key="group.key" class="month">
        <div class="month-label">{{ group.label }}</div>
        <ul class="month-list">
          <li v-for="note in group.notes" :key="note.path">
            <a :href="noteUrl(note.path)" class="month-item">
              <span class="month-title">{{ note.title }}</span>
              <span class="dim">{{ note.category }}</span>
            </a>
          </li>
        </ul>
      </div>

      <div v-if="hasMore" class="more">
        <button type="button" class="btn" @click="loadMore">
          加载更多（剩余 {{ remaining }} 篇）
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { milestones } from '@/content/site'
import { getNotes, groupByMonth, noteUrl } from '@/utils/notes'

defineOptions({ name: 'TimelineView' })

const pageSize = 30
const allNotes = getNotes()
const visibleCount = ref(pageSize)

const monthGroups = computed(() => groupByMonth(allNotes.slice(0, visibleCount.value)))
const hasMore = computed(() => visibleCount.value < allNotes.length)
const remaining = computed(() => allNotes.length - visibleCount.value)

function loadMore() {
  visibleCount.value = Math.min(visibleCount.value + pageSize, allNotes.length)
}
</script>

<style scoped lang="scss">
.page-head {
  margin-bottom: 2.5rem;
}

.page-head h1 {
  font-size: var(--fs-2xl);
}

.page-head p {
  margin-top: 0.35rem;
  font-size: var(--fs-sm);
}

.block {
  margin-bottom: 3rem;
}

.tl {
  list-style: none;
  padding: 0;
  margin: 0;
  border-left: 1px solid var(--c-border);
}

.tl-item {
  display: grid;
  grid-template-columns: 5.5rem 1fr;
  gap: 1.25rem;
  position: relative;
  padding: 0 0 1.75rem 1.5rem;
}

.tl-item::before {
  content: "";
  position: absolute;
  left: -4px;
  top: 0.55rem;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--c-accent);
}

.tl-item:last-child {
  padding-bottom: 0;
}

.tl-date {
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--c-text-3);
  padding-top: 0.1rem;
}

.tl-body h3 {
  font-size: var(--fs-base);
}

.tl-body p {
  margin: 0.25rem 0 0;
  font-size: var(--fs-sm);
}

.month {
  margin-bottom: 1.5rem;
}

.month-label {
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--c-text-3);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--c-border);
  margin-bottom: 0.25rem;
}

.month-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.month-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.45rem 0.25rem;
  border-radius: var(--radius-sm);
  color: var(--c-text);
  font-size: var(--fs-sm);
}

.month-item:hover {
  background: var(--c-surface-strong);
}

.month-item:hover .month-title {
  color: var(--c-accent);
}

.month-title {
  transition: color 0.15s ease;
}

.more {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

@media (max-width: 640px) {
  .tl-item {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
}
</style>
