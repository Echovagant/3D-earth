// @vitest-environment jsdom
/**
 * 国家详情页的回归守卫。
 *
 * `/country/:iso3` 在路由表里是**一条路由记录**，vue-router 只换参数时
 * **复用同一个组件实例**，不会重新挂载 —— `onMounted` 只跑一次。
 * 不盯着 iso3 的话，URL 已经变成另一个国家，页面还停在上一个国家的数据。
 *
 * 这是 P1 教学层改造中在知识点页踩过的同一个坑（当时是 Critical：
 * 掌握度会写到错误的小节 id）。这里把国家页也钉住。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'

import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import CountryPage from '../components/CountryPage.vue'

const geoJson = JSON.parse(readFileSync('public/geojson/world-countries.json', 'utf8'))

const nameOf = (iso3) =>
  geoJson.features.find((f) => f.properties.iso3 === iso3)?.properties.name ?? iso3

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/world', name: 'World', component: { template: '<p>全球</p>' } },
      { path: '/country/:iso3', name: 'Country', component: CountryPage },
      { path: '/licenses', name: 'Licenses', component: { template: '<p>许可</p>' } },
    ],
  })

const mountCountry = async (iso3) => {
  const router = makeRouter()
  await router.push(`/country/${iso3}`)
  await router.isReady()
  const wrapper = mount(CountryPage, { global: { plugins: [router] } })
  await flushPromises()
  await flushPromises()
  return { wrapper, router }
}

beforeEach(() => {
  vi.stubGlobal('fetch', async (url) => {
    if (url === '/geojson/world-countries.json') return { ok: true, json: async () => geoJson }
    return { ok: false, status: 404, json: async () => ({}) }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('国家详情页', () => {
  it('显示 URL 里那个国家', async () => {
    const { wrapper } = await mountCountry('USA')

    expect(wrapper.find('h1').text()).toBe(nameOf('USA'))
  })

  it('换国家代码时内容跟着换（路由只变参数会复用组件实例）', async () => {
    const { wrapper, router } = await mountCountry('USA')
    expect(wrapper.find('h1').text()).toBe(nameOf('USA'))

    await router.push('/country/FRA')
    await flushPromises()
    await flushPromises()

    // 国家名、代码都要换成法国，不能停在上一��
    expect(wrapper.find('h1').text()).toBe(nameOf('FRA'))
    expect(wrapper.text()).toContain('FRA')
    expect(wrapper.text()).not.toContain(nameOf('USA'))
  })
})
