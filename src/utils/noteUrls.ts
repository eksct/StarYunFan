export function encodeAssetPath(path: string): string {
  return path.split('/').map(segment => encodeURIComponent(segment)).join('/')
}

export function noteUrl(path: string): string {
  return `#/notes/${encodeAssetPath(path)}`
}

export function staticNotePath(path: string): string {
  return `${import.meta.env.BASE_URL}notes/${encodeAssetPath(path)}.html`
}

export function staticNoteUrl(path: string): string {
  return new URL(staticNotePath(path), window.location.origin).href
}
