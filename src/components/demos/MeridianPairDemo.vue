<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- 底图：北极上方俯视，30°E 这条经线 -->
      <g>
        <circle class="demo__globe-plain" :cx="POLAR.cx" :cy="POLAR.cy" :r="POLAR.r" />
        <g class="demo__grid">
          <path
            v-for="m in polarGrid.meridians"
            :key="`bg${m.lon}`"
            :d="`M ${POLAR.cx} ${POLAR.cy} L ${polarTip(m.angle)}`"
          />
          <path :d="circlePath(POLAR.cx, POLAR.cy, POLAR.r)" />
        </g>
        <path class="demo__curve" :d="`M ${POLAR.cx} ${POLAR.cy} L ${polarTip(polarAngle(30))}`" />
        <circle class="demo__cut" :cx="POLAR.cx" :cy="POLAR.cy" r="5" />
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
        <path class="demo__curve" :d="`M ${POLAR.cx} ${POLAR.cy} L ${polarTip(polarAngle(-150))}`" />
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
        <path class="demo__curve" :d="`M ${POLAR.cx} ${POLAR.cy} L ${polarTip(polarAngle(-150))}`" />
        <text class="demo__label demo__label--mark" x="360" y="44" text-anchor="middle">
          两条半圆拼成一个过两极的整圆，这叫经线圈
        </text>
        <!-- 正对着看经线圈 -->
        <path
          class="demo__leader"
          :d="`M ${RING.cx} ${RING.cy - RING.r} A ${RING.r} ${RING.r} 0 0 0 ${RING.cx} ${RING.cy + RING.r}`"
        />
        <path
          class="demo__curve"
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
        <path class="demo__curve" :d="`M ${POLAR.cx} ${POLAR.cy} L ${polarTip(polarAngle(-150))}`" />
        <text class="demo__label demo__label--mark" :x="POLAR.cx" y="330" text-anchor="middle">
          30°E 与 150°W：正对着，是经线圈
        </text>
        <g>
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
</script>
