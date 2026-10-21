import EarthScene from '../components/EarthScene.vue'

/**
 * 路由表。
 *
 * 单独抽成模块是为了能测：createWebHistory 需要浏览器环境，
 * 而绝大多数用例跑在 node 环境下。这里只导出数据，不创建 router。
 */
export const routes = [
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

export default routes
