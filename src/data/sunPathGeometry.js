/**
 * 太阳周日视运动的几何（§4.5）。
 *
 * 两个公式撑着这一节：
 *   正午太阳高度角 H = 90° − |当地纬度 − 太阳直射点纬度|
 *   日出日落方位角：cos A = sinδ / cosφ（A 自北起顺时针）
 *
 * 天球用透视图画：地平圈画成椭圆（近边在下、远边在上），
 * 竖直圈（北—天顶—南）画成上面半个椭圆，太阳的日轨按真实高度角与方位角投影上去。
 */

/** 正午太阳高度角 */
export function noonAltitude(latDeg, declDeg) {
  return 90 - Math.abs(latDeg - declDeg)
}

/** 日出（正午以东）方位角：自北起顺时针，单位度 */
export function sunriseAzimuth(latDeg, declDeg) {
  const phi = (latDeg * Math.PI) / 180
  const delta = (declDeg * Math.PI) / 180
  const c = Math.sin(delta) / Math.cos(phi)
  if (c > 1) return 0
  if (c < -1) return 180
  return (Math.acos(c) * 180) / Math.PI
}

/**
 * 某时刻太阳的高度角与方位角。
 *
 * @param {number} latDeg 当地纬度
 * @param {number} declDeg 太阳直射点纬度
 * @param {number} hourAngleDeg 时角：正午 0，向西（下午）为正
 */
export function sunPosition(latDeg, declDeg, hourAngleDeg) {
  const phi = (latDeg * Math.PI) / 180
  const delta = (declDeg * Math.PI) / 180
  const H = (hourAngleDeg * Math.PI) / 180
  const sinH = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(H)
  const alt = Math.asin(Math.max(-1, Math.min(1, sinH)))
  const cosA =
    (Math.sin(delta) - Math.sin(phi) * sinH) / (Math.cos(phi) * Math.cos(alt) || 1e-9)
  let az = (Math.acos(Math.max(-1, Math.min(1, cosA))) * 180) / Math.PI
  if (H > 0) az = 360 - az
  return { altitude: (alt * 180) / Math.PI, azimuth: az }
}

/** 太阳在地平线上的时角范围（负 = 日出，正 = 日落） */
export function hourAngleRange(latDeg, declDeg) {
  const phi = (latDeg * Math.PI) / 180
  const delta = (declDeg * Math.PI) / 180
  const c = -Math.tan(phi) * Math.tan(delta)
  if (c >= 1) return { from: -180, to: 180, polarDay: true, polarNight: false }
  if (c <= -1) return { from: 0, to: 0, polarDay: false, polarNight: true }
  const H = (Math.acos(c) * 180) / Math.PI
  return { from: -H, to: H, polarDay: false, polarNight: false }
}

/** 昼长（小时） */
export function dayLengthHours(latDeg, declDeg) {
  const r = hourAngleRange(latDeg, declDeg)
  if (r.polarDay) return 24
  if (r.polarNight) return 0
  return (2 * r.to) / 15
}

/**
 * 天球透视图的投影。
 *
 * @param {object} box { cx, cy, rx, ry, height }
 */
export function domeProjection(box) {
  return (altitudeDeg, azimuthDeg) => {
    const alt = (altitudeDeg * Math.PI) / 180
    const az = (azimuthDeg * Math.PI) / 180
    const ca = Math.cos(alt)
    return {
      x: box.cx - box.rx * ca * Math.cos(az),
      y: box.cy - box.height * Math.sin(alt) + box.ry * ca * Math.sin(az),
    }
  }
}

/**
 * 太阳一天的轨迹（画布点列）。
 */
export function sunTrack(latDeg, declDeg, project, steps = 96) {
  const r = hourAngleRange(latDeg, declDeg)
  const pts = []
  for (let i = 0; i <= steps; i += 1) {
    const h = r.from + ((r.to - r.from) * i) / steps
    const p = sunPosition(latDeg, declDeg, h)
    const q = project(p.altitude, p.azimuth)
    pts.push({ ...p, hourAngle: h, x: q.x, y: q.y })
  }
  return pts
}

/** 正午太阳在正南还是正北：直射点纬度小于当地纬度 → 正南；大于 → 正北 */
export function noonSide(latDeg, declDeg) {
  if (Math.abs(latDeg - declDeg) < 1e-9) return 'overhead'
  return declDeg < latDeg ? 'south' : 'north'
}

/**
 * 正午太阳的方位角（自北起顺时针）。
 *
 * 正午时太阳一定落在地方子午线上，所以方位只有两种：
 *   直射点在当地以南（δ < φ）→ 180°（正南）；
 *   直射点在当地以北（δ > φ）→ 0°（正北）；
 *   直射点就在当地 → 90°（天顶，方位无意义）。
 */
export function noonAzimuth(latDeg, declDeg) {
  const p = sunPosition(latDeg, declDeg, 0)
  if (Math.abs(latDeg - declDeg) < 1e-9) return 90
  return p.azimuth
}

/**
 * 方位角的读法：北偏东 58.7° / 正南 …
 *
 * 方位角自北起顺时针量，正北 0°、正东 90°、正南 180°、正西 270°。
 */
export function azimuthBearingText(azDeg) {
  const a = (((azDeg % 360) + 360) % 360)
  if (a < 0.05 || a > 359.95) return '正北'
  if (Math.abs(a - 90) < 0.05) return '正东'
  if (Math.abs(a - 180) < 0.05) return '正南'
  if (Math.abs(a - 270) < 0.05) return '正西'
  if (a < 90) return `北偏东 ${a.toFixed(1)}°`
  if (a < 180) return `东偏南 ${(180 - a).toFixed(1)}°`
  if (a < 270) return `南偏西 ${(a - 180).toFixed(1)}°`
  return `西偏北 ${(360 - a).toFixed(1)}°`
}

/** 昼长的读法：14 小时 51 分 */
export function dayLengthText(latDeg, declDeg) {
  const h = dayLengthHours(latDeg, declDeg)
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${hh} 小时 ${mm} 分`
}
