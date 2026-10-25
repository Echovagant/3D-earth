<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- 底图：东西两个半球的展开图 -->
      <g
        v-for="d in disks"
        :key="d.side"
        :opacity="diskOpacity(d.side, step)"
        :data-explain="d.side === 'east' ? 'east-hemisphere' : 'west-hemisphere'"
      >
        <g class="demo__grid">
          <path data-explain="equator" :d="d.equator" />
          <path
            v-for="p in d.parallels"
            :key="`${d.side}p${p.lat}`"
            data-explain="parallel"
            :d="p.d"
          />
        </g>
        <path
          v-for="m in d.meridians"
          :key="`${d.side}m${m.lon}`"
          class="demo__curve"
          data-explain="meridian"
          :d="m.d"
        />
        <circle class="demo__cut" data-explain="north-pole" :cx="d.cx" :cy="d.cy - d.r" r="5" />
        <text class="demo__label demo__label--mark" :x="d.cx" y="30" text-anchor="middle">
          {{ d.title }}
        </text>
        <text class="demo__label demo__label--faint" :x="d.cx" y="50" text-anchor="middle">
          {{ d.subtitle }}
        </text>
        <text class="demo__label" :x="d.cx" y="112" text-anchor="middle">北极点</text>
        <text class="demo__label" :x="d.cx - d.r - 6" y="182" text-anchor="end">30°N</text>
        <text class="demo__label" :x="d.cx - d.r - 6" y="142" text-anchor="end">60°N</text>
        <text
          v-for="t in d.ticks"
          :key="`${d.side}t${t.lon}`"
          class="demo__label"
          data-explain="degree"
          :x="t.x"
          :y="t.row === 0 ? d.cy + 19 : d.cy + 37"
          text-anchor="middle"
        >
          {{ t.label }}
        </text>
        <g data-explain="spin">
          <path
            class="demo__spin"
            :d="`M ${d.cx - d.r} ${d.cy + 56} L ${d.cx + d.r} ${d.cy + 56}`"
          />
          <path class="demo__spin-head" :d="arrowHead(d.cx + d.r, d.cy + 56, 0, 12)" />
          <text class="demo__label" :x="d.cx" :y="d.cy + 76" text-anchor="middle">自西向东</text>
        </g>
      </g>

      <!-- ① 展开图长什么样 -->
      <g v-show="step === 0" class="demo__frame">
        <text class="demo__label demo__label--mark" x="360" y="86" text-anchor="middle">
          半圆的弧 = 经线，直径 = 赤道，两端就是 0° 与 180°
        </text>
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          把北半球从 90°E / 90°W 正对着看，就是这两张展开图
        </text>
      </g>

      <!-- ② 东经半球：从 0° 向东度数变大 -->
      <g v-show="step === 1" class="demo__frame">
        <text class="demo__label demo__label--mark" :x="185" y="206" text-anchor="middle">
          往东，度数越来越大
        </text>
        <text class="demo__label" :x="185" y="224" text-anchor="middle">→ 全是东经</text>
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          东经半球：0° 在左、180° 在右，自西向东度数从 0° 变到 180°
        </text>
      </g>

      <!-- ③ 西经半球：从 180° 向东度数变小 -->
      <g v-show="step === 2" class="demo__frame">
        <text class="demo__label demo__label--mark" :x="535" y="206" text-anchor="middle">
          往东，度数越来越小
        </text>
        <text class="demo__label" :x="535" y="224" text-anchor="middle">→ 全是西经</text>
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          西经半球：180° 在左、0° 在右，自西向东度数从 180° 变到 0°
        </text>
      </g>

      <!-- ④ 通用法 -->
      <g v-show="step === 3" class="demo__frame">
        <text class="demo__label demo__label--mark" x="360" y="86" text-anchor="middle">
          通用法：在图上找到任意一条特殊经线（0° 或 180°）
        </text>
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          看度数往哪边变：往东变大就是东经，往东变小就是西经
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §2.9 经度的判读：东西经半球展开法。
 *
 * 讲义里那句「在图上找到任意一条特殊经线（0° 或 180°），判断从它往东/往西
 * 度数是变大还是变小」，补的就是这两张展开图：
 *   ① 展开图长什么样：半圆的弧是经线、直径是赤道，0° 与 180° 是直径两端；
 *   ② 东经半球：0° 在左、180° 在右，往东度数变大；
 *   ③ 西经半球：180° 在左、0° 在右，往东度数变小；
 *   ④ 通用法：不必依赖 0° 在中间，找到哪条特殊经线都行。
 *
 * 图形按半球正投影算：经线是从北极点画到赤道落点的弧，
 * 落点 x = cx ∓ R·cosλ（东经取负、西经取正）。
 */
import DemoShell from '../DemoShell.vue'
import {
  eastwardTrend,
  hemisphereMeridianPath,
  hemisphereMeridianX,
  hemisphereParallelPath,
  longitudeLabel,
  meridianOffset,
} from '../../data/longitudeHemisphereGeometry'
import { arrowHead } from '../../data/svgParts'

const steps = [
  {
    id: 'layout',
    title: '① 东西经半球展开图',
    text: '把北半球从 90°E、90°W 分别正对着看，就得到这两张半圆图：半圆的弧是经线（0° 与 180° 两条经线的北半圈），直径是赤道，顶点是北极点。图上永远是上北下南、左西右东。',
  },
  {
    id: 'east',
    title: '② 东经半球：从 0° 往东，度数变大',
    text: '东经半球里 0° 在左端、180° 在右端。沿着图下方那支自西向东的箭头走，度数从 0° 一路涨到 180°——凡是往东度数变大的经线，就是东经。',
  },
  {
    id: 'west',
    title: '③ 西经半球：从 180° 往东，度数变小',
    text: '西经半球正好反过来：180° 在左端、0° 在右端，往东走度数从 180° 越来越小，直到 0°。所以「往东度数变小」就对应西经——别把变大变小记反。',
  },
  {
    id: 'general',
    title: '④ 通用法：找一条特殊经线就行',
    text: '不必非得画 0° 在中间。在图上找到任意一条特殊经线（0° 或 180°），看度数往东是变大还是变小，就能定出 E 还是 W。经度判读要理解、不要死背——它一乱，地方时、区时、日期范围全会跟着乱。',
  },
]

const R = 110
const CY = 235
const MERIDIANS = [0, 30, 60, 90, 120, 150, 180]
const PARALLELS = [30, 60]
/** 度数标注分两行错开，免得挤在一起（半球投影里靠边的经线本来就密） */
const ROW_OF = { 0: 0, 30: 1, 60: 0, 90: 1, 120: 0, 150: 1, 180: 0 }

const disks = [
  {
    side: 'east',
    cx: 185,
    title: '东经半球',
    subtitle: '0° 在左，180° 在右',
  },
  {
    side: 'west',
    cx: 535,
    title: '西经半球',
    subtitle: '180° 在左，0° 在右',
  },
].map((d) => ({
  ...d,
  r: R,
  cy: CY,
  equator: `M ${d.cx - R} ${CY} L ${d.cx + R} ${CY}`,
  meridians: MERIDIANS.map((lon) => ({
    lon,
    d: hemisphereMeridianPath(d.cx, CY, R, lon, d.side),
  })),
  parallels: PARALLELS.map((lat) => ({
    lat,
    d: hemisphereParallelPath(d.cx, CY, R, lat),
  })),
  ticks: MERIDIANS.map((lon) => ({
    lon,
    x: hemisphereMeridianX(d.cx, R, lon, d.side),
    label: longitudeLabel(lon, d.side),
    row: ROW_OF[lon],
  })),
}))

/** 某一步只强调一个半球，另一个压暗 */
function diskOpacity(side, step) {
  if (step === 1) return side === 'east' ? 1 : 0.28
  if (step === 2) return side === 'west' ? 1 : 0.28
  return 1
}

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * 这一节讲的是「怎么判 E 还是 W」，所以推导写的是判据的来由：
 * 展开图怎么摆 → 往东走度数是变大还是变小 → E/W 怎么定。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 图上标的 0°/180° 的位置与这里说的是同一套几何。
 */
const vars = {
  eastTrend: eastwardTrend('east'),
  westTrend: eastwardTrend('west'),
  off0: String(Math.round(meridianOffset(R, 0, 'east'))),
  off90: String(Math.round(meridianOffset(R, 90, 'east'))),
  off180: String(Math.round(meridianOffset(R, 180, 'east'))),
  radius: String(R),
  stepDeg: String(MERIDIANS[1] - MERIDIANS[0]),
}

const explains = {
  'east-hemisphere': {
    name: '东经半球',
    hint: '把北半球从 90°E 正对着看，得到的半圆展开图。',
    vars,
    steps: [
      '正对着看 90°E 时，0° 经线落在直径左端、180° 落在右端',
      '落点横向位置 = R·cosλ：0° 是 {off0}，90° 是 {off90}（正中），180° 是 {off180}',
      '地图约定上北下南、左西右东 ⇒ 直径上从左往右就是自西向东',
      '从 0° 走到 180°，度数一路{eastTrend}',
      '所以这张图上的经线全是东经',
    ],
  },
  'west-hemisphere': {
    name: '西经半球',
    hint: '把北半球从 90°W 正对着看，得到的半圆展开图。',
    vars,
    steps: [
      '正对着看 90°W 时，180° 经线落在直径左端、0° 落在右端',
      '同一套落点公式 R·cosλ，左右两端对调',
      '直径上从左往右仍是自西向东',
      '从 180° 走到 0°，度数一路{westTrend}',
      '所以这张图上的经线全是西经',
    ],
  },
  meridian: {
    name: '经线（弧）',
    hint: '从北极点画到赤道落点的那一段弧，就是经线的北半圈。',
    vars,
    steps: [
      '经线 = 过南北两极的半圆；展开图上只画出它的北半圈',
      '所以每一段弧都从顶点（北极点）出发，落在赤道直径上',
      '落点位置 = R·cosλ：0° 在直径一端，90° 在正中，180° 在另一端',
      '正因为 0° 和 180° 一定在两端，才能靠「找一条特殊经线」来判 E/W',
      '图上相邻两条弧相差 {stepDeg}°，但疏密并不均匀——那正是 cosλ 在起作用',
    ],
  },
  equator: {
    name: '赤道（直径）',
    hint: '展开图的直径就是赤道，它把北半球切成两半。',
    vars,
    steps: [
      '从 90°E 或 90°W 正对着看，赤道正对着视线 ⇒ 投影成一条直线',
      '这条线是直径，长度 = 地球直径 = 2R = {radius} × 2（图上单位）',
      '直径两端分别是 0° 与 180° 两条经线和赤道的交点',
      '所以「0° 在左还是 180° 在左」决定了整张图的东经/西经属性',
    ],
  },
  parallel: {
    name: '纬线',
    hint: '横过半球的那一段弧，两端落在半圆的边缘上。',
    vars,
    steps: [
      '纬线所在的平面垂直于地轴 ⇒ 投影成横过半球的一段弧',
      '弧顶到直径的距离 = R·sinφ：纬度越高，弧顶离赤道越远',
      '弧的半宽 = R·cosφ：纬度越高，弧越短',
      '所以纬线在展开图上也是一圈套一圈的形状',
    ],
  },
  'north-pole': {
    name: '北极点',
    hint: '所有经线都从这里出发，是展开图的顶点。',
    vars,
    steps: [
      '经线都过南北两极 ⇒ 展开图上所有经线弧都从顶点出发',
      '顶点就是北极点，也就是整张半圆图的中心',
      '极点处经线间隔 = 0（所有经线挤在同一点上）',
      '顶点处纬线长度 = 2πR·cos90° = 0 ⇒ 也缩成一个点',
    ],
  },
  degree: {
    name: '度数标注',
    hint: '0° 和 180° 不带 E/W，其余要靠「往东变大还是变小」来定。',
    vars,
    steps: [
      '0° 与 180° 是特殊经线，本身不带 E/W',
      '其余经线：往东度数变大 → 东经；往东度数变小 → 西经',
      '东经半球是 0° → 30° → 60° → … → 180°，度数{eastTrend}',
      '西经半球反过来：180° → 150° → 120° → … → 0°，度数{westTrend}',
      '所以西经半球上标 30° 的那条，写法是 30°W，不是 30°E',
    ],
  },
  spin: {
    name: '自西向东',
    hint: '地球自西向东自转，图上从左往右就是往东。',
    vars,
    steps: [
      '地球自西向东自转',
      '从北极点上方俯视是逆时针，从南极点上方俯视是顺时针',
      '地图约定上北下南、左西右东 ⇒ 直径上从左往右 = 自西向东',
      '所以「度数往东变大还是变小」才是判 E/W 的唯一依据',
    ],
  },
}
</script>
