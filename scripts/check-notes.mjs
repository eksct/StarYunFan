import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createAssetIndex, isDraft, parseFrontmatter, resolveAssetPath, toIsoDate } from '../src/utils/noteData.mjs'
import { relativeNoteAssetPath } from '../src/utils/normalizeMarkdown.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const notesRoot = path.join(projectRoot, 'public', 'postDir')

async function collectFiles(directory, relativeDirectory = '') {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const relativePath = path.posix.join(relativeDirectory, entry.name)
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collectFiles(absolutePath, relativePath))
    else if (entry.isFile()) files.push(relativePath)
  }
  return files
}

function categoryFor(notePath, frontmatter) {
  if (frontmatter.category) return frontmatter.category
  const segments = notePath.split('/')
  if (segments.length === 1) return '测试'
  if (segments[1] === '编程语言' && segments[2] === 'JAVA') {
    return segments.includes('Spring Boot') ? 'Spring Boot' : 'Java'
  }
  return segments[1] || '其他'
}

const files = await collectFiles(notesRoot)
const markdownPaths = files.filter(file => file.toLowerCase().endsWith('.md'))
const assetPaths = files.filter(file => /\.(png|jpe?g|gif|webp|svg)$/i.test(file))
const assets = createAssetIndex(assetPaths)
const notes = []
const errors = []
const warnings = []

for (const notePath of markdownPaths) {
  const raw = await readFile(path.join(notesRoot, ...notePath.split('/')), 'utf8')
  const { data, body } = parseFrontmatter(raw)
  const title = data.title || path.posix.basename(notePath, '.md')
  const published = !isDraft(data.draft) && categoryFor(notePath, data) !== '测试' && notePath !== 'test.md'
  notes.push({ path: notePath, title, published })

  if (data.date && !toIsoDate(data.date)) {
    errors.push(`${notePath}: 无效日期 ${data.date}`)
  }

  const localImageTargets = [
    ...[...body.matchAll(/!\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)].map(match => match[1].trim()),
    ...[...body.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)]
      .map(match => match[1])
      .filter(target => !/^(https?:)?\/\//.test(target) && !target.startsWith('data:')),
  ]

  for (const target of localImageTargets) {
    let decodedTarget = target
    try { decodedTarget = decodeURIComponent(target) } catch { /* Keep malformed paths visible in the error. */ }
    const relativePath = relativeNoteAssetPath(notePath, decodedTarget)
    if (!resolveAssetPath(relativePath, assets) && !resolveAssetPath(decodedTarget, assets)) {
      errors.push(`${notePath}: 找不到图片 ${target}`)
    }
  }
}

const published = notes.filter(note => note.published)
const titleGroups = new Map()
for (const note of published) {
  const matches = titleGroups.get(note.title) ?? []
  matches.push(note.path)
  titleGroups.set(note.title, matches)
}
for (const [title, paths] of titleGroups) {
  if (paths.length > 1) warnings.push(`重复标题「${title}」: ${paths.join(', ')}`)
}

const knownTitles = new Set(notes.map(note => note.title))
const knownPaths = new Set(notes.map(note => note.path))
for (const note of notes) {
  const raw = await readFile(path.join(notesRoot, ...note.path.split('/')), 'utf8')
  const { body } = parseFrontmatter(raw)
  for (const [, target] of body.matchAll(/(?<!!)\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)) {
    const value = target.trim()
    const normalized = value.endsWith('.md') ? value : `${value}.md`
    if (!knownTitles.has(value) && !knownPaths.has(value) && ![...knownPaths].some(notePath => notePath.endsWith(`/${normalized}`))) {
      warnings.push(`${note.path}: 未解析的双链 ${value}`)
    }
  }
}

for (const warning of warnings) console.warn(`WARN ${warning}`)
for (const error of errors) console.error(`ERROR ${error}`)
console.log(`笔记检查：${published.length} 篇发布笔记，${warnings.length} 条提示，${errors.length} 个错误`)
if (errors.length) process.exitCode = 1
