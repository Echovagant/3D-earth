/**
 * 省份名称：按 adcode 从 public/data/provinces/<adcode>.json 里取。
 *
 * 省份数据文件里本来就带 name（110000 → 北京市、150000 → 内蒙古自治区），
 * 页面不再自己维护一份名字表：两份名单迟早漂移，漂移了就显示错的省名。
 */

import { assetUrl } from './base'

const BASE = '/data/provinces'

/** adcode → 名称的缓存；同一个省只请求一次 */
const cache = new Map()

/**
 * 取一个省份的名称。
 *
 * 失败会抛错（由调用方决定怎么兜底），并且失败的结果不进缓存，
 * 下次调用会真的重新拉一次。
 */
export async function loadProvinceName(adcode) {
  const key = String(adcode)
  if (cache.has(key)) return cache.get(key)
  const promise = fetch(assetUrl(`${BASE}/${key}.json`))
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })
    .then((data) => data.name ?? key)
    .catch((error) => {
      cache.delete(key)
      throw error
    })
  cache.set(key, promise)
  return promise
}

/**
 * 一次取一批省份的名称，返回 adcode → 名称的表。
 *
 * 单个省取不到不影响其它省：那个省退回它自己的代码，
 * 页面照常显示，只是一个省的名字暂时对不上。
 */
export async function loadProvinceNames(adcodes) {
  const codes = [...new Set((adcodes ?? []).map(String))]
  const entries = await Promise.all(
    codes.map(async (code) => [code, await loadProvinceName(code).catch(() => code)]),
  )
  return Object.fromEntries(entries)
}
