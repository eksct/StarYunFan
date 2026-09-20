import { createRouter, createWebHashHistory } from 'vue-router'

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
    path: '/timeline',
    name: 'timeline',
    component: () => import('@/view/timeline/index.vue'),
    meta: { title: '时间线' },
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
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach(to => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} · Seiga` : 'Seiga'
})

export default router
