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
 * 互余只跟 |δ| 有关：直射点在北半球，切点就在北半球；直射点挪到南半球，
 * 晨昏线照样与南极圈相切。所以这里必须取绝对值。
 *
 * @param {number} decl 太阳直射点纬度
 */
export function cutLatitude(decl = SOLSTICE_DECL) {
  return 90 - Math.abs(decl)
}

/**
 * 两个切点各自所在的纬度。
 *
 * A 在 0 时经线上（子夜），B 在 12 时经线上（正午）；
 * 哪一端偏北由 δ 的正负决定——直射点偏北则北边那端是切点。
 * δ = 0 时晨昏线过两极，两个极点都是切点，这里按 δ → 0⁺ 取北极为 A。
 *
 * @param {number} decl 太阳直射点纬度
 */
export function tangentLatitudes(decl = SOLSTICE_DECL) {
  const cut = cutLatitude(decl)
  if (decl > 0) return { a: cut, b: -cut }
  if (decl < 0) return { a: -cut, b: cut }
  return { a: 90, b: -90 }
}

/**
 * 晨昏线上某个纬度离直射经线有多远（度）。
 *
 * 由 sinφ·sinδ + cosφ·cosδ·cos(λ−λs) = 0 得 cos(λ−λs) = −tanφ·tanδ，
 * 于是 λ = λs ± arccos(−tanφ·tanδ)。两个分支在切点处合成一条。
 *
 * δ = 0 时 arccos(0) = 90°，晨昏线落在 λs ± 90° 两条经线上——正好过两极。
 *
 * @param {number} lat 纬度
 * @param {number} decl 太阳直射点纬度
 */
export function terminatorLonOffset(lat, decl = SOLSTICE_DECL) {
  if (decl === 0) return 90
  const limit = cutLatitude(decl)
  // 采样区间的两端就是切点：两支合到一起，偏移量只能是 0° 或 180°
  if (lat >= limit - 1e-9) return decl > 0 ? 180 : 0
  if (lat <= -limit + 1e-9) return decl > 0 ? 0 : 180
  const arg = clamp(
    -Math.tan((lat * Math.PI) / 180) * Math.tan((decl * Math.PI) / 180),
    -1,
    1,
  )
  return (Math.acos(arg) * 180) / Math.PI
}

/**
 * 晨昏线在圆柱投影上要画的几段折线（按纬度采样解出经度）。
 *
 * 不按经度采样，是因为 δ = 0 时在 lon = 0 与 ±180 处会除以零，
 * 算出 NaN，整条路径作废——图上直接空一块。按纬度采样没有这个坑。
 *
 * 每支都在反子午线处断开，经度收进 (−180, 180]，
 * 投影到平面上才不会横穿整张图（晨昏线跨 180° 经线时，图的左右两边各画一段）。
 *
 * @param {number} decl 太阳直射点纬度
 * @param {number} samples 每个分支的采样点数
 */
export function terminatorPolylines(decl = SOLSTICE_DECL, samples = 120) {
  const limit = cutLatitude(decl)
  const west = []
  const east = []
  for (let i = 0; i <= samples; i += 1) {
    const lat = -limit + ((2 * limit) / samples) * i
    const offset = terminatorLonOffset(lat, decl)
    west.push({ lon: SUBSOLAR_LON - offset, lat })
    east.push({ lon: SUBSOLAR_LON + offset, lat })
  }
  return [...splitAtAntimeridian(west), ...splitAtAntimeridian(east)]
}

/**
 * 侧视图里的地轴方向（画布坐标，y 向下）。
 *
 * δ > 0 时北极朝左倾、正对太阳那一侧。
 *
 * 验算：球的左轮廓点相对球心是 p = (−r, 0)，它正对太阳，就是直射点；
 * 它的纬度满足 sinφ = p·a / r = (−r)(−sinδ) / r = sinδ，所以 φ = δ——
 * 直射点的纬度正好是 δ。
 *
 * @param {number} decl 太阳直射点纬度
 */
export function axisDirection(decl = SOLSTICE_DECL) {
  const d = (decl * Math.PI) / 180
  return { x: -Math.sin(d), y: -Math.cos(d) }
}

/** 把数值限制在区间内 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/** 经度收进 (−180, 180]：正反子午线都算 180°，投影时才落在图的右边界 */
function wrapLon(lon) {
  let w = lon % 360
  if (w > 180) w -= 360
  if (w <= -180) w += 360
  return w
}

/** 在反子午线处把折线断开 */
function splitAtAntimeridian(points) {
  const pieces = []
  let current = []
  let prev = null
  for (const p of points) {
    const lon = wrapLon(p.lon)
    if (prev !== null && Math.abs(lon - prev) > 180) {
      pieces.push(current)
      current = []
    }
    current.push({ lon, lat: p.lat })
    prev = lon
  }
  if (current.length) pieces.push(current)
  return pieces
}
