import path from 'node:path'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import { guessLanguage } from './guess-language.mjs'
import { escapeHtml } from '../../src/utils/noteData.mjs'
import { encodePath, siteConfig, staticNotePath } from '../../src/content/siteConfig.mjs'

const decode = value => { try { return decodeURIComponent(value) } catch { return value } }
const isRemote = value => /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)
function splitTarget(value) {
  const hash = value.indexOf('#')
  const beforeHash = hash < 0 ? value : value.slice(0, hash)
  const query = beforeHash.indexOf('?')
  return { pathname: decode(query < 0 ? beforeHash : beforeHash.slice(0, query)),
    search: query < 0 ? '' : beforeHash.slice(query), fragment: hash < 0 ? '' : decode(value.slice(hash + 1)),
    suffix: (query < 0 ? '' : beforeHash.slice(query)) + (hash < 0 ? '' : value.slice(hash)) }
}
export const slugify = value => value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\p{L}\p{N}-]/gu, '') || 'section'

// The inline parser never visits fenced or inline code.
function wikiRule(state, silent) {
  const start = state.pos
  const image = state.src.startsWith('![[', start)
  if (!image && (!state.src.startsWith('[[', start) || state.linkLevel > 0)) return false
  const end = state.src.indexOf(']]', start + (image ? 3 : 2))
  if (end < 0) return false
  if (!silent) {
    const [target, ...alias] = state.src.slice(start + (image ? 3 : 2), end).split('|')
    const token = state.push(image ? 'wiki_image' : 'wiki_link', '', 0)
    token.meta = { target: target.trim(), label: alias.join('|') || target }
  }
  state.pos = end + 2
  return true
}

export function resolveNote(target, current, notes) {
  const clean = target.replace(/\\/g, '/').replace(/\.md$/i, '').replace(/^\//, '')
  if (!clean) return notes.find(note => note.path === current)
  const withoutExt = value => value.replace(/\.md$/i, '')
  const exact = notes.find(note => withoutExt(note.path) === clean)
  if (exact) return exact
  const relative = path.posix.normalize(path.posix.join(path.posix.dirname(current), clean))
  const nearby = notes.find(note => withoutExt(note.path) === relative)
  if (nearby) return nearby
  const matches = notes.filter(note => withoutExt(note.path).endsWith('/' + clean)
    || (!clean.includes('/') && note.title === clean))
  return matches.length === 1 ? matches[0] : undefined
}

export function resolveAttachment(target, current, assets) {
  const clean = target.replace(/\\/g, '/').replace(/^\//, '')
  const relative = path.posix.normalize(path.posix.join(path.posix.dirname(current), clean))
  const exact = assets.find(asset => asset === relative) ?? assets.find(asset => asset === clean)
  if (exact) return exact
  const matches = assets.filter(asset => asset.endsWith('/' + clean) || asset === clean)
  return matches.length === 1 ? matches[0] : undefined
}

const md = new MarkdownIt({ breaks: true, html: false, linkify: true })
md.inline.ruler.before('image', 'wiki', wikiRule)
md.renderer.rules.fence = (tokens, index) => {
  const token = tokens[index]
  const language = token.info.trim().split(/\s+/)[0] || guessLanguage(token.content) || 'text'
  const code = hljs.getLanguage(language) ? hljs.highlight(token.content, { language }).value : escapeHtml(token.content)
  return `<div class="code-block"><div class="code-block-bar"><span>${escapeHtml(language)}</span><button type="button" class="code-copy" data-action="copy">复制</button></div><pre tabindex="0"><code class="hljs language-${escapeHtml(language)}">${code}</code></pre></div>\n`
}

function inlineText(tokens = []) {
  return tokens.map(token => ['text', 'code_inline', 'image'].includes(token.type) ? token.content
    : token.type === 'wiki_link' ? token.meta.label : ['softbreak', 'hardbreak'].includes(token.type) ? ' ' : '').join('')
}

export function prepareNote(body, title = '') {
  const tokens = md.parse(body, {})
  const toc = [], anchors = new Map()
  const used = new Set(['article', 'interaction-status', 'main-content', 'main-navigation', 'feed-menu', 'share-menu', 'vignette'])
  const preferred = new Set()
  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index].type === 'heading_open') preferred.add(slugify(inlineText(tokens[index + 1]?.children)))
    const last = tokens[index].type === 'inline' && tokens[index].children?.at(-1)
    const block = last?.type === 'text' && /(?:^|\s)\^([\w-]+)\s*$/.exec(last.content)
    if (block) preferred.add('block-' + block[1])
  }
  function uniqueId(base) {
    let id = base, suffix = 1
    while (used.has(id) || (id !== base && preferred.has(id))) id = `${base}-${suffix++}`
    used.add(id)
    return id
  }
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    if (token.type === 'heading_open') {
      const text = inlineText(tokens[index + 1]?.children)
      const id = uniqueId(slugify(text))
      anchors.set(id, id)
      if (!anchors.has(text)) anchors.set(text, id)
      token.attrSet('id', id)
      if (token.tag === 'h1') {
        if (index === 0 && text.trim() === title.trim()) {
          // Preserve inbound title anchors while using the page's single H1.
          token.tag = 'span'; tokens[index + 2].tag = 'span'
          token.attrSet('class', 'article-title-anchor')
          tokens[index + 1].children = []
          continue
        }
        token.tag = 'h2'; tokens[index + 2].tag = 'h2'
      }
      if (/^h[2-6]$/.test(token.tag)) toc.push({ level: Number(token.tag.slice(1)), text, id })
    }
    if (token.type === 'inline') {
      const last = token.children?.at(-1)
      const block = last?.type === 'text' && /(?:^|\s)\^([\w-]+)\s*$/.exec(last.content)
      if (block) {
        const id = uniqueId('block-' + block[1])
        last.content = last.content.slice(0, block.index)
        const parent = tokens[index - 1]
        if (parent?.nesting === 1 && !parent.attrGet('id')) parent.attrSet('id', id)
        else {
          const anchor = new token.constructor('html_inline', '', 0)
          anchor.content = `<span id="${id}"></span>`
          token.children.push(anchor)
        }
        // Tight list paragraphs are hidden by MarkdownIt, so put their anchor on the item.
        if (parent?.hidden && tokens[index - 2]?.type === 'list_item_open') tokens[index - 2].attrSet('id', id)
        if (!anchors.has('^' + block[1])) anchors.set('^' + block[1], id)
        anchors.set(id, id)
      }
    }
  }
  return { tokens, toc, anchors }
}

export function renderNote(note, notes, assets, imageInfo = new Map()) {
  const diagnostics = [], referencedAssets = new Set()
  const prepared = prepareNote(note.body, note.title)
  function noteLink(target, label, token) {
    const { pathname, search, fragment } = splitTarget(target)
    const linked = resolveNote(pathname, note.path, notes)
    if (!linked) { diagnostics.push(`无法唯一解析笔记链接：${target}`); return undefined }
    const anchorMap = linked.prepared?.anchors ?? prepareNote(linked.body, linked.title).anchors
    const anchor = fragment ? anchorMap.get(fragment) ?? anchorMap.get(slugify(fragment)) : ''
    if (fragment && !anchor) { diagnostics.push(`找不到锚点：${target}`); return undefined }
    const href = staticNotePath(linked.path) + search + (anchor ? '#' + encodeURIComponent(anchor) : '')
    if (token) {
      token.attrSet('href', href); token.attrSet('data-note-path', linked.path)
      if (search) token.attrSet('data-note-query', search.slice(1))
      if (anchor) token.attrSet('data-note-anchor', anchor)
    }
    return `<a href="${escapeHtml(href)}" data-note-path="${escapeHtml(linked.path)}"${search ? ` data-note-query="${escapeHtml(search.slice(1))}"` : ''}${anchor ? ` data-note-anchor="${escapeHtml(anchor)}"` : ''}>${escapeHtml(label)}</a>`
  }
  function attachment(target) {
    const { pathname, suffix } = splitTarget(target)
    const asset = resolveAttachment(pathname, note.path, assets)
    if (!asset) return undefined
    referencedAssets.add(asset)
    const info = imageInfo.get(asset)
    return { src: siteConfig.basePath + 'postDir/' + encodePath(info?.outputPath ?? asset) + suffix, info }
  }
  function image(target, label, title = '') {
    let src = target, dimensions = ''
    if (!isRemote(target)) {
      const result = attachment(target)
      if (!result) { diagnostics.push(`找不到图片：${target}`); return `<span class="image-error">图片不可用：${escapeHtml(label || target)}</span>` }
      const { info } = result
      src = result.src
      if (info?.width && info?.height) dimensions = ` width="${info.width}" height="${info.height}"`
    } else if (!md.validateLink(target)) return escapeHtml(label)
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(label)}"${title ? ` title="${escapeHtml(title)}"` : ''}${dimensions} role="button" tabindex="0" aria-label="查看大图：${escapeHtml(label || '图片')}" loading="lazy" decoding="async" class="prose-img">`
  }
  const renderer = new MarkdownIt().renderer
  renderer.rules = { ...md.renderer.rules }
  renderer.rules.wiki_link = (tokens, index) => {
    const { target, label } = tokens[index].meta
    return noteLink(target, label) ?? `<span class="unresolved-link">${escapeHtml(label)}</span>`
  }
  renderer.rules.wiki_image = (tokens, index) => {
    const { target, label } = tokens[index].meta
    return image(target, /^\d+(?:x\d+)?$/.test(label) ? '' : label)
  }
  renderer.rules.image = (tokens, index) => image(tokens[index].attrGet('src') || '', tokens[index].content, tokens[index].attrGet('title') || '')
  renderer.rules.link_open = (tokens, index, options, env, self) => {
    const token = tokens[index], href = token.attrGet('href') || ''
    if (isRemote(href)) {
      token.attrSet('rel', 'noopener noreferrer')
    } else if (href.startsWith('#') || /\.md$/i.test(splitTarget(href).pathname)) {
      if (!noteLink(href, '', token)) { token.attrSet('href', '#'); token.attrSet('aria-disabled', 'true') }
    } else if (/\.[^/.]+$/.test(splitTarget(href).pathname)) {
      const result = attachment(href)
      if (result) token.attrSet('href', result.src)
      else diagnostics.push(`不支持或找不到本地附件：${href}`)
    }
    return self.renderToken(tokens, index, options)
  }
  renderer.rules.table_open = () => '<div class="table-scroll" role="region" aria-label="表格，可横向滚动" tabindex="0"><table>\n'
  renderer.rules.table_close = () => '</table></div>\n'
  const html = renderer.render(prepared.tokens, md.options, {})
  const text = prepared.tokens.filter(token => token.type === 'inline').map(token => inlineText(token.children)).join(' ').replace(/\s+/g, ' ').trim()
  const searchText = prepared.tokens.map(token => token.type === 'inline' ? inlineText(token.children)
    : ['fence', 'code_block'].includes(token.type) ? token.content : '').join(' ').replace(/\s+/g, ' ').trim()
  return { html, toc: prepared.toc, text, searchText, assets: [...referencedAssets], diagnostics }
}
