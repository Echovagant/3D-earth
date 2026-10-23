/**
 * 世界国界数据的加载与派生计算。
 *
 * 数据由 scripts/update-world.mjs 同步而来：239 个国家/地区，
 * 每个要素带简体中文名、ISO 3166-1 代码与联合国 M49 的地区划分。
 *
 * 这里没有人口：没有可自动同步的权威人口源，与其放一个几年不更新的
 * 估计值，不如不展示——详情页展示的是从边界几何实算的面积。
 */
import { featureCenter } from './globeMath'
import { assetUrl } from './base'

export { featureCenter }

/** 世界国界数据文件地址 */
export const WORLD_DATA_URL = assetUrl('/geojson/world-countries.json')

/** 加载世界国界 */
export async function loadWorldCountries() {
  const response = await fetch(WORLD_DATA_URL)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return await response.json()
}

/** 要素的稳定标识：ISO 3166-1 alpha-3 代码 */
export function countryId(feature) {
  return feature?.properties?.iso3 ?? ''
}

/** 要素的中文名 */
export function countryName(feature) {
  return feature?.properties?.name ?? ''
}

/** 要素的中文全称，例如「中华人民共和国」 */
export function countryFullName(feature) {
  return feature?.properties?.fullName ?? ''
}

/** 要素的英文名 */
export function countryNameEn(feature) {
  return feature?.properties?.nameEn ?? ''
}

/** 要素的 ISO 3166-1 alpha-2 代码 */
export function countryIso2(feature) {
  return feature?.properties?.iso2 ?? ''
}

/** 所属大洲（联合国 M49） */
export function countryContinent(feature) {
  return feature?.properties?.region ?? ''
}

/** 所属次区域（联合国 M49） */
export function countryRegion(feature) {
  return feature?.properties?.subregion ?? ''
}

/**
 * 按次区域分区的配色。
 *
 * 与中国视角「按华北 / 华东 / 华南…分区」是同一套设计语言：大区定色相，
 * 大区内的次区域做小幅色相偏移，于是相邻地区连成一片、远看是连续的大色块，
 * 细看又能靠白色国界分出每个国家。
 *
 * 色相表用 Map 而不是对象字面量：对象会把 `constructor` 之类的原型属性
 * 当成合法键，上游一旦出现这种值就会算出 NaN 颜色。
 */
const SUBREGION_HUES = new Map([
  // 非洲：橙红
  ['Eastern Africa', 22],
  ['Middle Africa', 32],
  ['Northern Africa', 38],
  ['Southern Africa', 12],
  ['Western Africa', 26],
  // 美洲：青
  ['Caribbean', 163],
  ['Central America', 172],
  ['Northern America', 156],
  ['South America', 186],
  // 亚洲：红
  ['Central Asia', 338],
  ['Eastern Asia', 354],
  ['South-eastern Asia', 2],
  ['Southern Asia', 344],
  ['Western Asia', 332],
  // 欧洲：紫
  ['Eastern Europe', 276],
  ['Northern Europe', 254],
  ['Southern Europe', 268],
  ['Western Europe', 262],
  // 大洋洲：绿
  ['Australia and New Zealand', 132],
  ['Melanesia', 114],
  ['Micronesia', 104],
  ['Polynesia', 92],
])

/**
 * 次区域缺失时的兜底：按大洲定色相。
 *
 * 南极洲与几处南太平洋属地没有次区域划分，用大洲兜底后仍与周边同色系。
 */
const REGION_HUES = new Map([
  ['Africa', 26],
  ['Americas', 170],
  ['Antarctica', 204],
  ['Asia', 348],
  ['Europe', 265],
  ['Oceania', 120],
])

/** 大洲与次区域都取不到时的兜底色相 */
const FALLBACK_HUE = 210

/**
 * 要素的分区色（0xRRGGBB 数值）。
 *
 * 卫星底图上要留得住底图，所以饱和度与明度都比随机色克制。
 */
export function regionColor(feature) {
  const subregion = countryRegion(feature)
  const continent = countryContinent(feature)
  const hue = SUBREGION_HUES.get(subregion) ?? REGION_HUES.get(continent) ?? FALLBACK_HUE
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
