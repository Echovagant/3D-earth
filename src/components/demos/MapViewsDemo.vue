<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 侧视图：横线是纬线，连接两极的弧是经线 -->
      <g v-show="step === 0" class="demo__frame">
        <circle class="demo__globe-plain" :cx="SIDE.cx" :cy="SIDE.cy" :r="SIDE.r" />
        <g class="demo__grid" data-explain="side-parallel">
          <path
            v-for="p in sideGrid.parallels"
            :key="`sp${p.lat}`"
            :d="`M ${SIDE.cx - p.half.toFixed(2)} ${p.y.toFixed(2)} L ${SIDE.cx + p.half.toFixed(2)} ${p.y.toFixed(2)}`"
          />
        </g>
        <g data-explain="side-meridian">
          <path v-for="m in sideGrid.meridians" :key="`sm${m.lon}`" class="demo__curve" :d="m.d" />
        </g>
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
        <g class="demo__grid" data-explain="polar-parallel">
          <path
            v-for="c in polarGrid.parallels"
            :key="`pp${c.lat}`"
            :d="circlePath(POLAR.cx, POLAR.cy, c.r)"
          />
        </g>
        <g class="demo__grid" data-explain="polar-meridian">
          <path
            v-for="m in polarGrid.meridians"
            :key="`pm${m.lon}`"
            :d="`M ${POLAR.cx} ${POLAR.cy} L ${POLAR.cx + POLAR.r * Math.cos((m.angle * Math.PI) / 180)} ${POLAR.cy - POLAR.r * Math.sin((m.angle * Math.PI) / 180)}`"
          />
        </g>
        <path class="demo__leader" data-explain="dashed-parallel" :d="circlePath(POLAR.cx, POLAR.cy, dashedCircle.r)" />
        <path
          class="demo__curve"
          data-explain="meridian-split"
          :d="`M ${POLAR.cx - POLAR.r} ${POLAR.cy} L ${POLAR.cx + POLAR.r} ${POLAR.cy}`"
        />
        <path
          class="demo__curve"
          data-explain="polar-equator"
          :d="circlePath(POLAR.cx, POLAR.cy, POLAR.r)"
        />
        <circle class="demo__cut" data-explain="polar-center" :cx="POLAR.cx" :cy="POLAR.cy" r="5" />
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
        <g class="demo__grid" data-explain="side-parallel">
          <path
            v-for="p in smallSideGrid.parallels"
            :key="`ssp${p.lat}`"
            :d="`M ${SMALL_SIDE.cx - p.half.toFixed(2)} ${p.y.toFixed(2)} L ${SMALL_SIDE.cx + p.half.toFixed(2)} ${p.y.toFixed(2)}`"
          />
        </g>
        <g data-explain="side-meridian">
          <path
            v-for="m in smallSideGrid.meridians"
            :key="`ssm${m.lon}`"
            class="demo__curve"
            :d="m.d"
          />
        </g>
        <circle class="demo__globe-plain" :cx="SMALL_POLAR.cx" :cy="SMALL_POLAR.cy" :r="SMALL_POLAR.r" />
        <g class="demo__grid" data-explain="polar-parallel">
          <path
            v-for="c in smallPolarGrid.parallels"
            :key="`spp${c.lat}`"
            :d="circlePath(SMALL_POLAR.cx, SMALL_POLAR.cy, c.r)"
          />
        </g>
        <g class="demo__grid" data-explain="polar-meridian">
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
import {
  KM_PER_DEGREE,
  meridianSpacingKm,
  polarMeridianAngle,
  polarParallelMetrics,
  polarViewGrid,
  sideMeridianMetrics,
  sideParallelMetrics,
  sideViewGrid,
} from '../../data/mapViewsGeometry'
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

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 弦长、实地长度、方位角都从同一套几何里出，图和讲解不会对不上。
 */
const sideLat60 = sideParallelMetrics(60, SIDE.r)
const sideLat30 = sideParallelMetrics(30, SIDE.r)
const polarLat60 = polarParallelMetrics(60, POLAR.r)
const polarLat30 = polarParallelMetrics(30, POLAR.r)
const meridian40 = sideMeridianMetrics(40, SIDE.r)

const vars = {
  lat60Chord: `${sideLat60.chord.toFixed(1)} px`,
  lat30Chord: `${sideLat30.chord.toFixed(1)} px`,
  lat60Len: `${Math.round(sideLat60.lengthKm).toLocaleString('en-US')} 千米`,
  lat30Len: `${Math.round(sideLat30.lengthKm).toLocaleString('en-US')} 千米`,
  equatorLen: `${Math.round(sideParallelMetrics(0, SIDE.r).lengthKm).toLocaleString('en-US')} 千米`,
  meridianLen: `${Math.round(meridian40.lengthKm).toLocaleString('en-US')} 千米`,
  bulge40: `${meridian40.bulge.toFixed(1)} px`,
  bulge0: `${sideMeridianMetrics(0, SIDE.r).bulge.toFixed(1)} px`,
  polarR60: `${polarLat60.r.toFixed(1)} px`,
  polarR30: `${polarLat30.r.toFixed(1)} px`,
  angle0: `${polarMeridianAngle(0)}°`,
  angle90E: `${polarMeridianAngle(90)}°`,
  angle180: `${polarMeridianAngle(180)}°`,
  angle90W: `${polarMeridianAngle(270)}°`,
  gap60: `${meridianSpacingKm(60).toFixed(1)} 千米`,
  gap0: `${meridianSpacingKm(0).toFixed(1)} 千米`,
  kmPerDeg: `${KM_PER_DEGREE} 千米`,
}

const explains = {
  'side-parallel': {
    name: '侧视图里的纬线（横线）',
    hint: '横着穿过球面的那些线：它们圈住地球，越靠两极越短。',
    vars,
    steps: [
      '纬线是垂直于地轴的圆圈——侧着看就成了横着的直线',
      '纬线长度 = 2πR·cosφ：赤道 {equatorLen}，30°N 还有 {lat30Len}，60°N 只剩 {lat60Len}',
      '屏幕上是一段弦：60°N 弦长 {lat60Chord}，30°N 弦长 {lat30Chord}',
      '所以横线越短 = 纬度越高，这是从图上读纬度的依据',
    ],
  },
  'side-meridian': {
    name: '侧视图里的经线（弧）',
    hint: '从北极连到南极的弧：每条都一样长，鼓不鼓看它离观察者多远。',
    vars,
    steps: [
      '经线是连接南北两极的半圆，屏幕上是一条弧',
      '经线长度处处相等 = 半个大圆 = πR ≈ {meridianLen}',
      '弧鼓不鼓只看它相对观察者的经度差：站在 0° 经线上看，0° 经线是竖直线（鼓出 {bulge0}），40° 经线鼓出 {bulge40}',
      '判经线最可靠的办法只有一条：两头连着南北两个极点',
    ],
  },
  'polar-parallel': {
    name: '俯视图里的纬线（同心圆）',
    hint: '从极点往下看，纬线变成一个个同心圆，圈越小纬度越高。',
    vars,
    steps: [
      '从极点正上方看，每条纬线都是一个圆，圆心就是极点',
      '半径 = R·cosφ：60°N 的圈半径 {polarR60}，30°N 的圈半径 {polarR30}',
      '圈越小 = 纬度越高，最外圈（半径 = R）是赤道',
      '换到俯视图，纬线不再横着——认线靠「圆的是纬线，直的是经线」',
    ],
  },
  'polar-meridian': {
    name: '俯视图里的经线（放射直线）',
    hint: '从中心向四周放射的直线，每条都过南北两极。',
    vars,
    steps: [
      '每条经线都过南北两极，俯视时就是一条穿过圆心的直线',
      '方位定死：0° 经线在正下方，90°E 在正右方，180° 在正上方',
      '经度沿逆时针增大：正下方 {angle0} → 正右方 {angle90E} → 正上方 {angle180}',
      '为什么逆时针就是东：北极上空看地球自转是逆时针，而地球自西向东转',
    ],
  },
  'polar-center': {
    name: '中心那个点（极点）',
    hint: '所有经线都从它出发，所有纬线都以它为圆心。',
    vars,
    steps: [
      '中心就是极点（这里俯视北极）',
      '所有经线都从它出发，所有纬线都以它为圆心',
      '极点处的纬线缩成一个点，纬线长度 = 0',
      '相邻经线的实地间隔：赤道处 {gap0}，60°N 处 {gap60}，到极点归零',
    ],
  },
  'polar-equator': {
    name: '最外圈（赤道）',
    hint: '半径等于球半径的那一圈，就是 0° 纬线。',
    vars,
    steps: [
      '最外圈半径 = R，对应的就是赤道（0° 纬线）',
      '赤道是最长的纬线：{equatorLen}',
      '它里面的每一圈都比它小，纬度越高圈越小',
      '认赤道：俯视图里半径等于球半径的那一圈',
    ],
  },
  'dashed-parallel': {
    name: '虚线画的圆（也是纬线）',
    hint: '虚实只是画图时为了区分两条线，不代表另一种要素。',
    vars,
    steps: [
      '虚线只是画图时为了跟别的纬线区分开，不是另一种要素',
      '它仍然是纬线，半径还是 R·cosφ = {polarR60}',
      '判它是纬线的方法和实线一样：是个圆、圆心在极点上',
      '读图时不要漏看虚线要素——漏一条就少一个得分点',
    ],
  },
  'meridian-split': {
    name: '同一条直线的两半',
    hint: '一条直线连着两个半头，它们是相差 180° 的两条经线。',
    vars,
    steps: [
      '经线是一个过两极的大圆，俯视时是一条穿过圆心的直线',
      '一条直线有两个半头，各自代表一条经线',
      '正右方是 90°E（方位角 {angle90E}），正左方是 90°W（方位角 {angle90W}），两者相差 180°',
      '所以「同一条直线的两半是两条不同的经线」——数经线别把一条数成两条',
    ],
  },
}
</script>
