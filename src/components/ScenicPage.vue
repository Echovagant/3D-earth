<template>
  <div class="detail-page scenic-page">
    <header class="detail-page__bar">
      <button class="detail-page__back" type="button" @click="goBack">
        <span class="detail-page__back-arrow">‹</span>
        <span>返回地球</span>
      </button>
      <span class="detail-page__brand">3D-EARTH <i>/</i> SCENIC</span>
      <router-link class="detail-page__licenses" to="/licenses">许可</router-link>
      <span class="detail-page__code mono">{{ adcode }}</span>
    </header>

    <div v-if="loading" class="detail-page__state">读取景区数据…</div>

    <div v-else-if="error" class="detail-page__state detail-page__state--error">
      <p>{{ error }}</p>
      <button type="button" class="detail-page__retry" @click="load">重试</button>
    </div>

    <main v-else-if="scenic" class="detail-page__main">
      <section class="detail-page__hero">
        <span class="detail-page__abbr">{{ scenic.name.slice(0, 1) }}</span>
        <div class="detail-page__heading">
          <h1>{{ scenic.name }}</h1>
          <span class="detail-page__sub mono">
            <template v-if="scenic.level">{{ scenic.level }} · </template>
            {{ provinceName }} · {{ adcode }}
          </span>
        </div>
      </section>

      <section v-if="scenic.images.length" class="scenic-page__section">
        <ScenicGallery :images="scenic.images" :name="scenic.name" />
      </section>

      <section class="detail-page__intro">
        <span class="detail-page__intro-label">简介 / BRIEF</span>
        <p>{{ scenic.summary }}</p>
      </section>

      <section v-if="scenic.highlights?.length" class="detail-page__intro">
        <span class="detail-page__intro-label">看点 / HIGHLIGHTS</span>
        <ul class="detail-page__tags">
          <li v-for="item in scenic.highlights" :key="item" class="detail-page__tag">
            <span class="detail-page__tag-dot"></span>{{ item }}
          </li>
        </ul>
      </section>

      <section class="detail-page__intro">
        <span class="detail-page__intro-label">位置 / LOCATION</span>
        <p>
          <span class="mono">{{ scenic.coords[0].toFixed(4) }}°N, {{ scenic.coords[1].toFixed(4) }}°E</span>
          <router-link class="scenic-page__earth-link" :to="earthLink">在地球上看看 →</router-link>
        </p>
      </section>

      <!-- 图片来源与许可：署名义务在这里履行，逐张一行 -->
      <section class="detail-page__intro">
        <span class="detail-page__intro-label">图片来源与许可 / CREDITS</span>
        <ul v-if="scenic.images.length" class="scenic-page__credits">
          <li v-for="image in scenic.images" :key="image.file" class="scenic-page__credit">
            <a :href="image.sourceUrl" target="_blank" rel="noreferrer noopener">{{ image.sourceUrl }}</a>
            <span class="scenic-page__credit-meta">
              作者：{{ image.author || '未署名' }} · 许可：{{ image.license || '未知' }}
            </span>
          </li>
        </ul>
        <p v-else class="scenic-page__credit-empty">本景点暂无图片。</p>
      </section>

      <section v-if="linkedLessons.length" class="detail-page__intro">
        <span class="detail-page__intro-label">本省的相关知识点 / LESSONS</span>
        <ul class="detail-page__tags">
          <li v-for="lesson in linkedLessons" :key="lesson.id" class="detail-page__tag">
            <router-link class="detail-page__tag-link" :to="`/lesson/${lesson.id}`">
              §{{ lesson.id }} {{ lesson.title }}
            </router-link>
          </li>
        </ul>
      </section>

      <section v-if="nextScenic" class="detail-page__intro">
        <span class="detail-page__intro-label">下一个景点 / NEXT</span>
        <router-link class="scenic-page__next" :to="`/scenic/${adcode}/${nextScenic.id}`">
          {{ nextScenic.name }} →
        </router-link>
      </section>

      <div class="detail-page__actions">
        <button type="button" class="detail-page__cta" @click="goBack">返回地球</button>
      </div>
    </main>

    <footer class="detail-page__foot">
      <span class="mono">数据 public/data/scenic/{{ adcode }}.json</span>
      <span class="mono">图片授权详见站内许可页</span>
    </footer>
  </div>
</template>

<script setup>
/**
 * 景区详情页：/scenic/:adcode/:id
 *
 * 与省详情页同构（深底空间层），但正文是「看」的：图廊、看点、坐标与署名。
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import ScenicGallery from './ScenicGallery.vue'
import { findScenic, loadScenicByProvince } from '../utils/scenic.js'
import { loadAllLessons, lessonsByProvince } from '../utils/knowledge.js'
import { assetUrl } from '../utils/base'
import { createRequestGuard } from '../utils/latestRequest'

const props = defineProps({
  adcode: { type: String, required: true },
  id: { type: String, required: true },
})

const router = useRouter()

const scenic = ref(null)
/** 本省的全部景区：算「下一个景点」要用 */
const provinceScenics = ref([])
const provinceName = ref('')
const linkedLessons = ref([])
const loading = ref(true)
const error = ref('')

// 换景区是连续的两次请求：慢的那次后到会把新景区的数据覆盖成上一个。
const requests = createRequestGuard()
const lessonRequests = createRequestGuard()

/** 「在地球上看看」指向地球页的定位参数：纬度在前，经度在后 */
const earthLink = computed(() => {
  const coords = scenic.value?.coords
  if (!Array.isArray(coords) || coords.length < 2) return '/'
  return { path: '/', query: { at: `${coords[0]},${coords[1]}` } }
})

/** 下一个景点：本省清单里的下一个，最后一个回到第一个 */
const nextScenic = computed(() => {
  const list = provinceScenics.value
  if (!list.length) return null
  const i = list.findIndex((s) => s.id === props.id)
  if (i < 0) return list[0]
  return list[(i + 1) % list.length]
})

const load = async () => {
  const token = requests.begin()
  loading.value = true
  error.value = ''
  scenic.value = null
  try {
    const list = await loadScenicByProvince(props.adcode)
    if (!requests.isCurrent(token)) return
    provinceScenics.value = list
    const found = await findScenic(props.adcode, props.id)
    if (!requests.isCurrent(token)) return
    if (!found) {
      error.value = '没有这个景点'
      return
    }
    scenic.value = found
  } catch (e) {
    if (!requests.isCurrent(token)) return
    error.value = `无法加载该景点的数据（${e.message}）`
  } finally {
    if (requests.isCurrent(token)) loading.value = false
  }
}

const loadLessons = async () => {
  const token = lessonRequests.begin()
  const adcode = props.adcode
  linkedLessons.value = []
  try {
    const lessons = await loadAllLessons()
    if (!lessonRequests.isCurrent(token)) return
    linkedLessons.value = lessonsByProvince(lessons, adcode)
  } catch {
    if (!lessonRequests.isCurrent(token)) return
    linkedLessons.value = []
  }
}

/** 省名从省份数据里取；取不到就先显示代码 */
const loadProvinceName = async () => {
  try {
    const res = await fetch(assetUrl(`/data/provinces/${props.adcode}.json`))
    if (!res.ok) return
    const payload = await res.json()
    provinceName.value = payload.name ?? props.adcode
  } catch {
    provinceName.value = props.adcode
  }
}

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  load()
  loadLessons()
  loadProvinceName()
})

onBeforeUnmount(() => {
  requests.dispose()
  lessonRequests.dispose()
})

// 路由只换景区 id 时组件实例会被复用，不盯着 id 的话内容会停在上一处
watch(
  () => [props.adcode, props.id],
  () => {
    load()
    loadLessons()
    loadProvinceName()
  },
)
</script>

<style scoped>
/*
 * 景区卡片与图廊用的是 --learn-* 色板（教学层的亮底取值）。
 * 这一页是深底空间层，把这几个变量换成本层的深色取值，
 * 组件本身不写死色值，两种底色下都能看清。
 */
.scenic-page {
  --learn-panel: var(--bg-panel);
  --learn-ink: var(--text-hi);
  --learn-ink-soft: var(--text-mid);
  --learn-ink-faint: var(--text-lo);
  --learn-line: var(--line);
  --learn-accent: var(--accent);
  --learn-accent-soft: var(--accent-dim);
  --learn-warn: var(--accent-warm);
}

.scenic-page__section {
  margin-bottom: var(--sp-5);
}

.scenic-page__earth-link {
  margin-left: var(--sp-3);
  color: var(--learn-accent);
  text-decoration: none;
}

.scenic-page__earth-link:hover {
  text-decoration: underline;
}

.scenic-page__credits {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.scenic-page__credit {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  font-size: 13px;
  color: var(--learn-ink-soft);
  word-break: break-all;
}

.scenic-page__credit a {
  color: var(--learn-accent);
}

.scenic-page__credit-meta {
  color: var(--learn-ink-faint);
}

.scenic-page__credit-empty {
  margin: 0;
  font-size: 13px;
  color: var(--learn-ink-faint);
}

.scenic-page__next {
  color: var(--learn-accent);
  text-decoration: none;
}

.scenic-page__next:hover {
  text-decoration: underline;
}
</style>
