<template>
  <div class="detail-page">
    <!-- 顶部状态条 -->
    <header class="detail-page__bar">
      <button class="detail-page__back" type="button" @click="goBack">
        <span class="detail-page__back-arrow">‹</span>
        <span>{{ backLabel }}</span>
      </button>
      <span class="detail-page__brand">3D-EARTH <i>/</i> CITY</span>
      <span class="detail-page__code mono">{{ adcode }}</span>
    </header>

    <div v-if="loading" class="detail-page__state">读取地级市数据…</div>

    <div v-else-if="error" class="detail-page__state detail-page__state--error">
      <p>{{ error }}</p>
      <button type="button" class="detail-page__retry" @click="load">重试</button>
    </div>

    <main v-else-if="city" class="detail-page__main">
      <!-- 标题区 -->
      <section class="detail-page__hero">
        <span class="detail-page__abbr">{{ cityName.slice(0, 1) }}</span>
        <div class="detail-page__heading">
          <h1>{{ cityName }}</h1>
          <span class="detail-page__sub mono">
            行政区划代码 {{ cityAdcode }} · 中心 {{ formatCoord(cityCenter) }}
          </span>
        </div>
      </section>

      <!-- 数据面板 -->
      <HudPanel class="detail-page__facts" title="基础数据" meta="FACTS">
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
      <section class="detail-page__intro">
        <span class="detail-page__intro-label">数据说明 / NOTES</span>
        <p>
          行政面积由本市的行政区划边界在球面上直接计算得到（球面鞋带公式，地球平均半径
          6371.0088 km）。这是「边界围合面积」，对内陆城市与官方口径通常有 1%
          左右的出入；沿海城市的行政边界包含管辖海域，因此会比常引用的陆地面积偏大
          ——深圳约 +7%、珠海约 +12%。下辖区县数取自行政区划数据本身。
        </p>
      </section>

      <div class="detail-page__actions">
        <button type="button" class="detail-page__cta" @click="goBack">返回</button>
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

