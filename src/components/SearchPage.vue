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
            <!-- 命中原因：按省名搜到的，把命中的省名列出来，让人看得懂这条为什么会出现 -->
            <p v-if="provinceHits[item.id]?.length" class="learn-item__meta">
              <span class="learn-panel__meta">关联省份：</span>
              <router-link
                v-for="p in provinceHits[item.id]"
                :key="p.adcode"
                class="learn-tag"
                :to="`/province/${p.adcode}`"
                >{{ p.name }}</router-link
              >
            </p>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { loadAllLessons, searchLessons, matchedProvinces } from '../utils/knowledge'
import { loadProvinceNames } from '../utils/provinceNames'

const router = useRouter()

const lessons = ref([])
/** adcode → 省名：给「按省名搜索」用，取不到就退化成只按 adcode 匹配 */
const provinceNames = ref({})
const keyword = ref('')
const loading = ref(true)
const error = ref('')

const results = computed(() =>
  searchLessons(lessons.value, keyword.value, provinceNames.value),
)

/** 每个命中项里被搜索词命中的省份：结果里要能看出「为什么命中」 */
const provinceHits = computed(() => {
  const map = {}
  for (const item of results.value) {
    const hits = matchedProvinces(item, keyword.value, provinceNames.value)
    if (hits.length) map[item.id] = hits
  }
  return map
})

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    lessons.value = await loadAllLessons()
    // 省名表只给搜索用。取不到时 loadProvinceNames 会退回显示代码，
    // 搜索仍然按 adcode 匹配，不会因此报错
    provinceNames.value = await loadProvinceNames(
      lessons.value.flatMap((l) => l.entities?.provinces ?? []),
    )
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
/* 命中原因那一行：说明这条结果是按省名命中的 */
.learn-item__meta {
  margin: var(--sp-2) 0 0;
}

/* 行高已经留出来了，标签不用再带下边距 */
.learn-item__meta .learn-tag {
  margin-bottom: 0;
}
</style>
