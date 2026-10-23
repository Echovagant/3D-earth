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
 * 清掉章节与索引的缓存。
 *
 * 缓存是模块级的——同一份数据整个会话只取一次，生产代码不该调它。
 * 测试里换数据源时必须先清一次，否则会拿到上一轮用例留下的结果，
 * 表现为「明明 stub 成请求失败，页面却还是渲染出来了」。
 */
export function clearKnowledgeCache() {
  chapterCache.clear()
  indexPromise = null
}

/**
 * 搜索：标题、摘要、各类要点全字段匹配，另外带上实体标记。
 *
 * 实体标记里省份存的是 6 位 adcode（不是省名），国家与地区名当前数据里还是空的。
 *
 * provinceNames 是可选的省名表（{ '510000': '四川省', ... }，来自省份索引）。
 * 传了它，搜索词还会去匹配省名全称，于是「四川」能命中挂着该省的小节；
 * 不传就只按 adcode 匹配，行为与从前完全一致。
 *
 * 省名只取全称，不取简称：「京」「沪」这类单字会误命中（北京、南京／上海、沪苏）。
 *
 * @param {object[]} lessons 知识点列表
 * @param {string} keyword 搜索词
 * @param {Record<string, string>} [provinceNames] adcode → 省名全称
 */
export function searchLessons(lessons, keyword, provinceNames = {}) {
  const kw = String(keyword ?? '').trim().toLowerCase()
  if (!kw) return []
  const names = provinceNames ?? {}
  return lessons.filter((l) => {
    const provinces = l.entities?.provinces ?? []
    const hay = [
      l.title,
      l.summary,
      ...(l.outline ?? []),
      ...(l.mustKnow ?? []),
      ...(l.pitfalls ?? []),
      ...(l.questionTypes ?? []),
      ...provinces,
      // 省名全称也算可匹配字段：搜「四川」要能命中挂着 510000 的小节
      ...provinces.map((code) => names[String(code)] ?? '').filter(Boolean),
      ...(l.entities?.countries ?? []),
      ...(l.entities?.regions ?? []),
    ]
      .join(' ')
      .toLowerCase()
    return hay.includes(kw)
  })
}

/**
 * 一节里被搜索词命中的省份：结果列表用它说明「为什么命中」。
 *
 * 命中条件是省名全称或 adcode 包含搜索词；省名取不到时退回显示 adcode。
 * 与 searchLessons 用的是同一张省名表。
 *
 * @param {object} lesson 单个知识点
 * @param {string} keyword 搜索词
 * @param {Record<string, string>} [provinceNames] adcode → 省名全称
 * @returns {{ adcode: string, name: string }[]} 命中的省份
 */
export function matchedProvinces(lesson, keyword, provinceNames = {}) {
  const kw = String(keyword ?? '').trim().toLowerCase()
  if (!kw) return []
  const names = provinceNames ?? {}
  return (lesson?.entities?.provinces ?? [])
    .map((code) => {
      const adcode = String(code)
      return { adcode, name: names[adcode] ?? adcode }
    })
    .filter((p) => p.name.toLowerCase().includes(kw) || p.adcode.includes(kw))
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
