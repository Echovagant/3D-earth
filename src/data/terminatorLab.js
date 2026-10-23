/**
 * 太阳高度角与晨昏线实验：事实性数据、公式与晨昏线几何。
 *
 * 这里放三类东西：
 *   ① 事实性结构数据——节气表、常用观察点纬度、判据文案（自撰提纲）；
 *   ② 可以单独验证的公式——正午太阳高度角、昼长、极昼极夜判定、切点；
 *   ③ 晨昏线的几何——正交投影（视点方向落在赤道面内），组件只负责画。
 *
 * 不发网络请求，也不抄讲义正文：判据文字是照公式自己写的。
 */

/* ------------------------------------------------------------------ *
 * 常量
 * ------------------------------------------------------------------ */

/** 黄赤交角（度）：太阳直射点摆到的最北 / 最南纬度 */
export const TROPIC_DEGREES = 23.5

/** 极圈纬度（度） */
export const POLAR_CIRCLE_DEGREES = 90 - TROPIC_DEGREES

/** 地球自转角速度：每小时 15° */
export const DEGREES_PER_HOUR = 15

/** 一天的小时数 */
export const HOURS_PER_DAY = 24

/* ------------------------------------------------------------------ *
 * 事实性数据
 * ------------------------------------------------------------------ */

/**
 * 节气与太阳直射点纬度 δ。
 * 春分 / 秋分直射赤道，夏至直射北回归线，冬至直射南回归线。
 */
export const SOLAR_TERMS = [
  { id: 'spring-equinox', name: '春分', delta: 0, note: '太阳直射赤道，全球昼夜平分' },
  { id: 'summer-solstice', name: '夏至', delta: TROPIC_DEGREES, note: '太阳直射北回归线' },
  { id: 'autumn-equinox', name: '秋分', delta: 0, note: '太阳直射赤道，全球昼夜平分' },
  { id: 'winter-solstice', name: '冬至', delta: -TROPIC_DEGREES, note: '太阳直射南回归线' },
]

/** 常用观察点纬度样本（北半球在前，南半球在后） */
export const SAMPLE_POINTS = [
  { id: 'mohe', name: '漠河', phi: 53.5 },
  { id: 'beijing', name: '北京', phi: 39.9 },
  { id: 'shanghai', name: '上海', phi: 31.2 },
  { id: 'kunming', name: '昆明', phi: 25.0 },
  { id: 'guangzhou', name: '广州', phi: 23.1 },
  { id: 'nairobi', name: '内罗毕', phi: -1.3 },
  { id: 'sydney', name: '悉尼', phi: -33.9 },
  { id: 'ushuaia', name: '乌斯怀亚', phi: -54.8 },
]

/**
 * 判晨昏三法（自撰提纲）。
 * 每种方法都给判据与操作步骤，练习页直接引用。
 */
export const JUDGEMENT_METHODS = [
  {
    id: 'rotation',
    name: '自转法',
    rule: '顺着地球自转方向看：夜半球变昼半球的是晨线，昼半球变夜半球的是昏线。',
    steps: [
      '先认自转方向（自西向东）',
      '再看跨过这条线之后天是变亮还是变暗',
      '变亮是晨线，变暗是昏线',
    ],
  },
  {
    id: 'direction',
    name: '方位法',
    rule: '夜半球的东侧是晨线、西侧是昏线；昼半球的东侧是昏线、西侧是晨线。',
    steps: ['先分清昼半球与夜半球', '再看这条线所在半球的东、西两侧', '夜半球的东侧为晨线'],
  },
  {
    id: 'equator',
    name: '赤道法',
    rule: '赤道上地方时 6 时所在的经线是晨线，18 时所在的经线是昏线。',
    steps: ['赤道永远昼夜平分', '赤道上 6 时日出、18 时日落', '沿经线找到与赤道的两个交点'],
  },
]

/** 晨昏线上的时间规律（自撰提纲） */
export const TIME_RULES = [
  { id: 'crossing', text: '晨线与赤道的交点所在经线是 6 时，昏线与赤道的交点所在经线是 18 时。' },
  {
    id: 'midpoint',
    text: '非极昼极夜区里，过昼弧中点的经线是 12 时（正午经线），过夜弧中点的是 0 时。',
  },
  { id: 'tangent', text: '晨昏线与纬线圈的切点所在经线是 0 时或 12 时。' },
]

/* ------------------------------------------------------------------ *
 * 工具
 * ------------------------------------------------------------------ */

const DEG = Math.PI / 180

const toRad = (deg) => deg * DEG
const toDeg = (rad) => rad / DEG

const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value))

/** 经度归一化到 [0, 360) */
export function normalizeLongitude(longitude) {
  return ((Number(longitude) % 360) + 360) % 360
}

/** 两个角度之间的最短夹角（度，0–180） */
function angleGap(a, b) {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

const normalize = (v) => {
  const len = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}

/* ------------------------------------------------------------------ *
 * 正午太阳高度角与昼长
 * ------------------------------------------------------------------ */

/**
 * 正午太阳高度角：H = 90° − |φ − δ|。
 * 纬度差同减一加：φ、δ 同号用减，异号用加。
 */
export function noonSolarAltitude(phi, delta) {
  return 90 - Math.abs(phi - delta)
}

/** 子夜太阳高度角：H子夜 = φ + δ − 90°（正值表示子夜时太阳还在地平线以上） */
export function midnightSolarAltitude(phi, delta) {
  return phi + delta - 90
}

/**
 * 极昼极夜判定：|φ| + |δ| ≥ 90° 时进入极昼 / 极夜区。
 * φ 与 δ 同号（同一半球）→ 极昼；异号 → 极夜。
 */
export function polarDayState(phi, delta) {
  if (Math.abs(phi) + Math.abs(delta) < 90) return 'normal'
  return phi * delta >= 0 ? 'polar-day' : 'polar-night'
}

/**
 * 日出时的时角 ω0（度）：cos ω0 = −tanφ · tanδ。
 * 极昼极夜时不存在日出，返回 null。
 */
export function sunriseHourAngle(phi, delta) {
  if (polarDayState(phi, delta) !== 'normal') return null
  const c = -Math.tan(toRad(phi)) * Math.tan(toRad(delta))
  return toDeg(Math.acos(clamp(c, -1, 1)))
}

/** 昼长（小时）= 2 × ω0 / 15 */
export function dayLengthHours(phi, delta) {
  const state = polarDayState(phi, delta)
  if (state === 'polar-day') return HOURS_PER_DAY
  if (state === 'polar-night') return 0
  const omega = sunriseHourAngle(phi, delta)
  return (2 * omega) / DEGREES_PER_HOUR
}

/** 日出的地方时（小时）；极昼极夜返回 null */
export function sunriseTime(phi, delta) {
  const omega = sunriseHourAngle(phi, delta)
  return omega === null ? null : 12 - omega / DEGREES_PER_HOUR
}

/** 日落的地方时（小时）；极昼极夜返回 null */
export function sunsetTime(phi, delta) {
  const omega = sunriseHourAngle(phi, delta)
  return omega === null ? null : 12 + omega / DEGREES_PER_HOUR
}

/**
 * 正午太阳方位：观察点在直射点以北 → 太阳在正南；以北 → 正北；同纬度 → 头顶。
 * 返回 'south' / 'north' / 'zenith'。
 */
export function noonSunAzimuth(phi, delta) {
  if (Math.abs(phi - delta) < 1e-9) return 'zenith'
  return phi > delta ? 'south' : 'north'
}

/**
 * 一年中正午太阳高度角的变化幅度 ΔH（度）。
 * 赤道 23.5°、回归线 47°、温带恒为 47°、极点 23.5°；南北同纬度一致。
 */
export function annualAltitudeRange(phi) {
  const a = Math.abs(phi)
  const highest = 90 - Math.max(0, a - TROPIC_DEGREES)
  const lowest = Math.max(0, 90 - (a + TROPIC_DEGREES))
  return highest - lowest
}

/**
 * 一年中正午太阳高度的最小值（度）：北半球取冬至，南半球取夏至。
 */
export function minimumNoonAltitude(phi) {
  const delta = phi >= 0 ? -TROPIC_DEGREES : TROPIC_DEGREES
  return noonSolarAltitude(phi, delta)
}

/**
 * 楼间距：L = H / tan θ。
 * θ 取一年中正午太阳高度的最小值；θ = 0 时没有有限解，返回 Infinity。
 */
export function buildingSpacing(heightMeters, minAltitude) {
  const theta = toRad(minAltitude)
  if (!(theta > 0)) return Infinity
  return heightMeters / Math.tan(theta)
}

/* ------------------------------------------------------------------ *
 * 晨昏线：时刻、切点、交点
 * ------------------------------------------------------------------ */

/** 经度 λ 处的太阳时（小时）= 12 + (λ − λ0) / 15，结果归一化到 [0, 24) */
export function localSolarTime(longitude, subsolarLongitude) {
  const t = 12 + (longitude - subsolarLongitude) / DEGREES_PER_HOUR
  return ((t % 24) + 24) % 24
}

/**
 * 晨线 / 昏线判定（自转法）：时角 H = λ − λ0。
 * H < 0 是晨线（正在日出），H > 0 是昏线（正在日落），H = ±180° 是两线的分界点。
 */
export function terminatorSide(longitude, subsolarLongitude) {
  const h = normalizeLongitude(longitude - subsolarLongitude + 180) - 180
  if (Math.abs(h) < 1e-9) return 'boundary'
  return h < 0 ? 'morning' : 'evening'
}

/**
 * 切点（晨昏线与纬线圈的切点）的纬度。
 *
 * 切点是晨昏线上的最高 / 最低纬度点，与太阳直射点纬度互余：
 *   δ = 0°（二分日）→ 切点在极点，纬度 90°；
 *   δ = 23.5°（二至日）→ 切点在极圈，纬度 66.5°。
 * 等价的说法是「切点到最近极地的角距 = |δ|」。
 */
export function terminatorTangentLatitude(delta) {
  return 90 - Math.abs(delta)
}

/** 切点到最近极地的角距（度）= |δ| */
export function tangentPolarDistance(delta) {
  return Math.abs(delta)
}

/**
 * 晨昏线与纬线圈的两个切点。
 * 一个落在正午经线（12 时）上，一个落在子夜经线（0 时）上；
 * 两者互为对跖点，纬度互为相反数。
 */
export function terminatorTangents(delta, subsolarLongitude) {
  const lat = terminatorTangentLatitude(delta)
  const sign = delta >= 0 ? 1 : -1
  return [
    {
      longitude: normalizeLongitude(subsolarLongitude),
      hour: 12,
      latitude: -sign * lat,
      note: '正午经线上的切点：直射点所在半球的对面',
    },
    {
      longitude: normalizeLongitude(subsolarLongitude + 180),
      hour: 0,
      latitude: sign * lat,
      note: '子夜经线上的切点：与直射点同一半球',
    },
  ]
}

/**
 * 晨线 / 昏线与赤道的交点：6 时与 18 时所在经线。
 */
export function equatorCrossings(subsolarLongitude) {
  return [
    {
      line: 'morning',
      hour: 6,
      longitude: normalizeLongitude(subsolarLongitude - 90),
    },
    {
      line: 'evening',
      hour: 18,
      longitude: normalizeLongitude(subsolarLongitude + 90),
    },
  ]
}

/* ------------------------------------------------------------------ *
 * 晨昏线的几何（正交投影，视点方向落在赤道面内）
 * ------------------------------------------------------------------ */

/**
 * 直射点的地心方向（x 朝 0° 经线、y 朝 90°E、z 朝北极）。
 */
export function subsolarDirection(delta, subsolarLongitude) {
  const d = toRad(delta)
  const l = toRad(subsolarLongitude)
  return [Math.cos(d) * Math.cos(l), Math.cos(d) * Math.sin(l), Math.sin(d)]
}

/**
 * 晨昏圈上某点属于晨线还是昏线（不依赖经度，δ = 0 时也稳）。
 * 顺着自转方向（自西向东）由夜入昼 → 晨线。
 */
export function terminatorSideOfPoint(point, subsolarVector) {
  const v = cross([0, 0, 1], point)
  return v[0] * subsolarVector[0] + v[1] * subsolarVector[1] + v[2] * subsolarVector[2] > 0
    ? 'morning'
    : 'evening'
}

/**
 * 晨昏圈（与太阳光线垂直、过球心的大圆）上的采样点。
 */
export function terminatorCircle(delta, subsolarLongitude, samples = 360) {
  const s = subsolarDirection(delta, subsolarLongitude)
  const ref = Math.abs(s[2]) < 0.999 ? [0, 0, 1] : [0, 1, 0]
  const u1 = normalize(cross(s, ref))
  const u2 = cross(s, u1)
  const points = []
  for (let i = 0; i < samples; i += 1) {
    const t = (i / samples) * 2 * Math.PI
    const ct = Math.cos(t)
    const st = Math.sin(t)
    points.push([u1[0] * ct + u2[0] * st, u1[1] * ct + u2[1] * st, u1[2] * ct + u2[2] * st])
  }
  return points
}

/**
 * 一个观察视角下的全部图形数据。
 *
 * 投影约定：视点方向落在赤道面内，于是纬线投影成水平直线段，
 * 经线投影成竖直的椭圆弧，晨昏线（大圆）投影成一段弧。
 * 返回值全是单位球坐标（半径 1、y 朝北），由组件换算成像素。
 *
 * center：视点中心所在的经度。正面视角取 λ0 + 45°，背面视角取 λ0 − 135°，
 * 这样两个视角合起来能看全两个切点与两个赤道交点。
 */
export function globeGeometry({
  delta,
  subsolarLongitude,
  center,
  observerLatitude = 0,
  parallels = [],
}) {
  const g = toRad(center)
  const toScreen = (vec) => ({
    x: -vec[0] * Math.sin(g) + vec[1] * Math.cos(g),
    y: vec[2],
  })
  const depth = (vec) => vec[0] * Math.cos(g) + vec[1] * Math.sin(g)

  const s = subsolarDirection(delta, subsolarLongitude)
  const circle = terminatorCircle(delta, subsolarLongitude, 360)

  const samples = circle.map((vec) => {
    const screen = toScreen(vec)
    return {
      vec,
      x: screen.x,
      y: screen.y,
      depth: depth(vec),
      visible: depth(vec) > 0,
      latitude: toDeg(Math.asin(clamp(vec[2], -1, 1))),
      side: terminatorSideOfPoint(vec, s),
    }
  })

  // 可见的一段是连续的：把数组转到「不可见点之后」开始，采样就不会首尾相接
  const hiddenIndex = samples.findIndex((p) => !p.visible)
  const ordered =
    hiddenIndex === -1
      ? samples
      : [...samples.slice(hiddenIndex + 1), ...samples.slice(0, hiddenIndex + 1)]
  const visible = ordered.filter((p) => p.visible)

  // 按晨 / 昏把可见段切成若干段
  const segments = []
  for (const point of visible) {
    const last = segments[segments.length - 1]
    if (last && last.kind === point.side) last.points.push(point)
    else segments.push({ kind: point.side, points: [point] })
  }
  for (const segment of segments) {
    const middle = segment.points[Math.floor(segment.points.length / 2)]
    segment.mid = { x: middle.x, y: middle.y }
  }

  // 夜半球：晨昏线可见段 + 边缘上背对太阳的那半个圆
  // 两段首尾相接成一个简单闭合区域：晨昏线从 A 走到 B，边缘半圆再从 B 回到 A
  const sunScreen = toScreen(s)
  const nightRegion = []
  if (visible.length) {
    const b = visible[visible.length - 1]
    const sunLen = Math.hypot(sunScreen.x, sunScreen.y) || 1
    const nightMid = { x: -sunScreen.x / sunLen, y: -sunScreen.y / sunLen }
    for (const point of visible) nightRegion.push({ x: point.x, y: point.y })
    const angB = Math.atan2(b.y, b.x)
    const midNight = Math.atan2(nightMid.y, nightMid.x)
    const ccw = angleGap(angB + Math.PI / 2, midNight) < angleGap(angB - Math.PI / 2, midNight)
    const steps = 72
    for (let i = 0; i <= steps; i += 1) {
      const t = angB + (ccw ? 1 : -1) * (i / steps) * Math.PI
      nightRegion.push({ x: Math.cos(t), y: Math.sin(t) })
    }
  }

  // 纬线圈：水平弦
  const parallelLines = parallels.map((phi) => ({
    phi,
    y: Math.sin(toRad(phi)),
    halfWidth: Math.cos(toRad(phi)),
  }))

  // 经线圈：竖直椭圆弧
  const meridianPoints = (longitude) => {
    const points = []
    const dl = toRad(longitude)
    for (let i = 0; i <= 72; i += 1) {
      const p = toRad(-90 + (180 * i) / 72)
      points.push({ x: Math.cos(p) * Math.sin(dl - g), y: Math.sin(p) })
    }
    return points
  }

  const noonLongitude = normalizeLongitude(subsolarLongitude)
  const midnightLongitude = normalizeLongitude(subsolarLongitude + 180)

  // 切点：晨线段与昏线段交界处（δ = 0 时就是极点）
  let tangent = null
  if (segments.length >= 2) {
    const junction = segments[0].points[segments[0].points.length - 1]
    tangent = { x: junction.x, y: junction.y, latitude: junction.latitude }
  } else if (segments.length === 1) {
    const points = segments[0].points
    const extreme = points.reduce((best, p) =>
      Math.abs(p.latitude) > Math.abs(best.latitude) ? p : best,
    )
    tangent = { x: extreme.x, y: extreme.y, latitude: extreme.latitude }
  }

  // 赤道交点：晨昏线上纬度最接近 0 的可见点
  let crossing = null
  for (const point of visible) {
    if (!crossing || Math.abs(point.latitude) < Math.abs(crossing.latitude)) {
      crossing = { x: point.x, y: point.y, latitude: point.latitude, side: point.side }
    }
  }

  // 观察点：放在正午经线上，与计算器的 H 对应
  const observerVec = (() => {
    const p = toRad(observerLatitude)
    const l = toRad(noonLongitude)
    return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)]
  })()
  const observerScreen = toScreen(observerVec)

  return {
    center,
    disc: { cx: 0, cy: 0, r: 1 },
    nightRegion,
    parallels: parallelLines,
    meridians: [
      {
        id: 'noon',
        longitude: noonLongitude,
        hour: 12,
        label: '12 时经线',
        points: meridianPoints(noonLongitude),
      },
      {
        id: 'midnight',
        longitude: midnightLongitude,
        hour: 0,
        label: '0 时经线',
        points: meridianPoints(midnightLongitude),
      },
    ],
    segments,
    tangent,
    crossing,
    observer: {
      x: observerScreen.x,
      y: observerScreen.y,
      visible: depth(observerVec) > 0,
      latitude: observerLatitude,
    },
    sun: { x: sunScreen.x, y: sunScreen.y },
  }
}

/* ------------------------------------------------------------------ *
 * 练习题
 * ------------------------------------------------------------------ */

/** 正面视角：视点中心在正午经线以东 45° */
export const FRONT_VIEW_OFFSET = 45

/** 背面视角：视点中心在正午经线以西 135° */
export const BACK_VIEW_OFFSET = -135

/** 某个视角的视点中心经度 */
export function viewCenter(subsolarLongitude, view) {
  return normalizeLongitude(
    subsolarLongitude + (view === 'back' ? BACK_VIEW_OFFSET : FRONT_VIEW_OFFSET),
  )
}

/**
 * 练习题：同一张图上标出甲、乙两段晨昏线，问哪一段是晨线。
 * 答案由几何算出来（PRACTICE_ITEMS 里从分段结果反推），题面里不写死。
 *
 * 文案里的占位符由组件替换：
 *   {{answer}} 晨线那一段的名称（甲或乙）
 *   {{other}}  昏线那一段的名称
 *   {{chosen}} 学生选的那一段的名称
 */
const PRACTICE_CASES = [
  {
    id: 'summer-front',
    title: '夏至 · 正面视角',
    delta: TROPIC_DEGREES,
    subsolarLongitude: 0,
    view: 'front',
    question: '图中甲、乙是同一圈晨昏线上的两段。哪一段是晨线（正在日出）？',
    hint: '先认自转方向：图上箭头指的是自西向东。再看跨过这一段之后，天是变亮还是变暗。',
    explain:
      '顺着自转方向（自西向东）跨过{{answer}}段之后，天由黑夜变成白天，所以**{{answer}}是晨线**；另一段{{other}}是天变暗的**昏线**。',
    wrong:
      '你选的{{chosen}}段顺着自转方向过去，天是由白变黑，所以它是**昏线**（正在日落）。判据只有一条：顺着自转方向，**由黑变白的是晨线**。',
  },
  {
    id: 'winter-front',
    title: '冬至 · 正面视角',
    delta: -TROPIC_DEGREES,
    subsolarLongitude: 30,
    view: 'front',
    question: '换了一个节气，晨线昏线还分得清吗？图中甲、乙哪一段是晨线？',
    hint: '节气和直射点经度都不影响判法：判据是自转方向与昼夜的变化。',
    explain:
      '冬至只是把直射点挪到南半球，判法没变。顺着自转方向跨过{{answer}}段天变亮，所以**{{answer}}是晨线**；{{other}}段是天变暗的**昏线**。',
    wrong:
      '你选的{{chosen}}段顺着自转方向过去，天是由白变黑，所以它是**昏线**。直射点在哪个半球都不改变判据：**由黑变白的是晨线**。',
  },
  {
    id: 'summer-back',
    title: '夏至 · 背面视角',
    delta: TROPIC_DEGREES,
    subsolarLongitude: 120,
    view: 'back',
    question: '这次从背面看。图中甲、乙哪一段是晨线？',
    hint: '背面视角里自转方向在图上还是自西向东，只是晨昏线的位置换了。',
    explain:
      '背面视角里，自转方向依然是自西向东。跨过{{answer}}段天由黑变白，所以**{{answer}}是晨线**；{{other}}段是天变暗的**昏线**。',
    wrong:
      '你选的{{chosen}}段顺着自转方向过去，天是由白变黑，所以它是**昏线**。正面还是背面都不改变判据：**由黑变白的是晨线**。',
  },
  {
    id: 'southern-back',
    title: '南半球夏至 · 背面视角',
    delta: -TROPIC_DEGREES,
    subsolarLongitude: 240,
    view: 'back',
    question: '直射点挪到南半球，图中甲、乙哪一段是晨线？',
    hint: '还是先找自转方向箭头，再判断跨线之后是变亮还是变暗。',
    explain:
      '顺着自转方向跨过{{answer}}段，天由黑变白，**{{answer}}是晨线**；{{other}}段是天变暗的**昏线**。直射点在哪个半球都不改变这个判据。',
    wrong:
      '你选的{{chosen}}段顺着自转方向过去，天是由白变黑，所以它是**昏线**。直射点的位置不参与判断，判据只有自转方向。',
  },
]

/** 分段在图上的称呼：甲、乙 */
export const SEGMENT_NAMES = { A: '甲', B: '乙' }

/**
 * 练习题实例：把几何分段接上题面，答案由「哪一段是晨线」反推。
 */
export const PRACTICE_ITEMS = PRACTICE_CASES.map((item) => {
  const geometry = globeGeometry({
    delta: item.delta,
    subsolarLongitude: item.subsolarLongitude,
    center: viewCenter(item.subsolarLongitude, item.view),
    observerLatitude: 0,
    parallels: [0],
  })
  const segments = geometry.segments.map((segment, index) => ({
    ...segment,
    id: index === 0 ? 'A' : 'B',
    name: index === 0 ? '甲' : '乙',
  }))
  const morning = segments.find((segment) => segment.kind === 'morning')
  const evening = segments.find((segment) => segment.kind === 'evening')
  return {
    ...item,
    segments,
    answerId: morning ? morning.id : '',
    answerName: morning ? morning.name : '',
    otherName: evening ? evening.name : '',
    geometry,
  }
})

/* ------------------------------------------------------------------ *
 * 观察点样本的选择器
 * ------------------------------------------------------------------ */

/** 节气里 δ 相同的项（比如春分与秋分），按名字排序后返回 */
export function termsByDelta(terms) {
  return [...terms].sort((a, b) => a.delta - b.delta || a.name.localeCompare(b.name))
}
