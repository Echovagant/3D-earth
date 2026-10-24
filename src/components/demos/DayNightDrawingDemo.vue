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
        <text class="demo__label demo__label--faint" x="286" y="84" text-anchor="end">北极点</text>
        <text class="demo__label demo__label--faint" x="418" y="322">南极点</text>

        <path class="demo__leader" :d="subsolarLine" />
        <circle class="demo__cut" :cx="subsolar.x" :cy="subsolar.y" r="8" />
        <circle class="demo__cut" :cx="view.x" :cy="view.y" r="4" />

        <path class="demo__leader" d="M 236 186 L 202 148" />
        <text class="demo__label demo__label--mark" x="196" y="142" text-anchor="end">
          ① 太阳直射点 23.5°N
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
        <path class="demo-cap demo-cap--day" :d="northCap" />
        <path class="demo-cap demo-cap--night" :d="southCap" />
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
          切点：晨昏线与极圈相切
        </text>
        <path class="demo__leader" d="M 360 56 L 360 72" />
        <text class="demo__label demo__label--mark" x="196" y="94">北极圈 66.5°N</text>
        <text class="demo__label demo__label--faint" x="196" y="114">圈内：极昼</text>
        <path class="demo__leader" d="M 268 100 L 280 108" />
        <text class="demo__label demo__label--mark" x="566" y="284">南极圈 66.5°S</text>
        <text class="demo__label demo__label--faint" x="566" y="304">圈内：极夜</text>
        <path class="demo__leader" d="M 560 278 L 450 272" />

        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          切点纬度 = 90° − 直射点纬度 = 66.5°；极圈内才有极昼极夜
        </text>
        <text class="demo__label demo__label--faint" x="360" y="368" text-anchor="middle">
          夏至日：北极圈内极昼、南极圈内极夜；冬至日正好相反
        </text>
      </g>
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
 * 画的是夏至日（太阳直射北回归线 23.5°N）的侧视光照图：
 * 太阳在左、光线水平、晨昏线是一条过球心的竖直直线。
 * 球体、纬线、切点位置全部按投影算出来，不是手画的示意。
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { leftHalfPath } from '../../data/svgParts'
import {
  DECL,
  VIEW,
  axisVector,
  cutLatitudes,
  parallelSegment,
  polarCapPath,
  subsolarAxisLine,
  subsolarPoint,
  terminatorLine,
} from '../../data/dayNightDrawingGeometry'

const steps = [
  {
    id: 'subsolar',
    title: '① 找直射点，连到地心',
    text: '做光照图第一步先找太阳直射点——这一步定全局。侧视图里太阳在左边、光线是平行的，直射点就落在球的左轮廓上：夏至日它在北回归线 23.5°N。第二步从直射点连一条线到地心，这条线就是太阳光线的方向。',
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
    text: '最后标两样：晨昏线与极圈相切的那两个点叫切点，切点纬度等于 90° 减直射点纬度，所以夏至日的切点正好在 66.5° 的极圈上。切点以北或以南，圈内会出现极昼极夜——夏至日北圈内极昼、南圈内极夜，冬至日正好相反。',
  },
]

const view = VIEW
const subsolar = subsolarPoint(view, view.r)
const subsolarLine = subsolarAxisLine(view, view.r)
const terminator = terminatorLine(view, view.r)
const dayPath = leftHalfPath(view.x, view.y, view.r)

/** 地轴：夏至日北端朝向太阳（向左倾） */
const axisLine = computed(() => {
  const a = axisVector(DECL, -1)
  const len = view.r + 34
  return `M ${view.x - a.x * len} ${view.y - a.y * len} L ${view.x + a.x * len} ${view.y + a.y * len}`
})

/** 极圈与切点 */
const northPolar = computed(() => parallelSegment(view, view.r, cutLatitudes(DECL)[0], DECL, -1))
const southPolar = computed(() => parallelSegment(view, view.r, cutLatitudes(DECL)[1], DECL, -1))
const northPolarLine = computed(() => `M ${northPolar.value.from.x} ${northPolar.value.from.y} L ${northPolar.value.to.x} ${northPolar.value.to.y}`)
const southPolarLine = computed(() => `M ${southPolar.value.from.x} ${southPolar.value.from.y} L ${southPolar.value.to.x} ${southPolar.value.to.y}`)

/** 切点 = 晨昏线与极圈的交点，在侧视投影里就是晨昏线的两个端点 */
const cutNorth = computed(() => northPolar.value.to)
const cutSouth = computed(() => southPolar.value.from)

/** 极昼、极夜的范围 */
const northCap = computed(() => polarCapPath(view, view.r, cutLatitudes(DECL)[0], DECL, -1))
const southCap = computed(() => polarCapPath(view, view.r, cutLatitudes(DECL)[1], DECL, -1))
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
