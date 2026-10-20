# AGENTS.md

给后续在本仓库执行任务的 AI agent / 协作者看的项目约定。

## 项目是什么

基于 Three.js 的 3D 地球可视化：把中国 35 个省级行政区渲染到球面上，支持轨道控制、悬停高亮、点击聚焦并进入省份详情页。Vue 3 + Vite + 原生 Three.js，**没有后端**。

## 目录职责

| 路径 | 职责 |
| --- | --- |
| `src/App.vue` | 应用外壳与全局盒模型（`html/body` 归零 margin，避免滚动条） |
| `src/main.js` | 入口：装配 router 与 pinia |
| `src/router/index.js` | 路由表：`/` → 地球，`/province/:adcode` → 详情页，兜底重定向 |
| `src/components/EarthScene.vue` | 地球场景：Three.js 初始化、渲染循环、拾取、hover、聚焦飞行 |
| `src/components/ProvincePage.vue` | 省份详情页（读 `public/data/provinces/<adcode>.json`） |
| `src/components/ProvinceLegend.vue` | 右上角省色图例（纯展示组件） |
| `src/utils/geoDataProcessor.js` | GeoJSON → 球面 Mesh 的三角化、贴面与描边 |
| `src/utils/provinceColors.js` | adcode → 颜色的稳定映射（不要改成按数组顺序轮转） |
| `src/__tests__/` | Vitest 用例 |
| `public/geojson/` | 地理数据源，**只读** |
| `public/data/provinces/` | 省份详情页静态数据（示例值） |

## 常用命令

```sh
npm install
npm run dev            # 开发服务器
npm run test:unit      # 跑一次测试；watch 用 npm run test:unit:watch
npm run lint           # ESLint（带 --fix，会改文件）
npm run format         # Prettier
npm run build          # 生产构建
```

`npm run test:unit` 必须是绿的才算完成改动。当前有 6 个用例：
`src/__tests__/App.spec.js`（应用挂载）与 `src/__tests__/geoDataProcessor.spec.js`
（35 个要素的渲染范围覆盖、与参考实现逐顶点一致、海南/台湾/九段线定点断言）。

## 硬约束

1. **不要修改 `public/geojson/china-provinces.json` 与 `public/geojson/china.json`。** 它们是只读数据源。
2. **不要引入后端 / 数据库 / 鉴权。** 数据走 `public/` 下的静态文件。
3. **不要新增运行时依赖**，除非在提交信息里说明理由。
4. 三角化时**顶点表必须按 polygon 重建**。earcut 的索引在每个 polygon 内从 0 开始，跨 polygon 累加会让多岛屿省份（海南、台湾、浙江、广东、辽宁…）只渲染出第一个 polygon。这是本项目最容易被重新引入的 bug，`geoDataProcessor.spec.js` 会抓住它。
5. 提交信息**必须**用 `git commit -F <文件>`，不要用 `git commit -m "..."`：PowerShell 下双引号会吞掉反引号并可能破坏中文。

## 代码约定

- 组件用 `<script setup>`，注释与文档用中文，标识符用英文。
- 样式用 `<style scoped>`，颜色与字号用 CSS 变量或硬编码都可以，但保持与现有暗色主题一致。
- Three.js 的状态放在 `<script setup>` 的模块作用域变量里，**不要挂到 `window` 上**——组件卸载时无法回收。
- 组件卸载必须：取消 `requestAnimationFrame`、解绑事件监听、释放几何体/材质/贴图、清除引用。

## 已知限制

- 地球贴图 2048×1024，放大到省级尺度会模糊。
- 详情页数据是示例值，不是权威统计口径。
- `npm audit` 在本机跑不通（npm 镜像不实现 `/-/npm/v1/security/*` 接口），依赖漏洞需换官方源再审。
