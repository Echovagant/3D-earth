<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- ① 地形剖面：隆起的高原面 -->
      <g v-show="step === 0" class="demo__frame">
        <path class="demo-ground" :d="sectionFill" />
        <path class="demo__curve" :d="sectionLine" />
        <path class="demo__spin" d="M 400 314 L 400 172" />
        <path class="demo__spin-head" :d="arrowHead(400, 170, 90, 13)" />
        <text class="demo__label demo__label--mark" x="388" y="218" text-anchor="end">地面以上</text>
        <text class="demo__label demo__label--mark" x="388" y="238" text-anchor="end">3—4 千米高</text>
        <text class="demo__label demo__label--mark" x="360" y="140" text-anchor="middle">
          青藏高原面
        </text>
        <text class="demo__label demo__label--faint" x="140" y="272">西侧低地</text>
        <text class="demo__label demo__label--faint" x="580" y="272">东侧低地</text>
        <text class="demo__caption-line" x="360" y="336" text-anchor="middle">
          3—4 千米高的高原面，本身就能把大气的运动改掉
        </text>
        <text class="demo__label demo__label--faint" x="360" y="358" text-anchor="middle">
          高原的热力性质跟四周不一样：夏天热、冬天冷
        </text>
      </g>

      <!-- ② 夏季：高原面是热源 → 低压 → 辐散 -->
      <g v-show="step === 1" class="demo__frame">
        <path class="demo-plateau" :d="plateauOutline" />
        <g v-for="a in summerArrows" :key="a.toward">
          <path
            class="demo-vent"
            :class="{ 'demo-vent--faint': !a.reinforce }"
            :d="`M ${a.x1} ${a.y1} L ${a.x2} ${a.y2}`"
          />
          <path
            class="demo-vent-head"
            :class="{ 'demo-vent-head--faint': !a.reinforce }"
            :d="arrowHead(a.x2, a.y2, a.angle, 13)"
          />
          <text
            class="demo__label"
            :class="a.reinforce ? 'demo__label--mark' : 'demo__label--faint'"
            :x="a.labelX"
            :y="a.labelY"
            :text-anchor="a.anchor"
          >
            {{ a.name }}
          </text>
        </g>
        <text class="demo__label demo__label--mark" x="360" y="196" text-anchor="middle">
          低压
        </text>
        <text class="demo__label demo__label--faint" x="360" y="214" text-anchor="middle">
          高原面是热源
        </text>
        <text class="demo__caption-line" x="360" y="320" text-anchor="middle">
          夏季：高原面受热形成低压，气流从高原面辐散出去
        </text>
        <text class="demo__label demo__label--faint" x="360" y="342" text-anchor="middle">
          指向西北、东北的两支与夏季风同向（风向指来向，箭头指去处）
        </text>
      </g>

      <!-- ③ 冬季：高原面是冷源 → 高压 → 辐散 -->
      <g v-show="step === 2" class="demo__frame">
        <path class="demo-plateau" :d="plateauOutline" />
        <g v-for="a in winterArrows" :key="a.toward">
          <path
            class="demo-vent"
            :class="{ 'demo-vent--faint': !a.reinforce }"
            :d="`M ${a.x1} ${a.y1} L ${a.x2} ${a.y2}`"
          />
          <path
            class="demo-vent-head"
            :class="{ 'demo-vent-head--faint': !a.reinforce }"
            :d="arrowHead(a.x2, a.y2, a.angle, 13)"
          />
          <text
            class="demo__label"
            :class="a.reinforce ? 'demo__label--mark' : 'demo__label--faint'"
            :x="a.labelX"
            :y="a.labelY"
            :text-anchor="a.anchor"
          >
            {{ a.name }}
          </text>
        </g>
        <text class="demo__label demo__label--mark" x="360" y="196" text-anchor="middle">
          高压
        </text>
        <text class="demo__label demo__label--faint" x="360" y="214" text-anchor="middle">
          高原面是冷源
        </text>
        <text class="demo__caption-line" x="360" y="320" text-anchor="middle">
          冬季：高原面冷却形成高压，气流同样从高原面辐散出去
        </text>
        <text class="demo__label demo__label--faint" x="360" y="342" text-anchor="middle">
          指向东南、西南的两支与冬季风同向
        </text>
      </g>

      <!-- ④ 与季风同向 → 加强 -->
      <g v-show="step === 3" class="demo__frame">
        <rect class="demo-core" x="280" y="140" width="160" height="72" rx="8" />
        <text class="demo__label demo__label--mark" x="360" y="170" text-anchor="middle">
          青藏高原
        </text>
        <text class="demo__label demo__label--faint" x="360" y="192" text-anchor="middle">
          高原季风（局地环流）
        </text>

        <g v-for="b in bridges" :key="b.key">
          <path class="demo__spin" :d="`M ${b.fromX} ${b.fromY} L ${b.toX} ${b.toY}`" />
          <path class="demo__spin-head" :d="arrowHead(b.toX, b.toY, b.angle, 12)" />
          <rect class="demo-cell" :x="b.boxX" :y="b.boxY" width="180" height="52" rx="6" />
          <text class="demo__label demo__label--mark" :x="b.boxX + 90" :y="b.boxY + 22" text-anchor="middle">
            {{ b.title }}
          </text>
          <text class="demo__label demo__label--faint" :x="b.boxX + 90" :y="b.boxY + 42" text-anchor="middle">
            {{ b.sub }}
          </text>
        </g>

        <text class="demo__caption-line" x="360" y="322" text-anchor="middle">
          高原季风与季风同向叠加 → 无论东亚南亚、无论冬夏，都起加强作用
        </text>
        <text class="demo__label demo__label--faint" x="360" y="346" text-anchor="middle">
          它是叠在季风之上的局地环流，不是独立于海陆热力差异的第三套机制
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §7.16 青藏高原对季风的加强作用（高原季风）。
 *
 * 老师讲这节那句「高原面夏天是热源成低压、冬天是冷源成高压」，
 * 学生缺的是「辐散出去的风到底叫什么、往哪吹」这幅画。
 *
 * 四步：
 *   ① 地形剖面 —— 高原面隆起 3—4 千米
 *   ② 夏季 —— 热源 → 低压 → 辐散
 *   ③ 冬季 —— 冷源 → 高压 → 辐散
 *   ④ 与季风同向叠加 → 加强
 *
 * 风向一律按「来向」命名：箭头指去处，名字说反方向。
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { arrowHead } from '../../data/svgParts'
import {
  MONSOON_ALIGNMENT,
  PLATEAU_ARROWS,
  PLATEAU_OUTLINE,
  arrowAngle,
  windNameFromToward,
} from '../../data/tibetanPlateauGeometry'

const steps = [
  {
    id: 'profile',
    title: '① 高原面：地面以上 3—4 千米',
    text: '青藏高原是一片地面以上 3—4 千米高的巨大台地。这么高的一块地面本身就是下垫面里的「异类」——它的热力性质跟四周不一样，所以能在大气里形成自己的环流。',
  },
  {
    id: 'summer',
    title: '② 夏季：高原面是热源，成低压',
    text: '夏季高原面受热，比周围低地热，成为相对热源，空气上升、近地面形成低压中心，气流从高原面辐散出去。辐散出去的风向要按来向命名：指向西北的那支是东南风，指向东北的那支是西南风——正好与东亚、南亚的夏季风同向。',
  },
  {
    id: 'winter',
    title: '③ 冬季：高原面是冷源，成高压',
    text: '冬季反过来：高原面冷却快，成为相对冷源，形成高压中心，气流同样从高原面辐散出去。指向东南的那支是西北风，指向西南的那支是东北风，与东亚、南亚的冬季风同向——冬季高原面还是阻挡冷空气的屏障，同样加强冬季风。',
  },
  {
    id: 'reinforce',
    title: '④ 同向叠加，所以是加强',
    text: '结论：青藏高原的隆起，无论对东亚还是南亚，无论夏季风还是冬季风，都起加强作用。注意它不是独立于海陆热力差异的第三套机制，而是高原面自身冬夏冷热差异形成的局地环流，叠加在季风之上。',
  },
]

/** ① 地形剖面 */
const sectionLine = 'M 90 288 L 200 288 L 292 158 L 428 158 L 520 288 L 640 288'
const sectionFill = `${sectionLine} L 640 320 L 90 320 Z`

/** 高原面轮廓 */
const plateauOutline = PLATEAU_OUTLINE

/** ② ③ 辐散箭头 */
const buildArrows = (season) =>
  MONSOON_ALIGNMENT[season].map((m) => {
    const geo = PLATEAU_ARROWS.find((a) => a.toward === m.toward)
    const toward = m.toward
    const anchor = toward === 'nw' || toward === 'sw' ? 'end' : 'start'
    const labelX = toward === 'nw' || toward === 'sw' ? geo.x2 - 10 : geo.x2 + 10
    const labelY = toward === 'nw' || toward === 'ne' ? geo.y2 - 14 : geo.y2 + 22
    return {
      ...geo,
      ...m,
      name: windNameFromToward(toward),
      angle: arrowAngle(toward),
      anchor,
      labelX,
      labelY,
    }
  })

const summerArrows = computed(() => buildArrows('summer'))
const winterArrows = computed(() => buildArrows('winter'))

/** ④ 高原季风与季风的对应 */
const bridges = computed(() => [
  {
    key: 'ea-summer',
    title: '东亚夏季风（东南风）',
    sub: '高原指向西北的一支同向叠加',
    boxX: 60,
    boxY: 56,
    fromX: 285,
    fromY: 162,
    toX: 240,
    toY: 82,
    angle: 118.5,
  },
  {
    key: 'sa-summer',
    title: '南亚夏季风（西南风）',
    sub: '高原指向东北的一支同向叠加',
    boxX: 480,
    boxY: 56,
    fromX: 435,
    fromY: 162,
    toX: 480,
    toY: 82,
    angle: 61.5,
  },
  {
    key: 'ea-winter',
    title: '东亚冬季风（西北风）',
    sub: '高原指向东南的一支同向叠加',
    boxX: 60,
    boxY: 244,
    fromX: 285,
    fromY: 218,
    toX: 240,
    toY: 270,
    angle: -129.3,
  },
  {
    key: 'sa-winter',
    title: '南亚冬季风（东北风）',
    sub: '高原指向西南的一支同向叠加',
    boxX: 480,
    boxY: 244,
    fromX: 435,
    fromY: 218,
    toX: 480,
    toY: 270,
    angle: -50.7,
  },
])
</script>

<style scoped>
.demo-ground {
  fill: var(--learn-line);
  fill-opacity: 0.55;
  stroke: none;
}

.demo-plateau {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-accent);
  stroke-width: 1.6;
}

.demo-vent {
  fill: none;
  stroke: var(--learn-accent);
  stroke-width: 2.6;
  stroke-linecap: round;
}

.demo-vent--faint {
  stroke: var(--learn-grid);
  stroke-width: 1.8;
}

.demo-vent-head {
  fill: var(--learn-accent);
}

.demo-vent-head--faint {
  fill: var(--learn-grid);
}

.demo-core {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-accent);
  stroke-width: 1.6;
}

.demo-cell {
  fill: var(--learn-panel);
  stroke: var(--learn-line);
  stroke-width: 1.4;
}
</style>
