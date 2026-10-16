// 站点内容配置：所有个人信息、经历、项目集中在这里，页面只负责渲染
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

export interface Friend {
  name: string
  url: string
  description: string
}

export interface Tool {
  name: string
  url: string
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
    '后端开发，日常工作围着 MES 和低代码平台转：设备数据采集、报工链路、安灯系统、和 ERP 打交道。信奉「用笔记对抗遗忘」，这里就是把日常学到的东西慢慢攒成体系的地方——Java、Spring Boot、Redis、Docker，也有点前端和深度学习的痕迹。',
  location: '',
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
  {
    period: '至今',
    role: '后端开发',
    org: 'MES / 低代码平台方向',
    description: '负责设备数据采集（PLC / MQTT）与报工链路、安灯系统软硬联动、ERP（畅捷通 T+）接口对接，以及车间看板和 PDA 终端的前后端维护。',
  },
]

export const tools: Tool[] = [
  {
    name: 'PDF24 Tools',
    url: 'https://tools.pdf24.org/zh/',
    description: 'PDF 全能工具箱，合并、拆分、压缩、格式转换等几十个免费在线工具。',
  },
  {
    name: '菜鸟工具',
    url: 'https://www.jyshare.com/',
    description: '不止于工具：开发、文本、图片、计算等常用在线小工具合集。',
  },
  {
    name: 'Convertio 电子书转换',
    url: 'https://convertio.co/zh/mobi-converter/',
    description: 'MOBI、EPUB、PDF 等电子书格式在线互转。',
  },
  {
    name: 'AllSubConverter 字幕工具',
    url: 'https://www.allsubconverter.com/zh/',
    description: '字幕一站式处理：SRT、ASS、VTT 等 11+ 种格式转换、编辑、同步、翻译。',
  },
  {
    name: '草料二维码',
    url: 'https://cli.im/text',
    description: '把一段文本快速生成二维码，扫码即得。',
  },
  {
    name: '随机菜谱',
    url: 'https://cook.yunyoujun.cn',
    description: '今天吃什么？从菜谱库里随机帮你挑一道。',
  },
  {
    name: 'Hutool AI 文档',
    url: 'https://doc.hutool.cn/pages/ai/',
    description: 'Java 工具库 Hutool 的 AI 模块文档，统一封装各大模型接口。',
  },
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
]

export const friends: Friend[] = [
  {
    name: 'Peanut',
    url: 'https://peanutbo.github.io/',
    description: 'Peanut 的技术博客：算法、计算理论、AI 与心理学的学习笔记。',
  },
]

export const hobbies = ['写代码', '看技术文档', '整理笔记', '听音乐']
