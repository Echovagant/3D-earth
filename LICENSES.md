# 数据来源与许可

本仓库同时包含**代码**与**第三方地理数据与素材**。两者适用不同的许可，这里逐项列明。

应用内同样有一份：路由 `/licenses`。

---

## 一、本项目代码

| 内容 | 许可 |
|---|---|
| `src/`、`scripts/`、配置与文档 | [Apache License 2.0](./LICENSE) |

直接依赖的第三方库：

| 依赖 | 许可 |
|---|---|
| Vue、Vue Router、Three.js | MIT |
| earcut | ISC |

完整清单见 `package.json`，锁定版本见 `package-lock.json`。

### 个人信息

本项目是**纯静态前端**：没有后端服务、没有统计或埋点脚本、不使用 Cookie、不收集也不上传任何个人信息。所有交互都只发生在浏览器本地。

---

## 二、地理数据（`public/geojson/`）

| 文件 | 内容 | 来源 | 许可 |
|---|---|---|---|
| `china-provinces.json` | 34 个省级行政区 + 南海断续线要素 | [DataV.GeoAtlas 行政区划边界](https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json)（阿里云） | 上游公开接口数据 |
| `china.json` | 中华人民共和国整体边界 | [DataV.GeoAtlas 行政区划边界](https://geo.datav.aliyun.com/areas_v3/bound/100000.json) | 上游公开接口数据 |
| `cities/<省adcode>.json`（34 个） | 各地级市边界 | [DataV.GeoAtlas 行政区划边界](https://geo.datav.aliyun.com/areas_v3/bound/) | 上游公开接口数据 |
| `cities/710000.json` | 台湾省 22 个县市边界 | 几何：[geoBoundaries TWN ADM1](https://www.geoboundaries.org/)（OpenStreetMap / Wambacher）；属性：[内政部「縣市行政區劃」](https://www.moi.gov.tw/)（`COUNTY_MOI_1081121`） | 几何为 **ODbL 1.0**；本文件是它的衍生数据库，同样以 **ODbL 1.0** 提供 |
| `world-countries.json` | 239 个国家/地区边界，含中文名、ISO 3166-1 代码与地区划分 | 几何与中文名：[`@surbowl/world-geo-json-zh`](https://registry.npmmirror.com/@surbowl/world-geo-json-zh)；大洲与次区域：联合国 M49 地区划分（[`un-m49`](https://registry.npmmirror.com/un-m49)） | **Unlicense**（公有领域）+ **MIT** |

### ODbL 1.0 的义务

`public/geojson/cities/710000.json` 来自 Open Database License 1.0 授权的数据库，因此：

- **署名**：本文件及其衍生作品须保留对 geoBoundaries（数据源 OpenStreetMap / Wambacher）的署名——本文件即为该署名。
- **相同方式共享**：再分发本文件时，须以 ODbL 1.0 提供。

其余文件不含 copyleft 条款的义务，署名仍列在上表里以便追溯。

---

## 三、素材

| 文件 | 内容 | 来源 | 许可 |
|---|---|---|---|
| `public/textures/earth_atmos_2048.jpg` | 地球贴图（两个视角共用） | NASA Blue Marble Next Generation（`land_ocean_ice_2048`），经色彩调整 | NASA 影像一般不受著作权保护，无需取得许可；按其媒体使用指引署名 |

贴图文件已去掉 EXIF / XMP 元数据（其中只有编辑工具与时间戳，不含署名信息）。

---

## 四、统计数字（`public/data/provinces/`）

| 字段 | 来源 | 说明 |
|---|---|---|
| 面积（`area`、`areaKm2`） | 由行政区划边界在球面上实算 | 球面鞋带公式，地球平均半径 6371.0088 km；不是抄来的公布值 |
| 人口（`population`） | 2023 年末公开统计口径 | 31 个省、自治区、直辖市取国家统计局；台湾省、香港、澳门取各自主管部门。每个数值在页面上标注了来源 |
| 中心坐标、下辖区县数 | 取自行政区划数据本身 | — |
| 简介与亮点 | 人工整理 | 描述性文字，著作权归整理者 |

---

## 五、数据更新

| 脚本 | 上游 | 调度 |
|---|---|---|
| `scripts/update-geo.mjs` | DataV.GeoAtlas | GitHub Actions 每周一 |
| `scripts/update-world.mjs` | npm 国内镜像 npmmirror | 同上 |
| `scripts/update-tw.mjs` | geoBoundaries | 同上 |

同步脚本在写盘前会校验要素数、几何类型与坐标范围；行政区划的新增或撤销会被直接拒绝——那需要人工确认后再改。

`public/geojson/` 是**只读数据源**，由上述脚本更新，不要手工修改。
