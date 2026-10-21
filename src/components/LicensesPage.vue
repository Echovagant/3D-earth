<template>
  <div class="detail-page licenses">
    <header class="detail-page__bar">
      <button type="button" class="detail-page__back" @click="goBack">
        <span class="detail-page__back-arrow">‹</span>
        <span>返回</span>
      </button>
      <span class="detail-page__brand">3D-EARTH <i>/</i> LICENSES</span>
      <span class="detail-page__code mono">许可</span>
    </header>

    <main class="detail-page__main">
      <section class="detail-page__hero">
        <span class="detail-page__abbr">⚖</span>
        <div class="detail-page__heading">
          <h1>数据来源与许可</h1>
          <span class="detail-page__sub mono">ATTRIBUTION · LICENSING</span>
        </div>
      </section>

      <section class="licenses__block">
        <h2>本项目</h2>
        <ul class="licenses__list">
          <li>代码与文档以 <strong>Apache License 2.0</strong> 发布（见仓库根目录 <code>LICENSE</code>）。</li>
          <li>
            纯静态前端：没有后端、没有统计脚本、没有 Cookie、不收集也不上传任何个人信息。
            页面上的每一次交互都只发生在浏览器本地。
          </li>
          <li>第三方依赖的许可：Vue / Vue Router / Three.js 为 MIT，earcut 为 ISC，清单见 <code>package.json</code>。</li>
        </ul>
      </section>

      <section class="licenses__block">
        <h2>地理数据</h2>
        <div class="licenses__table-wrap">
          <table class="licenses__table">
            <thead>
              <tr>
                <th>文件</th>
                <th>内容</th>
                <th>来源</th>
                <th>许可</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>public/geojson/china-provinces.json</code><br /><code>public/geojson/china.json</code></td>
                <td>34 个省级行政区 + 南海断续线要素</td>
                <td>
                  <a href="https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json" target="_blank" rel="noreferrer noopener"
                    >DataV.GeoAtlas 行政区划边界</a
                  >
                  （阿里云）
                </td>
                <td>公开接口数据，随仓库分发</td>
              </tr>
              <tr>
                <td><code>public/geojson/cities/&lt;省adcode&gt;.json</code>（34 个省）</td>
                <td>各地级市边界</td>
                <td>
                  <a href="https://geo.datav.aliyun.com/areas_v3/bound/" target="_blank" rel="noreferrer noopener"
                    >DataV.GeoAtlas 行政区划边界</a
                  >
                </td>
                <td>公开接口数据，随仓库分发</td>
              </tr>
              <tr>
                <td><code>public/geojson/cities/710000.json</code></td>
                <td>台湾省 22 个县市边界</td>
                <td>
                  几何：geoBoundaries TWN ADM1（OpenStreetMap / Wambacher）；属性：
                  <a href="https://www.moi.gov.tw/" target="_blank" rel="noreferrer noopener">内政部「縣市行政區劃」</a>
                </td>
                <td>
                  <strong>ODbL 1.0</strong>（几何；本文件为衍生数据库，同样以 ODbL 1.0 提供）
                </td>
              </tr>
              <tr>
                <td><code>public/geojson/world-countries.json</code></td>
                <td>239 个国家/地区边界，含中文名、ISO 3166-1 代码与地区划分</td>
                <td>
                  几何与中文名：<code>@surbowl/world-geo-json-zh</code>；大洲与次区域：联合国 M49 地区划分
                  （<code>un-m49</code>）
                </td>
                <td>Unlicense（公有领域）+ MIT</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="licenses__note">
          上述文件由 <code>scripts/</code> 下的同步脚本从上游取回后随仓库分发，运行时不再请求任何第三方接口。
          <code>public/geojson/</code> 是只读数据源，不要手工修改。
        </p>
      </section>

      <section class="licenses__block">
        <h2>素材</h2>
        <div class="licenses__table-wrap">
          <table class="licenses__table">
            <thead>
              <tr>
                <th>文件</th>
                <th>内容</th>
                <th>来源</th>
                <th>许可</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>public/textures/earth_atmos_2048.jpg</code></td>
                <td>地球贴图（两个视角共用）</td>
                <td>
                  NASA Blue Marble Next Generation（<code>land_ocean_ice_2048</code>），经色彩调整
                </td>
                <td>NASA 影像一般不受著作权保护，无需取得许可；按其媒体使用指引署名</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="licenses__block">
        <h2>统计数字</h2>
        <ul class="licenses__list">
          <li>
            <code>public/data/provinces/</code> 里的「面积」由行政区划边界在球面上实算得到
            （球面鞋带公式），不是抄来的公布值。
          </li>
          <li>
            「人口」为 2023 年末的公开统计口径：31 个省、自治区、直辖市取国家统计局，
            港澳台取各自主管部门。数值在页面里标注了来源。
          </li>
          <li>「中心坐标」与「下辖区县数」直接取自行政区划数据本身。</li>
        </ul>
      </section>

      <section class="licenses__block">
        <h2>数据更新</h2>
        <ul class="licenses__list">
          <li><code>scripts/update-geo.mjs</code> —— 中国省界、地级市边界与各省面积（DataV）。</li>
          <li><code>scripts/update-world.mjs</code> —— 世界国界（npm 国内镜像 npmmirror）。</li>
          <li><code>scripts/update-tw.mjs</code> —— 台湾省县市边界（geoBoundaries）。</li>
        </ul>
        <p class="licenses__note">
          同步脚本在写盘前会校验要素数、几何类型与坐标范围；行政区划的新增或撤销会被直接拒绝，
          那需要人工确认后再改。
        </p>
      </section>

      <div class="detail-page__actions">
        <button type="button" class="detail-page__cta" @click="goBack">返回</button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  // 直接进这个页面时没有历史可退，回首页
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<style scoped>
.licenses {
  overflow-y: auto;
}

.licenses__block {
  margin-bottom: var(--sp-5);
}

.licenses__block h2 {
  margin: 0 0 var(--sp-3);
  font-size: var(--fs-value);
  color: var(--text-hi);
}

.licenses__list {
  margin: 0;
  padding-left: 1.2em;
  color: var(--text-mid);
  font-size: var(--fs-body);
  line-height: 1.9;
}

.licenses__list strong {
  color: var(--text-hi);
}

.licenses__table-wrap {
  overflow-x: auto;
  border: 1px solid var(--line-faint);
  border-radius: var(--radius-sm);
}

.licenses__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-label);
  color: var(--text-mid);
}

.licenses__table th,
.licenses__table td {
  padding: var(--sp-2) var(--sp-3);
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid var(--line-faint);
}

.licenses__table th {
  color: var(--text-lo);
  font-family: var(--font-mono);
  letter-spacing: 0.12em;
  white-space: nowrap;
}

.licenses__table tr:last-child td {
  border-bottom: none;
}

.licenses__table a {
  color: var(--accent);
}

.licenses__note {
  margin: var(--sp-3) 0 0;
  font-size: var(--fs-label);
  line-height: 1.9;
  color: var(--text-lo);
}

code {
  font-family: var(--font-mono);
  color: var(--text-mid);
}
</style>
