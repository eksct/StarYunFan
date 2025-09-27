<template>
        <!-- 导航栏 -->
    <nav class="seiga-nav-container">
      <div class="nav-content">
        <div class="nav-left">
          <div class="nav-logo">
            <span class="logo-text">Seiga</span>
          </div>
        </div>
        <div class="nav-right">
          <div class="nav-item" v-for = "item in navList" :key="item.id">
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
import { reactive, ref } from 'vue';
import { useNavStore } from '@/stores/nav'
const nav = useNavStore()
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
    name: '笔记',
    url: '/notes',
    external: false
  },
  {
    id:4,
    name: "哔哩哔哩",
    url: "https://space.bilibili.com/247835757",
    external: true
  },
  {
    id: 5,
    name: 'GitHub',
    url: 'https://github.com/eksct',
    external: true
  }
])
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
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    color: white;
    background: rgba(102, 126, 234, 0.2);
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
  transition: opacity 0.3s ease;
}

.external-link:hover .external-icon {
  opacity: 1;
}
</style>