# AGENTS.md

给后续在本仓库执行任务的 AI agent / 协作者看的项目约定。

## 项目是什么

基于 Three.js 的 3D 地球可视化：把中国 35 个省级行政区渲染到球面上，支持轨道控制、悬停高亮、点击聚焦并进入省份详情页；进到省份详情页后可继续下钻到该省的地级市。Vue 3 + Vite + 原生 Three.js，**没有后端**。

## 目录职责

| 路径 | 职责 |
| --- | --- |
| `src/App.vue` | 应用外壳与全局盒模型 |
| `src/main.js` | 入口：装配 router，装全局错误兜底（`errorHandler` + `unhandledrejection`），并引入 `styles/tokens.css` |
| `src/router/index.js` | 路由表：`/` → 地球，`/province/:adcode` → 省份详情页，`/drill/:adcode` → 地级市视角，`/city/:adcode` → 地级市详情页，兜底重定向 |
| `src/styles/tokens.css` | 设计令牌：颜色、字号、间距、动效时长。组件内不写死具体数值 |
| `src/components/EarthScene.vue` | 地球场景：Three.js 初始化、渲染循环、拾取、HUD 覆盖层；`scope` prop 决定是省级还是地级市视角 |
| `src/components/HudPanel.vue` | 通用玻璃面板（四角角标 + 标题栏） |
| `src/components/ProvinceLegend.vue` | 右上角分区图例，与球面悬停双向联动 |
| `src/components/ProvincePage.vue` | 省份详情页（读 `public/data/provinces/<adcode>.json`） |
| `src/components/DrillView.vue` | 地级市视角：把 `EarthScene` 的 scope 切到某个省 |
| `src/components/CityPage.vue` | 地级市详情页（边界按需从 DataV 拉取，面积由几何算出） |
| `src/utils/geoDataProcessor.js` | GeoJSON → 球面 Mesh 的三角化、贴面与描边 |
| `src/utils/provinceColors.js` | adcode → 颜色的稳定映射与地理分区 |
| `src/utils/provinceLabels.js` | 球面省名标注：位置、朝向、尺寸与屏幕空间去重叠 |
| `src/utils/areaData.js` | 行政区划数据的获取（`areaDataUrl` / `provinceAdcodeOf`）与球面面积计算 |
| `src/__tests__/` | Vitest 用例 |
| `scripts/update-geo.mjs` | 地理数据同步：从 DataV 拉取边界、校验后写入 `public/geojson/` |
| `public/geojson/` | 地理数据源，**只读**（由 `scripts/update-geo.mjs` 更新，不要手工改） |
| `public/data/provinces/` | 省份详情页静态数据（示例值） |
| `docs/` | README 引用的界面截图 |

## 常用命令

```sh
npm install
npm run dev            # 开发服务器
npm run test:unit      # 跑一次测试；watch 用 npm run test:unit:watch
npm run lint           # ESLint（带 --fix，会改文件）
npm run lint:check     # ESLint 检查（不改文件，CI 用这个）
npm run check          # lint:check + test:unit + build，与 CI 同一条链路
npm run format         # Prettier
npm run build          # 生产构建
npm run geo:check      # 校验本地地理数据与上游是否一致（只读，不写文件）
npm run geo:update     # 从 DataV 同步地理数据到 public/geojson/
```

CI 定义在 `.github/workflows/ci.yml`：push 与 PR 都跑 `lint:check` + `test:unit` + `build`。

`npm run test:unit` 必须是绿的才算完成改动。当前有 122 个用例：
`src/__tests__/App.spec.js`（应用挂载）、
`src/__tests__/geoDataProcessor.spec.js`（35 个要素的渲染范围覆盖、与参考实现逐顶点一致、海南/台湾/九段线定点断言）、
`src/__tests__/provinceData.spec.js`（省份详情数据与 GeoJSON 的一致性契约：adcode/name/center 严格相等、字段结构完整、分区覆盖无重叠、配色不落兜底）、
`src/__tests__/provinceLabels.spec.js`（标注的朝向淡出、尺寸缩放、中心点解析、球面位置、地球坐标系换算、尺寸代理、像素高度、矩形相交）、
`src/__tests__/areaData.spec.js`（球面面积公式、洞的处理、面积格式化、市 → 省 adcode 推导）。

## 硬约束

1. **不要手工修改 `public/geojson/china-provinces.json` 与 `public/geojson/china.json`。** 它们是只读数据源，由 `scripts/update-geo.mjs` 从 DataV 同步。手工改动会在下次同步时被覆盖。
2. **不要引入后端 / 数据库 / 鉴权。** 数据走 `public/` 下的静态文件。
3. **不要新增运行时依赖**，除非在提交信息里说明理由。
4. 三角化时**顶点表必须按 polygon 重建**。earcut 的索引在每个 polygon 内从 0 开始，跨 polygon 累加会让多岛屿省份（海南、台湾、浙江、广东、辽宁…）只渲染出第一个 polygon。这是本项目最容易被重新引入的 bug，`geoDataProcessor.spec.js` 会抓住它。
5. 提交信息**必须**用 `git commit -F <文件>`，不要用 `git commit -m "..."`：PowerShell 下双引号会吞掉反引号并可能破坏中文。
6. **地级市边界不要放进仓库。** 34 个省全量约 6.5 MB，改为下钻时按省从 DataV 实时拉取（`src/utils/areaData.js` 的 `areaDataUrl`）。
7. **行政区划代码的位数是 6 位**：前 2 位是省级代码，后 4 位是市级代码。市 → 省用 `provinceAdcodeOf()` 推导，不要自己切片——切成 7 位会请求到不存在的 URL。
8. **不要新增运行时依赖。** `scripts/update-geo.mjs` 只用 Node 内置的 `fetch` 与 `node:crypto`，不引入第三方包。

## 地理数据同步

`scripts/update-geo.mjs` 从 DataV.GeoAtlas 拉取两个文件：

| 上游 | 写入 |
|---|---|
| `100000_full.json` | `public/geojson/china-provinces.json` |
| `100000.json` | `public/geojson/china.json` |

写盘的是上游响应原文（末尾空白统一去掉），因此数据没变时不产生 diff。

脚本会拦住这些情况并以非零码退出：

- 上游返回的不是合法 JSON，或 HTTP 非 200
- 要素数不对、几何类型非法、坐标不是数字对
- **adcode 集合发生变化**（新增或撤销行政区划）——这类变更会牵动配色、图例与详情页数据，必须人工确认

`.github/workflows/update-geo.yml` 每周一自动跑一次，也支持手动触发；有变化才提交，提交信息里带变更摘要。

`AREA_BASE` 环境变量可以覆盖数据源地址，测试与离线演练时用。

## 代码约定

- 组件用 `<script setup>`，注释与文档用中文，标识符用英文。
- 样式用 `<style scoped>`，颜色与字号一律取 `src/styles/tokens.css` 里的变量，不要写死具体色值。
- Three.js 的状态放在 `<script setup>` 的模块作用域变量里，**不要挂到 `window` 上**——组件卸载时无法回收。
- 组件卸载必须：取消 `requestAnimationFrame`、解绑事件监听、释放几何体/材质/贴图、清除引用。

## 已知限制

- 地球贴图 2048×1024，放大到省级尺度会模糊。
- 详情页数据是示例值，不是权威统计口径。
- 地级市下钻依赖 DataV 的在线接口，断网或该服务不可用时下钻会失败（界面会给出错误提示与重试按钮）。
- `npm audit` 需切到官方 npm registry 执行（国内镜像不实现 `/-/npm/v1/security/*` 接口），依赖漏洞需换官方源再审。
