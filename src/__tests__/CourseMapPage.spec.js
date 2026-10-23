// @vitest-environment jsdom
/**
 * 课程地图页的掌握进度回归守卫。
 *
 * 掌握度是 localStorage 里的自由键，可能混进**范围外**的小节 id——
 * 比如还没收录的章（§7）在别处被标过，或旧版本留下的小节 id。
 * 分母是「已收录章的知识点总数」，分子若不做过滤就会超出分母，
 * 页面会显示「已掌握 3 节 · 共 36 节（8%）」这种自相矛盾的数字，
 * 进度条宽度也会超过 100%。
 *
 * 谁要是按直觉「把过滤去掉」或「拿 id 列表长度当分母」，这里的断言会红。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'

import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import CourseMapPage from '../components/CourseMapPage.vue'
import { MASTERY_KEY } from '../utils/mastery'

const read = (path) => JSON.parse(readFileSync(path, 'utf8'))
const index = read('public/data/knowledge/index.json')

/** 索引里已收录的章 */
const withContent = index.chapters.filter((c) => c.hasContent)
const TOTAL = withContent.reduce((sum, c) => sum + c.lessonCount, 0)

/** 随便挑一个「规划中」的章，它的 id 不该被计入 */
const planningChapter = index.chapters.find((c) => !c.hasContent)

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Earth', component: { template: '<p>地球</p>' } },
      { path: '/course', name: 'Course', component: CourseMapPage },
      { path: '/course/:chapterId', name: 'Chapter', component: { template: '<p>章节</p>' } },
      { path: '/search', name: 'Search', component: { template: '<p>搜索</p>' } },
    ],
  })

const mountMap = async (mastery) => {
  localStorage.setItem(MASTERY_KEY, JSON.stringify(mastery))
  const router = makeRouter()
  await router.push('/course')
  await router.isReady()
  const wrapper = mount(CourseMapPage, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.stubGlobal('fetch', async (url) => {
    if (url === '/data/knowledge/index.json') return { ok: true, json: async () => index }
    return { ok: false, status: 404, json: async () => ({}) }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.removeItem(MASTERY_KEY)
})

describe('课程地图的掌握进度', () => {
  it('分母是已收录章的知识点总数', async () => {
    const wrapper = await mountMap({ '2.19': 'known' })

    expect(wrapper.text()).toContain(`共 ${TOTAL} 节`)
    expect(withContent.map((c) => c.id)).toEqual([2, 15])
  })

  it('范围外的小节 id 不计入已掌握数', async () => {
    const wrapper = await mountMap({
      '2.19': 'known',
      '2.20': 'review',
      // 规划中的章：这一章没有分片，不该出现在进度里
      [`${planningChapter.id}.1`]: 'known',
      [`${planningChapter.id}.2`]: 'known',
    })

    expect(wrapper.text()).toContain('已掌握 1 节')
    expect(wrapper.text()).toContain('待复习 1 节')
    expect(wrapper.text()).toContain(`共 ${TOTAL} 节`)
  })

  it('进度条宽度不会超过 100%', async () => {
    const inScopeKnown = ['2.19', '2.20', '15.8', '15.9']
    const wrapper = await mountMap({
      ...Object.fromEntries(inScopeKnown.map((id) => [id, 'known'])),
      // 规划中的章：这一章没有分片，不该出现在进度里
      [`${planningChapter.id}.1`]: 'known',
      [`${planningChapter.id}.2`]: 'known',
      [`${planningChapter.id}.3`]: 'known',
    })

    const width = wrapper.find('.learn-bar__fill').attributes('style')
    const percent = Number(/width:\s*([\d.]+)%/.exec(width)?.[1] ?? NaN)

    expect(Number.isFinite(percent)).toBe(true)
    expect(percent).toBeLessThanOrEqual(100)
    // 只按范围内的已掌握数算：范围外那三个 id 不进分子
    expect(percent).toBe(Math.round((inScopeKnown.length / TOTAL) * 100))
    expect(wrapper.text()).toContain(`已掌握 ${inScopeKnown.length} 节`)
  })

  it('没有掌握记录时是 0%', async () => {
    const wrapper = await mountMap({})

    expect(wrapper.text()).toContain('已掌握 0 节')
    expect(wrapper.find('.learn-bar__fill').attributes('style')).toContain('0%')
  })
})
