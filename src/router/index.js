import { createRouter, createWebHistory } from 'vue-router'
import { restoreDeepLink } from '../utils/spaRedirect'
import { routes } from './routes'

// 必须在 createWebHistory 之前：vue-router 创建 history 时就把当前地址读进快照，
// 之后再改地址栏它不知道，首次导航还是会去首页。详见 utils/spaRedirect.js。
restoreDeepLink()

const router = createRouter({
  // 带上 base：站点部署在子路径下时，路由前缀要跟着走
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
