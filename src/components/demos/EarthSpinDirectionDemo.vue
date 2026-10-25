<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 地球 + 倾斜的地轴，两端是北极点和南极点 -->
      <g v-show="step === 0" class="demo__frame">
        <circle
          class="demo__globe-plain"
          data-explain="globe"
          :cx="globe.cx"
          :cy="globe.cy"
          :r="globe.r"
        />
        <g class="demo__grid">
          <path
            data-explain="equator"
            :d="`M ${poles.equator.x1} ${poles.equator.y1} L ${poles.equator.x2} ${poles.equator.y2}`"
          />
        </g>
        <path class="demo__curve" data-explain="axis" :d="axisPath" />
        <circle
          class="demo__cut"
          data-explain="north-pole"
          :cx="poles.north.x"
          :cy="poles.north.y"
          r="6"
        />
        <circle
          class="demo__cut"
          data-explain="south-pole"
          :cx="poles.south.x"
          :cy="poles.south.y"
          r="6"
        />

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
        <circle
          class="demo__globe-plain"
          data-explain="globe"
          :cx="northView.cx"
          :cy="northView.cy"
          :r="northView.r"
        />
        <g class="demo__grid" data-explain="lat-circle">
          <path
            v-for="c in northView.circles"
            :key="`c${c.lat}`"
            :d="circlePath(northView.cx, northView.cy, c.r)"
          />
        </g>
        <circle class="demo__cut" :cx="northView.cx" :cy="northView.cy" r="5" />
        <path class="demo__spin" data-explain="north-spin" :d="northView.arrow.path" />
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
        <circle
          class="demo__globe-plain"
          data-explain="globe"
          :cx="southView.cx"
          :cy="southView.cy"
          :r="southView.r"
        />
        <g class="demo__grid" data-explain="lat-circle">
          <path
            v-for="c in southView.circles"
            :key="`c${c.lat}`"
            :d="circlePath(southView.cx, southView.cy, c.r)"
          />
        </g>
        <circle class="demo__cut" :cx="southView.cx" :cy="southView.cy" r="5" />
        <path class="demo__spin" data-explain="south-spin" :d="southView.arrow.path" />
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
        <g v-for="v in compare" :key="v.key" :data-explain="`compare-${v.key}`">
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
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { arrowHead, circlePath } from '../../data/svgParts'
import {
  AXIS_TILT,
  AXIS_TO_ECLIPTIC,
  DEGREES_PER_HOUR,
  EARTH_RADIUS_KM,
  axisPoles,
  equatorCircumferenceKm,
  equatorSpeedKmh,
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

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 参数一动，图和讲解一起变，不会出现「图上 66.5°、文字写着 65°」。
 */
const explains = computed(() => {
  const circumference = equatorCircumferenceKm()
  const vars = {
    tilt: `${AXIS_TILT}°`,
    axisToEcliptic: `${AXIS_TO_ECLIPTIC}°`,
    radiusKm: String(EARTH_RADIUS_KM),
    circumference: `${Math.round(circumference)} km`,
    equatorSpeed: `${Math.round(equatorSpeedKmh())} km/h`,
    spinDeg: `${DEGREES_PER_HOUR}°/小时`,
    ratio60: Math.cos((60 * Math.PI) / 180).toFixed(2),
    poleSpeed: '0 km/h',
  }

  return {
    globe: {
      name: '地球',
      hint: '绕地轴转的球体：自转方向只有一句「自西向东」。',
      vars,
      steps: [
        '地球自转 = 地球绕自己的轴（地轴）旋转',
        '方向：自西向东——侧视、俯视都成立',
        `角速度：360° ÷ 24 小时 = ${vars.spinDeg}（除极点外处处相同）`,
        `线速度随纬度变：赤道最大（约 ${vars.equatorSpeed}），往两极递减到 0`,
      ],
    },
    axis: {
      name: '地轴',
      hint: '穿过地心的假想转轴，两端与球面的交点就是南北极点。',
      vars,
      steps: [
        '地轴是过球心的假想轴，两端与球面的交点是北极点、南极点',
        `侧视图里它偏离铅垂线 ${vars.tilt}——这个角就是黄赤交角`,
        `地轴与黄道面的夹角 = 90° − ${vars.tilt} = ${vars.axisToEcliptic}`,
        '公转一整圈，地轴在空间里的方向始终保持平行',
      ],
    },
    'north-pole': {
      name: '北极点',
      hint: '地轴北端与球面的交点，纬度 90°N。',
      vars,
      steps: [
        '北极点 = 地轴与球面的交点，纬度 90°N',
        `它到地轴的距离为 0 ⇒ 线速度 = ${vars.poleSpeed}`,
        `但角速度仍是 ${vars.spinDeg}——极点只是在原地打转`,
        '从北极点正上方俯视能看见整个赤道，这是判「北逆」的依据',
      ],
    },
    'south-pole': {
      name: '南极点',
      hint: '地轴南端与球面的交点，纬度 90°S。',
      vars,
      steps: [
        '南极点 = 地轴与球面的交点，纬度 90°S',
        `到地轴距离为 0 ⇒ 线速度 = ${vars.poleSpeed}`,
        '从南极点正上方俯视，赤道同样完整可见——但方向变成顺时针',
        '所以南北两极不是两种自转，是同一个自转的两个视角',
      ],
    },
    equator: {
      name: '赤道',
      hint: '0° 纬线：最长的纬线圈，也就是最大的「跑道」。',
      vars,
      steps: [
        '赤道 = 0° 纬线，绕地球一周',
        `周长 = 2πR = 2 × 3.1416 × ${vars.radiusKm} ≈ ${vars.circumference}`,
        '纬度 φ 的纬线圈 = 赤道 × cosφ，所以赤道最长、极点缩成一个点',
        `赤道上的线速度 = ${vars.circumference} ÷ 24 小时 ≈ ${vars.equatorSpeed}`,
      ],
    },
    'lat-circle': {
      name: '纬线圈',
      hint: '俯视看到的一圈圈同心圆：半径 = R·cosφ，赤道最大、极点为 0。',
      vars,
      steps: [
        '极点俯视时，同心圆就是一条条纬线圈',
        '纬度 φ 的纬线圈半径 = R·cosφ',
        '赤道 φ = 0 ⇒ cos0° = 1 ⇒ 半径 = R（最大）',
        `北纬 60° ⇒ cos60° = ${vars.ratio60} ⇒ 半径只剩一半`,
        '极点 φ = 90° ⇒ cos90° = 0 ⇒ 半径缩成 0',
      ],
    },
    'north-spin': {
      name: '北极点上方俯视（逆时针）',
      hint: '从北极点正上方往下看，地球自转是逆时针。',
      vars,
      steps: [
        '视线沿地轴从北极点往下看，看到的是整个北半球',
        '自转方向自西向东，在这个视角下表现为逆时针',
        '口诀「北逆南顺」只适用于从极点正上方俯视的图',
        '画箭头时必须与纬线平行，并画在被判断对象附近',
      ],
    },
    'south-spin': {
      name: '南极点上方俯视（顺时针）',
      hint: '同一个自转方向，换到南极点上方看就变成顺时针。',
      vars,
      steps: [
        '视线沿地轴从南极点往下看，看到的是整个南半球',
        '自转方向没变（仍是自西向东），但视角翻转 ⇒ 变成顺时针',
        '所以「北逆南顺」不是两个自转方向，是一个方向的两种视角',
      ],
    },
    'compare-north': {
      name: '对照：北极点上方俯视',
      hint: '并排对照的左边：逆时针。',
      vars,
      steps: [
        '左图：北极点上方俯视 ⇒ 逆时针',
        '判据只有一条：自转方向自西向东',
        '画法上，箭头要与纬线平行，并落在被判断对象附近',
      ],
    },
    'compare-south': {
      name: '对照：南极点上方俯视',
      hint: '并排对照的右边：顺时针。',
      vars,
      steps: [
        '右图：南极点上方俯视 ⇒ 顺时针',
        '两支箭头左右镜像、末端等高——这是「同一方向、两个视角」的画面证据',
        '侧视图与局部斜视图不能套「北逆南顺」，要先定南北半球',
      ],
    },
  }
})
</script>
