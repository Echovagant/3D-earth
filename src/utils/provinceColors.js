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
