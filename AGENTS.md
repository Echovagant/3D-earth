# AGENTS.md

给后续在本仓库执行任务的 AI agent / 协作者看的项目约定。

## 项目是什么

基于 Three.js 的 3D 地球可视化：把中国 35 个省级行政区渲染到球面上，支持轨道控制、悬停高亮、点击聚焦并进入省份详情页；另有独立的全球视角（239 个国家/地区）与标准地图审图号清单页。Vue 3 + Vite + 原生 Three.js，**没有后端**。

## 目录职责

| 路径 | 职责 |
| --- | --- |
| `src/App.vue` | 应用外壳与全局盒模型 |
| `src/main.js` | 入口：装配 router，装全局错误兜底（`errorHandler` + `unhandledrejection`），并引入 `styles/tokens.css` |
| `src/router/index.js` | 路由表：`/` → 地球，`/province/:adcode` → 省份详情页，`/world` → 全球视角，`/country/:iso3` → 国家详情页，`/licenses` → 数据来源与许可，`/standard-map` → 标准地图与审图号清单，兜底重定向 |
| `src/styles/tokens.css` | 设计令牌：颜色、字号、间距、动效时长。组件内不写死具体数值 |
| `src/components/EarthScene.vue` | 地球场景：Three.js 初始化、渲染循环、拾取、HUD 覆盖层 |
| `src/components/HudPanel.vue` | 通用玻璃面板（四角角标 + 标题栏） |
| `src/components/ProvinceLegend.vue` | 右上角分区图例，与球面悬停双向联动 |
| `src/components/ProvincePage.vue` | 省份详情页（读 `public/data/provinces/<adcode>.json`） |
| `src/components/WorldScene.vue` | 全球视角：世界国界、中文国名标注、国家拾取与相机飞行 |
| `src/components/CountryPage.vue` | 国家详情页（面积由几何算出；不含人口） |
| `src/components/LicensesPage.vue` | 数据来源与许可页（路由 `/licenses`），内容与 `LICENSES.md` 对应 |
| `src/components/StandardMapPage.vue` | 标准地图与审图号清单页（路由 `/standard-map`），读 `public/data/standard-maps.json` |
| `src/utils/geoDataProcessor.js` | GeoJSON → 球面 Mesh 的三角化、贴面与描边 |
| `src/utils/globeMath.js` | 球面交互的纯函数：拾取归一化、飞行插值、球面质心（两个场景共用一份） |
| `src/utils/provinceColors.js` | adcode → 颜色的稳定映射与地理分区 |
| `src/utils/provinceLabels.js` | 球面省名标注：位置、朝向、尺寸与屏幕空间去重叠 |
| `src/utils/areaData.js` | 球面面积计算（`areaData.js` 只剩鞋带公式那一套公共逻辑） |
| `src/utils/worldData.js` | 世界国界数据获取、分区配色（球面质心从 `globeMath.js` 转出） |
| `src/__tests__/` | Vitest 用例 |
| `scripts/update-geo.mjs` | 中国地理数据同步：省界与各省面积 |
| `scripts/update-world.mjs` | 世界国界同步：拉取、校验、写入 |
| `scripts/update-standard-maps.mjs` | 标准地图与审图号清单同步（19 个分类，表单 POST 检索接口） |
| `scripts/check-licenses.mjs` | 数据源体检：上游是否还可达、许可是否还与 `LICENSES.md` 登记的一致 |
| `public/geojson/` | 地理数据源，**只读**（由上述脚本更新，不要手工改） |
| `public/data/provinces/` | 省份详情页静态数据 |
| `public/data/standard-maps.json` | 标准地图元数据与审图号清单（只列元数据，不含地图图片） |
| `docs/` | README 引用的界面截图 |
| `LICENSES.md` | **数据来源与许可清单**：每项数据的来源、许可与义务。改了数据源必须同步这里 |

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
npm run geo:update     # 从 DataV 同步中国地理数据到 public/geojson/
npm run world:check    # 校验世界国界与上游是否一致
npm run world:update   # 从 npmmirror 同步世界国界
npm run standard:check # 校验标准地图与审图号清单是否与上游一致
npm run standard:update # 从标准地图服务系统同步审图号清单
npm run licenses:check # 体检数据源：上游可达性与许可是否仍与登记一致
```

CI 定义在 `.github/workflows/ci.yml`：push 与 PR 都跑 `lint:check` + `test:unit` + `build`。

`npm run test:unit` 必须是绿的才算完成改动。当前有 295 个用例：
`src/__tests__/App.spec.js`（应用挂载）、
`src/__tests__/geoDataProcessor.spec.js`（35 个要素的渲染范围覆盖、与参考实现逐顶点一致、海南/台湾/九段线定点断言）、
`src/__tests__/provinceData.spec.js`（省份详情数据与 GeoJSON 的一致性契约：adcode/name/center 严格相等、字段结构完整、分区覆盖无重叠、配色不落兜底、面积与几何重算一致、两个面积口径不差数量级、人口合计与全国人口相差 3% 以内）、
`src/__tests__/provinceLabels.spec.js`（标注的朝向淡出、尺寸缩放、中心点解析、球面位置、地球坐标系换算、尺寸代理、像素高度、矩形相交）、
`src/__tests__/areaData.spec.js`（球面面积公式、洞的处理、面积格式化）、
`src/__tests__/geoScripts.spec.js`（同步脚本的回归：`formatJson` 幂等、**数据源许可登记**）、
`src/__tests__/worldData.spec.js`（世界国界：239 国、中文名与 ISO 代码、次区域与配色、球面质心不跨 180°）、
`src/__tests__/globeMath.spec.js`（拾取归一化、缓动、绕 Y 轴旋转、球面质心）、
`src/__tests__/standardMaps.spec.js`（标准地图清单：条目非空且都带审核年份、**条目数下限 2000 防抽样退化**、**最新年份 ≥ 2024 防同步退化**、国家审图号（GS）年份与审核年份一致、同名同号唯一、分类齐全、**不含任何指向官方地图图片的直链**）、
`src/__tests__/router.spec.js`（路由表契约，含 `/licenses` 与 `/standard-map`）。

## 硬约束

1. **不要手工修改 `public/geojson/` 下的文件。** 它们是只读数据源，由 `scripts/update-geo.mjs` 与 `scripts/update-world.mjs` 从上游同步。手工改动会在下次同步时被覆盖。
2. **不要引入后端 / 数据库 / 鉴权。** 数据走 `public/` 下的静态文件。
3. **不要新增运行时依赖**，除非在提交信息里说明理由。
4. 三角化时**顶点表必须按 polygon 重建**。earcut 的索引在每个 polygon 内从 0 开始，跨 polygon 累加会让多岛屿省份（海南、台湾、浙江、广东、辽宁…）只渲染出第一个 polygon。这是本项目最容易被重新引入的 bug，`geoDataProcessor.spec.js` 会抓住它。
5. 提交信息**必须**用 `git commit -F <文件>`，不要用 `git commit -m "..."`：PowerShell 下双引号会吞掉反引号并可能破坏中文。
6. **行政区划代码是 6 位**，前 2 位是省级代码。省级详情页的数据文件路径就是 `public/data/provinces/<adcode>.json`，adcode 必须与 `china-provinces.json` 要素里的完全一致（`provinceData.spec.js` 做严格相等断言）。
7. **不要新增运行时依赖。** `scripts/` 下的脚本只用 Node 内置的 `fetch`、`node:crypto`、`node:zlib`，不引入第三方包。
8. **新增或更换数据源前先查许可。** 只用有明确开放许可的源（Unlicense / MIT / ODbL / 公有领域）。付费数据集、声明「仅供学习研究使用」的采集站、来源不明的镜像都不做——公开仓库再分发它们风险不可控。改完必须在 `LICENSES.md` 里登记来源、许可与义务，并同步 `LicensesPage.vue`；`geoScripts.spec.js` 会检查这件事。
9. **球面标注的 sprite 位置是地球局部坐标**，相机在世界坐标。比较或投影前必须用 `earthLocalToWorld()` 转换——漏了会让标注全部不可见（opacity 恒为 0）。
10. **three.js 的 `Color` 不认 `'0xRRGGBB'` 字符串**，只认数值或 `'#RRGGBB'`。传错类型不会报错，只是颜色静默变成默认灰。
11. **审图号不能沿用到 3D 地球上。** 审图号是对特定**平面地图产品**的核准编号，绑定那张地图的内容与表现形式。本项目把行政区划投到球面、重新配色并加了交互，属于另一种表现形式，因此**不能**把标准地图的审图号标在自己的球面上，也不能把本站当作「经审核的标准地图」使用或转发。
12. **只同步标准地图的元数据，不下载也不分发地图图片。** 标准地图服务系统的站点条款写明「未经许可不得复制、镜像」，把官方图片打包进公开仓库属于再分发。`public/data/standard-maps.json` 里只有名称、比例尺、审图号、审核年份与分类；图片请引导用户到官方服务系统下载。
13. **所有贴图都要显式声明 `colorSpace = SRGBColorSpace`。** JPEG 与 Canvas 存的都是 sRGB 编码的数据，three.js 默认按线性数据处理——漏掉这一句，画面会整体发灰、对比度被压掉。**这一条曾经被误判成「贴图分辨率不够」**：实测把 4096×2048 换成 8192×4096（NASA 有 21600×10800 的更高精原图，同区域高频能量是 5400 版的 2.67 倍），最终画面锐度只提升 0.2%；而改对色彩空间后，画面从一片灰雾变成能看清山脊的卫星影像。**贴图文件本身不做任何色彩补偿**，颜色由渲染端负责。
14. **同步脚本要能覆盖上游的全部分类与全部分页。** 写死页数上限或只取部分分类，会**静默**少收一大批数据——标准地图清单曾因此从 2047 张掉到 133 张且不报错。`standardMaps.spec.js` 里有条目数下限与「最新年份 ≥ 2024」两条断言专门守这个。

## 地理数据同步

`scripts/update-geo.mjs` 从 DataV.GeoAtlas 拉取：

| 上游 | 写入 |
|---|---|
| `100000_full.json` | `public/geojson/china-provinces.json` |
| `100000.json` | `public/geojson/china.json` |
| —— | `public/data/provinces/<adcode>.json` 里的 `areaKm2`（由边界几何算出） |

`scripts/update-world.mjs` 从 npm 国内镜像（npmmirror）拉两个包并合并：

| 包 | 许可 | 提供 | 写入 |
|---|---|---|---|
| `@surbowl/world-geo-json-zh` | Unlicense（公有领域） | 几何 + 简体中文名 + ISO 3166-1 代码 | `public/geojson/world-countries.json` |
| `un-m49` | MIT | 联合国 M49 地区划分（大洲 / 次区域） | 同上 |

两边靠 ISO alpha-3 关联。英文名由运行时自带的 `Intl.DisplayNames` 生成，不引外部属性源。
**没有人口**：国内没有可自动同步的权威人口源，详情页改展示边界实算面积。

`scripts/update-standard-maps.mjs` 从自然资源部主管的**标准地图服务系统**
（`http://bzdt.ch.mnr.gov.cn/`）同步标准地图清单：检索接口 `sbsm/supermap/searchPicture.do`
是**表单 POST**（`seachText` / `superclass` / `pageNum` 等字段），返回
`{ pageSize, currentPageNum, totalNum, result }`。

- 分类列表从 `sbsm/supermap/getMapCategorys.do` 的 `message.superclass` 取（**19 个分类**），
  取不到时用脚本内的兜底清单
- 分页按 `totalNum` / `pageSize` 算页数，**翻到最后一页**——写死页数上限会静默少收一大批
- 先按 `id` 去重，再按「审图号 + 名称」合并一次（上游偶有跨分类重复）
- 产出写入 `public/data/standard-maps.json`（当前 2047 张，最新审核年份 2025），
  **按审核年份倒序**排列

脚本**只取元数据，不下载地图图片**——站点条款「网站保留所有权，未经许可不得复制、镜像」，
图片属于官方，再分发不在授权范围内。官方自述「社会公众可以免费浏览、下载标准地图，
直接使用标准地图时需要标注审图号」，本站比许可允许的更保守：只收录公开目录里的事实性元数据。

**上游数据的两个坑**（写断言前要知道）：

- 审图号格式五花八门：国家审图号统一是 `GS(年份)序号号`，地方审图号由各省级主管部门自编
  （`赣s(2023)014`、`皖S（2023）002`、`豫S〔2019年〕050`、`浙甬S`、`济南S`…），
  括号有全角、半角、`〔〕` 三种，个别还带「年」字
- 少数地方图的审图号年份与平台的 `mapYear` 不一致（审图号记的是地方审核年份，
  `mapYear` 记的是平台登记年份），共 9 条，全在「地方共享地图」分类里。
  **国家审图号（GS 开头）零不一致**，断言要分层写

npm 包要从 npmmirror 取 tarball 再解包（`node:zlib` 解 gzip，tar 头部手写解析）——
npmmirror 的单文件接口对这几个包是 403，tarball 是唯一通道。`un-m49` 的入口是 JS 字面量，
脚本用正则逐字段解析，**不执行远端代码**。

写盘的是合并后的结果，因此数据没变时不产生 diff。

脚本会拦住这些情况并以非零码退出：

- 上游返回的不是合法 JSON，或 HTTP 非 200
- 要素数不对、几何类型非法、坐标不是数字对
- **adcode 集合发生变化**（新增或撤销行政区划）——这类变更会牵动配色、图例与详情页数据，必须人工确认
- 标准地图清单里出现没有审图号的条目——审图号是公开标准地图的硬要求，宁可同步失败也不要留空号

`.github/workflows/update-geo.yml` 每周一自动跑一次，也支持手动触发；有变化才提交，提交信息里带变更摘要。

`AREA_BASE` 环境变量可以覆盖中国数据源地址，测试与离线演练时用。抓取带退避重试——本机解析域名走 Clash 的本地 DNS 代理，上游一抖就会间歇性 `ENOTFOUND`，单次成功说明不了问题。

## 代码约定

- 组件用 `<script setup>`，注释与文档用中文，标识符用英文。
- 样式用 `<style scoped>`，颜色与字号一律取 `src/styles/tokens.css` 里的变量，不要写死具体色值。
- Three.js 的状态放在 `<script setup>` 的模块作用域变量里，**不要挂到 `window` 上**——组件卸载时无法回收。
- 组件卸载必须：取消 `requestAnimationFrame`、解绑事件监听、释放几何体/材质/贴图、清除引用。
- 改 `public/data/provinces/*.json` 要用 `update-geo.mjs` 里的 `formatJson` 写回，保持「短的数组压在一行」的格式约定——`geoScripts.spec.js` 会对格式做幂等校验。

## 已知限制

- 地球贴图 4096×2048，放大到省级尺度仍会模糊；中国视角与全球视角共用这一张贴图。瓶颈不在分辨率（实测换 8192 只提升 0.2% 锐度），而在 NASA「地形与水深」这款产品本身偏柔和。
- 省级详情页的人口是 2023 年末的公开统计口径，各省统计年份不完全一致；分省人口的权威自动源在受限网络下不可达。
- 全球视角不含人口：国内没有可自动同步的权威人口源，改用边界实算面积。
- 上游几何覆盖不全：世界数据没有科索沃（两个上游都没有它的边界）。
- 台湾省作为一个省级行政区呈现（中国视角），在全球视角里不作为独立国家条目出现。
- 审图号不适用于 3D 地球：`/standard-map` 列的是官方标准地图的审图号，3D 球面是另一种表现形式，不能沿用。
- `npm audit` 需切到官方 npm registry 执行（国内镜像不实现 `/-/npm/v1/security/*` 接口），依赖漏洞需换官方源再审。
