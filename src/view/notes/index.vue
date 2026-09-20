<template>
  <div class="page container fade-in">
    <header class="archive-head">
      <div>
        <h1>笔记</h1>
        <p class="muted">共 {{ total }} 篇 · {{ categories.length }} 个分类，按更新时间倒序排列。</p>
      </div>
    </header>

    <div class="toolbar">
      <input v-model="keyword" type="search" class="input search" placeholder="搜索标题、分类、标签…" />

      <div class="row toolbar-row">
        <div class="row view-switch">
          <button
            type="button"
            class="chip"
            :class="{ 'is-active': view === 'timeline' }"
            @click="view = 'timeline'"
          >
            时间线
          </button>
          <button
            type="button"
            class="chip"
            :class="{ 'is-active': view === 'category' }"
            @click="view = 'category'"
          >
            分类
          </button>
        </div>

        <div class="row chips">
          <button type="button" class="chip" :class="{ 'is-active': !activeCategory }" @click="activeCategory = ''">
            全部
          </button>
        <button
          v-for="category in categories"
          :key="category.name"
          type="button"
          class="chip"
          :class="{ 'is-active': activeCategory === category.name }"
          @click="toggleCategory(category.name)"
        >
          {{ category.name }} <span class="dim">{{ category.count }}</span>
        </button>
        </div>
      </div>
    </div>

    <div v-if="groups.length" class="timeline">
      <section v-for="group in groups" :key="group.key" class="group">
        <div class="group-label">
          <span class="group-dot" aria-hidden="true"></span>
          {{ group.label }}
        </div>

        <ul class="group-list">
          <li v-for="note in group.notes" :key="note.path">
            <router-link :to="`/notes/${note.path}`" class="entry">
              <span class="entry-date">{{ note.date ? note.date.slice(5) : '——' }}</span>
              <span class="entry-main">
                <span class="entry-title">{{ note.title }}</span>
                <span v-if="note.description" class="entry-desc">{{ note.description }}</span>
              </span>
              <span class="entry-meta">
                <span class="chip chip-static">{{ note.category }}</span>
                <span class="dim">{{ note.wordCount }} 字</span>
              </span>
            </router-link>
          </li>
        </ul>
      </section>
    </div>

    <div v-if="hasMore" class="more">
      <button type="button" class="btn" @click="loadMore">
        加载更多（剩余 {{ remaining }} 篇）
      </button>
    </div>

    <div v-else class="empty">没有匹配的笔记，换个关键词试试。</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getCategories, getNotes, groupByCategory, groupByMonth, searchNotes } from '@/utils/notes'

defineOptions({ name: 'NotesView' })

type ArchiveView = 'timeline' | 'category'

const pageSize = 30
const keyword = ref('')
const activeCategory = ref('')
const view = ref<ArchiveView>('timeline')
const visibleCount = ref(pageSize)

const notes = getNotes()
const categories = getCategories()

const total = notes.length

const toggleCategory = (name: string) => {
  activeCategory.value = activeCategory.value === name ? '' : name
}

const filtered = computed(() => {
  const matched = searchNotes(keyword.value)
  return activeCategory.value
    ? matched.filter(note => note.category === activeCategory.value)
    : matched
})

const paged = computed(() => filtered.value.slice(0, visibleCount.value))

const groups = computed(() => view.value === 'timeline'
  ? groupByMonth(paged.value)
  : groupByCategory(paged.value).map(group => ({
    key: group.name,
    label: group.label,
    notes: group.notes,
  })))

const hasMore = computed(() => visibleCount.value < filtered.value.length)
const remaining = computed(() => filtered.value.length - visibleCount.value)

function loadMore() {
  visibleCount.value = Math.min(visibleCount.value + pageSize, filtered.value.length)
}

// 关键词、分类或视图切换时回到第一页
watch([keyword, activeCategory, view], () => {
  visibleCount.value = pageSize
})
</script>

<style scoped lang="scss">
.archive-head {
  margin-bottom: 1.5rem;
}

.archive-head h1 {
  font-size: var(--fs-2xl);
}

.archive-head p {
  margin-top: 0.35rem;
  font-size: var(--fs-sm);
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem;
  margin-bottom: 2rem;
  background: var(--c-surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
}

.search {
  max-width: 22rem;
}

.toolbar-row {
  gap: 0.75rem;
  flex-wrap: wrap;
}

.view-switch {
  gap: 0.4rem;
  flex-shrink: 0;
}

.chips {
  gap: 0.4rem;
}

.timeline {
  border-left: 1px solid var(--c-border);
  padding-left: 0;
}

.group {
  margin-bottom: 2rem;
}

.group-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--c-text-3);
  margin-left: -0.75rem;
  padding-bottom: 0.6rem;
}

.group-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--c-accent);
}

.group-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.entry {
  display: grid;
  grid-template-columns: 3.5rem 1fr auto;
  align-items: baseline;
  gap: 1rem;
  padding: 0.7rem 0.75rem;
  border-radius: var(--radius-sm);
  color: var(--c-text);
  transition: background-color 0.15s ease;
}

.entry:hover {
  background: var(--c-surface-strong);
}

.entry:hover .entry-title {
  color: var(--c-accent);
}

.entry-date {
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--c-text-3);
}

.entry-main {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.entry-title {
  font-weight: 500;
  transition: color 0.15s ease;
}

.entry-desc {
  font-size: var(--fs-sm);
  color: var(--c-text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
  font-size: var(--fs-xs);
}

.more {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

@media (max-width: 640px) {
  .entry {
    grid-template-columns: 3rem 1fr;
    gap: 0.6rem;
  }

  .entry-meta {
    grid-column: 2;
  }

  .entry-desc {
    white-space: normal;
  }
}
</style>
