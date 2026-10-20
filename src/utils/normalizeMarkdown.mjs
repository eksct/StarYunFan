function decodeTarget(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function relativeNoteAssetPath(notePath, target) {
  const parts = notePath.replace(/\\/g, '/').split('/').slice(0, -1)
  for (const segment of target.replace(/\\/g, '/').split('/')) {
    if (!segment || segment === '.') continue
    if (segment === '..') parts.pop()
    else parts.push(segment)
  }
  return parts.join('/')
}

export function normalizeNoteMarkdown(body, { notePath, resolveAsset, resolveWikiLink }) {
  const embeddedImages = body.replace(/!\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g,
    (match, target, alt) => {
      const name = target.trim()
      const url = resolveAsset(decodeTarget(name), notePath)
      return url ? `![${alt || name}](${url})` : `*图片未找到：${name}*`
    })

  const markdownImages = embeddedImages.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (match, alt, target) => {
      if (/^(https?:)?\/\//.test(target) || target.startsWith('data:')) return match
      const url = resolveAsset(decodeTarget(target), notePath)
      return url ? `![${alt}](${url})` : match
    })

  return markdownImages.replace(/(?<!!)\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g,
    (match, target, alias) => {
      const keyword = target.trim()
      return resolveWikiLink(keyword, alias?.trim(), notePath) ?? (alias?.trim() || keyword)
    })
}
