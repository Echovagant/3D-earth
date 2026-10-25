/**
 * 黄赤交角相关几何（§4.2）。
 *
 * 三个数必须分清，错了整个结论就反了：
 *   黄赤交角 23.5° = **赤道面与黄道面**的夹角
 *   地轴与黄道面的夹角 = 66.5°（= 极圈纬度）
 *   地轴与黄道面**法线**的夹角 = 23.5°
 *
 * 回归线 = ±23.5°，极圈 = ±66.5°，两者与黄赤交角互余（和为 90°）。
 */

/** 黄赤交角（度）：赤道面与黄道面的夹角 */
export const OBLIQUITY = 23.5

/** 黄赤交角的度分表示 */
export const OBLIQUITY_DMS = '23°26′'

/** 地轴与黄道面夹角的度分表示 */
export const AXIS_TO_ECLIPTIC_DMS = '66°34′'

/** 回归线纬度 */
export const TROPIC = OBLIQUITY

/** 极圈纬度 */
export const POLAR_CIRCLE = 90 - OBLIQUITY

/** 地轴与黄道面的夹角 */
export const AXIS_TO_ECLIPTIC = 90 - OBLIQUITY

/** 一年里的天数 */
export const DAYS_PER_YEAR = 365.25

/** 一年里直射点走过的纬度跨度（度）：来回各一次，4 倍黄赤交角 */
export const DECLINATION_SPAN = 4 * OBLIQUITY

/**
 * 直射点移动的平均速度（度/天）。
 */
export function declinationSpeedPerDay() {
  return DECLINATION_SPAN / DAYS_PER_YEAR
}

/**
 * 地轴单位向量（画布坐标，y 向下）：北端向右倾 tiltDeg 度。
 */
export function axisVector(tiltDeg = OBLIQUITY) {
  const t = (tiltDeg * Math.PI) / 180
  return { x: Math.sin(t), y: -Math.cos(t) }
}

/**
 * 赤道方向单位向量（与地轴垂直）。
 */
export function equatorVector(tiltDeg = OBLIQUITY) {
  const t = (tiltDeg * Math.PI) / 180
  return { x: Math.cos(t), y: Math.sin(t) }
}

/**
 * 侧视投影下的一条纬线。
 *
 * 地轴落在画面里时，纬度 φ 的平行圈投影成一段与赤道平行的线段：
 * 段的中点沿地轴方向偏移 R·sinφ，半长 R·cosφ。
 *
 * @param {{x: number, y: number}} center 球心（画布坐标）
 * @param {number} radius 球半径
 * @param {number} latDeg 纬度
 * @param {number} tiltDeg 地轴倾角
 */
export function parallelSegment(center, radius, latDeg, tiltDeg = OBLIQUITY) {
  const a = axisVector(tiltDeg)
  const u = equatorVector(tiltDeg)
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
 * 太阳直射点（赤纬）随时间的变化。
 *
 * 黄经近似随时间均匀，直射点纬度满足 sinδ = sinε·sinλ。
 * 这条式子比「δ = 23.5·sin(2πt/T)」准：它在回归线附近走得慢，
 * 正是讲义里「越靠近回归线移动越慢」那件事。
 *
 * @param {number} daysSinceEquinox 距春分的天数
 */
export function declination(daysSinceEquinox, obliquity = OBLIQUITY) {
  const lambda = (2 * Math.PI * daysSinceEquinox) / DAYS_PER_YEAR
  const e = (obliquity * Math.PI) / 180
  return (Math.asin(Math.sin(e) * Math.sin(lambda)) * 180) / Math.PI
}

/**
 * 二分二至距春分的天数。
 *
 * 用黄经等分：春分 λ = 0°，夏至 λ = 90°，秋分 180°，冬至 270°。
 * 黄经随时间近似均匀，所以一年四等分就是 91.3125 天一格——
 * 这样算出来的直射点纬度在二至上正好是 ±23.5°，曲线端点正好落在回归线上。
 * 标签上的日历日期（3.21 / 6.22 / 9.23 / 12.22）是同一时刻的近似说法。
 */
export const SEASON_DAYS = {
  vernal: 0,
  summer: DAYS_PER_YEAR / 4,
  autumnal: DAYS_PER_YEAR / 2,
  winter: (3 * DAYS_PER_YEAR) / 4,
  nextVernal: DAYS_PER_YEAR,
}

/** 北半球夏半年（春分 → 秋分）的天数 */
export const NORTHERN_SUMMER_DAYS = 186

/** 北半球冬半年（秋分 → 次年春分）的天数 */
export const NORTHERN_WINTER_DAYS = 179

/**
 * 直射点一年里的轨迹（返回画布点列），用于「三线图」。
 *
 * @param {object} plot 绘图区 { left, right, top, bottom, latTop }
 */
export function subsolarTrack(plot, steps = 180) {
  const pts = []
  for (let i = 0; i <= steps; i += 1) {
    const days = (i / steps) * SEASON_DAYS.nextVernal
    const lat = declination(days)
    pts.push({
      days,
      lat,
      x: plot.left + (days / SEASON_DAYS.nextVernal) * (plot.right - plot.left),
      y: plot.top + ((plot.latTop - lat) / (2 * plot.latTop)) * (plot.bottom - plot.top),
    })
  }
  return pts
}
