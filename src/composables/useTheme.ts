// 主题状态：跟随系统偏好，用户手动切换后写入 localStorage
import { ref, watch } from 'vue'

export type ThemeName = 'light' | 'dark'

const STORAGE_KEY = 'site.theme'

function initialTheme(): ThemeName {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const theme = ref<ThemeName>(initialTheme())

export function applyTheme() {
  document.documentElement.dataset.theme = theme.value
}

export function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

watch(theme, value => {
  localStorage.setItem(STORAGE_KEY, value)
  applyTheme()
})

export { STORAGE_KEY }
