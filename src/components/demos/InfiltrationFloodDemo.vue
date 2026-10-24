<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- ① 影响下渗的四类条件 + 通用剖面 -->
      <g v-show="step === 0" class="demo__frame">
        <g v-for="f in factors" :key="f.id">
          <rect class="if-chip" :x="f.x" y="48" width="160" height="52" rx="8" />
          <text class="demo__label" :x="f.x + 80" y="72" text-anchor="middle">{{ f.label }}</text>
          <text class="demo__label demo__label--mark" :x="f.x + 80" y="92" text-anchor="middle">
            {{ f.effect }}
          </text>
        </g>

        <g class="if-rain">
          <path v-for="x in rainXs" :key="x" :d="`M ${x} 118 L ${x - 5} 160`" />
        </g>

        <path class="if-soil" :d="soilPath" />
        <path class="if-bedrock" :d="bedrockPath" />
        <path class="if-surface" :d="surfacePath" />
        <path class="demo__leader" :d="waterTablePath" />

        <g v-for="a in profileArrows" :key="a.d">
          <path class="if-flow" :d="a.d" />
          <path class="if-head" :d="a.head" />
        </g>

        <text class="demo__label demo__label--faint" x="650" y="204" text-anchor="end">土壤（可透水）</text>
        <text class="demo__label demo__label--faint" x="650" y="246" text-anchor="end">地下水位</text>
        <text class="demo__label demo__label--faint" x="650" y="296" text-anchor="end">不透水岩层</text>
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          降水强度越大越不易下渗——不是雨下得越多就渗得越多
        </text>
      </g>

      <!-- ② 自然地面 -->
      <g v-show="step === 1" class="demo__frame">
        <g class="if-rain">
          <path v-for="x in rainXs" :key="x" :d="`M ${x} 118 L ${x - 5} 160`" />
        </g>
        <g v-for="t in trees" :key="t.x">
          <path class="if-trunk" :d="`M ${t.x} ${t.base} L ${t.x} ${t.base - 16}`" />
          <path class="if-leaf" :d="`M ${t.x} ${t.base - 40} L ${t.x + 15} ${t.base - 12} L ${t.x - 15} ${t.base - 12} Z`" />
        </g>

        <path class="if-soil" :d="soilPath" />
        <path class="if-bedrock" :d="bedrockPath" />
        <path class="if-surface" :d="surfacePath" />
        <path class="demo__leader" :d="waterTablePath" />

        <g v-for="a in deepArrows" :key="a.d">
          <path class="if-flow" :d="a.d" />
          <path class="if-head" :d="a.head" />
        </g>

        <text class="demo__label demo__label--mark" x="360" y="106" text-anchor="middle">
          植被拦一下、减速一下 → 水有机会渗进去
        </text>
        <text class="demo__label demo__label--faint" x="650" y="204" text-anchor="end">土壤（可透水）</text>
        <text class="demo__label demo__label--mark" x="650" y="246" text-anchor="end">地下水位上升</text>
        <text class="demo__label demo__label--faint" x="650" y="296" text-anchor="end">不透水岩层</text>
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          自然地面：雨渗进土壤，补给地下水
        </text>
      </g>

      <!-- ③ 城市地面：内涝 -->
      <g v-show="step === 2" class="demo__frame">
        <g class="if-rain">
          <path v-for="x in cityRainXs" :key="x" :d="`M ${x} 118 L ${x - 5} 160`" />
        </g>
        <g v-for="b in buildings" :key="b.x">
          <rect class="if-building" :x="b.x" :y="b.y" :width="b.w" :height="b.h" />
        </g>

        <path class="if-soil" :d="soilPath" />
        <path class="if-bedrock" :d="bedrockPath" />
        <path class="if-pavement" :d="pavementPath" />
        <path class="if-surface" :d="surfacePath" />

        <!-- 几乎没有下渗 -->
        <g v-for="a in stubArrows" :key="a.d">
          <path class="if-flow if-flow--weak" :d="a.d" />
          <path class="if-head if-head--weak" :d="a.head" />
        </g>

        <!-- 地表径流汇向低洼处：走在路面上，不从楼里穿过去 -->
        <path class="if-flow" :d="`M 560 176 L 146 176`" />
        <path class="if-head" :d="arrowHead(146, 176, 180, 13)" />
        <path class="if-pond" :d="pondPath" />

        <text class="demo__label demo__label--mark" x="355" y="200" text-anchor="middle">地表径流</text>
        <text class="demo__label demo__label--mark" x="92" y="140" text-anchor="middle">积水</text>
        <text class="demo__label demo__label--faint" x="620" y="212" text-anchor="end">硬化路面（不透水）</text>
        <text class="demo__label demo__label--faint" x="620" y="250" text-anchor="end">几乎没有下渗</text>
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          {{ floodChainText }}
        </text>
      </g>

      <!-- ④ 结果对比 + 治理 -->
      <g v-show="step === 3" class="demo__frame">
        <text class="demo__label demo__label--mark" x="30" y="44">
          下渗占比对比（讲义里的真实例题数据）
        </text>
        <g v-for="b in shareBars" :key="b.id">
          <text class="demo__label" x="150" :y="b.y + 5" text-anchor="end">{{ b.label }}</text>
          <rect class="if-bar" :x="160" :y="b.y - 13" :width="b.width" height="20" rx="3" />
          <text class="demo__label demo__label--mark" :x="160 + b.width + 10" :y="b.y + 5">
            {{ b.percent }}%
          </text>
        </g>

        <path class="demo__leader" d="M 30 196 L 690 196" />

        <text class="demo__label demo__label--mark" x="30" y="224">治理：思路统一——增加下渗</text>
        <g v-for="s in solutions" :key="s.id">
          <rect class="if-chip" :x="s.x" y="240" width="160" height="62" rx="8" />
          <text class="demo__label demo__label--mark" :x="s.x + 80" y="266" text-anchor="middle">
            {{ s.label }}
          </text>
          <text class="demo__label demo__label--faint" :x="s.x + 80" y="288" text-anchor="middle">
            {{ s.note }}
          </text>
        </g>
        <text class="demo__label demo__label--faint" x="30" y="330">
          不可取：加大地下水利用——采得太多会造成地面沉降
        </text>
        <text class="demo__caption-line" x="360" y="358" text-anchor="middle">
          一切城市内涝题，最终都落到「下渗」上
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §11.4 影响下渗的因素与城市内涝。
 *
 * 老师讲这节全靠生活经验：「浇花慢慢倒水它才渗得进去，拿一盆泼下去基本都冲走了」。
 * 这张图补的就是那幅画——同一场雨，落在自然地面上和落在城市地面上，
 * 分别往哪儿去。
 *
 * 两处最容易讲错的地方，代码里都锁住了：
 *   ① 降水强度与下渗成**负相关**，条形图的长度严格按百分比成正比算；
 *   ② 城市内涝的链条是 硬化路面 → 下渗↓ → 地下径流↓ → 地表径流↑ → 地表积水。
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { arrowHead } from '../../data/svgParts'
import {
  FLOOD_CHAIN,
  INFILTRATION_FACTORS,
  INFILTRATION_SHARE,
  PROFILE,
  SOLUTIONS,
  infiltrationArrowLength,
  shareBar,
} from '../../data/infiltrationFloodGeometry'

const steps = [
  {
    id: 'factors',
    title: '① 下渗强弱看什么',
    text: '讲义给了四类条件，方向全部指向「下渗↑」：降水强度越小、坡度越缓、植被覆盖率越高、岩层越透水，水就越容易渗进土里。特别注意降水强度与下渗成负相关——不是雨下得越多渗得越多，而是雨越急越来不及渗。题里若写「岩层坚硬、不透水」，那后面所有「地下径流增加」的选项都是错的。',
  },
  {
    id: 'natural',
    title: '② 自然地面：雨渗进土壤',
    text: '植被先把雨水拦一下、减速一下，水才有机会渗进土壤，补给地下水，地下水位上升。结论链是：植被覆盖率高 → 下渗↑ → 地下径流↑ → 地表径流↓，所以山区要多种树——不下渗就没有地下径流。',
  },
  {
    id: 'urban',
    title: '③ 城市地面：雨下不动了',
    text: '城市下垫面主要是水泥路、沥青路，不透水。雨落在硬化面上渗不下去，只能顺着地表汇流，低洼处就积成涝。成因链是：硬化路面 → 下渗↓ → 地下径流↓ → 地表径流↑ → 地表积水。这一条链能秒杀大半的题。',
  },
  {
    id: 'solution',
    title: '④ 对比与治理',
    text: '讲义里的真实例题给了数据：自然路面的下渗占比是 25%，浅城只有 10%，深城只有 5%——城市路面下渗明显减少。治理思路统一：把地面改造成「能喝水」的样子，海绵城市、屋顶花园、透水砖、植草沟四条要记全，其中植草沟的优点是施工量小、节约成本。加大地下水利用是明确不可取的项——采过头会地面沉降。',
  },
]

/** 一条直线段：路径 + 箭头尖端 */
function seg(from, to, size = 12) {
  const a = (Math.atan2(-(to.y - from.y), to.x - from.x) * 180) / Math.PI
  return { d: `M ${from.x} ${from.y} L ${to.x} ${to.y}`, head: arrowHead(to.x, to.y, a, size) }
}

const soilPath = `M ${PROFILE.left} ${PROFILE.surfaceY} L ${PROFILE.right} ${PROFILE.surfaceY} L ${PROFILE.right} ${PROFILE.soilBottomY} L ${PROFILE.left} ${PROFILE.soilBottomY} Z`
const bedrockPath = `M ${PROFILE.left} ${PROFILE.soilBottomY} L ${PROFILE.right} ${PROFILE.soilBottomY} L ${PROFILE.right} ${PROFILE.bedrockBottomY} L ${PROFILE.left} ${PROFILE.bedrockBottomY} Z`
const surfacePath = `M ${PROFILE.left} ${PROFILE.surfaceY} L ${PROFILE.right} ${PROFILE.surfaceY}`
const waterTablePath = `M ${PROFILE.left} ${PROFILE.waterTableY} L ${PROFILE.right} ${PROFILE.waterTableY}`
const pavementPath = `M ${PROFILE.left} ${PROFILE.surfaceY} L ${PROFILE.right} ${PROFILE.surfaceY} L ${PROFILE.right} ${PROFILE.surfaceY + 12} L ${PROFILE.left} ${PROFILE.surfaceY + 12} Z`
/** 低洼处的积水：摊在路面上的一汪水 */
const pondPath = `M ${PROFILE.left} ${PROFILE.surfaceY} L 146 ${PROFILE.surfaceY} L 136 ${PROFILE.surfaceY - 14} L ${PROFILE.left + 12} ${PROFILE.surfaceY - 14} Z`

const rainXs = [75, 175, 300, 430, 570, 650]
const cityRainXs = [130, 245, 385, 555, 645]

/** 四类条件排成四个卡片 */
const factors = computed(() =>
  INFILTRATION_FACTORS.map((f, i) => ({ ...f, x: 30 + i * 170 })),
)

/** 通用剖面里的下渗箭头：只到地下水位 */
const profileArrows = computed(() =>
  [180, 340, 500].map((x) =>
    seg({ x, y: PROFILE.surfaceY + 4 }, { x, y: PROFILE.waterTableY - 4 }),
  ),
)

/** 自然地面：箭头长度按 25% 的下渗占比折算 */
const deepArrows = computed(() => {
  const len = infiltrationArrowLength(INFILTRATION_SHARE.natural, 80, 30)
  return [180, 340, 500].map((x) =>
    seg({ x, y: PROFILE.surfaceY + 4 }, { x, y: PROFILE.surfaceY + 4 + len }),
  )
})

/** 城市地面：几乎没有下渗，只剩一小截（按 5% 折算） */
const stubArrows = computed(() => {
  const len = infiltrationArrowLength(INFILTRATION_SHARE.deepUrban, 80, 30)
  return [100, 620].map((x) =>
    seg({ x, y: PROFILE.surfaceY + 14 }, { x, y: PROFILE.surfaceY + 14 + len }, 9),
  )
})

/** 树：自然地面上的植被（避开雨线的落点） */
const trees = computed(() =>
  [115, 240, 365, 490].map((x) => ({ x, base: PROFILE.surfaceY })),
)

/** 楼：城市地面上的硬化建筑 */
const buildings = computed(() => [
  { x: 150, y: 108, w: 64, h: 60 },
  { x: 280, y: 92, w: 64, h: 76 },
  { x: 470, y: 116, w: 58, h: 52 },
])

/** 下渗占比条：长度严格按百分比成正比 */
const shareBars = computed(() => {
  const rows = [
    { id: 'natural', label: '自然路面', percent: INFILTRATION_SHARE.natural },
    { id: 'shallow', label: '浅城', percent: INFILTRATION_SHARE.shallowUrban },
    { id: 'deep', label: '深城', percent: INFILTRATION_SHARE.deepUrban },
  ]
  // 满量程按 30% 画：条长 = 百分比 / 30 × 480
  return rows.map((r, i) => ({
    ...r,
    y: 90 + i * 36,
    width: shareBar(r.percent, 480, 30),
  }))
})

/** 四条措施排成四个卡片 */
const solutions = computed(() =>
  SOLUTIONS.map((s, i) => ({ ...s, x: 30 + i * 170 })),
)

/** 内涝成因链（讲义原话） */
const floodChainText = FLOOD_CHAIN.map((c) => c.label).join(' → ')
</script>

<style scoped>
/* 只用共享层已有的变量，不新增色值 */
.if-soil {
  fill: var(--learn-day);
  stroke: var(--learn-day-edge);
  stroke-width: 1;
}

.if-bedrock {
  fill: var(--learn-line);
  stroke: var(--learn-line);
  stroke-width: 1;
}

.if-pavement {
  fill: var(--learn-line);
  stroke: var(--learn-ink-faint);
  stroke-width: 1;
}

.if-surface {
  fill: none;
  stroke: var(--learn-ink-soft);
  stroke-width: 1.5;
}

.if-rain path {
  fill: none;
  stroke: var(--learn-accent);
  stroke-width: 1.6;
  stroke-linecap: round;
}

.if-flow {
  fill: none;
  stroke: var(--learn-accent);
  stroke-width: 2.5;
  stroke-linecap: round;
}

.if-flow--weak {
  stroke: var(--learn-ink-faint);
  stroke-width: 1.8;
  stroke-dasharray: 4 3;
}

.if-head {
  fill: var(--learn-accent);
}

.if-head--weak {
  fill: var(--learn-ink-faint);
}

.if-trunk {
  fill: none;
  stroke: var(--learn-ink-soft);
  stroke-width: 2;
}

.if-leaf {
  fill: var(--learn-day-edge);
  stroke: var(--learn-ink-soft);
  stroke-width: 1;
}

.if-building {
  fill: var(--learn-line);
  stroke: var(--learn-ink-faint);
  stroke-width: 1;
}

.if-pond {
  fill: var(--learn-accent);
  opacity: 0.55;
}

.if-chip {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-accent);
  stroke-width: 1;
}

.if-bar {
  fill: var(--learn-accent);
  opacity: 0.8;
}
</style>
