<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 地平面 + 天球（半圆） -->
      <g v-show="step === 0" class="demo__frame">
        <path class="demo-horizon" data-explain="dome" :d="dome.dome" />
        <ellipse
          class="demo-horizon"
          data-explain="horizon"
          :cx="dome.box.cx"
          :cy="dome.box.cy"
          :rx="dome.box.rx"
          :ry="dome.box.ry"
        />
        <circle
          class="demo__cut"
          data-explain="observer"
          :cx="dome.box.cx"
          :cy="dome.box.cy"
          r="5"
        />
        <text class="demo__label demo__label--mark" x="150" y="268">北</text>
        <text class="demo__label demo__label--mark" x="570" y="268">南</text>
        <text class="demo__label demo__label--faint" x="360" y="212" text-anchor="middle">西（远处）</text>
        <text class="demo__label demo__label--faint" x="360" y="374" text-anchor="middle">东（近处）</text>
        <text class="demo__label demo__label--faint" x="360" y="106" text-anchor="middle">天顶</text>
        <text
          class="demo__label demo__label--mark"
          data-explain="observer"
          x="360"
          y="306"
          text-anchor="middle"
        >
          人（观测点）
        </text>
        <text class="demo__caption-line" x="360" y="40" text-anchor="middle">
          天球：地平圈 + 竖直圈，人站在地平圈的中心
        </text>
      </g>

      <!-- ② 太阳一天的运动轨迹 -->
      <g v-show="step === 1" class="demo__frame">
        <path class="demo-horizon" data-explain="dome" :d="dome.dome" />
        <ellipse
          class="demo-horizon"
          data-explain="horizon"
          :cx="dome.box.cx"
          :cy="dome.box.cy"
          :rx="dome.box.rx"
          :ry="dome.box.ry"
        />
        <path class="demo__curve" data-explain="track" :d="trackPath" />
        <path
          class="demo__spin-head"
          data-explain="track"
          :d="arrowHead(directionArrow.x, directionArrow.y, directionArrow.angle, 13)"
        />

        <circle class="demo__sun" data-explain="noon" :cx="mark.noon.x" :cy="mark.noon.y" r="11" />
        <circle class="demo__cut" data-explain="sunrise" :cx="mark.rise.x" :cy="mark.rise.y" r="6" />
        <circle class="demo__cut" data-explain="sunset" :cx="mark.set.x" :cy="mark.set.y" r="6" />

        <text class="demo__label demo__label--mark" data-explain="noon" x="452" y="116">正午</text>
        <text class="demo__label demo__label--mark" data-explain="sunrise" x="244" y="372">
          日出（东北）
        </text>
        <text class="demo__label demo__label--mark" data-explain="sunset" x="146" y="212">
          日落（西北）
        </text>
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
        <circle class="demo__cut" data-explain="altitude" cx="210" cy="300" r="5" />
        <circle class="demo__sun" data-explain="altitude" cx="257" cy="142" r="12" />
        <path class="demo__curve" data-explain="altitude" d="M 210 300 L 257 142" />
        <path class="demo__spin" d="M 210 300 L 340 300" />
        <path class="demo__spin" data-explain="altitude" :d="heightArc" />
        <text class="demo__label demo__label--mark" x="266" y="268">H = {{ altitude }}°</text>
        <text class="demo__label demo__label--faint" x="257" y="120" text-anchor="middle">太阳</text>
        <text class="demo__label" x="210" y="326" text-anchor="middle">人（观测点）</text>
        <text class="demo__label demo__label--mark" x="210" y="356" text-anchor="middle">
          H = 90° − |40° − 23.5°| = {{ altitude }}°
        </text>

        <!-- 错误：连到太阳的地面投影点 -->
        <path class="demo-horizon" d="M 440 300 L 690 300" />
        <circle class="demo__cut" data-explain="wrong-angle" cx="520" cy="300" r="5" />
        <circle class="demo__sun" data-explain="wrong-angle" cx="567" cy="142" r="12" />
        <path class="demo__curve" data-explain="wrong-angle" d="M 520 300 L 567 142" />
        <path class="demo__leader" data-explain="wrong-angle" d="M 567 142 L 567 300" />
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
        <path class="demo-horizon" data-explain="dome" :d="dome.dome" />
        <ellipse
          class="demo-horizon"
          data-explain="horizon"
          :cx="dome.box.cx"
          :cy="dome.box.cy"
          :rx="dome.box.rx"
          :ry="dome.box.ry"
        />
        <path class="demo__leader" data-explain="noon-side" d="M 360 118 L 360 288" />
        <circle
          class="demo__sun"
          data-explain="noon-side"
          :cx="mark.noon.x"
          :cy="mark.noon.y"
          r="11"
        />
        <text class="demo__label demo__label--faint" x="214" y="162">北半边</text>
        <text class="demo__label demo__label--faint" x="506" y="162">南半边</text>
        <text
          class="demo__label demo__label--mark"
          data-explain="noon-side"
          x="452"
          y="116"
        >
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
  azimuthBearingText,
  dayLengthHours,
  dayLengthText,
  domeProjection,
  hourAngleRange,
  noonAltitude,
  noonAzimuth,
  noonSide,
  sunPosition,
  sunriseAzimuth,
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

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * steps 里的数字全部由几何函数算好后填进 {占位符}，不手写——
 * 参数一动，图和讲解一起变，不会出现「图上 73.5°、文字写着 70°」。
 */
const explains = computed(() => {
  const range = hourAngleRange(LAT, DECL)
  const riseAz = sunriseAzimuth(LAT, DECL)
  const noonAz = noonAzimuth(LAT, DECL)
  const tropicLat = 20
  const vars = {
    lat: `${LAT}°N`,
    decl: `${DECL}°N`,
    latNum: String(LAT),
    declNum: String(DECL),
    alt: noonAltitude(LAT, DECL).toFixed(1),
    hourAngle: range.to.toFixed(1),
    dayLen: dayLengthHours(LAT, DECL).toFixed(1),
    dayLenText: dayLengthText(LAT, DECL),
    riseAzDeg: riseAz.toFixed(1),
    riseAz: azimuthBearingText(riseAz),
    setAzDeg: (360 - riseAz).toFixed(1),
    setAz: azimuthBearingText(360 - riseAz),
    noonAzDeg: noonAz.toFixed(0),
    noonAz: azimuthBearingText(noonAz),
    side: noonSide(LAT, DECL) === 'south' ? '正南' : '正北',
    tropicLat: `${tropicLat}°N`,
    altTropic: noonAltitude(tropicLat, DECL).toFixed(1),
    noonAzTropic: azimuthBearingText(noonAzimuth(tropicLat, DECL)),
  }

  return {
    horizon: {
      name: '地平圈',
      hint: '观测点所在的地平面，把天球分成地上与地下。',
      vars,
      steps: [
        '地平圈 = 观测点所在的地平面，它把天球分成天顶方向与地平线下方向',
        '透视图里地平圈画成椭圆：近的一边在下面（东），远的一边在上面（西）',
        '日出点、日落点都落在这条椭圆上——太阳高度 h = 0 的地方',
        '太阳高度角就是太阳与这条地平面的夹角',
      ],
    },
    dome: {
      name: '竖直圈（天球）',
      hint: '从北经天顶到南的那半个圈，把天球分成东西两半。',
      vars,
      steps: [
        '竖直圈从北经天顶到南，与地平圈互相垂直',
        '它把天球分成东半边与西半边',
        '正午太阳走的是竖直圈里最高的那一点',
        '所以正午太阳在正南还是正北，看它落在这圈的哪一侧',
      ],
    },
    observer: {
      name: '观测点',
      hint: '人站的地方，也是全图的原点——所有角都对它张。',
      vars,
      steps: [
        '观测点是人站的地方，也是这张图的原点',
        '所有高度角都要对这一点张：把人和太阳连起来，读它与地平面的夹角',
        '连到太阳的地面投影点去读，量到的是直角，角就全错了',
        '观测点的纬度决定它与直射点纬度的差，也就决定了正午太阳高度',
      ],
    },
    track: {
      name: '太阳日轨',
      hint: '日出 → 正午 → 日落连成的一段弧，弧长就是昼长。',
      vars,
      steps: [
        '太阳一天走过的轨迹：日出 → 正午 → 日落连成一段弧',
        '时角 H 从 −H₀ 到 +H₀，H₀ = arccos(−tanφ·tanδ)',
        '当前 φ = {latNum}°、δ = {declNum}° ⇒ H₀ = {hourAngle}°',
        '昼长 = 2H₀ ÷ 15°/时 = {dayLen} 小时（{dayLenText}）',
        '弧偏向昼长那一侧，偏向多少由当地纬度与直射点纬度的差决定',
      ],
    },
    sunrise: {
      name: '日出点',
      hint: '太阳高度为 0 的那一刻，方位由昼长决定。',
      vars,
      steps: [
        '日出 = 太阳高度 h = 0 的那一刻',
        '日出方位角满足 cos A = sinδ / cosφ（A 自北起顺时针）',
        '当前 δ = {declNum}°、φ = {latNum}° ⇒ A = {riseAzDeg}°',
        '所以日出方位是 {riseAz}——在东北方向',
        '昼越长，日出方位越偏北（夏至东北升得更高）',
      ],
    },
    noon: {
      name: '正午',
      hint: '地方时 12 时，太阳在竖直圈的最高点。',
      vars,
      steps: [
        '正午 = 地方时 12 时，太阳在竖直圈里最高的那一点',
        '正午太阳高度 h = 90° − |当地纬度 − 直射点纬度|',
        '当前 = 90° − |{latNum}° − {declNum}°| = {alt}°',
        '正午方位 = {noonAz}（{noonAzDeg}°）',
        '高度角要对观测点张，不能对太阳的地面投影点张',
      ],
    },
    sunset: {
      name: '日落点',
      hint: '太阳高度回到 0 的另一刻，方位与日出关于正午对称。',
      vars,
      steps: [
        '日落 = 太阳高度 h = 0 的另一刻',
        '日落方位角与日出关于正午对称：360° − {riseAzDeg}° = {setAzDeg}°',
        '当前日落方位是 {setAz}——在西北方向',
        '昼越长，日落方位越偏西',
      ],
    },
    altitude: {
      name: '正午太阳高度角',
      hint: '角顶在人所在的那一点，量的是太阳与地平面的夹角。',
      vars,
      steps: [
        '正午太阳高度角 = 太阳与地平面的夹角，角顶在观测点',
        'h = 90° − |当地纬度 − 直射点纬度|',
        '当前 90° − |{latNum}° − {declNum}°| = {alt}°',
        '角必须对观测点张：把人和太阳连起来，读它与地平面的夹角',
        '图上量的角度应当正好是 {alt}°',
      ],
    },
    'wrong-angle': {
      name: '错法：对投影点张角',
      hint: '连到太阳的地面投影点去读，量到的是直角。',
      vars,
      steps: [
        '错法：连到太阳的地面投影点 P 去读角',
        '投影点 P 在人脚边，读出来的是直角（或它的余角）',
        '角顶被换成了 P，量的就不再是太阳高度角',
        '正确做法：角顶在人所在的那一点，答案是 {alt}°',
        '记住：先定角顶，再读角',
      ],
    },
    'noon-side': {
      name: '正午太阳在正南还是正北',
      hint: '看当地纬度与直射点纬度谁大。',
      vars,
      steps: [
        '正午太阳在正南还是正北，取决于直射点纬度与当地纬度谁大',
        '当地 {lat} > 直射点 {decl} ⇒ 正午太阳在{side}（方位 {noonAz}）',
        '反例：当地 {tropicLat} < 直射点 {decl} ⇒ 正午太阳在正北（方位 {noonAzTropic}），高度 {altTropic}°',
        '当地纬度正好等于直射点纬度时 h = 90°，太阳直射头顶，影子就在脚下',
        '图上的判据：看太阳落在竖直圈的哪一侧',
      ],
    },
  }
})
</script>

<style scoped>
.demo-horizon {
  fill: none;
  stroke: var(--learn-ink-faint);
  stroke-width: 1.5;
}
</style>
