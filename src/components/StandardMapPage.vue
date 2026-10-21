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
          公开的标准地图清单：名称、比例尺、审图号与审核年份，全部由
          <code>scripts/update-standard-maps.mjs</code> 从官方接口同步。
        </p>
        <p class="standard__lead">
          使用标准地图有两条硬要求：<strong>不得改动地图内容</strong>（国界线、
          南海诸岛、岛礁等），<strong>使用时须标注审图号</strong>。官方地图可免费下载，
          但本站只收录元数据，不打包、不再分发地图图片。
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
            <button
              v-for="option in scaleOptions"
              :key="option"
              type="button"
              class="standard__filter"
              :class="{ 'is-active': option === activeScale }"
              @click="activeScale = option"
            >
              {{ option }}
            </button>
          </div>
          <div class="standard__table-wrap">
            <table class="standard__table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>内容</th>
                  <th>比例尺</th>
                  <th>审图号</th>
                  <th>审核年份</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="map in visibleMaps" :key="map.id">
                  <td>{{ map.name }}</td>
                  <td>{{ map.content }}</td>
                  <td class="mono">{{ map.scale }}</td>
                  <td class="mono standard__number">{{ map.mapNumber }}</td>
                  <td class="mono">{{ map.mapYear }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="standard__note">
            共 {{ maps.length }} 张标准地图，当前显示 {{ visibleMaps.length }} 张。
            完整清单与审图号见仓库里的
            <code>public/data/standard-maps.json</code>；下载与使用请到官方服务系统。
          </p>
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

const router = useRouter()

const DATA_URL = '/data/standard-maps.json'
const DEFAULT_SCALE = '全部'

const maps = ref([])
const loading = ref(true)
const error = ref('')
const activeScale = ref(DEFAULT_SCALE)

const scaleOptions = computed(() => {
  const scales = [...new Set(maps.value.map((m) => m.scale))].sort((a, b) => a.localeCompare(b, 'zh'))
  return [DEFAULT_SCALE, ...scales]
})

const visibleMaps = computed(() =>
  activeScale.value === DEFAULT_SCALE
    ? maps.value
    : maps.value.filter((m) => m.scale === activeScale.value),
)

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
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}

.standard__filter {
  padding: 4px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-lo);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease);
}

.standard__filter:hover,
.standard__filter.is-active {
  color: var(--accent);
  border-color: var(--line-strong);
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

.standard__number {
  color: var(--accent);
}

.standard__note {
  margin: var(--sp-3) 0 0;
  font-size: var(--fs-label);
  line-height: 1.8;
  color: var(--text-lo);
}

code {
  font-family: var(--font-mono);
  color: var(--text-mid);
}
</style>
