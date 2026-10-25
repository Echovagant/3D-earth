<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 找太阳直射点 ② 从直射点连到地心 -->
      <g v-show="step === 0" class="demo__frame">
        <circle class="demo__sun" data-explain="sun" cx="120" cy="195" r="24" />
        <g class="demo__ray" data-explain="rays">
          <path v-for="dy in [-45, -22, 0, 22, 45]" :key="dy" :d="`M 148 ${195 + dy} L 242 ${195 + dy}`" />
        </g>
        <text class="demo__label" x="120" y="244" text-anchor="middle">太阳</text>

        <circle class="demo__globe-plain" :cx="view.x" :cy="view.y" :r="view.r" />
        <path class="demo-axis" data-explain="axis" :d="axisLine" />
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

        <path class="demo__leader" data-explain="subsolar-line" :d="subsolarLine" />
        <circle class="demo__cut" data-explain="subsolar" :cx="subsolar.x" :cy="subsolar.y" r="8" />
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
        <circle class="demo__sun" data-explain="sun" cx="120" cy="195" r="24" />
        <g class="demo__ray" data-explain="rays">
          <path v-for="dy in [-45, -22, 0, 22, 45]" :key="dy" :d="`M 148 ${195 + dy} L 242 ${195 + dy}`" />
        </g>
        <text class="demo__label" x="120" y="244" text-anchor="middle">太阳</text>

        <circle class="demo__globe-plain" :cx="view.x" :cy="view.y" :r="view.r" />
        <path class="demo-axis" data-explain="axis" :d="axisLine" />

        <path class="demo__leader" data-explain="subsolar-line" :d="subsolarLine" />
        <circle class="demo__cut" data-explain="subsolar" :cx="subsolar.x" :cy="subsolar.y" r="8" />
        <circle class="demo__cut" :cx="view.x" :cy="view.y" r="4" />

        <path class="demo__terminator" data-explain="terminator" :d="terminator" />
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
        <circle class="demo__sun" data-explain="sun" cx="120" cy="195" r="24" />
        <g class="demo__ray" data-explain="rays">
          <path v-for="dy in [-45, -22, 0, 22, 45]" :key="dy" :d="`M 148 ${195 + dy} L 242 ${195 + dy}`" />
        </g>
        <text class="demo__label" x="120" y="244" text-anchor="middle">太阳</text>

        <circle class="demo__globe-night" data-explain="night" :cx="view.x" :cy="view.y" :r="view.r" />
        <path class="demo__globe-day" data-explain="day" :d="dayPath" />
        <path class="demo-axis" data-explain="axis" :d="axisLine" />
        <path class="demo__leader" data-explain="subsolar-line" :d="subsolarLine" />
        <circle class="demo__cut" data-explain="subsolar" :cx="subsolar.x" :cy="subsolar.y" r="8" />
        <path class="demo__terminator" data-explain="terminator" :d="terminator" />

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
        <circle class="demo__sun" data-explain="sun" cx="120" cy="195" r="24" />
        <g class="demo__ray" data-explain="rays">
          <path v-for="dy in [-45, -22, 0, 22, 45]" :key="dy" :d="`M 148 ${195 + dy} L 242 ${195 + dy}`" />
        </g>

        <circle class="demo__globe-night" data-explain="night" :cx="view.x" :cy="view.y" :r="view.r" />
        <path class="demo__globe-day" data-explain="day" :d="dayPath" />
        <!-- 极昼极夜的范围：δ = 0 时退化成极点上的一个点，图元留着不上色 -->
        <path :class="northCapClass" :d="northCap" data-explain="polar-north" />
        <path :class="southCapClass" :d="southCap" data-explain="polar-south" />
        <path class="demo-axis" data-explain="axis" :d="axisLine" />
        <path class="demo__leader" data-explain="subsolar-line" :d="subsolarLine" />
        <circle class="demo__cut" data-explain="subsolar" :cx="subsolar.x" :cy="subsolar.y" r="8" />
        <path class="demo__terminator" data-explain="terminator" :d="terminator" />

        <!-- 极圈与切点 -->
        <path class="demo-parallel" data-explain="polar-circle" :d="northPolarLine" />
        <path class="demo-parallel" data-explain="polar-circle" :d="southPolarLine" />
        <circle class="demo__cut" data-explain="cut-north" :cx="cutNorth.x" :cy="cutNorth.y" r="6" />
        <circle class="demo__cut" data-explain="cut-south" :cx="cutSouth.x" :cy="cutSouth.y" r="6" />

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

/**
 * 极昼极夜那一块上什么色。
 *
 * δ = 0 时没有极昼极夜：这一块退化成极点上的一个点，画出来也是空的，
 * 所以换成不上色的类。但图元还得留在图上——讲解层要指着它说明
 * 「现在没有极昼极夜」，不能连元素一起删掉。
 */
const northCapClass = computed(() => {
  if (!hasPolarCaps.value) return 'demo-cap-hidden'
  return daySide.value > 0 ? 'demo-cap demo-cap--day' : 'demo-cap demo-cap--night'
})
const southCapClass = computed(() => {
  if (!hasPolarCaps.value) return 'demo-cap-hidden'
  return daySide.value < 0 ? 'demo-cap demo-cap--day' : 'demo-cap demo-cap--night'
})

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
/** 推导里用的纬度写法：0° 单独说，免得公式里夹着「（赤道）」 */
const declText = computed(() => {
  const d = delta.value
  if (Math.abs(d) < 0.01) return '0°'
  return `${Math.abs(d).toFixed(1)}°${d > 0 ? 'N' : 'S'}`
})
/** 带符号的纬度：负数用减号，跟推导里的写法一致 */
const fmtLat = (value) => `${value < 0 ? '−' : ''}${Math.abs(value).toFixed(1)}°`
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

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 参数一动，图和讲解一起变，不会出现「图上 66.5°、文字写着 65°」。
 */
const explains = computed(() => {
  const d = delta.value
  const atEquinox = Math.abs(d) < 0.01
  const atSolstice = isSolstice.value
  const [cutNorthLat, cutSouthLat] = cutLatitudes(d)
  const side = polarDaySide(d)
  /** 北极那一块现在是极昼还是极夜：直射点在哪半球，哪一侧就是极昼 */
  const northIsDay = side > 0
  const southIsDay = side < 0

  const vars = {
    decl: declText.value,
    declAbs: `${Math.abs(d).toFixed(1)}°`,
    cutLat: fmtLat(cutNorthLat),
    cutLatSouth: fmtLat(cutSouthLat),
    polarCircle: fmtLat(POLAR_CIRCLE),
    polarCircleS: fmtLat(-POLAR_CIRCLE),
    tilt: fmtLat(DECL),
    tropicN: `${DECL.toFixed(1)}°N`,
    tropicS: `${DECL.toFixed(1)}°S`,
    axisAngle: fmtLat(90 - Math.abs(d)),
    cotDecl: atEquinox ? '∞' : (1 / Math.tan((d * Math.PI) / 180)).toFixed(2),
    northMeridian: d > 0 ? '子夜经线（当地 0 时）' : '正午经线（当地 12 时）',
    southMeridian: d > 0 ? '正午经线（当地 12 时）' : '子夜经线（当地 0 时）',
    northRegion: '北极一侧',
    southRegion: '南极一侧',
  }

  /** 极昼极夜那一块：名字跟着「现在是极昼还是极夜」走 */
  const polarName = (isDay, north) => {
    if (side === 0) return north ? '北极侧' : '南极侧'
    const kind = isDay ? '极昼区' : '极夜区'
    return north ? `北极侧${kind}` : `南极侧${kind}`
  }
  const polarHint = (isDay, north) => {
    if (side === 0) return '直射点在赤道：全球昼夜等长，没有极昼极夜。'
    const kind = isDay ? '太阳整夜不落' : '太阳整夜不升'
    return `${kind}的那一块，范围由切点纬度决定（${north ? '北' : '南'}极侧）。`
  }
  const polarSteps = (isDay, north) => {
    if (side === 0) {
      return [
        'δ = 0 时直射点在赤道，晨昏线过南北两极',
        `切点退到极点：纬度 = 90° − |δ| = ${north ? '{cutLat}' : '{cutLatSouth}'}`,
        '全球昼夜等长，没有极昼极夜',
        `所以${north ? '北' : '南'}极这一块此时不画出来`,
      ]
    }
    return [
      isDay
        ? '极昼区 = 整天都在昼半球里的那些地方，晨昏线一天之内扫不到它们'
        : '极夜区 = 整天都在夜半球里的那些地方，晨昏线一天之内扫不到它们',
      north
        ? '边界就是晨昏线的切点纬线：纬度 = 90° − |δ| = {cutLat}'
        : '边界就是晨昏线的切点纬线：纬度 = −(90° − |δ|) = {cutLatSouth}',
      north
        ? `直射点在 {decl} ⇒ {northRegion}出现${isDay ? '极昼' : '极夜'}，{cutLat} 以北都是${isDay ? '极昼' : '极夜'}`
        : `直射点在 {decl} ⇒ {southRegion}出现${isDay ? '极昼' : '极夜'}，{cutLat} 以南都是${isDay ? '极昼' : '极夜'}`,
      atSolstice
        ? north
          ? '此时是二至日：边界正好落在极圈 {polarCircle} 上'
          : '此时是二至日：边界正好落在极圈 {polarCircleS} 上'
        : north
          ? '只有二至日（|δ| = {tilt}）时边界才落在极圈 {polarCircle} 上'
          : '只有二至日（|δ| = {tilt}）时边界才落在极圈 {polarCircleS} 上',
    ]
  }

  return {
    sun: {
      name: '太阳',
      hint: '地球不发光，地面所有的光都来自它。',
      vars,
      steps: [
        '太阳是离地球最近的恒星，靠核心的氢聚变发光',
        '地球本身不发光，昼半球的亮度全部来自太阳',
        '太阳画在画面左边：侧视投影要求视线垂直于太阳光线所在的那个大圆面',
        '太阳方向一定，直射点和晨昏线才定得下来',
      ],
    },
    rays: {
      name: '太阳光线',
      hint: '平行光——太阳太大太远，光线到地球时几乎不发散。',
      vars,
      steps: [
        '太阳直径约 139 万公里，地球直径约 1.27 万公里',
        '太阳与地球相距约 1.5 亿公里',
        '视角 = 139 万 ÷ 1.5 亿 ≈ 0.0093 弧度 ≈ 0.53°',
        '在地球尺度上这个角可以忽略，所以一律按平行光画',
        '平行光线与球面垂直相交的那一点，就是太阳直射点',
      ],
    },
    axis: {
      name: '地轴',
      hint: '地球自转绕着它转，倾角固定在 23.5°。',
      vars,
      steps: [
        '地轴与公转轨道面的夹角 = {tilt}，公转一圈方向始终不变',
        '直射点的纬度 = 太阳方向与赤道面的夹角 = δ = {decl}',
        '地轴垂直于赤道面 ⇒ 地轴与太阳光线夹角（取锐角）= 90° − |δ| = {axisAngle}',
        'δ = 0 时地轴与光线正好垂直；δ ≠ 0 时向北或向南偏',
        '直射点在哪个半球，北极就朝太阳的那一侧倾',
      ],
    },
    subsolar: {
      name: '太阳直射点',
      hint: '正午太阳在头顶、太阳高度 90° 的那个点。',
      vars,
      steps: [
        '正午太阳高度 h = 90° − |当地纬度 − 直射点纬度|',
        '令 h = 90° ⇒ |当地纬度 − δ| = 0 ⇒ 直射点纬度 = δ = {decl}',
        '太阳在画面左边 ⇒ 直射点落在球的左轮廓上，正对太阳',
        '直射点所在的纬线叫直射纬线：北回归线 {tropicN}、南回归线 {tropicS}',
      ],
    },
    'subsolar-line': {
      name: '直射点—地心连线',
      hint: '太阳光线的方向线，晨昏线就是它的垂线。',
      vars,
      steps: [
        '球心与直射点的连线，方向就是太阳光线射来的方向',
        '地球不透明 ⇒ 只有这条线与球面垂直相交的那一点能被直射',
        '过球心作这条线的垂线，垂线上的点就是晨昏线',
        '①找直射点 → ②连到地心 → ③过球心作垂线，三步连起来才是一张完整的光照图',
      ],
    },
    terminator: {
      name: '晨昏线',
      hint: '过球心的垂线，把地球分成昼半球和夜半球。',
      vars,
      steps: atEquinox
        ? [
            '晨昏线 = 太阳高度 h = 0 的所有点连成的圈',
            'h = 0 的条件：sinφ·sinδ + cosφ·cosδ·cosH = 0',
            'δ = 0 时 sinδ = 0 ⇒ cosH = 0 ⇒ H = ±90°',
            '于是晨昏线就是过南北两极的那两条经线，全球昼夜等长',
            '侧视投影里它恒是过球心的一条竖直线',
          ]
        : [
            '晨昏线 = 太阳高度 h = 0 的所有点连成的圈',
            'h = 0 的条件：sinφ·sinδ + cosφ·cosδ·cosH = 0 ⇒ tanφ = −cotδ·cosH',
            'δ = {decl} 时 cotδ = {cotDecl}',
            '在子午线上求解：tanφ = ∓cotδ ⇒ |φ| = 90° − |δ| = {cutLat}',
            '侧视投影里它恒是过球心的一条竖直线：垂线偏一点，分出的两半就不一样大',
          ],
    },
    day: {
      name: '昼半球',
      hint: '被太阳照亮的那一半，恰好占地球表面的一半。',
      vars,
      steps: [
        '太阳只照亮朝向它的那一半',
        '晨昏线过球心 ⇒ 它是大圆 ⇒ 把球面分成两个一样大的半球',
        '昼半球的面积 = 地球表面积的一半 ≈ 2.55 亿平方千米',
        '太阳恒在画面左侧 ⇒ 昼半球恒是球的左半边',
      ],
    },
    night: {
      name: '夜半球',
      hint: '背对太阳的那一半。',
      vars,
      steps: [
        '与昼半球互补，两者各占地球表面的一半',
        '夜半球正对地球背面的那个点，正值当地的白昼',
        '所以地球上任何时刻都同时有白天和黑夜',
        '涂反了，昼夜范围就全错',
      ],
    },
    'cut-north': {
      name: '北切点',
      hint: '晨昏线走到最靠北极点的那一点，那里太阳正好擦着地平线。',
      vars,
      steps: atEquinox
        ? [
            '切点 = 晨昏线走到最靠极点的那一点：那里太阳高度 h = 0',
            '把 h = 0 代回晨昏线方程 sinφ·sinδ + cosφ·cosδ·cosH = 0',
            'δ = 0 时 sinδ = 0 ⇒ cosH = 0 ⇒ H = ±90°',
            '切点因此退到北极点：纬度 = {cutLat}',
            '极点是所有经线的交点，所以那里谈不上「12 时」还是「0 时」',
          ]
        : [
            '切点 = 晨昏线走到最靠极点的那一点：那里太阳高度 h = 0',
            '把 h = 0 代回晨昏线方程 tanφ = −cotδ·cosH',
            '在子午线上求解（H = 0° 或 180°）：tanφ = ∓cotδ ⇒ |φ| = 90° − |δ| = {cutLat}',
            '取落在北半球的解 ⇒ 北切点纬度 = {cutLat}',
            '它落在{northMeridian}上；侧视投影里是晨昏线的上端点',
          ],
    },
    'cut-south': {
      name: '南切点',
      hint: '晨昏线走到最靠南极点的那一点，与北切点南北对称。',
      vars,
      steps: atEquinox
        ? [
            '切点 = 晨昏线走到最靠极点的那一点：那里太阳高度 h = 0',
            '把 h = 0 代回晨昏线方程 sinφ·sinδ + cosφ·cosδ·cosH = 0',
            'δ = 0 时 sinδ = 0 ⇒ cosH = 0 ⇒ H = ±90°',
            '切点因此退到南极点：纬度 = {cutLatSouth}',
            '南半球没有极昼极夜，昼夜一样长',
          ]
        : [
            '切点 = 晨昏线走到最靠极点的那一点：那里太阳高度 h = 0',
            '把 h = 0 代回晨昏线方程 tanφ = −cotδ·cosH',
            '在子午线上求解（H = 0° 或 180°）：tanφ = ∓cotδ ⇒ |φ| = 90° − |δ| = {cutLat}',
            '取落在南半球的解 ⇒ 南切点纬度 = {cutLatSouth}',
            '它落在{southMeridian}上；侧视投影里是晨昏线的下端点',
          ],
    },
    'polar-circle': {
      name: '极圈',
      hint: '66.5° 与 66.5°S，两条固定的纬线，是极昼极夜的参考。',
      vars,
      steps: [
        '极圈纬度 = 90° − 地轴倾角 = 90° − {tilt} = {polarCircle}，南北各一条（南极圈 {polarCircleS}）',
        '它是晨昏线能到达的最北（最南）纬度：切点纬度 = 90° − |δ| = {cutLat}',
        atSolstice
          ? '此时 |δ| = {tilt}，{cutLat} 正好等于 {polarCircle}：晨昏线与极圈相切'
          : '此时 |δ| = {declAbs}，{cutLat} 大于 {polarCircle}：切点落在极圈与极点之间',
        '只有二至日（|δ| = {tilt}）时晨昏线才与极圈相切',
      ],
    },
    'polar-north': {
      name: polarName(northIsDay, true),
      hint: polarHint(northIsDay, true),
      vars,
      steps: polarSteps(northIsDay, true),
    },
    'polar-south': {
      name: polarName(southIsDay, false),
      hint: polarHint(southIsDay, false),
      vars,
      steps: polarSteps(southIsDay, false),
    },
  }
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

/* δ = 0 时极昼极夜退化成极点上的一个点：不上色，但图元留在图上，
   讲解层才能指着它说明「现在没有极昼极夜」 */
.demo-cap-hidden {
  fill: none;
  stroke: none;
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
