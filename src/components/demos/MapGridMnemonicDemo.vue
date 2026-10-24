<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- ① 搭骨架：6 条经线 + 6 条纬线 -->
      <g v-show="step === 0" class="demo__frame">
        <g class="demo__grid">
          <path v-for="m in meridians" :key="`m${m.lon}`" :d="m.path" />
          <path v-for="p in parallels" :key="`p${p.lat}`" :d="p.path" />
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
          <path v-for="m in meridians" :key="`m${m.lon}`" :d="m.path" />
          <path v-for="p in parallels" :key="`p${p.lat}`" :d="p.path" />
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
          <circle v-if="a.kind === 'point'" class="demo__cut" :cx="a.x" :cy="a.y" r="5" />
          <path v-else class="demo__curve" :d="a.bandPath" />
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
          <path v-for="m in meridians" :key="`m${m.lon}`" :d="m.path" />
          <path v-for="p in parallels" :key="`p${p.lat}`" :d="p.path" />
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
          <circle v-if="a.kind === 'point'" class="demo__cut" :cx="a.x" :cy="a.y" r="5" />
          <path v-else class="demo__curve" :d="a.bandPath" />
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
          <path v-for="m in meridians" :key="`m${m.lon}`" :d="m.path" />
          <path v-for="p in parallels" :key="`p${p.lat}`" :d="p.path" />
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
        <circle class="demo__cut" :cx="extra.x" :cy="extra.y" r="5" />
        <text class="demo__label demo__label--mark" :x="extra.labelX" :y="extra.labelY" text-anchor="middle">
          乌鲁木齐
        </text>
        <text class="demo__label demo__label--faint" :x="extra.labelX" :y="extra.labelY + 15" text-anchor="middle">
          北纬 44°、东经 88°
        </text>

        <text class="demo__label demo__label--mark" x="360" y="336" text-anchor="middle">
          钉钉子：先钉格子，再往格子里填名字
        </text>
        <text class="demo__label demo__label--faint" x="360" y="358" text-anchor="middle">
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
  EXTRA_POINT,
  MERIDIANS,
  PARALLELS,
  gridProjection,
  rowAnchors,
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
</script>
