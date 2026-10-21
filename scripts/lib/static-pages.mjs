import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { escapeHtml } from '../../src/utils/noteData.mjs'
import { siteConfig, encodePath, collectionFor } from '../../src/content/siteConfig.mjs'

export async function generateStaticNotes(root, outputDirectory = 'dist') {
  const dist = path.resolve(root, outputDirectory)
  const { notes } = JSON.parse(await readFile(path.join(root, 'src/generated/noteMetadata.json'), 'utf8'))
  const index = await readFile(path.join(dist, 'index.html'), 'utf8')
  const styles = [...index.matchAll(/<link[^>]+href="([^\"]+\.css)"[^>]*>/g)].map(([, href]) => `<link rel="stylesheet" href="${escapeHtml(href)}">`).join('\n')
  for (const note of notes) {
    const { html: article, toc } = JSON.parse(await readFile(path.join(dist, 'note-data', note.path + '.json'), 'utf8'))
    const url = siteConfig.siteUrl + 'notes/' + encodePath(note.path) + '.html'
    const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: note.title, description: note.description, datePublished: note.publishedAt, dateModified: note.updatedAt, author: { '@type': 'Person', name: siteConfig.name }, mainEntityOfPage: url }).replace(/</g, '\\u003c')
    const outline = toc.map(item => `<li><a href="#${encodeURIComponent(item.id)}">${escapeHtml(item.text)}</a></li>`).join('')
    const html = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(note.title)} · ${siteConfig.name}</title>
<meta name="description" content="${escapeHtml(note.description)}">
<meta property="og:site_name" content="${siteConfig.name}"><meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(note.title)} · ${siteConfig.name}"><meta property="og:description" content="${escapeHtml(note.description)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${siteConfig.siteUrl}og-image.jpg">
<meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="${url}">
<link rel="icon" href="${siteConfig.basePath}favicon.ico">${styles}
<script type="application/ld+json">${jsonLd}</script>
<script>try{var t=localStorage.getItem('site.theme')}catch(e){}document.documentElement.dataset.theme=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'</script>
<style>body{margin:0;padding:2rem 1rem;background:var(--c-bg);color:var(--c-text);font:16px/1.75 system-ui,sans-serif}.static-note{max-width:760px;margin:auto;min-width:0}.static-note-header{margin-bottom:2rem;border-bottom:1px solid var(--c-border);padding-bottom:1rem}.static-note-header h1{font-size:2rem;line-height:1.4;overflow-wrap:anywhere}.static-note-meta{font-size:14px;color:var(--c-text-3)}.static-note .prose{max-width:none}details{margin:1rem 0}summary{cursor:pointer}</style>
<script defer src="${siteConfig.basePath}note-interactions.js"></script></head><body>
<a class="skip-link" href="#article">跳到正文</a><main class="static-note">
<header class="static-note-header"><nav aria-label="面包屑"><a href="${siteConfig.basePath}">${siteConfig.name}</a> / <a href="${siteConfig.basePath}#/notes?c=${encodeURIComponent(collectionFor(note.path))}">${escapeHtml(collectionFor(note.path))}</a></nav>
<h1>${escapeHtml(note.title)}</h1><p class="static-note-meta">${escapeHtml(note.category)} · 发布 ${note.publishedAt}${note.updatedAt !== note.publishedAt ? ' · 更新 ' + note.updatedAt : ''}</p>
<a href="${siteConfig.basePath}#/notes/${encodePath(note.path)}">在站内打开</a></header>
${toc.length ? `<details><summary>文章大纲</summary><nav aria-label="文章大纲"><ul>${outline}</ul></nav></details>` : ''}
<article id="article" tabindex="-1" class="prose">${article}</article><p id="interaction-status" role="status" aria-live="polite"></p>
</main></body></html>`
    const destination = path.join(dist, 'notes', note.path + '.html')
    await mkdir(path.dirname(destination), { recursive: true }); await writeFile(destination, html)
  }
  await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteConfig.siteUrl}</loc></url>${notes.map(note => `<url><loc>${siteConfig.siteUrl}notes/${encodePath(note.path)}.html</loc><lastmod>${note.updatedAt}</lastmod></url>`).join('')}</urlset>`)
  console.log(`Generated ${notes.length} static article pages`)
}
