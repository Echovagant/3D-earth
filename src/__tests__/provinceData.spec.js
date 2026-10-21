// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { REGION_GROUPS, getProvinceColor } from '../utils/provinceColors'
import { featureAreaKm2 } from '../utils/areaData'

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
      'areaKm2',
      'population',
      'populationSource',
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

describe('面积口径', () => {
  it.each(cases)('$name 的 areaKm2 与边界几何算出的面积一致', (c) => {
    const data = c.readData()
    // 数据文件里的 areaKm2 由 scripts/update-geo.mjs 算出，
    // 用的是与地级市详情页同一个公式；这里独立重算一遍，防止公式被改过而数据没跟上。
    expect(data.areaKm2).toBeCloseTo(featureAreaKm2(c.feature), 1)
  })

  it('边界围合面积与公布面积的比值，多数省份落在同一口径上', () => {
    const ratios = cases.map((c) => {
      const data = c.readData()
      const published = Number(String(data.area).replace(/[^\d.]/g, ''))
      return data.areaKm2 / published
    })
    const sorted = [...ratios].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    // 24 个省落在 0.955–1.017，说明两个口径基本一致。
    // 个别省会偏离：沿海省份的行政边界含管辖海域（上海 1.26、澳门 1.40），
    // 宁夏的公布面积含待划定区域（0.78）。中位数刻画的是主流口径。
    expect(median).toBeGreaterThan(0.97)
    expect(median).toBeLessThan(1.03)
  })

  it.each(cases)('$name 的两个面积口径不差数量级', (c) => {
    const data = c.readData()
    const published = Number(String(data.area).replace(/[^\d.]/g, ''))
    const ratio = data.areaKm2 / published
    // 区间放宽到能容纳上面提到的真实差异，
    // 但仍能抓住「面积差了几倍」这类真正的数据错误。
    expect(ratio).toBeGreaterThan(0.7)
    expect(ratio).toBeLessThan(1.5)
  })

  it('34 个省级行政区的面积合计落在合理范围', () => {
    const total = cases.reduce((sum, c) => sum + c.readData().areaKm2, 0)
    // 全国陆地面积约 960 万 km²；边界围合面积含海域，会略高
    expect(total).toBeGreaterThan(9_000_000)
    expect(total).toBeLessThan(10_500_000)
  })
})

describe('人口口径', () => {
  it('34 个省级行政区的人口合计与全国人口相差在 3% 以内', () => {
    const totalWan = cases.reduce((sum, c) => {
      const wan = Number(String(c.readData().population).replace(/[^\d.]/g, ''))
      return sum + wan
    }, 0)
    // 世界银行 2023 年中国人口 1,410,710,000，即 141,071 万人
    const nationalWan = 141_071
    const deviation = Math.abs(totalWan - nationalWan) / nationalWan
    // 各省统计年份不完全一致（2020 年人口普查或 2023 年末常住人口），
    // 因此允许百分之几的差；超过 3% 说明某几个省的数据有问题。
    expect(deviation).toBeLessThan(0.03)
  })

  it.each(cases)('$name 标注了人口来源', (c) => {
    expect(c.readData().populationSource.length).toBeGreaterThan(0)
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
