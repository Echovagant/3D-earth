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

// 深链回退在 router 模块里做（restoreDeepLink）：它必须赶在 createWebHistory() 之前，
// 详见 src/utils/spaRedirect.js 的说明。
app.use(router)
app.mount('#app')
