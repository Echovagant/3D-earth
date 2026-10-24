/**
 * 纬线的几何（§2.2 纬线：概念与五个特点）。
 *
 * 纬线的三个量都是算出来的，不是画出来的：
 *   侧视图上纬线所在的高度   y = cy − R·sinφ（正交投影，φ 是纬度）
 *   侧视图上纬线的半宽       R·cosφ
 *   极点俯视图上纬线的半径   R·cosφ（纬度越高半径越小）
 *
 * 纬线长度 = 2πR·cosφ，所以赤道最长（约 4 万千米），向两极递减，
 * 到极点缩成一个点——「长度自赤道向两极递减」和「俯视图里同心圆半径越小」
 * 是同一条公式的两个说法。
 */

/** 地球平均半径（千米） */
export const EARTH_RADIUS_KM = 6371

/** 1° 纬度对应的实地距离（千米）——讲义里取整成 111 */
export const KM_PER_DEGREE = 111

/** 侧视图上某条纬线的高度（屏幕 y 向下，北在上） */
export function latitudeY(lat, cy, radius) {
  return cy - radius * Math.sin((lat * Math.PI) / 180)
}

/** 侧视图上某条纬线的半宽（弦长的一半） */
export function latitudeHalfWidth(lat, radius) {
  return radius * Math.cos((lat * Math.PI) / 180)
}

/** 极点俯视图上某条纬线的半径 */
export function polarRadius(lat, radius) {
  return latitudeHalfWidth(lat, radius)
}

/** 侧视图上某条纬线这一段弦的端点与高度 */
export function latitudeSegment(lat, cx, cy, radius) {
  const half = latitudeHalfWidth(lat, radius)
  const y = latitudeY(lat, cy, radius)
  return { x1: cx - half, x2: cx + half, y, half }
}

/** 某条纬线的实地长度（千米） */
export function parallelLengthKm(lat, earthRadiusKm = EARTH_RADIUS_KM) {
  return 2 * Math.PI * earthRadiusKm * Math.cos((lat * Math.PI) / 180)
}

/** 相邻两条纬线之间的实地距离（千米）——处处相等 */
export function latitudeGapKm(degreeGap = 1) {
  return degreeGap * KM_PER_DEGREE
}

/**
 * 柱面展开图（等距圆柱投影）上某条纬线的 y。
 *
 * 这里的 y 与纬度成正比（不是正弦），所以相邻纬线的间隔处处相等——
 * 正是「间隔处处相等」在矩形经纬网图上的样子。
 */
export function equidistantY(lat, top, bottom) {
  return top + ((90 - lat) / 180) * (bottom - top)
}
