<template>
  <div class="learn-page ocean-lab">
    <header class="learn-top">
      <router-link class="learn-top__back" to="/course">
        <span>‹</span><span>返回课程地图</span>
      </router-link>
      <span class="learn-top__title">洋流判读实验</span>
      <span class="learn-top__spacer"></span>
      <span class="learn-panel__meta ocean-lab__progress"
        >已判对 {{ solved.length }} / {{ questionList.length }} 题</span
      >
    </header>

    <main class="learn-main">
      <h1 class="learn-h1">洋流判读实验</h1>
      <p class="learn-lead">
        点图上的洋流箭头读流向，再做几道判读题。答完会给出判据——不只告诉你对不对，还会说明为什么这样判。
      </p>
      <SourceNote :source="TOOL_SOURCES['ocean-current']" />

      <!-- 视图与季节 -->
      <section class="learn-panel ocean-lab__controls">
        <h2 class="learn-panel__title">视图</h2>
        <div class="ocean-lab__tabs" role="group" aria-label="环流模式">
          <button
            v-for="mode in VIEW_MODES"
            :key="mode.id"
            type="button"
            class="ocean-lab__tab"
            :class="{ 'is-active': viewMode === mode.id }"
            :aria-pressed="viewMode === mode.id"
            @click="setView(mode.id)"
          >
            {{ mode.label }}
          </button>
        </div>

        <h2 class="learn-panel__title ocean-lab__title--spaced">北印度洋季节</h2>
        <div class="ocean-lab__tabs" role="group" aria-label="季节">
          <button
            v-for="s in SEASONS"
            :key="s.id"
            type="button"
            class="ocean-lab__tab"
            :class="{ 'is-active': season === s.id }"
            :aria-pressed="season === s.id"
            @click="setSeason(s.id)"
          >
            {{ s.label }}
          </button>
        </div>

        <p class="learn-panel__meta ocean-lab__note">{{ viewNote }}</p>
        <p class="learn-panel__meta ocean-lab__note">{{ seasonNote }}</p>

        <label class="ocean-lab__switch">
          <input v-model="showLabels" type="checkbox" />
          <span>在图上标出洋流名称</span>
        </label>
      </section>

      <!-- 地图 -->
      <section class="learn-panel ocean-lab__map-panel">
        <h2 class="learn-panel__title">世界洋流分布图</h2>
        <p class="learn-panel__meta">
          底图是世界国界轮廓（只画线不填色，以免盖住洋流）。箭头的指向就是洋流流向：
          暖流（橙）总体向高纬，寒流（蓝）总体向低纬。
        </p>

        <div v-if="loading" class="learn-empty">载入世界底图…</div>
        <div v-else-if="loadError" class="learn-error">
          <p>{{ loadError }}</p>
          <button type="button" class="learn-top__back" @click="load">重试</button>
        </div>
        <div v-else-if="!currentList.length" class="learn-empty">暂时没有可用的洋流数据。</div>

        <svg
          v-else
          class="ocean-lab__map"
          :viewBox="`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`"
          role="img"
          aria-label="世界洋流分布图，箭头表示洋流流向"
        >
          <defs>
            <marker
              id="ocean-arrow-warm"
              viewBox="0 0 6 6"
              refX="5.4"
              refY="3"
              markerWidth="6"
              markerHeight="6"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path class="ocean-lab__arrow ocean-lab__arrow--warm" d="M0 0 L6 3 L0 6 Z" />
            </marker>
            <marker
              id="ocean-arrow-cold"
              viewBox="0 0 6 6"
              refX="5.4"
              refY="3"
              markerWidth="6"
              markerHeight="6"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path class="ocean-lab__arrow ocean-lab__arrow--cold" d="M0 0 L6 3 L0 6 Z" />
            </marker>
          </defs>

          <rect
            class="ocean-lab__bg"
            x="0"
            y="0"
            :width="MAP_WIDTH"
            :height="MAP_HEIGHT"
            rx="2"
          />

          <!-- 底图：国界轮廓 -->
          <path
            v-for="coast in coastPaths"
            :key="coast.id"
            class="ocean-lab__coast"
            :d="coast.d"
          />

          <!-- 赤道参考线 -->
          <line class="ocean-lab__equator" x1="0" :y1="MAP_HEIGHT / 2" :x2="MAP_WIDTH" :y2="MAP_HEIGHT / 2" />

          <!-- 洋流箭头 -->
          <g
            v-for="current in visibleCurrents"
            :key="current.id"
            class="ocean-lab__current"
            :class="currentClass(current)"
            @click="pick(current)"
          >
            <path class="ocean-lab__hit" :d="pathOf(current)" />
            <path class="ocean-lab__flow" :d="pathOf(current)" :marker-end="markerOf(current)" />
            <path
              v-if="midOf(current)"
              class="ocean-lab__flow ocean-lab__flow--mid"
              :d="midOf(current)"
              :marker-end="markerOf(current)"
            />
            <text
              v-if="showLabels"
              class="ocean-lab__label"
              :x="labelAt(current)[0]"
              :y="labelAt(current)[1]"
            >
              {{ current.name }}
            </text>
          </g>

          <!-- 模式标注点 -->
          <g v-for="anchor in anchorPoints" :key="anchor.id" class="ocean-lab__anchor">
            <circle :cx="anchor.x" :cy="anchor.y" r="2.4" />
            <text :x="anchor.x + 4" :y="anchor.y + 1.4">{{ anchor.label }}</text>
          </g>
        </svg>

        <div class="ocean-lab__legend">
          <span class="ocean-lab__legend-item">
            <span class="ocean-lab__swatch ocean-lab__swatch--warm"></span>暖流
          </span>
          <span class="ocean-lab__legend-item">
            <span class="ocean-lab__swatch ocean-lab__swatch--cold"></span>寒流
          </span>
          <span class="ocean-lab__legend-item">
            <span class="ocean-lab__swatch ocean-lab__swatch--up"></span>上升补偿流
          </span>
        </div>
      </section>

      <div class="ocean-lab__columns">
        <!-- 洋流详情 -->
        <section class="learn-panel ocean-lab__detail">
          <h2 class="learn-panel__title">
            {{ selected ? selected.name : '洋流详情' }}
          </h2>

          <p v-if="!selected" class="learn-panel__meta">
            点图上任意一条洋流箭头，或从下面的列表里选一条，这里会显示它的寒暖、成因与影响。
          </p>

          <template v-else>
            <div class="ocean-lab__tags">
              <span
                class="ocean-lab__tag"
                :class="selected.nature === 'warm' ? 'is-warm' : 'is-cold'"
              >
                {{ NATURE_LABELS[selected.nature] }}
              </span>
              <span class="ocean-lab__tag">{{ CAUSE_LABELS[selected.cause] }}</span>
              <span class="ocean-lab__tag ocean-lab__tag--plain">{{ HEAT_LABELS[selected.heat] }}</span>
            </div>

            <dl class="ocean-lab__facts">
              <dt>流经海域</dt>
              <dd>{{ selected.region }}</dd>
              <dt v-if="selected.seasonal">当前季节</dt>
              <dd v-if="selected.seasonal">
                {{ selected.label }}（{{ NATURE_LABELS[selected.nature] }}）·{{ selected.direction }}
              </dd>
              <dt>判读要点</dt>
              <!-- 文案来自仓库内的静态数据 src/data/oceanCurrentLab.js，先转义再转 strong -->
              <dd v-html="renderEmphasis(selected.seasonal ? selected.detail : selected.key)"></dd>
              <dt>地理影响</dt>
              <dd v-html="renderEmphasis(selected.impact)"></dd>
            </dl>
          </template>
        </section>

        <!-- 洋流一览 -->
        <section class="learn-panel ocean-lab__list">
          <h2 class="learn-panel__title">洋流一览</h2>
          <p class="learn-panel__meta">按性质分组，点名称可以在图上定位。</p>
          <div class="ocean-lab__chips">
            <button
              v-for="current in listByNature.warm"
              :key="current.id"
              type="button"
              class="ocean-lab__chip is-warm"
              :class="{ 'is-active': selectedId === current.id }"
              @click="pick(current)"
            >
              {{ current.name }}
            </button>
            <button
              v-for="current in listByNature.cold"
              :key="current.id"
              type="button"
              class="ocean-lab__chip is-cold"
              :class="{ 'is-active': selectedId === current.id }"
              @click="pick(current)"
            >
              {{ current.name }}
            </button>
          </div>
        </section>
      </div>

      <!-- 判读三步法与易错 -->
      <section class="learn-panel">
        <h2 class="learn-panel__title">寒暖流判读三步法</h2>
        <ol class="ocean-lab__steps">
          <li v-for="step in READING_STEPS" :key="step.no" class="ocean-lab__step">
            <span class="ocean-lab__step-no">{{ step.no }}</span>
            <span class="ocean-lab__step-body">
              <span class="ocean-lab__step-title">{{ step.title }}</span>
              <!-- 文案来自仓库内的静态数据 src/data/oceanCurrentLab.js -->
              <span class="ocean-lab__step-text" v-html="renderEmphasis(step.text)"></span>
            </span>
          </li>
        </ol>
      </section>

      <section class="learn-panel">
        <h2 class="learn-panel__title">易错提示</h2>
        <ul class="learn-list">
          <li v-for="item in PITFALLS" :key="item.id" class="learn-item">
            <span class="learn-item__title">{{ item.title }}</span>
            <p class="learn-item__summary" v-html="renderEmphasis(item.text)"></p>
          </li>
        </ul>
      </section>

      <!-- 判读练习 -->
      <section class="learn-panel ocean-lab__quiz">
        <h2 class="learn-panel__title">判读练习</h2>

        <div v-if="!activeQuestion" class="learn-empty">暂时没有可用的练习题。</div>

        <template v-else>
          <p class="learn-panel__meta ocean-lab__quiz-progress">
            第 {{ questionIndex + 1 }} / {{ questionList.length }} 题 · {{ activeQuestion.tag }}
          </p>
          <p class="learn-lead--block ocean-lab__quiz-prompt">{{ activeQuestion.prompt }}</p>
          <p class="learn-panel__meta">{{ activeQuestion.hint }}</p>

          <div class="ocean-lab__options" role="group" aria-label="选项">
            <button
              v-for="option in activeQuestion.options"
              :key="option.id"
              type="button"
              class="ocean-lab__option"
              :class="optionClass(option)"
              :disabled="Boolean(answer)"
              @click="chooseOption(option)"
            >
              {{ option.label }}
            </button>
          </div>

          <section
            v-if="answer"
            class="learn-panel ocean-lab__feedback"
            :class="answer.correct ? 'is-right' : 'is-wrong'"
          >
            <h3 class="learn-panel__title">{{ answer.title }}</h3>
            <!-- 文案来自仓库内的静态数据 src/data/oceanCurrentLab.js，先转义再转 strong -->
            <p class="learn-lead--block" v-html="renderEmphasis(answer.text)"></p>
          </section>

          <div class="ocean-lab__nav">
            <button
              type="button"
              class="learn-top__back"
              :disabled="questionIndex === 0"
              @click="go(-1)"
            >
              上一题
            </button>
            <button
              type="button"
              class="learn-top__back"
              :disabled="questionIndex >= questionList.length - 1"
              @click="go(1)"
            >
              下一题
            </button>
          </div>
        </template>
      </section>

      <RelatedOutline tool="/tools/ocean-current" />
    </main>
  </div>
</template>

<script setup>
/**
 * 洋流判读实验。
 *
 * 世界国界做底图（只画轮廓），上面叠洋流箭头，点箭头读洋流：
 *   寒暖 —— 由 heat / water 字段推出，与走线的方向自洽；
 *   成因 —— 风海流 / 密度流 / 补偿流；
 *   「8—0」—— 切到北半球或南半球视图，标出赤道逆流、西风漂流与北纬 40° 连接处；
 *   北印度洋 —— 切夏季 / 冬季，索马里半岛沿岸的方向与寒暖同时改变；
 *   练习 —— 判寒暖 / 判成因 / 认洋流，答错给纠正性提示。
 *
 * 判据与数据都在 src/data/oceanCurrentLab.js，组件只负责画图和收答案。
 */
import { computed, onMounted, ref, watch } from 'vue'
import SourceNote from './SourceNote.vue'
import RelatedOutline from './RelatedOutline.vue'
import { TOOL_SOURCES } from '../data/toolSources'

import { assetUrl } from '../utils/base'
import { renderEmphasis } from '../utils/richText'
import {
  CAUSE_LABELS,
  GYRE_ANCHORS,
  GYRE_FILTERS,
  HEAT_LABELS,
  MAP_HEIGHT,
  MAP_WIDTH,
  MONSOON_CURRENT,
  NATURE_LABELS,
  OCEAN_CURRENTS,
  OCEAN_CURRENT_QUESTIONS,
  PITFALLS,
  READING_STEPS,
  SEASONS,
  VIEW_MODES,
  buildCoastPaths,
  currentLabelAt,
  project,
} from '../data/oceanCurrentLab'

const props = defineProps({
  /** 底图地址，默认取仓库内的世界国界数据 */
  geojsonUrl: { type: String, default: () => assetUrl('/geojson/world-countries.json') },
  /** 直接给底图数据；给了就不发网络请求（测试用） */
  geojson: { type: Object, default: null },
  /** 洋流数据；不传就用内置数据，传空数组可以试空态 */
  currents: { type: Array, default: null },
  /** 北印度洋季风洋流数据 */
  monsoon: { type: Object, default: null },
  /** 练习题 */
  questions: { type: Array, default: null },
})

const status = ref('loading')
const loadError = ref('')
const coastPaths = ref([])
const viewMode = ref('all')
const season = ref('summer')
const showLabels = ref(false)
const selectedId = ref(null)

const questionIndex = ref(0)
const answer = ref(null)
const solved = ref([])

/** 载入底图：props.geojson 给了就不发请求 */
const load = async () => {
  status.value = 'loading'
  loadError.value = ''
  try {
    let geo = props.geojson
    if (!geo) {
      const response = await fetch(props.geojsonUrl)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      geo = await response.json()
    }
    coastPaths.value = buildCoastPaths(geo)
    status.value = 'ready'
  } catch (e) {
    coastPaths.value = []
    loadError.value = `世界底图加载失败：${e.message}`
    status.value = 'error'
  }
}

onMounted(load)

// 外部换了一份底图就重新装载
watch(() => props.geojson, load)

const loading = computed(() => status.value === 'loading')

const currentList = computed(() => props.currents ?? OCEAN_CURRENTS)
const monsoonData = computed(() => props.monsoon ?? MONSOON_CURRENT)
const questionList = computed(() => props.questions ?? OCEAN_CURRENT_QUESTIONS)

/** 当前季节下的季风洋流状态 */
const monsoonState = computed(() => monsoonData.value?.seasons?.[season.value] ?? null)

/** 地图上要画的洋流：常规洋流 + 当前季节的季风洋流 */
const renderables = computed(() => {
  const list = currentList.value.map((item) => ({ ...item, seasonal: false }))
  const state = monsoonState.value
  if (state && monsoonData.value) {
    list.push({
      ...monsoonData.value,
      ...state,
      id: monsoonData.value.id,
      name: `${monsoonData.value.name}（${state.label}）`,
      seasonal: true,
    })
  }
  return list
})

/** 按视图模式过滤：北半球「8」/南半球「0」都不含北印度洋季风洋流 */
const visibleCurrents = computed(() => {
  const filter = GYRE_FILTERS[viewMode.value]
  if (!filter) return renderables.value
  return renderables.value.filter((item) => filter.includes(item.gyre))
})

const listByNature = computed(() => ({
  warm: currentList.value.filter((item) => item.nature === 'warm'),
  cold: currentList.value.filter((item) => item.nature === 'cold'),
}))

const selected = computed(
  () => renderables.value.find((item) => item.id === selectedId.value) ?? null,
)

const anchorPoints = computed(() =>
  GYRE_ANCHORS.filter((anchor) => anchor.modes.includes(viewMode.value)).map((anchor) => {
    const [x, y] = project([anchor.lon, anchor.lat])
    return { ...anchor, x, y }
  }),
)

const viewNote = computed(
  () => VIEW_MODES.find((mode) => mode.id === viewMode.value)?.note ?? '',
)

const seasonNote = computed(() => {
  const state = monsoonState.value
  if (!state) return ''
  return `北印度洋（${state.label}）：${state.direction}，为${NATURE_LABELS[state.nature]}。索马里半岛沿岸是判别突破口。`
})

const activeQuestion = computed(() => questionList.value[questionIndex.value] ?? null)

/** 走线转 path */
const pathOf = (current) =>
  (current.path ?? [])
    .map((point, index) => {
      const [x, y] = project(point)
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

/** 中段再放一个箭头，长洋流的方向感更强 */
const midOf = (current) => {
  const points = current.path ?? []
  if (points.length < 3) return ''
  const index = Math.max(1, Math.floor(points.length / 2))
  const [ax, ay] = project(points[index - 1])
  const [bx, by] = project(points[index])
  return `M${ax.toFixed(1)} ${ay.toFixed(1)} L${bx.toFixed(1)} ${by.toFixed(1)}`
}

const markerOf = (current) =>
  `url(#ocean-arrow-${current.nature === 'warm' ? 'warm' : 'cold'})`

const currentClass = (current) => ({
  'is-warm': current.nature === 'warm',
  'is-cold': current.nature === 'cold',
  'is-picked': selectedId.value === current.id,
  'is-compensation': current.cause === 'compensation',
})

const labelAt = (current) => currentLabelAt(current)

const optionClass = (option) => {
  if (!answer.value) return {}
  const correct = option.id === activeQuestion.value?.answerId
  return {
    'is-right': correct,
    'is-wrong': !correct && option.id === answer.value.pickedId,
  }
}

/** 切视图：把选中的洋流清掉，避免详情与图对不上 */
const setView = (id) => {
  viewMode.value = id
  selectedId.value = null
}

const setSeason = (id) => {
  season.value = id
}

const pick = (current) => {
  selectedId.value = selectedId.value === current.id ? null : current.id
}

const chooseOption = (option) => {
  const question = activeQuestion.value
  if (!question || answer.value) return
  const correct = option.id === question.answerId
  answer.value = {
    correct,
    pickedId: option.id,
    title: correct ? '判读正确' : '再核对一次',
    text: correct
      ? question.explain
      : (question.wrong?.[option.id] ?? question.wrongDefault),
  }
  if (correct && !solved.value.includes(question.id)) {
    solved.value = [...solved.value, question.id]
  }
}

/** 换题：答案要清掉 */
const go = (delta) => {
  const next = questionIndex.value + delta
  if (next < 0 || next >= questionList.value.length) return
  questionIndex.value = next
  answer.value = null
}
</script>

<style scoped>
.ocean-lab__controls {
  display: block;
}

.ocean-lab__title--spaced {
  margin-top: var(--sp-3);
}

.ocean-lab__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.ocean-lab__tab {
  padding: var(--sp-2) var(--sp-4);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
  background: var(--learn-panel);
  color: var(--learn-ink);
  font-family: var(--font-ui);
  font-size: var(--fs-body);
  cursor: pointer;
}

.ocean-lab__tab:hover {
  border-color: var(--learn-accent);
  color: var(--learn-accent);
}

.ocean-lab__tab.is-active {
  border-color: var(--learn-accent);
  background: var(--learn-accent-soft);
  color: var(--learn-accent);
}

.ocean-lab__note {
  margin-top: var(--sp-2);
}

.ocean-lab__switch {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
  color: var(--learn-ink-soft);
  font-size: var(--fs-body);
  cursor: pointer;
}

.ocean-lab__map {
  display: block;
  width: 100%;
  height: auto;
  margin-top: var(--sp-3);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
  background: var(--learn-bg);
}

.ocean-lab__bg {
  fill: var(--learn-panel);
}

.ocean-lab__coast {
  fill: none;
  stroke: var(--learn-line);
  stroke-width: 0.5;
  stroke-linejoin: round;
}

.ocean-lab__equator {
  stroke: var(--learn-line);
  stroke-width: 0.4;
  stroke-dasharray: 3 3;
}

.ocean-lab__current {
  cursor: pointer;
}

.ocean-lab__hit {
  fill: none;
  stroke: transparent;
  stroke-width: 6;
  stroke-linecap: round;
  pointer-events: stroke;
}

.ocean-lab__flow {
  fill: none;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

.ocean-lab__flow--mid {
  stroke-width: 1.4;
}

.ocean-lab__current.is-warm .ocean-lab__flow {
  stroke: var(--learn-warn);
}

.ocean-lab__current.is-cold .ocean-lab__flow {
  stroke: var(--learn-accent);
}

.ocean-lab__current.is-compensation .ocean-lab__flow {
  stroke-dasharray: 4 2;
}

.ocean-lab__current:hover .ocean-lab__flow {
  stroke-width: 2.4;
}

.ocean-lab__current.is-picked .ocean-lab__flow {
  stroke-width: 2.8;
}

.ocean-lab__arrow--warm {
  fill: var(--learn-warn);
}

.ocean-lab__arrow--cold {
  fill: var(--learn-accent);
}

.ocean-lab__label {
  fill: var(--learn-ink);
  font-family: var(--font-ui);
  font-size: 5px;
  text-anchor: middle;
  paint-order: stroke;
  stroke: var(--learn-panel);
  stroke-width: 1.6;
  pointer-events: none;
}

.ocean-lab__anchor circle {
  fill: var(--learn-panel);
  stroke: var(--learn-accent);
  stroke-width: 0.6;
}

.ocean-lab__anchor text {
  fill: var(--learn-accent);
  font-family: var(--font-ui);
  font-size: 4.6px;
  pointer-events: none;
}

.ocean-lab__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-4);
  margin-top: var(--sp-3);
  color: var(--learn-ink-soft);
  font-size: var(--fs-body);
}

.ocean-lab__legend-item {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
}

.ocean-lab__swatch {
  display: inline-block;
  width: var(--sp-4);
  height: var(--sp-1);
  border-radius: var(--radius-sm);
}

.ocean-lab__swatch--warm {
  background: var(--learn-warn);
}

.ocean-lab__swatch--cold {
  background: var(--learn-accent);
}

.ocean-lab__swatch--up {
  background: var(--learn-accent);
  border-top: 1px dashed var(--learn-ink-faint);
  height: var(--sp-2);
  border-bottom: 1px dashed var(--learn-ink-faint);
}

.ocean-lab__columns {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(240px, 1fr);
  gap: var(--sp-4);
  align-items: start;
}

@media (max-width: 760px) {
  .ocean-lab__columns {
    grid-template-columns: 1fr;
  }
}

.ocean-lab__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}

.ocean-lab__tag {
  padding: var(--sp-1) var(--sp-3);
  border-radius: 999px;
  font-size: var(--fs-label);
}

.ocean-lab__tag.is-warm {
  background: var(--learn-accent-soft);
  color: var(--learn-accent);
}

.ocean-lab__tag.is-cold {
  background: var(--learn-accent-soft);
  color: var(--learn-accent);
}

.ocean-lab__tag--plain {
  background: transparent;
  color: var(--learn-ink-faint);
  border: 1px solid var(--learn-line);
}

.ocean-lab__facts {
  margin: 0;
}

.ocean-lab__facts dt {
  margin-top: var(--sp-3);
  font-size: var(--fs-label);
  color: var(--learn-ink-faint);
}

.ocean-lab__facts dd {
  margin: var(--sp-1) 0 0;
  font-size: var(--fs-body);
  line-height: 1.75;
}

.ocean-lab__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
}

.ocean-lab__chip {
  padding: var(--sp-1) var(--sp-3);
  border: 1px solid var(--learn-line);
  border-radius: 999px;
  background: var(--learn-panel);
  color: var(--learn-ink-soft);
  font-family: var(--font-ui);
  font-size: var(--fs-label);
  cursor: pointer;
}

.ocean-lab__chip:hover {
  border-color: var(--learn-accent);
  color: var(--learn-accent);
}

.ocean-lab__chip.is-active {
  border-color: var(--learn-accent);
  background: var(--learn-accent-soft);
  color: var(--learn-accent);
}

.ocean-lab__steps {
  margin: 0;
  padding: 0;
  list-style: none;
}

.ocean-lab__step {
  display: flex;
  gap: var(--sp-3);
  padding: var(--sp-2) 0;
  border-bottom: 1px solid var(--learn-line);
}

.ocean-lab__step:last-child {
  border-bottom: none;
}

.ocean-lab__step-no {
  flex: none;
  width: var(--sp-5);
  height: var(--sp-5);
  border-radius: 50%;
  background: var(--learn-accent-soft);
  color: var(--learn-accent);
  font-family: var(--font-mono);
  font-size: var(--fs-body);
  line-height: var(--sp-5);
  text-align: center;
}

.ocean-lab__step-body {
  display: block;
}

.ocean-lab__step-title {
  display: block;
  font-weight: 600;
  color: var(--learn-ink);
}

.ocean-lab__step-text {
  display: block;
  color: var(--learn-ink-soft);
  font-size: var(--fs-body);
}

.ocean-lab__quiz-progress {
  margin-top: 0;
}

.ocean-lab__quiz-prompt {
  margin: var(--sp-2) 0;
  font-weight: 600;
  color: var(--learn-ink);
}

.ocean-lab__options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
}

.ocean-lab__option {
  padding: var(--sp-2) var(--sp-4);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
  background: var(--learn-panel);
  color: var(--learn-ink);
  font-family: var(--font-ui);
  font-size: var(--fs-body);
  text-align: left;
  cursor: pointer;
}

.ocean-lab__option:hover:not(:disabled) {
  border-color: var(--learn-accent);
  color: var(--learn-accent);
}

.ocean-lab__option:disabled {
  cursor: default;
  opacity: 0.8;
}

.ocean-lab__option.is-right {
  border-color: var(--learn-accent);
  background: var(--learn-accent-soft);
  color: var(--learn-accent);
}

.ocean-lab__option.is-wrong {
  border-color: var(--learn-warn);
  color: var(--learn-warn);
}

.ocean-lab__feedback {
  margin-top: var(--sp-4);
}

.ocean-lab__feedback.is-right {
  border-left: 4px solid var(--learn-accent);
}

.ocean-lab__feedback.is-wrong {
  border-left: 4px solid var(--learn-warn);
}

.ocean-lab__nav {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-4);
}
</style>
