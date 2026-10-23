// @vitest-environment jsdom
/**
 * 知识点详情页的回归守卫。
 *
 * 这一页有两处「容易被顺手改回直觉写法」的行为，这里锁住：
 *   ① 路由只换知识点号时 vue-router 会复用同一个组件实例（不会重新挂载），
 *      不盯着 lessonId 的话，正文还停在上一节，「标记已掌握」会写到上一节上；
 *   ② 章级引用指向已收录的章时要给链接（能点进章节页），
 *      没收录的才是不可点的灰色虚线标签。
 *
 * 谁要是按直觉「纠正」回去，这里的断言会红。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'

import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import LessonPage from '../components/LessonPage.vue'
import { MASTERY_KEY } from '../utils/mastery'

const read = (path) => JSON.parse(readFileSync(path, 'utf8'))

const index = read('public/data/knowledge/index.json')
const chapter02 = read('public/data/knowledge/chapter-02.json')
const chapter15 = read('public/data/knowledge/chapter-15.json')

/** 全部小节：章节分片里的数据 */
const lessonOf = (id) => [...chapter02.lessons, ...chapter15.lessons].find((l) => l.id === id)

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/course', name: 'Course', component: { template: '<p>课程地图</p>' } },
      { path: '/course/:chapterId', name: 'Chapter', component: { template: '<p>章节</p>' } },
      { path: '/lesson/:lessonId', name: 'Lesson', component: { template: '<p>知识点</p>' } },
      { path: '/province/:adcode', name: 'Province', component: { template: '<p>省份</p>' } },
    ],
  })

const mountLesson = async (lessonId) => {
  const router = makeRouter()
  await router.push(`/lesson/${lessonId}`)
  await router.isReady()
  const wrapper = mount(LessonPage, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

/** 路由跳转后等组件把新一节的数据取回来 */
const settle = async () => {
  await flushPromises()
  await flushPromises()
}

beforeEach(() => {
  localStorage.removeItem(MASTERY_KEY)
  vi.stubGlobal('fetch', async (url) => {
    if (url === '/data/knowledge/index.json') return { ok: true, json: async () => index }
    if (url.startsWith('/data/knowledge/chapter-')) {
      const file = url.split('/').pop()
      return { ok: true, json: async () => read(`public/data/knowledge/${file}`) }
    }
    if (url.startsWith('/data/provinces/')) {
      const file = url.split('/').pop()
      return { ok: true, json: async () => read(`public/data/provinces/${file}`) }
    }
    throw new Error(`未预期的请求：${url}`)
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('知识点详情页', () => {
  it('站内导航换知识点时正文跟着换（路由只变参数会复用组件实例）', async () => {
    const { wrapper, router } = await mountLesson('2.19')
    expect(wrapper.find('.learn-h1').text()).toBe(`§2.19 ${lessonOf('2.19').title}`)

    await router.push('/lesson/2.20')
    await settle()

    // 标题、摘要、顶栏都要换成第 2.20 节的，不能停在第 2.19 节
    expect(wrapper.find('.learn-h1').text()).toBe(`§2.20 ${lessonOf('2.20').title}`)
    expect(wrapper.find('.learn-lead').text()).toBe(lessonOf('2.20').summary)
    expect(wrapper.find('.learn-top__title').text()).toBe('§2.20')
    // 前置与后续也要换成第 2.20 节的引用
    expect(wrapper.findAll('a[href^="/lesson/"]').map((n) => n.attributes('href'))).toEqual(
      expect.arrayContaining(['/lesson/2.19', '/lesson/2.14', '/lesson/2.21', '/lesson/2.22']),
    )
  })

  it('导航到新的一节后，「标记已掌握」写的是新那一节的 id', async () => {
    const { wrapper, router } = await mountLesson('2.19')
    await router.push('/lesson/2.20')
    await settle()

    const button = wrapper.findAll('button').find((b) => b.text() === '标记已掌握')
    await button.trigger('click')

    const state = JSON.parse(localStorage.getItem(MASTERY_KEY) ?? '{}')
    expect(state['2.20']).toBe('known')
    expect(state['2.19']).toBeUndefined()
  })

  it('章级引用：已收录的章给链接，没收录的给不可点的标签', async () => {
    const { wrapper } = await mountLesson('15.8')

    // 前置里的 §2 已收录（索引里 hasContent 为 true）→ 指向章节页的链接
    const chapter2 = wrapper.find('a[href="/course/2"]')
    expect(chapter2.exists()).toBe(true)
    expect(chapter2.text()).toContain('§2')

    // 前置里的 §14 没收录 → 灰色虚线标签，不可点
    const muted = wrapper.findAll('.learn-tag--muted')
    const muted14 = muted.find((n) => n.text().includes('§14'))
    expect(muted14).toBeTruthy()
    expect(muted14.element.tagName).toBe('SPAN')
    expect(muted14.attributes('href')).toBeUndefined()
    expect(muted14.attributes('title')).toBe('第 14 章尚未收录')
  })

  it('未收录的章级引用不是链接', async () => {
    const { wrapper } = await mountLesson('2.1')

    // 第 3 章还没收录，不能给会打不开的链接
    expect(wrapper.find('a[href="/course/3"]').exists()).toBe(false)
    const muted = wrapper.findAll('.learn-tag--muted')
    const chapter3 = muted.find((n) => n.text().includes('§3'))
    expect(chapter3).toBeTruthy()
    expect(chapter3.element.tagName).toBe('SPAN')
    expect(chapter3.attributes('title')).toBe('第 3 章尚未收录')
    // 小节级引用 §1.2 同样没收录，也是标签
    expect(muted.some((n) => n.text().includes('§1.2'))).toBe(true)
  })

  it('关联地区的省名来自省份数据文件，不是页面里写死的表', async () => {
    const { wrapper } = await mountLesson('15.8')
    await settle()

    const labels = wrapper.findAll('a[href^="/province/"]').map((n) => n.text())
    expect(labels).toHaveLength(34)
    expect(labels).toContain('北京市')
    expect(labels).toContain('内蒙古自治区')
    expect(labels).toContain('香港特别行政区')
    // 没有落到「取不到就打印代码」的兜底
    expect(labels.some((t) => /^\d{6}$/.test(t))).toBe(false)
  })

  it('表格里的强调渲染成粗体，不露出字面量 **', async () => {
    const { wrapper } = await mountLesson('2.14')
    const cells = wrapper.findAll('.learn-table td')

    expect(cells.length).toBeGreaterThan(0)
    // 数据里确实有带 ** 的单元格（否则这条断言是空的）
    const raw = lessonOf('2.14').tables[0].rows.flat().filter((c) => String(c).includes('**'))
    expect(raw.length).toBeGreaterThan(0)

    // 页面上不能出现字面量星号
    expect(wrapper.find('.learn-table').text()).not.toContain('**')
    // 强调确实变成了 <strong>
    expect(wrapper.findAll('.learn-table strong').length).toBeGreaterThan(0)
  })

  it('教材出处里的强调渲染成粗体，不露出字面量 **', async () => {
    const { wrapper } = await mountLesson('2.26')

    expect(lessonOf('2.26').sourceLabel).toContain('**')
    const meta = wrapper.find('.learn-panel__meta')
    expect(meta.text()).not.toContain('**')
    expect(meta.findAll('strong').length).toBeGreaterThan(0)
  })
})
