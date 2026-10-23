import { createApp } from 'vue'

import './styles/tokens.css'
import './styles/detail-page.css'
import './styles/learning.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// 全局错误兜底：组件渲染、生命周期、watcher 里的异常都会走到这里。
// 不接管的话，这些错误只会变成一条容易被忽略的控制台输出。
app.config.errorHandler = (err, _instance, info) => {
  console.error('[3D-earth] 组件内部错误', { info, err })
}

// 事件处理器与 Promise 里的异常不在 errorHandler 的覆盖范围内，要单独兜。
window.addEventListener('unhandledrejection', (event) => {
  console.error('[3D-earth] 未处理的 Promise 拒绝', event.reason)
})

// 深链回退：GitHub Pages 没有服务端重写，直接访问 /lesson/2.19 会落到 404.html，
// 由那个文件把真实路径存进 sessionStorage。必须在 app.use(router) 之前把地址栏改回去——
// app.use 会立刻触发首次导航，那时读到的就是改好的深链。
const REDIRECT_KEY = '3d-earth:redirect'
try {
  const stored = sessionStorage.getItem(REDIRECT_KEY)
  if (stored) {
    sessionStorage.removeItem(REDIRECT_KEY)
    window.history.replaceState(null, '', stored)
  }
} catch {
  // 隐私模式下 sessionStorage 可能不可用：没有深链也能正常打开首页
}

app.use(router)
app.mount('#app')
