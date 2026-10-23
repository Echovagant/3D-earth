/**
 * 省份名称：一次请求读整份索引，不再逐个省去请求。
 *
 * 索引由 scripts/build-province-index.mjs 从 public/data/provinces/*.json 汇总生成，
 * 内容是 adcode → { name, abbreviation, capital }。
 *
 * 省份数据文件里本来就带 name（110000 → 北京市、150000 → 内蒙古自治区），
 * 页面不再自己维护一份名字表：两份名单迟早漂移，漂移了就显示错的省名。
 */

import { assetUrl } from './base'

const INDEX_URL = assetUrl('/data/provinces/index.json')

/** 索引只拉一次；失败的结果不留在缓存里，下次调用会真的重新拉一次 */
let indexPromise = null

function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch(INDEX_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((payload) => payload.provinces ?? {})
      .catch((error) => {
        indexPromise = null
        throw error
      })
  }
  return indexPromise
}

/**
 * 取一个省份的名称。
 *
 * 失败会抛错（由调用方决定怎么兜底）。
 */
export async function loadProvinceName(adcode) {
  const key = String(adcode)
  const index = await loadIndex()
  return index[key]?.name ?? key
}

/**
 * 一次取一批省份的名称，返回 adcode → 名称的表。
 *
 * 单个省取不到不影响其它省：那个省退回它自己的代码，
 * 页面照常显示，只是一个省的名字暂时对不上。
 */
export async function loadProvinceNames(adcodes) {
  const codes = [...new Set((adcodes ?? []).map(String))]
  if (!codes.length) return {}
  let index = {}
  try {
    index = await loadIndex()
  } catch {
    // 索引取不到时整批退回代码，页面照常显示，只是名字暂时对不上
  }
  return Object.fromEntries(codes.map((code) => [code, index[code]?.name ?? code]))
}
