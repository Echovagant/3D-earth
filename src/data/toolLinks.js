/**
 * 知识点 ↔ 互动实验的双向映射。
 *
 * 这是这条互链唯一的真相源：
 *   知识点页（/lesson/:lessonId）的入口文案从这里取；
 *   实验页（/tools/*）的「相关提纲」区块也从这里派生。
 *
 * kind 决定入口文案的强弱：
 *   drill  —— 这个实验直接教这一节，入口写「动手练：X」；
 *   chapter —— 这一节属于该实验所在章，但实验不直接教它，入口写「本章实验：X」。
 *
 * drill 的划分沿用 src/data/toolSources.js 里人工策展的 sections：
 * 那是「这个实验到底教哪几节」的结论，这里不另做判断。
 *
 * 章级（chapter）只给那些「实验确实属于这一章」的节挂弱链接：
 * §2 的经纬网与 3S、§15 的区域地理通论都没有对应的实验，就不挂。
 */

/** 每个实验：路由与中文短名（入口文案用） */
export const TOOLS = {
  contour: { to: '/tools/contour', name: '等高线判读' },
  terminator: { to: '/tools/terminator', name: '太阳高度角与晨昏线' },
  'pressure-belt': { to: '/tools/pressure-belt', name: '气压带与风带' },
  'ocean-current': { to: '/tools/ocean-current', name: '洋流判读' },
  'province-shape': { to: '/tools/province-shape', name: '轮廓形象记忆' },
  'province-abbrev': { to: '/tools/province-abbrev', name: '省会简称全表' },
}

/**
 * 映射表本体：工具 × 强弱 × 小节。
 *
 * 一行 = 一个实验在一种关联强度下覆盖的小节；
 * 展开后是 LESSON_TOOLS（知识点 id → 入口）。
 */
const LINKS = [
  {
    tool: 'contour',
    kind: 'drill',
    ids: ['2.19', '2.20', '2.21', '2.22', '2.23', '2.24', '2.25'],
  },
  {
    tool: 'terminator',
    kind: 'drill',
    ids: ['3.6', '3.19', '3.20', '4.4'],
  },
  {
    tool: 'pressure-belt',
    kind: 'drill',
    ids: ['7.4', '7.5', '7.6', '7.7', '7.8', '7.9', '7.10', '7.18'],
  },
  {
    tool: 'ocean-current',
    kind: 'drill',
    ids: ['11.11', '11.12', '11.13', '11.14'],
  },
  {
    tool: 'province-shape',
    kind: 'drill',
    ids: ['15.8'],
  },
  {
    tool: 'province-abbrev',
    kind: 'drill',
    ids: ['15.9'],
  },
  {
    tool: 'terminator',
    kind: 'chapter',
    ids: [
      '3.1', '3.2', '3.3', '3.4', '3.5',
      '3.7', '3.8', '3.9', '3.10',
      '3.11', '3.12', '3.13', '3.14', '3.15', '3.16', '3.17', '3.18',
      '4.1', '4.2', '4.3', '4.5', '4.6',
    ],
  },
  {
    tool: 'pressure-belt',
    kind: 'chapter',
    ids: ['7.1', '7.2', '7.3', '7.11', '7.12', '7.13', '7.14', '7.15', '7.16', '7.17', '7.19'],
  },
  {
    tool: 'ocean-current',
    kind: 'chapter',
    ids: ['11.1', '11.2', '11.3', '11.4', '11.5', '11.6', '11.7', '11.8', '11.9', '11.10', '11.15', '11.16', '11.17'],
  },
]

/** 小节号按「章 → 节」排序：3.2 要排在 3.10 前面 */
function compareIds(a, b) {
  const [ac, as] = a.split('.').map(Number)
  const [bc, bs] = b.split('.').map(Number)
  return ac - bc || as - bs
}

/** 知识点 id → 入口：{ to, name, kind } */
export const LESSON_TOOLS = Object.fromEntries(
  LINKS.flatMap((link) => {
    const { to, name } = TOOLS[link.tool]
    return link.ids.map((id) => [id, { to, name, kind: link.kind }])
  }),
)

/**
 * 实验路由 → 它涉及的章号（按知识点 id 的章号去重排序）。
 *
 * 取的是「这个实验出现在哪几章」，实验页据此决定要加载哪几章的数据。
 */
export const TOOL_CHAPTERS = (() => {
  const chapters = new Map()
  for (const [id, link] of Object.entries(LESSON_TOOLS)) {
    const chapter = Number(id.split('.')[0])
    if (!chapters.has(link.to)) chapters.set(link.to, new Set())
    chapters.get(link.to).add(chapter)
  }
  return Object.fromEntries(
    [...chapters.entries()].map(([to, set]) => [to, [...set].sort((a, b) => a - b)]),
  )
})()

/**
 * 实验路由 → 它直接教的小节（只取 kind === 'drill'）。
 *
 * 实验页的「相关提纲」只列这些节：章级关联只是「同一章」，
 * 挂出来会让人以为那个实验在教这一节。
 */
export const TOOL_DRILL_IDS = (() => {
  const ids = new Map()
  for (const [id, link] of Object.entries(LESSON_TOOLS)) {
    if (link.kind !== 'drill') continue
    if (!ids.has(link.to)) ids.set(link.to, [])
    ids.get(link.to).push(id)
  }
  return Object.fromEntries(
    [...ids.entries()].map(([to, list]) => [to, [...list].sort(compareIds)]),
  )
})()
