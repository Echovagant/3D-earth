/**
 * §3.2 恒星日与太阳日：轨道、太阳焦点与「多转的那一点」。
 *
 * 讲义原话：太阳日地球自转了 **360°59′**——那 59′ 是**角度**（角分），
 * 不是 59 分钟。两个周期的时间差是 24 时 − 23 时 56 分 4 秒 ≈ **4 分钟**。
 * 这两个「59 / 4」别混。
 *
 * 几何上：太阳在椭圆轨道的一个焦点上；一天里地球在轨道上走过的角度
 * 就是日均太阳运动 360°/365.25，地球要多转这个角度才能重新对上太阳。
 */
import { polarToXY } from './svgParts'

/** 一个太阳日里地球在公转轨道上走过的角度（度）——日均太阳运动 */
export const ORBIT_PER_DAY_DEG = 360 / 365.25

/** 自转角速度：15°/小时 */
export const DEGREES_PER_HOUR = 15

/** 一年的天数 */
export const DAYS_PER_YEAR = 365.25

/** 换算成角分：约 59′（这是角度，不是时间） */
export const EXTRA_ARC_MINUTES = ORBIT_PER_DAY_DEG * 60

/** 恒星日长度（小时）：24 小时里自转了 360° + ORBIT_PER_DAY_DEG */
export const SIDEREAL_DAY_HOURS = (24 * 360) / (360 + ORBIT_PER_DAY_DEG)

/** 恒星日 = 23 时 56 分 4 秒 */
export const SIDEREAL_DAY_TEXT = '23 时 56 分 4 秒'

/** 太阳日 = 24 小时 */
export const SOLAR_DAY_TEXT = '24 小时'

/** 两个周期的时间差（分钟）：≈ 3 分 56 秒 */
export const DAY_DIFF_MINUTES = (24 - SIDEREAL_DAY_HOURS) * 60

/** 图上把「多转的那 0.98°」放大的倍数（真实值太小，看不见） */
export const DRAW_EXTRA_DEG = 20

/**
 * 把小时数拆成「时 分 秒」，用来验证恒星日的数值。
 *
 * @param {number} hours 小时数
 */
export function splitDuration(hours) {
  const totalSeconds = Math.round(hours * 3600)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return { h, m, s }
}

/**
 * 「多转的那一点」折算成时间（小时）。
 *
 * 每天公转走的角度 ÷ 自转角速度 = 要多花的时间。
 */
export function extraArcHours() {
  return ORBIT_PER_DAY_DEG / DEGREES_PER_HOUR
}

/**
 * 两个周期的时间差（秒）。
 */
export function dayDiffSeconds() {
  return (24 - SIDEREAL_DAY_HOURS) * 3600
}

/** 角度归一化到 [0, 360) */
export function normalizeDeg(d) {
  return ((d % 360) + 360) % 360
}

/**
 * 椭圆轨道：太阳在其中一个焦点上，地球先放在远日顶点（最右端）。
 *
 * @param {object} box { cx, cy, a, b }——圆心与长短半轴
 */
export function buildOrbit({ cx, cy, a, b }) {
  const c = Math.sqrt(a * a - b * b)
  return {
    cx,
    cy,
    a,
    b,
    c,
    /** 太阳在左焦点 */
    sun: { x: cx - c, y: cy },
    /** 地球的初始位置：椭圆最右端（离太阳最远） */
    earthA: { x: cx + a, y: cy },
  }
}

/**
 * 椭圆上的点。t 增大 = 屏幕上逆时针（与地球公转方向一致）。
 *
 * @param {object} orbit buildOrbit 的结果
 * @param {number} tDeg 参数角（度）
 */
export function ellipsePoint(orbit, tDeg) {
  const t = (tDeg * Math.PI) / 180
  return { x: orbit.cx + orbit.a * Math.cos(t), y: orbit.cy - orbit.b * Math.sin(t) }
}

/**
 * 椭圆上某点的切线方向（数学角，0 在正右方、逆时针为正）。
 *
 * 参数式 (a·cos t, −b·sin t) 的导数是 (−a·sin t, −b·cos t)，
 * 换回数学角即 atan2(b·cos t, −a·sin t)。
 *
 * @param {object} orbit buildOrbit 的结果
 * @param {number} tDeg 参数角（度）
 */
export function ellipseTangent(orbit, tDeg) {
  const t = (tDeg * Math.PI) / 180
  return (Math.atan2(orbit.b * Math.cos(t), -orbit.a * Math.sin(t)) * 180) / Math.PI
}

/**
 * 从某点看向太阳的方位角（数学角：0 在正右方、逆时针为正）。
 *
 * @param {{x:number,y:number}} from 观察点
 * @param {{x:number,y:number}} sun 太阳位置
 */
export function sunBearingDeg(from, sun) {
  const dx = sun.x - from.x
  const dy = sun.y - from.y
  return (Math.atan2(-dy, dx) * 180) / Math.PI
}

/**
 * 地球沿轨道前进 tDeg 后，太阳方位转过了多少度。
 *
 * @param {object} orbit buildOrbit 的结果
 * @param {number} tDeg 参数角（度）
 */
export function bearingShiftDeg(orbit, tDeg) {
  const base = sunBearingDeg(orbit.earthA, orbit.sun)
  return normalizeDeg(sunBearingDeg(ellipsePoint(orbit, tDeg), orbit.sun) - base)
}

/**
 * 求「太阳方位正好转过 deltaDeg」所需的公转参数角。
 *
 * 方位随 t 单调递增（公转逆时针 → 太阳方位也逆时针转），
 * 所以二分求解。
 *
 * @param {object} orbit buildOrbit 的结果
 * @param {number} deltaDeg 目标方位变化量（度）
 */
export function advanceForBearingShift(orbit, deltaDeg) {
  let lo = 0
  let hi = 90
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2
    if (bearingShiftDeg(orbit, mid) < deltaDeg) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/**
 * 演示用的画面方案：地球从 A 前进到 B，太阳方位正好转过 DRAW_EXTRA_DEG。
 *
 * @param {object} orbit buildOrbit 的结果
 */
export function drawPlan(orbit) {
  const t = advanceForBearingShift(orbit, DRAW_EXTRA_DEG)
  const earthB = ellipsePoint(orbit, t)
  const bearingA = sunBearingDeg(orbit.earthA, orbit.sun)
  const bearingB = sunBearingDeg(earthB, orbit.sun)
  return {
    t,
    earthA: orbit.earthA,
    earthB,
    bearingA,
    bearingB,
    /** 真实值：一天里太阳方位转过的角度 */
    trueExtraDeg: ORBIT_PER_DAY_DEG,
    /** 图上放大了多少倍 */
    magnification: DRAW_EXTRA_DEG / ORBIT_PER_DAY_DEG,
  }
}

/**
 * 椭圆画成一条路径（用两组半圆弧拼），便于统一描边。
 *
 * @param {number} cx 圆心 x
 * @param {number} cy 圆心 y
 * @param {number} a 长半轴
 * @param {number} b 短半轴
 */
export function ellipsePath(cx, cy, a, b) {
  const r = `A ${a} ${b} 0 1 0`
  return `M ${cx - a} ${cy} ${r} ${cx + a} ${cy} ${r} ${cx - a} ${cy} Z`
}

/**
 * 圆弧：从 startDeg 画到 endDeg，direction 决定绕行方向。
 *
 * 角度是数学角（0 在正右方、逆时针为正）。SVG 的 sweep-flag=1 是屏幕上的
 * 顺时针，所以逆时针取 0、顺时针取 1。
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
  const travel =
    direction === 'ccw' ? normalizeDeg(endDeg - startDeg) : normalizeDeg(startDeg - endDeg)
  const large = travel > 180 ? 1 : 0
  const sweep = direction === 'ccw' ? 0 : 1
  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`
}

/**
 * 地面上一点在自转中的运动方向（俯视：逆时针即北半球视角）。
 *
 * @param {number} cx 圆心 x
 * @param {number} cy 圆心 y
 * @param {number} r 半径
 * @param {number} angleDeg 方位角（数学角）
 */
export function spinVelocityAt(cx, cy, r, angleDeg) {
  const p = polarToXY(cx, cy, r, angleDeg)
  // 逆时针切线：方位角 + 90°
  const tangent = angleDeg + 90
  return { x: p.x, y: p.y, tangent }
}
