<template>
  <div class="learn-page contour-lab">
    <header class="learn-top">
      <router-link class="learn-top__back" to="/course">
        <span>‹</span><span>返回课程地图</span>
      </router-link>
      <span class="learn-top__title">等高线判读实验</span>
      <span class="learn-top__spacer"></span>
      <span class="learn-panel__meta contour-lab__progress"
        >第 {{ index + 1 }} / {{ caseList.length }} 题</span
      >
    </header>

    <main class="learn-main">
      <h1 class="learn-h1">等高线判读实验</h1>
      <p class="learn-lead">
        每题给一组等高线，用图上的线把地形读出来。答完会给出判据，不只告诉你答案对不对。
      </p>
      <SourceNote :source="TOOL_SOURCES.contour" />

      <section class="learn-panel">
        <h2 class="learn-panel__title">答题进度</h2>
        <div class="learn-bar">
          <div class="learn-bar__fill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
        <p class="learn-panel__meta learn-panel__meta--spaced">
          共 {{ caseList.length }} 题，已判对 {{ solved.length }} 题
        </p>
      </section>

      <div v-if="loading" class="learn-empty">载入等高线案例…</div>
      <div v-else-if="error" class="learn-error">
        <p>{{ error }}</p>
        <button type="button" class="learn-top__back" @click="load">重试</button>
      </div>
      <div v-else-if="!activeCase" class="learn-empty">暂时没有可用的等高线案例。</div>

      <template v-else>
        <!-- 题目区 -->
        <section class="learn-panel contour-lab__question">
          <h2 class="learn-panel__title">{{ activeCase.title }}</h2>
          <p class="learn-lead--block">{{ activeCase.question }}</p>
          <p class="learn-panel__meta">
            等高距 {{ activeCase.interval }} m · {{ activeCase.contours.length }} 条等高线
          </p>
        </section>

        <!-- 作答区 -->
        <section class="learn-panel contour-lab__answer-area">
          <h2 class="learn-panel__title">等高线图</h2>
          <p class="learn-panel__meta">{{ activeCase.hint }}</p>

          <div class="contour-lab__body">
            <svg
              class="contour-lab__map"
              :viewBox="`0 0 ${PLANE_SIZE} ${PLANE_SIZE}`"
              role="img"
              :aria-label="`等高线图：${activeCase.title}`"
            >
              <rect
                class="contour-lab__bg"
                x="0"
                y="0"
                :width="PLANE_SIZE"
                :height="PLANE_SIZE"
                rx="2"
              />

              <path
                v-for="contour in activeCase.contours"
                :key="contour.id"
                class="contour-lab__line"
                :class="lineClass(contour)"
                :d="pathOf(contour)"
                @click="pickContour(contour)"
              />

              <text
                v-for="contour in activeCase.contours"
                :key="`value-${contour.id}`"
                class="contour-lab__value"
                :x="contour.labelAt[0]"
                :y="contour.labelAt[1]"
              >
                {{ contour.elevation }}
              </text>

              <g
                v-for="marker in activeCase.markers || []"
                :key="`marker-${marker.id}`"
                class="contour-lab__marker"
              >
                <circle :cx="marker.at[0]" :cy="marker.at[1]" r="3.4" />
                <text :x="marker.at[0] + 5.5" :y="marker.at[1] + 1.4">{{ marker.label }}</text>
              </g>

              <g
                v-for="section in activeCase.sections || []"
                :key="`section-${section.id}`"
                class="contour-lab__section"
                @click="chooseSection(section)"
              >
                <circle :cx="section.at[0]" :cy="section.at[1]" r="3.4" />
                <text :x="section.at[0]" :y="section.at[1] + 1.4">{{ section.label }}</text>
              </g>
            </svg>

            <div class="contour-lab__side">
              <p class="contour-lab__side-title">{{ sideTitle }}</p>
              <p class="learn-panel__meta contour-lab__picked">{{ pickedText }}</p>

              <div
                v-if="activeCase.mode === 'option'"
                class="contour-lab__options"
                role="group"
                aria-label="选项"
              >
                <button
                  v-for="option in activeCase.options"
                  :key="option.id"
                  type="button"
                  class="contour-lab__option"
                  :class="optionClass(option)"
                  :disabled="Boolean(answer)"
                  @click="chooseOption(option)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 反馈区 -->
        <section
          v-if="answer"
          class="learn-panel contour-lab__feedback"
          :class="answer.correct ? 'is-right' : 'is-wrong'"
        >
          <h2 class="learn-panel__title">{{ answer.title }}</h2>
          <!-- 说明文字来自仓库内的静态数据 src/data/contourLab.js，先转义再转 strong -->
          <p class="learn-lead--block" v-html="renderEmphasis(answer.text)"></p>
        </section>

        <div class="contour-lab__nav">
          <button type="button" class="learn-top__back" :disabled="index === 0" @click="go(-1)">
            上一题
          </button>
          <button
            type="button"
            class="learn-top__back"
            :disabled="index >= caseList.length - 1"
            @click="go(1)"
          >
            下一题
          </button>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
/**
 * 等高线判读实验。
 *
 * 每题给一组等高线，学生动手点选，答完给出判据：
 *   坡度——相邻等高线的疏密；
 *   山脊 / 山谷——弯曲尖端相对高值的方向；
 *   山顶 / 盆地——闭合曲线内圈与外圈的数值；
 *   陡崖——等高线重合的条数与相对高度范围。
 *
 * 答案不是写死在组件里，而是由 src/data/contourLab.js 的判读算法
 * 从图上的几何算出来，组件只负责画图和收答案。
 */
import { computed, onMounted, ref, watch } from 'vue'
import SourceNote from './SourceNote.vue'
import { TOOL_SOURCES } from '../data/toolSources'

import { renderEmphasis } from '../utils/richText'
import {
  CONTOUR_CASES,
  PLANE_SIZE,
  expectedValue,
  highlightContourIds,
  validateCases,
} from '../data/contourLab'

const props = defineProps({
  /** 可选的案例数据；不传就用内置案例，传空数组可以试空态 */
  cases: { type: Array, default: null },
})

const status = ref('loading')
const error = ref('')
/** 案例列表（不要和 props.cases 同名，会和 prop 撞键） */
const caseList = ref([])
const index = ref(0)
/** 玩家点中的等高线（查看高程用） */
const picked = ref(null)
/** 已作答的结果：{ correct, title, text, highlight } */
const answer = ref(null)
/** 判对过的题号 */
const solved = ref([])

const load = () => {
  error.value = ''
  try {
    const list = props.cases ?? CONTOUR_CASES
    validateCases(list)
    caseList.value = list
    index.value = 0
    status.value = 'ready'
  } catch (e) {
    caseList.value = []
    error.value = `等高线案例不可用：${e.message}`
    status.value = 'error'
  }
}

onMounted(load)

// 外部换了一套案例时重新装载
watch(
  () => props.cases,
  () => {
    picked.value = null
    answer.value = null
    load()
  },
)

const loading = computed(() => status.value === 'loading')
const activeCase = computed(() => caseList.value[index.value] ?? null)
const progressPercent = computed(() =>
  caseList.value.length ? Math.round((solved.value.length / caseList.value.length) * 100) : 0,
)

/** 等高线折线转 SVG path；闭合等高线（closed）要把首尾接上 */
const pathOf = (contour) => {
  const d = (contour.points ?? [])
    .map((point, i) => `${i === 0 ? 'M' : 'L'}${point[0]} ${point[1]}`)
    .join(' ')
  return contour.closed ? `${d} Z` : d
}

const lineClass = (contour) => ({
  'is-picked': picked.value === contour.id,
  'is-answer': Boolean(answer.value?.highlight?.includes(contour.id)),
})

const optionClass = (option) => {
  if (!answer.value) return {}
  const correct = option.value === expectedValue(activeCase.value)
  return {
    'is-right': correct,
    'is-wrong': !correct && option.id === answer.value.pickedId,
  }
}

const pickedText = computed(() => {
  if (!picked.value) return '点图中的任意一条等高线，可以查看它的高程数值。'
  const contour = (activeCase.value?.contours ?? []).find((c) => c.id === picked.value)
  return contour ? `已选等高线：高程 ${contour.elevation} m。` : ''
})

/** 右边这一栏是干什么的，随题型变 */
const sideTitle = computed(() =>
  activeCase.value?.mode === 'section' ? '在图上点出坡段' : '选择答案',
)

/** 点选等高线：只是查看它的数值，不影响判分 */
const pickContour = (contour) => {
  picked.value = picked.value === contour.id ? null : contour.id
}

const chooseOption = (option) => {
  if (answer.value || !activeCase.value) return
  const correct = option.value === expectedValue(activeCase.value)
  answer.value = {
    correct,
    pickedId: option.id,
    title: correct ? '判读正确' : '再核对一次',
    text: correct
      ? activeCase.value.explain
      : (activeCase.value.wrong?.[option.id] ?? activeCase.value.wrongDefault),
    highlight: correct ? highlightContourIds(activeCase.value) : [],
  }
  if (correct && !solved.value.includes(activeCase.value.id)) {
    solved.value = [...solved.value, activeCase.value.id]
  }
}

const chooseSection = (section) => {
  if (answer.value || !activeCase.value) return
  const correct = section.id === expectedValue(activeCase.value)
  answer.value = {
    correct,
    pickedId: section.id,
    title: correct ? '判读正确' : '再核对一次',
    text: correct
      ? activeCase.value.explain
      : (activeCase.value.wrong?.[section.id] ?? activeCase.value.wrongDefault),
    highlight: correct ? highlightContourIds(activeCase.value) : [],
  }
  if (correct && !solved.value.includes(activeCase.value.id)) {
    solved.value = [...solved.value, activeCase.value.id]
  }
}

/** 换题：答案和选中状态都要清掉 */
const go = (delta) => {
  const next = index.value + delta
  if (next < 0 || next >= caseList.value.length) return
  index.value = next
  picked.value = null
  answer.value = null
}
</script>

<style scoped>
.contour-lab__body {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(220px, 1fr);
  gap: var(--sp-5);
  align-items: start;
  margin-top: var(--sp-3);
}

@media (max-width: 760px) {
  .contour-lab__body {
    grid-template-columns: 1fr;
    gap: var(--sp-3);
  }
}

.contour-lab__side-title {
  margin: 0 0 var(--sp-2);
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--learn-ink);
}

.contour-lab__map {
  display: block;
  width: 100%;
  max-width: 560px;
  height: auto;
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
}

.contour-lab__bg {
  fill: var(--learn-panel);
}

.contour-lab__line {
  fill: none;
  stroke: var(--learn-ink-soft);
  stroke-width: 0.7;
  stroke-linecap: round;
  stroke-linejoin: round;
  cursor: pointer;
}

.contour-lab__line:hover {
  stroke: var(--learn-accent);
}

.contour-lab__line.is-picked {
  stroke: var(--learn-accent);
  stroke-width: 1.2;
}

.contour-lab__line.is-answer {
  stroke: var(--learn-accent);
  stroke-width: 1.6;
}

.contour-lab__value {
  fill: var(--learn-ink-faint);
  font-family: var(--font-mono);
  font-size: 2.8px;
  text-anchor: middle;
  pointer-events: none;
}

.contour-lab__marker circle {
  fill: var(--learn-panel);
  stroke: var(--learn-warn);
  stroke-width: 0.45;
}

.contour-lab__marker text {
  fill: var(--learn-warn);
  font-family: var(--font-ui);
  font-size: 3.6px;
}

.contour-lab__section {
  cursor: pointer;
}

.contour-lab__section circle {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-accent);
  stroke-width: 0.45;
}

.contour-lab__section:hover circle {
  stroke-width: 0.9;
}

.contour-lab__section text {
  fill: var(--learn-accent);
  font-family: var(--font-ui);
  font-size: 3px;
  text-anchor: middle;
  pointer-events: none;
}

.contour-lab__options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
}
.contour-lab__option {
  padding: var(--sp-2) var(--sp-4);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
  background: var(--learn-panel);
  color: var(--learn-ink);
  font-family: var(--font-ui);
  font-size: var(--fs-body);
  cursor: pointer;
}

.contour-lab__option:hover:not(:disabled) {
  border-color: var(--learn-accent);
  color: var(--learn-accent);
}

.contour-lab__option:disabled {
  cursor: default;
  opacity: 0.75;
}

.contour-lab__option.is-right {
  border-color: var(--learn-accent);
  background: var(--learn-accent-soft);
  color: var(--learn-accent);
}

.contour-lab__option.is-wrong {
  border-color: var(--learn-warn);
  color: var(--learn-warn);
}

.contour-lab__feedback.is-right {
  border-left: 4px solid var(--learn-accent);
}

.contour-lab__feedback.is-wrong {
  border-left: 4px solid var(--learn-warn);
}

.contour-lab__nav {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-4);
}
</style>
