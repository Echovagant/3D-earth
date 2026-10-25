/**
 * §15.10 中国地图速记方法：用《蜜雪冰城》把中国地图唱进脑子。
 *
 * 方法：先在脑子里搭一张经纬网骨架（**6 条经线 + 6 条纬线**），
 * 再把地理事物**钉在交点上**。
 *
 * 骨架（讲义原文）：
 *   · 6 条经线：东经 80°、90°、100°、110°、120°、130°
 *   · 6 条纬线：北纬 20°、30°、40°、50° + 北回归线 + 北纬 34°
 *
 * 钉点也逐字取自讲义：北纬 20°/东经 110° 是海口；北纬 30°/东经 90° 是拉萨；
 * 北纬 34°/东经 110° 是秦岭；北纬 40°/东经 116° 是北京……
 * 讲义里没有给经纬度的（如广东、武汉、乌鲁木齐以外的条带），就只写位置不编数字。
 */

/** 骨架的 6 条经线（东经） */
export const MERIDIANS = [80, 90, 100, 110, 120, 130]

/** 骨架的 6 条纬线，由北向南 */
export const PARALLELS = [
  { lat: 50, label: '北纬 50°' },
  { lat: 40, label: '北纬 40°' },
  { lat: 34, label: '北纬 34°' },
  { lat: 30, label: '北纬 30°' },
  { lat: 23.5, label: '北回归线' },
  { lat: 20, label: '北纬 20°' },
]

/**
 * 讲义「每条纬线上的交点事物」表，逐行照抄。
 *
 * kind = 'point' 有确切经纬度的钉点；
 * kind = 'band'  讲义只给了区间的（长江中游 ω 形、桂台之间的广东）。
 */
export const ANCHOR_ROWS = [
  {
    lat: 20,
    label: '北纬 20°',
    items: [{ kind: 'point', lon: 110, name: '海口', note: '海南海口在海里' }],
  },
  {
    lat: 23.5,
    label: '北回归线',
    items: [
      { kind: 'point', lon: 100, name: '云南' },
      { kind: 'point', lon: 110, name: '广西' },
      { kind: 'point', lon: 120, name: '台湾' },
      { kind: 'band', lon: 115, name: '广东', note: '桂台中间是广东' },
    ],
  },
  {
    lat: 30,
    label: '北纬 30°',
    items: [
      { kind: 'point', lon: 90, name: '拉萨', note: '日光城' },
      { kind: 'point', lon: 100, name: '横断山脉', note: '往东四川盆地，往西青藏高原' },
      { kind: 'point', lon: 105, name: '成都' },
      { kind: 'point', lon: 107, name: '重庆', note: '山城' },
      { kind: 'point', lon: 110, name: '巫山', note: '二三阶梯交界处' },
      { kind: 'point', lon: 120, name: '杭州', note: '长江下游' },
      {
        kind: 'band',
        lon: 115,
        name: '长江中下游',
        note: '东经 110°–120° 之间呈 ω 形 → 武汉；鄱阳湖（第一大淡水湖）、洞庭湖（第二大淡水湖）→ 鱼米之乡',
      },
    ],
  },
  {
    lat: 34,
    label: '北纬 34°',
    items: [{ kind: 'point', lon: 110, name: '秦岭', note: '东西走向，划分中国南北' }],
  },
  {
    lat: 40,
    label: '北纬 40°',
    items: [
      { kind: 'point', lon: 90, name: '塔里木盆地', note: '东部' },
      { kind: 'point', lon: 100, name: '祁连山 + 河西走廊' },
      { kind: 'point', lon: 110, name: '黄河几字弯', note: '东侧' },
      { kind: 'point', lon: 116, name: '北京', note: '首都' },
    ],
  },
  {
    lat: 50,
    label: '北纬 50°',
    items: [
      { kind: 'point', lon: 90, name: '阿尔泰山地', note: '西北—东南走向' },
      { kind: 'point', lon: 120, name: '大兴安岭', note: '东北—西南走向' },
    ],
  },
]

/** 讲义另外单说的一个点：不在骨架经线上 */
export const EXTRA_POINT = { lat: 44, lon: 88, name: '乌鲁木齐', note: '天山脚下（4488）' }

/** 范围锚点（讲义：先定位） */
export const EXTENT = [
  { text: '最西 东经 73° 帕米尔高原' },
  { text: '最东 东经 135°' },
  { text: '最北 北纬 53° 漠河' },
  { text: '最南 约北纬 4° 曾母暗沙' },
]

/** 四至的经纬度范围（数值版：从 EXTENT 的文字里拆出来的） */
export const EXTENT_BOUNDS = { lonMin: 73, lonMax: 135, latMin: 4, latMax: 53 }

/**
 * 骨架的比例：图上 1° 经度、1° 纬度各占多少像素。
 *
 * 有了它，「两条线之间差几度」才能换算成「图上隔多远」。
 */
export function gridScale(box, lonMin, lonMax, latMin, latMax) {
  return {
    xPerDeg: (box.right - box.left) / (lonMax - lonMin),
    yPerDeg: (box.bottom - box.top) / (latMax - latMin),
  }
}

/**
 * 骨架四条边与四至之间的缺口（度）。
 *
 * 缺口是负数说明骨架已经越过了四至，正数说明还差一截——
 * 靠这张表能说清「骨架覆盖的是主体，边界得靠四至补」。
 */
export function skeletonGaps(meridians, parallels, bounds = EXTENT_BOUNDS) {
  const lats = parallels.map((p) => p.lat)
  return {
    west: Math.min(...meridians) - bounds.lonMin,
    east: bounds.lonMax - Math.max(...meridians),
    north: bounds.latMax - Math.max(...lats),
    south: Math.min(...lats) - bounds.latMin,
  }
}

/**
 * 一个数落在哪两条骨架线之间、偏了多少（0 = 贴着低的那条，1 = 贴着高的那条）。
 *
 * 不在骨架线上的点只能这样估——「在 80° 与 90° 之间偏东八成」。
 */
export function bracketPosition(value, list) {
  const sorted = [...list].sort((a, b) => a - b)
  for (let i = 0; i < sorted.length - 1; i += 1) {
    if (value >= sorted[i] && value <= sorted[i + 1]) {
      return {
        low: sorted[i],
        high: sorted[i + 1],
        t: (value - sorted[i]) / (sorted[i + 1] - sorted[i]),
      }
    }
  }
  return null
}

/** 骨架上一共钉了多少个点、多少段区间 */
export function anchorCount(rows) {
  let points = 0
  let bands = 0
  for (const row of rows) {
    for (const item of row.items) {
      if (item.kind === 'point') points += 1
      else bands += 1
    }
  }
  return { points, bands, total: points + bands }
}

/**
 * 骨架的投影：经度 → x、纬度 → y（线性）。
 *
 * 经度范围比骨架宽一点，好让 88°、105°、107°、116° 这些不在骨架线上的
 * 点也能落在图里。
 *
 * @param {object} box { left, right, top, bottom }
 * @param {number} lonMin 图上最西的经度
 * @param {number} lonMax 图上最东的经度
 * @param {number} latMin 图上最南的纬度
 * @param {number} latMax 图上最北的纬度
 */
export function gridProjection(box, lonMin, lonMax, latMin, latMax) {
  return {
    x: (lon) => box.left + ((lon - lonMin) / (lonMax - lonMin)) * (box.right - box.left),
    y: (lat) => box.top + ((latMax - lat) / (latMax - latMin)) * (box.bottom - box.top),
  }
}

/**
 * 展开某个纬线上的钉点，返回带画布坐标的列表。
 *
 * @param {object} project gridProjection 的结果
 * @param {object} row ANCHOR_ROWS 里的一行
 */
export function rowAnchors(project, row) {
  return row.items.map((item) => ({
    ...item,
    x: project.x(item.lon),
    y: project.y(row.lat),
    lat: row.lat,
  }))
}

/**
 * 取某个纬度区间内的所有钉点（按纬度分组）。
 *
 * @param {object} project gridProjection 的结果
 * @param {number} latMin
 * @param {number} latMax
 */
export function anchorsInBand(project, latMin, latMax) {
  return ANCHOR_ROWS.filter((r) => r.lat >= latMin && r.lat <= latMax).map((row) => ({
    row,
    items: rowAnchors(project, row),
  }))
}
