export function retryableLoader<T>(load: () => Promise<T>): () => Promise<T>
export function rankEntries(index: { path: string; title: string; category: string; tags: string[]; text: string }[], keyword: string): { path: string; score: number; snippet: string }[]
export function highlightSnippet(text: string, keyword: string): { text: string; match: boolean }[]
