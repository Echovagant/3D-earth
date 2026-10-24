/**
 * 光照侧视图的画法（§4.3 画图四步）。
 *
 * 高考「画图四步」：
 *   ① 找到太阳直射点
 *   ② 从直射点连到地心
 *   ③ 过地心作这条线的垂线 —— 这就是晨昏线
 *   ④ 涂出昼半球与夜半球（再标切点、极昼极夜范围）
 *
 * 这里用侧视投影：视线垂直于太阳光线所在的那个大圆面，于是太阳光线水平、
 * 晨昏线在画面上是一条过球心的直线——最接近卷面上手画的样子。
 *
 * 关键：③ 的垂线**必须过球心**，否则就不是大圆。
 * 侧视投影里，纬线投影成与赤道平行的线段，中点沿地轴偏移 R·sinφ、半长 R·cosφ。
 */

/** 夏至日太阳直射北回归线的纬度 */
export const DECL = 23.5

/** 侧视图的球心与半径（画布坐标） */
export const VIEW = { x: 360, y: 195, r: 118 }

/**
 * 地轴单位向量（画布坐标，y 向下）。
 *
 * lean = -1：北端向左倾（太阳在左边时，这是夏至日的姿态——北极朝着太阳）。
 * lean = 1：北端向右倾。
 */
export function axisVector(tiltDeg = DECL, lean = -1) {
  const t = (tiltDeg * Math.PI) / 180
  return { x: lean * Math.sin(t), y: -Math.cos(t) }
}

/**
 * 侧视投影下的一条纬线（线段）。
 *
 * @param {{x: number, y: number}} center 球心
 * @param {number} radius 球半径
 * @param {number} latDeg 纬度
 * @param {number} tiltDeg 地轴倾角
 * @param {number} lean 地轴倾向（-1 左倾 / 1 右倾）
 */
export function parallelSegment(center, radius, latDeg, tiltDeg = DECL, lean = -1) {
  const t = (tiltDeg * Math.PI) / 180
  const a = { x: lean * Math.sin(t), y: -Math.cos(t) }
  const u = { x: Math.cos(t), y: lean * Math.sin(t) }
  const phi = (latDeg * Math.PI) / 180
  const offset = radius * Math.sin(phi)
  const half = radius * Math.cos(phi)
  const mid = { x: center.x + a.x * offset, y: center.y + a.y * offset }
  return {
    lat: latDeg,
    mid,
    from: { x: mid.x - u.x * half, y: mid.y - u.y * half },
    to: { x: mid.x + u.x * half, y: mid.y + u.y * half },
  }
}

/**
 * 太阳直射点在侧视图上的位置。
 *
 * 太阳在左边、太阳光线水平时，直射点一定落在球的左轮廓上。
 * 取夏至日：地轴左倾，直射点就在 23.5°N。
 */
export function subsolarPoint(center, radius) {
  return { x: center.x - radius, y: center.y }
}

/** 晨昏线：过球心、垂直于太阳光线的那条直线（太阳在左边 → 竖直） */
export function terminatorLine(center, radius) {
  return `M ${center.x} ${center.y - radius} L ${center.x} ${center.y + radius}`
}

/** 直射点—地心连线 */
export function subsolarAxisLine(center, radius) {
  return `M ${center.x - radius} ${center.y} L ${center.x} ${center.y}`
}

/**
 * 切点纬度：晨昏线与极圈相切的地方，与太阳直射点互余。
 */
export function cutLatitudes(decl = DECL) {
  return [90 - decl, -(90 - decl)]
}

const normalize = (deg) => ((deg % 360) + 360) % 360

/** 圆上某点相对球心的角度（逆时针为正，0 度在正右方） */
export function bearing(center, p) {
  return normalize((Math.atan2(-(p.y - center.y), p.x - center.x) * 180) / Math.PI)
}

/**
 * 取两个球面轮廓点之间、包含参考点的那一段圆弧。
 */
export function arcBetween(center, radius, p1, p2, pTarget) {
  const a1 = bearing(center, p1)
  const a2 = bearing(center, p2)
  const at = bearing(center, pTarget)
  const ccw = normalize(at - a1) <= normalize(a2 - a1)
  const span = ccw ? normalize(a2 - a1) : normalize(a1 - a2)
  const large = span > 180 ? 1 : 0
  const sweep = ccw ? 0 : 1
  return {
    d: `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${large} ${sweep} ${p2.x} ${p2.y}`,
    span,
    sweep,
  }
}

/**
 * 极昼 / 极夜的范围：纬线圈的投影线段 + 球面轮廓弧围出的一块。
 *
 * @param {{x: number, y: number}} center 球心
 * @param {number} radius 球半径
 * @param {number} latDeg 极圈纬度（正数为北）
 * @param {number} tiltDeg 地轴倾角
 * @param {number} lean 地轴倾向
 */
export function polarCapPath(center, radius, latDeg, tiltDeg = DECL, lean = -1) {
  const seg = parallelSegment(center, radius, latDeg, tiltDeg, lean)
  const a = axisVector(tiltDeg, lean)
  // 参考点要用**同一半球**的极点：北极圈那边围住的是北极点，
  // 南极圈那边围住的是南极点。拿错极点会围出一大块（跨半球的假圆缺）。
  const sign = latDeg >= 0 ? 1 : -1
  const pole = { x: center.x + sign * a.x * radius, y: center.y + sign * a.y * radius }
  const arc = arcBetween(center, radius, seg.from, seg.to, pole)
  return `${arc.d} L ${seg.from.x} ${seg.from.y} Z`
}
