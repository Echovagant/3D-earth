/**
 * 海陆气压中心的极地俯视图（§7.12）。
 *
 * 俯视北极：0° 经线朝下（正下方），90°E 在右，180° 在上，90°W 在左。
 * 为什么这样摆：北极上空看地球自转是逆时针，经度向东增大；
 * 0° 在下，从正下方逆时针数，下一个到的就是右边的 90°E。
 * （§2.4 的极点俯视图用的是同一套约定，别把两处画成相反的。）
 */

/** 北半球冬季（1 月）的气压中心 */
export const WINTER_CENTERS = [
  {
    key: 'asia-high',
    no: '①',
    name: '蒙古—西伯利亚高压（亚洲高压）',
    lat: 50,
    lon: 100,
    kind: 'high',
    surface: 'land',
    note: '亚欧大陆 · 陆地冷源',
  },
  {
    key: 'alaska-low',
    no: '②',
    name: '阿留申低压（北太平洋）',
    lat: 52,
    lon: 190,
    kind: 'low',
    surface: 'sea',
    note: '北太平洋 · 海洋热源',
  },
  {
    key: 'iceland-low',
    no: '③',
    name: '冰岛低压（北大西洋）',
    lat: 60,
    lon: 340,
    kind: 'low',
    surface: 'sea',
    note: '北大西洋 · 海洋热源',
  },
  {
    key: 'na-high',
    no: '④',
    name: '北美高压',
    lat: 45,
    lon: 260,
    kind: 'high',
    surface: 'land',
    note: '北美大陆 · 陆地冷源',
  },
]

/** 北半球夏季（7 月）的气压中心 */
export const SUMMER_CENTERS = [
  {
    key: 'india-low',
    no: '①',
    name: '印度低压（亚洲低压）',
    lat: 28,
    lon: 80,
    kind: 'low',
    surface: 'land',
    note: '亚欧大陆 · 陆地热源',
  },
  {
    key: 'hawaii-high',
    no: '②',
    name: '夏威夷高压（西北太平洋副高）',
    lat: 30,
    lon: 210,
    kind: 'high',
    surface: 'sea',
    note: '北太平洋 · 海洋冷源',
  },
  {
    key: 'azores-high',
    no: '③',
    name: '亚速尔高压（北大西洋）',
    lat: 30,
    lon: 330,
    kind: 'high',
    surface: 'sea',
    note: '北大西洋 · 海洋冷源',
  },
  {
    key: 'na-low',
    no: '④',
    name: '北美低压',
    lat: 28,
    lon: 260,
    kind: 'low',
    surface: 'land',
    note: '北美大陆 · 陆地热源',
  },
]

/**
 * 极地俯视图的投影。
 *
 * @param {number} cx 圆心 x
 * @param {number} cy 圆心 y
 * @param {number} rMax 赤道圈的半径
 */
export function polarProjection(cx, cy, rMax) {
  return (lat, lon) => {
    const r = polarRadius(lat, rMax)
    const lambda = (lon * Math.PI) / 180
    // 0° 在正下方，90°E 在正右方：从正下方逆时针数，下一个就是右边。
    // 这个约定跟 §2.4 的极点俯视图一致（全站统一），别改成相反的。
    return { x: cx + r * Math.sin(lambda), y: cy + r * Math.cos(lambda) }
  }
}

/**
 * 俯视图上某个纬度对应的半径：赤道在最外圈，越靠极地半径越小。
 *
 * @param {number} latDeg 纬度（度）
 * @param {number} rMax 赤道圈的半径
 */
export function polarRadius(latDeg, rMax) {
  return (rMax * (90 - latDeg)) / 90
}

/**
 * 北半球近地面的气压带（自北向南）。
 *
 * lat 是气压带的中心纬度——「被顶断的是哪一条带」全靠它。
 */
export const BELTS = [
  { key: 'polar-high', name: '极地高气压带', lat: 90, target: false },
  { key: 'subpolar-low', name: '副极地低气压带', lat: 60, target: true },
  { key: 'subtropical-high', name: '副热带高气压带', lat: 30, target: true },
  { key: 'equatorial-low', name: '赤道低气压带', lat: 0, target: false },
]

/** 气压带自北向南的顺序（北半球近地面） */
export const BELT_ORDER = [
  '极地高气压带',
  '副极地低气压带',
  '副热带高气压带',
  '赤道低气压带',
]

/** 答题框示意图上标出的两个气压值（讲义原数） */
export const FRAME_PRESSURES = { low: 1005, high: 1020 }

/**
 * 经度归一到 −180°–180°：负数是西经，正数是东经。
 *
 * 夏威夷高压在数据里记成东经 210°，那只是越过 180° 的写法，
 * 念成「西经 150°」才对。
 */
export function normalizeLongitude(lon) {
  return ((((lon + 180) % 360) + 360) % 360) - 180
}

/**
 * 取某个季节的某个气压中心。
 *
 * @param {'summer'|'winter'} season
 * @param {string} key 中心的 key（如 'india-low'）
 */
export function pressureCenter(season, key) {
  const list = season === 'winter' ? WINTER_CENTERS : SUMMER_CENTERS
  return list.find((c) => c.key === key) ?? null
}

/**
 * 离北回归线有多远（度）：正数表示在北回归线以北，负数表示以南。
 *
 * 判季节时用的就是这一条：低压中心在北回归线以北的陆地上 → 北半球夏季。
 */
export function northOfTropic(lat, tropic = 23.5) {
  return lat - tropic
}

/** 两个气压中心的数值差（hPa）——差得越大，气压梯度越大 */
export function pressureDifference(a, b) {
  return Math.abs(a - b)
}
