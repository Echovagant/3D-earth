<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 地球一边自转，一边绕太阳跑 -->
      <g v-show="step === 0" class="demo__frame">
        <path class="demo__curve" data-explain="orbit" :d="orbitPath" />
        <circle class="demo__sun" data-explain="sun" :cx="orbit.sun.x" :cy="orbit.sun.y" r="24" />
        <text class="demo__label" :x="orbit.sun.x" :y="orbit.sun.y + 48" text-anchor="middle">
          太阳（焦点）
        </text>

        <circle class="demo__globe-plain" :cx="orbit.earthA.x" :cy="orbit.earthA.y" r="15" />
        <path class="demo__spin" data-explain="spin" :d="spinArc" />
        <path class="demo__spin-head" :d="spinHead" />

        <path class="demo__spin" data-explain="orbit-arrow" :d="orbitArrow.path" />
        <path class="demo__spin-head" :d="orbitArrow.head" />
        <text class="demo__label demo__label--faint" :x="orbitArrow.label.x" :y="orbitArrow.label.y">
          公转方向
        </text>

        <text class="demo__caption-line" x="360" y="352" text-anchor="middle">
          太阳在椭圆轨道的一个焦点上；地球一边自转，一边绕着太阳跑
        </text>
      </g>

      <!-- ② 恒星太远：方向固定不变 -->
      <g v-show="step === 1" class="demo__frame">
        <path class="demo__curve" :d="orbitPath" />
        <circle class="demo__sun" :cx="orbit.sun.x" :cy="orbit.sun.y" r="24" />
        <circle class="demo__globe-plain" :cx="orbit.earthA.x" :cy="orbit.earthA.y" r="15" />
        <path class="demo__spin" :d="spinArc" />
        <path class="demo__spin-head" :d="spinHead" />

        <path class="demo__curve" data-explain="needle" :d="needleA" />
        <path class="demo__leader" :d="sunToStar" />
        <path class="demo__star" data-explain="star" :d="starMark" />
        <text class="demo__label demo__label--mark" :x="star.x + 16" :y="star.y + 26">恒星</text>
        <text class="demo__label demo__label--faint" :x="star.x + 16" :y="star.y + 42">
          方向永远不变
        </text>

        <text class="demo__caption-line" x="360" y="352" text-anchor="middle">
          这一刻指针正对太阳，也正对那颗恒星；恒星太远，方向永远不变
        </text>
      </g>

      <!-- ③ 转满 360°：恒星又对准了，太阳还没对上 -->
      <g v-show="step === 2" class="demo__frame">
        <path class="demo__curve" :d="orbitPath" />
        <circle class="demo__sun" :cx="orbit.sun.x" :cy="orbit.sun.y" r="24" />

        <!-- 起点 A：指针正对太阳，也正对恒星 -->
        <circle class="demo__globe-plain" :cx="orbit.earthA.x" :cy="orbit.earthA.y" r="14" />
        <path class="demo__curve" data-explain="needle" :d="needleA" />
        <text class="demo__label demo__label--faint" :x="orbit.earthA.x" :y="orbit.earthA.y + 34">
          A · 自转起点
        </text>

        <!-- 终点 B：指针仍指着恒星，可太阳已经偏了 δ -->
        <circle class="demo__globe-plain" :cx="plan.earthB.x" :cy="plan.earthB.y" r="14" />
        <path class="demo__curve" data-explain="needle" :d="needleB" />
        <path class="demo__leader" :d="sunRayB" />
        <path class="demo__spin" data-explain="extra" :d="extraArc" />
        <path class="demo__spin-head" :d="extraHead" />
        <text class="demo__label demo__label--mark" :x="delta.x" :y="delta.y" text-anchor="end">δ</text>
        <text class="demo__label demo__label--faint" :x="plan.earthB.x" :y="plan.earthB.y + 34">
          B · 转满 360°
        </text>

        <text class="demo__label demo__label--mark" x="474" y="108">
          太阳方向转了 {{ extraLabel }}
        </text>
        <text class="demo__label demo__label--faint" x="474" y="126">
          真实值 0.98°（{{ extraMinutes }}′），图上放大 {{ magnification }} 倍
        </text>

        <text class="demo__caption-line" x="360" y="372" text-anchor="middle">
          转满 360°：恒星又对准了（恒星日），太阳还差 {{ extraLabel }} → 还得再转这一点
        </text>
      </g>

      <!-- ④ 两个数字摆在一起 -->
      <g v-show="step === 3" class="demo__frame">
        <g data-explain="sidereal">
          <circle class="demo__globe-plain" cx="200" cy="140" r="62" />
          <text class="demo__label demo__label--mark" x="200" y="86" text-anchor="middle">恒星日（真）</text>
          <text class="demo__label" x="200" y="152" text-anchor="middle">自转 360°</text>
          <text class="demo__label demo__label--mark" x="200" y="182" text-anchor="middle">
            {{ SIDEREAL_DAY_TEXT }}
          </text>
        </g>
        <g data-explain="solar">
          <circle class="demo__globe-plain" cx="520" cy="140" r="62" />
          <text class="demo__label demo__label--mark" x="520" y="86" text-anchor="middle">太阳日（赝）</text>
          <text class="demo__label" x="520" y="152" text-anchor="middle">自转 360°59′</text>
          <text class="demo__label demo__label--mark" x="520" y="182" text-anchor="middle">
            {{ SOLAR_DAY_TEXT }}
          </text>
        </g>

        <path class="demo__leader" d="M 276 140 L 306 140" />
        <path class="demo__leader" d="M 414 140 L 444 140" />
        <text class="demo__label" x="360" y="130" text-anchor="middle">相差约 4 分钟</text>
        <text class="demo__label demo__label--faint" x="360" y="150" text-anchor="middle">
          （{{ diffText }}）
        </text>

        <text class="demo__caption-line" x="360" y="250" text-anchor="middle">
          59′ 是角度（角分），不是 59 分钟——时间差是 24 时减 23 时 56 分 4 秒
        </text>
        <text class="demo__caption-line" x="360" y="282" text-anchor="middle">
          恒星日是自转的真正周期；太阳日是地球公转之后「追」出来的
        </text>
        <text class="demo__label demo__label--faint" x="360" y="316" text-anchor="middle">
          我们过日子用的是太阳日，所以它是「赝」；但它是实用的那个
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §3.2 地球自转的周期：恒星日与太阳日。
 *
 * 老师的类比：「你手里举着手机转圈：转完一圈手机肯定歪了，还得再转一点才对准」。
 * 这四步把「歪的那一点」真的画出来：
 *   ① 地球一边自转一边绕太阳跑，太阳在轨道焦点上
 *   ② 恒星太远，方向固定不变
 *   ③ 转满 360°，恒星又对准了，可太阳已经偏了 δ —— 还得再转 δ
 *   ④ 两个数字摆在一起：恒星日 23 时 56 分 4 秒 vs 太阳日 24 小时
 *
 * 太阳方位偏多少是算出来的（bearingShiftDeg），不是画上去的。
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { arrowHead, polarToXY } from '../../data/svgParts'
import {
  DAY_DIFF_MINUTES,
  DAYS_PER_YEAR,
  DEGREES_PER_HOUR,
  DRAW_EXTRA_DEG,
  EXTRA_ARC_MINUTES,
  ORBIT_PER_DAY_DEG,
  SIDEREAL_DAY_TEXT,
  SOLAR_DAY_TEXT,
  arcBetween,
  buildOrbit,
  drawPlan,
  ellipsePath,
  ellipsePoint,
  ellipseTangent,
  extraArcHours,
} from '../../data/siderealVsSolarDayGeometry'

const steps = [
  {
    id: 'orbit',
    title: '① 地球一边自转，一边绕太阳跑',
    text: '地球自转的同时还绕着太阳公转，公转轨道是个椭圆，太阳在椭圆的一个焦点上。这个「一边转圈一边绕圈」的组合，才是两个周期差那 4 分钟的原因。',
  },
  {
    id: 'star',
    title: '② 拿远处的一颗恒星当尺子',
    text: '恒星远得没法想象：地球绕太阳跑出去的那点距离，相对它完全可以忽略，所以它在天空里的方向几乎不变——转一圈回来，它还在原地等你。这一刻指针正对太阳，也正对那颗恒星；往后转，太阳会慢慢从那颗恒星旁边挪开。',
  },
  {
    id: 'extra',
    title: '③ 转满一圈：恒星对准了，太阳还差一点',
    text: '地球自转满 360°，指针又指回那颗恒星——这就是恒星日。可太阳离地球只有约 1.5 亿千米，这段时间里地球已经沿轨道挪了一段，太阳在天空里的位置跟着偏了一点（一天大约 0.98°，也就是 59′）。地球得多转这么一点点，才能重新对上太阳。',
  },
  {
    id: 'numbers',
    title: '④ 恒星日 23 时 56 分 4 秒，太阳日 24 小时',
    text: '所以恒星日是自转的真正周期，太阳日是「追着太阳」追出来的结果，两者相差约 4 分钟。要注意：59′ 是角度不是 59 分钟；我们过日子用的是太阳日，所以它是「赝」，但它是实用的那个。',
  },
]

/** 轨道：太阳在左焦点，地球先在椭圆最右端（离太阳最远） */
const orbit = buildOrbit({ cx: 360, cy: 200, a: 190, b: 95 })
const orbitPath = ellipsePath(orbit.cx, orbit.cy, orbit.a, orbit.b)

/** 画面方案：地球从 A 前进到 B，太阳方位正好转过 DRAW_EXTRA_DEG */
const plan = drawPlan(orbit)
const magnification = plan.magnification.toFixed(1)
const extraLabel = `${DRAW_EXTRA_DEG}°`
const extraMinutes = EXTRA_ARC_MINUTES.toFixed(1)

/** 两个周期的时间差：24 时 − 23 时 56 分 4 秒 */
const diffText = (() => {
  const total = Math.round(DAY_DIFF_MINUTES * 60)
  return `${Math.floor(total / 60)} 分 ${total % 60} 秒`
})()

/** ① 自转箭头：地球圆盘外的一小段逆时针弧（俯视 = 北极上方看） */
const spinArc = arcBetween(orbit.earthA.x, orbit.earthA.y, 30, 20, 160, 'ccw')
const spinHead = arrowHead(
  polarToXY(orbit.earthA.x, orbit.earthA.y, 30, 160).x,
  polarToXY(orbit.earthA.x, orbit.earthA.y, 30, 160).y,
  250,
  12,
)

/** ① 公转箭头：沿椭圆切线，指向逆时针方向 */
const orbitArrow = (() => {
  const p = ellipsePoint(orbit, 32)
  const angle = ellipseTangent(orbit, 32)
  const a = (angle * Math.PI) / 180
  const tip = { x: p.x + 54 * Math.cos(a), y: p.y - 54 * Math.sin(a) }
  return {
    path: `M ${p.x.toFixed(2)} ${p.y.toFixed(2)} L ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`,
    head: arrowHead(tip.x, tip.y, angle, 13),
    label: { x: tip.x + 14, y: tip.y + 4 },
  }
})()

/** 指针长度：同时也是「还要多转的那一下」那段弧的半径 */
const NEEDLE_LEN = 46

/** 指针：从地球中心指向恒星（t=0 时也正对太阳） */
const needleA = (() => {
  const tip = polarToXY(orbit.earthA.x, orbit.earthA.y, NEEDLE_LEN, plan.bearingA)
  return `M ${orbit.earthA.x.toFixed(2)} ${orbit.earthA.y.toFixed(2)} L ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`
})()

/** ② 恒星：沿着同一条视线放在太阳更远的一侧 */
const star = (() => {
  const p = polarToXY(orbit.earthA.x, orbit.earthA.y, 470, plan.bearingA)
  return { x: p.x, y: p.y }
})()
const sunToStar = `M ${orbit.sun.x - 26} ${orbit.sun.y.toFixed(2)} L ${star.x.toFixed(2)} ${star.y.toFixed(2)}`
/** 四角星：两段交叉的短线 */
const starMark = (() => {
  const s = 9
  return (
    `M ${star.x - s} ${star.y} L ${star.x + s} ${star.y} ` +
    `M ${star.x} ${star.y - s} L ${star.x} ${star.y + s} ` +
    `M ${star.x - 6} ${star.y - 6} L ${star.x + 6} ${star.y + 6} ` +
    `M ${star.x + 6} ${star.y - 6} L ${star.x - 6} ${star.y + 6}`
  )
})()

/** ③ 终点 B：指针仍指着同一个方向（恒星），太阳却偏了 δ */
const needleB = (() => {
  const tip = polarToXY(plan.earthB.x, plan.earthB.y, NEEDLE_LEN, plan.bearingA)
  return `M ${plan.earthB.x.toFixed(2)} ${plan.earthB.y.toFixed(2)} L ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`
})()
const sunRayB = `M ${plan.earthB.x.toFixed(2)} ${plan.earthB.y.toFixed(2)} L ${orbit.sun.x.toFixed(2)} ${orbit.sun.y.toFixed(2)}`

/** ③ 还要多转的那 δ：绕 B 逆时针的一小段弧 */
const extraArc = arcBetween(plan.earthB.x, plan.earthB.y, NEEDLE_LEN, plan.bearingA, plan.bearingB, 'ccw')
const delta = (() => {
  const p = polarToXY(plan.earthB.x, plan.earthB.y, NEEDLE_LEN, (plan.bearingA + plan.bearingB) / 2)
  return { x: Number((p.x - 10).toFixed(2)), y: Number((p.y + 22).toFixed(2)) }
})()
const extraHead = arrowHead(
  polarToXY(plan.earthB.x, plan.earthB.y, NEEDLE_LEN, plan.bearingB).x,
  polarToXY(plan.earthB.x, plan.earthB.y, NEEDLE_LEN, plan.bearingB).y,
  plan.bearingB + 90,
  12,
)

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 参数一动，图和讲解一起变，不会出现「图上 66.5°、文字写着 65°」。
 */
const explains = computed(() => {
  const vars = {
    orbitPerDay: `${ORBIT_PER_DAY_DEG.toFixed(4)}°`,
    arcMinutes: `${EXTRA_ARC_MINUTES.toFixed(1)}′`,
    extraHours: extraArcHours().toFixed(4),
    diffText,
    diffMinutes: DAY_DIFF_MINUTES.toFixed(2),
    siderealText: SIDEREAL_DAY_TEXT,
    solarText: SOLAR_DAY_TEXT,
    spinDeg: `${DEGREES_PER_HOUR}°/小时`,
    yearDays: String(DAYS_PER_YEAR),
    magnification: (DRAW_EXTRA_DEG / ORBIT_PER_DAY_DEG).toFixed(1),
  }

  return {
    orbit: {
      name: '公转轨道',
      hint: '地球绕太阳的轨道：一个近似正圆的椭圆，太阳在其中一个焦点上。',
      vars,
      steps: [
        '轨道叫黄道，形状是椭圆，太阳坐在椭圆的一个焦点上',
        '地球一边自转一边公转——两个周期不同就是这么来的',
        `公转一整圈 360°，用时约 ${vars.yearDays} 天`,
        '公转方向：自西向东（与自转一致），北极上方看是逆时针',
      ],
    },
    sun: {
      name: '太阳',
      hint: '日地距离约 1.5 亿千米，所以地球公转时太阳在天空中的位置会偏。',
      vars,
      steps: [
        '日地距离约 1.5 亿 km',
        '恒星远得多（光年量级），视角差可以忽略',
        '所以：地球沿轨道跑出去的那点距离，相对太阳看得见，相对恒星看不见',
        '两个周期那 4 分钟的差，就来自这个不对称',
      ],
    },
    spin: {
      name: '自转',
      hint: '地球绕自己的轴转，转满 360° 就是恒星日。',
      vars,
      steps: [
        '自转一周 = 360°',
        `角速度 = 360° ÷ 24 小时 = ${vars.spinDeg}`,
        `自转满 360° 的真实时长是 ${vars.siderealText}`,
        '注意：这个 360° 是「转回来了」，不是「又对上太阳了」',
      ],
    },
    'orbit-arrow': {
      name: '公转方向',
      hint: '自西向东，与自转方向一致。',
      vars,
      steps: [
        '公转方向：自西向东',
        '从北极点正上方俯视是逆时针，从南极点上方俯视是顺时针',
        `公转一整圈 360°、约 ${vars.yearDays} 天 ⇒ 日均公转角 = 360° ÷ ${vars.yearDays} ≈ ${vars.orbitPerDay}`,
        `这 ${vars.orbitPerDay} 就是每天要多转的那一点`,
      ],
    },
    star: {
      name: '远处的恒星',
      hint: '拿远处的恒星当尺子：它的方向几乎不变。',
      vars,
      steps: [
        '恒星距离是光年量级，地球跑出十几亿公里也看不出方向变化',
        '指针转满 360° 回到原处 ⇒ 又正对同一颗恒星',
        `「同一位置连续两次看到同一颗恒星」的时间 = 恒星日 = ${vars.siderealText}`,
        '恒星日才是地球自转的真正周期',
      ],
    },
    needle: {
      name: '指针',
      hint: '指针转满一圈，恒星又对准了——但太阳还没对上。',
      vars,
      steps: [
        '起点 A：指针同时正对太阳和那颗恒星',
        '自转 360° 到达 B：指针仍指着恒星（那个方向没变）',
        `这一段就是恒星日 = ${vars.siderealText}`,
        `但太阳不再正对——它在天空里偏了 ${vars.orbitPerDay}`,
      ],
    },
    extra: {
      name: '还要多转的那一点',
      hint: '太阳方向转过的角度：还得再转这么一点，才能重新对上太阳。',
      vars,
      steps: [
        `一天里太阳在天空里偏了 ${vars.orbitPerDay}（图上放大了 ${vars.magnification} 倍）`,
        `换算成角分：${vars.orbitPerDay} × 60 = ${vars.arcMinutes}`,
        `折算成时间：${vars.orbitPerDay} ÷ ${vars.spinDeg} ≈ ${vars.extraHours} 小时 ≈ ${vars.diffMinutes} 分钟`,
        `所以太阳日 = 恒星日 + ${vars.diffText} = ${vars.siderealText} + ${vars.diffText} = ${vars.solarText}`,
        `注意：${vars.arcMinutes} 是角度（角分），不是 ${vars.arcMinutes} 分钟`,
      ],
    },
    sidereal: {
      name: '恒星日（真）',
      hint: `自转 360° 的真正周期：${SIDEREAL_DAY_TEXT}。`,
      vars,
      steps: [
        '定义：同一位置连续两次看到同一颗恒星所经历的时间',
        `地球自转整整 360°，用时 ${vars.siderealText}`,
        `比一个太阳日（${vars.solarText}）短 ${vars.diffText}`,
        '恒星日是「真」——它是自转本身，不受公转干扰',
      ],
    },
    solar: {
      name: '太阳日（赝）',
      hint: `我们过日子用的周期：${SOLAR_DAY_TEXT}。`,
      vars,
      steps: [
        `定义：同一位置连续两次看到太阳所经历的时间 = ${vars.solarText}`,
        `这期间地球自转了 360° + ${vars.orbitPerDay} = 360°${vars.arcMinutes}`,
        `所以太阳日 = 恒星日 + ${vars.diffText}`,
        '它是「赝」——因为地球公转了，太阳的位置也跟着挪了',
        '但它是实用的那个：作息、时刻表都用它',
      ],
    },
  }
})
</script>

<style scoped>
/* 只用共享层的变量，不新增色值 */
.demo__star {
  fill: none;
  stroke: var(--learn-accent);
  stroke-width: 2;
  stroke-linecap: round;
}
</style>
