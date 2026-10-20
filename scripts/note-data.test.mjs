import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createAssetIndex,
  escapeHtml,
  parseFrontmatter,
  resolveAssetPath,
  rssDate,
  toIsoDate,
} from '../src/utils/noteData.mjs'

test('frontmatter parser keeps the body and reads scalar and list values', () => {
  const parsed = parseFrontmatter('---\ntitle: Redis\ntags: [Java, Cache]\n---\n正文')
  assert.deepEqual(parsed.data, { title: 'Redis', tags: ['Java', 'Cache'] })
  assert.equal(parsed.body, '正文')
  assert.deepEqual(parseFrontmatter('没有 frontmatter'), { data: {}, body: '没有 frontmatter' })
})

test('date-only frontmatter values stay timezone independent and invalid dates are rejected', () => {
  assert.equal(toIsoDate('2025-03-10'), '2025-03-10')
  assert.equal(toIsoDate('2025-02-30'), '')
  assert.equal(toIsoDate(new Date('2025-03-10T23:00:00-05:00')), '2025-03-11')
})

test('asset lookup prefers a full relative path and only falls back to unique names', () => {
  const assets = createAssetIndex([
    'major/Redis/image.png',
    'major/Docker/image.png',
    'major/Redis/unique.webp',
  ])

  assert.equal(resolveAssetPath('major/Redis/image.png', assets), 'major/Redis/image.png')
  assert.equal(resolveAssetPath('image.png', assets), undefined)
  assert.equal(resolveAssetPath('unique.webp', assets), 'major/Redis/unique.webp')
})

test('RSS dates use the required RFC 822 form and HTML metadata is escaped', () => {
  assert.equal(rssDate('2025-03-10'), 'Mon, 10 Mar 2025 12:00:00 GMT')
  assert.equal(escapeHtml('<a & "b">'), '&lt;a &amp; &quot;b&quot;&gt;')
})
