/**
 * §2.18 图例与注记的对照表。
 *
 * 讲义的核心是一句话：地图上画的都是符号和线，符号代表什么全靠图例翻译。
 * 所以「图上出现了哪些符号」与「图例里列了哪几条」必须是同一份东西——
 * 这张表就是这份对照，讲讲解层里的数字也从它算，不另抄一份。
 */

/** 图例条目：符号 → 名称。顺序与图例框里从上到下的排列一致 */
export const LEGEND_ITEMS = [
  { id: 'peak', name: '山峰', kind: 'triangle' },
  { id: 'village', name: '居民点', kind: 'square' },
  { id: 'river', name: '河流', kind: 'wave' },
  { id: 'railway', name: '铁路', kind: 'dash' },
]

/** 示意地图上出现的符号（与 LEGEND_ITEMS 一一对应） */
export const MAP_SYMBOLS = [
  { id: 'peak', kind: 'triangle' },
  { id: 'village', kind: 'square' },
  { id: 'river', kind: 'wave' },
  { id: 'railway', kind: 'dash' },
]

/** 图上标注的海拔（米） */
export const PEAK_ELEVATION_M = 1200

/**
 * 米换算成千米。
 *
 * 注记上的海拔单位是米，要和图上的实地距离（比例尺算出来的）放到一起比较，
 * 先统一成千米才不会差 1000 倍。
 */
export function metersToKm(meters) {
  return meters / 1000
}

/**
 * 图上的符号与图例条目是不是一一对应。
 *
 * 对不上（图例漏了、或者图例多了一条）就说明这张图本身有问题——
 * 这正是做题第一步「先读图例」要查的东西。
 */
export function legendCoverage(symbols = MAP_SYMBOLS, legend = LEGEND_ITEMS) {
  const matched = symbols.filter((s) => legend.some((l) => l.id === s.id)).map((s) => s.id)
  const missing = legend.filter((l) => !symbols.some((s) => s.id === l.id)).map((l) => l.id)
  const extra = symbols.filter((s) => !legend.some((l) => l.id === s.id)).map((s) => s.id)
  return {
    matched,
    missing,
    extra,
    matchedCount: matched.length,
    legendCount: legend.length,
    symbolCount: symbols.length,
  }
}
