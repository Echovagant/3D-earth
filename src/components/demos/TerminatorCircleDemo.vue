<template>
  <div class="demo">
    <!-- 四步图解：每一步一个视图，切到哪步显示哪一步 -->
    <svg
      class="demo__canvas"
      viewBox="0 0 720 380"
      role="img"
      :aria-label="`图解：${current.title}`"
    >
      <!-- ① 一半亮，一半暗 -->
      <g v-show="step === 0" class="demo__frame">
        <circle class="demo__sun" cx="58" cy="190" r="26" />
        <g class="demo__ray">
          <path v-for="y in [120, 155, 190, 225, 260]" :key="y" :d="`M 96 ${y} L 300 ${y}`" />
        </g>
        <circle class="demo__globe-night" cx="360" cy="190" r="118" />
        <path class="demo__globe-day" d="M 360 72 A 118 118 0 0 0 360 308 L 360 72 Z" />
        <path class="demo__terminator" d="M 360 72 L 360 308" />
        <text class="demo__label" x="58" y="236" text-anchor="middle">太阳</text>
        <text class="demo__label" x="300" y="344" text-anchor="middle">昼半球</text>
        <text class="demo__label" x="424" y="344" text-anchor="middle">夜半球</text>
        <path class="demo__leader" d="M 366 96 L 470 78 L 536 78" />
        <text class="demo__label demo__label--mark" x="542" y="82">晨昏线</text>
      </g>

      <!-- ② 晨昏线是大圆：三个视图都是一条过球心的直线 -->
      <g v-show="step === 1" class="demo__frame">
        <g v-for="view in threeViews" :key="view.title">
          <circle class="demo__globe-plain" :cx="view.x" cy="150" r="76" />
          <path class="demo__terminator" :d="view.linePath" />
          <text class="demo__label" :x="view.x" y="264" text-anchor="middle">{{ view.title }}</text>
          <text class="demo__label demo__label--faint" :x="view.x" y="288" text-anchor="middle">
            过球心的直线
          </text>
        </g>
        <text class="demo__caption-line" x="360" y="334" text-anchor="middle">
          三种视图看，晨昏线都是一条把球面分成两半的直线
        </text>
      </g>

      <!-- ③ 判晨线与昏线：极地俯视（北极上方看，逆时针） -->
      <g v-show="step === 2" class="demo__frame">
        <g class="demo__ray">
          <path v-for="y in [130, 165, 200, 235]" :key="y" :d="`M 92 ${y} L 330 ${y}`" />
        </g>
        <circle class="demo__sun" cx="58" cy="182" r="22" />
        <circle class="demo__globe-night" cx="400" cy="200" r="118" />
        <path class="demo__globe-day" d="M 400 82 A 118 118 0 0 0 400 318 L 400 82 Z" />
        <path class="demo__terminator" d="M 400 82 L 400 318" />
        <!-- 自转方向：北极上方看是逆时针，上方那圈箭头指向左 -->
        <path class="demo__spin" d="M 486 74 Q 400 18 314 74" />
        <path class="demo__spin-head" d="M 314 74 L 322 62 L 326 78 Z" />
        <text class="demo__label" x="400" y="42" text-anchor="middle">自转方向（逆时针）</text>
        <text class="demo__label demo__label--mark" x="524" y="142">晨线</text>
        <text class="demo__label demo__label--faint" x="524" y="164">由黑到白 · 正在日出</text>
        <text class="demo__label demo__label--mark" x="524" y="264">昏线</text>
        <text class="demo__label demo__label--faint" x="524" y="286">由白到黑 · 正在日落</text>
        <path class="demo__leader" d="M 518 134 L 406 122" />
        <path class="demo__leader" d="M 518 256 L 406 278" />
      </g>

      <!-- ④ 夏至日的切点：圆柱投影，横轴是经度，括注是该经线的地方时 -->
      <g v-show="step === 3" class="demo__frame">
        <g class="demo__grid">
          <path v-for="l in latitudeLines" :key="`lat${l.lat}`" :d="`M 90 ${l.y} L 690 ${l.y}`" />
          <path v-for="x in longitudeLines" :key="`lon${x}`" :d="`M ${x} 40 L ${x} 330`" />
        </g>
        <path class="demo__curve" :d="terminatorPath" />
        <path class="demo__curve demo__curve--mark" :d="terminatorPath" />
        <circle class="demo__cut" :cx="cutA.x" :cy="cutA.y" r="7" />
        <circle class="demo__cut" :cx="cutB.x" :cy="cutB.y" r="7" />
        <text class="demo__label demo__label--mark" :x="cutA.x - 12" :y="cutA.y - 16" text-anchor="end">
          切点 A · 0 时
        </text>
        <text class="demo__label demo__label--mark" :x="cutB.x + 14" :y="cutB.y + 6">
          切点 B · 12 时
        </text>
        <text
          v-for="m in meridianMarks"
          :key="m.label"
          class="demo__label demo__label--faint"
          :x="m.x"
          y="352"
          text-anchor="middle"
        >
          {{ m.label }}
        </text>
        <text
          v-for="l in latitudeLabels"
          :key="`lbl${l.lat}`"
          class="demo__label demo__label--faint"
          x="80"
          :y="l.y + 4"
          text-anchor="end"
        >
          {{ l.label }}
        </text>
      </g>
    </svg>

    <p class="demo__title">{{ current.title }}</p>
    <p class="demo__text">{{ current.text }}</p>

    <p class="demo__controls">
      <button
        type="button"
        class="learn-top__back"
        :disabled="step === 0"
        @click="prev"
      >
        上一步
      </button>
      <button
        type="button"
        class="learn-top__back"
        :disabled="step === steps.length - 1"
        @click="next"
      >
        下一步
      </button>
      <button type="button" class="learn-top__back" @click="replay">重播</button>
      <span class="demo__dots" role="group" aria-label="图解步骤">
        <button
          v-for="(s, i) in steps"
          :key="s.id"
          type="button"
          class="demo__dot"
          :class="{ 'demo__dot--on': i === step }"
          :aria-current="i === step ? 'step' : undefined"
          :aria-label="`第 ${i + 1} 步：${s.title}`"
          @click="goTo(i)"
        ></button>
      </span>
      <span class="demo__count">{{ step + 1 }} / {{ steps.length }}</span>
    </p>
  </div>
</template>

<script setup>
/**
 * §3.6 晨昏线（晨昏圈）的判读与切点。
 *
 * 老师讲这节时反复用「想象」：想象地球是个不透明的球、想象晨昏线像条
 * 围巾把地球绕了一圈、想象卷一个筒把夜弧接上。这一段就是补上那幅画。
 *
 * 四步各自的分工：
 *   ① 一半亮一半暗 —— 先把晨昏线是什么画出来
 *   ② 它是大圆 —— 用三个视图证明「把地球分成两半的圆是大圆」
 *   ③ 晨线与昏线 —— 极地俯视，靠自转方向分
 *   ④ 切点 —— 夏至日的圆柱投影，晨昏线与极圈相切的地方
 *
 * 图形全部自绘（讲义本身没有图），晨昏线曲线按
 * tanφ = −cotδ·cosH 算出来，不是手画的示意。
 */
import { computed, ref } from 'vue'
import {
  SOLSTICE_DECL,
  SUBSOLAR_LON as SUBSOLAR_LON_DEFAULT,
  cutLatitude,
  terminatorLat,
} from '../../data/terminatorGeometry'

const steps = [
  {
    id: 'lit',
    title: '① 一半亮，一半暗',
    text: '地球不发光也不透明，太阳只照亮对着它的那一半。亮的那一半和黑的那一半之间那道缝，就是晨昏线。它过地球的球心——所以和赤道、20°W–160°E 的经线圈是同一类东西。',
  },
  {
    id: 'great-circle',
    title: '② 晨昏线是一条大圆',
    text: '从侧视、从极地俯视、把球剪开铺平来看，晨昏线都是一条过球心的直线，都把地球分成两个一样大的半球。能把地球分成两半的圆就是大圆——赤道是，经线圈也是，晨昏圈同理。',
  },
  {
    id: 'morning-evening',
    title: '③ 顺着自转方向分晨线与昏线',
    text: '从北极上方看，地球自转是逆时针。顺着自转方向，晨线那段是由黑夜进入白昼——地点正在日出；昏线那段是由白昼进入黑夜——正在日落。背面那条线的自转方向与正面相反，所以别顺着背面的箭头看。',
  },
  {
    id: 'tangent',
    title: '④ 夏至日：晨昏线与极圈的切点',
    text: '把地球沿经线剪开铺平成圆柱图（夏至日，太阳直射北回归线）。晨昏线与极圈相切的那一点就是切点：切点 A 在北极圈，地方时 0 时；切点 B 在南极圈，地方时 12 时。晨昏线与赤道的两个交点分别是 6 时（晨线）和 18 时（昏线）。',
  },
]

const step = ref(0)
const current = computed(() => steps[step.value])
const next = () => {
  if (step.value < steps.length - 1) step.value += 1
}
const prev = () => {
  if (step.value > 0) step.value -= 1
}
const goTo = (i) => {
  step.value = i
}
const replay = () => {
  step.value = 0
}

/** ② 三个视图：侧视、极地俯视、平面展开 */
const threeViews = computed(() => {
  const specs = [
    { x: 130, title: '侧视图' },
    { x: 360, title: '极地俯视' },
    { x: 590, title: '平面展开' },
  ]
  return specs.map((s) => ({
    ...s,
    linePath: `M ${s.x} 74 L ${s.x} 226`,
  }))
})

/** ④ 圆柱投影：横轴经度、纵轴纬度 */
const PLOT = { left: 90, right: 690, top: 40, bottom: 330 }
/** 夏至日，太阳直射北回归线 */
const DECL = SOLSTICE_DECL
/** 太阳直射的经线：这条经线的地方时是 12 时 */
const SUBSOLAR_LON = SUBSOLAR_LON_DEFAULT

const xOf = (lon) => PLOT.left + ((lon + 180) / 360) * (PLOT.right - PLOT.left)
const yOf = (lat) => PLOT.top + ((90 - lat) / 180) * (PLOT.bottom - PLOT.top)

/** 晨昏线：正午太阳高度为 0 的地方，tanφ = −cotδ·cosH */
const terminatorPath = computed(() => {
  const points = []
  for (let i = 0; i <= 240; i += 1) {
    const lon = -180 + (i / 240) * 360
    const lat = terminatorLat(lon, DECL)
    points.push(`${i === 0 ? 'M' : 'L'} ${xOf(lon).toFixed(2)} ${yOf(lat).toFixed(2)}`)
  }
  return points.join(' ')
})

const longitudeLines = computed(() => {
  const xs = []
  for (let lon = -180; lon <= 180; lon += 30) xs.push(Number(xOf(lon).toFixed(2)))
  return xs
})

const latitudeLines = computed(() =>
  [90, 66.5, 23.5, 0, -23.5, -66.5, -90].map((lat) => ({ lat, y: Number(yOf(lat).toFixed(2)) })),
)

const latitudeLabels = computed(() =>
  [
    { lat: 90, label: '90°N' },
    { lat: 66.5, label: '北极圈' },
    { lat: 0, label: '赤道' },
    { lat: -66.5, label: '南极圈' },
    { lat: -90, label: '90°S' },
  ].map((l) => ({ ...l, y: Number(yOf(l.lat).toFixed(2)) })),
)

/** 四条特殊经线：地方时 0 / 6 / 12 / 18 时 */
const meridianMarks = computed(() => {
  const marks = [
    { lon: -90, label: '0 时' },
    { lon: 0, label: '6 时' },
    { lon: 90, label: '12 时' },
    { lon: 180, label: '18 时' },
  ]
  return marks.map((m) => ({ ...m, x: Number(xOf(m.lon).toFixed(2)) }))
})

/** 切点：晨昏线的最高纬度点，落在极圈上 */
const cutA = computed(() => ({
  x: Number(xOf(-90).toFixed(2)),
  y: Number(yOf(cutLatitude(DECL)).toFixed(2)),
}))
const cutB = computed(() => ({
  x: Number(xOf(SUBSOLAR_LON).toFixed(2)),
  y: Number(yOf(-cutLatitude(DECL)).toFixed(2)),
}))
</script>

<style scoped>
.demo {
  margin-top: var(--sp-2);
}

.demo__canvas {
  display: block;
  width: 100%;
  height: auto;
  background: var(--learn-panel);
  border: 1px solid var(--learn-line);
  border-radius: var(--radius-sm);
}

/* 视图切换：淡入淡出，别硬闪 */
.demo__frame {
  animation: demo-fade 0.32s ease-out;
}

@keyframes demo-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .demo__frame {
    animation: none;
  }
}

.demo__sun {
  fill: var(--learn-sun);
}

.demo__ray path {
  fill: none;
  stroke: var(--learn-sun);
  stroke-width: 2;
  opacity: 0.75;
}

.demo__globe-day {
  fill: var(--learn-day);
  stroke: var(--learn-day-edge);
  stroke-width: 1.5;
}

.demo__globe-night {
  fill: var(--learn-night);
  stroke: var(--learn-ink-soft);
  stroke-width: 1.5;
}

/* ② 的三个视图不画昼夜——这一步只说明「它是一条过球心的直线」 */
.demo__globe-plain {
  fill: var(--learn-day);
  stroke: var(--learn-day-edge);
  stroke-width: 1.5;
}

.demo__terminator {
  fill: none;
  stroke: var(--learn-accent);
  stroke-width: 3;
  stroke-linecap: round;
}

.demo__spin {
  fill: none;
  stroke: var(--learn-accent);
  stroke-width: 2.5;
  stroke-linecap: round;
}

.demo__spin-head {
  fill: var(--learn-accent);
}

.demo__leader {
  fill: none;
  stroke: var(--learn-ink-faint);
  stroke-width: 1.2;
  stroke-dasharray: 3 3;
}

.demo__grid path {
  fill: none;
  stroke: var(--learn-grid);
  stroke-width: 1;
}

.demo__curve {
  fill: none;
  stroke: var(--learn-accent);
  stroke-width: 3;
  stroke-linecap: round;
}

.demo__cut {
  fill: var(--learn-accent);
}

.demo__label {
  font-size: 13px;
  fill: var(--learn-ink-soft);
}

.demo__label--faint {
  fill: var(--learn-ink-faint);
  font-size: 12px;
}

.demo__label--mark {
  fill: var(--learn-accent);
  font-weight: 600;
}

.demo__caption-line {
  font-size: 13px;
  fill: var(--learn-ink-soft);
}

.demo__title {
  margin: var(--sp-3) 0 0;
  font-weight: 600;
  color: var(--learn-ink);
}

.demo__text {
  margin: var(--sp-1) 0 0;
  color: var(--learn-ink-soft);
  line-height: 1.8;
}

.demo__controls {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin: var(--sp-3) 0 0;
}

.demo__dots {
  display: inline-flex;
  gap: 6px;
  margin-left: var(--sp-2);
}

.demo__dot {
  width: 10px;
  height: 10px;
  padding: 0;
  border: 1px solid var(--learn-line);
  border-radius: 50%;
  background: var(--learn-panel);
  cursor: pointer;
}

.demo__dot--on {
  background: var(--learn-accent);
  border-color: var(--learn-accent);
}

.demo__count {
  margin-left: auto;
  font-size: 12px;
  color: var(--learn-ink-faint);
}
</style>
