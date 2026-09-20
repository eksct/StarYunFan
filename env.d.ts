/// <reference types="vite/client" />

// highlight.js 的语言模块只有 JS，类型需自行声明
declare module 'highlight.js/lib/languages/*' {
  import type { LanguageFn } from 'highlight.js'
  const language: LanguageFn
  export default language
}
