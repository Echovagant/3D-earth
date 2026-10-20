import { createRouter, createWebHistory } from 'vue-router'
import EarthScene from '../components/EarthScene.vue'

const routes = [
  {
    path: '/',
    name: 'Earth',
    component: EarthScene,
  },
  {
    // 用 adcode 而不是中文省名做参数：更稳、可缓存、URL 友好
    path: '/province/:adcode',
    name: 'Province',
    // 路由级代码分割
    component: () => import('../components/ProvincePage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
