<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- ① 三节课的分工 -->
      <g v-show="step === 0" class="demo__frame">
        <g v-for="(b, i) in blocks" :key="b.part">
          <rect
            class="demo-block"
            :class="{ 'demo-block--last': i === blocks.length - 1 }"
            :x="b.x"
            y="118"
            :width="b.w"
            height="128"
            rx="8"
          />
          <text class="demo__label demo__label--mark" :x="b.x + b.w / 2" y="150" text-anchor="middle">
            {{ b.part }}
          </text>
          <text class="demo__label" :x="b.x + b.w / 2" y="180" text-anchor="middle">
            {{ b.title }}
          </text>
          <text class="demo__label demo__label--faint" :x="b.x + b.w / 2" y="204" text-anchor="middle">
            {{ b.sub }}
          </text>
          <text class="demo__label demo__label--faint" :x="b.x + b.w / 2" y="228" text-anchor="middle">
            {{ b.range }}
          </text>
          <path
            v-if="i < blocks.length - 1"
            class="demo__spin"
            :d="`M ${b.x + b.w + 4} 182 L ${b.x + b.w + 20} 182`"
          />
          <path
            v-if="i < blocks.length - 1"
            class="demo__spin-head"
            :d="arrowHead(b.x + b.w + 20, 182, 0, 12)"
          />
        </g>
        <text class="demo__caption-line" x="360" y="300" text-anchor="middle">
          先立因果链，再分块学：三段各自解决哪一段问题，课后按分 P 回看
        </text>
      </g>

      <!-- ② 全章因果链 -->
      <g v-show="step === 1" class="demo__frame">
        <g v-for="(c, i) in chain" :key="c.text">
          <rect class="demo-chain" :x="c.x" y="140" :width="c.w" height="84" rx="6" />
          <text class="demo__label" :x="c.x + c.w / 2" y="172" text-anchor="middle">
            <tspan v-for="(line, k) in c.lines" :key="k" :x="c.x + c.w / 2" :dy="k === 0 ? 0 : 20">
              {{ line }}
            </tspan>
          </text>
          <path
            v-if="i < chain.length - 1"
            class="demo__spin"
            :d="`M ${c.x + c.w + 2} 182 L ${c.x + c.w + 14} 182`"
          />
          <path
            v-if="i < chain.length - 1"
            class="demo__spin-head"
            :d="arrowHead(c.x + c.w + 14, 182, 0, 11)"
          />
        </g>
        <text class="demo__caption-line" x="360" y="282" text-anchor="middle">
          地面冷热不均 → 气压差 → 风
        </text>
        <text class="demo__label demo__label--faint" x="360" y="312" text-anchor="middle">
          后面每一节都是这条链上的一环：大题要答的全在这条链里
        </text>
      </g>

      <!-- ③ 层层假设、层层加 Buff -->
      <g v-show="step === 2" class="demo__frame">
        <g v-for="(a, i) in assumptions" :key="a.step">
          <circle class="demo__cut" :cx="96" :cy="a.y" r="13" />
          <text class="demo__label demo__label--light" :x="96" :y="a.y + 5" text-anchor="middle">
            {{ i + 1 }}
          </text>
          <text class="demo__label" x="128" :y="a.y - 4">{{ a.add }}</text>
          <text class="demo__label demo__label--mark" x="128" :y="a.y + 22">{{ a.result }}</text>
          <path
            v-if="i < assumptions.length - 1"
            class="demo__spin"
            :d="`M 96 ${a.y + 16} L 96 ${a.y + 56}`"
          />
          <path
            v-if="i < assumptions.length - 1"
            class="demo__spin-head"
            :d="arrowHead(96, a.y + 58, 270, 11)"
          />
        </g>
        <text class="demo__label demo__label--faint" x="360" y="352" text-anchor="middle">
          层层假设、层层加 Buff：每加一个因素，就多出一点偏差需要解释
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §7.1 本节考情与三节课的分工。
 *
 * 这一节本身是「导览」，没有空间场景可画——但「三节课怎么分工」用结构图最省事。
 *
 * 三步：
 *   ① 三段分工 —— p030 / p031 / p032 各管哪几节
 *   ② 全章因果链 —— 温差 → 气压差 → 风 → 输送水汽热量 → 影响气候
 *   ③ 层层假设、层层加 Buff —— 研究方法本身
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { arrowHead } from '../../data/svgParts'

const steps = [
  {
    id: 'parts',
    title: '① 三节课的分工',
    text: '这一节按三节课讲：p030 讲三圈环流（气压带和风带），覆盖 7.2 到 7.10；p031 讲季风环流，覆盖 7.11 到 7.17；p032 讲考点题型与真题，覆盖 7.18 和 7.19。先知道每段管哪几节，复习时才不会乱。',
  },
  {
    id: 'chain',
    title: '② 全章的因果链',
    text: '整章其实是一条链：地面冷热不均 → 气压差 → 风 → 风输送水汽和热量 → 影响一个区域的气候和天气。三圈环流、季风环流、气压带风带的季节移动，都是这条链上的环节。后面做大题，答案也在这条链里。',
  },
  {
    id: 'assumptions',
    title: '③ 层层假设、层层加 Buff',
    text: '老师讲这章用的研究方法是层层假设、层层加 Buff：先只考虑热力因素，得到单圈环流；加上地转偏向力，得到三圈环流和六风七带；加上太阳直射点的季节移动，得到气压带风带的季节性移动；再加上海陆分布差异，得到季风环流。每加一个因素，就多出一点偏差需要解释。',
  },
]

/** ① 三段分工 */
const blocks = computed(() => [
  { part: 'p030', title: '三圈环流', sub: '气压带和风带', range: '覆盖 7.2 – 7.10', x: 34, w: 200 },
  { part: 'p031', title: '季风环流', sub: '海陆热力差异', range: '覆盖 7.11 – 7.17', x: 260, w: 200 },
  { part: 'p032', title: '考点题型与真题', sub: '六步法 · 答题框架', range: '覆盖 7.18 – 7.19', x: 486, w: 200 },
])

/** ② 因果链 */
const chain = computed(() => {
  const items = [
    { lines: ['地面冷热', '不均'], w: 120 },
    { lines: ['气压差'], w: 104 },
    { lines: ['风'], w: 92 },
    { lines: ['风输送水汽', '和热量'], w: 124 },
    { lines: ['影响一个区域的', '气候和天气'], w: 128 },
  ]
  const gap = 20
  const total = items.reduce((s, i) => s + i.w, 0) + gap * (items.length - 1)
  let x = (720 - total) / 2
  return items.map((i) => {
    const item = { ...i, x }
    x += i.w + gap
    return item
  })
})

/** ③ 层层加 Buff */
const assumptions = computed(() => [
  { y: 66, add: '只考虑热力因素', result: '→ 单圈环流（§7.3）' },
  { y: 140, add: '加上地转偏向力（来自 §3）', result: '→ 三圈环流 ＋ 六风七带（§7.5 – §7.9）' },
  { y: 214, add: '加上太阳直射点的季节移动（来自 §4）', result: '→ 气压带风带的季节性移动（§7.10）' },
  { y: 288, add: '加上海陆分布差异', result: '→ 季风环流（§7.11 – §7.17）' },
])
</script>

<style scoped>
.demo-block {
  fill: var(--learn-accent-soft);
  fill-opacity: 0.6;
  stroke: var(--learn-accent);
  stroke-width: 1.5;
}

.demo-block--last {
  fill: var(--learn-day);
}

.demo-chain {
  fill: var(--learn-panel);
  stroke: var(--learn-line);
  stroke-width: 1.4;
}

.demo__label--light {
  fill: var(--learn-panel);
}
</style>
