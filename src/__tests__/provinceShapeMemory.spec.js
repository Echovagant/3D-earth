// @vitest-environment jsdom
/**
 * 「34 省轮廓形象记忆法」的回归守卫。
 *
 * 这一块有三处容易出错的点，这里锁住：
 *   ① 文案表必须覆盖全部 34 个 6 位 adcode 的省，少一个列表就会空一项；
 *      多一个（比如南海断续线 100000_JD）就会把非省级的要素混进来
 *   ② 每个 adcode 都得在 public/geojson/china-provinces.json 里找得到对应要素，
 *      对不上就是「有比喻、没轮廓」
 *   ③ 比喻是一句话，不能写长——超过 40 字在列表里就压版了
 *
 * 谁要是按直觉「少写几条也没关系」，这里的断言会红。
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'

import { mount, flushPromises } from '@vue/test-utils'

import ProvinceShapeMemory from '../components/ProvinceShapeMemory.vue'
import { PROVINCE_SHAPE_MEMORIES, SHAPE_MEMORY_ADCODES } from '../data/provinceShapeMemory.js'

const read = (path) => JSON.parse(readFileSync(path, 'utf8'))

const geoJson = read('public/geojson/china-provinces.json')
const provinceIndex = read('public/data/provinces/index.json')

/** 省界数据里 6 位 adcode 的省级行政区 */
const geoAdcodes = geoJson.features
  .map((feature) => String(feature.properties.adcode))
  .filter((adcode) => /^\d{6}$/.test(adcode))
  .sort()

/** 索引里的 34 个省 */
const indexAdcodes = Object.keys(provinceIndex.provinces).sort()

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('形象记忆文案', () => {
  it('覆盖全部 34 个省级行政区，且与省界数据、索引三方一致', () => {
    expect(geoAdcodes).toHaveLength(34)
    expect(SHAPE_MEMORY_ADCODES).toEqual(geoAdcodes)
    expect(indexAdcodes).toEqual(geoAdcodes)
    expect(Object.keys(PROVINCE_SHAPE_MEMORIES).sort()).toEqual(geoAdcodes)
  })

  it('每个 adcode 都能在省界数据里找到对应要素，名称也对得上', () => {
    for (const adcode of geoAdcodes) {
      const feature = geoJson.features.find((item) => String(item.properties.adcode) === adcode)
      expect(feature, `${adcode} 在 china-provinces.json 里没有对应要素`).toBeDefined()
      expect(feature.properties.name).toBe(provinceIndex.provinces[adcode].name)
      expect(PROVINCE_SHAPE_MEMORIES[adcode].name).toBe(provinceIndex.provinces[adcode].name)
    }
  })

  it('每条比喻都非空、且不超过 40 字', () => {
    for (const [adcode, memory] of Object.entries(PROVINCE_SHAPE_MEMORIES)) {
      expect(typeof memory.analogy, `${adcode} 的 analogy 不是字符串`).toBe('string')
      expect(memory.analogy.length, `${adcode} 的比喻是空的`).toBeGreaterThan(0)
      expect(memory.analogy.length, `${adcode} 的比喻超过 40 字`).toBeLessThanOrEqual(40)
      expect(memory.hint.length, `${adcode} 没有记忆抓手`).toBeGreaterThan(0)
    }
  })

  it('南海断续线不是省级行政区，不进文案表', () => {
    expect(PROVINCE_SHAPE_MEMORIES['100000_JD']).toBeUndefined()
    expect(SHAPE_MEMORY_ADCODES).not.toContain('100000_JD')
  })
})

describe('轮廓记忆组件', () => {
  it('列出 34 个省，并画出选中省的真实轮廓', async () => {
    const wrapper = mount(ProvinceShapeMemory, {
      props: { geoJson, provinceIndex },
    })
    await flushPromises()

    expect(wrapper.findAll('.psm__item')).toHaveLength(34)
    expect(wrapper.text()).toContain(PROVINCE_SHAPE_MEMORIES['110000'].analogy)

    const shape = wrapper.find('svg.psm__shape')
    expect(shape.exists()).toBe(true)
    expect(wrapper.findAll('path.psm__path').length).toBeGreaterThan(0)
    // 只描边：路径不填色，洞不会被盖成实心
    expect(wrapper.find('path.psm__path').attributes('fill')).toBe('none')

    const viewBox = shape.attributes('viewBox').split(' ').map(Number)
    expect(viewBox.every((value) => Number.isFinite(value))).toBe(true)
    expect(viewBox[2]).toBeGreaterThan(0)
    expect(viewBox[3]).toBeGreaterThan(0)
  })

  it('切换省份时比喻与轮廓一起换', async () => {
    const wrapper = mount(ProvinceShapeMemory, {
      props: { geoJson, provinceIndex },
    })
    await flushPromises()

    const zhejiang = wrapper.findAll('.psm__item').find((item) => item.text().includes('浙江省'))
    expect(zhejiang).toBeDefined()
    await zhejiang.trigger('click')

    expect(wrapper.text()).toContain(PROVINCE_SHAPE_MEMORIES['330000'].analogy)
    expect(wrapper.text()).not.toContain(PROVINCE_SHAPE_MEMORIES['110000'].analogy)
    // 浙江是多面（大片陆地 + 沿海岛屿），要拆开逐个画
    expect(wrapper.findAll('path.psm__path').length).toBeGreaterThan(1)
  })

  it('列表里不出现南海断续线', async () => {
    const wrapper = mount(ProvinceShapeMemory, {
      props: { geoJson, provinceIndex },
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('100000_JD')
  })

  it('投影是北在上：纬度最高的点画在最上面', async () => {
    const wrapper = mount(ProvinceShapeMemory, {
      props: { geoJson, provinceIndex },
    })
    await flushPromises()

    const d = wrapper.find('path.psm__path').attributes('d')
    const coords = [...d.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])])
    const ys = coords.map((point) => point[1])

    // 组件里的等距圆柱投影：x 与经度成正比，y 与纬度成反比
    const scale = 1000 / (135 - 73)
    const feature = geoJson.features.find((item) => String(item.properties.adcode) === '110000')
    let maxLat = -Infinity
    let minLat = Infinity
    for (const polygon of feature.geometry.coordinates) {
      for (const ring of polygon) {
        for (const position of ring) {
          if (position[1] > maxLat) maxLat = position[1]
          if (position[1] < minLat) minLat = position[1]
        }
      }
    }

    expect(Math.min(...ys)).toBeCloseTo((54 - maxLat) * scale, 1)
    expect(Math.max(...ys)).toBeCloseTo((54 - minLat) * scale, 1)
  })

  it('数据加载失败时给出明确状态', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 404, json: async () => ({}) }))

    const wrapper = mount(ProvinceShapeMemory)
    await flushPromises()

    expect(wrapper.find('.psm__state').exists()).toBe(true)
    expect(wrapper.text()).toContain('无法加载省界数据')
  })
})
