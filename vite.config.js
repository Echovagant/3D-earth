import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// Vue DevTools 的悬浮面板：开发时的调试助手。import 先留着，需要时把下面
// plugins 里 vueDevTools() 那行取消注释即可（生产构建本来也不含它）。
// eslint-disable-next-line no-unused-vars
import vueDevTools from 'vite-plugin-vue-devtools'

/**
 * 站点根路径。
 *
 * 部署到子路径下时（GitHub Pages 的项目页是 /<仓库名>/），构建产物里的资源路径
 * 必须带上这段前缀，否则数据与贴图全部 404。构建时用 SITE_BASE 指定；
 * 本地开发与单元测试保持根路径，两边的差别由 import.meta.env.BASE_URL 统一吸收。
 */
const SITE_BASE = (process.env.SITE_BASE || '/').replace(/\/?$/, '/')

/** 深链回退页模板。构建时把 __BASE__ 替换成站点根路径，产出 dist/404.html */
const FALLBACK_TEMPLATE = fileURLToPath(
  new URL('./scripts/spa-fallback.html', import.meta.url),
)

// https://vite.dev/config/
export default defineConfig({
  base: SITE_BASE,
  plugins: [
    vue(),
    // 开发辅助：Vue DevTools 悬浮面板。需要时取消下面这行的注释。
    // vueDevTools(),
    {
      // GitHub Pages 没有服务端重写，深链直接访问会 404。
      // 这个文件负责在构建时生成 404.html，模板里用 __BASE__ 占位，避免路径写死。
      name: '3d-earth:spa-fallback',
      generateBundle() {
        const template = readFileSync(FALLBACK_TEMPLATE, 'utf8')
        this.emitFile({
          type: 'asset',
          fileName: '404.html',
          source: template.replaceAll('__BASE__', SITE_BASE),
        })
      },
    },
  ],
  build: {
    rollupOptions: {
      output: {
        // three 单独成块：业务代码迭代时用户不必重新下载它。
        // three 是首屏刚需，拆块不改变首屏字节数，收益在缓存命中。
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
})
