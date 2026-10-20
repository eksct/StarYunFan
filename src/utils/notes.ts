// 笔记清单的查询、分组与链接构造
import dayjs from 'dayjs'
import { noteFiles, type NoteFile } from '@/generated/noteManifest'
import { encodeAssetPath } from '@/utils/noteUrls'

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

let searchIndexPromise: Promise<typeof import('@/generated/searchIndex').noteSearchIndex> | undefined

export async function searchNotes(keyword: string): Promise<NoteFile[]> {
  const query = keyword.trim().toLowerCase()
  if (!query) return published

  searchIndexPromise ??= import('@/generated/searchIndex').then(module => module.noteSearchIndex)
  const index = await searchIndexPromise
  const terms = query.split(/\s+/).filter(Boolean)
  const notesByPath = new Map(published.map(note => [note.path, note]))
  const ranked: { note: NoteFile; score: number }[] = []

  for (const entry of index) {
    const title = entry.title.toLowerCase()
    const category = entry.category.toLowerCase()
    const tags = entry.tags.map(tag => tag.toLowerCase())
    const haystack = entry.text.toLowerCase()
    if (!terms.every(term => haystack.includes(term))) continue

    let score = 0
    for (const term of terms) {
      if (title === term) score += 100
      else if (title.startsWith(term)) score += 70
      else if (title.includes(term)) score += 50
      if (tags.some(tag => tag.includes(term))) score += 35
      if (category.includes(term)) score += 25
      if (haystack.includes(term)) score += 10
    }

    const note = notesByPath.get(entry.path)
    if (note) ranked.push({ note, score })
  }

  return ranked
    .sort((left, right) => right.score - left.score
      || right.note.date.localeCompare(left.note.date)
      || left.note.title.localeCompare(right.note.title, 'zh-CN'))
    .map(result => result.note)
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
      || right.date.localeCompare(left.date)
      || left.title.localeCompare(right.title, 'zh-CN'),
  )
}

export function groupByMonth(notes: NoteFile[]): MonthGroup[] {
  const groups = new Map<string, NoteFile[]>()

  for (const note of notes) {
    const key = note.date ? note.date.slice(0, 7) : '未标注'
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
  const segments = note.path.split('/')
  return segments.length >= 3 ? segments[1] : '其他'
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
      if (note.date > bucket.latestDate) bucket.latestDate = note.date
    } else {
      counter.set(name, { count: 1, latestDate: note.date })
    }
  }

  return [...counter.entries()]
    .map(([name, info]) => ({ name, count: info.count, latestDate: info.latestDate }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, 'zh-CN'))
}

export function getCollectionNotes(name: string): NoteFile[] {
  return published
    .filter(note => collectionOf(note) === name)
    .sort((left, right) => right.date.localeCompare(left.date) || left.title.localeCompare(right.title, 'zh-CN'))
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
      notes: notesInGroup,
    }))
}

// 上一篇 / 下一篇：限定在同一文集（category）内，按日期倒序排列
export function getSiblings(path: string): { prev?: NoteFile; next?: NoteFile } {
  const self = findNote(path)
  if (!self) return {}

  const siblings = published
    .filter(note => note.category === self.category)
    .sort((left, right) => right.date.localeCompare(left.date) || left.title.localeCompare(right.title, 'zh-CN'))
  const index = siblings.findIndex(note => note.path === path)
  if (index < 0) return {}

  return { prev: siblings[index - 1], next: siblings[index + 1] }
}

export function readingMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 300))
}

export function formatDate(date: string): string {
  return date ? dayjs(date).format('YYYY-MM-DD') : '未标注'
}

export async function loadNoteContent(path: string): Promise<string> {
  const response = await fetch(`${import.meta.env.BASE_URL}postDir/${encodeAssetPath(path)}`)
  if (!response.ok) {
    throw new Error(`笔记加载失败：${path}`)
  }
  return response.text()
}
