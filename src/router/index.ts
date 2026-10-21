import { createRouter, createWebHashHistory } from 'vue-router'
import { markReaderReady, notesReturnTo, resetReaderReadiness, updatePageMetadata, waitForReader } from '@/utils/pageState'

const scrollPositions = new Map<string, { top: number; left: number }>()

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/view/welcome/index.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/view/about/index.vue'),
    meta: { title: '关于' },
  },
  {
    path: '/notes',
    name: 'notes',
    component: () => import('@/view/notes/index.vue'),
    meta: { title: '笔记' },
  },
  {
    path: '/notes/:path(.*)',
    name: 'note',
    component: () => import('@/view/notes/NoteReader.vue'),
  },
  {
    path: '/tools',
    name: 'tools',
    component: () => import('@/view/tools/index.vue'),
    meta: { title: '工具' },
  },
  {
    path: '/friends',
    name: 'friends',
    component: () => import('@/view/friends/index.vue'),
    meta: { title: '友链' },
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/view/projects/index.vue'),
    meta: { title: '项目' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/view/not-found/index.vue'),
    meta: { title: '页面不存在' },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  async scrollBehavior(to, from, savedPosition) {
    if (to.name === 'note' || (to.name === 'notes' && from.name !== 'notes')) await waitForReader()
    if (to.hash) {
      let id = to.hash.slice(1)
      try { id = decodeURIComponent(id) } catch { /* Keep malformed anchors literal. */ }
      const element = document.getElementById(id)
      if (element) return { el: element, top: 88 }
    }
    if (savedPosition) return savedPosition
    if (to.name === 'notes' && from.name === 'notes') return false
    if (to.name === 'notes') return scrollPositions.get(to.fullPath) || { top: 0 }
    return { top: 0 }
  },
})

router.beforeEach((to, from) => {
  scrollPositions.set(from.fullPath, { top: window.scrollY, left: window.scrollX })
  if (from.name === 'notes') notesReturnTo.value = from.fullPath
  if ((to.name === 'note' && to.path !== from.path) || (to.name === 'notes' && from.name !== 'notes')) resetReaderReadiness()
  else if (to.name !== 'note') markReaderReady()
})
router.afterEach(to => updatePageMetadata(to))
router.onError((_error, to) => {
  markReaderReady()
  window.dispatchEvent(new CustomEvent('site:navigation-error', { detail: { path: to.fullPath } }))
})

export default router
