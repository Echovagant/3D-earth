<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 搭骨架：6 条经线 + 6 条纬线 -->
      <g v-show="step === 0" class="demo__frame">
        <g class="demo__grid">
          <g data-explain="meridian">
            <path v-for="m in meridians" :key="`m${m.lon}`" :d="m.path" />
          </g>
          <path
            v-for="p in parallels"
            :key="`p${p.lat}`"
            :d="p.path"
            :data-explain="p.lat === 23.5 ? 'tropic' : 'parallel'"
          />
        </g>

        <text
          v-for="m in meridians"
          :key="`ml${m.lon}`"
          class="demo__label demo__label--faint"
          :x="m.x"
          y="320"
          text-anchor="middle"
        >
          {{ m.label }}
        </text>
        <text
          v-for="p in parallels"
          :key="`pl${p.lat}`"
          class="demo__label demo__label--faint"
          x="80"
          :y="p.y + 4"
          text-anchor="end"
        >
          {{ p.label }}
        </text>

        <text class="demo__label demo__label--mark" x="360" y="366" text-anchor="middle">
          6 根竖线是经线、6 根横线是纬线——这就是脑子里的方格纸
        </text>
      </g>

      <!-- ② 点亮南段：北纬 20°、北回归线、北纬 30° -->
      <g v-show="step === 1" class="demo__frame">
        <g class="demo__grid">
          <g data-explain="meridian">
            <path v-for="m in meridians" :key="`m${m.lon}`" :d="m.path" />
          </g>
          <path
            v-for="p in parallels"
            :key="`p${p.lat}`"
            :d="p.path"
            :data-explain="p.lat === 23.5 ? 'tropic' : 'parallel'"
          />
        </g>
        <text
          v-for="m in meridians"
          :key="`ml${m.lon}`"
          class="demo__label demo__label--faint"
          :x="m.x"
          y="320"
          text-anchor="middle"
        >
          {{ m.label }}
        </text>
        <text
          v-for="p in parallels"
          :key="`pl${p.lat}`"
          class="demo__label demo__label--faint"
          x="80"
          :y="p.y + 4"
          text-anchor="end"
        >
          {{ p.label }}
        </text>

        <g v-for="a in southAnchors" :key="`s${a.lat}${a.lon}${a.name}`">
          <circle v-if="a.kind === 'point'" class="demo__cut" data-explain="nail" :cx="a.x" :cy="a.y" r="5" />
          <path v-else class="demo__curve" data-explain="band" :d="a.bandPath" />
          <text
            class="demo__label demo__label--mark"
            :x="a.labelX"
            :y="a.labelY"
            :text-anchor="a.anchor"
          >
            {{ a.name }}
          </text>
        </g>

        <text class="demo__label demo__label--faint" x="360" y="366" text-anchor="middle">
          海南海口在海里，纬度 20、110；北回归线：100 云南、110 广西、120 台湾
        </text>
      </g>

      <!-- ③ 点亮北段：北纬 34°、北纬 40°、北纬 50° -->
      <g v-show="step === 2" class="demo__frame">
        <g class="demo__grid">
          <g data-explain="meridian">
            <path v-for="m in meridians" :key="`m${m.lon}`" :d="m.path" />
          </g>
          <path
            v-for="p in parallels"
            :key="`p${p.lat}`"
            :d="p.path"
            :data-explain="p.lat === 23.5 ? 'tropic' : 'parallel'"
          />
        </g>
        <text
          v-for="m in meridians"
          :key="`ml${m.lon}`"
          class="demo__label demo__label--faint"
          :x="m.x"
          y="320"
          text-anchor="middle"
        >
          {{ m.label }}
        </text>
        <text
          v-for="p in parallels"
          :key="`pl${p.lat}`"
          class="demo__label demo__label--faint"
          x="80"
          :y="p.y + 4"
          text-anchor="end"
        >
          {{ p.label }}
        </text>

        <g v-for="a in northAnchors" :key="`n${a.lat}${a.lon}${a.name}`">
          <circle v-if="a.kind === 'point'" class="demo__cut" data-explain="nail" :cx="a.x" :cy="a.y" r="5" />
          <path v-else class="demo__curve" data-explain="band" :d="a.bandPath" />
          <text
            class="demo__label demo__label--mark"
            :x="a.labelX"
            :y="a.labelY"
            :text-anchor="a.anchor"
          >
            {{ a.name }}
          </text>
        </g>

        <text class="demo__label demo__label--faint" x="360" y="366" text-anchor="middle">
          北纬 34° 东经 110° 是秦岭；40° 一带最密；50°：120 大兴安岭、90 阿尔泰山地
        </text>
      </g>

      <!-- ④ 钉钉子：先钉格子，再往格子里填名字 -->
      <g v-show="step === 3" class="demo__frame">
        <g class="demo__grid">
          <g data-explain="meridian">
            <path v-for="m in meridians" :key="`m${m.lon}`" :d="m.path" />
          </g>
          <path
            v-for="p in parallels"
            :key="`p${p.lat}`"
            :d="p.path"
            :data-explain="p.lat === 23.5 ? 'tropic' : 'parallel'"
          />
        </g>
        <text
          v-for="m in meridians"
          :key="`ml${m.lon}`"
          class="demo__label demo__label--faint"
          :x="m.x"
          y="320"
          text-anchor="middle"
        >
          {{ m.label }}
        </text>
        <text
          v-for="p in parallels"
          :key="`pl${p.lat}`"
          class="demo__label demo__label--faint"
          x="80"
          :y="p.y + 4"
          text-anchor="end"
        >
          {{ p.label }}
        </text>

        <!-- 不在骨架线上的那一个：4488 天山脚 -->
        <circle class="demo__cut" data-explain="extra" :cx="extra.x" :cy="extra.y" r="5" />
        <text class="demo__label demo__label--mark" :x="extra.labelX" :y="extra.labelY" text-anchor="middle">
          乌鲁木齐
        </text>
        <text class="demo__label demo__label--faint" :x="extra.labelX" :y="extra.labelY + 15" text-anchor="middle">
          北纬 44°、东经 88°
        </text>

        <text class="demo__label demo__label--mark" x="360" y="336" text-anchor="middle">
          钉钉子：先钉格子，再往格子里填名字
        </text>
        <text class="demo__label demo__label--faint" data-explain="extent" x="360" y="358" text-anchor="middle">
          先定位：最西东经 73° 帕米尔 · 最东东经 135° · 最北北纬 53° 漠河 · 最南约北纬 4° 曾母暗沙
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §15.10 中国地图速记方法：用《蜜雪冰城》把中国地图唱进脑子。
 *
 * 讲义的方法：不背轮廓，先在脑子里搭一张经纬网骨架（**6 条经线 + 6 条纬线**），
 * 再把地理事物**钉在交点上**。骨架：东经 80/90/100/110/120/130；
 * 北纬 20/30/40/50 + 北回归线 + 北纬 34°。
 *
 * 四步：
 *   ① 搭骨架：6 根竖线 + 6 根横线
 *   ② 点亮南段：北纬 20°、北回归线、北纬 30°
 *   ③ 点亮北段：北纬 34°、北纬 40°、北纬 50°
 *   ④ 钉钉子：先钉格子，再往格子里填名字（含 4488 天山脚的乌鲁木齐与四至）
 *
 * 钉点的经纬度与城市逐字取自讲义；讲义没给经纬度的（广东、长江中下游一带）
 * 只画成一段区间，不编坐标。
 */
import DemoShell from '../DemoShell.vue'
import {
  ANCHOR_ROWS,
  EXTENT_BOUNDS,
  EXTRA_POINT,
  MERIDIANS,
  PARALLELS,
  anchorCount,
  bracketPosition,
  gridProjection,
  gridScale,
  rowAnchors,
  skeletonGaps,
} from '../../data/mapGridMnemonicGeometry'

const steps = [
  {
    id: 'skeleton',
    title: '① 先搭骨架：6 根竖线、6 根横线',
    text: '整套方法的骨架只有 6 条经线（东经 80°、90°、100°、110°、120°、130°）和 6 条纬线（北纬 20°、30°、40°、50°，加北回归线和北纬 34°）。竖线是经线，横线是纬线，交点就是城市的位置——先把格子在脑子里铺好。',
  },
  {
    id: 'south',
    title: '② 点亮南段：20°、北回归线、30°',
    text: '北纬 20° 与东经 110° 的交点是海口。北回归线上：东经 100° 是云南、110° 是广西、120° 是台湾，桂台中间是广东。北纬 30° 是最热闹的一段：90° 拉萨、100° 横断山脉、105° 成都、107° 重庆、110° 巫山、120° 杭州；110°–120° 之间是长江中下游的「ω」形——武汉、鄱阳湖、洞庭湖，鱼米之乡。',
  },
  {
    id: 'north',
    title: '③ 点亮北段：34°、40°、50°',
    text: '北纬 34° 与东经 110° 的交点是秦岭，东西走向，划分中国南北——这是最重要的一条线。北纬 40° 信息量最大：90° 塔里木盆地（东部）、100° 祁连山与河西走廊、110° 黄河几字弯（东侧）、116° 北京。北纬 50°：120° 大兴安岭、90° 阿尔泰山地，两条山脉走向正好相对。',
  },
  {
    id: 'nail',
    title: '④ 钉钉子：先钉格子，再往格子里填名字',
    text: '整套方法的用法只有一句：先钉格子，再往格子里填名字——记的时候按「某条纬线 + 某个经度 → 什么东西」记，不是按一段歌词记。另外先用四至定位：最西东经 73° 帕米尔高原，最东东经 135°，最北北纬 53° 漠河，最南约北纬 4° 曾母暗沙。骨架外的例子是「4488」——乌鲁木齐在北纬 44°、东经 88°，天山脚下。',
  },
]

/** 骨架的投影 */
const BOX = { left: 88, right: 640, top: 44, bottom: 300 }
const project = gridProjection(BOX, 78, 132, 16, 52)

/** 6 根竖线与 6 根横线 */
const meridians = MERIDIANS.map((lon) => ({
  lon,
  x: Number(project.x(lon).toFixed(2)),
  label: `东经 ${lon}°`,
  path: `M ${project.x(lon).toFixed(2)} ${BOX.top} L ${project.x(lon).toFixed(2)} ${BOX.bottom}`,
}))

const parallels = PARALLELS.map((p) => ({
  lat: p.lat,
  y: Number(project.y(p.lat).toFixed(2)),
  label: p.label,
  path: `M ${BOX.left} ${project.y(p.lat).toFixed(2)} L ${BOX.right} ${project.y(p.lat).toFixed(2)}`,
}))

/** 名字放在钉点的哪个方向——按拥挤程度手工排布，钉点本身仍由经纬度算出 */
const LABEL_OFFSETS = {
  '20|110': { dx: 0, dy: 20, anchor: 'middle' },
  '23.5|100': { dx: 0, dy: -14, anchor: 'middle' },
  '23.5|110': { dx: 0, dy: -14, anchor: 'middle' },
  '23.5|115': { dx: 0, dy: -36, anchor: 'middle' },
  '23.5|120': { dx: 0, dy: -14, anchor: 'middle' },
  '30|90': { dx: 0, dy: -14, anchor: 'middle' },
  '30|100': { dx: 0, dy: -14, anchor: 'middle' },
  '30|105': { dx: 0, dy: -14, anchor: 'middle' },
  '30|107': { dx: 0, dy: 24, anchor: 'middle' },
  '30|110': { dx: 0, dy: -14, anchor: 'middle' },
  '30|115': { dx: 0, dy: 30, anchor: 'middle' },
  '30|120': { dx: 0, dy: -14, anchor: 'middle' },
  '34|110': { dx: 0, dy: -14, anchor: 'middle' },
  '40|90': { dx: 0, dy: -14, anchor: 'middle' },
  '40|100': { dx: 0, dy: -16, anchor: 'middle' },
  '40|110': { dx: 0, dy: -16, anchor: 'middle' },
  '40|116': { dx: 0, dy: 16, anchor: 'middle' },
  '50|90': { dx: 0, dy: 20, anchor: 'middle' },
  '50|120': { dx: 0, dy: 20, anchor: 'middle' },
}

/** 把某一行纬线上的钉点算成画布坐标 */
function anchorsOf(row) {
  return rowAnchors(project, row).map((item) => {
    const key = `${row.lat}|${item.lon}`
    const off = LABEL_OFFSETS[key] ?? { dx: 0, dy: -14, anchor: 'middle' }
    const half = 14
    return {
      ...item,
      labelX: Number((item.x + off.dx).toFixed(2)),
      labelY: Number((item.y + off.dy).toFixed(2)),
      anchor: off.anchor,
      bandPath: `M ${(item.x - half).toFixed(2)} ${item.y} L ${(item.x + half).toFixed(2)} ${item.y}`,
    }
  })
}

/** ② 南段：北纬 20°、北回归线、北纬 30° */
const southAnchors = ANCHOR_ROWS.filter((r) => r.lat <= 30).flatMap(anchorsOf)

/** ③ 北段：北纬 34°、北纬 40°、北纬 50° */
const northAnchors = ANCHOR_ROWS.filter((r) => r.lat > 30).flatMap(anchorsOf)

/** ④ 骨架外的那一个点：4488 天山脚 */
const extra = (() => {
  const x = project.x(EXTRA_POINT.lon)
  const y = project.y(EXTRA_POINT.lat)
  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    labelX: Number(x.toFixed(2)),
    labelY: Number((y - 30).toFixed(2)),
  }
})()

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * 数字全部由几何函数算好后填进 {占位符}：格距、缺口、
 * 钉点个数、骨架外的点落在哪两条线之间——不手写。
 */
const scale = gridScale(BOX, 78, 132, 16, 52)
const gaps = skeletonGaps(MERIDIANS, PARALLELS)
const counts = anchorCount(ANCHOR_ROWS)
const extraLonBracket = bracketPosition(EXTRA_POINT.lon, MERIDIANS)
const extraLatBracket = bracketPosition(EXTRA_POINT.lat, PARALLELS.map((p) => p.lat))

const vars = {
  meridianCount: `${MERIDIANS.length}`,
  parallelCount: `${PARALLELS.length}`,
  lonStep: `${MERIDIANS[1] - MERIDIANS[0]}°`,
  latStep: `${PARALLELS[0].lat - PARALLELS[1].lat}°`,
  meridianGapPx: `${(scale.xPerDeg * (MERIDIANS[1] - MERIDIANS[0])).toFixed(1)} px`,
  parallelGapPx: `${(scale.yPerDeg * (PARALLELS[0].lat - PARALLELS[1].lat)).toFixed(1)} px`,
  nailCount: `${counts.points}`,
  bandCount: `${counts.bands}`,
  tropicLat: `${PARALLELS.find((p) => p.lat === 23.5).lat}°`,
  gapWest: `${gaps.west}°`,
  gapEast: `${gaps.east}°`,
  gapNorth: `${gaps.north}°`,
  gapSouth: `${gaps.south}°`,
  extentLon: `${EXTENT_BOUNDS.lonMin}° – ${EXTENT_BOUNDS.lonMax}°`,
  extentLat: `${EXTENT_BOUNDS.latMin}° – ${EXTENT_BOUNDS.latMax}°`,
  extraLon: `${EXTRA_POINT.lon}°`,
  extraLat: `${EXTRA_POINT.lat}°`,
  extraLonLow: `${extraLonBracket.low}°`,
  extraLonHigh: `${extraLonBracket.high}°`,
  extraLonPct: `${Math.round(extraLonBracket.t * 100)}%`,
  extraLatLow: `${extraLatBracket.low}°`,
  extraLatHigh: `${extraLatBracket.high}°`,
  extraLatPct: `${Math.round(extraLatBracket.t * 100)}%`,
}

const explains = {
  meridian: {
    name: '竖线（经线）',
    hint: '六根等距的竖线是经线，它们定的是东西方向。',
    vars,
    steps: [
      '网格定位靠的是经纬网：竖线是经线，横线是纬线',
      '骨架只取东经 {meridianCount} 条：80° 到 130°，相邻差 {lonStep}',
      '经度定东西：数值向东增大，最东那根是东经 130°',
      '经线之间在图上等距（相邻两根相距 {meridianGapPx}），因为图上用的是等距投影',
    ],
  },
  parallel: {
    name: '横线（纬线）',
    hint: '六根横线是纬线，它们定的是南北方向。',
    vars,
    steps: [
      '横线是纬线：北纬 50°、40°、34°、30°，加上北回归线和北纬 20°',
      '纬度定南北：数值向北增大，最上那根是北纬 50°',
      '相邻纬线一般相差 10°（图上相距 {parallelGapPx}）',
      '先把经纬线认全，再去读某个点的度数——认错线，度数全错',
    ],
  },
  tropic: {
    name: `北回归线（北纬 ${PARALLELS.find((p) => p.lat === 23.5).lat}°）`,
    hint: '骨架里唯一一条不是整十度的纬线，它把南段和北段分开。',
    vars,
    steps: [
      '北回归线是太阳直射的最北界线，纬度 {tropicLat}',
      '骨架其余五条纬线都是整十度，只有它是 {tropicLat}——所以它最好认',
      '它把中国南北分成两段：20°、{tropicLat}、30° 是南段，34°、40°、50° 是北段',
      '背图时先记这条线，再记它上面下面各有什么',
    ],
  },
  nail: {
    name: '钉点（交点上的东西）',
    hint: '整套方法的核心：先钉格子，再往格子里填名字。',
    vars,
    steps: [
      '经线与纬线的交点就是位置，一个交点就是一个格子',
      '骨架上一共钉了 {nailCount} 个点，每钉一个就记住一条信息',
      '钉的时候按「某条纬线 + 某个经度 → 什么东西」记，不按歌词记',
      '比如北纬 34° × 东经 110° = 秦岭（东西走向，划分中国南北）',
    ],
  },
  band: {
    name: '区间带（画成一段，不是一个点）',
    hint: '讲义只给出范围、没有给出确切经纬度的，就画成一段。',
    vars,
    steps: [
      '广东在东经 110° 与 120° 之间、长江中下游呈 ω 形——讲义没给确切经纬度',
      '这类地方不能编一个坐标出来，所以画成一段区间',
      '图上一共 {bandCount} 段这样的区间',
      '真到了考场上，考题问的是「大致位置」——区间比假坐标更保险',
    ],
  },
  extra: {
    name: '骨架外的点（乌鲁木齐）',
    hint: '不在骨架线上的点，用「夹在两条线之间」来估位置。',
    vars,
    steps: [
      '乌鲁木齐在北纬 {extraLat}、东经 {extraLon}，两条骨架线上都没有它',
      '先夹经度：在东经 {extraLonLow} 与 {extraLonHigh} 之间，偏东 {extraLonPct}',
      '再夹纬度：在北纬 {extraLatLow} 与 {extraLatHigh} 之间，偏北 {extraLatPct}',
      '会这样估位置，骨架外的点也能落到格子里——「4488」就是这么记的',
    ],
  },
  extent: {
    name: '四至（先定位）',
    hint: '骨架之前先把中国的四个极值钉住，地图才有边界。',
    vars,
    steps: [
      '四至就是中国领土的四个极值点：最西、最东、最北、最南',
      '经度范围 {extentLon}，纬度范围 {extentLat}',
      '骨架最西是东经 80°，比四至最西差 {gapWest}；最东 130°，比四至最东差 {gapEast}',
      '骨架最北是北纬 50°，差 {gapNorth}；最南是北纬 20°，差 {gapSouth}——边界那几度靠四至补',
    ],
  },
}
</script>
