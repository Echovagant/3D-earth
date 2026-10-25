<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 冬季的北半球 -->
      <g v-show="step === 0" class="demo__frame">
        <circle
          class="demo-grid-circle"
          data-explain="polar-view"
          :cx="view.cx"
          :cy="view.cy"
          :r="view.rMax"
        />
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
          <circle
            class="demo__cut"
            :data-explain="c.surface === 'land' ? 'winter-land' : 'winter-sea'"
            :cx="c.x"
            :cy="c.y"
            r="11"
          />
          <text
            class="demo__label demo__label--light"
            :data-explain="c.surface === 'land' ? 'winter-land' : 'winter-sea'"
            :x="c.x"
            :y="c.y + 4"
            text-anchor="middle"
          >
            {{ c.no }}
          </text>
        </g>

        <g v-for="c in winter" :key="`l${c.key}`">
          <circle
            class="demo__cut"
            :data-explain="c.surface === 'land' ? 'winter-land' : 'winter-sea'"
            :cx="legendX"
            :cy="c.ly"
            r="10"
          />
          <text
            class="demo__label demo__label--light"
            :data-explain="c.surface === 'land' ? 'winter-land' : 'winter-sea'"
            :x="legendX"
            :y="c.ly + 4"
            text-anchor="middle"
          >
            {{ c.no }}
          </text>
          <text
            class="demo__label demo__label--mark"
            :data-explain="c.surface === 'land' ? 'winter-land' : 'winter-sea'"
            :x="legendX + 22"
            :y="c.ly + 4"
          >
            {{ c.name }}
          </text>
          <text class="demo__label demo__label--faint" :x="legendX + 22" :y="c.ly + 24">{{ c.note }}</text>
        </g>

        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          冬季：陆地是冷源 → 冷高压（蒙古—西伯利亚、北美）；海洋是热源 → 热低压（阿留申、冰岛）
        </text>
      </g>

      <!-- ② 夏季的北半球 -->
      <g v-show="step === 1" class="demo__frame">
        <circle
          class="demo-grid-circle"
          data-explain="polar-view"
          :cx="view.cx"
          :cy="view.cy"
          :r="view.rMax"
        />
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
          <circle
            class="demo__cut"
            :data-explain="c.surface === 'land' ? 'summer-land' : 'summer-sea'"
            :cx="c.x"
            :cy="c.y"
            r="11"
          />
          <text
            class="demo__label demo__label--light"
            :data-explain="c.surface === 'land' ? 'summer-land' : 'summer-sea'"
            :x="c.x"
            :y="c.y + 4"
            text-anchor="middle"
          >
            {{ c.no }}
          </text>
        </g>

        <g v-for="c in summer" :key="`l${c.key}`">
          <circle
            class="demo__cut"
            :data-explain="c.surface === 'land' ? 'summer-land' : 'summer-sea'"
            :cx="legendX"
            :cy="c.ly"
            r="10"
          />
          <text
            class="demo__label demo__label--light"
            :data-explain="c.surface === 'land' ? 'summer-land' : 'summer-sea'"
            :x="legendX"
            :y="c.ly + 4"
            text-anchor="middle"
          >
            {{ c.no }}
          </text>
          <text
            class="demo__label demo__label--mark"
            :data-explain="c.surface === 'land' ? 'summer-land' : 'summer-sea'"
            :x="legendX + 22"
            :y="c.ly + 4"
          >
            {{ c.name }}
          </text>
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
            data-explain="belts"
            :x="beltsX"
            :y="b.y"
            width="220"
            height="52"
          />
          <text class="demo__label" :x="beltsX + 12" :y="b.y + 31">{{ b.name }}</text>
          <text class="demo__label demo__label--faint" :x="beltsX + 208" :y="b.y + 31" text-anchor="end">
            {{ b.lat }}°
          </text>
        </g>

        <!-- 冬季：陆地冷高压南下，顶断副极地低气压带 -->
        <text class="demo__label demo__label--mark" x="150" y="96" text-anchor="middle">
          冬季（1 月）
        </text>
        <text class="demo__label" x="150" y="122" text-anchor="middle">陆地冷高压南下</text>
        <path class="demo__spin" data-explain="winter-push" d="M 96 140 L 232 140" />
        <path class="demo__spin-head" data-explain="winter-push" :d="arrowHead(236, 140, 0, 12)" />
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
        <path class="demo__spin" data-explain="summer-push" d="M 624 212 L 488 212" />
        <path class="demo__spin-head" data-explain="summer-push" :d="arrowHead(484, 212, 180, 12)" />
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

        <rect class="demo-cell" data-explain="seasons" x="210" y="112" width="220" height="86" rx="6" />
        <rect
          class="demo-cell demo-cell--warm"
          data-explain="seasons"
          x="430"
          y="112"
          width="220"
          height="86"
          rx="6"
        />
        <rect
          class="demo-cell demo-cell--warm"
          data-explain="seasons"
          x="210"
          y="208"
          width="220"
          height="86"
          rx="6"
        />
        <rect class="demo-cell" data-explain="seasons" x="430" y="208" width="220" height="86" rx="6" />

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
  BELTS,
  SUMMER_CENTERS,
  WINTER_CENTERS,
  polarProjection,
  polarRadius,
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
const belts = computed(() =>
  BELTS.map((b, i) => ({ ...b, y: [62, 116, 170, 224][i] })),
)

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 气压中心的经纬度、俯视图半径、气压带纬度全从 pressureCentersGeometry.js 出。
 */
const explains = computed(() => {
  /** 某个中心在图上的位置：俯视图的极坐标 */
  const placeOf = (c) =>
    `纬度 ${c.lat}°、经度 ${c.lon}° → 俯视图半径 ${polarRadius(c.lat, view.rMax).toFixed(0)}px`
  const winterLand = WINTER_CENTERS.filter((c) => c.surface === 'land')
  const winterSea = WINTER_CENTERS.filter((c) => c.surface === 'sea')
  const summerLand = SUMMER_CENTERS.filter((c) => c.surface === 'land')
  const summerSea = SUMMER_CENTERS.filter((c) => c.surface === 'sea')

  const vars = {
    rMax: String(view.rMax),
    beltSubpolar: `${BELTS[1].name}（${BELTS[1].lat}°）`,
    beltSubtropical: `${BELTS[2].name}（${BELTS[2].lat}°）`,
    beltPolar: `${BELTS[0].name}（${BELTS[0].lat}°）`,
    beltEquatorial: `${BELTS[3].name}（${BELTS[3].lat}°）`,
    winterLandNames: winterLand.map((c) => c.name).join('、'),
    winterSeaNames: winterSea.map((c) => c.name).join('、'),
    summerLandNames: summerLand.map((c) => c.name).join('、'),
    summerSeaNames: summerSea.map((c) => c.name).join('、'),
    asiaPlace: placeOf(WINTER_CENTERS[0]),
    alaskaPlace: placeOf(WINTER_CENTERS[1]),
    icelandPlace: placeOf(WINTER_CENTERS[2]),
    indiaPlace: placeOf(SUMMER_CENTERS[0]),
    hawaiiPlace: placeOf(SUMMER_CENTERS[1]),
    azoresPlace: placeOf(SUMMER_CENTERS[2]),
  }

  return {
    'polar-view': {
      name: '极地俯视图',
      hint: '从北极上空往下看：0° 经线在正下方，90°E 在正右方。',
      vars,
      steps: [
        '这是从北极上空俯视：地球自转在这个方向看是逆时针',
        '0° 经线画在正下方，从正下方逆时针数，下一个到的就是右边的 90°E',
        '半径 r = rMax × (90° − 纬度) ÷ 90°，赤道在最外圈（r = {rMax}px）',
        '所以越靠极地圆心越近——图的半径就是纬度的线',
        '经线每 30° 一根，共 12 根',
      ],
    },
    'winter-land': {
      name: '冬季陆地上的高压',
      hint: '陆地降温快，是冷源，近地面形成冷高压。',
      vars,
      steps: [
        '冬季陆地比海洋冷得快 → 近地面空气冷而重 → 气压高',
        '海平面等压线图上，闭合高压中心的气流辐散（自中心向外）',
        '北半球的气流受地转偏向力右偏，所以高压中心的气流顺时针辐散',
        `本图：${vars.winterLandNames}`,
        '位置：亚洲高压在 100°E 附近，' + vars.asiaPlace,
      ],
    },
    'winter-sea': {
      name: '冬季海上的低压',
      hint: '海洋是热源，被顶断的副极地低气压带退到海上。',
      vars,
      steps: [
        '冬季海洋比陆地冷得慢 → 海洋反而是热源 → 近地面成低压',
        '这些低压原本是整齐的副极地低气压带，被陆地上的冷高压顶断',
        '断掉的部分退到海上，改了名字——气压带没有消失，只是被顶断了',
        `本图：${vars.winterSeaNames}`,
        '位置：阿留申低压在 190°E 附近，' + vars.alaskaPlace,
      ],
    },
    'summer-land': {
      name: '夏季陆地上的低压',
      hint: '陆地升温快，是热源，近地面形成热低压。',
      vars,
      steps: [
        '夏季陆地比海洋热得快 → 近地面空气热而轻 → 气压低',
        '海平面等压线图上，闭合低压中心的气流辐合（自外向内）',
        '北半球的气流受地转偏向力右偏，所以低压中心的气流逆时针辐合',
        `本图：${vars.summerLandNames}`,
        '位置：印度低压在 80°E 附近，' + vars.indiaPlace,
      ],
    },
    'summer-sea': {
      name: '夏季海上的高压',
      hint: '海洋是冷源，被顶断的副热带高气压带退到海上。',
      vars,
      steps: [
        '夏季海洋比陆地冷得慢 → 海洋反而是冷源 → 近地面成高压',
        '这些高压原本是副热带高气压带，被陆地上的热低压顶断',
        '断掉的部分退到海上，改了名字——气压带没有消失，只是被顶断了',
        `本图：${vars.summerSeaNames}`,
        '位置：夏威夷高压在 210°E 附近，' + vars.hawaiiPlace,
      ],
    },
    belts: {
      name: '气压带',
      hint: '全球气压带的原始格局，被顶断后就变成了气压中心。',
      vars,
      steps: [
        '近地面的气压带自北向南排开，纬度就是它们的中心纬度',
        `${vars.beltPolar} → ${vars.beltSubpolar} → ${vars.beltSubtropical} → ${vars.beltEquatorial}`,
        '气压带的成因是纬度环流：热的地方上升成低压，冷的地方下沉成高压',
        '大陆季风把气压带顶断——被顶断的是气压带，留下的是气压中心',
      ],
    },
    'winter-push': {
      name: '冬季：陆地冷高压南下',
      hint: '冷高压势力强，向南推进顶断副极地低气压带。',
      vars,
      steps: [
        '冬季陆地是冷源，近地面形成强大的冷高压',
        '冷高压势力强，向南推进，把副极地低气压带顶断',
        '被顶断的副极地低气压带退到海上，改名成阿留申低压、冰岛低压',
        '所以冬季近地面：大陆高压、海洋低压',
      ],
    },
    'summer-push': {
      name: '夏季：陆地热低压北上',
      hint: '热低压向北推进顶断副热带高气压带。',
      vars,
      steps: [
        '夏季陆地是热源，近地面形成强大的热低压',
        '热低压向北推进，把副热带高气压带顶断',
        '被顶断的副热带高气压带退到海上，改名成夏威夷高压、亚速尔高压',
        '所以夏季近地面：大陆低压、海洋高压',
      ],
    },
    seasons: {
      name: '南北半球季节相反',
      hint: '北半球夏季是 7 月，南半球夏季是 1 月。',
      vars,
      steps: [
        '地球绕太阳转，南北半球朝向太阳的时间正好错开半年',
        '北半球夏季 = 7 月，南半球夏季 = 1 月',
        '所以同一个大陆在两个半球里属性相反：亚洲 1 月是冷高压、7 月是热低压',
        '澳洲大陆 1 月是热低压、7 月是冷高压',
        '判题时先确认是哪个半球，再定季节——用错月份是最常见的失分点',
      ],
    },
  }
})
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
