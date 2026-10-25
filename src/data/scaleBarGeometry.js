/**
 * 比例尺的几何（§2.17 比例尺：计算、大小比较与选择）。
 *
 * 比例尺 = 图上距离 : 实地距离，是长度之比，计算时单位必须统一。
 * 1 千米 = 100000 厘米（五个零）——少一个零就差 10 倍。
 *
 * 1 : N 里 N 是分母：分母越大，图上同样长度代表的实地越远，
 * 也就是同样大小的图能覆盖的实地范围越大、内容越粗。
 */

/** 千米 → 厘米 */
export function kmToCm(km) {
  return km * 100000
}

/** 比例尺的分母：图上 mapCm 厘米对应实地 realKm 千米 */
export function scaleDenominator(mapCm, realKm) {
  return kmToCm(realKm) / mapCm
}

/** 比例尺的比值（图上距离 ÷ 实地距离） */
export function scaleRatio(mapCm, realKm) {
  return mapCm / kmToCm(realKm)
}

/** 比例尺 1:N 下，图上 mapCm 厘米对应的实地距离（千米） */
export function realDistanceKm(mapCm, denominator) {
  return (mapCm * denominator) / 100000
}

/** 千分位（写比例尺时好看：5,000,000） */
export function groupDigits(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** 比例尺的数字式写法 */
export function scaleText(denominator) {
  return `1 : ${groupDigits(denominator)}`
}

/**
 * 线段式比例尺：量出 n 格，1 厘米等于几格 ⇒ 每格多少厘米。
 *
 * 线段式比例尺画的那一段未必正好 1 厘米，必须量。
 */
export function cmPerDivision(divisions) {
  return 1 / divisions
}

/**
 * 同样大小的两幅图，实地覆盖范围之比。
 *
 * 图幅一样大时，覆盖范围之比就是分母之比（也等于实地距离之比）。
 */
export function coverageRatio(denominatorA, denominatorB) {
  return denominatorB / denominatorA
}
