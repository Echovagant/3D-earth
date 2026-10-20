// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { REGION_GROUPS, getProvinceColor } from '../utils/provinceColors'

const repoRoot = new URL('../../', import.meta.url)
const geo = JSON.parse(
  readFileSync(fileURLToPath(new URL('public/geojson/china-provinces.json', repoRoot)), 'utf-8'),
)
const dataDirUrl = new URL('public/data/provinces/', repoRoot)

/** 6 位数字 adcode 的省级行政区；九段线（100000_JD）等非省级要素不算 */
const provinceFeatures = geo.features.filter((f) => /^\d{6}$/.test(String(f.properties.adcode)))
const provinceAdcodes = provinceFeatures.map((f) => String(f.properties.adcode))

const dataAdcodes = readdirSync(fileURLToPath(dataDirUrl))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))

// 逐个要素的用例。数据文件在测试体内惰性读取：若在模块加载期就全部读进来，
// 少一个文件会让整个 suite 崩在收集阶段，把「一一对应」这条本该清晰报错的
// 断言一起吃掉。
const cases = provinceAdcodes.map((adcode) => {
  const feature = provinceFeatures.find((f) => String(f.properties.adcode) === adcode)
  return {
    adcode,
    name: feature.properties.name,
    feature,
    readData: () =>
      JSON.parse(readFileSync(fileURLToPath(new URL(`${adcode}.json`, dataDirUrl)), 'utf-8')),
  }
})

describe('省份详情数据', () => {
  it('每个省级行政区恰好有一个数据文件，且没有多余文件', () => {
    expect([...dataAdcodes].sort()).toEqual([...provinceAdcodes].sort())
  })

  it('不为九段线等非省级要素生成数据文件', () => {
    expect(dataAdcodes).not.toContain('100000_JD')
  })

  it.each(cases)('$name 的 adcode / name / center 与 GeoJSON 严格一致', (c) => {
    const data = c.readData()
    expect(data.adcode).toBe(c.adcode)
    expect(data.name).toBe(c.feature.properties.name)
    expect(data.center).toEqual(c.feature.properties.center)
  })

  it.each(cases)('$name 的字段结构完整', (c) => {
    const data = c.readData()
    for (const key of [
      'adcode',
      'name',
      'abbreviation',
      'capital',
      'area',
      'population',
      'center',
      'highlights',
      'intro',
    ]) {
      expect(data).toHaveProperty(key)
    }
    expect(data.center).toHaveLength(2)
    expect(data.center.every((n) => typeof n === 'number' && Number.isFinite(n))).toBe(true)
    expect(data.highlights).toHaveLength(3)
    expect(data.abbreviation.length).toBeGreaterThan(0)
    expect(data.capital.length).toBeGreaterThan(0)
    expect(data.area).toMatch(/[\d.]/)
    expect(data.population).toMatch(/[\d.]/)
    expect(data.intro.length).toBeGreaterThan(10)
  })
})

describe('图例分区与配色', () => {
  it('地理分区恰好覆盖全部省级行政区且互不重叠', () => {
    const fromGroups = REGION_GROUPS.flatMap((group) => group.adcodes)
    expect(fromGroups.length).toBe(new Set(fromGroups).size)
    expect([...fromGroups].sort()).toEqual([...provinceAdcodes].sort())
  })

  it('每个省级行政区都有专属配色，不会落到兜底色', () => {
    const fallback = getProvinceColor('999999')
    for (const adcode of provinceAdcodes) {
      expect(getProvinceColor(adcode)).not.toBe(fallback)
    }
  })

  it('九段线使用中性色，不与省级配色混淆', () => {
    expect(getProvinceColor('100000_JD')).not.toBe(getProvinceColor('999999'))
  })
})
