// Markdown 渲染：代码块高亮、标题锚点、Obsidian 语法兼容
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import type { LanguageFn } from 'highlight.js'
import bash from 'highlight.js/lib/languages/bash'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import css from 'highlight.js/lib/languages/css'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import go from 'highlight.js/lib/languages/go'
import ini from 'highlight.js/lib/languages/ini'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import kotlin from 'highlight.js/lib/languages/kotlin'
import markdown from 'highlight.js/lib/languages/markdown'
import nginx from 'highlight.js/lib/languages/nginx'
import properties from 'highlight.js/lib/languages/properties'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import { noteAssets, noteFiles } from '@/generated/noteManifest'
import { encodeAssetPath, noteUrl } from '@/utils/notes'

// 只注册笔记里真正出现的语言，避免把整个 highlight.js 打进包里
const languages: [string, LanguageFn][] = [
  ['bash', bash], ['c', c], ['cpp', cpp], ['css', css], ['dockerfile', dockerfile],
  ['go', go], ['ini', ini], ['java', java], ['javascript', javascript], ['json', json],
  ['kotlin', kotlin], ['markdown', markdown], ['nginx', nginx], ['properties', properties],
  ['python', python], ['sql', sql], ['typescript', typescript], ['xml', xml], ['yaml', yaml],
]

for (const [name, definition] of languages) {
  hljs.registerLanguage(name, definition)
}

// 无语言标记的代码块：用高精度的签名规则识别，仅在确信时返回语言名，
// 否则返回空串（保持纯文本），避免 highlight.js 统计式自动识别在短片段上误标。
function guessLanguage(code: string): string {
  const text = code.trim()
  if (!text) return ''

  const first = text.split('\n', 1)[0]

  // JSON：用真正的解析兜底，最可靠
  if (text[0] === '{' || text[0] === '[') {
    try {
      JSON.parse(text)
      return 'json'
    }
    catch {
      // 含 "键": 形态的也按 JSON 处理（容忍尾部逗号等）
      if (/"\s*[:=]/.test(text)) return 'json'
    }
  }

  // SQL
  if (/^\s*(select|insert|update|delete|create|alter|drop|truncate|with|merge|grant|revoke)\b/i.test(text)) {
    return 'sql'
  }

  // Dockerfile
  if (/^\s*(FROM|RUN|CMD|ENTRYPOINT|COPY|ADD|WORKDIR|ENV|EXPOSE|LABEL|ARG|USER|VOLUME)\b/m.test(text)) {
    return 'dockerfile'
  }

  // Nginx
  if (/^\s*(server|location|upstream|http|events|stream)\s*\{/m.test(text) || /^\s*listen\s+\d/m.test(text)) {
    return 'nginx'
  }

  // Shell / Bash
  if (/^#!.*\b(sh|bash)\b/.test(first)
    || /^\s*\$\s/.test(first)
    || /^\s*(sudo|apt|apt-get|yum|dnf|pacman|npm|pnpm|yarn|pip|pip3|docker|kubectl|git|curl|wget|cd|ls|cat|echo|export|source|systemctl|service|chmod|chown|mkdir|rm|cp|mv|tar|ssh|scp|ps|kill|grep)\b/.test(first)) {
    return 'bash'
  }

  // INI（含 [section]）
  if (/^\[[^\]]+\]\s*$/m.test(text)) return 'ini'

  // Properties（key=value）
  if (/^[A-Za-z0-9_.\-]+\s*=/.test(text) && !/[{}[\];]/.test(text)) return 'properties'

  // Java
  if (/\b(public|private|protected)\s+(class|interface|enum|void|static|final)\b/.test(text)
    || /\bsystem\.out\b/i.test(text)
    || /@(override|autowired|service|component|repository|controller|postmapping|getmapping|requestmapping)/i.test(text)) {
    return 'java'
  }

  // Python
  if (/\b(def |import |from \w+ import|print\()/.test(text) && /:\s*$/m.test(text)) return 'python'

  // Go
  if (/\b(func |package \w|import \(|fmt\.Print)/.test(text)) return 'go'

  // YAML（key: value，无 = 与 {}）
  if (/^[A-Za-z0-9_.\-]+\s*:\s*\S/m.test(text) && !text.includes('=') && !/[{}[\]]/.test(text)) {
    return 'yaml'
  }

  // XML / HTML
  if (/<[a-zA-Z][\w-]*(\s[^>]*)?>/.test(text) && /<\/[a-zA-Z][\w-]*>/.test(text)) return 'xml'

  // CSS
  if (/^\s*[A-Za-z-]+\s*\{[^}]*:[^}]*\}/m.test(text)) return 'css'

  return ''
}

export interface TocItem {
  level: number
  text: string
  id: string
}

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const assetBase = () => `${import.meta.env.BASE_URL}postDir/`

function resolveAsset(target: string): string | undefined {
  const clean = target.trim().replace(/^\.\//, '').replace(/^["'<]+|["'>]+$/g, '')
  const baseName = clean.split('/').pop() ?? clean
  return noteAssets[baseName] ?? noteAssets[clean]
}

function toAssetUrl(target: string): string | undefined {
  const resolved = resolveAsset(target)
  return resolved ? `${assetBase()}${encodeAssetPath(resolved)}` : undefined
}

// Obsidian 的 ![[图片]] 语法
function normalizeObsidianImageEmbeds(content: string): string {
  return content.replace(
    /!\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g,
    (match, target: string, alt?: string) => {
      const url = toAssetUrl(target)
      if (!url) return `*图片未找到：${target.trim()}*`
      return `![${(alt || target.trim())}](${url})`
    },
  )
}

// 相对于笔记目录的图片引用
function normalizeRelativeImages(content: string): string {
  return content.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (match, alt: string, target: string) => {
      if (/^(https?:)?\/\//.test(target) || target.startsWith('data:')) return match

      const url = toAssetUrl(decodeURIComponent(target))
      return url ? `![${alt}](${url})` : match
    },
  )
}

// Obsidian 的 [[双链]]，能匹配到笔记就转成站内链接
function normalizeWikiLinks(content: string): string {
  return content.replace(
    /(?<!!)\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g,
    (match, target: string, alias?: string) => {
      const keyword = target.trim()
      const linked = noteFiles.find(note => note.title === keyword)
        ?? noteFiles.find(note => note.path.endsWith(`${keyword}.md`))

      const label = (alias || keyword).trim()
      return linked ? `[${label}](${noteUrl(linked.path)})` : label
    },
  )
}

let tocBuffer: TocItem[] = []
const slugCounter = new Map<string, number>()

// 大纲要显示纯文本，标题里的 **加粗** `代码` 之类记号得先渲染再剥标签
function toPlainText(inline: string): string {
  return markdownIt.renderInline(inline)
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function slugify(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')

  return base || 'section'
}

function uniqueSlug(text: string): string {
  const base = slugify(text)
  const seen = slugCounter.get(base) ?? 0
  slugCounter.set(base, seen + 1)
  return seen === 0 ? base : `${base}-${seen}`
}

const markdownIt = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
})

markdownIt.renderer.rules.fence = (tokens, index) => {
  const token = tokens[index]
  const declared = token.info.trim().split(/\s+/)[0]

  let language = declared
  let highlighted: string

  if (language && hljs.getLanguage(language)) {
    // 显式标注且受支持：直接用指定语言高亮
    highlighted = hljs.highlight(token.content, { language }).value
  } else {
    // 无标记或标记不受支持：尝试签名识别，识别不出则纯文本
    const guessed = !declared ? guessLanguage(token.content) : ''
    language = guessed || 'text'
    highlighted = language === 'text'
      ? escapeHtml(token.content)
      : hljs.highlight(token.content, { language }).value
  }

  const label = escapeHtml(language)
  return `<div class="code-block">`
    + `<div class="code-block-bar"><span>${label}</span>`
    + `<button type="button" class="code-copy" data-action="copy">复制</button></div>`
    + `<pre><code class="hljs language-${label}">${highlighted}</code></pre>`
    + `</div>\n`
}

markdownIt.renderer.rules.heading_open = (tokens, index) => {
  const token = tokens[index]
  const level = Number(token.tag.slice(1))

  if (level !== 2 && level !== 3) return `<${token.tag}>`

  const inline = tokens[index + 1]
  const text = toPlainText(inline?.content ?? '')
  const id = uniqueSlug(text)
  tocBuffer.push({ level, text, id })

  return `<${token.tag} id="${id}">`
}

export function renderMarkdown(raw: string): { html: string; toc: TocItem[] } {
  tocBuffer = []
  slugCounter.clear()

  const normalized = normalizeWikiLinks(normalizeRelativeImages(normalizeObsidianImageEmbeds(raw)))
  const html = markdownIt.render(normalized)

  return { html, toc: tocBuffer }
}
