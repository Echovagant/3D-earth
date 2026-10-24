/**
 * §11.3 水循环环的几何。
 *
 * 讲义里的海陆间循环是六个环节：海洋水蒸发 → 水汽输送 → 陆地降水 →
 * 地表径流 / 下渗 → 地下径流 → 汇入海洋。
 *
 * 每个环节都是一条**有方向**的线，方向画反等于把水循环讲反，所以
 * 端点、方向和「人类活动改了哪些环节」都放在这里，组件只负责画。
 */

/** 画布尺寸（与 DemoShell 的 viewBox 一致） */
export const CANVAS = { width: 720, height: 380 }

/** 剖面底盘：海面、陆地表面、地下、海洋与陆地的横向范围 */
export const STAGE = {
  seaSurfaceY: 258,
  landSurfaceY: 244,
  bottomY: 322,
  oceanLeft: 40,
  oceanRight: 300,
  landLeft: 300,
  landRight: 688,
}

/**
 * 六个环节的起点、终点与名称。
 *
 * 方向约定：海洋在**左**，陆地在**右**。
 *   蒸发向上、水汽输送向右（海→陆）、降水向下、
 *   地表径流与地下径流向左（陆→海）、下渗向下。
 */
export const CYCLE_LINKS = [
  {
    id: 'evaporation',
    label: '蒸发',
    from: { x: 120, y: 258 },
    to: { x: 120, y: 132 },
    labelX: 134,
    labelY: 200,
    labelAnchor: 'start',
  },
  {
    id: 'transport',
    label: '水汽输送',
    from: { x: 132, y: 132 },
    to: { x: 560, y: 132 },
    labelX: 346,
    labelY: 122,
    labelAnchor: 'middle',
  },
  {
    id: 'precipitation',
    label: '降水',
    from: { x: 560, y: 142 },
    to: { x: 560, y: 238 },
    labelX: 574,
    labelY: 190,
    labelAnchor: 'start',
  },
  {
    id: 'surface-runoff',
    label: '地表径流',
    from: { x: 430, y: 240 },
    to: { x: 306, y: 240 },
    labelX: 390,
    labelY: 230,
    labelAnchor: 'middle',
  },
  {
    id: 'infiltration',
    label: '下渗',
    from: { x: 624, y: 248 },
    to: { x: 624, y: 288 },
    labelX: 636,
    labelY: 272,
    labelAnchor: 'start',
  },
  {
    id: 'groundwater-runoff',
    label: '地下径流',
    from: { x: 624, y: 302 },
    to: { x: 308, y: 302 },
    labelX: 470,
    labelY: 294,
    labelAnchor: 'middle',
  },
]

/**
 * 水循环的四层意义（讲义：考点不多，但要点全）。
 * `links` 指向第一步图上对应的环节。
 */
export const MEANINGS = [
  {
    id: 'freshwater',
    title: '使陆地水体不断更新',
    text: '陆地上的水本来就少，靠海陆间循环不断“换新”。',
    links: ['precipitation', 'surface-runoff'],
  },
  {
    id: 'landform',
    title: '塑造地表形态',
    text: '地表径流在流动中侵蚀、搬运、堆积地貌。',
    links: ['surface-runoff', 'infiltration'],
  },
  {
    id: 'transfer',
    title: '促进物质迁移与能量转换',
    text: '水在四大圈层之间循环搬运物质、传递能量。',
    links: ['transport'],
  },
  {
    id: 'balance',
    title: '调节水热平衡',
    text: '海洋与大气、陆地之间的水热交换让气候温和。',
    links: ['evaporation'],
  },
]

/**
 * 人类活动能影响哪些环节（讲义：先看“能不能影响”）。
 * ✅ 能影响 / ❌ 基本不能 / △ 影响很小
 */
export const AFFORDABLE = [
  { link: '蒸发', mark: '✅', note: '植被：蒸腾量与覆盖度成正比' },
  { link: '水汽输送', mark: '❌', note: '人推不动云，基本做不到' },
  { link: '降水', mark: '△', note: '人工降雨条件苛刻，对自然降水影响很小' },
  { link: '地表径流', mark: '✅✅', note: '水库、跨流域调水、围湖造田' },
  { link: '地下径流', mark: '✅', note: '跟着下渗一起变' },
  { link: '下渗', mark: '✅✅', note: '地面硬化、植被覆盖' },
]

/**
 * 三种人类活动各自改动了哪些环节。
 * dir：up = 增加，down = 减少，regulate = 重新分配（丰枯调节）
 */
export const HUMAN_IMPACTS = [
  {
    id: 'afforestation',
    title: '植树造林',
    note: '涵养水源、减缓地表径流',
    changes: [
      { link: '下渗', dir: 'up' },
      { link: '地表径流', dir: 'down' },
      { link: '蒸发（蒸腾）', dir: 'up' },
    ],
  },
  {
    id: 'reservoir',
    title: '兴修水库',
    note: '丰水期蓄水、枯水期放水',
    changes: [
      { link: '地表径流', dir: 'regulate' },
      { link: '库区地下水位', dir: 'up' },
    ],
  },
  {
    id: 'urbanization',
    title: '城市化',
    note: '地面硬化，不透水',
    changes: [
      { link: '下渗', dir: 'down' },
      { link: '地表径流', dir: 'up' },
      { link: '地下径流', dir: 'down' },
    ],
  },
]

/**
 * 万能公式：下渗 ↑ → 地下径流 ↑ → 地表径流 ↓（反之亦然）。
 */
export const UNIVERSAL_RULE = {
  up: [
    { link: '下渗', dir: 'up' },
    { link: '地下径流', dir: 'up' },
    { link: '地表径流', dir: 'down' },
  ],
  down: [
    { link: '下渗', dir: 'down' },
    { link: '地下径流', dir: 'down' },
    { link: '地表径流', dir: 'up' },
  ],
}

/** 方向的显示符号 */
export const DIR_MARK = { up: '↑', down: '↓', regulate: '⇅' }

/**
 * 从 (x1, y1) 到 (x2, y2) 的方向角。
 * 0° 向右，90° 向上，逆时针为正——与 svgParts 的 arrowHead 一致。
 */
export function directionAngle(x1, y1, x2, y2) {
  return (Math.atan2(-(y2 - y1), x2 - x1) * 180) / Math.PI
}

/** 取某个环节的连线 */
export function linkById(id) {
  return CYCLE_LINKS.find((l) => l.id === id)
}
