<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- 底图：北极上方俯视，30°E 这条经线 -->
      <g>
        <circle class="demo__globe-plain" :cx="POLAR.cx" :cy="POLAR.cy" :r="POLAR.r" />
        <g class="demo__grid">
          <path
            v-for="m in polarGrid.meridians"
            :key="`bg${m.lon}`"
            data-explain="polar-meridian"
            :d="`M ${POLAR.cx} ${POLAR.cy} L ${polarTip(m.angle)}`"
          />
          <path data-explain="equator" :d="circlePath(POLAR.cx, POLAR.cy, POLAR.r)" />
        </g>
        <path
          class="demo__curve"
          data-explain="meridian-30"
          :d="`M ${POLAR.cx} ${POLAR.cy} L ${polarTip(polarAngle(30))}`"
        />
        <circle class="demo__cut" data-explain="north-pole" :cx="POLAR.cx" :cy="POLAR.cy" r="5" />
        <text class="demo__label demo__label--mark" :x="POLAR.cx + 12" :y="POLAR.cy - 4">
          北极点
        </text>
        <text class="demo__label" :x="POLAR.cx + POLAR.r + 12" y="199" text-anchor="start">
          赤道
        </text>
      </g>

      <!-- ① 先画一条经线 -->
      <g v-show="step === 0" class="demo__frame">
        <text class="demo__label demo__label--mark" x="330" y="262" text-anchor="start">
          东经 30°
        </text>
        <path class="demo__leader" d="M 326 258 L 303 280" />
        <text class="demo__label demo__label--mark" x="360" y="44" text-anchor="middle">
          经线是半圆：必须两条合起来才是一个完整的圆
        </text>
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          先在球上画一条：东经 30°
        </text>
      </g>

      <!-- ② 画出对应经线：西经 150°，正对着 -->
      <g v-show="step === 1" class="demo__frame">
        <path
          class="demo__curve"
          data-explain="meridian-150"
          :d="`M ${POLAR.cx} ${POLAR.cy} L ${polarTip(polarAngle(-150))}`"
        />
        <text class="demo__label demo__label--mark" x="330" y="262" text-anchor="start">
          东经 30°
        </text>
        <path class="demo__leader" d="M 326 258 L 303 280" />
        <text class="demo__label demo__label--mark" x="152" y="62" text-anchor="end">
          西经 150°
        </text>
        <path class="demo__leader" d="M 160 66 L 192 96" />
        <text class="demo__label" x="360" y="44" text-anchor="middle">
          30° + 150° = 180°，符号相反，一条 E 一条 W
        </text>
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          它的对应经线是西经 150°：相差 180°、正对着，两条一起过南北两极
        </text>
      </g>

      <!-- ③ 两条合起来 = 经线圈 -->
      <g v-show="step === 2" class="demo__frame">
        <path
          class="demo__curve"
          data-explain="meridian-150"
          :d="`M ${POLAR.cx} ${POLAR.cy} L ${polarTip(polarAngle(-150))}`"
        />
        <text class="demo__label demo__label--mark" x="360" y="44" text-anchor="middle">
          两条半圆拼成一个过两极的整圆，这叫经线圈
        </text>
        <!-- 正对着看经线圈 -->
        <path
          class="demo__leader"
          data-explain="ring"
          :d="`M ${RING.cx} ${RING.cy - RING.r} A ${RING.r} ${RING.r} 0 0 0 ${RING.cx} ${RING.cy + RING.r}`"
        />
        <path
          class="demo__curve"
          data-explain="ring"
          :d="`M ${RING.cx} ${RING.cy - RING.r} A ${RING.r} ${RING.r} 0 0 1 ${RING.cx} ${RING.cy + RING.r}`"
        />
        <g class="demo__grid">
          <path :d="`M ${RING.cx} ${RING.cy - RING.r} L ${RING.cx} ${RING.cy + RING.r}`" />
        </g>
        <circle class="demo__cut" :cx="RING.cx" :cy="RING.cy - RING.r" r="4" />
        <circle class="demo__cut" :cx="RING.cx" :cy="RING.cy + RING.r" r="4" />
        <text class="demo__label" :x="RING.cx" y="88" text-anchor="middle">北极</text>
        <text class="demo__label" :x="RING.cx" y="306" text-anchor="middle">南极</text>
        <text
          class="demo__label demo__label--mark"
          :x="RING.cx + RING.r + 12"
          y="180"
          text-anchor="start"
        >
          东经 30°
        </text>
        <text
          class="demo__label demo__label--mark"
          :x="RING.cx - RING.r - 12"
          y="180"
          text-anchor="end"
        >
          西经 150°
        </text>
        <text class="demo__label demo__label--faint" :x="RING.cx" y="328" text-anchor="middle">
          经线圈（正对着看）
        </text>
        <text class="demo__caption-line" x="360" y="364" text-anchor="middle">
          经线圈 = 两条正对着南北两极的经线
        </text>
      </g>

      <!-- ④ 判定规则 -->
      <g v-show="step === 3" class="demo__frame">
        <path
          class="demo__curve"
          data-explain="meridian-150"
          :d="`M ${POLAR.cx} ${POLAR.cy} L ${polarTip(polarAngle(-150))}`"
        />
        <text class="demo__label demo__label--mark" :x="POLAR.cx" y="330" text-anchor="middle">
          30°E 与 150°W：正对着，是经线圈
        </text>
        <g data-explain="counter">
          <circle class="demo__globe-plain" cx="565" cy="170" r="78" />
          <g class="demo__grid">
            <path :d="circlePath(565, 170, 78)" />
          </g>
          <path class="demo__curve" :d="`M 565 170 L ${miniTip(565, 170, 78, polarAngle(30))}`" />
          <path class="demo__leader" :d="`M 565 170 L ${miniTip(565, 170, 78, polarAngle(-30))}`" />
          <circle class="demo__cut" cx="565" cy="170" r="4" />
          <text class="demo__label" x="565" y="272" text-anchor="middle">
            30°E 与 30°W：差 60°，不是
          </text>
        </g>
        <text class="demo__label demo__label--mark" x="360" y="300" text-anchor="middle">
          判定：度数之和 = 180°，且符号相反（一个 E 一个 W）
        </text>
        <text class="demo__label" x="360" y="324" text-anchor="middle">
          特例：0° 与 180° 也是一对（两个都没有符号）
        </text>
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          特殊经线：0° 与 180° 划分东西经
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §2.10 对应经线（经线圈）与特殊经线。
 *
 * 讲义里那句「必须两条经线合起来才是完整的圆」，补的就是这幅画：
 *   ① 先在球上画一条经线（东经 30°）；
 *   ② 画出它的对应经线（西经 150°），相差 180°、正对着；
 *   ③ 两条合起来是一个过南北两极的完整大圆——经线圈；
 *   ④ 判定规则：度数之和 = 180° 且符号相反；0° 与 180° 是特例。
 *
 * 用极点俯视图画，因为俯视图里一条经线就是一条半径：
 * 正对着的两条经线拼成一条直线，同名的两条则成一个夹角——
 * 侧视图里这两组投影完全一样，分不出对错，所以不用侧视图。
 */
import DemoShell from '../DemoShell.vue'
import { counterpartLongitude, degreeSum, isMeridianPair } from '../../data/meridianPairGeometry'
import { polarMeridianAngle, polarViewGrid } from '../../data/mapViewsGeometry'
import { circlePath } from '../../data/svgParts'

const steps = [
  {
    id: 'one',
    title: '① 经线是半圆，得两条才成圆',
    text: '上一节说过：经线是半圆，一个完整的圆叫经线圈。所以「一条经线」永远是半条，必须找到它的另一半才敢说是圆。先在球上画一条：东经 30°。',
  },
  {
    id: 'pair',
    title: '② 对应经线：相差 180°，正对着',
    text: '东经 30° 的对应经线是西经 150°：度数之和正好 180°，符号相反，一条 E 一条 W。它们正对着，一起从北极穿过地球到南极。',
  },
  {
    id: 'ring',
    title: '③ 两条合起来 = 经线圈',
    text: '把这两条半圆拼起来，就是一个过南北两极的完整大圆，标准名称叫经线圈（老师叫它「CP 经线」）。正对着看，它就是一个圆，两极是圆上相对的两个点。',
  },
  {
    id: 'rule',
    title: '④ 怎么判断两条是不是一对',
    text: '两条同时满足才算一对：度数之和等于 180°，而且符号相反。同名的两条不是一对（30°E 与 30°W 度数和只有 60°）；0° 与 180° 是特例，两个都没有符号，但确实是一对。',
  },
]

const POLAR = { cx: 250, cy: 195, r: 110 }
const RING = { cx: 555, cy: 195, r: 95 }

const polarGrid = polarViewGrid({
  cx: POLAR.cx,
  cy: POLAR.cy,
  radius: POLAR.r,
  parallels: [],
  meridians: [0, 45, 90, 135, 180, 225, 270, 315],
})

/** 俯视图里某条经线的方位角：0° 在正下方，东经沿逆时针增大 */
const polarAngle = polarMeridianAngle

/** 从极点画到赤道上的落点 */
function polarTip(angle) {
  const a = (angle * Math.PI) / 180
  return `${(POLAR.cx + POLAR.r * Math.cos(a)).toFixed(2)} ${(POLAR.cy - POLAR.r * Math.sin(a)).toFixed(2)}`
}

/** 小示意图里同样的落点 */
function miniTip(cx, cy, r, angle) {
  const a = (angle * Math.PI) / 180
  return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy - r * Math.sin(a)).toFixed(2)}`
}

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * 这一节的推导是「两条经线凭什么算一对」：
 * 度数之和 180° 且符号相反 ⇒ 方位角正好差 180° ⇒ 正对着 ⇒ 合起来是经线圈。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 判定函数算出来的结论与图上画的位置是同一套。
 */
const PAIR_A = '30E'
const PAIR_B = '150W'
const COUNTER_A = '30E'
const COUNTER_B = '30W'
const counterpart = counterpartLongitude(30, 'E')

const vars = {
  pairSum: String(degreeSum(PAIR_A, PAIR_B)),
  counterSum: String(degreeSum(COUNTER_A, COUNTER_B)),
  pairVerdict: isMeridianPair(PAIR_A, PAIR_B) ? '是一对' : '不是一对',
  counterVerdict: isMeridianPair(COUNTER_A, COUNTER_B) ? '是一对' : '不是一对',
  counterpart: `${counterpart.sign}经 ${counterpart.value}°`,
  ang30: String(polarAngle(30)),
  ang150: String(polarAngle(-150)),
}

const explains = {
  'polar-meridian': {
    name: '俯视图里的经线',
    hint: '在极点俯视图里，一条经线就是一条从圆心射出的半径。',
    vars,
    steps: [
      '从北极点正上方俯视：纬线变成同心圆，经线变成半径',
      '半径的方位角就是经度：0° 画在正下方，东经沿逆时针增大',
      '东经 30° 的方位角 = {ang30}°，西经 150° 的方位角 = {ang150}°',
      '两个方位角正好相差 180° ⇒ 这两条在俯视图里是「正对着」的',
      '所以俯视图一眼就能看出是不是一对，不必量角度',
    ],
  },
  equator: {
    name: '赤道',
    hint: '俯视图最外圈就是赤道，经线与它的交点就是这条经线的落点。',
    vars,
    steps: [
      '从北极点俯视时，赤道是一个完整的圆（球的轮廓）',
      '每条经线都落在这个圆上，落点的方位角就是它的经度',
      '0° 与 180° 正好落在圆的两个端点上',
      '所以「正对着」在俯视图上就是「一条直径的两头」',
    ],
  },
  'meridian-30': {
    name: '东经 30°',
    hint: '先在球上画的一条经线——它需要一条对应的经线才成圆。',
    vars,
    steps: [
      '经线是半圆，从北极一路连到南极',
      '东经 30° 在俯视图里的方位角 = {ang30}°',
      '它的对应经线必须与它相差 180°',
      '180° − 30° = 150° ⇒ 找 150° 的那条',
      '符号还要相反 ⇒ 东经对应西经 ⇒ 西经 150°（{counterpart}）',
    ],
  },
  'meridian-150': {
    name: '西经 150°',
    hint: '东经 30° 正对着的那一条：两条合起来才是经线圈。',
    vars,
    steps: [
      '判定条件：度数之和 = 180°，且符号相反（一个 E 一个 W）',
      '30° + 150° = {pairSum}° ⇒ 满足第一条',
      '一条 E 一条 W ⇒ 满足第二条',
      '判定结果：{pairVerdict}',
      '两条合起来过南北两极 ⇒ 构成经线圈（一个大圆）',
    ],
  },
  'north-pole': {
    name: '北极点',
    hint: '两条经线都从这里出发，是经线圈的公共端点。',
    vars,
    steps: [
      '经线都过南北两极 ⇒ 一对对应经线在两极处相交',
      '相交角正好是 180°（正对着）',
      '所以从极点看，两条对应经线拼成一条直线',
      '这解释了为什么判定要看「正对着」，而不是看度数像不像',
    ],
  },
  ring: {
    name: '经线圈',
    hint: '两条正对着南北两极的经线合起来，就是一个过两极的大圆。',
    vars,
    steps: [
      '两条对应经线都过南北两极',
      '它们在赤道上正对着，相差 180°',
      '两条半圆合起来 ⇒ 一个过球心、过两极的整圆 ⇒ 经线圈',
      '经线圈所在的平面过地轴 ⇒ 它一定是大圆',
      '所以每条经线都是大圆的一半，长度处处相等',
    ],
  },
  counter: {
    name: '反例：30°E 与 30°W',
    hint: '同名的两条不是一对——符号对上了，度数没对上。',
    vars,
    steps: [
      '30° + 30° = {counterSum}°，不等于 180° ⇒ 第一条就不满足',
      '符号虽然相反，但度数不够 ⇒ 不是一对',
      '判定结果：{counterVerdict}',
      '图上这两条只夹 {counterSum}°，一眼看出不正对着',
      '口诀：同名经线差得远，差 180° 才叫正对着',
    ],
  },
}
</script>
