/**
 * 球面交互的纯函数。
 *
 * 这些计算原先内联在两个场景组件里，既没法单测，又在拷贝过程中漂移
 * （拾取归一化、飞行插值、目标点随地球自转的旋转各写了两份）。
 * 抽到这里后两个场景共用一份，行为变化也有回归网。
 */

/**
 * 指针位置归一化到 NDC（-1..1）。
 *
 * @param {number} clientX 事件里的 clientX
 * @param {number} clientY 事件里的 clientY
 * @param {{left:number, top:number, width:number, height:number}} rect 画布位置
 */
export function pointerToNdc(clientX, clientY, rect) {
  const x = ((clientX - rect.left) / rect.width) * 2 - 1
  const y = -((clientY - rect.top) / rect.height) * 2 + 1
  return { x, y }
}

/**
 * 缓入缓出（三次）：飞行插值用。
 *
 * t ∈ [0,1] → [0,1]，两端速度为 0。
 */
export function easeInOutCubic(t) {
  if (!Number.isFinite(t)) return 0
  const clamped = Math.min(1, Math.max(0, t))
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2
}

/**
 * 球面坐标绕 Y 轴旋转。
 *
 * 地球自转时，飞行的目标点要跟着一起转，否则飞行途中目标会飘走。
 * 与 three 的 applyAxisAngle(Y 轴) 同一套约定。
 *
 * @param {{x:number,y:number,z:number}} point
 * @param {number} angle 弧度
 */
export function spinAroundY(point, angle) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos,
  }
}

/**
 * 要素的球面质心（经纬度）。
 *
 * 用单位向量求平均而不是直接平均经纬度：俄罗斯这类横跨 180° 经线的国家，
 * 直接平均会跑到太平洋里去。
 */
export function featureCenter(feature) {
  const rings = []
  if (feature?.geometry?.type === 'Polygon') rings.push(...feature.geometry.coordinates)
  else if (feature?.geometry?.type === 'MultiPolygon') {
    for (const polygon of feature.geometry.coordinates) rings.push(...polygon)
  }

  let x = 0
  let y = 0
  let z = 0
  let count = 0
  for (const ring of rings) {
    for (const coord of ring) {
      const [lon, lat] = coord
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
      const phi = (lon * Math.PI) / 180
      const theta = (lat * Math.PI) / 180
      x += Math.cos(theta) * Math.cos(phi)
      y += Math.cos(theta) * Math.sin(phi)
      z += Math.sin(theta)
      count++
    }
  }
  if (!count) return null
  const length = Math.hypot(x, y, z)
  if (!length) return null
  return [
    (Math.atan2(y / length, x / length) * 180) / Math.PI,
    (Math.asin(z / length) * 180) / Math.PI,
  ]
}

/**
 * 相机飞行的插值位置。
 *
 * @param {{x:number,y:number,z:number}} from 起点
 * @param {{x:number,y:number,z:number}} to 终点
 * @param {number} t 进度 ∈ [0,1]
 */
export function lerpPoint(from, to, t) {
  const eased = easeInOutCubic(t)
  return {
    x: from.x + (to.x - from.x) * eased,
    y: from.y + (to.y - from.y) * eased,
    z: from.z + (to.z - from.z) * eased,
  }
}
