// @vitest-environment node
// 知识数据的契约测试。
//
// 这份数据是「提纲级」的，不是正文——所以除了字段完整性，
// 还要守两条线：① 不能有长段落漏进来；② 36 节的映射表必须完整。
//
// 下面两组用例测的是数据之上的运行时工具层：
// 检索（标题 / 要点 / 省份反查）与掌握度（纯函数 + 存储降级）。
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { lessonRefLabel, lessonsByProvince, searchLessons } from '../utils/knowledge.js'
import {
  MASTERY_KEY,
  masteryStats,
  parseMastery,
  readMastery,
  serializeMastery,
  setMastery,
  writeMastery,
} from '../utils/mastery.js'

const repoRoot = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => JSON.parse(readFileSync(path.join(repoRoot, p), 'utf-8'))

const index = read('public/data/knowledge/index.json')
const videoMap = read('scripts/knowledge/video-map.json')
const summaries = read('scripts/knowledge/summaries.json')
const entities = read('scripts/knowledge/entities.json')

const chapters = [2, 15].map((c) => read(`public/data/knowledge/chapter-${String(c).padStart(2, '0')}.json`))
const lessons = chapters.flatMap((c) => c.lessons)
const SCOPED = ['02', '15']

describe('知识数据', () => {
  it('覆盖 §2 与 §15 的 36 个小节', () => {
    expect(lessons).toHaveLength(36)
    expect(lessons.filter((l) => l.chapter === 2)).toHaveLength(26)
    expect(lessons.filter((l) => l.chapter === 15)).toHaveLength(10)
  })

  it('每节都有 id、标题、摘要与视频分P', () => {
    for (const l of lessons) {
      expect(l.id, '缺少 id').toMatch(/^\d+\.\d+$/)
      expect(l.chapter).toBe(Number(l.id.split('.')[0]))
      expect(l.title, `${l.id} 缺少标题`).toBeTruthy()
      expect(l.summary, `${l.id} 缺少摘要`).toBeTruthy()
      expect(l.video, `${l.id} 缺少视频信息`).toBeTruthy()
      expect(l.video.bvid).toBe('BV1RN4y1f7Hn')
      expect(l.video.p, `${l.id} 的分P号越界`).toBeGreaterThanOrEqual(1)
      expect(l.video.p, `${l.id} 的分P号越界`).toBeLessThanOrEqual(158)
    }
  })

  it('骨架清单非空', () => {
    for (const l of lessons) {
      expect(l.outline.length, `${l.id} 的知识骨架是空的`).toBeGreaterThan(0)
    }
  })

  it('不含成段正文：任何一行不超过 220 字符', () => {
    // 判据是**单行**长度：续行 bullet 用 \n 分隔，多条拼起来可以很长，
    // 但每一条都短；真正的正文是一整行长句。
    for (const l of lessons) {
      const strings = [
        l.title,
        l.summary,
        l.sourceLabel,
        l.exam,
        ...l.outline,
        ...l.mustKnow,
        ...l.pitfalls,
        ...l.questionTypes,
        ...l.entities.regions,
      ]
      for (const s of strings) {
        for (const line of String(s).split('\n')) {
          expect(
            line.length,
            `${l.id} 有超长行，疑似正文泄漏：${line.slice(0, 40)}…`,
          ).toBeLessThanOrEqual(220)
        }
      }
    }
  })

  it('不含图片直链', () => {
    const text = JSON.stringify(lessons)
    expect(text).not.toMatch(/https?:\/\/[^"']*\.(jpg|jpeg|png|gif|webp)/i)
  })

  it('依赖引用：指向本阶段章节的必须存在，跨阶段引用允许悬空', () => {
    const ids = new Set(lessons.map((l) => l.id))
    const inScope = new Set([2, 15])
    // 指向 §2/§15 的引用必须真的存在；指向其他章节的引用保留（前端渲染成纯文本），
    // 不能过滤掉——过滤会让「前置」显示成「无」，数据在说谎。
    // 先把违规的引用挑出来再断言：expect 写在 if 里会触发 vitest/no-conditional-expect。
    const dangling = lessons
      .flatMap((l) => [...l.prereq, ...l.next].map((ref) => ({ from: l.id, ref })))
      .filter(({ ref }) => inScope.has(Number(ref.split('.')[0])))
      .filter(({ ref }) => !ids.has(ref))
    expect(dangling, '引用了本阶段内不存在的小节').toEqual([])
  })

  it('章级引用（§3 地球的自转 这种）也保留下来了', () => {
    // 章级引用比节级引用更粗（§9 气候 而不是 §9.3），但它是真实的前置/后续信息，
    // 丢了就等于学生看不到「这节接着 §3 地球的自转」。
    const chapterRefs = lessons.flatMap((l) => [...l.prereqChapters, ...l.nextChapters])
    for (const c of chapterRefs) {
      expect(String(c), '章级引用不是章号').toMatch(/^\d{1,2}$/)
    }
    // 断言确切条数：讲义里 §2+§15 一共 73 条章级引用，少一条就是被过滤掉了
    expect(chapterRefs.length, '章级引用被过滤掉了').toBe(73)
  })

  it('依赖引用数量与源讲义一致（防止过滤规则悄悄回来）', () => {
    // 范围外的引用也必须留着：过滤掉会让「前置知识」显示成「无」，数据在说谎。
    // 只断言「大于 0」守不住——过滤掉 99% 的跨阶段引用照样能过，所以对确切条数。
    const inScope = new Set([2, 15])
    const sectionRefs = lessons.flatMap((l) => [...l.prereq, ...l.next])
    const scoped = sectionRefs.filter((ref) => inScope.has(Number(ref.split('.')[0])))
    const crossStage = sectionRefs.filter((ref) => !inScope.has(Number(ref.split('.')[0])))
    expect(scoped.length, '范围内节级引用少了').toBe(110)
    expect(crossStage.length, '跨阶段节级引用被过滤掉了').toBe(1)
  })

  it('人工映射表覆盖全部 36 节', () => {
    for (const l of lessons) {
      expect(videoMap[l.id], `video-map.json 缺 ${l.id}`).toBeTypeOf('number')
      expect(summaries[l.id], `summaries.json 缺 ${l.id}`).toBeTruthy()
      expect(entities[l.id], `entities.json 缺 ${l.id}`).toBeTruthy()
    }
    // 映射表不该有多余条目（以 `_` 开头的是说明性备注，不算条目）
    for (const key of Object.keys(videoMap).filter((k) => !k.startsWith('_'))) {
      expect(lessons.some((l) => l.id === key), `video-map.json 多余条目 ${key}`).toBe(true)
    }
  })

  it('索引覆盖全部 15 章，并标出哪些有内容', () => {
    expect(index.chapters).toHaveLength(15)
    const withContent = index.chapters.filter((c) => c.hasContent)
    expect(withContent.map((c) => c.id)).toEqual([2, 15])
    expect(index.totalLessons).toBe(36)
  })

  it('单片 JSON 不超过 150 KB', () => {
    for (const c of SCOPED) {
      const file = path.join(repoRoot, `public/data/knowledge/chapter-${c}.json`)
      expect(existsSync(file)).toBe(true)
      expect(readFileSync(file).length / 1024).toBeLessThanOrEqual(150)
    }
  })
})

describe('知识工具层', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('搜索能命中标题与要点', () => {
    const hit = searchLessons(lessons, '等高线')
    expect(hit.length).toBeGreaterThan(0)
    expect(hit.some((l) => l.id === '2.19')).toBe(true)
  })

  it('搜索能命中要点字段（不在标题里的内容）', () => {
    // 「江西属华东」只出现在 §15.8 的 mustKnow 里，标题与摘要都没有
    const hit = searchLessons(lessons, '江西属华东')
    expect(hit.map((l) => l.id)).toContain('15.8')
  })

  it('搜索大小写不敏感', () => {
    // §2.26 标题里的「3S」用小写也能搜到
    const hit = searchLessons(lessons, '3s')
    expect(hit.map((l) => l.id)).toContain('2.26')
  })

  it('搜索无结果时返回空数组', () => {
    expect(searchLessons(lessons, 'zzz不存在的关键词')).toEqual([])
  })

  it('按省反查能命中 §15.8（34 省全挂）', () => {
    const hit = lessonsByProvince(lessons, '510000')
    expect(hit.map((l) => l.id)).toContain('15.8')
  })

  it('按省反查未知省份时返回空数组', () => {
    expect(lessonsByProvince(lessons, '990000')).toEqual([])
  })

  it('引用标签是「§编号 标题」', () => {
    expect(lessonRefLabel('2.19', lessons)).toBe('§2.19 等高线地形图：定义、读图与地形判读')
  })

  it('引用标签找不到小节时只给编号', () => {
    expect(lessonRefLabel('9.9', lessons)).toBe('§9.9')
  })

  it('loadAllLessons 只加载有内容的章，文件名两位补零', async () => {
    // 换一份干净的模块实例，免得命中上一次调用留下的缓存
    vi.resetModules()
    const calls = []
    vi.stubGlobal('fetch', async (url) => {
      calls.push(url)
      if (url === '/data/knowledge/index.json') return { ok: true, json: async () => index }
      const file = url.split('/').pop()
      return { ok: true, json: async () => read(`public/data/knowledge/${file}`) }
    })
    const { loadAllLessons } = await import('../utils/knowledge.js')
    const all = await loadAllLessons()

    expect(all).toHaveLength(36)
    // 13 个「规划中」的章不该被请求：目录页靠 hasContent 字段决定显示什么
    expect(calls).toEqual([
      '/data/knowledge/index.json',
      '/data/knowledge/chapter-02.json',
      '/data/knowledge/chapter-15.json',
    ])
  })
})

describe('掌握度', () => {
  beforeEach(() => {
    // 内存存储是模块级的，先清空，免得用例之间互相影响
    writeMastery({})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parse 能容忍坏数据', () => {
    expect(parseMastery(null)).toEqual({})
    expect(parseMastery('不是 json')).toEqual({})
    expect(parseMastery('{"2.19":"known","2.20":"review"}')).toEqual({
      '2.19': 'known',
      '2.20': 'review',
    })
  })

  it('parse 丢掉非法状态值', () => {
    expect(parseMastery('{"2.19":"瞎写的"}')).toEqual({})
  })

  it('序列化后能原样解析回来', () => {
    const state = { '2.19': 'known', '15.8': 'review' }
    expect(parseMastery(serializeMastery(state))).toEqual(state)
  })

  it('统计正确', () => {
    const s = masteryStats(['2.19', '2.20', '15.8'], { '2.19': 'known', '2.20': 'review' })
    expect(s).toEqual({ known: 1, review: 1, total: 3, percent: 33 })
  })

  it('空集合的统计是 0%', () => {
    expect(masteryStats([], {})).toEqual({ known: 0, review: 0, total: 0, percent: 0 })
  })

  it('没有 localStorage 时降级到内存存储', () => {
    setMastery('2.19', 'known')
    setMastery('15.8', 'review')
    expect(readMastery()).toEqual({ '2.19': 'known', '15.8': 'review' })
    // null 表示清除
    setMastery('2.19', null)
    expect(readMastery()).toEqual({ '15.8': 'review' })
  })

  it('localStorage 可用时读写落在 localStorage 里', () => {
    const store = new Map()
    vi.stubGlobal('localStorage', {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    })
    expect(MASTERY_KEY).toBe('earth.geo.mastered')
    writeMastery({ '2.19': 'known' })
    expect(store.get(MASTERY_KEY)).toBe('{"2.19":"known"}')
    expect(readMastery()).toEqual({ '2.19': 'known' })
    setMastery('2.19', 'review')
    expect(readMastery()).toEqual({ '2.19': 'review' })
  })
})
