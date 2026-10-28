// 笔记清单的查询、分组与链接构造
import dayjs from 'dayjs'
import { noteFiles, type NoteFile } from '@/generated/noteManifest'
import { encodeAssetPath } from '@/utils/noteUrls'
import { collectionFor } from '@/content/siteConfig.mjs'
import { rankEntries, retryableLoader } from '@/utils/search.mjs'
import { compareNotes, findSiblings } from '@/utils/noteOrder.mjs'
import { fetchJson } from '@/utils/fetchJson.mjs'

export { encodeAssetPath, noteUrl } from '@/utils/noteUrls'

export type { NoteFile }

// public/postDir 根目录下的测试文件不进归档
const isPublished = (note: NoteFile) => note.category !== '测试' && note.path !== 'test.md'

const published = noteFiles.filter(isPublished)

export function getNotes(): NoteFile[] {
  return published
}

export function getCategories(): { name: string; count: number }[] {
  const counter = new Map<string, number>()

  for (const note of published) {
    counter.set(note.category, (counter.get(note.category) ?? 0) + 1)
  }

  return [...counter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, 'zh-CN'))
}

export function getTags(): string[] {
  const tags = new Set<string>()
  for (const note of published) {
    note.tags.forEach(tag => tags.add(tag))
  }
  return [...tags].sort((left, right) => left.localeCompare(right, 'zh-CN'))
}

interface SearchEntry { path: string; title: string; category: string; tags: string[]; text: string }
const loadSearchIndex = retryableLoader(async (): Promise<SearchEntry[]> => {
  const data = await fetchJson(`${import.meta.env.BASE_URL}search-index.json`)
  if (!Array.isArray(data) || !data.every(item => item && typeof item.path === 'string'
    && typeof item.title === 'string' && typeof item.category === 'string' && typeof item.text === 'string'
    && Array.isArray(item.tags) && item.tags.every((tag: unknown) => typeof tag === 'string'))) {
    throw new Error('搜索索引格式无效，请重试。')
  }
  return data
})
export type SearchResult = NoteFile & { snippet: string }

export async function searchNotes(keyword: string): Promise<SearchResult[]> {
  const query = keyword.trim().toLowerCase()
  if (!query) return published.map(note => ({ ...note, snippet: note.description }))
  const index = await loadSearchIndex()
  const notesByPath = new Map(published.map(note => [note.path, note]))
  return rankEntries(index, query).flatMap(result => {
    const note = notesByPath.get(result.path)
    return note ? [{ ...note, snippet: result.snippet }] : []
  })
}

export interface MonthGroup {
  key: string
  label: string
  notes: NoteFile[]
}

// 同一时间下把同类别笔记聚在一起，避免类别互相交叉
function sortByCategory(notes: NoteFile[]): NoteFile[] {
  return [...notes].sort(
    (left, right) =>
      left.category.localeCompare(right.category, 'zh-CN')
      || right.publishedAt.localeCompare(left.publishedAt)
      || left.title.localeCompare(right.title, 'zh-CN'),
  )
}

export function groupByMonth(notes: NoteFile[]): MonthGroup[] {
  const groups = new Map<string, NoteFile[]>()

  for (const note of notes) {
    const key = note.publishedAt ? note.publishedAt.slice(0, 7) : '未标注'
    const bucket = groups.get(key)
    if (bucket) bucket.push(note)
    else groups.set(key, [note])
  }

  return [...groups.entries()]
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map(([key, notesInGroup]) => ({
      key,
      label: key === '未标注' ? '未标注日期' : dayjs(`${key}-01`).format('YYYY 年 M 月'),
      notes: sortByCategory(notesInGroup),
    }))
}

export interface CategoryGroup {
  name: string
  label: string
  notes: NoteFile[]
}

// 日期集中时时间线会塌成一组，分类视图是它的补充浏览方式
export function groupByCategory(notes: NoteFile[]): CategoryGroup[] {
  const groups = new Map<string, NoteFile[]>()

  for (const note of notes) {
    const bucket = groups.get(note.category)
    if (bucket) bucket.push(note)
    else groups.set(note.category, [note])
  }

  return [...groups.entries()]
    .sort((left, right) => right[1].length - left[1].length || left[0].localeCompare(right[0], 'zh-CN'))
    .map(([name, notesInGroup]) => ({
      name,
      label: `${name} · ${notesInGroup.length}`,
      notes: notesInGroup,
    }))
}

export function findNote(path: string): NoteFile | undefined {
  return published.find(note => note.path === path)
}

// 集合 = 笔记所在的一级文件夹（major/Docker/xx.md → Docker）。
// 直接放在 major 根下的散文件归入「其他」。
function collectionOf(note: NoteFile): string {
  return collectionFor(note.path)
}

export interface Collection {
  name: string
  count: number
  latestDate: string
}

export function getCollections(): Collection[] {
  const counter = new Map<string, { count: number; latestDate: string }>()

  for (const note of published) {
    const name = collectionOf(note)
    const bucket = counter.get(name)
    if (bucket) {
      bucket.count += 1
      if (note.updatedAt > bucket.latestDate) bucket.latestDate = note.updatedAt
    } else {
      counter.set(name, { count: 1, latestDate: note.updatedAt })
    }
  }

  return [...counter.entries()]
    .map(([name, info]) => ({ name, count: info.count, latestDate: info.latestDate }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, 'zh-CN'))
}

export function getCollectionNotes(name: string): NoteFile[] {
  return published
    .filter(note => collectionOf(note) === name)
    .sort(compareNotes)
}

export interface FolderGroup {
  key: string
  label: string
  notes: NoteFile[]
}

// 集合内部按子文件夹分组（相对集合根目录的完整路径），编程语言这类深嵌套也能看清层级
export function groupBySubfolder(notes: NoteFile[], collection: string): FolderGroup[] {
  const groups = new Map<string, NoteFile[]>()

  for (const note of notes) {
    const segments = note.path.split('/')
    const relativeDir = segments.slice(2, -1).join('/')
    const key = relativeDir || '根目录'
    const bucket = groups.get(key)
    if (bucket) bucket.push(note)
    else groups.set(key, [note])
  }

  return [...groups.entries()]
    .sort((left, right) => left[0].localeCompare(right[0], 'zh-CN'))
    .map(([key, notesInGroup]) => ({
      key,
      label: key === '根目录' ? collection : key,
      notes: [...notesInGroup].sort(compareNotes),
    }))
}

// 和集合内列表一致：同目录、标题自然顺序（02 在 10 前），无标题时使用文件名。
export function getSiblings(path: string): { prev?: NoteFile; next?: NoteFile } {
  return findSiblings(published, path)
}

export function readingMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 300))
}

export function formatDate(date: string): string {
  return date ? dayjs(date).format('YYYY-MM-DD') : '未标注'
}

export interface TocItem { level: number; text: string; id: string }
export interface RenderedNote { html: string; toc: TocItem[] }
export async function loadNoteContent(path: string, signal?: AbortSignal): Promise<RenderedNote> {
  const data = await fetchJson(`${import.meta.env.BASE_URL}note-data/${encodeAssetPath(path)}.json`, { signal })
  if (!data || typeof data !== 'object' || !('html' in data) || typeof data.html !== 'string'
    || !('toc' in data) || !Array.isArray(data.toc) || !data.toc.every(item => item
      && Number.isInteger(item.level) && item.level >= 2 && item.level <= 6
      && typeof item.id === 'string' && typeof item.text === 'string')) {
    throw new Error('笔记数据格式无效，请重试。')
  }
  return { html: data.html, toc: data.toc }
}
