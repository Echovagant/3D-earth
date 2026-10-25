<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 球 + 赤道平面：赤道是一个「面」，不是一条线 -->
      <g v-show="step === 0" class="demo__frame">
        <circle class="demo__globe-plain" :cx="GLOBE.cx" :cy="GLOBE.cy" :r="GLOBE.r" />
        <path class="demo2-plane" data-explain="plane" :d="planeFront" />
        <path class="demo__leader" data-explain="plane" :d="planeBack" />
        <circle class="demo__cut" data-explain="center" :cx="GLOBE.cx" :cy="GLOBE.cy" r="4" />
        <text class="demo__label" :x="GLOBE.cx - 10" y="216" text-anchor="end">地心</text>
        <text class="demo__label" :x="GLOBE.cx + GLOBE.r + 12" y="196" text-anchor="start">
          赤道（这个面的边缘）
        </text>
        <path class="demo__leader" :d="`M ${GLOBE.cx} 340 L ${GLOBE.cx} 236`" />
        <text class="demo__label demo__label--mark" :x="GLOBE.cx" y="352" text-anchor="middle">
          赤道平面（一个面）
        </text>
        <text class="demo__caption-line" x="360" y="34" text-anchor="middle">
          把赤道想象成一个盘子那么大的平面，不是一条线
        </text>
      </g>

      <!-- ② 取点、连半径、量出夹角 -->
      <g v-show="step === 1" class="demo__frame">
        <circle class="demo__globe-plain" :cx="GLOBE.cx" :cy="GLOBE.cy" :r="GLOBE.r" />
        <path class="demo2-plane" data-explain="plane" :d="planeFront" />
        <path class="demo__leader" data-explain="plane" :d="planeBack" />
        <circle class="demo__cut" data-explain="center" :cx="GLOBE.cx" :cy="GLOBE.cy" r="4" />
        <!-- 线：点与地心的连线（虚线） -->
        <path class="demo2-radius" data-explain="radius" :d="`M ${GLOBE.cx} ${GLOBE.cy} L ${p1.x} ${p1.y}`" />
        <!-- 面内的射影：地心 → 垂足 -->
        <path
          class="demo__curve"
          data-explain="projection"
          :d="`M ${GLOBE.cx} ${GLOBE.cy} L ${f1.x} ${f1.y}`"
        />
        <path
          class="demo__spin"
          data-explain="projection"
          :d="`M ${f1.x - 9} ${f1.y} L ${f1.x - 9} ${f1.y - 9} L ${f1.x} ${f1.y - 9}`"
        />
        <!-- 角 -->
        <path class="demo__spin" data-explain="angle" :d="arcPath(GLOBE.cx, GLOBE.cy, 55, 0, P1_LAT)" />
        <circle class="demo__cut" data-explain="point" :cx="p1.x" :cy="p1.y" r="5" />
        <text class="demo__label" :x="p1.x + 14" :y="p1.y - 4" text-anchor="start">P</text>
        <text class="demo__label demo__label--mark" :x="GLOBE.cx + 70" :y="GLOBE.cy - 24">
          φ = {{ lat40 }}°
        </text>
        <path class="demo__leader" :d="`M 418 96 L 400 112`" />
        <text class="demo__label" x="424" y="92" text-anchor="start">线：点与地心的连线</text>
        <text class="demo__caption-line" x="360" y="366" text-anchor="middle">
          纬度 = 线面角：这条半径与赤道平面所夹的角，就是这点的纬度
        </text>
      </g>

      <!-- ③ 换个更北的点：角变大 -->
      <g v-show="step === 2" class="demo__frame">
        <circle class="demo__globe-plain" :cx="GLOBE.cx" :cy="GLOBE.cy" :r="GLOBE.r" />
        <path class="demo2-plane" data-explain="plane" :d="planeFront" />
        <path class="demo__leader" data-explain="plane" :d="planeBack" />
        <circle class="demo__cut" data-explain="center" :cx="GLOBE.cx" :cy="GLOBE.cy" r="4" />
        <path class="demo2-radius" data-explain="radius" :d="`M ${GLOBE.cx} ${GLOBE.cy} L ${p1.x} ${p1.y}`" />
        <path class="demo2-radius" data-explain="radius" :d="`M ${GLOBE.cx} ${GLOBE.cy} L ${p2.x} ${p2.y}`" />
        <path class="demo__spin" data-explain="angle" :d="arcPath(GLOBE.cx, GLOBE.cy, 52, 0, P1_LAT)" />
        <path class="demo__spin" data-explain="angle" :d="arcPath(GLOBE.cx, GLOBE.cy, 82, 0, P2_LAT)" />
        <circle class="demo__cut" data-explain="point" :cx="p1.x" :cy="p1.y" r="5" />
        <circle class="demo__cut" data-explain="point-north" :cx="p2.x" :cy="p2.y" r="5" />
        <text class="demo__label" :x="p1.x + 12" :y="p1.y + 16" text-anchor="start">
          {{ lat40 }}°N
        </text>
        <text class="demo__label" :x="p2.x + 12" :y="p2.y - 4" text-anchor="start">
          {{ lat70 }}°N
        </text>
        <text class="demo__label demo__label--mark" :x="GLOBE.cx + 66" :y="GLOBE.cy - 22">
          {{ lat40 }}°
        </text>
        <text class="demo__label demo__label--mark" :x="GLOBE.cx + 46" :y="GLOBE.cy - 66">
          {{ lat70 }}°
        </text>
        <text class="demo__caption-line" x="360" y="366" text-anchor="middle">
          越往北，这个角越大——角就是纬度
        </text>
      </g>

      <!-- ④ 极点：90° -->
      <g v-show="step === 3" class="demo__frame">
        <circle class="demo__globe-plain" :cx="GLOBE.cx" :cy="GLOBE.cy" :r="GLOBE.r" />
        <path class="demo2-plane" data-explain="plane" :d="planeFront" />
        <path class="demo__leader" data-explain="plane" :d="planeBack" />
        <circle class="demo__cut" data-explain="center" :cx="GLOBE.cx" :cy="GLOBE.cy" r="4" />
        <path
          class="demo__curve"
          data-explain="radius"
          :d="`M ${GLOBE.cx} ${GLOBE.cy} L ${GLOBE.cx} ${GLOBE.cy - GLOBE.r}`"
        />
        <path class="demo__spin" data-explain="angle" :d="arcPath(GLOBE.cx, GLOBE.cy, 62, 0, 90)" />
        <circle class="demo__cut" data-explain="pole" :cx="GLOBE.cx" :cy="GLOBE.cy - GLOBE.r" r="6" />
        <text class="demo__label demo__label--mark" :x="GLOBE.cx + 12" :y="GLOBE.cy - GLOBE.r - 10">
          北极点
        </text>
        <text class="demo__label demo__label--mark" :x="GLOBE.cx + 70" :y="GLOBE.cy - 42">
          {{ lat90 }}°
        </text>
        <text class="demo__label" :x="GLOBE.cx + GLOBE.r + 12" y="196" text-anchor="start">
          赤道 = 0°
        </text>
        <text class="demo__caption-line" x="360" y="366" text-anchor="middle">
          赤道 0°、极点 90°——纬度就是这么定出来的
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §2.5 纬度：它是怎样定出来的。
 *
 * 讲义里那句「从这点往地心连一根线，再把赤道想象成一个盘子那么大的平面，
 * 线和面之间张开的角」，补的就是这幅画：
 *   ① 球 + 赤道平面 —— 赤道是「面」，画成一个扁椭圆盘；
 *   ② 取点 P、连半径、标出夹角 φ；
 *   ③ 换个更北的点，角变大；
 *   ④ 极点：90°。
 *
 * 取的点必须落在观察者视线的侧平面里（侧视图上球的边缘那一圈），
 * 这样从地心出发的半径长度不变、朝向不变，纸面上量出来的角就是真纬度。
 */
import DemoShell from '../DemoShell.vue'
import {
  EQUATOR_SQUASH,
  equatorPlaneBack,
  equatorPlaneFront,
  latitudeAngleDeg,
  limbPoint,
  planeFoot,
  planeTriangleSides,
} from '../../data/latitudeAngleGeometry'
import { arcPath } from '../../data/svgParts'

const steps = [
  {
    id: 'plane',
    title: '① 赤道是一个「面」，不是一个点',
    text: '纬线是赤道这条线，但谈纬度时说的「面」是赤道平面——想象一个盘子那么大的平面横在地球中间，赤道只是这个面的边缘。画图时它要画成一个扁椭圆盘，不能只画一条线。',
  },
  {
    id: 'angle',
    title: '② 线、面、角：这就是纬度',
    text: '在地面上取一点 P，从 P 往地心连一根半径，这是「线」；赤道平面是「面」；线和面张开的那个角就是这点的纬度。图上量角时要用半径在面内的那条射影，两个角才相等。',
  },
  {
    id: 'north',
    title: '③ 越往北，角越大',
    text: '换一个更北的点，同样的量法，角就变大了——40°N 是 40°，70°N 就是 70°。所以纬度的大小只看这个角：赤道 0°，往两极数到 90°。',
  },
  {
    id: 'pole',
    title: '④ 极点：90°',
    text: '到了北极点，那根半径就是地轴本身，与赤道平面垂直，夹角正好 90°。所以纬度从赤道的 0° 一直数到两极的 90°，北纬南纬只是给这个角加个方向。',
  },
]

const GLOBE = { cx: 300, cy: 200, r: 125 }
const planeFront = equatorPlaneFront(GLOBE.cx, GLOBE.cy, GLOBE.r, EQUATOR_SQUASH)
const planeBack = equatorPlaneBack(GLOBE.cx, GLOBE.cy, GLOBE.r, EQUATOR_SQUASH)

const P1_LAT = 40
const P2_LAT = 70
const p1 = limbPoint(P1_LAT, GLOBE.cx, GLOBE.cy, GLOBE.r)
const p2 = limbPoint(P2_LAT, GLOBE.cx, GLOBE.cy, GLOBE.r)
const f1 = planeFoot(P1_LAT, GLOBE.cx, GLOBE.cy, GLOBE.r)

/** 图上标的度数与讲解里的度数共用一个来源 */
const lat40 = latitudeAngleDeg(P1_LAT)
const lat70 = latitudeAngleDeg(P2_LAT)
const lat90 = latitudeAngleDeg(90)

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * 这一节的推导是「纬度这个量是怎么定义的」：
 * 线（半径）+ 面（赤道平面）+ 角（两者的夹角），三样凑齐才是纬度。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 图上标的 40°、70°、90° 与这里写的同源，不会各说各的。
 */
const vars = {
  lat40: String(lat40),
  lat70: String(lat70),
  lat90: String(lat90),
  ofLen: planeTriangleSides(P1_LAT, GLOBE.r).of.toFixed(1),
  fpLen: planeTriangleSides(P1_LAT, GLOBE.r).fp.toFixed(1),
}

const explains = {
  plane: {
    name: '赤道平面',
    hint: '过球心、垂直于地轴的那个圆面——赤道只是它的边缘。',
    vars,
    steps: [
      '赤道是 0° 纬线，它所在的平面过球心且垂直于地轴',
      '这个平面把地球切成南北两半 ⇒ 谈纬度说的「面」就是它',
      '赤道平面与球面的交线才是赤道本身：面在里、线在外',
      '侧视图上要画成扁椭圆盘：长半轴 = 球半径，短半轴 = 半径 × 视角仰角',
    ],
  },
  center: {
    name: '地心',
    hint: '球面上的点到它都相等，也是量角时的顶点。',
    vars,
    steps: [
      '地心 O 是「到球面各点距离都相等」的那个点，这个距离就是地球半径 R',
      '纬度是「线面角」，量角必须从球心量起',
      '所以地心是所有纬度的公共顶点',
    ],
  },
  radius: {
    name: '半径（线）',
    hint: '地面上一点与地心的连线——纬度定义里的「线」。',
    vars,
    steps: [
      '线 = 地面上某点 P 与地心 O 的连线，长度处处都是 R',
      '这根线与赤道平面的夹角 φ 就是 P 点的纬度',
      '半径处处等长 ⇒ 同一个 φ 在地球各处都同样大',
      '所以纬度只跟「离赤道多远」有关，与「在地球的哪一面」无关',
    ],
  },
  projection: {
    name: '射影与直角',
    hint: '把半径投到赤道平面里，纸上量出来的角才是真纬度。',
    vars,
    steps: [
      '画的是侧视图：只有落在视线侧平面里的点，量出来的角才不变形',
      '把 OP 垂直投影到赤道平面上，垂足记作 F',
      'OF 在赤道平面里，OP ⊥ OF ⇒ △OFP 是直角三角形',
      '直角边：OF = R·cosφ ≈ {ofLen}，FP = R·sinφ ≈ {fpLen}（本图球半径 125）',
      '∠FOP 既是线面角也是平面角 ⇒ 纸上量角与真纬度一致',
    ],
  },
  angle: {
    name: '线面角 φ',
    hint: '线与面张开的角，数值就是纬度。',
    vars,
    steps: [
      '∠FOP = φ',
      '在直角三角形 △OFP 里：sinφ = FP / OP',
      'φ = 0° 时 P 在赤道；φ = {lat90}° 时 P 在极点',
      '所以纬度从赤道的 0° 数到两极的 {lat90}°',
      '本图第一个点 P 在 {lat40}° ⇒ φ = {lat40}°',
    ],
  },
  point: {
    name: '点 P',
    hint: '地面上的一个点，它的纬度就是那根半径与赤道平面的夹角。',
    vars,
    steps: [
      '取点 P 落在侧视轮廓上：这样从地心看出去的半径长度与朝向都不变',
      'OP 与赤道平面的夹角 = {lat40}°',
      '所以 P 在 {lat40}°',
      '同一条纬线上的点，OP 的夹角都相等 ⇒ 它们的纬度相等',
    ],
  },
  'point-north': {
    name: '更北的那个点',
    hint: '换个更北的点，同样的量法，角就变大。',
    vars,
    steps: [
      'P₁ 在 {lat40}°，P₂ 在 {lat70}°',
      '同一个球心、同一个赤道平面，只换点，夹角就变了',
      '夹角变大 ⇒ 纬度变大 ⇒ 点更靠北',
      '纬度的大小只看这个角，北纬南纬只是给角加个方向',
    ],
  },
  pole: {
    name: '北极点',
    hint: '到极点时，那根半径就是地轴本身，夹角 90°。',
    vars,
    steps: [
      '北极点的半径与地轴重合',
      '地轴 ⊥ 赤道平面 ⇒ 线面角 = {lat90}°',
      '所以纬度从赤道的 0° 数到两极的 {lat90}°',
      '南北两极是纬度的两个端点',
    ],
  },
}
</script>

<style scoped>
/* 赤道平面：画成一个扁椭圆盘——它是「面」，不是一条线 */
.demo2-plane {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-accent);
  stroke-width: 2;
}

/* 半径：讲义里就是虚线 */
.demo2-radius {
  fill: none;
  stroke: var(--learn-accent);
  stroke-width: 2;
  stroke-dasharray: 6 4;
}
</style>
