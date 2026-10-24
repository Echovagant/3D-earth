<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- 底图：北极上方俯视，两点在同一条纬线上 -->
      <g>
        <circle class="demo__globe-plain" :cx="POLAR.cx" :cy="POLAR.cy" :r="POLAR.r" />
        <g class="demo__grid">
          <path :d="circlePath(POLAR.cx, POLAR.cy, POLAR.r)" />
          <path :d="circlePath(POLAR.cx, POLAR.cy, RING_R)" />
        </g>
        <path
          class="demo__spin"
          :d="arcBetween(POLAR.cx, POLAR.cy, POLAR.r + 20, 30, 90, false)"
        />
        <path
          class="demo__spin-head"
          :d="arrowHead(tip(90, POLAR.r + 20).x, tip(90, POLAR.r + 20).y, 180, 13)"
        />
        <text class="demo__label demo__label--mark" x="360" y="32" text-anchor="middle">
          自转方向（逆时针）＝往东
        </text>
        <circle class="demo__cut" :cx="a.x" :cy="a.y" r="6" />
        <circle class="demo__cut" :cx="b.x" :cy="b.y" r="6" />
        <text class="demo__label demo__label--mark" :x="a.x - 12" :y="a.y + 8" text-anchor="end">
          A
        </text>
        <text class="demo__label demo__label--mark" :x="b.x + 12" :y="b.y - 6" text-anchor="start">
          B
        </text>
        <text class="demo__label" x="40" y="322" text-anchor="start">A：西经 55°</text>
        <text class="demo__label" x="40" y="342" text-anchor="start">B：东经 165°</text>
      </g>

      <!-- ① A、B 两点 -->
      <g v-show="step === 0" class="demo__frame">
        <text class="demo__caption-line" x="360" y="368" text-anchor="middle">
          沿同一条纬线从 A 走到 B 有两种走法：顺自转方向往东、逆自转方向往西
        </text>
      </g>

      <!-- ② 画出两条弧 -->
      <g v-show="step === 1" class="demo__frame">
        <path class="demo__leader" :d="farArc" />
        <path class="demo__curve" :d="nearArc" />
        <path class="demo__spin-head" :d="nearHead" />
        <path class="demo__spin-head" :d="farHead" />
        <text class="demo__caption-line" x="360" y="368" text-anchor="middle">
          往东走 220°（远路），往西走 140°（近路）
        </text>
      </g>

      <!-- ③ 近的那条是劣弧 -->
      <g v-show="step === 2" class="demo__frame">
        <path class="demo__leader" :d="farArc" />
        <path class="demo__curve" :d="nearArc" />
        <path class="demo__spin-head" :d="nearHead" />
        <path class="demo__spin-head" :d="farHead" />
        <path class="demo__spin" :d="nearAngleArc" />
        <path class="demo__spin" :d="farAngleArc" />
        <text class="demo__label demo__label--mark" :x="labelNearAngle.x" :y="labelNearAngle.y + 6" text-anchor="middle">
          140°
        </text>
        <text class="demo__label" :x="labelFarAngle.x" :y="labelFarAngle.y + 6" text-anchor="middle">
          220°
        </text>
        <text class="demo__label demo__label--mark" :x="labelNear.x" :y="labelNear.y" text-anchor="middle">
          劣弧
        </text>
        <text class="demo__label" :x="labelFar.x" :y="labelFar.y" text-anchor="middle">优弧</text>
        <text class="demo__caption-line" x="360" y="368" text-anchor="middle">
          近的那条弧 = 劣弧：所对圆心角 140° &lt; 180°；远的那条 220° = 优弧
        </text>
      </g>

      <!-- ④ 劣弧定东西 -->
      <g v-show="step === 3" class="demo__frame">
        <path class="demo__leader" :d="farArc" />
        <path class="demo__curve" :d="nearArc" />
        <path class="demo__spin-head" :d="nearHead" />
        <path class="demo__spin-head" :d="farHead" />
        <path class="demo__spin" :d="nearAngleArc" />
        <path class="demo__spin" :d="farAngleArc" />
        <text class="demo__label demo__label--mark" :x="labelNearAngle.x" :y="labelNearAngle.y + 6" text-anchor="middle">
          140°
        </text>
        <text class="demo__label" :x="labelFarAngle.x" :y="labelFarAngle.y + 6" text-anchor="middle">
          220°
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
  minorArcAngle,
  nearerDirection,
} from '../../data/greatArcDirectionGeometry'
import { polarMeridianAngle } from '../../data/mapViewsGeometry'
import { arrowHead, circlePath } from '../../data/svgParts'

const POLAR = { cx: 360, cy: 195, r: 120 }
/** A、B 所在的那条纬线在图上的半径 */
const RING_R = 80

/** A：西经 55°（东经 305°）；B：东经 165° */
const A_LON = 305
const B_LON = 165
const A_ANGLE = polarMeridianAngle(A_LON)
const B_ANGLE = polarMeridianAngle(B_LON)

/** 往东的经度差（220°，是远路）与近路的圆心角（140°） */
const EAST_SPAN = eastwardDifference(A_LON, B_LON)
const NEAR_SPAN = minorArcAngle(A_LON, B_LON)

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
</script>
