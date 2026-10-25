/**
 * §3.12 地方时：概念与「东先西后」。
 *
 * 地方时 = 某一地方相对太阳的位置，只与经度有关，与纬度无关。
 * 判据：正午经线 12 时、昏线 18 时、晨线 6 时、背面的 0 时经线 0 时。
 *
 * 几何上用「北极点上方俯视」最省事：
 *   圆心是北极点，同心圆是纬线，半径 = R·cosφ；
 *   逆时针 = 自西向东 = 经度增大 = 地方时读数增大。
 */
import { localHour, SUBSOLAR_LON } from './terminatorGeometry'

/** 经度每差 1°，时间相差 4 分钟 */
export const MINUTES_PER_DEGREE = 4

/** 自转角速度：24 小时转 360°，即 15°/小时 */
export const DEGREES_PER_HOUR = 15

/** 直接复用晨昏线那一套：某经度上的地方时 */
export { localHour }

/** 角度归一化到 [0, 360) */
export function normalizeDeg(d) {
  return ((d % 360) + 360) % 360
}

/** 经度归一化到 [-180, 180]（180 与 -180 是同一条经线，这里保留 180） */
export function wrapLon(lon) {
  if (lon < -180) return lon + 360
  if (lon > 180) return lon - 360
  return lon
}

/**
 * 四条特殊经线：0 时 / 6 时 / 12 时 / 18 时。
 *
 * 它们分别在太阳直射经线的 ±180° 与 ±90° 上：
 *   正午经线（直射点所在）= 12 时；它西侧 90° = 晨线 6 时；
 *   东侧 90° = 昏线 18 时；再往东 90° = 0 时经线（在背面）。
 *
 * @param {number} subsolarLon 太阳直射经线
 */
export function specialMeridians(subsolarLon = SUBSOLAR_LON) {
  return [
    { lon: wrapLon(subsolarLon - 180), hour: 0, label: '0 时', note: '在背面' },
    { lon: wrapLon(subsolarLon - 90), hour: 6, label: '6 时', note: '晨线' },
    { lon: wrapLon(subsolarLon), hour: 12, label: '12 时', note: '正午经线' },
    { lon: wrapLon(subsolarLon + 90), hour: 18, label: '18 时', note: '昏线' },
  ]
}

/**
 * 极点俯视里，某个方位角对应的经度。
 *
 * 俯视时逆时针 = 向东 = 经度增大，360° 对应 360° 经度。
 * 正午经线画在正下方（方位角 270°）。
 *
 * @param {number} angleDeg 俯视图上的方位角（数学角）
 * @param {number} subsolarLon 太阳直射经线
 */
export function longitudeAtAngle(angleDeg, subsolarLon = SUBSOLAR_LON) {
  const noonAngle = 270
  return wrapLon(subsolarLon + (angleDeg - noonAngle))
}

/**
 * 方位角对应的局部时读数（小时）。
 *
 * @param {number} angleDeg 俯视图上的方位角（数学角）
 * @param {number} subsolarLon 太阳直射经线
 */
export function hourAtAngle(angleDeg, subsolarLon = SUBSOLAR_LON) {
  const lon = longitudeAtAngle(angleDeg, subsolarLon)
  return normalizeHours(localHour(lon, subsolarLon))
}

/** 小时数归一化到 [0, 24) */
export function normalizeHours(h) {
  return ((h % 24) + 24) % 24
}

/**
 * 经度每差 1° 对应多少分钟 = 60 分钟 ÷ 15°。
 */
export function minutesPerDegree() {
  return 60 / DEGREES_PER_HOUR
}

/**
 * 经度差（度）换算成时间差（小时）。
 *
 * @param {number} lonDiffDeg 经度差（度）
 */
export function hoursForLonDiff(lonDiffDeg) {
  return lonDiffDeg / DEGREES_PER_HOUR
}

/**
 * 钟面上指针的角度（数学角，0 在正右方、逆时针为正）。
 *
 * 12 点在正上方（90°），每过一小时指针顺时针走 30°。
 *
 * @param {number} hour 小时数（含小数）
 */
export function clockHandAngles(hour) {
  const h = ((hour % 12) + 12) % 12
  return { hour: 90 - h * 30, minute: 90 }
}

/**
 * 把小时数写成「几时几分」的文字。
 *
 * @param {number} hour 小时数
 */
export function formatClock(hour) {
  const h = Math.floor(normalizeHours(hour))
  const m = Math.round((normalizeHours(hour) - h) * 60)
  return `${h} 时${m === 0 ? '' : ` ${m} 分`}`
}
