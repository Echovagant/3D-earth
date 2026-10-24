<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- ① 椭圆轨道：太阳在其中一个焦点上 -->
      <g v-show="step === 0" class="demo__frame">
        <path class="demo__curve" :d="orbit.d" />
        <circle class="demo__sun" :cx="sun.x" :cy="sun.y" r="16" />
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
        <path class="demo__spin" d="M 445 78 Q 360 44 275 78" />
        <path class="demo__spin-head" :d="arrowHead(275, 78, 200, 14)" />
        <text class="demo__label" x="360" y="28" text-anchor="middle">
          公转方向：自西向东（北极上方看是逆时针）
        </text>

        <circle class="demo__globe-plain" :cx="perihelion.x" :cy="perihelion.y" r="12" />
        <text class="demo__label demo__label--mark" :x="perihelion.x" y="238" text-anchor="middle">
          近日点 · 1 月初
        </text>
        <text class="demo__label demo__label--faint" :x="perihelion.x" y="256" text-anchor="middle">
          离太阳最近，速度最快
        </text>

        <circle class="demo__globe-plain" :cx="aphelion.x" :cy="aphelion.y" r="12" />
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
        <path class="demo-sector" :d="sectors.perihelionPath" />
        <path class="demo-sector" :d="sectors.aphelionPath" />
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
        <path class="demo-sector demo-sector--winter" :d="halfYears.winterPath" />
        <path class="demo-sector" :d="halfYears.summerPath" />
        <circle class="demo__sun" :cx="sun.x" :cy="sun.y" r="14" />

        <!-- 二分二至在轨道上的位置 -->
        <circle
          v-for="m in markers"
          :key="m.key"
          class="demo__cut"
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
        <circle class="demo__cut" :cx="perihelion.x" :cy="perihelion.y" r="5" />
        <circle class="demo__cut" :cx="aphelion.x" :cy="aphelion.y" r="5" />
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
  NORTHERN_SUMMER_DAYS,
  NORTHERN_WINTER_DAYS,
  SEASONS,
  arcLength,
  equalAreaSectors,
  orbitPath,
  orbitPoint,
  seasonMarker,
  sectorPath,
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
