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
  history: createWebHashHistory (),
  routes,
})

export default router
