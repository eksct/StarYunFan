import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { escapeHtml } from '../../src/utils/noteData.mjs'
import { siteConfig, encodePath, collectionFor } from '../../src/content/siteConfig.mjs'
import { findSiblings } from '../../src/utils/noteOrder.mjs'

const themeInit = `<script>try{var t=localStorage.getItem('site.theme')}catch(e){}document.documentElement.dataset.theme=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'</script>`
const tools = `<div class="static-tools"><label>外观 <select data-theme-select aria-label="外观主题"><option value="system">自动</option><option value="light">浅色</option><option value="dark">深色</option></select></label><button type="button" class="btn" data-action="print">打印 / 保存 PDF</button></div>`

export async function generateStaticNotes(root, outputDirectory = 'dist') {
  const dist = path.resolve(root, outputDirectory)
  const { notes } = JSON.parse(await readFile(path.join(root, 'src/generated/noteMetadata.json'), 'utf8'))
  const index = await readFile(path.join(dist, 'index.html'), 'utf8')
  const styles = [...index.matchAll(/<link[^>]+href="([^\"]+\.css)"[^>]*>/g)].map(([, href]) => `<link rel="stylesheet" href="${escapeHtml(href)}">`).join('\n')
  for (const note of notes) {
    const { html: article, toc } = JSON.parse(await readFile(path.join(dist, 'note-data', note.path + '.json'), 'utf8'))
    const url = siteConfig.siteUrl + 'notes/' + encodePath(note.path) + '.html'
    const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: note.title, description: note.description, datePublished: note.publishedAt, dateModified: note.updatedAt, author: { '@type': 'Person', name: siteConfig.name }, mainEntityOfPage: url }).replace(/</g, '\\u003c')
    const outline = toc.map(item => `<li style="padding-inline-start:${(item.level - 2) * 0.7}rem"><a href="#${encodeURIComponent(item.id)}">${escapeHtml(item.text)}</a></li>`).join('')
    const { prev, next } = findSiblings(notes, note.path)
    const sibling = (entry, label) => entry ? `<a href="${siteConfig.basePath}notes/${encodePath(entry.path)}.html"><span class="dim">${label}</span><span>${escapeHtml(entry.title)}</span></a>` : '<span></span>'
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
${themeInit}
<script defer src="${siteConfig.basePath}note-interactions.js"></script></head><body class="standalone">
<a class="skip-link" href="#article">跳到正文</a><main class="static-note reading-surface">
<header class="static-note-header"><nav aria-label="面包屑"><a href="${siteConfig.basePath}">${siteConfig.name}</a> / <a href="${siteConfig.basePath}#/notes?c=${encodeURIComponent(collectionFor(note.path))}">${escapeHtml(collectionFor(note.path))}</a></nav>
<h1>${escapeHtml(note.title)}</h1><p class="static-note-meta">${escapeHtml(note.category)} · 发布 ${note.publishedAt}${note.updatedAt !== note.publishedAt ? ' · 更新 ' + note.updatedAt : ''}</p>
<a href="${siteConfig.basePath}#/notes/${encodePath(note.path)}">在站内打开</a>${tools}</header>
${toc.length ? `<details class="static-toc"><summary>文章大纲</summary><nav aria-label="文章大纲"><ul>${outline}</ul></nav></details>` : ''}
<article id="article" tabindex="-1" class="prose">${article}</article><p id="interaction-status" role="status" aria-live="polite"></p>
${prev || next ? `<nav class="static-siblings" aria-label="同目录文章">${sibling(prev, '上一篇')}${sibling(next, '下一篇')}</nav>` : ''}
</main></body></html>`
    const destination = path.join(dist, 'notes', note.path + '.html')
    await mkdir(path.dirname(destination), { recursive: true }); await writeFile(destination, html)
  }
  await writeFile(path.join(dist, '404.html'), `<!DOCTYPE html><html lang="zh-CN" data-theme="light"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex">
<title>页面不存在 · ${siteConfig.name}</title><link rel="icon" href="${siteConfig.basePath}favicon.ico">${styles}${themeInit}
</head><body class="standalone"><main class="static-note reading-surface"><h1>页面不存在</h1><p>链接可能已失效，或者地址输入有误。</p>
<nav class="static-tools" aria-label="返回网站"><a class="btn" href="${siteConfig.basePath}">返回首页</a><a class="btn" href="${siteConfig.basePath}#/notes">浏览 / 搜索笔记</a></nav></main></body></html>`)
  await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteConfig.siteUrl}</loc></url>${notes.map(note => `<url><loc>${siteConfig.siteUrl}notes/${encodePath(note.path)}.html</loc><lastmod>${note.updatedAt}</lastmod></url>`).join('')}</urlset>`)
  console.log(`Generated ${notes.length} static article pages`)
}
