<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ①②③ 三张剖面图：① 跟着参数连续变形，②③ 是拉尼娜/厄尔尼诺的定格参照 -->
      <g v-for="(p, i) in statePanels" :key="p.key" v-show="step === i" class="demo__frame">
        <text class="demo__label demo__label--mark" x="36" y="42">{{ p.meta.title }}</text>
        <text class="demo__label demo__label--faint" x="36" y="62">{{ p.meta.subtitle }}</text>

        <!-- 高度轴 -->
        <path class="wk-axis" :d="`M 92 ${PLOT.top} L 92 ${PLOT.bottom}`" />
        <text class="demo__label demo__label--faint" x="98" y="88">高度</text>

        <!-- 海洋与暖水层 -->
        <path class="wk-ocean" :data-explain="p.explain.sea" :d="p.oceanPath" />
        <path class="wk-warm" :data-explain="p.explain.warmLayer" :d="p.warmPath" />

        <!-- 上升支（热源上方） -->
        <g :data-explain="p.explain.rise">
          <path class="wk-flow" :d="p.rise.d" />
          <path v-if="p.rise.head" class="wk-head" :d="p.rise.head" />
          <text
            class="demo__label demo__label--mark"
            :x="p.riseLabel.x"
            :y="p.riseLabel.y"
            :text-anchor="p.riseLabel.anchor"
          >
            上升气流（降水）
          </text>
        </g>

        <!-- 下沉支（冷源上方） -->
        <g :data-explain="p.explain.sink">
          <path class="wk-flow" :d="p.sink.d" />
          <path v-if="p.sink.head" class="wk-head" :d="p.sink.head" />
          <text
            class="demo__label demo__label--mark"
            :x="p.sinkLabel.x"
            :y="p.sinkLabel.y"
            :text-anchor="p.sinkLabel.anchor"
          >
            下沉气流（干晴）
          </text>
        </g>

        <!-- 冷水上涌 -->
        <g :data-explain="p.explain.upwell">
          <path class="wk-flow wk-flow--soft" :d="p.upwell.d" />
          <path v-if="p.upwell.head" class="wk-head wk-head--soft" :d="p.upwell.head" />
          <text
            v-if="p.upwellLabel"
            class="demo__label demo__label--faint"
            :x="p.upwellLabel.x"
            :y="p.upwellLabel.y"
            :text-anchor="p.upwellLabel.anchor"
          >
            冷水上涌
          </text>
        </g>

        <!-- 高空气流：上升支 → 下沉支 -->
        <g :data-explain="p.explain.upper">
          <path class="wk-flow" :d="p.upper.d" />
          <path v-if="p.upper.head" class="wk-head" :d="p.upper.head" />
          <text class="demo__label" :x="p.upperLabel.x" :y="p.upperLabel.y" text-anchor="middle">
            高空气流
          </text>
        </g>

        <!-- 近地面气流：下沉支 → 上升支（这就是东南信风） -->
        <g :data-explain="p.explain.surface">
          <path class="wk-flow" :d="p.surface.d" />
          <path v-if="p.surface.head" class="wk-head" :d="p.surface.head" />
          <text
            class="demo__label demo__label--mark"
            :x="p.tradeLabel.x"
            :y="p.tradeLabel.y"
            :text-anchor="p.tradeLabel.anchor"
          >
            {{ p.meta.trade }}
          </text>
        </g>

        <!-- 暖水与洋流注记 -->
        <text
          class="demo__label demo__label--mark"
          :data-explain="p.explain.warmPool"
          :x="p.warmLabel.x"
          :y="p.warmLabel.y"
          text-anchor="middle"
        >
          暖水
        </text>
        <text class="demo__label demo__label--faint" x="110" y="334">西太平洋</text>
        <text class="demo__label demo__label--faint" x="690" y="334" text-anchor="end">东太平洋</text>
        <text class="demo__label demo__label--faint" x="110" y="354">澳大利亚 · 印尼一带</text>
        <text class="demo__label demo__label--faint" x="690" y="354" text-anchor="end">南美洲西岸</text>
      </g>

      <!-- ④ 三个状态并排对比 -->
      <g v-show="step === 3" class="demo__frame">
        <g v-for="p in miniPanels" :key="p.key">
          <text class="demo__label demo__label--mark" :x="p.cx" y="52" text-anchor="middle">
            {{ p.meta.title }}
          </text>
          <path class="wk-ocean" :d="p.oceanPath" />
          <path class="wk-warm" :d="p.warmPath" />
          <path class="wk-flow" :d="p.rise.d" />
          <path class="wk-head" :d="p.rise.head" />
          <path class="wk-flow" :d="p.sink.d" />
          <path class="wk-head" :d="p.sink.head" />
          <g :data-explain="p.explain.surface">
            <path class="wk-flow" :d="p.surface.d" />
            <path class="wk-head" :d="p.surface.head" />
          </g>

          <text class="demo__label" :x="p.cx" y="218" text-anchor="middle">{{ p.meta.west }}</text>
          <text class="demo__label" :x="p.cx" y="240" text-anchor="middle">{{ p.meta.east }}</text>
          <text class="demo__label demo__label--faint" :x="p.cx" y="262" text-anchor="middle">
            {{ p.meta.trade }}
          </text>
          <text class="demo__label demo__label--mark" :x="p.cx" y="286" text-anchor="middle">
            {{ p.meta.china }}
          </text>
        </g>

        <text class="demo__caption-line" x="360" y="330" text-anchor="middle">
          西太平洋暖池的强弱，摆动的是我国的雨带
        </text>
        <text class="demo__label demo__label--faint" x="360" y="354" text-anchor="middle">
          东南信风强，拉尼娜称王；东南信风弱，厄尔尼诺现
        </text>
      </g>
    </template>

    <!--
      参数轴：只在第①步出现。
      ②③④ 是三个状态的定格参照，本来就不该跟着参数变；
      滑块放在第一屏，可发现性没问题。
    -->
    <template #controls="{ step }">
      <DemoSlider
        v-if="step === 0"
        v-model="trade"
        label="东南信风强弱"
        :min="-1"
        :max="1"
        :step="0.05"
        :format="formatTrade"
      />
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §11.17 厄尔尼诺与拉尼娜（含 §11.16 沃克环流作底图）。
 *
 * 老师讲这一节全靠「想象太平洋上空转起来」，而这一段最容易画反：
 * 东南信风从东南吹向赤道 → 近地面箭头**指向西**，暖水因此堆在**西**太平洋；
 * 西边热上升、高空向西风向东流、东边下沉涌冷水。信风向西、暖水在西，
 * 这两件事是一体的，画反一个整个动画就教错了。
 *
 * 所以这张图的几何不是手摆的：整个环流由「暖水堆在横向的哪个位置」推出，
 * 上升支、下沉支、近地面气流、高空气流、海面倾斜全部由它算出来
 * （见 walkerCirculationGeometry.js）。正常年暖水在西 → 箭头指向西；
 * 厄尔尼诺暖水东移 → 低层气流自动反向。
 *
 * 四步：① 连续实验台（拖参数轴看环流变形）② 拉尼娜（定格）
 *      ③ 厄尔尼诺（定格）④ 三个状态并排对比。
 */
import { computed, ref } from 'vue'
import DemoShell from '../DemoShell.vue'
import DemoSlider from '../DemoSlider.vue'
import { arrowHead } from '../../data/svgParts'
import {
  MIDLINE,
  PLOT,
  SEA_TILT,
  STALL_EPS,
  STATE_META,
  TILT_FULL_SPREAD,
  WARM_LAYER_SPREAD,
  WARM_LAYER_THICKNESS,
  WARM_POOL_X,
  directionAngle,
  surfaceFlowDirection,
  walkerCirculation,
  warmLayerPoints,
  warmPoolXFromTrade,
} from '../../data/walkerCirculationGeometry'

/** 东南信风强弱：−1 偏弱（厄尔尼诺）… 0 正常年 … +1 偏强（拉尼娜） */
const trade = ref(0)

/** 当前参数对应的暖水堆位置——整个环流都由它推出来 */
const warmPoolX = computed(() => warmPoolXFromTrade(trade.value))

/** 信风强弱分档：超过阈值才算进入拉尼娜 / 厄尔尼诺 */
const isStrong = (t) => t > 0.35
const isWeak = (t) => t < -0.35

const NORMAL_TEXT =
  '这是一张赤道剖面图：横轴是太平洋，西在左、东在右；纵轴是高度。近地面的东南信风从东南吹向赤道，箭头指向西，把表层暖水推向西太平洋；西边堆的是暖水，成为热源，气流上升并降水；高空的西风把气流向东送；东太平洋是冷源，气流下沉，东岸的表层水被离岸风吹走，底层冷水上涌——顺带养出了秘鲁渔场。记住口诀：东冷西热，东沉西升。'

const STRONG_TEXT =
  '东南信风比常年强一截，更多表层暖水被推向西太平洋：西边的暖水池堆得更满，东西温差被拉大。环流因此更猛——西太平洋上升更旺、蒸发更足、降水和台风都偏多，东太平洋下沉更强、旱得更厉害。把滑块拖到最右端就是完整的拉尼娜，第②步画的就是那一刻。'

const WEAK_TEXT =
  '东南信风比常年弱，暖水不再被推向西边，而是慢慢回流到东太平洋。往左拖的时候暖水堆会先停在太平洋中间——那里冷热源重合，低层气流停摆、海面是平的；再往左，东边变暖变湿、气流改为在东边上升，西边反而下沉、晴朗少雨。拖到最左端就是完整的厄尔尼诺，第③步画的就是那一刻。'

/** 第①步的标题与解说：跟着参数走 */
const liveTitle = computed(() => {
  const t = trade.value
  if (isStrong(t)) return '① 信风异常增强：沃克环流的「PLUS 版」'
  if (isWeak(t)) return '① 信风异常偏弱：冷热源反转'
  return '① 正常年：太平洋上空的沃克环流'
})

const liveText = computed(() => {
  const t = trade.value
  if (isStrong(t)) return STRONG_TEXT
  if (isWeak(t)) return WEAK_TEXT
  return `${NORMAL_TEXT}拖动上面的滑块，看环流怎么变。`
})

const steps = computed(() => [
  { id: 'normal', title: liveTitle.value, text: liveText.value },
  {
    id: 'lanina',
    title: '② 拉尼娜：沃克环流的「PLUS 版」',
    text: '东南信风异常增强，更多暖水被推到西边，东边的离岸风也更猛、涌上来的冷水更冷。东西温差更大，沃克环流比平时更强：西太平洋上升更猛、蒸发更旺，降水大到能引发洪灾，台风也异常增多；东太平洋下沉更强，旱得更厉害。反过来落到我国是南旱北涝、台风偏多、冷冬。',
  },
  {
    id: 'elnino',
    title: '③ 厄尔尼诺：冷热源反转',
    text: '东南信风异常偏弱，暖水不再被推向西边，而是回流到东太平洋。东边变暖变湿，气流改为在东边上升；西边反而下沉，晴朗少雨，容易起旱灾和森林火灾；东岸阴雨、洪涝。这就是拉尼娜的反转版。落到我国是北旱南涝、台风偏少、暖冬，东太平洋的冷水鱼大量死亡、渔业崩溃。',
  },
  {
    id: 'compare',
    title: '④ 三个状态并排看',
    text: '同一台机器的两个方向：信风强就是拉尼娜，信风弱就是厄尔尼诺。我国主要受西太平洋影响——西太平洋特别热，夏季风增强、雨带北移加快，北方多雨易涝、南方旱；雨带长时间停在南方，就是北旱南涝。沃克环流异常对我国影响的考题不多，把结论记清、把简单过程推明白即可。',
  },
])

/**
 * 一条直线段：路径 + 箭头。
 *
 * 箭头头部按线段长度缩放——线段缩到零时头部也跟着缩到零，
 * 不会留下一个「起终点重合、方向角算成 atan2(0,0)=0」的多余箭头。
 */
function seg(from, to, size = 13) {
  const len = Math.hypot(to.x - from.x, to.y - from.y)
  const d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  if (len < 0.5) return { d, head: null }
  const headSize = Math.min(size, len * 0.45)
  return { d, head: arrowHead(to.x, to.y, directionAngle(from.x, from.y, to.x, to.y), headSize) }
}

/** 暖水层的下边界（温跃层）折线 */
function warmPath(c) {
  const pts = warmLayerPoints(c)
  const top = `M ${c.box.left} ${c.seaY(c.box.left).toFixed(2)}`
  const along = pts
    .map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')
  return `${top} ${along} Z`
}

/** 标注放在哪一侧：哪边空就放哪边 */
function sideOf(x) {
  return x - PLOT.left < PLOT.right - x ? 'left' : 'right'
}

/** 近地面气流箭头的旁注：方向问几何要，强弱问参数要 */
function tradeLabelFor(dir, t) {
  if (dir === 'stall') return '信风停摆（低层气流为零）'
  if (dir === 'east') return '低层气流反向（自西向东）'
  if (isStrong(t)) return '东南信风异常增强（自东向西）'
  if (isWeak(t)) return '东南信风异常偏弱（自东向西）'
  return '东南信风（自东向西）'
}

/**
 * 一张剖面图的全部几何。
 *
 * @param {string} key 面板标识
 * @param {object} meta 面板上的文字
 * @param {object} c walkerCirculation 算出来的环流
 */
function buildPanel(key, meta, c) {
  // 讲解层的挂点：只有第①步的元素逐个可讲，②③是定格参照，各挂暖水池与
  // 近地面气流两处。定格状态的画法与①完全一样，多挂只会多一份说不清的说明。
  const live = key === 'live'
  const suffix = live ? '' : `-${key}`
  const surfaceY = Math.min(c.seaWestY, c.seaEastY) - 30
  // 近地面气流停在上升支前一点，免得箭头压在上升气流上。
  // 缩进按长度取比例：暖水堆靠近中线时气流变短，缩进跟着缩，
  // 箭头不会突然翻面，也不会被顶成一根短胖的棍子。
  const rawLen = Math.abs(c.surfaceFlow.toX - c.surfaceFlow.fromX)
  const gap = Math.min(16, rawLen * 0.25)
  const toX =
    c.surfaceFlow.fromX > c.surfaceFlow.toX
      ? c.surfaceFlow.toX + gap
      : c.surfaceFlow.toX - gap
  const surfaceFrom = { x: c.surfaceFlow.fromX, y: surfaceY }
  const surfaceTo = { x: toX, y: surfaceY }

  const riseSide = sideOf(c.rise.x)
  const sinkSide = sideOf(c.sink.x)

  // 近地面气流的注记要落在上升支与下沉支之间的空档里；
  // 空档不够宽时（暖水堆压到中线上，环流停摆）就挪到支的外侧，
  // 否则文字会被竖直的箭头穿过。
  const labelWidth = meta.trade.length * 13
  const gapCentre = (surfaceFrom.x + surfaceTo.x) / 2
  const leftEdge = Math.min(c.rise.x, c.sink.x) - 16
  const rightEdge = Math.max(c.rise.x, c.sink.x) + 16
  const tradeLabel =
    rawLen >= labelWidth
      ? { x: gapCentre, y: surfaceY + 22, anchor: 'middle' }
      : leftEdge - labelWidth > PLOT.left
        ? { x: leftEdge, y: surfaceY + 22, anchor: 'end' }
        : rightEdge + labelWidth < PLOT.right
          ? { x: rightEdge, y: surfaceY + 22, anchor: 'start' }
          : { x: gapCentre, y: surfaceY + 22, anchor: 'middle' }

  // 冷水上涌的注记只在冷源与暖水池分开时才有意义；
  // 暖水堆压到中线上时两者重合，注记会跟「暖水」两个字挤在一起。
  const upwellLabel =
    Math.abs(c.sink.x - c.warmX) < 80
      ? null
      : c.sink.x > 560
        ? { x: c.sink.x - 12, y: 276, anchor: 'end' }
        : { x: c.sink.x + 12, y: 276, anchor: 'start' }

  return {
    key,
    meta,
    /** 讲解层挂点：与说明表里的 id 一一对应；undefined 表示不挂 */
    explain: {
      sea: live ? 'sea-surface' : undefined,
      warmLayer: live ? 'warm-layer' : undefined,
      warmPool: `warm-pool${suffix}`,
      rise: live ? 'rise' : undefined,
      sink: live ? 'sink' : undefined,
      upwell: live ? 'upwell' : undefined,
      upper: live ? 'upper' : undefined,
      surface: `surface${suffix}`,
    },
    oceanPath: `M ${PLOT.left} ${c.seaWestY} L ${PLOT.right} ${c.seaEastY} L ${PLOT.right} ${PLOT.bottom} L ${PLOT.left} ${PLOT.bottom} Z`,
    warmPath: warmPath(c),
    rise: seg({ x: c.rise.x, y: c.rise.y1 - 2 }, { x: c.rise.x, y: 92 }),
    sink: seg({ x: c.sink.x, y: 92 }, { x: c.sink.x, y: c.sink.y2 - 2 }),
    upwell: seg({ x: c.sink.x, y: PLOT.bottom - 12 }, { x: c.sink.x, y: c.seaY(c.sink.x) + 8 }),
    upper: seg({ x: c.upperFlow.fromX, y: 78 }, { x: c.upperFlow.toX, y: 78 }),
    surface: seg(surfaceFrom, surfaceTo),
    riseLabel:
      riseSide === 'left'
        ? { x: c.rise.x - 12, y: 138, anchor: 'end' }
        : { x: c.rise.x + 12, y: 138, anchor: 'start' },
    sinkLabel:
      sinkSide === 'left'
        ? { x: c.sink.x - 12, y: 186, anchor: 'end' }
        : { x: c.sink.x + 12, y: 186, anchor: 'start' },
    upwellLabel,
    upperLabel: { x: (c.upperFlow.fromX + c.upperFlow.toX) / 2, y: 64 },
    tradeLabel,
    warmLabel: { x: c.warmX, y: c.seaY(c.warmX) + 30 },
  }
}

/** 第①步画布上的文字：跟着当前参数走 */
const liveMeta = computed(() => {
  const t = trade.value
  const dir = surfaceFlowDirection(warmPoolX.value)
  if (isStrong(t)) {
    return {
      title: '信风异常增强',
      subtitle: '暖水更靠西 · 沃克环流的「PLUS 版」',
      trade: tradeLabelFor(dir, t),
    }
  }
  if (isWeak(t)) {
    return {
      title: '信风异常偏弱',
      subtitle: '暖水回流东太平洋 · 冷热源反转',
      trade: tradeLabelFor(dir, t),
    }
  }
  return {
    title: STATE_META.normal.title,
    subtitle: STATE_META.normal.subtitle,
    trade: tradeLabelFor(dir, t),
  }
})

/**
 * 三张全幅剖面图：第①张跟着参数连续变形，第②③张是固定参照。
 */
const statePanels = computed(() => [
  buildPanel('live', liveMeta.value, walkerCirculation(warmPoolX.value)),
  buildPanel('lanina', STATE_META.lanina, walkerCirculation(WARM_POOL_X.lanina)),
  buildPanel('elnino', STATE_META.elnino, walkerCirculation(WARM_POOL_X.elnino)),
])

/** 绘图区宽度：位置比例换算成画布坐标要用 */
const PLOT_W = PLOT.right - PLOT.left

/** 横向位置比例写成百分比 */
const pct = (v) => `${Math.round(v * 100)}%`

/** 近地面气流的走向写成一句话 */
function flowDirText(warmPoolX) {
  const dir = surfaceFlowDirection(warmPoolX)
  if (dir === 'stall') return '停摆（低层气流为零）'
  if (dir === 'east') return '自西向东（低层气流反向）'
  return '自东向西（东南信风）'
}

/** 暖水堆在横向的哪一侧 */
function warmSideText(warmPoolX) {
  if (Math.abs(warmPoolX - MIDLINE) <= STALL_EPS) return '暖水堆压在中线上'
  return warmPoolX < MIDLINE ? '暖水堆在西' : '暖水堆在东'
}

/**
 * 某个定格状态的讲解数值。
 *
 * 只放与画布尺寸无关的量（位置比例、走向、系数）——同一份说明才能同时用在
 * 第②③步的全幅剖面图与第④步的小图上，两处画的数值才对得上。
 */
function stateVars(c) {
  return {
    warmPct: pct(c.warmPoolX),
    coldPct: pct(1 - c.warmPoolX),
    offPct: pct(Math.abs(c.warmPoolX - MIDLINE)),
    normalPct: pct(WARM_POOL_X.normal),
    tiltAmount: c.tiltAmount.toFixed(2),
    dirText: flowDirText(c.warmPoolX),
  }
}

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 参数一动，图和讲解一起变，不会出现「图上箭头指向东、讲解却说吹向西」。
 *
 * 挂点只给能讲出推导的元素：第①步八个，第②③步各两个（暖水池与低层气流），
 * 第④步三张小图各一个（低层气流）。其余箭头与①的画法完全一样，
 * 挂上去只会多一份重复而说不清的说明。
 */
const explains = computed(() => {
  const live = walkerCirculation(warmPoolX.value)
  const lanina = walkerCirculation(WARM_POOL_X.lanina)
  const elnino = walkerCirculation(WARM_POOL_X.elnino)
  const normal = walkerCirculation(WARM_POOL_X.normal)
  const stall = surfaceFlowDirection(live.warmPoolX) === 'stall'

  /** 第①步的实时数值：图上量得到的一切都从几何里出 */
  const liveVars = {
    tradeVal: trade.value.toFixed(2),
    warmPct: pct(live.warmPoolX),
    warmX: live.warmX.toFixed(1),
    coldX: live.coldX.toFixed(1),
    coldPct: pct(1 - live.warmPoolX),
    offPct: pct(Math.abs(live.warmPoolX - MIDLINE)),
    warmSide: warmSideText(live.warmPoolX),
    tiltAmount: live.tiltAmount.toFixed(2),
    tiltFull: TILT_FULL_SPREAD.toFixed(1),
    tiltDrop: Math.abs(live.seaWestY - live.seaEastY).toFixed(0),
    seaTiltPx: String(SEA_TILT),
    thickness: String(WARM_LAYER_THICKNESS),
    spread: WARM_LAYER_SPREAD.toFixed(2),
    sigma: (WARM_LAYER_SPREAD * PLOT_W).toFixed(1),
    coldThick: live.layerThickness(live.coldX).toFixed(1),
    dirText: flowDirText(live.warmPoolX),
    fromX: live.surfaceFlow.fromX.toFixed(1),
    toX: live.surfaceFlow.toX.toFixed(1),
    upperFrom: live.upperFlow.fromX.toFixed(1),
    upperTo: live.upperFlow.toX.toFixed(1),
    seaYcold: live.seaY(live.coldX).toFixed(1),
    plotLeft: String(PLOT.left),
    plotW: String(PLOT_W),
  }

  return {
    'sea-surface': {
      name: '海面与海底',
      hint: '海面不是平的：暖水一侧受热膨胀被抬高，冷水一侧被压低。',
      vars: liveVars,
      steps: [
        '海水受热膨胀：暖水一侧密度小、体积大，海面被抬高',
        '东西冷热差得越远 → 热力环流越强 → 海面倾斜越明显',
        '幅度系数 = smoothstep(离中线距离 ÷ {tiltFull}) = {tiltAmount}',
        '倾斜量 = 系数 × {seaTiltPx}px ⇒ 东西两端海面相差 {tiltDrop}px',
        '暖水堆压到中线上 → 冷热源重合 → 系数归零，海面变平',
      ],
    },
    'warm-layer': {
      name: '暖水层（温跃层）',
      hint: '暖水层的下边界就是温跃层——暖水与冷水的交界面。',
      vars: liveVars,
      steps: [
        '温跃层 = 暖水与冷水的交界面，横向密度梯度最大的一段',
        '厚度按高斯分布：厚度(x) = {thickness}px × exp(−(x − 暖水堆)² / 2σ²)',
        'σ = {spread} × 绘图区宽度 = {sigma}px',
        '最厚处落在暖水堆正下方（x = {warmX}）',
        '到冷水源那一侧只剩 {coldThick}px，两端趋近于 0',
      ],
    },
    'warm-pool': {
      name: '暖水池',
      hint: '暖水堆在横向的哪个位置，整个环流就从这里算出来。',
      vars: liveVars,
      steps: [
        '信风自东向西推表层暖水 → 暖水堆在西太平洋；信风反转时暖水回流到东太平洋',
        '暖水堆位置 = 绘图区左端 + 位置比例 × 绘图区宽度',
        '当前信风参数 t = {tradeVal} ⇒ 位置比例 = {warmPct}（{warmSide}）',
        '画布横坐标 = {plotLeft} + {warmPct} × {plotW} = {warmX}',
        '整个环流只有一个自由度：暖水堆移到哪，上升支就移到哪',
      ],
    },
    rise: {
      name: '上升支（热源上升）',
      hint: '暖水堆正上方的上升气流，降水就发生在这一带。',
      vars: liveVars,
      steps: [
        '暖水堆是热源 → 上空气受热膨胀变轻 → 上升',
        '所以上升支的横坐标 = 暖水堆的横坐标，不是另摆一个位置',
        '当前暖水堆 x = {warmX}（绘图区 {warmPct} 处）',
        '暖湿空气抬升到高空冷却凝结 → 这一带上降水多',
      ],
    },
    sink: {
      name: '下沉支（冷源下沉）',
      hint: '冷水一侧的空气冷却变重而下沉，天空晴朗干旱。',
      vars: liveVars,
      steps: [
        '冷水一侧是冷源 → 空气冷却变重 → 下沉',
        '下沉支的横坐标 = 冷水源的横坐标 = 绘图区右端 − 暖水堆位置比例 × 宽度',
        '当前冷水源 x = {coldX}（绘图区 {coldPct} 处）',
        '下沉支正对着被离岸风刮走的表层水 → 底层冷水上涌',
      ],
    },
    upwell: {
      name: '冷水上涌',
      hint: '表层水被风刮走后，压在下面的冷水顶上来。',
      vars: liveVars,
      steps: [
        '近地面气流从下沉支吹向上升支 → 冷源一侧的表层水被带走',
        '表层水一走，下面压着的冷水就顶上来 → 冷水上涌',
        '上涌的冷水在 x = {coldX} 处顶到海面（该处海面 y = {seaYcold}）',
        '冷水上涌带来营养盐 → 秘鲁渔场的饵料来源',
      ],
    },
    upper: {
      name: '高空气流',
      hint: '高空的西风把上升的暖湿空气送回东边。',
      vars: liveVars,
      steps: [
        '暖水一侧上空因上升而堆高气压 → 高空有暖湿空气可送',
        '高空气流由上升支流向下沉支，是闭合回路的上半圈',
        '当前从 x = {upperFrom} 吹向 x = {upperTo}',
        '东边空气堆积后下沉 → 接回近地面那条回路，环流闭合',
      ],
    },
    surface: {
      name: '近地面气流（东南信风）',
      hint: '由下沉支吹向上升支——高压吹向低压。',
      vars: liveVars,
      steps: [
        '海面受热不均 → 暖水一侧成热低压、冷水一侧成冷高压',
        '近地面气流由高压吹向低压：下沉支 → 上升支',
        '当前走向 = {dirText}',
        stall
          ? '冷热源重合 → 起止点落在同一处（x = {fromX}），箭头长度为 0'
          : '从 x = {fromX} 吹到 x = {toX}',
        '气流吹向暖水堆（热低压），把表层暖水也推向那边 —— 箭头与暖水堆绑在一起',
      ],
    },
    'warm-pool-lanina': {
      name: '暖水池（拉尼娜）',
      hint: '信风异常增强，暖水堆被推到比常年更靠西的位置。',
      vars: stateVars(lanina),
      steps: [
        '信风比常年强一截 → 更多表层暖水被推向西边',
        '暖水堆位置 = 绘图区左端 + 位置比例 × 绘图区宽度',
        '拉尼娜的位置比例 = {warmPct}（常年是 {normalPct}）',
        '离中线 {offPct} → 海面倾斜幅度系数 = {tiltAmount}（满幅）',
        '暖水堆越靠西 → 上升支越靠西、下沉支越靠东',
      ],
    },
    'surface-lanina': {
      name: '近地面气流（拉尼娜）',
      hint: '东南信风异常增强，自东向西吹得更起劲。',
      vars: stateVars(lanina),
      steps: [
        '海面受热不均 → 西边暖（热低压）、东边冷（冷高压）',
        '近地面气流由高压吹向低压：下沉支 → 上升支',
        '当前走向 = {dirText}',
        '暖水堆在西（{warmPct}），低层气流也指向西 —— 两件事绑在一起',
        '信风越强 → 暖水堆越靠西 → 环流越猛：西边上升更旺、东边下沉更强',
      ],
    },
    'warm-pool-elnino': {
      name: '暖水池（厄尔尼诺）',
      hint: '信风异常偏弱，暖水回流到东太平洋。',
      vars: stateVars(elnino),
      steps: [
        '信风比常年弱 → 暖水不再被推向西边，而是回流东太平洋',
        '位置比例 = {warmPct}（常年是 {normalPct}），暖水堆翻到东边',
        '离中线 {offPct} → 海面倾斜幅度系数 = {tiltAmount}（满幅，但方向翻面）',
        '冷热源跟着翻面：东边变热源、西边变冷源',
        '暖水堆翻到东边，上升支也跟着翻到东边',
      ],
    },
    'surface-elnino': {
      name: '近地面气流（厄尔尼诺）',
      hint: '低层气流反转为自西向东。',
      vars: stateVars(elnino),
      steps: [
        '海面受热不均 → 现在东边暖（热低压）、西边冷（冷高压）',
        '近地面气流由高压吹向低压：西边的下沉支 → 东边的上升支',
        '当前走向 = {dirText}',
        '暖水堆在东（{warmPct}），低层气流也指向东 —— 两件事绑在一起',
        '低层反向 → 西太平洋下沉转晴、东太平洋上升转湿',
      ],
    },
    'surface-normal': {
      name: '近地面气流（正常年）',
      hint: '自东向西的东南信风——暖水堆在西。',
      vars: stateVars(normal),
      steps: [
        '海面受热不均 → 西边暖（热低压）、东边冷（冷高压）',
        '近地面气流由高压吹向低压：下沉支 → 上升支',
        '当前走向 = {dirText}',
        '暖水堆在西（{warmPct}），低层气流也指向西 —— 这是正常年的样子',
        '三个状态对比：信风强 → 暖水更西；信风弱 → 暖水东移、气流反向',
      ],
    },
  }
})

/** 滑块读数：信风状态 + 暖水堆现在在哪 */
function formatTrade(value) {
  const t = Number(value)
  const warm = warmPoolXFromTrade(t)
  const state = isStrong(t)
    ? '信风增强 · 偏拉尼娜'
    : isWeak(t)
      ? '信风偏弱 · 偏厄尔尼诺'
      : '信风正常'
  const where =
    Math.abs(warm - MIDLINE) <= STALL_EPS
      ? '暖水居中'
      : warm < MIDLINE
        ? '暖水在西'
        : '暖水在东'
  return `${state} · ${where}`
}

/**
 * ④ 三个状态并排的小剖面图。
 */
const miniPanels = computed(() => {
  const box = { left: 30, right: 210, top: 76, bottom: 172 }
  return ['normal', 'lanina', 'elnino'].map((key, i) => {
    const meta = STATE_META[key]
    const c = walkerCirculation(WARM_POOL_X[key], box, {
      seaLevel: 152,
      seaTilt: 9,
      warmThickness: 26,
    })
    const cx = (box.left + box.right) / 2 + i * 235
    const shift = cx - (box.left + box.right) / 2
    const at = (x) => x + shift
    const surfaceY = Math.min(c.seaWestY, c.seaEastY) - 20

    return {
      key,
      meta,
      cx,
      // 小图与第②③步的全幅剖面图讲的是同一个状态，共用同一条说明
      explain: { surface: `surface-${key}` },
      oceanPath: `M ${at(box.left)} ${c.seaWestY} L ${at(box.right)} ${c.seaEastY} L ${at(box.right)} ${box.bottom} L ${at(box.left)} ${box.bottom} Z`,
      warmPath: (() => {
        const pts = warmLayerPoints(c).map((p) => ({ x: at(p.x), y: p.y }))
        const top = `M ${at(box.left)} ${c.seaY(box.left).toFixed(2)}`
        return `${top} ${pts.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')} Z`
      })(),
      rise: seg({ x: at(c.rise.x), y: c.rise.y1 - 2 }, { x: at(c.rise.x), y: 84 }, 10),
      sink: seg({ x: at(c.sink.x), y: 84 }, { x: at(c.sink.x), y: c.sink.y2 - 2 }, 10),
      surface: seg(
        { x: at(c.surfaceFlow.fromX), y: surfaceY },
        { x: at(c.surfaceFlow.toX), y: surfaceY },
        10,
      ),
    }
  })
})
</script>

<style scoped>
/* 只用共享层已有的变量，不新增色值 */

/*
 * 读数是「信风状态 + 暖水位置」两段话，窄屏放不下一行就换行，
 * 别把滑块本身挤成一条缝。
 */
.demo-slider {
  flex-wrap: wrap;
}
.wk-ocean {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-line);
  stroke-width: 1;
}

.wk-warm {
  fill: var(--learn-sun);
  opacity: 0.42;
}

.wk-flow {
  fill: none;
  stroke: var(--learn-accent);
  stroke-width: 2.5;
  stroke-linecap: round;
}

.wk-axis {
  fill: none;
  stroke: var(--learn-ink-faint);
  stroke-width: 1;
}

.wk-flow--soft {
  stroke: var(--learn-ink-faint);
  stroke-width: 2;
  stroke-dasharray: 5 4;
}

.wk-head {
  fill: var(--learn-accent);
}

.wk-head--soft {
  fill: var(--learn-ink-faint);
}
</style>
