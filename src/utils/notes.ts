// 笔记清单的查询、分组与链接构造
import dayjs from 'dayjs'
import { noteFiles, type NoteFile } from '@/generated/noteManifest'
import { noteSearchIndex } from '@/generated/searchIndex'

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

export function searchNotes(keyword: string): NoteFile[] {
  const query = keyword.trim().toLowerCase()
  if (!query) return published

  // 命中正文索引（标题/分类/标签/正文都已纳入），比仅搜元数据更全
  const matchedPaths = new Set(
    noteSearchIndex
      .filter(entry => entry.text.includes(query))
      .map(entry => entry.path),
  )

  return published.filter(note => matchedPaths.has(note.path))
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

export function getSiblings(path: string): { prev?: NoteFile; next?: NoteFile } {
  const index = published.findIndex(note => note.path === path)
  if (index < 0) return {}

  return { prev: published[index - 1], next: published[index + 1] }
}

export function readingMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 300))
}

export function formatDate(date: string): string {
  return date ? dayjs(date).format('YYYY-MM-DD') : '未标注'
}

export function encodeAssetPath(assetPath: string): string {
  return assetPath.split('/').map(segment => encodeURIComponent(segment)).join('/')
}

// 路由是 hash 模式，站内链接必须带 # 前缀
export function noteUrl(path: string): string {
  return `#/notes/${encodeAssetPath(path)}`
}

export async function loadNoteContent(path: string): Promise<string> {
  const response = await fetch(`${import.meta.env.BASE_URL}postDir/${encodeAssetPath(path)}`)
  if (!response.ok) {
    throw new Error(`笔记加载失败：${path}`)
  }
  return response.text()
}
