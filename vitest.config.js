import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // 默认用 node 环境：绝大多数用例是纯函数与数据契约断言，不需要 DOM。
      // jsdom 环境的搭建开销占整套测试耗时的 86%（实测 20.6s → 1.8s）。
      // 需要 DOM 的用例在文件首行声明 `// @vitest-environment jsdom`。
      environment: 'node',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
