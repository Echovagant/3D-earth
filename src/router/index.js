import { createRouter, createWebHistory } from 'vue-router'
import EarthScene from '../components/EarthScene.vue'

const routes = [
  {
    path: '/',
    name: 'Earth',
    component: EarthScene
  },
  {
    path: '/province/:name',
    name: 'Province',
    // 路由级代码分割[citation:4]
    component: () => import('../components/ProvincePage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
