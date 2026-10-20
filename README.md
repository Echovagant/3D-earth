# 3D-earth

基于 Three.js 的 3D 地球可视化：把中国 35 个省级行政区渲染到球面上，支持轨道控制、悬停高亮与点击进入省份详情页。

## 技术栈

- **Vue 3.5**（`<script setup>`）+ **Vite 7** + **Vue Router 4**
- **Three.js 0.180** —— 直接使用原生 three，未使用 TresJS
- **earcut 2.2** —— GeoJSON 多边形三角化
- **Vitest 3** + @vue/test-utils

## 快速开始

```sh
npm install

npm run dev            # 开发服务器（默认 http://localhost:5173）
npm run test:unit      # 跑一次测试（watch 模式用 npm run test:unit:watch）
npm run lint           # ESLint（带 --fix）
npm run format         # Prettier
npm run build          # 生产构建，产物在 dist/
```

## 目录结构

```
src/
  App.vue                    应用外壳 + 全局盒模型
  main.js                    入口：装配 router 与 pinia
  router/index.js            路由表（/ → 地球，/province/:adcode → 详情页）
  components/
    EarthScene.vue           地球场景：Three.js 初始化、渲染循环、拾取与交互
    ProvincePage.vue         省份详情页
    ProvinceLegend.vue       省色图例
  utils/
    geoDataProcessor.js      GeoJSON → 球面 Mesh 的三角化与贴面
    provinceColors.js        adcode → 颜色的稳定映射
  __tests__/                 Vitest 用例
public/
  geojson/china-provinces.json   35 个省级要素（含九段线要素）
  geojson/china.json              中华人民共和国整体边界
  data/provinces/<adcode>.json   省份详情页静态数据
  textures/earth_atmos_2048.jpg  地球贴图
```

## 地理数据

- 省份边界来自 `public/geojson/china-provinces.json`，共 35 个 feature（34 个省级行政区 + 1 个九段线要素 `100000_JD`）。**这两个 GeoJSON 文件是只读数据源，不要修改。**
- 三角化在经纬度平面上用 earcut 完成，再把顶点映射到半径 2 的球面。多岛屿省份（海南、台湾、浙江、广东、辽宁等）是 `MultiPolygon`，每个 polygon 必须独立三角化——earcut 的索引在每个 polygon 内从 0 开始。
- 详情页数据是 `public/data/provinces/<adcode>.json` 下的静态文件，字段为示例数据（面积/人口取公开地理常识的近似值），**不作为权威统计口径**。

## 已知限制

- 地球贴图为 2048×1024 近地表图，放大到省级尺度会有明显模糊。
- 省份详情页数据为静态示例值，没有后端与实时数据源。
- 依赖漏洞审计（`npm audit`）在本机未完成：当前 npm 镜像不实现 `/-/npm/v1/security/*` 接口。
- 主包约 600 kB（几乎全部是 three.js）。没有做代码分割——three 是首屏刚需，拆包只改变缓存策略、不减少首屏字节数。

## 约定

- 组件与工具函数用 `<script setup>`，注释与文档使用中文，标识符使用英文。
- 提交信息请用 `git commit -F <文件>` 而不是 `git commit -m`：PowerShell 下双引号会吞掉反引号并破坏中文。
- 几何相关改动务必跑 `npm run test:unit`：`src/__tests__/geoDataProcessor.spec.js` 会校验 35 个要素的渲染范围与参考实现逐顶点一致。
