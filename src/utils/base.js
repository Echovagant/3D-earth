/**
 * 站点根路径。
 *
 * 站点部署在子路径下时（GitHub Pages 的项目页是 /<仓库名>/），资源路径必须带上这段前缀，
 * 否则数据、贴图、GeoJSON 全部 404。
 *
 * import.meta.env.BASE_URL 由 Vite 注入，形如 '/' 或 '/3D-earth/'。
 * 这里去掉尾斜杠，拼路径统一走 assetUrl()。
 */

/** 站点根路径，不带尾斜杠。根部署时是空串 */
export const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')

/**
 * 把站内绝对路径接上站点根路径。
 *
 * assetUrl('/data/knowledge/index.json')
 *   根部署   → '/data/knowledge/index.json'
 *   子路径   → '/3D-earth/data/knowledge/index.json'
 */
export function assetUrl(path) {
  const p = String(path ?? '')
  if (!p) return BASE || '/'
  return p.startsWith('/') ? `${BASE}${p}` : `${BASE}/${p}`
}
