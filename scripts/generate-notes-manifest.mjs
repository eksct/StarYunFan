import { readdir, stat, readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const notesRoot = path.join(projectRoot, 'public', 'postDir')
const outputFile = path.join(projectRoot, 'src', 'generated', 'noteManifest.ts')

async function collectMarkdownFiles(directory, relativeDirectory = '') {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue

    const relativePath = path.join(relativeDirectory, entry.name)
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...await collectMarkdownFiles(absolutePath, relativePath))
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(relativePath.split(path.sep).join('/'))
    }
  }

  return files
}

async function collectAssets(directory, relativeDirectory = '') {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  const supportedExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'])

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue

    const relativePath = path.join(relativeDirectory, entry.name)
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...await collectAssets(absolutePath, relativePath))
    } else if (entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(relativePath.split(path.sep).join('/'))
    }
  }

  return files
}

function getCategory(notePath) {
  const segments = notePath.split('/')

  if (segments.length === 1) return '测试'
  if (segments[1] === '编程语言' && segments[2] === 'JAVA') {
    return segments.includes('Spring Boot') ? 'Spring Boot' : 'Java'
  }

  return segments[1] || '其他'
}

function getTitle(notePath) {
  return path.basename(notePath, '.md')
}

// 解析 Obsidian / 通用 frontmatter，仅取构建期需要的纯量字段
function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!match) return { data: {}, body: raw }

  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex <= 0) continue

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!key) continue

    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value.slice(1, -1).split(',').map(item => item.trim()).filter(Boolean)
    } else {
      data[key] = value
    }
  }

  return { data, body: raw.slice(match[0].length) }
}

function toIsoDate(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const pad = number => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// 中文按字计、英文按词计，剔除代码块与 Markdown 语法后估算
function countWords(body) {
  const plain = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[\[[^\]]*\]\]/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|-]/g, ' ')

  const chinese = (plain.match(/[\u4e00-\u9fa5]/g) ?? []).length
  const words = (plain.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length

  return chinese + words
}

function buildDescription(body) {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!?\[\[[^\]]*\]\]/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[#>*_`~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
}

function toTags(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string' && value) {
    return value.split(/[,，\s]+/).map(item => item.trim()).filter(Boolean)
  }
  return []
}

// 正文检索用的纯文本：去掉代码块、图片、链接标记与 Markdown 符号，转小写
function stripForSearch(body) {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/!?\[\[[^\]]*\]\]/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[#>*_`~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}


const paths = (await collectMarkdownFiles(notesRoot)).sort((left, right) => left.localeCompare(right, 'zh-CN'))
const assetPaths = (await collectAssets(notesRoot)).sort((left, right) => left.localeCompare(right, 'zh-CN'))
const entries = []
const searchEntries = []

for (const notePath of paths) {
  const absolutePath = path.join(notesRoot, notePath)
  const [raw, stats] = await Promise.all([readFile(absolutePath, 'utf8'), stat(absolutePath)])
  const { data, body } = parseFrontmatter(raw)

  const title = data.title || getTitle(notePath)
  const category = data.category || getCategory(notePath)
  const tags = toTags(data.tags)

  entries.push({
    path: notePath,
    title,
    category,
    // 优先用 frontmatter 声明的日期，回退到文件修改时间
    date: toIsoDate(data.date) || toIsoDate(stats.mtime),
    updatedAt: stats.mtime.toISOString(),
    wordCount: countWords(body),
    tags,
    description: data.description || buildDescription(body),
  })

  // 正文检索索引：标题 + 分类 + 标签 + 正文，统一小写便于匹配
  searchEntries.push({
    path: notePath,
    title,
    category,
    text: `${title} ${category} ${tags.join(' ')} ${stripForSearch(body)}`,
  })
}

// 时间线归档按日期倒序，日期相同的按标题稳定排序
entries.sort((left, right) =>
  (right.date || '').localeCompare(left.date || '') || left.title.localeCompare(right.title, 'zh-CN'))

const assets = Object.fromEntries(assetPaths.map(assetPath => [path.basename(assetPath), assetPath]))

const output = `// Generated by scripts/generate-notes-manifest.mjs. Do not edit manually.
export interface NoteFile {
  path: string
  title: string
  category: string
  date: string
  updatedAt: string
  wordCount: number
  tags: string[]
  description: string
}

export const noteFiles: NoteFile[] = ${JSON.stringify(entries, null, 2)}

export const noteAssets: Record<string, string> = ${JSON.stringify(assets, null, 2)}
`

const searchIndexPath = path.join(projectRoot, 'src', 'generated', 'searchIndex.ts')
const searchOutput = `// Generated by scripts/generate-notes-manifest.mjs. Do not edit manually.
export interface SearchEntry {
  path: string
  title: string
  category: string
  text: string
}

export const noteSearchIndex: SearchEntry[] = ${JSON.stringify(searchEntries, null, 2)}
`

await mkdir(path.dirname(outputFile), { recursive: true })
await writeFile(outputFile, output, 'utf8')
await writeFile(searchIndexPath, searchOutput, 'utf8')
console.log(`Generated ${entries.length} Markdown entries in ${path.relative(projectRoot, outputFile)}`)
