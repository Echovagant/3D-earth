/**
 * 高原季风的几何（§7.16）。
 *
 * 最容易错的是风向：风向指**来向**（西北风是从西北吹来）。
 * 高原面的气流是辐散，箭头指向去处，名字说的是来向——两者差 180°。
 * 这里把这条映射写成函数，图和测试都用它，免得画反。
 */

/** 箭头指向的四个方位（俯视，y 向下） */
export const TOWARD_VECTORS = {
  nw: { x: -1, y: -1 },
  ne: { x: 1, y: -1 },
  se: { x: 1, y: 1 },
  sw: { x: -1, y: 1 },
}

/** 箭头指向 → 风向名（来向） */
export function windNameFromToward(toward) {
  const opposite = { nw: 'se', ne: 'sw', se: 'nw', sw: 'ne' }
  const names = { se: '东南风', sw: '西南风', nw: '西北风', ne: '东北风' }
  return names[opposite[toward]]
}

/** 箭头指向 → 箭头角度（度，0 为正右方，逆时针为正，与 svgParts.arrowHead 一致） */
export function arrowAngle(toward) {
  const v = TOWARD_VECTORS[toward]
  return (Math.atan2(-v.y, v.x) * 180) / Math.PI
}

/**
 * 季风与高原季风辐散方向的对应关系。
 *
 * 夏季：高原面是热源 → 低压 → 辐散；其中指向西北、东北的两支，
 *       与东亚（东南风）、南亚（西南风）夏季风同向 → 叠加加强。
 * 冬季：高原面是冷源 → 高压 → 辐散；其中指向东南、西南的两支，
 *       与东亚（西北风）、南亚（东北风）冬季风同向 → 叠加加强。
 */
export const MONSOON_ALIGNMENT = {
  summer: [
    { toward: 'nw', name: '东南风', monsoon: '东亚夏季风', reinforce: true },
    { toward: 'ne', name: '西南风', monsoon: '南亚夏季风', reinforce: true },
    { toward: 'se', name: '西北风', monsoon: '', reinforce: false },
    { toward: 'sw', name: '东北风', monsoon: '', reinforce: false },
  ],
  winter: [
    { toward: 'nw', name: '东南风', monsoon: '', reinforce: false },
    { toward: 'ne', name: '西南风', monsoon: '', reinforce: false },
    { toward: 'se', name: '西北风', monsoon: '东亚冬季风', reinforce: true },
    { toward: 'sw', name: '东北风', monsoon: '南亚冬季风', reinforce: true },
  ],
}

/** 高原面的平面轮廓（画布坐标） */
export const PLATEAU_OUTLINE =
  'M 300 152 Q 372 130 418 160 Q 442 196 416 226 Q 366 252 318 234 Q 286 198 300 152 Z'

/** 四支辐散箭头的起止点 */
export const PLATEAU_ARROWS = [
  { toward: 'nw', x1: 324, y1: 162, x2: 282, y2: 126 },
  { toward: 'ne', x1: 396, y1: 162, x2: 438, y2: 126 },
  { toward: 'se', x1: 396, y1: 218, x2: 438, y2: 254 },
  { toward: 'sw', x1: 324, y1: 218, x2: 282, y2: 254 },
]

/**
 * ① 地形剖面的画布坐标。
 *
 * reliefKm 是这段高度差对应的实际高差——剖面图上的比例尺就靠它定。
 */
export const PLATEAU_PROFILE = {
  /** 低地面的画布 y */
  groundY: 288,
  /** 高原面的画布 y */
  plateauY: 158,
  /** 剖面底边（地面以下）的画布 y */
  bottomY: 320,
  /** 图上高度差对应的实际高差（千米） */
  reliefKm: 3.5,
}

/**
 * 剖面的比例尺：1 个画布像素相当于多少米。
 *
 * @param {object} profile 剖面参数
 */
export function profileScale(profile = PLATEAU_PROFILE) {
  const diffPx = profile.groundY - profile.plateauY
  return (profile.reliefKm * 1000) / diffPx
}

/** 气温随海拔的递减率（℃ / 100 米） */
export const LAPSE_RATE_PER_100M = 0.6

/** 高原面高出四周低地的高度（千米，讲义口径 3—4 千米） */
export const PLATEAU_RELIEF_KM = { min: 3, max: 4 }

/**
 * 同高度比较时，高原面比四周低地低多少度。
 *
 * 高原面海拔高 → 同一高度的气温更低 → 冬季它是冷源。
 *
 * @param {number} km 高差（千米）
 */
export function plateauTemperatureDeficit(km) {
  return (km * 1000 / 100) * LAPSE_RATE_PER_100M
}
