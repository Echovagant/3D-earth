/**
 * §3.4 自转线速度的判读与应用：线速度、纬线圈与角速度。
 *
 * 讲义给的两个数：v = 111 km × 15° × cosφ，常用取值赤道 1670、30° 为 1447、
 * 60° 为 835、极点 0 km/h。这几个数正好是 1670·cosφ。
 *
 * 关键：**角速度处处相同（15°/小时），随纬度变的是线速度**。
 * 极点俯视时，纬线圈半径 = R·cosφ，所以同一段时间里各纬线走过的弧长
 * 自动按 cosφ 缩放——箭头长度不用手调。
 */

/** 赤道上的自转线速度（km/h），讲义 §3.3 的常用取值 */
export const EQUATOR_SPEED = 1670

/** 自转角速度：除极点外处处相同，约 15°/小时 */
export const DEGREES_PER_HOUR = 15

/** 讲义的常用取值表（纬度 → 线速度 km/h） */
export const SPEED_TABLE = [
  { lat: 0, label: '赤道', speed: 1670 },
  { lat: 30, label: '北纬 30°', speed: 1447 },
  { lat: 60, label: '北纬 60°', speed: 835 },
  { lat: 90, label: '极点', speed: 0 },
]

/**
 * 自转线速度：v = 1670·cosφ（φ 为纬度）。
 *
 * @param {number} latDeg 纬度（度）
 */
export function linearSpeed(latDeg) {
  return EQUATOR_SPEED * Math.cos((latDeg * Math.PI) / 180)
}

/**
 * 极点俯视时纬度 φ 的纬线圈半径。
 *
 * @param {number} r 地球半径（像素）
 * @param {number} latDeg 纬度（度）
 */
export function latitudeCircleRadius(r, latDeg) {
  return r * Math.cos((latDeg * Math.PI) / 180)
}

/**
 * 速度箭头的长度（像素）：与线速度成正比。
 *
 * @param {number} latDeg 纬度（度）
 * @param {number} maxLen 赤道上箭头的长度（像素）
 */
export function speedArrowLength(latDeg, maxLen) {
  return maxLen * Math.cos((latDeg * Math.PI) / 180)
}

/**
 * 一小时里某条纬线走过的弧长占比（相对赤道）。
 *
 * @param {number} latDeg 纬度（度）
 */
export function hourlyArcRatio(latDeg) {
  return Math.cos((latDeg * Math.PI) / 180)
}

/**
 * 同一纬度、海拔不同两点到地轴的距离之比（海拔影响线速度的几何原因）。
 *
 * 某点到地轴的距离 = (R + h)·cosφ，所以海拔越高、半径越大，线速度越大。
 *
 * @param {number} latDeg 纬度（度）
 * @param {number} altitudeKm 海拔（km）
 * @param {number} radiusKm 地球半径（km）
 */
export function radiusRatio(latDeg, altitudeKm, radiusKm = 6371) {
  const c = Math.cos((latDeg * Math.PI) / 180)
  return (((radiusKm + altitudeKm) * c) / (radiusKm * c))
}
