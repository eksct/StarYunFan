export function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!match) return { data: {}, body: raw }

  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex <= 0) continue

    const key = line.slice(0, separatorIndex).trim()
    const rawValue = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!key) continue

    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      data[key] = rawValue.slice(1, -1).split(',').map(item => item.trim()).filter(Boolean)
    } else {
      data[key] = rawValue
    }
  }

  return { data, body: raw.slice(match[0].length) }
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
