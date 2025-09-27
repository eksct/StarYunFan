// stores/nav.ts
import { ref,watch } from 'vue'
import { defineStore } from 'pinia'

export const useNavStore = defineStore('nav', () => {
  const activeMenu = ref(Number(localStorage.getItem('nav.activeMenu')) || 1)
  function setActive(menu: number) {
    activeMenu.value = menu
  }
  watch(activeMenu, (newVal) => {
    localStorage.setItem('nav.activeMenu', String(newVal))
  })
  return { activeMenu, setActive }
})
