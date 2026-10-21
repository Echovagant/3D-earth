/**
 * 行政区划数据的派生计算。
 *
 * 省级边界随仓库分发（public/geojson/），运行时不再请求第三方接口。
 */

/** 地球平均半径（公里），用于球面面积换算 */
export const EARTH_RADIUS_KM = 6371.0088

const toRad = (deg) => (deg * Math.PI) / 180

/**
 * 球面多边形面积（平方公里）。
 *
 * 用球面「鞋带公式」：把经纬度当作球面坐标，
 * 面积 = R²/2 · |Σ (λ₂-λ₁)·(sinφ₁ + sinφ₂)|
 * 外环为正、洞（内环）为负。
 */
function ringAreaKm2(ring) {
  if (!ring || ring.length < 3) return 0
  let total = 0
  for (let i = 0; i < ring.length; i++) {
    const [lon1, lat1] = ring[i]
    const [lon2, lat2] = ring[(i + 1) % ring.length]
    total += toRad(lon2 - lon1) * (Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)))
  }
  return Math.abs((total * EARTH_RADIUS_KM * EARTH_RADIUS_KM) / 2)
}

/**
 * GeoJSON 几何的球面面积（平方公里）。
 * 支持 Polygon 与 MultiPolygon；洞（内环）从外环面积里扣掉。
 */
export function geometryAreaKm2(geometry) {
  if (!geometry) return 0
  const { type, coordinates } = geometry

  // Polygon 的 coordinates = [外环, 洞1, 洞2, ...]
  // MultiPolygon 的 coordinates = [[外环, 洞...], [...], ...]
  const polygonArea = (polygon) => {
    const [outer, ...holes] = polygon
    const holeArea = holes.reduce((sum, ring) => sum + ringAreaKm2(ring), 0)
    return Math.max(0, ringAreaKm2(outer) - holeArea)
  }

  if (type === 'Polygon') return polygonArea(coordinates)
  if (type === 'MultiPolygon') {
    return coordinates.reduce((sum, polygon) => sum + polygonArea(polygon), 0)
  }
  return 0
}

/** 要素的球面面积（平方公里） */
export function featureAreaKm2(feature) {
  return geometryAreaKm2(feature?.geometry)
}

/** 把面积格式化成「x,xxx km²」 */
export function formatArea(km2) {
  if (!Number.isFinite(km2) || km2 <= 0) return '—'
  return `${Math.round(km2).toLocaleString('en-US')} km²`
}

/** 要素的层级：'province' / 'city' / 'district' / 'country' */
export function featureLevel(feature) {
  return feature?.properties?.level ?? ''
}

/** 要素的父级 adcode */
export function featureParentAdcode(feature) {
  const parent = feature?.properties?.parent
  return parent == null ? null : String(parent.adcode)
}
