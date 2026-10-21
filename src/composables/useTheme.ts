import { ref, watch } from 'vue'
export type ThemeName = 'light' | 'dark'
const STORAGE_KEY = 'site.theme'
const system = window.matchMedia('(prefers-color-scheme: dark)')
let manual = false
function initialTheme(): ThemeName {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') { manual = true; return stored }
  } catch { /* Storage may be unavailable in private or embedded contexts. */ }
  return system.matches ? 'dark' : 'light'
}
export const theme = ref<ThemeName>(initialTheme())
export function applyTheme() { document.documentElement.dataset.theme = theme.value }
export function toggleTheme() {
  manual = true
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  try { localStorage.setItem(STORAGE_KEY, theme.value) } catch { /* The session still uses the chosen theme. */ }
}
system.addEventListener('change', event => { if (!manual) theme.value = event.matches ? 'dark' : 'light' })
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY) return
  manual = event.newValue === 'light' || event.newValue === 'dark'
  theme.value = manual ? event.newValue as ThemeName : system.matches ? 'dark' : 'light'
})
watch(theme, applyTheme)
export { STORAGE_KEY }
