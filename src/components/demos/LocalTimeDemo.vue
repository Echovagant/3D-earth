<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 地球 + 太阳光 + 晨昏线 -->
      <g v-show="step === 0" class="demo__frame">
        <circle class="demo__sun" data-explain="sun" cx="58" cy="190" r="26" />
        <g class="demo__ray">
          <path v-for="y in [120, 155, 190, 225, 260]" :key="y" :d="`M 96 ${y} L 300 ${y}`" />
        </g>
        <circle class="demo__globe-night" cx="360" cy="190" r="118" />
        <path class="demo__globe-day" :d="leftHalfPath(360, 190, 118)" />
        <path class="demo__terminator" data-explain="terminator" d="M 360 72 L 360 308" />
        <text class="demo__label" x="58" y="238" text-anchor="middle">太阳</text>
        <text class="demo__label" x="292" y="344" text-anchor="middle">昼半球</text>
        <text class="demo__label" x="432" y="344" text-anchor="middle">夜半球</text>
        <path class="demo__leader" d="M 366 96 L 470 78 L 536 78" />
        <text class="demo__label demo__label--mark" x="542" y="82">晨昏线</text>

        <!-- 正对太阳的那条经线 = 正午经线；背面那条 = 0 时 -->
        <circle class="demo__cut" data-explain="noon-meridian" cx="242" cy="190" r="6" />
        <path class="demo__leader" d="M 236 184 L 176 140 L 96 140" />
        <text class="demo__label demo__label--mark" x="90" y="134">正午经线 · 12 时</text>
        <circle class="demo__cut" data-explain="midnight-meridian" cx="478" cy="190" r="6" />
        <path class="demo__leader" d="M 484 196 L 530 250 L 582 250" />
        <text class="demo__label demo__label--faint" x="700" y="254" text-anchor="end">
          0 时经线（在背面）
        </text>

        <text class="demo__caption-line" x="360" y="372" text-anchor="middle">
          地球不发光也不透明，太阳只照亮对着它的那一半——分界线就是晨昏线
        </text>
      </g>

      <!-- ② 北极上方俯视：四个关键读数 -->
      <g v-show="step === 1" class="demo__frame">
        <path class="demo__globe-night" :d="nightHalf" />
        <path class="demo__globe-day" :d="dayHalf" />
        <path class="demo__terminator" :d="terminatorLine" />

        <!-- 四条特殊经线 -->
        <g class="demo__grid" data-explain="meridians">
          <path v-for="m in meridians" :key="m.label" :d="m.ray" />
        </g>

        <g v-for="m in meridians" :key="`t${m.label}`">
          <text class="demo__label demo__label--mark" :x="m.x" :y="m.y" :text-anchor="m.anchor">
            {{ m.label }}
          </text>
          <text class="demo__label demo__label--faint" :x="m.x" :y="m.noteY" :text-anchor="m.anchor">
            {{ m.note }}
          </text>
        </g>

        <text class="demo__caption-line" x="360" y="368" text-anchor="middle">
          北极上方俯视（逆时针自转）：顺着自转方向，晨线→正午→昏线→0 时
        </text>
      </g>

      <!-- ③ 几个地点的地方时：越往东读数越大 -->
      <g v-show="step === 2" class="demo__frame">
        <path class="demo__globe-night" :d="nightHalf" />
        <path class="demo__globe-day" :d="dayHalf" />
        <path class="demo__terminator" :d="terminatorLine" />

        <g v-for="p in places" :key="p.label" data-explain="place">
          <circle class="demo__cut" :cx="p.x" :cy="p.y" r="5" />
          <text class="demo__label demo__label--mark" :x="p.x" :y="p.y - 12" text-anchor="middle">
            {{ p.label }}
          </text>
        </g>

        <path class="demo__spin" data-explain="east-arrow" :d="eastArc.path" />
        <path class="demo__spin-head" :d="eastArc.head" />
        <text class="demo__label demo__label--faint" x="300" y="338" text-anchor="middle">
          往东（逆时针）→ 地方时读数越来越大
        </text>

        <text class="demo__caption-line" x="360" y="368" text-anchor="middle">
          地方时只跟经度有关，与纬度无关；越靠东，读数越大
        </text>
      </g>

      <!-- ④ 东先西后：不是早晚，是先后 -->
      <g v-show="step === 3" class="demo__frame">
        <g v-for="c in clocks" :key="c.label" :data-explain="c.explainId">
          <circle class="demo__globe-plain" :cx="c.cx" :cy="c.cy" :r="c.r" />
          <g class="demo__grid">
            <path v-for="t in c.ticks" :key="t.id" :d="`M ${t.x1} ${t.y1} L ${t.x2} ${t.y2}`" />
          </g>
          <path class="demo__spin" :d="c.hourHand" />
          <path class="demo__spin" :d="c.minuteHand" />
          <circle class="demo__cut" :cx="c.cx" :cy="c.cy" r="3" />
          <text class="demo__label demo__label--mark" :x="c.cx" :y="c.cy + c.r + 24" text-anchor="middle">
            {{ c.label }}
          </text>
        </g>

        <text class="demo__label demo__label--faint" x="245" y="96" text-anchor="middle">
          同一时刻，两地的钟面就差这一小时
        </text>

        <text class="demo__label demo__label--mark" x="440" y="112">同一地点：先过 7 点，再过 8 点</text>
        <path class="demo__curve" data-explain="timeline" :d="timeline.path" />
        <path class="demo__spin-head" :d="timeline.head" />
        <g class="demo__grid">
          <path v-for="t in timeline.ticks" :key="t.label" :d="t.path" />
        </g>
        <text
          v-for="t in timeline.ticks"
          :key="`tl${t.label}`"
          class="demo__label demo__label--faint"
          :x="t.x"
          y="192"
          text-anchor="middle"
        >
          {{ t.label }}
        </text>

        <text class="demo__label demo__label--mark" x="440" y="234">「先后」不是「早晚」</text>
        <text class="demo__label demo__label--faint" x="440" y="256">
          东边先到 8 点，西边才 7 点——东先西后
        </text>
        <text class="demo__label demo__label--faint" x="440" y="276">
          同一地点的时间只会往前，不会倒退
        </text>

        <text class="demo__caption-line" x="360" y="352" text-anchor="middle">
          地方时 = 某一地方相对太阳的位置：正午 12 时、昏线 18 时、晨线 6 时、背面 0 时
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §3.12 地方时：概念与「东先西后」。
 *
 * 讲义的关键：「地方时 = 某一地方相对太阳的位置」，正午经线 12 时、昏线 18 时、
 * 晨线 6 时、背面的 0 时经线 0 时；两条铁律是不同经线时间不同、同一经线时间相同；
 * 「东先西后」指的是**谁先到达下一天 / 谁先看到太阳**，不是生活里的「早晚」。
 *
 * 四步：
 *   ① 地球 + 太阳光 + 晨昏线（正午经线与 0 时经线在哪）
 *   ② 北极上方俯视：四个关键读数
 *   ③ 几个地点的地方时：越往东读数越大
 *   ④ 东先西后：钟面比较 + 同一地点必然先过 7 点再过 8 点
 *
 * 读数全部由 localHour 算出（terminatorGeometry.js），极点俯视的方位角与经度的
 * 对应关系见 localTimeGeometry.js。
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { arrowHead, leftHalfPath, polarToXY } from '../../data/svgParts'
import { SUBSOLAR_LON } from '../../data/terminatorGeometry'
import {
  DEGREES_PER_HOUR,
  clockHandAngles,
  hourAtAngle,
  hoursForLonDiff,
  longitudeAtAngle,
  minutesPerDegree,
  normalizeDeg,
  specialMeridians,
} from '../../data/localTimeGeometry'

const steps = [
  {
    id: 'globe',
    title: '① 地方时 = 相对太阳的位置',
    text: '地方时不是钟表上的时间，而是「某一地方相对太阳的位置」。太阳正对的那条经线是 12 时，太阳背对的那条（在球的背面）是 0 时；晨昏线把它们分开——晨线 6 时、昏线 18 时。',
  },
  {
    id: 'key-readings',
    title: '② 四个关键读数',
    text: '从北极点上方俯视最容易读：正午经线在下面（12 时），逆时针转 90° 是昏线（18 时），再转 90° 是背面的 0 时经线（0 时），再转 90° 是晨线（6 时）。同一个瞬间，全世界的读数就是这样排开的。',
  },
  {
    id: 'east-first',
    title: '③ 越往东，读数越大',
    text: '顺着自转方向（北极上方看是逆时针）就是往东，地方时读数一路变大：东边先过 8 点，西边才 7 点。地方时只用经度算，与纬度没有关系。',
  },
  {
    id: 'order',
    title: '④ 「东先西后」是先后，不是早晚',
    text: '地理里的「先后」指谁先到达下一天、谁先看到太阳，不是生活里的「早晚」——东边的钟面读数大，是因为它先走到了下一个钟点。同一地点的时间只会往前：必然先过 7 点，再过 8 点。',
  },
]

/** ②③ 极点俯视 */
const view = { cx: 300, cy: 190, r: 108 }

/** 昼半球（朝太阳的一侧，俯视时是下半球）、夜半球（上半球） */
const dayHalf = `M ${view.cx - view.r} ${view.cy} A ${view.r} ${view.r} 0 0 0 ${view.cx + view.r} ${view.cy} Z`
const nightHalf = `M ${view.cx + view.r} ${view.cy} A ${view.r} ${view.r} 0 0 0 ${view.cx - view.r} ${view.cy} Z`
const terminatorLine = `M ${view.cx - view.r} ${view.cy} L ${view.cx + view.r} ${view.cy}`

/** 四条特殊经线：正午经线在正下方，逆时针依次 18 时 → 0 时 → 6 时 */
const NOON_ANGLE = 270
const meridians = specialMeridians(SUBSOLAR_LON).map((m) => {
  const angle = normalizeDeg(NOON_ANGLE + (m.lon - SUBSOLAR_LON))
  const tip = polarToXY(view.cx, view.cy, view.r, angle)
  const spot = {
    0: { x: view.cx + view.r + 12, y: view.cy + 4, anchor: 'start', noteY: view.cy + 22 },
    90: { x: view.cx, y: view.cy - view.r - 26, anchor: 'middle', noteY: view.cy - view.r - 10 },
    180: { x: view.cx - view.r - 12, y: view.cy + 4, anchor: 'end', noteY: view.cy + 22 },
    270: { x: view.cx, y: view.cy + view.r + 22, anchor: 'middle', noteY: view.cy + view.r + 38 },
  }[angle]
  return {
    label: m.label,
    note: m.note,
    angle,
    ...spot,
    ray: `M ${view.cx} ${view.cy} L ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`,
  }
})

/** ③ 三个地点：沿正午经线两侧往东摆，读数依次变大 */
const places = [240, 270, 300].map((angle) => {
  const p = polarToXY(view.cx, view.cy, view.r, angle)
  const lon = longitudeAtAngle(angle, SUBSOLAR_LON)
  return {
    angle,
    x: p.x,
    y: p.y,
    lon,
    hour: Math.round(hourAtAngle(angle, SUBSOLAR_LON)),
    label: `${Math.round(hourAtAngle(angle, SUBSOLAR_LON))} 时`,
  }
})

/** 往东的箭头：沿圆周逆时针 */
const eastArc = (() => {
  const from = 232
  const to = 308
  const radius = view.r + 22
  const a = polarToXY(view.cx, view.cy, radius, from)
  const b = polarToXY(view.cx, view.cy, radius, to)
  return {
    path: `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${radius} ${radius} 0 0 0 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`,
    head: arrowHead(b.x, b.y, to + 90, 13),
  }
})()

/** ④ 两个钟面：同一时刻，东边 8 时、西边 7 时 */
function buildClock(cx, cy, r, hour, label, explainId) {
  const a = clockHandAngles(hour)
  const hTip = polarToXY(cx, cy, r * 0.5, a.hour)
  const mTip = polarToXY(cx, cy, r * 0.78, a.minute)
  const ticks = [0, 90, 180, 270].map((deg) => {
    const p1 = polarToXY(cx, cy, r * 0.86, deg)
    const p2 = polarToXY(cx, cy, r * 0.96, deg)
    return {
      id: deg,
      x1: p1.x.toFixed(2),
      y1: p1.y.toFixed(2),
      x2: p2.x.toFixed(2),
      y2: p2.y.toFixed(2),
    }
  })
  return {
    cx,
    cy,
    r,
    label,
    hour,
    explainId,
    hourHand: `M ${cx} ${cy} L ${hTip.x.toFixed(2)} ${hTip.y.toFixed(2)}`,
    minuteHand: `M ${cx} ${cy} L ${mTip.x.toFixed(2)} ${mTip.y.toFixed(2)}`,
    ticks,
  }
}

/** 两个钟面的读数：东边先到 8 点，西边才 7 点 */
const EAST_CLOCK_HOUR = 8
const WEST_CLOCK_HOUR = 7

const clocks = [
  buildClock(160, 175, 52, EAST_CLOCK_HOUR, '东边 · 8 时', 'clock-east'),
  buildClock(340, 175, 52, WEST_CLOCK_HOUR, '西边 · 7 时', 'clock-west'),
]

/** ④ 同一地点的时间轴：只能一路往前 */
const timeline = (() => {
  const x1 = 444
  const x2 = 692
  const y = 162
  const ticks = [
    { label: '6 时', x: 452 },
    { label: '7 时', x: 532 },
    { label: '8 时', x: 612 },
    { label: '9 时', x: 686 },
  ].map((t) => ({ ...t, path: `M ${t.x} ${y - 8} L ${t.x} ${y + 8}` }))
  return { path: `M ${x1} ${y} L ${x2} ${y}`, head: arrowHead(x2, y, 0, 12), ticks }
})()

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 参数一动，图和讲解一起变，不会出现「图上 66.5°、文字写着 65°」。
 */
const explains = computed(() => {
  const noonLon = longitudeAtAngle(270, SUBSOLAR_LON)
  const midnightLon = longitudeAtAngle(90, SUBSOLAR_LON)
  const dawnLon = longitudeAtAngle(180, SUBSOLAR_LON)
  const duskLon = longitudeAtAngle(0, SUBSOLAR_LON)
  /** 经度的写法：东经 90° 记作 90°E；0° 与 180° 单独说 */
  const lonText = (lon) => {
    if (Math.abs(lon) === 180) return '180°'
    if (lon === 0) return '0°'
    return `${Math.abs(lon)}°${lon > 0 ? 'E' : 'W'}`
  }
  const clockDiffHours = EAST_CLOCK_HOUR - WEST_CLOCK_HOUR
  const clockDiffDeg = clockDiffHours * DEGREES_PER_HOUR

  const vars = {
    spinDeg: `${DEGREES_PER_HOUR}°/小时`,
    minutesPerDeg: `${minutesPerDegree()} 分钟`,
    hoursPer90: `${hoursForLonDiff(90)} 小时`,
    hoursPer180: `${hoursForLonDiff(180)} 小时`,
    noonLon: lonText(noonLon),
    midnightLon: lonText(midnightLon),
    dawnLon: lonText(dawnLon),
    duskLon: lonText(duskLon),
    placeA: `${lonText(places[0].lon)} → ${places[0].hour} 时`,
    placeB: `${lonText(places[1].lon)} → ${places[1].hour} 时`,
    placeC: `${lonText(places[2].lon)} → ${places[2].hour} 时`,
    eastHour: `${EAST_CLOCK_HOUR} 时`,
    westHour: `${WEST_CLOCK_HOUR} 时`,
    clockDiffHours: `${clockDiffHours} 小时`,
    clockDiffDeg: `${clockDiffDeg}°`,
  }

  return {
    sun: {
      name: '太阳',
      hint: '地方时是「相对太阳的位置」——太阳的位置定了，所有经线的时间都定了。',
      vars,
      steps: [
        '地方时 = 某一地方相对太阳的位置',
        '太阳正对的那条经线，地方时是 12 时',
        '太阳背对的那条（在球的背面），地方时是 0 时',
        `地球 24 小时转 360° ⇒ 每小时 ${DEGREES_PER_HOUR}°，经度每差 1° 差 ${minutesPerDegree()} 分钟`,
      ],
    },
    terminator: {
      name: '晨昏线',
      hint: '把地球分成昼半球与夜半球的那条大圆：晨线 6 时、昏线 18 时。',
      vars,
      steps: [
        '地球不发光也不透明，太阳只照亮对着它的那一半',
        '分界线就是晨昏线，它过球心 ⇒ 是一个大圆',
        '顺着自转方向，由黑夜进入白昼的那段是晨线 ⇒ 6 时',
        '由白昼进入黑夜的那段是昏线 ⇒ 18 时',
      ],
    },
    'noon-meridian': {
      name: '正午经线（12 时）',
      hint: '正对太阳的那条经线，地方时 12 时。',
      vars,
      steps: [
        '正对太阳的那一点太阳高度最高 ⇒ 当地正午',
        '这条经线叫正午经线，地方时 = 12 时',
        `图上正午经线在 ${vars.noonLon}`,
        `它与背面的 0 时经线相差 180° ⇒ 相差 ${vars.hoursPer180}`,
      ],
    },
    'midnight-meridian': {
      name: '0 时经线（在背面）',
      hint: '太阳背对的那条经线，地方时 0 时。',
      vars,
      steps: [
        '太阳背对的那条经线是夜半球的正中 ⇒ 当地午夜',
        '这条经线叫子夜经线，地方时 = 0 时',
        `图上 0 时经线在 ${vars.midnightLon}`,
        `它与正午经线相对 ⇒ 相差 180° = ${vars.hoursPer180}`,
      ],
    },
    meridians: {
      name: '四条特殊经线',
      hint: '同一个瞬间，全世界的读数就是这样排开的。',
      vars,
      steps: [
        `正午经线 12 时（${vars.noonLon}）`,
        `往东 90° 是昏线 18 时（${vars.duskLon}）`,
        `再往东 90° 是背面的 0 时经线（${vars.midnightLon}）`,
        `再往东 90° 是晨线 6 时（${vars.dawnLon}）`,
        `每一步都转过 90° = ${vars.hoursPer90}`,
      ],
    },
    place: {
      name: '地点的地方时',
      hint: '三个地点的读数：往东一个一个变大。',
      vars,
      steps: [
        '读数只跟经度有关，与纬度无关',
        `由俯视图的方位角反推经度：${vars.placeA}`,
        `${vars.placeB}；${vars.placeC}`,
        '越往东读数越大——这就是「东先西后」',
      ],
    },
    'east-arrow': {
      name: '往东的箭头',
      hint: '顺着自转方向就是往东，地方时读数一路变大。',
      vars,
      steps: [
        '北极上方俯视：逆时针 = 自西向东 = 经度增大',
        `经度每增大 1°，地方时增大 ${vars.minutesPerDeg}`,
        '所以顺着箭头走，读数一直变大',
        '「东先西后」指谁先到达下一天、谁先看到太阳，不是生活里的早晚',
      ],
    },
    'clock-east': {
      name: '东边的钟面（8 时）',
      hint: '同一时刻，东边的钟面读数大。',
      vars,
      steps: [
        `两地经度差对应 ${vars.clockDiffHours}，经度差 = ${vars.clockDiffDeg}`,
        '东边在东 ⇒ 读数大：8 时',
        '东边先到达 8 点，西边这时才 7 点',
        '所以这是「先后」，不是「早晚」',
      ],
    },
    'clock-west': {
      name: '西边的钟面（7 时）',
      hint: '西边的钟面读数小，因为它还没转到下一个钟点。',
      vars,
      steps: [
        '西边在西 ⇒ 读数小：7 时',
        `与东边相差 ${vars.clockDiffDeg} = ${vars.clockDiffHours}`,
        '同一地点的时间只会往前：必然先过 7 点，再过 8 点',
        '同一经线上时间相同、不同经线上时间不同——地方时的两条铁律',
      ],
    },
    timeline: {
      name: '同一地点的时间轴',
      hint: '同一个地点，钟点只会一个一个往前推。',
      vars,
      steps: [
        `时间轴从 6 时推到 9 时，只往一个方向，每格 1 小时 = ${DEGREES_PER_HOUR}°`,
        '地方时按经度算，同一经线上时间相同',
        '「东先西后」说的是东西两地的先后，不是同一地点的时间会倒退',
        '东边的 8 时与西边的 7 时是同一瞬间',
      ],
    },
  }
})
</script>
