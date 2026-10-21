import { generateStaticNotes } from './lib/static-pages.mjs'
import { projectRoot } from './lib/generate-notes.mjs'
await generateStaticNotes(projectRoot)
