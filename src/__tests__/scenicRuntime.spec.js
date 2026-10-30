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
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import ScenicCard from '../components/ScenicCard.vue'
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
