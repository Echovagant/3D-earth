/**
 * 景区图片的许可规则。
 *
 * 白名单只收「可以原样再分发」的许可。CC BY / CC BY-SA 全部版本都满足
 * 「署名即可再分发」（署名的位置是景区详情页底部的「图片来源与许可」区块），
 * 所以按家族收录而不是只列 2.0/3.0/4.0——Commons 上 2.5/1.0 的老图同样是自由许可。
 */
export const LICENSE_WHITELIST = [
  'CC0-1.0',
  'PD',
  'CC-BY-1.0',
  'CC-BY-2.0',
  'CC-BY-2.1',
  'CC-BY-2.5',
  'CC-BY-3.0',
  'CC-BY-4.0',
  'CC-BY-SA-1.0',
  'CC-BY-SA-2.0',
  'CC-BY-SA-2.1',
  'CC-BY-SA-2.5',
  'CC-BY-SA-3.0',
  'CC-BY-SA-4.0',
]

/** 把许可写法归一：去空格、统一大小写、连字符与空格等价 */
export function normalizeLicense(license) {
  return String(license ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/[_\s]+/g, '-')
}

/** 许可的归一形式 → 白名单条目 */
const LICENSE_ALIASES = new Map([
  ['cc0-1.0', 'CC0-1.0'],
  ['cc0', 'CC0-1.0'],
  ['cc0-1', 'CC0-1.0'],
  ['public-domain', 'PD'],
  ['publicdomain', 'PD'],
  ['pd', 'PD'],
  ['cc-by-1.0', 'CC-BY-1.0'],
  ['cc-by-2.0', 'CC-BY-2.0'],
  ['cc-by-2.1', 'CC-BY-2.1'],
  ['cc-by-2.5', 'CC-BY-2.5'],
  ['cc-by-3.0', 'CC-BY-3.0'],
  ['cc-by-4.0', 'CC-BY-4.0'],
  ['cc-by-sa-1.0', 'CC-BY-SA-1.0'],
  ['cc-by-sa-2.0', 'CC-BY-SA-2.0'],
  ['cc-by-sa-2.1', 'CC-BY-SA-2.1'],
  ['cc-by-sa-2.5', 'CC-BY-SA-2.5'],
  ['cc-by-sa-3.0', 'CC-BY-SA-3.0'],
  ['cc-by-sa-4.0', 'CC-BY-SA-4.0'],
  ['cc-by-sa-4.0-', 'CC-BY-SA-4.0'],
])

/** 这个许可能不能随仓库再分发 */
export function isAllowedLicense(license) {
  const key = normalizeLicense(license)
  if (!key) return false
  if (LICENSE_ALIASES.has(key)) return true
  return LICENSE_WHITELIST.some((allowed) => normalizeLicense(allowed) === key)
}

/** 景区 id 的形状：小写字母、数字、连字符 */
export const SCENIC_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/
