/**
 * 知识数据的运行时访问层。
 *
 * 数据在 public/data/knowledge/ 下按章分片：
 *   index.json         15 章框架 + 哪些章有内容
 *   chapter-XX.json    该章的小节
 *
 * 章节数据会缓存，课程地图与搜索会重复用到。
 */

const BASE = '/data/knowledge'

const chapterCache = new Map()
let indexPromise = null

/** 章节索引 */
export function loadKnowledgeIndex() {
  if (!indexPromise) {
    indexPromise = fetch(`${BASE}/index.json`).then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })
  }
  return indexPromise
}

/** 某一章的小节 */
export async function loadChapterLessons(chapterId) {
  const key = String(chapterId)
  if (chapterCache.has(key)) return chapterCache.get(key)
  const promise = fetch(`${BASE}/chapter-${key.padStart(2, '0')}.json`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })
    .then((payload) => payload.lessons ?? [])
  chapterCache.set(key, promise)
  return promise
}

/** 全部有内容的章的小节 */
export async function loadAllLessons() {
  const index = await loadKnowledgeIndex()
  const chapters = (index.chapters ?? []).filter((c) => c.hasContent)
  const lists = await Promise.all(chapters.map((c) => loadChapterLessons(c.id)))
  return lists.flat()
}

/** 搜索：标题、摘要、各类要点、实体名全字段匹配 */
export function searchLessons(lessons, keyword) {
  const kw = String(keyword ?? '').trim().toLowerCase()
  if (!kw) return []
  return lessons.filter((l) => {
    const hay = [
      l.title,
      l.summary,
      ...(l.outline ?? []),
      ...(l.mustKnow ?? []),
      ...(l.pitfalls ?? []),
      ...(l.questionTypes ?? []),
      ...(l.entities?.regions ?? []),
    ]
      .join(' ')
      .toLowerCase()
    return hay.includes(kw)
  })
}

/** 按省份 adcode 反查知识点 */
export function lessonsByProvince(lessons, adcode) {
  if (!adcode) return []
  return lessons.filter((l) => (l.entities?.provinces ?? []).includes(adcode))
}

/** `2.19` → `§2.19 等高线地形图…` */
export function lessonRefLabel(id, lessons) {
  const lesson = lessons.find((l) => l.id === id)
  return lesson ? `§${lesson.id} ${lesson.title}` : `§${id}`
}
