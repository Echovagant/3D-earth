<template>
  <DemoShell :steps="steps">
    <template #default="{ step }">
      <!-- ① 海陆间循环的六个环节 -->
      <g v-show="step === 0" class="demo__frame">
        <!-- 海洋与陆地 -->
        <path
          class="wi-sea"
          :d="`M ${STAGE.oceanLeft} ${STAGE.seaSurfaceY} L ${STAGE.oceanRight} ${STAGE.seaSurfaceY} L ${STAGE.oceanRight} ${STAGE.bottomY} L ${STAGE.oceanLeft} ${STAGE.bottomY} Z`"
        />
        <path
          class="wi-ground"
          :d="`M ${STAGE.landLeft} ${STAGE.landSurfaceY} L ${STAGE.landRight} ${STAGE.landSurfaceY} L ${STAGE.landRight} ${STAGE.bottomY} L ${STAGE.landLeft} ${STAGE.bottomY} Z`"
        />

        <!-- 六个环节 -->
        <g v-for="link in links" :key="link.id">
          <path class="wi-flow" :d="link.d" />
          <path class="wi-head" :d="link.head" />
          <text
            class="demo__label demo__label--mark"
            :x="link.labelX"
            :y="link.labelY"
            :text-anchor="link.labelAnchor"
          >
            {{ link.label }}
          </text>
        </g>

        <text class="demo__label" x="170" y="300" text-anchor="middle">海洋</text>
        <text class="demo__label" x="676" y="314" text-anchor="end">陆地</text>
        <text class="demo__caption-line" x="360" y="42" text-anchor="middle">
          海陆间循环：六个环节，水从海洋出发又回到海洋
        </text>
      </g>

      <!-- ② 水循环的四层意义 -->
      <g v-show="step === 1" class="demo__frame">
        <g v-for="m in meanings" :key="m.id">
          <rect class="wi-card" :x="m.x" :y="m.y" width="320" height="96" rx="8" />
          <text class="demo__label demo__label--mark" :x="m.x + 18" :y="m.y + 30">
            {{ m.title }}
          </text>
          <text class="demo__label demo__label--faint" :x="m.x + 18" :y="m.y + 54">
            {{ m.text }}
          </text>
          <text class="demo__label demo__label--faint" :x="m.x + 18" :y="m.y + 78">
            涉及环节：{{ m.linkText }}
          </text>
        </g>
        <text class="demo__caption-line" x="360" y="308" text-anchor="middle">
          地球有了水循环，陆地有水不旱涝，塑造地表特有形态，物能迁移和循环
        </text>
        <text class="demo__label demo__label--faint" x="360" y="334" text-anchor="middle">
          （老师的口诀，意义部分考点不多，知道有这四层就够）
        </text>
      </g>

      <!-- ③ 人类活动改了哪些环节 -->
      <g v-show="step === 2" class="demo__frame">
        <g v-for="a in impacts" :key="a.id">
          <rect class="wi-card wi-card--head" :x="a.x" y="52" width="200" height="66" rx="8" />
          <text class="demo__label demo__label--mark" :x="a.x + 100" y="80" text-anchor="middle">
            {{ a.title }}
          </text>
          <text class="demo__label demo__label--faint" :x="a.x + 100" y="102" text-anchor="middle">
            {{ a.note }}
          </text>
          <text
            v-for="(c, i) in a.changes"
            :key="c.link"
            class="demo__label"
            :x="a.x + 100"
            :y="150 + i * 30"
            text-anchor="middle"
          >
            {{ c.link }}
            <tspan class="demo__label--mark">{{ dirMark(c.dir) }}</tspan>
          </text>
        </g>

        <path class="wi-rule" d="M 30 262 L 690 262" />
        <text class="demo__label demo__label--faint" x="30" y="286">
          能影响的环节：蒸发 ✅ · 地表径流 ✅✅ · 地下径流 ✅ · 下渗 ✅✅
        </text>
        <text class="demo__label demo__label--faint" x="30" y="308">
          基本影响不了：水汽输送 ❌ · 自然降水 △（人工降雨不常见）
        </text>
        <text class="demo__label demo__label--mark" x="30" y="340">
          「植树导致降水增加」这类说法，一律判错
        </text>
      </g>

      <!-- ④ 万能公式 -->
      <g v-show="step === 3" class="demo__frame">
        <g v-for="row in ruleRows" :key="row.id">
          <text class="demo__label demo__label--mark" :x="70" :y="row.titleY" text-anchor="start">
            {{ row.title }}
          </text>
          <g v-for="(item, i) in row.items" :key="item.link">
            <rect class="wi-box" :x="row.boxes[i].x" :y="row.boxY" width="140" height="52" rx="8" />
            <text class="demo__label" :x="row.boxes[i].x + 70" :y="row.boxY + 33" text-anchor="middle">
              {{ item.link }}
            </text>
            <text
              class="demo__label demo__label--mark"
              :x="row.boxes[i].x + 70"
              :y="row.boxY + 51"
              text-anchor="middle"
            >
              {{ dirMark(item.dir) }}
            </text>
            <path v-if="i < row.items.length - 1" class="wi-flow" :d="row.arrows[i]" />
            <path v-if="i < row.items.length - 1" class="wi-head" :d="row.heads[i]" />
          </g>
        </g>
        <text class="demo__caption-line" x="360" y="300" text-anchor="middle">
          万能公式：下渗 ↑ → 地下径流 ↑ → 地表径流 ↓（反之亦然）
        </text>
        <text class="demo__label demo__label--faint" x="360" y="330" text-anchor="middle">
          降水落到地表只有两个去向：顺着地表流走，或者下渗到地下
        </text>
      </g>
    </template>
  </DemoShell>
</template>

<script setup>
/**
 * §11.3 水循环的意义与人类活动对水循环的影响。
 *
 * 老师讲这节的落点只有一句：「关于水循环，90% 的题做在人类活动上」。
 * 所以这张图要补的是两幅画：
 *   ① 海陆间循环那六个环节（会画图是考点），
 *   ② 人类活动把哪条线改了、改的方向。
 *
 * 六个环节的起止点与方向都算好放在 waterCycleImpactGeometry.js 里——
 * 海洋在左、陆地在右，蒸发向上、降水向下、径流回海向左，方向不能画反。
 */
import { computed } from 'vue'
import DemoShell from '../DemoShell.vue'
import { arrowHead } from '../../data/svgParts'
import {
  CYCLE_LINKS,
  DIR_MARK,
  HUMAN_IMPACTS,
  MEANINGS,
  STAGE,
  UNIVERSAL_RULE,
  directionAngle,
} from '../../data/waterCycleImpactGeometry'

const steps = [
  {
    id: 'cycle',
    title: '① 海陆间循环：六个环节',
    text: '海洋水蒸发上升，水汽输送到陆地，凝结成云降下来；一部分顺着地表流回海，一部分渗进土里变成地下径流再流回海——这就是海陆间循环，环节最多、考点最密。记住方向：蒸发向上、降水向下、径流回海。',
  },
  {
    id: 'meaning',
    title: '② 水循环的四个意义',
    text: '意义有四层：使陆地水体不断更新、塑造地表形态、促进物质迁移与能量转换、调节水热平衡。这部分考点不多，老师「简单捣鼓一下」就过，知道有这四层、能把口诀念出来就行。',
  },
  {
    id: 'human',
    title: '③ 人类活动改了哪些环节',
    text: '先看能不能影响：蒸发能（下垫面是植被）、地表径流影响最多、下渗影响最多；水汽输送人推不动云，自然降水也影响不了。植树造林让下渗增加、地表径流减少；兴修水库丰水期蓄水枯水期放水，库区水位抬高、地下水位上升；城市化把地面硬化，下渗减少、地表径流增加。',
  },
  {
    id: 'rule',
    title: '④ 万能公式：下渗带动另外两条线',
    text: '降水落到地表只有两个去向：顺着地表流走，或者下渗到地下。所以下渗增加，地下径流就增加、地表径流就减少；下渗减少就反过来。题目里只要出现「下渗」两个字，后面的一切都能顺着这条链推出来——城市内涝的成因也正是这条链的反过来。',
  },
]

/** 方向的显示符号 */
const dirMark = (dir) => DIR_MARK[dir]

/** 六个环节：路径、箭头尖端、标注位置 */
const links = computed(() =>
  CYCLE_LINKS.map((link) => {
    const angle = directionAngle(link.from.x, link.from.y, link.to.x, link.to.y)
    return {
      ...link,
      d: `M ${link.from.x} ${link.from.y} L ${link.to.x} ${link.to.y}`,
      head: arrowHead(link.to.x, link.to.y, angle, 13),
      labelX: link.labelX,
      labelY: link.labelY,
      labelAnchor: link.labelAnchor,
    }
  }),
)

/** 意义四层：排成 2×2 */
const meanings = computed(() => {
  const spots = [
    { x: 30, y: 52 },
    { x: 370, y: 52 },
    { x: 30, y: 164 },
    { x: 370, y: 164 },
  ]
  const linkLabels = Object.fromEntries(CYCLE_LINKS.map((l) => [l.id, l.label]))
  return MEANINGS.map((m, i) => ({
    ...m,
    x: spots[i].x,
    y: spots[i].y,
    linkText: m.links.map((id) => linkLabels[id]).join(' · '),
  }))
})

/** 三种人类活动：排成三列 */
const impacts = computed(() =>
  HUMAN_IMPACTS.map((a, i) => ({ ...a, x: 30 + i * 230 })),
)

/** 万能公式的两行对比 */
const ruleRows = computed(() => {
  const boxXs = [70, 290, 510]
  const build = (id, title, titleY, boxY, items) => {
    const boxes = boxXs.map((x) => ({ x }))
    const arrows = []
    const heads = []
    for (let i = 0; i < items.length - 1; i += 1) {
      const from = { x: boxes[i].x + 140, y: boxY + 26 }
      const to = { x: boxes[i + 1].x, y: boxY + 26 }
      arrows.push(`M ${from.x} ${from.y} L ${to.x} ${to.y}`)
      heads.push(arrowHead(to.x, to.y, directionAngle(from.x, from.y, to.x, to.y), 12))
    }
    return { id, title, titleY, boxY, items, boxes, arrows, heads }
  }
  return [
    build('more', '自然地面 / 植被覆盖：下渗多', 86, 100, UNIVERSAL_RULE.up),
    build('less', '城市硬化地面：下渗少', 190, 204, UNIVERSAL_RULE.down),
  ]
})
</script>

<style scoped>
/* 只用共享层已有的变量，不新增色值 */
.wi-sea {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-line);
  stroke-width: 1;
}

.wi-ground {
  fill: var(--learn-day);
  stroke: var(--learn-day-edge);
  stroke-width: 1;
}

.wi-flow {
  fill: none;
  stroke: var(--learn-accent);
  stroke-width: 2.5;
  stroke-linecap: round;
}

.wi-head {
  fill: var(--learn-accent);
}

.wi-card {
  fill: var(--learn-panel);
  stroke: var(--learn-line);
  stroke-width: 1;
}

.wi-card--head {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-accent);
  stroke-width: 1;
}

.wi-box {
  fill: var(--learn-accent-soft);
  stroke: var(--learn-accent);
  stroke-width: 1;
}

.wi-rule {
  fill: none;
  stroke: var(--learn-line);
  stroke-width: 1;
}
</style>
