import fs from 'node:fs'
import path from 'node:path'

const root = 'public/postDir'

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

// 剥掉 Markdown 语法，只留"可见文字"，用于内容签名校验
// 注意：强调标记(**、*)必须先剥，否则原文(被 ** 包住)与结果(已去 **)在
// 后续"去有序列表序号 ^\d+\.\s+"等步骤上行为不一致，会制造虚假差异。
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
  return text
    .split('\n')
    .map(visibleText)
    .join('\n')
    .replace(/\s+/g, ' ')
    .trim()
}

// 标题：补一个空格 + 剥掉 ** / 包绕的 *
function normalizeHeading(line) {
  const m = /^(#{1,6})(.*)$/.exec(line)
  if (!m) return line
  const hashes = m[1]
  let text = m[2].replace(/^\s+|\s+$/g, '')
  text = text.replace(/\*\*/g, '') // 去掉 **
  text = text.replace(/^\s*\*(.+)\*\s*$/, '$1') // 去掉整行包绕的 *
  return text ? `${hashes} ${text}` : hashes
}

function baseTitle(rel) {
  return path.basename(rel, '.md')
}

let addedH1 = 0
let promotedH1 = 0
let strippedBold = 0
let spaced = 0
let trailingFixed = 0
const mismatches = []

for (const rel of files) {
  const abs = path.join(root, rel)
  const raw = fs.readFileSync(abs, 'utf8')
  const eol = raw.includes('\r\n') ? '\r\n' : '\n'

  // 去掉尾部换行后按行拆分，便于精确控制结尾
  let lines = raw.replace(/\r\n/g, '\n').split('\n')
  while (lines.length && lines[lines.length - 1] === '') lines.pop()

  // frontmatter 结束后才算正文
  let startIdx = 0
  if (lines[0] === '---') {
    const end = lines.indexOf('---', 1)
    if (end > 0) startIdx = end + 1
  }

  const hasH1 = lines.slice(startIdx).some((l) => /^#\s+\S/.test(l))
  let insertedAt = -1 // 记录新增 H1 的行号，供内容校验时精确排除
  if (!hasH1) {
    let fi = startIdx
    while (fi < lines.length && lines[fi].trim() === '') fi++
    const title = baseTitle(rel)
    if (fi < lines.length) {
      const first = lines[fi]
      const plain = first
        .replace(/^[#>*`*~_]/g, '')
        .replace(/\*\*/g, '')
        .replace(/^\*|\*$/g, '')
        .trim()
      if (!/^#{1,6}\s/.test(first) && plain === title) {
        lines[fi] = `# ${title}` // 提升为首行即标题：原地替换，不算新增行
        promotedH1++
      } else {
        lines.splice(fi, 0, `# ${title}`)
        insertedAt = fi
        addedH1++
      }
    } else {
      lines.push(`# ${title}`)
      insertedAt = lines.length - 1
      addedH1++
    }
  }

  // 归一化所有标题行（补空格 + 去加粗）
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (/^#{1,6}/.test(l)) {
      const fixed = normalizeHeading(l)
      if (fixed !== l) {
        if (/^#{1,6}\S/.test(l)) spaced++
        if (/\*\*|^\*|\*$/.test(l)) strippedBold++
        lines[i] = fixed
      }
    }
  }

  // 统一结尾一个换行
  const out = lines.join(eol) + eol
  if (out !== raw.replace(/\r\n/g, '\n').replace(/\n+$/, '') + '\n' && !raw.endsWith('\n')) {
    trailingFixed++
  }

  // 内容签名校验：精确排除新增的 H1 行后再比对
  const originalSig = signature(raw)
  const outLines = out.split(eol)
  if (insertedAt >= 0) outLines.splice(insertedAt, 1)
  const resultSig = signature(outLines.join(eol))
  if (originalSig !== resultSig) {
    mismatches.push(rel)
    continue // 不写入，保留原文件
  }

  const stat = fs.statSync(abs)
  fs.writeFileSync(abs, out, 'utf8')
  fs.utimesSync(abs, stat.atime, stat.mtime) // 还原 mtime，时间线日期不漂移
}

console.log('新增 H1（插入）:', addedH1)
console.log('提升为 H1（首行即标题）:', promotedH1)
console.log('标题去加粗:', strippedBold)
console.log('标题补空格:', spaced)
console.log('结尾换行修正:', trailingFixed)
console.log('内容签名不匹配（已跳过，保留原文件）:', mismatches.length)
mismatches.forEach((m) => console.log('  ✗', m))
