<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- 底图：北极上方俯视，两点在同一条纬线上 -->
      <g>
        <circle class="demo__globe-plain" :cx="POLAR.cx" :cy="POLAR.cy" :r="POLAR.r" />
        <g class="demo__grid">
          <path data-explain="equator" :d="circlePath(POLAR.cx, POLAR.cy, POLAR.r)" />
          <path data-explain="parallel-ring" :d="circlePath(POLAR.cx, POLAR.cy, RING_R)" />
        </g>
        <g data-explain="spin">
          <path class="demo__spin" :d="arcBetween(POLAR.cx, POLAR.cy, POLAR.r + 20, 30, 90, false)" />
          <path
            class="demo__spin-head"
            :d="arrowHead(tip(90, POLAR.r + 20).x, tip(90, POLAR.r + 20).y, 180, 13)"
          />
          <text class="demo__label demo__label--mark" x="360" y="32" text-anchor="middle">
            自转方向（逆时针）＝往东
          </text>
        </g>
        <circle class="demo__cut" data-explain="point-a" :cx="a.x" :cy="a.y" r="6" />
        <circle class="demo__cut" data-explain="point-b" :cx="b.x" :cy="b.y" r="6" />
        <text class="demo__label demo__label--mark" :x="a.x - 12" :y="a.y + 8" text-anchor="end">
          A
        </text>
        <text class="demo__label demo__label--mark" :x="b.x + 12" :y="b.y - 6" text-anchor="start">
          B
        </text>
        <text class="demo__label" x="40" y="322" text-anchor="start">A：西经 {{ aWest }}°</text>
        <text class="demo__label" x="40" y="342" text-anchor="start">B：东经 {{ bLon }}°</text>
      </g>

      <!-- ① A、B 两点 -->
      <g v-show="step === 0" class="demo__frame">
        <text class="demo__caption-line" x="360" y="368" text-anchor="middle">
          沿同一条纬线从 A 走到 B 有两种走法：顺自转方向往东、逆自转方向往西
        </text>
      </g>

      <!-- ② 画出两条弧 -->
      <g v-show="step === 1" class="demo__frame">
        <path class="demo__leader" data-explain="far-arc" :d="farArc" />
        <path class="demo__curve" data-explain="near-arc" :d="nearArc" />
        <path class="demo__spin-head" data-explain="direction" :d="nearHead" />
        <path class="demo__spin-head" data-explain="far-arc" :d="farHead" />
        <text class="demo__caption-line" x="360" y="368" text-anchor="middle">
          往东走 {{ eastSpan }}°（远路），往西走 {{ westSpan }}°（近路）
        </text>
      </g>

      <!-- ③ 近的那条是劣弧 -->
      <g v-show="step === 2" class="demo__frame">
        <path class="demo__leader" data-explain="far-arc" :d="farArc" />
        <path class="demo__curve" data-explain="near-arc" :d="nearArc" />
        <path class="demo__spin-head" data-explain="direction" :d="nearHead" />
        <path class="demo__spin-head" data-explain="far-arc" :d="farHead" />
        <path class="demo__spin" data-explain="minor-angle" :d="nearAngleArc" />
        <path class="demo__spin" data-explain="major-angle" :d="farAngleArc" />
        <text class="demo__label demo__label--mark" :x="labelNearAngle.x" :y="labelNearAngle.y + 6" text-anchor="middle">
          {{ nearSpan }}°
        </text>
        <text class="demo__label" :x="labelFarAngle.x" :y="labelFarAngle.y + 6" text-anchor="middle">
          {{ farSpan }}°
        </text>
        <text class="demo__label demo__label--mark" :x="labelNear.x" :y="labelNear.y" text-anchor="middle">
          劣弧
        </text>
        <text class="demo__label" :x="labelFar.x" :y="labelFar.y" text-anchor="middle">优弧</text>
        <text class="demo__caption-line" x="360" y="368" text-anchor="middle">
          近的那条弧 = 劣弧：所对圆心角 {{ nearSpan }}° &lt; 180°；远的那条 {{ farSpan }}° = 优弧
        </text>
      </g>

      <!-- ④ 劣弧定东西 -->
      <g v-show="step === 3" class="demo__frame">
        <path class="demo__leader" data-explain="far-arc" :d="farArc" />
        <path class="demo__curve" data-explain="near-arc" :d="nearArc" />
        <path class="demo__spin-head" data-explain="direction" :d="nearHead" />
        <path class="demo__spin-head" data-explain="far-arc" :d="farHead" />
        <path class="demo__spin" data-explain="minor-angle" :d="nearAngleArc" />
        <path class="demo__spin" data-explain="major-angle" :d="farAngleArc" />
        <text class="demo__label demo__label--mark" :x="labelNearAngle.x" :y="labelNearAngle.y + 6" text-anchor="middle">
          {{ nearSpan }}°
        </text>
        <text class="demo__label" :x="labelFarAngle.x" :y="labelFarAngle.y + 6" text-anchor="middle">
          {{ farSpan }}°
        </text>
        <text class="demo__label demo__label--mark" :x="labelNear.x" :y="labelNear.y" text-anchor="middle">
          劣弧（近路）
        </text>
        <text class="demo__caption-line" x="360" y="322" text-anchor="middle">
          近路往西才到得了 B → A 在 B 的东边
        </text>
        <text class="demo__caption-line" x="360" y="346" text-anchor="middle">
          这就是「劣弧定东西」：经度差超过 180° 时，左右要调换
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §2.13 经纬网定相对方向（考点二）——劣弧定东西。
 *
 * 讲义里的判定办法是：想象沿同一条纬线从 A 点走到 B 点有两种走法，
 * 顺地球自转方向往东、逆自转方向往西；近的那条弧就是劣弧，
 * 两点的东西关系按这条近路判。这一段补的就是那幅画：
 *   ① 极点俯视图上的 A、B 两点；
 *   ② 沿同一条纬线的两条弧：往东 220°（远）、往西 140°（近）；
 *   ③ 近的那条是劣弧，所对圆心角 140° < 180°；
 *   ④ 劣弧定东西：A 在 B 的东边，左右要调换。
 *
 * 角度全部算出来：A 是西经 55°（= 东经 305°）、B 是东经 165°，
 * 自东向东的经度差 220° > 180°，所以近路是往西的 140°。
 */
import DemoShell from '../DemoShell.vue'
import {
  arcBetween,
  arcMidAngle,
  eastwardDifference,
  eastEquivalent,
  majorArcAngle,
  minorArcAngle,
  nearerDirection,
  westwardDifference,
} from '../../data/greatArcDirectionGeometry'
import { polarMeridianAngle } from '../../data/mapViewsGeometry'
import { arrowHead, circlePath } from '../../data/svgParts'

const POLAR = { cx: 360, cy: 195, r: 120 }
/** A、B 所在的那条纬线在图上的半径 */
const RING_R = 80

/** A：西经 55°（东经 305°）；B：东经 165° */
const A_WEST = 55
const A_LON = eastEquivalent(A_WEST)
const B_LON = 165
const A_ANGLE = polarMeridianAngle(A_LON)
const B_ANGLE = polarMeridianAngle(B_LON)

/** 往东的经度差（220°，是远路）与近路的圆心角（140°） */
const EAST_SPAN = eastwardDifference(A_LON, B_LON)
const WEST_SPAN = westwardDifference(A_LON, B_LON)
const NEAR_SPAN = minorArcAngle(A_LON, B_LON)
const FAR_SPAN = majorArcAngle(A_LON, B_LON)

/** 图上标的度数：图与讲解共用同一份 */
const aWest = String(A_WEST)
const bLon = String(B_LON)
const eastSpan = String(EAST_SPAN)
const westSpan = String(WEST_SPAN)
const nearSpan = String(NEAR_SPAN)
const farSpan = String(FAR_SPAN)

const steps = [
  {
    id: 'two-points',
    title: '① 两点之间，沿纬线有两种走法',
    text: '在极点俯视图上，A（西经 55°）和 B（东经 165°）落在同一条纬线上。从 A 走到 B，顺着地球自转方向往东是一种走法，逆着自转方向往西是另一种。',
  },
  {
    id: 'two-arcs',
    title: '② 两条弧：一条远，一条近',
    text: `往东走要 ${EAST_SPAN}°，往西走只要 ${NEAR_SPAN}°——这就是「经度差超过 180° 要调换左右」的直观原因。图上实线那条是近路，虚线那条是远路，箭头标的就是走的方向。`,
  },
  {
    id: 'minor',
    title: '③ 近的那条弧 = 劣弧',
    text: `近的那条弧所对的圆心角小于 180°，叫劣弧；远的那条大于 180°，叫优弧。判断东西只看劣弧——注意劣弧是「较短的那条」，不是「东边的那条」。`,
  },
  {
    id: 'direction',
    title: '④ 劣弧定东西：左右要对调',
    text: '近路是往西才到得了 B，说明 A 在 B 的东边——按「左西右东」画出来会反，必须调换。这条办法在极点俯视图上不用标经纬度，用肉眼就能比。',
  },
]

/** 从极点出发的落点 */
function tip(angle, r = RING_R) {
  const a = (angle * Math.PI) / 180
  return {
    x: POLAR.cx + r * Math.cos(a),
    y: POLAR.cy - r * Math.sin(a),
  }
}

const a = tip(A_ANGLE)
const b = tip(B_ANGLE)

/** 往东（逆时针）的远路、往西（顺时针）的近路 */
const nearClockwise = nearerDirection(A_LON, B_LON) === 'west'
const nearArc = arcBetween(
  POLAR.cx,
  POLAR.cy,
  RING_R,
  A_ANGLE,
  B_ANGLE,
  nearClockwise,
)
const farArc = arcBetween(POLAR.cx, POLAR.cy, RING_R, A_ANGLE, B_ANGLE, !nearClockwise)

/** 两条弧上的箭头（沿行走方向） */
const nearMid = arcMidAngle(A_ANGLE, B_ANGLE, nearClockwise)
const farMid = arcMidAngle(A_ANGLE, B_ANGLE, !nearClockwise)
const nearHead = arrowHead(
  tip(nearMid).x,
  tip(nearMid).y,
  nearClockwise ? nearMid - 90 : nearMid + 90,
  12,
)
const farHead = arrowHead(
  tip(farMid).x,
  tip(farMid).y,
  nearClockwise ? farMid + 90 : farMid - 90,
  12,
)

/** 圆心角（俯视图的圆心就是极点，所以圆心角就是经度差） */
const nearAngleArc = arcBetween(POLAR.cx, POLAR.cy, 34, B_ANGLE, A_ANGLE, false)
const farAngleArc = arcBetween(POLAR.cx, POLAR.cy, 34, A_ANGLE, B_ANGLE, false)

const labelNear = tip(nearMid, 95)
const labelFar = tip(farMid, 95)
/** 两个圆心角标注的位置 */
const labelNearAngle = tip(nearMid, 48)
const labelFarAngle = tip(farMid, 48)

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * 这一节的推导是「劣弧为什么能定东西」：
 * 沿纬线有两条路 → 近的那条是劣弧 → 顺着劣弧的走向判断谁在东边。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 图上标的 140°、220° 与这里说的是同一个值。
 */
const vars = {
  aWest,
  aEast: String(A_LON),
  bLon,
  eastSpan,
  westSpan,
  nearSpan,
  farSpan,
  nearDir: nearClockwise ? '往西' : '往东',
  farDir: nearClockwise ? '往东' : '往西',
}

const explains = {
  equator: {
    name: '赤道',
    hint: '俯视图最外圈就是赤道——A、B 所在的那条纬线在它里面。',
    vars,
    steps: [
      '从北极点正上方俯视，球的轮廓是一个圆，那就是赤道',
      '每一条纬线都是它里面的同心圆',
      '所以 A、B 落在同一个圆上 ⇒ 它们同纬度',
      '同纬度的两点，沿纬线有两条路可走',
    ],
  },
  'parallel-ring': {
    name: 'A、B 所在的纬线',
    hint: '同一条纬线，绕它一圈正好 360°。',
    vars,
    steps: [
      '同纬度 ⇒ 俯视图里落在同一个同心圆上',
      '绕这个圆从 A 到 B，顺着自转方向是一种走法，逆着是另一种',
      '两条路合起来正好一整圈 = 360°',
      '所以往东的度数 + 往西的度数 = 360°',
      '本图：往东 {eastSpan}° + 往西 {westSpan}° = 360°',
    ],
  },
  spin: {
    name: '自转方向',
    hint: '北极上方俯视是逆时针，也就是往东。',
    vars,
    steps: [
      '地球自西向东自转',
      '从北极点上方俯视是逆时针，从南极点上方俯视是顺时针',
      '所以逆时针 = 往东，顺时针 = 往西',
      '这一条定了，「往东近还是往西近」才有唯一答案',
    ],
  },
  'point-a': {
    name: 'A 点',
    hint: 'A 在西经 55°，也就是东经 305°。',
    vars,
    steps: [
      '西经 55° 换成东经 = 360° − {aWest}° = {aEast}°',
      'A 与 B 在同一条纬线上 ⇒ 沿纬线有两条路可走',
      '俯视图的圆心是北极点 ⇒ 圆心角就是经度差',
    ],
  },
  'point-b': {
    name: 'B 点',
    hint: 'B 在东经 165°。',
    vars,
    steps: [
      'B 的经度 = 东经 {bLon}°',
      '从 A（东经 {aEast}°）自东向东走到 B：{eastSpan}°',
      '从 A 自西（逆自转方向）走到 B：{westSpan}°',
      '{eastSpan}° > 180° ⇒ 往东是远路，往西才是近路',
    ],
  },
  'near-arc': {
    name: '近路（劣弧）',
    hint: '走得近的那条弧，所对圆心角小于 180°。',
    vars,
    steps: [
      '近路的经度差 = {westSpan}° < 180°',
      '圆心角小于 180° 的弧叫劣弧',
      '劣弧是「较短的那条」，不是「东边的那条」',
      '判东西只看劣弧 —— 这一步是整节的结论所在',
    ],
  },
  'far-arc': {
    name: '远路（优弧）',
    hint: '走得远的那条弧，所对圆心角大于 180°。',
    vars,
    steps: [
      '远路的经度差 = {eastSpan}° > 180°',
      '圆心角大于 180° 的弧叫优弧',
      '两条弧合起来 = 一整圈：{westSpan}° + {eastSpan}° = 360°',
      '优弧在图上就是那段绕了远路的弧',
    ],
  },
  'minor-angle': {
    name: '劣弧的圆心角',
    hint: '俯视图的圆心就是极点，所以圆心角就是经度差。',
    vars,
    steps: [
      '俯视图的圆心是北极点',
      '劣弧的圆心角 = 近路的经度差 = {nearSpan}°',
      '{nearSpan}° < 180° ⇒ 确属劣弧',
      '所以经度差超过 180° 时，要先把两条路都算出来再取近的',
    ],
  },
  'major-angle': {
    name: '优弧的圆心角',
    hint: '优弧所对的圆心角，大于 180°。',
    vars,
    steps: [
      '优弧的圆心角 = 远路的经度差 = {farSpan}°',
      '{farSpan}° > 180° ⇒ 确属优弧',
      '远路 = 360° − {nearSpan}° = {farSpan}°',
      '两个圆心角合起来 360°，正好一整圈',
    ],
  },
  direction: {
    name: '近路的方向',
    hint: '看近路箭头的指向，就知道两点谁在东边。',
    vars,
    steps: [
      '近路走的是{nearDir}（{westSpan}°）',
      'A 顺着近路能走到 B ⇒ B 在 A 的西边 ⇒ A 在 B 的东边',
      '所以在经纬网图上按「左西右东」直接摆，A 和 B 的左右要调换',
      '判断口径固定成一条：两点的东西关系一律按劣弧走',
      '远路走的是{farDir}（{eastSpan}°），它指向相反，不能用',
    ],
  },
}
</script>
