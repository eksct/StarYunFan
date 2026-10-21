import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { projectRoot } from './lib/generate-notes.mjs'
import { findSiblings } from '../src/utils/noteOrder.mjs'
import { siteConfig, encodePath } from '../src/content/siteConfig.mjs'

export async function verifyDist(root = projectRoot, outputDirectory = 'dist') {
  const dist = path.resolve(root, outputDirectory)
  const files = (await readdir(dist, { recursive: true, withFileTypes: true })).filter(entry => entry.isFile()).map(entry => path.relative(dist, path.join(entry.parentPath, entry.name)).replaceAll('\\', '/'))
  assert.ok(!files.some(file => file.split('/').some(segment => segment.startsWith('.')) || /\.md$/i.test(file)), 'Private directories or raw Markdown found in dist')
  const { notes } = JSON.parse(await readFile(path.join(root, 'src/generated/noteMetadata.json'), 'utf8'))
  assert.equal(files.filter(file => file.startsWith('notes/') && file.endsWith('.html')).length, notes.length)
  assert.equal(files.filter(file => file.startsWith('note-data/') && file.endsWith('.json')).length, notes.length)
  const pages = new Map()
  const index = await readFile(path.join(dist, 'index.html'), 'utf8')
  const errorPage = await readFile(path.join(dist, '404.html'), 'utf8')
  assert.match(errorPage, /name="robots" content="noindex"/)
  assert.ok(errorPage.includes(`href="${siteConfig.basePath}#/notes"`), '404 navigation missing')
  assert.ok(files.includes('site-recovery.js'), 'Resource recovery script missing')
  for (const page of [index, errorPage]) {
    for (const [, href] of page.matchAll(/(?:href|src)="([^"#]+)"/g)) {
      if (!href.startsWith(siteConfig.basePath) || href === siteConfig.basePath) continue
      const file = decodeURIComponent(new URL(href, siteConfig.siteUrl).pathname.slice(siteConfig.basePath.length))
      assert.ok(files.includes(file), 'Missing page asset: ' + href)
    }
  }
  for (const note of notes) {
    const data = JSON.parse(await readFile(path.join(dist, 'note-data', note.path + '.json'), 'utf8'))
    const html = await readFile(path.join(dist, 'notes', note.path + '.html'), 'utf8')
    assert.ok(html.includes(`<article id="article" tabindex="-1" class="prose">${data.html}</article>`), note.path + ': body mismatch')
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, note.path + ': duplicate H1')
    assert.ok(html.includes('data-theme-select') && html.includes('data-action="print"'), note.path + ': reader controls missing')
    for (const item of data.toc) {
      assert.ok(html.includes(`href="#${encodeURIComponent(item.id)}"`), note.path + ': TOC link missing')
    }
    const siblings = findSiblings(notes, note.path)
    for (const entry of [siblings.prev, siblings.next].filter(Boolean)) {
      assert.ok(html.includes(`href="${siteConfig.basePath}notes/${encodePath(entry.path)}.html"`), note.path + ': sibling link missing')
    }
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
    assert.equal(ids.length, new Set(ids).size, note.path + ': duplicate anchors')
    pages.set('notes/' + note.path + '.html', { html, ids })
    for (const image of data.html.matchAll(/<img\s[^>]*>/g)) {
      if (!image[0].includes('src="' + siteConfig.basePath)) continue
      assert.match(image[0], /width="\d+" height="\d+"/, note.path + ': image dimensions missing')
      const src = /src="([^"]+)"/.exec(image[0])[1].replaceAll('&amp;', '&')
      assert.ok(files.includes(decodeURIComponent(src.slice(siteConfig.basePath.length))), 'Missing asset: ' + src)
    }
  }
  for (const [file, page] of pages) {
    for (const [, href] of page.html.matchAll(/href="([^"]+)"/g)) {
      if (href.startsWith(siteConfig.basePath + 'postDir/')) {
        const url = new URL(href.replaceAll('&amp;', '&'), siteConfig.siteUrl)
        assert.ok(files.includes(decodeURIComponent(url.pathname.slice(siteConfig.basePath.length))), `${file}: missing attachment ${href}`)
      }
      if (!href.startsWith(siteConfig.basePath + 'notes/')) continue
      const url = new URL(href, siteConfig.siteUrl)
      const destination = decodeURIComponent(url.pathname.slice(siteConfig.basePath.length))
      assert.ok(pages.has(destination), `${file}: missing target ${destination}`)
      if (url.hash) assert.ok(pages.get(destination).ids.includes(decodeURIComponent(url.hash.slice(1))), `${file}: missing anchor ${href}`)
    }
  }
  const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8')
  for (const note of notes) assert.ok(sitemap.includes(siteConfig.siteUrl + 'notes/' + encodePath(note.path) + '.html'))
  console.log(`Verified ${notes.length} article pairs, local links, image dimensions and publication allowlist`)

}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await verifyDist()
