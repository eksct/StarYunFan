<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import SeigaNav from './Component/SeigaNav.vue'

// 清空本地状态的函数
const clearLocalState = () => {
  // 清空所有localStorage
  localStorage.clear()
  // 清空sessionStorage（如果需要）
  sessionStorage.clear()
}

// 标记是否为刷新操作
let isRefresh = false

// 监听页面刷新事件
window.addEventListener('beforeunload', (event) => {
  // 检查是否为刷新操作
  if (event.type === 'beforeunload') {
    // 通过检查navigator.onLine或其他方式判断是否为刷新
    isRefresh = true
  }
})

// 监听页面真正关闭事件
window.addEventListener('unload', () => {
  // 只有在非刷新情况下才清空状态
  if (!isRefresh) {
    clearLocalState()
  }
})

// 监听页面隐藏事件（用户切换到其他标签页或关闭）
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // 页面被隐藏，可能是切换标签页或最小化
    // 这里不清空状态，保持用户数据
  }
})
</script>

<template>
  <div id="app">
    <seiga-nav />
    <router-view />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  background-image: url('/src/assets/img/bg001.jpeg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

#app {
  min-height: 100vh;
  background: rgba(0, 0, 0, 0.2);
}

</style>
