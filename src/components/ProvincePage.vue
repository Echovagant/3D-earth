<template>
  <div class="province">
    <!-- 顶部状态条 -->
    <header class="province__bar">
      <button class="province__back" type="button" @click="goBack">
        <span class="province__back-arrow">‹</span>
        <span>返回地球</span>
      </button>
      <span class="province__brand">3D-EARTH <i>/</i> PROVINCE</span>
      <span class="province__code mono">{{ route.params.adcode || '——' }}</span>
    </header>

    <div v-if="loading" class="province__state">读取数据中…</div>

    <div v-else-if="error" class="province__state province__state--error">
      <p>{{ error }}</p>
      <button type="button" class="province__retry" @click="load">重试</button>
    </div>

    <main v-else-if="data" class="province__main">
      <!-- 标题区 -->
      <section class="province__hero">
        <span class="province__abbr">{{ data.abbreviation }}</span>
        <div class="province__heading">
          <h1>{{ data.name }}</h1>
          <span class="province__sub mono">
            行政区划代码 {{ data.adcode }} · 中心 {{ data.center[0].toFixed(2) }}°E
            {{ data.center[1].toFixed(2) }}°N
          </span>
        </div>
      </section>

      <!-- 数据面板 -->
      <HudPanel class="province__facts" title="基础数据" meta="FACTS">
        <dl class="facts">
          <div class="facts__cell">
            <dt>行政中心</dt>
            <dd>{{ data.capital }}</dd>
          </div>
          <div class="facts__cell">
            <dt>边界围合面积</dt>
            <dd class="mono">{{ formatArea(data.areaKm2) }}</dd>
          </div>
          <div class="facts__cell">
            <dt>公布面积</dt>
            <dd class="mono">{{ data.area }}</dd>
          </div>
          <div class="facts__cell">
            <dt>人口</dt>
            <dd class="mono">{{ data.population }}</dd>
          </div>
          <div class="facts__cell">
            <dt>中心坐标</dt>
            <dd class="mono">{{ data.center[0].toFixed(3) }}, {{ data.center[1].toFixed(3) }}</dd>
          </div>
        </dl>
      </HudPanel>

      <!-- 简介 -->
      <section class="province__intro">
        <span class="province__intro-label">简介 / BRIEF</span>
        <p>{{ data.intro }}</p>
      </section>

      <!-- 数据口径说明 -->
      <section class="province__intro">
        <span class="province__intro-label">数据口径 / NOTES</span>
        <p>
          <b>边界围合面积</b>由本省的行政区划边界在球面上直接计算得到（球面鞋带公式，
          地球平均半径 6371.0088 km），与地级市详情页用的是同一个公式，因此两处口径一致；
          它随边界数据自动更新。<b>公布面积</b>是统计口径的公开数值，沿海省份的行政边界包含管辖海域，
          前者因此会略大于后者。人口取自{{ data.populationSource }}口径的公开统计值，
          各省统计年份不完全一致，34 个省级行政区合计与全国人口相差约 2%。
        </p>
      </section>

      <!-- 标签 -->
      <ul class="province__tags">
        <li v-for="tag in data.highlights" :key="tag" class="province__tag">
          <span class="province__tag-dot"></span>{{ tag }}
        </li>
      </ul>

      <div class="province__actions">
        <button type="button" class="province__cta province__cta--ghost" @click="drillDown">
          下钻到地级市<span v-if="cityCount" class="mono">（{{ cityCount }} 个）</span>
        </button>
        <button type="button" class="province__cta" @click="goBack">返回地球</button>
      </div>
    </main>

    <!-- 底部数据说明栏 -->
    <footer class="province__foot">
      <span class="mono">坐标系 WGS-84</span>
      <span class="mono">数据来源 public/data/provinces/{{ route.params.adcode }}.json</span>
      <span class="mono province__foot-warn">边界围合面积由行政区划边界在球面上直接计算得到</span>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HudPanel from './HudPanel.vue'
import { formatArea, loadAreaData } from '../utils/areaData'

const route = useRoute()
const router = useRouter()

const data = ref(null)
const loading = ref(true)
const error = ref('')
// 该省的地级市数量，取不到就只显示按钮不显示数字
const cityCount = ref(null)

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`/data/provinces/${route.params.adcode}.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data.value = await res.json()
  } catch (e) {
    error.value = `无法加载该省份的数据（${e.message}）`
  } finally {
    loading.value = false
  }
  loadCityCount()
}

// 顺带取下地级市数量，让下钻入口可预期
const loadCityCount = async () => {
  try {
    const geo = await loadAreaData(route.params.adcode)
    cityCount.value = geo.features.length
  } catch {
    cityCount.value = null
  }
}

// 下钻到该省的地级市
const drillDown = () => router.push(`/drill/${route.params.adcode}`)

const goBack = () => {
  // 返回地球页面
  router.push('/')
}

onMounted(load)
</script>

<style scoped>
.province {
  position: relative;
  min-height: 100%;
  overflow-y: auto;
  color: var(--text-hi);
  background:
    radial-gradient(circle at 22% 12%, rgba(91, 140, 255, 0.16) 0%, transparent 46%),
    radial-gradient(circle at 80% 80%, rgba(79, 216, 255, 0.1) 0%, transparent 52%),
    var(--bg-void);
}

/* 细网格 + 扫描线 */
.province::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(120, 190, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 190, 255, 0.05) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(circle at 50% 40%, #000 0%, transparent 78%);
}

.province::after {
  content: '';
  position: fixed;
  left: 0;
  right: 0;
  height: 140px;
  pointer-events: none;
  background: linear-gradient(180deg, transparent, rgba(79, 216, 255, 0.05), transparent);
  animation: scan 7s linear infinite;
}

/* ---------- 顶部状态条 ---------- */
.province__bar {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  padding: var(--sp-3) var(--sp-5);
  background: rgba(4, 7, 15, 0.78);
  border-bottom: 1px solid var(--line-faint);
  backdrop-filter: blur(10px);
}

.province__back {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  padding: 4px 12px 4px 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-mid);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.12em;
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease);
}

.province__back:hover {
  color: var(--accent);
  border-color: var(--line-strong);
}

.province__back-arrow {
  font-size: 16px;
  line-height: 1;
}

.province__brand {
  flex: 1;
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.24em;
  color: var(--text-lo);
}

.province__brand i {
  color: var(--accent);
  font-style: normal;
  opacity: 0.7;
}

.province__code {
  font-size: var(--fs-label);
  letter-spacing: 0.14em;
  color: var(--accent);
  opacity: 0.85;
}

/* ---------- 状态 ---------- */
.province__state {
  padding: 80px var(--sp-5);
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.16em;
  color: var(--text-lo);
}

.province__state--error {
  color: #ff8f8f;
}

.province__retry {
  margin-top: var(--sp-3);
  padding: 6px 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-mid);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.12em;
  cursor: pointer;
}

.province__retry:hover {
  color: var(--accent);
}

/* ---------- 主体 ---------- */
.province__main {
  position: relative;
  z-index: 1;
  max-width: 860px;
  margin: 0 auto;
  padding: var(--sp-6) var(--sp-5) var(--sp-6);
  animation: rise var(--dur-slow) var(--ease) both;
}

.province__hero {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  margin-bottom: var(--sp-5);
}

.province__abbr {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  flex: none;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 28px;
  font-weight: 600;
  box-shadow: var(--glow-soft);
}

.province__heading h1 {
  margin: 0 0 2px;
  font-size: var(--fs-title);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.province__sub {
  font-size: var(--fs-label);
  letter-spacing: 0.1em;
  color: var(--text-lo);
}

/* ---------- 数据面板 ---------- */
.province__facts {
  margin-bottom: var(--sp-5);
}

.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--sp-3);
  margin: 0;
}

.facts__cell {
  padding: var(--sp-3);
  border: 1px solid var(--line-faint);
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.22);
}

.facts__cell dt {
  font-size: var(--fs-label);
  letter-spacing: 0.14em;
  color: var(--text-lo);
}

.facts__cell dd {
  margin: var(--sp-1) 0 0;
  font-size: var(--fs-value);
  color: var(--text-hi);
}

/* ---------- 简介 ---------- */
.province__intro {
  position: relative;
  margin-bottom: var(--sp-5);
  padding-left: var(--sp-4);
  border-left: 2px solid var(--accent-soft);
}

.province__intro-label {
  display: block;
  margin-bottom: var(--sp-2);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.2em;
  color: var(--accent);
  opacity: 0.8;
}

.province__intro p {
  margin: 0;
  line-height: 1.95;
  color: var(--text-mid);
}

/* ---------- 标签 ---------- */
.province__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin: 0 0 var(--sp-6);
  padding: 0;
  list-style: none;
}

.province__tag {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 4px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgba(79, 216, 255, 0.06);
  font-size: var(--fs-body);
  color: var(--text-mid);
}

.province__tag-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: var(--glow);
}

/* ---------- 动作 ---------- */
.province__actions {
  display: flex;
  justify-content: center;
  gap: var(--sp-3);
}

.province__cta {
  padding: 9px 28px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--accent-dim);
  color: var(--text-hi);
  font-family: var(--font-mono);
  font-size: var(--fs-body);
  letter-spacing: 0.14em;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease);
}

.province__cta:hover {
  background: rgba(79, 216, 255, 0.18);
  box-shadow: var(--glow-soft);
}

/* 次要按钮：下钻入口 */
.province__cta--ghost {
  background: transparent;
  color: var(--text-mid);
  border-color: var(--line);
}

.province__cta--ghost:hover {
  color: var(--accent);
  border-color: var(--line-strong);
  background: var(--accent-dim);
}

/* ---------- 底部说明栏 ---------- */
.province__foot {
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-4);
  padding: var(--sp-2) var(--sp-5);
  background: rgba(4, 7, 15, 0.7);
  border-top: 1px solid var(--line-faint);
  backdrop-filter: blur(8px);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  color: var(--text-lo);
}

.province__foot-warn {
  margin-left: auto;
  color: var(--accent-warm);
  opacity: 0.7;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes scan {
  0% {
    transform: translateY(-140px);
  }
  100% {
    transform: translateY(100vh);
  }
}
</style>
