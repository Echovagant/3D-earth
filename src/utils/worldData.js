/**
 * 世界国界数据的加载与派生计算。
 *
 * 数据由 scripts/update-world.mjs 从 Natural Earth 同步而来：
 * 177 个国家，含中文名、ISO 代码与人口估计。
 */

/** 世界国界数据文件地址 */
export const WORLD_DATA_URL = '/geojson/world-countries.json'

/** ISO_A3 为 -99 是 Natural Earth 的哨兵值，表示该地区没有 ISO 代码 */
const NO_ISO = '-99'

/** 加载世界国界 */
export async function loadWorldCountries() {
  const response = await fetch(WORLD_DATA_URL)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return await response.json()
}

/** 要素的稳定标识：有 ISO 代码就用它，没有就退回 ADM0_A3 */
export function countryId(feature) {
  const iso = feature?.properties?.ISO_A3
  if (iso && iso !== NO_ISO) return String(iso)
  return String(feature?.properties?.ADM0_A3 ?? '')
}

/** 要素的中文名，没有就退回英文名 */
export function countryName(feature) {
  return feature?.properties?.NAME_ZH || feature?.properties?.NAME || ''
}

/** 要素的人口估计 */
export function countryPopulation(feature) {
  const value = feature?.properties?.POP_EST
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/** 人口估计的统计年份 */
export function populationYear(feature) {
  const year = feature?.properties?.POP_YEAR
  return typeof year === 'number' ? year : null
}

/** 所属大洲 */
export function countryContinent(feature) {
  return feature?.properties?.CONTINENT || ''
}

/** 所属地区（联合国地区划分） */
export function countryRegion(feature) {
  return feature?.properties?.REGION_UN || ''
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
      const lon = coord[0]
      const lat = coord[1]
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

/** 人口格式化：按量级选单位 */
export function formatPopulation(value) {
  if (!Number.isFinite(value) || value <= 0) return '—'
  if (value >= 1e8) return `${(value / 1e8).toFixed(2)} 亿`
  if (value >= 1e4) return `${(value / 1e4).toFixed(1)} 万`
  return `${Math.round(value)}`
}

/**
 * 稳定配色：按标识哈希取色，保证同一个国家每次都是同一个颜色。
 *
 * 走黄金角螺旋取色相、明度按标识微调，相邻色相不至于撞在一起。
 * 返回 0xRRGGBB 数值：three.js 的 Color 不认 '0x' 开头的字符串。
 */
export function countryColor(id) {
  const key = String(id ?? '')
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  const hue = (hash % 360) / 360
  const saturation = 0.55 + ((hash >>> 8) % 20) / 100
  const lightness = 0.45 + ((hash >>> 16) % 20) / 100
  return hslToHex(hue, saturation, lightness)
}

/** 颜色转 CSS 用的十六进制字符串 */
export function countryColorCss(id) {
  return `#${countryColor(id).toString(16).padStart(6, '0')}`
}

/**
 * 按联合国次区域分区的配色。
 *
 * 与中国视角「按华北 / 华东 / 华南…分区」是同一套设计语言：大区定色相，
 * 大区内的次区域做小幅色相偏移，于是相邻地区连成一片、远看是连续的大色块，
 * 细看又能靠白色国界分出每个国家。
 */
const SUBREGION_HUES = {
  // 非洲：橙红
  'Eastern Africa': 22,
  'Middle Africa': 32,
  'Northern Africa': 38,
  'Southern Africa': 12,
  'Western Africa': 26,
  // 美洲：青
  Caribbean: 163,
  'Central America': 172,
  'South America': 186,
  'Northern America': 156,
  // 亚洲：红
  'Central Asia': 338,
  'Eastern Asia': 354,
  'South-Eastern Asia': 2,
  'Southern Asia': 344,
  'Western Asia': 332,
  // 欧洲：紫
  'Eastern Europe': 276,
  'Northern Europe': 254,
  'Southern Europe': 268,
  'Western Europe': 262,
  // 大洋洲：绿
  'Australia and New Zealand': 132,
  Melanesia: 114,
  Micronesia: 104,
  Polynesia: 92,
  // 极地
  Antarctica: 204,
  'Seven seas (open ocean)': 198,
}

/** 次区域取不到时的兜底色相 */
const FALLBACK_HUE = 210

/**
 * 要素的分区色（0xRRGGBB 数值）。
 *
 * 卫星底图上要留得住底图，所以饱和度与明度都比随机色克制。
 */
export function regionColor(feature) {
  const subregion = feature?.properties?.SUBREGION
  const hue = SUBREGION_HUES[subregion] ?? FALLBACK_HUE
  return hslToHex(hue / 360, 0.42, 0.52)
}

/** 分区色转 CSS 用的十六进制字符串 */
export function regionColorCss(feature) {
  return `#${regionColor(feature).toString(16).padStart(6, '0')}`
}

/** HSL 转十六进制颜色（返回 0xRRGGBB 数值） */
function hslToHex(h, s, l) {
  const a = s * Math.min(l, 1 - l)
  const f = (n) => {
    const k = (n + h * 12) % 12
    const value = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))
    return Math.round(255 * value)
  }
  return (f(0) << 16) | (f(8) << 8) | f(4)
}
