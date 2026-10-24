/**
 * 「劣弧定东西」的几何（§2.13 经纬网定相对方向）。
 *
 * 两点之间沿同一条纬线有两条路：顺地球自转方向往东、逆自转方向往西。
 * 走得近的那条是劣弧（所对圆心角 < 180°），远的那条是优弧。
 * 两点的东西关系按近路判——这就是「经度差 > 180° 要把左右对调」的道理。
 *
 * 俯视图上同心圆的圆心就是极点，所以「圆心角」就是经度差：
 * 近的那条 < 180°，远的那条 > 180°。
 */

/** 归一化到 0~360 的经度 */
export function normalizeEast(lon) {
  return ((lon % 360) + 360) % 360
}

/** 从 lon1 自东（经度增大）走到 lon2 的经度差（0~360） */
export function eastwardDifference(lon1, lon2) {
  return normalizeEast(lon2 - lon1)
}

/** 从 lon1 自西（经度减小）走到 lon2 的经度差（0~360） */
export function westwardDifference(lon1, lon2) {
  return normalizeEast(lon1 - lon2)
}

/** 近路的方向：'east' 表示往东近，'west' 表示往西近 */
export function nearerDirection(lon1, lon2) {
  return eastwardDifference(lon1, lon2) <= 180 ? 'east' : 'west'
}

/** 劣弧所对圆心角（度）——近的那条一定小于 180° */
export function minorArcAngle(lon1, lon2) {
  const east = eastwardDifference(lon1, lon2)
  return Math.min(east, 360 - east)
}

/** 优弧所对圆心角（度） */
export function majorArcAngle(lon1, lon2) {
  return 360 - minorArcAngle(lon1, lon2)
}

/**
 * 球面上两点之间的大圆劣弧所对圆心角（度）。
 * cos(d) = sinφ₁·sinφ₂ + cosφ₁·cosφ₂·cosΔλ
 */
export function greatCircleAngle(lat1, lon1, lat2, lon2) {
  const p1 = (lat1 * Math.PI) / 180
  const p2 = (lat2 * Math.PI) / 180
  const dl = ((lon2 - lon1) * Math.PI) / 180
  const c = Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(dl)
  return (Math.acos(Math.min(1, Math.max(-1, c))) * 180) / Math.PI
}

/**
 * 弧的跨度（度）：from 到 to，按指定方向走。
 * 逆时针为正方向，顺时针为负方向。
 */
export function arcSpan(fromDeg, toDeg, clockwise = false) {
  let delta = toDeg - fromDeg
  if (clockwise) {
    while (delta > 0) delta -= 360
  } else {
    while (delta < 0) delta += 360
  }
  return delta
}

/** 弧中点的角度 */
export function arcMidAngle(fromDeg, toDeg, clockwise = false) {
  return fromDeg + arcSpan(fromDeg, toDeg, clockwise) / 2
}

/**
 * 圆上两点之间的弧（角度以正右方为 0、逆时针为正）。
 * clockwise = true 时走顺时针那一段。
 */
export function arcBetween(cx, cy, r, fromDeg, toDeg, clockwise = false) {
  const delta = arcSpan(fromDeg, toDeg, clockwise)
  const a = (fromDeg * Math.PI) / 180
  const b = (toDeg * Math.PI) / 180
  const from = { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }
  const to = { x: cx + r * Math.cos(b), y: cy - r * Math.sin(b) }
  const large = Math.abs(delta) > 180 ? 1 : 0
  const sweep = clockwise ? 1 : 0
  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`
}
