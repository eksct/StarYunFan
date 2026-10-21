import { readdir, stat, readFile, mkdir, writeFile, rm, copyFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { escapeHtml, parseFrontmatter, rssDate, toIsoDate } from '../../src/utils/noteData.mjs'
import { categoryFor, isPublishedNote, siteConfig, encodePath } from '../../src/content/siteConfig.mjs'
import { prepareNote, renderNote } from './render-note.mjs'

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

async function walk(directory, prefix = '') {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const relative = path.posix.join(prefix, entry.name)
    if (entry.isDirectory()) files.push(...await walk(path.join(directory, entry.name), relative))
    else if (entry.isFile()) files.push(relative)
  }
  return files.sort((a, b) => a.localeCompare(b, 'zh-CN'))
}

export function historyDates(root) {
  const dates = new Map()
  try {
    const history = execFileSync('git', ['-c', 'core.quotepath=false', 'log', '--format=@@%cs', '--name-only', '--', 'public/postDir'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    let date = ''
    for (const line of history.split(/\r?\n/)) {
      if (line.startsWith('@@')) date = line.slice(2)
      else if (line.startsWith('public/postDir/')) {
        const key = line.slice('public/postDir/'.length)
        const existing = dates.get(key)
        dates.set(key, { publishedAt: date, updatedAt: existing?.updatedAt ?? date })
      }
    }
  } catch { /* Exported source archives use file dates as a fallback. */ }
  return dates
}

export function noteDates(data, git, fallback) {
  const publishedAt = data.publishedAt || data.date || git?.publishedAt || fallback
  const updatedAt = data.updatedAt || (git?.updatedAt && git.updatedAt > publishedAt ? git.updatedAt : publishedAt)
  if (updatedAt < publishedAt) throw new Error('updatedAt 不能早于 publishedAt')
  return { publishedAt, updatedAt, date: updatedAt }
}

export async function generateNotes(root = projectRoot) {
  const notesRoot = path.join(root, 'public/postDir')
  const stage = path.resolve(root, '.generated-public')
  if (path.dirname(stage) !== path.resolve(root)) throw new Error('Invalid generated public directory')
  // A new allowlist replaces the previous generation, including stale attachments.
  await rm(stage, { recursive: true, force: true })
  await mkdir(stage, { recursive: true })
  for (const name of siteConfig.publicFiles) await copyFile(path.join(root, 'public', name), path.join(stage, name))
  const files = await walk(notesRoot)
  const assets = files.filter(file => /\.(png|jpe?g|gif|webp|svg)$/i.test(file))
  const dates = historyDates(root), notes = []
  for (const notePath of files.filter(file => /\.md$/i.test(file))) {
    const absolute = path.join(notesRoot, notePath)
    let parsed
    try { parsed = parseFrontmatter(await readFile(absolute, 'utf8')) }
    catch (error) { throw new Error(`${notePath}: ${error.message}`) }
    if (!isPublishedNote(notePath, parsed.data)) continue
    const { data, body } = parsed
    notes.push({ path: notePath, title: data.title || path.posix.basename(notePath, '.md'), category: categoryFor(notePath, data),
      ...noteDates(data, dates.get(notePath), toIsoDate((await stat(absolute)).mtime)),
      tags: Array.isArray(data.tags) ? data.tags : (data.tags || '').split(/[,，\s]+/).filter(Boolean),
      description: data.description || '', body, prepared: prepareNote(body) })
  }
  const imageInfo = new Map(), referenced = new Set()
  for (const note of notes) {
    const result = renderNote(note, notes, assets)
    if (result.diagnostics.length) throw new Error(note.path + '\n' + result.diagnostics.join('\n'))
    result.assets.forEach(asset => referenced.add(asset))
  }
  // Decode and compress only images actually referenced by public articles.
  for (const asset of referenced) {
    const input = path.join(notesRoot, asset), buffer = await readFile(input)
    let output = buffer, outputPath = asset, width, height
    if (/\.(png|jpe?g|webp)$/i.test(asset)) {
      const metadata = await sharp(buffer).metadata()
      width = metadata.width; height = metadata.height
      const compressed = await sharp(buffer).webp({ quality: 86, effort: 5 }).toBuffer()
      if (compressed.length < buffer.length * .95) { output = compressed; outputPath = asset + '.webp' }
    } else if (/\.gif$/i.test(asset)) {
      const metadata = await sharp(buffer).metadata(); width = metadata.width; height = metadata.pageHeight || metadata.height
    }
    imageInfo.set(asset, { outputPath, width, height })
    const destination = path.join(stage, 'postDir', outputPath)
    await mkdir(path.dirname(destination), { recursive: true }); await writeFile(destination, output)
  }
  const entries = [], search = []
  for (const note of notes) {
    const result = renderNote(note, notes, assets, imageInfo)
    const words = (result.text.match(/[\p{Script=Han}]|[A-Za-z0-9]+/gu) || []).length
    const metadata = { ...note }
    delete metadata.body; delete metadata.prepared
    metadata.wordCount = words
    metadata.description ||= result.text.slice(0, 100)
    entries.push(metadata)
    search.push({ path: note.path, title: note.title, category: note.category, tags: note.tags, text: `${note.title} ${note.category} ${note.tags.join(' ')} ${result.text}` })
    const destination = path.join(stage, 'note-data', note.path + '.json')
    await mkdir(path.dirname(destination), { recursive: true }); await writeFile(destination, JSON.stringify({ html: result.html, toc: result.toc }))
  }
  entries.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'zh-CN'))
  const generated = path.join(root, 'src/generated')
  await mkdir(generated, { recursive: true })
  await writeFile(path.join(generated, 'noteManifest.ts'), `// Generated; do not edit.\nexport interface NoteFile { path: string; title: string; category: string; date: string; publishedAt: string; updatedAt: string; wordCount: number; tags: string[]; description: string }\nexport const noteFiles: NoteFile[] = ${JSON.stringify(entries, null, 2)}\n`)
  await writeFile(path.join(stage, 'search-index.json'), JSON.stringify(search))
  await writeFile(path.join(generated, 'noteMetadata.json'), JSON.stringify({ notes: entries }, null, 2))
  const feed = entries.slice(0, 30).map(note => {
    const url = siteConfig.siteUrl + 'notes/' + encodePath(note.path) + '.html'
    return `<item><title>${escapeHtml(note.title)}</title><link>${url}</link><guid isPermaLink="false">${escapeHtml(note.path)}</guid><pubDate>${rssDate(note.publishedAt)}</pubDate><category>${escapeHtml(note.category)}</category><description>${escapeHtml(note.description)}</description></item>`
  }).join('\n')
  await writeFile(path.join(stage, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${siteConfig.name} 的笔记</title><link>${siteConfig.siteUrl}</link><description>${escapeHtml(siteConfig.description)}</description><language>zh-CN</language><atom:link href="${siteConfig.siteUrl}feed.xml" rel="self" type="application/rss+xml"/>${feed}</channel></rss>`)
  console.log(`Generated ${entries.length} public notes; allowlisted ${referenced.size} attachments`)
}
