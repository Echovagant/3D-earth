// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  countryId,
  countryName,
  countryFullName,
  countryNameEn,
  countryIso2,
  countryContinent,
  countryRegion,
  regionColor,
  regionColorCss,
  featureCenter,
} from '../utils/worldData'
import { featureAreaKm2 } from '../utils/areaData'

const repoRoot = new URL('../../', import.meta.url)
const geo = JSON.parse(
  readFileSync(fileURLToPath(new URL('public/geojson/world-countries.json', repoRoot)), 'utf-8'),
)
const features = geo.features

describe('世界国界数据', () => {
  it('是合法 FeatureCollection，含 239 个国家/地区', () => {
    expect(geo.type).toBe('FeatureCollection')
    expect(features).toHaveLength(239)
  })

  it('每个国家都有中文名、ISO 代码与可用的几何', () => {
    for (const feature of features) {
      expect(typeof feature.properties.name).toBe('string')
      expect(feature.properties.name.length).toBeGreaterThan(0)
      expect(feature.properties.nameEn.length).toBeGreaterThan(0)
      expect(feature.properties.region.length).toBeGreaterThan(0)
      expect(countryId(feature).length).toBeGreaterThan(0)
      expect(['Polygon', 'MultiPolygon']).toContain(feature.geometry.type)
      expect(featureAreaKm2(feature)).toBeGreaterThan(0)
    }
  })

  it('包含中国、美国、俄罗斯等主要国家且中文名正确', () => {
    const byIso = new Map(features.map((f) => [countryId(f), countryName(f)]))
    expect(byIso.get('CHN')).toBe('中国')
    expect(byIso.get('USA')).toBe('美国')
    expect(byIso.get('RUS')).toBe('俄罗斯')
    expect(byIso.get('BRA')).toBe('巴西')
  })

  it('中文名是简体（不含繁体字形）', () => {
    // 繁体国名混进来会让球面标注与详情页标题风格不一致
    const traditional = /[國區灣東亞歐體臺號萬億與産學屬領蘭島華來個會們時對從]/
    for (const feature of features) {
      expect(traditional.test(feature.properties.name)).toBe(false)
    }
  })

  it('标识唯一', () => {
    const ids = features.map((f) => countryId(f))
    expect(ids.length).toBe(new Set(ids).size)
  })

  it('全称是官方名称，简称与全称不同时才需要单列', () => {
    const china = features.find((f) => countryId(f) === 'CHN')
    expect(countryFullName(china)).toBe('中华人民共和国')
    expect(countryName(china)).toBe('中国')
    expect(countryNameEn(china)).toBe('China')
    expect(countryIso2(china)).toBe('CN')
  })
})

describe('countryId', () => {
  it('用 ISO 3166-1 alpha-3 代码', () => {
    expect(countryId({ properties: { iso3: 'CHN' } })).toBe('CHN')
  })

  it('没有标识时返回空字符串', () => {
    expect(countryId({ properties: {} })).toBe('')
    expect(countryId(null)).toBe('')
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

describe('分区配色', () => {
  it('返回 0xRRGGBB 数值——three.js 的 Color 不认 0x 开头的字符串', () => {
    const color = regionColor(features.find((f) => countryId(f) === 'CHN'))
    expect(typeof color).toBe('number')
    expect(color).toBeGreaterThanOrEqual(0)
    expect(color).toBeLessThanOrEqual(0xffffff)
  })

  it('CSS 形式是 6 位十六进制', () => {
    expect(regionColorCss(features.find((f) => countryId(f) === 'CHN'))).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('同一个要素每次得到同一个颜色', () => {
    const china = features.find((f) => countryId(f) === 'CHN')
    expect(regionColor(china)).toBe(regionColor(china))
  })

  it('同一次区域的国家颜色相同，不同区域不同', () => {
    const byName = (name) => features.find((f) => countryName(f) === name)
    // 东亚：中日韩
    expect(regionColor(byName('日本'))).toBe(regionColor(byName('韩国')))
    // 欧洲与亚洲不同区
    expect(regionColor(byName('德国'))).not.toBe(regionColor(byName('中国')))
  })

  it('次区域缺失时退回大洲配色，而不是落到默认色', () => {
    // 南极洲没有次区域划分，仍应拿到极地色相
    const antarctica = features.find((f) => countryName(f) === '南极洲')
    expect(antarctica).toBeTruthy()
    expect(countryRegion(antarctica)).toBe('')
    expect(countryContinent(antarctica)).toBe('Antarctic')
    expect(regionColor(antarctica)).not.toBe(regionColor(features.find((f) => countryName(f) === '中国')))
  })
})

describe('要素元信息', () => {
  it('取大洲与次区域', () => {
    const china = features.find((f) => countryId(f) === 'CHN')
    expect(countryContinent(china)).toBe('Asia')
    expect(countryRegion(china)).toBe('Eastern Asia')
  })

  it('缺失时返回空值', () => {
    const empty = { properties: {} }
    expect(countryContinent(empty)).toBe('')
    expect(countryRegion(empty)).toBe('')
    expect(countryName(empty)).toBe('')
    expect(countryFullName(empty)).toBe('')
    expect(countryNameEn(empty)).toBe('')
    expect(countryIso2(empty)).toBe('')
  })
})
