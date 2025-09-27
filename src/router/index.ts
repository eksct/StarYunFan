import { createRouter, createWebHashHistory  } from 'vue-router'

let routes = [
  {
    path: '/',
    component: () => import('@/view/welcome/index.vue'),
  },
  {
    path: '/about',
    component: () => import('@/view/about/index.vue'),
  },
  {
    path: '/notes',
    component: () => import('@/view/notes/index.vue'),
  }
]
const router = createRouter({
  history: createWebHashHistory (import.meta.env.BASE_URL),
  routes,
})

export default router
