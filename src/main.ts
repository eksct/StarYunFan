import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@/assets/scss/main.css'
import App from './App.vue'
import router from './router'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

const app = createApp(App)
dayjs.locale('zh-cn')
app.use(createPinia())
app.use(router)
app.mount('#app')
