<template>
  <div class="about-container">
    <!-- 关于我部分 -->
    <section class="about-section">
      <div class="about-content">
        <div class="about-header">
          <h1 class="about-title">关于我</h1>
          <p class="about-subtitle">Hello, 我是 Seiga</p>
        </div>
        
        <div class="about-body">
          <div class="about-text">
            <p class="intro-text">
              我是一名热爱技术的开发者，专注于前端开发和用户体验设计。
              喜欢探索新技术，追求代码的优雅和产品的完美。
            </p>
            
            <div class="skills-section">
              <h3 class="skills-title">技能专长</h3>
              <div class="skills-grid">
                <div class="skill-item" v-for="skill in skills" :key="skill.name">
                  <div class="skill-icon">{{ skill.icon }}</div>
                  <div class="skill-info">
                    <h4 class="skill-name">{{ skill.name }}</h4>
                    <p class="skill-desc">{{ skill.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="about-image">
            <img src="/src/assets/img/Capture001.png" alt="Seiga" class="profile-image" />
          </div>
        </div>
      </div>
    </section>

    <!-- 经历时间线 -->
    <section class="timeline-section">
      <div class="timeline-content">
        <h2 class="timeline-title">经历时间线</h2>
        <div class="timeline">
          <div class="timeline-item" v-for="(item, index) in timeline" :key="index">
            <div class="timeline-marker"></div>
            <div class="timeline-content-item">
              <div class="timeline-date">{{ item.date }}</div>
              <h3 class="timeline-item-title">{{ item.title }}</h3>
              <p class="timeline-description">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 兴趣爱好 -->
    <section class="hobbies-section">
      <div class="hobbies-content">
        <h2 class="hobbies-title">兴趣爱好</h2>
        <div class="hobbies-grid">
          <div class="hobby-card" v-for="hobby in hobbies" :key="hobby.name">
            <div class="hobby-icon">{{ hobby.icon }}</div>
            <h3 class="hobby-name">{{ hobby.name }}</h3>
            <p class="hobby-desc">{{ hobby.description }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

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

const timeline = ref([
  {
    date: '2024',
    title: '个人项目开发',
    description: '开始专注于个人项目，探索新技术和最佳实践'
  },
  {
    date: '2023',
    title: '技术学习',
    description: '深入学习前端框架和现代开发工具'
  },
  {
    date: '2022',
    title: '编程入门',
    description: '开始学习编程，对技术产生浓厚兴趣'
  }
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
</script>

<style scoped lang="scss">
.about-container {
  min-height: 100vh;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.about-section {
  margin-bottom: 4rem;
}

.about-content {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 2rem;
  padding: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
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
}

.about-subtitle {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.8);
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

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
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

.timeline-section, .hobbies-section {
  margin-bottom: 4rem;
}

.timeline-content, .hobbies-content {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 2rem;
  padding: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
}

.timeline-title, .hobbies-title {
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

.timeline {
  position: relative;
  padding-left: 2rem;

  &::before {
    content: '';
    position: absolute;
    left: 1rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(to bottom, #667eea, #764ba2);
  }
}

.timeline-item {
  position: relative;
  margin-bottom: 3rem;
  padding-left: 3rem;
}

.timeline-marker {
  position: absolute;
  left: -1.5rem;
  top: 0.5rem;
  width: 1rem;
  height: 1rem;
  background: #667eea;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.2);
}

.timeline-date {
  color: #4299e1;
  font-weight: bold;
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
}

.timeline-item-title {
  color: white;
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.timeline-description {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.hobbies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.hobby-card {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-5px);
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

  .timeline-title, .hobbies-title {
    font-size: 2rem;
  }
}
</style>