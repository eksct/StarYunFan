export interface AssetIndex {
  byPath: Record<string, string>
  byName: Record<string, string>
}

export interface ParsedFrontmatter {
  data: Record<string, string | string[] | boolean>
  body: string
}

export function parseFrontmatter(raw: string): ParsedFrontmatter
export function toIsoDate(value: string | Date): string
export function createAssetIndex(assetPaths: string[]): AssetIndex
export function resolveAssetPath(target: string, assets: AssetIndex): string | undefined
export function rssDate(value: string): string
export function escapeHtml(value: string): string
export function isDraft(value: unknown): boolean
