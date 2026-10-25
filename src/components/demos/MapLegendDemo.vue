<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- 底图：一小块抽象示意地图 + 图例框 -->
      <g>
        <rect class="demo__globe-plain" x="50" y="80" width="350" height="220" rx="3" />
        <path class="demo__curve" data-explain="map-river" :d="riverPath" />
        <path class="demo__leader" data-explain="map-railway" d="M 68 130 L 392 268" />
        <path class="demo__cut" data-explain="map-peak" d="M 105 181 L 113 195 L 97 195 Z" />
        <rect class="demo__cut" data-explain="map-village" x="294" y="199" width="12" height="12" />
        <g data-explain="annotation">
          <text class="demo__label" x="120" y="200" text-anchor="start">1200 米</text>
          <text class="demo__label" x="312" y="204" text-anchor="start">甲村</text>
        </g>
        <!-- 图例框 -->
        <g class="demo__grid" data-explain="legend-box">
          <path d="M 430 80 L 670 80 L 670 300 L 430 300 Z" />
        </g>
        <text class="demo__label demo__label--mark" x="446" y="106" text-anchor="start">图例</text>
        <path class="demo__cut" data-explain="legend-peak" d="M 452 131 L 460 145 L 444 145 Z" />
        <text class="demo__label" x="480" y="146" text-anchor="start">山峰</text>
        <rect class="demo__cut" data-explain="legend-village" x="446" y="168" width="12" height="12" />
        <text class="demo__label" x="480" y="182" text-anchor="start">居民点</text>
        <path class="demo__curve" data-explain="legend-river" :d="sampleRiver" />
        <text class="demo__label" x="480" y="226" text-anchor="start">河流</text>
        <path class="demo__leader" data-explain="legend-railway" d="M 446 258 L 472 258" />
        <text class="demo__label" x="480" y="262" text-anchor="start">铁路</text>
      </g>

      <!-- ① 先看图上有什么 -->
      <g v-show="step === 0" class="demo__frame">
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          一张图上画的都是符号和线——它们代表什么，要靠图例和注记来解释
        </text>
      </g>

      <!-- ② 图例是地图的钥匙 -->
      <g v-show="step === 1" class="demo__frame">
        <rect class="demo2-highlight" x="424" y="74" width="252" height="232" rx="4" />
        <text class="demo__label demo__label--mark" x="360" y="44" text-anchor="middle">
          图例 = 地图的钥匙：符号代表什么，全靠它说明
        </text>
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          做题不读图例就动手，符号含义搞错，后面全错
        </text>
      </g>

      <!-- ③ 注记是地图上的文字 -->
      <g v-show="step === 2" class="demo__frame">
        <rect class="demo2-highlight" x="92" y="182" width="92" height="24" rx="4" />
        <rect class="demo2-highlight" x="308" y="188" width="52" height="22" rx="4" />
        <text class="demo__label demo__label--mark" x="360" y="44" text-anchor="middle">
          注记 = 地图上的文字：地名、说明、数字、比例尺、方向标
        </text>
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          只盯着图形符号、忽略这些文字，是最常见的失分点
        </text>
      </g>

      <!-- ④ 判读顺序 -->
      <g v-show="step === 3" class="demo__frame">
        <text class="demo__caption-line" x="360" y="44" text-anchor="middle">
          高考大题的得分点，几乎都来自图例和注记
        </text>
        <g>
          <rect class="demo__globe-plain" x="55" y="312" width="190" height="50" rx="4" />
          <text class="demo__label demo__label--mark" x="150" y="343" text-anchor="middle">
            ① 先读图例和注记
          </text>
          <path class="demo__spin" d="M 252 337 L 268 337" />
          <path class="demo__spin-head" :d="arrowHead(268, 337, 0, 11)" />
          <rect class="demo__globe-plain" x="275" y="312" width="170" height="50" rx="4" />
          <text class="demo__label demo__label--mark" x="360" y="343" text-anchor="middle">
            ② 再定方向
          </text>
          <path class="demo__spin" d="M 452 337 L 468 337" />
          <path class="demo__spin-head" :d="arrowHead(468, 337, 0, 11)" />
          <rect class="demo__globe-plain" x="475" y="312" width="195" height="50" rx="4" />
          <text class="demo__label demo__label--mark" x="572" y="343" text-anchor="middle">
            ③ 最后用比例尺量算
          </text>
        </g>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §2.18 图例和注记：高考真正的得分点。
 *
 * 讲义里那句「出题人很多时候就是通过地图向你传递解题信息」，补的就是这幅画：
 *   ① 一小块抽象示意地图（几条线 + 几个符号，不画真地图，免得引入地理错误）；
 *   ② 图例框被圈出来——图例是地图的钥匙；
 *   ③ 注记被圈出来——注记是地图上的文字；
 *   ④ 判读顺序：先读图例和注记 → 再定方向 → 最后用比例尺量算。
 */
import DemoShell from '../DemoShell.vue'
import { arrowHead } from '../../data/svgParts'
import {
  LEGEND_ITEMS,
  MAP_SYMBOLS,
  PEAK_ELEVATION_M,
  legendCoverage,
  metersToKm,
} from '../../data/mapLegendGeometry'

const steps = [
  {
    id: 'map',
    title: '① 地图上画的都是符号',
    text: '一张地图上画的不是山河湖海，而是一堆符号和线：折线是铁路，波浪线是河流，三角是山峰，方块是居民点。这些符号分别代表什么，不看图例和注记就无从知道。',
  },
  {
    id: 'legend',
    title: '② 图例是地图的钥匙',
    text: '图例就是地图上标明各地理事物符号的那一栏：哪个符号是铁路、哪个是河流、哪个是居民点，全靠它翻译。题目的信息往往就藏在这里，读漏了就全错。',
  },
  {
    id: 'annotation',
    title: '③ 注记是地图上的文字',
    text: '除图例外，地图上的文字说明统称注记：地名、海拔数字、比例尺、方向标都属于注记。很多人只盯着图形符号，忽略了这些文字，答案就漏了一半。',
  },
  {
    id: 'order',
    title: '④ 做题的顺序：先读图例和注记',
    text: '老师示范的判读顺序是：先看图例和注记，接着定方向（有指向标就听指向标，有经纬网就靠线的走向），最后才用比例尺量算。顺序反了，等于用错了尺子去量。',
  },
]

/** 一条波浪线（河流） */
function wavy(x1, y1, x2, y2, waves = 3, amp = 12) {
  const points = []
  for (let i = 0; i <= 24; i += 1) {
    const t = i / 24
    const x = x1 + (x2 - x1) * t
    const y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI * 2 * waves) * amp
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return points.join(' ')
}

const riverPath = wavy(68, 268, 390, 108)
const sampleRiver = wavy(446, 232, 472, 232, 1, 5)

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * 数字全部由几何函数算好后填进 {占位符}：海拔换算、符号与图例的对应关系，
 * 都从同一份对照表里出，不另抄一份。
 */
const coverage = legendCoverage(MAP_SYMBOLS, LEGEND_ITEMS)

const vars = {
  elevation: `${PEAK_ELEVATION_M} 米`,
  elevKm: `${metersToKm(PEAK_ELEVATION_M)} 千米`,
  symbolCount: `${coverage.symbolCount}`,
  legendCount: `${coverage.legendCount}`,
  matchedCount: `${coverage.matchedCount}`,
  missingCount: `${coverage.missing.length}`,
  extraCount: `${coverage.extra.length}`,
}

const explains = {
  'map-peak': {
    name: '图上的山峰符号',
    hint: '三角形本身没有地理含义，得靠图例翻译才知道它是山峰。',
    vars,
    steps: [
      '图上画的都是符号和线，符号自己不说明任何地理含义',
      '三角形的约定含义是山峰，图例里写着「山峰」——两边对上了才成立',
      '三角形画在山顶上，所以顶点就是山峰的位置',
      '它旁边的 {elevation} 是海拔：{elevation} = {elevKm}',
      '完整信息 = 符号 + 数字：这是个海拔 {elevation} 的山峰',
    ],
  },
  'map-village': {
    name: '图上的居民点符号',
    hint: '小方块画的是一个点，不是它占的范围。',
    vars,
    steps: [
      '方块的约定含义是居民点',
      '方块画得很小，说明画的是「点」——聚落的位置，不是它占的面积',
      '旁边的「甲村」是地名注记，说明这个点具体是哪个村',
      '符号告诉你「这是一处居民点」，注记告诉你「它是甲村」',
    ],
  },
  'map-river': {
    name: '图上的河流',
    hint: '波浪线是线状要素，读它要看走向——水往低处流。',
    vars,
    steps: [
      '波浪线是河流，线状要素靠走向来判读',
      '河流总是从高处流向低处，顺着等高线看它往哪边走',
      '一条河从源头到河口是同一条线，中间不会断',
      '图上还有别的线（铁路），所以线的形状必须查图例才认得准',
    ],
  },
  'map-railway': {
    name: '图上的铁路',
    hint: '直线是铁路的约定符号，和河流一样不能靠颜色认。',
    vars,
    steps: [
      '这条实线的约定含义是铁路',
      '铁路是线状要素，图上画的是它的走向',
      '图上同时有河流和铁路两种线，颜色又接近 —— 只能靠线形和图例区分',
      '图例里那一小段样线，就是图上这条线的「翻译」',
    ],
  },
  annotation: {
    name: '注记（地图上的文字）',
    hint: '地名、数字、说明、比例尺、方向标都属于注记。',
    vars,
    steps: [
      '除图例外，地图上的文字说明统称注记',
      '图上这两处注记：「1200 米」是数字（海拔），「甲村」是地名',
      '海拔的单位是米：{elevation} = {elevKm}，别和比例尺算出的实地距离混着比',
      '只盯着图形符号、忽略这些文字，是最常见的失分点',
    ],
  },
  'legend-box': {
    name: '图例框',
    hint: '图例就是地图与文字的对照表：符号相同即同一要素。',
    vars,
    steps: [
      '图例是地图上标明各地理事物符号的那一栏——地图与文字的对照表',
      '对照规则只有一条：颜色或符号相同，就是同一类要素',
      '这张图上 {symbolCount} 个符号，图例里 {legendCount} 条，一一对应（漏 {missingCount} 条、多 {extraCount} 条）',
      '分类图例按地理分区给不同的颜色和符号，这是「同一颜色 = 同一类」的延伸',
      '做题顺序：先读图例和注记 → 再定方向 → 最后用比例尺量算',
    ],
  },
  'legend-peak': {
    name: '图例条目：山峰',
    hint: '图例的一行 = 左边一个符号 + 右边一个名称。',
    vars,
    steps: [
      '图例的一行就是一个对照：左边符号，右边名称',
      '图上遇到一模一样的三角形，就按「山峰」去理解',
      '三角形画在山顶上，所以它的顶点就是山顶的位置',
      '配合旁边的海拔数字，才知道是哪个山峰、多高',
    ],
  },
  'legend-village': {
    name: '图例条目：居民点',
    hint: '同样的方块，在图例里被翻译成「居民点」。',
    vars,
    steps: [
      '这一行是「方块 = 居民点」',
      '大小对应：图例里画多大，图上就画多大——大小不是面积信息',
      '图上的方块配上旁边的地名，就是一处具体的居民点',
      '看图例时顺手记一句「方块小 = 是点不是面」，比例尺题里最容易被这一点坑',
    ],
  },
  'legend-river': {
    name: '图例条目：河流',
    hint: '同样一段波浪线，在图例里被翻译成「河流」。',
    vars,
    steps: [
      '这一行是「波浪线 = 河流」',
      '图例里只画一小段样线，它和图上那条河是同一个符号',
      '河流是线状要素，读它靠走向：水从高处流向低处',
      '所以判断一条线是不是河，要看图例 + 看走向，两样都认准才算读对',
    ],
  },
  'legend-railway': {
    name: '图例条目：铁路',
    hint: '同样一条实线，在图例里被翻译成「铁路」。',
    vars,
    steps: [
      '这一行是「实线 = 铁路」',
      '没有图例时，图上这条线和别的线没有区别——符号的含义全靠这一行给出',
      '铁路的走向决定了沿线聚落和城市的分布，读图时先看走向再找站点',
      '这就是「做题不读图例就动手」的坏处：符号含义搞错，后面全错',
    ],
  },
}
</script>

<style scoped>
/* 高亮框：圈出图例或注记 */
.demo2-highlight {
  fill: none;
  stroke: var(--learn-accent);
  stroke-width: 2.5;
  stroke-dasharray: 8 5;
}
</style>
