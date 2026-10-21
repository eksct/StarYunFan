// A folder is the existing editorial boundary; dates do not define lesson order.
const natural = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' })
export const noteDirectory = note => note.path.slice(0, note.path.lastIndexOf('/'))
export function compareNotes(left, right) {
  const file = note => note.path.slice(note.path.lastIndexOf('/') + 1)
  return natural.compare(file(left), file(right)) || left.path.localeCompare(right.path)
}
export function findSiblings(notes, currentPath) {
  const current = notes.find(note => note.path === currentPath)
  if (!current) return {}
  const siblings = notes.filter(note => noteDirectory(note) === noteDirectory(current)).sort(compareNotes)
  const index = siblings.findIndex(note => note.path === currentPath)
  return { prev: siblings[index - 1], next: siblings[index + 1] }
}
