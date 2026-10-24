<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- ① 侧视图：经线是从北极出发的弧，指示南北 -->
      <g v-show="step === 0" class="demo__frame">
        <circle class="demo__globe-plain" :cx="GLOBE.cx" :cy="GLOBE.cy" :r="GLOBE.r" />
        <g class="demo__grid">
          <path
            v-for="m in sideMeridians"
            :key="`sm${m.lon}`"
            :d="m.d"
          />
        </g>
        <circle class="demo__cut" :cx="GLOBE.cx" :cy="GLOBE.cy - GLOBE.r" r="4" />
        <circle class="demo__cut" :cx="GLOBE.cx" :cy="GLOBE.cy + GLOBE.r" r="4" />
        <text class="demo__label demo__label--mark" :x="GLOBE.cx" y="58" text-anchor="middle">
          北极
        </text>
        <text class="demo__label demo__label--mark" :x="GLOBE.cx" y="336" text-anchor="middle">
          南极
        </text>
        <!-- 南北方向 -->
        <path class="demo__spin" d="M 530 250 L 530 140" />
        <path class="demo__spin-head" :d="arrowHead(530, 140, 90, 12)" />
        <path class="demo__spin-head" :d="arrowHead(530, 250, 270, 12)" />
        <text class="demo__label demo__label--mark" x="530" y="126" text-anchor="middle">北</text>
        <text class="demo__label demo__label--mark" x="530" y="266" text-anchor="middle">南</text>
        <text class="demo__label" x="548" y="196" text-anchor="start">经线指示南北方向</text>
        <text class="demo__caption-line" x="360" y="366" text-anchor="middle">
          经线：从北极一路连到南极的半圆弧，两头都在两极上
        </text>
      </g>

      <!-- ② 经线是半圆，不是整圆 -->
      <g v-show="step === 1" class="demo__frame">
        <path class="demo__leader" :d="arcPath(RING.cx, RING.cy, RING.r, 90, -90)" />
        <path class="demo__curve" :d="arcPath(RING.cx, RING.cy, RING.r, -90, 90)" />
        <g class="demo__grid">
          <path :d="`M ${RING.cx} ${RING.cy - RING.r} L ${RING.cx} ${RING.cy + RING.r}`" />
          <path :d="`M ${RING.cx - RING.r} ${RING.cy} L ${RING.cx + RING.r} ${RING.cy}`" />
        </g>
        <circle class="demo__cut" :cx="RING.cx" :cy="RING.cy - RING.r" r="4" />
        <circle class="demo__cut" :cx="RING.cx" :cy="RING.cy + RING.r" r="4" />
        <text class="demo__label demo__label--mark" :x="RING.cx" y="52" text-anchor="middle">
          北极
        </text>
        <text class="demo__label demo__label--mark" :x="RING.cx" y="324" text-anchor="middle">
          南极
        </text>
        <text class="demo__label" x="234" y="189" text-anchor="end">赤道</text>
        <text class="demo__label demo__label--mark" x="490" y="118" text-anchor="start">
          一条经线（半圆）
        </text>
        <text class="demo__label demo__label--faint" x="490" y="140" text-anchor="start">
          另一半（对应经线）合上才是整圆
        </text>
        <text class="demo__caption-line" x="360" y="362" text-anchor="middle">
          经线只是半圆；赤道是一个完整的圆（4 万千米），一根经线正好是它的一半
        </text>
      </g>

      <!-- ③ 并排比长度：所有经线一样长 -->
      <g v-show="step === 2" class="demo__frame">
        <g v-for="(m, i) in equalMeridians" :key="`em${i}`">
          <path class="demo__curve" :d="m.d" />
          <circle class="demo__cut" :cx="m.x" :cy="m.y - m.r" r="4" />
          <circle class="demo__cut" :cx="m.x" :cy="m.y + m.r" r="4" />
          <text class="demo__label" :x="m.x" y="316" text-anchor="middle">经线</text>
          <text class="demo__label demo__label--faint" :x="m.x" y="334" text-anchor="middle">
            ≈ 20 000 km
          </text>
        </g>
        <text class="demo__caption-line" x="360" y="372" text-anchor="middle">
          每根经线都是同一个大圆的一半：4 万千米 ÷ 2 = 2 万千米，处处相等
        </text>
        <text class="demo__label demo__label--faint" x="360" y="34" text-anchor="middle">
          侧视图上看着长短不同，那只是投影——绕着地球量，每根都是 2 万千米
        </text>
      </g>

      <!-- ④ 所有经线在两极相交 -->
      <g v-show="step === 3" class="demo__frame">
        <circle class="demo__globe-plain" :cx="GLOBE.cx" :cy="GLOBE.cy" :r="GLOBE.r" />
        <g class="demo__grid">
          <path v-for="m in sideMeridians" :key="`cm${m.lon}`" :d="m.d" />
        </g>
        <circle class="demo__cut" :cx="GLOBE.cx" :cy="GLOBE.cy - GLOBE.r" r="6" />
        <circle class="demo__cut" :cx="GLOBE.cx" :cy="GLOBE.cy + GLOBE.r" r="6" />
        <text class="demo__label demo__label--mark" :x="GLOBE.cx" y="58" text-anchor="middle">
          所有经线交于此
        </text>
        <text class="demo__label demo__label--mark" :x="GLOBE.cx" y="336" text-anchor="middle">
          所有经线交于此
        </text>
        <path class="demo__leader" d="M 420 62 L 470 48" />
        <text class="demo__label" x="476" y="44" text-anchor="start">极点处经线间隔为 0</text>
        <text class="demo__caption-line" x="360" y="366" text-anchor="middle">
          所有经线相互相交于南北两极——所以极点上的「间隔」是 0
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §2.3 经线：概念与五个特点。
 *
 * 讲义里反复强调的那句「经线不是圆圈，是圆圈的一半」，就靠这四步补上：
 *   ① 侧视图 —— 经线是从北极连到南极的弧，指示南北方向；
 *   ② 把经线圈正对着看 —— 一条经线只占半个圆；
 *   ③ 并排比长度 —— 每根经线都是大圆的一半，处处相等（约 2 万千米）；
 *   ④ 所有经线在两极相交，极点处间隔为 0。
 *
 * 侧视图上的经线弧是投影算出来的：屏幕 x = cx + R·cosφ·sinλ，
 * λ 是该经线相对观察者的经度，所以中间那条是竖直线、越靠边越鼓。
 */
import DemoShell from '../DemoShell.vue'
import { meridianArcPath } from '../../data/meridianCirclesGeometry'
import { arcPath, arrowHead } from '../../data/svgParts'

const steps = [
  {
    id: 'side',
    title: '① 侧视图：经线是从北极出发的弧',
    text: '把地球从侧面看，每根经线都是一条从北极一路连到南极的弧，两头都在两极上。沿着经线走就是往南北方向走，所以经线指示南北方向——「竖成经」说的就是它。',
  },
  {
    id: 'half',
    title: '② 经线是半圆，不是整圆',
    text: '把一条经线圈正对着看：它是一个完整的圆，而一条经线只占其中的一半，另一半是它的对应经线（§2.10 讲怎么找）。赤道则是一个完整的圆，约 4 万千米，一根经线正好是它的一半。',
  },
  {
    id: 'length',
    title: '③ 所有经线长度处处相等',
    text: '经线既然都是同一个大圆的一半，长度就必然相等：4 万千米 ÷ 2 = 2 万千米。在侧视图上看着长短不同，那只是投影造成的错觉，绕着地球量，每根都是 2 万千米。',
  },
  {
    id: 'poles',
    title: '④ 所有经线在两极相交',
    text: '所有经线都从北极出发、在南极收尾，所以它们相交于南北两极。极点处所有经线挤在同一个点上，经线间隔为 0——这正是「经线间隔向两极递减」的极端情况。',
  },
]

/** 侧视图上的球 */
const GLOBE = { cx: 320, cy: 195, r: 120 }

/** ① / ④ 侧视图上的经线（相对观察者的经度） */
const sideMeridians = [0, 30, -30, 60, -60].map((lon) => ({
  lon,
  d: meridianArcPath(GLOBE.cx, GLOBE.cy, GLOBE.r, lon),
}))

/** ② 正对着看的经线圈 */
const RING = { cx: 360, cy: 185, r: 120 }

/** ③ 并排比的三个经线半圆 */
const equalMeridians = [140, 360, 580].map((x) => ({
  x,
  y: 210,
  r: 78,
  d: `M ${x} ${210 - 78} A 78 78 0 0 1 ${x} ${210 + 78}`,
}))
</script>
