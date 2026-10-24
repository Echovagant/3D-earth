<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- ① 地球 + 倾斜的地轴，两端是北极点和南极点 -->
      <g v-show="step === 0" class="demo__frame">
        <circle class="demo__globe-plain" :cx="globe.cx" :cy="globe.cy" :r="globe.r" />
        <g class="demo__grid">
          <path :d="`M ${poles.equator.x1} ${poles.equator.y1} L ${poles.equator.x2} ${poles.equator.y2}`" />
        </g>
        <path class="demo__curve" :d="axisPath" />
        <circle class="demo__cut" :cx="poles.north.x" :cy="poles.north.y" r="6" />
        <circle class="demo__cut" :cx="poles.south.x" :cy="poles.south.y" r="6" />

        <path class="demo__leader" :d="`M ${poles.north.x + 8} ${poles.north.y - 4} L 424 96`" />
        <text class="demo__label demo__label--mark" x="430" y="100">北极点</text>
        <path class="demo__leader" :d="`M ${poles.south.x - 8} ${poles.south.y + 5} L 424 300`" />
        <text class="demo__label demo__label--mark" x="430" y="304">南极点</text>
        <path class="demo__leader" :d="`M ${axisEnd.x + 3} ${axisEnd.y - 2} L 352 76`" />
        <text class="demo__label demo__label--faint" x="358" y="80">地轴</text>
        <text class="demo__label demo__label--faint" x="182" y="194" text-anchor="end">赤道</text>

        <text class="demo__caption-line" x="360" y="352" text-anchor="middle">
          地轴穿过地心，两端与球面的交点就是北极点和南极点
        </text>
      </g>

      <!-- ② 北极点上方俯视：逆时针 -->
      <g v-show="step === 1" class="demo__frame">
        <circle class="demo__globe-plain" :cx="northView.cx" :cy="northView.cy" :r="northView.r" />
        <g class="demo__grid">
          <path
            v-for="c in northView.circles"
            :key="`c${c.lat}`"
            :d="circlePath(northView.cx, northView.cy, c.r)"
          />
        </g>
        <circle class="demo__cut" :cx="northView.cx" :cy="northView.cy" r="5" />
        <path class="demo__spin" :d="northView.arrow.path" />
        <path class="demo__spin-head" :d="arrowHead(northView.arrow.tip.x, northView.arrow.tip.y, northView.arrow.tangent, 14)" />

        <text class="demo__label demo__label--faint" x="360" y="322" text-anchor="middle">赤道</text>
        <text class="demo__label demo__label--faint" x="234" y="190" text-anchor="end">北纬 60°</text>
        <text class="demo__label demo__label--faint" x="230" y="284" text-anchor="end">北纬 30°</text>
        <text class="demo__label demo__label--mark" x="360" y="205" text-anchor="middle">北极点</text>
        <text class="demo__label demo__label--mark" x="360" y="56" text-anchor="middle">逆时针</text>

        <text class="demo__caption-line" x="360" y="352" text-anchor="middle">
          从北极点正上方往下看：逆时针
        </text>
      </g>

      <!-- ③ 南极点上方俯视：顺时针 -->
      <g v-show="step === 2" class="demo__frame">
        <circle class="demo__globe-plain" :cx="southView.cx" :cy="southView.cy" :r="southView.r" />
        <g class="demo__grid">
          <path
            v-for="c in southView.circles"
            :key="`c${c.lat}`"
            :d="circlePath(southView.cx, southView.cy, c.r)"
          />
        </g>
        <circle class="demo__cut" :cx="southView.cx" :cy="southView.cy" r="5" />
        <path class="demo__spin" :d="southView.arrow.path" />
        <path class="demo__spin-head" :d="arrowHead(southView.arrow.tip.x, southView.arrow.tip.y, southView.arrow.tangent, 14)" />

        <text class="demo__label demo__label--faint" x="360" y="322" text-anchor="middle">赤道</text>
        <text class="demo__label demo__label--faint" x="234" y="190" text-anchor="end">南纬 60°</text>
        <text class="demo__label demo__label--faint" x="230" y="284" text-anchor="end">南纬 30°</text>
        <text class="demo__label demo__label--mark" x="360" y="205" text-anchor="middle">南极点</text>
        <text class="demo__label demo__label--mark" x="360" y="56" text-anchor="middle">顺时针</text>

        <text class="demo__caption-line" x="360" y="352" text-anchor="middle">
          从南极点正上方往下看：顺时针——同一个自转方向，换个极点看就反过来
        </text>
      </g>

      <!-- ④ 并列对照：北逆南顺，本质只有一句「自西向东」 -->
      <g v-show="step === 3" class="demo__frame">
        <g v-for="v in compare" :key="v.key">
          <circle class="demo__globe-plain" :cx="v.cx" :cy="v.cy" :r="v.r" />
          <path class="demo__spin" :d="v.arrow.path" />
          <path class="demo__spin-head" :d="arrowHead(v.arrow.tip.x, v.arrow.tip.y, v.arrow.tangent, 15)" />
          <text class="demo__label demo__label--mark" :x="v.cx" y="296" text-anchor="middle">{{ v.title }}</text>
          <text class="demo__label" :x="v.cx" y="318" text-anchor="middle">{{ v.sub }}</text>
        </g>

        <text class="demo__caption-line" x="360" y="352" text-anchor="middle">
          本质只有一句：自西向东。「北逆南顺」只适用于从极点正上方俯视的图
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §3.1 地球自转的概念与方向。
 *
 * 老师讲这节时说：「转到北极点上方往下看是逆时针，转到南极点上方往下看是顺时针」——
 * 学生脑子里没有那幅画面。这四步就是把它补上：
 *   ① 地轴穿过地心，两端是北极点、南极点
 *   ② 北极上方俯视 → 逆时针
 *   ③ 南极上方俯视 → 顺时针
 *   ④ 并列对照：北逆南顺，本质只有「自西向东」
 *
 * 极点位置、纬线圈半径与箭头方向全部算出来（见 earthSpinDirectionGeometry.js），
 * 不是手画的——顺逆反了就是教错学生。
 */
import DemoShell from '../DemoShell.vue'
import { arrowHead, circlePath } from '../../data/svgParts'
import {
  AXIS_TILT,
  axisPoles,
  latitudeCircleRadius,
  polarSpinArrow,
} from '../../data/earthSpinDirectionGeometry'

const steps = [
  {
    id: 'axis',
    title: '① 自转是绕着地轴转',
    text: '地球自转 = 地球绕自己的轴旋转。这根轴叫地轴，它穿过地心，与球面的两个交点分别是北极点和南极点。地轴是斜的——侧视图里它偏离铅垂线 23.5°，这个角就是黄赤交角。',
  },
  {
    id: 'north-view',
    title: '② 从北极点上方往下看：逆时针',
    text: '站在北极点正上方往下看，地球自转的方向是逆时针。画面中心就是北极点，同心圆是纬线——越靠近中心纬度越高，赤道是外面最大的一圈。自转方向永远是自西向东，不因换个极点而改变。',
  },
  {
    id: 'south-view',
    title: '③ 从南极点上方往下看：顺时针',
    text: '换到南极点正上方往下看，方向变成顺时针。这不是另一个自转方向，而是同一个方向换了视角：地球自转始终自西向东，从南极看过去就成了顺时针。',
  },
  {
    id: 'compare',
    title: '④ 北逆南顺，本质只有一句「自西向东」',
    text: '两句口诀要分清主次：「自西向东」是自转方向的本质，任何视图都成立；「北逆南顺」只适用于从极点正上方俯视的图。侧视图、局部斜视图都要先定南北半球再判方向。',
  },
]

/** ① 侧视的地球 */
const globe = { cx: 280, cy: 200, r: 92 }
const poles = axisPoles(globe.cx, globe.cy, globe.r, AXIS_TILT)

/** 地轴线：两端各伸出球外一点，看得出这是一根「轴」 */
const axisEnd = {
  x: poles.north.x + 30 * Math.sin((AXIS_TILT * Math.PI) / 180),
  y: poles.north.y - 30 * Math.cos((AXIS_TILT * Math.PI) / 180),
}
const axisStart = {
  x: poles.south.x - 30 * Math.sin((AXIS_TILT * Math.PI) / 180),
  y: poles.south.y + 30 * Math.cos((AXIS_TILT * Math.PI) / 180),
}
const axisPath = `M ${axisStart.x.toFixed(2)} ${axisStart.y.toFixed(2)} L ${axisEnd.x.toFixed(2)} ${axisEnd.y.toFixed(2)}`

/** ②③ 极点俯视：同心圆是纬线，半径 = R·cosφ */
function polarView(cx, cy, r, direction) {
  return {
    cx,
    cy,
    r,
    circles: [30, 60].map((lat) => ({ lat, r: Number(latitudeCircleRadius(r, lat).toFixed(2)) })),
    arrow: polarSpinArrow(cx, cy, r + 24, direction),
  }
}

const northView = polarView(360, 195, 98, 'ccw')
const southView = polarView(360, 195, 98, 'cw')

/** ④ 并列对照 */
const compare = [
  {
    key: 'north',
    cx: 190,
    cy: 190,
    r: 66,
    arrow: polarSpinArrow(190, 190, 88, 'ccw'),
    title: '北极点上方俯视',
    sub: '逆时针',
  },
  {
    key: 'south',
    cx: 530,
    cy: 190,
    r: 66,
    arrow: polarSpinArrow(530, 190, 88, 'cw'),
    title: '南极点上方俯视',
    sub: '顺时针',
  },
]
</script>
