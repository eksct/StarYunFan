<template>
        <!-- 导航栏 -->
    <nav class="seiga-nav-container">
      <div class="nav-content">
        <div class="nav-left">
          <div class="nav-logo">
            <span class="logo-text">Seiga</span>
          </div>
        </div>
        <div class="nav-right" ref="navRight">
          <!-- 移动指示器 -->
          <div 
            class="nav-indicator" 
            :style="indicatorStyle"
          ></div>
          
          <div 
            class="nav-item" 
            v-for="item in navList" 
            :key="item.id"
            :ref="el => setNavItemRef(el, item.id)"
          >
            <router-link 
              v-if="!item.external" 
              :to="item.url" 
              class="nav-link" 
              :class="{'active': nav.activeMenu === item.id}" 
              @click="nav.setActive(item.id)"
            >
              {{ item.name }}
            </router-link>
            <a 
              v-else 
              :href="item.url" 
              target="_blank" 
              rel="noopener noreferrer"
              class="nav-link external-link"
            >
              {{ item.name }}
              <span class="external-icon">↗</span>
            </a>
          </div>
        </div>
      </div>

    </nav>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, nextTick, watch } from 'vue';
import { useNavStore } from '@/stores/nav'

const nav = useNavStore()
const navRight = ref<HTMLElement>()
const navItemRefs = ref<Map<number, HTMLElement>>(new Map())

// 设置导航项引用
const setNavItemRef = (el: any, id: number) => {
  if (el && el instanceof HTMLElement) {
    navItemRefs.value.set(id, el)
  }
}

let navList = reactive([
  {
    id: 1,
    name: '首页',
    url: '/',
    external: false
  },
  {
    id: 2,
    name: '关于',
    url: '/about',
    external: false
  },
  {
    id: 3,
    name: '任务',
    url: '/tasks',
    external: false
  },
  {
    id: 4,
    name: '笔记',
    url: '/notes',
    external: false
  },
  {
    id: 5,
    name: "哔哩哔哩",
    url: "https://space.bilibili.com/247835757",
    external: true
  },
  {
    id: 6,  
    name: 'GitHub',
    url: 'https://github.com/eksct',
    external: true
  }
])

// 指示器样式
const indicatorStyle = ref({
  transform: 'translateX(0px)',
  width: '0px',
  opacity: '0'
})

// 更新指示器位置
const updateIndicator = async () => {
  await nextTick()
  
  const activeItem = navItemRefs.value.get(nav.activeMenu)
  if (!activeItem || !navRight.value) {
    indicatorStyle.value.opacity = '0'
    return
  }

  const navRightRect = navRight.value.getBoundingClientRect()
  const activeItemRect = activeItem.getBoundingClientRect()
  
  const offsetLeft = activeItemRect.left - navRightRect.left
  const width = activeItemRect.width

  indicatorStyle.value = {
    transform: `translateX(${offsetLeft}px)`,
    width: `${width}px`,
    opacity: '1'
  }
}

// 监听活动菜单变化
watch(() => nav.activeMenu, () => {
  updateIndicator()
}, { immediate: true })

// 组件挂载后初始化指示器
onMounted(() => {
  updateIndicator()
  
  // 监听窗口大小变化
  window.addEventListener('resize', updateIndicator)
})
</script>

<style scoped lang="scss">

.seiga-nav-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 0;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
}

.nav-left {
  .logo-text {
    font-size: 1.5rem;
    font-weight: bold;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.nav-right {
  display: flex;
  gap: 2rem;
  position: relative;
}

// 移动指示器样式
.nav-indicator {
  position: absolute;
  bottom: -0.5rem;
  height: 3px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
  z-index: 1;
}

.nav-item {
  position: relative;
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transform: translateY(0);

  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }

  &.active {
    color: white;
    background: rgba(102, 126, 234, 0.2);
    transform: translateY(-1px);
  }

  &.external-link {
    &:hover {
      color: #4299e1;
      background: rgba(66, 153, 225, 0.1);
    }
  }
}

.external-icon {
  font-size: 0.8rem;
  opacity: 0.7;
  transition: all 0.3s ease;
  transform: translateY(0);
}

.external-link:hover .external-icon {
  opacity: 1;
  transform: translateY(-1px);
}

// 响应式设计
@media (max-width: 768px) {
  .nav-content {
    padding: 0 1rem;
  }
  
  .nav-right {
    gap: 1rem;
  }
  
  .nav-link {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
}
</style>