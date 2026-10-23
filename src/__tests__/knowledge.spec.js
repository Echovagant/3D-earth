// @vitest-environment node
// 知识数据的契约测试。
//
// 这份数据是「提纲级」的，不是正文——所以除了字段完整性，
// 还要守两条线：① 不能有长段落漏进来；② 98 节的映射表必须完整。
//
// 下面两组用例测的是数据之上的运行时工具层：
// 检索（标题 / 要点 / 省份反查）与掌握度（纯函数 + 存储降级）。
import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { lessonRefLabel, lessonsByProvince, searchLessons } from '../utils/knowledge'
import { MASTERY_KEY, masteryStats, parseMastery, serializeMastery } from '../utils/mastery'
import { loadKnowledgeTables } from '../../scripts/knowledge/tables.mjs'

const repoRoot = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => JSON.parse(readFileSync(path.join(repoRoot, p), 'utf-8'))

const index = read('public/data/knowledge/index.json')
// 人工表按章分片存放，与构建脚本读同一套
const { videoMap, summaries, entities } = await loadKnowledgeTables(
  path.join(repoRoot, 'scripts', 'knowledge'),
)

const chapters = [2, 3, 4, 7, 11, 15].map((c) =>
  read(`public/data/knowledge/chapter-${String(c).padStart(2, '0')}.json`),
)
const lessons = chapters.flatMap((c) => c.lessons)
const SCOPED = ['02', '03', '04', '07', '11', '15']

describe('知识数据', () => {
  it('覆盖 §2/§3/§4/§7/§11/§15 的 98 个小节', () => {
    expect(lessons).toHaveLength(98)
    expect(lessons.filter((l) => l.chapter === 2)).toHaveLength(26)
    expect(lessons.filter((l) => l.chapter === 3)).toHaveLength(20)
    expect(lessons.filter((l) => l.chapter === 4)).toHaveLength(6)
    expect(lessons.filter((l) => l.chapter === 7)).toHaveLength(19)
    expect(lessons.filter((l) => l.chapter === 11)).toHaveLength(17)
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

  it('骨架内容非空：要点列表或表格至少有一个', () => {
    // §7.9 的「知识骨架」在讲义里就是一张表（南北半球风带对照），
    // 解析器把表格行交给 extractTables，要点列表自然是空的——那时表格就是骨架。
    for (const l of lessons) {
      expect(
        l.outline.length + l.tables.length,
        `${l.id} 既没有骨架要点也没有骨架表格`,
      ).toBeGreaterThan(0)
    }
  })

  it('§7.9 的骨架确实是表而不是要点', () => {
    // 把这个例外钉死：哪天解析器改了表与要点的分工，这条会立刻红
    const l = lessons.find((x) => x.id === '7.9')
    expect(l.outline).toEqual([])
    expect(l.tables).toHaveLength(1)
    expect(l.tables[0].header).toEqual(['纬度带', '北半球', '南半球'])
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
        // 表格的每一格也要过闸门：漏了它，正文就能从表格进来
        ...l.tables.flatMap((t) => [...t.header, ...t.rows.flat()]),
        ...l.entities.provinces,
        ...l.entities.countries,
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
    const inScope = new Set([2, 3, 4, 7, 11, 15])
    // 指向范围内章节的引用必须真的存在；指向其他章节的引用保留（前端渲染成纯文本），
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
    // 断言确切条数：讲义里这六章一共 213 条章级引用，少一条就是被过滤掉了
    expect(chapterRefs.length, '章级引用被过滤掉了').toBe(213)
  })

  it('依赖引用数量与源讲义一致（防止过滤规则悄悄回来）', () => {
    // 范围外的引用也必须留着：过滤掉会让「前置知识」显示成「无」，数据在说谎。
    // 只断言「大于 0」守不住——过滤掉 99% 的跨阶段引用照样能过，所以对确切条数。
    const inScope = new Set([2, 3, 4, 7, 11, 15])
    const sectionRefs = lessons.flatMap((l) => [...l.prereq, ...l.next])
    const scoped = sectionRefs.filter((ref) => inScope.has(Number(ref.split('.')[0])))
    const crossStage = sectionRefs.filter((ref) => !inScope.has(Number(ref.split('.')[0])))
    expect(scoped.length, '范围内节级引用少了').toBe(209)
    expect(crossStage.length, '跨阶段节级引用被过滤掉了').toBe(9)
  })

  it('人工映射表覆盖全部 98 节', () => {
    for (const l of lessons) {
      expect(videoMap[l.id], `分片表 video 缺 ${l.id}`).toBeTypeOf('number')
      expect(summaries[l.id], `分片表 summaries 缺 ${l.id}`).toBeTruthy()
      expect(entities[l.id], `分片表 entities 缺 ${l.id}`).toBeTruthy()
    }
    // 映射表不该有多余条目（以 `_` 开头的是说明性备注，不算条目）
    for (const key of Object.keys(videoMap).filter((k) => !k.startsWith('_'))) {
      expect(lessons.some((l) => l.id === key), `分片表 video 多余条目 ${key}`).toBe(true)
    }
  })

  it('索引覆盖全部 15 章，并标出哪些有内容', () => {
    expect(index.chapters).toHaveLength(15)
    const withContent = index.chapters.filter((c) => c.hasContent)
    expect(withContent.map((c) => c.id)).toEqual([2, 3, 4, 7, 11, 15])
    expect(index.totalLessons).toBe(98)
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
    const { loadAllLessons } = await import('../utils/knowledge')
    const all = await loadAllLessons()

    expect(all).toHaveLength(98)
    // 9 个「规划中」的章不该被请求：目录页靠 hasContent 字段决定显示什么
    expect(calls).toEqual([
      '/data/knowledge/index.json',
      '/data/knowledge/chapter-02.json',
      '/data/knowledge/chapter-03.json',
      '/data/knowledge/chapter-04.json',
      '/data/knowledge/chapter-07.json',
      '/data/knowledge/chapter-11.json',
      '/data/knowledge/chapter-15.json',
    ])
  })

  it('搜索能命中省份 adcode', () => {
    // 实体标记里省份存的是 6 位 adcode（不是省名）
    const hit = searchLessons(lessons, '510000')
    expect(hit.map((l) => l.id)).toContain('15.8')
  })

  it('同一章重复加载只请求一次', async () => {
    vi.resetModules()
    const calls = []
    vi.stubGlobal('fetch', async (url) => {
      calls.push(url)
      return { ok: true, json: async () => read(`public/data/knowledge/${url.split('/').pop()}`) }
    })
    const { loadChapterLessons } = await import('../utils/knowledge')
    const first = await loadChapterLessons(2)
    const second = await loadChapterLessons(2)
    expect(second).toBe(first)
    expect(calls).toEqual(['/data/knowledge/chapter-02.json'])
  })

  it('章节取不到时抛 HTTP 状态码，重试会真的重新请求', async () => {
    vi.resetModules()
    const calls = []
    let fail = true
    vi.stubGlobal('fetch', async (url) => {
      calls.push(url)
      if (fail) return { ok: false, status: 404, json: async () => ({}) }
      return { ok: true, json: async () => read(`public/data/knowledge/${url.split('/').pop()}`) }
    })
    const { loadChapterLessons } = await import('../utils/knowledge')
    await expect(loadChapterLessons(2)).rejects.toThrow('HTTP 404')
    fail = false
    const recovered = await loadChapterLessons(2)
    expect(recovered).toHaveLength(26)
    // 失败的请求不能留在缓存里，否则页面上「重试」拿到的还是同一个失败
    expect(calls).toEqual(['/data/knowledge/chapter-02.json', '/data/knowledge/chapter-02.json'])
  })

  it('索引取不到时抛 HTTP 状态码，重试会真的重新请求', async () => {
    vi.resetModules()
    const calls = []
    let fail = true
    vi.stubGlobal('fetch', async (url) => {
      calls.push(url)
      if (fail) return { ok: false, status: 500, json: async () => ({}) }
      if (url === '/data/knowledge/index.json') return { ok: true, json: async () => index }
      return { ok: true, json: async () => read(`public/data/knowledge/${url.split('/').pop()}`) }
    })
    const { loadKnowledgeIndex } = await import('../utils/knowledge')
    await expect(loadKnowledgeIndex()).rejects.toThrow('HTTP 500')
    fail = false
    const recovered = await loadKnowledgeIndex()
    expect(recovered.chapters).toHaveLength(15)
    expect(calls).toEqual(['/data/knowledge/index.json', '/data/knowledge/index.json'])
  })
})

describe('掌握度', () => {
  // 下面几组要碰存储路径的用例，都用一份干净的模块实例：
  // 降级开关是模块级状态，串在一起会互相污染
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

  it('没有 localStorage 时降级到内存存储', async () => {
    vi.resetModules()
    const { readMastery, setMastery } = await import('../utils/mastery')
    setMastery('2.19', 'known')
    setMastery('15.8', 'review')
    expect(readMastery()).toEqual({ '2.19': 'known', '15.8': 'review' })
    // null 表示清除
    setMastery('2.19', null)
    expect(readMastery()).toEqual({ '15.8': 'review' })
  })

  it('localStorage 可用时读写落在 localStorage 里', async () => {
    vi.resetModules()
    const store = new Map()
    vi.stubGlobal('localStorage', {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    })
    const { readMastery, writeMastery, setMastery } = await import('../utils/mastery')
    expect(MASTERY_KEY).toBe('earth.geo.mastered')
    writeMastery({ '2.19': 'known' })
    expect(store.get(MASTERY_KEY)).toBe('{"2.19":"known"}')
    expect(readMastery()).toEqual({ '2.19': 'known' })
    setMastery('2.19', 'review')
    expect(readMastery()).toEqual({ '2.19': 'review' })
  })

  it('localStorage 读失败时降级到内存', async () => {
    vi.resetModules()
    let probes = 0
    vi.stubGlobal('localStorage', {
      getItem: () => {
        probes++
        throw new Error('读不了')
      },
      setItem: () => {},
    })
    const { readMastery, setMastery } = await import('../utils/mastery')
    setMastery('2.19', 'known')
    expect(readMastery()).toEqual({ '2.19': 'known' })
    // 探针真的被调用过：走的是 catch 分支，不是「localStorage 不存在」的提前返回
    expect(probes).toBeGreaterThan(0)
  })

  it('localStorage 写失败时降级到内存，写完读回来还是新值', async () => {
    vi.resetModules()
    let writes = 0
    // 能读但写不进去：配额满 / 部分隐私模式
    vi.stubGlobal('localStorage', {
      getItem: () => '{"2.19":"known"}', // localStorage 里的陈旧旧值
      setItem: () => {
        writes++
        throw new Error('QuotaExceededError')
      },
    })
    const { readMastery, writeMastery, setMastery } = await import('../utils/mastery')
    writeMastery({ '15.8': 'review' })
    // 写失败后读回来的必须是新值，而不是 localStorage 里的陈旧旧值
    expect(readMastery()).toEqual({ '15.8': 'review' })
    // 读-改-写也不能把内存副本覆盖成陈旧状态
    setMastery('15.9', 'known')
    expect(readMastery()).toEqual({ '15.8': 'review', '15.9': 'known' })
    // 确实尝试写过并抛了错（走的 catch 分支）
    expect(writes).toBeGreaterThan(0)
  })

  it('setMastery 忽略非法状态值', async () => {
    vi.resetModules()
    const store = new Map()
    vi.stubGlobal('localStorage', {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    })
    const { readMastery, setMastery } = await import('../utils/mastery')
    setMastery('2.19', '瞎写的')
    expect(readMastery()).toEqual({})
    // 非法值根本不该落进存储里
    expect(store.has(MASTERY_KEY)).toBe(false)
  })
})
