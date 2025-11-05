<template>
  <div class="page-container" :class="{ 'page-loaded': isLoaded }">
    <div class="min-h-screen flex items-center justify-center p-8" style="padding-top: 6rem;">
      <div class="w-full max-w-7xl">
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <!-- 左侧区域 -->
        <div class="lg:col-span-2 space-y-8 left-panel" :class="{ 'panel-loaded': isLoaded }" style="padding: 1rem;">
        <!-- 日期时间面板 -->
        <div class="glass-card p-8" style="margin-bottom: 1rem;">
          <h2 class="text-2xl font-bold text-white mb-6 text-center">实时信息</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
              <div class="text-4xl mb-2">📅</div>
              <h3 class="text-xl font-bold text-white mb-1">{{ currentTime.format('YYYY-MM-DD') }}</h3>
              <p class="text-white/80">{{ currentTime.format('dddd') }}</p>
            </div>
            <div class="text-center">
              <div class="text-4xl mb-2">🕒</div>
              <h3 class="text-xl font-bold text-white mb-1">{{ currentTime.format('HH:mm:ss') }}</h3>
              <p class="text-white/80">当前时间</p>
            </div>
            <div class="text-center">
              <div class="text-4xl mb-2">🌡️</div>
              <h3 class="text-xl font-bold text-white mb-1">{{ weatherInfo.temperature }}</h3>
              <p class=" text-white/80" style="font-size:0.8rem;">{{ weatherInfo.description }}</p>
            </div>
          </div>
        </div>

        <!-- 时间轴面板 -->
        <div class="glass-card p-8 mt-10">
          <h2 class="text-xl font-bold text-white mb-4 text-center">学习历程</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 左侧时间轴 -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-white/90 mb-3" style="margin-bottom: 0.5rem;">学习路径</h3>
              <div v-for="(milestone, index) in timeline.slice(0, Math.ceil(timeline.length / 2))" :key="index" class="flex items-start gap-3">
                <div class="flex-shrink-0 w-4 h-4 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mt-1 relative shadow-lg">
                  <div v-if="index < Math.ceil(timeline.length / 2) - 1" class="absolute top-4 left-1/2 w-0.5 h-12 bg-gradient-to-b from-blue-400/60 to-purple-500/40 transform -translate-x-1/2"></div>
                </div>
                <div class="flex-1">
                  <h4 class="text-base font-bold text-white mb-1">{{ milestone.title }}</h4>
                  <p class="text-white/70 text-xs mb-1">{{ milestone.subtitle }}</p>
                  <p class="text-white/50 text-xs">{{ milestone.date }}</p>
                </div>
              </div>
            </div>
            
            <!-- 右侧时间轴 -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-white/90 mb-3" style="margin-bottom: 0.5rem;">进阶技能</h3>
              <div v-for="(milestone, index) in timeline.slice(Math.ceil(timeline.length / 2))" :key="index + Math.ceil(timeline.length / 2)" class="flex items-start gap-3">
                <div class="flex-shrink-0 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-1 relative shadow-lg">
                  <div v-if="index < timeline.slice(Math.ceil(timeline.length / 2)).length - 1" class="absolute top-4 left-1/2 w-0.5 h-12 bg-gradient-to-b from-purple-500/60 to-pink-500/40 transform -translate-x-1/2"></div>
                </div>
                <div class="flex-1">
                  <h4 class="text-base font-bold text-white mb-1">{{ milestone.title }}</h4>
                  <p class="text-white/70 text-xs mb-1">{{ milestone.subtitle }}</p>
                  <p class="text-white/50 text-xs">{{ milestone.date }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧任务板块 -->
      <div class="lg:col-span-3 right-panel" :class="{ 'panel-loaded': isLoaded }">
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4" style="padding: 1rem;">
            <div v-for="task in learningTasks" :key="task.id" class="glass-card p-6">
              <h3 class="text-lg font-bold text-white mb-3">{{ task.title }}</h3>
              <p class="text-white/70 text-sm mb-4">{{ task.subtitle }}</p>
              
              <!-- 进度条 -->
              <div class="mb-4">
                <div class="flex justify-between text-xs text-white/60 mb-2">
                  <span>进度</span>
                  <span>{{ task.progress }}%</span>
                </div>
                <div class="w-full bg-white/20 rounded-full h-2">
                  <div class="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300"
                       :style="{ width: task.progress + '%' }"></div>
                </div>
              </div>
              
              <!-- 任务详情 -->
              <div class="text-xs text-white/50">
                <span>{{ task.completed }}/{{ task.total }} 已完成</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { ref, onMounted, onUnmounted } from 'vue'
import { request } from '@/utils/axios'

const currentTime = ref(dayjs())
const isLoaded = ref(false)
let timer: number | null = null
let weatherTimer: number | null = null

// 来自https://www.wz121.com/
const weatherUrl = "https://mp.wztf121.com//data/wzweather/v3/hisHour24/330302.json"

// 天气信息
const weatherInfo = ref({
  temperature: '--°C',
  description: '加载中...'
})


// 学习任务
const learningTasks = ref([
  {
    id: 1,
    title: 'Vue.js 进阶学习',
    subtitle: '组件化开发与状态管理',
    progress: 75,
    completed: 15,
    total: 20
  },
  {
    id: 2,
    title: 'TypeScript 基础',
    subtitle: '类型系统与接口设计',
    progress: 60,
    completed: 12,
    total: 20
  },
  {
    id: 3,
    title: '前端工程化',
    subtitle: 'Vite + ESLint + Prettier',
    progress: 40,
    completed: 8,
    total: 20
  },
  {
    id: 4,
    title: 'CSS 动画效果',
    subtitle: 'Transition & Animation',
    progress: 90,
    completed: 18,
    total: 20
  },
  {
    id: 5,
    title: 'CSS 动画效果',
    subtitle: 'Transition & Animation',
    progress: 90,
    completed: 18,
    total: 20
  },
  {
    id: 6,
    title: 'CSS 动画效果',
    subtitle: 'Transition & Animation',
    progress: 90,
    completed: 18,
    total: 20
  },
  {
    id: 7,
    title: 'CSS 动画效果',
    subtitle: 'Transition & Animation',
    progress: 90,
    completed: 18,
    total: 20
  },
  {
    id: 8,
    title: 'CSS 动画效果',
    subtitle: 'Transition & Animation',
    progress: 90,
    completed: 18,
    total: 20
  },
])

// 学习历程时间轴
const timeline = ref([
  {
    title: '开始前端学习之旅',
    subtitle: 'HTML、CSS、JavaScript 基础',
    date: '2024-01-15'
  },
  {
    title: '掌握 Vue.js 框架',
    subtitle: '组件化思想与响应式原理',
    date: '2024-03-20'
  },
  {
    title: '学习 TypeScript',
    subtitle: '类型安全的 JavaScript',
    date: '2024-06-10'
  },
  {
    title: '前端工程化实践',
    subtitle: '构建工具与开发流程',
    date: '2024-09-05'
  },
  {
    title: '当前进行中',
    subtitle: '深入学习与项目实战',
    date: '2024-11-05'
  }
])

// 更新时间
const updateTime = () => {
  currentTime.value = dayjs()
}

// 更新天气信息
const updateWeather = async () => {
  try {
    const { hisHour24 } = await request.get(weatherUrl)
    if (hisHour24 && hisHour24[0]) {
      weatherInfo.value = {
        temperature: `${hisHour24[0].tmp}°C`,
        description: `湿度 ${hisHour24[0].hum}% · 降雨 ${hisHour24[0].pcpn}mm`
      }
    }
  } catch (error) {
    weatherInfo.value = {
      temperature: '--°C',
      description: '天气信息获取失败'
    }
  }
}

onMounted(() => {
  // 页面加载动画
  setTimeout(() => {
    isLoaded.value = true
  }, 100)

  updateWeather()
  // 每秒更新时间
  timer = setInterval(updateTime, 1000)
  // 5分钟更新天气
  weatherTimer = setInterval(updateWeather, 300000)
})

onUnmounted(() => {
  // 组件卸载时清除定时器
  if (timer) {
    clearInterval(timer)
  }
  if (weatherTimer) {
    clearInterval(weatherTimer)
  }
})
</script>

<style scoped lang="scss">

// 页面容器动画
.page-container {
  opacity: 0;
  transition: opacity 0.6s ease-out;
  
  &.page-loaded {
    opacity: 1;
  }
}

// 左侧面板动画
.left-panel {
  transform: translateX(-100px);
  opacity: 0;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.2s;
  
  &.panel-loaded {
    transform: translateX(0);
    opacity: 1;
  }
}

// 右侧面板动画
.right-panel {
  transform: translateX(100px);
  opacity: 0;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.4s;
  
  &.panel-loaded {
    transform: translateX(0);
    opacity: 1;
  }
}

// 毛玻璃卡片样式
.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  overflow: hidden;
  word-wrap: break-word;
  padding: 1rem;
  word-break: break-word;
  hyphens: auto;
  box-sizing: border-box;
  max-width: 100%;
  
  // 确保所有子元素不会溢出
  * {
    max-width: 100%;
    box-sizing: border-box;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  // 特别处理文本元素
  h1, h2, h3, h4, h5, h6, p, span, div {
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
    hyphens: auto;
  }

  // 卡片入场动画
  transform: translateY(30px) scale(0.95);
  opacity: 0;
  animation: cardFadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  
  // 为不同的卡片设置不同的延迟
  &:nth-child(1) { animation-delay: 0.6s; }
  &:nth-child(2) { animation-delay: 0.8s; }
  &:nth-child(3) { animation-delay: 1.0s; }
  &:nth-child(4) { animation-delay: 1.2s; }
  &:nth-child(5) { animation-delay: 1.4s; }
  &:nth-child(6) { animation-delay: 1.6s; }
  &:nth-child(7) { animation-delay: 1.8s; }
  &:nth-child(8) { animation-delay: 2.0s; }

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px) scale(1);
  }
}

// 卡片入场动画
@keyframes cardFadeIn {
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

// 小型毛玻璃卡片
.glass-card-small {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
}

// 网格容器约束
.grid {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

// 列容器约束
.lg\\:col-span-2,
.lg\\:col-span-3 {
  min-width: 0;
  overflow: hidden;
}

// 响应式设计
@media (max-width: 1024px) {
  .min-h-screen {
    padding: 1rem;
  }
  
  .lg\\:col-span-2 {
    grid-column: span 1;
  }
  
  .lg\\:col-span-3 {
    grid-column: span 1;
  }
  
  // 在中等屏幕上减少间隔
  .grid {
    gap: 2rem;
  }
}

@media (max-width: 768px) {
  .grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  
  .md\\:grid-cols-3 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  .md\\:grid-cols-2 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}

// 强制文本约束
.text-white,
.text-white\/80,
.text-white\/70,
.text-white\/60,
.text-white\/50 {
  max-width: 100%;
  overflow: hidden;
  word-break: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

// 进度条容器约束
.w-full {
  max-width: 75%;
  overflow: hidden;
}
</style>
