export function retryableLoader(load) {
  let pending
  return () => pending ??= Promise.resolve().then(load).catch(error => { pending = undefined; throw error })
}

export function rankEntries(index, keyword) {
  const terms = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean)
  return index.flatMap(entry => {
    const text = entry.text.toLowerCase(), title = entry.title.toLowerCase()
    if (!terms.every(term => text.includes(term))) return []
    const score = terms.reduce((total, term) => total
      + (title === term ? 100 : title.startsWith(term) ? 70 : title.includes(term) ? 50 : 0)
      + (entry.tags.some(tag => tag.toLowerCase().includes(term)) ? 35 : 0)
      + (entry.category.toLowerCase().includes(term) ? 25 : 0) + 10, 0)
    const first = Math.min(...terms.map(term => text.indexOf(term)).filter(index => index >= 0))
    const start = Math.max(0, first - 35)
    return [{ path: entry.path, score, snippet: (start ? '…' : '') + entry.text.slice(start, start + 160) + (text.length > start + 160 ? '…' : '') }]
  }).sort((a, b) => b.score - a.score || a.path.localeCompare(b.path, 'zh-CN'))
}

export function highlightSnippet(text, keyword) {
  const terms = keyword.trim().split(/\s+/).filter(Boolean).sort((a, b) => b.length - a.length)
  if (!terms.length) return [{ text, match: false }]
  const pattern = new RegExp('(' + terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'ig')
  return text.split(pattern).filter(Boolean).map(part => ({ text: part, match: terms.some(term => term.toLowerCase() === part.toLowerCase()) }))
}
