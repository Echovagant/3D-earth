/**
 * §3.1 地球自转的概念与方向：地轴、极点与极点俯视的几何。
 *
 * 自转方向在地球上只有一个——自西向东。从极点正上方往下看，
 * 北极看到的是逆时针、南极看到的是顺时针：这是同一个方向的两个视角，
 * 不是两个方向。所以箭头一律算出来，不靠手画。
 */
import { polarToXY } from './svgParts'
import { speedFromCircumference } from './rotationSpeedGeometry'

/** 地轴与公转轨道面法线的夹角（黄赤交角）——侧视图里地轴偏离铅垂线的角度 */
export const AXIS_TILT = 23.5

/** 地轴与公转轨道面的夹角——与黄赤交角互余 */
export const AXIS_TO_ECLIPTIC = 90 - AXIS_TILT

/** 地球赤道半径（km） */
export const EARTH_RADIUS_KM = 6378

/** 自转角速度：24 小时转 360° */
export const DEGREES_PER_HOUR = 360 / 24

/**
 * 赤道周长（km）= 2πR。
 *
 * @param {number} radiusKm 地球半径（km）
 */
export function equatorCircumferenceKm(radiusKm = EARTH_RADIUS_KM) {
  return 2 * Math.PI * radiusKm
}

/**
 * 纬度 φ 的纬线圈周长（km）= 2πR·cosφ。
 *
 * @param {number} latDeg 纬度（度）
 * @param {number} radiusKm 地球半径（km）
 */
export function latitudeCircumferenceKm(latDeg, radiusKm = EARTH_RADIUS_KM) {
  return 2 * Math.PI * radiusKm * Math.cos((latDeg * Math.PI) / 180)
}

/**
 * 赤道上的自转线速度（km/h）= 赤道周长 ÷ 24 小时。
 */
export function equatorSpeedKmh(radiusKm = EARTH_RADIUS_KM) {
  return speedFromCircumference(equatorCircumferenceKm(radiusKm))
}

/**
 * 侧视图中南北极点与赤道的位置。
 *
 * 地轴过地心，倾斜角 α 下北极在 (cx + R·sinα, cy − R·cosα)。
 * 赤道面垂直于地轴，在「过倾斜面」的侧视里就是一条过球心的水平线。
 *
 * @param {number} cx 球心 x
 * @param {number} cy 球心 y
 * @param {number} r 地球半径（像素）
 * @param {number} tiltDeg 地轴偏离铅垂线的角度
 */
export function axisPoles(cx, cy, r, tiltDeg = AXIS_TILT) {
  const a = (tiltDeg * Math.PI) / 180
  const ux = Math.sin(a)
  const uy = Math.cos(a)
  const north = { x: cx + r * ux, y: cy - r * uy }
  const south = { x: cx - r * ux, y: cy + r * uy }
  return {
    tiltDeg,
    north,
    south,
    /** 赤道：过球心的水平直径 */
    equator: { x1: cx - r, y1: cy, x2: cx + r, y2: cy },
  }
}

/**
 * 极点俯视时，纬度 φ 的纬线圈半径。
 *
 * 俯视看到的是「纬线圈的水平投影」，半径 = R·cosφ：
 * 赤道最大（R），极点为 0。
 *
 * @param {number} r 地球半径（像素）
 * @param {number} latDeg 纬度（度，北正南负）
 */
export function latitudeCircleRadius(r, latDeg) {
  return r * Math.cos((latDeg * Math.PI) / 180)
}

/**
 * 圆弧：从 startDeg 画到 endDeg，direction 决定绕行方向。
 *
 * 角度是数学角（0 在正右方、逆时针为正），与 polarToXY 同一套。
 * SVG 的 sweep-flag=1 是屏幕上的顺时针，所以逆时针取 0、顺时针取 1。
 *
 * @param {number} cx 圆心 x
 * @param {number} cy 圆心 y
 * @param {number} r 半径
 * @param {number} startDeg 起始角（数学角）
 * @param {number} endDeg 终止角（数学角）
 * @param {'ccw'|'cw'} direction 绕行方向
 */
export function arcBetween(cx, cy, r, startDeg, endDeg, direction = 'ccw') {
  const from = polarToXY(cx, cy, r, startDeg)
  const to = polarToXY(cx, cy, r, endDeg)
  const norm = (d) => ((d % 360) + 360) % 360
  const travel = direction === 'ccw' ? norm(endDeg - startDeg) : norm(startDeg - endDeg)
  const large = travel > 180 ? 1 : 0
  const sweep = direction === 'ccw' ? 0 : 1
  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`
}

/**
 * 极点俯视的自转箭头。
 *
 * 'ccw' = 从该极点正上方往下看是逆时针（北极）；'cw' = 顺时针（南极）。
 * 箭头从球体上方掠过，末端切线方向就是那一点的运动方向。
 *
 * @param {number} cx 圆心 x
 * @param {number} cy 圆心 y
 * @param {number} r 箭头所在圆的半径（应大于球半径）
 * @param {'ccw'|'cw'} direction 绕行方向
 */
export function polarSpinArrow(cx, cy, r, direction) {
  const start = direction === 'ccw' ? 20 : 160
  const end = direction === 'ccw' ? 160 : 20
  return {
    path: arcBetween(cx, cy, r, start, end, direction),
    tip: polarToXY(cx, cy, r, end),
    /** 末端切线方向（数学角）——箭头的朝向 */
    tangent: direction === 'ccw' ? end + 90 : end - 90,
  }
}
