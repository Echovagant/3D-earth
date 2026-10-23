<template>
  <!-- 根节点带上 learn-page：教学层的 --learn-* 颜色变量定义在它上面 -->
  <section class="learn-page psm">
    <div v-if="loading" class="learn-empty psm__state">读取省界数据…</div>

    <div v-else-if="error" class="learn-error psm__state">
      <p>{{ error }}</p>
      <button type="button" class="psm__retry" @click="load">重试</button>
    </div>

    <div v-else-if="!provinces.length" class="learn-empty psm__state">
      没有可用的省份数据。
    </div>

    <div v-else class="psm__body">
      <!-- 省份列表 -->
      <nav class="psm__list" aria-label="省份列表">
        <button
          v-for="item in provinces"
          :key="item.adcode"
          type="button"
          class="psm__item"
          :class="{ 'psm__item--active': item.adcode === current.adcode }"
          :aria-current="item.adcode === current.adcode ? 'true' : undefined"
          @click="select(item.adcode)"
        >
          <span class="psm__item-name">{{ item.name }}</span>
          <span class="psm__item-code mono">{{ item.adcode }}</span>
        </button>
      </nav>

      <!-- 选中省份：真实轮廓 + 形象比喻 -->
      <div class="psm__detail">
        <h2 class="psm__title">{{ current.name }}</h2>

        <p class="psm__label">形象比喻</p>
        <!-- 输入来自仓库内静态数据（src/data/provinceShapeMemory.js），不是用户输入；
             renderEmphasis 先转义再替换成 <strong> -->
        <p class="psm__analogy" v-html="analogyHtml"></p>

        <p class="psm__label">记忆抓手</p>
        <p class="psm__hint" v-html="hintHtml"></p>

        <figure class="psm__figure">
          <svg
            v-if="shape"
            class="psm__shape"
            :viewBox="shape.viewBox"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            :aria-label="`${current.name}的行政区划轮廓`"
          >
            <!-- fill="none" 写死在属性上：不填色，洞不会被盖成实心 -->
            <path v-for="(d, i) in shape.paths" :key="i" class="psm__path" :d="d" fill="none" />
          </svg>
          <div v-else class="learn-empty psm__shape-empty">这一省没有可显示的轮廓数据。</div>
          <figcaption class="psm__caption">
            真实行政区划边界 · 等距圆柱投影（经度 73°→135°，纬度 54°→18°）· 只描边
          </figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

import { assetUrl } from '../utils/base'
import { renderEmphasis } from '../utils/richText'
import { PROVINCE_SHAPE_MEMORIES, PROVINCE_ADCODE_PATTERN } from '../data/provinceShapeMemory'

const props = defineProps({
  /** 省界 GeoJSON（FeatureCollection）；给了就不自己请求，方便测试与复用 */
  geoJson: { type: Object, default: null },
  /** 省份索引 { provinces: { adcode: { name, abbreviation, capital } } } */
  provinceIndex: { type: Object, default: null },
  /** 形象记忆文案表：adcode → { name, analogy, hint } */
  memories: { type: Object, default: () => PROVINCE_SHAPE_MEMORIES },
  /** 初始选中的省；不填就选列表里的第一个 */
  initialAdcode: { type: String, default: '' },
})

/**
 * 等距圆柱投影。
 *
 * 经度线性映射到 x，纬度线性映射到 y；纬度越高 y 越小，所以北在上、南在下。
 * 这组常量是投影的参考范围（中国大陆大致 73°E—135°E、18°N—54°N），
 * 只是定坐标的基准面：海南的三沙群岛在 18°N 以南，线性映射照样成立。
 */
const LON_MIN = 73
const LON_MAX = 135
const LAT_MAX = 54
const SCALE = 1000 / (LON_MAX - LON_MIN)

const geoData = ref(null)
const indexData = ref(null)
const loading = ref(true)
const error = ref('')
const currentAdcode = ref(props.initialAdcode)

/** 取一个要素的几何环：外环在前，内环（洞）在后 */
function collectRings(geometry) {
  if (!geometry) return []
  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : (geometry.coordinates ?? [])
  const rings = []
  for (const polygon of polygons) {
    for (const ring of polygon) {
      if (Array.isArray(ring) && ring.length >= 3) rings.push(ring)
    }
  }
  return rings
}

/** 一个环转成一条 SVG path；洞单独成环，不会被填成实心 */
function ringToPath(ring) {
  const commands = ring.map((position, index) => {
    const [lon, lat] = position
    const x = ((lon - LON_MIN) * SCALE).toFixed(2)
    const y = ((LAT_MAX - lat) * SCALE).toFixed(2)
    return `${index === 0 ? 'M' : 'L'}${x},${y}`
  })
  return `${commands.join('')}Z`
}

const fetchJson = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const [geo, index] = await Promise.all([
      props.geoJson ? Promise.resolve(props.geoJson) : fetchJson(assetUrl('/geojson/china-provinces.json')),
      props.provinceIndex
        ? Promise.resolve(props.provinceIndex)
        : fetchJson(assetUrl('/data/provinces/index.json')),
    ])
    geoData.value = geo
    indexData.value = index
  } catch (e) {
    error.value = `无法加载省界数据（${e.message}）`
  } finally {
    loading.value = false
  }
}

/** 索引里的省份，按 adcode 升序；只收 6 位代码的省级行政区 */
const provinces = computed(() => {
  const table = indexData.value?.provinces ?? {}
  return Object.keys(table)
    .filter((adcode) => PROVINCE_ADCODE_PATTERN.test(adcode))
    .sort()
    .map((adcode) => ({
      adcode,
      name: table[adcode]?.name ?? adcode,
      abbreviation: table[adcode]?.abbreviation ?? '',
    }))
})

const current = computed(() => {
  const picked = provinces.value.find((item) => item.adcode === currentAdcode.value)
  return picked ?? provinces.value[0] ?? { adcode: '', name: '', abbreviation: '' }
})

const memory = computed(() => props.memories?.[current.value.adcode] ?? null)

const analogyHtml = computed(() =>
  memory.value ? renderEmphasis(memory.value.analogy) : '这一省还没有形象比喻。',
)

const hintHtml = computed(() => (memory.value ? renderEmphasis(memory.value.hint) : ''))

/** 选中省的真实轮廓：多面逐个拆开画，viewBox 按外接框收紧 */
const shape = computed(() => {
  const features = geoData.value?.features ?? []
  const feature = features.find((item) => String(item.properties?.adcode) === current.value.adcode)
  if (!feature) return null
  const rings = collectRings(feature.geometry)
  if (!rings.length) return null

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const ring of rings) {
    for (const position of ring) {
      const x = (position[0] - LON_MIN) * SCALE
      const y = (LAT_MAX - position[1]) * SCALE
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  const pad = Math.max(maxX - minX, maxY - minY) * 0.04
  const viewBox = [minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2]
    .map((value) => value.toFixed(2))
    .join(' ')
  return { paths: rings.map(ringToPath), viewBox }
})

const select = (adcode) => {
  currentAdcode.value = adcode
}

onMounted(load)

// 外部传入的数据变了就重新装载（父组件异步取到数据时会走这里）
watch(() => [props.geoJson, props.provinceIndex], load)
</script>

<style scoped>
.psm {
  padding: var(--sp-4) 0;
}

.psm__state {
  padding: var(--sp-5) var(--sp-4);
}

.psm__retry {
  margin-top: var(--sp-2);
  padding: var(--sp-1) var(--sp-3);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--learn-ink-soft);
  font-family: var(--font-ui);
  font-size: var(--fs-body);
  cursor: pointer;
}

.psm__retry:hover {
  border-color: var(--learn-accent);
  color: var(--learn-accent);
}

.psm__body {
  display: grid;
  grid-template-columns: minmax(9rem, 14rem) 1fr;
  gap: var(--sp-4);
  align-items: start;
}

/* 左侧省份列表 */
.psm__list {
  display: flex;
  flex-direction: column;
  max-height: 32rem;
  overflow-y: auto;
  padding: var(--sp-1);
  background: var(--learn-panel);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
}

.psm__item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-2);
  padding: var(--sp-1) var(--sp-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--learn-ink-soft);
  font-family: var(--font-ui);
  font-size: var(--fs-body);
  text-align: left;
  cursor: pointer;
}

.psm__item:hover {
  border-color: var(--learn-line);
  color: var(--learn-ink);
}

.psm__item--active {
  background: var(--learn-accent-soft);
  border-color: var(--learn-accent);
  color: var(--learn-accent);
}

.psm__item-code {
  font-size: var(--fs-label);
  color: var(--learn-ink-faint);
}

/* 右侧详情 */
.psm__detail {
  padding: var(--sp-4);
  background: var(--learn-panel);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
}

.psm__title {
  margin: 0 0 var(--sp-3);
  font-size: var(--fs-title);
  font-weight: 600;
  color: var(--learn-ink);
}

.psm__label {
  margin: 0 0 var(--sp-1);
  font-size: var(--fs-label);
  letter-spacing: 0.12em;
  color: var(--learn-ink-faint);
}

.psm__analogy {
  margin: 0 0 var(--sp-3);
  font-size: var(--fs-value);
  line-height: 1.9;
  color: var(--learn-ink);
}

.psm__hint {
  margin: 0 0 var(--sp-4);
  font-size: var(--fs-body);
  color: var(--learn-ink-soft);
}

.psm__figure {
  margin: 0;
}

.psm__shape {
  display: block;
  width: 100%;
  max-width: 32rem;
  aspect-ratio: 4 / 3;
  background: var(--learn-bg);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
}

/* 只描边：不填色，洞不会被盖成实心 */
.psm__path {
  fill: none;
  stroke: var(--learn-accent);
  stroke-width: 1.6;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

.psm__shape-empty {
  padding: var(--sp-4);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
}

.psm__caption {
  margin-top: var(--sp-2);
  font-size: var(--fs-label);
  color: var(--learn-ink-faint);
}

@media (max-width: 40rem) {
  .psm__body {
    grid-template-columns: 1fr;
  }

  .psm__list {
    max-height: 14rem;
  }
}
</style>
