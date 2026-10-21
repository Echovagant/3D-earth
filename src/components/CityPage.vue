<template>
  <div class="province">
    <!-- 顶部状态条 -->
    <header class="province__bar">
      <button class="province__back" type="button" @click="goBack">
        <span class="province__back-arrow">‹</span>
        <span>{{ backLabel }}</span>
      </button>
      <span class="province__brand">3D-EARTH <i>/</i> CITY</span>
      <span class="province__code mono">{{ adcode }}</span>
    </header>

    <div v-if="loading" class="province__state">读取地级市数据…</div>

    <div v-else-if="error" class="province__state province__state--error">
      <p>{{ error }}</p>
      <button type="button" class="province__retry" @click="load">重试</button>
    </div>

    <main v-else-if="city" class="province__main">
      <!-- 标题区 -->
      <section class="province__hero">
        <span class="province__abbr">{{ cityName.slice(0, 1) }}</span>
        <div class="province__heading">
          <h1>{{ cityName }}</h1>
          <span class="province__sub mono">
            行政区划代码 {{ cityAdcode }} · 中心 {{ formatCoord(cityCenter) }}
          </span>
        </div>
      </section>

      <!-- 数据面板 -->
      <HudPanel class="province__facts" title="基础数据" meta="FACTS">
        <dl class="facts">
          <div class="facts__cell">
            <dt>所属省份</dt>
            <dd>{{ provinceName || '—' }}</dd>
          </div>
          <div class="facts__cell">
            <dt>行政面积</dt>
            <dd class="mono">{{ formatArea(areaKm2) }}</dd>
          </div>
          <div class="facts__cell">
            <dt>下辖区县</dt>
            <dd class="mono">{{ cityChildrenNum }} 个</dd>
          </div>
          <div class="facts__cell">
            <dt>几何中心</dt>
            <dd class="mono">{{ formatCoord(cityCentroid) }}</dd>
          </div>
        </dl>
      </HudPanel>

      <!-- 说明 -->
      <section class="province__intro">
        <span class="province__intro-label">数据说明 / NOTES</span>
        <p>
          行政面积由本市的行政区划边界在球面上直接计算得到（球面鞋带公式，地球平均半径
          6371.0088 km）。这是「边界围合面积」，对内陆城市与官方口径通常有 1%
          左右的出入；沿海城市的行政边界包含管辖海域，因此会比常引用的陆地面积偏大
          ——深圳约 +7%、珠海约 +12%。下辖区县数取自行政区划数据本身。
        </p>
      </section>

      <div class="province__actions">
        <button type="button" class="province__cta" @click="goBack">返回</button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HudPanel from './HudPanel.vue'
import { featureAreaKm2, formatArea, loadAreaData, provinceAdcodeOf } from '../utils/areaData'

const props = defineProps({
  /** 地级市 adcode，前 2 位指向所属省 */
  adcode: { type: String, required: true },
})

const router = useRouter()

const city = ref(null)
const provinceName = ref('')
const loading = ref(true)
const error = ref('')

/**
 * 所属省的 adcode。
 *
 * 地级市 adcode 的前 2 位就是省级代码（44xxxx → 440000），
 * 这是首次定位省边界文件的依据；拿到要素后再用数据里的 parent.adcode 校正。
 */
const provinceAdcode = ref('')

const areaKm2 = computed(() => (city.value ? featureAreaKm2(city.value) : 0))

/** 要素属性：GeoJSON 的名称、代码等都在 properties 下 */
const cityProps = computed(() => city.value?.properties ?? {})
const cityName = computed(() => cityProps.value.name ?? '')
const cityAdcode = computed(() => String(cityProps.value.adcode ?? props.adcode))
const cityChildrenNum = computed(() => cityProps.value.childrenNum ?? 0)
const cityCenter = computed(() => cityProps.value.center ?? null)
const cityCentroid = computed(() => cityProps.value.centroid ?? null)

/** 坐标格式化：经度在前、纬度在后 */
const formatCoord = (coord) =>
  Array.isArray(coord) && coord.length >= 2
    ? `${coord[0].toFixed(4)}°E ${coord[1].toFixed(4)}°N`
    : '—'

const backLabel = computed(() => '返回地级市')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    // 城市没有独立的边界文件，从所属省的地级市集合里取
    const candidateProvinceAdcode = provinceAdcodeOf(props.adcode)
    const [cities, nationalResponse] = await Promise.all([
      loadAreaData(candidateProvinceAdcode),
      fetch('/geojson/china-provinces.json'),
    ])
    if (!nationalResponse.ok) throw new Error(`HTTP ${nationalResponse.status}`)

    const national = await nationalResponse.json()

    const feature = cities.features.find(
      (item) => String(item.properties.adcode) === props.adcode,
    )
    if (!feature) throw new Error('未找到该地级市')
    city.value = feature

    // 所属省以数据自带的 parent 为准
    provinceAdcode.value = String(
      feature.properties?.parent?.adcode ?? candidateProvinceAdcode,
    )
    provinceName.value =
      national.features.find(
        (item) => String(item.properties.adcode) === provinceAdcode.value,
      )?.properties?.name ?? ''
  } catch (e) {
    error.value = `无法加载地级市数据（${e.message}）`
  } finally {
    loading.value = false
  }
}

const goBack = () => router.push(`/drill/${provinceAdcode.value}`)

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

.province__state {
  padding: 80px var(--sp-5);
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.16em;
  color: var(--text-lo);
}

.province__state--error {
  color: #ff9a9a;
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

.province__main {
  position: relative;
  z-index: 1;
  max-width: 860px;
  margin: 0 auto;
  padding: var(--sp-6) var(--sp-5);
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

.province__actions {
  display: flex;
  justify-content: center;
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
</style>
