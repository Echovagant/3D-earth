<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- ① 简化的气压图 + 问句 -->
      <g v-show="step === 0" class="demo__frame">
        <rect class="demo-map" x="96" y="64" width="286" height="232" rx="6" />
        <path class="demo-land" d="M 118 120 Q 172 96 214 128 Q 238 168 208 212 Q 162 242 128 214 Q 104 168 118 120 Z" />
        <ellipse class="demo-isobar" cx="160" cy="176" rx="46" ry="36" />
        <ellipse class="demo-isobar" cx="160" cy="176" rx="26" ry="20" />
        <text class="demo__label demo__label--mark" x="160" y="182" text-anchor="middle">低</text>
        <text class="demo__label demo__label--faint" x="160" y="152" text-anchor="middle">1005 hPa</text>
        <text class="demo__label demo__label--mark" x="160" y="252" text-anchor="middle">印度低压</text>

        <ellipse class="demo-isobar" cx="308" cy="124" rx="44" ry="32" />
        <ellipse class="demo-isobar" cx="308" cy="124" rx="24" ry="17" />
        <text class="demo__label demo__label--mark" x="308" y="130" text-anchor="middle">高</text>
        <text class="demo__label demo__label--faint" x="308" y="96" text-anchor="middle">1020 hPa</text>
        <text class="demo__label demo__label--mark" x="308" y="252" text-anchor="middle">夏威夷高压</text>
        <text class="demo__label demo__label--faint" x="239" y="288" text-anchor="middle">
          示意图，不按比例
        </text>

        <text class="demo__label demo__label--mark" x="410" y="78">问：读气压分布图，判断此时是</text>
        <text class="demo__label demo__label--mark" x="410" y="100">北半球的哪个季节？</text>
        <text class="demo__label demo__label--faint" x="410" y="126">真题题型：给等压线图判季节</text>
        <g v-for="(m, i) in method" :key="m.text">
          <circle class="demo__cut" cx="420" :cy="160 + i * 34" r="9" />
          <text class="demo__label demo__label--light" x="420" :y="164 + i * 34" text-anchor="middle">
            {{ i + 1 }}
          </text>
          <text class="demo__label" x="440" :y="164 + i * 34">{{ m.text }}</text>
        </g>
        <text class="demo__label demo__label--mark" x="410" y="310">→ 7 月 · 北半球夏季</text>
      </g>

      <!-- ② 三层结构：对 → 分析 → 结论 -->
      <g v-show="step === 1" class="demo__frame">
        <g v-for="(l, i) in layers" :key="l.tag">
          <text class="demo__label demo__label--mark" x="128" :y="l.y + 22" text-anchor="end">
            {{ l.tag }}
          </text>
          <text class="demo__label demo__label--faint" x="128" :y="l.y + 42" text-anchor="end">
            {{ l.sub }}
          </text>
          <rect class="demo-layer" :class="{ 'demo-layer--key': i === 1 }" x="150" :y="l.y" width="500" height="68" rx="6" />
          <text class="demo__label" :x="166" :y="l.y + 28">{{ l.text }}</text>
          <text class="demo__label demo__label--faint" :x="166" :y="l.y + 50">{{ l.note }}</text>
          <path
            v-if="i < layers.length - 1"
            class="demo__spin"
            :d="`M 400 ${l.y + 70} L 400 ${l.y + 86}`"
          />
          <path
            v-if="i < layers.length - 1"
            class="demo__spin-head"
            :d="arrowHead(400, l.y + 88, 270, 12)"
          />
        </g>
        <text class="demo__caption-line" x="360" y="348" text-anchor="middle">
          大题通用框架：对（主题句）→ 分析（成因—过程）→ 结论
        </text>
      </g>

      <!-- ③ 分析这一层必须写出「风输送水汽与热量」 -->
      <g v-show="step === 2" class="demo__frame">
        <g v-for="(c, i) in chain" :key="c.text">
          <rect class="demo-chain" :class="{ 'demo-chain--key': c.key }" :x="c.x" y="140" :width="c.w" height="80" rx="6" />
          <text class="demo__label" :class="{ 'demo__label--mark': c.key }" :x="c.x + c.w / 2" y="172" text-anchor="middle">
            <tspan v-for="(line, k) in c.lines" :key="k" :x="c.x + c.w / 2" :dy="k === 0 ? 0 : 20">
              {{ line }}
            </tspan>
          </text>
          <path
            v-if="i < chain.length - 1"
            class="demo__spin"
            :d="`M ${c.x + c.w + 2} 180 L ${c.x + c.w + 14} 180`"
          />
          <path
            v-if="i < chain.length - 1"
            class="demo__spin-head"
            :d="arrowHead(c.x + c.w + 14, 180, 0, 11)"
          />
        </g>
        <text class="demo__caption-line" x="360" y="262" text-anchor="middle">
          「风 → 输送水汽和热量 → 影响气候」这层逻辑不写，答案就只有结论没有过程
        </text>
        <text class="demo__label demo__label--faint" x="360" y="292" text-anchor="middle">
          写风力为什么大时，动力因素（地形、下垫面摩擦力）也要一起写
        </text>
        <text class="demo__label demo__label--faint" x="360" y="316" text-anchor="middle">
          题目里的限定词（「盛行下沉气流」「向中心辐合」）常常就是采分点
        </text>
      </g>

      <!-- ④ 常见错误：只写结论 -->
      <g v-show="step === 3" class="demo__frame">
        <rect class="demo-cell demo-cell--bad" x="60" y="70" width="280" height="180" rx="8" />
        <text class="demo__label demo__label--mark" x="200" y="98" text-anchor="middle">常见错误</text>
        <text class="demo__label demo__label--faint" x="200" y="122" text-anchor="middle">只写结论就收笔</text>
        <text class="demo__label" x="80" y="156">「该地受海陆热力差异影响，</text>
        <text class="demo__label" x="80" y="178">为夏季。」</text>
        <text class="demo__label demo__label--faint" x="80" y="212">漏掉了「风输送水汽和热量」</text>
        <text class="demo__label demo__label--faint" x="80" y="234">这层过程，过程分就丢了</text>

        <rect class="demo-cell demo-cell--good" x="380" y="70" width="280" height="180" rx="8" />
        <text class="demo__label demo__label--mark" x="520" y="98" text-anchor="middle">完整写法</text>
        <text class="demo__label" x="398" y="130">对：该地 7 月受海陆热力差异影响</text>
        <text class="demo__label" x="398" y="158">分析：陆地升温快形成低压，海洋</text>
        <text class="demo__label" x="398" y="182">形成高压 → 气压梯度力 → 风 →</text>
        <text class="demo__label demo__label--mark" x="398" y="206">输送水汽和热量 → 影响气候</text>
        <text class="demo__label" x="398" y="234">结论：所以这里降水偏多、气温偏高</text>

        <text class="demo__caption-line" x="360" y="292" text-anchor="middle">
          结论、过程、结论——三层都写，才是一个完整的大题答案
        </text>
        <text class="demo__label demo__label--faint" x="360" y="320" text-anchor="middle">
          还要注意尺度：小尺度区域（河谷、岛屿、山地）必须叠加地形和局地风
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §7.19 真题演练与综合题答题框架。
 *
 * 这一节讲的是「大题怎么组织答案」，没有空间场景，
 * 缺的是「答案长什么样」的样板——所以用结构图。
 *
 * 四步：
 *   ① 简化的气压图 + 问句 —— 题型：给等压线图判季节
 *   ② 三层结构 —— 对（主题句）→ 分析（成因—过程）→ 结论
 *   ③ 分析层必须写出「风输送水汽与热量」这层
 *   ④ 常见错误 —— 只写结论
 *
 * 图与问句用的是讲义里的真题题型，不编题号、不编选项。
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { arrowHead } from '../../data/svgParts'

const steps = [
  {
    id: 'question',
    title: '① 先看图定季节',
    text: '读气压分布图判季节，四步走：找闭合中心 → 比数值定高低（中心气压越低是低压、越高是高压）→ 看位置对照已知气压中心 → 判季节。图上低压中心在北回归线以北的亚欧大陆（印度附近）、高压中心在北太平洋（夏威夷附近），就是北半球夏季，7 月。',
  },
  {
    id: 'frame',
    title: '② 大题的三层结构',
    text: '大题通用框架是：对（主题句）→ 分析（成因—过程）→ 结论。第一层先用一句话把要回答的问题答掉，第二层把中间的过程写出来，第三层把话收住。缺哪一层都会扣分，顺序也不能乱。',
  },
  {
    id: 'analysis',
    title: '③ 分析层：一定要写到「输送水汽和热量」',
    text: '全节的逻辑链是：温差 → 气压差 → 风 → 风输送水汽和热量 → 影响一个区域的气候和天气。大题只写「受海陆热力差异影响」就收笔，等于把中间这两层丢了，过程分就没了。另外，写风力为什么大时，动力因素（地形起伏、下垫面摩擦力）也要一起写。',
  },
  {
    id: 'mistake',
    title: '④ 最常见的错误：只写结论',
    text: '对照着看：左边只写了一句「受海陆热力差异影响，为夏季」，这是典型的只写结论；右边三层齐全，主题句、过程、收尾都在。注意漏掉「盛行下沉气流」「向中心辐合」这类限定性措辞——它们常常就是采分点。',
  },
]

/** ① 判季节的四步 */
const method = computed(() => [
  { text: '找闭合等压线中心' },
  { text: '比数值定高低' },
  { text: '看位置对照已知气压中心' },
  { text: '判季节' },
])

/** ② 三层结构 */
const layers = computed(() => [
  {
    tag: '对',
    sub: '主题句',
    y: 64,
    text: '该气压形势对应北半球夏季（7 月）',
    note: '先用一句话把结论说掉，别绕弯子',
  },
  {
    tag: '分析',
    sub: '成因—过程',
    y: 156,
    text: '低压中心在北回归线以北的亚欧大陆 → 陆地为热源',
    note: '高压中心在北太平洋 → 海洋为冷源 → 同纬度海洋气压低于陆地',
  },
  {
    tag: '结论',
    sub: '收尾',
    y: 248,
    text: '陆地相对热源 → 北半球夏季，对应 7 月',
    note: '把话收住，别再引入新的话题',
  },
])

/** ③ 因果链 */
const chain = computed(() => {
  const items = [
    { lines: ['地面冷热不均'], w: 116 },
    { lines: ['气压差'], w: 100 },
    { lines: ['风'], w: 88 },
    { lines: ['风输送水汽', '和热量'], w: 128, key: true },
    { lines: ['影响一个区域的', '气候和天气'], w: 132 },
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
</script>

<style scoped>
.demo-map {
  fill: var(--learn-panel);
  stroke: var(--learn-line);
  stroke-width: 1.4;
}

.demo-land {
  fill: var(--learn-line);
  fill-opacity: 0.6;
  stroke: var(--learn-ink-faint);
  stroke-width: 1.2;
}

.demo-isobar {
  fill: none;
  stroke: var(--learn-accent);
  stroke-width: 1.6;
}

.demo-layer {
  fill: var(--learn-panel);
  stroke: var(--learn-line);
  stroke-width: 1.4;
}

.demo-layer--key {
  fill: var(--learn-accent-soft);
  fill-opacity: 0.6;
  stroke: var(--learn-accent);
}

.demo-chain {
  fill: var(--learn-panel);
  stroke: var(--learn-line);
  stroke-width: 1.4;
}

.demo-chain--key {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-accent);
  stroke-width: 1.8;
}

.demo-cell {
  fill: var(--learn-panel);
  stroke: var(--learn-line);
  stroke-width: 1.4;
}

.demo-cell--bad {
  fill: var(--learn-night);
  fill-opacity: 0.08;
  stroke: var(--learn-ink-faint);
}

.demo-cell--good {
  fill: var(--learn-accent-soft);
  fill-opacity: 0.45;
  stroke: var(--learn-accent);
}

.demo__label--light {
  fill: var(--learn-panel);
}
</style>
