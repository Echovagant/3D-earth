<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- ① 冬季的北半球 -->
      <g v-show="step === 0" class="demo__frame">
        <circle class="demo-grid-circle" :cx="view.cx" :cy="view.cy" :r="view.rMax" />
        <circle class="demo-grid-circle" :cx="view.cx" :cy="view.cy" :r="view.rMax / 3" />
        <circle class="demo-grid-circle" :cx="view.cx" :cy="view.cy" :r="(view.rMax * 2) / 3" />
        <g class="demo__grid">
          <path
            v-for="m in meridians"
            :key="m.lon"
            :d="`M ${view.cx} ${view.cy} L ${m.x} ${m.y}`"
          />
        </g>
        <circle class="demo__cut" :cx="view.cx" :cy="view.cy" r="4" />
        <text class="demo__label demo__label--faint" :x="view.cx" :y="view.cy - view.rMax - 12" text-anchor="middle">
          180°
        </text>
        <text class="demo__label demo__label--faint" :x="view.cx" :y="view.cy + view.rMax + 20" text-anchor="middle">
          0°
        </text>
        <text class="demo__label demo__label--faint" :x="view.cx + view.rMax + 12" :y="view.cy + 4" text-anchor="middle">
          90°E
        </text>
        <text class="demo__label demo__label--faint" :x="view.cx - view.rMax - 12" :y="view.cy + 4" text-anchor="middle">
          90°W
        </text>
        <text class="demo__label demo__label--faint" :x="view.cx" :y="view.cy + 4" text-anchor="middle">北极点</text>

        <g v-for="c in winterPoints" :key="c.key">
          <circle class="demo__cut" :cx="c.x" :cy="c.y" r="11" />
          <text class="demo__label demo__label--light" :x="c.x" :y="c.y + 4" text-anchor="middle">
            {{ c.no }}
          </text>
        </g>

        <g v-for="c in winter" :key="`l${c.key}`">
          <circle class="demo__cut" :cx="legendX" :cy="c.ly" r="10" />
          <text class="demo__label demo__label--light" :x="legendX" :y="c.ly + 4" text-anchor="middle">
            {{ c.no }}
          </text>
          <text class="demo__label demo__label--mark" :x="legendX + 22" :y="c.ly + 4">{{ c.name }}</text>
          <text class="demo__label demo__label--faint" :x="legendX + 22" :y="c.ly + 24">{{ c.note }}</text>
        </g>

        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          冬季：陆地是冷源 → 冷高压（蒙古—西伯利亚、北美）；海洋是热源 → 热低压（阿留申、冰岛）
        </text>
      </g>

      <!-- ② 夏季的北半球 -->
      <g v-show="step === 1" class="demo__frame">
        <circle class="demo-grid-circle" :cx="view.cx" :cy="view.cy" :r="view.rMax" />
        <circle class="demo-grid-circle" :cx="view.cx" :cy="view.cy" :r="view.rMax / 3" />
        <circle class="demo-grid-circle" :cx="view.cx" :cy="view.cy" :r="(view.rMax * 2) / 3" />
        <g class="demo__grid">
          <path
            v-for="m in meridians"
            :key="m.lon"
            :d="`M ${view.cx} ${view.cy} L ${m.x} ${m.y}`"
          />
        </g>
        <circle class="demo__cut" :cx="view.cx" :cy="view.cy" r="4" />
        <text class="demo__label demo__label--faint" :x="view.cx" :y="view.cy - view.rMax - 12" text-anchor="middle">
          180°
        </text>
        <text class="demo__label demo__label--faint" :x="view.cx" :y="view.cy + view.rMax + 20" text-anchor="middle">
          0°
        </text>
        <text class="demo__label demo__label--faint" :x="view.cx + view.rMax + 12" :y="view.cy + 4" text-anchor="middle">
          90°E
        </text>
        <text class="demo__label demo__label--faint" :x="view.cx - view.rMax - 12" :y="view.cy + 4" text-anchor="middle">
          90°W
        </text>
        <text class="demo__label demo__label--faint" :x="view.cx" :y="view.cy + 4" text-anchor="middle">北极点</text>

        <g v-for="c in summerPoints" :key="c.key">
          <circle class="demo__cut" :cx="c.x" :cy="c.y" r="11" />
          <text class="demo__label demo__label--light" :x="c.x" :y="c.y + 4" text-anchor="middle">
            {{ c.no }}
          </text>
        </g>

        <g v-for="c in summer" :key="`l${c.key}`">
          <circle class="demo__cut" :cx="legendX" :cy="c.ly" r="10" />
          <text class="demo__label demo__label--light" :x="legendX" :y="c.ly + 4" text-anchor="middle">
            {{ c.no }}
          </text>
          <text class="demo__label demo__label--mark" :x="legendX + 22" :y="c.ly + 4">{{ c.name }}</text>
          <text class="demo__label demo__label--faint" :x="legendX + 22" :y="c.ly + 24">{{ c.note }}</text>
        </g>

        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          夏季：陆地是热源 → 热低压（印度、北美）；海洋是冷源 → 冷高压（夏威夷、亚速尔）
        </text>
      </g>

      <!-- ③ 气压带被顶断，留下的是气压中心 -->
      <g v-show="step === 2" class="demo__frame">
        <g v-for="b in belts" :key="b.name">
          <rect
            class="demo-belt"
            :class="{ 'demo-belt--target': b.target }"
            :x="beltsX"
            :y="b.y"
            width="220"
            height="52"
          />
          <text class="demo__label" :x="beltsX + 12" :y="b.y + 31">{{ b.name }}</text>
          <text class="demo__label demo__label--faint" :x="beltsX + 208" :y="b.y + 31" text-anchor="end">
            {{ b.lat }}
          </text>
        </g>

        <!-- 冬季：陆地冷高压南下，顶断副极地低气压带 -->
        <text class="demo__label demo__label--mark" x="150" y="96" text-anchor="middle">
          冬季（1 月）
        </text>
        <text class="demo__label" x="150" y="122" text-anchor="middle">陆地冷高压南下</text>
        <path class="demo__spin" d="M 96 140 L 232 140" />
        <path class="demo__spin-head" :d="arrowHead(236, 140, 0, 12)" />
        <text class="demo__label demo__label--faint" x="150" y="216" text-anchor="middle">
          顶断副极地低气压带
        </text>
        <text class="demo__label demo__label--mark" x="150" y="242" text-anchor="middle">
          海上留下阿留申低压、冰岛低压
        </text>

        <!-- 夏季：陆地热低压北上，顶断副热带高气压带 -->
        <text class="demo__label demo__label--mark" x="570" y="168" text-anchor="middle">
          夏季（7 月）
        </text>
        <text class="demo__label" x="570" y="194" text-anchor="middle">陆地热低压北上</text>
        <path class="demo__spin" d="M 624 212 L 488 212" />
        <path class="demo__spin-head" :d="arrowHead(484, 212, 180, 12)" />
        <text class="demo__label demo__label--faint" x="570" y="256" text-anchor="middle">
          顶断副热带高气压带
        </text>
        <text class="demo__label demo__label--mark" x="570" y="282" text-anchor="middle">
          海上留下夏威夷高压、亚速尔高压
        </text>

        <text class="demo__caption-line" x="360" y="330" text-anchor="middle">
          被顶断的是气压带，留下的是气压中心
        </text>
        <text class="demo__label demo__label--faint" x="360" y="352" text-anchor="middle">
          气压带并没有消失——它退到海上，改了名字
        </text>
      </g>

      <!-- ④ 南北半球季节相反 -->
      <g v-show="step === 3" class="demo__frame">
        <text class="demo__label demo__label--faint" x="320" y="96" text-anchor="middle">1 月</text>
        <text class="demo__label demo__label--faint" x="530" y="96" text-anchor="middle">7 月</text>
        <text class="demo__label demo__label--faint" x="120" y="166" text-anchor="middle">北半球</text>
        <text class="demo__label demo__label--faint" x="120" y="262" text-anchor="middle">南半球</text>

        <rect class="demo-cell" x="210" y="112" width="220" height="86" rx="6" />
        <rect class="demo-cell demo-cell--warm" x="430" y="112" width="220" height="86" rx="6" />
        <rect class="demo-cell demo-cell--warm" x="210" y="208" width="220" height="86" rx="6" />
        <rect class="demo-cell" x="430" y="208" width="220" height="86" rx="6" />

        <text class="demo__label demo__label--mark" x="320" y="146" text-anchor="middle">冬季</text>
        <text class="demo__label demo__label--faint" x="320" y="170" text-anchor="middle">
          亚洲高压（蒙古—西伯利亚）
        </text>
        <text class="demo__label demo__label--mark" x="540" y="146" text-anchor="middle">夏季</text>
        <text class="demo__label demo__label--faint" x="540" y="170" text-anchor="middle">
          亚洲低压（印度低压）
        </text>
        <text class="demo__label demo__label--mark" x="320" y="242" text-anchor="middle">夏季</text>
        <text class="demo__label demo__label--faint" x="320" y="266" text-anchor="middle">
          澳洲大陆为热低压
        </text>
        <text class="demo__label demo__label--mark" x="540" y="242" text-anchor="middle">冬季</text>
        <text class="demo__label demo__label--faint" x="540" y="266" text-anchor="middle">
          澳洲大陆为冷高压
        </text>

        <text class="demo__caption-line" x="360" y="326" text-anchor="middle">
          北半球夏季以 7 月为代表，南半球夏季以 1 月为代表
        </text>
        <text class="demo__label demo__label--faint" x="360" y="350" text-anchor="middle">
          用错半球的月份是最常见的错；南纬 30° 以南只是「不显著」，不是没有
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §7.12 北半球冬夏季的高低气压中心。
 *
 * 老师讲这节时那句「那些有名有姓的高低压中心，都是被顶断的气压带改了名」，
 * 学生最容易混的是「冬季亚洲是高压、夏季是低压」和「南北半球季节相反」。
 *
 * 四步：
 *   ① 冬季的北半球 —— 俯视图上的四个气压中心
 *   ② 夏季的北半球 —— 同样四个位置，类型全反
 *   ③ 气压带被顶断 —— 被顶断的是气压带，留下的是气压中心
 *   ④ 南北半球季节相反 —— 1 月 / 7 月 × 南 / 北半球
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { arrowHead } from '../../data/svgParts'
import {
  SUMMER_CENTERS,
  WINTER_CENTERS,
  polarProjection,
} from '../../data/pressureCentersGeometry'

const steps = [
  {
    id: 'winter',
    title: '① 冬季的北半球',
    text: '北半球冬季是一月。陆地比海洋冷得快，是冷源，近地面形成冷高压：亚欧大陆上是蒙古—西伯利亚高压（亚洲高压），北美大陆上是北美高压。海洋反而是热源，留下阿留申低压（北太平洋）和冰岛低压（北大西洋）。',
  },
  {
    id: 'summer',
    title: '② 夏季的北半球',
    text: '北半球夏季是七月，正好反过来：陆地是热源，形成印度低压（亚洲低压）和北美低压；海洋是冷源，留下夏威夷高压（西北太平洋副高）和亚速尔高压（北大西洋）。记住口诀：冬天大陆高压、海洋低压，夏天大陆低压、海洋高压。',
  },
  {
    id: 'cut',
    title: '③ 被顶断的是气压带，留下的是气压中心',
    text: '这些有名有姓的中心，原本都是整齐的气压带。冬季陆地上的冷高压势力太强，把副极地低气压带顶断了，断掉的部分退到海上，改名叫阿留申低压、冰岛低压；夏季陆地的热低压把副热带高气压带顶断，海上剩下的就是夏威夷高压、亚速尔高压。气压带没有消失，只是被顶断了。',
  },
  {
    id: 'hemisphere',
    title: '④ 南北半球季节相反',
    text: '地球绕太阳转，南北半球朝向太阳的时间正好错开半年：北半球夏季是 7 月，南半球夏季就是 1 月。所以看到「某地是热低压」时，先确认是哪个半球，再定季节。用错半球的月份，是这类题最常见的失分点。',
  },
]

/** 极地俯视图 */
const view = { cx: 205, cy: 190, rMax: 118 }
const project = polarProjection(view.cx, view.cy, view.rMax)

/** 经线：每 30° 一根 */
const meridians = computed(() =>
  Array.from({ length: 12 }, (_, i) => {
    const lon = i * 30
    const p = project(0, lon)
    return { lon, x: p.x, y: p.y }
  }),
)

const legendX = 358
const winter = computed(() =>
  WINTER_CENTERS.map((c, i) => ({ ...c, ly: 118 + i * 48 })),
)
const summer = computed(() =>
  SUMMER_CENTERS.map((c, i) => ({ ...c, ly: 118 + i * 48 })),
)

const winterPoints = computed(() =>
  WINTER_CENTERS.map((c) => ({ ...c, ...project(c.lat, c.lon) })),
)
const summerPoints = computed(() =>
  SUMMER_CENTERS.map((c) => ({ ...c, ...project(c.lat, c.lon) })),
)

/** ③ 气压带 */
const beltsX = 250
const belts = computed(() => [
  { name: '极地高气压带', lat: '90°', y: 62, target: false },
  { name: '副极地低气压带', lat: '60°', y: 116, target: true },
  { name: '副热带高气压带', lat: '30°', y: 170, target: true },
  { name: '赤道低气压带', lat: '0°', y: 224, target: false },
])
</script>

<style scoped>
.demo-belt {
  fill: var(--learn-panel);
  stroke: var(--learn-line);
  stroke-width: 1.3;
}

/* 极地俯视图的纬线圈：共享层的 .demo__grid 只管 path，circle 要自己定义 */
.demo-grid-circle {
  fill: none;
  stroke: var(--learn-grid);
  stroke-width: 1;
}

.demo-belt--target {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-accent);
}

.demo-cell {
  fill: var(--learn-panel);
  stroke: var(--learn-line);
  stroke-width: 1.4;
}

.demo-cell--warm {
  fill: var(--learn-accent-soft);
  fill-opacity: 0.55;
}

.demo__label--light {
  fill: var(--learn-panel);
}
</style>
