<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- ① 一半亮，一半暗 -->
      <g v-show="step === 0" class="demo__frame">
        <circle class="demo__sun" cx="58" cy="190" r="26" />
        <g class="demo__ray">
          <path v-for="y in [120, 155, 190, 225, 260]" :key="y" :d="`M 96 ${y} L 300 ${y}`" />
        </g>
        <circle class="demo__globe-night" cx="360" cy="190" r="118" />
        <path class="demo__globe-day" :d="leftHalf(360, 190, 118)" />
        <!-- 晨昏线：太阳在画面内，这条线永远投影成一条过球心的竖线 -->
        <path class="demo__terminator" d="M 360 72 L 360 308" />
        <!-- 地轴：随 δ 倾斜，北极朝太阳那一侧 -->
        <path class="demo-axis" :d="axisPath" />
        <!-- 赤道：与地轴垂直、过球心。没有它，直射点为什么在 23.5°N 看不出来 -->
        <path class="demo-equator" :d="equatorPath" />
        <text class="demo__label demo__label--faint" :x="equatorTip.x" :y="equatorTip.y" :text-anchor="equatorTip.anchor">
          赤道
        </text>
        <text class="demo__label" :x="poleNorth.x - 6" :y="poleNorth.y - 2" text-anchor="end">
          北极
        </text>
        <text class="demo__label" :x="poleSouth.x + 6" :y="poleSouth.y + 4" text-anchor="start">
          南极
        </text>
        <!-- 直射点：球的左轮廓，那一点正对太阳 -->
        <circle class="demo-subsolar" :cx="subsolar.x" :cy="subsolar.y" r="5.5" />
        <path
          class="demo__leader"
          :d="`M ${subsolar.x} ${subsolar.y} L ${subsolar.x - 8} ${subsolar.y - 12}`"
        />
        <text
          class="demo__label demo__label--mark"
          :x="subsolar.x - 12"
          :y="subsolar.y - 16"
          text-anchor="end"
        >
          太阳直射点 {{ latText }}
        </text>
        <text class="demo__label" x="58" y="236" text-anchor="middle">太阳</text>
        <text class="demo__label" x="300" y="356" text-anchor="middle">昼半球</text>
        <text class="demo__label" x="424" y="356" text-anchor="middle">夜半球</text>
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
        <path class="demo__globe-day" :d="leftHalf(400, 200, 118)" />
        <path class="demo__terminator" d="M 400 82 L 400 318" />
        <!-- 自转方向：北极上方看是逆时针，上方那圈箭头指向左 -->
        <path class="demo__spin" d="M 486 74 Q 400 18 314 74" />
        <path class="demo__spin-head" :d="arrowHead(314, 74, 200, 14)" />
        <text class="demo__label" x="400" y="42" text-anchor="middle">自转方向（逆时针）</text>
        <text class="demo__label demo__label--mark" x="524" y="142">晨线</text>
        <text class="demo__label demo__label--faint" x="524" y="164">由黑到白 · 正在日出</text>
        <text class="demo__label demo__label--mark" x="524" y="264">昏线</text>
        <text class="demo__label demo__label--faint" x="524" y="286">由白到黑 · 正在日落</text>
        <path class="demo__leader" d="M 518 134 L 406 122" />
        <path class="demo__leader" d="M 518 256 L 406 278" />
      </g>

      <!-- ④ 晨昏线与极圈的切点：圆柱投影，横轴是经度，括注是该经线的地方时 -->
      <g v-show="step === 3" class="demo__frame">
        <g class="demo__grid">
          <path v-for="l in latitudeLines" :key="`lat${l.lat}`" :d="`M 90 ${l.y} L 690 ${l.y}`" />
          <path v-for="x in longitudeLines" :key="`lon${x}`" :d="`M ${x} 40 L ${x} 330`" />
        </g>
        <path v-for="(piece, i) in terminatorPieces" :key="`term${i}`" class="demo__curve" :d="piece" />
        <circle class="demo__cut" :cx="cutA.x" :cy="cutA.y" r="7" />
        <circle class="demo__cut" :cx="cutB.x" :cy="cutB.y" r="7" />
        <text
          class="demo__label demo__label--mark"
          :x="cutA.x"
          :y="cutA.y + cutOffset.a.label"
          text-anchor="middle"
        >
          切点 A · 0 时
        </text>
        <text class="demo__label demo__label--mark" :x="cutB.x" :y="cutB.y + cutOffset.b.label">
          切点 B · 12 时
        </text>
        <text
          class="demo__label demo__label--faint"
          :x="cutA.x"
          :y="cutA.y + cutOffset.a.lat"
          text-anchor="middle"
        >
          {{ cutALatText }}
        </text>
        <text
          class="demo__label demo__label--faint"
          :x="cutB.x"
          :y="cutB.y + cutOffset.b.lat"
          text-anchor="middle"
        >
          {{ cutBLatText }}
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
    </template>

    <!-- 参数轴：太阳直射点纬度，四步都能拖 -->
    <template #controls>
      <DemoSlider
        v-model="delta"
        label="太阳直射点纬度 δ"
        :min="-23.5"
        :max="23.5"
        :step="0.5"
        :format="formatDelta"
      />
    </template>
  </DemoShell>
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
 *   ④ 切点 —— 圆柱投影，晨昏线与极圈相切的地方
 *
 * 图形全部自绘（讲义本身没有图），几何一律交给
 * src/data/terminatorGeometry.js 去算——参数轴一动，图形重算，
 * 解说文案也跟着改，不会出现「图和话对不上」。
 */
import { computed, ref } from 'vue'
import DemoShell from '../DemoShell.vue'
import DemoSlider from '../DemoSlider.vue'
import {
  SUBSOLAR_LON,
  axisDirection,
  tangentLatitudes,
  terminatorPolylines,
} from '../../data/terminatorGeometry'
import { arrowHead, cylinderProjection, leftHalfPath } from '../../data/svgParts'

/** 太阳直射点纬度：默认夏至日（北回归线），拖动它看整幅图怎么变 */
const delta = ref(23.5)

/** 参数轴读数 */
const formatDelta = (value) => {
  const v = Number(value)
  if (Math.abs(v - 23.5) < 0.01) return '23.5°N · 夏至日'
  if (Math.abs(v + 23.5) < 0.01) return '23.5°S · 冬至日'
  if (Math.abs(v) < 0.01) return '0° · 春分/秋分（昼夜等长）'
  const num = Number(Math.abs(v).toFixed(1))
  return `${num}°${v > 0 ? 'N' : 'S'}`
}

/** 纬度的写法：23.5°N / 0° / 66.5°S */
const formatLat = (lat) => {
  if (Math.abs(lat) < 0.01) return '0°'
  const num = Number(Math.abs(lat).toFixed(1))
  return `${num}°${lat > 0 ? 'N' : 'S'}`
}

const latText = computed(() => {
  if (Math.abs(delta.value) < 0.01) return '0°（赤道）'
  return formatLat(delta.value)
})

const leftHalf = leftHalfPath

/** ② 三个视图：侧视、极地俯视、平面展开 */
const threeViews = computed(() =>
  [
    { x: 130, title: '侧视图' },
    { x: 360, title: '极地俯视' },
    { x: 590, title: '平面展开' },
  ].map((s) => ({ ...s, linePath: `M ${s.x} 74 L ${s.x} 226` })),
)

/** ① 侧视图里的球 */
const GLOBE = { cx: 360, cy: 190, r: 118 }
/** 地轴伸出球面的长度 */
const AXIS_LEN = GLOBE.r + 26

/** 地轴：δ > 0 时北极朝左倾，正对太阳那一侧 */
const axis = computed(() => axisDirection(delta.value))

const axisPath = computed(() => {
  const a = axis.value
  const north = { x: GLOBE.cx + a.x * AXIS_LEN, y: GLOBE.cy + a.y * AXIS_LEN }
  const south = { x: GLOBE.cx - a.x * AXIS_LEN, y: GLOBE.cy - a.y * AXIS_LEN }
  return `M ${north.x.toFixed(2)} ${north.y.toFixed(2)} L ${south.x.toFixed(2)} ${south.y.toFixed(2)}`
})

const poleNorth = computed(() => {
  const a = axis.value
  return { x: GLOBE.cx + a.x * AXIS_LEN, y: GLOBE.cy + a.y * AXIS_LEN }
})

const poleSouth = computed(() => {
  const a = axis.value
  return { x: GLOBE.cx - a.x * AXIS_LEN, y: GLOBE.cy - a.y * AXIS_LEN }
})

/** 直射点：太阳在左边，正对太阳的那一点落在球的左轮廓上 */
const subsolar = computed(() => ({ x: GLOBE.cx - GLOBE.r, y: GLOBE.cy }))

/**
 * 赤道：过球心、与地轴垂直的那条大圆，在侧视投影里就是一条过球心的线段。
 *
 * 画它是为了让「直射点在 23.5°N」看得懂——直射点落���球的最左端，
 * 而最左端相对倾斜地轴的纬度是 δ，学生只有在赤道这条线旁边才量得出这个角。
 */
const equator = computed(() => {
  const d = (delta.value * Math.PI) / 180
  // 与地轴垂直的方向
  const u = { x: Math.cos(d), y: -Math.sin(d) }
  const half = GLOBE.r
  return {
    d: `M ${(GLOBE.cx - u.x * half).toFixed(2)} ${(GLOBE.cy - u.y * half).toFixed(2)} L ${(GLOBE.cx + u.x * half).toFixed(2)} ${(GLOBE.cy + u.y * half).toFixed(2)}`,
    tip: {
      x: GLOBE.cx + u.x * half,
      y: GLOBE.cy + u.y * half,
      anchor: u.x >= 0 ? 'end' : 'start',
    },
  }
})
const equatorPath = computed(() => equator.value.d)
const equatorTip = computed(() => ({
  x: equator.value.tip.x + (equator.value.tip.anchor === 'end' ? -6 : 6),
  y: equator.value.tip.y + 14,
  anchor: equator.value.tip.anchor,
}))

/** ④ 圆柱投影：横轴经度、纵轴纬度 */
const PLOT = { left: 90, right: 690, top: 40, bottom: 330 }
const project = cylinderProjection(PLOT)

/**
 * 晨昏线：按纬度采样解出经度，跨反子午线处断开，
 * 每一段单独画，免得一条折线横穿整张图。
 */
const terminatorPieces = computed(() =>
  terminatorPolylines(delta.value).map((piece) =>
    piece
      .map(
        (p, i) =>
          `${i === 0 ? 'M' : 'L'} ${project.x(p.lon).toFixed(2)} ${project.y(p.lat).toFixed(2)}`,
      )
      .join(' '),
  ),
)

const longitudeLines = computed(() => {
  const xs = []
  for (let lon = -180; lon <= 180; lon += 30) xs.push(Number(project.x(lon).toFixed(2)))
  return xs
})

const latitudeLines = computed(() =>
  [90, 66.5, 23.5, 0, -23.5, -66.5, -90].map((lat) => ({ lat, y: Number(project.y(lat).toFixed(2)) })),
)

const latitudeLabels = computed(() =>
  [
    { lat: 90, label: '90°N' },
    { lat: 66.5, label: '北极圈' },
    { lat: 0, label: '赤道' },
    { lat: -66.5, label: '南极圈' },
    { lat: -90, label: '90°S' },
  ].map((l) => ({ ...l, y: Number(project.y(l.lat).toFixed(2)) })),
)

/** 四条特殊经线：地方时 0 / 6 / 12 / 18 时 */
const meridianMarks = computed(() =>
  [
    { lon: -90, label: '0 时' },
    { lon: 0, label: '6 时' },
    { lon: 90, label: '12 时' },
    { lon: 180, label: '18 时' },
  ].map((m) => ({ ...m, x: Number(project.x(m.lon).toFixed(2)) })),
)

/** 切点：A 在 0 时经线（子夜），B 在 12 时经线（正午） */
const cutA = computed(() => ({
  x: Number(project.x(-90).toFixed(2)),
  y: Number(project.y(tangentLatitudes(delta.value).a).toFixed(2)),
}))
const cutB = computed(() => ({
  x: Number(project.x(SUBSOLAR_LON).toFixed(2)),
  y: Number(project.y(tangentLatitudes(delta.value).b).toFixed(2)),
}))

const cutALatText = computed(() => formatLat(tangentLatitudes(delta.value).a))
const cutBLatText = computed(() => formatLat(tangentLatitudes(delta.value).b))

/**
 * 切点旁两行文字（切点名、纬度）放在切点的哪一侧。
 *
 * 晨昏线在切点处与纬线相切，走的是水平方向，文字压在曲线上就糊了——
 * 所以取远离曲线的那一侧：切点是最高点就往上放，是最低点就往下放。
 */
const cutOffset = computed(() => {
  const d = delta.value
  if (Math.abs(d) < 0.01) {
    // δ = 0 时切点落在两极，曲线是两条竖线，文字挑上下不贴边的方向放
    return { a: { label: 22, lat: 40 }, b: { label: -22, lat: -40 } }
  }
  return d > 0
    ? { a: { label: -22, lat: -40 }, b: { label: 22, lat: 40 } }
    : { a: { label: 22, lat: 40 }, b: { label: -22, lat: -40 } }
})

/** ① 的解说：直射点跟着 δ 走，地轴也跟着倾 */
const litText = computed(() => {
  const base =
    '地球不发光也不透明，太阳只照亮对着它的那一半。亮的那一半和黑的那一半之间那道缝，就是晨昏线。它过地球的球心——所以和赤道、20°W–160°E 的经线圈是同一类东西。'
  if (Math.abs(delta.value) < 0.01) {
    return `${base}现在太阳直射点在赤道，地轴不偏不倚，直射点就落在球面最左边那一点上。`
  }
  const tilt = delta.value > 0 ? '朝太阳这一边倾' : '朝背太阳的那一边倾'
  return `${base}现在太阳直射点在 ${latText.value}，地轴${tilt} ${Math.abs(delta.value).toFixed(1)}°——直射点永远落在正对太阳的那一点上，它的纬度正好是 δ。`
})

/** ④ 的解说：切点跟着 δ 走 */
const tangentText = computed(() => {
  const base = '把地球沿经线剪开铺平成圆柱图（横轴是经度，括注是该经线的地方时）。'
  const equator =
    '晨昏线与赤道的两个交点分别是 6 时（晨线）和 18 时（昏线），这两处永远在赤道上。'
  const d = delta.value
  const cuts = tangentLatitudes(d)
  if (Math.abs(d) < 0.01) {
    return `${base}直射点在赤道，晨昏线过两极，切点落在极点，此时没有极昼极夜。${equator}图上晨昏线正好是 6 时经线和 18 时经线两条竖线。`
  }
  if (Math.abs(Math.abs(d) - 23.5) < 0.01) {
    const season = d > 0 ? '夏至日，太阳直射北回归线' : '冬至日，太阳直射南回归线'
    const circleA = cuts.a > 0 ? '北极圈' : '南极圈'
    const circleB = cuts.b > 0 ? '北极圈' : '南极圈'
    return `${base}${season}。晨昏线与极圈相切的那一点就是切点：切点 A 在${circleA}，地方时 0 时；切点 B 在${circleB}，地方时 12 时。${equator}`
  }
  return `${base}晨昏线在 0 时经线上的最高点是 ${formatLat(cuts.a)}，在 12 时经线上的最低点是 ${formatLat(cuts.b)}。只有夏至和冬至（|δ| = 23.5°）晨昏线才正好与极圈相切，其余时候切点落在极圈与极点之间。${equator}`
})

const steps = computed(() => [
  {
    id: 'lit',
    title: '① 一半亮，一半暗',
    text: litText.value,
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
    title: '④ 晨昏线与极圈的切点',
    text: tangentText.value,
  },
])
</script>

<style scoped>
/* 地轴：侧视图里随 δ 倾斜 */
.demo-axis {
  fill: none;
  stroke: var(--learn-ink-soft);
  stroke-width: 1.8;
  stroke-dasharray: 8 6;
}

/* 直射点：正对太阳的那一点 */
.demo-subsolar {
  fill: var(--learn-accent);
  stroke: var(--learn-panel);
  stroke-width: 2;
}

/* 赤道：比地轴还次要，浅一点就行 */
.demo-equator {
  fill: none;
  stroke: var(--learn-ink-faint);
  stroke-width: 1.2;
  stroke-dasharray: 4 5;
}
</style>
