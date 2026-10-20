export function relativeNoteAssetPath(notePath: string, target: string): string

export function normalizeNoteMarkdown(
  body: string,
  options: {
    notePath: string
    resolveAsset: (target: string, notePath: string) => string | undefined
    resolveWikiLink: (target: string, alias: string | undefined, notePath: string) => string | undefined
  },
): string
