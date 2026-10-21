import path from 'node:path'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import { guessLanguage } from './guess-language.mjs'
import { escapeHtml } from '../../src/utils/noteData.mjs'
import { encodePath, siteConfig, staticNotePath } from '../../src/content/siteConfig.mjs'

const decode = value => { try { return decodeURIComponent(value) } catch { return value } }
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
  const clean = decode(target).replace(/\\/g, '/').replace(/\.md$/i, '').replace(/^\//, '')
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
  const clean = decode(target).replace(/\\/g, '/').replace(/^\//, '')
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

export function prepareNote(body) {
  const tokens = md.parse(body, {})
  const toc = [], anchors = new Map(), counts = new Map()
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    if (token.type === 'heading_open') {
      const text = inlineText(tokens[index + 1]?.children)
      const base = slugify(text)
      const count = counts.get(base) || 0
      counts.set(base, count + 1)
      const id = count ? `${base}-${count}` : base
      anchors.set(id, id)
      if (!anchors.has(text)) anchors.set(text, id)
      token.attrSet('id', id)
      if (token.tag === 'h1') {
        if (index === 0) {
          // Preserve inbound title anchors while using the page's single H1.
          token.tag = 'span'; tokens[index + 2].tag = 'span'
          token.attrSet('class', 'article-title-anchor')
          tokens[index + 1].children = []
          continue
        }
        token.tag = 'h2'; tokens[index + 2].tag = 'h2'
      }
      if (['h2', 'h3'].includes(token.tag)) toc.push({ level: Number(token.tag.slice(1)), text, id })
    }
    if (token.type === 'inline') {
      const last = token.children?.at(-1)
      const block = last?.type === 'text' && /(?:^|\s)\^([\w-]+)\s*$/.exec(last.content)
      if (block) {
        const id = 'block-' + block[1]
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
        anchors.set('^' + block[1], id); anchors.set(id, id)
      }
    }
  }
  return { tokens, toc, anchors }
}

export function renderNote(note, notes, assets, imageInfo = new Map()) {
  const diagnostics = [], referencedAssets = new Set()
  const prepared = prepareNote(note.body)
  function noteLink(target, label, token) {
    const hash = target.indexOf('#')
    const notePart = hash < 0 ? target : target.slice(0, hash)
    const fragment = hash < 0 ? '' : decode(target.slice(hash + 1))
    const linked = resolveNote(notePart, note.path, notes)
    if (!linked) { diagnostics.push(`无法唯一解析笔记链接：${target}`); return undefined }
    const anchorMap = linked.prepared?.anchors ?? prepareNote(linked.body).anchors
    const anchor = fragment ? anchorMap.get(fragment) ?? anchorMap.get(slugify(fragment)) : ''
    if (fragment && !anchor) { diagnostics.push(`找不到锚点：${target}`); return undefined }
    const href = staticNotePath(linked.path) + (anchor ? '#' + encodeURIComponent(anchor) : '')
    if (token) {
      token.attrSet('href', href); token.attrSet('data-note-path', linked.path)
      if (anchor) token.attrSet('data-note-anchor', anchor)
    }
    return `<a href="${escapeHtml(href)}" data-note-path="${escapeHtml(linked.path)}"${anchor ? ` data-note-anchor="${escapeHtml(anchor)}"` : ''}>${escapeHtml(label)}</a>`
  }
  function image(target, label, title = '') {
    let src = target, dimensions = ''
    if (!/^https?:\/\//i.test(target)) {
      const asset = resolveAttachment(target, note.path, assets)
      if (!asset) { diagnostics.push(`找不到图片：${target}`); return `<span class="image-error">图片不可用：${escapeHtml(label || target)}</span>` }
      referencedAssets.add(asset)
      const info = imageInfo.get(asset)
      src = siteConfig.basePath + 'postDir/' + encodePath(info?.outputPath ?? asset)
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
    if (href.startsWith('#') || /\.md(?:#|$)/i.test(decode(href))) {
      if (!noteLink(decode(href), '', token)) { token.attrSet('href', '#'); token.attrSet('aria-disabled', 'true') }
    } else if (/^https?:\/\//i.test(href)) token.attrSet('rel', 'noopener noreferrer')
    return self.renderToken(tokens, index, options)
  }
  renderer.rules.table_open = () => '<div class="table-scroll" role="region" aria-label="表格，可横向滚动" tabindex="0"><table>\n'
  renderer.rules.table_close = () => '</table></div>\n'
  const html = renderer.render(prepared.tokens, md.options, {})
  const text = prepared.tokens.filter(token => token.type === 'inline').map(token => inlineText(token.children)).join(' ').replace(/\s+/g, ' ').trim()
  return { html, toc: prepared.toc, text, assets: [...referencedAssets], diagnostics }
}
