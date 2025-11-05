<template>
  <div class="page-container" :class="{ 'page-loaded': isLoaded }">
    <!-- 主要内容 -->
    <div class="seiga-flex-container">
      <div class="main-content" :class="{ 'content-loaded': isLoaded }">
        <div class="avatar-section" :class="{ 'avatar-loaded': isLoaded }">
          <img src="/src/assets/img/Capture001.png" alt="头像" class="avatar" />
        </div>
        <div class="content" :class="{ 'text-loaded': isLoaded }">
          <div id="welcome-text" class="welcome-title">
            Hello, 这里是Seiga的个人主页
          </div>
          <div class="typed-section">
            <div id="typed"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Typed from 'typed.js';
import { onMounted, ref } from 'vue';

const isLoaded = ref(false)

onMounted(() => {
  // 页面加载动画
  setTimeout(() => {
    isLoaded.value = true
  }, 100)

  // 延迟启动打字机效果，等待动画完成
  setTimeout(() => {
    new Typed('#typed', {
      strings: ['鸟要挣扎着从蛋里出来,蛋就是世界。要想诞生，就必须摧毁一个世界<br>那只鸟飞向上帝,那个上帝的名字叫阿布拉克萨斯 --《德米安》'],
      typeSpeed: 60,
      showCursor: false
    })
  }, 1500) // 等待进入动画完成后再开始打字
})
</script>

<style scoped lang="scss">

// 页面容器初始状态
.page-container {
  opacity: 0;
  transition: opacity 0.8s ease-out;
  
  &.page-loaded {
    opacity: 1;
  }
}

// 主要内容样式
.seiga-flex-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem 2rem;
}

.main-content {
  display: flex;
  align-items: center;
  gap: 3rem;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 3rem;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
  width: fit-content;
  margin: 0 auto;
  
  // 初始状态
  transform: translateY(50px) scale(0.9);
  opacity: 0;
  transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  // 加载完成状态
  &.content-loaded {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.avatar-section {
  flex-shrink: 0;
  
  // 初始状态
  transform: translateX(-50px) rotate(-10deg);
  opacity: 0;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.3s;
  
  // 加载完成状态
  &.avatar-loaded {
    transform: translateX(0) rotate(0deg);
    opacity: 1;
  }
}

.avatar {
  width: 8rem;
  height: 8rem;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.content {
  flex: 1;
  
  // 初始状态
  transform: translateX(50px);
  opacity: 0;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.6s;
  
  // 加载完成状态
  &.text-loaded {
    transform: translateX(0);
    opacity: 1;
  }
}

.welcome-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #4299e1 0%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  // 添加文字动画效果
  background-size: 200% 200%;
  animation: gradientShift 3s ease-in-out infinite;
}

// 渐变色移动动画
@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.typed-section {
  margin-bottom: 2rem;
}

#typed {
  white-space: pre-wrap;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.125rem;
  line-height: 1.8;
  min-height: 100px;
  text-align: left;
}

.links-section {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.social-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 1.125rem;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(66, 153, 225, 0.3), transparent);
    transition: left 0.5s ease;
  }

  &:hover {
    color: white;
    background: rgba(66, 153, 225, 0.2);
    border-color: rgba(66, 153, 225, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(66, 153, 225, 0.3);

    &::before {
      left: 100%;
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
    text-align: center;
    padding: 2rem;
    width: calc(100% - 2rem);
    max-width: none;
  }

  .nav-content {
    padding: 0 1rem;
  }

  .nav-right {
    gap: 1rem;
  }

  .welcome-title {
    font-size: 2rem;
  }

  .links-section {
    justify-content: center;
  }
}
</style>