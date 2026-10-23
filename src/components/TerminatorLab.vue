<template>
  <div class="learn-page terminator-lab">
    <header class="learn-top">
      <router-link class="learn-top__back" to="/course">
        <span>‹</span><span>返回课程地图</span>
      </router-link>
      <span class="learn-top__title">太阳高度角与晨昏线</span>
      <span class="learn-top__spacer"></span>
      <span class="learn-panel__meta">互动实验</span>
    </header>

    <main class="learn-main">
      <h1 class="learn-h1">太阳高度角与晨昏线</h1>
      <p class="learn-lead">
        拖动滑块改观察点纬度 φ 与太阳直射点纬度
        δ，正午太阳高度角、昼长、晨昏线走向和切点会实时跟着变。
      </p>

      <div v-if="loading" class="learn-empty">准备实验数据…</div>
      <div v-else-if="error" class="learn-error">
        <p>{{ error }}</p>
        <button type="button" class="learn-top__back" @click="load">重试</button>
      </div>
      <div v-else-if="!termList.length" class="learn-empty">没有可用的节气数据，实验无法开始。</div>

      <template v-else>
        <!-- ========== 交互一：正午太阳高度角计算器 ========== -->
        <section class="learn-panel">
          <h2 class="learn-panel__title">一、正午太阳高度角计算器</h2>
          <p class="learn-lead">
            正午太阳高度角 H = 90° − |φ − δ|。纬度差同减一加：φ、δ 同号用减，异号用加。
          </p>

          <div class="terminator-lab__controls">
            <div class="terminator-lab__control">
              <label class="terminator-lab__control-label" for="tl-phi">观察点纬度 φ</label>
              <input
                id="tl-phi"
                v-model.number="phi"
                class="terminator-lab__range"
                type="range"
                min="-90"
                max="90"
                step="0.5"
              />
              <output class="terminator-lab__control-value">{{ signed(phi) }}</output>
            </div>
            <div class="terminator-lab__control">
              <label class="terminator-lab__control-label" for="tl-delta">太阳直射点纬度 δ</label>
              <input
                id="tl-delta"
                v-model.number="delta"
                class="terminator-lab__range"
                type="range"
                min="-23.5"
                max="23.5"
                step="0.5"
              />
              <output class="terminator-lab__control-value">{{ signed(delta) }}</output>
            </div>
            <div class="terminator-lab__control">
              <label class="terminator-lab__control-label" for="tl-lon">直射点所在经线 λ₀</label>
              <input
                id="tl-lon"
                v-model.number="subsolarLongitude"
                class="terminator-lab__range"
                type="range"
                min="0"
                max="345"
                step="15"
              />
              <output class="terminator-lab__control-value">{{ subsolarLongitude }}°E</output>
            </div>
          </div>

          <div class="terminator-lab__presets">
            <span class="terminator-lab__preset-label">节气</span>
            <button
              v-for="term in termList"
              :key="term.id"
              type="button"
              class="learn-tag terminator-lab__preset"
              :class="{ 'terminator-lab__preset--on': Math.abs(delta - term.delta) < 0.01 }"
              :title="term.note"
              @click="delta = term.delta"
            >
              {{ term.name }}
            </button>
            <span class="terminator-lab__preset-label">观察点</span>
            <button
              v-for="point in pointList"
              :key="point.id"
              type="button"
              class="learn-tag terminator-lab__preset"
              :class="{ 'terminator-lab__preset--on': Math.abs(phi - point.phi) < 0.01 }"
              @click="phi = point.phi"
            >
              {{ point.name }}
            </button>
          </div>

          <p class="terminator-lab__formula">
            H = 90° − |φ − δ| = 90° − |{{ signed(phi) }} − {{ signed(delta) }}| =
            <strong>{{ round(noonAltitude) }}°</strong>
          </p>

          <dl class="terminator-lab__results">
            <div class="terminator-lab__result">
              <dt>正午太阳高度角</dt>
              <dd>{{ round(noonAltitude) }}°</dd>
            </div>
            <div class="terminator-lab__result">
              <dt>昼长</dt>
              <dd>{{ dayLengthText }}</dd>
            </div>
            <div class="terminator-lab__result">
              <dt>极昼 / 极夜</dt>
              <dd>{{ polarText }}</dd>
            </div>
            <div class="terminator-lab__result">
              <dt>正午太阳方位</dt>
              <dd>{{ azimuthText }}</dd>
            </div>
            <div class="terminator-lab__result">
              <dt>日出 / 日落地方时</dt>
              <dd>{{ riseSetText }}</dd>
            </div>
            <div class="terminator-lab__result">
              <dt>子夜太阳高度角</dt>
              <dd>{{ round(midnightAltitude) }}°</dd>
            </div>
            <div class="terminator-lab__result">
              <dt>一年中正午太阳高度的变化幅度 ΔH</dt>
              <dd>{{ round(annualRange) }}°</dd>
            </div>
            <div class="terminator-lab__result">
              <dt>一年中最小正午太阳高度</dt>
              <dd>{{ round(minAltitude) }}°</dd>
            </div>
            <div class="terminator-lab__result">
              <dt>楼间距（楼高 {{ buildingHeight }} m）</dt>
              <dd>{{ spacingText }}</dd>
            </div>
          </dl>
          <p class="learn-panel__meta learn-panel__meta--spaced">
            楼间距 L = H / tan θ，θ 取一年中正午太阳高度的最小值；北半球取冬至、南半球取夏至。
          </p>
        </section>

        <!-- ========== 交互二：晨昏线示意图 ========== -->
        <section class="learn-panel">
          <h2 class="learn-panel__title">二、晨昏线示意图</h2>
          <p class="learn-lead">
            晨昏线是一个大圆，垂直于太阳光线并过球心，由晨线（正在日出）和昏线（正在日落）两段组成。
            左图是 12 时经线一侧，右图是 0 时经线一侧，两个切点与两个赤道交点各出现在一张图上。
          </p>

          <svg
            class="terminator-lab__svg"
            viewBox="0 0 700 340"
            role="img"
            aria-label="晨昏线示意图：左为正面视角，右为背面视角"
          >
            <g
              v-for="view in globeViews"
              :key="view.id"
              :transform="`translate(${view.cx} ${view.cy})`"
            >
              <circle class="terminator-lab__disc" r="118" />
              <path class="terminator-lab__night" :d="view.nightPath" />

              <g v-for="line in view.parallels" :key="line.id">
                <line
                  class="terminator-lab__parallel"
                  :x1="line.x1"
                  :y1="line.y"
                  :x2="line.x2"
                  :y2="line.y"
                />
                <text class="terminator-lab__map-label" :x="line.x2 + 6" :y="line.y - 5">
                  {{ line.label }}
                </text>
              </g>

              <path
                v-for="meridian in view.meridians"
                :key="meridian.id"
                class="terminator-lab__meridian"
                :d="meridian.d"
              />

              <path
                v-for="segment in view.segments"
                :key="segment.kind"
                class="terminator-lab__terminator"
                :class="
                  segment.kind === 'morning'
                    ? 'terminator-lab__terminator--morning'
                    : 'terminator-lab__terminator--evening'
                "
                :d="segment.d"
              />

              <g v-if="view.tangent">
                <circle
                  class="terminator-lab__tangent"
                  :cx="view.tangent.x"
                  :cy="view.tangent.y"
                  r="4"
                />
                <text
                  class="terminator-lab__map-label terminator-lab__map-label--key"
                  :x="view.tangent.labelX"
                  :y="view.tangent.labelY"
                  text-anchor="middle"
                >
                  切点 {{ round(view.tangent.latitude) }}°
                </text>
              </g>

              <g v-if="view.crossing">
                <circle
                  class="terminator-lab__crossing"
                  :cx="view.crossing.x"
                  :cy="view.crossing.y"
                  r="3.5"
                />
                <text
                  class="terminator-lab__map-label"
                  :x="view.crossing.x + 10"
                  :y="view.crossing.y + 18"
                >
                  {{ view.crossing.hour }} 时
                </text>
              </g>

              <text
                v-for="segment in view.segments"
                :key="`name-${segment.kind}`"
                class="terminator-lab__map-label terminator-lab__map-label--key"
                :x="segment.mid.x"
                :y="segment.mid.y - 10"
              >
                {{ segment.kind === 'morning' ? '晨线' : '昏线' }}
              </text>

              <g v-if="view.observer.visible">
                <circle
                  class="terminator-lab__observer"
                  :cx="view.observer.x"
                  :cy="view.observer.y"
                  r="4"
                />
                <text
                  class="terminator-lab__map-label"
                  :x="view.observer.x + 8"
                  :y="view.observer.y + 4"
                >
                  观察点
                </text>
              </g>

              <g class="terminator-lab__sun">
                <line :x1="view.sun.x1" :y1="view.sun.y1" :x2="view.sun.x2" :y2="view.sun.y2" />
                <polygon :points="view.sunHead" />
                <text class="terminator-lab__map-label" :x="view.sun.x2 + 6" :y="view.sun.y2 - 4">
                  太阳
                </text>
              </g>

              <g class="terminator-lab__spin">
                <line :x1="view.spin.x1" :y1="view.spin.y1" :x2="view.spin.x2" :y2="view.spin.y2" />
                <polygon :points="view.spinHead" />
                <text class="terminator-lab__map-label" :x="view.spin.x1" :y="view.spin.y1 + 18">
                  自转
                </text>
              </g>

              <text class="terminator-lab__view-title" x="0" y="-150">{{ view.label }}</text>
            </g>
          </svg>

          <ul class="learn-list terminator-lab__facts">
            <li class="learn-item">
              晨线与赤道的交点在
              <strong>{{ crossingText.morning }}</strong>
              （6 时经线），昏线与赤道的交点在
              <strong>{{ crossingText.evening }}</strong>
              （18 时经线）。
            </li>
            <li class="learn-item">
              正午经线（{{ noonMeridianText }}）过昼弧中点，地方时 12 时；子夜经线（{{
                midnightMeridianText
              }}）过夜弧中点，地方时 0 时。
            </li>
            <li class="learn-item">
              晨昏线与纬线圈的切点有两个：一个在正午经线上（纬度
              <strong>{{ round(tangents[0].latitude) }}°</strong>），一个在子夜经线上（纬度
              <strong>{{ round(tangents[1].latitude) }}°</strong>）。
              切点纬度与太阳直射点纬度<strong>互余</strong>（切点纬度 = 90° − |δ| =
              {{ round(tangentLatitude) }}°， 也就是切点到最近极地的角距 = |δ| =
              {{ round(tangentPolarDistanceValue) }}°）。
            </li>
            <li class="learn-item">
              观察点 φ = {{ signed(phi) }} 落在{{ polarText }}，昼长 {{ dayLengthText }}。
            </li>
          </ul>
        </section>

        <!-- ========== 交互三：判晨昏三法练习 ========== -->
        <section class="learn-panel">
          <h2 class="learn-panel__title">三、判晨昏三法练习</h2>
          <p class="learn-lead">
            图上同一圈晨昏线被分成两段，标成甲、乙。先按判据分出晨昏，再选答案；答错会给出判据提示。
          </p>

          <div class="terminator-lab__practice">
            <svg
              class="terminator-lab__svg terminator-lab__svg--practice"
              viewBox="0 0 360 320"
              role="img"
              :aria-label="`练习图：${practiceItem ? practiceItem.title : ''}`"
            >
              <g v-if="practiceItem" :transform="`translate(${practiceCx} ${practiceCy})`">
                <circle class="terminator-lab__disc" r="118" />
                <path class="terminator-lab__night" :d="practiceNightPath" />
                <line
                  class="terminator-lab__parallel"
                  :x1="-practiceRadius"
                  :y1="0"
                  :x2="practiceRadius"
                  :y2="0"
                />
                <text class="terminator-lab__map-label" :x="practiceRadius + 6" :y="-5">赤道</text>

                <path
                  v-for="segment in practiceSegments"
                  :key="segment.id"
                  class="terminator-lab__terminator"
                  :class="
                    segment.kind === 'morning'
                      ? 'terminator-lab__terminator--morning'
                      : 'terminator-lab__terminator--evening'
                  "
                  :d="segment.d"
                  @click="answerPractice(segment.id)"
                />

                <g
                  v-for="segment in practiceSegments"
                  :key="`tag-${segment.id}`"
                  class="terminator-lab__tag"
                  @click="answerPractice(segment.id)"
                >
                  <circle :cx="segment.mid.x" :cy="segment.mid.y - 12" r="12" />
                  <text class="terminator-lab__tag-text" :x="segment.mid.x" :y="segment.mid.y - 8">
                    {{ segment.name }}
                  </text>
                </g>

                <g class="terminator-lab__sun">
                  <line
                    :x1="practiceSun.x1"
                    :y1="practiceSun.y1"
                    :x2="practiceSun.x2"
                    :y2="practiceSun.y2"
                  />
                  <polygon :points="practiceSunHead" />
                  <text
                    class="terminator-lab__map-label"
                    :x="practiceSun.x2 + 6"
                    :y="practiceSun.y2 - 4"
                  >
                    太阳
                  </text>
                </g>

                <g class="terminator-lab__spin">
                  <line
                    :x1="practiceSpin.x1"
                    :y1="practiceSpin.y1"
                    :x2="practiceSpin.x2"
                    :y2="practiceSpin.y2"
                  />
                  <polygon :points="practiceSpinHead" />
                  <text
                    class="terminator-lab__map-label"
                    :x="practiceSpin.x1"
                    :y="practiceSpin.y1 + 18"
                  >
                    自转
                  </text>
                </g>
              </g>
            </svg>

            <div class="terminator-lab__practice-side">
              <p class="terminator-lab__practice-title">
                {{ practiceItem ? practiceItem.title : '' }}
              </p>
              <p class="learn-lead--block">{{ practiceItem ? practiceItem.question : '' }}</p>
              <p class="learn-panel__meta">{{ practiceItem ? practiceItem.hint : '' }}</p>

              <div class="terminator-lab__options" role="group" aria-label="作答选项">
                <button
                  v-for="option in practiceOptions"
                  :key="option.id"
                  type="button"
                  class="learn-top__back terminator-lab__option"
                  :class="optionClass(option.id)"
                  @click="answerPractice(option.id)"
                >
                  {{ option.label }}
                </button>
              </div>

              <p
                v-if="practiceChoice"
                class="learn-lead--block terminator-lab__feedback"
                :class="`terminator-lab__feedback--${practiceTone}`"
              >
                <!-- v-html：输入是仓库内的静态数据（src/data/terminatorLab.js），不是用户输入；renderEmphasis 先转义后替换，输出只可能是 <strong> -->
                <span v-html="emph(practiceFeedback)" />
              </p>

              <div class="terminator-lab__practice-nav">
                <button type="button" class="learn-top__back" @click="prevPractice">上一题</button>
                <span class="learn-panel__meta">
                  第 {{ practiceIndex + 1 }} / {{ practiceItems.length }} 题
                </span>
                <button type="button" class="learn-top__back" @click="nextPractice">下一题</button>
              </div>
            </div>
          </div>
        </section>

        <!-- ========== 判据参考 ========== -->
        <section class="learn-panel">
          <h2 class="learn-panel__title">判晨昏三法与时间规律</h2>
          <div class="terminator-lab__methods">
            <div v-for="method in methods" :key="method.id" class="terminator-lab__method">
              <p class="terminator-lab__method-name">{{ method.name }}</p>
              <p class="learn-lead--block">{{ method.rule }}</p>
              <ol class="terminator-lab__steps">
                <li v-for="(step, index) in method.steps" :key="index">{{ step }}</li>
              </ol>
            </div>
          </div>
          <ul class="learn-list terminator-lab__rules">
            <li v-for="rule in rules" :key="rule.id" class="learn-item">{{ rule.text }}</li>
          </ul>
          <p class="learn-panel__meta learn-panel__meta--spaced">
            找法通则：先找自转方向 → 定晨昏线 → 找与赤道的交点 → 过交点的经线。
          </p>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { renderEmphasis } from '../utils/richText'
import {
  TROPIC_DEGREES,
  POLAR_CIRCLE_DEGREES,
  SOLAR_TERMS,
  SAMPLE_POINTS,
  JUDGEMENT_METHODS,
  TIME_RULES,
  PRACTICE_ITEMS,
  noonSolarAltitude,
  midnightSolarAltitude,
  dayLengthHours,
  sunriseTime,
  sunsetTime,
  polarDayState,
  noonSunAzimuth,
  annualAltitudeRange,
  minimumNoonAltitude,
  buildingSpacing,
  terminatorTangents,
  terminatorTangentLatitude,
  tangentPolarDistance,
  equatorCrossings,
  globeGeometry,
  viewCenter,
  normalizeLongitude,
} from '../data/terminatorLab'

const props = defineProps({
  /** 节气表：给空数组会进空态，给非法的 delta 会进错误态 */
  terms: { type: Array, default: () => SOLAR_TERMS },
  /** 常用观察点纬度样本 */
  points: { type: Array, default: () => SAMPLE_POINTS },
  /** 初始观察点纬度 */
  initialPhi: { type: Number, default: 39.9 },
  /** 初始太阳直射点纬度 */
  initialDelta: { type: Number, default: TROPIC_DEGREES },
  /** 初始直射点经线 */
  initialLongitude: { type: Number, default: 0 },
})

/** 地球半径（SVG 像素） */
const R = 118
/** 正面 / 背面两个视角在图上的位置；视点中心的经度偏移由 viewCenter() 统一算 */
const VIEW_OFFSETS = [
  { id: 'front', label: '正面（12 时经线一侧）', cx: 175, cy: 165 },
  { id: 'back', label: '背面（0 时经线一侧）', cx: 505, cy: 165 },
]

const phi = ref(props.initialPhi)
const delta = ref(props.initialDelta)
const subsolarLongitude = ref(normalizeLongitude(props.initialLongitude))
const buildingHeight = ref(30)

const loading = ref(true)
const error = ref('')

const termList = computed(() => (Array.isArray(props.terms) ? props.terms : []))
const pointList = computed(() => (Array.isArray(props.points) ? props.points : []))
const methods = JUDGEMENT_METHODS
const rules = TIME_RULES

/* ------------------------------------------------------------------ *
 * 一、计算器的结果
 * ------------------------------------------------------------------ */

const noonAltitude = computed(() => noonSolarAltitude(phi.value, delta.value))
const midnightAltitude = computed(() => midnightSolarAltitude(phi.value, delta.value))
const dayLength = computed(() => dayLengthHours(phi.value, delta.value))
const polarState = computed(() => polarDayState(phi.value, delta.value))
const azimuth = computed(() => noonSunAzimuth(phi.value, delta.value))
const annualRange = computed(() => annualAltitudeRange(phi.value))
const minAltitude = computed(() => minimumNoonAltitude(phi.value))
const spacing = computed(() => buildingSpacing(buildingHeight.value, minAltitude.value))

const dayLengthText = computed(() => `${round(dayLength.value)} 小时`)
const polarText = computed(
  () =>
    ({
      normal: '无极昼极夜',
      'polar-day': '极昼',
      'polar-night': '极夜',
    })[polarState.value],
)
const azimuthText = computed(
  () =>
    ({
      south: '正南',
      north: '正北',
      zenith: '头顶（太阳高度 90°）',
    })[azimuth.value],
)
const riseSetText = computed(() => {
  const rise = sunriseTime(phi.value, delta.value)
  const set = sunsetTime(phi.value, delta.value)
  if (rise === null || set === null)
    return polarState.value === 'polar-day' ? '全天不落' : '全天不升'
  return `${round(rise)} 时 / ${round(set)} 时`
})
const spacingText = computed(() =>
  Number.isFinite(spacing.value)
    ? `${round(spacing.value)} m`
    : `无有限解（θ = ${round(minAltitude.value)}° ≤ 0°）`,
)

/* ------------------------------------------------------------------ *
 * 二、晨昏线图
 * ------------------------------------------------------------------ */

const tangents = computed(() => terminatorTangents(delta.value, subsolarLongitude.value))
const tangentLatitude = computed(() => terminatorTangentLatitude(delta.value))
const tangentPolarDistanceValue = computed(() => tangentPolarDistance(delta.value))
const crossings = computed(() => equatorCrossings(subsolarLongitude.value))
const crossingText = computed(() => ({
  morning: `${crossings.value[0].longitude}°E`,
  evening: `${crossings.value[1].longitude}°E`,
}))
const noonMeridianText = computed(() => `${normalizeLongitude(subsolarLongitude.value)}°E`)
const midnightMeridianText = computed(
  () => `${normalizeLongitude(subsolarLongitude.value + 180)}°E`,
)

/** 单位球坐标 → SVG 局部坐标（y 轴翻转成屏幕坐标） */
const toLocal = (point) => ({ x: point.x * R, y: -point.y * R })

/** 一串点 → SVG path */
const pathOf = (points, close = false) => {
  if (!points || !points.length) return ''
  const d = points
    .map((point, index) => {
      const local = toLocal(point)
      return `${index ? 'L' : 'M'}${local.x.toFixed(2)} ${local.y.toFixed(2)}`
    })
    .join(' ')
  return close ? `${d} Z` : d
}

/** 箭头三角形 */
const arrowHead = (from, to, size = 9) => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const baseX = to.x - ux * size
  const baseY = to.y - uy * size
  return [
    `${to.x.toFixed(2)},${to.y.toFixed(2)}`,
    `${(baseX - uy * size * 0.45).toFixed(2)},${(baseY + ux * size * 0.45).toFixed(2)}`,
    `${(baseX + uy * size * 0.45).toFixed(2)},${(baseY - ux * size * 0.45).toFixed(2)}`,
  ].join(' ')
}

/** 太阳方向箭头：从圆盘边缘往外指 */
const sunArrow = (sun) => {
  const len = Math.hypot(sun.x, sun.y) || 1
  const ux = sun.x / len
  const uy = -sun.y / len
  const start = { x: ux * R * 1.02, y: uy * R * 1.02 }
  const end = { x: ux * R * 1.32, y: uy * R * 1.32 }
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y, head: arrowHead(start, end) }
}

/** 自转箭头：沿赤道自西向东（图中向右） */
const spinArrow = () => {
  const start = { x: -R * 0.82, y: R * 0.16 }
  const end = { x: -R * 0.3, y: R * 0.16 }
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y, head: arrowHead(start, end) }
}

/** 纬线圈的名字 */
const parallelLabel = (value) => {
  if (Math.abs(value) < 0.01) return '赤道'
  if (Math.abs(value - POLAR_CIRCLE_DEGREES) < 0.01) return '北极圈'
  if (Math.abs(value + POLAR_CIRCLE_DEGREES) < 0.01) return '南极圈'
  return `${signed(value)}°`
}

const globeViews = computed(() =>
  VIEW_OFFSETS.map((view) => {
    const center = viewCenter(subsolarLongitude.value, view.id)
    const geometry = globeGeometry({
      delta: delta.value,
      subsolarLongitude: subsolarLongitude.value,
      center,
      observerLatitude: phi.value,
      parallels: [0, POLAR_CIRCLE_DEGREES, -POLAR_CIRCLE_DEGREES],
    })
    const sun = sunArrow(geometry.sun)
    const spin = spinArrow()
    return {
      id: view.id,
      label: view.label,
      cx: view.cx,
      cy: view.cy,
      nightPath: pathOf(geometry.nightRegion, true),
      parallels: geometry.parallels.map((line) => ({
        id: `p${line.phi}`,
        label: parallelLabel(line.phi),
        y: toLocal({ x: 0, y: line.y }).y,
        x1: toLocal({ x: -line.halfWidth, y: line.y }).x,
        x2: toLocal({ x: line.halfWidth, y: line.y }).x,
      })),
      meridians: geometry.meridians.map((meridian) => ({
        id: meridian.id,
        d: pathOf(meridian.points),
      })),
      segments: geometry.segments.map((segment) => {
        const mid = toLocal(segment.mid)
        const len = Math.hypot(mid.x, mid.y) || 1
        return {
          kind: segment.kind,
          d: pathOf(segment.points),
          // 标签往圆心方向让开，免得压住切点的标注
          mid: { x: mid.x - (mid.x / len) * 16, y: mid.y - (mid.y / len) * 16 },
        }
      }),
      tangent: geometry.tangent
        ? (() => {
            const point = toLocal(geometry.tangent)
            const len = Math.hypot(point.x, point.y) || 1
            return {
              x: point.x,
              y: point.y,
              latitude: geometry.tangent.latitude,
              // 切点标注往圆外挪：上半球往上、下半球往下
              labelX: point.x + (point.x / len) * 14,
              labelY: point.y + (point.y / len) * 14,
            }
          })()
        : null,
      crossing: geometry.crossing
        ? {
            x: toLocal(geometry.crossing).x,
            y: toLocal(geometry.crossing).y,
            hour: geometry.crossing.side === 'morning' ? 6 : 18,
          }
        : null,
      observer: {
        x: toLocal(geometry.observer).x,
        y: toLocal(geometry.observer).y,
        visible: geometry.observer.visible,
      },
      sun: { x1: sun.x1, y1: sun.y1, x2: sun.x2, y2: sun.y2, head: sun.head },
      sunHead: sun.head,
      spin: { x1: spin.x1, y1: spin.y1, x2: spin.x2, y2: spin.y2 },
      spinHead: spin.head,
    }
  }),
)

/* ------------------------------------------------------------------ *
 * 三、练习
 * ------------------------------------------------------------------ */

const practiceItems = PRACTICE_ITEMS
const practiceIndex = ref(0)
const practiceChoice = ref('')
const practiceItem = computed(() => practiceItems[practiceIndex.value] ?? null)
const practiceOptions = computed(() =>
  (practiceItem.value?.segments ?? []).map((segment) => ({
    id: segment.id,
    label: `${segment.name}是晨线`,
  })),
)
const practiceSegments = computed(() =>
  (practiceItem.value?.segments ?? []).map((segment) => ({
    id: segment.id,
    kind: segment.kind,
    name: segment.name,
    d: pathOf(segment.points),
    mid: toLocal(segment.mid),
  })),
)
const practiceNightPath = computed(() =>
  pathOf(practiceItem.value?.geometry?.nightRegion ?? [], true),
)
const practiceRadius = R
const practiceCx = 180
const practiceCy = 160
const practiceSun = computed(() => {
  const sun = sunArrow(practiceItem.value?.geometry?.sun ?? { x: 0, y: 0 })
  return { x1: sun.x1, y1: sun.y1, x2: sun.x2, y2: sun.y2, head: sun.head }
})
const practiceSunHead = computed(() => practiceSun.value.head)
const practiceSpin = computed(() => spinArrow())
const practiceSpinHead = computed(() => practiceSpin.value.head)

const practiceTone = computed(() => {
  if (!practiceChoice.value || !practiceItem.value) return ''
  return practiceChoice.value === practiceItem.value.answerId ? 'correct' : 'wrong'
})
const practiceFeedback = computed(() => {
  const item = practiceItem.value
  if (!item || !practiceChoice.value) return ''
  const chosen = item.segments.find((segment) => segment.id === practiceChoice.value)
  const fill = (text) =>
    String(text ?? '')
      .replace('{{answer}}', item.answerName)
      .replace('{{other}}', item.otherName)
      .replace('{{chosen}}', chosen ? chosen.name : '')
  if (practiceTone.value === 'correct') return fill(item.explain)
  return fill(item.wrong || '顺着自转方向，由黑变白的是晨线、由白变黑的是昏线。')
})

const answerPractice = (id) => {
  if (!practiceItem.value) return
  practiceChoice.value = id
}
const nextPractice = () => {
  practiceIndex.value = (practiceIndex.value + 1) % practiceItems.length
  practiceChoice.value = ''
}
const prevPractice = () => {
  practiceIndex.value = (practiceIndex.value - 1 + practiceItems.length) % practiceItems.length
  practiceChoice.value = ''
}
const optionClass = (id) => {
  if (!practiceChoice.value || !practiceItem.value) return ''
  if (id === practiceItem.value.answerId) return 'terminator-lab__option--right'
  if (id === practiceChoice.value) return 'terminator-lab__option--wrong'
  return ''
}

/* ------------------------------------------------------------------ *
 * 工具与状态
 * ------------------------------------------------------------------ */

const round = (value) => Number(Number(value ?? 0).toFixed(1))
const signed = (value) => {
  const num = Number(value ?? 0)
  const abs = Math.abs(num)
  return `${num < 0 ? '−' : ''}${round(abs)}°`
}
const emph = (text) => renderEmphasis(text)

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    await Promise.resolve()
    const broken = termList.value.find(
      (term) => !term || typeof term.delta !== 'number' || !term.name,
    )
    if (broken) throw new Error('节气数据缺 delta 或名称')
    if (Array.isArray(props.points) && props.points.length) {
      if (pointList.value.some((p) => !p || typeof p.phi !== 'number')) {
        throw new Error('观察点数据缺纬度')
      }
    }
  } catch (e) {
    error.value = `无法准备实验数据（${e.message}）`
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.terminator-lab__controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--sp-3);
  margin-bottom: var(--sp-3);
}

.terminator-lab__control {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--sp-1) var(--sp-2);
  align-items: center;
}

.terminator-lab__control-label {
  font-size: var(--fs-body);
  color: var(--learn-ink-soft);
}

.terminator-lab__control-value {
  font-family: var(--font-mono);
  font-size: var(--fs-value);
  color: var(--learn-accent);
  text-align: right;
}

.terminator-lab__range {
  grid-column: 1 / -1;
  width: 100%;
  accent-color: var(--learn-accent);
}

.terminator-lab__presets {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-1);
  margin-bottom: var(--sp-3);
}

.terminator-lab__preset-label {
  font-size: var(--fs-label);
  color: var(--learn-ink-faint);
  margin-right: var(--sp-1);
}

.terminator-lab__preset {
  cursor: pointer;
  border: 1px solid transparent;
  background: var(--learn-accent-soft);
}

.terminator-lab__preset--on {
  border-color: var(--learn-accent);
  color: var(--learn-accent);
  font-weight: 600;
}

.terminator-lab__formula {
  margin: 0 0 var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--radius);
  background: var(--learn-accent-soft);
  color: var(--learn-ink);
  font-family: var(--font-mono);
  font-size: var(--fs-value);
}

.terminator-lab__results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--sp-2);
  margin: 0;
}

.terminator-lab__result {
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
  background: var(--learn-panel);
}

.terminator-lab__result dt {
  font-size: var(--fs-label);
  color: var(--learn-ink-faint);
}

.terminator-lab__result dd {
  margin: var(--sp-1) 0 0;
  font-family: var(--font-mono);
  font-size: var(--fs-value);
  color: var(--learn-ink);
}

.terminator-lab__svg {
  display: block;
  width: 100%;
  height: auto;
  margin: var(--sp-3) 0;
}

.terminator-lab__svg--practice {
  max-width: 420px;
}

.terminator-lab__disc {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-line);
  stroke-width: 1;
}

.terminator-lab__night {
  fill: var(--learn-ink-soft);
  fill-opacity: 0.42;
  stroke: none;
}

.terminator-lab__parallel {
  stroke: var(--learn-line);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.terminator-lab__meridian {
  fill: none;
  stroke: var(--learn-line);
  stroke-width: 1;
}

.terminator-lab__terminator {
  fill: none;
  stroke-width: 2.4;
}

.terminator-lab__terminator--morning {
  stroke: var(--learn-accent);
}

.terminator-lab__terminator--evening {
  stroke: var(--learn-warn);
  stroke-dasharray: 7 4;
}

.terminator-lab__tangent {
  fill: var(--learn-accent);
  stroke: var(--learn-panel);
  stroke-width: 1.5;
}

.terminator-lab__crossing {
  fill: var(--learn-warn);
  stroke: var(--learn-panel);
  stroke-width: 1.5;
}

.terminator-lab__observer {
  fill: var(--learn-ink);
  stroke: var(--learn-panel);
  stroke-width: 1.5;
}

.terminator-lab__sun line,
.terminator-lab__spin line {
  stroke: var(--learn-ink-soft);
  stroke-width: 1.4;
}

.terminator-lab__sun polygon {
  fill: var(--learn-ink-soft);
}

.terminator-lab__spin polygon {
  fill: var(--learn-ink-soft);
}

.terminator-lab__map-label {
  font-size: var(--fs-label);
  fill: var(--learn-ink-soft);
}

.terminator-lab__map-label--key {
  fill: var(--learn-ink);
  font-weight: 600;
}

.terminator-lab__view-title {
  font-size: var(--fs-body);
  fill: var(--learn-ink);
  text-anchor: middle;
}

.terminator-lab__tag circle {
  fill: var(--learn-panel);
  stroke: var(--learn-accent);
  stroke-width: 1.5;
  cursor: pointer;
}

.terminator-lab__tag-text {
  font-size: var(--fs-label);
  fill: var(--learn-accent);
  text-anchor: middle;
  pointer-events: none;
}

.terminator-lab__facts {
  margin-bottom: 0;
}

.terminator-lab__practice {
  display: grid;
  grid-template-columns: minmax(260px, 420px) 1fr;
  gap: var(--sp-4);
  align-items: start;
}

@media (max-width: 760px) {
  .terminator-lab__practice {
    grid-template-columns: 1fr;
  }
}

.terminator-lab__practice-title {
  margin: 0 0 var(--sp-2);
  font-size: var(--fs-value);
  font-weight: 600;
}

.terminator-lab__options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin: var(--sp-3) 0;
}

.terminator-lab__option--right {
  border-color: var(--learn-accent);
  color: var(--learn-accent);
  font-weight: 600;
}

.terminator-lab__option--wrong {
  border-color: var(--learn-warn);
  color: var(--learn-warn);
}

.terminator-lab__feedback {
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--radius);
  background: var(--learn-panel);
  border-left: 3px solid var(--learn-line);
}

.terminator-lab__feedback--correct {
  border-left-color: var(--learn-accent);
}

.terminator-lab__feedback--wrong {
  border-left-color: var(--learn-warn);
}

.terminator-lab__practice-nav {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin-top: var(--sp-3);
}

.terminator-lab__methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--sp-3);
}

.terminator-lab__method {
  padding: var(--sp-3);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius);
}

.terminator-lab__method-name {
  margin: 0 0 var(--sp-1);
  font-size: var(--fs-value);
  font-weight: 600;
  color: var(--learn-accent);
}

.terminator-lab__steps {
  margin: var(--sp-2) 0 0;
  padding-left: var(--sp-4);
  font-size: var(--fs-body);
  color: var(--learn-ink-soft);
}

.terminator-lab__rules {
  margin: var(--sp-3) 0 0;
}
</style>
