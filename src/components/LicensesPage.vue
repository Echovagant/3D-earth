<template>
  <div class="detail-page licenses">
    <header class="detail-page__bar">
      <button type="button" class="detail-page__back" @click="goBack">
        <span class="detail-page__back-arrow">‹</span>
        <span>返回</span>
      </button>
      <span class="detail-page__brand">3D-EARTH <i>/</i> LICENSES</span>
      <router-link class="detail-page__licenses" to="/standard-map">审图号</router-link>
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
        <h2>课程内容与版权</h2>
        <ul class="licenses__list">
          <li>
            本站是<strong>个人学习用途</strong>的学习辅助工具，不提供在线课程，也不售卖任何内容。
            站内「课程地图」与知识点提纲，是对一套公开教学视频的<strong>索引与结构化整理</strong>：
            收录的是章节结构、要点清单与易错提示等提纲性内容，完整讲解请跳转原视频观看。
          </li>
          <li>
            视频版权归原作者及原平台所有，本站仅提供跳转链接。站内所有地图相关数据均来自
            <code>LICENSES.md</code>（仓库根目录）登记的开放许可来源或官方公开接口。
          </li>
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
                <td><code>public/textures/earth_atmos_4096.jpg</code></td>
                <td>地球贴图（两个视角共用）</td>
                <td>
                  NASA Blue Marble Next Generation「地形与水深」产品，2004 年 7 月，原始 5400×2700
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
          <li>「中心坐标」直接取自行政区划数据本身。</li>
        </ul>
      </section>

      <section class="licenses__block">
        <h2>数据完整性</h2>
        <ul class="licenses__list">
          <li>中国部分：34 个省级行政区 + 南海断续线要素；下一级共 497 个边界要素（直辖市这一级为市辖区）。</li>
          <li>世界部分：239 个国家/地区。台湾省在中国地图里作为中国的一个省级行政区呈现；科索沃在两个上游数据里都没有单列条目，那块地并入塞尔维亚的轮廓。</li>
          <li>人口为 2023 年末公开统计口径；全球视角不含人口统计。</li>
          <li>完整的收录口径与权威对照链接见 README 的「数据完整性与收录口径」一节。</li>
        </ul>
      </section>

      <section class="licenses__block">
        <h2>地图合规</h2>
        <ul class="licenses__list">
          <li>
            本项目是非商业、不收费、无后端的开源作品，<strong>不提供互联网地图服务</strong>（不提供定位、不提供地图数据下载接口），
            也不提供审图号。行政区划以官方发布为准。
          </li>
          <li>
            依据<a href="https://www.gov.cn/zhengce/zhengceku/2015-12/14/content_10403.htm" target="_blank" rel="noreferrer noopener">《地图管理条例》</a>第二条、第十五条，
            向社会公开的地图应当报送审核；依据<a href="http://www.gov.cn/gongbao/content/2018/content_5271747.htm" target="_blank" rel="noreferrer noopener">《地图审核管理规定》</a>第六条，
            直接使用测绘地理信息主管部门提供的具有审图号的公益性地图不需要审核。
          </li>
          <li>
            审图号由审核机关核发，不能随开源协议转让。用于课件、出版物或对外产品时，请自行使用
            <a href="https://www.zrzyst.cn/" target="_blank" rel="noreferrer noopener">自然资源部审图中心的标准地图</a>并标注审图号。
          </li>
        </ul>
      </section>

      <section class="licenses__block">
        <h2>标准地图与审图号</h2>
        <ul class="licenses__list">
          <li>
            <code>public/data/standard-maps.json</code> 收录
            <a href="http://bzdt.ch.mnr.gov.cn/" target="_blank" rel="noreferrer noopener"
              >标准地图服务系统</a
            >
            公开的 133 张标准地图元数据：名称、比例尺、审图号、审核年份，由
            <code>scripts/update-standard-maps.mjs</code> 同步。
          </li>
          <li>
            <strong>只收录元数据，不下载也不分发地图图片</strong>：标准地图可免费下载使用，但要求不改内容、标注审图号；
            把图片打包进本仓库属于再分发。
          </li>
          <li>
            <strong>审图号不适用于本项目的 3D 地球</strong>：审图号绑定的是特定平面地图产品的内容与表现形式，
            本站把行政区划投到球面、重新配色并加了交互，属于另一种表现形式。需要审图号齐全的地图，
            请到官方服务系统下载。
          </li>
        </ul>
        <p class="licenses__note">
          站内 <router-link to="/standard-map">标准地图与审图号</router-link> 页可直接查完整清单。
        </p>
      </section>

      <section class="licenses__block">
        <h2>数据更新</h2>
        <ul class="licenses__list">
          <li><code>scripts/update-geo.mjs</code> —— 中国省界与各省面积（DataV）。</li>
          <li><code>scripts/update-world.mjs</code> —— 世界国界（npm 镜像源 npmmirror）。</li>
          <li><code>scripts/update-standard-maps.mjs</code> —— 标准地图与审图号清单（标准地图服务系统）。</li>
          <li><code>scripts/check-licenses.mjs</code> —— 逐个体检上游可达性与许可字段。</li>
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
