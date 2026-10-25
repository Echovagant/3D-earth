<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 椭圆轨道：太阳在其中一个焦点上 -->
      <g v-show="step === 0" class="demo__frame">
        <path class="demo__curve" data-explain="orbit" :d="orbit.d" />
        <circle class="demo__sun" data-explain="sun" :cx="sun.x" :cy="sun.y" r="16" />
        <circle class="demo__cut" :cx="sun.x" :cy="sun.y" r="3.5" />
        <text class="demo__label" :x="sun.x" :y="sun.y + 34" text-anchor="middle">太阳</text>
        <path class="demo__leader" :d="`M ${sun.x + 20} ${sun.y - 12} L 512 138 L 560 130`" />
        <text class="demo__label demo__label--mark" x="566" y="134">太阳在椭圆的一个焦点上</text>
        <text class="demo__label" x="360" y="338" text-anchor="middle">
          黄道：近似正圆的椭圆，太阳在其中一个焦点上
        </text>
        <text class="demo__label demo__label--faint" x="360" y="360" text-anchor="middle">
          图上偏心率已夸大（真实约 0.017），否则看不出快慢差别
        </text>
      </g>

      <!-- ② 近日点与远日点：一近快、七远慢 -->
      <g v-show="step === 1" class="demo__frame">
        <path class="demo__curve" :d="orbit.d" />
        <circle class="demo__sun" :cx="sun.x" :cy="sun.y" r="14" />
        <text class="demo__label demo__label--faint" :x="sun.x" :y="sun.y + 30" text-anchor="middle">
          太阳
        </text>
        <path class="demo__spin" data-explain="direction" d="M 445 78 Q 360 44 275 78" />
        <path class="demo__spin-head" :d="arrowHead(275, 78, 200, 14)" />
        <text class="demo__label" x="360" y="28" text-anchor="middle">
          公转方向：自西向东（北极上方看是逆时针）
        </text>

        <circle class="demo__globe-plain" data-explain="perihelion" :cx="perihelion.x" :cy="perihelion.y" r="12" />
        <text class="demo__label demo__label--mark" :x="perihelion.x" y="238" text-anchor="middle">
          近日点 · 1 月初
        </text>
        <text class="demo__label demo__label--faint" :x="perihelion.x" y="256" text-anchor="middle">
          离太阳最近，速度最快
        </text>

        <circle class="demo__globe-plain" data-explain="aphelion" :cx="aphelion.x" :cy="aphelion.y" r="12" />
        <text class="demo__label demo__label--mark" :x="aphelion.x" y="238" text-anchor="middle">
          远日点 · 7 月初
        </text>
        <text class="demo__label demo__label--faint" :x="aphelion.x" y="256" text-anchor="middle">
          离太阳最远，速度最慢
        </text>

        <text class="demo__caption-line" x="360" y="336" text-anchor="middle">
          口诀：一近快，七远慢
        </text>
        <text class="demo__label demo__label--faint" x="360" y="358" text-anchor="middle">
          近日点 ≈ 1 月初，远日点 ≈ 7 月初——离太阳最近的那天不是冬至，是冬至离它最近
        </text>
      </g>

      <!-- ③ 等面积：相等时间扫过等面积，近处步子大、远处步子小 -->
      <g v-show="step === 2" class="demo__frame">
        <path class="demo__curve" :d="orbit.d" />
        <path class="demo-sector" data-explain="sector-peri" :d="sectors.perihelionPath" />
        <path class="demo-sector" data-explain="sector-aph" :d="sectors.aphelionPath" />
        <circle class="demo__sun" :cx="sun.x" :cy="sun.y" r="14" />

        <text class="demo__label demo__label--mark" x="566" y="112">近日点一侧</text>
        <text class="demo__label demo__label--faint" x="566" y="132">弧长，步子大</text>
        <path class="demo__leader" d="M 556 118 L 470 140" />

        <text class="demo__label demo__label--mark" x="150" y="140">远日点一侧</text>
        <text class="demo__label demo__label--faint" x="150" y="160">弧短，步子小</text>
        <path class="demo__leader" d="M 196 150 L 240 170" />

        <text class="demo__caption-line" x="360" y="330" text-anchor="middle">
          两块扇形面积相等（开普勒第二定律）
        </text>
        <text class="demo__label demo__label--faint" x="360" y="352" text-anchor="middle">
          同样 {{ sectors.days }} 天：近日点一侧走过的弧长约为远日点一侧的
          {{ sectors.ratioText }} 倍
        </text>
      </g>

      <!-- ④ 夏半年比冬半年长：因为远日点在夏半年里，那时走得慢 -->
      <g v-show="step === 3" class="demo__frame">
        <path class="demo__curve" :d="orbit.d" />
        <path class="demo-sector demo-sector--winter" data-explain="half-winter" :d="halfYears.winterPath" />
        <path class="demo-sector" data-explain="half-summer" :d="halfYears.summerPath" />
        <circle class="demo__sun" :cx="sun.x" :cy="sun.y" r="14" />

        <!-- 二分二至在轨道上的位置 -->
        <circle
          v-for="m in markers"
          :key="m.key"
          class="demo__cut"
          data-explain="season-marker"
          :cx="m.point.x"
          :cy="m.point.y"
          r="6"
        />
        <path
          class="demo__spin-head"
          :d="arrowHead(directionArrow.x, directionArrow.y, directionArrow.angle, 13)"
        />

        <text class="demo__label demo__label--mark" x="360" y="42" text-anchor="middle">
          春分 3.21
        </text>
        <text class="demo__label demo__label--mark" x="146" y="152">夏至 6.22</text>
        <path class="demo__leader" d="M 196 148 L 234 168" />
        <text class="demo__label demo__label--mark" x="311" y="332" text-anchor="middle">
          秋分 9.23
        </text>
        <text class="demo__label demo__label--mark" x="562" y="244">冬至 12.22</text>
        <path class="demo__leader" d="M 510 240 L 482 230" />

        <!-- 近/远日点 -->
        <circle class="demo__cut" data-explain="perihelion" :cx="perihelion.x" :cy="perihelion.y" r="5" />
        <circle class="demo__cut" data-explain="aphelion" :cx="aphelion.x" :cy="aphelion.y" r="5" />
        <text class="demo__label demo__label--faint" x="546" y="186">近日点 1 月初</text>
        <text class="demo__label demo__label--faint" x="182" y="212">远日点 7 月初</text>

        <!-- 两个半年的扇形 -->
        <text class="demo__label demo__label--mark" x="330" y="180" text-anchor="middle">
          夏半年 {{ halfYears.summerDays }} 天
        </text>
        <text class="demo__label demo__label--mark" x="424" y="256" text-anchor="middle">
          冬半年 {{ halfYears.winterDays }} 天
        </text>

        <text class="demo__caption-line" x="360" y="360" text-anchor="middle">
          夏半年扇形面积更大（时间更长），弧却更短——远日点在夏半年里，那时走得慢
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §4.1 地球公转的基本特征。
 *
 * 老师讲这节时用了一个比喻：想象你在操场中间看一个同学绕你跑步——
 * 他跑得离你远的时候，必须挪更小的步子。这段就是补上那幅画。
 *
 * 四步各自的分工：
 *   ① 椭圆轨道 + 太阳在焦点上 —— 先把轨道画对
 *   ② 近日点与远日点 —— 一近快、七远慢
 *   ③ 等面积 —— 两块等面积的扇形，说明「近时步子大、远时步子小」
 *   ④ 夏半年长于冬半年 —— 远日点在夏半年里，那时走得慢
 *
 * 轨道是真椭圆、按开普勒方程算出来的；为了看得见差别，偏心率夸大了。
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { arrowHead } from '../../data/svgParts'
import {
  SEMI_MAJOR,
  SEMI_MINOR,
  DAYS_PER_YEAR,
  ECCENTRICITY,
  EQUINOX_DAY_OF_YEAR,
  NORTHERN_SUMMER_DAYS,
  NORTHERN_WINTER_DAYS,
  SEASONS,
  SIDEREAL_YEAR_TEXT,
  TROPICAL_YEAR_TEXT,
  TRUE_ECCENTRICITY,
  YEAR_DIFF_SECONDS,
  APHELION_DISTANCE_KM,
  PERIHELION_DISTANCE_KM,
  apsisRatio,
  arcLength,
  daysToMeanAnomaly,
  equalAreaSectors,
  halfYearLengths,
  orbitPath,
  orbitPoint,
  seasonMarker,
  sectorPath,
  solveAphelionSweep,
  solveKepler,
  sunPoint,
} from '../../data/earthOrbitGeometry'

const steps = [
  {
    id: 'orbit',
    title: '① 轨道是椭圆，太阳在焦点上',
    text: '地球绕太阳转的轨道叫黄道，形状是近似正圆的椭圆，太阳就坐在椭圆的一个焦点上。真正的偏心率只有 0.017，画出来几乎是个正圆——所以这张图把偏心率夸大了，不然看不出快慢的差别。',
  },
  {
    id: 'apsides',
    title: '② 近日点快，远日点慢',
    text: '1 月初地球离太阳最近，这个位置叫近日点；7 月初最远，叫远日点。离得近时同样的时间要跑更长的路，所以近日点快、远日点慢——口诀是「一近快，七远慢」。公转方向和自转一致：自西向东，从北极上方看是逆时针。',
  },
  {
    id: 'kepler2',
    title: '③ 等时间内扫过等面积',
    text: '把太阳和地球连成一条线，这根线在同样长的时间里扫过的面积总是相等——这就是开普勒第二定律。图上两块扇形面积一样大，可是近日点那块对应的弧长得多、远日点那块对应的弧很短。回到那个比喻：他离你远的时候，必须挪更小的步子。',
  },
  {
    id: 'half-year',
    title: '④ 北半球夏半年比冬半年长',
    text: '因为远日点在夏半年里（7 月初），那时地球走得慢，所以春分到秋分用了 186 天，比秋分到次年春分的 179 天长。扇形面积大说明用的时间长，弧短说明走得慢——两件事对上就明白了。注意别把「近日点」和「冬至日」当成一回事：冬至是离近日点最近的那天，不是近日点本身。',
  },
]

const sun = sunPoint()
const orbit = { d: orbitPath() }

/** 近日点、远日点：椭圆长轴的两端 */
const perihelion = orbitPoint(0)
const aphelion = orbitPoint(Math.PI)

/** ③ 等面积的两块扇形 */
const sectors = computed(() => {
  const s = equalAreaSectors(30)
  return {
    days: s.days,
    ratioText: s.ratio.toFixed(2),
    perihelionPath: sectorPath(s.perihelion.from, s.perihelion.to, sun),
    aphelionPath: sectorPath(s.aphelion.from, s.aphelion.to, sun),
  }
})

/** ④ 二分二至在轨道上的位置 */
const markers = computed(() => SEASONS.map((s) => seasonMarker(s)))

/** ④ 两个半年的扇形：夏半年 = 春分 → 秋分，冬半年 = 秋分 → 次年春分 */
const halfYears = computed(() => {
  const [vernal, , autumnal] = markers.value
  const summerPath = sectorPath(vernal.E, autumnal.E, sun, { steps: 90 })
  const winterPath = sectorPath(autumnal.E, vernal.E + Math.PI * 2, sun, { steps: 90 })
  return {
    summerDays: NORTHERN_SUMMER_DAYS,
    winterDays: NORTHERN_WINTER_DAYS,
    summerPath,
    winterPath,
    summerArc: arcLength(vernal.E, autumnal.E),
    winterArc: arcLength(autumnal.E, vernal.E + Math.PI * 2),
  }
})

/** ④ 轨道上的方向箭头：逆时针（偏近点角增大方向），取夏至—秋分之间的一点 */
const directionArrow = computed(() => {
  const E = 3.6
  const p = orbitPoint(E)
  // 轨道切线：dx/dE = −a·sinE，dy/dE = −b·cosE（画布 y 向下）
  const dx = -SEMI_MAJOR * Math.sin(E)
  const dy = -SEMI_MINOR * Math.cos(E)
  return { x: p.x, y: p.y, angle: (Math.atan2(-dy, dx) * 180) / Math.PI }
})

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 参数一动，图和讲解一起变，不会出现「图上 66.5°、文字写着 65°」。
 */
const explains = computed(() => {
  const sectorDays = sectors.value.days
  const meanAnomaly = daysToMeanAnomaly(sectorDays)
  const periSweep = (solveKepler(meanAnomaly) * 180) / Math.PI
  const aphSweep = (solveAphelionSweep(meanAnomaly) * 180) / Math.PI
  const half = halfYearLengths()
  const vars = {
    trueEcc: String(TRUE_ECCENTRICITY),
    ecc: String(ECCENTRICITY),
    periDist: `${(PERIHELION_DISTANCE_KM / 1e8).toFixed(3)} 亿 km`,
    aphDist: `${(APHELION_DISTANCE_KM / 1e8).toFixed(3)} 亿 km`,
    apsisRatio: apsisRatio().toFixed(3),
    sectorDays: String(sectorDays),
    meanDeg: ((meanAnomaly * 180) / Math.PI).toFixed(2),
    periSweepDeg: periSweep.toFixed(2),
    aphSweepDeg: aphSweep.toFixed(2),
    arcRatio: sectors.value.ratioText,
    yearDays: String(DAYS_PER_YEAR),
    quarterDays: (DAYS_PER_YEAR / 4).toFixed(1),
    summerDays: String(half.summer),
    winterDays: String(half.winter),
    halfDiff: String(half.summer - half.winter),
    vernalDay: String(EQUINOX_DAY_OF_YEAR.vernal),
    autumnalDay: String(EQUINOX_DAY_OF_YEAR.autumnal),
    siderealYear: SIDEREAL_YEAR_TEXT,
    tropicalYear: TROPICAL_YEAR_TEXT,
    yearDiff: `${Math.floor(YEAR_DIFF_SECONDS / 60)} 分 ${YEAR_DIFF_SECONDS % 60} 秒`,
  }

  return {
    orbit: {
      name: '公转轨道（黄道）',
      hint: '地球绕太阳的轨道：一个近似正圆的椭圆，太阳在其中一个焦点上。',
      vars,
      steps: [
        '开普勒第一定律：轨道是椭圆',
        '太阳在椭圆的一个焦点上，焦点离圆心 c = a·e',
        `真实偏心率只有 ${vars.trueEcc}，照实画几乎是个正圆`,
        `图上夸大到 ${vars.ecc}，才看得出近处快、远处慢`,
        '黄道 = 地球公转轨道所在的平面',
      ],
    },
    sun: {
      name: '太阳（焦点）',
      hint: '太阳坐在轨道的一个焦点上——所以地球到太阳的距离一直在变。',
      vars,
      steps: [
        '太阳在焦点上：焦点位置 = 圆心 + a·e',
        `于是地球到太阳的距离在 ${vars.periDist} 与 ${vars.aphDist} 之间变`,
        '距离变 ⇒ 走的快慢变（开普勒第二定律）',
        '这就是「一近快、七远慢」的物理原因',
      ],
    },
    direction: {
      name: '公转方向',
      hint: '自西向东，与自转方向一致。',
      vars,
      steps: [
        '公转方向：自西向东（与自转同向）',
        '从北极点正上方俯视是逆时针，从南极点正上方俯视是顺时针',
        `公转周期：恒星年 ${vars.siderealYear}，回归年 ${vars.tropicalYear}`,
        `回归年比恒星年短 ${vars.yearDiff}——差别极小，但定义不同`,
      ],
    },
    perihelion: {
      name: '近日点（1 月初）',
      hint: '离太阳最近的位置，速度最快。',
      vars,
      steps: [
        '近日点 = 椭圆长轴上离太阳最近的那一端',
        `距离 = a(1 − e) ⇒ 真实值约 ${vars.periDist}`,
        '同样长的时间里要跑更长的路 ⇒ 速度最快',
        '口诀：一近快、七远慢',
      ],
    },
    aphelion: {
      name: '远日点（7 月初）',
      hint: '离太阳最远的位置，速度最慢。',
      vars,
      steps: [
        '远日点 = 椭圆长轴上离太阳最远的那一端',
        `距离 = a(1 + e) ⇒ 真实值约 ${vars.aphDist}`,
        `远近距离之比 = (1 + e) ÷ (1 − e) = ${vars.apsisRatio}`,
        '路短、走得慢：夏半年反而更长',
      ],
    },
    'sector-peri': {
      name: '近日点一侧的等面积扇形',
      hint: `同样 ${sectorDays} 天里近日点扫过的扇形：弧很长。`,
      vars,
      steps: [
        '开普勒第二定律：相等时间内，太阳与地球的连线扫过的面积相等',
        '所以图上两块扇形面积一样大',
        `但同样 ${vars.sectorDays} 天，近日点侧走过的弧长是远日点侧的 ${vars.arcRatio} 倍`,
        '近处步子大、远处步子小——这就是那个「离得远就得挪小步子」的比喻',
      ],
    },
    'sector-aph': {
      name: '远日点一侧的等面积扇形',
      hint: '远日点侧：面积一样，弧却短得多。',
      vars,
      steps: [
        `把 ${vars.sectorDays} 天换算成平近点角 M = ${vars.sectorDays} ÷ ${vars.yearDays} × 360° = ${vars.meanDeg}°`,
        `下面的 e 是图上夸大的偏心率 ${vars.ecc}（真实只有 ${vars.trueEcc}，那样看不出差别）`,
        `远日点侧扫角 Δ 满足 M = Δ + e·sinΔ ⇒ Δ = ${vars.aphSweepDeg}°`,
        `近日点侧扫角 E 满足 M = E − e·sinE ⇒ E = ${vars.periSweepDeg}°`,
        `Δ 比 E 小，所以远日点侧弧更短——面积一样、弧长不同，就是速度不同`,
      ],
    },
    'half-summer': {
      name: '夏半年（春分 → 秋分）',
      hint: '远日点在这半年里，那时走得慢，所以这半年更长。',
      vars,
      steps: [
        '夏半年 = 春分（3.21）→ 秋分（9.23）',
        `第 ${vars.vernalDay} 天 → 第 ${vars.autumnalDay} 天 ⇒ ${vars.summerDays} 天`,
        '远日点（7 月初）就在这半年里，那时地球走得慢 ⇒ 同样的面积要多花时间',
        `所以夏半年比冬半年长 ${vars.halfDiff} 天`,
      ],
    },
    'half-winter': {
      name: '冬半年（秋分 → 次年春分）',
      hint: '近日点在这半年里，那时走得快，所以这半年更短。',
      vars,
      steps: [
        '冬半年 = 秋分（9.23）→ 次年春分（3.21）',
        `${vars.winterDays} 天（${vars.yearDays} − ${vars.summerDays}）`,
        '近日点（1 月初）在这半年里，那时地球走得快 ⇒ 同样的面积少花时间',
        '这就是「北半球夏半年比冬半年长」的真正原因',
      ],
    },
    'season-marker': {
      name: '二分二至',
      hint: '一年里四个关键位置：春分、夏至、秋分、冬至。',
      vars,
      steps: [
        `二分二至把一年分成四段，每段约 ${vars.quarterDays} 天`,
        '春分（3.21）→ 夏至（6.22）→ 秋分（9.23）→ 冬至（12.22）',
        '位置由「平近点角」换算：平近点角随时间均匀，所以天数直接换成角度',
        '注意：冬至离近日点最近，但冬至 ≠ 近日点（近日点在 1 月初）',
      ],
    },
  }
})
</script>

<style scoped>
.demo-sector {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-accent);
  stroke-width: 1.4;
  stroke-linejoin: round;
}

.demo-sector--winter {
  fill: var(--learn-line);
  stroke: var(--learn-ink-faint);
}
</style>
