<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 手势法：手心朝上，四指 = 原方向，拇指 = 偏转后方向 -->
      <g v-show="step === 0" class="demo__frame">
        <g
          data-explain="hand"
          :transform="`${handTransform(overview.x, overview.y, 90, 'right')} scale(1.4)`"
        >
          <rect class="demo__hand" x="-34" y="-11" width="20" height="22" rx="8" />
          <rect class="demo__hand" x="-16" y="-19" width="34" height="38" rx="11" />
          <rect
            v-for="f in fingers"
            :key="`f${f.i}`"
            class="demo__hand"
            :x="16"
            :y="f.y"
            width="34"
            height="7.5"
            rx="3.7"
          />
          <rect
            class="demo__hand"
            x="10"
            y="17"
            width="9.5"
            height="19"
            rx="4.5"
            transform="rotate(-8 14 22)"
          />
        </g>

        <path class="demo__spin" data-explain="original" :d="overviewOriginal.path" />
        <path class="demo__spin-head" data-explain="original" :d="overviewOriginal.head" />
        <path class="demo__spin" data-explain="deflected" :d="overviewDeflected.path" />
        <path class="demo__spin-head" data-explain="deflected" :d="overviewDeflected.head" />

        <text class="demo__label demo__label--mark" :x="overview.x" y="108" text-anchor="middle">
          四指 = 原始运动方向
        </text>
        <text class="demo__label demo__label--mark" :x="overview.x + 84" y="188">拇指 = 偏转后方向</text>
        <path class="demo__leader" d="M 268 196 L 292 186" />
        <text class="demo__label demo__label--faint" x="262" y="200" text-anchor="end">手心朝上</text>

        <text class="demo__caption-line" x="360" y="352" text-anchor="middle">
          手心朝上，四指指原来走的方向，拇指指它被「掰」过去之后的方向
        </text>
      </g>

      <!-- ② 北半球用右手：向右偏 -->
      <g v-show="step === 1" class="demo__frame">
        <g data-explain="hand" :transform="handTransform(250, 195, 90, 'right')">
          <rect class="demo__hand" x="-34" y="-11" width="20" height="22" rx="8" />
          <rect class="demo__hand" x="-16" y="-19" width="34" height="38" rx="11" />
          <rect
            v-for="f in fingers"
            :key="`f${f.i}`"
            class="demo__hand"
            :x="16"
            :y="f.y"
            width="34"
            height="7.5"
            rx="3.7"
          />
          <rect
            class="demo__hand"
            x="10"
            y="17"
            width="9.5"
            height="19"
            rx="4.5"
            transform="rotate(-8 14 22)"
          />
        </g>

        <path class="demo__spin" data-explain="original" :d="northOriginal.path" />
        <path class="demo__spin-head" data-explain="original" :d="northOriginal.head" />
        <path class="demo__spin" data-explain="deflected" :d="northDeflected.path" />
        <path class="demo__spin-head" data-explain="deflected" :d="northDeflected.head" />

        <text class="demo__label demo__label--mark" x="250" y="108" text-anchor="middle">原方向：朝北</text>
        <text class="demo__label demo__label--mark" x="334" y="188">偏转后：向东 = 右偏</text>
        <text class="demo__label demo__label--faint" x="250" y="272" text-anchor="middle">北半球用右手</text>

        <text class="demo__caption-line" x="360" y="352" text-anchor="middle">
          左右要站在观测者位置、面朝物体运动方向来数——朝北时，你的右边就是东
        </text>
      </g>

      <!-- ③ 南半球用左手：向左偏；赤道不偏 -->
      <g v-show="step === 2" class="demo__frame">
        <g data-explain="hand" :transform="handTransform(250, 195, 90, 'left')">
          <rect class="demo__hand" x="-34" y="-11" width="20" height="22" rx="8" />
          <rect class="demo__hand" x="-16" y="-19" width="34" height="38" rx="11" />
          <rect
            v-for="f in fingers"
            :key="`f${f.i}`"
            class="demo__hand"
            :x="16"
            :y="f.y"
            width="34"
            height="7.5"
            rx="3.7"
          />
          <rect
            class="demo__hand"
            x="10"
            y="17"
            width="9.5"
            height="19"
            rx="4.5"
            transform="rotate(-8 14 22)"
          />
        </g>

        <path class="demo__spin" data-explain="original" :d="southOriginal.path" />
        <path class="demo__spin-head" data-explain="original" :d="southOriginal.head" />
        <path class="demo__spin" data-explain="deflected" :d="southDeflected.path" />
        <path class="demo__spin-head" data-explain="deflected" :d="southDeflected.head" />

        <text class="demo__label demo__label--mark" x="250" y="108" text-anchor="middle">原方向：朝北</text>
        <text class="demo__label demo__label--mark" x="166" y="188" text-anchor="end">
          偏转后：向西 = 左偏
        </text>
        <text class="demo__label demo__label--faint" x="250" y="272" text-anchor="middle">南半球用左手</text>

        <!-- 赤道：不偏 -->
        <g data-explain="hand" :transform="`${handTransform(520, 200, 90, 'right')} scale(0.8)`">
          <rect class="demo__hand" x="-34" y="-11" width="20" height="22" rx="8" />
          <rect class="demo__hand" x="-16" y="-19" width="34" height="38" rx="11" />
          <rect
            v-for="f in fingers"
            :key="`f${f.i}`"
            class="demo__hand"
            :x="16"
            :y="f.y"
            width="34"
            height="7.5"
            rx="3.7"
          />
          <rect
            class="demo__hand"
            x="10"
            y="17"
            width="9.5"
            height="19"
            rx="4.5"
            transform="rotate(-8 14 22)"
          />
        </g>
        <path class="demo__spin" data-explain="equator" :d="equatorArrow.path" />
        <path class="demo__spin-head" data-explain="equator" :d="equatorArrow.head" />
        <text
          class="demo__label demo__label--faint"
          data-explain="equator"
          x="520"
          y="252"
          text-anchor="middle"
        >
          赤道 φ=0 → F=0 → 不偏
        </text>

        <text class="demo__caption-line" x="360" y="352" text-anchor="middle">
          南北半球用手不同，方向正好相反：南半球用左手 → 向左偏；赤道严格不偏
        </text>
      </g>

      <!-- ④ 大小随纬度增大；左右要面朝运动方向数 -->
      <g v-show="step === 3" class="demo__frame">
        <text class="demo__label demo__label--mark" x="84" y="64">大小：F = 2mvω·sinφ</text>
        <text class="demo__label demo__label--faint" x="84" y="84">
          m 质量、v 速度、ω 自转角速度、φ 纬度
        </text>

        <g v-for="b in bars" :key="`b${b.lat}`" data-explain="factor-bars">
          <path class="demo__curve" :d="`M ${b.x} 300 L ${b.x} ${b.top}`" />
          <circle class="demo__cut" :cx="b.x" :cy="b.top" r="4" />
          <text class="demo__label demo__label--faint" :x="b.x" y="320" text-anchor="middle">
            {{ b.lat }}°
          </text>
          <text class="demo__label" :x="b.x" :y="b.top - 12" text-anchor="middle">{{ b.value }}</text>
        </g>
        <text class="demo__label demo__label--faint" x="84" y="344">
          sinφ 随纬度递增 → 地转偏向力与纬度正相关
        </text>

        <!-- 数左右的规矩：朝南运动的那个反例 -->
        <text class="demo__label demo__label--mark" x="400" y="64">左右怎么数？</text>
        <text class="demo__label demo__label--faint" x="400" y="84">
          站在观测者位置、面朝物体运动方向
        </text>
        <path class="demo__curve" data-explain="counter-example" d="M 560 176 Q 560 236 512 262" />
        <path class="demo__spin-head" data-explain="counter-example" :d="arrowHead(512, 262, 210, 16)" />
        <text class="demo__label demo__label--mark" x="576" y="150">原方向：朝南</text>
        <text class="demo__label demo__label--faint" x="576" y="226">面朝南 → 右边是西</text>
        <text class="demo__label demo__label--mark" x="500" y="292" text-anchor="end">偏转后：向西</text>
        <text class="demo__label demo__label--faint" x="400" y="344">
          按纸面左右数会得到东——正好数反
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §3.8 地转偏向力的大小与手势法。
 *
 * 讲义原话（老师现场演示的手势）：两手**掌心朝上**；**南半球用左手、北半球用右手**；
 * **四指**指向物体**原始运动方向**；**拇指**指向受偏向力后**偏转的方向**；赤道不偏。
 * 这四步照着原文画，不自己发挥：
 *   ① 手势法总览：手心朝上、四指 = 原方向、拇指 = 偏转后方向
 *   ② 北半球用右手 → 向右偏
 *   ③ 南半球用左手 → 向左偏；赤道不偏
 *   ④ 大小与纬度正相关；左右要站在观测者位置、面朝运动方向数
 *
 * 拇指方向就是偏转方向（右手 = 顺时针 90°，左手 = 逆时针 90°），
 * 箭头方向直接取自这个角，不会画反。
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { arrowHead } from '../../data/svgParts'
import {
  THUMB_OFFSET_DEG,
  angularSpeedText,
  coriolisFactor,
  coriolisFactors,
  coriolisParameterText,
  deflectionAngleText,
  deflectionText,
  handTransform,
  thumbAngle,
} from '../../data/coriolisHandGeometry'

const steps = [
  {
    id: 'gesture',
    title: '① 手势法：手心朝上，四指与拇指各管一件事',
    text: '判断往哪边歪有个省事的办法：手心翻成朝上，四根手指指着物体原来走的方向，大拇指指的就是它被地球自转「掰」过去之后的方向。为什么要手心朝上？因为地球在你下面，手心朝上才相当于站在地面上、面朝运动方向去数左右。',
  },
  {
    id: 'north',
    title: '② 北半球用右手：向右偏',
    text: '在北半球就用右手比划：四指指原方向，拇指指向偏转后的方向。物体朝北走时，拇指指东——面朝北时右边就是东，这叫「右偏」。所以要记的不是「北右南左」这四个字，而是「站在观测者位置、面朝运动方向数左右」。',
  },
  {
    id: 'south',
    title: '③ 南半球用左手：向左偏，赤道不偏',
    text: '南半球换成左手，同样的动作，拇指指向就反了过来：朝南半球走、朝北时拇指指西——面朝北时左边是西，这就是「左偏」。赤道是例外：φ=0 时 sin0°=0，地转偏向力严格为 0，一点都不偏。',
  },
  {
    id: 'size',
    title: '④ 大小随纬度增大；数左右别按地图方位',
    text: '大小公式 F = 2mvω·sinφ 不用背，只要认得每个字母：m 质量、v 速度、ω 自转角速度、φ 纬度。sinφ 从 0° 到 90° 逐渐递增，所以其他量不变时，地转偏向力随纬度增大——赤道为 0。左右一定按「站在观测者位置、面朝运动方向」来数，按地图方位数最容易数反。',
  },
]

/** 四根手指在手掌上的位置（本地坐标：四指指向 +x，拇指在 +y 侧） */
const fingers = [0, 1, 2, 3].map((i) => ({ i, y: -18 + i * 9.5 }))

/** 从某点按给定方位角画一支箭头 */
function arrow(fromX, fromY, angleDeg, len, size = 13) {
  const rad = (angleDeg * Math.PI) / 180
  const tip = { x: fromX + len * Math.cos(rad), y: fromY - len * Math.sin(rad) }
  return {
    path: `M ${fromX} ${fromY} L ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`,
    head: arrowHead(tip.x, tip.y, angleDeg, size),
  }
}

/** ① 总览：手心朝上，四指朝北，拇指朝东 */
const overview = { x: 330, y: 195 }
const overviewOriginal = arrow(overview.x, overview.y, 90, 69)
const overviewDeflected = arrow(overview.x, overview.y, thumbAngle(90, 'right'), 74)

/** ② 北半球：右手，拇指 = 偏转后方向 */
const northOriginal = arrow(250, 195, 90, 69)
const northDeflected = arrow(250, 195, thumbAngle(90, 'right'), 74)

/** ③ 南半球：左手，拇指 = 偏转后方向 */
const southOriginal = arrow(250, 195, 90, 69)
const southDeflected = arrow(250, 195, thumbAngle(90, 'left'), 74)

/** ③ 赤道：只有原方向，没有偏转 */
const equatorArrow = arrow(520, 200, 90, 54, 12)

/** ④ 大小：sinφ 随纬度递增 */
const bars = (() => {
  const lats = [0, 30, 45, 60, 90]
  const factors = coriolisFactors(lats)
  const baseY = 300
  const maxH = 130
  return factors.map((f, i) => ({
    lat: f.lat,
    value: f.factor.toFixed(2),
    x: 100 + i * 46,
    top: Number((baseY - maxH * f.factor).toFixed(2)),
  }))
})()

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 参数一动，图和讲解一起变，不会出现「图上 0.87、文字写着 0.85」。
 */
const explains = computed(() => {
  const vars = {
    omega: angularSpeedText(),
    offset: `${THUMB_OFFSET_DEG}°`,
    defNorth: deflectionAngleText('north'),
    defSouth: deflectionAngleText('south'),
    defEquator: deflectionAngleText('equator'),
    dirNorth: deflectionText('north'),
    dirSouth: deflectionText('south'),
    fNorth: coriolisParameterText(40),
    fSouth: coriolisParameterText(-40),
    fEquator: coriolisParameterText(0),
    factor0: coriolisFactor(0).toFixed(2),
    factor30: coriolisFactor(30).toFixed(2),
    factor45: coriolisFactor(45).toFixed(2),
    factor60: coriolisFactor(60).toFixed(2),
    factor90: coriolisFactor(90).toFixed(2),
  }

  return {
    hand: {
      name: '手势法',
      hint: '手心朝上，四指指原方向，拇指指偏转后的方向。',
      vars,
      steps: [
        '讲义给的口令：南半球用左手、北半球用右手',
        '四指指向物体的原始运动方向，拇指指向偏转后的方向',
        '手心朝上 = 站在地面上、面朝运动方向去数左右',
        '右手手心朝上、四指指北 → 拇指指东（面朝北时右边是东）',
        '左手手心朝上、四指指北 → 拇指指西（面朝北时左边是西）',
      ],
    },
    original: {
      name: '原始运动方向',
      hint: '物体在没被地转偏向力掰过去之前走的方向。',
      vars,
      steps: [
        '四指的指向就是物体原来的运动方向',
        '偏转是在原方向基础上转过来的，偏转角固定 {offset}',
        '北半球偏转角 = {defNorth}（数学角，顺时针为负）',
        '南半球偏转角 = {defSouth}（逆时针为正）',
        '赤道偏转角 = {defEquator}——f = 0，一点都不转',
      ],
    },
    deflected: {
      name: '偏转后的方向',
      hint: '拇指指的方向，就是物体真正走出来的方向。',
      vars,
      steps: [
        '拇指的指向就是偏转后的方向',
        '偏转方向由 f = 2Ωsinφ 的符号决定，Ω = {omega}',
        '北半球 f > 0 ⇒ {dirNorth}',
        '南半球 f < 0 ⇒ {dirSouth}',
        '赤道 f = 0 ⇒ 不偏，所以南北半球的偏向正好相反',
      ],
    },
    equator: {
      name: '赤道不偏',
      hint: '赤道上 φ = 0，地转偏向力严格等于 0。',
      vars,
      steps: [
        '地转偏向力参数 f = 2Ωsinφ，Ω = {omega}',
        '赤道 φ = 0° ⇒ sin0° = 0 ⇒ f = {fEquator}',
        'f = 0 ⇒ 偏转角 = {defEquator}，物体沿原方向走直线',
        '所以这一支箭头只有原方向，没有偏转后的方向',
        '北右南左的分界线就在赤道',
      ],
    },
    'factor-bars': {
      name: '大小随纬度增大',
      hint: 'F = 2mvω·sinφ，sinφ 随纬度单调递增。',
      vars,
      steps: [
        'F = 2mvω·sinφ',
        'm 是质量、v 是速度、ω 是自转角速度（ω = {omega}）、φ 是纬度',
        'm、v、ω 不变时，F 只随 sinφ 变',
        'sinφ 单调递增：0° → {factor0}、30° → {factor30}、45° → {factor45}、60° → {factor60}、90° → {factor90}',
        '所以地转偏向力与纬度正相关：赤道为 0、两极达到最大',
      ],
    },
    'counter-example': {
      name: '朝南运动的反例',
      hint: '左右要站在观测者位置、面朝运动方向来数。',
      vars,
      steps: [
        '左右要站在观测者位置、面朝物体的运动方向来数',
        '物体朝南运动 ⇒ 面朝南 ⇒ 右边是西',
        '北半球向右偏 ⇒ 偏转后朝西',
        '按地图方位去数（把朝南的物体往右边一摆）会得到东——正好数反',
        '记法：先想「面朝哪」，再定「右边是哪个方向」',
      ],
    },
  }
})
</script>

<style scoped>
/* 只用共享层的变量，不新增色值 */
.demo__hand {
  fill: var(--learn-day);
  stroke: var(--learn-day-edge);
  stroke-width: 1.5;
  stroke-linejoin: round;
}
</style>
