<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 侧视图：纬线是一条条平行的横线，指示东西方向 -->
      <g v-show="step === 0" class="demo__frame">
        <circle class="demo__globe-plain" :cx="GLOBE.cx" :cy="GLOBE.cy" :r="GLOBE.r" />
        <g class="demo__grid" data-explain="parallel">
          <path
            v-for="p in sideParallels"
            :key="`side${p.lat}`"
            :d="`M ${p.x1.toFixed(2)} ${p.y.toFixed(2)} L ${p.x2.toFixed(2)} ${p.y.toFixed(2)}`"
          />
        </g>
        <path
          class="demo__curve"
          data-explain="equator"
          :d="`M ${GLOBE.cx - GLOBE.r} ${GLOBE.cy} L ${GLOBE.cx + GLOBE.r} ${GLOBE.cy}`"
        />
        <circle class="demo__cut" data-explain="pole" :cx="GLOBE.cx" :cy="GLOBE.cy - GLOBE.r" r="4" />
        <circle class="demo__cut" data-explain="pole" :cx="GLOBE.cx" :cy="GLOBE.cy + GLOBE.r" r="4" />
        <text class="demo__label demo__label--mark" :x="GLOBE.cx" y="58" text-anchor="middle">
          北极
        </text>
        <text class="demo__label demo__label--mark" :x="GLOBE.cx" y="344" text-anchor="middle">
          南极
        </text>
        <text class="demo__label" :x="GLOBE.cx" y="216" text-anchor="middle">赤道</text>
        <!-- 东西方向：沿纬线（赤道高度）自西向东 -->
        <g data-explain="east-west">
          <path class="demo__spin" :d="`M ${GLOBE.cx + GLOBE.r + 15} ${GLOBE.cy} L 570 ${GLOBE.cy}`" />
          <path class="demo__spin-head" :d="arrowHead(570, GLOBE.cy, 0, 12)" />
          <text class="demo__label demo__label--mark" x="570" y="180" text-anchor="middle">东</text>
          <path class="demo__spin" :d="`M ${GLOBE.cx - GLOBE.r - 15} ${GLOBE.cy} L 150 ${GLOBE.cy}`" />
          <path class="demo__spin-head" :d="arrowHead(150, GLOBE.cy, 180, 12)" />
          <text class="demo__label demo__label--mark" x="150" y="180" text-anchor="middle">西</text>
        </g>
        <text class="demo__caption-line" x="360" y="368" text-anchor="middle">
          纬线一行一行平行排列，指示东西方向
        </text>
      </g>

      <!-- ② 北极上方俯视：纬线是一个个同心圆，每条都是完整的圆 -->
      <g v-show="step === 1" class="demo__frame">
        <circle class="demo__globe-plain" :cx="GLOBE.cx" :cy="GLOBE.cy" :r="GLOBE.r" />
        <g class="demo__grid" data-explain="polar-ring">
          <circle
            v-for="c in polarCircles"
            :key="`pc${c.lat}`"
            :cx="GLOBE.cx"
            :cy="GLOBE.cy"
            :r="c.r.toFixed(2)"
          />
        </g>
        <circle
          class="demo__curve"
          data-explain="equator"
          :cx="GLOBE.cx"
          :cy="GLOBE.cy"
          :r="GLOBE.r"
          fill="none"
          stroke-width="3"
        />
        <circle class="demo__cut" data-explain="pole" :cx="GLOBE.cx" :cy="GLOBE.cy" r="5" />
        <text class="demo__label demo__label--mark" :x="GLOBE.cx" y="224" text-anchor="middle">
          北极点
        </text>
        <text class="demo__label" :x="GLOBE.cx + GLOBE.r + 10" y="199" text-anchor="start">赤道</text>
        <text class="demo__label" x="443" y="119" text-anchor="start">30°N</text>
        <text class="demo__label" x="411" y="152" text-anchor="start">60°N</text>
        <text class="demo__caption-line" x="360" y="368" text-anchor="middle">
          从北极点上方俯视：每条纬线都是一个完整的圆，纬度越高圆越小
        </text>
      </g>

      <!-- ③ 并排比大小：赤道最长，向两极递减 -->
      <g v-show="step === 2" class="demo__frame">
        <g v-for="c in compareCircles" :key="`cc${c.lat}`">
          <circle
            v-if="c.r > 0"
            class="demo__globe-plain"
            data-explain="length"
            :cx="c.x"
            :cy="COMPARE_Y"
            :r="c.r.toFixed(2)"
          />
          <circle v-else class="demo__cut" data-explain="pole" :cx="c.x" :cy="COMPARE_Y" r="5" />
          <text class="demo__label" :x="c.x" y="292" text-anchor="middle">{{ c.name }}</text>
          <text class="demo__label demo__label--faint" :x="c.x" y="310" text-anchor="middle">
            {{ c.length }}
          </text>
        </g>
        <text class="demo__label" x="546" y="178">再往北，</text>
        <text class="demo__label" x="546" y="196">纬线缩成</text>
        <text class="demo__label" x="546" y="214">一个点</text>
        <text class="demo__caption-line" x="360" y="352" text-anchor="middle">
          纬线长度 = 2πR·cosφ：赤道最长（约 4 万千米），向两极递减
        </text>
      </g>

      <!-- ④ 相邻纬线间隔处处相等（柱面展开图） -->
      <g v-show="step === 3" class="demo__frame">
        <text class="demo__label demo__label--mark" x="360" y="34" text-anchor="middle">
          把地球沿经线剪开铺平（柱面展开图）
        </text>
        <g class="demo__grid" data-explain="flat-parallel">
          <path
            v-for="l in flatParallels"
            :key="`fp${l.lat}`"
            :d="`M ${FLAT.left} ${l.y.toFixed(2)} L ${FLAT.right} ${l.y.toFixed(2)}`"
          />
          <path :d="`M ${FLAT.left} ${FLAT.top} L ${FLAT.left} ${FLAT.bottom}`" />
          <path :d="`M ${FLAT.right} ${FLAT.top} L ${FLAT.right} ${FLAT.bottom}`" />
        </g>
        <path
          class="demo__curve"
          data-explain="equator"
          :d="`M ${FLAT.left} ${equatorY.toFixed(2)} L ${FLAT.right} ${equatorY.toFixed(2)}`"
        />
        <text class="demo__label demo__label--faint" :x="FLAT.left" y="60" text-anchor="middle">
          0° 经线
        </text>
        <text class="demo__label demo__label--faint" :x="FLAT.right" y="60" text-anchor="middle">
          180° 经线
        </text>
        <!-- 相邻纬线的间隔：三段一样长 -->
        <g v-for="(g, i) in equalGaps" :key="`gap${i}`" data-explain="gap">
          <path class="demo__spin" :d="`M ${g.x} ${g.y1} L ${g.x} ${g.y2}`" />
          <path class="demo__spin-head" :d="arrowHead(g.x, g.y1, 270, 10)" />
          <path class="demo__spin-head" :d="arrowHead(g.x, g.y2, 90, 10)" />
        </g>
        <text class="demo__label demo__label--mark" x="118" y="131" text-anchor="end">30°</text>
        <text class="demo__label" :x="FLAT.right + 12" y="74" text-anchor="start">90°N</text>
        <text class="demo__label" :x="FLAT.right + 12" y="189" text-anchor="start">赤道</text>
        <text class="demo__label" :x="FLAT.right + 12" y="304" text-anchor="start">90°S</text>
        <text class="demo__caption-line" x="360" y="352" text-anchor="middle">
          不管在地球的哪个位置，1° 纬度都对应约 111 千米——间隔处处相等
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §2.2 纬线：概念与五个特点。
 *
 * 讲义里纬线的五个特点是「形状 / 指示方向 / 长度 / 间隔 / 关系」，
 * 每一句都要靠一幅画才能想明白，这里补的就是那几幅画：
 *   ① 侧视图 —— 纬线是一条条平行的横线，指示东西方向；
 *   ② 北极上方俯视 —— 纬线是一个个同心圆，所以每条纬线本身是个完整的圆；
 *   ③ 并排比大小 —— 赤道最长，向两极递减，到极点缩成一个点；
 *   ④ 柱面展开图 —— 相邻纬线间隔处处相等。
 *
 * 图形全部算出来：侧视图上纬度 φ 的纬线在 y = cy − R·sinφ、半宽 R·cosφ；
 * 俯视图里是半径 R·cosφ 的同心圆；长度按 2πR·cosφ 折算成千米。
 */
import DemoShell from '../DemoShell.vue'
import {
  EARTH_RADIUS_KM,
  KM_PER_DEGREE,
  equidistantY,
  latitudeArcKm,
  latitudeSegment,
  parallelLengthLabel,
  parallelRadiusRatio,
  polarRadius,
} from '../../data/latitudeCirclesGeometry'
import { arrowHead } from '../../data/svgParts'

const steps = [
  {
    id: 'side',
    title: '① 侧视图：纬线是一条条平行的横线',
    text: '纬线是一行一行平行排列的线，像格子纸一样均匀。沿着纬线走就是往东西方向走，所以纬线指示东西方向——「横成纬，竖成经」里的「横」说的就是它。',
  },
  {
    id: 'polar',
    title: '② 从北极点上方俯视：纬线是一个个同心圆',
    text: '换成从北极点正上方往下看，同一条纬线就成了一个完整的圆圈，一圈套一圈。所以每条纬线本身是一个圆（不是半圆），而且纬度越高那个圆越小，北极点收成一个点。',
  },
  {
    id: 'length',
    title: '③ 纬线的长度：赤道最长，向两极递减',
    text: '把几个纬线圈并排放一比就明白：赤道最长，约 4 万千米；越往两极，圈越小、线越短，到极点缩成一个点。折算成公式就是 2πR·cosφ——这是同一条事实的两种说法。',
  },
  {
    id: 'gap',
    title: '④ 相邻纬线之间的间隔处处相等',
    text: '把地球沿经线剪开铺平（柱面展开图），纬线变成平行而且等距的横线：不管你站在地球的哪个位置，1° 纬度都对应约 111 千米。会变的是经线的间隔，那是下一节的事。',
  },
]

/** 侧视图 / 俯视图共用的球 */
const GLOBE = { cx: 360, cy: 195, r: 125 }

/** ① 侧视图上的纬线（赤道另用强调色画） */
const sideParallels = [60, 30, -30, -60].map((lat) => ({
  lat,
  ...latitudeSegment(lat, GLOBE.cx, GLOBE.cy, GLOBE.r),
}))

/** ② 俯视图里的同心圆 */
const polarCircles = [30, 60].map((lat) => ({ lat, r: polarRadius(lat, GLOBE.r) }))

/** ③ 并排比较用的纬线圈 */
const COMPARE_Y = 190
const COMPARE_R = 85
const compareCircles = [0, 30, 60].map((lat, i) => ({
  lat,
  x: [100, 275, 410][i],
  r: COMPARE_R * Math.cos((lat * Math.PI) / 180),
  name: lat === 0 ? '赤道（0°）' : `${lat}°N`,
  length: `≈ ${parallelLengthLabel(lat, EARTH_RADIUS_KM)} km`,
}))
compareCircles.push({
  lat: 90,
  x: 520,
  r: 0,
  name: '90°N',
  length: '缩成一个点',
})

/** ④ 柱面展开图：纬度线等距 */
const FLAT = { left: 160, right: 560, top: 70, bottom: 300 }
const flatParallels = [90, 60, 30, 0, -30, -60, -90].map((lat) => ({
  lat,
  y: equidistantY(lat, FLAT.top, FLAT.bottom),
}))
const equatorY = equidistantY(0, FLAT.top, FLAT.bottom)

/** 相邻纬线之间那三段等长的间隔 */
const equalGaps = [0, 1, 2].map((i) => {
  const y1 = flatParallels[1 + i].y
  const y2 = flatParallels[2 + i].y
  return { x: 138, y1: Math.min(y1, y2), y2: Math.max(y1, y2) }
})

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * 这一节的图形是「怎么读图」而不是「怎么算数」，所以推导写的是
 * 读图判据的来由：纬线为什么平行、为什么等距、为什么长度递减。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 图上标的和这里写的用同一个函数，不会出现「图上 40000、文字写着 4 万」这种对不上。
 */
const vars = {
  lenEquator: parallelLengthLabel(0),
  len30: parallelLengthLabel(30),
  len60: parallelLengthLabel(60),
  ratio30: parallelRadiusRatio(30).toFixed(2),
  ratio60: parallelRadiusRatio(60).toFixed(2),
  r30: polarRadius(30, GLOBE.r).toFixed(1),
  r60: polarRadius(60, GLOBE.r).toFixed(1),
  oneDegKm: latitudeArcKm(1).toFixed(1),
  gapKm: KM_PER_DEGREE,
}

const explains = {
  parallel: {
    name: '纬线',
    hint: '绕地球一周、把所有同纬度点连起来的线，指示东西方向。',
    vars,
    steps: [
      '纬线是纬圈的投影；纬圈是「过地轴的平面」与大球面的交线',
      '平面与球面的交线必是圆 ⇒ 纬圈是圆，纬线是它在地图上的投影',
      '所有纬圈所在的平面互相平行 ⇒ 侧视图上纬线是一行行平行线',
      '沿着纬线移动就是往东西走 ⇒ 纬线指示东西方向',
    ],
  },
  equator: {
    name: '赤道',
    hint: '0° 纬线，地球的腰带，同时又是一个经线圈。',
    vars,
    steps: [
      '赤道所在的平面过球心 ⇒ 它切出来的是一个大圆',
      '大圆周长 = 2πR = 2 × 3.14 × 6371 ≈ {lenEquator} 千米',
      '赤道平面与地轴垂直 ⇒ 把地球分成南北两个半球',
      '所以赤道既是纬线的起点（0°），又是经线圈的一员',
    ],
  },
  pole: {
    name: '南北两极',
    hint: '地轴的两端，纬线在这里缩成一个点。',
    vars,
    steps: [
      '地轴穿过球心，它的两端与球面的交点就是南北两极',
      '所有经线都从北极出发、在南极收尾 ⇒ 经线在两极交于一点',
      '极点处纬线长度 = 2πR·cos90° = 0 ⇒ 缩成一个点',
      '所以极点处经线间隔也是 0',
    ],
  },
  'east-west': {
    name: '东西方向',
    hint: '地球自西向东转，纬线与自转方向相切，所以它指示东西。',
    vars,
    steps: [
      '地球自西向东自转',
      '从北极上方俯视是逆时针，从南极上方俯视是顺时针',
      '自转方向在赤道处与纬线平行 ⇒ 沿纬线移动即向东或向西',
      '这就是「纬线指示东西方向」的来由',
    ],
  },
  'polar-ring': {
    name: '同心圆（极点俯视）',
    hint: '从北极点正上方往下看，同一条纬线是一个完整的圆。',
    vars,
    steps: [
      '从极点俯视时，纬圈所在的平面都垂直于视线 ⇒ 投影不缩短',
      '每条纬圈都是圆 ⇒ 俯视图里就是一圈套一圈的同心圆',
      '圆的半径 = R·cosφ：30°N 是 R·{ratio30}（图上约 {r30}），60°N 是 R·{ratio60}（图上约 {r60}）',
      '纬度越高圆越小，到北极点收成一个点',
    ],
  },
  length: {
    name: '纬线长度',
    hint: '同一条纬线上各点到地轴的距离相等，所以这条纬线一样长。',
    vars,
    steps: [
      '纬线长度 = 纬圈周长 = 2πR·cosφ',
      '赤道（φ = 0°）：2π × 6371 ≈ {lenEquator} 千米 —— 最长',
      '30°N：2π × 6371 × cos30° ≈ {len30} 千米',
      '60°N：2π × 6371 × cos60° ≈ {len60} 千米 —— 正好是赤道的一半',
      'φ → 90° 时 cosφ → 0 ⇒ 纬线缩成一个点',
    ],
  },
  'flat-parallel': {
    name: '柱面展开图',
    hint: '把地球沿经线剪开铺平，纬线变成等距的平行横线。',
    vars,
    steps: [
      '沿经线把球剪开、展平成矩形 —— 这就是等距圆柱投影',
      '横轴是经度，纵轴是纬度',
      '纬度是「线面角」，量出来的就是绕地轴转过的角度',
      '所以展开图上纬线的间距与度数成正比：每 1° 一行',
      '经线则被拉成等长的竖线（经线本来就处处一样长）',
    ],
  },
  gap: {
    name: '相邻纬线的间隔',
    hint: '不管你站在地球的哪个位置，1° 纬度对应的实地距离都一样。',
    vars,
    steps: [
      '1° 纬度 = 绕地轴转 1° 的弧长',
      '弧长 = R × 弧度 = 6371 × (π/180) ≈ {oneDegKm} 千米',
      '讲义里取整成 {gapKm} 千米',
      '因为量的是「转过多少度」而不是「站在哪里」⇒ 间隔处处相等',
      '所以在展开图上量纬线间隔，就能当实地距离用',
    ],
  },
}
</script>
