<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 地形剖面：隆起的高原面 -->
      <g v-show="step === 0" class="demo__frame">
        <path class="demo-ground" data-explain="profile" :d="sectionFill" />
        <path class="demo__curve" data-explain="profile" :d="sectionLine" />
        <path class="demo__spin" data-explain="profile" d="M 400 314 L 400 172" />
        <path class="demo__spin-head" data-explain="profile" :d="arrowHead(400, 170, 90, 13)" />
        <text class="demo__label demo__label--mark" x="388" y="218" text-anchor="end">地面以上</text>
        <text
          class="demo__label demo__label--mark"
          data-explain="profile"
          x="388"
          y="238"
          text-anchor="end"
        >
          3—4 千米高
        </text>
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
        <path class="demo-plateau" data-explain="plateau" :d="plateauOutline" />
        <g v-for="a in summerArrows" :key="a.toward">
          <path
            class="demo-vent"
            :class="{ 'demo-vent--faint': !a.reinforce }"
            :data-explain="a.reinforce ? 'summer-vent' : undefined"
            :d="`M ${a.x1} ${a.y1} L ${a.x2} ${a.y2}`"
          />
          <path
            class="demo-vent-head"
            :class="{ 'demo-vent-head--faint': !a.reinforce }"
            :data-explain="a.reinforce ? 'summer-vent' : undefined"
            :d="arrowHead(a.x2, a.y2, a.angle, 13)"
          />
          <text
            class="demo__label"
            :class="a.reinforce ? 'demo__label--mark' : 'demo__label--faint'"
            :data-explain="a.reinforce ? 'summer-vent' : undefined"
            :x="a.labelX"
            :y="a.labelY"
            :text-anchor="a.anchor"
          >
            {{ a.name }}
          </text>
        </g>
        <text class="demo__label demo__label--mark" data-explain="summer-low" x="360" y="196" text-anchor="middle">
          低压
        </text>
        <text
          class="demo__label demo__label--faint"
          data-explain="summer-low"
          x="360"
          y="214"
          text-anchor="middle"
        >
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
        <path class="demo-plateau" data-explain="plateau" :d="plateauOutline" />
        <g v-for="a in winterArrows" :key="a.toward">
          <path
            class="demo-vent"
            :class="{ 'demo-vent--faint': !a.reinforce }"
            :data-explain="a.reinforce ? 'winter-vent' : undefined"
            :d="`M ${a.x1} ${a.y1} L ${a.x2} ${a.y2}`"
          />
          <path
            class="demo-vent-head"
            :class="{ 'demo-vent-head--faint': !a.reinforce }"
            :data-explain="a.reinforce ? 'winter-vent' : undefined"
            :d="arrowHead(a.x2, a.y2, a.angle, 13)"
          />
          <text
            class="demo__label"
            :class="a.reinforce ? 'demo__label--mark' : 'demo__label--faint'"
            :data-explain="a.reinforce ? 'winter-vent' : undefined"
            :x="a.labelX"
            :y="a.labelY"
            :text-anchor="a.anchor"
          >
            {{ a.name }}
          </text>
        </g>
        <text class="demo__label demo__label--mark" data-explain="winter-high" x="360" y="196" text-anchor="middle">
          高压
        </text>
        <text
          class="demo__label demo__label--faint"
          data-explain="winter-high"
          x="360"
          y="214"
          text-anchor="middle"
        >
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
        <rect class="demo-core" data-explain="reinforce" x="280" y="140" width="160" height="72" rx="8" />
        <text
          class="demo__label demo__label--mark"
          data-explain="reinforce"
          x="360"
          y="170"
          text-anchor="middle"
        >
          青藏高原
        </text>
        <text
          class="demo__label demo__label--faint"
          data-explain="reinforce"
          x="360"
          y="192"
          text-anchor="middle"
        >
          高原季风（局地环流）
        </text>

        <g v-for="b in bridges" :key="b.key">
          <path
            class="demo__spin"
            :data-explain="b.explain"
            :d="`M ${b.fromX} ${b.fromY} L ${b.toX} ${b.toY}`"
          />
          <path
            class="demo__spin-head"
            :data-explain="b.explain"
            :d="arrowHead(b.toX, b.toY, b.angle, 12)"
          />
          <rect class="demo-cell" :x="b.boxX" :y="b.boxY" width="180" height="52" rx="6" />
          <text
            class="demo__label demo__label--mark"
            :data-explain="b.explain"
            :x="b.boxX + 90"
            :y="b.boxY + 22"
            text-anchor="middle"
          >
            {{ b.title }}
          </text>
          <text
            class="demo__label demo__label--faint"
            :data-explain="b.explain"
            :x="b.boxX + 90"
            :y="b.boxY + 42"
            text-anchor="middle"
          >
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
  LAPSE_RATE_PER_100M,
  MONSOON_ALIGNMENT,
  PLATEAU_ARROWS,
  PLATEAU_OUTLINE,
  PLATEAU_PROFILE,
  PLATEAU_RELIEF_KM,
  arrowAngle,
  plateauTemperatureDeficit,
  profileScale,
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
const sectionLine = `M 90 ${PLATEAU_PROFILE.groundY} L 200 ${PLATEAU_PROFILE.groundY} L 292 ${PLATEAU_PROFILE.plateauY} L 428 ${PLATEAU_PROFILE.plateauY} L 520 ${PLATEAU_PROFILE.groundY} L 640 ${PLATEAU_PROFILE.groundY}`
const sectionFill = `${sectionLine} L 640 ${PLATEAU_PROFILE.bottomY} L 90 ${PLATEAU_PROFILE.bottomY} Z`

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
    explain: 'summer-bridge',
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
    explain: 'summer-bridge',
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
    explain: 'winter-bridge',
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
    explain: 'winter-bridge',
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

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 高差、比例尺、温差、风向名都从 tibetanPlateauGeometry.js 出。
 */
const explains = computed(() => {
  /** 某个方位的辐散支叫什么风（风向按来向命名，与图上标注同源） */
  const windOf = (toward) => windNameFromToward(toward)
  const diffPx = PLATEAU_PROFILE.groundY - PLATEAU_PROFILE.plateauY
  const deficitMin = plateauTemperatureDeficit(PLATEAU_RELIEF_KM.min)
  const deficitMax = plateauTemperatureDeficit(PLATEAU_RELIEF_KM.max)
  const vars = {
    reliefRange: `${PLATEAU_RELIEF_KM.min}—${PLATEAU_RELIEF_KM.max} 千米`,
    reliefKm: `${PLATEAU_PROFILE.reliefKm} 千米`,
    groundY: String(PLATEAU_PROFILE.groundY),
    plateauY: String(PLATEAU_PROFILE.plateauY),
    diffPx: String(diffPx),
    scale: `${profileScale().toFixed(1)} 米`,
    lapse: String(LAPSE_RATE_PER_100M),
    deficitRange: `${deficitMin.toFixed(0)}—${deficitMax.toFixed(0)}℃`,
    summerNw: windOf('nw'),
    summerNe: windOf('ne'),
    winterSe: windOf('se'),
    winterSw: windOf('sw'),
  }

  return {
    profile: {
      name: '高原面隆起的高度',
      hint: '地面以上 3—4 千米高的一块巨大台地。',
      vars,
      steps: [
        '青藏高原是一片地面以上 {reliefRange}高的台地',
        '图上低地面在 y = {groundY}、高原面在 y = {plateauY}，相差 {diffPx}px',
        '这段高度差对应实际 {reliefKm} ⇒ 比例尺 1px ≈ {scale}',
        '这么高的一块地面本身就是下垫面里的「异类」',
        '它的高度直接决定高原面的冷热性质',
      ],
    },
    plateau: {
      name: '高原面',
      hint: '热力性质跟四周不一样：夏天热、冬天冷。',
      vars,
      steps: [
        '气温随海拔升高而降低，平均每 100 米降约 {lapse}℃',
        '高原面比四周低地高 {reliefRange}',
        '同一高度比较，高原面上空比低地低 {deficitRange}',
        '冬季：高原面比四周冷 → 冷源',
        '夏季：高原面直接吸收太阳辐射 → 热源',
      ],
    },
    'summer-low': {
      name: '夏季：高原面形成低压',
      hint: '热源 → 空气上升 → 近地面形成低压中心。',
      vars,
      steps: [
        '夏季高原面受热，比周围低地热，成为相对热源',
        '近地面空气受热膨胀上升 → 高原面上空形成相对低压',
        '近地面气压比四周低 ⇒ 低压中心',
        '低压中心的气流辐散：四周的空气向高原面汇过来，再抬升',
      ],
    },
    'summer-vent': {
      name: '夏季辐散的两支',
      hint: '指向西北、东北的两支，与东亚、南亚的夏季风同向。',
      vars,
      steps: [
        '高原面是热源 → 低压 → 气流从高原面辐散出去',
        '箭头指去处，风向说来向——两者差 180°',
        '指向西北的一支来向是东南 ⇒ {summerNw}',
        '指向东北的一支来向是西南 ⇒ {summerNe}',
        '这两支正好与东亚夏季风、南亚夏季风同向 ⇒ 叠加',
      ],
    },
    'winter-high': {
      name: '冬季：高原面形成高压',
      hint: '冷源 → 空气下沉 → 近地面形成高压中心。',
      vars,
      steps: [
        '高原面高出四周 {reliefRange}，气温比同高度的低地低 {deficitRange}',
        '冬季高原面冷却快，成为相对冷源',
        '近地面空气冷却变重下沉 → 高原面上空形成相对高压',
        '高压中心的气流同样辐散',
      ],
    },
    'winter-vent': {
      name: '冬季辐散的两支',
      hint: '指向东南、西南的两支，与东亚、南亚的冬季风同向。',
      vars,
      steps: [
        '高原面是冷源 → 高压 → 气流照样从高原面辐散出去',
        '箭头指去处，风向说来向',
        '指向东南的一支来向是西北 ⇒ {winterSe}',
        '指向西南的一支来向是东北 ⇒ {winterSw}',
        '这两支与东亚冬季风、南亚冬季风同向 ⇒ 叠加；高原同时还是阻挡冷空气的屏障',
      ],
    },
    'summer-bridge': {
      name: '夏季：与季风同向叠加',
      hint: '高原指向西北、东北的两支，分别与东亚、南亚夏季风同向。',
      vars,
      steps: [
        '东亚夏季风是东南风，南亚夏季风是西南风',
        '高原指向西北的一支正是 {summerNw}，与东亚夏季风同向',
        '高原指向东北的一支正是 {summerNe}，与南亚夏季风同向',
        '同向就是叠加：两股气流朝一个方向，风速与水量都变大',
      ],
    },
    'winter-bridge': {
      name: '冬季：与季风同向叠加',
      hint: '高原指向东南、西南的两支，分别与东亚、南亚冬季风同向。',
      vars,
      steps: [
        '东亚冬季风是西北风，南亚冬季风是东北风',
        '高原指向东南的一支正是 {winterSe}，与东亚冬季风同向',
        '高原指向西南的一支正是 {winterSw}，与南亚冬季风同向',
        '同向就是叠加：冬季风因此更强，高原还挡住冷空气南下',
      ],
    },
    reinforce: {
      name: '高原季风（局地环流）',
      hint: '高原面自己冬夏冷热差异形成的小环流，叠在季风之上。',
      vars,
      steps: [
        '高原面夏天热、冬天冷 → 高原面自己就有一套季风',
        '它是局地环流，叠在海陆热力差异造成的季风之上',
        '冬夏两季的两支辐散风都与对应的季风同向 ⇒ 都是加强',
        '所以无论东亚还是南亚、无论冬夏，青藏高原都起加强作用',
      ],
    },
  }
})
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
