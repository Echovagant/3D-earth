// @vitest-environment jsdom
/**
 * 章节页的回归守卫。
 *
 * 这一页有两处「容易被顺手改回直觉写法」的行为，这里锁住：
 *   ① 章节标题取自课程索引（直接拿章号拼会渲染成「第 2 章 · 第 2 章」）
 *   ② 空态由索引的 hasContent 决定（没有内容的章没有数据分片，
 *      直接请求分片会变成 404 错误态，「规划中」永远显示不出来）
 *
 * 谁要是按直觉「纠正」回去，这里的断言会红。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'

import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import ChapterPage from '../components/ChapterPage.vue'

const read = (path) => JSON.parse(readFileSync(path, 'utf8'))

const index = read('public/data/knowledge/index.json')
const chapter02 = read('public/data/knowledge/chapter-02.json')
const chapter15 = read('public/data/knowledge/chapter-15.json')

/** 索引里某一章的信息 */
const chapterOf = (id) => index.chapters.find((c) => c.id === id)

/** 实际请求过的 URL：用来断言「不该请求的数据分片确实没请求」 */
const calls = []

/** 索引里随便挑一个还没收录的章——收录范围变了这条也不会失效 */
const planningChapter = index.chapters.find((c) => !c.hasContent)

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/course', name: 'Course', component: { template: '<p>课程地图</p>' } },
      { path: '/course/:chapterId', name: 'Chapter', component: ChapterPage },
      { path: '/lesson/:lessonId', name: 'Lesson', component: { template: '<p>知识点</p>' } },
    ],
  })

const mountChapter = async (chapterId) => {
  const router = makeRouter()
  await router.push(`/course/${chapterId}`)
  await router.isReady()
  const wrapper = mount(ChapterPage, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

beforeEach(() => {
  calls.length = 0
  vi.stubGlobal('fetch', async (url) => {
    calls.push(url)
    if (url === '/data/knowledge/index.json') return { ok: true, json: async () => index }
    const file = url.split('/').pop()
    return { ok: true, json: async () => read(`public/data/knowledge/${file}`) }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('章节页', () => {
  it('标题是「第 N 章 · 课程索引里的章名」，不与章号重复', async () => {
    const { wrapper } = await mountChapter(2)

    expect(wrapper.find('h1').text()).toBe(`第 2 章 · ${chapterOf(2).title}`)
    expect(wrapper.findAll('.learn-item')).toHaveLength(chapter02.lessons.length)
  })

  it('还没收录的章显示规划中，并且不去请求该章的数据分片', async () => {
    const { wrapper } = await mountChapter(planningChapter.id)

    expect(wrapper.text()).toContain('这一章还在规划中。')
    const shard = `/data/knowledge/chapter-${String(planningChapter.id).padStart(2, '0')}.json`
    expect(calls).not.toContain(shard)
  })

  it('索引里没有的章号说「没有这一章」，不说「规划中」', async () => {
    const { wrapper } = await mountChapter(99)

    expect(wrapper.text()).toContain('没有这一章。')
    expect(wrapper.text()).not.toContain('这一章还在规划中。')
    expect(calls).not.toContain('/data/knowledge/chapter-99.json')
  })

  it('换章号时列表跟着换（路由只变参数会复用组件实例）', async () => {
    const { wrapper, router } = await mountChapter(2)
    expect(wrapper.find('h1').text()).toContain('第 2 章')
    expect(wrapper.findAll('.learn-item')).toHaveLength(chapter02.lessons.length)

    await router.push('/course/15')
    await flushPromises()
    await flushPromises()

    // 章号、章名、列表条目都要换成第 15 章的，不能停在第 2 章
    expect(wrapper.find('h1').text()).toBe(`第 15 章 · ${chapterOf(15).title}`)
    expect(wrapper.findAll('.learn-item')).toHaveLength(chapter15.lessons.length)
    expect(calls).toContain('/data/knowledge/chapter-15.json')
  })
})
