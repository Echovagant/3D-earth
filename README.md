<div align="center">

<img src="docs/screenshot-globe.jpg" alt="3D-earth 界面预览" width="880" />

# 3D-earth

**基于 Three.js 的 3D 地球可视化**

中国 35 个省级行政区实时渲染 · 可下钻到地级市 · 全球 239 个国家/地区视角

[![CI](https://github.com/Echovagant/3D-earth/actions/workflows/ci.yml/badge.svg)](https://github.com/Echovagant/3D-earth/actions/workflows/ci.yml)
[![stars](https://img.shields.io/github/stars/Echovagant/3D-earth?style=flat-square&label=stars&color=4fd8ff)](https://github.com/Echovagant/3D-earth/stargazers)
[![forks](https://img.shields.io/github/forks/Echovagant/3D-earth?style=flat-square&label=forks&color=4fd8ff)](https://github.com/Echovagant/3D-earth/network/members)
[![license](https://img.shields.io/github/license/Echovagant/3D-earth?style=flat-square&label=license&color=4fd8ff)](./LICENSE)

</div>

---

## 这是什么

把真实行政区划边界三角化后贴合到球面，渲染成一个可以拖拽旋转、悬停拾取、点击聚焦的 3D 地球。界面是深空科技 HUD 风格：左上角实时遥测读数，右上角按地理分区排列的图例，鼠标悬停时出现准星锁定与引线标注。

中国视角下到省级，进到省份详情页还能继续下钻到该省的地级市；全球视角下到国家。

<p align="center">
  <img src="docs/screenshot-detail.jpg" alt="省份详情页" width="620" />
</p>

<p align="center">
  <img src="docs/screenshot-drill.jpeg" alt="地级市下钻视图" width="880" />
</p>

## 核心能力

| | |
|---|---|
| 🌐 球面渲染 | 35 个省级要素按 GeoJSON 边界贴合球面，白色描边 + 固定 adcode 配色 |
| 🎯 HUD 拾取 | 准星锁定 + 引线标注 + 遥测面板（中心经纬 / 视距 / 自转状态） |
| 🗺️ 完整多岛几何 | 三沙群岛、台湾离岛、舟山群岛、南海断续线全部正确渲染 |
| 🧭 聚焦联动 | 点击省份 → 相机飞向该省并暂停自转 → 进入详情页 |
| 🏙 地级市下钻 | 省份详情页一键下钻，该省地级市按真实边界铺上球面，再点城市进详情页 |
| 🌍 全球视角 | 239 个国家/地区按真实边界贴上球面，共用同一张卫星贴图、中文国名标注、点国家进详情页 |
| 📇 详情页 | 行政区划代码、中心坐标、实算面积、省情简介与标签 |
| 🎨 分区图例 | 按华北 / 东北 / 华东 / 华中 / 华南 / 西南 / 西北 / 港澳台分组，与球面悬停双向联动 |
| 🏷 球面省名标注 | 省名钉在球面上，屏幕空间自动去重叠；放大后小省逐个浮现，可一键开关 |
| 🔍 图例过滤 | 按省名或行政区划代码即时过滤 |
| ♿ 动效降级 | 遵循系统的「减少动态效果」设置 |
| 🧪 有测试 | 431 个用例，CI 在每次 push 与 PR 上自动验证 |

## 技术亮点

**多岛几何的正确三角化.** 多岛屿省份在 GeoJSON 里是 `MultiPolygon`，而 earcut 的索引在每个 polygon 内部从 0 开始——顶点表跨 polygon 累加会让第 2 个及以后的 polygon 错位引用第 1 个的顶点，结果是海南 133 个岛礁只渲染出 1 个。顶点表按 polygon 重建后，35 个要素的几何全部归位。

**几何正确性用像素比对验证，不靠肉眼.** 原始 GeoJSON 的期望覆盖与实际渲染三角形分别栅格化成像素图后逐像素比对，能得到可量化的缺失率与错位率。测试里另有一份独立写的参考实现做逐顶点比对，专治「顶点数对得上但坐标错位」这类包围盒测不出的 bug。

**面积是算出来的，不是抄来的.** 地级市的行政面积直接用球面鞋带公式从行政区划边界算，洞（内环）从外环里扣掉。沿海城市的行政边界包含管辖海域，因此比常引用的陆地面积偏大——深圳约 +7%、珠海约 +12%。

**地级市边界随仓库分发，下钻不依赖在线接口.** 34 个省的地级市边界全量约 3.9 MB、497 个要素，下钻时只下载用户点进去的那一个省。既不拖慢首屏，也不受第三方接口可用性影响。

**两个视角共用同一张卫星贴图与同一套材质.** 全球视角把国家面压到 45% 不透明度让底图透出来，并按联合国次区域上色，与中国视角的「按地理分区」是同一套设计语言。

**Three.js 的资源生命周期.** 组件卸载时遍历场景释放几何体、材质与贴图并解绑事件监听；只调用 `renderer.dispose()` 只能回收 WebGL 上下文，几何体与材质仍会留在 GPU 上。

**拾取只针对需要的对象.** 射线只对省份组求交，避免每次 `mousemove` 都遍历整个场景。指针位置走非响应式通道 + 命令式 DOM 写入，不触发组件重渲染。

## 数据来源

| 文件 | 内容 | 来源 |
|---|---|---|
| `public/geojson/china-provinces.json` | 34 个省级行政区 + 1 个南海断续线要素（`adcode = 100000_JD`） | [DataV.GeoAtlas 行政区划边界](https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json) |
| `public/geojson/china.json` | 中华人民共和国整体边界 | [DataV.GeoAtlas 行政区划边界](https://geo.datav.aliyun.com/areas_v3/bound/100000.json) |
| `public/geojson/cities/<adcode>.json`（34 个省） | 各地级市边界 | [DataV.GeoAtlas 行政区划边界](https://geo.datav.aliyun.com/areas_v3/bound/) |
| `public/geojson/cities/710000.json` | 台湾省 20 个县市边界 | 几何：[geojson.cn 台湾省市县边界](https://geojson.cn/api/china/710000.json)；属性：[内政部「縣市行政區劃」](https://www.moi.gov.tw/)（`COUNTY_MOI_1081121`） |
| `public/geojson/world-countries.json` | 239 个国家/地区边界，含中文名、ISO 代码与地区划分 | [`@surbowl/world-geo-json-zh`](https://registry.npmmirror.com/@surbowl/world-geo-json-zh) + [`world-countries`](https://registry.npmmirror.com/world-countries)，经 npmmirror 国内镜像分发 |
| `public/textures/earth_atmos_2048.jpg` | 地球贴图（两个视角共用） | 随仓库提供 |
| `public/data/provinces/<adcode>.json` | 省份详情页数据 | 随仓库提供 |

仓库内是随代码分发的副本，与上游同步。`public/geojson/` 下的文件是**只读数据源，不要手工修改**——它们由 `scripts/update-geo.mjs`、`scripts/update-world.mjs` 与 `scripts/update-tw.mjs` 从上游同步，手工改动会在下次同步时被覆盖。

`adcode` 的类型在不同文件里不一样：GeoJSON 里是数字（保持上游原样），`public/data/provinces/` 里是字符串（与文件名一致）；代码统一用 `String()` 比较，两种类型都能对上。

### 台湾省的数据是怎么来的

DataV.GeoAtlas 只有台湾省的整体边界（`710000.json`），没有它下面的县市，所以这一份单独合成：

- **几何**取自 [geojson.cn](https://geojson.cn/) 的台湾省市县边界，数据托管在阿里云 OSS。
- **属性**取自[内政部「縣市行政區劃」](https://www.moi.gov.tw/)官方资料（`COUNTY_MOI_1081121`），提供法定中文名与内政部县市代码。

两个源没有共同的标识字段，只能靠 `scripts/update-tw.mjs` 里的对照表关联，该表逐条人工核对过。

**代码约定**：内政部没有 6 位的县市代码（县市是 3 位，村里码体系里的县市段是 5 位），而本项目 adcode 统一 6 位、前 2 位是省级代码。所以台湾县市按内政部 `COUNTYCODE` 升序生成 `710001`–`710022`，前 2 位 `71` 与台湾省 `710000` 一致——`provinceAdcodeOf()` 的「前 2 位 + 0000」规则因此自动成立，下钻链路与其他省完全相同。内政部的原始代码保留在 `moiCode` 字段里，可逐条核对。

县市名保留**内政部法定中文（繁体）**，未做简繁转换。geojson.cn 目前只提供 20 个县市，缺金门县与连江县两个离岛县——它们仍占着 `710001` 与 `710002` 的位置，上游补齐后无需改代码即可自动出现。

## 地理数据同步

行政区划边界与世界国界由一条 GitHub Actions 定时任务每周同步一次：

```sh
npm run geo:check      # 校验本地数据与上游是否一致（只读）
npm run geo:update     # 同步中国省界与地级市边界
npm run world:update   # 同步世界国界
npm run tw:update      # 同步台湾省县市边界
```

同步脚本在写盘之前会校验上游数据：要素数、几何类型、坐标格式都要合法。**行政区划的新增或撤销会被直接拒绝**——那会牵动配色、图例与详情页数据，需要人工确认后再改。流水线只在边界真的变了时才产生提交。

## 快速开始

需要 Node.js ≥ 20.19 或 ≥ 22.12。

```sh
npm install
npm run dev            # 开发服务器
npm run test:unit      # 跑一次测试
npm run lint:check     # ESLint 检查（不改动文件）
npm run build          # 生产构建
npm run check          # 上面三项串起来，与 CI 跑的是同一套
npm run geo:check      # 校验本地地理数据与上游是否一致
```

## 目录结构

```
src/
  App.vue                    应用外壳
  main.js                    入口：装配 router，装全局错误兜底
  styles/tokens.css          设计令牌（颜色 / 字号 / 间距 / 动效）
  router/index.js            路由表
  components/
    EarthScene.vue           地球场景：Three.js 初始化、渲染循环、拾取与交互
    HudPanel.vue             通用玻璃面板（四角角标）
    ProvinceLegend.vue       分区图例
    ProvincePage.vue         省份详情页
    DrillView.vue            地级市视角（把 EarthScene 切到省级以下范围）
    CityPage.vue             地级市详情页
    WorldScene.vue           全球视角：世界国界、中文国名标注、国家拾取
    CountryPage.vue          国家详情页
  utils/
    geoDataProcessor.js      GeoJSON → 球面 Mesh 的三角化、贴面与描边
    globeMath.js             球面交互纯函数：拾取归一化、飞行插值、球面质心
    provinceColors.js        adcode → 颜色的稳定映射与地理分区
    provinceLabels.js        球面标注的贴面定位、屏幕空间去重叠
    areaData.js              行政区划数据获取、球面面积计算
    worldData.js             世界国界数据获取、分区配色
  __tests__/                 Vitest 用例
scripts/
  update-geo.mjs             中国地理数据同步：省界、地级市边界、面积
  update-world.mjs           世界国界同步：拉取、校验、写入
  update-tw.mjs              台湾省县市边界同步
public/
  geojson/                   地理数据源（只读，由脚本更新）
  data/provinces/            省份详情页静态数据
  textures/                  地球贴图
docs/                        README 引用的界面截图
```

## 当前限制

- 地球贴图为 2048×1024 近地表图，放大到省级尺度会有明显模糊
- 省级详情页的人口是公开统计口径，各省统计年份不完全一致；分省人口的权威自动源在受限网络下不可达
- 台湾县市的 6 位代码是本项目生成的，内政部原始 `COUNTYCODE` 保留在 `moiCode` 里；县市名保留法定繁体
- 全球视角不含人口统计：国内没有可自动同步的权威人口源，与其放一个几年不更新的估计值，不如改用边界实算面积
- 主包约 491 kB（几乎全部是 three.js）：three 已拆成独立块，业务代码迭代时用户不必重新下载它
- 球面交互目前只支持鼠标

## 贡献

欢迎提 issue 与 PR。开始之前请读 [AGENTS.md](./AGENTS.md)，里面是完整的目录职责、命令、硬约束与代码约定。

几条最容易踩的：

- **不要手工修改 `public/geojson/` 下的文件**，它们是只读数据源，由脚本从上游同步
- **数据源只用国内可取的**：中国行政区划走 DataV，世界国界走 npmmirror，台湾县市走 geojson.cn。不要引回 GitHub raw 之类的境外地址
- 改动涉及几何处理时，务必跑 `npm run test:unit`——`src/__tests__/geoDataProcessor.spec.js` 会校验 35 个要素的渲染范围与参考实现逐顶点一致
- 提交信息用 `git commit -F <文件>`，不要用 `git commit -m "..."`：PowerShell 下双引号会吞掉反引号并可能破坏中文
- 三角化时顶点表必须按 polygon 重建，这是本项目最容易被重新引入的 bug
- 球面标注的 sprite 位置是**地球局部坐标**，与相机（世界坐标）比较前必须用 `earthLocalToWorld()` 转换，漏了会让标注全部消失

## License

[Apache License 2.0](./LICENSE)
