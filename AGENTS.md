# AGENTS.md

给后续在本仓库执行任务的 AI agent / 协作者看的项目约定。

## 项目是什么

基于 Three.js 的 3D 地球可视化 + 高中地理学习工具：把中国 35 个省级行政区渲染到球面上，支持轨道控制、悬停高亮、点击聚焦并进入省份详情页；另有独立的全球视角（239 个国家/地区）与「课程地图」——按章节组织的知识点提纲，可查、可标记掌握情况、并回链原视频。Vue 3 + Vite + 原生 Three.js，**没有后端**。

## 目录职责

| 路径 | 职责 |
| --- | --- |
| `src/App.vue` | 应用外壳与全局盒模型；教学层页面（`meta.learnPage`）在此挂全局合规声明页脚 |
| `src/main.js` | 入口：装配 router，装全局错误兜底（`errorHandler` + `unhandledrejection`），并引入 `styles/tokens.css` |
| `src/router/index.js` | 路由表：`/` → 地球，`/province/:adcode` → 省份详情页，`/world` → 全球视角，`/country/:iso3` → 国家详情页，`/course` → 课程地图，`/course/:chapterId` → 章节页，`/lesson/:lessonId` → 知识点详情，`/search` → 知识点搜索，`/tools` → 互动工具总入口，`/tools/*` → 六个互动工具（等高线判读、太阳高度角与晨昏线、气压带风带、洋流、省会简称全表、轮廓形象记忆），`/licenses` → 数据来源与许可，`/standard-map` → 标准地图与审图号清单，兜底重定向 |
| `src/styles/tokens.css` | 设计令牌：颜色、字号、间距、动效时长。组件内不写死具体数值 |
| `src/styles/learning.css` | 教学层共享样式（亮色板） |
| `src/components/EarthScene.vue` | 地球场景：Three.js 初始化、渲染循环、拾取、HUD 覆盖层 |
| `src/components/HudPanel.vue` | 通用玻璃面板（四角角标 + 标题栏） |
| `src/components/ProvinceLegend.vue` | 右上角分区图例，与球面悬停双向联动 |
| `src/components/ProvincePage.vue` | 省份详情页（读 `public/data/provinces/<adcode>.json`） |
| `src/components/WorldScene.vue` | 全球视角：世界国界、中文国名标注、国家拾取与相机飞行 |
| `src/components/CountryPage.vue` | 国家详情页（面积由几何算出；不含人口） |
| `src/components/CourseMapPage.vue` | 课程地图（路由 `/course`）：15 章框架、覆盖度与掌握进度 |
| `src/components/ChapterPage.vue` | 章节页（路由 `/course/:chapterId`）：小节列表与前置/后继导航 |
| `src/components/LessonPage.vue` | 知识点详情（路由 `/lesson/:lessonId`）：要点清单、视频链接、关联实体、掌握度 |
| `src/components/SearchPage.vue` | 知识点搜索（路由 `/search`） |
| `src/components/LicensesPage.vue` | 数据来源与许可页（路由 `/licenses`），内容与 `LICENSES.md` 对应 |
| `src/components/StandardMapPage.vue` | 标准地图与审图号清单页（路由 `/standard-map`），读 `public/data/standard-maps.json` |
| `src/components/ToolsIndexPage.vue` | 互动工具总入口（路由 `/tools`）：机制类互动与省情速记两组 |
| `src/components/ProvinceAbbrevPage.vue` | 省会简称全表页（路由 `/tools/province-abbrev`），壳 + `ProvinceAbbrevTable` |
| `src/components/ProvinceShapePage.vue` | 轮廓形象记忆页（路由 `/tools/province-shape`），壳 + `ProvinceShapeMemory` |
| `src/components/ProvinceAbbrevTable.vue` | 34 省简称与省会全表（按地理分区分组，可搜索过滤） |
| `src/components/ProvinceShapeMemory.vue` | 34 省轮廓形象记忆：真实省界 SVG + 自撰形象比喻 |
| `src/components/ContourLab.vue` | 等高线判读互动实验（路由 `/tools/contour`） |
| `src/components/TerminatorLab.vue` | 太阳高度角与晨昏线互动实验（路由 `/tools/terminator`） |
| `src/components/PressureBeltLab.vue` | 气压带风带互动实验（路由 `/tools/pressure-belt`） |
| `src/components/OceanCurrentLab.vue` | 洋流互动实验（路由 `/tools/ocean-current`） |
| `src/components/RelatedOutline.vue` | 实验页的「相关提纲」区块：回链这个实验直接教的小节，取不到数据就整块不渲染 |
| `src/data/` | 互动工具的静态数据与判据（纯 JS 导出，不发网络请求） |
| `src/data/toolLinks.js` | 知识点 ↔ 互动实验的双向映射（唯一真相源）：知识点页的入口与实验页的回链都从它派生 |
| `src/utils/geoDataProcessor.js` | GeoJSON → 球面 Mesh 的三角化、贴面与描边 |
| `src/utils/globeMath.js` | 球面交互的纯函数：拾取归一化、飞行插值、球面质心（两个场景共用一份） |
| `src/utils/provinceColors.js` | adcode → 颜色的稳定映射与地理分区 |
| `src/utils/provinceLabels.js` | 球面省名标注：位置、朝向、尺寸与屏幕空间去重叠 |
| `src/utils/areaData.js` | 球面面积计算（`areaData.js` 只剩鞋带公式那一套公共逻辑） |
| `src/utils/worldData.js` | 世界国界数据获取、分区配色（球面质心从 `globeMath.js` 转出） |
| `src/utils/knowledge.js` | 知识数据访问：索引/章节加载、搜索、按省反查 |
| `src/utils/mastery.js` | 掌握度（localStorage，读写与统计） |
| `src/utils/richText.js` | 把要点里的 `**强调**` 渲染成 HTML（先转义再替换，不引依赖） |
| `src/utils/base.js` | 站点根路径：`BASE` 与 `assetUrl(path)`。资源路径一律走它，不要写死根路径 |
| `src/utils/provinceNames.js` | 省份名称：读 `public/data/provinces/index.json`，批量取名只发一个请求 |
| `src/utils/latestRequest.js` | 请求竞态防护：每次请求领序号，只接受最新序号的响应 |
| `src/utils/spaRedirect.js` | 深链回退：在 `createWebHistory()` 之前把 404.html 记下的路径写回地址栏 |
| `src/__tests__/` | Vitest 用例 |
| `scripts/update-geo.mjs` | 中国地理数据同步：省界与各省面积 |
| `scripts/update-world.mjs` | 世界国界同步：拉取、校验、写入 |
| `scripts/update-standard-maps.mjs` | 标准地图与审图号清单抓取（上游 19 个分类；表单 POST 检索接口） |
| `scripts/check-licenses.mjs` | 数据源体检：上游是否还可达、许可是否还与 `LICENSES.md` 登记的一致 |
| `scripts/build-knowledge.mjs` | 课程讲义 → 知识数据产物（源讲义在仓库外） |
| `scripts/build-province-index.mjs` | 省份数据 → 省份名称索引（`public/data/provinces/index.json`），带 `--check` |
| `scripts/spa-fallback.html` | 深链回退页模板；构建时由 vite 插件替换 `__BASE__` 产出 `dist/404.html` |
| `scripts/knowledge/parse-lessons.mjs` | 讲义 Markdown → 结构化知识点（纯函数） |
| `scripts/knowledge/` | 人工维护的知识表，**按章分片**：`chXX.json`（视频分P映射、自撰摘要、地理实体关联），由 `tables.mjs` 合并。分片而不是一张大表，是为了让人能并行补不同章节而不互相覆盖 |
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
npm run standard:list    # 从标准地图服务系统抓取清单（只报数，用 --out 指定落盘位置）
npm run licenses:check # 体检数据源：上游可达性与许可是否仍与登记一致
npm run knowledge:build   # 从课程讲义重新生成知识数据（源讲义在仓库外）
npm run knowledge:check   # 校验知识数据与源讲义一致
npm run province:index    # 从省份数据重新生成省份名称索引
npm run province:check    # 校验省份名称索引与省份数据一致
```

CI 定义在 `.github/workflows/ci.yml`：push 与 PR 都跑 `lint:check` + `test:unit` + `build`，另有一步 `knowledge:check`（源讲义不在仓库里，没有源时它只打印警告并 exit 0）。
站点部署在 `.github/workflows/pages.yml`：同样先跑 lint 与测试，再用 `SITE_BASE=/3D-earth/` 构建并部署到 GitHub Pages。

⚠️ **测试在机器负载高时会假红**：vitest 默认单用例超时 5 秒，多个 agent 并行跑测试时
导航类用例会撞上超时。判断失败前先在安静机器上单独重跑那个文件。

`npm run test:unit` 必须是绿的才算完成改动。当前有 589 个用例：
`src/__tests__/App.spec.js`（应用挂载）、
`src/__tests__/geoDataProcessor.spec.js`（35 个要素的渲染范围覆盖、与参考实现逐顶点一致、海南/台湾/九段线定点断言）、
`src/__tests__/provinceData.spec.js`（省份详情数据与 GeoJSON 的一致性契约：adcode/name/center 严格相等、字段结构完整、分区覆盖无重叠、配色不落兜底、面积与几何重算一致、两个面积口径不差数量级、人口合计与全国人口相差 3% 以内）、
`src/__tests__/provinceLabels.spec.js`（标注的朝向淡出、尺寸缩放、中心点解析、球面位置、地球坐标系换算、尺寸代理、像素高度、矩形相交）、
`src/__tests__/areaData.spec.js`（球面面积公式、洞的处理、面积格式化）、
`src/__tests__/geoScripts.spec.js`（同步脚本的回归：`formatJson` 幂等、**数据源许可登记**）、
`src/__tests__/worldData.spec.js`（世界国界：239 国、中文名与 ISO 代码、次区域与配色、球面质心不跨 180°）、
`src/__tests__/globeMath.spec.js`（拾取归一化、缓动、绕 Y 轴旋转、球面质心）、
`src/__tests__/standardMaps.spec.js`（标准地图清单：条目非空且都带审核年份、**条目数下限 2000 防抽样退化**、**最新年份 ≥ 2024 防同步退化**、国家审图号（GS）年份与审核年份一致、同名同号唯一、分类齐全、**只收录省级行政区以上的地图**、**不含任何指向官方地图图片的直链**）、
`src/__tests__/knowledge.spec.js`（知识数据契约：98 节字段完整、逐行 220 闸门、依赖引用有效、映射表完整、分片体积上限）、
`src/__tests__/knowledgeParser.spec.js`（讲义解析器：栏位切分、块边界、缩进层级）、
`src/__tests__/toolSources.spec.js`（互动工具的来源标注：节号、教材出处、视频分P 与课程范围）、
`src/__tests__/toolLinks.spec.js`（知识点 ↔ 互动实验的双向互链：映射表完整性、强弱划分与人工策展的 sections 一致、两个方向互为逆映射、路由真实存在、实验页的「相关提纲」渲染与容错）、
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
13. **「审图号有效期两年」说的是互联网地图服务审图号，不是标准地图产品。** 《地图审核管理规定》第二十八条原文是「互联网地图服务审图号有效期为两年。审图号到期，应当重新送审」，第三十二条的罚则同样只针对这一类。标准地图是自然资源部提供的**公益性地图**——该规定第六条第一项明确「直接使用自然资源主管部门提供的具有审图号的公益性地图」不需要再送审；官方系统的口径是「社会公众可以免费浏览、下载标准地图，直接使用标准地图时需要标注审图号」，并至今仍在公开目录里提供 2016 年以来审核的地图与其审图号。本站只收录元数据、不分发图片，不涉及「使用地图」的授权；但要自己下载使用某张标准地图，请以官方系统当时给出的信息为准。**引用法条要核对主语限定，别把针对某一类的条款套到另一类上。**
14. **所有贴图都要显式声明 `colorSpace = SRGBColorSpace`。** JPEG 与 Canvas 存的都是 sRGB 编码的数据，three.js 默认按线性数据处理——漏掉这一句，画面会整体发灰、对比度被压掉。**这一条曾经被误判成「贴图分辨率不够」**：实测把 4096×2048 换成 8192×4096（NASA 有 21600×10800 的更高精原图，同区域高频能量是 5400 版的 2.67 倍），最终画面锐度只提升 0.2%；而改对色彩空间后，画面从一片灰雾变成能看清山脊的卫星影像。**贴图文件本身不做任何色彩补偿**，颜色由渲染端负责。`textureColorSpace.spec.js` 扫源码守这一条：任何新加的贴图加载点忘了声明就会红。
15. **首屏不要干等大图。** 地球贴图有 512×256（19 KB）的小图与 4096×2048（741 KB）的高清图两份：
   **先用小图把球画出来，高清图在后台换**。只等大图的话首屏是一颗深色球体，看着像页面坏了。
   小图在 `index.html` 里用 `<link rel="preload" as="image">` 预加载，浏览器在解析 JS 之前就开始下载。
   `textureColorSpace.spec.js` 守着两张图都在、且小图体积压到高清图的 1/5 以下。
16. **同步脚本要能覆盖上游的全部分类与全部分页。** 写死页数上限或只取部分分类，会**静默**少收一大批数据——标准地图清单曾因此从 2045 张掉到 133 张且不报错。`standardMaps.spec.js` 里有条目数下限与「最新年份 ≥ 2024」两条断言专门守这个。
16. **标准地图清单只收录省级行政区以上的地图。** 非省级行政区的条目不收；上游新增同类条目时会被自动挡掉。
17. **知识数据只收提纲，不收正文。** `scripts/build-knowledge.mjs` 的 `MAX_FIELD_CHARS = 220` 是硬闸门：任何**一行**超过 220 字符都会被判定为正文泄漏并中止构建。判据是单行而不是整条拼接值——讲义的续行 bullet 用换行分隔，多条拼起来可以很长（§15.1 的高考定位 4 条共 366 字），但每一条都短；真正的正文是一整行长句。课程讲义源文件在仓库外（`_source/`），仓库里只有提纲级产物。
18. **讲义里少数几节把整段推理写成了一行**（§7.12、§7.15、§7.18、§11.3、§11.13），逐行闸门会判它泄漏。解析器 `splitLongLine()` 按句号分号把它们切开，**一个字都不丢**——切完的每一条都能在讲义原文里逐字找到。改这个函数时要守住「切分无损」这条。
19. **骨架可以是要点列表，也可以是一张表。** §7.9 的「知识骨架」在讲义里就是南北半球风带对照表，解析器把表格行交给 `extractTables`，要点列表自然是空的——这时表格就是骨架。构建闸门判的是「要点与表格不能同时为空」，不是「要点必须非空」。
20. **实体标记是「检索别名」，不是「本节提到了这些地方」。** 判据是：搜这个词的人应不应该看到这一节。
    - `provinces` 存 6 位 adcode；该节的现象在中国境内全域存在（等高线、线速度、地转偏向力、水循环、洋流）就挂全部 34 个，只涉及特定省区就只挂那几个，纯数学/纯全球格局就空。
    - `countries` 必须逐字取自 `public/geojson/world-countries.json` 的 `properties.name`（239 个中文名）。「我国」就是中国，可挂；正文没点名、又只是地理推断的，不挂。
    - `regions` 允许规范化正文说法（我国东部→东亚、澳大利亚大陆→大洋洲、纽芬兰→加拿大），但不能凭空造词。
    - **空数组是正确答案**，不要为了填满而硬凑。
21. **知识点与实验的互链只有一张表。** `src/data/toolLinks.js` 是唯一真相源，`TOOL_CHAPTERS` 与 `TOOL_DRILL_IDS` 都从它派生——不要在组件里另抄一份，也不要维护第二张反向表。`drill`（实验直接教这一节）与 `chapter`（只是同章）两级强度决定入口文案，改动时两个方向要一起看。

## 地理数据同步

`scripts/update-geo.mjs` 从 DataV.GeoAtlas 拉取：

| 上游 | 写入 |
|---|---|
| `100000_full.json` | `public/geojson/china-provinces.json` |
| `100000.json` | `public/geojson/china.json` |
| —— | `public/data/provinces/<adcode>.json` 里的 `areaKm2`（由边界几何算出） |

`scripts/update-world.mjs` 从 npm 镜像源（npmmirror）拉两个包并合并：

| 包 | 许可 | 提供 | 写入 |
|---|---|---|---|
| `@surbowl/world-geo-json-zh` | Unlicense（公有领域） | 几何 + 简体中文名 + ISO 3166-1 代码 | `public/geojson/world-countries.json` |
| `un-m49` | MIT | 联合国 M49 地区划分（大洲 / 次区域） | 同上 |

两边靠 ISO alpha-3 关联。英文名由运行时自带的 `Intl.DisplayNames` 生成，不引外部属性源。
**没有人口**：没有可自动同步的权威人口源，详情页改展示边界实算面积。

`scripts/update-standard-maps.mjs` 从自然资源部主管的**标准地图服务系统**
（`http://bzdt.ch.mnr.gov.cn/`）同步标准地图清单：检索接口 `sbsm/supermap/searchPicture.do`
是**表单 POST**（`seachText` / `superclass` / `pageNum` 等字段），返回
`{ pageSize, currentPageNum, totalNum, result }`。

- 分类列表从 `sbsm/supermap/getMapCategorys.do` 的 `message.superclass` 取（**19 个分类**），
  取不到时用脚本内的兜底清单
- 分页按 `totalNum` / `pageSize` 算页数，**翻到最后一页**——写死页数上限会静默少收一大批
- 先按 `id` 去重，再按「审图号 + 名称」合并一次（上游偶有跨分类重复）
- 脚本**只抓取、不落盘**：`node scripts/update-standard-maps.mjs --out <file>` 才写文件，
  不给 `--out` 就只报数。仓库里的 `public/data/standard-maps.json` 是整理后的快照
  （当前 2002 张，最新审核年份 2025），**按审核年份倒序**排列
- **只收录省级行政区以上的地图**：非省级行政区的条目不收

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
- 全球视角不含人口：没有可自动同步的权威人口源，改用边界实算面积。
- 上游几何覆盖不全：世界数据没有科索沃（两个上游都没有它的边界）。
- 台湾省作为一个省级行政区呈现（中国视角），在全球视角里不作为独立国家条目出现。
- 审图号不适用于 3D 地球：`/standard-map` 列的是官方标准地图的审图号，3D 球面是另一种表现形式，不能沿用。
- 课程内容目前只覆盖第 2 章（地图与定位工具）与第 15 章（区域地理），其余 13 章在课程地图里标为「规划中」；「点省→知识点」目前每个省只关联到 2–3 节
- `npm audit` 需切到官方 npm registry 执行（npmmirror 不实现 `/-/npm/v1/security/*` 接口），依赖漏洞需换官方源再审。
