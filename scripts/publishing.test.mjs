import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm, copyFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import sharp from 'sharp'
import { generateNotes, noteDates, projectRoot } from './lib/generate-notes.mjs'
import { generateStaticNotes } from './lib/static-pages.mjs'
import { prepareNote, renderNote, resolveNote } from './lib/render-note.mjs'
import { parseFrontmatter } from '../src/utils/noteData.mjs'
import { collectionFor, siteConfig } from '../src/content/siteConfig.mjs'
import { highlightSnippet, rankEntries, retryableLoader } from '../src/utils/search.mjs'
import { findSiblings, compareNotes } from '../src/utils/noteOrder.mjs'
import { fetchJson } from '../src/utils/fetchJson.mjs'
import { createServer } from 'node:http'

test('search includes fenced and indented examples while descriptions and word counts keep prose semantics', () => {
  const note = makeNote('major/A/note.md', '正文\n\n```java\nSingletonPattern.create();\n```\n\n    indentedExample();\n\n#### Four\n##### Five\n###### Six')
  const result = renderNote(note, [note], [])
  assert.doesNotMatch(result.text, /SingletonPattern|indentedExample/)
  assert.match(result.searchText, /SingletonPattern/)
  assert.match(result.searchText, /indentedExample/)
  assert.deepEqual(result.toc.map(item => item.level), [4, 5, 6])
  assert.equal(rankEntries([{ ...note, tags: [], category: 'A', text: result.searchText }], 'SingletonPattern').length, 1)
})

test('lesson navigation uses natural filename order and never crosses directories', () => {
  const notes = ['A/10.md', 'B/03.md', 'A/02.md', 'A/01.md'].map(path => ({ path }))
  assert.deepEqual([...notes].filter(n => n.path.startsWith('A/')).sort(compareNotes).map(n => n.path), ['A/01.md', 'A/02.md', 'A/10.md'])
  assert.deepEqual(findSiblings(notes, 'A/02.md'), { prev: notes[3], next: notes[0] })
  assert.deepEqual(findSiblings(notes, 'B/03.md'), { prev: undefined, next: undefined })
  assert.deepEqual(findSiblings(notes, 'missing'), {})
})

test('JSON fetch deadline covers a stalled body, handles cancellation and exposes failures for retry', async () => {
  const server = createServer((request, response) => {
    if (request.url === '/stall') { response.writeHead(200, { 'Content-Type': 'application/json' }); response.flushHeaders(); return }
    if (request.url === '/bad') { response.end('<html>not JSON</html>'); return }
    if (request.url === '/error') { response.writeHead(503); response.end(); return }
    response.end('{"ok":true}')
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    await assert.rejects(fetchJson(base + '/stall', { timeoutMs: 100 }), { name: 'TimeoutError' })
    const controller = new AbortController()
    controller.abort()
    await assert.rejects(fetchJson(base + '/stall', { signal: controller.signal }), { name: 'AbortError' })
    await assert.rejects(fetchJson(base + '/bad'), SyntaxError)
    await assert.rejects(fetchJson(base + '/error'), /503/)
    assert.deepEqual(await fetchJson(base + '/ok'), { ok: true })
  } finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  }
})

const makeNote = (file, body = '', title = path.posix.basename(file, '.md')) => ({ path: file, title, body, prepared: prepareNote(body, title) })

test('wiki and Markdown links resolve paths and preserve heading/block anchors without guessing ambiguous titles', () => {
  const a = makeNote('major/A/简介.md', '# 简介\n## 基本用法\n- 内容 ^item')
  const b = makeNote('major/B/简介.md')
  assert.equal(resolveNote('简介', 'major/C/current.md', [a, b]), undefined)
  assert.equal(resolveNote('简介', 'major/A/current.md', [a, b]), a)
  const current = makeNote('major/C/current.md', '[[A/简介#^item|驱逐]]\n[用法](../A/简介.md#基本用法 "标题")')
  const result = renderNote(current, [a, b, current], [])
  assert.deepEqual(result.diagnostics, [])
  assert.match(result.html, /data-note-anchor="block-item"/)
  assert.match(result.html, /data-note-anchor="基本用法"/)
  assert.match(result.html, /title="标题"/)
  const target = renderNote(a, [a, b], [])
  assert.match(target.html, /<li id="block-item">/)
  assert.doesNotMatch(target.html, /<h1|\^item/)
  const ambiguous = makeNote('major/C/test.md', '[[简介]]')
  assert.equal(renderNote(ambiguous, [a, b, ambiguous], []).diagnostics.length, 1)
})

test('code examples stay literal; image titles and dimensions survive token transformations', () => {
  const current = makeNote('major/A/note.md', '# 标题\n`[[Missing]] ![[secret.png]]`\n\n```text\n[[Missing]]\n![[secret.png]]\n```\n\n![替代](../image/pic.png "图片标题")\n\n## Same\n## Same', '标题')
  const result = renderNote(current, [current], ['major/image/pic.png'], new Map([['major/image/pic.png', { outputPath: 'major/image/pic.png.webp', width: 100, height: 50 }]]))
  assert.deepEqual(result.diagnostics, [])
  assert.deepEqual(result.assets, ['major/image/pic.png'])
  assert.match(result.html, /<code>\[\[Missing\]\] !\[\[secret.png\]\]<\/code>/)
  assert.match(result.html, /title="图片标题" width="100" height="50"/)
  assert.deepEqual(result.toc.map(item => item.id), ['same', 'same-1'])
})

test('BOM and empty frontmatter preserve publication fields and body boundaries', () => {
  for (const newline of ['\n', '\r\n']) {
    assert.deepEqual(parseFrontmatter(['\uFEFF---', 'draft: true', '---', 'Body'].join(newline)), { data: { draft: true }, body: 'Body' })
    assert.deepEqual(parseFrontmatter(['---', '---', 'Body'].join(newline)), { data: {}, body: 'Body' })
  }
  assert.deepEqual(parseFrontmatter('---\n---'), { data: {}, body: '' })
  assert.deepEqual(parseFrontmatter('Text\n---\ndraft: true\n---'), { data: {}, body: 'Text\n---\ndraft: true\n---' })
  assert.throws(() => parseFrontmatter('\uFEFF---\ndraft: true'), /缺少结束分隔线/)
})

test('only an actual duplicate page title is hidden; real first sections remain readable', () => {
  const note = makeNote('major/A/Val and Var.md', '# @val\nVal body\n# @var\nVar body')
  const result = renderNote(note, [note], [])
  assert.match(result.html, /<h2 id="val">@val<\/h2>/)
  assert.deepEqual(result.toc.map(item => item.text), ['@val', '@var'])
  const duplicate = makeNote('major/A/title.md', '# title\nBody')
  assert.match(renderNote(duplicate, [duplicate], []).html, /class="article-title-anchor"/)
  assert.doesNotMatch(result.html, /<h1/)
})

test('all heading and block IDs stay unique without taking another heading natural ID', () => {
  const note = makeNote('major/A/note.md', '## Same\n## Same\n## Same-1\n## block-item\n\nText ^item\n\nMore ^item\n\n## article\n## main-content\n\n[[#^item]]\n[[#Same-1]]')
  const result = renderNote(note, [note], [])
  assert.deepEqual(result.diagnostics, [])
  const ids = [...result.html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
  assert.equal(ids.length, new Set(ids).size)
  assert.ok(!ids.includes('article') && !ids.includes('main-content'))
  assert.deepEqual(result.toc.slice(0, 3).map(item => item.id), ['same', 'same-2', 'same-1'])
  assert.match(result.html, /data-note-anchor="block-item-1"/)
  assert.match(result.html, /data-note-anchor="same-1"/)
})

test('URL parsing distinguishes outside Markdown, queries, encoded filenames and remote images', () => {
  const target = makeNote('major/A/C#.md', '## Section')
  const percent = makeNote('major/A/100%20.md', '# Percent')
  const current = makeNote('major/A/note.md', '[external](https://example.com/README.md)\n[query](C%23.md?view=1&x=2#Section)\n[percent](100%2520.md)\n![remote](//example.com/pic.png)')
  const result = renderNote(current, [current, target, percent], [])
  assert.deepEqual(result.diagnostics, [])
  assert.match(result.html, /href="https:\/\/example.com\/README.md"/)
  assert.match(result.html, /C%23.md.html\?view=1&amp;x=2#section/)
  assert.match(result.html, /data-note-query="view=1&amp;x=2"/)
  assert.match(result.html, /100%2520.md.html/)
  assert.match(result.html, /src="\/\/example.com\/pic.png"/)
})

test('linked local images enter the allowlist, use their output URL and unsupported attachments fail explicitly', () => {
  const note = makeNote('major/A/note.md', '[download](pic.png?download=1#preview)')
  const result = renderNote(note, [note], ['major/A/pic.png'], new Map([['major/A/pic.png', { outputPath: 'major/A/pic.png.webp' }]]))
  assert.deepEqual(result.diagnostics, [])
  assert.deepEqual(result.assets, ['major/A/pic.png'])
  assert.match(result.html, /href="\/StarYunFanSite\/postDir\/major\/A\/pic.png.webp\?download=1#preview"/)
  for (const file of ['missing.png', 'unsupported.pdf']) {
    const invalid = makeNote('major/A/note.md', `[download](${file})`)
    assert.match(renderNote(invalid, [invalid], []).diagnostics[0], /不支持或找不到本地附件/)
  }
})

test('real generation excludes BOM drafts and publishes linked images and sized SVGs', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'seiga-publish-edge-'))
  async function put(file, content) { const target = path.join(root, file); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, content) }
  try {
    await mkdir(path.join(root, 'public'), { recursive: true })
    for (const file of siteConfig.publicFiles) await copyFile(path.join(projectRoot, 'public', file), path.join(root, 'public', file))
    await put('public/postDir/major/A/draft.md', '\uFEFF---\ndraft: true\n---\n![[secret.png]]')
    await put('public/postDir/major/A/note.md', '---\n---\n![fixed](fixed.svg)\n![viewbox](viewbox.svg)\n[download](linked.png)')
    await put('public/postDir/major/A/fixed.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect width="20" height="10"/></svg>')
    await put('public/postDir/major/A/viewbox.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 30"><rect width="40" height="30"/></svg>')
    const png = await sharp({ create: { width: 16, height: 12, channels: 3, background: '#369' } }).png().toBuffer()
    await put('public/postDir/major/A/linked.png', png)
    await put('public/postDir/major/A/secret.png', png)
    await generateNotes(root)
    const files = await readdir(path.join(root, '.generated-public'), { recursive: true })
    assert.ok(!files.some(file => /draft|secret/.test(file)))
    assert.ok(files.some(file => file.includes('linked.png')))
    const { notes } = JSON.parse(await readFile(path.join(root, 'src/generated/noteMetadata.json')))
    assert.equal(notes.length, 1)
    const data = JSON.parse(await readFile(path.join(root, '.generated-public/note-data/major/A/note.md.json')))
    assert.match(data.html, /width="20" height="10"/)
    assert.match(data.html, /width="40" height="30"/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('frontmatter validates field names, types, real dates and duplicate keys', () => {
  for (const content of ['draft: yes', 'title: true', 'category: [A]', 'date: 2025-02-30', 'tags: [12]', 'unknown: value', 'title: a\ntitle: b']) {
    assert.throws(() => parseFrontmatter(`---\n${content}\n---\n正文`), content)
  }
  assert.deepEqual(parseFrontmatter('---\ndraft: false\ntags:\n  - Java\n  - "缓存"\n---\n正文').data, { draft: false, tags: ['Java', '缓存'] })
  assert.throws(() => parseFrontmatter('---\ntitle: a'))
})

test('publication and modification dates have independent, stable precedence', () => {
  const git = { publishedAt: '2024-01-01', updatedAt: '2026-01-01' }
  assert.deepEqual(noteDates({}, git, '2026-10-21'), { ...git, date: git.updatedAt })
  assert.deepEqual(noteDates({ date: '2023-01-01', updatedAt: '2026-02-01' }, git, ''), { publishedAt: '2023-01-01', updatedAt: '2026-02-01', date: '2026-02-01' })
  assert.equal(noteDates({ publishedAt: '2026-10-21' }, git, '').updatedAt, '2026-10-21')
  assert.throws(() => noteDates({ publishedAt: '2026-10-01', updatedAt: '2025-01-01' }, git, ''))
  assert.equal(collectionFor('major/编程语言/JAVA/测试.md'), '编程语言')
})

test('search preserves relevance across categories, retries failed loads and escapes query punctuation', async () => {
  let calls = 0
  const loader = retryableLoader(async () => { if (++calls === 1) throw new Error('network'); return ['ok'] })
  await assert.rejects(loader())
  assert.deepEqual(await loader(), ['ok'])
  await loader(); assert.equal(calls, 2)
  const results = rankEntries([
    { path: 'body', title: '别的', category: 'A', tags: [], text: '前言 '.repeat(40) + 'Redis 正文' },
    { path: 'title', title: 'Redis', category: 'B', tags: [], text: 'Redis' },
  ], 'Redis')
  assert.deepEqual(results.map(item => item.path), ['title', 'body'])
  assert.match(results[1].snippet, /Redis/)
  assert.deepEqual(highlightSnippet('<img> C++ [x]', 'C++ [x]').filter(part => part.match).map(part => part.text), ['C++', '[x]'])
})

test('publication allowlist excludes vault settings, raw Markdown and draft-only images; static and SPA bodies are identical', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'seiga-publish-'))
  async function put(file, content) { const target = path.join(root, file); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, content) }
  try {
    for (const file of siteConfig.publicFiles) { await mkdir(path.join(root, 'public'), { recursive: true }); await copyFile(path.join(projectRoot, 'public', file), path.join(root, 'public', file)) }
    await put('public/postDir/major/.obsidian/workspace.json', '{"secret":true}')
    await put('public/postDir/major/A/draft.md', '---\ndraft: true\n---\n![[private.png]]')
    await put('public/postDir/test.md', '# private test')
    await put('public/postDir/major/A/note.md', '# Note\n## Section\n正文\n![[visible.png]]')
    const png = await sharp({ create: { width: 16, height: 12, channels: 3, background: '#336699' } }).png().toBuffer()
    await put('public/postDir/major/image/visible.png', png)
    await put('public/postDir/major/image/private.png', png)
    await generateNotes(root)
    const files = await readdir(path.join(root, '.generated-public'), { recursive: true })
    assert.equal(files.some(file => /obsidian|draft|private|test\.md|note\.md$/.test(file)), false)
    const { notes } = JSON.parse(await readFile(path.join(root, 'src/generated/noteMetadata.json')))
    assert.equal(notes.length, 1)
    const stage = path.join(root, '.generated-public')
    await writeFile(path.join(stage, 'index.html'), '<link rel="stylesheet" href="/assets/main.css">')
    await generateStaticNotes(root, '.generated-public')
    const data = JSON.parse(await readFile(path.join(stage, 'note-data/major/A/note.md.json')))
    const html = await readFile(path.join(stage, 'notes/major/A/note.md.html'), 'utf8')
    assert.ok(html.includes(`<article id="article" tabindex="-1" class="prose">${data.html}</article>`))
    assert.equal((html.match(/<h1/g) || []).length, 1)
    assert.ok(html.includes('dateModified'))
    // Removing a published image reference must remove the old attachment too.
    await put('public/postDir/major/A/note.md', '# Note\nNo image')
    await generateNotes(root)
    assert.equal((await readdir(stage, { recursive: true })).some(file => file.includes('visible.png')), false)
  } finally { await rm(root, { recursive: true, force: true }) }
})
