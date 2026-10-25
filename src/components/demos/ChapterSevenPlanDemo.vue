<template>
  <DemoShell :steps="steps" :explains="explains">
    <template #default="{ step }">
      <!-- ① 三节课的分工 -->
      <g v-show="step === 0" class="demo__frame">
        <g v-for="(b, i) in blocks" :key="b.part">
          <rect
            class="demo-block"
            :class="{ 'demo-block--last': i === blocks.length - 1 }"
            :data-explain="b.id"
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
        <text class="demo__caption-line" data-explain="plan-total" x="360" y="300" text-anchor="middle">
          先立因果链，再分块学：三段各自解决哪一段问题，课后按分 P 回看
        </text>
      </g>

      <!-- ② 全章因果链 -->
      <g v-show="step === 1" class="demo__frame">
        <g v-for="(c, i) in chain" :key="c.id">
          <rect class="demo-chain" :data-explain="c.id" :x="c.x" y="140" :width="c.w" height="84" rx="6" />
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
        <g v-for="(a, i) in assumptions" :key="a.step" data-explain="assumption">
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

/** ① 三段分工：起止节号写清楚，节数与范围文字都从它算出来 */
const blocks = computed(() =>
  [
    { id: 'part-p030', part: 'p030', title: '三圈环流', sub: '气压带和风带', from: 2, to: 10, x: 34, w: 200 },
    { id: 'part-p031', part: 'p031', title: '季风环流', sub: '海陆热力差异', from: 11, to: 17, x: 260, w: 200 },
    {
      id: 'part-p032',
      part: 'p032',
      title: '考点题型与真题',
      sub: '六步法 · 答题框架',
      from: 18,
      to: 19,
      x: 486,
      w: 200,
    },
  ].map((b) => ({
    ...b,
    count: b.to - b.from + 1,
    range: `覆盖 7.${b.from} – 7.${b.to}`,
  })),
)

/** ② 因果链 */
const chain = computed(() => {
  const items = [
    { id: 'chain-thermal', lines: ['地面冷热', '不均'], w: 120 },
    { id: 'chain-pressure', lines: ['气压差'], w: 104 },
    { id: 'chain-wind', lines: ['风'], w: 92 },
    { id: 'chain-transport', lines: ['风输送水汽', '和热量'], w: 124 },
    { id: 'chain-climate', lines: ['影响一个区域的', '气候和天气'], w: 128 },
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

/** ③ 层层加 Buff：每加一个因素，就多出一处偏差要解释 */
const assumptions = computed(() =>
  [
    { from: 3, to: 3, add: '只考虑热力因素', result: '→ 单圈环流' },
    { from: 5, to: 9, add: '加上地转偏向力（来自 §3）', result: '→ 三圈环流 ＋ 六风七带' },
    { from: 10, to: 10, add: '加上太阳直射点的季节移动（来自 §4）', result: '→ 气压带风带的季节性移动' },
    { from: 11, to: 17, add: '加上海陆分布差异', result: '→ 季风环流' },
  ].map((a, i) => ({
    ...a,
    step: i + 1,
    y: 66 + i * 74,
    count: a.to - a.from + 1,
    result: `${a.result}（§7.${a.from}${a.to === a.from ? '' : ` – §7.${a.to}`}）`,
  })),
)

/**
 * 讲解层：图上能点的元素，说明它是什么、怎么算出来的。
 *
 * 节数、范围文字都从起止节号算出来填进 {占位符}，不手写——
 * 改一段课的起止节，图上的文字和讲解会一起变。
 */
const totalLessons = blocks.value.reduce((s, b) => s + b.count, 0)
const buffLessons = assumptions.value.reduce((s, a) => s + a.count, 0)

const vars = {
  p030Count: `${blocks.value[0].count}`,
  p031Count: `${blocks.value[1].count}`,
  p032Count: `${blocks.value[2].count}`,
  p030Range: blocks.value[0].range.replace('覆盖 ', ''),
  p031Range: blocks.value[1].range.replace('覆盖 ', ''),
  p032Range: blocks.value[2].range.replace('覆盖 ', ''),
  totalCount: `${totalLessons}`,
  buffCount: `${buffLessons}`,
  chainCount: `${chain.value.length}`,
}

const explains = {
  'part-p030': {
    name: 'p030 · 三圈环流',
    hint: '第一节课：气压带和风带，本章最长的一段。',
    vars,
    steps: [
      '第一节课讲气压带和风带',
      `覆盖 {p030Range}，共 {p030Count} 节——本章 19 节里最长的一段`,
      '这 {p030Count} 节是一条链：气压带的形成 → 三圈环流 → 六风七带 → 季节移动',
      '后面季风环流是在它基础上改造出来的，所以这段没学扎实，下一段看不懂',
    ],
  },
  'part-p031': {
    name: 'p031 · 季风环流',
    hint: '第二节课：海陆热力差异引起的环流。',
    vars,
    steps: [
      '第二节课讲季风环流，动力是海陆热力差异',
      `覆盖 {p031Range}，共 {p031Count} 节`,
      '它是在三圈环流的底子上，再加一条「海陆冷热不一样」改造出来的环流',
      '所以第一段没学扎实，第二段就只能背结论、不会推',
    ],
  },
  'part-p032': {
    name: 'p032 · 考点题型与真题',
    hint: '第三节课：不讲新知识，讲怎么考、怎么答。',
    vars,
    steps: [
      '第三节课不铺新知识，讲的是考点题型和真题怎么答',
      `覆盖 {p032Range}，共 {p032Count} 节`,
      '前两段回答「是什么」，这一段回答「怎么写出来」',
      '复习顺序：先按 p030 回知识，再按 p031 补区域，最后按 p032 练输出',
    ],
  },
  'plan-total': {
    name: '三段合起来',
    hint: '三段课覆盖本章的绝大部分，导览本身不讲知识。',
    vars,
    steps: [
      '三段课合起来覆盖 7.2 – 7.19，共 {totalCount} 节',
      '本章连这一节导览一共 19 节，导览只交代怎么分工，不讲知识',
      '所以真正要背的是 {totalCount} 节',
      '课后按分 P 回看：p030 → p031 → p032，顺序反了容易混',
    ],
  },
  'chain-thermal': {
    name: '链子的起点：地面冷热不均',
    hint: '地表受热不均，是整条链上所有现象的源头。',
    vars,
    steps: [
      '地表受热不匀：纬度不同、海陆不同，得到的热量不同',
      '同一高度上于是有的地方热、有的地方冷',
      '空气受热膨胀上升、遇冷收缩下沉——这一步直接来自「热力差异」',
      '升上去的地方高空变厚、下沉的地方高空变薄，再往下就是气压差',
    ],
  },
  'chain-pressure': {
    name: '气压差',
    hint: '冷热不均的后果，也是风存在的直接原因。',
    vars,
    steps: [
      '空气有升有降，同一水平面上就出现了气压差',
      '气压差有方向：从高压指向低压，这个力垂直于等压线',
      '气压差是风存在的直接原因：没有气压差就没有风',
      '所以这一环是全链的枢纽——前面的冷热不均、后面的风都挂在这里',
    ],
  },
  'chain-wind': {
    name: '风',
    hint: '空气从高压流向低压，地面风还要被地转偏向力掰弯。',
    vars,
    steps: [
      '空气在水平气压梯度力作用下从高压流向低压，这就是风',
      '近地面有摩擦力，风斜穿等压线；高空摩擦力可忽略，风基本平行等压线',
      '北半球的气流再被地转偏向力右偏（§3 讲的），这才有了三圈环流和六风七带',
      '风的意义不只是「吹」：它把热量和水汽从一处搬到另一处',
    ],
  },
  'chain-transport': {
    name: '风输送水汽和热量',
    hint: '这一环是承上启下的落点，也是大题过程分所在。',
    vars,
    steps: [
      '风是搬运工：把低纬的热量和高纬的冷量对调',
      '有了风，水汽才能从海洋搬到陆地——这就是水循环里的「水汽输送」（§11.3）',
      '大题得分点常常就在这一层：风输送水汽和热量 → 影响气候',
      '只写「受海陆热力差异影响，为夏季」而跳过这一层，过程分就丢了',
    ],
  },
  'chain-climate': {
    name: '影响一个区域的气候和天气',
    hint: '链子的终点：一个区域的天气和气候由前面几环决定。',
    vars,
    steps: [
      '链子走完：一个区域的气候和天气被前面几环决定',
      '天气是短时间的（这一场冷空气），气候是长期平均的结果',
      '所以答题必须写出「通过什么机制影响」——也就是把中间几环写出来',
      '三圈环流定大尺度格局，季风环流和海陆位置是区域修正，地形再叠加一层',
    ],
  },
  assumption: {
    name: '层层假设、层层加 Buff',
    hint: '研究方法本身：先只考虑一个因素，再逐个加上去。',
    vars,
    steps: [
      '方法：先只考虑一个因素，得出最简单的结果，再逐个加因素',
      '第一层只考虑热力因素 → 单圈环流（§7.3）',
      '加上地转偏向力（§3）→ 三圈环流 ＋ 六风七带（§7.5 – §7.9）',
      '加上太阳直射点的季节移动（§4）→ 气压带风带的季节性移动（§7.10）',
      '再加上海陆分布差异 → 季风环流（§7.11 – §7.17）',
      '每加一个因素就多出一处偏差要解释——那个偏差就是下一个因素的名字',
      '这 {buffCount} 节就是这一层层加 Buff 换来的结果',
    ],
  },
}
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
