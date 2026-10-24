/**
 * 东西经半球展开图的几何（§2.9 经度的判读）。
 *
 * 展开图 = 把北半球从 90°E（东经半球）或 90°W（西经半球）正对着看的那一半：
 *   半圆的弧   = 0° 与 180° 两条经线的北半圈（所以 0°、180° 是直径两端）；
 *   半圆的直径 = 赤道；
 *   顶点       = 北极点；
 *   里面的弧线 = 其余经线（从北极点画到赤道上的落点）；
 *   横着的弧   = 纬线。
 *
 * 按「上北下南、左西右东」，直径上从左到右就是自西向东。于是：
 *   东经半球：0° 在左端、180° 在右端 → 自西向东度数变大；
 *   西经半球：180° 在左端、0° 在右端 → 自西向东度数变小。
 * 这就是「找一条特殊经线，看度数往哪边变」的通用法。
 */

/** 经线：半球展开图上从北极点（顶点）画到赤道上落点的那段弧 */
export function hemisphereMeridianPath(cx, cy, r, lon, side) {
  const c = Math.cos((lon * Math.PI) / 180)
  const dx = side === 'east' ? -r * c : r * c
  const rx = Math.abs(dx)
  const sweep = dx < 0 ? 0 : 1
  return `M ${cx} ${cy - r} A ${rx.toFixed(2)} ${r} 0 0 ${sweep} ${(cx + dx).toFixed(2)} ${cy}`
}

/** 经线在赤道（直径）上的落点 x */
export function hemisphereMeridianX(cx, r, lon, side) {
  const c = Math.cos((lon * Math.PI) / 180)
  return cx + (side === 'east' ? -r * c : r * c)
}

/** 纬线：横过半球的那一段弧 */
export function hemisphereParallelPath(cx, cy, r, lat) {
  const rx = r * Math.cos((lat * Math.PI) / 180)
  const ry = r * Math.sin((lat * Math.PI) / 180)
  return `M ${(cx - rx).toFixed(2)} ${(cy - ry).toFixed(2)} A ${rx.toFixed(2)} ${ry.toFixed(2)} 0 0 1 ${(cx + rx).toFixed(2)} ${(cy - ry).toFixed(2)}`
}

/** 经线的标注文字（0° 和 180° 没有 E/W） */
export function longitudeLabel(lon, side) {
  if (lon === 0) return '0°'
  if (lon === 180) return '180°'
  return side === 'east' ? `${lon}°E` : `${lon}°W`
}

/** 自西向东（直径上从左到右）走，度数是变大还是变小 */
export function degreesIncreaseEastward(side) {
  return side === 'east'
}
