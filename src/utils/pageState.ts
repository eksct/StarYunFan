import { ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import { siteConfig } from '@/content/siteConfig.mjs'
import { findNote } from '@/utils/notes'
import { staticNoteUrl } from '@/utils/noteUrls'

export const pageTitle = ref(siteConfig.name)
export const notesReturnTo = ref('/notes')
let resolveReader: () => void = () => {}
let readerReady = Promise.resolve()
export function resetReaderReadiness() {
  resolveReader()
  readerReady = new Promise<void>(resolve => { resolveReader = resolve })
}
export function markReaderReady() { resolveReader() }
export function waitForReader() { return readerReady }

export function updatePageMetadata(route: RouteLocationNormalized) {
  const rawPath = route.params.path
  const note = route.name === 'note' ? findNote(Array.isArray(rawPath) ? rawPath.join('/') : rawPath || '') : undefined
  const title = note ? `${note.title} · 笔记 · ${siteConfig.name}`
    : route.name === 'note' ? `笔记未找到 · ${siteConfig.name}`
    : route.meta.title ? `${route.meta.title} · ${siteConfig.name}` : siteConfig.name
  const description = note?.description || siteConfig.description
  const url = note ? staticNoteUrl(note.path) : siteConfig.siteUrl + (route.path === '/' ? '' : '#' + route.fullPath)
  pageTitle.value = document.title = title
  const meta = (attribute: 'name' | 'property', key: string, content: string) => {
    let tag = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
    if (!tag) { tag = document.createElement('meta'); tag.setAttribute(attribute, key); document.head.append(tag) }
    tag.content = content
  }
  meta('name', 'description', description)
  meta('property', 'og:title', title)
  meta('property', 'og:description', description)
  meta('property', 'og:url', url)
  meta('property', 'og:type', note ? 'article' : 'website')
  for (const [key, value] of [['article:published_time', note?.publishedAt], ['article:modified_time', note?.updatedAt]]) {
    if (value) meta('property', key!, value)
    else document.querySelector(`meta[property="${key}"]`)?.remove()
  }
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical) }
  canonical.href = url
}
