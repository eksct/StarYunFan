interface OrderedNote { path: string; title?: string }
export function noteDirectory(note: OrderedNote): string
export function compareNotes(left: OrderedNote, right: OrderedNote): number
export function findSiblings<T extends OrderedNote>(notes: T[], path: string): { prev?: T; next?: T }
