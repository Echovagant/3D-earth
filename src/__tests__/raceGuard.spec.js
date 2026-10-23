// @vitest-environment jsdom
/**
 * 四个带参页面的请求竞态守卫。
 *
 * 路由只换参数时 vue-router 复用同一个组件实例，watch 会紧接着再发一次请求。
 * 后发起的请求先返回、慢的旧请求后到时，旧响应会把新数据覆盖成上一条
 * （页面停在上一条内容）。这里用可手动控制完成顺序的 fetch mock 把这个顺序
 * 固定住：先 resolve B（快），再 resolve A（慢），页面必须还是 B 的数据。
 *
 * 不用假定时器：定时器只能造出「大概的快慢」，控制不了两次响应真正到达的先后，
 * 那种测法在防护失效时也可能照样是绿的。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'

import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

const read = (path) => JSON.parse(readFileSync(path, 'utf8'))

const index = read('public/data/knowledge/index.json')
const chapter02 = read('public/data/knowledge/chapter-02.json')
const chapter15 = read('public/data/knowledge/chapter-15.json')
const provinceIndex = read('public/data/provinces/index.json')
const geoJson = read('public/geojson/world-countries.json')

const provinceOf = (adcode) => read(`public/data/provinces/${adcode}.json`)
const chapterOf = (id) => index.chapters.find((c) => c.id === id)
const nameOf = (iso3) => geoJson.features.find((f) => f.properties.iso3 === iso3).properties.name

/** 全部有内容的章的小节：取值范围与 utils/knowledge.js 的 loadAllLessons() 一致 */
const allLessons = [...chapter02.lessons, ...chapter15.lessons]
const lessonOf = (id) => allLessons.find((l) => l.id === id)

/** 手动控制完成顺序的响应：什么时候 resolve 由测试说了算 */
const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

/** 成功响应 */
const ok = (body) => ({ ok: true, json: async () => body })

/**
 * fetch mock：
 *   · respondNow 登记的地址立刻返回（辅助数据，不参与竞态）；
 *   · 其余地址排成队列，由测试自己 resolve。同一地址可以排多次，按调用顺序取，
 *     这样才造得出「同一个地址、后发起的请求先返回」。
 */
const createFetchMock = () => {
  const immediate = new Map()
  const queues = new Map()

  const mock = vi.fn((url) => {
    const key = String(url)
    if (immediate.has(key)) return Promise.resolve(immediate.get(key))
    const queue = queues.get(key) ?? []
    if (!queue.length) {
      queue.push(deferred())
      queues.set(key, queue)
    }
    return queue.shift().promise
  })

  return {
    mock,
    /** 这个地址立刻返回 */
    respondNow(url, body) {
      immediate.set(String(url), ok(body))
    },
    /** 这个地址的响应由测试自己决定什么时候回来 */
    defer(url) {
      const key = String(url)
      const pending = deferred()
      const queue = queues.get(key) ?? []
      queue.push(pending)
      queues.set(key, queue)
      return pending
    },
  }
}

/** 等异步加载链跑完（fetch → 状态写入 → 重渲染） */
const settle = async () => {
  await flushPromises()
  await flushPromises()
  await flushPromises()
}

const makeRouter = (routes) => createRouter({ history: createMemoryHistory(), routes })

beforeEach(() => {
  // 每个用例都重新载入组件与工具模块：utils/knowledge.js 与 utils/provinceNames.js
  // 内部都有模块级缓存，不重置的话用例之间会互相喂饱已缓存的响应
  vi.resetModules()
  vi.doUnmock('../utils/knowledge')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.doUnmock('../utils/knowledge')
})

describe('带参页面的请求竞态防护', () => {
  it('省份页：慢的旧响应后到时不能把新省覆盖成上一省', async () => {
    const { mock, respondNow, defer } = createFetchMock()
    vi.stubGlobal('fetch', mock)

    // 知识数据立刻回来：只有省份数据文件参与竞态
    respondNow('/data/knowledge/index.json', index)
    respondNow('/data/knowledge/chapter-02.json', chapter02)
    respondNow('/data/knowledge/chapter-15.json', chapter15)

    const slow = defer('/data/provinces/510000.json')
    const fast = defer('/data/provinces/460000.json')

    const { default: ProvincePage } = await import('../components/ProvincePage.vue')
    const router = makeRouter([
      { path: '/', name: 'Earth', component: { template: '<p>地球</p>' } },
      { path: '/province/:adcode', name: 'Province', component: ProvincePage },
      { path: '/lesson/:lessonId', name: 'Lesson', component: { template: '<p>知识点</p>' } },
      { path: '/licenses', name: 'Licenses', component: { template: '<p>许可</p>' } },
    ])
    await router.push('/province/510000')
    await router.isReady()
    const wrapper = mount(ProvincePage, { global: { plugins: [router] } })
    await settle()

    // 换省：组件实例被复用，watch 再发一次请求
    await router.push('/province/460000')
    await settle()

    // 快的那次先回来
    fast.resolve(ok(provinceOf('460000')))
    await settle()

    // 慢的那次后到：迟到的旧响应必须被丢掉
    slow.resolve(ok(provinceOf('510000')))
    await settle()

    expect(wrapper.find('h1').text()).toBe(provinceOf('460000').name)
    expect(wrapper.text()).not.toContain(provinceOf('510000').name)
    expect(wrapper.find('.detail-page__state--error').exists()).toBe(false)
  })

  it('章节页：慢的旧响应后到时不能把新一章覆盖成上一章', async () => {
    const { mock, respondNow, defer } = createFetchMock()
    vi.stubGlobal('fetch', mock)

    // 索引立刻回来，两章的小节分片由测试控制完成顺序
    respondNow('/data/knowledge/index.json', index)
    const slow = defer('/data/knowledge/chapter-02.json')
    const fast = defer('/data/knowledge/chapter-15.json')

    const { default: ChapterPage } = await import('../components/ChapterPage.vue')
    const router = makeRouter([
      { path: '/course', name: 'Course', component: { template: '<p>课程地图</p>' } },
      { path: '/course/:chapterId', name: 'Chapter', component: ChapterPage },
      { path: '/lesson/:lessonId', name: 'Lesson', component: { template: '<p>知识点</p>' } },
    ])
    await router.push('/course/2')
    await router.isReady()
    const wrapper = mount(ChapterPage, { global: { plugins: [router] } })
    await settle()

    // 换章：组件实例被复用，watch 再发一次请求
    await router.push('/course/15')
    await settle()

    fast.resolve(ok(chapter15))
    await settle()
    slow.resolve(ok(chapter02))
    await settle()

    expect(wrapper.find('h1').text()).toBe(`第 15 章 · ${chapterOf(15).title}`)
    // 列表条目也要是新一章的，不能停在上一章
    const hrefs = wrapper.findAll('.learn-item__title').map((el) => el.attributes('href'))
    expect(hrefs).toEqual(chapter15.lessons.map((l) => `/lesson/${l.id}`))
  })

  it('知识点页：慢的旧响应后到时不能把新一节覆盖成上一节', async () => {
    const { mock, respondNow } = createFetchMock()
    vi.stubGlobal('fetch', mock)
    respondNow('/data/knowledge/index.json', index)
    respondNow('/data/provinces/index.json', provinceIndex)

    // 知识点页的小节来自 utils/knowledge.js，那一层有模块级缓存（同一章只取一次），
    // 两次加载共用同一个 Promise，用 fetch mock 造不出「后发起的请求先返回」。
    // 这里只替换取小节的那一个函数，用手动 resolve 的 Promise 控制完成顺序。
    vi.doMock('../utils/knowledge', async (importOriginal) => {
      const actual = await importOriginal()
      return { ...actual, loadAllLessons: vi.fn() }
    })

    const { default: LessonPage } = await import('../components/LessonPage.vue')
    const knowledge = await import('../utils/knowledge')

    const slow = deferred()
    const fast = deferred()
    knowledge.loadAllLessons.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise)

    const router = makeRouter([
      { path: '/course', name: 'Course', component: { template: '<p>课程地图</p>' } },
      { path: '/course/:chapterId', name: 'Chapter', component: { template: '<p>章节</p>' } },
      { path: '/lesson/:lessonId', name: 'Lesson', component: LessonPage },
      { path: '/province/:adcode', name: 'Province', component: { template: '<p>省份</p>' } },
    ])
    await router.push('/lesson/2.19')
    await router.isReady()
    const wrapper = mount(LessonPage, { global: { plugins: [router] } })
    await settle()

    // 换知识点：组件实例被复用，watch 再发一次请求
    await router.push('/lesson/15.8')
    await settle()

    fast.resolve(allLessons)
    await settle()
    slow.resolve(allLessons)
    await settle()

    expect(wrapper.find('.learn-h1').text()).toBe(`§15.8 ${lessonOf('15.8').title}`)
    expect(wrapper.find('.learn-top__title').text()).toBe('§15.8')
  })

  it('国家页：慢的旧响应后到时不能把新国家覆盖成上一个', async () => {
    const { mock, defer } = createFetchMock()
    vi.stubGlobal('fetch', mock)

    // 同一个地址连发两次：按调用顺序取，先拿到的是慢的那次、后拿到的是快的那次
    const slow = defer('/geojson/world-countries.json')
    const fast = defer('/geojson/world-countries.json')

    const { default: CountryPage } = await import('../components/CountryPage.vue')
    const router = makeRouter([
      { path: '/world', name: 'World', component: { template: '<p>全球</p>' } },
      { path: '/country/:iso3', name: 'Country', component: CountryPage },
      { path: '/licenses', name: 'Licenses', component: { template: '<p>许可</p>' } },
    ])
    await router.push('/country/USA')
    await router.isReady()
    const wrapper = mount(CountryPage, { global: { plugins: [router] } })
    await settle()

    // 换国家：组件实例被复用，watch 再发一次请求
    await router.push('/country/FRA')
    await settle()

    fast.resolve(ok(geoJson))
    await settle()
    slow.resolve(ok(geoJson))
    await settle()

    expect(wrapper.find('h1').text()).toBe(nameOf('FRA'))
    expect(wrapper.text()).not.toContain(nameOf('USA'))
    expect(wrapper.find('.detail-page__state--error').exists()).toBe(false)
  })

  it('组件卸载后到达的响应不再写状态', async () => {
    const { mock, respondNow, defer } = createFetchMock()
    vi.stubGlobal('fetch', mock)

    respondNow('/data/knowledge/index.json', index)
    respondNow('/data/knowledge/chapter-02.json', chapter02)
    respondNow('/data/knowledge/chapter-15.json', chapter15)

    const slow = defer('/data/provinces/510000.json')

    const { default: ProvincePage } = await import('../components/ProvincePage.vue')
    const router = makeRouter([
      { path: '/', name: 'Earth', component: { template: '<p>地球</p>' } },
      { path: '/province/:adcode', name: 'Province', component: ProvincePage },
      { path: '/lesson/:lessonId', name: 'Lesson', component: { template: '<p>知识点</p>' } },
      { path: '/licenses', name: 'Licenses', component: { template: '<p>许可</p>' } },
    ])
    await router.push('/province/510000')
    await router.isReady()
    const wrapper = mount(ProvincePage, { global: { plugins: [router] } })
    await settle()

    // 组件先卸载，响应后到
    wrapper.unmount()
    slow.resolve(ok(provinceOf('510000')))
    await settle()

    expect(wrapper.vm.data).toBe(null)
    expect(wrapper.vm.loading).toBe(true)
  })
})
