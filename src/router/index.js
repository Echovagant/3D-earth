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
    component: () => import('../components/ProvincePage.vue'),
    props: true,
  },
  {
    // 某个省的地级市视角
    path: '/drill/:adcode',
    name: 'Drill',
    component: () => import('../components/DrillView.vue'),
    props: true,
  },
  {
    // 地级市详情
    path: '/city/:adcode',
    name: 'City',
    component: () => import('../components/CityPage.vue'),
    props: true,
  },
  {
    // 全球视角
    path: '/world',
    name: 'World',
    component: () => import('../components/WorldScene.vue'),
  },
  {
    // 国家详情
    path: '/country/:iso3',
    name: 'Country',
    component: () => import('../components/CountryPage.vue'),
    props: true,
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
