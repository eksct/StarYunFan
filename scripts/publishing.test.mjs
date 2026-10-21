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

const makeNote = (file, body = '', title = path.posix.basename(file, '.md')) => ({ path: file, title, body, prepared: prepareNote(body) })

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
  const current = makeNote('major/A/note.md', '# 标题\n`[[Missing]] ![[secret.png]]`\n\n```text\n[[Missing]]\n![[secret.png]]\n```\n\n![替代](../image/pic.png "图片标题")\n\n## Same\n## Same')
  const result = renderNote(current, [current], ['major/image/pic.png'], new Map([['major/image/pic.png', { outputPath: 'major/image/pic.png.webp', width: 100, height: 50 }]]))
  assert.deepEqual(result.diagnostics, [])
  assert.deepEqual(result.assets, ['major/image/pic.png'])
  assert.match(result.html, /<code>\[\[Missing\]\] !\[\[secret.png\]\]<\/code>/)
  assert.match(result.html, /title="图片标题" width="100" height="50"/)
  assert.deepEqual(result.toc.map(item => item.id), ['same', 'same-1'])
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
