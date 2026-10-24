/**
 * §11.6 陆地水体相互转化的逻辑图。
 *
 * 讲义的总原则只有一条：**两个水体只要连通，水位高的补给水位低的**。
 * 所以图里凡是「红色箭头」= 双向补给的，都是两个方向都能走，
 * 方向随汛期 / 枯水期切换——单向箭头才是固定方向。
 *
 * 节点位置与连线方向都在这里，组件只负责画。
 */

/**
 * 图上各个水体节点（画布坐标，节点方框以该点为中心）。
 *
 * 摆位有一条硬规矩：**图上不许出现交叉**——线一交叉，
 * 「河流 → 海洋」那条斜线就会在「季节性积雪 → 冰川」那条竖线上断开，
 * 学生会把两条线读成一条。所以雪线整列放在最右边，
 * 冰雪融水那条回路线绕到画面下缘再从下面上来，直接插进河流的底边。
 */
export const NODES = {
  precipitation: { label: '大气降水', x: 330, y: 28 },
  rain: { label: '雨', x: 150, y: 92 },
  snow: { label: '雪', x: 620, y: 92 },
  evaporation: { label: '蒸发·蒸腾', x: 50, y: 168 },
  river: { label: '河流（地表径流）', x: 300, y: 168 },
  snowpack: { label: '季节性积雪', x: 620, y: 168 },
  marsh: { label: '沼泽', x: 45, y: 256 },
  groundwater: { label: '地下水', x: 110, y: 256 },
  lake: { label: '湖泊', x: 200, y: 256 },
  ocean: { label: '海洋', x: 500, y: 256 },
  glacier: { label: '冰川', x: 620, y: 256 },
}

/**
 * 逻辑图上的连线。
 *
 * both = true 表示双向补给（讲义里的「红色箭头」）。
 * a / b 是连线端点，贴着方框边缘，不压住文字。
 * via = 'bottom' 表示这条线先绕到画面下缘再接上，避免直线穿过别的节点。
 */
export const LINKS = [
  {
    id: 'precip-rain',
    from: 'precipitation',
    to: 'rain',
    a: { x: 312, y: 41 },
    b: { x: 165, y: 79 },
  },
  {
    id: 'precip-snow',
    from: 'precipitation',
    to: 'snow',
    a: { x: 348, y: 41 },
    b: { x: 605, y: 79 },
  },
  {
    id: 'rain-evaporation',
    from: 'rain',
    to: 'evaporation',
    a: { x: 145, y: 105 },
    b: { x: 62, y: 155 },
    label: '直接蒸发',
  },
  {
    id: 'rain-river',
    from: 'rain',
    to: 'river',
    a: { x: 160, y: 105 },
    b: { x: 280, y: 155 },
    label: '地表径流',
  },
  {
    id: 'rain-groundwater',
    from: 'rain',
    to: 'groundwater',
    a: { x: 152, y: 105 },
    b: { x: 116, y: 243 },
    label: '下渗',
  },
  { id: 'rain-marsh', from: 'rain', to: 'marsh', a: { x: 138, y: 105 }, b: { x: 50, y: 243 } },
  {
    id: 'snow-snowpack',
    from: 'snow',
    to: 'snowpack',
    a: { x: 620, y: 105 },
    b: { x: 620, y: 155 },
  },
  {
    id: 'snowpack-glacier',
    from: 'snowpack',
    to: 'glacier',
    a: { x: 620, y: 181 },
    b: { x: 620, y: 243 },
    label: '永久积雪',
  },
  {
    id: 'glacier-river',
    from: 'glacier',
    to: 'river',
    via: 'bottom',
    label: '夏季消融',
  },
  { id: 'river-groundwater', from: 'river', to: 'groundwater', both: true },
  { id: 'river-lake', from: 'river', to: 'lake', both: true },
  { id: 'lake-groundwater', from: 'lake', to: 'groundwater', both: true },
  {
    id: 'river-ocean',
    from: 'river',
    to: 'ocean',
    a: { x: 326, y: 182 },
    b: { x: 478, y: 243 },
    label: '外流河',
  },
  {
    id: 'ocean-precipitation',
    from: 'ocean',
    to: 'precipitation',
    a: { x: 500, y: 243 },
    b: { x: 352, y: 44 },
    label: '蒸发 → 水汽输送',
  },
]

/** 铁三角：河流、湖泊、地下水三者两两之间都存在双向补给 */
export const IRON_TRIANGLE = ['river', 'lake', 'groundwater']

/** 湖泊的两种：判据是「有没有出湖径流」，不是咸淡 */
export const LAKE_KINDS = [
  {
    id: 'outflow',
    label: '外流湖',
    mark: '有进有出',
    salt: '多为淡水湖',
    role: '对河流起“调蓄”作用，像银行的“存钱”“取钱”',
  },
  {
    id: 'inflow',
    label: '内流湖',
    mark: '有进无出',
    salt: '多为咸水湖',
    role: '水进得来出不去，盐分越积越浓',
  },
]

/** 汛期 / 枯水期切换：补给方向跟着水位走 */
export const SEASON_SWITCH = [
  {
    id: 'flood',
    label: '汛期',
    state: '河流水位 > 地下水位',
    result: '河流补给地下水',
  },
  {
    id: 'low',
    label: '枯水期',
    state: '地下水位 > 河流水位',
    result: '地下水补给河流',
  },
]

/**
 * 从 (x1, y1) 到 (x2, y2) 的方向角。
 * 0° 向右，90° 向上，逆时针为正——与 svgParts 的 arrowHead 一致。
 */
export function directionAngle(x1, y1, x2, y2) {
  return (Math.atan2(-(y2 - y1), x2 - x1) * 180) / Math.PI
}

/** 取某个节点 */
export function node(id) {
  const n = NODES[id]
  if (!n) throw new Error(`陆地水体逻辑图里没有节点：${id}`)
  return n
}

/** 某对水体之间是不是双向补给 */
export function isBidirectional(a, b) {
  return LINKS.some(
    (l) => l.both && ((l.from === a && l.to === b) || (l.from === b && l.to === a)),
  )
}
