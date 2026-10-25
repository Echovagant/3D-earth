/**
 * 地球公转轨道的几何（§4.1）。
 *
 * 讲义里的公转轨道是「近似正圆的椭圆，太阳在椭圆的一个焦点上」，
 * 速度规则是开普勒第二定律：相等时间内，太阳与地球的连线扫过的面积相等。
 *
 * 真实的偏心率只有 0.0167，照实画根本看不出快慢差别，所以这里的偏心率是
 * **夸大的**——形状关系与快慢关系都对，比例不对。图上必须说明这是示意图。
 *
 * 角度一律用「平近点角 M」当时间：开普勒第三定律保证 M 随时间均匀，
 * 于是「相等时间」等价于「相等面积」，第二定律就变成一条可以直接算的式子。
 */

/** 轨道半长轴（像素） */
export const SEMI_MAJOR = 132

/** 夸大的偏心率（真实值约 0.0167） */
export const ECCENTRICITY = 0.26

/** 真实的偏心率——照实画几乎是个正圆 */
export const TRUE_ECCENTRICITY = 0.0167

/** 恒星年（回归年比它长） */
export const SIDEREAL_YEAR_TEXT = '365 日 6 时 9 分 10 秒'

/** 回归年 */
export const TROPICAL_YEAR_TEXT = '365 日 5 时 48 分 46 秒'

/** 回归年比恒星年短多少（秒） */
export const YEAR_DIFF_SECONDS = 20 * 60 + 24

/** 近日点到太阳的距离（km） */
export const PERIHELION_DISTANCE_KM = 147100000

/** 远日点到太阳的距离（km） */
export const APHELION_DISTANCE_KM = 152100000

/** 二分日的年内序号（平年） */
export const EQUINOX_DAY_OF_YEAR = { vernal: 80, autumnal: 266 }

/** 半短轴 */
export const SEMI_MINOR = SEMI_MAJOR * Math.sqrt(1 - ECCENTRICITY * ECCENTRICITY)

/** 焦距：太阳所在焦点离圆心的距离 */
export const FOCAL = SEMI_MAJOR * ECCENTRICITY

/** 轨道圆心（画布坐标） */
export const CENTER = { x: 360, y: 192 }

/** 一年的天数 */
export const DAYS_PER_YEAR = 365.25

/** 平近点角 → 时间（天） */
export const daysToMeanAnomaly = (days) => (days / DAYS_PER_YEAR) * 2 * Math.PI

/** 时间（天）→ 平近点角 */
export const meanAnomalyToDays = (m) => (m / (2 * Math.PI)) * DAYS_PER_YEAR

/**
 * 解开普勒方程 M = E − e·sin E（牛顿法）。
 *
 * @param {number} meanAnomaly 平近点角（弧度）
 * @param {number} e 偏心率
 */
export function solveKepler(meanAnomaly, e = ECCENTRICITY) {
  let E = meanAnomaly
  for (let i = 0; i < 60; i += 1) {
    const step = (E - e * Math.sin(E) - meanAnomaly) / (1 - e * Math.cos(E))
    E -= step
    if (Math.abs(step) < 1e-13) break
  }
  return E
}

/**
 * 远日点侧的扫角：解 Δ + e·sinΔ = M。
 *
 * 近日点侧扫的是 E − e·sinE，远日点侧扫的是 Δ + e·sinΔ——
 * 同样一块面积，Δ 一定比 E 小，也就是远日点附近走过的弧更短。
 *
 * @param {number} meanAnomaly 平近点角（弧度）
 * @param {number} e 偏心率
 */
export function solveAphelionSweep(meanAnomaly, e = ECCENTRICITY) {
  let d = meanAnomaly
  for (let i = 0; i < 60; i += 1) {
    const step = (d + e * Math.sin(d) - meanAnomaly) / (1 + e * Math.cos(d))
    d -= step
    if (Math.abs(step) < 1e-13) break
  }
  return d
}

/** 真近点角：偏近点角 → 真近点角 */
export function trueAnomaly(E, e = ECCENTRICITY) {
  return (
    2 *
    Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2),
    )
  )
}

/**
 * 轨道上的点（画布坐标）。
 *
 * 近点角 E 增大 = 画布上逆时针 = 从北极上方看的公转方向（北逆南顺）。
 */
export function orbitPoint(E, opts = {}) {
  const a = opts.a ?? SEMI_MAJOR
  const b = opts.b ?? SEMI_MINOR
  const cx = opts.cx ?? CENTER.x
  const cy = opts.cy ?? CENTER.y
  return { x: cx + a * Math.cos(E), y: cy - b * Math.sin(E) }
}

/** 太阳（焦点）的位置 */
export function sunPoint(opts = {}) {
  return { x: (opts.cx ?? CENTER.x) + FOCAL, y: opts.cy ?? CENTER.y }
}

/**
 * 从近日点起算扫过的面积（平方像素）。
 */
export function sweptArea(E, e = ECCENTRICITY, a = SEMI_MAJOR, b = SEMI_MINOR) {
  return (a * b * (E - e * Math.sin(E))) / 2
}

/**
 * 轨道弧长（数值积分）。
 *
 * @param {number} fromE 起点的偏近点角
 * @param {number} toE 终点的偏近点角
 */
export function arcLength(fromE, toE, a = SEMI_MAJOR, b = SEMI_MINOR, steps = 240) {
  let len = 0
  const h = (toE - fromE) / steps
  for (let i = 0; i < steps; i += 1) {
    const u = fromE + (i + 0.5) * h
    len += Math.sqrt(a * a * Math.sin(u) ** 2 + b * b * Math.cos(u) ** 2) * Math.abs(h)
  }
  return len
}

/** 整条轨道的路径（采样成折线） */
export function orbitPath(opts = {}) {
  const steps = opts.steps ?? 180
  const pts = []
  for (let i = 0; i <= steps; i += 1) {
    const E = (i / steps) * 2 * Math.PI
    const p = orbitPoint(E, opts)
    pts.push(`${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
  }
  return `${pts.join(' ')} Z`
}

/** 从太阳出发的扇形路径：太阳 → 轨道上一段弧 → 回到太阳 */
export function sectorPath(fromE, toE, sun, opts = {}) {
  const steps = opts.steps ?? 48
  const pts = []
  for (let i = 0; i <= steps; i += 1) {
    const E = fromE + ((toE - fromE) * i) / steps
    const p = orbitPoint(E, opts)
    pts.push(`${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
  }
  return `${pts.join(' ')} L ${sun.x} ${sun.y} Z`
}

/**
 * 二分二至：相对近日点（1 月 3 日）的天数。
 *
 * 日期用的是讲义里的说法：春分 3.21、夏至 6.22、秋分 9.23、冬至 12.22。
 * 用平近点角表示时间——平近点角随时间均匀，所以「天数」直接换成角度。
 */
export const SEASONS = [
  { key: 'vernal', name: '春分', date: '3 月 21 日', daysFromPerihelion: 76 },
  { key: 'summer', name: '夏至', date: '6 月 22 日', daysFromPerihelion: 169 },
  { key: 'autumnal', name: '秋分', date: '9 月 23 日', daysFromPerihelion: 263 },
  { key: 'winter', name: '冬至', date: '12 月 22 日', daysFromPerihelion: 353 },
]

/** 二分二至在轨道上的位置 */
export function seasonMarker(season, opts = {}) {
  const M = daysToMeanAnomaly(season.daysFromPerihelion)
  const E = solveKepler(M, opts.e ?? ECCENTRICITY)
  return { ...season, M, E, point: orbitPoint(E, opts) }
}

/** 北半球夏半年（春分 → 秋分）的天数 */
export const NORTHERN_SUMMER_DAYS = 186

/** 北半球冬半年（秋分 → 次年春分）的天数 */
export const NORTHERN_WINTER_DAYS = 179

/**
 * 近日点／远日点到太阳的距离（以半长轴为单位）：a(1∓e)。
 *
 * @param {number} a 半长轴
 * @param {number} e 偏心率
 * @param {boolean} atPerihelion true = 近日点，false = 远日点
 */
export function apsisDistance(a = SEMI_MAJOR, e = ECCENTRICITY, atPerihelion = true) {
  return a * (1 - (atPerihelion ? e : -e))
}

/**
 * 远日点距离与近日点距离之比 = (1+e)/(1−e)。
 *
 * @param {number} e 偏心率
 */
export function apsisRatio(e = ECCENTRICITY) {
  return (1 + e) / (1 - e)
}

/**
 * 两个半年的天数：夏半年 = 秋分序号 − 春分序号；冬半年 = 一年 − 夏半年。
 */
export function halfYearLengths() {
  const summer = EQUINOX_DAY_OF_YEAR.autumnal - EQUINOX_DAY_OF_YEAR.vernal
  return { summer, winter: Math.round(DAYS_PER_YEAR) - summer }
}

/**
 * 相等时间（默认 30 天）里，近日点与远日点各扫过的**等面积**区域。
 *
 * 面积相等、弧长不等：近处步子大、远处步子小——这就是开普勒第二定律。
 */
export function equalAreaSectors(days = 30, opts = {}) {
  const e = opts.e ?? ECCENTRICITY
  const a = opts.a ?? SEMI_MAJOR
  const b = opts.b ?? SEMI_MINOR
  const M = daysToMeanAnomaly(days)
  const perihelionSweep = solveKepler(M, e)
  const aphelionSweep = solveAphelionSweep(M, e)
  const perihelionArc = arcLength(0, perihelionSweep, a, b)
  const aphelionArc = arcLength(Math.PI - aphelionSweep, Math.PI, a, b)
  return {
    days,
    meanAnomaly: M,
    perihelion: {
      from: 0,
      to: perihelionSweep,
      area: sweptArea(perihelionSweep, e, a, b),
      arc: perihelionArc,
    },
    aphelion: {
      from: Math.PI - aphelionSweep,
      to: Math.PI,
      area: sweptArea(Math.PI, e, a, b) - sweptArea(Math.PI - aphelionSweep, e, a, b),
      arc: aphelionArc,
    },
    ratio: perihelionArc / aphelionArc,
  }
}
