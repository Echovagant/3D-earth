<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- ① 找太阳直射点 ② 从直射点连到地心 -->
      <g v-show="step === 0" class="demo__frame">
        <circle class="demo__sun" cx="120" cy="195" r="24" />
        <g class="demo__ray">
          <path v-for="dy in [-45, -22, 0, 22, 45]" :key="dy" :d="`M 148 ${195 + dy} L 242 ${195 + dy}`" />
        </g>
        <text class="demo__label" x="120" y="244" text-anchor="middle">太阳</text>

        <circle class="demo__globe-plain" :cx="view.x" :cy="view.y" :r="view.r" />
        <path class="demo-axis" :d="axisLine" />
        <text
          class="demo__label demo__label--faint"
          :x="poleLabels.north.x"
          :y="poleLabels.north.y"
          :text-anchor="poleLabels.north.anchor"
        >北极点</text>
        <text
          class="demo__label demo__label--faint"
          :x="poleLabels.south.x"
          :y="poleLabels.south.y"
          :text-anchor="poleLabels.south.anchor"
        >南极点</text>

        <path class="demo__leader" :d="subsolarLine" />
        <circle class="demo__cut" :cx="subsolar.x" :cy="subsolar.y" r="8" />
        <circle class="demo__cut" :cx="view.x" :cy="view.y" r="4" />

        <path class="demo__leader" d="M 236 186 L 202 148" />
        <text class="demo__label demo__label--mark" x="196" y="142" text-anchor="end">
          ① 太阳直射点 {{ declShort }}
        </text>
        <text class="demo__label" x="312" y="270" text-anchor="middle">② 从直射点连到地心</text>
        <text class="demo__label demo__label--faint" x="372" y="186">地心</text>
      </g>

      <!-- ③ 过球心作垂线 → 晨昏线 -->
      <g v-show="step === 1" class="demo__frame">
        <circle class="demo__sun" cx="120" cy="195" r="24" />
        <g class="demo__ray">
          <path v-for="dy in [-45, -22, 0, 22, 45]" :key="dy" :d="`M 148 ${195 + dy} L 242 ${195 + dy}`" />
        </g>
        <text class="demo__label" x="120" y="244" text-anchor="middle">太阳</text>

        <circle class="demo__globe-plain" :cx="view.x" :cy="view.y" :r="view.r" />
        <path class="demo-axis" :d="axisLine" />

        <path class="demo__leader" :d="subsolarLine" />
        <circle class="demo__cut" :cx="subsolar.x" :cy="subsolar.y" r="8" />
        <circle class="demo__cut" :cx="view.x" :cy="view.y" r="4" />

        <path class="demo__terminator" :d="terminator" />
        <path class="demo__spin" d="M 348 195 L 348 183 L 360 183" />

        <path class="demo__leader" d="M 404 98 L 366 84" />
        <text class="demo__label demo__label--mark" x="410" y="94">
          ③ 过球心作垂线 = 晨昏线
        </text>
        <text class="demo__label demo__label--faint" x="410" y="114">
          垂线必须过球心，否则就不是大圆
        </text>
        <text class="demo__label" x="312" y="270" text-anchor="middle">② 从直射点连到地心</text>
      </g>

      <!-- ④ 涂出昼半球与夜半球 -->
      <g v-show="step === 2" class="demo__frame">
        <circle class="demo__sun" cx="120" cy="195" r="24" />
        <g class="demo__ray">
          <path v-for="dy in [-45, -22, 0, 22, 45]" :key="dy" :d="`M 148 ${195 + dy} L 242 ${195 + dy}`" />
        </g>
        <text class="demo__label" x="120" y="244" text-anchor="middle">太阳</text>

        <circle class="demo__globe-night" :cx="view.x" :cy="view.y" :r="view.r" />
        <path class="demo__globe-day" :d="dayPath" />
        <path class="demo-axis" :d="axisLine" />
        <path class="demo__leader" :d="subsolarLine" />
        <circle class="demo__cut" :cx="subsolar.x" :cy="subsolar.y" r="8" />
        <path class="demo__terminator" :d="terminator" />

        <text class="demo__label" x="300" y="255" text-anchor="middle">昼半球</text>
        <text class="demo__label demo__label--light" x="430" y="240" text-anchor="middle">
          夜半球
        </text>
        <text class="demo__label demo__label--faint" x="300" y="272" text-anchor="middle">
          向着太阳的一半
        </text>
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          ④ 太阳只照亮朝着它的那一半，另一半是夜半球
        </text>
      </g>

      <!-- ⑤ 切点与极昼极夜范围 -->
      <g v-show="step === 3" class="demo__frame">
        <circle class="demo__sun" cx="120" cy="195" r="24" />
        <g class="demo__ray">
          <path v-for="dy in [-45, -22, 0, 22, 45]" :key="dy" :d="`M 148 ${195 + dy} L 242 ${195 + dy}`" />
        </g>

        <circle class="demo__globe-night" :cx="view.x" :cy="view.y" :r="view.r" />
        <path class="demo__globe-day" :d="dayPath" />
        <path v-if="hasPolarCaps" :class="northCapClass" :d="northCap" />
        <path v-if="hasPolarCaps" :class="southCapClass" :d="southCap" />
        <path class="demo-axis" :d="axisLine" />
        <path class="demo__leader" :d="subsolarLine" />
        <circle class="demo__cut" :cx="subsolar.x" :cy="subsolar.y" r="8" />
        <path class="demo__terminator" :d="terminator" />

        <!-- 极圈与切点 -->
        <path class="demo-parallel" :d="northPolarLine" />
        <path class="demo-parallel" :d="southPolarLine" />
        <circle class="demo__cut" :cx="cutNorth.x" :cy="cutNorth.y" r="6" />
        <circle class="demo__cut" :cx="cutSouth.x" :cy="cutSouth.y" r="6" />

        <text class="demo__label demo__label--mark" x="360" y="48" text-anchor="middle">
          {{ cutTitle }}
        </text>
        <path class="demo__leader" d="M 360 56 L 360 72" />
        <text
          class="demo__label demo__label--mark"
          :x="northNote.line1.x"
          :y="northNote.line1.y"
          :text-anchor="northNote.line1.anchor"
        >北极圈 66.5°N</text>
        <text
          class="demo__label demo__label--faint"
          :x="northNote.line2.x"
          :y="northNote.line2.y"
          :text-anchor="northNote.line2.anchor"
        >{{ northCapText }}</text>
        <path class="demo__leader" :d="northNote.leader" />
        <text
          class="demo__label demo__label--mark"
          :x="southNote.line1.x"
          :y="southNote.line1.y"
          :text-anchor="southNote.line1.anchor"
        >南极圈 66.5°S</text>
        <text
          class="demo__label demo__label--faint"
          :x="southNote.line2.x"
          :y="southNote.line2.y"
          :text-anchor="southNote.line2.anchor"
        >{{ southCapText }}</text>
        <path class="demo__leader" :d="southNote.leader" />

        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          {{ bottomNote }}
        </text>
        <text class="demo__label demo__label--faint" x="360" y="368" text-anchor="middle">
          夏至日：北极圈内极昼、南极圈内极夜；冬至日正好相反
        </text>
      </g>
    </template>

    <!-- 参数轴：拖动直射点纬度，四步图形和解说一起重算 -->
    <template #controls>
      <DemoSlider
        v-model="delta"
        label="太阳直射点纬度 δ"
        :min="-23.5"
        :max="23.5"
        :step="0.5"
        :format="readout"
      />
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §4.3 昼夜长短及其变化——光照图「画图四步」。
 *
 * 老师讲这节时会带着学生一起画：找直射点、连到地心、过球心作垂线、涂昼夜。
 * 手上画得出来，考场上就不会画错。这段就是把那四步摆在屏幕上。
 *
 * 画的是侧视光照图：太阳在左、光线水平、晨昏线是一条过球心的竖直直线。
 * 球体、纬线、切点位置全部按投影算出来，不是手画的示意。
 *
 * 参数轴拖的是太阳直射点纬度 δ。在这个侧视投影里，直射点恒在球的左轮廓上，
 * 而它的纬度正好等于地轴的倾角——所以 δ 变了，地轴就跟着倾。
 */
import { computed, ref } from 'vue'
import DemoShell from '../DemoShell.vue'
import DemoSlider from '../DemoSlider.vue'
import { leftHalfPath } from '../../data/svgParts'
import {
  DECL,
  POLAR_CIRCLE,
  VIEW,
  axisVector,
  cutLatitudes,
  declinationReadout,
  formatDeclination,
  parallelSegment,
  polarCapPath,
  polarDaySide,
  subsolarAxisLine,
  subsolarPoint,
  tangentPoints,
  terminatorLine,
} from '../../data/dayNightDrawingGeometry'

/** 太阳直射点纬度：默认夏至日（北回归线），拖动后随参数重算 */
const delta = ref(DECL)

const view = VIEW
const subsolar = subsolarPoint(view, view.r)
const subsolarLine = subsolarAxisLine(view, view.r)
const terminator = terminatorLine(view, view.r)
const dayPath = leftHalfPath(view.x, view.y, view.r)

const readout = (value) => declinationReadout(value)

/** 地轴：直射点在哪半球，北极就朝哪边倾 */
const axisLine = computed(() => {
  const a = axisVector(delta.value, -1)
  const len = view.r + 34
  return `M ${view.x - a.x * len} ${view.y - a.y * len} L ${view.x + a.x * len} ${view.y + a.y * len}`
})

/** 极点标注：跟着极点走，摆在球外那一侧，免得压在球面上 */
const poleLabels = computed(() => {
  const a = axisVector(delta.value, -1)
  const north = { x: view.x + a.x * view.r, y: view.y + a.y * view.r }
  const south = { x: view.x - a.x * view.r, y: view.y - a.y * view.r }
  const place = (p, offsets) => {
    const left = p.x < view.x
    const [dx, dy] = left ? offsets.left : offsets.right
    return { x: p.x + dx, y: p.y + dy, anchor: left ? 'end' : 'start' }
  }
  return {
    north: place(north, { left: [-27, -3], right: [27, -3] }),
    south: place(south, { left: [-11, 19], right: [11, 19] }),
  }
})

/** 极圈纬线：固定的 66.5°，只是跟着地轴的倾角摆 */
const northPolarLine = computed(() => {
  const seg = parallelSegment(view, view.r, POLAR_CIRCLE, delta.value, -1)
  return `M ${seg.from.x} ${seg.from.y} L ${seg.to.x} ${seg.to.y}`
})
const southPolarLine = computed(() => {
  const seg = parallelSegment(view, view.r, -POLAR_CIRCLE, delta.value, -1)
  return `M ${seg.from.x} ${seg.from.y} L ${seg.to.x} ${seg.to.y}`
})

/** 切点 = 晨昏线与纬线相切的那两个点 */
const tangents = computed(() => tangentPoints(view, view.r, delta.value, -1))
const cutNorth = computed(() => tangents.value.north.tangent)
const cutSouth = computed(() => tangents.value.south.tangent)

/** 极昼、极夜的范围：切点纬度以内的那一块 */
const northCap = computed(() => polarCapPath(view, view.r, cutLatitudes(delta.value)[0], delta.value, -1))
const southCap = computed(() => polarCapPath(view, view.r, cutLatitudes(delta.value)[1], delta.value, -1))

/** 极昼极夜归哪一侧：直射点在北半球则北极侧极昼，在南半球则反过来 */
const daySide = computed(() => polarDaySide(delta.value))
/** 二至日：切点正好落在极圈上 */
const isSolstice = computed(() => Math.abs(Math.abs(delta.value) - DECL) < 0.01)
const hasPolarCaps = computed(() => daySide.value !== 0)
const northCapClass = computed(() =>
  daySide.value > 0 ? 'demo-cap demo-cap--day' : 'demo-cap demo-cap--night',
)
const southCapClass = computed(() =>
  daySide.value < 0 ? 'demo-cap demo-cap--day' : 'demo-cap demo-cap--night',
)

/** 极昼极夜的标注：跟着那一块走，文字摆在球外那一侧 */
const northNote = computed(() => {
  const outer = tangents.value.north.outer
  const left = outer.x < view.x
  return {
    line1: { x: left ? 196 : 650, y: 94, anchor: left ? 'start' : 'end' },
    line2: { x: left ? 196 : 650, y: 114, anchor: left ? 'start' : 'end' },
    leader: `M ${left ? 268 : 546} 100 L ${outer.x.toFixed(1)} ${outer.y.toFixed(1)}`,
  }
})
const southNote = computed(() => {
  const outer = tangents.value.south.outer
  const right = outer.x > view.x
  return {
    line1: { x: right ? 566 : 196, y: 284, anchor: right ? 'start' : 'end' },
    line2: { x: right ? 566 : 196, y: 304, anchor: right ? 'start' : 'end' },
    leader: `M ${right ? 560 : 204} 278 L ${outer.x.toFixed(1)} ${outer.y.toFixed(1)}`,
  }
})

/** 图上的文字 */
const declShort = computed(() => formatDeclination(delta.value))
const cutTitle = computed(() => {
  if (!hasPolarCaps.value) return '晨昏线过南北两极：全球昼夜等长'
  if (isSolstice.value) return '切点：晨昏线与极圈相切'
  return `切点：晨昏线与 ${cutLatitudes(delta.value)[0]}° 纬线相切`
})
const northCapText = computed(() => {
  if (!hasPolarCaps.value) return '无极昼极夜'
  if (isSolstice.value) return daySide.value > 0 ? '圈内：极昼' : '圈内：极夜'
  return `${daySide.value > 0 ? '极昼区' : '极夜区'}：${cutLatitudes(delta.value)[0]}° 以北`
})
const southCapText = computed(() => {
  if (!hasPolarCaps.value) return '无极昼极夜'
  if (isSolstice.value) return daySide.value > 0 ? '圈内：极夜' : '圈内：极昼'
  return `${daySide.value > 0 ? '极夜区' : '极昼区'}：${Math.abs(cutLatitudes(delta.value)[1])}° 以南`
})
const bottomNote = computed(() => {
  if (!hasPolarCaps.value) return '直射点在赤道：晨昏线过两极，全球昼夜等长'
  return `切点纬度 = 90° − |直射点纬度| = ${cutLatitudes(delta.value)[0]}°`
})

/** 解说词跟着参数走，参数变了文案不能还说别的季节 */
const subsolarSentence = computed(() => {
  if (!hasPolarCaps.value) return '直射点正好在赤道上（春分或秋分，全球昼夜等长）'
  if (isSolstice.value) {
    return `直射点在${delta.value > 0 ? '北' : '南'}回归线 ${formatDeclination(delta.value)}（${delta.value > 0 ? '夏至日' : '冬至日'}）`
  }
  return `直射点在 ${formatDeclination(delta.value)}`
})
const cutSentence = computed(() => {
  if (!hasPolarCaps.value) {
    return '现在直射点在赤道，晨昏线过两极，此时全球昼夜等长、没有极昼极夜。'
  }
  const cut = cutLatitudes(delta.value)[0]
  const where = isSolstice.value ? `${cut}° 的极圈上` : `${cut}° 的纬线上`
  const side = daySide.value > 0 ? '北圈内极昼、南圈内极夜' : '北圈内极夜、南圈内极昼'
  return `现在切点在 ${where}：晨昏线切到的那条纬线以内会出现极昼极夜——${side}。`
})

const steps = computed(() => [
  {
    id: 'subsolar',
    title: '① 找直射点，连到地心',
    text: `做光照图第一步先找太阳直射点——这一步定全局。侧视图里太阳在左边、光线是平行的，直射点就落在球的左轮廓上：${subsolarSentence.value}。第二步从直射点连一条线到地心，这条线就是太阳光线的方向。`,
  },
  {
    id: 'perpendicular',
    title: '② 过球心作垂线，就是晨昏线',
    text: '第三步：过地心作这条线的垂线——这条垂线就是晨昏线，它把地球分成昼半球和夜半球两个一样大的半球。垂线必须过球心，偏一点就不是大圆了，涂出来的昼夜范围也就错了。',
  },
  {
    id: 'shade',
    title: '③ 涂出昼半球与夜半球',
    text: '第四步涂昼夜：向着太阳的一半是昼，背着太阳的一半是夜。太阳只照亮朝着它的那一半，所以昼半球和夜半球永远各占一半，这条晨昏线永远是一条大圆。',
  },
  {
    id: 'cuts',
    title: '④ 标出切点与极昼极夜范围',
    text: `最后标两样：晨昏线与纬线相切的那两个点叫切点，切点纬度等于 90° 减直射点纬度的绝对值。${cutSentence.value}`,
  },
])
</script>

<style scoped>
.demo-cap {
  stroke-width: 1.5;
}

.demo-cap--day {
  fill: var(--learn-sun);
  fill-opacity: 0.32;
  stroke: var(--learn-sun);
}

.demo-cap--night {
  fill: var(--learn-ink);
  fill-opacity: 0.42;
  stroke: var(--learn-ink);
}

.demo-parallel {
  fill: none;
  stroke: var(--learn-ink-soft);
  stroke-width: 1.6;
  stroke-dasharray: 6 5;
}

/* 地轴：比晨昏线次要，所以画成细虚线 */
.demo-axis {
  fill: none;
  stroke: var(--learn-ink-soft);
  stroke-width: 1.8;
  stroke-dasharray: 8 6;
}

.demo__label--light {
  fill: var(--learn-day);
}
</style>
