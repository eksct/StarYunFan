import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import MarkdownIt from 'markdown-it'
import { escapeHtml, parseFrontmatter, resolveAssetPath } from '../src/utils/noteData.mjs'
import { normalizeNoteMarkdown, relativeNoteAssetPath } from '../src/utils/normalizeMarkdown.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const notesRoot = path.join(projectRoot, 'public', 'postDir')
const distRoot = path.join(projectRoot, 'dist')
const siteUrl = 'https://eksct.github.io/StarYunFanSite/'
const basePath = '/StarYunFanSite/'
const metadata = JSON.parse(await readFile(path.join(projectRoot, 'src/generated/noteMetadata.json'), 'utf8'))
const publishedNotes = metadata.notes.filter(note => note.category !== '测试' && note.path !== 'test.md')
const markdown = new MarkdownIt({ breaks: true, html: false, linkify: true })

const encodePath = value => value.split('/').map(encodeURIComponent).join('/')
const staticPath = notePath => `notes/${encodePath(notePath)}.html`
const noteByTitle = new Map()
for (const note of publishedNotes) {
  if (!noteByTitle.has(note.title)) noteByTitle.set(note.title, note)
}
const noteByPath = new Map(publishedNotes.map(note => [note.path, note]))
const publishedPaths = new Set(publishedNotes.map(note => note.path))
const styles = [...(await readFile(path.join(distRoot, 'index.html'), 'utf8')).matchAll(/<link[^>]+href="([^\"]+\.css)"[^>]*>/g)]
  .map(([, href]) => `<link rel="stylesheet" href="${escapeHtml(href)}">`)
  .join('\n    ')

function assetUrl(target, notePath) {
  const relativeToNote = relativeNoteAssetPath(notePath, target)
  const resolved = resolveAssetPath(relativeToNote, metadata.assets)
    ?? resolveAssetPath(target, metadata.assets)
  return resolved ? `${basePath}postDir/${encodePath(resolved)}` : undefined
}

function renderBody(raw, notePath) {
  const { body } = parseFrontmatter(raw)
  const normalized = normalizeNoteMarkdown(body, {
    notePath,
    resolveAsset: (target, currentPath) => assetUrl(target, currentPath),
    resolveWikiLink: (target, alias) => {
      const linked = noteByTitle.get(target)
        ?? noteByPath.get(target)
        ?? publishedNotes.find(note => note.path.endsWith(`/${target}.md`))
      return linked ? `[${alias || target}](${basePath}${staticPath(linked.path)})` : undefined
    },
  })
  markdown.renderer.rules.image = (tokens, index) => {
    const token = tokens[index]
    const src = escapeHtml(token.attrGet('src') ?? '')
    const alt = escapeHtml(token.content ?? '')
    return `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">`
  }
  return markdown.render(normalized)
}

async function removeUnpublishedMarkdown(directory, relativeDirectory = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relativePath = path.posix.join(relativeDirectory, entry.name)
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      await removeUnpublishedMarkdown(absolutePath, relativePath)
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md') && !publishedPaths.has(relativePath)) {
      await unlink(absolutePath)
    }
  }
}

await removeUnpublishedMarkdown(path.join(distRoot, 'postDir'))

for (const note of publishedNotes) {
  const raw = await readFile(path.join(notesRoot, ...note.path.split('/')), 'utf8')
  const pageUrl = `${siteUrl}${staticPath(note.path)}`
  const title = `${note.title} · Seiga`
  const description = note.description || `Seiga 的 ${note.category} 笔记：${note.title}`
  const inAppUrl = `${siteUrl}#/notes/${encodePath(note.path)}`
  const article = renderBody(raw, note.path)
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: note.title,
    description,
    datePublished: note.date || undefined,
    author: { '@type': 'Person', name: 'Seiga' },
    mainEntityOfPage: pageUrl,
  }).replace(/</g, '\\u003c')
  const html = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapeHtml(description)}">
    <meta property="og:site_name" content="Seiga 的个人站">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(pageUrl)}">
    <meta property="og:image" content="${siteUrl}og-image.jpg">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="canonical" href="${escapeHtml(pageUrl)}">
    ${styles}
    <title>${escapeHtml(title)}</title>
    <script type="application/ld+json">${jsonLd}</script>
    <script>
      try {
        var stored = localStorage.getItem('site.theme');
        var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      } catch (error) {
        document.documentElement.dataset.theme = 'light';
      }
    </script>
    <style>
      body { min-height: 100vh; margin: 0; padding: 2rem 1rem; color: var(--c-text); background: var(--c-bg); font: 15px/1.7 system-ui, sans-serif; }
      .static-note { max-width: 760px; margin: 0 auto; }
      .static-note a { color: var(--c-accent); }
      .static-note-header { margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--c-border); }
      .static-note-header h1 { color: var(--c-text); line-height: 1.35; }
      .static-note-meta { color: var(--c-text-3); font-size: 13px; }
      .static-note .prose { max-width: none; }
    </style>
  </head>
  <body>
    <main class="static-note">
      <header class="static-note-header">
        <a href="${basePath}">Seiga</a>
        <h1>${escapeHtml(note.title)}</h1>
        <p class="static-note-meta">${escapeHtml(note.category)} · ${escapeHtml(note.date || '未标注日期')}</p>
        <a href="${inAppUrl}">在站内打开</a>
      </header>
      <article class="prose">${article}</article>
    </main>
  </body>
</html>
`

  const outputPath = path.join(distRoot, 'notes', ...note.path.split('/')) + '.html'
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, html, 'utf8')
}

const sitemapUrls = [
  `  <url><loc>${escapeHtml(siteUrl)}</loc></url>`,
  ...publishedNotes.map(note => {
  const location = `${siteUrl}${staticPath(note.path)}`
  const lastmod = note.date ? `<lastmod>${escapeHtml(note.date)}</lastmod>` : ''
  return `  <url><loc>${escapeHtml(location)}</loc>${lastmod}</url>`
  }),
].join('\n')
await writeFile(path.join(distRoot, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`, 'utf8')

console.log(`Generated ${publishedNotes.length} static note pages in dist/notes`)
