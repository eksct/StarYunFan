<template>
  <div class="page container fade-in">
    <header class="archive-head">
      <div>
        <h1>笔记</h1>
        <p class="muted">共 {{ total }} 篇 · {{ collections.length }} 个集合，按文件夹归档。</p>
      </div>
    </header>

    <!-- 集合内视图 -->
    <template v-if="activeCollection">
      <div class="toolbar collection-bar">
        <div class="row collection-head">
          <button type="button" class="btn" @click="activeCollection = ''">← 全部集合</button>
          <h2 class="collection-title">{{ activeCollection }}</h2>
          <span class="dim">{{ collectionNotes.length }} 篇</span>
        </div>
      </div>

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
      <div class="toolbar">
        <input
          v-model="keyword"
          type="search"
          class="input search"
          aria-label="搜索笔记"
          placeholder="搜索标题、分类、标签、正文…"
        />

        <div v-if="keyword.trim()" class="row collection-head">
          <span class="dim">搜索到 {{ searchResults.length }} 篇</span>
        </div>
      </div>

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
        <section v-for="group in searchGroups" :key="group.key" class="group">
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

      <div v-if="keyword.trim() && !searchResults.length" class="empty">没有匹配的笔记，换个关键词试试。</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  getCollections,
  getCollectionNotes,
  getNotes,
  groupByCategory,
  groupBySubfolder,
  searchNotes,
  type FolderGroup,
  type NoteFile,
} from '@/utils/notes'

defineOptions({ name: 'NotesView' })

const keyword = ref('')
const activeCollection = ref('')

const notes = getNotes()
const collections = getCollections()
const total = notes.length

// 支持深链 /notes?c=集合名（阅读页面包屑、搜索跳转用）
const route = useRoute()
const initialCollection = typeof route.query.c === 'string' ? route.query.c : ''
if (initialCollection && collections.some(c => c.name === initialCollection)) {
  activeCollection.value = initialCollection
}

const collectionNotes = computed(() =>
  activeCollection.value ? getCollectionNotes(activeCollection.value) : [])

const folderGroups = computed(() =>
  activeCollection.value ? groupBySubfolder(collectionNotes.value, activeCollection.value) : [])

const searchResults = computed<NoteFile[]>(() =>
  keyword.value.trim() ? searchNotes(keyword.value) : [])

// 搜索结果按分类聚拢，避免同类笔记散落交叉
const searchGroups = computed<FolderGroup[]>(() =>
  groupByCategory(searchResults.value).map(group => ({
    key: group.name,
    label: group.label,
    notes: group.notes,
  })))
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
