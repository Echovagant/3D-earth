<template>
  <div class="learn-page">
    <header class="learn-top">
      <button type="button" class="learn-top__back" @click="goBack">
        <span>‹</span><span>返回</span>
      </button>
      <span class="learn-top__title">{{ title || `第 ${chapterId} 章` }}</span>
      <span class="learn-top__spacer"></span>
      <router-link class="learn-top__back" to="/course">课程地图</router-link>
    </header>

    <main class="learn-main">
      <div v-if="loading" class="learn-empty">读取小节…</div>
      <div v-else-if="error" class="learn-error">
        <p>{{ error }}</p>
        <button type="button" class="learn-top__back" @click="load">重试</button>
      </div>
      <div v-else-if="lessons.length === 0" class="learn-empty">
        这一章还在规划中。
      </div>
      <template v-else>
        <section class="learn-panel">
          <h1 class="learn-h1">第 {{ chapterId }} 章<template v-if="title"> · {{ title }}</template></h1>
          <p class="learn-lead">共 {{ lessons.length }} 个知识点，按课程顺序排列。</p>
        </section>

        <section class="learn-panel">
          <ul class="learn-list">
            <li v-for="lesson in lessons" :key="lesson.id" class="learn-item">
              <router-link class="learn-item__title" :to="`/lesson/${lesson.id}`">
                §{{ lesson.id }} {{ lesson.title }}
              </router-link>
              <p class="learn-item__summary">{{ lesson.summary }}</p>
              <span v-if="mastery[lesson.id]" class="learn-tag">
                {{ mastery[lesson.id] === 'known' ? '已掌握' : '待复习' }}
              </span>
            </li>
          </ul>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loadKnowledgeIndex, loadChapterLessons } from '../utils/knowledge'
import { readMastery } from '../utils/mastery'

const route = useRoute()
const router = useRouter()

const chapterId = computed(() => route.params.chapterId)
const lessons = ref([])
const title = ref('')
const loading = ref(true)
const error = ref('')
const mastery = ref({})

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    // 章节标题在课程索引里，小节在分片文件里；先看索引才知道这一章有没有内容
    const index = await loadKnowledgeIndex()
    const chapter = (index.chapters ?? []).find((c) => c.id === Number(chapterId.value))
    title.value = chapter?.title ?? ''
    lessons.value = chapter?.hasContent
      ? await loadChapterLessons(Number(chapterId.value))
      : []
    mastery.value = readMastery()
  } catch (e) {
    error.value = `无法加载该章的内容（${e.message}）`
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push('/course')
}

onMounted(load)
</script>
