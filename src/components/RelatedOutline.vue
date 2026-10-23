<template>
  <section v-if="groups.length" class="learn-panel">
    <h2 class="learn-panel__title">相关提纲</h2>
    <ul class="learn-list">
      <li v-for="group in groups" :key="group.chapter" class="learn-item">
        <router-link class="learn-item__title" :to="`/course/${group.chapter}`">
          {{ group.label }}
        </router-link>
        <p class="learn-item__summary">
          <router-link
            v-for="item in group.items"
            :key="item.id"
            class="learn-tag"
            :to="`/lesson/${item.id}`"
            >§{{ item.id }} {{ item.title }}</router-link
          >
        </p>
      </li>
    </ul>
  </section>
</template>

<script setup>
/**
 * 实验页的「相关提纲」：这个实验直接教哪几节。
 *
 * 关联关系来自 src/data/toolLinks.js，这里只负责把数据变成链接：
 * 小节标题从知识数据里取，不在代码里另抄一份。
 *
 * 这是一段补充导航，取不到数据就整块不渲染——
 * 没有 fetch、请求失败、章节文件还没生成，都不该在实验页上留下报错或空壳。
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { loadChapterLessons, loadKnowledgeIndex } from '../utils/knowledge'
import { TOOL_CHAPTERS, TOOL_DRILL_IDS } from '../data/toolLinks'

const props = defineProps({
  /** 实验页路由，如 '/tools/terminator' */
  tool: { type: String, required: true },
})

/** 按章分组的小节：[{ chapter, label, items: [{ id, title }] }] */
const groups = ref([])
/** 组件卸载后不再写状态：迟到的响应不能改已经卸载的页面 */
let disposed = false

/** 小节号按「章 → 节」排序：3.2 要排在 3.10 前面 */
const compareIds = (a, b) => {
  const [ac, as] = a.split('.').map(Number)
  const [bc, bs] = b.split('.').map(Number)
  return ac - bc || as - bs
}

const load = async () => {
  const chapters = TOOL_CHAPTERS[props.tool] ?? []
  const drillIds = TOOL_DRILL_IDS[props.tool] ?? []
  groups.value = []
  if (!chapters.length || !drillIds.length) return
  // 环境里没有 fetch（老浏览器、SSR、部分测试环境）：直接不渲染这一块
  if (typeof fetch !== 'function') return
  try {
    // 章名在课程索引里，小节在分片文件里；两者都取不到也不影响渲染
    const [results, index] = await Promise.all([
      // 一章取不到不该拖垮另一章，所以逐章兜底而不是一失败全没
      Promise.allSettled(chapters.map((chapter) => loadChapterLessons(chapter))),
      loadKnowledgeIndex().catch(() => null),
    ])
    if (disposed) return

    const titles = new Map()
    for (const chapter of index?.chapters ?? []) {
      titles.set(Number(chapter.id), chapter.title ?? '')
    }

    const wanted = new Set(drillIds)
    const byChapter = new Map()
    for (const result of results) {
      if (result.status !== 'fulfilled') continue
      for (const lesson of result.value) {
        if (!wanted.has(lesson.id)) continue
        const chapter = Number(lesson.chapter ?? lesson.id.split('.')[0])
        if (!byChapter.has(chapter)) byChapter.set(chapter, [])
        byChapter.get(chapter).push(lesson)
      }
    }

    groups.value = [...byChapter.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([chapter, items]) => {
        const title = titles.get(chapter) ?? ''
        return {
          chapter,
          // 取不到章名就只显示 §编号，不要在代码里写死章名
          label: title ? `§${chapter} ${title}` : `§${chapter}`,
          items: [...items].sort((a, b) => compareIds(a.id, b.id)),
        }
      })
  } catch {
    // 取不到就整块不渲染：这是补充导航，不值得为它引入错误态
    groups.value = []
  }
}

/**
 * 挂载之后再取数据。
 *
 * 这一块是补充导航，不能跟页面自身的数据请求抢先后：
 * 页面自己的底图、提纲要先发出去，补充导航排到挂载之后再来。
 */
const scheduleLoad = () => {
  nextTick(() => {
    load()
  })
}

onMounted(scheduleLoad)
watch(() => props.tool, scheduleLoad)

onBeforeUnmount(() => {
  disposed = true
})
</script>
