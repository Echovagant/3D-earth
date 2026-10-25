<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 影响下渗的四类条件 + 通用剖面 -->
      <g v-show="step === 0" class="demo__frame">
        <g v-for="f in factors" :key="f.id" :data-explain="f.id">
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
        <path class="if-bedrock" data-explain="bedrock" :d="bedrockPath" />
        <path class="if-surface" :d="surfacePath" />
        <path class="demo__leader" data-explain="watertable" :d="waterTablePath" />

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
        <path class="if-bedrock" data-explain="bedrock" :d="bedrockPath" />
        <path class="if-surface" :d="surfacePath" />
        <path class="demo__leader" data-explain="watertable" :d="waterTablePath" />

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
        <path class="if-bedrock" data-explain="bedrock" :d="bedrockPath" />
        <path class="if-pavement" data-explain="pavement" :d="pavementPath" />
        <path class="if-surface" :d="surfacePath" />

        <!-- 几乎没有下渗 -->
        <g v-for="a in stubArrows" :key="a.d">
          <path class="if-flow if-flow--weak" :d="a.d" />
          <path class="if-head if-head--weak" :d="a.head" />
        </g>

        <!-- 地表径流汇向低洼处：走在路面上，不从楼里穿过去 -->
        <path class="if-flow" data-explain="urban-runoff" :d="`M 560 176 L 146 176`" />
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
        <g v-for="b in shareBars" :key="b.id" data-explain="share">
          <text class="demo__label" x="150" :y="b.y + 5" text-anchor="end">{{ b.label }}</text>
          <rect class="if-bar" :x="160" :y="b.y - 13" :width="b.width" height="20" rx="3" />
          <text class="demo__label demo__label--mark" :x="160 + b.width + 10" :y="b.y + 5">
            {{ b.percent }}%
          </text>
        </g>

        <path class="demo__leader" d="M 30 196 L 690 196" />

        <text class="demo__label demo__label--mark" x="30" y="224">治理：思路统一——增加下渗</text>
        <g v-for="s in solutions" :key="s.id" data-explain="solutions">
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
  PAVEMENT_THICKNESS,
  PROFILE,
  SOLUTIONS,
  infiltrationArrowLength,
  profileLayers,
  shareBar,
  shareComparison,
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
const pavementPath = `M ${PROFILE.left} ${PROFILE.surfaceY} L ${PROFILE.right} ${PROFILE.surfaceY} L ${PROFILE.right} ${PROFILE.surfaceY + PAVEMENT_THICKNESS} L ${PROFILE.left} ${PROFILE.surfaceY + PAVEMENT_THICKNESS} Z`
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

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * 数字全部由几何函数算好后填进 {占位符}：剖面各层厚度、
 * 下渗占比的差与倍数、条形图长度、箭头长度——不手写。
 */
const layers = profileLayers()
const compare = shareComparison()

const vars = {
  naturalPct: `${INFILTRATION_SHARE.natural}`,
  shallowPct: `${INFILTRATION_SHARE.shallowUrban}`,
  deepPct: `${INFILTRATION_SHARE.deepUrban}`,
  naturalVsShallow: `${compare.naturalVsShallow}`,
  shallowVsDeep: `${compare.shallowVsDeep}`,
  naturalOverDeep: `${compare.naturalOverDeep}`,
  naturalBar: `${shareBar(INFILTRATION_SHARE.natural, 480, 30).toFixed(0)} px`,
  shallowBar: `${shareBar(INFILTRATION_SHARE.shallowUrban, 480, 30).toFixed(0)} px`,
  deepBar: `${shareBar(INFILTRATION_SHARE.deepUrban, 480, 30).toFixed(0)} px`,
  naturalArrow: `${infiltrationArrowLength(INFILTRATION_SHARE.natural, 80, 30).toFixed(1)} px`,
  deepArrow: `${infiltrationArrowLength(INFILTRATION_SHARE.deepUrban, 80, 30).toFixed(1)} px`,
  soilThick: `${layers.soil}`,
  bedrockThick: `${layers.bedrock}`,
  waterDepth: `${layers.depthToWaterTable}`,
  aboveBedrock: `${layers.waterTableAboveBedrock}`,
  pavementThick: `${PAVEMENT_THICKNESS}`,
  factorCount: `${INFILTRATION_FACTORS.length}`,
  solutionCount: `${SOLUTIONS.length}`,
  chainCount: `${FLOOD_CHAIN.length}`,
}

const explains = {
  intensity: {
    name: '条件一：降水强度↓',
    hint: '雨下得急不急——它和下渗成负相关，不是「雨多就渗得多」。',
    vars,
    steps: [
      '第一个条件是雨下得急不急',
      '关系是负相关：降水强度越大越不易下渗——不是雨下得越多渗得越多',
      '原因：土壤的入渗速率有上限，雨太急就超过这个上限，多出来的水只能冲走',
      '所以「下暴雨时渗得最多」是错的',
      '落到数据上：自然路面下渗占 {naturalPct}%，深城只剩 {deepPct}%——城市的问题主要是渗不进去，不只是雨急',
    ],
  },
  slope: {
    name: '条件二：坡度缓',
    hint: '坡越陡，水冲得越快，越来不及渗进土里。',
    vars,
    steps: [
      '第二个条件是地面有多陡',
      '坡缓 → 地表流速慢 → 水有时间往土里钻；坡陡 → 水冲得快，来不及渗',
      '所以坡度缓 → 下渗↑',
      '推论：山区修梯田、坡耕地改等高耕作，实质就是把坡度放缓',
      '题目里若写「坡度大」，后面「下渗增加」的选项一律错',
    ],
  },
  vegetation: {
    name: '条件三：植被覆盖率高',
    hint: '树冠拦一下、枯枝落叶吸水、根系松土——三件事都让水留得久。',
    vars,
    steps: [
      '第三个条件是地面被植物盖住多少',
      '树冠拦一下雨、枯枝落叶层吸水、根系松动土壤——都指向「水留得住」',
      '所以覆盖率越高 → 下渗↑',
      '完整结论链：植被覆盖率高 → 下渗↑ → 地下径流↑ → 地表径流↓',
      '这就是山区要多种树的理由：不下渗就没有地下径流',
    ],
  },
  permeability: {
    name: '条件四：岩层透水',
    hint: '地下是什么岩层，决定了水能渗多深。',
    vars,
    steps: [
      '第四个条件是地下岩层的透水性',
      '岩层透水 → 水能继续往下渗；遇到不透水岩层就渗不动了',
      '所以题里写「岩层坚硬、不透水」时，后面所有「地下径流增加」的选项都错',
      '它决定了下渗能渗多深：剖面里渗到岩层顶就停',
      '剖面里可透水土层厚 {soilThick}，地下水位埋深 {waterDepth}，都还在岩层顶之上',
    ],
  },
  bedrock: {
    name: '不透水岩层',
    hint: '剖面最下面那层，渗下去的水到这里就停。',
    vars,
    steps: [
      '剖面最下面是不透水岩层，它是渗水的「兜底」',
      '水渗到这里渗不动，就积在岩层顶上成为地下水',
      '岩层顶以上是包气带（孔隙里全是空气），以下是饱水带',
      '图上岩层厚 {bedrockThick}，地下水位离岩层顶还有 {aboveBedrock}——说明土层孔隙还没被水填满',
      '所以岩层透水性直接决定地下径流能不能形成',
    ],
  },
  watertable: {
    name: '地下水位',
    hint: '地下水面的高度，画出来是一条水平线，且必须落在可透水土层里。',
    vars,
    steps: [
      '地下水位就是地下水面的高度，画在剖面上是一条水平线',
      '它必须落在可透水土层里——落到岩层里就是画错了',
      '图上埋深 {waterDepth}，离岩层顶还有 {aboveBedrock}',
      '下渗增加 → 地下水位上升（自然地面那一步就标了「地下水位上升」）',
      '地下水位上升 = 地下水变多 = 地下径流增加',
    ],
  },
  pavement: {
    name: '硬化路面',
    hint: '城市的水泥路、沥青路：不透水，下渗的第一道坎。',
    vars,
    steps: [
      '城市下垫面主要是水泥路、沥青路，一点水都渗不进去',
      '雨落在上面渗不下去 → 下渗↓，这就是内涝链条的第一环',
      '剖面里那层 {pavementThick} 厚的路面层就是它的位置',
      '治理的第一条就是反过来做：把地面改造成「能喝水」的',
      '所以「城市内涝」和「海绵城市」是同一件事的两面',
    ],
  },
  'urban-runoff': {
    name: '地表径流与积水',
    hint: '渗不下去的水只能顺地表汇流，低洼处就积成涝。',
    vars,
    steps: [
      '渗不下去的水只能顺着地表汇流',
      '整条链：硬化路面 → 下渗↓ → 地下径流↓ → 地表径流↑ → 地表积水',
      '城市积水不是「水太多」，是「排不出去」——地表汇流比下渗快得多',
      '看到「城市内涝」，先问一句下渗少了多少，后面的选项就能推出来',
      '同一场雨落在自然地面上渗进土壤补给地下水，落在城市地面上积在低洼处',
    ],
  },
  share: {
    name: '下渗占比对比',
    hint: '讲义里的真实例题数据：自然路面 25%、浅城 10%、深城 5%。',
    vars,
    steps: [
      '讲义里的真实例题数据：自然路面 {naturalPct}%、浅城 {shallowPct}%、深城 {deepPct}%',
      '自然路面比浅城高 {naturalVsShallow} 个百分点，浅城比深城高 {shallowVsDeep} 个百分点',
      '深城的下渗只有自然路面的五分之一（相差 {naturalOverDeep} 倍）',
      '条形图长度严格按百分比成正比画：{naturalBar} / {shallowBar} / {deepBar}',
      '剖面里的下渗箭头也按占比折算：自然 {naturalArrow}，深城只剩 {deepArrow}',
    ],
  },
  solutions: {
    name: '治理：思路统一——增加下渗',
    hint: '四条措施都落在同一个动作上：让地面能喝水。',
    vars,
    steps: [
      '治理思路统一：增加下渗',
      `四条措施：${SOLUTIONS.map((s) => s.label).join('、')}`,
      '它们从不同层面把地面改造成「能喝水」的：整体、屋顶、路面、路边',
      '其中植草沟的优点是施工量小、节约成本',
      '明确不可取的一条：加大地下水利用——采得太多会造成地面沉降',
    ],
  },
}
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
