/**
 * 对应经线（经线圈）的判定（§2.10）。
 *
 * 两条经线构成经线圈的充要条件：
 *   ① 度数之和 = 180°；
 *   ② 符号相反（一个 E 一个 W）。
 * 特例：0° 与 180° 也是一对——度数和是 180°，而且两个都没有符号。
 *
 * 反例：30°E 与 30°W 度数和只有 60°，符号虽相反但度数不够，
 * 不是一对——「同名经线差得远」。
 */

/**
 * 解析经度：接受 '30E' / '30°W' / 30 / -30 几种写法。
 * @returns {{ value: number, sign: 'E'|'W'|null }}
 */
export function parseLongitude(input) {
  if (typeof input === 'number') {
    if (input === 0) return { value: 0, sign: null }
    return { value: Math.abs(input), sign: input < 0 ? 'W' : 'E' }
  }
  const matched = /^(\d+(?:\.\d+)?)\s*°?\s*([EW])?$/i.exec(String(input).trim())
  if (!matched) throw new Error(`看不懂的经度：${input}`)
  const value = Number(matched[1])
  const sign = matched[2] ? matched[2].toUpperCase() : value === 0 ? null : 'E'
  return { value, sign }
}

/** 某条经线的「对应经线」——与它正对着、相差 180° 的那一条 */
export function counterpartLongitude(value, sign) {
  const v = 180 - value
  const s = value === 0 || value === 180 ? null : sign === 'E' ? 'W' : 'E'
  return { value: v, sign: s }
}

/** 两条经线是否构成经线圈（对应经线） */
export function isMeridianPair(a, b) {
  const x = parseLongitude(a)
  const y = parseLongitude(b)
  const special = (x.value === 0 && y.value === 180) || (x.value === 180 && y.value === 0)
  if (special) return true
  if (!x.sign || !y.sign) return false
  if (x.sign === y.sign) return false
  return x.value + y.value === 180
}
