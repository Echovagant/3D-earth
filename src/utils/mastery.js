/**
 * 掌握度：记在浏览器本地，不上传任何地方。
 *
 * 没有账号、没有后端，所以进度只存在 localStorage。
 * 隐私模式等场景下 localStorage 不可用时降级为内存存储——本次会话内仍然有效。
 */

export const MASTERY_KEY = 'earth.geo.mastered'

/** localStorage 不可用时的兜底 */
const memoryStore = new Map()

/**
 * 一旦 localStorage 写失败过，就一直以内存副本为准。
 *
 * 有些引擎能读不能写（配额满、部分隐私模式）：这时写进内存，读却还从
 * localStorage 取，读-改-写会把内存里的新值覆盖成陈旧的旧值，
 * 用户点的「已掌握」就静默丢了。降级必须是粘性的。
 */
let memoryFallback = false

function storage() {
  try {
    if (typeof globalThis.localStorage === 'undefined') return null
    // 隐私模式下写入会抛异常，用一次读探针确认
    globalThis.localStorage.getItem(MASTERY_KEY)
    return globalThis.localStorage
  } catch {
    return null
  }
}

/** 解析存储内容，坏数据一律当空 */
export function parseMastery(raw) {
  if (!raw) return {}
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {}
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
  const out = {}
  for (const [id, value] of Object.entries(parsed)) {
    if (value === 'known' || value === 'review') out[id] = value
  }
  return out
}

/** 序列化，键排序保证输出稳定 */
export function serializeMastery(state) {
  const sorted = {}
  for (const key of Object.keys(state ?? {}).sort()) sorted[key] = state[key]
  return JSON.stringify(sorted)
}

/** 读全部 */
export function readMastery() {
  if (memoryFallback) return parseMastery(memoryStore.get(MASTERY_KEY) ?? null)
  const store = storage()
  if (!store) return parseMastery(memoryStore.get(MASTERY_KEY) ?? null)
  return parseMastery(store.getItem(MASTERY_KEY))
}

/** 覆盖写 */
export function writeMastery(state) {
  const text = serializeMastery(state)
  if (memoryFallback) {
    // 已经降级：内存副本是唯一真相，不再去碰 localStorage（两边会分叉）
    memoryStore.set(MASTERY_KEY, text)
    return
  }
  const store = storage()
  if (!store) {
    memoryFallback = true
    memoryStore.set(MASTERY_KEY, text)
    return
  }
  try {
    store.setItem(MASTERY_KEY, text)
  } catch {
    // 写不进去（配额满 / 部分隐私模式）时降级到内存，且之后一直以内存为准，
    // 否则下一次读会把陈旧的 localStorage 值取回来，等于把这次写入覆盖掉
    memoryFallback = true
    memoryStore.set(MASTERY_KEY, text)
  }
}

/** 设置某一节；`null` 表示清除；非法状态值忽略 */
export function setMastery(id, value) {
  if (value !== null && value !== undefined && value !== 'known' && value !== 'review') return
  const state = readMastery()
  if (value === null || value === undefined) delete state[id]
  else state[id] = value
  writeMastery(state)
}

/** 统计掌握度 */
export function masteryStats(lessonIds, state) {
  const ids = lessonIds ?? []
  let known = 0
  let review = 0
  for (const id of ids) {
    const v = state?.[id]
    if (v === 'known') known++
    else if (v === 'review') review++
  }
  const total = ids.length
  const percent = total === 0 ? 0 : Math.round((known / total) * 100)
  return { known, review, total, percent }
}
