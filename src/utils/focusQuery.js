/**
 * 解析 ?at=纬度,经度 这样的定位参数。
 *
 * 景区的「在地球上看看」要靠它把镜头带到地方去。
 */

/**
 * 从查询串里取出要聚焦的坐标；没有或格式不对就返回 null。
 *
 * 纬度在前、经度在后，与景区清单里的 coords 一致；
 * 出界（非地球上的坐标）一律当成没有参数。
 */
export function parseFocusQuery(query) {
  const raw = query?.at
  if (typeof raw !== 'string') return null
  const parts = raw.split(',')
  if (parts.length !== 2) return null
  // 空串会被 Number 读成 0（'33.26,' 会被当成经度 0），必须先挡掉
  if (parts.some((part) => part.trim() === '')) return null
  const [lat, lon] = parts.map((n) => Number(n.trim()))
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null
  return [lat, lon]
}

/**
 * 把坐标对拼成 ?at= 的查询串。
 *
 * 坐标精度压到五位小数：再多是噪声，而 URL 短一点更好看。
 */
export function formatFocusQuery(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return null
  const [lat, lon] = coords.map(Number)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return `${lat.toFixed(5)},${lon.toFixed(5)}`
}
