export const siteConfig = Object.freeze({
  basePath: '/StarYunFanSite/',
  siteUrl: 'https://eksct.github.io/StarYunFanSite/',
  name: 'Seiga',
  description: 'Seiga 的个人站：笔记归档、学习时间线与项目记录。',
  publicFiles: ['favicon.ico', 'og-image.jpg', 'note-interactions.js'],
})

export const encodePath = value => value.split('/').map(encodeURIComponent).join('/')
export const staticNotePath = value => siteConfig.basePath + 'notes/' + encodePath(value) + '.html'

export function collectionFor(notePath) {
  const parts = notePath.split('/')
  return parts.length >= 3 ? parts[1] : '其他'
}

export function categoryFor(notePath, data = {}) {
  if (data.category) return data.category
  const parts = notePath.split('/')
  if (parts[1] === '编程语言' && parts[2] === 'JAVA') {
    return parts.includes('Spring Boot') ? 'Spring Boot' : 'Java'
  }
  return collectionFor(notePath)
}

export function isPublishedNote(notePath, data = {}) {
  return notePath !== 'test.md' && data.category !== '测试' && data.draft !== true && data.draft !== 'true'
}
