<template>
  <div class="page container fade-in">
    <div v-if="!note" class="empty">
      没有找到这篇笔记。
      <div class="empty-action">
        <router-link to="/notes" class="btn">返回笔记列表</router-link>
      </div>
    </div>

    <div v-else class="reader" :class="{ 'has-toc': toc.length > 1 }">
      <article class="main">
        <router-link to="/notes" class="back">← 笔记</router-link>

        <header class="head">
          <h1>{{ note.title }}</h1>
          <div class="row meta">
            <span class="chip chip-static">{{ note.category }}</span>
            <span class="dim">{{ formatDate(note.date) }}</span>
            <span class="dim">{{ note.wordCount }} 字 · 约 {{ readingMinutes(note.wordCount) }} 分钟</span>
          </div>
        </header>

        <div v-if="error" class="empty">{{ error }}</div>
        <div v-else-if="!html" class="empty">加载中…</div>
        <div v-else ref="contentRef" class="prose" v-html="html" @click="handleCopy"></div>

        <nav v-if="prev || next" class="siblings">
          <router-link v-if="prev" :to="`/notes/${prev.path}`" class="sibling">
            <span class="dim">上一篇</span>
            <span class="sibling-title">{{ prev.title }}</span>
          </router-link>
          <span v-else class="sibling-placeholder"></span>

          <router-link v-if="next" :to="`/notes/${next.path}`" class="sibling is-end">
            <span class="dim">下一篇</span>
            <span class="sibling-title">{{ next.title }}</span>
          </router-link>
        </nav>
      </article>

      <aside v-if="toc.length > 1" class="toc" aria-label="大纲">
        <div class="toc-title">大纲</div>
        <ul>
          <li v-for="item in toc" :key="item.id" :class="`toc-${item.level}`">
            <button type="button" class="toc-link" :class="{ 'is-active': activeId === item.id }" @click="scrollTo(item.id)">
              {{ item.text }}
            </button>
          </li>
        </ul>
      </aside>

      <transition name="fade">
        <button v-if="showBackTop" type="button" class="back-top" aria-label="回到顶部" @click="scrollTop">
          ↑
        </button>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { renderMarkdown, type TocItem } from '@/utils/markdown'
import { findNote, formatDate, getSiblings, loadNoteContent, readingMinutes } from '@/utils/notes'
import type { NoteFile } from '@/utils/notes'

const route = useRoute()

const note = ref<NoteFile | undefined>()
const prev = ref<NoteFile | undefined>()
const next = ref<NoteFile | undefined>()
const html = ref('')
const toc = ref<TocItem[]>([])
const error = ref('')
const activeId = ref('')
const contentRef = ref<HTMLElement>()
const showBackTop = ref(false)

let observer: IntersectionObserver | null = null

function onScroll() {
  showBackTop.value = window.scrollY > 480
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function notePath(): string {
  const raw = route.params.path
  return Array.isArray(raw) ? raw.join('/') : raw ?? ''
}

async function load() {
  const path = notePath()
  note.value = findNote(path)
  showBackTop.value = false
  html.value = ''
  error.value = ''
  toc.value = []
  activeId.value = ''

  if (!note.value) {
    document.title = '笔记未找到 · Seiga'
    return
  }

  document.title = `${note.value.title} · 笔记 · Seiga`

  const siblings = getSiblings(path)
  prev.value = siblings.prev
  next.value = siblings.next

  try {
    const raw = await loadNoteContent(path)
    const rendered = renderMarkdown(raw)
    html.value = rendered.html
    toc.value = rendered.toc

    await nextTick()
    observeHeadings()
  } catch {
    error.value = '这篇笔记加载失败了，请稍后重试。'
  }
}

function observeHeadings() {
  observer?.disconnect()
  const headings = contentRef.value?.querySelectorAll('h2[id], h3[id]')
  if (!headings?.length) return

  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) activeId.value = entry.target.id
    }
  }, { rootMargin: '-72px 0px -70% 0px' })

  headings.forEach(heading => observer?.observe(heading))
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function handleCopy(event: MouseEvent) {
  const trigger = (event.target as HTMLElement).closest('[data-action="copy"]')
  if (!trigger) return

  const code = trigger.closest('.code-block')?.querySelector('pre')?.textContent ?? ''
  if (!code) return

  try {
    await navigator.clipboard.writeText(code)
    const button = trigger as HTMLElement
    button.textContent = '已复制'
    setTimeout(() => { button.textContent = '复制' }, 1500)
  } catch {
    error.value = '当前环境不支持复制到剪贴板。'
  }
}

watch(() => route.params.path, load, { immediate: true })
watch(() => route.fullPath, () => window.scrollTo({ top: 0 }))

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  observer?.disconnect()
})
</script>

<style scoped lang="scss">
.reader {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2.5rem;
}

.reader.has-toc {
  grid-template-columns: minmax(0, 1fr) 13rem;
}

.back {
  font-size: var(--fs-sm);
  color: var(--c-text-3);
}

.back:hover {
  color: var(--c-accent);
}

.head {
  padding: 1rem 0 2rem;
  border-bottom: 1px solid var(--c-border);
  margin-bottom: 2rem;
}

.head h1 {
  font-size: var(--fs-2xl);
  max-width: 22ch;
}

.meta {
  margin-top: 0.75rem;
  font-size: var(--fs-sm);
  gap: 0.75rem;
}

.siblings {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--c-border);
}

.sibling {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  max-width: 45%;
  color: var(--c-text);
}

.sibling.is-end {
  margin-left: auto;
  text-align: right;
}

.sibling:hover .sibling-title {
  color: var(--c-accent);
}

.sibling-title {
  font-size: var(--fs-sm);
  font-weight: 500;
  transition: color 0.15s ease;
}

.toc {
  position: sticky;
  top: 5.5rem;
  align-self: start;
  max-height: calc(100vh - 8rem);
  overflow-y: auto;
  font-size: var(--fs-sm);
}

.toc-title {
  font-size: var(--fs-xs);
  color: var(--c-text-3);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--c-border);
  margin-bottom: 0.5rem;
}

.toc ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-3 {
  padding-left: 0.85rem;
}

.toc-link {
  display: block;
  width: 100%;
  padding: 0.25rem 0;
  font-family: inherit;
  font-size: inherit;
  text-align: left;
  color: var(--c-text-3);
  background: transparent;
  border: 0;
  cursor: pointer;
  line-height: 1.5;
  transition: color 0.15s ease;
}

.toc-link:hover {
  color: var(--c-text);
}

.toc-link.is-active {
  color: var(--c-accent);
}

.empty-action {
  margin-top: 1rem;
}

.back-top {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 20;
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: var(--c-text);
  background: var(--c-surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--c-border);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: color 0.15s ease, border-color 0.15s ease;
}

.back-top:hover {
  color: var(--c-accent);
  border-color: var(--c-accent-border);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .reader.has-toc {
    grid-template-columns: minmax(0, 1fr);
  }

  .toc {
    display: none;
  }
}
</style>
