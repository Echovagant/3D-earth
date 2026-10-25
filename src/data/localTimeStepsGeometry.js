/**
 * §3.13 地方时的计算：四步法。
 *
 * 讲义的口诀与约定：
 *   · 简图：东西两条 180，零度中间行；0° 以西是西经、0° 以东是东经
 *   · 经度差：东经记正数、西经记负数，相减后取绝对值
 *   · 时间差：经度每差 1°，时间相差 4 分钟（60 ÷ 15）
 *   · 结果：所求地在已知地以东用加、以西用减；24 时制，有日期把日期带上
 *
 * 「以东用加」的判断在展开图上做：把西经画在负半轴、东经画在正半轴，
 * 所求地的位置在已知地的右边（数值更大）就是以东。
 */

/** 经度每差 1°，时间相差 4 分钟 */
export const MINUTES_PER_DEGREE = 4

/** 自转角速度：24 小时转 360°，即 15°/小时 */
export const DEGREES_PER_HOUR = 15

/**
 * 经度每差 1° 对应多少分钟 = 60 分钟 ÷ 15°。
 */
export function minutesPerDegree() {
  return 60 / DEGREES_PER_HOUR
}

/**
 * 经度差：相减取绝对值。
 *
 * 经度一律按「东经为正、西经为负」传入。
 * 例：东经 107° 与东经 120° 差 13°；东经 107° 与西经 178° 差 285°
 * （|107 − (−178)|，与讲义的练习表一致）。
 *
 * @param {number} lonA
 * @param {number} lonB
 */
export function longitudeDiff(lonA, lonB) {
  return Math.abs(lonA - lonB)
}

/**
 * 时间差（分钟）= 经度差 × 4。
 *
 * @param {number} lonDiffDeg 经度差（度）
 */
export function timeDiffMinutes(lonDiffDeg) {
  return lonDiffDeg * MINUTES_PER_DEGREE
}

/**
 * 所求地是否在已知地的东边（展开图上位置更靠右）。
 *
 * 经度按「东经为正、西经为负」传入，所以直接比大小即可。
 *
 * @param {number} targetLon
 * @param {number} knownLon
 */
export function isEastOf(targetLon, knownLon) {
  return targetLon > knownLon
}

/**
 * 四步法的算式：已知地 → 所求地。
 *
 * @param {number} knownHour 已知地地方时（小时）
 * @param {number} knownLon 已知地经度
 * @param {number} targetLon 所求地经度
 */
export function solveLocalTime(knownHour, knownLon, targetLon) {
  const diff = longitudeDiff(knownLon, targetLon)
  const minutes = timeDiffMinutes(diff)
  const east = isEastOf(targetLon, knownLon)
  const hours = knownHour + (east ? minutes : -minutes) / 60
  return { diff, minutes, east, hours }
}

/**
 * 把算出来的小时数写成 24 时制，并给出跨日的日数偏移。
 *
 * 减法不够减时的变通法（讲义原话）：把「10 月 11 日 18 点」写成
 * 「10 月 10 日 42 点」再减——就是这里的 dayShift。
 *
 * @param {number} hours 小时数（可越界）
 */
export function split24(hours) {
  let dayShift = 0
  let h = hours
  while (h < 0) {
    h += 24
    dayShift -= 1
  }
  while (h >= 24) {
    h -= 24
    dayShift += 1
  }
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return { dayShift, hours: hh, minutes: mm }
}

/**
 * 东西经半球展开图的横坐标：180°W 在左、0° 在中间、180°E 在右。
 *
 * @param {object} box { left, right }
 * @param {number} lon 经度
 */
export function expandedX(box, lon) {
  return box.left + ((lon + 180) / 360) * (box.right - box.left)
}

/**
 * 24 时制文字（如 11:42）。
 *
 * @param {number} hours 小时数（可越界）
 */
export function formatClock24(hours) {
  const { hours: h, minutes: m } = split24(hours)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
