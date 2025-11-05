<template>
  <div class="page-container" :class="{ 'page-loaded': isLoaded }">
    <div class="about-container">
      <!-- 关于我部分 -->
      <section class="about-section main-section" :class="{ 'section-loaded': isLoaded }">
        <div class="about-content">
          <div class="about-header header-animation" :class="{ 'header-loaded': isLoaded }">
            <h1 class="about-title">关于我</h1>
            <p class="about-subtitle">Hello, 我是 Seiga</p>
          </div>
          
          <div class="about-body">
            <div class="about-text text-animation" :class="{ 'text-loaded': isLoaded }">
              <p class="intro-text">
                我是一名热爱技术的开发者，专注于前端开发和用户体验设计。
                喜欢探索新技术，追求代码的优雅和产品的完美。
              </p>
              
              <div class="skills-section">
                <h3 class="skills-title">技能专长</h3>
                <div class="skills-grid">
                  <div class="skill-item" v-for="(skill, index) in skills" :key="skill.name" 
                       :style="{ animationDelay: `${1.2 + index * 0.2}s` }">
                    <div class="skill-icon">{{ skill.icon }}</div>
                    <div class="skill-info">
                      <h4 class="skill-name">{{ skill.name }}</h4>
                      <p class="skill-desc">{{ skill.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="about-image image-animation" :class="{ 'image-loaded': isLoaded }">
              <img src="/src/assets/img/Capture001.png" alt="Seiga" class="profile-image" />
            </div>
          </div>
        </div>
      </section>

      <!-- 兴趣爱好 -->
      <section class="hobbies-section hobbies-animation" :class="{ 'hobbies-loaded': isLoaded }">
        <div class="hobbies-content">
          <h2 class="hobbies-title">兴趣爱好</h2>
          <div class="hobbies-grid">
            <div class="hobby-card" v-for="(hobby, index) in hobbies" :key="hobby.name"
                 :style="{ animationDelay: `${1.8 + index * 0.15}s` }">
              <div class="hobby-icon">{{ hobby.icon }}</div>
              <h3 class="hobby-name">{{ hobby.name }}</h3>
              <p class="hobby-desc">{{ hobby.description }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isLoaded = ref(false)

const skills = ref([
  {
    name: '前端开发',
    icon: '💻',
    description: 'Vue, React, TypeScript, HTML5, CSS3'
  },
  {
    name: '后端开发',
    icon: '⚙️',
    description: 'Java,Go, Python, 数据库设计'
  },
])


const hobbies = ref([
  {
    name: '编程',
    icon: '👨‍💻',
    description: '热爱编程，享受解决问题的过程'
  },
  {
    name: '阅读',
    icon: '📚',
    description: '喜欢阅读技术书籍和文学作品'
  },
  {
    name: '音乐',
    icon: '🎵',
    description: '喜欢听音乐，偶尔也会弹奏乐器'
  },
  {
    name: '摄影',
    icon: '📸',
    description: '用镜头记录生活中的美好瞬间'
  }
])

onMounted(() => {
  // 页面加载动画
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>
<style scoped lang="scss">

// 页面容器动画
.page-container {
  opacity: 0;
  transition: opacity 0.8s ease-out;
  
  &.page-loaded {
    opacity: 1;
  }
}

.about-container {
  min-height: 100vh;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.about-section {
  margin-bottom: 4rem;
}

// 主要区域动画
.main-section {
  transform: translateY(50px) scale(0.95);
  opacity: 0;
  transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.2s;
  
  &.section-loaded {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.about-content {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 2rem;
  padding: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
}

// 头部动画
.header-animation {
  transform: translateY(-30px);
  opacity: 0;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.5s;
  
  &.header-loaded {
    transform: translateY(0);
    opacity: 1;
  }
}

.about-header {
  text-align: center;
  margin-bottom: 3rem;
}

.about-title {
  font-size: 3rem;
  font-weight: bold;
  background: linear-gradient(135deg, #4299e1 0%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  
  // 添加标题渐变动画
  background-size: 200% 200%;
  animation: gradientShift 3s ease-in-out infinite;
}

.about-subtitle {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.8);
}

// 文本动画
.text-animation {
  transform: translateX(-50px);
  opacity: 0;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.8s;
  
  &.text-loaded {
    transform: translateX(0);
    opacity: 1;
  }
}

// 图片动画
.image-animation {
  transform: translateX(50px) rotate(5deg) scale(0.9);
  opacity: 0;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 1s;
  
  &.image-loaded {
    transform: translateX(0) rotate(0deg) scale(1);
    opacity: 1;
  }
}

.about-body {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 3rem;
  align-items: start;
}

.intro-text {
  font-size: 1.125rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
}

.skills-section {
  margin-top: 2rem;
}

.skills-title {
  font-size: 1.5rem;
  color: white;
  margin-bottom: 1.5rem;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.skill-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  
  // 技能卡片入场动画
  transform: translateY(30px) scale(0.9);
  opacity: 0;
  animation: skillFadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px) scale(1);
  }
}

.skill-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.skill-name {
  font-size: 1.125rem;
  font-weight: bold;
  color: white;
  margin-bottom: 0.5rem;
}

.skill-desc {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  line-height: 1.6;
}

.about-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.profile-image {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.hobbies-section {
  margin-bottom: 4rem;
}

.hobbies-content {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 2rem;
  padding: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
}

.hobbies-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  text-align: center;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #4299e1 0%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hobbies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

// 爱好区域动画
.hobbies-animation {
  transform: translateY(50px);
  opacity: 0;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1) 1.4s;
  
  &.hobbies-loaded {
    transform: translateY(0);
    opacity: 1;
  }
}

.hobby-card {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  
  // 爱好卡片入场动画
  transform: translateY(30px) scale(0.9);
  opacity: 0;
  animation: hobbyFadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-5px) scale(1.05);
  }
}

.hobby-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hobby-name {
  color: white;
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.hobby-desc {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

// 动画关键帧
@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes skillFadeIn {
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes hobbyFadeIn {
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .about-body {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .skills-grid {
    grid-template-columns: 1fr;
  }

  .hobbies-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .about-title {
    font-size: 2rem;
  }

  .hobbies-title {
    font-size: 2rem;
  }
}
</style>
