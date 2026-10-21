import { computed, ref, watch } from 'vue'
export type ThemeName = 'light' | 'dark'
type ThemeMode = ThemeName | 'system'
const STORAGE_KEY = 'site.theme'
const system = window.matchMedia('(prefers-color-scheme: dark)')
function storedMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* Storage may be unavailable in private or embedded contexts. */ }
  return 'system'
}
export const themeMode = ref<ThemeMode>(storedMode())
const systemDark = ref(system.matches)
export const theme = computed<ThemeName>(() => themeMode.value === 'system'
  ? systemDark.value ? 'dark' : 'light' : themeMode.value)
export function applyTheme() { document.documentElement.dataset.theme = theme.value }
export function setTheme(mode: ThemeMode) {
  themeMode.value = mode
  try {
    if (mode === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, mode)
  } catch { /* The session still uses the chosen theme. */ }
}
system.addEventListener('change', event => { systemDark.value = event.matches })
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY || event.key === null) themeMode.value = storedMode()
})
watch(theme, applyTheme, { flush: 'sync' })
export { STORAGE_KEY }
