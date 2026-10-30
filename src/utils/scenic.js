/**
 * 景区数据的运行时访问层。
 *
 * 数据在 public/data/scenic/<adcode>.json，运行时按需取；
 * 与 utils/knowledge.js 同一套做法：走 assetUrl（子路径部署不 404）、
 * 模块级缓存、失败不留在缓存里（页面上的重试要真的重新请求）。
 */

import { assetUrl } from './base'

/** 景区图片的公开路径 */
export function scenicImagePath(file) {
  return assetUrl(`/data/scenic/images/${file}`)
}

const BASE = '/data/scenic'

const listCache = new Map()
let adcodePromise = null

/**
 * 省份 adcode 列表，来自省份索引（不在景区模块里再写死一份省表）。
 *
 * 索引里的 provinces 是以 adcode 为键的对象（不是数组），键序即省序。
 */
export async function provinceAdcodes() {
  if (!adcodePromise) {
    adcodePromise = fetch(assetUrl('/data/provinces/index.json'))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        const provinces = json?.provinces ?? json ?? {}
        if (Array.isArray(provinces)) return provinces.map((p) => String(p.adcode ?? p))
        return Object.keys(provinces).map(String)
      })
      .catch((error) => {
        // 失败不能留在缓存里：重试要真的重新请求
        adcodePromise = null
        throw error
      })
  }
  return adcodePromise
}

/**
 * 取某个省的景区清单。
 *
 * 该省还没有清单不是错误，返回空数组。判断依据不只是 HTTP 404：
 * 静态站点服务器对不存在的路径会回退到首页（200 + HTML），
 * 那份 HTML 解析成 JSON 会抛错，把这一批查询全部带崩——
 * 所以解析失败与「没有清单」同等对待。
 *
 * 空结果照常缓存：一次会话里某省有没有清单不会变，反复请求只是浪费。
 */
export async function loadScenicByProvince(adcode) {
  const key = String(adcode)
  if (listCache.has(key)) return listCache.get(key)
  const promise = fetch(assetUrl(`${BASE}/${key}.json`))
    .then((res) => {
      // 没有清单的省按「暂无景区」处理
      if (!res.ok) return []
      return res.json().catch(() => [])
    })
    .then((payload) => (Array.isArray(payload) ? payload : payload?.scenics ?? []))
    .catch((error) => {
      // 网络失败要摘出缓存，重试才会真的重新拉
      listCache.delete(key)
      throw error
    })
  listCache.set(key, promise)
  return promise
}

/** 按 id 找景区，找不到给 null */
export async function findScenic(adcode, id) {
  const list = await loadScenicByProvince(adcode)
  return list.find((s) => s.id === id) ?? null
}

/**
 * 全国随机一个景区（省与景区都随机）。
 *
 * 绝大多数省还没有清单是常态（内容分批补齐），随机到的省没有数据时
 * 换下一个省再试，全部没有才返回 null——「随便看看」不能经常落空。
 * 省序先洗牌：每个省被选中的机会均等，又不是永远从头几个省里挑。
 */
export async function pickRandomScenic() {
  const codes = await provinceAdcodes()
  if (!codes.length) return null
  const order = [...codes]
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  for (const adcode of order) {
    const list = await loadScenicByProvince(adcode)
    if (!list.length) continue
    const scenic = list[Math.floor(Math.random() * list.length)]
    return { adcode, scenic }
  }
  return null
}

/**
 * 清掉清单与省表的缓存。
 *
 * 缓存是模块级的，生产代码不该调它；测试里换数据源时必须先清一次，
 * 否则会拿到上一轮用例留下的结果。
 */
export function clearScenicCache() {
  listCache.clear()
  adcodePromise = null
}
