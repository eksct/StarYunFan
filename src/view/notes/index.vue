<template>
  <div class="flex h-screen bg-black/10" style="padding-top: 4.5rem;">
    <!-- 笔记列表 -->
    <div class="w-80 bg-white/10 backdrop-blur-md border-r border-white/20 flex flex-col">
      <div class="p-8 border-b border-white/10">
        <h2 class="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          笔记目录
        </h2>
        <div class="mt-4">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索笔记..." 
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-blue-400 focus:bg-white/15"
          />
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <div 
          v-for="category in filteredNotes" 
          :key="category.name"
          class="mb-2"
        >
          <div 
            class="flex items-center p-3 bg-white/5 rounded-lg cursor-pointer transition-all duration-300 hover:bg-white/10"
            @click="toggleCategory(category.name)"
          >
            <span class="text-xl mr-2">{{ category.expanded ? '📂' : '📁' }}</span>
            <span class="flex-1 text-white font-medium">{{ category.name }}</span>
            <span class="text-white/60 text-sm">{{ category.expanded ? '▼' : '▶' }}</span>
          </div>
          
          <div v-if="category.expanded" class="ml-4 mt-2">
            <div 
              v-for="note in category.notes" 
              :key="note.path"
              class="flex items-center p-2 mb-1 rounded-md cursor-pointer transition-all duration-300 hover:bg-white/10"
              :class="{ 
                'bg-blue-500/20 border-l-4 border-blue-400': selectedNote?.path === note.path 
              }"
              @click="selectNote(note)"
            >
              <span class="text-base mr-2">📄</span>
              <span class="text-white/90 text-sm flex-1 truncate">{{ note.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 笔记内容 -->
    <div class="flex-1 flex flex-col bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm">
      <div v-if="!selectedNote" class="flex flex-col items-center justify-center h-full text-white/60">
        <div class="text-8xl mb-6 opacity-80">📚</div>
        <h3 class="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          选择一篇笔记开始阅读
        </h3>
        <p class="text-lg text-white/70">从左侧目录中选择您想要阅读的笔记</p>
        <div class="mt-8 w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
      </div>
      
      <div v-else class="h-full flex flex-col">
        <div class="p-8 border-b border-white/20 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md">
          <h1 class="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {{ selectedNote.title }}
          </h1>
          <div class="flex gap-8 text-white/70 text-sm">
            <div class="flex items-center gap-2">
              <span class="text-blue-400">📁</span>
              <span>{{ selectedNote.path }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-purple-400">📅</span>
              <span>{{ selectedNote.date }}</span>
            </div>
          </div>
        </div>
        
        <div class="flex-1 px-6 py-4 overflow-y-auto bg-gradient-to-b from-transparent to-white/5" style="padding: 0 12px 12px 12px;">
          <div 
            v-html="renderedContent" 
            class="prose prose-invert max-w-none prose-lg prose-headings:text-white prose-p:text-gray-300 prose-a:text-blue-400 prose-strong:text-white prose-code:text-green-400 prose-pre:bg-gray-900/50 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-500/10"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import { noteFiles, loadMarkdownContent, organizeNotesByCategory, type NoteFile } from '@/utils/markdownLoader'

interface Note {
  title: string
  path: string
  content: string
  date: string
}

interface Category {
  name: string
  notes: Note[]
  expanded: boolean
}

const searchQuery = ref('')
const selectedNote = ref<Note | null>(null)
const notes = ref<Category[]>([])
const renderedContent = ref('')

// 配置 marked
marked.setOptions({
  highlight: function(code: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true
} as any)

// 过滤后的笔记
const filteredNotes = computed(() => {
  if (!searchQuery.value) return notes.value
  
  return notes.value.map(category => ({
    ...category,
    notes: category.notes.filter(note => 
      note.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  })).filter(category => category.notes.length > 0)
})

// 切换分类展开状态
const toggleCategory = (categoryName: string) => {
  const category = notes.value.find(cat => cat.name === categoryName)
  if (category) {
    category.expanded = !category.expanded
  }
}

// 选择笔记
const selectNote = async (note: Note) => {
  selectedNote.value = note
  try {
    const content = await loadMarkdownContent(note.path)
    renderedContent.value = marked(content) as string
  } catch (error) {
    console.error('加载笔记失败:', error)
    renderedContent.value = '<p>加载笔记失败，请稍后重试</p>'
  }
}

// 扫描笔记文件
const scanNotes = async () => {
  try {
    const categories = organizeNotesByCategory()

    // 转换为组件需要的格式
    notes.value = Object.keys(categories).map(categoryName => ({
      name: categoryName,
      notes: categories[categoryName].map(noteFile => ({
        title: noteFile.title,
        path: noteFile.path,
        content: '',
        date: new Date().toLocaleDateString()
      })),
      expanded: false
    }))

    // 默认展开第一个分类
    if (notes.value.length > 0) {
      notes.value[0].expanded = true
    }
  } catch (error) {
    console.error('扫描笔记失败:', error)
  }
}

onMounted(() => {
  scanNotes()
})
</script>

<style>
/* 自定义样式补充 */
.prose h1 {
  font-size: 2.25rem;
  font-weight: 700;
  margin-top: 3rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  border-bottom: 2px solid rgba(96, 165, 250, 0.4);
  padding-bottom: 0.75rem;
}

.prose h2 {
  font-size: 1.875rem;
  color: #60a5fa;
  border-bottom: 1px solid rgba(96, 165, 250, 0.3);
  padding-bottom: 0.5rem;
  margin-top: 2.5rem;
  margin-bottom: 1.25rem;
}

.prose h3 {
  font-size: 1.5rem;
  color: #a78bfa;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.prose h4 {
  font-size: 1.25rem;
  color: #f472b6;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.prose p {
  margin-bottom: 1.5rem;
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.85);
}

.prose code {
  background: rgba(0, 0, 0, 0.4);
  color: #10b981;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(16, 185, 129, 0.2);
  font-size: 0.875rem;
}

.prose pre {
  background: rgba(0, 0, 0, 0.6);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 2rem 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.prose pre code {
  background: transparent;
  border: none;
  padding: 0;
  color: #e5e7eb;
}

.prose blockquote {
  border-left: 4px solid #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 2rem 0;
  font-style: italic;
  position: relative;
}

.prose blockquote::before {
  content: '"';
  font-size: 4rem;
  color: rgba(59, 130, 246, 0.3);
  position: absolute;
  top: -0.5rem;
  left: 1rem;
  line-height: 1;
}

.prose ul, .prose ol {
  margin: 1.5rem 0;
  padding-left: 2.5rem;
}

.prose li {
  margin-bottom: 0.75rem;
  color: rgba(255, 255, 255, 0.85);
}

.prose table {
  width: 100%;
  margin: 2rem 0;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.prose th {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
  padding: 1rem;
}

.prose td {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.85);
  padding: 1rem;
}

.prose tr:hover td {
  background: rgba(255, 255, 255, 0.1);
}

.prose a {
  text-decoration: none;
  font-weight: 500;
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
  color: #60a5fa;
}

.prose a:hover {
  color: #93c5fd;
  border-bottom-color: #60a5fa;
}

.prose img {
  max-width: 100%;
  border-radius: 0.75rem;
  margin: 2rem 0;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.prose hr {
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.5), transparent);
  margin: 3rem 0;
}

.prose strong {
  color: white;
  font-weight: 700;
}

.prose em {
  color: #fbbf24;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .flex.h-screen {
    flex-direction: column;
  }
  
  .w-80 {
    width: 100%;
    height: 40vh;
  }
}
</style>
