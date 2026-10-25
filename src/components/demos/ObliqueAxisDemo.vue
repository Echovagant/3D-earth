<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 两个面：赤道面与黄道面的夹角 = 黄赤交角 -->
      <g v-show="step === 0" class="demo__frame">
        <ellipse
          class="demo-plane demo-plane--ecliptic"
          data-explain="ecliptic"
          cx="360"
          cy="200"
          rx="250"
          ry="34"
        />
        <ellipse
          class="demo-plane demo-plane--equator"
          data-explain="equator-plane"
          cx="360"
          cy="200"
          rx="250"
          ry="34"
          transform="rotate(23.5 360 200)"
        />
        <circle class="demo__globe-plain" cx="360" cy="200" r="84" />
        <path class="demo__spin" data-explain="axis" :d="axisLine(360, 200, 118)" />
        <text class="demo__label demo__label--faint" x="416" y="84">北极点</text>
        <text class="demo__label demo__label--faint" x="304" y="318" text-anchor="end">南极点</text>

        <path class="demo__spin" data-explain="oblique-arc" :d="obliqueArc" />
        <text class="demo__label demo__label--mark" x="620" y="258">23.5°</text>

        <text class="demo__label" x="122" y="182" text-anchor="middle">黄道面</text>
        <text class="demo__label" x="140" y="72" text-anchor="middle">赤道面</text>
        <path class="demo__leader" d="M 152 80 L 166 94" />

        <text class="demo__caption-line" x="360" y="342" text-anchor="middle">
          黄赤交角 = 23°26′ ≈ 23.5°，是赤道面与黄道面的夹角
        </text>
        <text class="demo__label demo__label--faint" x="360" y="362" text-anchor="middle">
          地轴与黄道面的夹角是 66.5°，地轴与黄道面法线的夹角才是 23.5°
        </text>
      </g>

      <!-- ② 回归线 23.5° 与极圈 66.5°，两者互余 -->
      <g v-show="step === 1" class="demo__frame">
        <circle class="demo__globe-plain" cx="270" cy="195" r="95" />
        <path
          v-for="p in parallels"
          :key="`p${p.lat}`"
          class="demo-parallel"
          :class="{ 'demo-parallel--key': p.key }"
          :data-explain="p.explainId"
          :d="`M ${p.from.x} ${p.from.y} L ${p.to.x} ${p.to.y}`"
        />
        <path class="demo__spin" :d="axisLine(270, 195, 128)" />
        <text class="demo__label demo__label--faint" x="326" y="74">北极点</text>
        <text class="demo__label demo__label--faint" x="214" y="322" text-anchor="end">南极点</text>

        <text
          v-for="p in parallels"
          :key="`l${p.lat}`"
          class="demo__label"
          :class="{ 'demo__label--mark': p.key }"
          :x="p.to.x + 10"
          :y="p.to.y + 4"
        >
          {{ p.label }}
        </text>

        <text class="demo__label demo__label--mark" x="516" y="182">23.5° + 66.5° = 90°</text>
        <text class="demo__label demo__label--faint" x="516" y="204">回归线与极圈互余</text>
        <text class="demo__label demo__label--faint" x="516" y="224">黄赤交角变了，这两条线跟着变</text>
      </g>

      <!-- ③ 直射点的移动范围：南北回归线之间 -->
      <g v-show="step === 2" class="demo__frame">
        <rect
          class="demo-band"
          data-explain="band"
          :x="plot.left"
          :y="bandTop"
          :width="plot.right - plot.left"
          :height="bandBottom - bandTop"
        />
        <path class="demo-axis-line" :d="`M ${plot.left} ${equatorY} L ${plot.right} ${equatorY}`" />
        <path
          class="demo-tropic"
          :d="`M ${plot.left} ${bandTop} L ${plot.right} ${bandTop}`"
        />
        <path
          class="demo-tropic"
          :d="`M ${plot.left} ${bandBottom} L ${plot.right} ${bandBottom}`"
        />
        <path class="demo__curve" data-explain="track" :d="trackPath" />
        <circle
          v-for="p in seasonPoints"
          :key="p.key"
          class="demo__cut"
          data-explain="season-point"
          :cx="p.x"
          :cy="p.y"
          r="5.5"
        />
        <text class="demo__label demo__label--faint" x="104" y="86" text-anchor="end">纬度</text>
        <text class="demo__label" x="104" y="106" text-anchor="end">23.5°N</text>
        <text class="demo__label" x="104" y="294" text-anchor="end">23.5°S</text>
        <text class="demo__label demo__label--faint" :x="plot.right" y="352" text-anchor="end">
          时间 →
        </text>
        <text
          v-for="p in seasonPoints"
          :key="`d${p.key}`"
          class="demo__label demo__label--faint"
          :x="p.x"
          y="316"
          text-anchor="middle"
        >
          {{ p.label }}
        </text>

        <!-- 球面上：直射点只能落在两条回归线之间 -->
        <circle class="demo__globe-plain" cx="570" cy="195" r="82" />
        <path class="demo-band-path" data-explain="band" :d="insetBandPath" />
        <path class="demo-axis-line" :d="axisLine(570, 195, 110)" />
        <text class="demo__label demo__label--mark" x="570" y="304" text-anchor="middle">
          直射点只落在两条回归线之间
        </text>
        <text class="demo__label demo__label--faint" x="570" y="324" text-anchor="middle">
          线上 1 次 · 线内 2 次 · 线外 0 次
        </text>
      </g>

      <!-- ④ 对比：黄赤交角为 0 的世界 -->
      <g v-show="step === 3" class="demo__frame">
        <text class="demo__label demo__label--mark" x="185" y="92" text-anchor="middle">
          现在：黄赤交角 23.5°
        </text>
        <circle class="demo__globe-plain" cx="185" cy="190" r="78" />
        <path class="demo-band-path" :d="nowBandPath" />
        <path class="demo__spin" :d="axisLine(185, 190, 96, 23.5)" />
        <path class="demo-tropic" :d="segmentPath(nowNorthTropic)" />
        <path class="demo-tropic" :d="segmentPath(nowSouthTropic)" />
        <path class="demo-parallel" :d="segmentPath(nowNorthPolar)" />
        <path class="demo-parallel" :d="segmentPath(nowSouthPolar)" />

        <text class="demo__label demo__label--mark" x="535" y="92" text-anchor="middle">
          假想：黄赤交角 = 0°
        </text>
        <circle class="demo__globe-plain" data-explain="zero-world" cx="535" cy="190" r="78" />
        <path class="demo-axis-line" d="M 457 190 L 613 190" />
        <path class="demo__spin" :d="axisLine(535, 190, 96, 0)" />
        <circle class="demo__cut" cx="535" cy="112" r="4" />
        <circle class="demo__cut" cx="535" cy="268" r="4" />
        <circle class="demo__sun" cx="352" cy="190" r="15" />
        <g class="demo__ray">
          <path v-for="dy in [-9, 0, 9]" :key="dy" :d="`M 370 ${190 + dy} L 457 ${190 + dy}`" />
        </g>
        <circle class="demo__cut" cx="457" cy="190" r="5" />
        <path class="demo__leader" d="M 452 180 L 498 148" />
        <text class="demo__label demo__label--mark" x="516" y="140" text-anchor="end">
          直射点永远在赤道
        </text>

        <text class="demo__label" x="185" y="300" text-anchor="middle">
          ① 直射点在南北回归线之间往返
        </text>
        <text class="demo__label" x="185" y="322" text-anchor="middle">
          ② 回归线与极圈之间才有极昼极夜
        </text>
        <text class="demo__label" x="185" y="344" text-anchor="middle">③ 有四季变化</text>

        <text class="demo__label" x="535" y="300" text-anchor="middle">
          ① 直射点永远钉在赤道
        </text>
        <text class="demo__label" x="535" y="322" text-anchor="middle">
          ② 回归线与赤道重合、极圈缩到极点
        </text>
        <text class="demo__label" x="535" y="344" text-anchor="middle">
          ③ 极地永久冰封、没有四季
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §4.2 黄赤交角与太阳直射点的移动。
 *
 * 老师讲这节时那句「想象一下地球如果不歪着头，直射点永远钉在赤道上」，
 * 讲的是反事实——学生脑子里其实没有「歪着头」那幅图。这段就是补它。
 *
 * 四步各自的分工：
 *   ① 两个面与 23.5° —— 黄赤交角是哪个角
 *   ② 回归线与极圈 —— 23.5° 与 66.5° 互余
 *   ③ 直射点的移动范围带 —— 三线图 + 球面上的范围带
 *   ④ 反事实对比 —— 黄赤交角为 0 的世界
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import {
  AXIS_TO_ECLIPTIC,
  AXIS_TO_ECLIPTIC_DMS,
  DAYS_PER_YEAR,
  DECLINATION_SPAN,
  OBLIQUITY,
  OBLIQUITY_DMS,
  POLAR_CIRCLE,
  SEASON_DAYS,
  TROPIC,
  axisVector,
  declination,
  declinationSpeedPerDay,
  parallelSegment,
  subsolarTrack,
} from '../../data/obliqueAxisGeometry'

const steps = [
  {
    id: 'obliquity',
    title: '① 黄赤交角是哪个角',
    text: '黄赤交角是赤道面与黄道面的夹角，约 23°26′，通常写成 23.5°。地轴是斜的，斜到什么程度？地轴与黄道面的夹角是 66.5°，与黄道面法线的夹角才是 23.5°——这两个角千万别记混。',
  },
  {
    id: 'latitudes',
    title: '② 回归线与极圈',
    text: '黄赤交角定了两条线：太阳直射点最远能到的地方是回归线，23.5°N 和 23.5°S；地球上有极昼极夜的最南（北）界线是极圈，66.5°N 和 66.5°S。23.5 加 66.5 正好 90——回归线与极圈互余，这是黄赤交角一变、两条线跟着变的原因。',
  },
  {
    id: 'track',
    title: '③ 直射点在南北回归线之间来回',
    text: '直射点一年在南北回归线之间往返一次：春分从赤道出发，夏至到北回归线，秋分回到赤道，冬至到南回归线。它不是匀速的——越靠近回归线走得越慢，所以曲线的两端是压扁的。落到球面上看，直射点只可能在两条回归线之间。',
  },
  {
    id: 'zero',
    title: '④ 如果地球不歪着头',
    text: '想象地球不歪着头：赤道面与黄道面重合，黄赤交角变成 0°。那直射点就永远钉在赤道上，回归线与赤道重合、极圈缩到极点（那里也就永久冰封），四季变化消失。地球歪这 23.5°，才有我们熟悉的季节。',
  },
]

/** 地轴线（穿过球心，两端各延长一段） */
const axisLine = (cx, cy, len, tilt = OBLIQUITY) => {
  const a = axisVector(tilt)
  return `M ${cx - a.x * len} ${cy - a.y * len} L ${cx + a.x * len} ${cy + a.y * len}`
}

/** ① 黄赤交角的角弧：从黄道面右端到赤道面右端，正好是两面之间的夹角 */
const obliqueArc = computed(() => {
  const cx = 360
  const cy = 200
  const r = 250
  const t = (OBLIQUITY * Math.PI) / 180
  const from = { x: cx + r, y: cy }
  const to = { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) }
  return `M ${from.x} ${from.y} A ${r} ${r} 0 0 1 ${to.x.toFixed(2)} ${to.y.toFixed(2)}`
})

/** ② 纬线：赤道、回归线、极圈 */
const parallels = computed(() => {
  const center = { x: 270, y: 195 }
  const r = 95
  const list = [
    { lat: POLAR_CIRCLE, label: `北极圈 ${POLAR_CIRCLE}°N`, key: false, explainId: 'polar-circle' },
    { lat: TROPIC, label: `北回归线 ${TROPIC}°N`, key: true, explainId: 'tropic' },
    { lat: 0, label: '赤道 0°', key: true, explainId: undefined },
    { lat: -TROPIC, label: `南回归线 ${TROPIC}°S`, key: true, explainId: 'tropic' },
    { lat: -POLAR_CIRCLE, label: `南极圈 ${POLAR_CIRCLE}°S`, key: false, explainId: 'polar-circle' },
  ]
  return list.map((p) => ({ ...p, ...parallelSegment(center, r, p.lat) }))
})

/** ③ 三线图：纬度 × 时间 */
const plot = { left: 130, right: 440, top: 96, bottom: 292, latTop: 30 }
const track = computed(() => subsolarTrack(plot))
const trackPath = computed(() =>
  track.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' '),
)
const latToY = (lat) =>
  plot.top + ((plot.latTop - lat) / (2 * plot.latTop)) * (plot.bottom - plot.top)
const bandTop = computed(() => latToY(TROPIC))
const bandBottom = computed(() => latToY(-TROPIC))
const equatorY = computed(() => latToY(0))
const seasonPoints = computed(() =>
  [
    { key: 'vernal', label: '春分 3.21', days: SEASON_DAYS.vernal },
    { key: 'summer', label: '夏至 6.22', days: SEASON_DAYS.summer },
    { key: 'autumnal', label: '秋分 9.23', days: SEASON_DAYS.autumnal },
    { key: 'winter', label: '冬至 12.22', days: SEASON_DAYS.winter },
    { key: 'next', label: '次年春分', days: SEASON_DAYS.nextVernal },
  ].map((s) => ({
    ...s,
    x: plot.left + (s.days / SEASON_DAYS.nextVernal) * (plot.right - plot.left),
    y: latToY(declination(s.days)),
  })),
)

/** ③ 球面示意：回归线之间就是直射点能落到的范围 */
const insetBandPath = computed(() => {
  const center = { x: 570, y: 195 }
  const r = 82
  const n = parallelSegment(center, r, TROPIC)
  const s = parallelSegment(center, r, -TROPIC)
  return `M ${n.from.x} ${n.from.y} L ${n.to.x} ${n.to.y} L ${s.to.x} ${s.to.y} L ${s.from.x} ${s.from.y} Z`
})

/** ④ 两个世界的球面 */
const nowNorthTropic = computed(() => parallelSegment({ x: 185, y: 190 }, 78, TROPIC))
const nowSouthTropic = computed(() => parallelSegment({ x: 185, y: 190 }, 78, -TROPIC))
const nowNorthPolar = computed(() => parallelSegment({ x: 185, y: 190 }, 78, POLAR_CIRCLE))
const nowSouthPolar = computed(() => parallelSegment({ x: 185, y: 190 }, 78, -POLAR_CIRCLE))
const nowBandPath = computed(() => {
  const n = nowNorthTropic.value
  const s = nowSouthTropic.value
  return `M ${n.from.x} ${n.from.y} L ${n.to.x} ${n.to.y} L ${s.to.x} ${s.to.y} L ${s.from.x} ${s.from.y} Z`
})

const segmentPath = (p) => `M ${p.from.x} ${p.from.y} L ${p.to.x} ${p.to.y}`

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 参数一动，图和讲解一起变，不会出现「图上 66.5°、文字写着 65°」。
 */
const explains = computed(() => {
  const quarterDays = SEASON_DAYS.summer
  const vars = {
    obliquity: `${OBLIQUITY}°`,
    obliquityDms: OBLIQUITY_DMS,
    axisToEcliptic: `${AXIS_TO_ECLIPTIC}°`,
    axisToEclipticDms: AXIS_TO_ECLIPTIC_DMS,
    tropic: `${TROPIC}°`,
    tropicS: `${TROPIC}°S`,
    polarCircle: `${POLAR_CIRCLE}°`,
    polarCircleS: `${POLAR_CIRCLE}°S`,
    sum: `${OBLIQUITY + POLAR_CIRCLE}°`,
    zeroPolar: `${90 - 0}°`,
    span: `${DECLINATION_SPAN}°`,
    speedDeg: declinationSpeedPerDay().toFixed(2),
    yearDays: String(DAYS_PER_YEAR),
    quarterDays: quarterDays.toFixed(1),
    vernalDecl: `${declination(SEASON_DAYS.vernal).toFixed(1)}°`,
    summerDecl: `${declination(SEASON_DAYS.summer).toFixed(1)}°`,
    autumnalDecl: `${declination(SEASON_DAYS.autumnal).toFixed(1)}°`,
    winterDecl: `${declination(SEASON_DAYS.winter).toFixed(1)}°`,
  }

  return {
    ecliptic: {
      name: '黄道面',
      hint: '地球公转轨道所在的平面：太阳直射点就在这个面上。',
      vars,
      steps: [
        '黄道面 = 地球公转轨道所在的平面',
        '太阳在轨道面上，地球绕着它转',
        '地球在轨道面上看到太阳，就等于太阳绕着地球在天球上走',
        '直射点 = 地心与日心连线的延长线在地球表面的交点',
      ],
    },
    'equator-plane': {
      name: '赤道面',
      hint: '赤道所在的平面：它垂直于地轴。',
      vars,
      steps: [
        '赤道面 = 垂直于地轴的平面',
        '太阳直射点落在赤道面上时，当地正午太阳高度 90°',
        '两个面差多少，就是黄赤交角',
        '地球公转时这个面并不跟着转——地轴始终指向同一方',
      ],
    },
    'oblique-arc': {
      name: '黄赤交角（23.5°）',
      hint: '赤道面与黄道面的夹角：23°26′，教材里取整成 23.5°。',
      vars,
      steps: [
        `黄赤交角 = 赤道面与黄道面的夹角 = ${vars.obliquityDms}，教材取整成 ${vars.obliquity}`,
        '它同时等于地轴与黄道面法线的夹角',
        `所以地轴与黄道面的夹角 = 90° − ${vars.obliquity} = ${vars.axisToEcliptic}（${vars.axisToEclipticDms}）`,
        '这两个角千万别记混：一个是 23.5°，一个是 66.5°',
      ],
    },
    axis: {
      name: '地轴',
      hint: '地轴是斜的：斜到什么程度，决定了回归线和极圈在哪。',
      vars,
      steps: [
        '地轴垂直于赤道面',
        `地轴与黄道面的夹角 = ${vars.axisToEcliptic}`,
        `地轴与黄道面法线的夹角 = ${vars.obliquity}`,
        '公转一圈地轴方向始终平行——倾斜方向不变，只改倾斜角度',
      ],
    },
    tropic: {
      name: '回归线（23.5°）',
      hint: '太阳直射点最远能到的纬线：23.5°N 与 23.5°S。',
      vars,
      steps: [
        `回归线纬度 = 黄赤交角 = ${vars.tropic}`,
        '直射点最北时正好在夏至，此时日心连线的投影落在北回归线上',
        `南回归线同理：${vars.tropicS}`,
        '回归线内一年被直射 2 次，回归线上 1 次，线外 0 次',
      ],
    },
    'polar-circle': {
      name: '极圈（66.5°）',
      hint: '有极昼极夜的界线：66.5°N 与 66.5°S。',
      vars,
      steps: [
        `极圈纬度 = 90° − 黄赤交角 = 90° − ${vars.obliquity} = ${vars.polarCircle}`,
        '推导：晨昏线与纬线相切的那条纬线，纬度 = 90° − |直射点纬度|，取最大就是极圈',
        `所以回归线与极圈互余：${vars.obliquity} + ${vars.polarCircle} = ${vars.sum}`,
        '黄赤交角一变，这两条线跟着一起变',
      ],
    },
    track: {
      name: '直射点轨迹',
      hint: '直射点一年在南北回归线之间往返，越靠近回归线走得越慢。',
      vars,
      steps: [
        '直射点纬度满足 sinδ = sinε·sinλ（ε 是黄赤交角，λ 是太阳黄经）',
        `一年从 −${vars.tropic} 走到 +${vars.tropic} 再回来 ⇒ 一共走 4 × ${vars.tropic} = ${vars.span}`,
        `平均速度 = ${vars.span} ÷ ${vars.yearDays} 天 ≈ ${vars.speedDeg}°/天`,
        '不是匀速：正弦关系让它在赤道附近最快、在回归线附近最慢',
      ],
    },
    band: {
      name: '直射点的范围带',
      hint: '球面上，直射点只可能落在两条回归线之间。',
      vars,
      steps: [
        '直射点 = 地心与日心连线的延长线在球面的交点',
        `它与赤道面的夹角最多是黄赤交角 ${vars.obliquity}`,
        `所以直射点的纬度范围 = [−${vars.tropic}, +${vars.tropic}]`,
        '落到球面上就是一条带状区域',
      ],
    },
    'season-point': {
      name: '二分二至的直射点',
      hint: '春分在赤道、夏至到北回归线、秋分回赤道、冬至到南回归线。',
      vars,
      steps: [
        `春分（λ = 0°）⇒ sinδ = 0 ⇒ δ = ${vars.vernalDecl}（赤道）`,
        `夏至（λ = 90°）⇒ sinδ = sin${vars.obliquity} ⇒ δ = ${vars.summerDecl}`,
        `秋分（λ = 180°）⇒ δ = ${vars.autumnalDecl}（赤道）`,
        `冬至（λ = 270°）⇒ δ = ${vars.winterDecl}`,
        `二分二至之间的天数相等：每段约 ${vars.quarterDays} 天`,
      ],
    },
    'zero-world': {
      name: '假想：交角为 0° 的世界',
      hint: '假如地球不歪着头，会变成什么样。',
      vars,
      steps: [
        '黄赤交角 = 0° ⇒ 赤道面与黄道面重合',
        '直射点纬度 = 0 ⇒ 直射点永远钉在赤道上',
        `回归线与赤道重合，极圈缩到极点（纬度 = 90° − 0 = ${vars.zeroPolar}）`,
        '极点处永久冰封，四季变化消失',
      ],
    },
  }
})
</script>

<style scoped>
.demo-plane {
  fill: none;
  stroke-width: 1.6;
}

.demo-plane--ecliptic {
  fill: var(--learn-accent-soft);
  fill-opacity: 0.45;
  stroke: var(--learn-ink-faint);
}

.demo-plane--equator {
  fill: var(--learn-day);
  fill-opacity: 0.75;
  stroke: var(--learn-accent);
}

.demo-parallel {
  fill: none;
  stroke: var(--learn-ink-faint);
  stroke-width: 1.3;
}

.demo-parallel--key {
  stroke: var(--learn-accent);
  stroke-width: 2;
}

.demo-axis-line {
  fill: none;
  stroke: var(--learn-ink-soft);
  stroke-width: 1.6;
}

.demo-tropic {
  fill: none;
  stroke: var(--learn-ink-soft);
  stroke-width: 1.4;
  stroke-dasharray: 6 5;
}

.demo-band {
  fill: var(--learn-accent-soft);
  fill-opacity: 0.55;
  stroke: none;
}

.demo-band-path {
  fill: var(--learn-accent-soft);
  fill-opacity: 0.8;
  stroke: var(--learn-accent);
  stroke-width: 1.3;
}
</style>
