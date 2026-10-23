<template>
  <div class="learn-page">
    <header class="learn-top">
      <button type="button" class="learn-top__back" @click="goBack">
        <span>‹</span><span>返回地球</span>
      </button>
      <span class="learn-top__title">互动工具</span>
      <span class="learn-top__spacer"></span>
      <router-link class="learn-top__back" to="/course">课程地图</router-link>
    </header>

    <main class="learn-main">
      <h1 class="learn-h1">互动工具</h1>
      <p class="learn-lead">
        光看提纲记不住。这几个动手练：拖一拖、点一点、当场知道自己错在哪。
      </p>

      <section class="learn-panel">
        <h2 class="learn-panel__title">地理机制</h2>
        <div class="learn-grid">
          <router-link
            v-for="tool in mechanismTools"
            :key="tool.to"
            class="learn-card"
            :to="tool.to"
          >
            <span class="learn-card__no">{{ tool.no }}</span>
            <p class="learn-card__name">{{ tool.name }}</p>
            <span class="learn-card__meta">{{ tool.desc }}</span>
          </router-link>
        </div>
      </section>

      <section class="learn-panel">
        <h2 class="learn-panel__title">省情速记</h2>
        <div class="learn-grid">
          <router-link
            v-for="tool in provinceTools"
            :key="tool.to"
            class="learn-card"
            :to="tool.to"
          >
            <span class="learn-card__no">{{ tool.no }}</span>
            <p class="learn-card__name">{{ tool.name }}</p>
            <span class="learn-card__meta">{{ tool.desc }}</span>
          </router-link>
        </div>
      </section>

      <section class="learn-panel">
        <h2 class="learn-panel__title">怎么用</h2>
        <p class="learn-panel__meta learn-panel__meta--spaced">
          每个工具都是独立的一页：左边是题目或示意图，右边是作答区。
          答完当场给判据——对了说为什么对，错了说该怎么想。
        </p>
        <p class="learn-panel__meta learn-panel__meta--spaced">
          这些工具对应的是课程地图里相应章节的知识点；想看提纲和要背清单，
          回到<router-link to="/course">课程地图</router-link>按章节进。
        </p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

/** 机制类互动：对应讲义里"读了要用出来"的那些章节 */
const mechanismTools = [
  {
    no: '01',
    name: '等高线判读',
    desc: '坡度、山脊山谷、山顶盆地、陡崖',
    to: '/tools/contour',
  },
  {
    no: '02',
    name: '太阳高度角与晨昏线',
    desc: '算高度角与昼长，判晨线昏线和切点',
    to: '/tools/terminator',
  },
  {
    no: '03',
    name: '气压带风带',
    desc: '三圈环流的位置、成因与季节移动',
    to: '/tools/pressure-belt',
  },
  {
    no: '04',
    name: '洋流',
    desc: '世界洋流分布、寒暖与成因判读',
    to: '/tools/ocean-current',
  },
]

/** 省情速记：把省名、省会、轮廓一次性记住 */
const provinceTools = [
  {
    no: '05',
    name: '省会简称全表',
    desc: '34 个省级行政区的简称与省会',
    to: '/tools/province-abbrev',
  },
  {
    no: '06',
    name: '轮廓形象记忆',
    desc: '对着真实省界记形状',
    to: '/tools/province-shape',
  },
]
</script>
