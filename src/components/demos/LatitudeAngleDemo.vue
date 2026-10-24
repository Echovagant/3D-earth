<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- ① 球 + 赤道平面：赤道是一个「面」，不是一条线 -->
      <g v-show="step === 0" class="demo__frame">
        <circle class="demo__globe-plain" :cx="GLOBE.cx" :cy="GLOBE.cy" :r="GLOBE.r" />
        <path class="demo2-plane" :d="planeFront" />
        <path class="demo__leader" :d="planeBack" />
        <circle class="demo__cut" :cx="GLOBE.cx" :cy="GLOBE.cy" r="4" />
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
        <path class="demo2-plane" :d="planeFront" />
        <path class="demo__leader" :d="planeBack" />
        <circle class="demo__cut" :cx="GLOBE.cx" :cy="GLOBE.cy" r="4" />
        <!-- 线：点与地心的连线（虚线） -->
        <path class="demo2-radius" :d="`M ${GLOBE.cx} ${GLOBE.cy} L ${p1.x} ${p1.y}`" />
        <!-- 面内的射影：地心 → 垂足 -->
        <path
          class="demo__curve"
          :d="`M ${GLOBE.cx} ${GLOBE.cy} L ${f1.x} ${f1.y}`"
        />
        <path
          class="demo__spin"
          :d="`M ${f1.x - 9} ${f1.y} L ${f1.x - 9} ${f1.y - 9} L ${f1.x} ${f1.y - 9}`"
        />
        <!-- 角 -->
        <path class="demo__spin" :d="arcPath(GLOBE.cx, GLOBE.cy, 55, 0, P1_LAT)" />
        <circle class="demo__cut" :cx="p1.x" :cy="p1.y" r="5" />
        <text class="demo__label" :x="p1.x + 14" :y="p1.y - 4" text-anchor="start">P</text>
        <text class="demo__label demo__label--mark" :x="GLOBE.cx + 70" :y="GLOBE.cy - 24">
          φ = 40°
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
        <path class="demo2-plane" :d="planeFront" />
        <path class="demo__leader" :d="planeBack" />
        <circle class="demo__cut" :cx="GLOBE.cx" :cy="GLOBE.cy" r="4" />
        <path class="demo2-radius" :d="`M ${GLOBE.cx} ${GLOBE.cy} L ${p1.x} ${p1.y}`" />
        <path class="demo2-radius" :d="`M ${GLOBE.cx} ${GLOBE.cy} L ${p2.x} ${p2.y}`" />
        <path class="demo__spin" :d="arcPath(GLOBE.cx, GLOBE.cy, 52, 0, P1_LAT)" />
        <path class="demo__spin" :d="arcPath(GLOBE.cx, GLOBE.cy, 82, 0, P2_LAT)" />
        <circle class="demo__cut" :cx="p1.x" :cy="p1.y" r="5" />
        <circle class="demo__cut" :cx="p2.x" :cy="p2.y" r="5" />
        <text class="demo__label" :x="p1.x + 12" :y="p1.y + 16" text-anchor="start">40°N</text>
        <text class="demo__label" :x="p2.x + 12" :y="p2.y - 4" text-anchor="start">70°N</text>
        <text class="demo__label demo__label--mark" :x="GLOBE.cx + 66" :y="GLOBE.cy - 22">
          40°
        </text>
        <text class="demo__label demo__label--mark" :x="GLOBE.cx + 46" :y="GLOBE.cy - 66">
          70°
        </text>
        <text class="demo__caption-line" x="360" y="366" text-anchor="middle">
          越往北，这个角越大——角就是纬度
        </text>
      </g>

      <!-- ④ 极点：90° -->
      <g v-show="step === 3" class="demo__frame">
        <circle class="demo__globe-plain" :cx="GLOBE.cx" :cy="GLOBE.cy" :r="GLOBE.r" />
        <path class="demo2-plane" :d="planeFront" />
        <path class="demo__leader" :d="planeBack" />
        <circle class="demo__cut" :cx="GLOBE.cx" :cy="GLOBE.cy" r="4" />
        <path
          class="demo__curve"
          :d="`M ${GLOBE.cx} ${GLOBE.cy} L ${GLOBE.cx} ${GLOBE.cy - GLOBE.r}`"
        />
        <path class="demo__spin" :d="arcPath(GLOBE.cx, GLOBE.cy, 62, 0, 90)" />
        <circle class="demo__cut" :cx="GLOBE.cx" :cy="GLOBE.cy - GLOBE.r" r="6" />
        <text class="demo__label demo__label--mark" :x="GLOBE.cx + 12" :y="GLOBE.cy - GLOBE.r - 10">
          北极点
        </text>
        <text class="demo__label demo__label--mark" :x="GLOBE.cx + 70" :y="GLOBE.cy - 42">
          90°
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
  limbPoint,
  planeFoot,
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
