import { readdir, stat, readFile, mkdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createAssetIndex, escapeHtml, isDraft, parseFrontmatter, rssDate, toIsoDate } from '../src/utils/noteData.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const notesRoot = path.join(projectRoot, 'public', 'postDir')
const outputFile = path.join(projectRoot, 'src', 'generated', 'noteManifest.ts')
const gitDates = new Map()

try {
  const history = execFileSync('git', ['log', '--format=@@%cs', '--name-only', '--', 'public/postDir'], {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  let currentDate = ''
  for (const line of history.split(/\r?\n/)) {
    if (line.startsWith('@@')) {
      currentDate = line.slice(2)
    } else if (line.startsWith('public/postDir/')) {
      const notePath = line.slice('public/postDir/'.length).replace(/\\/g, '/')
      if (!gitDates.has(notePath)) gitDates.set(notePath, currentDate)
    }
  }
} catch {
  // Use the local file modification date when Git history is unavailable.
}

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

// RSS 用的站点绝对地址（GitHub Pages 部署路径）
const siteUrl = 'https://eksct.github.io/StarYunFanSite/'

for (const notePath of paths) {
  const absolutePath = path.join(notesRoot, notePath)
  const [raw, stats] = await Promise.all([readFile(absolutePath, 'utf8'), stat(absolutePath)])
  const { data, body } = parseFrontmatter(raw)

  const title = data.title || getTitle(notePath)
  const category = data.category || getCategory(notePath)
  const tags = toTags(data.tags)
  if (isDraft(data.draft) || category === '测试' || notePath === 'test.md') continue

  entries.push({
    path: notePath,
    title,
    category,
    // 优先用 frontmatter；CI 使用笔记最近提交日期，避免 checkout 时间污染归档。
    date: toIsoDate(data.date) || gitDates.get(notePath) || toIsoDate(stats.mtime),
    wordCount: countWords(body),
    tags,
    description: data.description || buildDescription(body),
  })

  // 正文检索索引：标题 + 分类 + 标签 + 正文，统一小写便于匹配
  searchEntries.push({
    path: notePath,
    title,
    category,
    tags,
    text: `${title} ${category} ${tags.join(' ')} ${stripForSearch(body)}`,
  })
}

// 时间线归档按日期倒序，日期相同的按标题稳定排序
entries.sort((left, right) =>
  (right.date || '').localeCompare(left.date || '') || left.title.localeCompare(right.title, 'zh-CN'))

const assets = createAssetIndex(assetPaths)

const output = `// Generated by scripts/generate-notes-manifest.mjs. Do not edit manually.
export interface NoteFile {
  path: string
  title: string
  category: string
  date: string
  wordCount: number
  tags: string[]
  description: string
}

export const noteFiles: NoteFile[] = ${JSON.stringify(entries, null, 2)}

export const noteAssets: { byPath: Record<string, string>; byName: Record<string, string> } = ${JSON.stringify(assets, null, 2)}
`

const searchIndexPath = path.join(projectRoot, 'src', 'generated', 'searchIndex.ts')
const metadataPath = path.join(projectRoot, 'src', 'generated', 'noteMetadata.json')
const searchOutput = `// Generated by scripts/generate-notes-manifest.mjs. Do not edit manually.
export interface SearchEntry {
  path: string
  title: string
  category: string
  tags: string[]
  text: string
}

export const noteSearchIndex: SearchEntry[] = ${JSON.stringify(searchEntries, null, 2)}
`

await mkdir(path.dirname(outputFile), { recursive: true })
await writeFile(outputFile, output, 'utf8')
await writeFile(searchIndexPath, searchOutput, 'utf8')
await writeFile(metadataPath, JSON.stringify({ notes: entries, assets }, null, 2), 'utf8')
console.log(`Generated ${entries.length} Markdown entries in ${path.relative(projectRoot, outputFile)}`)

// ---- RSS / Atom：把最新笔记生成 public/feed.xml，构建时随 public 拷贝进 dist ----
const feedEntries = entries
  .filter(entry => entry.category !== '测试' && entry.path !== 'test.md')
  .slice(0, 30)

const feedItems = feedEntries.map(entry => {
  const noteLink = `${siteUrl}notes/${entry.path.split('/').map(encodeURIComponent).join('/')}.html`
  return `    <item>
      <title>${escapeHtml(entry.title)}</title>
      <link>${noteLink}</link>
      <guid isPermaLink="false">${escapeHtml(entry.path)}</guid>
      <pubDate>${rssDate(entry.date)}</pubDate>
      <category>${escapeHtml(entry.category)}</category>
      <description>${escapeHtml(entry.description)}</description>
    </item>`
}).join('\n')

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Seiga 的笔记</title>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}feed.xml" rel="self" type="application/rss+xml" />
    <description>StarYunFan 个人站的笔记归档：Java、Spring Boot、Redis、Docker 等</description>
    <language>zh-CN</language>
    <lastBuildDate>${rssDate(feedEntries[0]?.date || '1970-01-01')}</lastBuildDate>
${feedItems}
  </channel>
</rss>
`

await writeFile(path.join(projectRoot, 'public', 'feed.xml'), feed, 'utf8')
console.log(`Generated feed.xml with ${feedEntries.length} items`)
