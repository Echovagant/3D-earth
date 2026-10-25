<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 侧视球 + 几条纬线：跑道有长有短 -->
      <g v-show="step === 0" class="demo__frame">
        <circle class="demo__globe-plain" :cx="side.cx" :cy="side.cy" :r="side.r" />
        <g class="demo__grid" data-explain="track">
          <path
            v-for="l in sideLatitudes"
            :key="`sl${l.lat}`"
            :d="`M ${side.cx - l.half} ${l.y} L ${side.cx + l.half} ${l.y}`"
          />
        </g>
        <circle class="demo__cut" data-explain="pole-north" :cx="side.cx" :cy="side.cy - side.r" r="5" />
        <circle class="demo__cut" data-explain="pole-south" :cx="side.cx" :cy="side.cy + side.r" r="5" />
        <text class="demo__label demo__label--faint" x="330" y="78" text-anchor="middle">北极点</text>
        <text class="demo__label demo__label--faint" x="330" y="318" text-anchor="middle">南极点</text>

        <text
          v-for="l in sideLatitudes"
          :key="`slt${l.lat}`"
          class="demo__label demo__label--faint"
          x="418"
          :y="l.y + 4"
        >
          {{ l.label }}
        </text>

        <text class="demo__caption-line" x="360" y="352" text-anchor="middle">
          纬线圈就是「跑道」：同样转一圈，赤道上的跑道最长，越往两极越短
        </text>
      </g>

      <!-- ② 北极上方俯视：同一条纬线上，一小时走过的弧长各不相同 -->
      <g v-show="step === 1" class="demo__frame">
        <circle class="demo__globe-plain" :cx="view.cx" :cy="view.cy" :r="view.r" />
        <g class="demo__grid" data-explain="lat-circle">
          <path
            v-for="c in view.circles"
            :key="`c${c.lat}`"
            :d="circlePath(view.cx, view.cy, c.r)"
          />
        </g>

        <g v-for="run in runners" :key="run.label" :data-explain="run.explainId">
          <circle class="demo__cut" :cx="run.tail.x" :cy="run.tail.y" r="5" />
          <path class="demo__spin" :d="run.path" />
          <path class="demo__spin-head" :d="run.head" />
          <text class="demo__label demo__label--mark" :x="run.labelX" :y="run.labelY" :text-anchor="run.anchor">
            {{ run.label }}
          </text>
        </g>
        <text class="demo__label demo__label--faint" x="250" y="228" text-anchor="middle">
          北极点（线速度 0）
        </text>

        <text class="demo__caption-line" x="360" y="352" text-anchor="middle">
          箭头都指向当地正东，长度 = 一小时走过的距离：赤道 1670、30° 1447、60° 835、极点 0 km/h
        </text>
      </g>

      <!-- ③ 角速度处处相同，慢的是线速度 -->
      <g v-show="step === 2" class="demo__frame">
        <circle class="demo__globe-plain" :cx="view.cx" :cy="view.cy" :r="view.r" />
        <g class="demo__grid" data-explain="lat-circle">
          <path
            v-for="c in view.circles"
            :key="`c${c.lat}`"
            :d="circlePath(view.cx, view.cy, c.r)"
          />
        </g>

        <!-- 同一小时里，各纬线都转过 15°，但走过的弧长不同 -->
        <g v-for="s in sectors" :key="`s${s.lat}`" data-explain="sector">
          <path class="demo__curve" :d="s.path" />
        </g>

        <path class="demo__leader" d="M 340 140 L 412 118" />
        <text class="demo__label demo__label--mark" x="418" y="114">转过的角度一样</text>
        <text class="demo__label demo__label--faint" x="418" y="132">都是 15°/小时</text>
        <path class="demo__leader" d="M 312 172 L 412 212" />
        <text class="demo__label demo__label--mark" x="418" y="216">走过的弧长不同</text>
        <text class="demo__label demo__label--faint" x="418" y="234">赤道的弧最长</text>

        <text class="demo__caption-line" x="360" y="352" text-anchor="middle">
          角速度除极点外处处相同（约 15°/小时）；随纬度变慢的是线速度，不是角速度
        </text>
      </g>

      <!-- ④ 同一条纬线：站得高跑得快 -->
      <g v-show="step === 3" class="demo__frame">
        <circle class="demo__globe-plain" :cx="view.cx" :cy="view.cy" :r="view.r" />
        <g class="demo__grid" data-explain="lat-circle">
          <path
            v-for="c in view.circles"
            :key="`c${c.lat}`"
            :d="circlePath(view.cx, view.cy, c.r)"
          />
        </g>

        <!-- 海拔更高的那一圈（海拔差已放大）与山顶 -->
        <g class="demo__grid" data-explain="hill">
          <path
            :d="circlePath(view.cx, view.cy, hill.peakR)"
          />
        </g>
        <path class="demo__hill" data-explain="hill" :d="hill.mountain" />
        <text class="demo__label demo__label--faint" :x="hill.peakX + 14" :y="hill.peakY - 4">
          海拔更高的一圈
        </text>

        <g v-for="run in hillRunners" :key="run.label" :data-explain="run.explainId">
          <circle class="demo__cut" :cx="run.tail.x" :cy="run.tail.y" r="5" />
          <path class="demo__spin" :d="run.path" />
          <path class="demo__spin-head" :d="run.head" />
          <text
            class="demo__label"
            :class="run.mark ? 'demo__label--mark' : 'demo__label--faint'"
            :x="run.labelX"
            :y="run.labelY"
            :text-anchor="run.anchor"
          >
            {{ run.label }}
          </text>
        </g>

        <text class="demo__caption-line" x="360" y="338" text-anchor="middle">
          同一条纬线上，海拔越高 → 离地轴越远 → 半径越大 → 线速度越大（图中已放大）
        </text>
        <text class="demo__label demo__label--faint" x="360" y="360" text-anchor="middle">
          实际差别很小：海拔每升高 1 km，线速度约增大 0.016%
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §3.4 自转线速度的判读与应用。
 *
 * 老师的话：「同一条纬线上谁站得高谁跑得快；赤道上的人天生跑得快，往两极跑道越来越短」。
 * 四步把「跑道」和「速度」画成同一个东西：
 *   ① 侧视球 + 纬线：纬线圈就是跑道，长度随纬度变
 *   ② 北极上方俯视：同一条纬线上一小时走过的弧长（箭头长度）随纬度变
 *   ③ 角速度处处相同，15°/小时——慢的是线速度
 *   ④ 同一条纬线上，海拔越高跑得越快
 *
 * 箭头长度不是手调的：纬线圈半径 = R·cosφ，箭头长度 ∝ cosφ，天然对得上。
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { arrowHead, circlePath, polarToXY } from '../../data/svgParts'
import {
  DEGREES_PER_HOUR,
  EARTH_RADIUS_KM,
  SPEED_TABLE,
  altitudeSpeedGainPercent,
  equatorCircumferenceKm,
  latitudeCircleRadius,
  linearSpeed,
  radiusRatio,
  speedArrowLength,
  speedFromCircumference,
} from '../../data/rotationSpeedGeometry'

const steps = [
  {
    id: 'tracks',
    title: '① 纬线圈就是「跑道」',
    text: '线速度取决于你脚下这条纬线圈有多长。侧视图里，纬度 φ 的纬线圈投影成长度 2R·cosφ 的线段：赤道最长，往两极越来越短，到极点缩成一个点。跑道短，跑当然慢。',
  },
  {
    id: 'speed',
    title: '② 同一条纬线，一小时走过的距离各不相同',
    text: '从北极上方俯视，每条纬线圈是一个圆，各处转过的角度一样（15°/小时），但绕一圈的长度不同，所以一小时走过的弧长不同：赤道约 1670 km/h，北纬 30° 约 1447，60° 约 835，极点是 0。',
  },
  {
    id: 'angular',
    title: '③ 慢的是线速度，不是角速度',
    text: '最容易错的一条：除南北极点外，地球各地的角速度处处相同，约 15°/小时——在北回归线上转 1 小时的角度和在赤道上一样大。随纬度变慢的是线速度，因为纬线圈变短了。',
  },
  {
    id: 'altitude',
    title: '④ 同一条纬线上，站得高跑得快',
    text: '线速度 v = ω·R·cosφ 里的 R 是到地轴的距离，所以海拔越高，这个 R 越大，线速度越大。实际差别很小（每升高 1 km 约大 0.016%），但判断题里必须答「海拔」而不是「地形复杂」。',
  },
]

/** ① 侧视的地球：纬度 φ 的纬线圈投影成长 2R·cosφ 的线段 */
const side = { cx: 300, cy: 195, r: 105 }
const sideLatitudes = [60, 30, 0, -30, -60].map((lat) => ({
  lat,
  y: Number((side.cy - side.r * Math.sin((lat * Math.PI) / 180)).toFixed(2)),
  half: Number((side.r * Math.cos((lat * Math.PI) / 180)).toFixed(2)),
  label:
    lat === 0 ? '赤道' : `${lat > 0 ? '北纬' : '南纬'} ${Math.abs(lat)}°`,
}))

/** ②③ 极点俯视：同心圆是纬线，半径 = R·cosφ */
const view = {
  cx: 250,
  cy: 195,
  r: 110,
  circles: [30, 60].map((lat) => ({
    lat,
    r: Number(latitudeCircleRadius(110, lat).toFixed(2)),
  })),
}

/** 沿圆周切向推进：返回尾点、箭头终点与朝向 */
function tangentialRun(r, angleDeg, len) {
  const tail = polarToXY(view.cx, view.cy, r, angleDeg)
  const tangent = angleDeg + 90
  const rad = (tangent * Math.PI) / 180
  const tip = { x: tail.x + len * Math.cos(rad), y: tail.y - len * Math.sin(rad) }
  return { tail, tip, tangent }
}

/** ② 跑步的人与速度箭头：长度 ∝ cosφ，赤道最长 76px */
const MAX_ARROW = 76
const RUNNER_ANGLES = { 0: 180, 30: 90, 60: 0 }
/** 每支箭头在讲解层里的编号 */
const RUNNER_EXPLAIN_IDS = { 0: 'arrow-equator', 30: 'arrow-30', 60: 'arrow-60' }
/** 数值取讲义的常用取值表，不手写 */
const SPEED_BY_LAT = Object.fromEntries(SPEED_TABLE.map((s) => [s.lat, s.speed]))
const RUNNER_LABELS = {
  0: { text: `赤道 ${SPEED_BY_LAT[0]}`, x: 140, y: 292, anchor: 'middle' },
  30: { text: `北纬 30° ${SPEED_BY_LAT[30]}`, x: 176, y: 96, anchor: 'end' },
  60: { text: `北纬 60° ${SPEED_BY_LAT[60]}`, x: 314, y: 150, anchor: 'start' },
}
const runners = [0, 30, 60].map((lat) => {
  const r = latitudeCircleRadius(view.r, lat)
  const len = speedArrowLength(lat, MAX_ARROW)
  const { tail, tip, tangent } = tangentialRun(r, RUNNER_ANGLES[lat], len)
  return {
    explainId: RUNNER_EXPLAIN_IDS[lat],
    label: RUNNER_LABELS[lat].text,
    labelX: RUNNER_LABELS[lat].x,
    labelY: RUNNER_LABELS[lat].y,
    anchor: RUNNER_LABELS[lat].anchor,
    tail,
    path: `M ${tail.x.toFixed(2)} ${tail.y.toFixed(2)} L ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`,
    head: arrowHead(tip.x, tip.y, tangent, 12),
  }
})

/** ③ 同一小时里转过的 15°：扇形圆心角处处相同，弧长不同 */
const sectors = [0, 30, 60].map((lat) => {
  const r = latitudeCircleRadius(view.r, lat)
  const from = 20
  const to = from + DEGREES_PER_HOUR
  const a = polarToXY(view.cx, view.cy, r, from)
  const b = polarToXY(view.cx, view.cy, r, to)
  return {
    lat,
    path:
      `M ${view.cx} ${view.cy} L ${a.x.toFixed(2)} ${a.y.toFixed(2)} ` +
      `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 0 ${b.x.toFixed(2)} ${b.y.toFixed(2)} Z`,
  }
})

/** ④ 同一条纬线上的两个点：山脚与山顶（海拔差已放大） */
const hill = (() => {
  const r30 = latitudeCircleRadius(view.r, 30)
  const peakR = r30 + 26
  const angle = 25
  const peak = polarToXY(view.cx, view.cy, peakR, angle)
  const left = polarToXY(view.cx, view.cy, r30, angle - 15)
  const right = polarToXY(view.cx, view.cy, r30, angle + 15)
  return {
    peakR: Number(peakR.toFixed(2)),
    peakX: Number(peak.x.toFixed(2)),
    peakY: Number(peak.y.toFixed(2)),
    mountain:
      `M ${left.x.toFixed(2)} ${left.y.toFixed(2)} ` +
      `L ${peak.x.toFixed(2)} ${peak.y.toFixed(2)} ` +
      `L ${right.x.toFixed(2)} ${right.y.toFixed(2)} Z`,
  }
})()

const HILL_ANGLE = 165
const hillRunners = [
  (() => {
    const r = latitudeCircleRadius(view.r, 30)
    const len = speedArrowLength(30, MAX_ARROW)
    const { tail, tip, tangent } = tangentialRun(r, HILL_ANGLE, len)
    return {
      explainId: 'hill-runner',
      label: '山脚 · 海拔低',
      labelX: 132,
      labelY: 232,
      anchor: 'end',
      mark: false,
      tail,
      path: `M ${tail.x.toFixed(2)} ${tail.y.toFixed(2)} L ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`,
      head: arrowHead(tip.x, tip.y, tangent, 12),
    }
  })(),
  (() => {
    const r = hill.peakR
    const len = speedArrowLength(30, MAX_ARROW) * 1.4
    const { tail, tip, tangent } = tangentialRun(r, HILL_ANGLE, len)
    return {
      explainId: 'hill-runner',
      label: '山顶 · 海拔高',
      labelX: 100,
      labelY: 258,
      anchor: 'end',
      mark: true,
      tail,
      path: `M ${tail.x.toFixed(2)} ${tail.y.toFixed(2)} L ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`,
      head: arrowHead(tip.x, tip.y, tangent, 12),
    }
  })(),
]

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 参数一动，图和讲解一起变，不会出现「图上 66.5°、文字写着 65°」。
 */
const explains = computed(() => {
  const circumference = equatorCircumferenceKm()
  const vars = {
    radiusKm: String(EARTH_RADIUS_KM),
    circumference: `${Math.round(circumference)} km`,
    speedFromCirc: `${Math.round(speedFromCircumference(circumference))} km/h`,
    speed0: `${SPEED_BY_LAT[0]} km/h`,
    speed0Num: String(SPEED_BY_LAT[0]),
    speed30: `${SPEED_BY_LAT[30]} km/h`,
    speed60: `${SPEED_BY_LAT[60]} km/h`,
    speed90: `${SPEED_BY_LAT[90]} km/h`,
    speed30Exact: linearSpeed(30).toFixed(1),
    speed60Exact: linearSpeed(60).toFixed(1),
    spinDeg: `${DEGREES_PER_HOUR}°/小时`,
    cos30: Math.cos((30 * Math.PI) / 180).toFixed(3),
    cos60: Math.cos((60 * Math.PI) / 180).toFixed(2),
    altitudePercent: `${altitudeSpeedGainPercent(30, 1, EARTH_RADIUS_KM).toFixed(3)}%`,
    altitudeRatio: radiusRatio(30, 1, EARTH_RADIUS_KM).toFixed(5),
  }

  return {
    track: {
      name: '纬线圈（跑道）',
      hint: '线速度取决于脚下这条纬线圈有多长：赤道最长，往两极越来越短。',
      vars,
      steps: [
        '侧视投影里，纬度 φ 的纬线圈是长度 2R·cosφ 的线段',
        `赤道 φ = 0：周长 = 2πR = 2 × 3.1416 × ${vars.radiusKm} ≈ ${vars.circumference}`,
        `北纬 30°：周长 = 赤道 × cos30° = 赤道 × ${vars.cos30}`,
        '极点 φ = 90°：cos90° = 0 ⇒ 跑道缩成一个点',
        `跑道短，速度当然慢——线速度 = 周长 ÷ 24 小时（赤道 ≈ ${vars.speedFromCirc}）`,
      ],
    },
    'pole-north': {
      name: '北极点',
      hint: '线速度为 0 的地方：它就在转轴上。',
      vars,
      steps: [
        '北极点到地轴的距离 = R·cos90° = 0',
        `线速度 v = ω·r ⇒ v = ${vars.speed90}`,
        `角速度却仍是 ${vars.spinDeg}——它只是原地转圈`,
        '所以「角速度处处相同」这句话要补一个例外：南北极点除外',
      ],
    },
    'pole-south': {
      name: '南极点',
      hint: '南极点也一样：到地轴的距离为零。',
      vars,
      steps: [
        '南极点到地轴的距离 = R·cos90° = 0',
        `线速度 v = ω·r ⇒ v = ${vars.speed90}`,
        '南北两个极点的线速度都是 0，但角速度仍是同一套',
      ],
    },
    'lat-circle': {
      name: '纬线圈（俯视）',
      hint: '同心圆就是纬线圈：半径 = R·cosφ，赤道最大、极点为 0。',
      vars,
      steps: [
        '极点俯视时，一条条纬线圈投影成同心圆',
        '纬度 φ 的纬线圈半径 = R·cosφ',
        '赤道 φ = 0 ⇒ 半径 = R（最大的一圈）',
        `北纬 60° ⇒ cos60° = ${vars.cos60} ⇒ 半径只剩一半`,
        '半径就是「到地轴的距离」，它决定了线速度的大小',
      ],
    },
    'arrow-equator': {
      name: '赤道上的速度箭头',
      hint: '最长的一支箭头：一小时走过的距离最长。',
      vars,
      steps: [
        '箭头长度 ∝ 线速度，不是手调的',
        `赤道：周长 ${vars.circumference} ÷ 24 小时 = ${vars.speedFromCirc}`,
        `同一小时里转过的角度都是 ${vars.spinDeg}，但赤道走过的弧长最长`,
        '所以赤道上的人一小时跑得最远',
      ],
    },
    'arrow-30': {
      name: '北纬 30° 的速度箭头',
      hint: '同一小时里比赤道短一截——因为跑道短了。',
      vars,
      steps: [
        '纬度 φ 的线速度 = 赤道线速度 × cosφ',
        `30°：v = ${vars.speed0Num} × cos30° = ${vars.speed30Exact} ≈ ${vars.speed30}`,
        `跑道长度也是赤道的 ${vars.cos30} 倍，与线速度是同一个比例`,
        '所以 30° 的箭头比赤道的短一截，两者比值就是 cos30°',
      ],
    },
    'arrow-60': {
      name: '北纬 60° 的速度箭头',
      hint: '只有赤道的一半长。',
      vars,
      steps: [
        `v = ${vars.speed0Num} × cos60° = ${vars.speed60Exact} ≈ ${vars.speed60}`,
        `cos60° = ${vars.cos60} ⇒ 跑道和速度都只剩一半`,
        `推到底：极点 cos90° = 0 ⇒ ${vars.speed90}`,
      ],
    },
    sector: {
      name: '一小时转过的角度',
      hint: '各纬线转过的角度一样，走过的弧长不一样。',
      vars,
      steps: [
        `同一个小时里，各纬线都转过 ${vars.spinDeg}——角速度处处相同`,
        '弧长 = 半径 × 圆心角（弧度）',
        '半径 = R·cosφ ⇒ 弧长也 ∝ cosφ',
        '赤道的弧最长、极点的弧为 0：慢的是线速度，不是角速度',
      ],
    },
    hill: {
      name: '海拔更高的一圈',
      hint: '同一条纬线上，海拔越高离地轴越远。',
      vars,
      steps: [
        '线速度公式里的 R 是「到地轴的距离」，不是到地心的距离',
        '到地轴的距离 = (R + h)·cosφ',
        `海拔每升高 1 km，这个距离约增大 ${vars.altitudePercent}`,
        '所以同一条纬线上，山顶跑得比山脚快',
      ],
    },
    'hill-runner': {
      name: '山顶与山脚的箭头',
      hint: '两支箭头比的是同一个纬线上的两个高度。',
      vars,
      steps: [
        '山脚半径 = R·cos30°，山顶半径 = (R + h)·cos30°',
        `线速度之比 = (R + h) ÷ R = ${vars.altitudeRatio}`,
        `实际差别极小：每升高 1 km 约大 ${vars.altitudePercent}——图上已放大`,
        '判断题要答「海拔高」，不是「地形复杂」',
      ],
    },
  }
})
</script>

<style scoped>
/* 只用共享层的变量，不新增色值 */
.demo__hill {
  fill: none;
  stroke: var(--learn-ink-soft);
  stroke-width: 1.6;
  stroke-linejoin: round;
}
</style>
