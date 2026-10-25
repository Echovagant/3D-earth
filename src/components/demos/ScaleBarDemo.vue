<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 图上 1 厘米：用尺子量出来 -->
      <g v-show="step === 0" class="demo__frame">
        <path class="demo__curve" data-explain="map-cm" d="M 120 140 L 240 140" />
        <path
          class="demo__curve"
          data-explain="map-cm"
          d="M 120 128 L 120 152 M 240 128 L 240 152"
        />
        <text class="demo__label demo__label--mark" x="180" y="112" text-anchor="middle">
          图上 1 厘米
        </text>
        <!-- 尺子：这段一共 5 格，所以 1 厘米 = 5 格 -->
        <g class="demo__grid" data-explain="ruler">
          <path d="M 120 190 L 312 190 L 312 224 L 120 224 Z" />
          <path
            v-for="t in rulerTicks"
            :key="`rt${t}`"
            :d="`M ${t} 190 L ${t} ${t % 2 === 0 ? 208 : 202}`"
          />
        </g>
        <g data-explain="ruler">
          <path class="demo__spin" d="M 240 190 L 240 158" />
          <path class="demo__spin-head" :d="arrowHead(240, 158, 90, 11)" />
        </g>
        <text class="demo__label" x="120" y="252" text-anchor="start">
          量出来是 {{ divisions }} 格——所以每格只有 {{ perTickCm }} 厘米
        </text>
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          图上 1 厘米，到底代表实地多远？线段式比例尺的一格不一定是 1 厘米，必须量
        </text>
      </g>

      <!-- ② 对应的实地距离 -->
      <g v-show="step === 1" class="demo__frame">
        <path class="demo__curve" data-explain="map-cm" d="M 120 110 L 240 110" />
        <path
          class="demo__curve"
          data-explain="map-cm"
          d="M 120 98 L 120 122 M 240 98 L 240 122"
        />
        <text class="demo__label demo__label--mark" x="180" y="82" text-anchor="middle">
          图上 1 厘米
        </text>
        <g data-explain="equivalent">
          <path class="demo__spin" d="M 180 134 L 180 186" />
          <path class="demo__spin-head" :d="arrowHead(180, 186, 270, 12)" />
          <text class="demo__label" x="194" y="166" text-anchor="start">相当于</text>
        </g>
        <path class="demo__curve" data-explain="real-distance" d="M 120 206 L 600 206" />
        <path
          class="demo__curve"
          data-explain="real-distance"
          d="M 120 194 L 120 218 M 600 194 L 600 218"
        />
        <text class="demo__label demo__label--mark" x="360" y="248" text-anchor="middle">
          实地 {{ REAL_KM }} 千米 = {{ groupDigits(REAL_CM) }} 厘米
        </text>
        <text
          class="demo__label demo__label--mark"
          data-explain="denominator"
          x="360"
          y="288"
          text-anchor="middle"
        >
          比例尺 = 1 : {{ groupDigits(DENOMINATOR) }}
        </text>
        <text class="demo__label demo__label--faint" x="360" y="314" text-anchor="middle">
          1 千米 = 100 000 厘米（五个零）
        </text>
        <text class="demo__caption-line" x="360" y="352" text-anchor="middle">
          比例尺 = 图上距离 : 实地距离，单位必须先统一
        </text>
      </g>

      <!-- ③ 同样大小的两幅图，覆盖的实地范围不同 -->
      <g v-show="step === 2" class="demo__frame">
        <g data-explain="small-map">
          <rect class="demo__globe-plain" x="70" y="80" width="220" height="140" rx="3" />
          <g class="demo__grid">
            <path d="M 82 190 C 130 150 190 170 278 108" />
            <path d="M 82 108 L 278 190" />
          </g>
          <text class="demo__label" x="180" y="242" text-anchor="middle">
            1 : {{ groupDigits(SMALL_DENOMINATOR) }}
          </text>
          <text class="demo__label demo__label--faint" x="180" y="262" text-anchor="middle">
            分母小 → 比例尺大
          </text>
          <path class="demo__curve" :d="`M 70 288 L ${SMALL_BAR.toFixed(2)} 288`" />
          <path
            class="demo__curve"
            :d="`M 70 280 L 70 296 M ${SMALL_BAR.toFixed(2)} 280 L ${SMALL_BAR.toFixed(2)} 296`"
          />
          <text class="demo__label" x="70" y="314" text-anchor="start">
            实地 {{ SMALL_REAL_KM }} 千米
          </text>
        </g>
        <g data-explain="big-map">
          <rect class="demo__globe-plain" x="390" y="80" width="220" height="140" rx="3" />
          <g class="demo__grid">
            <path d="M 402 190 C 450 150 510 170 598 108" />
            <path d="M 402 108 L 598 190" />
          </g>
          <text class="demo__label" x="500" y="242" text-anchor="middle">
            1 : {{ groupDigits(DENOMINATOR) }}
          </text>
          <text class="demo__label demo__label--faint" x="500" y="262" text-anchor="middle">
            分母大 → 比例尺小
          </text>
          <path class="demo__curve" d="M 390 288 L 610 288" />
          <path class="demo__curve" d="M 390 280 L 390 296 M 610 280 L 610 296" />
          <text class="demo__label" x="390" y="314" text-anchor="start">
            实地 {{ REAL_KM }} 千米
          </text>
        </g>
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          分母越大，图上同样长度代表的实地越远：同样大小的图，覆盖范围更大、内容更粗
        </text>
      </g>

      <!-- ④ 比例尺是分数 -->
      <g v-show="step === 3" class="demo__frame">
        <text
          class="demo__label demo__label--mark"
          data-explain="fraction"
          x="360"
          y="52"
          text-anchor="middle"
        >
          比例尺 = 图上距离 : 实地距离
        </text>
        <text class="demo__label" x="360" y="84" text-anchor="middle">
          1 厘米 : 50 千米 = 1 厘米 : 5 000 000 厘米 = 1 : 5 000 000
        </text>
        <rect
          class="demo__globe-plain"
          data-explain="fraction"
          x="70"
          y="112"
          width="260"
          height="96"
          rx="3"
        />
        <text class="demo__label demo__label--mark" x="200" y="140" text-anchor="middle">
          分母小（1 : 10 万）
        </text>
        <text class="demo__label" x="200" y="166" text-anchor="middle">比例尺大</text>
        <text class="demo__label" x="200" y="190" text-anchor="middle">范围小、内容详细</text>
        <rect
          class="demo__globe-plain"
          data-explain="fraction"
          x="390"
          y="112"
          width="260"
          height="96"
          rx="3"
        />
        <text class="demo__label demo__label--mark" x="520" y="140" text-anchor="middle">
          分母大（1 : 500 万）
        </text>
        <text class="demo__label" x="520" y="166" text-anchor="middle">比例尺小</text>
        <text class="demo__label" x="520" y="190" text-anchor="middle">范围大、内容粗略</text>
        <text class="demo__label" x="360" y="238" text-anchor="middle">
          比大小只看分母：分母越大，比例尺越小
        </text>
        <text class="demo__label" x="360" y="266" text-anchor="middle">
          范围越大 → 比例尺越小 → 内容越粗（这三条别记反）
        </text>
        <text class="demo__label demo__label--faint" x="360" y="302" text-anchor="middle">
          1 千米 = 100 000 厘米（五个零）；线段式比例尺的一格不一定是 1 厘米，要量
        </text>
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          比例尺是长度之比，不是面积之比
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §2.17 比例尺：计算、大小比较与选择。
 *
 * 讲义里那句「图上 1 厘米到底代表实地多远」，补的就是这幅画：
 *   ① 图上 1 厘米——线段式比例尺的一格不一定是 1 厘米，要用尺子量；
 *   ② 对应的实地距离——1 厘米 : 50 千米 = 1 : 5 000 000；
 *   ③ 同样大小的两幅图，比例尺不同覆盖的实地范围也不同；
 *   ④ 比例尺是分数——比大小只看分母。
 *
 * 数值全部按公式算：1 千米 = 100 000 厘米（五个零），
 * 实地距离（千米）= 图上距离（厘米）× 分母 ÷ 100 000。
 */
import DemoShell from '../DemoShell.vue'
import {
  cmPerDivision,
  coverageRatio,
  groupDigits,
  kmToCm,
  realDistanceKm,
  scaleDenominator,
} from '../../data/scaleBarGeometry'
import { arrowHead } from '../../data/svgParts'

const steps = [
  {
    id: 'map-cm',
    title: '① 图上 1 厘米：用尺子量出来',
    text: '比例尺是「图上 1 厘米代表实地多远」。线段式比例尺画的是一段线，那一段的长度未必就是一厘米——必须拿尺子量。量出来是 5 格，说明每格只有 0.2 厘米。',
  },
  {
    id: 'real',
    title: '② 换算成实地距离',
    text: '假设这 1 厘米代表实地 50 千米：50 千米 = 5 000 000 厘米（1 千米 = 100 000 厘米，五个零），所以比例尺 = 1 : 5 000 000。单位不统一就出错，少一个零就差 10 倍。',
  },
  {
    id: 'compare',
    title: '③ 同样大小的图，覆盖范围不同',
    text: '两幅图幅一模一样大，左边 1 : 1 000 000 只覆盖 10 千米，右边 1 : 5 000 000 覆盖 50 千米。所以「表示范围」和「比例尺大小」是反的：范围越大，比例尺越小，内容也越粗。',
  },
  {
    id: 'fraction',
    title: '④ 比例尺是分数，只比分母',
    text: '比例尺 = 图上距离 : 实地距离，是个分数，所以比大小只看分母。选图之前先问自己要看多大的地方：要看一栋楼用大比例尺，要看一个省用小比例尺。',
  },
]

/** 尺子：从 120 到 312，每 24 像素一格 */
const RULER_STEP_PX = 24
const rulerTicks = Array.from({ length: 9 }, (_, i) => 120 + i * RULER_STEP_PX)

/** 图上「1 厘米」那一段跨了几格（120 → 240，按尺子的格宽量） */
const DIVISIONS = (240 - 120) / RULER_STEP_PX
const divisions = String(DIVISIONS)
const perTickCm = cmPerDivision(DIVISIONS).toFixed(1)

/** ② 的数都从公式来，别手写 */
const REAL_KM = 50
const DENOMINATOR = scaleDenominator(1, REAL_KM)
const REAL_CM = kmToCm(REAL_KM)

/** ③ 里另一幅图：1 厘米代表实地 10 千米 */
const SMALL_DENOMINATOR = scaleDenominator(1, 10)
const SMALL_REAL_KM = realDistanceKm(1, SMALL_DENOMINATOR)
/** 两幅图幅一样大，覆盖的实地范围之比就是实地距离之比 */
const SMALL_BAR = 70 + (220 * SMALL_REAL_KM) / REAL_KM

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * 这一节讲的是换算：比例尺 = 图上距离 : 实地距离，单位不统一就出错。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 图上标的 5,000,000 与这里写的是同一个值。
 */
const vars = {
  divisions,
  perTickCm,
  denominator: groupDigits(DENOMINATOR),
  realKm: String(REAL_KM),
  realCm: groupDigits(REAL_CM),
  cmPerKm: groupDigits(kmToCm(1)),
  smallDenom: groupDigits(SMALL_DENOMINATOR),
  smallRealKm: String(SMALL_REAL_KM),
  coverage: String(coverageRatio(SMALL_DENOMINATOR, DENOMINATOR)),
}

const explains = {
  'map-cm': {
    name: '图上 1 厘米',
    hint: '比例尺说的就是「图上 1 厘米代表实地多远」。',
    vars,
    steps: [
      '比例尺 = 图上距离 : 实地距离，是个长度之比',
      '图上的长度要用尺子量——线段式比例尺画的那一段未必正好 1 厘米',
      '本图量出来是 {divisions} 格，所以 1 厘米 = {divisions} 格，每格 {perTickCm} 厘米',
      '这一步只管图上，别急着往实地换算',
    ],
  },
  ruler: {
    name: '尺子',
    hint: '用尺子量出来的那一段，才算数。',
    vars,
    steps: [
      '线段式比例尺：一整段的长度要量，不能当 1 厘米',
      '本图这一段共 {divisions} 格，1 厘米 = {divisions} 格 ⇒ 每格 {perTickCm} 厘米',
      '若标注写的是「每格代表实地 x 千米」，则 1 厘米 = {divisions} × x 千米',
      '所以先量格数、再换算，两步都不能省',
    ],
  },
  equivalent: {
    name: '「相当于」',
    hint: '从「图上 1 厘米」换到「实地多少千米」，中间这一步是单位换算。',
    vars,
    steps: [
      '1 千米 = {cmPerKm} 厘米（五个零）',
      '换算：实地厘米数 = 图上厘米数 × 分母',
      '本图：1 × {denominator} = {realCm} 厘米 = {realKm} 千米',
      '单位不统一就出错：把 {realKm} 千米当成 {realKm} 厘米，少了五个零，差 10⁵ 倍',
    ],
  },
  'real-distance': {
    name: '实地距离',
    hint: '图上 1 厘米对应的实地距离：{realKm} 千米。',
    vars,
    steps: [
      '实地距离 = 图上距离 × 分母 ÷ 100 000（分母以厘米计）',
      '本图：1 × {denominator} ÷ 100 000 = {realKm} 千米',
      '反过来：{realKm} 千米 × 100 000 = {realCm} 厘米',
      '两步互为逆运算，可以互相验算',
    ],
  },
  denominator: {
    name: '比例尺的分母',
    hint: '比例尺 = 图上距离 : 实地距离，写成 1 : 分母，这里是 1 : {denominator}。',
    vars,
    steps: [
      '比例尺 = 图上距离 : 实地距离',
      '把实地距离换成厘米：{realKm} 千米 = {realCm} 厘米',
      '所以 1 厘米 : {realCm} 厘米 = 1 : {denominator}',
      '分母就是「图上 1 厘米等于实地多少厘米」',
    ],
  },
  'small-map': {
    name: '小分母那幅图',
    hint: '分母小 → 比例尺大 → 覆盖范围小、内容详细。这里是 1 : {smallDenom}。',
    vars,
    steps: [
      '比例尺 1 : {smallDenom} ⇒ 图上 1 厘米 = 实地 {smallDenom} 厘米 = {smallRealKm} 千米',
      '图幅与右边一样大，实地覆盖范围就只有 {smallRealKm} 千米',
      '分母小 ⇒ 图上同样的长度代表的实地更近 ⇒ 画得更细',
      '所以 1 : {smallDenom} 是「大比例尺」：范围小、内容详细',
    ],
  },
  'big-map': {
    name: '大分母那幅图',
    hint: '分母大 → 比例尺小 → 覆盖范围大、内容粗略。这里是 1 : {denominator}。',
    vars,
    steps: [
      '比例尺 1 : {denominator} ⇒ 图上 1 厘米 = 实地 {denominator} 厘米 = {realKm} 千米',
      '图幅与左边一样大，覆盖的实地却是 {realKm} 千米',
      '两幅图的实地覆盖范围之比 = {coverage} 倍（就是分母之比）',
      '所以 1 : {denominator} 是「小比例尺」：范围大、内容粗略',
    ],
  },
  fraction: {
    name: '比例尺是分数',
    hint: '比例尺是长度之比，是个分数；比大小只看分母。',
    vars,
    steps: [
      '比例尺 = 图上距离 : 实地距离 = 1 : 分母',
      '分母越大，比例尺越小',
      '同样大小的图：范围越大 → 比例尺越小 → 内容越粗',
      '这三条要一起记，不能记反',
      '比例尺是长度之比，不是面积之比——面积缩小的倍数是分母的平方',
    ],
  },
}
</script>
