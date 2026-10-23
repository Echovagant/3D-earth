import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'

const router = createRouter({
  // 带上 base：站点部署在子路径下时，路由前缀要跟着走
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
