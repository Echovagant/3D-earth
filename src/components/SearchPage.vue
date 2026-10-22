<template>
  <div class="learn-page">
    <header class="learn-top">
      <button type="button" class="learn-top__back" @click="goBack">
        <span>‹</span><span>返回</span>
      </button>
      <span class="learn-top__title">搜索知识点</span>
      <span class="learn-top__spacer"></span>
      <router-link class="learn-top__back" to="/course">课程地图</router-link>
    </header>

    <main class="learn-main">
      <section class="learn-panel">
        <h1 class="learn-h1">搜索</h1>
        <input
          v-model="keyword"
          class="learn-input"
          type="search"
          aria-label="搜索知识点"
          placeholder="输入关键词，例如：等高线、冲积扇、洋流"
        />
      </section>

      <div v-if="loading" class="learn-empty">读取知识点…</div>
      <div v-else-if="error" class="learn-error">
        <p>{{ error }}</p>
        <button type="button" class="learn-top__back" @click="load">重试</button>
      </div>
      <div v-else-if="!keyword.trim()" class="learn-empty">输入关键词开始搜索。</div>
      <div v-else-if="results.length === 0" class="learn-empty">
        没有命中「{{ keyword }}」。
      </div>
      <section v-else class="learn-panel">
        <h2 class="learn-panel__title">命中 {{ results.length }} 个知识点</h2>
        <ul class="learn-list">
          <li v-for="item in results" :key="item.id" class="learn-item">
            <router-link class="learn-item__title" :to="`/lesson/${item.id}`">
              §{{ item.id }} {{ item.title }}
            </router-link>
            <p class="learn-item__summary">{{ item.summary }}</p>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { loadAllLessons, searchLessons } from '../utils/knowledge'

const router = useRouter()

const lessons = ref([])
const keyword = ref('')
const loading = ref(true)
const error = ref('')

const results = computed(() => searchLessons(lessons.value, keyword.value))

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    lessons.value = await loadAllLessons()
  } catch (e) {
    error.value = `无法加载知识点（${e.message}）`
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

<style scoped>
.learn-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--learn-line);
  border-radius: 6px;
  background: var(--learn-panel);
  color: var(--learn-ink);
  font-family: var(--font-ui);
  font-size: 15px;
}

.learn-input:focus {
  border-color: var(--learn-accent);
  outline: none;
}
</style>
