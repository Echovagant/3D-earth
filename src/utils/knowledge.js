/**
 * 知识数据的运行时访问层。
 *
 * 数据在 public/data/knowledge/ 下按章分片：
 *   index.json         15 章框架 + 哪些章有内容
 *   chapter-XX.json    该章的小节
 *
 * 章节数据会缓存，课程地图与搜索会重复用到。
 */

import { assetUrl } from './base'

const BASE = '/data/knowledge'

const chapterCache = new Map()
let indexPromise = null

/** 章节索引 */
export function loadKnowledgeIndex() {
  if (!indexPromise) {
    indexPromise = fetch(assetUrl(`${BASE}/index.json`))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .catch((error) => {
        // 失败的结果不能留在缓存里：页面上有「重试」按钮，
        // 留着这个 reject 的话，重试拿到的还是同一个失败，只能刷新页面
        indexPromise = null
        throw error
      })
  }
  return indexPromise
}

/** 某一章的小节 */
export async function loadChapterLessons(chapterId) {
  const key = String(chapterId)
  if (chapterCache.has(key)) return chapterCache.get(key)
  const promise = fetch(assetUrl(`${BASE}/chapter-${key.padStart(2, '0')}.json`))
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    })
    .then((payload) => payload.lessons ?? [])
    .catch((error) => {
      // 同上：失败的那一章要摘出缓存，重试才会真的重新拉这一章
      // （已经成功的章还留在缓存里，直接复用）
      chapterCache.delete(key)
      throw error
    })
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

/**
 * 搜索：标题、摘要、各类要点全字段匹配，另外带上实体标记。
 *
 * 实体标记里省份存的是 6 位 adcode（不是省名），国家与地区名当前数据里还是空的。
 */
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
      ...(l.entities?.provinces ?? []),
      ...(l.entities?.countries ?? []),
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
