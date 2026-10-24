<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- ① 侧视图：横线是纬线，连接两极的弧是经线 -->
      <g v-show="step === 0" class="demo__frame">
        <circle class="demo__globe-plain" :cx="SIDE.cx" :cy="SIDE.cy" :r="SIDE.r" />
        <g class="demo__grid">
          <path
            v-for="p in sideGrid.parallels"
            :key="`sp${p.lat}`"
            :d="`M ${SIDE.cx - p.half.toFixed(2)} ${p.y.toFixed(2)} L ${SIDE.cx + p.half.toFixed(2)} ${p.y.toFixed(2)}`"
          />
        </g>
        <path v-for="m in sideGrid.meridians" :key="`sm${m.lon}`" class="demo__curve" :d="m.d" />
        <text class="demo__label demo__label--mark" :x="SIDE.cx" y="52" text-anchor="middle">
          北极
        </text>
        <text class="demo__label demo__label--mark" :x="SIDE.cx" y="322" text-anchor="middle">
          南极
        </text>
        <text class="demo__label" :x="SIDE.cx + SIDE.r + 10" y="189" text-anchor="start">赤道</text>
        <!-- 图例 -->
        <g class="demo__grid">
          <path d="M 520 120 L 590 120" />
        </g>
        <text class="demo__label" x="598" y="124" text-anchor="start">纬线（横线）</text>
        <path class="demo__curve" d="M 520 150 Q 555 175 520 200" />
        <text class="demo__label" x="598" y="180" text-anchor="start">经线（弧）</text>
        <text class="demo__caption-line" x="360" y="356" text-anchor="middle">
          侧视图：横着的是纬线，连着南北两极的弧是经线
        </text>
      </g>

      <!-- ② 极点俯视图：圆是纬线，中心是极点，最外圈是赤道 -->
      <g v-show="step === 1" class="demo__frame">
        <circle class="demo__globe-plain" :cx="POLAR.cx" :cy="POLAR.cy" :r="POLAR.r" />
        <g class="demo__grid">
          <path
            v-for="c in polarGrid.parallels"
            :key="`pp${c.lat}`"
            :d="circlePath(POLAR.cx, POLAR.cy, c.r)"
          />
          <path
            v-for="m in polarGrid.meridians"
            :key="`pm${m.lon}`"
            :d="`M ${POLAR.cx} ${POLAR.cy} L ${POLAR.cx + POLAR.r * Math.cos((m.angle * Math.PI) / 180)} ${POLAR.cy - POLAR.r * Math.sin((m.angle * Math.PI) / 180)}`"
          />
        </g>
        <path class="demo__leader" :d="circlePath(POLAR.cx, POLAR.cy, dashedCircle.r)" />
        <path
          class="demo__curve"
          :d="`M ${POLAR.cx - POLAR.r} ${POLAR.cy} L ${POLAR.cx + POLAR.r} ${POLAR.cy}`"
        />
        <path
          class="demo__curve"
          :d="circlePath(POLAR.cx, POLAR.cy, POLAR.r)"
        />
        <circle class="demo__cut" :cx="POLAR.cx" :cy="POLAR.cy" r="5" />
        <text class="demo__label demo__label--mark" :x="POLAR.cx" y="214" text-anchor="middle">
          极点
        </text>
        <text class="demo__label" :x="POLAR.cx + POLAR.r + 10" y="176" text-anchor="start">
          90°E
        </text>
        <text class="demo__label" :x="POLAR.cx - POLAR.r - 10" y="176" text-anchor="end">
          90°W
        </text>
        <text class="demo__label demo__label--faint" :x="POLAR.cx" y="56" text-anchor="middle">
          180°
        </text>
        <text class="demo__label demo__label--faint" :x="POLAR.cx" y="308" text-anchor="middle">
          0°
        </text>
        <!-- 右边的说明栏 -->
        <g>
          <path class="demo__grid" :d="circlePath(412, 96, 14)" />
          <text class="demo__label" x="438" y="100" text-anchor="start">圆 = 纬线</text>
          <path class="demo__spin" d="M 412 126 L 412 158" />
          <text class="demo__label" x="438" y="146" text-anchor="start">放射直线 = 经线</text>
          <path class="demo__leader" :d="circlePath(412, 190, 14)" />
          <text class="demo__label" x="438" y="194" text-anchor="start">虚线圆也是纬线</text>
          <text class="demo__label demo__label--mark" x="400" y="232" text-anchor="start">
            同一条直线的两半
          </text>
          <text class="demo__label demo__label--mark" x="400" y="252" text-anchor="start">
            是两条不同的经线
          </text>
          <text class="demo__label demo__label--faint" x="400" y="280" text-anchor="start">
            中心那个点是极点，最外圈是赤道
          </text>
        </g>
        <text class="demo__caption-line" x="360" y="356" text-anchor="middle">
          极点俯视图：圆纬直经，中心是极点
        </text>
      </g>

      <!-- ③ 两个视图并排对照 -->
      <g v-show="step === 2" class="demo__frame">
        <circle class="demo__globe-plain" :cx="SMALL_SIDE.cx" :cy="SMALL_SIDE.cy" :r="SMALL_SIDE.r" />
        <g class="demo__grid">
          <path
            v-for="p in smallSideGrid.parallels"
            :key="`ssp${p.lat}`"
            :d="`M ${SMALL_SIDE.cx - p.half.toFixed(2)} ${p.y.toFixed(2)} L ${SMALL_SIDE.cx + p.half.toFixed(2)} ${p.y.toFixed(2)}`"
          />
        </g>
        <path
          v-for="m in smallSideGrid.meridians"
          :key="`ssm${m.lon}`"
          class="demo__curve"
          :d="m.d"
        />
        <circle class="demo__globe-plain" :cx="SMALL_POLAR.cx" :cy="SMALL_POLAR.cy" :r="SMALL_POLAR.r" />
        <g class="demo__grid">
          <path
            v-for="c in smallPolarGrid.parallels"
            :key="`spp${c.lat}`"
            :d="circlePath(SMALL_POLAR.cx, SMALL_POLAR.cy, c.r)"
          />
          <path
            v-for="m in smallPolarGrid.meridians"
            :key="`spm${m.lon}`"
            :d="`M ${SMALL_POLAR.cx} ${SMALL_POLAR.cy} L ${SMALL_POLAR.cx + SMALL_POLAR.r * Math.cos((m.angle * Math.PI) / 180)} ${SMALL_POLAR.cy - SMALL_POLAR.r * Math.sin((m.angle * Math.PI) / 180)}`"
          />
        </g>
        <circle class="demo__cut" :cx="SMALL_POLAR.cx" :cy="SMALL_POLAR.cy" r="4" />
        <text class="demo__label demo__label--mark" :x="SMALL_SIDE.cx" y="292" text-anchor="middle">
          侧视图
        </text>
        <text class="demo__label demo__label--faint" :x="SMALL_SIDE.cx" y="312" text-anchor="middle">
          横线 = 纬线，竖弧 = 经线
        </text>
        <text class="demo__label demo__label--mark" :x="SMALL_POLAR.cx" y="292" text-anchor="middle">
          极点俯视图
        </text>
        <text class="demo__label demo__label--faint" :x="SMALL_POLAR.cx" y="312" text-anchor="middle">
          圆 = 纬线，放射直线 = 经线
        </text>
        <text class="demo__caption-line" x="360" y="354" text-anchor="middle">
          换一种看法，线就不是同一种线了——先认出经线和纬线，再谈定位
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §2.4 侧视图与极点俯视图：怎么在图上找经纬线。
 *
 * 讲义里说「几乎每道经纬网题的第一步就是在图上认出经线和纬线」，
 * 这一节补的就是认线的画面：
 *   ① 侧视图 —— 横线是纬线，连接南北两极的弧是经线；
 *   ② 极点俯视图 —— 圆是纬线、放射直线是经线、中心是极点、最外圈是赤道；
 *   ③ 两个视图并排 —— 换一种看法，线就不是同一种线了。
 *
 * 俯视图的方位定死：0° 经线在正下方，90°E 在正右方，180° 在正上方，
 * 经度沿逆时针增大（北极上方俯视时地球自转逆时针，而自转是自西向东）。
 */
import DemoShell from '../DemoShell.vue'
import { polarViewGrid, sideViewGrid } from '../../data/mapViewsGeometry'
import { circlePath } from '../../data/svgParts'

const steps = [
  {
    id: 'side',
    title: '① 侧视图：横纬竖经',
    text: '从侧面看地球：横着穿过球面的是纬线，一条条平行排列；把南北两极连起来的弧是经线。记住口诀「横成纬，竖成经」，第一眼就要分清哪条是哪条。',
  },
  {
    id: 'polar',
    title: '② 极点俯视图：圆纬直经，中心是极点',
    text: '换成从极点正上方往下看：纬线变成一个个同心圆，经线变成从中心向四周放射的直线。中心那个点是极点，最外圈是赤道；虚线画的圆同样是纬线，不能漏看。还有个高频坑：同一条直线的两半是两条不同的经线。',
  },
  {
    id: 'compare',
    title: '③ 两种看法，两种线',
    text: '同一张经纬网，侧着看和从极点上看完全是两副样子：横线变成了圆，竖弧变成了放射线。所以做题第一步永远是先认出经线和纬线，再去读度数。',
  },
]

const SIDE = { cx: 360, cy: 185, r: 120 }
const sideGrid = sideViewGrid({
  cx: SIDE.cx,
  cy: SIDE.cy,
  radius: SIDE.r,
  parallels: [60, 30, 0, -30, -60],
  meridians: [0, 40, -40, 75, -75],
})

const POLAR = { cx: 250, cy: 180, r: 115 }
const polarGrid = polarViewGrid({
  cx: POLAR.cx,
  cy: POLAR.cy,
  radius: POLAR.r,
  parallels: [60, 30],
  meridians: [0, 45, 90, 135, 180, 225, 270, 315],
})
/** 其中一条纬线画成虚线——提醒学生「虚线圆也是纬线」 */
const dashedCircle = polarGrid.parallels.find((c) => c.lat === 60)

const SMALL_SIDE = { cx: 185, cy: 175, r: 88 }
const smallSideGrid = sideViewGrid({
  cx: SMALL_SIDE.cx,
  cy: SMALL_SIDE.cy,
  radius: SMALL_SIDE.r,
  parallels: [45, 0, -45],
  meridians: [0, 45, -45, 78, -78],
})

const SMALL_POLAR = { cx: 520, cy: 175, r: 88 }
const smallPolarGrid = polarViewGrid({
  cx: SMALL_POLAR.cx,
  cy: SMALL_POLAR.cy,
  radius: SMALL_POLAR.r,
  parallels: [60, 30],
  meridians: [0, 45, 90, 135, 180, 225, 270, 315],
})
</script>
