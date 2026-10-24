/**
 * 晨昏线的几何。
 *
 * 讲义里的晨昏线不是手画的示意图，是按公式算出来的：
 *   正午太阳高度为 0 的地方满足 sinφ·sinδ + cosφ·cosδ·cosH = 0
 *   也就是 tanφ = −cotδ·cosH
 * 其中 φ 是纬度、δ 是太阳直射点纬度、H 是地方时角（子午线上为 0，向西为正）。
 *
 * 数值与几何都放在这里，演示组件只负责画——
 * 公式一旦要改，几何测试会先红。
 */

/** 夏至日太阳直射北回归线的纬度 */
export const SOLSTICE_DECL = 23.5

/** 演示用的太阳直射经线：这条经线的地方时是 12 时 */
export const SUBSOLAR_LON = 90

/**
 * 某条经线上的地方时角（度）。子午线为 0，向西为正。
 *
 * @param {number} lon 经度，-180 ~ 180
 * @param {number} subsolarLon 太阳直射经线
 */
export function localHourAngle(lon, subsolarLon = SUBSOLAR_LON) {
  return lon - subsolarLon
}

/**
 * 某条经线上的地方时（小时，0 ~ 24）。
 *
 * @param {number} lon 经度，-180 ~ 180
 * @param {number} subsolarLon 太阳直射经线
 */
export function localHour(lon, subsolarLon = SUBSOLAR_LON) {
  return 12 + localHourAngle(lon, subsolarLon) / 15
}

/**
 * 晨昏线在给定经度上的纬度。
 *
 * @param {number} lon 经度，-180 ~ 180
 * @param {number} decl 太阳直射点纬度
 */
export function terminatorLat(lon, decl = SOLSTICE_DECL) {
  const H = (localHourAngle(lon) * Math.PI) / 180
  const d = (decl * Math.PI) / 180
  return (Math.atan((-Math.cos(H) * Math.cos(d)) / Math.sin(d)) * 180) / Math.PI
}

/**
 * 切点的纬度：晨昏线的最高纬度点，与太阳直射点互余。
 *
 * @param {number} decl 太阳直射点纬度
 */
export function cutLatitude(decl = SOLSTICE_DECL) {
  return 90 - decl
}
