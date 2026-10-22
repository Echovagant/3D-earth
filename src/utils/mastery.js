/**
 * 掌握度：记在浏览器本地，不上传任何地方。
 *
 * 没有账号、没有后端，所以进度只存在 localStorage。
 * 隐私模式等场景下 localStorage 不可用时降级为内存存储——本次会话内仍然有效。
 */

export const MASTERY_KEY = 'earth.geo.mastered'

/** localStorage 不可用时的兜底 */
const memoryStore = new Map()

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
  const store = storage()
  if (!store) return parseMastery(memoryStore.get(MASTERY_KEY) ?? null)
  return parseMastery(store.getItem(MASTERY_KEY))
}

/** 覆盖写 */
export function writeMastery(state) {
  const text = serializeMastery(state)
  const store = storage()
  if (!store) {
    memoryStore.set(MASTERY_KEY, text)
    return
  }
  try {
    store.setItem(MASTERY_KEY, text)
  } catch {
    memoryStore.set(MASTERY_KEY, text)
  }
}

/** 设置某一节；`null` 表示清除 */
export function setMastery(id, value) {
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
