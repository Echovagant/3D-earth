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
        {{ emptyText }}
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loadKnowledgeIndex, loadChapterLessons } from '../utils/knowledge'
import { readMastery } from '../utils/mastery'

const route = useRoute()
const router = useRouter()

const chapterId = computed(() => route.params.chapterId)
const lessons = ref([])
const title = ref('')
/** 索引里这一章的信息；null 表示索引里根本没有这一章 */
const chapter = ref(null)
const loading = ref(true)
const error = ref('')
const mastery = ref({})

/** 「还没收录」与「没有这一章」是两回事，话术要分开 */
const emptyText = computed(() => (chapter.value ? '这一章还在规划中。' : '没有这一章。'))

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    // 章节标题在课程索引里，小节在分片文件里；先看索引才知道这一章有没有内容
    const index = await loadKnowledgeIndex()
    const found = (index.chapters ?? []).find((c) => c.id === Number(chapterId.value))
    chapter.value = found ?? null
    title.value = found?.title ?? ''
    lessons.value = found?.hasContent
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

// 路由只换章号时 vue-router 会复用同一个组件实例（不会重新挂载），
// 不盯着 chapterId 的话，URL 已经变成第 15 章，列表还停在第 2 章
watch(chapterId, load)
</script>
