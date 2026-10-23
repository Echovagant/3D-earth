<template>
  <div class="learn-page pressure-belt-lab">
    <header class="learn-top">
      <router-link class="learn-top__back" to="/course">
        <span>‹</span><span>返回课程地图</span>
      </router-link>
      <span class="learn-top__title">气压带风带实验</span>
      <span class="learn-top__spacer"></span>
      <span class="learn-panel__meta">
        气压带 {{ pressureList.length }} 个 · 风带 {{ windList.length }} 个
      </span>
    </header>

    <main class="learn-main">
      <h1 class="learn-h1">气压带与风带互动实验</h1>
      <p class="learn-lead">
        点图上的带看它的成因、天气与气候；拖动滑块看整组气压带风带随季节南北移动；最后做反向练习，把描述和带对上号。
      </p>
      <SourceNote :source="TOOL_SOURCES['pressure-belt']" />

      <div v-if="loading" class="learn-empty">载入气压带风带数据…</div>
      <div v-else-if="error" class="learn-error">
        <p>{{ error }}</p>
        <button type="button" class="learn-top__back" @click="load">重试</button>
      </div>
      <div v-else-if="empty" class="learn-empty">暂时没有可用的气压带风带数据。</div>

      <template v-else>
        <!-- 季节移动 -->
        <section class="learn-panel">
          <h2 class="learn-panel__title">季节：太阳直射点在哪</h2>
          <p class="learn-panel__meta">
            当前直射点 δ = {{ deltaText }}。直射点向北，整组气压带风带跟着北移；直射点向南，整组南移。
          </p>

          <div class="pressure-belt-lab__season">
            <input
              v-model.number="delta"
              class="pressure-belt-lab__slider"
              type="range"
              :min="-SUBSOLAR_LIMIT"
              :max="SUBSOLAR_LIMIT"
              step="0.5"
              aria-label="太阳直射点纬度"
            />
            <span class="pressure-belt-lab__season-value">{{ deltaText }}</span>
          </div>

          <div class="pressure-belt-lab__seasons" role="group" aria-label="节气">
            <button
              v-for="season in seasonList"
              :key="season.id"
              type="button"
              class="pressure-belt-lab__season-btn"
              :class="{ 'is-active': season.delta === delta }"
              @click="setSeason(season)"
            >
              {{ season.name }}
            </button>
          </div>

          <p class="learn-panel__meta learn-panel__meta--spaced">{{ seasonNote }}</p>
        </section>

        <!-- 示意图 + 侧栏 -->
        <section class="learn-panel">
          <h2 class="learn-panel__title">三圈环流示意图</h2>
          <p class="learn-panel__meta">
            斜线块是气压带，空白块是风带；风带里的箭头表示气流前进方向。点任意一条带看它的信息。
          </p>

          <div class="pressure-belt-lab__body">
            <div class="pressure-belt-lab__figure">
              <svg
                class="pressure-belt-lab__globe"
                :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`"
                role="img"
                :aria-label="`三圈环流示意图，当前太阳直射点 ${deltaText}`"
              >
                <defs>
                  <clipPath id="pressure-belt-lab-clip">
                    <circle :cx="CX" :cy="CY" :r="R" />
                  </clipPath>
                  <pattern
                    id="pressure-belt-lab-hatch"
                    width="8"
                    height="8"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="8"
                      stroke="var(--learn-accent)"
                      stroke-width="1.1"
                      opacity="0.45"
                    />
                  </pattern>
                </defs>

                <circle :cx="CX" :cy="CY" :r="R" class="pressure-belt-lab__disc" />

                <g clip-path="url(#pressure-belt-lab-clip)">
                  <!-- 纬线 -->
                  <line
                    v-for="line in graticule"
                    :key="`lat-${line.lat}`"
                    class="pressure-belt-lab__graticule"
                    :class="{ 'is-equator': line.lat === 0 }"
                    :x1="CX - line.half"
                    :y1="line.y"
                    :x2="CX + line.half"
                    :y2="line.y"
                  />
                  <!-- 经线 -->
                  <ellipse
                    v-for="meridian in meridians"
                    :key="`mer-${meridian.lon}`"
                    class="pressure-belt-lab__graticule"
                    :cx="CX"
                    :cy="CY"
                    :rx="R"
                    :ry="meridian.ry"
                  />

                  <!-- 直射点所在纬度 -->
                  <line
                    class="pressure-belt-lab__sunline"
                    :x1="CX - R"
                    :y1="sunY"
                    :x2="CX + R"
                    :y2="sunY"
                  />

                  <!-- 气压带与风带 -->
                  <g
                    v-for="band in bands"
                    :key="band.id"
                    class="pressure-belt-lab__band"
                    :class="bandClass(band)"
                    role="button"
                    tabindex="0"
                    :aria-label="band.ariaLabel"
                    @click="select(band.id)"
                    @keydown.enter.prevent="select(band.id)"
                    @keydown.space.prevent="select(band.id)"
                  >
                    <rect
                      class="pressure-belt-lab__band-rect"
                      :class="band.kind"
                      :x="CX - R"
                      :y="band.top"
                      :width="R * 2"
                      :height="band.height"
                    />
                    <rect
                      v-if="band.kind === 'pressure'"
                      class="pressure-belt-lab__band-hatch"
                      :x="CX - R"
                      :y="band.top"
                      :width="R * 2"
                      :height="band.height"
                    />
                    <text
                      class="pressure-belt-lab__band-label"
                      :class="{ 'is-small': band.thin }"
                      :x="band.labelX"
                      :y="band.labelY"
                    >
                      {{ band.shortLabel }}
                    </text>
                    <text
                      v-if="band.windLabel"
                      class="pressure-belt-lab__band-wind"
                      :x="band.windLabelX"
                      :y="band.labelY"
                    >
                      {{ band.windLabel }}
                    </text>
                    <g v-if="band.arrows.length" class="pressure-belt-lab__arrows">
                      <g v-for="(arrow, index) in band.arrows" :key="`arrow-${index}`">
                        <line
                          class="pressure-belt-lab__arrow"
                          :x1="arrow.x1"
                          :y1="arrow.y1"
                          :x2="arrow.x2"
                          :y2="arrow.y2"
                        />
                        <path class="pressure-belt-lab__arrow-head" :d="arrow.head" />
                      </g>
                    </g>
                  </g>
                </g>

                <!-- 地球轮廓与刻度 -->
                <circle :cx="CX" :cy="CY" :r="R" class="pressure-belt-lab__edge" />
                <text
                  v-for="label in latLabels"
                  :key="`label-${label.lat}`"
                  class="pressure-belt-lab__lat-label"
                  :x="CX - R - 8"
                  :y="label.y + 4"
                >
                  {{ label.text }}
                </text>
                <circle
                  class="pressure-belt-lab__sun"
                  :cx="CX + sunHalf + 12"
                  :cy="sunY"
                  r="6"
                />
                <text class="pressure-belt-lab__sun-label" :x="CX + sunHalf + 22" :y="sunY + 4">
                  δ
                </text>
              </svg>

              <div class="pressure-belt-lab__legend">
                <span class="pressure-belt-lab__legend-item">
                  <span class="pressure-belt-lab__swatch is-pressure"></span>气压带（斜线）
                </span>
                <span class="pressure-belt-lab__legend-item">
                  <span class="pressure-belt-lab__swatch is-wind"></span>风带（空白，箭头示风向）
                </span>
                <span class="pressure-belt-lab__legend-item">
                  <span class="pressure-belt-lab__swatch is-selected"></span>当前选中
                </span>
              </div>

              <div class="pressure-belt-lab__hemispheres" role="group" aria-label="半球显示">
                <button
                  v-for="view in hemisphereViews"
                  :key="view.id"
                  type="button"
                  class="pressure-belt-lab__season-btn"
                  :class="{ 'is-active': hemisphereView === view.id }"
                  @click="hemisphereView = view.id"
                >
                  {{ view.name }}
                </button>
              </div>
            </div>

            <aside class="pressure-belt-lab__side">
              <h3 class="pressure-belt-lab__side-title">
                {{ selected ? selected.name : '点一条带看它的信息' }}
              </h3>

              <template v-if="selected">
                <p class="learn-panel__meta">
                  {{ selected.kind === 'pressure' ? '气压带' : '风带' }} ·
                  {{ hemisphereText(selected) }} · {{ selected.pairName }}
                </p>

                <dl class="pressure-belt-lab__detail">
                  <template v-if="selected.kind === 'pressure'">
                    <dt>位置</dt>
                    <dd>
                      {{ selected.positionText }}<br />
                      <span class="pressure-belt-lab__now">当前 {{ rangeText(selected) }}</span>
                    </dd>
                    <dt>成因</dt>
                    <dd>{{ selected.causeType }}：{{ selected.cause }}</dd>
                    <dt>垂直运动</dt>
                    <dd>{{ selected.vertical }}</dd>
                    <dt>天气</dt>
                    <dd>{{ selected.weather }}</dd>
                    <dt>气候</dt>
                    <dd>{{ selected.climate }}</dd>
                    <dt>附近风力</dt>
                    <dd>{{ selected.nearbyWind }}</dd>
                    <dt>简称</dt>
                    <dd>
                      {{ selected.shortNameAllowed ? `可简称「${selected.shortName}」` : '没有通用简称' }}
                    </dd>
                  </template>

                  <template v-else>
                    <dt>位置</dt>
                    <dd>
                      {{ selected.positionText }}<br />
                      <span class="pressure-belt-lab__now">当前 {{ rangeText(selected) }}</span>
                    </dd>
                    <dt>风向</dt>
                    <dd>
                      {{ hemisphereText(selected) }}吹{{ selected.windName }}
                      <span class="pressure-belt-lab__now">
                        （{{ selected.flow.lon < 0 ? '偏西' : '偏东' }} ·
                        {{ selected.flow.lat > 0 ? '偏北' : '偏南' }}）
                      </span>
                    </dd>
                    <dt>热量 / 干湿</dt>
                    <dd>{{ selected.heat }} · {{ selected.moisture }}（{{ selected.thermalMoisture }}）</dd>
                    <dt>成因机制</dt>
                    <dd>{{ selected.mechanism }}</dd>
                    <dt>主导降水</dt>
                    <dd>{{ selected.precipitation }}</dd>
                  </template>
                </dl>

                <div v-if="pairedBelt" class="pressure-belt-lab__mirror">
                  <p class="pressure-belt-lab__mirror-title">另一半球对照</p>
                  <p class="learn-panel__meta">
                    {{ pairedBelt.name }}：{{ pairedBelt.positionText }}，
                    {{ pairedBelt.kind === 'wind' ? `吹${pairedBelt.windName}` : `${pairedBelt.weather}、${pairedBelt.climate}` }}。
                    {{ pairedBelt.kind === 'wind' ? '风向与所选的一带相反。' : '位置、天气、气候与所选的一带一致。' }}
                  </p>
                  <svg
                    v-if="pairedBelt.kind === 'wind'"
                    class="pressure-belt-lab__mirror-arrow"
                    :viewBox="`0 0 120 60`"
                    role="img"
                    aria-label="南北半球风向相反"
                  >
                    <line class="pressure-belt-lab__mirror-axis" x1="60" y1="4" x2="60" y2="56" />
                    <g v-for="item in mirrorArrows" :key="item.id">
                      <text class="pressure-belt-lab__mirror-tag" x="4" :y="item.y + 4">
                        {{ item.tag }}
                      </text>
                      <line
                        class="pressure-belt-lab__arrow"
                        :x1="item.x1"
                        :y1="item.y"
                        :x2="item.x2"
                        :y2="item.y"
                      />
                      <path class="pressure-belt-lab__arrow-head" :d="item.head" />
                    </g>
                  </svg>
                </div>

                <div v-if="linkedPitfalls.length" class="pressure-belt-lab__pitfalls">
                  <p class="pressure-belt-lab__mirror-title">别踩这个坑</p>
                  <p v-for="pitfall in linkedPitfalls" :key="pitfall.id" class="learn-panel__meta">
                    <strong>{{ pitfall.title }}</strong>：{{ pitfall.fix }}
                  </p>
                </div>
              </template>

              <template v-else>
                <p class="learn-panel__meta">
                  气压带与风带相间分布，每个气压带的两侧一定是风带；南北半球结构一致，只有风向相反。
                </p>
                <p class="pressure-belt-lab__rule">
                  <!-- 说明文字来自仓库内的静态数据 src/data/pressureBeltLab.js，先转义再转 strong -->
                  <span v-html="renderEmphasis(ALTERNATION_RULE)"></span>
                </p>
                <p class="pressure-belt-lab__rule">
                  <span v-html="renderEmphasis(WIND_DEFLECTION_RULE)"></span>
                </p>
                <p class="pressure-belt-lab__rule">
                  <span v-html="renderEmphasis(SHORT_NAME_RULE)"></span>
                </p>
              </template>
            </aside>
          </div>
        </section>

        <!-- 南北半球对照 -->
        <section class="learn-panel">
          <h2 class="learn-panel__title">南北半球对照</h2>
          <p class="learn-panel__meta">
            同一纬度带在两个半球的位置、天气、气候一致，风向相反：北半球向右偏，南半球向左偏。
          </p>
          <table class="learn-table pressure-belt-lab__table">
            <thead>
              <tr>
                <th>带</th>
                <th>北半球</th>
                <th>南半球</th>
                <th>对照结论</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in comparisonRows" :key="row.key">
                <td>{{ row.name }}</td>
                <td>{{ row.northText }}</td>
                <td>{{ row.southText }}</td>
                <td>{{ row.conclusion }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- 反向练习 -->
        <section class="learn-panel pressure-belt-lab__quiz">
          <h2 class="learn-panel__title">反向练习：描述 → 带</h2>
          <p class="learn-panel__meta">
            给一段描述，选出对应的带。答对会讲判据，答错也会告诉你错在哪儿。
          </p>

          <template v-if="activeQuiz">
            <div class="learn-bar">
              <div class="learn-bar__fill" :style="{ width: `${quizProgress}%` }"></div>
            </div>
            <p class="learn-panel__meta learn-panel__meta--spaced">
              第 {{ quizIndex + 1 }} / {{ quizList.length }} 题 · 已答对 {{ quizSolved.length }} 题
            </p>

            <p class="learn-lead--block pressure-belt-lab__prompt">{{ activeQuiz.prompt }}</p>

            <div class="pressure-belt-lab__options" role="group" aria-label="选项">
              <button
                v-for="optionId in activeQuiz.options"
                :key="optionId"
                type="button"
                class="pressure-belt-lab__option"
                :class="optionClass(optionId)"
                :disabled="Boolean(quizAnswer)"
                @click="answerQuiz(optionId)"
              >
                {{ beltName(optionId) }}
              </button>
            </div>

            <div
              v-if="quizAnswer"
              class="pressure-belt-lab__feedback"
              :class="quizAnswer.correct ? 'is-right' : 'is-wrong'"
            >
              <h3 class="learn-panel__title">{{ quizAnswer.correct ? '判读正确' : '再核对一次' }}</h3>
              <!-- 说明文字来自仓库内的静态数据 src/data/pressureBeltLab.js，先转义再转 strong -->
              <p class="learn-lead--block" v-html="renderEmphasis(quizAnswer.text)"></p>
              <p v-if="quizAnswer.hint" class="learn-lead--block" v-html="renderEmphasis(quizAnswer.hint)"></p>
            </div>

            <div class="pressure-belt-lab__nav">
              <button
                type="button"
                class="learn-top__back"
                :disabled="quizIndex === 0"
                @click="goQuiz(-1)"
              >
                上一题
              </button>
              <button
                type="button"
                class="learn-top__back"
                :disabled="quizIndex >= quizList.length - 1"
                @click="goQuiz(1)"
              >
                下一题
              </button>
            </div>
          </template>

          <div v-else class="learn-empty">暂时没有可用的练习题。</div>
        </section>

        <!-- 易错提醒 -->
        <section class="learn-panel">
          <h2 class="learn-panel__title">常见误区</h2>
          <ul class="learn-list">
            <li v-for="mistake in mistakes" :key="mistake.id" class="learn-item">
              <span class="learn-item__title">{{ mistake.title }}</span>
              <p class="learn-item__summary">{{ mistake.text }}</p>
              <p class="learn-item__summary">怎么改：{{ mistake.fix }}</p>
            </li>
          </ul>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup>
/**
 * 气压带与风带互动实验。
 *
 * 三件事：
 *   ① 点选：把 7 个气压带、6 个风带画成可点的条带，点开看成因、天气、气候与风向；
 *   ② 拖动：滑块改太阳直射点纬度 δ，整组气压带风带随之南北移动；
 *   ③ 对照与练习：南北半球并排比一遍，再做反向练习把描述和带对上号。
 *
 * 事实数据与判据文案都在 src/data/pressureBeltLab.js，组件只负责画图和收答案。
 */
import { computed, onMounted, ref, watch } from 'vue'
import SourceNote from './SourceNote.vue'
import { TOOL_SOURCES } from '../data/toolSources'

import { renderEmphasis } from '../utils/richText'
import {
  ALTERNATION_RULE,
  COMMON_MISTAKES,
  PRESSURE_BELTS,
  QUIZ_ITEMS,
  SEASONS,
  SHORT_NAME_RULE,
  SUBSOLAR_LIMIT,
  WIND_BELTS,
  WIND_DEFLECTION_RULE,
  beltRangeAt,
  findBelt,
  formatLatRange,
  hemispherePairs,
  matchKeywords,
  validateBeltData,
} from '../data/pressureBeltLab'

const props = defineProps({
  /** 可选的数据覆盖；不传就用内置数据，传空数组可以试空态 */
  pressureBelts: { type: Array, default: null },
  windBelts: { type: Array, default: null },
  quizItems: { type: Array, default: null },
  seasons: { type: Array, default: null },
})

/** 画布尺寸（SVG 用户单位） */
const VIEW_W = 460
const VIEW_H = 380
const CX = 220
const CY = 190
const R = 170

const status = ref('loading')
const error = ref('')
const pressureList = ref([])
const windList = ref([])
const quizList = ref([])

/** 太阳直射点纬度 δ */
const delta = ref(0)
/** 选中的带 id */
const selectedId = ref('')
/** 半球显示：all / north / south */
const hemisphereView = ref('all')
/** 反向练习 */
const quizIndex = ref(0)
const quizAnswer = ref(null)
const quizSolved = ref([])

const hemisphereViews = [
  { id: 'all', name: '全地球' },
  { id: 'north', name: '北半球' },
  { id: 'south', name: '南半球' },
]

const load = () => {
  error.value = ''
  try {
    const pressure = props.pressureBelts ?? PRESSURE_BELTS
    const wind = props.windBelts ?? WIND_BELTS
    const quiz = props.quizItems ?? QUIZ_ITEMS

    if (pressure.length === 0 && wind.length === 0) {
      pressureList.value = []
      windList.value = []
      quizList.value = []
      status.value = 'empty'
      return
    }

    validateBeltData({ pressureBelts: pressure, windBelts: wind, quizItems: quiz })

    pressureList.value = pressure
    windList.value = wind
    quizList.value = quiz
    status.value = 'ready'
  } catch (e) {
    pressureList.value = []
    windList.value = []
    quizList.value = []
    error.value = `气压带风带数据不可用：${e.message}`
    status.value = 'error'
  }
}

onMounted(load)

watch(
  () => [props.pressureBelts, props.windBelts, props.quizItems],
  () => {
    selectedId.value = ''
    quizAnswer.value = null
    load()
  },
)

const loading = computed(() => status.value === 'loading')
const empty = computed(() => status.value === 'empty')
const seasonList = computed(() => props.seasons ?? SEASONS)
const mistakes = computed(() => COMMON_MISTAKES)

const allBelts = computed(() => [...pressureList.value, ...windList.value])
const selected = computed(() => findBelt(selectedId.value, allBelts.value))

const deltaText = computed(() => {
  const value = delta.value ?? 0
  const unit = value >= 0 ? 'N' : 'S'
  return `${Math.abs(value).toFixed(1)}°${unit}`
})

const seasonNote = computed(() => {
  const season = seasonList.value.find((item) => item.delta === delta.value)
  return season?.note ?? '滑块可连续取值：直射点在哪，整组气压带风带就跟到哪。'
})

const setSeason = (season) => {
  delta.value = season.delta
}

/* ---------------------------------------------------------------- 画图 */

const latToY = (lat) => CY - (lat / 90) * R

/** 某个纬度上圆的可视半宽 */
const halfWidthAt = (y) => Math.sqrt(Math.max(0, R * R - (y - CY) * (y - CY)))

const graticule = computed(() =>
  [-60, -30, 0, 30, 60].map((lat) => {
    const y = latToY(lat)
    return { lat, y, half: halfWidthAt(y) }
  }),
)

const meridians = computed(() =>
  [-60, -30, 30, 60].map((lon) => ({ lon, ry: Math.abs(R * Math.sin((lon * Math.PI) / 180)) })),
)

const latLabels = computed(() =>
  [-90, -60, -30, 0, 30, 60, 90].map((lat) => ({
    lat,
    y: latToY(lat),
    text: lat === 0 ? '0°' : `${Math.abs(lat)}°${lat > 0 ? 'N' : 'S'}`,
  })),
)

const sunY = computed(() => latToY(delta.value ?? 0))
const sunHalf = computed(() => halfWidthAt(sunY.value))

/** 按气流方向画一支箭头（屏幕坐标：y 向下） */
const buildArrow = (x, y, flow, len) => {
  const norm = Math.hypot(flow.lon, flow.lat) || 1
  const dx = (flow.lon / norm) * (len / 2)
  const dy = (-flow.lat / norm) * (len / 2)
  const tipX = x + dx
  const tipY = y + dy
  const headLen = Math.min(11, len * 0.4)
  const baseX = tipX - (dx / (len / 2)) * headLen
  const baseY = tipY - (dy / (len / 2)) * headLen
  const nx = -dy / (len / 2)
  const ny = dx / (len / 2)
  const halfW = headLen * 0.42
  return {
    x1: x - dx,
    y1: y - dy,
    x2: baseX,
    y2: baseY,
    head: `M${tipX} ${tipY} L${baseX + nx * halfW} ${baseY + ny * halfW} L${baseX - nx * halfW} ${
      baseY - ny * halfW
    } Z`,
  }
}

const bands = computed(() => {
  const list = allBelts.value
  return list.map((belt) => {
    const range = beltRangeAt(belt, delta.value)
    const top = latToY(Math.max(range.latFrom, range.latTo))
    const bottom = latToY(Math.min(range.latFrom, range.latTo))
    const height = Math.max(1, bottom - top)
    const centerY = (top + bottom) / 2
    const half = halfWidthAt(centerY)

    const arrows = []
    let windLabel = null
    let windLabelX = 0

    if (belt.kind === 'wind') {
      const len = Math.min(height * 0.55, 32)
      const spots = half >= 130 ? [CX + 20, CX + 70] : [CX + 20]
      for (const spot of spots) {
        arrows.push(buildArrow(spot, centerY, belt.flow, len))
      }
      windLabel = belt.windName
      windLabelX = CX + half - 10
    }

    return {
      ...belt,
      top,
      height,
      thin: height < 26,
      labelX: CX - half + 10,
      labelY: centerY + 4,
      windLabel,
      windLabelX,
      arrows,
      currentRange: range,
      ariaLabel: `${belt.name}，位置 ${belt.positionText}`,
    }
  })
})

const bandClass = (band) => ({
  'is-selected': selectedId.value === band.id,
  'is-dim':
    hemisphereView.value !== 'all' &&
    band.hemisphere !== 'both' &&
    band.hemisphere !== hemisphereView.value,
})

const select = (id) => {
  selectedId.value = selectedId.value === id ? '' : id
}

const rangeText = (belt) => {
  const band = bands.value.find((item) => item.id === belt.id)
  return band ? formatLatRange(band.currentRange) : ''
}

const hemisphereText = (belt) => {
  if (belt.hemisphere === 'north') return '北半球'
  if (belt.hemisphere === 'south') return '南半球'
  return '南北两侧'
}

/** 另一半球的同纬度带 */
const pairedBelt = computed(() => {
  const belt = selected.value
  if (!belt || belt.hemisphere === 'both') return null
  const pair = allBelts.value.find(
    (item) => item.pairKey === belt.pairKey && item.hemisphere !== belt.hemisphere,
  )
  return pair ?? null
})

/** 南北半球风向相反的示意箭头 */
const mirrorArrows = computed(() => {
  const belt = selected.value
  const pair = pairedBelt.value
  if (!belt || !pair || belt.kind !== 'wind') return []
  const north = belt.hemisphere === 'north' ? belt : pair
  const south = belt.hemisphere === 'south' ? belt : pair
  const build = (item, y, tag) => {
    const arrow = buildArrow(92, y, item.flow, 36)
    return { id: item.id, tag, y, ...arrow }
  }
  return [build(north, 18, 'N'), build(south, 44, 'S')]
})

const linkedPitfalls = computed(() => {
  const belt = selected.value
  if (!belt) return []
  return COMMON_MISTAKES.filter((mistake) => belt.pitfallIds?.includes(mistake.id))
})

/* ------------------------------------------------------------ 对照表 */

const comparisonRows = computed(() =>
  hemispherePairs(allBelts.value).map((pair) => {
    const describe = (belt) =>
      belt.kind === 'pressure'
        ? `${Math.abs(belt.centerLat)}° 附近 · ${belt.vertical} · ${belt.weather} · ${belt.climate}`
        : `${belt.windName} · ${belt.heat} · ${belt.moisture} · ${belt.precipitation}`
    return {
      key: pair.key,
      name: pair.name,
      northText: describe(pair.north),
      southText: describe(pair.south),
      conclusion:
        pair.kind === 'pressure'
          ? '位置、天气、气候一致，成因也一致'
          : '位置、热量、干湿一致，风向相反',
    }
  }),
)

/* ---------------------------------------------------------- 反向练习 */

const activeQuiz = computed(() => quizList.value[quizIndex.value] ?? null)

const quizProgress = computed(() =>
  quizList.value.length ? Math.round((quizSolved.value.length / quizList.value.length) * 100) : 0,
)

const beltName = (id) => findBelt(id, allBelts.value)?.name ?? id

const optionClass = (optionId) => {
  if (!quizAnswer.value || !activeQuiz.value) return {}
  const correct = optionId === activeQuiz.value.answerId
  return {
    'is-right': correct,
    'is-wrong': !correct && optionId === quizAnswer.value.pickedId,
  }
}

const answerQuiz = (optionId) => {
  const item = activeQuiz.value
  if (!item || quizAnswer.value) return

  const correct = optionId === item.answerId
  const belt = findBelt(item.answerId, allBelts.value)
  const hits = matchKeywords(item.prompt, belt)

  quizAnswer.value = {
    correct,
    pickedId: optionId,
    text: correct
      ? item.explain
      : (item.wrong?.[optionId] ?? item.wrongDefault ?? '先看判据：垂直运动、纬度位置、风的来向。'),
    hint:
      !correct && hits.length
        ? `描述里的「${hits.join('」「')}」正是**${belt?.shortLabel ?? '正确答案'}**的判据关键词。`
        : '',
  }

  if (correct && !quizSolved.value.includes(item.id)) {
    quizSolved.value = [...quizSolved.value, item.id]
  }
}

const goQuiz = (deltaStep) => {
  const next = quizIndex.value + deltaStep
  if (next < 0 || next >= quizList.value.length) return
  quizIndex.value = next
  quizAnswer.value = null
}
</script>

<style scoped>
.pressure-belt-lab__season {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  margin-top: var(--sp-3);
}

.pressure-belt-lab__slider {
  flex: 1;
  min-width: 0;
  accent-color: var(--learn-accent);
}

.pressure-belt-lab__season-value {
  font-family: var(--font-mono);
  font-size: var(--fs-value);
  color: var(--learn-accent);
  white-space: nowrap;
}

.pressure-belt-lab__seasons,
.pressure-belt-lab__hemispheres {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
}

.pressure-belt-lab__season-btn {
  padding: var(--sp-1) var(--sp-3);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
  background: var(--learn-panel);
  color: var(--learn-ink-soft);
  font-family: var(--font-ui);
  font-size: var(--fs-body);
  cursor: pointer;
}

.pressure-belt-lab__season-btn:hover {
  border-color: var(--learn-accent);
  color: var(--learn-accent);
}

.pressure-belt-lab__season-btn.is-active {
  border-color: var(--learn-accent);
  background: var(--learn-accent-soft);
  color: var(--learn-accent);
}

.pressure-belt-lab__body {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(260px, 1fr);
  gap: var(--sp-5);
  align-items: start;
  margin-top: var(--sp-3);
}

@media (max-width: 860px) {
  .pressure-belt-lab__body {
    grid-template-columns: 1fr;
    gap: var(--sp-4);
  }
}

.pressure-belt-lab__figure {
  min-width: 0;
}

.pressure-belt-lab__globe {
  display: block;
  width: 100%;
  height: auto;
}

.pressure-belt-lab__disc {
  fill: var(--learn-panel);
}

.pressure-belt-lab__edge {
  fill: none;
  stroke: var(--learn-ink-soft);
  stroke-width: 1.4;
}

.pressure-belt-lab__graticule {
  stroke: var(--learn-ink-faint);
  stroke-width: 0.7;
  opacity: 0.55;
}

.pressure-belt-lab__graticule.is-equator {
  stroke: var(--learn-ink-soft);
  stroke-width: 1.2;
  opacity: 0.9;
}

.pressure-belt-lab__sunline {
  stroke: var(--learn-warn);
  stroke-width: 1.4;
  stroke-dasharray: 6 5;
  opacity: 0.8;
}

.pressure-belt-lab__sun {
  fill: var(--learn-warn);
}

.pressure-belt-lab__sun-label {
  fill: var(--learn-warn);
  font-family: var(--font-mono);
  font-size: 12px;
}

.pressure-belt-lab__lat-label {
  fill: var(--learn-ink-faint);
  font-family: var(--font-mono);
  font-size: 11px;
  text-anchor: end;
}

.pressure-belt-lab__band {
  cursor: pointer;
  transition: opacity var(--dur-fast) var(--ease);
}

.pressure-belt-lab__band.is-dim {
  opacity: 0.35;
}

.pressure-belt-lab__band-rect.pressure {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-accent);
  stroke-width: 0.8;
}

.pressure-belt-lab__band-rect.wind {
  fill: var(--learn-panel);
  stroke: var(--learn-ink-faint);
  stroke-width: 0.8;
  stroke-dasharray: 5 4;
}

.pressure-belt-lab__band-hatch {
  fill: url(#pressure-belt-lab-hatch);
  stroke: none;
  pointer-events: none;
}

.pressure-belt-lab__band:hover .pressure-belt-lab__band-rect {
  stroke: var(--learn-accent);
  stroke-width: 1.6;
}

.pressure-belt-lab__band.is-selected .pressure-belt-lab__band-rect {
  stroke: var(--learn-accent);
  stroke-width: 2.4;
}

.pressure-belt-lab__band-label {
  fill: var(--learn-ink);
  font-family: var(--font-ui);
  font-size: 12px;
  paint-order: stroke fill;
  stroke: var(--learn-panel);
  stroke-width: 3px;
  pointer-events: none;
}

.pressure-belt-lab__band-label.is-small {
  font-size: 10px;
}

.pressure-belt-lab__band-wind {
  fill: var(--learn-ink-soft);
  font-family: var(--font-ui);
  font-size: 11px;
  text-anchor: end;
  paint-order: stroke fill;
  stroke: var(--learn-panel);
  stroke-width: 3px;
  pointer-events: none;
}

.pressure-belt-lab__arrow {
  stroke: var(--learn-ink);
  stroke-width: 1.6;
  stroke-linecap: round;
}

.pressure-belt-lab__arrow-head {
  fill: var(--learn-ink);
}

.pressure-belt-lab__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-4);
  margin-top: var(--sp-3);
  font-size: var(--fs-body);
  color: var(--learn-ink-soft);
}

.pressure-belt-lab__legend-item {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
}

.pressure-belt-lab__swatch {
  display: inline-block;
  width: 22px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid var(--learn-line);
}

.pressure-belt-lab__swatch.is-pressure {
  background: var(--learn-accent-soft);
  border-color: var(--learn-accent);
}

.pressure-belt-lab__swatch.is-wind {
  background: var(--learn-panel);
  border-style: dashed;
}

.pressure-belt-lab__swatch.is-selected {
  background: var(--learn-panel);
  border-color: var(--learn-accent);
  border-width: 2px;
}

.pressure-belt-lab__side {
  min-width: 0;
  padding: var(--sp-4);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
  background: var(--learn-panel);
}

.pressure-belt-lab__side-title {
  margin: 0 0 var(--sp-2);
  font-size: var(--fs-value);
  font-weight: 600;
}

.pressure-belt-lab__detail {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--sp-1) var(--sp-3);
  margin: var(--sp-3) 0 0;
  font-size: var(--fs-body);
}

.pressure-belt-lab__detail dt {
  color: var(--learn-ink-faint);
  white-space: nowrap;
}

.pressure-belt-lab__detail dd {
  margin: 0;
  color: var(--learn-ink);
}

.pressure-belt-lab__now {
  color: var(--learn-ink-faint);
  font-family: var(--font-mono);
  font-size: var(--fs-label);
}

.pressure-belt-lab__rule {
  margin: var(--sp-2) 0 0;
  font-size: var(--fs-body);
  color: var(--learn-ink-soft);
}

.pressure-belt-lab__mirror,
.pressure-belt-lab__pitfalls {
  margin-top: var(--sp-4);
  padding-top: var(--sp-3);
  border-top: 1px solid var(--learn-line);
}

.pressure-belt-lab__mirror-title {
  margin: 0 0 var(--sp-2);
  font-size: var(--fs-body);
  font-weight: 600;
}

.pressure-belt-lab__mirror-arrow {
  display: block;
  width: 100%;
  max-width: 220px;
  height: auto;
  margin-top: var(--sp-2);
}

.pressure-belt-lab__mirror-axis {
  stroke: var(--learn-line);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.pressure-belt-lab__mirror-tag {
  fill: var(--learn-ink-faint);
  font-family: var(--font-mono);
  font-size: 11px;
}

.pressure-belt-lab__table {
  margin-top: var(--sp-3);
}

.pressure-belt-lab__prompt {
  margin-top: var(--sp-3);
}

.pressure-belt-lab__options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
}

.pressure-belt-lab__option {
  padding: var(--sp-2) var(--sp-4);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
  background: var(--learn-panel);
  color: var(--learn-ink);
  font-family: var(--font-ui);
  font-size: var(--fs-body);
  cursor: pointer;
}

.pressure-belt-lab__option:hover:not(:disabled) {
  border-color: var(--learn-accent);
  color: var(--learn-accent);
}

.pressure-belt-lab__option:disabled {
  cursor: default;
  opacity: 0.75;
}

.pressure-belt-lab__option.is-right {
  border-color: var(--learn-accent);
  background: var(--learn-accent-soft);
  color: var(--learn-accent);
}

.pressure-belt-lab__option.is-wrong {
  border-color: var(--learn-warn);
  color: var(--learn-warn);
}

.pressure-belt-lab__feedback {
  margin-top: var(--sp-4);
  padding: var(--sp-4);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
  background: var(--learn-panel);
}

.pressure-belt-lab__feedback.is-right {
  border-left: 4px solid var(--learn-accent);
}

.pressure-belt-lab__feedback.is-wrong {
  border-left: 4px solid var(--learn-warn);
}

.pressure-belt-lab__nav {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-4);
}
</style>
