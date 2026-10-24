<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- ①②③ 三个状态各一张剖面图：正常年 → 拉尼娜 → 厄尔尼诺 -->
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
        <path class="wk-head" :d="p.rise.head" />
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
        <path class="wk-head" :d="p.sink.head" />
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
        <path class="wk-head wk-head--soft" :d="p.upwell.head" />
        <text
          class="demo__label demo__label--faint"
          :x="p.upwellLabel.x"
          :y="p.upwellLabel.y"
          :text-anchor="p.upwellLabel.anchor"
        >
          冷水上涌
        </text>

        <!-- 高空气流：上升支 → 下沉支 -->
        <path class="wk-flow" :d="p.upper.d" />
        <path class="wk-head" :d="p.upper.head" />
        <text class="demo__label" :x="p.upperLabel.x" :y="p.upperLabel.y" text-anchor="middle">
          高空气流
        </text>

        <!-- 近地面气流：下沉支 → 上升支（这就是东南信风） -->
        <path class="wk-flow" :d="p.surface.d" />
        <path class="wk-head" :d="p.surface.head" />
        <text class="demo__label demo__label--mark" :x="p.tradeLabel.x" :y="p.tradeLabel.y" text-anchor="middle">
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
 * 四步：① 正常年（沃克环流底图）② 拉尼娜 ③ 厄尔尼诺 ④ 三个状态并排对比。
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { arrowHead } from '../../data/svgParts'
import {
  PLOT,
  STATE_META,
  WARM_POOL_X,
  directionAngle,
  walkerCirculation,
  warmLayerPoints,
} from '../../data/walkerCirculationGeometry'

const steps = [
  {
    id: 'normal',
    title: '① 正常年：太平洋上空的沃克环流',
    text: '这是一张赤道剖面图：横轴是太平洋，西在左、东在右；纵轴是高度。近地面的东南信风从东南吹向赤道，箭头指向西，把表层暖水推向西太平洋；西边堆的是暖水，成为热源，气流上升并降水；高空的西风把气流向东送；东太平洋是冷源，气流下沉，东岸的表层水被离岸风吹走，底层冷水上涌——顺带养出了秘鲁渔场。记住口诀：东冷西热，东沉西升。',
  },
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
]

/** 一条直线段：路径 + 箭头尖端坐标 + 方向角 */
function seg(from, to, size = 13) {
  return {
    d: `M ${from.x} ${from.y} L ${to.x} ${to.y}`,
    head: arrowHead(to.x, to.y, directionAngle(from.x, from.y, to.x, to.y), size),
  }
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

/**
 * 三个状态的全幅剖面图。
 */
const statePanels = computed(() =>
  ['normal', 'lanina', 'elnino'].map((key) => {
    const meta = STATE_META[key]
    const c = walkerCirculation(WARM_POOL_X[key])

    const surfaceY = Math.min(c.seaWestY, c.seaEastY) - 30
    // 近地面气流停在上升支前 16px，免得箭头压在上升气流上
    const gap = 16
    const toX =
      c.surfaceFlow.fromX > c.surfaceFlow.toX
        ? c.surfaceFlow.toX + gap
        : c.surfaceFlow.toX - gap
    const surfaceFrom = { x: c.surfaceFlow.fromX, y: surfaceY }
    const surfaceTo = { x: toX, y: surfaceY }

    const riseSide = sideOf(c.rise.x)
    const sinkSide = sideOf(c.sink.x)

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
      upwellLabel:
        c.sink.x > 560
          ? { x: c.sink.x - 12, y: 276, anchor: 'end' }
          : { x: c.sink.x + 12, y: 276, anchor: 'start' },
      upperLabel: { x: (c.upperFlow.fromX + c.upperFlow.toX) / 2, y: 64 },
      tradeLabel: { x: (surfaceFrom.x + surfaceTo.x) / 2, y: surfaceY + 22 },
      warmLabel: { x: c.warmX, y: c.seaY(c.warmX) + 30 },
    }
  }),
)

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
