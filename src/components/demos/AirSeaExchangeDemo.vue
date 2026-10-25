<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 水分交换的一圈 ② 反向也通：合起来是海上内循环 -->
      <g v-for="i in [0, 1]" :key="i" v-show="step === i" class="demo__frame">
        <circle class="as-sun" data-explain="solar" cx="72" cy="58" r="20" />
        <g class="as-ray" data-explain="solar">
          <path v-for="d in sunRays" :key="d" :d="d" />
        </g>

        <path class="as-sea" :d="seaPath" />
        <path class="as-land" :d="landPath" />
        <g class="as-cloud" data-explain="cloud">
          <ellipse
            v-for="b in CLOUD.blobs"
            :key="b.cx"
            :cx="b.cx"
            :cy="b.cy"
            :rx="b.rx"
            :ry="b.ry"
          />
        </g>

        <g v-for="w in waterLoop" :key="w.id" :data-explain="EXPLAIN_OF_FLOW[w.id]">
          <path class="as-flow" :d="w.d" />
          <path class="as-head" :d="w.head" />
        </g>

        <text class="demo__label demo__label--faint" x="162" y="210">蒸发（吸热）</text>
        <text class="demo__label demo__label--faint" x="238" y="142">凝结成云</text>
        <text class="demo__label demo__label--faint" x="238" y="160">放热</text>
        <text class="demo__label demo__label--mark" x="310" y="196">降水</text>
        <text class="demo__label demo__label--faint" x="600" y="190" text-anchor="middle">降水到陆地</text>
        <text class="demo__label" x="270" y="312" text-anchor="middle">海洋</text>
        <text class="demo__label" x="595" y="288" text-anchor="middle">陆地</text>

        <g v-if="i === 1">
          <circle class="as-badge" data-explain="vapor-share" cx="620" cy="82" r="40" />
          <text class="as-badge-text" data-explain="vapor-share" x="620" y="90" text-anchor="middle">
            {{ vaporPercent }}
          </text>
          <text
            class="demo__label demo__label--faint"
            data-explain="vapor-share"
            x="620"
            y="146"
            text-anchor="middle"
          >
            大气中的水汽来自海洋
          </text>
          <text class="demo__label demo__label--faint" x="620" y="166" text-anchor="middle">（老师说不用记）</text>
          <text class="demo__caption-line" x="360" y="356" text-anchor="middle">
            蒸发给水汽、降水还水量 → 合起来就是海上内循环，水量最大
          </text>
        </g>
        <g v-else>
          <text class="demo__caption-line" x="360" y="356" text-anchor="middle">
            海洋就像大气的「水汽供应机」：海水受热蒸发上升，遇冷凝结成云
          </text>
        </g>
      </g>

      <!-- ③ 热量交换：潜热 + 长波辐射 -->
      <g v-show="step === 2" class="demo__frame">
        <path class="as-sea" :d="`M 40 264 L 690 264 L 690 300 L 40 300 Z`" />
        <path class="as-surface" d="M 40 264 L 690 264" />

        <g v-for="h in heatArrows" :key="h.id" :data-explain="h.id">
          <path class="as-flow" :d="h.d" />
          <path class="as-head" :d="h.head" />
        </g>

        <text class="demo__label demo__label--mark" x="196" y="150">潜热输送</text>
        <text class="demo__label demo__label--faint" x="196" y="170">
          蒸发吸热 → 海面降温
        </text>
        <text class="demo__label demo__label--faint" x="196" y="188">
          凝结放热 → 大气增温
        </text>
        <text class="demo__label demo__label--faint" x="196" y="206">
          水分交换时把热量运上去
        </text>
        <text class="demo__label demo__label--mark" x="470" y="150">长波辐射</text>
        <text class="demo__label demo__label--faint" x="470" y="170">
          海面把热量交给大气
        </text>
        <text class="demo__label demo__label--faint" x="470" y="188">
          海面温度越高，释放越多
        </text>

        <path class="demo__leader" d="M 30 316 L 690 316" />
        <text class="demo__label" data-explain="solar" x="30" y="340">{{ HEAT_STORAGE.text }}</text>
        <text class="demo__label demo__label--mark" data-explain="solar" x="30" y="362">
          {{ HEAT_STORAGE.conclusion }}
        </text>
      </g>

      <!-- ④ 环流：海洋给热量，大气给动力 -->
      <g v-show="step === 3" class="demo__frame">
        <path class="as-sea" :d="`M 40 220 L 690 220 L 690 300 L 40 300 Z`" />
        <path class="as-surface" d="M 40 220 L 690 220" />

        <!-- 海洋 → 大气：热量 -->
        <path class="as-flow" data-explain="heat-to-atmosphere" d="M 150 220 L 150 110" />
        <path
          class="as-head"
          data-explain="heat-to-atmosphere"
          :d="arrowHead(150, 110, 90, 14)"
        />
        <text class="demo__label demo__label--mark" x="168" y="140">
          海洋 → 大气：热量（热力因素）
        </text>
        <text class="demo__label demo__label--faint" x="168" y="160">
          大气受热上升，才有了大气环流
        </text>

        <!-- 大气 → 海洋：动力 -->
        <path class="as-flow" data-explain="power-to-ocean" d="M 470 110 L 470 226" />
        <path class="as-head" data-explain="power-to-ocean" :d="arrowHead(470, 226, -90, 14)" />
        <text class="demo__label demo__label--mark" x="488" y="140">
          大气 → 海洋：动力（风）
        </text>
        <text class="demo__label demo__label--faint" x="488" y="160">
          风推动海水形成风海流
        </text>

        <!-- 表层风推着海水走 -->
        <path class="as-flow" data-explain="power-to-ocean" d="M 570 250 L 400 250" />
        <path class="as-head" data-explain="power-to-ocean" :d="arrowHead(400, 250, 180, 16)" />
        <text class="demo__label demo__label--faint" x="485" y="278" text-anchor="middle">
          表层风 → 风海流
        </text>

        <path class="demo__leader" d="M 30 316 L 690 316" />
        <text class="demo__label" x="30" y="340">
          大气环流与洋流把低纬度的热量带到高纬度，也把冷海水带到低纬度
        </text>
        <text class="demo__label demo__label--mark" x="30" y="362">
          维持地球的水分与热量平衡：低纬不至于太热，高纬不至于太冷
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §11.15 海气相互作用：水分交换、热量交换与环流。
 *
 * 老师的说法是「海洋是热量的仓库加大气的水汽供应机，大气是发动机加传送带」，
 * 这一节要补的就是那台机器怎么转：两边各给一样东西——海洋给**热量**，
 * 大气给**动力（风）**。这一对最容易被记反，图上标死了。
 *
 * 另外「大气中约 87.5% 的水汽来自海洋」老师说过不用记，图上标一下即可。
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { arrowHead } from '../../data/svgParts'
import {
  CLOUD,
  HEAT_CHANNELS,
  HEAT_STORAGE,
  STAGE,
  VAPOR_FROM_OCEAN_PERCENT,
  WATER_LOOP,
  directionAngle,
  latentHeatText,
} from '../../data/airSeaExchangeGeometry'

const steps = [
  {
    id: 'moisture',
    title: '① 水分交换：海洋 → 大气 → 海洋',
    text: '太阳辐射照到海面，海水受热蒸发变成水汽进入大气——海洋就像大气的「水汽供应机」。水汽上升遇冷凝结成云，成云致雨，大部分降水又落回海面，一部分落到陆地。这就是海上内循环，也是水循环三种类型里水量最大的一种。',
  },
  {
    id: 'both-ways',
    title: '② 反向也通：合起来才是海上内循环',
    text: '水分交换是双向的：海洋经蒸发给大气水汽，大气经凝结降水给海洋补水。大气中约 87.5% 的水汽来自海洋——这个数据老师说不用记，记住「海洋是大气的水汽供应机」就行。蒸发与降水合起来就是海上内循环；径流是海陆之间的作用，不属于海气相互作用。',
  },
  {
    id: 'heat',
    title: '③ 热量交换：潜热是隐形的那条通道',
    text: '海洋给大气的热量走两条路：一是潜热——蒸发吸热、凝结放热，水分交换的同时把热量偷偷摸摸运上去，这是分析温度变化时最常被忽略的一点；二是长波辐射。海洋吸收了到达地表太阳辐射的大部分，其中 85% 的热量储存在海洋表层，所以海洋是大气最主要的热量储存库。',
  },
  {
    id: 'circulation',
    title: '④ 环流：海洋给热量，大气给动力',
    text: '一句话总结：海洋给大气的主要是热量（热力因素），大气给海洋的主要是动力（风）。风推动海水形成风海流——洋流三大成因里最常见的一种。大气环流与洋流遍布全球，把水分和热量在不同纬度之间搬运，维持地球的水分与热量平衡。',
  },
]

const seaPath = `M ${STAGE.seaLeft} ${STAGE.seaSurfaceY} L ${STAGE.seaRight} ${STAGE.seaSurfaceY} L ${STAGE.seaRight} ${STAGE.seaBottomY} L ${STAGE.seaLeft} ${STAGE.seaBottomY} Z`
const landPath = `M ${STAGE.landLeft} ${STAGE.landTopY} L ${STAGE.landRight} ${STAGE.landTopY} L ${STAGE.landRight} ${STAGE.seaBottomY} L ${STAGE.landLeft} ${STAGE.seaBottomY} Z`

/** 阳光从太阳射向海面——收在蒸发箭头左边，不与它交叉 */
const sunRays = [
  'M 96 44 L 132 84',
  'M 96 58 L 132 98',
  'M 96 72 L 132 112',
]

/** 水分交换的几条线 */
const waterLoop = computed(() =>
  WATER_LOOP.map((w) => ({
    ...w,
    d: `M ${w.from.x} ${w.from.y} L ${w.to.x} ${w.to.y}`,
    head: arrowHead(w.to.x, w.to.y, directionAngle(w.from.x, w.from.y, w.to.x, w.to.y), 13),
  })),
)

/** 热量通道的两条线：都从海面往上 */
const heatArrows = computed(() =>
  HEAT_CHANNELS.map((h, i) => {
    const x = i === 0 ? 170 : 450
    const from = { x, y: 260 }
    const to = { x, y: 120 }
    return {
      ...h,
      d: `M ${from.x} ${from.y} L ${to.x} ${to.y}`,
      head: arrowHead(to.x, to.y, 90, 13),
    }
  }),
)

/** 徽章上的百分比：数值由几何文件给出，不写死在模板里 */
const vaporPercent = `${VAPOR_FROM_OCEAN_PERCENT}%`

/** 讲解层的挂点表：水分交换的一条线 → 说明 id */
const EXPLAIN_OF_FLOW = {
  evaporation: 'evaporation',
  condensation: 'cloud',
  'precipitation-sea': 'precip-sea',
  'precipitation-land': 'precip-land',
}

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 87.5%、85%、汽化潜热都从 airSeaExchangeGeometry.js 出。
 */
const explains = computed(() => {
  const vars = {
    vaporPercent: `${VAPOR_FROM_OCEAN_PERCENT}%`,
    heatPercent: `${HEAT_STORAGE.percent}%`,
    latentHeat: latentHeatText(),
    seaSurfaceY: String(STAGE.seaSurfaceY),
    cloudY: String(CLOUD.y),
  }

  return {
    solar: {
      name: '太阳辐射与海洋储热',
      hint: '海洋是太阳辐射的主要接收者，也是大气的热量仓库。',
      vars,
      steps: [
        '太阳辐射照到海面，是这一节所有过程的能量来源',
        '海洋吸收了到达地表太阳辐射的大部分',
        `其中 ${vars.heatPercent} 的热量储存在海洋表层`,
        '所以海洋是大气最主要的热量储存库，大气温度主要来自海洋',
        '「水汽供应机」与「热量仓库」这两件事，源头都是太阳辐射',
      ],
    },
    evaporation: {
      name: '蒸发（吸热）',
      hint: '海水受热变成水汽进入大气——海洋是水汽供应机。',
      vars,
      steps: [
        '海水受热蒸发变成水汽进入大气，海洋就是大气的「水汽供应机」',
        '蒸发要吸热：每蒸发 1 千克水，约从海面带走 {latentHeat} 的热量',
        '这一份热量跟着水汽一起被运到高空——这就是潜热输送',
        '所以海面会因为蒸发而降温',
        '陆地上同样的过程叫蒸腾，由植被完成',
      ],
    },
    cloud: {
      name: '凝结成云（放热）',
      hint: '水汽上升遇冷凝结，放出的热量正好补回蒸发吸走的。',
      vars,
      steps: [
        '水汽上升遇冷凝结成云，凝结放热',
        '放出的热量正好等于当初蒸发吸走的那一份',
        '所以空气在上升、冷却、凝结的过程中被加热',
        '云就是凝结的产物——图上那几团椭圆',
        '图上云底在 y = {cloudY}，比海面（y = {seaSurfaceY}）高出一大截',
      ],
    },
    'precip-sea': {
      name: '降水落回海面',
      hint: '合起来就是海上内循环——水循环里水量最大的一种。',
      vars,
      steps: [
        '云里的水滴长大到一定程度就落下来，这就是降水',
        '落回海面的那一部分走的是海上内循环：海洋 → 蒸发 → 水汽输送 → 降水 → 海洋',
        '它是水循环三种类型里水量最大的一种',
        '因为绝大部分海面都在蒸发，绝大部分降水也落在海上',
      ],
    },
    'precip-land': {
      name: '降水到陆地',
      hint: '落到陆地的水走的是海陆间循环（大循环）。',
      vars,
      steps: [
        '另一部分降水落在陆地上',
        '落到陆地的水走的是海陆间循环（大循环）：海洋 → 蒸发 → 水汽输送 → 陆地降水 → 径流回海',
        '径流是海与陆之间的作用，不属于海气相互作用',
        '所以判断「这算不算海气相互作用」，看有没有跨过海陆这条界线',
      ],
    },
    'vapor-share': {
      name: '大气中的水汽来自海洋',
      hint: '有数量支撑的结论：海洋是大气的主要水汽来源。',
      vars,
      steps: [
        '大气中的水汽有 {vaporPercent} 来自海洋',
        '原因：海洋面积远大于陆地，蒸发面也远大于陆地',
        '所以「海洋是大气的水汽供应机」这句话是有数量支撑的',
        '老师说这个数据不用记——记住结论就行',
      ],
    },
    latent: {
      name: '潜热输送',
      hint: '水分交换时顺带把热量运上去——隐形的那条通道。',
      vars,
      steps: [
        '潜热 = 水分交换时顺带运走的热量',
        '蒸发吸热 → 海面降温；凝结放热 → 大气增温',
        '数量级：每 1 千克水汽带走 {latentHeat}',
        '这是分析温度变化时最常被忽略的一条通道——图上没画温度，热量真的在动',
        '它与长波辐射并列为海洋给大气的两条通道',
      ],
    },
    longwave: {
      name: '长波辐射',
      hint: '海面把热量以电磁波的形式直接交给大气。',
      vars,
      steps: [
        '海洋把热量以长波辐射的形式交给大气',
        '海面温度越高，释放的长波辐射越多',
        '这条通道不伴随水分交换——热是以辐射的方式直接过去的',
        '所以海陆之间既有潜热通道，也有辐射通道',
      ],
    },
    'heat-to-atmosphere': {
      name: '海洋 → 大气：热量',
      hint: '海洋给大气的主要是热量——热力因素。',
      vars,
      steps: [
        '海洋给大气的主要是热量（热力因素）',
        '两条通道：潜热（随水汽运上去）+ 长波辐射（直接辐射过去）',
        '大气受热膨胀上升，才有了大气环流',
        '记住这一对：海洋给热量、大气给动力——最容易记反的就是这里',
      ],
    },
    'power-to-ocean': {
      name: '大气 → 海洋：动力（风）',
      hint: '大气给海洋的主要是风，风推着表层海水走。',
      vars,
      steps: [
        '大气给海洋的主要是动力（风）',
        '风推动表层海水形成风海流——洋流三大成因里最常见的一种',
        '大气环流与洋流把低纬度的热量带到高纬度，也把冷海水带到低纬度',
        '合起来维持地球的水分与热量平衡：低纬不至于太热，高纬不至于太冷',
      ],
    },
  }
})
</script>

<style scoped>
/* 只用共享层已有的变量，不新增色值 */
.as-sea {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-accent);
  stroke-width: 1;
}

.as-land {
  fill: var(--learn-day);
  stroke: var(--learn-day-edge);
  stroke-width: 1;
}

.as-surface {
  fill: none;
  stroke: var(--learn-ink-soft);
  stroke-width: 1.5;
}

.as-cloud ellipse {
  fill: var(--learn-panel);
  stroke: var(--learn-ink-faint);
  stroke-width: 1;
}

.as-sun {
  fill: var(--learn-sun);
}

.as-ray path {
  fill: none;
  stroke: var(--learn-sun);
  stroke-width: 2;
  opacity: 0.75;
}

.as-flow {
  fill: none;
  stroke: var(--learn-accent);
  stroke-width: 2.5;
  stroke-linecap: round;
}

.as-head {
  fill: var(--learn-accent);
}

.as-badge {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-accent);
  stroke-width: 1.2;
}

.as-badge-text {
  font-size: 24px;
  font-weight: 700;
  fill: var(--learn-accent);
}
</style>
