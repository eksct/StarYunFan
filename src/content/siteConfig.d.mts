export const siteConfig: { basePath: string; siteUrl: string; name: string; description: string; publicFiles: string[] }
export function encodePath(value: string): string
export function staticNotePath(value: string): string
export function collectionFor(value: string): string
export function categoryFor(value: string, data?: Record<string, unknown>): string
export function isPublishedNote(value: string, data?: Record<string, unknown>): boolean
