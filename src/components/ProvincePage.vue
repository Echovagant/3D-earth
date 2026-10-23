<template>
  <div class="detail-page">
    <!-- 顶部状态条 -->
    <header class="detail-page__bar">
      <button class="detail-page__back" type="button" @click="goBack">
        <span class="detail-page__back-arrow">‹</span>
        <span>返回地球</span>
      </button>
      <span class="detail-page__brand">3D-EARTH <i>/</i> PROVINCE</span>
      <router-link class="detail-page__licenses" to="/licenses">许可</router-link>
      <span class="detail-page__code mono">{{ route.params.adcode || '——' }}</span>
    </header>

    <div v-if="loading" class="detail-page__state">读取数据中…</div>

    <div v-else-if="error" class="detail-page__state detail-page__state--error">
      <p>{{ error }}</p>
      <button type="button" class="detail-page__retry" @click="load">重试</button>
    </div>

    <main v-else-if="data" class="detail-page__main">
      <!-- 标题区 -->
      <section class="detail-page__hero">
        <span class="detail-page__abbr">{{ data.abbreviation }}</span>
        <div class="detail-page__heading">
          <h1>{{ data.name }}</h1>
          <span class="detail-page__sub mono">
            行政区划代码 {{ data.adcode }} · 中心 {{ data.center[0].toFixed(2) }}°E
            {{ data.center[1].toFixed(2) }}°N
          </span>
        </div>
      </section>

      <!-- 数据面板 -->
      <HudPanel class="detail-page__facts" title="基础数据" meta="FACTS">
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
      <section class="detail-page__intro">
        <span class="detail-page__intro-label">简介 / BRIEF</span>
        <p>{{ data.intro }}</p>
      </section>

      <!-- 数据口径说明 -->
      <section class="detail-page__intro">
        <span class="detail-page__intro-label">数据口径 / NOTES</span>
        <p>
          <b>边界围合面积</b>由本省的行政区划边界在球面上直接计算得到（球面鞋带公式，
          地球平均半径 6371.0088 km）；它随边界数据自动更新。<b>公布面积</b>是统计口径的公开数值，
          沿海省份的行政边界包含管辖海域，前者因此会略大于后者。人口取自{{ data.populationSource }}口径的公开统计值，
          各省统计年份不完全一致，34 个省级行政区合计与全国人口相差约 2%。
        </p>
      </section>

      <!-- 标签 -->
      <ul class="detail-page__tags">
        <li v-for="tag in data.highlights" :key="tag" class="detail-page__tag">
          <span class="detail-page__tag-dot"></span>{{ tag }}
        </li>
      </ul>

      <!-- 本省关联的知识点 -->
      <section v-if="linkedLessons.length" class="detail-page__intro">
        <span class="detail-page__intro-label">关联知识点 / LESSONS</span>
        <ul class="detail-page__tags">
          <li v-for="lesson in linkedLessons" :key="lesson.id" class="detail-page__tag">
            <router-link class="detail-page__tag-link" :to="`/lesson/${lesson.id}`">
              §{{ lesson.id }} {{ lesson.title }}
            </router-link>
          </li>
        </ul>
      </section>

      <div class="detail-page__actions">
        <button type="button" class="detail-page__cta" @click="goBack">返回地球</button>
      </div>
    </main>

    <!-- 底部数据说明栏 -->
    <footer class="detail-page__foot">
      <span class="mono">坐标系 WGS-84</span>
      <span class="mono">数据来源 public/data/provinces/{{ route.params.adcode }}.json</span>
      <span class="mono detail-page__foot-warn">边界围合面积由行政区划边界在球面上直接计算得到</span>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HudPanel from './HudPanel.vue'
import { formatArea } from '../utils/areaData'
import { loadAllLessons, lessonsByProvince } from '../utils/knowledge'
import { assetUrl } from '../utils/base'
import { createRequestGuard } from '../utils/latestRequest'

const route = useRoute()
const router = useRouter()

const data = ref(null)
const loading = ref(true)
const error = ref('')
// 本省关联的知识点（按 entities.provinces 反查）
const linkedLessons = ref([])

// 换省是连续的两次请求：慢的那次后到时会把新省的数据覆盖成上一省。
// 每次请求领一个序号，只有最新序号的响应才允许写状态。
const provinceRequests = createRequestGuard()
const lessonRequests = createRequestGuard()

const load = async () => {
  const token = provinceRequests.begin()
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(assetUrl(`/data/provinces/${route.params.adcode}.json`))
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const payload = await res.json()
    // 序号已经过时：这是上一条数据的响应，直接丢掉
    if (!provinceRequests.isCurrent(token)) return
    data.value = payload
  } catch (e) {
    if (!provinceRequests.isCurrent(token)) return
    error.value = `无法加载该省份的数据（${e.message}）`
  } finally {
    // 只有最新那次请求能收尾 loading：旧请求收尾会把新一轮的加载态提前关掉
    if (provinceRequests.isCurrent(token)) loading.value = false
  }
}

const loadLessons = async () => {
  const token = lessonRequests.begin()
  // 记下这次是给哪个省取的关联知识点：响应回来时页面可能已经换省了
  const adcode = route.params.adcode
  // 换省时先清空旧结果，否则切换过程中会短暂显示上一个省的关联知识点
  linkedLessons.value = []
  try {
    const lessons = await loadAllLessons()
    if (!lessonRequests.isCurrent(token)) return
    linkedLessons.value = lessonsByProvince(lessons, adcode)
  } catch {
    if (!lessonRequests.isCurrent(token)) return
    // 知识数据挂了就只是没有这个区块，不影响省份页本身
    linkedLessons.value = []
  }
}

const goBack = () => {
  // 返回地球页面
  router.push('/')
}

onMounted(() => {
  load()
  loadLessons()
})

onBeforeUnmount(() => {
  // 组件已经卸载：迟到的响应不能再写状态
  provinceRequests.dispose()
  lessonRequests.dispose()
})

// 路由只换省代码时 vue-router 会复用同一个组件实例（不会重新挂载），
// 不盯着 adcode 的话，URL 已经变成另一个省，页面还停在上一个省的数据
watch(
  () => route.params.adcode,
  () => {
    load()
    loadLessons()
  },
)
</script>

