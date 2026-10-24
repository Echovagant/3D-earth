<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- ①②③ 三张剖面图：① 跟着参数连续变形，②③ 是拉尼娜/厄尔尼诺的定格参照 -->
      <g v-for="(p, i) in statePanels" :key="p.key" v-show="step === i" class="demo__frame">
        <text class="demo__label demo__label--mark" x="36" y="42">{{ p.meta.title }}</text>
        <text class="demo__label demo__label--faint" x="36" y="62">{{ p.meta.subtitle }}</text>

        <!-- 高度轴 -->
        <path class="wk-axis" :d="`M 92 ${PLOT.top} L 92 ${PLOT.bottom}`" />
        <text class="demo__label demo__label--faint" x="98" y="88">高度</text>

        <!-- 海洋与暖水层 -->
        <path class="wk-ocean" :d="p.oceanPath" />
        <path class="wk-warm" :d="p.warmPath" />

        <!-- 上升支（热源上方） -->
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

        <!-- 下沉支（冷源上方） -->
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

        <!-- 冷水上涌 -->
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

        <!-- 高空气流：上升支 → 下沉支 -->
        <path class="wk-flow" :d="p.upper.d" />
        <path v-if="p.upper.head" class="wk-head" :d="p.upper.head" />
        <text class="demo__label" :x="p.upperLabel.x" :y="p.upperLabel.y" text-anchor="middle">
          高空气流
        </text>

        <!-- 近地面气流：下沉支 → 上升支（这就是东南信风） -->
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

        <!-- 暖水与洋流注记 -->
        <text class="demo__label demo__label--mark" :x="p.warmLabel.x" :y="p.warmLabel.y" text-anchor="middle">
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
          <path class="wk-flow" :d="p.surface.d" />
          <path class="wk-head" :d="p.surface.head" />

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
  STALL_EPS,
  STATE_META,
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
