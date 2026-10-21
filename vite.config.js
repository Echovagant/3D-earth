import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
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
