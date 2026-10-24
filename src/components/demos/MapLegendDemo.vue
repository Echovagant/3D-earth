<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- 底图：一小块抽象示意地图 + 图例框 -->
      <g>
        <rect class="demo__globe-plain" x="50" y="80" width="350" height="220" rx="3" />
        <path class="demo__curve" :d="riverPath" />
        <path class="demo__leader" d="M 68 130 L 392 268" />
        <path class="demo__cut" d="M 105 181 L 113 195 L 97 195 Z" />
        <rect class="demo__cut" x="294" y="199" width="12" height="12" />
        <text class="demo__label" x="120" y="200" text-anchor="start">1200 米</text>
        <text class="demo__label" x="312" y="204" text-anchor="start">甲村</text>
        <!-- 图例框 -->
        <g class="demo__grid">
          <path d="M 430 80 L 670 80 L 670 300 L 430 300 Z" />
        </g>
        <text class="demo__label demo__label--mark" x="446" y="106" text-anchor="start">图例</text>
        <path class="demo__cut" d="M 452 131 L 460 145 L 444 145 Z" />
        <text class="demo__label" x="480" y="146" text-anchor="start">山峰</text>
        <rect class="demo__cut" x="446" y="168" width="12" height="12" />
        <text class="demo__label" x="480" y="182" text-anchor="start">居民点</text>
        <path class="demo__curve" :d="sampleRiver" />
        <text class="demo__label" x="480" y="226" text-anchor="start">河流</text>
        <path class="demo__leader" d="M 446 258 L 472 258" />
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
