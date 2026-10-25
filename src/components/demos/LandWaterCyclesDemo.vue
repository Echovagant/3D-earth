<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 逻辑图全貌 -->
      <g v-show="step === 0" class="demo__frame">
        <g v-for="l in links" :key="l.id" :data-explain="EXPLAIN_OF_LINK[l.id]">
          <path
            class="lw-line"
            :class="step === 1 && !l.isTriangle ? 'lw-line--soft' : ''"
            :d="l.d"
          />
          <path
            v-for="(h, hi) in l.heads"
            :key="hi"
            class="lw-head"
            :class="step === 1 && !l.isTriangle ? 'lw-head--soft' : ''"
            :d="h"
          />
        </g>

        <g v-for="n in nodeList" :key="n.id" :data-explain="EXPLAIN_OF_NODE[n.id]">
          <rect
            class="lw-node"
            :class="n.mark ? 'lw-node--mark' : ''"
            :x="n.x - n.w / 2"
            :y="n.y - 13"
            :width="n.w"
            height="26"
            rx="13"
          />
          <text
            class="demo__label"
            :class="n.mark ? 'demo__label--mark' : ''"
            :x="n.x"
            :y="n.y + 4"
            text-anchor="middle"
          >
            {{ n.label }}
          </text>
        </g>

        <text class="demo__label demo__label--faint" x="360" y="346" text-anchor="middle">
          蒸发 → 水汽输送 → 大气降水：这张图要靠水循环闭上
        </text>
      </g>

      <!-- ② 铁三角：相互转化 -->
      <g v-show="step === 1" class="demo__frame">
        <g v-for="l in links" :key="l.id" :data-explain="EXPLAIN_OF_LINK[l.id]">
          <path
            class="lw-line"
            :class="step === 1 && !l.isTriangle ? 'lw-line--soft' : ''"
            :d="l.d"
          />
          <path
            v-for="(h, hi) in l.heads"
            :key="hi"
            class="lw-head"
            :class="step === 1 && !l.isTriangle ? 'lw-head--soft' : ''"
            :d="h"
          />
        </g>

        <g v-for="n in nodeList" :key="n.id" :data-explain="EXPLAIN_OF_NODE[n.id]">
          <rect
            class="lw-node"
            :class="n.mark ? 'lw-node--mark' : ''"
            :x="n.x - n.w / 2"
            :y="n.y - 13"
            :width="n.w"
            height="26"
            rx="13"
          />
          <text
            class="demo__label"
            :class="n.mark ? 'demo__label--mark' : ''"
            :x="n.x"
            :y="n.y + 4"
            text-anchor="middle"
          >
            {{ n.label }}
          </text>
        </g>

        <text class="demo__label demo__label--mark" x="360" y="312" text-anchor="middle">
          铁三角：河流、湖泊、地下水三者两两之间都存在双向补给
        </text>
        <text class="demo__label demo__label--faint" x="360" y="336" text-anchor="middle">
          「红色箭头」= 双向：两个方向都能走，汛期枯水期切换
        </text>
      </g>

      <!-- ③ 汛期 / 枯水期：补给方向会切换 -->
      <g v-show="step === 2" class="demo__frame">
        <g v-for="n in triangleNodes" :key="n.id" :data-explain="EXPLAIN_OF_NODE[n.id]">
          <rect
            class="lw-node lw-node--mark"
            :x="n.x - n.w / 2"
            :y="n.y - 13"
            :width="n.w"
            height="26"
            rx="13"
          />
          <text class="demo__label demo__label--mark" :x="n.x" :y="n.y + 4" text-anchor="middle">
            {{ n.label }}
          </text>
        </g>
        <g v-for="t in triangleLinks" :key="t.id" data-explain="triangle">
          <path class="lw-line" :d="t.d" />
          <path v-for="(h, hi) in t.heads" :key="hi" class="lw-head" :d="h" />
        </g>

        <text class="demo__label" x="40" y="242">
          汛期：河流水位高 → 河流补给地下水；河水多，存入外流湖
        </text>
        <text class="demo__label" x="40" y="266">
          枯水期：地下水位高 → 地下水补给河流；湖水补给河流水位
        </text>

        <g v-for="k in lakeKinds" :key="k.id" data-explain="lake">
          <rect class="lw-chip" :x="k.x" y="286" width="330" height="56" rx="8" />
          <text class="demo__label demo__label--mark" :x="k.x + 16" y="310">
            {{ k.label }} · {{ k.mark }}
          </text>
          <text class="demo__label demo__label--faint" :x="k.x + 16" y="330">
            {{ k.role }}
          </text>
        </g>
      </g>

      <!-- ④ 修水库 + 为什么把海洋留在图里 -->
      <g v-show="step === 3" class="demo__frame">
        <text class="demo__label demo__label--mark" x="30" y="46">兴修水库：改写的是地表径流的分配</text>

        <path class="lw-reservoir" data-explain="reservoir" d="M 60 196 L 300 196 L 300 236 L 60 236 Z" />
        <path class="lw-dam" d="M 300 190 L 322 190 L 322 250 L 300 250 Z" />
        <path class="lw-river" data-explain="reservoir" d="M 322 238 L 660 238 L 660 248 L 322 248 Z" />
        <path class="lw-line" d="M 60 236 L 300 236" />

        <text class="demo__label" x="180" y="220" text-anchor="middle">库区（蓄水）</text>
        <text class="demo__label" x="311" y="268" text-anchor="middle">坝体</text>
        <text class="demo__label" x="500" y="234" text-anchor="middle">下游河道</text>

        <path class="lw-flow" data-explain="reservoir" d="M 120 176 L 120 196" />
        <path class="lw-head" data-explain="reservoir" :d="arrowHead(120, 196, -90, 12)" />
        <text class="demo__label demo__label--faint" x="132" y="184">丰水期蓄水</text>

        <text class="demo__label" x="30" y="300">
          下游：丰水期下泄流量减少（洪峰被削），枯水期放水 → 地表径流被重新分配
        </text>
        <text class="demo__label" x="30" y="326">
          库区：水位抬高 → 库区地下水位上升、地下水增加
        </text>
        <text class="demo__label demo__label--faint" x="30" y="356">
          海洋留在图里，是为了保证逻辑闭合：陆地水最后都要回到海洋，再蒸发上天
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §11.6 陆地水体之间的相互转化。
 *
 * 讲义的核心只有一句：**两个水体只要连通，水位高的就补给水位低的**。
 * 所以这张图上凡是双向箭头（讲义里的「红色箭头」）都是两个方向都能走，
 * 随汛期、枯水期切换；单向箭头方向才是固定的。
 *
 * 节点位置与连线方向都算好放在 landWaterCyclesGeometry.js 里，
 * 组件只负责画。
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { arrowHead } from '../../data/svgParts'
import {
  LAKE_KINDS,
  LINKS,
  NODES,
  SEASON_SWITCH,
  directionAngle,
  incomingSources,
  linksFrom,
  node,
} from '../../data/landWaterCyclesGeometry'

const steps = [
  {
    id: 'map',
    title: '① 陆地水体的逻辑图',
    text: '这张图必须能背着画下来，每一条线都是考点。起点是大气降水，它分雨和雪两条线：雨有三条去处——直接蒸发、形成地表径流（即河流）、下渗形成地下水；雪变成季节性积雪，再压成冰川，夏季消融以地表径流形式补给河流。河流往外流河入海，或注入内流湖、消失于沙漠。别漏掉植被——蒸腾也是陆地内循环的一环。',
  },
  {
    id: 'triangle',
    title: '② 铁三角：它们是相互转化的',
    text: '河流、湖泊、地下水三者两两之间都存在双向补给，老师叫它「铁三角」。这不是三个独立的水体在各自流动，而是一套互相倒来倒去的平衡——所以图上「红色箭头」两个方向都能走，只看箭头不分方向就会把最关键的信息丢掉。',
  },
  {
    id: 'season',
    title: '③ 汛期与枯水期：方向会切换',
    text: '汛期河流水位高，河水补给地下水；枯水期地下水水位更稳定、相对更高，地下水反过来补给河水。湖泊也一样：外流湖有进有出，丰水期河水存进去、枯水期湖水补出来，像河流的「银行」；内流湖有进无出，水进得来出不去，盐分越积越浓，所以多是咸水湖。判别内流湖外流湖看的是有没有出湖径流，不是咸淡。',
  },
  {
    id: 'reservoir',
    title: '④ 现实里的例子：修水库',
    text: '兴修水库就是改写地表径流的分配：丰水期蓄水、枯水期放水，下游丰水期的下泄流量减少，洪峰被削；库区水位抬高，地下水位跟着上升。另外别把海洋从这张图里删掉——陆地水最后都要回到海洋，再蒸发上天变成降水，删掉海洋整个逻辑就不闭合了。',
  },
]

/** 节点方框的宽度按字数算 */
const nodeWidth = (label) => label.length * 13 + 18

/** 一条直线段：路径 + 箭头 */
function seg(from, to, size = 11) {
  return {
    d: `M ${from.x} ${from.y} L ${to.x} ${to.y}`,
    head: arrowHead(to.x, to.y, directionAngle(from.x, from.y, to.x, to.y), size),
  }
}

/**
 * 连线的走法：
 *   普通 —— 直连；
 *   bottom —— 先绕到画面下缘，从左边上来，接到河流的左缘。
 */
function linkPath(link) {
  if (link.via === 'bottom') {
    return {
      d: 'M 620 269 L 620 320 L 318 320 L 318 181',
      heads: [arrowHead(318, 181, 90, 11)],
    }
  }
  const a = link.a ?? node(link.from)
  const b = link.b ?? node(link.to)
  const straight = seg(a, b)
  return { d: straight.d, heads: [straight.head] }
}

/** 铁三角那三条：单独算，端点贴着方框边缘 */
const TRIANGLE_SEGMENTS = {
  'river-groundwater': [
    { x: 285, y: 182 },
    { x: 130, y: 243 },
  ],
  'river-lake': [
    { x: 312, y: 182 },
    { x: 218, y: 243 },
  ],
  'lake-groundwater': [
    { x: 178, y: 256 },
    { x: 138, y: 256 },
  ],
}

/**
 * 逻辑图上的全部连线。
 * soft = true 的连线在第②步被压暗，突出铁三角。
 */
const links = computed(() =>
  LINKS.map((link) => {
    const isTriangle = link.both === true
    let d
    let heads
    if (isTriangle) {
      const [from, to] = TRIANGLE_SEGMENTS[link.id]
      const straight = seg(from, to)
      d = straight.d
      heads = [
        straight.head,
        arrowHead(from.x, from.y, directionAngle(to.x, to.y, from.x, from.y), 11),
      ]
    } else {
      const p = linkPath(link)
      d = p.d
      heads = p.heads
    }
    return { id: link.id, d, heads, isTriangle }
  }),
)

/** 逻辑图上的节点 */
const nodeList = computed(() =>
  Object.entries(NODES).map(([id, n]) => ({
    id,
    label: n.label,
    x: n.x,
    y: n.y,
    w: nodeWidth(n.label),
    mark: id === 'precipitation',
  })),
)

/** ③ 铁三角单独放大 */
const triangleNodes = computed(() =>
  [
    { id: 'river', label: '河流', x: 360, y: 76 },
    { id: 'lake', label: '湖泊', x: 180, y: 180 },
    { id: 'groundwater', label: '地下水', x: 540, y: 180 },
  ].map((n) => ({ ...n, w: nodeWidth(n.label) })),
)

/** 三角的三条边：端点贴着方框边缘，别压在文字上 */
const TRIANGLE_EDGES = [
  [
    { x: 348, y: 89 },
    { x: 196, y: 167 },
  ],
  [
    { x: 372, y: 89 },
    { x: 524, y: 167 },
  ],
  [
    { x: 206, y: 180 },
    { x: 514, y: 180 },
  ],
]

const triangleLinks = computed(() =>
  TRIANGLE_EDGES.map(([from, to], i) => {
    const straight = seg(from, to)
    return {
      id: `edge-${i}`,
      d: straight.d,
      heads: [
        straight.head,
        arrowHead(from.x, from.y, directionAngle(to.x, to.y, from.x, from.y), 11),
      ],
    }
  }),
)

/** 外流湖 / 内流湖 */
const lakeKinds = computed(() =>
  LAKE_KINDS.map((k, i) => ({ ...k, x: 30 + i * 340 })),
)

/**
 * 讲解层的挂点表：节点 → 说明 id。
 *
 * 季节性积雪与冰川并进「雪」那一条链——它们是同一段过程的两步，
 * 拆成两条说明只会多出一份重复而说不清的话。
 */
const EXPLAIN_OF_NODE = {
  precipitation: 'precipitation',
  rain: 'rain',
  snow: 'snow',
  snowpack: 'snow',
  glacier: 'snow',
  evaporation: 'evaporation',
  river: 'river',
  groundwater: 'groundwater',
  lake: 'lake',
  ocean: 'ocean',
}

/** 讲解层的挂点表：连线 → 说明 id */
const EXPLAIN_OF_LINK = {
  'precip-rain': 'rain',
  'precip-snow': 'snow',
  'rain-evaporation': 'evaporation',
  'rain-river': 'river',
  'rain-groundwater': 'groundwater',
  'snow-snowpack': 'snow',
  'snowpack-glacier': 'snow',
  'glacier-river': 'snow',
  'river-groundwater': 'triangle',
  'river-lake': 'triangle',
  'lake-groundwater': 'triangle',
  'river-ocean': 'ocean',
  'ocean-precipitation': 'ocean',
}

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 连线有几条、水体有几对双向补给，都从 landWaterCyclesGeometry.js 出。
 */
const explains = computed(() => {
  const vars = {
    nodeCount: String(Object.keys(NODES).length),
    linkCount: String(LINKS.length),
    precipBranches: String(linksFrom('precipitation').length),
    rainBranches: String(linksFrom('rain').length),
    riverSources: String(incomingSources('river')),
    floodState: SEASON_SWITCH[0].state,
    floodResult: SEASON_SWITCH[0].result,
    lowState: SEASON_SWITCH[1].state,
    lowResult: SEASON_SWITCH[1].result,
    outflowMark: LAKE_KINDS[0].mark,
    inflowMark: LAKE_KINDS[1].mark,
    outflowSalt: LAKE_KINDS[0].salt,
    inflowSalt: LAKE_KINDS[1].salt,
  }

  return {
    precipitation: {
      name: '大气降水',
      hint: '整张图的起点——它分成雨和雪两条线。',
      vars,
      steps: [
        '大气降水是这张逻辑图的起点，它分雨、雪两条线',
        `雨有 ${vars.rainBranches} 条去处，雪只有 1 条：压成冰川`,
        `全图共 ${vars.nodeCount} 个水体节点、${vars.linkCount} 条连线`,
        '别漏掉植被——蒸腾也是陆地内循环的一环',
      ],
    },
    rain: {
      name: '雨',
      hint: '雨有三条去处：直接蒸发、地表径流、下渗。',
      vars,
      steps: [
        '雨是降水里最直接的一支',
        `雨有 ${vars.rainBranches} 条去处：直接蒸发、形成地表径流（河流）、下渗形成地下水`,
        '下渗那一支补给地下水，形成地下水这一环',
        '地表径流那一支汇入河流，是陆地水循环的主干',
      ],
    },
    snow: {
      name: '雪 → 季节性积雪 → 冰川',
      hint: '雪先存成积雪，再压成冰川，夏季消融回到河流。',
      vars,
      steps: [
        '雪不会直接变成水，先存成季节性积雪',
        '压不实、融不掉的部分变成冰川（永久积雪）',
        '冰川到夏季消融，以地表径流的形式补给河流',
        '所以高山、高纬的水是靠「夏季消融」这一条线回到河流的',
        '图上这条线绕到画面下缘再插进河流——不是新的一条线',
      ],
    },
    evaporation: {
      name: '蒸发·蒸腾',
      hint: '水回到大气的出口，陆地内循环靠它闭合。',
      vars,
      steps: [
        '蒸发与蒸腾是陆地水回到大气的出口',
        '蒸发：水面与土壤表面的水变成水汽；蒸腾：植物把根系吸的水经叶片蒸到空气里',
        '所以陆地内循环也闭得上：降水 → 蒸发·蒸腾 → 水汽输送 → 降水',
        '海陆之间还有一条更大的回路：海洋蒸发 → 水汽输送 → 陆地降水 → 径流回海',
      ],
    },
    river: {
      name: '河流（地表径流）',
      hint: '地表径流的载体，也是陆地水循环的主干。',
      vars,
      steps: [
        '河流就是地表径流的载体',
        `汇入河流的有 ${vars.riverSources} 路：雨形成的地表径流、冰雪融水、地下水补给、湖泊（丰水期蓄、枯水期放）`,
        '河流往下走：注入海洋（外流河），或注入内流湖、消失在沙漠',
        '河流水位高时它补给地下水，低时反过来——所以河与地下水是双向的',
      ],
    },
    groundwater: {
      name: '地下水',
      hint: '下渗补给的那一支水，藏在岩石孔隙里。',
      vars,
      steps: [
        '地下水 = 下渗补给 + 岩石孔隙里存着的那部分水',
        '下渗是单向的：雨往下渗',
        '但地下水位与河流水位谁高会变，所以「地下水补给河流」与「河流补给地下水」都能发生',
        '它是「慢」的水：滞留时间长、变化滞后，汛期过后才慢慢补到河里',
      ],
    },
    lake: {
      name: '湖泊（外流湖 / 内流湖）',
      hint: '判据是有没有出湖径流，不是咸淡。',
      vars,
      steps: [
        '湖泊有两类，判据是「有没有出湖径流」，不是咸淡',
        `外流湖：${vars.outflowMark} → 丰水期河水存进去、枯水期湖水补出来，对河流起调蓄作用，${vars.outflowSalt}`,
        `内流湖：${vars.inflowMark} → 水进得来出不去（靠蒸发外流），盐分越积越浓，${vars.inflowSalt}`,
        '所以咸水湖不一定就是内流湖，淡水湖也可能是内流湖——看有没有出湖径流',
      ],
    },
    ocean: {
      name: '海洋',
      hint: '陆地水的最终归宿，也是大气水汽的主要来源。',
      vars,
      steps: [
        '外流河把陆地水送回海洋 → 海水蒸发 → 水汽输送 → 降水回到陆地',
        '这条闭合的回路叫海陆间循环（大循环），水量最大',
        '海洋也是大气水汽的主要来源（见海上内循环那一节）',
        '所以别把海洋从这张图里删掉——删掉整个逻辑就不闭合了',
      ],
    },
    triangle: {
      name: '铁三角：双向补给',
      hint: '河流、湖泊、地下水两两之间都能互相补给。',
      vars,
      steps: [
        '总原则只有一条：两个水体只要连通，水位高的就补给水位低的',
        `汛期（${vars.floodState}）→ ${vars.floodResult}`,
        `枯水期（${vars.lowState}）→ ${vars.lowResult}`,
        '所以图上「红色箭头」两个方向都能走，方向随汛期枯水期切换',
        '只看箭头不分方向，就把这道题最关键的信息丢掉了',
      ],
    },
    reservoir: {
      name: '兴修水库',
      hint: '改写的是地表径流的分配——什么时候流、走多少。',
      vars,
      steps: [
        '兴修水库改的是地表径流的分配，不是水循环本身',
        '丰水期蓄水：库区水位抬高 → 库区地下水位跟着上升、地下水增加',
        '枯水期放水：下游枯水期的流量增加',
        '丰水期下泄流量减少 → 洪峰被削',
        '所以它改的是「什么时候流、走多少」，水循环的环并没有变',
      ],
    },
  }
})
</script>

<style scoped>
/* 只用共享层已有的变量，不新增色值 */
.lw-node {
  fill: var(--learn-panel);
  stroke: var(--learn-line);
  stroke-width: 1;
}

.lw-node--mark {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-accent);
  stroke-width: 1;
}

.lw-line {
  fill: none;
  stroke: var(--learn-accent);
  stroke-width: 2;
  stroke-linecap: round;
}

.lw-line--soft {
  stroke: var(--learn-ink-faint);
  stroke-width: 1.4;
}

.lw-head {
  fill: var(--learn-accent);
}

.lw-head--soft {
  fill: var(--learn-ink-faint);
}

.lw-chip {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-accent);
  stroke-width: 1;
}

.lw-reservoir {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-accent);
  stroke-width: 1;
}

.lw-dam {
  fill: var(--learn-day-edge);
  stroke: var(--learn-ink-soft);
  stroke-width: 1;
}

.lw-river {
  fill: var(--learn-accent);
  opacity: 0.55;
}
</style>
