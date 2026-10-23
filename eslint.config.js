import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfig([
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,vue}'],
  },

  // .superpowers 是本地工具的工作区目录（已在 .gitignore 里），但 ESLint 不读 .gitignore，
  // 不排除的话，丢进去的临时脚本会把 lint 门禁弄红
  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '.superpowers/**']),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  {
    // 构建与运维脚本跑在 Node 环境，不在浏览器
    name: 'app/node-files',
    files: ['scripts/**/*.{js,mjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  {
    // 构建设置也跑在 Node 环境：要用 process.env 读构建期变量（比如站点路径前缀）
    name: 'app/vite-config',
    files: ['vite.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  
  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },
  skipFormatting,
])
