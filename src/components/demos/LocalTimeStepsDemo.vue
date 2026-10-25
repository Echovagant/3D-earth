<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 画简图 + 标条件 -->
      <g v-show="step === 0" class="demo__frame">
        <!-- 展开图口诀：东西两条 180，零度中间行 -->
        <path class="demo__curve" data-explain="expanded" d="M 60 78 L 660 78" />
        <path class="demo__spin-head" :d="arrowHead(660, 78, 0, 11)" />
        <text class="demo__label demo__label--faint" x="60" y="62" text-anchor="middle">180°W</text>
        <text class="demo__label demo__label--faint" x="360" y="62" text-anchor="middle">0°</text>
        <text class="demo__label demo__label--faint" x="660" y="62" text-anchor="middle">180°E</text>
        <text class="demo__label demo__label--faint" x="360" y="100" text-anchor="middle">
          零度中间行 · 零度以西是西经、以东是东经 · 自西向东 →
        </text>

        <!-- 放大的那一条经度区间（在上方的整条展开图上标出来） -->
        <path class="demo__leader" data-explain="zoom" :d="zoomBracket" />
        <text class="demo__label demo__label--faint" :x="zoomMid" y="140" text-anchor="middle">
          放大这一段（两条经线都在东经这一侧）
        </text>

        <path class="demo__curve" data-explain="axis" :d="axisPath" />
        <g class="demo__grid">
          <path v-for="t in ticks" :key="t.label" :d="t.path" />
        </g>
        <text
          v-for="t in ticks"
          :key="`tl${t.label}`"
          class="demo__label demo__label--faint"
          :x="t.x"
          y="268"
          text-anchor="middle"
        >
          {{ t.label }}
        </text>

        <circle class="demo__cut" data-explain="known" :cx="known.x" :cy="axisY" r="6" />
        <circle class="demo__cut" data-explain="target" :cx="target.x" :cy="axisY" r="6" />
        <text class="demo__label demo__label--mark" :x="known.x" y="196" text-anchor="middle">
          东经 107°（已知）
        </text>
        <text class="demo__label demo__label--faint" :x="known.x" y="214" text-anchor="middle">
          地方时 10:50
        </text>
        <text class="demo__label demo__label--mark" :x="target.x" y="196" text-anchor="middle">
          东经 120°（所求）
        </text>
        <text class="demo__label demo__label--faint" :x="target.x" y="214" text-anchor="middle">?</text>

        <text class="demo__caption-line" x="360" y="368" text-anchor="middle">
          第一步画简图、第二步标条件：把已知地和所求地的经度与时间都标上去
        </text>
      </g>

      <!-- ② 求经度差 -->
      <g v-show="step === 1" class="demo__frame">
        <path class="demo__curve" :d="axisPath" />
        <g class="demo__grid">
          <path v-for="t in ticks" :key="t.label" :d="t.path" />
        </g>

        <circle class="demo__cut" :cx="known.x" :cy="axisY" r="6" />
        <circle class="demo__cut" :cx="target.x" :cy="axisY" r="6" />
        <path class="demo__curve" data-explain="diff-bracket" :d="diffBracket" />
        <text class="demo__label demo__label--mark" :x="(known.x + target.x) / 2" y="308" text-anchor="middle">
          经度差 = {{ TARGET_LON }} − {{ KNOWN_LON }} = {{ diff }}°
        </text>

        <text class="demo__label demo__label--mark" x="120" y="150">东经为正、西经为负</text>
        <text class="demo__label demo__label--faint" x="120" y="170">相减后取绝对值</text>
        <text class="demo__label demo__label--faint" x="120" y="190">
          尽量不穿过 180° 经线，免得牵涉国际日界线
        </text>
        <text class="demo__label demo__label--faint" x="120" y="210">
          同为东经：度数越大越靠东 → 120°E 在 107°E 的东边
        </text>

        <text class="demo__caption-line" x="360" y="368" text-anchor="middle">
          第三步：经度差 = |120 − 107| = 13°（取绝对值，劣弧）
        </text>
      </g>

      <!-- ③ 经度差 × 4 分钟 = 时间差 -->
      <g v-show="step === 2" class="demo__frame">
        <path class="demo__curve" :d="axisPath" />
        <g class="demo__grid">
          <path v-for="t in ticks" :key="t.label" :d="t.path" />
        </g>
        <circle class="demo__cut" :cx="known.x" :cy="axisY" r="6" />
        <circle class="demo__cut" :cx="target.x" :cy="axisY" r="6" />
        <path class="demo__curve" :d="diffBracket" />

        <g data-explain="minute-marks">
          <path
            v-for="m in minuteMarks"
            :key="`m${m.i}`"
            class="demo__spin"
            :d="m.path"
          />
          <text class="demo__label demo__label--faint" :x="(known.x + target.x) / 2" y="332" text-anchor="middle">
            {{ diff }}° × 4 分钟/度 = {{ minutes }} 分钟
          </text>
        </g>

        <text class="demo__label demo__label--mark" x="120" y="150">1 小时 = 15° = 60 分钟</text>
        <text class="demo__label demo__label--faint" x="120" y="170">所以 1° ↔ 4 分钟</text>
        <text class="demo__label demo__label--faint" x="120" y="190">时间差 = 经度差 × 4 分钟</text>

        <text class="demo__caption-line" x="360" y="368" text-anchor="middle">
          第四步：时间差 = 13° × 4 分钟 = 52 分钟
        </text>
      </g>

      <!-- ④ 东加西减得结果 -->
      <g v-show="step === 3" class="demo__frame">
        <path class="demo__curve" :d="axisPath" />
        <circle class="demo__cut" :cx="known.x" :cy="axisY" r="6" />
        <circle class="demo__cut" :cx="target.x" :cy="axisY" r="6" />

        <text class="demo__label demo__label--mark" x="96" y="152">
          所求地在已知地的{{ result.east ? '东边' : '西边' }} → 用{{ result.east ? '加' : '减' }}
        </text>
        <path class="demo__curve" d="M 96 176 L 300 176" />
        <path class="demo__spin-head" :d="arrowHead(300, 176, 0, 12)" />
        <g data-explain="result">
          <text class="demo__label" x="110" y="206">{{ knownText }}</text>
          <text class="demo__label" x="196" y="206">+ {{ minutes }} 分钟</text>
          <text class="demo__label demo__label--mark" x="286" y="206">= {{ resultText }}</text>
        </g>
        <text class="demo__label demo__label--faint" x="110" y="228">东经 {{ TARGET_LON }}° 的地方时</text>

        <text class="demo__label demo__label--mark" x="420" y="152">写法：24 时制，有日期把日期带上</text>
        <text class="demo__label demo__label--faint" x="420" y="180">
          减法不够减时把小时写大
        </text>
        <text class="demo__label demo__label--faint" x="420" y="202">
          10 月 11 日 18 点 = 10 月 10 日 42 点
        </text>
        <text class="demo__label demo__label--faint" x="420" y="224">
          再减 19 小时 = 10 月 10 日 23 点
        </text>
        <text class="demo__label demo__label--faint" x="96" y="300">
          别写成「晚上十点」，也别漏掉日期
        </text>

        <text class="demo__caption-line" x="360" y="368" text-anchor="middle">
          所求地地方时 = 已知地地方时 ± 时间差（{{ eastText }}）→ {{ knownText }} + {{ minutes }} 分 = {{ resultText }}
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §3.13 地方时的计算：四步法。
 *
 * 用的是讲义里老师完整演示过的那道题：**已知东经 107° 的地方时为 10:50，
 * 求东经 120° 的地方时**（讲义结论 11:42）。
 *
 * 四步：① 画简图 + 标条件 → ② 求经度差 → ③ 经度差 × 4 分钟 = 时间差
 *       → ④ 东加西减，写成 24 时制并带日期。
 *
 * 算式全部由 localTimeStepsGeometry.js 算出（经度差、时间差、加减方向、
 * 跨日进位），不是抄在图上的文字。
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { arrowHead } from '../../data/svgParts'
import {
  DEGREES_PER_HOUR,
  formatClock24,
  longitudeDiff,
  minutesPerDegree,
  solveLocalTime,
  split24,
  timeDiffMinutes,
} from '../../data/localTimeStepsGeometry'

const steps = [
  {
    id: 'draw',
    title: '① 画简图，标条件',
    text: '第一步画那张东西经半球展开图——东西两条 180°、零度中间行，零度以西是西经、以东是东经。第二步把已知地和所求地的经度与时间标上去：同为东经时，度数越大越靠东。',
  },
  {
    id: 'diff',
    title: '② 求经度差',
    text: '第三步：东经记正数、西经记负数，相减后取绝对值。这里 |120 − 107| = 13°。经度差取不穿过 180° 的那段，免得把国际日界线牵进来。',
  },
  {
    id: 'minutes',
    title: '③ 经度差 × 4 分钟 = 时间差',
    text: '第四步的一半：1 小时 = 15° = 60 分钟，所以经度每差 1°，时间差 4 分钟。13° × 4 = 52 分钟。这里最容易错的就是把 4 分钟/度记成 15 分钟/度。',
  },
  {
    id: 'result',
    title: '④ 东加西减，写成 24 时制并带日期',
    text: '最后一步：所求地地方时 = 已知地地方时 ± 时间差，在东用加、在西用减。120°E 在 107°E 的东边 → 10:50 + 52 分 = 11:42。答案写 24 时制，题目给了日期就把日期带上；减法不够减时把小时写大再减。',
  },
]

/** 展开图：放大到本题用到的这一段经度 */
const BOX = { left: 110, right: 660 }
const LON_MIN = 90
const LON_MAX = 140
const axisY = 240

/** 上方整条展开图：180°W 在左、0° 在中间、180°E 在右 */
const FULL = { left: 60, right: 660 }
const fullX = (lon) => FULL.left + ((lon + 180) / 360) * (FULL.right - FULL.left)
const zoomLeft = Number(fullX(LON_MIN).toFixed(2))
const zoomRight = Number(fullX(LON_MAX).toFixed(2))
const zoomMid = Number(((zoomLeft + zoomRight) / 2).toFixed(2))
const zoomBracket = `M ${zoomLeft} 112 L ${zoomLeft} 122 L ${zoomRight} 122 L ${zoomRight} 112`

const ax = (lon) =>
  BOX.left + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * (BOX.right - BOX.left)

const axisPath = `M ${BOX.left} ${axisY} L ${BOX.right} ${axisY}`

/** 刻度：每 10° 一根 */
const TICK_STEP = 10
const ticks = Array.from(
  { length: Math.round((LON_MAX - LON_MIN) / TICK_STEP) + 1 },
  (_, i) => LON_MIN + i * TICK_STEP,
).map((lon) => ({
  label: `东经 ${lon}°`,
  x: Number(ax(lon).toFixed(2)),
  path: `M ${ax(lon).toFixed(2)} ${axisY - 9} L ${ax(lon).toFixed(2)} ${axisY + 9}`,
}))

/** 条件：已知东经 107° 地方时 10:50，求东经 120° */
const KNOWN_LON = 107
const TARGET_LON = 120
const KNOWN_HOUR = 10 + 50 / 60

const known = { x: Number(ax(KNOWN_LON).toFixed(2)) }
const target = { x: Number(ax(TARGET_LON).toFixed(2)) }

/** 算式：经度差、时间差、加减方向、结果 */
const result = solveLocalTime(KNOWN_HOUR, KNOWN_LON, TARGET_LON)
const diff = longitudeDiff(KNOWN_LON, TARGET_LON)
const minutes = timeDiffMinutes(diff)
const finalClock = split24(result.hours)

/** 经度差的括号 */
const diffBracket = `M ${known.x} ${axisY + 18} L ${known.x} ${axisY + 46} L ${target.x} ${axisY + 46} L ${target.x} ${axisY + 18}`

/** ③ 13° 换算成 52 分钟：一小格 4 分钟 */
const minuteMarks = Array.from({ length: 13 }, (_, i) => {
  const x = known.x + (i * (target.x - known.x)) / 13
  return { i, path: `M ${x.toFixed(2)} ${axisY + 18} L ${x.toFixed(2)} ${axisY + 40}` }
})

/** ④ 结果文字（用算出来的数，不手写） */
const knownText = formatClock24(KNOWN_HOUR)
const resultText = `${String(finalClock.hours).padStart(2, '0')}:${String(finalClock.minutes).padStart(2, '0')}`
const eastText = result.east ? '东加西减' : '西减东加'

/** 「减法不够减时把小时写大」那个例子里的小时数 */
const BORROW_HOUR = 18

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 参数一动，图和讲解一起变，不会出现「图上 66.5°、文字写着 65°」。
 */
const explains = computed(() => {
  const vars = {
    knownLonNum: String(KNOWN_LON),
    targetLonNum: String(TARGET_LON),
    knownLon: `东经 ${KNOWN_LON}°`,
    targetLon: `东经 ${TARGET_LON}°`,
    knownTime: knownText,
    knownHourNum: KNOWN_HOUR.toFixed(2),
    diffDeg: `${diff}°`,
    minutesPerDeg: `${minutesPerDegree()} 分钟`,
    timeDiff: `${minutes} 分钟`,
    resultTime: formatClock24(result.hours),
    spinDeg: `${DEGREES_PER_HOUR}°`,
    spinHours: `${DEGREES_PER_HOUR}° = 1 小时 = 60 分钟`,
    markCount: String(minuteMarks.length),
    lonMin: String(LON_MIN),
    lonMax: String(LON_MAX),
    tickStep: String(TICK_STEP),
    midLon: String((LON_MIN + LON_MAX) / 2),
    borrowHour: String(BORROW_HOUR),
    borrowBigHour: String(BORROW_HOUR + 24),
    side: result.east ? '东边' : '西边',
    op: result.east ? '加' : '减',
  }

  return {
    expanded: {
      name: '东西半球展开图',
      hint: '口诀「东西两条 180，零度中间行」：0° 以西是西经、以东是东经。',
      vars,
      steps: [
        '展开图：左边 180°W，中间 0°，右边 180°E',
        '0° 以西是西经（记负数），以东是东经（记正数）',
        '自西向东 → 地方时读数越来越大',
        '横轴就是经度：从 180°W 到 180°E 均匀铺开 360°',
      ],
    },
    zoom: {
      name: '放大的那一段',
      hint: '把用到的经度区间放大，经度差才量得准。',
      vars,
      steps: [
        `整条展开图有 360°，一小格代表很多度，直接量会量不准`,
        `把本题用到的区间放大：${vars.lonMin}° 到 ${vars.lonMax}°`,
        '放大后每一度的间距变大，经度差可以直接读出来',
        '同在东经这一侧，不必绕到 180° 经线那边去',
      ],
    },
    axis: {
      name: '经度刻度',
      hint: '横轴是经度，每 10° 一根刻度。',
      vars,
      steps: [
        `横轴 = 经度，每 ${vars.tickStep}° 一根刻度`,
        `刻度从 ${vars.lonMin}° 到 ${vars.lonMax}°，中间是 ${vars.midLon}°`,
        '读经度先看它落在哪两根刻度之间',
        '西经写负、东经写正，后面相减才不用再判断符号',
      ],
    },
    known: {
      name: '已知地（东经 107°）',
      hint: '已知东经 107° 的地方时是 10:50。',
      vars,
      steps: [
        `已知地：${vars.knownLon}，地方时 ${vars.knownTime}`,
        `写在数轴上：东经为正 ⇒ ${vars.knownLonNum} 记作 +${vars.knownLonNum}`,
        '所有经度统一按「东经为正、西经为负」记号',
        `时间也换成小时数：${vars.knownTime} = ${vars.knownHourNum} 小时`,
      ],
    },
    target: {
      name: '所求地（东经 120°）',
      hint: '东经 120° 的地方时是所求。',
      vars,
      steps: [
        `所求地：${vars.targetLon}`,
        '它和已知地同在东经这一侧',
        '度数更大 ⇒ 在展开图上更靠右 ⇒ 在已知地的东边',
        `所以最后一步用「${vars.op}」`,
      ],
    },
    'diff-bracket': {
      name: '经度差',
      hint: '第三步：东经为正、西经为负，相减取绝对值。',
      vars,
      steps: [
        `经度差 = |${vars.targetLonNum} − ${vars.knownLonNum}| = ${vars.diffDeg}`,
        '取绝对值，劣弧优先——尽量不穿过 180° 经线，免得牵涉国际日界线',
        `同在东经这一侧：${vars.targetLonNum} > ${vars.knownLonNum} ⇒ 所求地在东边`,
        `所以经度差就是 ${vars.diffDeg}`,
      ],
    },
    'minute-marks': {
      name: '时间差（52 分钟）',
      hint: '第四步的一半：经度差 × 4 分钟 = 时间差。',
      vars,
      steps: [
        `地球 24 小时转 360° ⇒ ${vars.spinHours}`,
        `每 1° 对应 60 ÷ ${vars.spinDeg} = ${vars.minutesPerDeg}`,
        `时间差 = ${vars.diffDeg} × ${vars.minutesPerDeg} = ${vars.timeDiff}`,
        `图上每 1° 一小格：${vars.markCount} 格 × ${vars.minutesPerDeg} = ${vars.timeDiff}`,
      ],
    },
    result: {
      name: '结果算式',
      hint: '最后一步：东加西减，写成 24 时制并带日期。',
      vars,
      steps: [
        `所求地在已知地的${vars.side} ⇒ 用${vars.op}`,
        `${vars.knownTime} + ${vars.timeDiff} = ${vars.resultTime}`,
        '24 时制：小时写 00–23、分写 00–59；不要写「晚上十点」',
        '题目给了日期就把日期带上',
        `减法不够减时把小时写大：${vars.borrowHour} 点 → ${vars.borrowBigHour} 点（借一天），再减`,
      ],
    },
  }
})
</script>
