// stores/nav.ts
import { ref,watch } from 'vue'
import { defineStore } from 'pinia'

export const useNavStore = defineStore('nav', () => {
  const activeMenu = ref(Number(sessionStorage.getItem('nav.activeMenu')) || 1)
  
  function setActive(menu: number) {
    activeMenu.value = menu
  }
  
  // 清空本地状态
  function clearState() {
    sessionStorage.removeItem('nav.activeMenu')
    activeMenu.value = 1 // 重置为默认值
  }
  
  // 清空所有sessionStorage
  function clearAllsessionStorage() {
    sessionStorage.clear()
    activeMenu.value = 1
  }
  
  watch(activeMenu, (newVal) => {
    sessionStorage.setItem('nav.activeMenu', String(newVal))
  })
  
  return { activeMenu, setActive, clearState, clearAllsessionStorage }
})
