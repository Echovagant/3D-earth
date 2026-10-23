// @vitest-environment jsdom
/**
 * 知识点 ↔ 互动实验的双向互链。
 *
 * 这条互链横跨两个方向：知识点页挂实验入口，实验页挂「相关提纲」。
 * 两边都从 src/data/toolLinks.js 派生，所以这里守的是那张表本身：
 *   ① 覆盖完整、强弱划分与人工策展的 sections 一致；
 *   ② 每个知识点页恰好链到一个实验，每个实验页至少链到一个知识点页；
 *   ③ 两个方向互为逆映射，不能各说各话；
 *   ④ 入口指向的路由真实存在（写错路径就是死链）；
 *   ⑤ 实验页的「相关提纲」真的渲染出链接，取不到数据时也不留空壳。
 *
 * 映射表本身不依赖数据文件，所以断言用静态 id 清单；
 * 组件渲染那几条读的是 public/data/knowledge/ 下真实存在的分片。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import { LESSON_TOOLS, TOOLS, TOOL_CHAPTERS, TOOL_DRILL_IDS } from '../data/toolLinks'
import { TOOL_SOURCES } from '../data/toolSources'
import { clearKnowledgeCache } from '../utils/knowledge'
import { routes } from '../router/routes'
import LessonPage from '../components/LessonPage.vue'
import RelatedOutline from '../components/RelatedOutline.vue'

/** 小节号按「章 → 节」排序：3.2 要排在 3.10 前面 */
const compareIds = (a, b) => {
  const [ac, as] = a.split('.').map(Number)
  const [bc, bs] = b.split('.').map(Number)
  return ac - bc || as - bs
}

/** 某一章的连续小节号：2.1 → ['2.1', '2.2', ...] */
const range = (chapter, from, to) => {
  const ids = []
  for (let s = from; s <= to; s += 1) ids.push(`${chapter}.${s}`)
  return ids
}

/**
 * 从 TOOL_SOURCES 的 sections 文案里解析小节号。
 *
 * 文案是人工写的：「讲义 §2.19–2.25」「讲义 §3.6、§3.19–3.20、§4.4」。
 * drill 的划分就该跟着它走，所以这里从文案里读，而不是另抄一份。
 */
const parseSections = (text) => {
  const ids = []
  for (const part of String(text).split('、')) {
    const matched = part.match(/§(\d+)\.(\d+)(?:\s*[–—-]\s*(\d+)\.(\d+))?/)
    if (!matched) continue
    const [, chapter, from, , to] = matched
    if (to === undefined) ids.push(`${chapter}.${from}`)
    else ids.push(...range(Number(chapter), Number(from), Number(to)))
  }
  return ids.sort(compareIds)
}

/** 期望的映射：每一章哪些节是 drill、哪些是 chapter */
const EXPECTED = {
  // §2 的等高线那几节；经纬网与 3S 没有对应的实验，不挂
  2: { drill: range(2, 19, 25), chapter: [] },
  3: { drill: ['3.6', '3.19', '3.20'], chapter: range(3, 1, 18).filter((id) => id !== '3.6') },
  4: { drill: ['4.4'], chapter: range(4, 1, 6).filter((id) => id !== '4.4') },
  7: {
    drill: [...range(7, 4, 10), '7.18'],
    chapter: [...range(7, 1, 3), ...range(7, 11, 17), '7.19'],
  },
  11: {
    drill: range(11, 11, 14),
    chapter: [...range(11, 1, 10), ...range(11, 15, 17)],
  },
  // §15 只有形象记忆与简称全表两个实验；区域地理通论没有对应的实验，不挂
  15: { drill: ['15.8', '15.9'], chapter: [] },
}

/** 六个实验页的路由 */
const TOOL_PATHS = [
  '/tools/contour',
  '/tools/terminator',
  '/tools/pressure-belt',
  '/tools/ocean-current',
  '/tools/province-shape',
  '/tools/province-abbrev',
]

const idsOf = (chapter) => Object.keys(LESSON_TOOLS).filter((id) => id.startsWith(`${chapter}.`))

/** 读一个仓库里的 JSON；读不到（文件还没生成）就返回 null */
const readIfExists = (relPath) => {
  let payload = null
  try {
    payload = JSON.parse(readFileSync(relPath, 'utf8'))
  } catch {
    payload = null
  }
  return payload
}

describe('知识点 ↔ 互动实验：映射表', () => {
  it('总共 71 条：25 条 drill + 46 条 chapter', () => {
    const ids = Object.keys(LESSON_TOOLS)
    expect(ids).toHaveLength(71)
    expect(ids.filter((id) => LESSON_TOOLS[id].kind === 'drill')).toHaveLength(25)
    expect(ids.filter((id) => LESSON_TOOLS[id].kind === 'chapter')).toHaveLength(46)
  })

  it('每一章的强弱划分与期望一致', () => {
    for (const [chapter, expected] of Object.entries(EXPECTED)) {
      const linked = idsOf(Number(chapter)).sort(compareIds)
      expect(linked, `§${chapter} 的映射集合不对`).toEqual(
        [...expected.drill, ...expected.chapter].sort(compareIds),
      )
      expect(
        linked.filter((id) => LESSON_TOOLS[id].kind === 'drill'),
        `§${chapter} 的 drill 划分不对`,
      ).toEqual([...expected.drill].sort(compareIds))
      expect(
        linked.filter((id) => LESSON_TOOLS[id].kind === 'chapter'),
        `§${chapter} 的 chapter 划分不对`,
      ).toEqual([...expected.chapter].sort(compareIds))
    }
  })

  it('§3/§4/§7/§11 的每一节都挂上了实验', () => {
    // 这四章的实验覆盖整章：一节都不该漏
    const covered = [3, 4, 7, 11].flatMap((chapter) => idsOf(chapter))
    const expected = [3, 4, 7, 11].flatMap((chapter) =>
      range(chapter, 1, { 3: 20, 4: 6, 7: 19, 11: 17 }[chapter]),
    )
    expect(covered.sort(compareIds)).toEqual(expected.sort(compareIds))
  })

  it('每个条目都带 to / name / kind，且 kind 只有两种取值', () => {
    for (const [id, link] of Object.entries(LESSON_TOOLS)) {
      expect(Object.keys(link).sort(), `${id} 的字段不对`).toEqual(['kind', 'name', 'to'])
      expect(link.to, `${id} 缺路由`).toMatch(/^\/tools\/[a-z-]+$/)
      expect(link.name, `${id} 缺实验名`).toBeTruthy()
      expect(['drill', 'chapter'], `${id} 的 kind 非法`).toContain(link.kind)
    }
  })

  it('每个知识点页恰好链到一个实验：没有重复挂载', () => {
    // 71 个 id 对应 71 条映射：多一条就说明有两处覆盖了同一节
    expect(Object.keys(LESSON_TOOLS)).toHaveLength(71)
    const all = Object.values(TOOL_DRILL_IDS).flat()
    expect(new Set(all).size).toBe(all.length)
  })

  it('每个实验页至少链到一个知识点页', () => {
    expect(Object.keys(TOOL_DRILL_IDS).sort()).toEqual([...TOOL_PATHS].sort())
    for (const path of TOOL_PATHS) {
      expect(TOOL_DRILL_IDS[path].length, `${path} 没有可练的小节`).toBeGreaterThan(0)
    }
  })

  it('drill 的划分与人工策展的 sections 完全一致', () => {
    for (const [key, source] of Object.entries(TOOL_SOURCES)) {
      const path = TOOLS[key].to
      expect(TOOL_DRILL_IDS[path], `${key} 的 drill 与策展表不一致`).toEqual(
        parseSections(source.sections),
      )
    }
  })

  it('双向一致：drill 列表里的 id 指回同一个实验', () => {
    for (const [path, ids] of Object.entries(TOOL_DRILL_IDS)) {
      for (const id of ids) {
        expect(LESSON_TOOLS[id], `${id} 不在映射表里`).toBeTruthy()
        expect(LESSON_TOOLS[id].to, `${id} 指回了别的实验`).toBe(path)
        expect(LESSON_TOOLS[id].kind, `${id} 不该是 drill`).toBe('drill')
      }
    }
  })

  it('双向一致：反向指回来的 id 集合与章节集合相符', () => {
    for (const [path, chapters] of Object.entries(TOOL_CHAPTERS)) {
      const ids = Object.entries(LESSON_TOOLS)
        .filter(([, link]) => link.to === path)
        .map(([id]) => id)
      expect(ids.length, `${path} 没有反向的映射`).toBeGreaterThan(0)
      const derived = [...new Set(ids.map((id) => Number(id.split('.')[0])))].sort((a, b) => a - b)
      expect(derived, `${path} 的章节集合对不上`).toEqual(chapters)
    }
  })

  it('章节集合里不该出现章级映射里没有的章', () => {
    for (const [path, chapters] of Object.entries(TOOL_CHAPTERS)) {
      const drillChapters = [...new Set(TOOL_DRILL_IDS[path].map((id) => Number(id.split('.')[0])))]
      for (const chapter of drillChapters) {
        expect(chapters, `${path} 的 drill 落在没有收录的章里`).toContain(chapter)
      }
    }
  })

  it('入口指向的路由真实存在', () => {
    const paths = new Set(routes.map((route) => route.path))
    for (const [id, link] of Object.entries(LESSON_TOOLS)) {
      expect(paths.has(link.to), `${id} 指向不存在的路由 ${link.to}`).toBe(true)
    }
    for (const path of TOOL_PATHS) {
      expect(paths.has(path), `${path} 没有路由`).toBe(true)
    }
  })
})

describe('知识点详情页的实验入口', () => {
  /**
   * §3 的分片文件还没生成，这里造一份 §3.1 用来验证「本章实验」那一支。
   * 索引照着真的改：只把第 3 章标成有内容，其余原样（章名不能变）。
   */
  const fakeLesson31 = {
    id: '3.1',
    chapter: 3,
    title: '地球的自转：昼夜更替与地方时',
    summary: '地球自转让地表各处迎来日出，也带来不同的地方时。',
    video: { bvid: 'BV1RN4y1f7Hn', p: 13, label: 'p013' },
    sourceLabel: '人教版必修一 第一章「地球的运动」',
    exam: '高考定位',
    outline: ['自转方向与周期', '昼夜更替的成因'],
    mustKnow: ['自转方向：自西向东'],
    pitfalls: ['别把自转方向记反'],
    questionTypes: ['题型：算两地时间差'],
    tables: [],
    prereq: [],
    prereqChapters: [],
    next: [],
    nextChapters: [],
    entities: { provinces: [], countries: [], regions: [] },
  }

  const fakeIndex = () => {
    const index = readIfExists('public/data/knowledge/index.json')
    const chapter = index.chapters.find((c) => c.id === 3)
    chapter.hasContent = true
    return index
  }

  const fakeChapter03 = () => ({
    chapter: 3,
    title: '地球的自转',
    range: { from: 13, to: 16 },
    lessons: [fakeLesson31],
  })

  const mountLesson = async (lessonId) => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/course', name: 'Course', component: { template: '<p>课程地图</p>' } },
        { path: '/course/:chapterId', name: 'Chapter', component: { template: '<p>章节</p>' } },
        { path: '/lesson/:lessonId', name: 'Lesson', component: { template: '<p>知识点</p>' } },
        { path: '/province/:adcode', name: 'Province', component: { template: '<p>省份</p>' } },
        { path: '/tools/contour', name: 'ContourLab', component: { template: '<p>等高线</p>' } },
        {
          path: '/tools/terminator',
          name: 'TerminatorLab',
          component: { template: '<p>晨昏线</p>' },
        },
        {
          path: '/tools/province-shape',
          name: 'ProvinceShape',
          component: { template: '<p>轮廓</p>' },
        },
        {
          path: '/tools/province-abbrev',
          name: 'ProvinceAbbrev',
          component: { template: '<p>简称</p>' },
        },
      ],
    })
    await router.push(`/lesson/${lessonId}`)
    await router.isReady()
    const wrapper = mount(LessonPage, { global: { plugins: [router] } })
    await flushPromises()
    await flushPromises()
    return wrapper
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', async (url) => {
      if (url.endsWith('/data/knowledge/index.json')) {
        return { ok: true, json: async () => fakeIndex() }
      }
      if (url.endsWith('/data/knowledge/chapter-03.json')) {
        return { ok: true, json: async () => fakeChapter03() }
      }
      const payload = readIfExists(`public${url}`)
      if (payload === null) return { ok: false, status: 404, json: async () => ({}) }
      return { ok: true, json: async () => payload }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('drill 的节显示「动手练：…」', async () => {
    const wrapper = await mountLesson('2.19')
    const link = wrapper.find('a.learn-tag[href="/tools/contour"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('动手练：等高线判读')
  })

  it('§15.8 与 §15.9 仍然是「动手练：…」', async () => {
    const shape = await mountLesson('15.8')
    expect(shape.find('a.learn-tag[href="/tools/province-shape"]').text()).toBe('动手练：轮廓形象记忆')

    const abbrev = await mountLesson('15.9')
    expect(abbrev.find('a.learn-tag[href="/tools/province-abbrev"]').text()).toBe(
      '动手练：省会简称全表',
    )
  })

  it('章级关联显示「本章实验：…」', async () => {
    const wrapper = await mountLesson('3.1')
    const link = wrapper.find('a.learn-tag[href="/tools/terminator"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('本章实验：太阳高度角与晨昏线')
  })
})

describe('知识点 ↔ 互动实验：相关提纲区块', () => {
  const readKnowledgeFile = (name) =>
    JSON.parse(readFileSync(`public/data/knowledge/${name}`, 'utf8'))

  const makeRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/course', name: 'Course', component: { template: '<p>课程地图</p>' } },
        { path: '/course/:chapterId', name: 'Chapter', component: { template: '<p>章节</p>' } },
        { path: '/lesson/:lessonId', name: 'Lesson', component: { template: '<p>知识点</p>' } },
      ],
    })

  const mountOutline = async (tool) => {
    const router = makeRouter()
    await router.push('/course')
    await router.isReady()
    const wrapper = mount(RelatedOutline, { props: { tool }, global: { plugins: [router] } })
    await flushPromises()
    await flushPromises()
    return wrapper
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // 知识数据的缓存是模块级的：不清掉的话，后面的用例会拿到前面用例
  // 已经加载成功的章节，「请求失败」那条就成了一次假失败
  beforeEach(() => {
    clearKnowledgeCache()
  })

  it('渲染出指向知识点页的链接，标题取自知识数据', async () => {
    vi.stubGlobal('fetch', async (url) => {
      const payload = readIfExists(`public${url}`)
      if (payload === null) return { ok: false, status: 404, json: async () => ({}) }
      return { ok: true, json: async () => payload }
    })

    // §15 的分片文件是真的：链接文字要与文件里的标题一致
    const wrapper = await mountOutline('/tools/province-shape')

    const links = wrapper.findAll('a.learn-tag')
    expect(links).toHaveLength(1)
    expect(links[0].attributes('href')).toBe('/lesson/15.8')
    expect(links[0].text().startsWith('§')).toBe(true)

    // 标题来自数据文件，不是代码里另抄的一份
    const lesson = readKnowledgeFile('chapter-15.json').lessons.find((l) => l.id === '15.8')
    expect(links[0].text()).toBe(`§15.8 ${lesson.title}`)
    expect(links[0].text()).toContain(lesson.title)

    // 章名也来自课程索引，取不到才退回 §编号
    const index = readKnowledgeFile('index.json')
    const chapter = index.chapters.find((c) => c.id === 15)
    const chapterLink = wrapper.find('a.learn-item__title')
    expect(chapterLink.attributes('href')).toBe('/course/15')
    expect(chapterLink.text()).toBe(`§15 ${chapter.title}`)
  })

  it('请求失败时不抛错，也不留下空壳区块', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('网络不通')
    })

    // 缓存已在前面的 beforeEach 里清掉，这里确实是请求失败
    const wrapper = await mountOutline('/tools/pressure-belt')

    expect(wrapper.find('.learn-panel').exists()).toBe(false)
    expect(wrapper.findAll('a.learn-tag')).toHaveLength(0)
  })

  it('环境里没有 fetch 时不抛错，也不渲染区块', async () => {
    vi.stubGlobal('fetch', undefined)

    const wrapper = await mountOutline('/tools/ocean-current')

    expect(wrapper.find('.learn-panel').exists()).toBe(false)
    expect(wrapper.findAll('a.learn-tag')).toHaveLength(0)
  })

  it('未收录的实验路由不渲染任何东西', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('不该发请求')
    })

    const wrapper = await mountOutline('/tools/not-a-tool')

    expect(wrapper.find('.learn-panel').exists()).toBe(false)
  })
})
