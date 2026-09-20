import { createApp } from 'vue'
import '@/assets/scss/main.css'
import App from './App.vue'
import router from './router'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { applyTheme } from '@/composables/useTheme'

dayjs.locale('zh-cn')
applyTheme()

createApp(App).use(router).mount('#app')
