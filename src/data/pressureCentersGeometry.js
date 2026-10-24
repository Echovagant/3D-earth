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
    note: '亚欧大陆 · 陆地冷源',
  },
  {
    key: 'alaska-low',
    no: '②',
    name: '阿留申低压（北太平洋）',
    lat: 52,
    lon: 190,
    kind: 'low',
    note: '北太平洋 · 海洋热源',
  },
  {
    key: 'iceland-low',
    no: '③',
    name: '冰岛低压（北大西洋）',
    lat: 60,
    lon: 340,
    kind: 'low',
    note: '北大西洋 · 海洋热源',
  },
  {
    key: 'na-high',
    no: '④',
    name: '北美高压',
    lat: 45,
    lon: 260,
    kind: 'high',
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
    note: '亚欧大陆 · 陆地热源',
  },
  {
    key: 'hawaii-high',
    no: '②',
    name: '夏威夷高压（西北太平洋副高）',
    lat: 30,
    lon: 210,
    kind: 'high',
    note: '北太平洋 · 海洋冷源',
  },
  {
    key: 'azores-high',
    no: '③',
    name: '亚速尔高压（北大西洋）',
    lat: 30,
    lon: 330,
    kind: 'high',
    note: '北大西洋 · 海洋冷源',
  },
  {
    key: 'na-low',
    no: '④',
    name: '北美低压',
    lat: 28,
    lon: 260,
    kind: 'low',
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
    const r = (rMax * (90 - lat)) / 90
    const lambda = (lon * Math.PI) / 180
    // 0° 在正下方，90°E 在正右方：从正下方逆时针数，下一个就是右边。
    // 这个约定跟 §2.4 的极点俯视图一致（全站统一），别改成相反的。
    return { x: cx + r * Math.sin(lambda), y: cy + r * Math.cos(lambda) }
  }
}

/** 气压带自北向南的顺序（北半球近地面） */
export const BELT_ORDER = [
  '极地高气压带',
  '副极地低气压带',
  '副热带高气压带',
  '赤道低气压带',
]
