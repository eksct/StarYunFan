import fs from 'node:fs'
import path from 'node:path'

const root = 'public/postDir'
const backupRoot = '.workbuddy/notes_backup'

const files = []
;(function walk(d, rel) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue
    const p = path.join(d, e.name)
    const r = path.join(rel, e.name)
    if (e.isDirectory()) walk(p, r)
    else if (e.name.endsWith('.md')) files.push(r)
  }
})(root, '')

function visibleText(line) {
  let s = line
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1')
  s = s.replace(/\*([^*]+)\*/g, '$1')
  s = s.replace(/__([^_]+)__/g, '$1')
  s = s.replace(/_([^_]+)_/g, '$1')
  s = s.replace(/^#{1,6}\s+/, '')
  s = s.replace(/^>\s?/, '')
  s = s.replace(/^[-*+]\s+/, '')
  s = s.replace(/^\d+\.\s+/, '')
  s = s.replace(/\|/g, ' ')
  s = s.replace(/!\[\[([^\]]*)\]\]/g, '$1')
  s = s.replace(/\[\[([^\]]*)\]\]/g, '$1')
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  s = s.replace(/`([^`]*)`/g, '$1')
  s = s.replace(/^```.*$/, '')
  return s
}
function signature(text) {
  return text.split('\n').map(visibleText).join('\n').replace(/\s+/g, ' ').trim()
}

let ok = 0
const bad = []
for (const rel of files) {
  const cur = fs.readFileSync(path.join(root, rel), 'utf8')
  const bak = fs.readFileSync(path.join(backupRoot, rel), 'utf8')
  let curLines = cur.replace(/\r\n/g, '\n').split('\n')
  // 备份若无 H1，说明格式化时插入了一行 H1，校验时把它排除
  const bakHasH1 = bak.replace(/\r\n/g, '\n').split('\n').some((l) => /^#\s+\S/.test(l))
  if (!bakHasH1) {
    const idx = curLines.findIndex((l) => /^#\s+\S/.test(l))
    if (idx >= 0) curLines.splice(idx, 1)
  }
  if (signature(curLines.join('\n')) === signature(bak)) ok++
  else bad.push(rel)
}
console.log('逐篇独立校验：一致', ok, '/', files.length)
if (bad.length) { console.log('不一致：'); bad.forEach((b) => console.log('  ✗', b)) }
else console.log('✓ 全部 77 篇格式化后文字内容与备份完全一致')
