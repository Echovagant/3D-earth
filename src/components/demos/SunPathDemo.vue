<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- ① 地平面 + 天球（半圆） -->
      <g v-show="step === 0" class="demo__frame">
        <path class="demo-horizon" :d="dome.dome" />
        <ellipse
          class="demo-horizon"
          :cx="dome.box.cx"
          :cy="dome.box.cy"
          :rx="dome.box.rx"
          :ry="dome.box.ry"
        />
        <circle class="demo__cut" :cx="dome.box.cx" :cy="dome.box.cy" r="5" />
        <text class="demo__label demo__label--mark" x="150" y="268">北</text>
        <text class="demo__label demo__label--mark" x="570" y="268">南</text>
        <text class="demo__label demo__label--faint" x="360" y="212" text-anchor="middle">西（远处）</text>
        <text class="demo__label demo__label--faint" x="360" y="374" text-anchor="middle">东（近处）</text>
        <text class="demo__label demo__label--faint" x="360" y="106" text-anchor="middle">天顶</text>
        <text class="demo__label demo__label--mark" x="360" y="306" text-anchor="middle">人（观测点）</text>
        <text class="demo__caption-line" x="360" y="40" text-anchor="middle">
          天球：地平圈 + 竖直圈，人站在地平圈的中心
        </text>
      </g>

      <!-- ② 太阳一天的运动轨迹 -->
      <g v-show="step === 1" class="demo__frame">
        <path class="demo-horizon" :d="dome.dome" />
        <ellipse
          class="demo-horizon"
          :cx="dome.box.cx"
          :cy="dome.box.cy"
          :rx="dome.box.rx"
          :ry="dome.box.ry"
        />
        <path class="demo__curve" :d="trackPath" />
        <path class="demo__spin-head" :d="arrowHead(directionArrow.x, directionArrow.y, directionArrow.angle, 13)" />

        <circle class="demo__sun" :cx="mark.noon.x" :cy="mark.noon.y" r="11" />
        <circle class="demo__cut" :cx="mark.rise.x" :cy="mark.rise.y" r="6" />
        <circle class="demo__cut" :cx="mark.set.x" :cy="mark.set.y" r="6" />

        <text class="demo__label demo__label--mark" x="452" y="116">正午</text>
        <text class="demo__label demo__label--mark" x="244" y="372">日出（东北）</text>
        <text class="demo__label demo__label--mark" x="146" y="212">日落（西北）</text>
        <path class="demo__leader" d="M 214 208 L 226 230" />
        <text class="demo__label demo__label--faint" x="360" y="40" text-anchor="middle">
          40°N、夏至日：东北升、经过正南、西北落，昼长
          {{ dayLength }} 小时
        </text>
      </g>

      <!-- ③ 正午太阳高度角：角要对人所在点张 -->
      <g v-show="step === 2" class="demo__frame">
        <!-- 正确：角在观测点张开 -->
        <path class="demo-horizon" d="M 92 300 L 340 300" />
        <circle class="demo__cut" cx="210" cy="300" r="5" />
        <circle class="demo__sun" cx="257" cy="142" r="12" />
        <path class="demo__curve" d="M 210 300 L 257 142" />
        <path class="demo__spin" d="M 210 300 L 340 300" />
        <path class="demo__spin" :d="heightArc" />
        <text class="demo__label demo__label--mark" x="266" y="268">H = {{ altitude }}°</text>
        <text class="demo__label demo__label--faint" x="257" y="120" text-anchor="middle">太阳</text>
        <text class="demo__label" x="210" y="326" text-anchor="middle">人（观测点）</text>
        <text class="demo__label demo__label--mark" x="210" y="356" text-anchor="middle">
          H = 90° − |40° − 23.5°| = {{ altitude }}°
        </text>

        <!-- 错误：连到太阳的地面投影点 -->
        <path class="demo-horizon" d="M 440 300 L 690 300" />
        <circle class="demo__cut" cx="520" cy="300" r="5" />
        <circle class="demo__sun" cx="567" cy="142" r="12" />
        <path class="demo__curve" d="M 520 300 L 567 142" />
        <path class="demo__leader" d="M 567 142 L 567 300" />
        <path class="demo__spin" d="M 557 300 L 557 290 L 567 290" />
        <text class="demo__label demo__label--faint" x="567" y="120" text-anchor="middle">太阳</text>
        <text class="demo__label" x="612" y="294" text-anchor="start">地面投影点 P</text>
        <text class="demo__label demo__label--mark" x="567" y="348" text-anchor="middle">
          错：这样连量到的是直角
        </text>
        <text class="demo__label demo__label--faint" x="567" y="366" text-anchor="middle">
          角必须对观测点张，不是对投影点张
        </text>
      </g>

      <!-- ④ 正午太阳在正南还是正北 -->
      <g v-show="step === 3" class="demo__frame">
        <path class="demo-horizon" :d="dome.dome" />
        <ellipse
          class="demo-horizon"
          :cx="dome.box.cx"
          :cy="dome.box.cy"
          :rx="dome.box.rx"
          :ry="dome.box.ry"
        />
        <path class="demo__leader" d="M 360 118 L 360 288" />
        <circle class="demo__sun" :cx="mark.noon.x" :cy="mark.noon.y" r="11" />
        <text class="demo__label demo__label--faint" x="214" y="162">北半边</text>
        <text class="demo__label demo__label--faint" x="506" y="162">南半边</text>
        <text class="demo__label demo__label--mark" x="452" y="116">
          正午太阳{{ side === 'south' ? '（正南）' : '（正北）' }}
        </text>
        <text class="demo__label" x="360" y="306" text-anchor="middle">人（观测点）</text>

        <text class="demo__label demo__label--mark" x="360" y="34" text-anchor="middle">
          当地 40°N > 直射点 23.5°N → 正午太阳在正南
        </text>
        <text class="demo__label demo__label--mark" x="360" y="60" text-anchor="middle">
          当地 20°N &lt; 直射点 23.5°N → 正午太阳在正北
        </text>
        <text class="demo__label demo__label--faint" x="360" y="84" text-anchor="middle">
          H = 90° → 太阳直射头顶，影子就在脚下
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §4.5 太阳方位和视运动。
 *
 * 老师讲这节时让人「站在地平面上」看太阳一天怎么走——
 * 学生脑子里其实没有那口「锅盖」和那条地平线。这段就是补上它。
 *
 * 四步各自的分工：
 *   ① 地平面 + 天球 —— 先把这幅画的架子搭出来
 *   ② 太阳一天的轨迹 —— 日出、正午、日落三个时刻
 *   ③ 正午太阳高度角 —— 角必须对人所在点张（并给一个错的连法做反例）
 *   ④ 正午太阳在正南还是正北 —— 看太阳落在天球的哪一半
 *
 * 天球用透视图画：地平圈是椭圆，竖直圈是上面半个椭圆，
 * 太阳的日轨按真实高度角、方位角投影上去。
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { arrowHead } from '../../data/svgParts'
import {
  domeProjection,
  dayLengthHours,
  hourAngleRange,
  noonAltitude,
  noonSide,
  sunPosition,
  sunTrack,
} from '../../data/sunPathGeometry'

const steps = [
  {
    id: 'dome',
    title: '① 地平面与天球',
    text: '做太阳视运动图，先把架子搭出来：地平圈画成一个椭圆（近的一边在下面，远的在上面），竖直圈画成上面半个椭圆，从北经天顶到南。人就站在地平圈的中心点上——这一点是全图的原点。',
  },
  {
    id: 'track',
    title: '② 太阳一天走的路',
    text: '太阳从东北升起来，经过正南，落到西北去，中间画成一条弧，标上日出、正午、日落三个时刻就够了。40°N 的夏至日昼长约 14 小时 51 分，弧线明显偏在南边那一侧。',
  },
  {
    id: 'altitude',
    title: '③ 正午太阳高度角对谁张',
    text: '正午太阳高度角，是太阳与地平面上人所在点张的角——把人和太阳连起来，读它与地平面的夹角。H = 90° − |当地纬度 − 直射点纬度|。千万别连到太阳的地面投影点上去读，那样量到的是直角（或者它的余角），把观测点换掉了，角就全错了。',
  },
  {
    id: 'side',
    title: '④ 正午太阳在正南还是正北',
    text: '判断办法是看太阳落在天球的哪一半：直射点在南，正午太阳就在正南；直射点在北，正午太阳就在正北。热带地区夏至日正午太阳在天球的北半边，太阳高度角可以达到 90°，直射头顶——影子就在脚下。',
  },
]

/** 演示用的观测点与日期 */
const LAT = 40
const DECL = 23.5

/** 天球透视图 */
const BOX = { cx: 360, cy: 288, rx: 252, ry: 64, height: 170 }
const project = domeProjection(BOX)

const dome = computed(() => ({
  box: BOX,
  /** 竖直圈（北—天顶—南）的上面半个椭圆 */
  dome: `M ${BOX.cx - BOX.rx} ${BOX.cy} A ${BOX.rx} ${BOX.height} 0 0 1 ${BOX.cx + BOX.rx} ${BOX.cy}`,
}))

/** 太阳的日轨 */
const track = computed(() => sunTrack(LAT, DECL, project))
const trackPath = computed(() =>
  track.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' '),
)

/** 日出、正午、日落三个时刻 */
const mark = computed(() => {
  const r = hourAngleRange(LAT, DECL)
  const rise = sunPosition(LAT, DECL, r.from)
  const set = sunPosition(LAT, DECL, r.to)
  const noon = sunPosition(LAT, DECL, 0)
  const p = (q) => project(q.altitude, q.azimuth)
  return { rise: p(rise), set: p(set), noon: p(noon) }
})

const altitude = computed(() => noonAltitude(LAT, DECL).toFixed(1))
const dayLength = computed(() => dayLengthHours(LAT, DECL).toFixed(1))

/** ② 日轨上的方向箭头：取正午之后的一点，切线方向就是太阳的去向 */
const directionArrow = computed(() => {
  const pts = track.value
  const k = Math.floor(pts.length * 0.72)
  const a = pts[k - 1]
  const b = pts[k]
  return { x: b.x, y: b.y, angle: (Math.atan2(-(b.y - a.y), b.x - a.x) * 180) / Math.PI }
})

/** ③ 观测点处的高度角弧 */
const heightArc = computed(() => {
  const h = (noonAltitude(LAT, DECL) * Math.PI) / 180
  const r = 46
  const x = 210 + r * Math.cos(h)
  const y = 300 - r * Math.sin(h)
  return `M ${210 + r} 300 A ${r} ${r} 0 0 0 ${x.toFixed(2)} ${y.toFixed(2)}`
})

/** ④ 正午太阳的方位：图形上用落在南半边表示 */
const side = computed(() => noonSide(LAT, DECL))
</script>

<style scoped>
.demo-horizon {
  fill: none;
  stroke: var(--learn-ink-faint);
  stroke-width: 1.5;
}
</style>
