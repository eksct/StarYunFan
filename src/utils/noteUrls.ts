import { encodePath, staticNotePath as configuredStaticPath, siteConfig } from '@/content/siteConfig.mjs'
export const encodeAssetPath = encodePath

export function noteUrl(path: string): string {
  return `#/notes/${encodeAssetPath(path)}`
}

export function staticNotePath(path: string): string {
  return configuredStaticPath(path)
}

export function staticNoteUrl(path: string): string {
  return siteConfig.siteUrl + 'notes/' + encodeAssetPath(path) + '.html'
}
