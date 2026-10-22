<template>
  <div class="learn-page">
    <header class="learn-top">
      <button type="button" class="learn-top__back" @click="goBack">
        <span>‹</span><span>返回</span>
      </button>
      <span class="learn-top__title">§{{ lessonId }}</span>
      <span class="learn-top__spacer"></span>
      <router-link class="learn-top__back" to="/course">课程地图</router-link>
    </header>

    <main class="learn-main">
      <div v-if="loading" class="learn-empty">读取知识点…</div>
      <div v-else-if="error" class="learn-error">
        <p>{{ error }}</p>
        <button type="button" class="learn-top__back" @click="load">重试</button>
      </div>
      <template v-else-if="lesson">
        <section class="learn-panel">
          <h1 class="learn-h1">§{{ lesson.id }} {{ lesson.title }}</h1>
          <p class="learn-lead">{{ lesson.summary }}</p>
          <p style="margin: 0">
            <a
              class="learn-tag"
              :href="videoUrl"
              target="_blank"
              rel="noreferrer noopener"
              >本节视频：{{ lesson.video.label }} →</a
            >
            <span v-if="lesson.sourceLabel" class="learn-card__meta">
              教材：{{ lesson.sourceLabel }}
            </span>
          </p>
        </section>

        <section v-if="lesson.exam" class="learn-panel">
          <h2 class="learn-panel__title">高考定位</h2>
          <p class="learn-lead learn-lead--block" v-html="emph(lesson.exam)" />
        </section>

        <section v-if="lesson.outline.length" class="learn-panel">
          <h2 class="learn-panel__title">知识骨架</h2>
          <ul class="learn-list">
            <li v-for="(item, i) in lesson.outline" :key="i" class="learn-item" v-html="emph(item)" />
          </ul>
        </section>

        <section v-if="lesson.tables.length" class="learn-panel">
          <h2 class="learn-panel__title">表格</h2>
          <table v-for="(t, ti) in lesson.tables" :key="ti" class="learn-table">
            <thead>
              <tr>
                <th v-for="(h, hi) in t.header" :key="hi">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, ri) in t.rows" :key="ri">
                <td v-for="(c, ci) in row" :key="ci">{{ c }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section v-if="lesson.mustKnow.length" class="learn-panel">
          <h2 class="learn-panel__title">要背</h2>
          <ul class="learn-list">
            <li v-for="(item, i) in lesson.mustKnow" :key="i" class="learn-item" v-html="emph(item)" />
          </ul>
        </section>

        <section v-if="lesson.pitfalls.length" class="learn-panel">
          <h2 class="learn-panel__title">易错点</h2>
          <ul class="learn-list">
            <li v-for="(item, i) in lesson.pitfalls" :key="i" class="learn-item" v-html="emph(item)" />
          </ul>
        </section>

        <section v-if="lesson.questionTypes.length" class="learn-panel">
          <h2 class="learn-panel__title">典型题型</h2>
          <ul class="learn-list">
            <li
              v-for="(item, i) in lesson.questionTypes"
              :key="i"
              class="learn-item"
              v-html="emph(item)"
            />
          </ul>
        </section>

        <section v-if="refs.length" class="learn-panel">
          <h2 class="learn-panel__title">前置与后续</h2>
          <p style="margin: 0 0 6px">
            <span class="learn-card__meta">前置：</span>
            <template v-for="ref in lesson.prereq" :key="`p${ref}`">
              <router-link
                v-if="isKnown(ref)"
                class="learn-tag"
                :to="`/lesson/${ref}`"
                >{{ refLabel(ref) }}</router-link
              >
              <span v-else class="learn-tag learn-tag--muted" :title="`第 ${ref.split('.')[0]} 章尚未收录`">
                {{ refLabel(ref) }}
              </span>
            </template>
            <span v-for="c in lesson.prereqChapters" :key="`pc${c}`" class="learn-tag learn-tag--muted">
              {{ chapterLabel(c) }}
            </span>
            <span v-if="!lesson.prereq.length && !lesson.prereqChapters.length" class="learn-card__meta">无</span>
          </p>
          <p style="margin: 0">
            <span class="learn-card__meta">后续：</span>
            <template v-for="ref in lesson.next" :key="`n${ref}`">
              <router-link
                v-if="isKnown(ref)"
                class="learn-tag"
                :to="`/lesson/${ref}`"
                >{{ refLabel(ref) }}</router-link
              >
              <span v-else class="learn-tag learn-tag--muted" :title="`第 ${ref.split('.')[0]} 章尚未收录`">
                {{ refLabel(ref) }}
              </span>
            </template>
            <span v-for="c in lesson.nextChapters" :key="`nc${c}`" class="learn-tag learn-tag--muted">
              {{ chapterLabel(c) }}
            </span>
            <span v-if="!lesson.next.length && !lesson.nextChapters.length" class="learn-card__meta">无</span>
          </p>
        </section>

        <section v-if="lesson.entities.provinces.length" class="learn-panel">
          <h2 class="learn-panel__title">关联地区</h2>
          <router-link
            v-for="adcode in lesson.entities.provinces"
            :key="adcode"
            class="learn-tag"
            :to="`/province/${adcode}`"
            >{{ provinceName(adcode) }}</router-link
          >
        </section>

        <section class="learn-panel">
          <h2 class="learn-panel__title">掌握情况</h2>
          <button type="button" class="learn-top__back" @click="mark('known')">标记已掌握</button>
          <button type="button" class="learn-top__back" @click="mark('review')">标记待复习</button>
          <!-- 取消标记要传 null：传空串会被 setMastery 忽略，旧的标记会留在存储里 -->
          <button type="button" class="learn-top__back" @click="clearMark">清除标记</button>
          <span v-if="state" class="learn-tag">{{ state === 'known' ? '已掌握' : '待复习' }}</span>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loadAllLessons, lessonRefLabel, loadKnowledgeIndex } from '../utils/knowledge'
import { readMastery, setMastery } from '../utils/mastery'
import { renderEmphasis } from '../utils/richText'

const route = useRoute()
const router = useRouter()

const lessonId = computed(() => route.params.lessonId)
const lesson = ref(null)
const allLessons = ref([])
const chapterTitles = ref([])
const loading = ref(true)
const error = ref('')
const state = ref('')

const emph = (text) => renderEmphasis(text)

const videoUrl = computed(() =>
  lesson.value
    ? `https://www.bilibili.com/video/${lesson.value.video.bvid}?p=${lesson.value.video.p}`
    : '',
)
const refs = computed(() => [...(lesson.value?.prereq ?? []), ...(lesson.value?.next ?? [])])

const refLabel = (id) => lessonRefLabel(id, allLessons.value)

/** 该节是否已收录——未收录的引用渲染成纯文本，不能做成会 404 的链接 */
const isKnown = (id) => allLessons.value.some((l) => l.id === id)

/** 章级引用：`3` → `§3 地球的自转`。章名从课程索引里取。 */
const chapterLabel = (id) => {
  const chapter = chapterTitles.value.find((c) => c.id === Number(id))
  return chapter ? `§${chapter.id} ${chapter.title}` : `§${id}`
}

const provinceName = (adcode) => {
  const map = {
    110000: '北京市', 120000: '天津市', 130000: '河北省', 140000: '山西省',
    150000: '内蒙古自治区', 210000: '辽宁省', 220000: '吉林省', 230000: '黑龙江省',
    310000: '上海市', 320000: '江苏省', 330000: '浙江省', 340000: '安徽省',
    350000: '福建省', 360000: '江西省', 370000: '山东省', 410000: '河南省',
    420000: '湖北省', 430000: '湖南省', 440000: '广东省', 450000: '广西壮族自治区',
    460000: '海南省', 500000: '重庆市', 510000: '四川省', 520000: '贵州省',
    530000: '云南省', 540000: '西藏自治区', 610000: '陕西省', 620000: '甘肃省',
    630000: '青海省', 640000: '宁夏回族自治区', 650000: '新疆维吾尔自治区',
    710000: '台湾省', 810000: '香港特别行政区', 820000: '澳门特别行政区',
  }
  return map[adcode] ?? adcode
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const [lessons, index] = await Promise.all([loadAllLessons(), loadKnowledgeIndex()])
    allLessons.value = lessons
    chapterTitles.value = index.chapters ?? []
    lesson.value = allLessons.value.find((l) => l.id === lessonId.value) ?? null
    if (!lesson.value) throw new Error('没有这个知识点')
    state.value = readMastery()[lesson.value.id] ?? ''
  } catch (e) {
    error.value = `无法加载该知识点（${e.message}）`
  } finally {
    loading.value = false
  }
}

const mark = (value) => {
  setMastery(lesson.value.id, value)
  state.value = value
}

/** 取消标记：null 表示清除，空串会被 setMastery 当成非法值忽略 */
const clearMark = () => {
  setMastery(lesson.value.id, null)
  state.value = ''
}

const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push('/course')
}

onMounted(load)
</script>

<style scoped>
.learn-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.learn-table th,
.learn-table td {
  padding: 6px 10px;
  border: 1px solid var(--learn-line);
  text-align: left;
}

.learn-table th {
  background: var(--learn-accent-soft);
  color: var(--learn-accent);
}
</style>
