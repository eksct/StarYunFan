import { parseDocument } from 'yaml'

export function parseFrontmatter(raw) {
  raw = raw.replace(/^\uFEFF/, '')
  const opening = /^---\r?\n/.exec(raw)
  if (!opening) return { data: {}, body: raw }
  const remainder = raw.slice(opening[0].length)
  const closing = /^---[\t ]*(?:\r?\n|$)/m.exec(remainder)
  if (!closing) throw new Error('Frontmatter 缺少结束分隔线')
  const document = parseDocument(remainder.slice(0, closing.index), { uniqueKeys: true, maxAliasCount: 0 })
  if (document.errors.length) throw new Error('Frontmatter 格式错误：' + document.errors[0].message)
  const data = document.toJS({ maxAliasCount: 0 }) ?? {}
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Frontmatter 必须是字段映射')
  const allowed = ['title', 'date', 'publishedAt', 'updatedAt', 'category', 'tags', 'description', 'draft']
  for (const [key, value] of Object.entries(data)) {
    if (!allowed.includes(key)) throw new Error('未知 Frontmatter 字段：' + key)
    if (key === 'draft') {
      if (typeof value !== 'boolean') throw new Error('draft 必须为 true 或 false')
    } else if (key === 'tags') {
      if (!(typeof value === 'string' || (Array.isArray(value) && value.every(tag => typeof tag === 'string' && tag.trim())))) throw new Error('tags 必须是字符串或字符串列表')
    } else {
      if (typeof value !== 'string' || !value.trim()) throw new Error(key + ' 必须是非空字符串')
      if (['date', 'publishedAt', 'updatedAt'].includes(key) && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !toIsoDate(value))) throw new Error('无效日期：' + value)
    }
  }
  return { data, body: remainder.slice(closing.index + closing[0].length) }
}

export function toIsoDate(value) {
  if (typeof value === 'string') {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    if (dateOnly) {
      const [, year, month, day] = dateOnly
      const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
      if (date.getUTCFullYear() !== Number(year)
        || date.getUTCMonth() !== Number(month) - 1
        || date.getUTCDate() !== Number(day)) return ''
      return value
    }
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

export function createAssetIndex(assetPaths) {
  const byPath = Object.fromEntries(assetPaths.map(assetPath => [assetPath.replace(/\\/g, '/'), assetPath]))
  const groupedByName = new Map()

  for (const assetPath of assetPaths) {
    const name = assetPath.split(/[\\/]/).pop()
    const paths = groupedByName.get(name) ?? []
    paths.push(assetPath)
    groupedByName.set(name, paths)
  }

  const byName = Object.fromEntries(
    [...groupedByName.entries()]
      .filter(([, paths]) => paths.length === 1)
      .map(([name, paths]) => [name, paths[0]]),
  )

  return { byPath, byName }
}

export function resolveAssetPath(target, assets) {
  let clean = target.trim().replace(/^\.\//, '').replace(/^[/\\]+/, '')
  try {
    clean = decodeURIComponent(clean)
  } catch {
    // Keep the original path if the note contains a stray percent sign.
  }
  clean = clean.replace(/\\/g, '/')
  const byPath = assets.byPath[clean]
  if (byPath) return byPath
  return assets.byName[clean.split('/').pop() ?? clean]
}

export function rssDate(value) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00.000Z`)
    : new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toUTCString()
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function isDraft(value) {
  return value === true || String(value).toLowerCase() === 'true'
}
