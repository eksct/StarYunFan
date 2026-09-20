// 站点内容配置：所有个人信息、经历、项目集中在这里，页面只负责渲染
// 标注 TODO 的条目是占位内容，需要替换成真实信息
import avatarUrl from '@/assets/img/Capture001.jpg'

export interface SocialLink {
  label: string
  url: string
  kind: 'github' | 'bilibili' | 'mail' | 'link'
}

export interface SkillGroup {
  name: string
  summary: string
  items: string[]
}

export interface Experience {
  period: string
  role: string
  org: string
  description: string
}

export interface Milestone {
  date: string
  title: string
  description: string
}

export interface Project {
  name: string
  description: string
  stack: string[]
  url?: string
  period: string
  status: '进行中' | '已完结' | '维护中'
}

export const profile = {
  name: 'Seiga',
  handle: 'eksct',
  avatar: avatarUrl,
  tagline: '在后端与前端之间来回横跳的开发者',
  intro:
    '把日常学到的东西记下来，慢慢攒成体系。这里放的是我的笔记归档、项目记录和一点生活痕迹。',
  // TODO: 补真实所在地与联系邮箱
  location: '中国',
  email: '',
}

export const socialLinks: SocialLink[] = [
  { label: 'GitHub', url: 'https://github.com/eksct', kind: 'github' },
  { label: '哔哩哔哩', url: 'https://space.bilibili.com/247835757', kind: 'bilibili' },
]

export const skillGroups: SkillGroup[] = [
  {
    name: '后端',
    summary: '主力方向',
    items: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Kafka'],
  },
  {
    name: '前端',
    summary: '够用，正在补',
    items: ['TypeScript', 'Vue 3', 'Vite', 'Tailwind CSS'],
  },
  {
    name: '运维与工具',
    summary: '能自己把服务跑起来',
    items: ['Docker', 'Git', 'Linux'],
  },
]

export const experiences: Experience[] = [
  // TODO: 替换成真实经历
  {
    period: '2024 — 至今',
    role: '后端开发',
    org: '某公司',
    description: '负责业务接口开发与维护，参与系统重构。',
  },
]

export const education = [
  // TODO: 替换成真实教育经历
  { period: '2021 — 2025', school: '某大学', major: '计算机相关专业' },
]

export const milestones: Milestone[] = [
  // TODO: 时间线是手工维护的，补上真实节点与日期
  { date: '2024-01', title: '开始系统学习后端', description: '从 Java 基础一路啃到 Spring Boot。' },
  { date: '2024-06', title: '接触中间件', description: 'Redis、Kafka 挨个上手，边踩坑边记笔记。' },
  { date: '2025-03', title: '开始写前端', description: '用 Vue 3 搭了这个站，顺手把笔记搬上来。' },
  { date: '2026-09', title: '站点改版', description: '去掉多余装饰，改成简约风，笔记改成时间线归档。' },
]

export const projects: Project[] = [
  {
    name: 'StarYunFan 个人站',
    description: '你现在看到的这个站。Vue 3 + TypeScript + Vite 纯前端，笔记在构建期扫描成清单，运行时按需加载。',
    stack: ['Vue 3', 'TypeScript', 'Vite', 'Tailwind CSS'],
    url: 'https://github.com/eksct/StarYunFan',
    period: '2025 — 至今',
    status: '维护中',
  },
  {
    name: 'Obsidian 笔记库',
    description: 'Java、Spring Boot、Redis、Docker 等方向的学习笔记，已归档到本站，共数十篇。',
    stack: ['Markdown', 'Obsidian'],
    url: '/notes',
    period: '2024 — 至今',
    status: '维护中',
  },
  // TODO: 补上真实项目，或删掉这条占位
  {
    name: '待补充项目',
    description: '在 src/content/site.ts 里替换成你自己的项目，包含描述、技术栈、链接与时间。',
    stack: ['TODO'],
    period: 'TODO',
    status: '进行中',
  },
]

export const hobbies = ['写代码', '看技术文档', '整理笔记', '听音乐']
