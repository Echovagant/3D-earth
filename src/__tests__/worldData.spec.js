// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  countryId,
  countryName,
  countryPopulation,
  populationYear,
  countryContinent,
  countryRegion,
  countryColor,
  countryColorCss,
  featureCenter,
  formatPopulation,
} from '../utils/worldData'
import { featureAreaKm2 } from '../utils/areaData'

const repoRoot = new URL('../../', import.meta.url)
const geo = JSON.parse(
  readFileSync(fileURLToPath(new URL('public/geojson/world-countries.json', repoRoot)), 'utf-8'),
)
const features = geo.features

describe('世界国界数据', () => {
  it('是合法 FeatureCollection，含 177 个国家', () => {
    expect(geo.type).toBe('FeatureCollection')
    expect(features).toHaveLength(177)
  })

  it('每个国家都有中文名、ISO 代码与可用的几何', () => {
    for (const feature of features) {
      expect(typeof feature.properties.NAME_ZH).toBe('string')
      expect(feature.properties.NAME_ZH.length).toBeGreaterThan(0)
      expect(countryId(feature).length).toBeGreaterThan(0)
      expect(['Polygon', 'MultiPolygon']).toContain(feature.geometry.type)
      expect(featureAreaKm2(feature)).toBeGreaterThan(0)
    }
  })

  it('包含中国、美国、俄罗斯等主要国家且中文名正确', () => {
    const byIso = new Map(features.map((f) => [countryId(f), countryName(f)]))
    expect(byIso.get('CHN')).toBe('中华人民共和国')
    expect(byIso.get('USA')).toBe('美国')
    expect(byIso.get('RUS')).toBe('俄罗斯')
    expect(byIso.get('BRA')).toBe('巴西')
  })

  it('标识唯一', () => {
    const ids = features.map((f) => countryId(f))
    expect(ids.length).toBe(new Set(ids).size)
  })
})

describe('countryId', () => {
  it('ISO_A3 为 -99（无 ISO 代码）时退回 ADM0_A3', () => {
    const feature = { properties: { ISO_A3: '-99', ADM0_A3: 'ATA' } }
    expect(countryId(feature)).toBe('ATA')
  })

  it('有 ISO 代码时直接用它', () => {
    expect(countryId({ properties: { ISO_A3: 'CHN', ADM0_A3: 'CH1' } })).toBe('CHN')
  })
})

describe('featureCenter', () => {
  it('中国落在东部半球', () => {
    const china = features.find((f) => countryId(f) === 'CHN')
    const center = featureCenter(china)
    expect(center).not.toBeNull()
    expect(center[0]).toBeGreaterThan(70)
    expect(center[0]).toBeLessThan(140)
    expect(center[1]).toBeGreaterThan(15)
    expect(center[1]).toBeLessThan(55)
  })

  it('横跨 180° 经线的国家不会算出跑到太平洋的经度', () => {
    const russia = features.find((f) => countryId(f) === 'RUS')
    const center = featureCenter(russia)
    expect(center).not.toBeNull()
    // 用球面质心算，经度应落在俄罗斯本土所在的东半球，而不是平均经度的 0 附近
    expect(Math.abs(center[0])).toBeGreaterThan(20)
  })

  it('没有几何时返回 null', () => {
    expect(featureCenter({ geometry: null })).toBeNull()
  })
})

describe('countryColor', () => {
  it('同一标识每次得到同一个颜色', () => {
    expect(countryColor('CHN')).toBe(countryColor('CHN'))
  })

  it('返回 0xRRGGBB 数值——three.js 的 Color 不认 0x 开头的字符串', () => {
    const color = countryColor('CHN')
    expect(typeof color).toBe('number')
    expect(color).toBeGreaterThanOrEqual(0)
    expect(color).toBeLessThanOrEqual(0xffffff)
  })

  it('CSS 形式是 6 位十六进制', () => {
    expect(countryColorCss('CHN')).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('不同国家的颜色不同', () => {
    expect(countryColor('CHN')).not.toBe(countryColor('USA'))
  })
})

describe('formatPopulation', () => {
  it('按量级选单位', () => {
    expect(formatPopulation(1_406_710_000)).toBe('14.07 亿')
    expect(formatPopulation(32_670_000)).toBe('3267.0 万')
    expect(formatPopulation(800)).toBe('800')
  })

  it('非法值显示占位符', () => {
    expect(formatPopulation(0)).toBe('—')
    expect(formatPopulation(null)).toBe('—')
    expect(formatPopulation(NaN)).toBe('—')
  })
})

describe('要素元信息', () => {
  it('取人口、年份、大洲与地区', () => {
    const china = features.find((f) => countryId(f) === 'CHN')
    expect(countryPopulation(china)).toBeGreaterThan(1e9)
    expect(populationYear(china)).toBeGreaterThan(2000)
    expect(countryContinent(china)).toBe('Asia')
    expect(countryRegion(china)).toBe('Asia')
  })

  it('缺失时返回空值', () => {
    const empty = { properties: {} }
    expect(countryPopulation(empty)).toBeNull()
    expect(populationYear(empty)).toBeNull()
    expect(countryContinent(empty)).toBe('')
    expect(countryRegion(empty)).toBe('')
  })
})
