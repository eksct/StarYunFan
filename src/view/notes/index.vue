<template>
  <div class="page container fade-in">
    <header class="archive-head">
      <div>
        <h1>笔记</h1>
        <p class="muted">共 {{ total }} 篇 · {{ collections.length }} 个集合，按文件夹归档。</p>
      </div>
    </header>

    <div class="toolbar">
      <div v-if="activeCollection" class="row collection-head">
        <button type="button" class="btn" @click="activeCollection = ''">← 全部集合</button>
        <h2 class="collection-title">{{ activeCollection }}</h2>
        <span class="dim">{{ collectionNotes.length }} 篇</span>
      </div>
      <input v-model="keyword" type="search" class="input search" aria-label="搜索笔记"
        :placeholder="activeCollection ? `搜索 ${activeCollection} 内的笔记…` : '搜索标题、分类、标签、正文、代码…'" />
      <span v-if="keyword.trim()" class="dim" role="status" aria-live="polite">{{ isSearching ? '正在搜索…' : searchError ? searchError : `搜索到 ${filteredResults.length} 篇` }}</span>
    </div>

    <!-- 集合内视图 -->
    <template v-if="activeCollection && !keyword.trim()">

      <div class="timeline">
        <section v-for="group in folderGroups" :key="group.key" class="group">
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
    </template>

    <!-- 集合总览 / 搜索结果 -->
    <template v-else>
      <!-- 无关键词：集合卡片 -->
      <div v-if="!keyword.trim()" class="collection-grid">
        <button
          v-for="collection in collections"
          :key="collection.name"
          type="button"
          class="card card-pad collection-card"
          @click="activeCollection = collection.name"
        >
          <span class="collection-name">{{ collection.name }}</span>
          <span class="collection-count">{{ collection.count }} 篇</span>
          <span class="collection-latest dim">最近更新 {{ collection.latestDate || '——' }}</span>
        </button>
      </div>

      <div v-else class="timeline">
        <section class="group" aria-label="按相关性排序的搜索结果">
          <div class="group-label">
            <span class="group-dot" aria-hidden="true"></span>
            按相关性排序
          </div>

          <ul class="group-list">
            <li v-for="note in filteredResults" :key="note.path">
              <router-link :to="`/notes/${note.path}`" class="entry">
                <span class="entry-date">{{ note.date ? note.date.slice(5) : '——' }}</span>
                <span class="entry-main">
                  <span class="entry-title">{{ note.title }}</span>
                  <span class="entry-desc search-snippet"><template v-for="(part, index) in highlightSnippet(note.snippet, keyword)" :key="index"><mark v-if="part.match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></span>
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

      <div v-if="keyword.trim() && !isSearching && !filteredResults.length" class="empty" role="status">{{ searchError || '没有匹配的笔记，换个关键词试试。' }} <button v-if="searchError" type="button" class="btn" @click="runSearch(keyword)">重试</button></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { highlightSnippet } from '@/utils/search.mjs'
import { markReaderReady } from '@/utils/pageState'
import { collectionFor } from '@/content/siteConfig.mjs'
import {
  getCollections,
  getCollectionNotes,
  getNotes,
  groupBySubfolder,
  searchNotes,
  type SearchResult,
} from '@/utils/notes'

defineOptions({ name: 'NotesView' })

const notes = getNotes()
const collections = getCollections()
const total = notes.length

// 支持深链 /notes?c=集合名（阅读页面包屑、搜索跳转用）
const route = useRoute()
const router = useRouter()
const keyword = computed({
  get: () => typeof route.query.q === 'string' ? route.query.q : '',
  set: value => { void router.replace({ path: '/notes', query: { ...route.query, q: value || undefined } }) },
})
const activeCollection = computed({
  get: () => typeof route.query.c === 'string' && collections.some(c => c.name === route.query.c) ? route.query.c : '',
  set: value => { void router.push({ path: '/notes', query: { ...route.query, c: value || undefined } }) },
})

const collectionNotes = computed(() =>
  activeCollection.value ? getCollectionNotes(activeCollection.value) : [])

const folderGroups = computed(() =>
  activeCollection.value ? groupBySubfolder(collectionNotes.value, activeCollection.value) : [])

const searchResults = ref<SearchResult[]>([])
const filteredResults = computed(() => activeCollection.value
  ? searchResults.value.filter(note => collectionFor(note.path) === activeCollection.value) : searchResults.value)
const isSearching = ref(false)
const searchError = ref('')
let searchTimer: ReturnType<typeof setTimeout> | undefined
let searchRequest = 0

function runSearch(value: string) {
  const request = ++searchRequest
  clearTimeout(searchTimer)

  if (!value.trim()) {
    searchResults.value = []
    isSearching.value = false
    searchError.value = ''
    void nextTick(() => { if (request === searchRequest) markReaderReady() })
    return
  }

  isSearching.value = true
  searchResults.value = []
  searchError.value = ''
  searchTimer = setTimeout(async () => {
    try {
      const results = await searchNotes(value)
      if (request !== searchRequest) return
      searchResults.value = results
    } catch (error) {
      if (request !== searchRequest) return
      searchResults.value = []
      searchError.value = error instanceof Error ? error.message : '搜索加载失败，请重试。'
    } finally {
      if (request === searchRequest) {
        isSearching.value = false
        await nextTick()
        if (request === searchRequest) markReaderReady()
      }
    }
  }, 160)
}
watch(keyword, runSearch, { immediate: true })

onBeforeUnmount(() => { clearTimeout(searchTimer); searchRequest++ })
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

.collection-head {
  gap: 0.75rem;
  align-items: center;
}

.collection-title {
  font-size: var(--fs-lg);
  margin: 0;
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.collection-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.collection-card:hover {
  border-color: var(--c-accent-border);
  transform: translateY(-2px);
}

.collection-name {
  font-size: var(--fs-lg);
  font-weight: 600;
  color: var(--c-text);
}

.collection-card:hover .collection-name {
  color: var(--c-accent);
}

.collection-count {
  font-size: var(--fs-sm);
  color: var(--c-accent);
}

.collection-latest {
  font-size: var(--fs-xs);
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
.search-snippet { white-space: normal; }
mark { background: color-mix(in srgb, var(--c-accent) 24%, transparent); color: var(--c-text); border-radius: 2px; }

.entry-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
  font-size: var(--fs-xs);
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
