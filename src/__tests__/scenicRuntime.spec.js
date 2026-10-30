// @vitest-environment jsdom
/**
 * 景区模块运行时部分的回归测试：数据访问层与卡片。
 *
 * 与 scenic.spec.js（node 环境的契约测试）分开：那边被测的校验脚本
 * 依赖 import.meta.url 推仓库根，jsdom 下会炸；这边要挂载组件，必须 jsdom。
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import ScenicCard from '../components/ScenicCard.vue'
import ScenicGallery from '../components/ScenicGallery.vue'
import ScenicPage from '../components/ScenicPage.vue'
import {
  scenicImagePath,
  provinceAdcodes,
  loadScenicByProvince,
  findScenic,
  pickRandomScenic,
  clearScenicCache,
} from '../utils/scenic.js'

/** 读仓库里真实的公开数据文件，测试不去复制一份数据出来 */
const readData = (path) => JSON.parse(readFileSync(join('public/data', path), 'utf8'))
const provinceIndex = readData('provinces/index.json')
const beijingList = readData('scenic/110000.json')
const sichuanList = readData('scenic/510000.json')

/** 有清单的省返回真实清单，其余按「暂无景区」返回 404 */
const stubScenicFetch = () =>
  vi.stubGlobal('fetch', async (url) => {
    if (typeof url !== 'string') throw new Error(`未预期的请求：${String(url)}`)
    if (url.endsWith('/data/provinces/index.json')) {
      return { ok: true, json: async () => provinceIndex }
    }
    const scenic = url.match(/\/data\/scenic\/(\d{6})\.json$/)
    if (scenic) {
      const adcode = scenic[1]
      if (adcode === '110000') return { ok: true, json: async () => beijingList }
      if (adcode === '510000') return { ok: true, json: async () => sichuanList }
      return { ok: false, status: 404 }
    }
    throw new Error(`未预期的请求：${url}`)
  })

describe('景区数据访问层', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    clearScenicCache()
  })

  it('图片路径拼在 /data/scenic/images/ 下', () => {
    expect(scenicImagePath('a.jpg')).toBe('/data/scenic/images/a.jpg')
  })

  it('省份列表来自索引文件，是 34 个六位码', async () => {
    stubScenicFetch()
    const codes = await provinceAdcodes()
    expect(codes).toHaveLength(34)
    expect(codes.every((code) => /^\d{6}$/.test(code))).toBe(true)
  })

  it('取某省的景区清单', async () => {
    stubScenicFetch()
    const list = await loadScenicByProvince('510000')
    expect(list.map((s) => s.id)).toEqual(sichuanList.scenics.map((s) => s.id))
  })

  it('没有清单的省返回空数组，不当成错误', async () => {
    stubScenicFetch()
    await expect(loadScenicByProvince('999999')).resolves.toEqual([])
  })

  it('服务器把不存在的路径回退成首页（200 + HTML）时按「没有清单」处理', async () => {
    // 静态站点服务器对缺失的文件会回退到 index.html，
    // 那份 HTML 解析成 JSON 会抛错，把整批查询带崩
    vi.stubGlobal('fetch', async (url) => {
      if (String(url).endsWith('/data/provinces/index.json')) {
        return { ok: true, json: async () => provinceIndex }
      }
      if (String(url).includes('/data/scenic/999999.json')) {
        return { ok: true, json: async () => JSON.parse('<!DOCTYPE html><html></html>') }
      }
      throw new Error(`未预期的请求：${url}`)
    })
    await expect(loadScenicByProvince('999999')).resolves.toEqual([])
  })

  it('按 id 找景区，找不到给 null', async () => {
    stubScenicFetch()
    const found = await findScenic('510000', sichuanList.scenics[0].id)
    expect(found?.id).toBe(sichuanList.scenics[0].id)
    await expect(findScenic('510000', 'no-such-id')).resolves.toBeNull()
  })

  it('全国随机：绝大多数省还没有清单时也能随机到有数据的省', async () => {
    stubScenicFetch()
    for (let i = 0; i < 8; i += 1) {
      const picked = await pickRandomScenic()
      const allIds = [...beijingList.scenics, ...sichuanList.scenics].map((s) => s.id)
      expect(['110000', '510000']).toContain(picked.adcode)
      expect(allIds).toContain(picked.scenic.id)
    }
  })
})

/** 卡片是 router-link，要挂在一个带 /scenic 路由的内存路由器上 */
const mountCard = (scenic, adcode = '510000') => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/scenic/:adcode/:id', name: 'Scenic', component: { template: '<p>详情</p>' } },
    ],
  })
  return mount(ScenicCard, { props: { scenic, adcode }, global: { plugins: [router] } })
}

const oneScenic = {
  id: 'jiuzhaigou',
  name: '九寨沟',
  level: '5A',
  summary: '彩池水漫山谷。',
  highlights: ['彩池水漫山谷'],
  coords: [33.26, 103.92],
  images: [
    { file: 'a.jpg', sourceUrl: 'https://commons.wikimedia.org/wiki/File:A.jpg', license: 'CC0-1.0', author: 'X' },
  ],
}

describe('景区卡片', () => {
  it('有图时显示图片、名称、等级与一句话', () => {
    const wrapper = mountCard(oneScenic)
    expect(wrapper.find('img').attributes('src')).toBe(scenicImagePath('a.jpg'))
    expect(wrapper.text()).toContain('九寨沟')
    expect(wrapper.text()).toContain('5A')
  })

  it('没图时给占位，不出破图', () => {
    const wrapper = mountCard({ ...oneScenic, images: [] })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.scenic-card__placeholder').exists()).toBe(true)
  })

  it('整卡指向景区详情页', () => {
    const wrapper = mountCard(oneScenic)
    expect(wrapper.find('a').attributes('href')).toBe('/scenic/510000/jiuzhaigou')
  })
})

const galleryImages = [
  { file: 'a.jpg', sourceUrl: 'https://commons.wikimedia.org/wiki/File:A.jpg', license: 'CC0-1.0', author: 'X' },
  { file: 'b.jpg', sourceUrl: 'https://commons.wikimedia.org/wiki/File:B.jpg', license: 'CC0-1.0', author: 'Y' },
]

const mountGallery = (images = galleryImages) =>
  mount(ScenicGallery, { props: { images, name: '九寨沟' }, attachTo: document.body })

describe('景区图廊', () => {
  it('默认显示第一张，缩略图条每张一个按钮', () => {
    const w = mountGallery()
    expect(w.find('.scenic-gallery__main img').attributes('src')).toContain('a.jpg')
    expect(w.findAll('.scenic-gallery__thumbs button')).toHaveLength(2)
  })

  it('点缩略图切到那张', async () => {
    const w = mountGallery()
    await w.findAll('.scenic-gallery__thumbs button')[1].trigger('click')
    expect(w.find('.scenic-gallery__main img').attributes('src')).toContain('b.jpg')
  })

  it('方向键切图', async () => {
    const w = mountGallery()
    await w.trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('.scenic-gallery__main img').attributes('src')).toContain('b.jpg')
    await w.trigger('keydown', { key: 'ArrowLeft' })
    expect(w.find('.scenic-gallery__main img').attributes('src')).toContain('a.jpg')
  })

  it('点主图开灯箱，Esc 关掉，焦点回到原图', async () => {
    const w = mountGallery()
    const opener = w.find('.scenic-gallery__main')
    await opener.trigger('click')
    expect(w.find('.scenic-lightbox').exists()).toBe(true)
    await w.find('.scenic-lightbox').trigger('keydown', { key: 'Escape' })
    expect(w.find('.scenic-lightbox').exists()).toBe(false)
    expect(document.activeElement).toBe(opener.element)
  })

  it('没有图时不渲染图廊', () => {
    const w = mount(ScenicGallery, { props: { images: [], name: '甲' } })
    expect(w.find('.scenic-gallery').exists()).toBe(false)
  })
})

/** 详情页要挂载路由（用 router-link 与 useRoute） */
const mountPage = async (adcode, id) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Earth', component: { template: '<p>地球</p>' } },
      { path: '/province/:adcode', name: 'Province', component: { template: '<p>省份</p>' } },
      { path: '/lesson/:lessonId', name: 'Lesson', component: { template: '<p>知识点</p>' } },
      { path: '/scenic/:adcode/:id', name: 'Scenic', component: ScenicPage, props: true },
    ],
  })
  await router.push(`/scenic/${adcode}/${id}`)
  await router.isReady()
  const wrapper = mount(ScenicPage, {
    props: { adcode, id },
    global: { plugins: [router], stubs: { ScenicGallery: true } },
  })
  await flushPromises()
  await flushPromises()
  return { wrapper, router }
}

/** 详情页要的数据：省清单、知识数据、省份索引 */
const stubPageFetch = () =>
  vi.stubGlobal('fetch', async (url) => {
    if (typeof url !== 'string') throw new Error(`未预期的请求：${String(url)}`)
    if (url.endsWith('/data/provinces/index.json')) {
      return { ok: true, json: async () => provinceIndex }
    }
    if (url.endsWith('/data/scenic/510000.json')) {
      return { ok: true, json: async () => sichuanList }
    }
    if (url.endsWith('/data/knowledge/index.json')) {
      return { ok: true, json: async () => readData('knowledge/index.json') }
    }
    if (url.startsWith('/data/knowledge/chapter-')) {
      const file = url.split('/').pop()
      return { ok: true, json: async () => readData(`knowledge/${file}`) }
    }
    if (url.startsWith('/data/provinces/')) {
      const file = url.split('/').pop()
      return { ok: true, json: async () => readData(`provinces/${file}`) }
    }
    throw new Error(`未预期的请求：${url}`)
  })

describe('景区详情页', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    clearScenicCache()
  })

  it('图廊、正文、看点、坐标、署名区块、本省知识点、下一个景点都在', async () => {
    stubPageFetch()
    const { wrapper } = await mountPage('510000', 'jiuzhaigou')
    const text = wrapper.text()
    expect(text).toContain('九寨沟')
    expect(text).toContain('图片来源与许可')
    expect(text).toContain('下一个景点')
  })

  it('「在地球上看看」指向地球页的定位参数', async () => {
    stubPageFetch()
    const { wrapper } = await mountPage('510000', 'jiuzhaigou')
    const link = wrapper.find('a[href^="/?at="]')
    expect(link.exists()).toBe(true)
    // 坐标顺序：纬度在前，经度在后
    expect(link.attributes('href')).toBe('/?at=33.26,103.92')
  })

  it('下一个景点是本省清单里的下一个，最后一个回到第一个', async () => {
    stubPageFetch()
    const first = sichuanList.scenics[0].id
    const second = sichuanList.scenics[1].id
    const last = sichuanList.scenics[sichuanList.scenics.length - 1].id

    const { wrapper } = await mountPage('510000', first)
    expect(wrapper.find('a[href^="/scenic/510000/"]').exists()).toBe(true)
    const nextHref = wrapper.findAll('a[href^="/scenic/510000/"]').map((n) => n.attributes('href'))
    expect(nextHref).toContain(`/scenic/510000/${second}`)

    const { wrapper: lastPage } = await mountPage('510000', last)
    const lastHrefs = lastPage.findAll('a[href^="/scenic/510000/"]').map((n) => n.attributes('href'))
    expect(lastHrefs).toContain(`/scenic/510000/${first}`)
  })

  it('取不到景区时给明确的空态，不是白屏', async () => {
    stubPageFetch()
    const { wrapper } = await mountPage('510000', 'no-such-scenic')
    expect(wrapper.text()).toContain('没有这个景点')
  })
})
