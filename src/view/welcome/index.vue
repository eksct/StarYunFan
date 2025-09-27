<template>
  <div>
    

    <!-- 主要内容 -->
    <div class="seiga-flex-container">
      <div class="main-content">
        <div class="avatar-section">
          <img src="/src/assets/img/Capture001.png" alt="头像" class="avatar" />
        </div>
        <div class="content">
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
import { onMounted } from 'vue';

onMounted(() => {
  new Typed('#typed', {
    strings: ['鸟要挣扎着从蛋里出来,蛋就是世界。要想诞生，就必须摧毁一个世界<br>那只鸟飞向上帝,那个上帝的名字叫阿布拉克萨斯 --《德米安》'],
    typeSpeed: 60,
    showCursor: false
  })
})
</script>

<style scoped lang="scss">


// 主要内容样式
.seiga-flex-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem 2rem;
}

.main-content {
  max-width: 90rem;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 3rem;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 3rem;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
}

.avatar-section {
  flex-shrink: 0;
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
  animation: fadeInUp 1s ease-out;
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