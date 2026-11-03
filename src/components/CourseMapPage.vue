<template>
  <div class="learn-page">
    <header class="learn-top">
      <button type="button" class="learn-top__back" @click="goBack">
        <span>‹</span><span>返回地球</span>
      </button>
      <span class="learn-top__title">课程地图</span>
      <span class="learn-top__spacer"></span>
      <router-link class="learn-top__back" to="/tools">互动工具</router-link>
      <router-link class="learn-top__back" to="/search">搜索</router-link>
    </header>

    <main class="learn-main">
      <h1 class="learn-h1">课程地图</h1>
      <p class="learn-lead">
        已收录的章节排成一条学习路径：按顺序学，每一章的掌握情况都摆在明面上。
      </p>

      <div v-if="loading" class="learn-empty">读取课程索引…</div>
      <div v-else-if="error" class="learn-error">
        <p>{{ error }}</p>
        <button type="button" class="learn-top__back" @click="load">重试</button>
      </div>
      <template v-else>
        <section class="learn-panel">
          <h2 class="learn-panel__title">掌握进度</h2>
          <div class="learn-bar">
            <div class="learn-bar__fill" :style="{ width: `${stats.percent}%` }"></div>
          </div>
          <p class="learn-panel__meta learn-panel__meta--spaced">
            已掌握 {{ stats.known }} 节 · 待复习 {{ stats.review }} 节 · 共 {{ stats.total }} 节
          </p>
        </section>

        <!-- 接着学：第一个还有未掌握小节的地方，点了直接进那一节 -->
        <section v-if="nextUp" class="learn-panel">
          <h2 class="learn-panel__title">接着学</h2>
          <router-link class="course-next" :to="`/lesson/${nextUp.lesson.id}`">
            <span class="course-next__ref mono">§{{ nextUp.lesson.id }}</span>
            <span class="course-next__title">{{ nextUp.lesson.title }}</span>
            <span class="course-next__arrow" aria-hidden="true">→</span>
          </router-link>
          <p class="learn-panel__meta">
            在 §{{ nextUp.chapter.id }}
            {{ nextUp.chapter.title }} 里，这是第一节还没标记「已掌握」的。
          </p>
        </section>

        <section class="learn-panel">
          <h2 class="learn-panel__title">学习路径</h2>
          <ol class="course-path">
            <li v-for="chapter in pathChapters" :key="chapter.id" class="course-path__step">
              <router-link class="course-path__link" :to="`/course/${chapter.id}`">
                <span class="learn-card__no">§{{ chapter.id }}</span>
                <span class="course-path__name">{{ chapter.title }}</span>
              </router-link>
              <p class="course-path__meta">
                共 {{ chapter.lessonCount }} 节 · 已掌握 {{ chapter.known }} · 待复习
                {{ chapter.review }}
              </p>
            </li>
          </ol>
        </section>

        <section v-if="planningChapters.length" class="learn-panel learn-panel--planning">
          <h2 class="learn-panel__title">规划中</h2>
          <p class="learn-panel__meta">
            §{{ planningChapters.map((c) => c.id).join('、§') }}，共
            {{ planningChapters.length }} 个板块尚未收录， 收录后会进入上面的学习路径。
          </p>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { loadKnowledgeIndex, loadChapterLessons } from '../utils/knowledge'
import { readMastery, masteryStats } from '../utils/mastery'

const router = useRouter()

const loading = ref(true)
const error = ref('')
const chapters = ref([])
const mastery = ref({})
/** 每个已收录章的小节列表：「接着学」要从这里找第一个未掌握的小节 */
const chapterLessons = ref(new Map())

/**
 * 掌握进度不依赖全量正文：
 * 总数用索引里有内容的章的 lessonCount 求和，已掌握/待复习从掌握度状态里数。
 * 拉全量正文的话，任何一章的分片失败都会让整页落进错误态——
 * 而这一页要的只是数量。
 */
const stats = computed(() => {
  // 掌握度是 localStorage 里的自由键，可能混进范围外的小节 id
  // （旧版本留下的、还没收录的章）。只统计已收录章的 id，
  // 否则「已掌握 N 节」会超过「共 98 节」，进度条也会超过 100%。
  const inScope = new Set(chapters.value.filter((c) => c.hasContent).map((c) => c.id))
  const ids = Object.keys(mastery.value).filter((id) => inScope.has(Number(id.split('.')[0])))
  const counted = masteryStats(ids, mastery.value)
  const total = chapters.value.reduce((sum, c) => sum + (c.hasContent ? c.lessonCount : 0), 0)
  return {
    known: counted.known,
    review: counted.review,
    total,
    percent: total === 0 ? 0 : Math.min(100, Math.round((counted.known / total) * 100)),
  }
})

/** 学习路径：已收录章按编号升序，每章从掌握度状态里聚合出自己的分布 */
const pathChapters = computed(() => {
  return chapters.value
    .filter((c) => c.hasContent)
    .map((c) => {
      const ids = Object.keys(mastery.value).filter((id) => Number(id.split('.')[0]) === c.id)
      const known = ids.filter((id) => mastery.value[id] === 'known').length
      const review = ids.filter((id) => mastery.value[id] === 'review').length
      return { ...c, known, review }
    })
})

const planningChapters = computed(() => chapters.value.filter((c) => !c.hasContent))

/**
 * 接着学：沿学习路径找第一个「还没标记掌握」的小节。
 *
 * 小节列表靠逐章拉分片，单章失败只让那一章退出推荐，不影响整页；
 * 分片全失败时（测试环境）这块整体不渲染，路径上的掌握分布不受影响
 * （它们从掌握度状态直接聚合，不依赖分片）。
 */
const nextUp = computed(() => {
  for (const chapter of pathChapters.value) {
    const lessons = chapterLessons.value.get(chapter.id) ?? []
    const lesson = lessons.find((l) => mastery.value[l.id] !== 'known')
    if (lesson) return { chapter, lesson }
  }
  return null
})

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const index = await loadKnowledgeIndex()
    chapters.value = index.chapters ?? []
    mastery.value = readMastery()
    const withContent = chapters.value.filter((c) => c.hasContent)
    const lists = await Promise.allSettled(withContent.map((c) => loadChapterLessons(c.id)))
    const map = new Map()
    withContent.forEach((c, i) => {
      if (lists[i].status === 'fulfilled') map.set(c.id, lists[i].value)
    })
    chapterLessons.value = map
  } catch (e) {
    error.value = `无法加载课程索引（${e.message}）`
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
