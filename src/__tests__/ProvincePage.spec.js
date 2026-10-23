// @vitest-environment jsdom
/**
 * 省份页「关联知识点」区块的回归守卫。
 *
 * 这一页有三处「容易被顺手改回直觉写法」的行为，这里锁住：
 *   ① 关联知识点是按 entities.provinces 反查出来的，条目数随知识数据变，
 *      写死数字（写死 2）会在数据更新后失效
 *   ② 路由只换 adcode 时 vue-router 会复用同一个组件实例（不会重新挂载），
 *      不盯着 adcode 的话，换省后区块还停在上一个省
 *   ③ 知识数据加载失败只该少一个区块，不该影响省份页本身
 *
 * 谁要是按直觉「纠正」回去，这里的断言会红。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'

import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

const read = (path) => JSON.parse(readFileSync(path, 'utf8'))

const knowledgeIndex = read('public/data/knowledge/index.json')

/** 全部有内容的章的小节，取值范围与 utils/knowledge.js 的 loadAllLessons() 一致 */
const allLessons = knowledgeIndex.chapters
  .filter((c) => c.hasContent)
  .flatMap((c) => read(`public/data/knowledge/chapter-${String(c.id).padStart(2, '0')}.json`).lessons)

/** 某个省实际挂着的知识点：条目数从数据里算，不写死 */
const lessonsOf = (adcode) => allLessons.filter((l) => (l.entities?.provinces ?? []).includes(adcode))

const provinceOf = (adcode) => read(`public/data/provinces/${adcode}.json`)

/** 知识数据是否返回 404 */
let knowledgeBroken = false

/** 实际请求过的 URL */
const calls = []

beforeEach(() => {
  knowledgeBroken = false
  calls.length = 0
  vi.stubGlobal('fetch', async (url) => {
    calls.push(url)
    if (url.startsWith('/data/knowledge/')) {
      if (knowledgeBroken) return { ok: false, status: 404, json: async () => ({}) }
      if (url === '/data/knowledge/index.json') return { ok: true, json: async () => knowledgeIndex }
      const file = url.split('/').pop()
      return { ok: true, json: async () => read(`public/data/knowledge/${file}`) }
    }
    if (url.startsWith('/data/provinces/')) {
      const file = url.split('/').pop()
      return { ok: true, json: async () => read(`public/data/provinces/${file}`) }
    }
    return { ok: false, status: 404, json: async () => ({}) }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/** 等异步加载链跑完（fetch → 状态写入 → 重渲染） */
const settle = async () => {
  await flushPromises()
  await flushPromises()
  await flushPromises()
}

/**
 * 挂载省份页。
 *
 * 每个用例都重新载入组件与知识数据模块：utils/knowledge.js 内部有模块级缓存
 * （indexPromise / chapterCache），不重置的话「知识数据加载失败」那条用例会被
 * 前面用例缓存下来的成功结果喂饱，测不出失败分支。
 */
const mountProvince = async (adcode) => {
  vi.resetModules()
  const { default: ProvincePage } = await import('../components/ProvincePage.vue')
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Earth', component: { template: '<p>地球</p>' } },
      { path: '/province/:adcode', name: 'Province', component: ProvincePage },
      { path: '/lesson/:lessonId', name: 'Lesson', component: { template: '<p>知识点</p>' } },
      { path: '/licenses', name: 'Licenses', component: { template: '<p>许可</p>' } },
    ],
  })
  await router.push(`/province/${adcode}`)
  await router.isReady()
  const wrapper = mount(ProvincePage, { global: { plugins: [router] } })
  await settle()
  return { wrapper, router }
}

describe('省份页的关联知识点', () => {
  it('有关联知识点时区块出现，条目数与数据一致且每条都能点进知识点页', async () => {
    const expected = lessonsOf('510000')
    // 夹具前提：四川确实挂着知识点，否则下面「条目数等于数据」这条断言是空的
    expect(expected.length).toBeGreaterThan(0)

    const { wrapper } = await mountProvince('510000')

    expect(wrapper.find('h1').text()).toBe(provinceOf('510000').name)
    expect(wrapper.text()).toContain('关联知识点 / LESSONS')
    expect(wrapper.findAll('.detail-page__tag-link')).toHaveLength(expected.length)

    const hrefs = wrapper.findAll('.detail-page__tag-link').map((el) => el.attributes('href'))
    expect(hrefs).toEqual(expected.map((l) => `/lesson/${l.id}`))
  })

  it('换省时关联知识点跟着换（路由只变参数会复用组件实例）', async () => {
    const hainan = lessonsOf('460000')
    const sichuan = lessonsOf('510000')
    // 换的这两个省关联的知识点数量不同，否则「跟着换」这条断言看不出变化
    expect(hainan.length).not.toBe(sichuan.length)

    const { wrapper, router } = await mountProvince('460000')
    expect(wrapper.find('h1').text()).toBe(provinceOf('460000').name)
    expect(wrapper.findAll('.detail-page__tag-link')).toHaveLength(hainan.length)

    await router.push('/province/510000')
    await settle()

    // 省名与关联知识点都要换成四川那批，不能停在海南
    expect(wrapper.find('h1').text()).toBe(provinceOf('510000').name)
    expect(wrapper.findAll('.detail-page__tag-link')).toHaveLength(sichuan.length)
    const hrefs = wrapper.findAll('.detail-page__tag-link').map((el) => el.attributes('href'))
    expect(hrefs).toEqual(sichuan.map((l) => `/lesson/${l.id}`))
  })

  it('知识数据加载失败时整块不出现，省份页本身照常显示', async () => {
    knowledgeBroken = true

    const { wrapper } = await mountProvince('510000')

    expect(wrapper.find('h1').text()).toBe(provinceOf('510000').name)
    expect(wrapper.text()).not.toContain('关联知识点')
    expect(wrapper.findAll('.detail-page__tag-link')).toHaveLength(0)
  })
})
