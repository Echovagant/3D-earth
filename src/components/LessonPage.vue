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
          <p class="learn-meta-row">
            <a
              class="learn-tag"
              :href="videoUrl"
              target="_blank"
              rel="noreferrer noopener"
              >本节视频：{{ lesson.video.label }} →</a
            >
            <router-link v-if="tool" class="learn-tag" :to="tool.to">
              {{ tool.label }}
            </router-link>
            <span v-if="lesson.sourceLabel" class="learn-panel__meta">
              <!-- v-html：输入是仓库内的静态 JSON，不是用户输入；renderEmphasis 先转义后替换，输出只可能是 <strong> -->
              教材：<span v-html="emph(lesson.sourceLabel)" />
            </span>
          </p>
        </section>

        <section v-if="lesson.exam" class="learn-panel">
          <h2 class="learn-panel__title">高考定位</h2>
          <!-- v-html：输入是仓库内的静态 JSON，不是用户输入；renderEmphasis 先转义后替换，输出只可能是 <strong> -->
          <p class="learn-lead learn-lead--block" v-html="emph(lesson.exam)" />
        </section>

        <section v-if="lesson.outline.length" class="learn-panel">
          <h2 class="learn-panel__title">知识骨架</h2>
          <ul class="learn-list">
            <!-- v-html：输入是仓库内的静态 JSON，不是用户输入；renderEmphasis 先转义后替换，输出只可能是 <strong> -->
            <li v-for="(item, i) in lesson.outline" :key="i" class="learn-item" v-html="emph(item)" />
          </ul>
        </section>

        <section v-if="lesson.tables.length" class="learn-panel">
          <h2 class="learn-panel__title">表格</h2>
          <table v-for="(t, ti) in lesson.tables" :key="ti" class="learn-table">
            <thead>
              <tr>
                <!-- v-html：输入是仓库内的静态 JSON，不是用户输入；renderEmphasis 先转义后替换，输出只可能是 <strong> -->
                <th v-for="(h, hi) in t.header" :key="hi" v-html="emph(h)" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, ri) in t.rows" :key="ri">
                <!-- v-html：输入是仓库内的静态 JSON，不是用户输入；renderEmphasis 先转义后替换，输出只可能是 <strong> -->
                <td v-for="(c, ci) in row" :key="ci" v-html="emph(c)" />
              </tr>
            </tbody>
          </table>
        </section>

        <section v-if="lesson.mustKnow.length" class="learn-panel">
          <h2 class="learn-panel__title">要背</h2>
          <ul class="learn-list">
            <!-- v-html：输入是仓库内的静态 JSON，不是用户输入；renderEmphasis 先转义后替换，输出只可能是 <strong> -->
            <li v-for="(item, i) in lesson.mustKnow" :key="i" class="learn-item" v-html="emph(item)" />
          </ul>
        </section>

        <section v-if="lesson.pitfalls.length" class="learn-panel">
          <h2 class="learn-panel__title">易错点</h2>
          <ul class="learn-list">
            <!-- v-html：输入是仓库内的静态 JSON，不是用户输入；renderEmphasis 先转义后替换，输出只可能是 <strong> -->
            <li v-for="(item, i) in lesson.pitfalls" :key="i" class="learn-item" v-html="emph(item)" />
          </ul>
        </section>

        <section v-if="lesson.questionTypes.length" class="learn-panel">
          <h2 class="learn-panel__title">典型题型</h2>
          <ul class="learn-list">
            <!-- v-html：输入是仓库内的静态 JSON，不是用户输入；renderEmphasis 先转义后替换，输出只可能是 <strong> -->
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
          <p class="learn-refs-row">
            <span class="learn-panel__meta">前置：</span>
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
            <template v-for="c in lesson.prereqChapters" :key="`pc${c}`">
              <!-- 已收录的章能点进章节页；没收录的只作提示 -->
              <router-link v-if="chapterKnown(c)" class="learn-tag" :to="`/course/${c}`">
                {{ chapterLabel(c) }}
              </router-link>
              <span v-else class="learn-tag learn-tag--muted" :title="`第 ${c} 章尚未收录`">
                {{ chapterLabel(c) }}
              </span>
            </template>
            <span v-if="!lesson.prereq.length && !lesson.prereqChapters.length" class="learn-panel__meta">无</span>
          </p>
          <p class="learn-refs-row">
            <span class="learn-panel__meta">后续：</span>
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
            <template v-for="c in lesson.nextChapters" :key="`nc${c}`">
              <!-- 已收录的章能点进章节页；没收录的只作提示 -->
              <router-link v-if="chapterKnown(c)" class="learn-tag" :to="`/course/${c}`">
                {{ chapterLabel(c) }}
              </router-link>
              <span v-else class="learn-tag learn-tag--muted" :title="`第 ${c} 章尚未收录`">
                {{ chapterLabel(c) }}
              </span>
            </template>
            <span v-if="!lesson.next.length && !lesson.nextChapters.length" class="learn-panel__meta">无</span>
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loadAllLessons, lessonRefLabel, loadKnowledgeIndex } from '../utils/knowledge'
import { LESSON_TOOLS } from '../data/toolLinks'
import { readMastery, setMastery } from '../utils/mastery'
import { renderEmphasis } from '../utils/richText'
import { loadProvinceNames } from '../utils/provinceNames'
import { createRequestGuard } from '../utils/latestRequest'

const route = useRoute()
const router = useRouter()

const lessonId = computed(() => route.params.lessonId)
const lesson = ref(null)
const allLessons = ref([])
/** 课程索引里的章信息：章名与「这一章有没有内容」都从这里取 */
const chapters = ref([])
/** adcode → 省名，来自省份数据文件 */
const provinceNames = ref({})
const loading = ref(true)
const error = ref('')
const state = ref('')

const emph = (text) => renderEmphasis(text)

// 换知识点是连续的两次请求：慢的那次后到时会把新一节的正文覆盖成上一节。
// 每次请求领一个序号，只有最新序号的响应才允许写状态。
const requests = createRequestGuard()

const videoUrl = computed(() =>
  lesson.value
    ? `https://www.bilibili.com/video/${lesson.value.video.bvid}?p=${lesson.value.video.p}`
    : '',
)

/**
 * 知识点 ↔ 互动工具。
 *
 * 映射表在 src/data/toolLinks.js：那里是唯一的真相源，
 * 实验页的「相关提纲」区块也从同一份数据派生。
 *
 * 入口文案分两种强度，让点击前就知道点进去会看到什么：
 *   drill   —— 这个实验直接教这一节 → 「动手练：等高线判读」
 *   chapter —— 只是同章的关联     → 「§7 大气环流：气压带风带与季风 · 可动手玩」
 */
const tool = computed(() => {
  const entry = LESSON_TOOLS[lesson.value?.id]
  if (!entry) return null
  if (entry.kind === 'drill') return { ...entry, label: `动手练：${entry.name}` }
  // 章级关联：把章名摆出来，用户才知道这一章还有个能动手的地方。
  // 章名取冒号前的短名（「大气环流：气压带风带与季风」→「大气环流」）——
  // 完整章名塞进标签行会在窄屏上撑破。
  const chapter = Number(lesson.value.id.split('.')[0])
  return { ...entry, label: `${shortChapterLabel(chapter)} · 可动手玩` }
})
/** 前置与后续：节级引用与章级引用都算，否则只有章级引用的节会被整段藏掉 */
const refs = computed(() => [
  ...(lesson.value?.prereq ?? []),
  ...(lesson.value?.next ?? []),
  ...(lesson.value?.prereqChapters ?? []),
  ...(lesson.value?.nextChapters ?? []),
])

const refLabel = (id) => lessonRefLabel(id, allLessons.value)

/** 该节是否已收录——未收录的引用渲染成纯文本，不能做成会 404 的链接 */
const isKnown = (id) => allLessons.value.some((l) => l.id === id)

/** 索引里的某一章 */
const chapterOf = (id) => chapters.value.find((c) => c.id === Number(id))

/** 章级引用：`3` → `§3 地球的自转`。章名从课程索引里取。 */
const chapterLabel = (id) => {
  const chapter = chapterOf(id)
  return chapter ? `§${chapter.id} ${chapter.title}` : `§${id}`
}

/**
 * 章名的短形式：取冒号前的部分。
 *
 * 「大气环流：气压带风带与季风」→「大气环流」——章名用冒号分开的是
 * 主题与范围，标签行放不下完整版，窄屏上会撑破。
 */
const shortChapterLabel = (id) => {
  const chapter = chapterOf(id)
  if (!chapter) return `§${id}`
  const [short] = chapter.title.split('：')
  return `§${chapter.id} ${short}`
}

/** 该章是否已收录——已收录的章级引用要能点进章节页 */
const chapterKnown = (id) => chapterOf(id)?.hasContent === true

/** 省名从省份数据文件里取；还没取到时先显示代码 */
const provinceName = (adcode) => provinceNames.value[String(adcode)] ?? adcode

const load = async () => {
  const token = requests.begin()
  // 记下这次要加载的是哪一节：等数据回来时再确认页面没已经切到别的节
  const targetId = lessonId.value
  loading.value = true
  error.value = ''
  // 先清掉上一节的残留：新节加载失败时不能还留着上一节的内容和标记
  lesson.value = null
  state.value = ''
  provinceNames.value = {}
  try {
    const [lessons, index] = await Promise.all([loadAllLessons(), loadKnowledgeIndex()])
    // 序号已经过时：这是上一节的响应，直接丢掉，不能覆盖新一节的正文
    if (!requests.isCurrent(token)) return
    allLessons.value = lessons
    chapters.value = index.chapters ?? []
    const found = lessons.find((l) => l.id === targetId) ?? null
    if (!found) throw new Error('没有这个知识点')
    lesson.value = found
    state.value = readMastery()[found.id] ?? ''
  } catch (e) {
    if (!requests.isCurrent(token)) return
    error.value = `无法加载该知识点（${e.message}）`
    return
  } finally {
    // 只有最新那次请求能收尾 loading：旧请求收尾会把新一轮的加载态提前关掉
    if (requests.isCurrent(token)) loading.value = false
  }

  // 省名单独补：正文不用等这几十个小文件，取不到就退回代码
  const names = await loadProvinceNames(lesson.value?.entities?.provinces ?? [])
  if (requests.isCurrent(token)) provinceNames.value = names
}

const mark = (value) => {
  if (!lesson.value) return
  setMastery(lesson.value.id, value)
  state.value = value
}

/** 取消标记：null 表示清除，空串会被 setMastery 当成非法值忽略 */
const clearMark = () => {
  if (!lesson.value) return
  setMastery(lesson.value.id, null)
  state.value = ''
}

const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push('/course')
}

onMounted(load)

onBeforeUnmount(() => {
  // 组件已经卸载：迟到的响应不能再写状态
  requests.dispose()
})

// 路由只换知识点号时 vue-router 会复用同一个组件实例（不会重新挂载），
// 不盯着 lessonId 的话，URL 已经变成 §2.20，正文还停在 §2.19，
// 「标记已掌握」就会写到上一节上
watch(lessonId, load)
</script>
