export function guessLanguage(code) {
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

