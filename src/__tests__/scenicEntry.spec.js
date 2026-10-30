// @vitest-environment jsdom
/**
 * 景区模块的入口接入：知识点页的景区卡与省详情页的卡片网格。
 *
 * 这两处的共同点是「从清单派生」而不是各写一份：
 * 知识点页挂该省的景区卡，省详情页把 highlights 文字标签换成卡片网格。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'

import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

const read = (path) => JSON.parse(readFileSync(path, 'utf8'))

const knowledgeIndex = read('public/data/knowledge/index.json')
const beijingList = read('public/data/scenic/110000.json')
const sichuanList = read('public/data/scenic/510000.json')

/** 有清单的省返回真实清单，其余按「暂无景区」返回 404 */
beforeEach(() => {
  vi.stubGlobal('fetch', async (url) => {
    if (url.startsWith('/data/knowledge/')) {
      if (url === '/data/knowledge/index.json') return { ok: true, json: async () => knowledgeIndex }
      const file = url.split('/').pop()
      return { ok: true, json: async () => read(`public/data/knowledge/${file}`) }
    }
    if (url.startsWith('/data/provinces/')) {
      const file = url.split('/').pop()
      return { ok: true, json: async () => read(`public/data/provinces/${file}`) }
    }
    if (url.startsWith('/data/scenic/')) {
      const file = url.split('/').pop()
      if (file === '110000.json') return { ok: true, json: async () => beijingList }
      if (file === '510000.json') return { ok: true, json: async () => sichuanList }
      return { ok: false, status: 404, json: async () => ({}) }
    }
    return { ok: false, status: 404, json: async () => ({}) }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const settle = async () => {
  await flushPromises()
  await flushPromises()
  await flushPromises()
}

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Earth', component: { template: '<p>地球</p>' } },
      { path: '/province/:adcode', name: 'Province', component: { template: '<p>省份</p>' } },
      { path: '/lesson/:lessonId', name: 'Lesson', component: { template: '<p>知识点</p>' } },
      { path: '/scenic/:adcode/:id', name: 'Scenic', component: { template: '<p>景点</p>' } },
      { path: '/course', name: 'Course', component: { template: '<p>课程</p>' } },
    ],
  })

describe('知识点页的景区入口', () => {
  it('关联地区下面挂该省的景区卡与「看本省全部景点」链接', async () => {
    vi.resetModules()
    const { default: LessonPage } = await import('../components/LessonPage.vue')
    const router = makeRouter()
    await router.push('/lesson/15.8')
    await router.isReady()
    const wrapper = mount(LessonPage, { global: { plugins: [router] } })
    await settle()

    // 关联地区的省名标签还在（点击行为不变）
    expect(wrapper.findAll('a[href^="/province/"]').length).toBeGreaterThan(0)

    // 景区卡挂在关联地区下面
    const cards = wrapper.findAll('.scenic-card')
    expect(cards.length).toBeGreaterThan(0)
    expect(cards.length).toBeLessThanOrEqual(3)

    // 每张卡都指向景区详情页
    const hrefs = cards.map((c) => c.attributes('href'))
    expect(hrefs.every((h) => h.startsWith('/scenic/'))).toBe(true)

    // 「看本省全部景点」链接指向省详情页的景区区锚点
    const allLink = wrapper.find('a[href^="/province/"][href$="#scenic"]')
    expect(allLink.exists()).toBe(true)
  })
})

describe('省详情页的景区入口', () => {
  it('把 highlights 文字标签换成景区卡片网格，并有「随便看看」', async () => {
    vi.resetModules()
    const { default: ProvincePage } = await import('../components/ProvincePage.vue')
    const router = makeRouter()
    await router.push('/province/510000')
    await router.isReady()
    const wrapper = mount(ProvincePage, { global: { plugins: [router] } })
    await settle()

    // 卡片网格在，锚点也在
    const grid = wrapper.find('#scenic')
    expect(grid.exists()).toBe(true)
    expect(grid.findAll('.scenic-card').length).toBe(3)

    // 卡片指向景区详情页
    const hrefs = grid.findAll('.scenic-card').map((c) => c.attributes('href'))
    expect(hrefs).toEqual(
      expect.arrayContaining(sichuanList.scenics.map((s) => `/scenic/510000/${s.id}`)),
    )

    // 旧的文字标签区不再出现
    expect(wrapper.findAll('.detail-page__tag').some((n) => n.text().includes('九寨沟'))).toBe(false)

    // 随便看看
    const random = wrapper.findAll('button').find((b) => b.text().includes('随便看看'))
    expect(random).toBeTruthy()
  })

  it('「随便看看」跳到某个省的某个景区', async () => {
    vi.resetModules()
    const { default: ProvincePage } = await import('../components/ProvincePage.vue')
    const router = makeRouter()
    await router.push('/province/510000')
    await router.isReady()
    const wrapper = mount(ProvincePage, { global: { plugins: [router] } })
    await settle()

    const random = wrapper.findAll('button').find((b) => b.text().includes('随便看看'))
    await random.trigger('click')
    await settle()

    // 跳到 /scenic/<adcode>/<id>
    expect(router.currentRoute.value.path).toMatch(/^\/scenic\/\d{6}\/[\w-]+$/)
  })
})
