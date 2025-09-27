// Markdown 文件加载器
export interface NoteFile {
  path: string
  title: string
  category: string
}

// 定义所有 Markdown 文件
export const noteFiles: NoteFile[] = [
  // Caffeine 相关
  { path: 'major/Caffeine本地缓存/简介.md', title: 'Caffeine 简介', category: 'Caffeine' },
  { path: 'major/Caffeine本地缓存/缓存策略.md', title: 'Caffeine 缓存策略', category: 'Caffeine' },
  { path: 'major/Caffeine本地缓存/驱逐策略.md', title: 'Caffeine 驱逐策略', category: 'Caffeine' },
  { path: 'major/Caffeine本地缓存/刷新.md', title: 'Caffeine 刷新', category: 'Caffeine' },
  { path: 'major/Caffeine本地缓存/移除.md', title: 'Caffeine 移除', category: 'Caffeine' },
  
  // Docker 相关
  { path: 'major/Docker/Docker概述与安装.md', title: 'Docker 概述与安装', category: 'Docker' },
  { path: 'major/Docker/Docker命令.md', title: 'Docker 命令', category: 'Docker' },
  { path: 'major/Docker/DockerFile.md', title: 'DockerFile', category: 'Docker' },
  { path: 'major/Docker/Docker镜像.md', title: 'Docker 镜像', category: 'Docker' },
  
  // Redis 相关
  { path: 'major/Redis/安装&连接.md', title: 'Redis 安装&连接', category: 'Redis' },
  { path: 'major/Redis/数据类型.md', title: 'Redis 数据类型', category: 'Redis' },
  { path: 'major/Redis/Redis 常用命令大全.md', title: 'Redis 常用命令大全', category: 'Redis' },
  { path: 'major/Redis/Redis 分布式锁实现（set nx ex）.md', title: 'Redis 分布式锁实现', category: 'Redis' },
  { path: 'major/Redis/Redisson 框架使用.md', title: 'Redisson 框架使用', category: 'Redis' },
  { path: 'major/Redis/可重入锁.md', title: 'Redis 可重入锁', category: 'Redis' },
  { path: 'major/Redis/布隆过滤器.md', title: 'Redis 布隆过滤器', category: 'Redis' },
  { path: 'major/Redis/redis发布订阅.md', title: 'Redis 发布订阅', category: 'Redis' },
  { path: 'major/Redis/Spring Data redis.md', title: 'Spring Data Redis', category: 'Redis' },
  { path: 'major/Redis/缓存穿透、击穿、雪崩处理策略.md', title: 'Redis 缓存问题处理策略', category: 'Redis' },
  
  // Kafka 相关
  { path: 'major/kafka/kafka简介.md', title: 'Kafka 简介', category: 'Kafka' },
  { path: 'major/kafka/快速入门.md', title: 'Kafka 快速入门', category: 'Kafka' },
  { path: 'major/kafka/Spring for Apache Kafka.md', title: 'Spring for Apache Kafka', category: 'Kafka' },
  
  // Java 相关
  { path: 'major/编程语言/JAVA/JAVASE/00关键字.md', title: 'Java 关键字', category: 'Java' },
  { path: 'major/编程语言/JAVA/JAVASE/01 数据类型.md', title: 'Java 数据类型', category: 'Java' },
  { path: 'major/编程语言/JAVA/JAVASE/02 变量.md', title: 'Java 变量', category: 'Java' },
  { path: 'major/编程语言/JAVA/JAVASE/02 方法.md', title: 'Java 方法', category: 'Java' },
  { path: 'major/编程语言/JAVA/JAVASE/03 常量.md', title: 'Java 常量', category: 'Java' },
  { path: 'major/编程语言/JAVA/JAVASE/04 数组.md', title: 'Java 数组', category: 'Java' },
  { path: 'major/编程语言/JAVA/JAVASE/05 选择结构.md', title: 'Java 选择结构', category: 'Java' },
  { path: 'major/编程语言/JAVA/JAVASE/06 循环结构.md', title: 'Java 循环结构', category: 'Java' },
  { path: 'major/编程语言/JAVA/JAVASE/07 类和对象.md', title: 'Java 类和对象', category: 'Java' },
  { path: 'major/编程语言/JAVA/JAVASE/08 面向对象.md', title: 'Java 面向对象', category: 'Java' },
  { path: 'major/编程语言/JAVA/JAVASE/09 位运算.md', title: 'Java 位运算', category: 'Java' },
  { path: 'major/编程语言/JAVA/JAVASE/10 反射.md', title: 'Java 反射', category: 'Java' },
  { path: 'major/编程语言/JAVA/JAVASE/11 网络编程.md', title: 'Java 网络编程', category: 'Java' },
  
  // Spring Boot 相关
  { path: 'major/编程语言/JAVA/框架/Spring Boot/Spring Boot 介绍.md', title: 'Spring Boot 介绍', category: 'Spring Boot' },
  { path: 'major/编程语言/JAVA/框架/Spring Boot/Spring Boot 02.md', title: 'Spring Boot 02', category: 'Spring Boot' },
  { path: 'major/编程语言/JAVA/框架/Spring Boot/Spring Boot 03.md', title: 'Spring Boot 03', category: 'Spring Boot' },
  
  // 其他
  { path: 'major/初步的学习清单.md', title: '初步的学习清单', category: '其他' },
  { path: 'test.md', title: '测试笔记', category: '测试' },
]

// 动态加载 Markdown 文件内容
export async function loadMarkdownContent(path: string): Promise<string> {
  try {
    // 使用 fetch 加载文件
    const response = await fetch(`${import.meta.env.BASE_URL}postDir/${path}`)
    if (!response.ok) {
      throw new Error(`Failed to load markdown file: ${path}`)
    }
    return await response.text()
  } catch (error) {
    console.error('加载 Markdown 文件失败:', error)
    return `# 加载失败\n\n无法加载文件: ${path}\n\n请检查文件是否存在。`
  }
}

// 按分类组织笔记
export function organizeNotesByCategory(): { [key: string]: NoteFile[] } {
  const categories: { [key: string]: NoteFile[] } = {}
  
  noteFiles.forEach(note => {
    if (!categories[note.category]) {
      categories[note.category] = []
    }
    categories[note.category].push(note)
  })
  
  return categories
}
