// adcode → 颜色的稳定映射。
//
// 不能按 GeoJSON 数组顺序轮转取色：数组顺序一变，实际配色与图例就对不上，
// 而且同一份数据在不同环境下渲染出的颜色可能不同。
// 这里用固定的 adcode → 颜色表，保证颜色是行政区本身的属性。

const COLOR_BY_ADCODE = {
  '110000': 0xff6b6b, // 北京
  '120000': 0x4ecdc4, // 天津
  '130000': 0x45b7d1, // 河北
  '140000': 0x96ceb4, // 山西
  '150000': 0xfeca57, // 内蒙古
  '210000': 0xff9ff3, // 辽宁
  '220000': 0x54a0ff, // 吉林
  '230000': 0x5f27cd, // 黑龙江
  '310000': 0x00d2d3, // 上海
  '320000': 0xff9f43, // 江苏
  '330000': 0x10ac84, // 浙江
  '340000': 0xee5a24, // 安徽
  '350000': 0xa3cb38, // 福建
  '360000': 0xc44569, // 江西
  '370000': 0xd980fa, // 山东
  '410000': 0xff6b6b, // 河南
  '420000': 0x4ecdc4, // 湖北
  '430000': 0x45b7d1, // 湖南
  '440000': 0x96ceb4, // 广东
  '450000': 0xfeca57, // 广西
  '460000': 0xff9ff3, // 海南
  '500000': 0x54a0ff, // 重庆
  '510000': 0x5f27cd, // 四川
  '520000': 0x00d2d3, // 贵州
  '530000': 0xff9f43, // 云南
  '540000': 0x10ac84, // 西藏
  '610000': 0xee5a24, // 陕西
  '620000': 0xa3cb38, // 甘肃
  '630000': 0xc44569, // 青海
  '640000': 0xd980fa, // 宁夏
  '650000': 0xff6b6b, // 新疆
  '710000': 0x4ecdc4, // 台湾
  '810000': 0x45b7d1, // 香港
  '820000': 0x96ceb4, // 澳门
}

/** 九段线等非省级要素使用的中性色 */
export const NEUTRAL_COLOR = 0x9fb6d9

/** 未知 adcode 的兜底色 */
const FALLBACK_COLOR = 0x8ea6c8

/**
 * 取指定行政区的颜色。adcode 在 GeoJSON 里是数字、在路由里是字符串，
 * 这里统一按字符串处理。
 */
export function getProvinceColor(adcode) {
  const key = String(adcode ?? '')
  if (key === '100000_JD') return NEUTRAL_COLOR
  return COLOR_BY_ADCODE[key] ?? FALLBACK_COLOR
}

/** 数字色转成 CSS 颜色串 */
export function toHexString(color) {
  return `#${color.toString(16).padStart(6, '0')}`
}

/**
 * 地级市配色。城市没有地理分区可依，用 adcode 哈希取色：
 * 同一个市永远是同一个颜色，且分布均匀。
 */
const CITY_PALETTE = [
  '#4fd8ff', '#5b8cff', '#7c6cff', '#b06cff', '#ff6bd6', '#ff6b8f',
  '#ff9f43', '#ffc857', '#a3e635', '#3ddc97', '#3db8d4', '#6b7a99',
]

/** 取地级市的颜色 */
export function getCityColor(adcode) {
  const key = String(adcode ?? '')
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return CITY_PALETTE[hash % CITY_PALETTE.length]
}

/**
 * 地理分区。图例按分区分组展示，比一长串省份名更容易扫读。
 * adcode 与 china-provinces.json 严格对应，覆盖全部 34 个省级行政区。
 */
export const REGION_GROUPS = [
  { key: 'north', label: '华北', adcodes: ['110000', '120000', '130000', '140000', '150000'] },
  { key: 'northeast', label: '东北', adcodes: ['210000', '220000', '230000'] },
  { key: 'east', label: '华东', adcodes: ['310000', '320000', '330000', '340000', '350000', '360000', '370000'] },
  { key: 'central', label: '华中', adcodes: ['410000', '420000', '430000'] },
  { key: 'south', label: '华南', adcodes: ['440000', '450000', '460000'] },
  { key: 'southwest', label: '西南', adcodes: ['500000', '510000', '520000', '530000', '540000'] },
  { key: 'northwest', label: '西北', adcodes: ['610000', '620000', '630000', '640000', '650000'] },
  { key: 'special', label: '港澳台', adcodes: ['710000', '810000', '820000'] },
]

/** 把省份列表按地理分区重新排序，输出 [{ key, label, items }] */
export function groupByRegion(items) {
  const byAdcode = new Map(items.map((item) => [String(item.adcode), item]))
  return REGION_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    items: group.adcodes.map((adcode) => byAdcode.get(adcode)).filter(Boolean),
  })).filter((group) => group.items.length > 0)
}
