// @vitest-environment jsdom
/**
 * 「按省名搜知识点」的契约测试。
 *
 * 知识点数据里省份存的是 6 位 adcode，搜「四川」这种省名本来一条都搜不到。
 * 这里锁三件事：
 *   ① 传了省名表就能按省名全称命中（「四川」「上海」）
 *   ② 不传省名表时行为与改动前完全一致（只按 adcode 匹配）
 *   ③ 省份简称不参与匹配（「沪」不能当成通用关键词）
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { cwd } from 'node:process'
import path from 'node:path'

import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import SearchPage from '../components/SearchPage.vue'
import { searchLessons, matchedProvinces } from '../utils/knowledge'

// jsdom 环境下 import.meta.url 不是 file 协议，仓库根目录取进程工作目录
const repoRoot = cwd()
const read = (p) => JSON.parse(readFileSync(path.join(repoRoot, p), 'utf-8'))

const index = read('public/data/knowledge/index.json')
const provinceIndex = read('public/data/provinces/index.json')

/** 全部有内容的章的小节，取值范围与 utils/knowledge.js 的 loadAllLessons() 一致 */
const lessons = index.chapters
  .filter((c) => c.hasContent)
  .flatMap((c) => read(`public/data/knowledge/chapter-${String(c.id).padStart(2, '0')}.json`).lessons)

/** 省名表：只取全称，简称不进来 */
const provinceNames = Object.fromEntries(
  Object.entries(provinceIndex.provinces).map(([adcode, p]) => [adcode, p.name]),
)

/**
 * 改动前的搜索实现：只按字段与 adcode 匹配。
 * 不传省名表时，新实现必须与它逐条一致。
 */
const legacySearch = (list, keyword) => {
  const kw = String(keyword ?? '').trim().toLowerCase()
  if (!kw) return []
  return list.filter((l) => {
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

/** 一条合成的小节：只有实体里的省份可匹配，正文里没有任何省名 */
const synthetic = (provinces) => ({
  id: 'x.1',
  title: '合成小节',
  summary: '与省份无关的正文',
  outline: [],
  mustKnow: [],
  pitfalls: [],
  questionTypes: [],
  entities: { provinces },
})

describe('按省名搜索（纯函数）', () => {
  it('搜「四川」能命中挂着 510000 的小节', () => {
    const hit = searchLessons(lessons, '四川', provinceNames)

    expect(hit.map((l) => l.id)).toContain('15.8')
    expect(hit.some((l) => (l.entities?.provinces ?? []).includes('510000'))).toBe(true)
  })

  it('搜「上海」能命中挂着 310000 的小节', () => {
    const hit = searchLessons(lessons, '上海', provinceNames)

    expect(hit.map((l) => l.id)).toContain('15.8')
    expect(hit.some((l) => (l.entities?.provinces ?? []).includes('310000'))).toBe(true)
  })

  it('搜省名全称也能命中（「四川省」比简称更全）', () => {
    const hit = searchLessons(lessons, '四川省', provinceNames)

    expect(hit.map((l) => l.id)).toContain('15.8')
  })

  it('搜不存在的词命中 0 条', () => {
    expect(searchLessons(lessons, 'zzz不存在的关键词', provinceNames)).toEqual([])
  })

  it('不传省名表时，行为与改动前完全一致', () => {
    for (const kw of ['等高线', '510000', '四川', '上海', '3s', '  ', 'zzz不存在的关键词']) {
      expect(searchLessons(lessons, kw), `搜索词「${kw}」的结果变了`).toEqual(
        legacySearch(lessons, kw),
      )
    }
  })

  it('不传省名表时仍然按 adcode 匹配，不按省名匹配', () => {
    // 真实数据里正文本身就写着「四川」「上海」，命中的是文本不是省份——
    // 所以这里用合成小节来断言契约本身
    const list = [synthetic(['310000'])]

    expect(searchLessons(lessons, '510000').map((l) => l.id)).toContain('15.8')
    expect(searchLessons(list, '310000')).toHaveLength(1)
    expect(searchLessons(list, '上海')).toEqual([])
  })

  it('传了省名表也不会把 adcode 匹配弄坏', () => {
    const hit = searchLessons(lessons, '510000', provinceNames)

    expect(hit.map((l) => l.id)).toContain('15.8')
  })

  it('省份简称不参与匹配：「沪」命不中，「上海」才命中', () => {
    const list = [synthetic(['310000'])]

    expect(searchLessons(list, '沪', provinceNames)).toEqual([])
    expect(searchLessons(list, '上海', provinceNames)).toHaveLength(1)
  })

  it('matchedProvinces 给出命中的是哪个省', () => {
    const hit = searchLessons(lessons, '四川', provinceNames)

    expect(hit.map((l) => matchedProvinces(l, '四川', provinceNames))).toContainEqual([
      { adcode: '510000', name: '四川省' },
    ])
  })

  it('matchedProvinces 对没命中省份的小节返回空数组', () => {
    expect(matchedProvinces(synthetic(['310000']), '四川', provinceNames)).toEqual([])
    expect(matchedProvinces(synthetic(['310000']), '', provinceNames)).toEqual([])
  })
})

/** 实际请求过的 URL */
const calls = []

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/search', name: 'Search', component: SearchPage },
      { path: '/course', name: 'Course', component: { template: '<p>课程地图</p>' } },
      { path: '/lesson/:lessonId', name: 'Lesson', component: { template: '<p>知识点</p>' } },
      { path: '/province/:adcode', name: 'Province', component: { template: '<p>省份</p>' } },
    ],
  })

const mountSearch = async () => {
  const router = makeRouter()
  await router.push('/search')
  await router.isReady()
  const wrapper = mount(SearchPage, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  calls.length = 0
  vi.stubGlobal('fetch', async (url) => {
    calls.push(url)
    if (url === '/data/knowledge/index.json') return { ok: true, json: async () => index }
    if (url === '/data/provinces/index.json') return { ok: true, json: async () => provinceIndex }
    const file = url.split('/').pop()
    return { ok: true, json: async () => read(`public/data/knowledge/${file}`) }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('搜索页', () => {
  it('加载知识点时顺带取省名表', async () => {
    await mountSearch()

    expect(calls).toContain('/data/provinces/index.json')
  })

  it('搜「四川」命中知识点，并说明是按哪个省命中的', async () => {
    const wrapper = await mountSearch()

    await wrapper.find('input.learn-input').setValue('四川')
    await flushPromises()

    expect(wrapper.text()).toContain('§15.8')
    expect(wrapper.text()).toContain('关联省份：')
    expect(wrapper.text()).toContain('四川省')

    const link = wrapper.find('a[href="/province/510000"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('四川省')
  })

  it('搜不存在的词显示空态', async () => {
    const wrapper = await mountSearch()

    await wrapper.find('input.learn-input').setValue('zzz不存在的关键词')
    await flushPromises()

    expect(wrapper.text()).toContain('没有命中')
    expect(wrapper.findAll('.learn-item')).toHaveLength(0)
  })
})
