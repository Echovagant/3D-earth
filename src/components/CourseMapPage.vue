<template>
  <div class="learn-page">
    <header class="learn-top">
      <button type="button" class="learn-top__back" @click="goBack">
        <span>‹</span><span>返回地球</span>
      </button>
      <span class="learn-top__title">课程地图</span>
      <span class="learn-top__spacer"></span>
      <router-link class="learn-top__back" to="/search">搜索</router-link>
    </header>

    <main class="learn-main">
      <h1 class="learn-h1">课程地图</h1>
      <p class="learn-lead">
        高中地理的 15 个板块。当前已有提纲的章节可以直接点开，其余标注为规划中。
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
          <p class="learn-card__meta" style="margin-top: 8px">
            已掌握 {{ stats.known }} 节 · 待复习 {{ stats.review }} 节 · 共 {{ stats.total }} 节
            （{{ stats.percent }}%）
          </p>
        </section>

        <section class="learn-panel">
          <h2 class="learn-panel__title">15 个板块</h2>
          <div class="learn-grid">
            <component
              :is="chapter.hasContent ? 'router-link' : 'div'"
              v-for="chapter in chapters"
              :key="chapter.id"
              class="learn-card"
              :class="{ 'learn-card--empty': !chapter.hasContent }"
              :to="chapter.hasContent ? `/course/${chapter.id}` : undefined"
            >
              <span class="learn-card__no">§{{ chapter.id }}</span>
              <p class="learn-card__name">{{ chapter.title }}</p>
              <span class="learn-card__meta">
                {{ chapter.hasContent ? `${chapter.lessonCount} 个知识点` : '规划中' }}
              </span>
            </component>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { loadKnowledgeIndex, loadAllLessons } from '../utils/knowledge'
import { readMastery, masteryStats } from '../utils/mastery'

const router = useRouter()

const loading = ref(true)
const error = ref('')
const chapters = ref([])
const lessonIds = ref([])
const mastery = ref({})

const stats = computed(() => masteryStats(lessonIds.value, mastery.value))

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const index = await loadKnowledgeIndex()
    chapters.value = index.chapters ?? []
    const lessons = await loadAllLessons()
    lessonIds.value = lessons.map((l) => l.id)
    mastery.value = readMastery()
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
