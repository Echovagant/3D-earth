<template>
  <div class="detail-page">
    <header class="detail-page__bar">
      <button type="button" class="detail-page__back" @click="goBack">
        <span class="detail-page__back-arrow">‹</span>
        <span>返回</span>
      </button>
      <span class="detail-page__brand">3D-EARTH <i>/</i> STANDARD MAP</span>
      <router-link class="detail-page__licenses" to="/licenses">许可</router-link>
      <span class="detail-page__code mono">审图号</span>
    </header>

    <main class="detail-page__main">
      <section class="detail-page__hero">
        <span class="detail-page__abbr">🗺</span>
        <div class="detail-page__heading">
          <h1>标准地图与审图号</h1>
          <span class="detail-page__sub mono">STANDARD MAP · MAP APPROVAL NO.</span>
        </div>
      </section>

      <section class="standard__block">
        <p class="standard__lead">
          公开对外发布的中国地图，需经自然资源部（国家测绘地理信息局）审核，并标注
          <strong>审图号</strong>。下面是
          <a href="http://bzdt.ch.mnr.gov.cn/" target="_blank" rel="noreferrer noopener"
            >标准地图服务系统</a
          >
          公开的标准地图清单：名称、比例尺、审图号、审核年份与分类，全部由
          <code>scripts/update-standard-maps.mjs</code> 从官方接口同步。
        </p>
        <p class="standard__lead">
          使用标准地图有两条硬要求：<strong>不得改动地图内容</strong>（国界线、
          南海诸岛、岛礁等），<strong>使用时须标注审图号</strong>。官方地图可免费下载，
          但本站只收录元数据，不打包、不再分发地图图片。
        </p>
        <p class="standard__lead">
          下表按审核年份从新到旧排列，最新一批是
          <strong class="standard__latest">{{ latestYear }} 年</strong
          >审核的；共 {{ maps.length }} 张，其中 {{ olderYearCount }} 张是 {{ oldestYear }}–{{
            latestYear - 1
          }}
          年审核的。
        </p>
        <p class="standard__lead">
          <strong>「审图号有效期两年」说的是互联网地图服务审图号</strong>——《地图审核管理规定》第二十八条
          的原文是「互联网地图服务审图号有效期为两年。审图号到期，应当重新送审」，第三十二条的罚则同样只针对这一类，
          <strong>不适用于标准地图产品</strong>。标准地图是自然资源部提供的公益性地图：该规定第六条第一项明确
          「直接使用自然资源主管部门提供的具有审图号的公益性地图」不需要再送审；官方系统的口径是
          「社会公众可以免费浏览、下载标准地图，直接使用标准地图时需要标注审图号」，
          并至今仍在目录里提供 2016 年以来审核的地图与其审图号。
        </p>
        <p class="standard__lead">
          本站只收录公开目录里的元数据，不下载也不分发地图图片，不涉及「使用地图」的授权问题。
          <strong>要自己下载使用某张标准地图，请以官方系统当时给出的信息为准。</strong>
        </p>
      </section>

      <HudPanel class="standard__panel" title="标准地图清单" meta="STANDARD MAPS">
        <div v-if="loading" class="standard__state">读取清单…</div>
        <div v-else-if="error" class="standard__state standard__state--error">
          <p>{{ error }}</p>
          <button type="button" class="standard__retry" @click="load">重试</button>
        </div>
        <template v-else>
          <div class="standard__filters">
            <label class="standard__field">
              <span>分类</span>
              <select v-model="activeCategory">
                <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
              </select>
            </label>
            <label class="standard__field">
              <span>审核年份</span>
              <select v-model="activeYear">
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
              </select>
            </label>
            <label class="standard__field">
              <span>比例尺</span>
              <select v-model="activeScale">
                <option v-for="s in scaleOptions" :key="s" :value="s">{{ s }}</option>
              </select>
            </label>
            <label class="standard__field standard__field--grow">
              <span>搜索</span>
              <input v-model="keyword" type="search" placeholder="按名称或审图号筛选" />
            </label>
          </div>

          <div class="standard__table-wrap">
            <table class="standard__table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>内容</th>
                  <th>分类</th>
                  <th>比例尺</th>
                  <th>审图号</th>
                  <th>审核年份</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="map in shownMaps" :key="`${map.mapNumber}::${map.name}`">
                  <td>{{ map.name }}</td>
                  <td>{{ map.content }}</td>
                  <td class="standard__cat">{{ map.category }}</td>
                  <td class="mono">{{ map.scale }}</td>
                  <td class="mono standard__number">{{ map.mapNumber || '—' }}</td>
                  <td class="mono standard__year">{{ map.mapYear }}</td>
                </tr>
                <tr v-if="shownMaps.length === 0">
                  <td colspan="6" class="standard__empty">没有符合条件的地图</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="standard__note">
            共 {{ maps.length }} 张标准地图（最新审核年份 {{ latestYear }}），当前筛选出
            {{ filteredMaps.length }} 张，已显示 {{ shownMaps.length }} 张。
            <template v-if="withoutNumberCount > 0">
              其中 {{ withoutNumberCount }} 张官方未公布审图号。
            </template>
            完整清单与审图号见仓库里的 <code>public/data/standard-maps.json</code>；下载与使用请到官方服务系统。
          </p>

          <button
            v-if="shownMaps.length < filteredMaps.length"
            type="button"
            class="standard__more"
            @click="visibleCount += PAGE_SIZE"
          >
            显示更多（还有 {{ filteredMaps.length - shownMaps.length }} 张）
          </button>
        </template>
      </HudPanel>

      <section class="standard__block">
        <h2 class="standard__h2">关于本站的 3D 地球</h2>
        <p class="standard__lead">
          审图号是对<strong>特定平面地图产品</strong>的核准编号，绑定那张地图的内容与表现形式。
          本站把行政区划投到球面上、重新配色、加了标注与交互，是一种
          <strong>不同的表现形式</strong>，因此<strong>不能沿用上表的审图号</strong>，
          也不应被当作「经审核的标准地图」来使用或转发。
        </p>
        <p class="standard__lead">
          本站的做法是：把官方标准地图的<strong>审图号与来源公开列出</strong>（本页），
          数据来源逐项披露（<router-link to="/licenses">许可页</router-link>），
          并在每个数据条目上说明其完整性边界。需要一张可直接使用、审图号齐全的地图时，
          请到标准地图服务系统下载。
        </p>
      </section>

      <div class="detail-page__actions">
        <button type="button" class="detail-page__cta" @click="goBack">返回</button>
        <a
          class="detail-page__cta detail-page__cta--ghost"
          href="http://bzdt.ch.mnr.gov.cn/"
          target="_blank"
          rel="noreferrer noopener"
          >标准地图服务系统</a
        >
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HudPanel from './HudPanel.vue'
import { assetUrl } from '../utils/base'

const router = useRouter()

const DATA_URL = assetUrl('/data/standard-maps.json')
const ALL = '全部'
const PAGE_SIZE = 100

const maps = ref([])
const loading = ref(true)
const error = ref('')
const activeCategory = ref(ALL)
const activeYear = ref(ALL)
const activeScale = ref(ALL)
const keyword = ref('')
const visibleCount = ref(PAGE_SIZE)

const categoryOptions = computed(() => [
  ALL,
  ...[...new Set(maps.value.map((m) => m.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'zh'),
  ),
])
const yearOptions = computed(() => [
  ALL,
  ...[...new Set(maps.value.map((m) => m.mapYear).filter(Boolean))].sort((a, b) => b - a),
])
const scaleOptions = computed(() => [
  ALL,
  ...[...new Set(maps.value.map((m) => m.scale).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'zh', { numeric: true }),
  ),
])

const latestYear = computed(() =>
  maps.value.length ? Math.max(...maps.value.map((m) => Number(m.mapYear) || 0)) : '',
)
const withoutNumberCount = computed(() => maps.value.filter((m) => !m.mapNumber).length)

/** 最早与最新的审核年份，以及介于两者之间的条目数——清单的年份跨度不小 */
const oldestYear = computed(() =>
  maps.value.length ? Math.min(...maps.value.map((m) => Number(m.mapYear) || Infinity)) : '',
)
const olderYearCount = computed(
  () => maps.value.filter((m) => Number(m.mapYear) < Number(latestYear.value)).length,
)

const filteredMaps = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return maps.value.filter((m) => {
    if (activeCategory.value !== ALL && m.category !== activeCategory.value) return false
    if (activeYear.value !== ALL && m.mapYear !== activeYear.value) return false
    if (activeScale.value !== ALL && m.scale !== activeScale.value) return false
    if (kw) {
      const hay = `${m.name} ${m.mapNumber} ${m.content} ${m.category}`.toLowerCase()
      if (!hay.includes(kw)) return false
    }
    return true
  })
})

const shownMaps = computed(() => filteredMaps.value.slice(0, visibleCount.value))

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(DATA_URL)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const payload = await response.json()
    maps.value = Array.isArray(payload?.maps) ? payload.maps : []
    if (maps.value.length === 0) throw new Error('清单为空')
  } catch (e) {
    error.value = `无法加载标准地图清单（${e.message}）`
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

onMounted(load)
</script>

<style scoped>
.standard__block {
  margin-bottom: var(--sp-5);
}

.standard__h2 {
  margin: 0 0 var(--sp-3);
  font-size: var(--fs-value);
  color: var(--text-hi);
}

.standard__lead {
  margin: 0 0 var(--sp-3);
  font-size: var(--fs-body);
  line-height: 1.9;
  color: var(--text-mid);
}

.standard__lead strong {
  color: var(--text-hi);
}

.standard__lead a {
  color: var(--accent);
}

.standard__latest {
  color: var(--accent);
}

.standard__state {
  padding: var(--sp-4);
  font-size: var(--fs-label);
  color: var(--text-lo);
  text-align: center;
}

.standard__state--error {
  color: var(--accent-warm);
}

.standard__retry {
  margin-top: var(--sp-3);
  padding: 5px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-hi);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  cursor: pointer;
}

.standard__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
  margin-bottom: var(--sp-3);
}

.standard__field {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  color: var(--text-lo);
}

.standard__field--grow {
  flex: 1 1 180px;
}

.standard__field select,
.standard__field input {
  flex: 1;
  min-width: 96px;
  padding: 5px 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--accent-dim);
  color: var(--text-hi);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
}

.standard__field select:focus,
.standard__field input:focus {
  border-color: var(--line-strong);
  outline: none;
}

.standard__table-wrap {
  overflow-x: auto;
  border: 1px solid var(--line-faint);
  border-radius: var(--radius-sm);
}

.standard__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-label);
  color: var(--text-mid);
}

.standard__table th,
.standard__table td {
  padding: var(--sp-2) var(--sp-3);
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid var(--line-faint);
  white-space: nowrap;
}

.standard__table th {
  color: var(--text-lo);
  font-family: var(--font-mono);
  letter-spacing: 0.12em;
}

.standard__table tr:last-child td {
  border-bottom: none;
}

.standard__cat {
  color: var(--text-lo);
}

.standard__number {
  color: var(--accent);
}

.standard__year {
  color: var(--text-hi);
}

.standard__empty {
  padding: var(--sp-4);
  color: var(--text-lo);
  text-align: center;
}

.standard__note {
  margin: var(--sp-3) 0 0;
  font-size: var(--fs-label);
  line-height: 1.8;
  color: var(--text-lo);
}

.standard__more {
  margin-top: var(--sp-3);
  width: 100%;
  padding: 8px 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  cursor: pointer;
  transition: border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease);
}

.standard__more:hover {
  border-color: var(--line-strong);
  background: var(--accent-dim);
}

code {
  font-family: var(--font-mono);
  color: var(--text-mid);
}
</style>
