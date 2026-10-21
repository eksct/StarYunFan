<template>
  <div class="page container fade-in">
    <div v-if="!note" class="empty">
      没有找到这篇笔记。
      <div class="empty-action">
        <router-link to="/notes" class="btn">返回笔记列表</router-link>
      </div>
    </div>

    <div v-else class="reader" :class="{ 'has-toc': toc.length > 1 }">
      <article class="main reading-surface">
        <nav class="crumb" aria-label="面包屑">
          <router-link :to="notesReturnTo" class="back">← 笔记</router-link>
          <template v-if="note">
            <span class="crumb-sep">/</span>
            <router-link :to="{ path: '/notes', query: { c: collectionFor(note.path) } }" class="crumb-link">{{ collectionFor(note.path) }}</router-link>
          </template>
        </nav>

        <header class="head">
          <h1>{{ note.title }}</h1>
          <div class="row meta">
            <span class="chip chip-static">{{ note.category }}</span>
            <span class="dim">发布 {{ formatDate(note.publishedAt) }}</span>
            <span v-if="note.updatedAt !== note.publishedAt" class="dim">更新 {{ formatDate(note.updatedAt) }}</span>
            <span class="dim">{{ note.wordCount }} 字 · 约 {{ readingMinutes(note.wordCount) }} 分钟</span>
          </div>
          <button type="button" class="btn print-button" @click="printNote">打印 / 保存 PDF</button>
        </header>

        <details v-if="toc.length" class="mobile-toc">
          <summary>文章大纲</summary>
          <nav aria-label="文章大纲"><ul><li v-for="item in toc" :key="item.id" :style="{ paddingInlineStart: `${(item.level - 2) * 0.7}rem` }"><button type="button" class="toc-link" @click="scrollTo(item.id)">{{ item.text }}</button></li></ul></nav>
        </details>
        <div v-if="error" class="empty" role="alert">{{ error }} <button type="button" class="btn" @click="load">重试</button></div>
        <div v-else-if="loading" class="empty" role="status">加载中…</div>
        <div
          v-else
          ref="contentRef"
          class="prose"
          v-html="html"
          @click="handleCopy"
          @keydown="handleImageKeydown"
        ></div>
        <p class="sr-only" role="status" aria-live="polite">{{ copyStatus }}</p>

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
          <li v-for="item in toc" :key="item.id" :style="{ paddingInlineStart: `${(item.level - 2) * 0.7}rem` }">
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

      <dialog ref="lightboxRef" class="image-dialog" aria-label="图片预览"
        @click.self="closeLightbox" @cancel.prevent="closeLightbox" @close="closeLightbox">
        <button ref="lightboxCloseRef" type="button" @click="closeLightbox">关闭图片预览</button>
        <img v-if="lightboxSrc" :src="lightboxSrc" :alt="lightboxAlt" />
      </dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { TocItem } from '@/utils/notes'
import { findNote, formatDate, getSiblings, loadNoteContent, readingMinutes } from '@/utils/notes'
import { collectionFor } from '@/content/siteConfig.mjs'
import { markReaderReady, notesReturnTo } from '@/utils/pageState'
import type { NoteFile } from '@/utils/notes'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const copyStatus = ref('')
let controller: AbortController | undefined
let requestId = 0
const copyTimers = new Set<ReturnType<typeof setTimeout>>()
const scrollBehavior = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' as const : 'smooth' as const

const note = ref<NoteFile | undefined>()
const prev = ref<NoteFile | undefined>()
const next = ref<NoteFile | undefined>()
const html = ref('')
const toc = ref<TocItem[]>([])
const error = ref('')
const activeId = ref('')
const contentRef = ref<HTMLElement>()
const showBackTop = ref(false)
const lightboxSrc = ref('')
const lightboxAlt = ref('')
const lightboxRef = ref<HTMLDialogElement>()
const lightboxCloseRef = ref<HTMLButtonElement>()
const printNote = () => window.print()
let lightboxTrigger: HTMLElement | null = null
let savedBodyStyle: { overflow: string; paddingRight: string } | undefined

let observer: IntersectionObserver | null = null

function onScroll() {
  showBackTop.value = window.scrollY > 480
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: scrollBehavior() })
}

function notePath(): string {
  const raw = route.params.path
  return Array.isArray(raw) ? raw.join('/') : raw ?? ''
}

async function load() {
  const request = ++requestId
  controller?.abort()
  controller = new AbortController()
  observer?.disconnect()
  closeLightbox()
  const path = notePath()
  note.value = findNote(path)
  showBackTop.value = false
  html.value = ''
  error.value = ''
  toc.value = []
  activeId.value = ''
  prev.value = next.value = undefined
  loading.value = true

  if (!note.value) {
    loading.value = false
    markReaderReady()
    return
  }

  const siblings = getSiblings(path)
  prev.value = siblings.prev
  next.value = siblings.next

  try {
    const rendered = await loadNoteContent(path, controller.signal)
    if (request !== requestId) return
    html.value = rendered.html
    toc.value = rendered.toc
    loading.value = false

    await nextTick()
    if (request !== requestId) return
    prepareImages()
    observeHeadings()
  } catch (failure) {
    if (request !== requestId || (failure instanceof DOMException && failure.name === 'AbortError')) return
    error.value = failure instanceof Error && failure.name === 'TimeoutError'
      ? '加载超时，请重试。' : '这篇笔记加载失败了，请稍后重试。'
  } finally {
    if (request === requestId) {
      loading.value = false
      await nextTick()
      if (request === requestId) markReaderReady()
    }
  }
}

function prepareImages() {
  contentRef.value?.querySelectorAll<HTMLImageElement>('.prose-img').forEach(image => {
    const failed = () => {
      if (image.classList.contains('image-failed')) return
      image.removeAttribute('role')
      image.removeAttribute('tabindex')
      image.removeAttribute('aria-label')
      image.alt = '图片加载失败：' + image.alt
      image.classList.add('image-failed')
    }
    image.addEventListener('error', failed, { once: true })
    if (image.complete && !image.naturalWidth) failed()
  })
}

function observeHeadings() {
  observer?.disconnect()
  const headings = contentRef.value?.querySelectorAll('h2[id], h3[id], h4[id], h5[id], h6[id]')
  if (!headings?.length) return

  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) activeId.value = entry.target.id
    }
  }, { rootMargin: '-72px 0px -70% 0px' })

  headings.forEach(heading => observer?.observe(heading))
}

function scrollTo(id: string) {
  void router.replace({ ...route, hash: '#' + id })
  document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
}

async function openLightbox(image: HTMLImageElement) {
  if (!image.complete || !image.naturalWidth) return
  if (!savedBodyStyle) {
    savedBodyStyle = { overflow: document.body.style.overflow, paddingRight: document.body.style.paddingRight }
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    if (scrollbar) document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar}px`
    document.body.style.overflow = 'hidden'
  }
  lightboxTrigger = image
  lightboxAlt.value = image.alt
  lightboxSrc.value = image.src
  await nextTick()
  lightboxRef.value?.showModal()
  lightboxCloseRef.value?.focus()
}

function closeLightbox() {
  if (lightboxRef.value?.open) lightboxRef.value.close()
  if (savedBodyStyle) {
    document.body.style.overflow = savedBodyStyle.overflow
    document.body.style.paddingRight = savedBodyStyle.paddingRight
    savedBodyStyle = undefined
  }
  if (!lightboxSrc.value) return
  lightboxSrc.value = ''
  void nextTick(() => { if (lightboxTrigger?.isConnected) lightboxTrigger.focus() })
}

async function handleCopy(event: MouseEvent) {
  const target = event.target as HTMLElement
  const link = target.closest<HTMLAnchorElement>('a[data-note-path]')
  if (link && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
    event.preventDefault()
    const query: Record<string, string[]> = {}
    new URLSearchParams(link.dataset.noteQuery).forEach((value, key) => { (query[key] ??= []).push(value) })
    void router.push({ name: 'note', params: { path: link.dataset.notePath }, query, hash: link.dataset.noteAnchor ? '#' + link.dataset.noteAnchor : '' })
    return
  }

  // 点击正文图片：打开灯箱
  if (target instanceof HTMLImageElement && target.src) {
    void openLightbox(target)
    return
  }

  const trigger = target.closest('[data-action="copy"]')
  if (!trigger) return

  const code = trigger.closest('.code-block')?.querySelector('pre')?.textContent ?? ''
  if (!code) return

  try {
    await navigator.clipboard.writeText(code)
    const button = trigger as HTMLElement
    button.textContent = '已复制'
    copyStatus.value = '代码已复制'
    const timer = setTimeout(() => { button.textContent = '复制'; copyStatus.value = ''; copyTimers.delete(timer) }, 1500)
    copyTimers.add(timer)
  } catch {
    window.prompt('复制失败，请手动复制代码：', code)
  }
}

function handleImageKeydown(event: KeyboardEvent) {
  const target = event.target
  if (!(target instanceof HTMLImageElement) || (event.key !== 'Enter' && event.key !== ' ')) return
  event.preventDefault()
  void openLightbox(target)
}

watch(() => route.params.path, load, { immediate: true })

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  requestId++
  controller?.abort()
  copyTimers.forEach(clearTimeout)
  window.removeEventListener('scroll', onScroll)
  observer?.disconnect()
  closeLightbox()
})
</script>

<style scoped lang="scss">
.reader {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2.5rem;
}
.main { min-width: 0; }
.print-button { margin-top: 1rem; }
.mobile-toc { display: none; margin-bottom: 1.5rem; }
.mobile-toc summary { cursor: pointer; }

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

.crumb {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: var(--fs-sm);
}

.crumb-sep {
  color: var(--c-text-3);
}

.crumb-link {
  color: var(--c-text-2);
  transition: color 0.15s ease;
}

.crumb-link:hover {
  color: var(--c-accent);
}

.head {
  padding: 1rem 0 2rem;
  border-bottom: 1px solid var(--c-border);
  margin-bottom: 2rem;
}

.head h1 {
  font-size: clamp(1.5rem, 4vw, var(--fs-2xl));
  max-width: 100%;
  overflow-wrap: anywhere;
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
  min-width: 0;
  overflow-wrap: anywhere;
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
  padding: 1rem;
  background: var(--c-bg-elevated);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
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

.mobile-toc ul { list-style: none; padding: 0; }

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
  overflow-wrap: anywhere;
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
  .mobile-toc { display: block; }
  .reader.has-toc {
    grid-template-columns: minmax(0, 1fr);
  }

  .toc {
    display: none;
  }
}
</style>
