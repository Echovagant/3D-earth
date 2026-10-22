<div align="center">

<img src="docs/screenshot-globe.jpeg" alt="3D-earth 地球主视图" width="880" />

# 3D-earth

**基于 Three.js 的 3D 地球可视化**

中国 35 个省级行政区 · 全球 239 个国家/地区 · 标准地图审图号清单

[![CI](https://github.com/Echovagant/3D-earth/actions/workflows/ci.yml/badge.svg)](https://github.com/Echovagant/3D-earth/actions/workflows/ci.yml)
[![stars](https://img.shields.io/github/stars/Echovagant/3D-earth?style=flat-square&label=stars&color=4fd8ff)](https://github.com/Echovagant/3D-earth/stargazers)
[![forks](https://img.shields.io/github/forks/Echovagant/3D-earth?style=flat-square&label=forks&color=4fd8ff)](https://github.com/Echovagant/3D-earth/network/members)
[![license](https://img.shields.io/github/license/Echovagant/3D-earth?style=flat-square&label=license&color=4fd8ff)](./LICENSE)

</div>

---

## 能做什么

| 能力 | 说明 |
|---|---|
| 🌐 球面渲染 | 35 个省级要素按真实边界贴合球面，白色描边 + 固定配色 |
| 🗺️ 多岛几何 | 三沙群岛、台湾离岛、舟山群岛、南海断续线全部正确渲染 |
| 🎯 HUD 拾取 | 准星锁定 + 引线标注 + 实时遥测（中心经纬 / 视距 / 自转） |
| 🧭 聚焦联动 | 点击省份 → 相机飞向该省并暂停自转 → 进入详情页 |
| 🌍 全球视角 | 239 个国家/地区按真实边界贴上球面，中文国名标注，点国家进详情页 |
| 🎨 分区图例 | 按地理分区分组配色，与球面悬停双向联动，可按名称或代码过滤 |
| 🏷 球面省名 | 省名钉在球面上，屏幕空间自动去重叠，放大后小省逐个浮现 |
| 📇 详情页 | 行政区划代码、中心坐标、球面实算面积、省情简介与标签 |
| 🗒 审图号清单 | 2000+ 张官方标准地图的审图号同步到站，可查、可溯源 |
| 🧪 有测试 | 295 个用例，CI 在每次 push 与 PR 上自动验证 |

## 界面

<p align="center">
  <img src="docs/screenshot-world.jpeg" alt="全球视角" width="880" />
</p>

<p align="center">
  <img src="docs/screenshot-detail.jpeg" alt="省份详情页" width="700" />
</p>

## 技术亮点

**多岛几何的正确三角化.** 多岛屿省份在 GeoJSON 里是 `MultiPolygon`，而 earcut 的索引在每个 polygon 内部从 0 开始——顶点表跨 polygon 累加会让第 2 个及以后的 polygon 错位引用第 1 个的顶点，结果是海南 133 个岛礁只渲染出 1 个。顶点表按 polygon 重建后，35 个要素的几何全部归位。

**面积是算出来的，不是抄来的.** 行政区的「边界围合面积」直接用球面鞋带公式从边界算，洞（内环）从外环里扣掉。沿海省份的行政边界包含管辖海域，因此比常引用的陆地面积偏大——深圳约 +7%、珠海约 +12%。

**贴图的颜色空间必须是 sRGB.** JPEG 里存的是 sRGB 编码的数据，而 three.js 默认把贴图当线性数据处理——漏掉 `texture.colorSpace = THREE.SRGBColorSpace`，画面会整体发灰、对比度被压掉，卫星影像看起来像蒙了一层雾。这个问题曾让「贴图模糊」被误判成分辨率不足：实测把 4096×2048 换成 8192×4096（NASA 有 21600×10800 的更高精原图，高频能量是 5400 版的 2.67 倍），最终画面的锐度只提升了 **0.2%**。贴图因此直接用 NASA 原图，不做任何色彩补偿。

## 数据来源与许可

代码与第三方数据适用不同许可，**逐项来源、许可与义务见 [LICENSES.md](./LICENSES.md)**，站内也有同样一份：路由 `/licenses`。

| 数据 | 来源 | 许可 |
|---|---|---|
| 中国省界 + 南海断续线 | [DataV.GeoAtlas 行政区划边界](https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json)（阿里云） | 上游公开接口数据，随仓库分发 |
| 世界国界（239 国/地区） | 几何与中文名：`@surbowl/world-geo-json-zh`；大洲与次区域：联合国 M49（`un-m49`） | **Unlicense**（公有领域）+ **MIT** |
| 地球贴图 | NASA Blue Marble Next Generation「地形与水深」2004 年 7 月版，等比缩放至 4096×2048 | NASA 影像一般不受著作权保护，无需许可 |
| 省份人口与简介 | 2023 年末公开统计口径，逐条标注来源 | 各来源归各自权利人 |
| 第三方库 | Vue / Vue Router / Three.js（MIT）、earcut（ISC） | 见 `package.json` |

本项目是**纯静态前端**：没有后端、没有统计脚本、不使用 Cookie、不收集也不上传任何个人信息。

### 地图合规

标准地图元数据来自自然资源部标准地图服务系统公开的清单（名称、比例尺、审图号、审核年份、分类），并且从官方接口同步，覆盖全部 19 个分类共 2000 余张。

| 地图 | 审图号 | 审核年份 |
|---|---|---|
| 增补藏南地区公开使用地名（第六批）分布图 1:160万 | 藏S(2025)060号 | 2025 |
| 三沙市地图 1:690万 | 琼S(2024)044号 | 2024 |
| 中国地图 1:1000万 对开（界线版 有邻国 线划二） | GS(2023)2762号 | 2023 |
| 亚洲地图 1:2500万 4开 | GS(2023)2761号 | 2023 |
| 世界地图 1:4100万 对开（分国设色 线划一） | GS(2021)5443号 | 2021 |

清单按审核年份从新到旧排列，可按分类、年份、比例尺筛选或按名称搜索。**审图号有效期为 2 年**（《地图审核管理规定》第二十八条），使用前请到官方系统核对是否仍然有效。

审图号是对**特定平面地图产品**的核准编号，绑定那张地图的内容与表现形式。本站把行政区划投到球面上、重新配色、加了标注与交互，是另一种表现形式，因此**不能沿用标准地图的审图号**，也不应被当作「经审核的标准地图」转发。需要审图号齐全的地图，请到[标准地图服务系统](http://bzdt.ch.mnr.gov.cn/)下载。

<p align="center">
  <img src="docs/screenshot-standard-map.jpeg" alt="标准地图与审图号清单" width="760" />
</p>

### 收录口径

行政区划以官方发布为准，本项目不替代官方数据：

- **省级**：34 个省级行政区 + 1 个南海断续线要素，与[国家统计局行政区划](https://data.stats.gov.cn/)口径一致
- **面积**：由边界几何在球面上实算；**人口**：2023 年末常住人口，34 个省级单位合计与全国人口相差约 2%
- **世界视角**：按 ISO 3166-1 收录 239 个国家/地区；**中国地图里的台湾省作为中国的一个省级行政区呈现**，不作为独立条目
- **科索沃**：上游数据集没有为它单列国别，那块地并入塞尔维亚的轮廓——地图上看不出缺口，但国家列表里没有它

## 快速开始

需要 Node.js ≥ 20.19 或 ≥ 22.12。

```sh
npm install
npm run dev        # 开发服务器
npm run check      # lint + 测试 + 构建，与 CI 跑的是同一套
```

## 贡献

欢迎提 issue 与 PR。开始之前请读 [AGENTS.md](./AGENTS.md)，里面是完整的目录职责、命令、硬约束与代码约定。

几条最容易踩的：

- **不要手工修改 `public/geojson/` 下的文件**，它们是只读数据源，由脚本从上游同步
- **新增或更换数据源前先查许可**：优先选有明确开放许可的（Unlicense / MIT / ODbL / 公有领域）；付费数据集、仅供学习研究使用的采集站、来源不明的镜像都不要用。改完记得在 `LICENSES.md` 里登记来源、许可与义务

## License

代码：[Apache License 2.0](./LICENSE)　·　数据与素材：见 [LICENSES.md](./LICENSES.md)
