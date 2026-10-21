// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { featureAreaKm2 } from '../utils/areaData'

const repoRoot = new URL('../../', import.meta.url)
const citiesDirUrl = new URL('public/geojson/cities/', repoRoot)
const citiesDir = fileURLToPath(citiesDirUrl)

const files = readdirSync(citiesDir).filter((f) => f.endsWith('.json'))
const adcodes = files.map((f) => f.replace(/\.json$/, ''))

/** 逐个文件惰性读取：文件损坏时只让对应的用例失败，而不是整个 suite 崩在收集阶段 */
const cases = adcodes.map((adcode) => ({
  adcode,
  read: () => JSON.parse(readFileSync(fileURLToPath(new URL(`${adcode}.json`, citiesDirUrl)), 'utf-8')),
}))

describe('随仓库分发的地级市边界', () => {
  it('有 33 个省的文件（台湾省上游无数据，不在列）', () => {
    expect(adcodes).toHaveLength(33)
  })

  it.each(cases)('$adcode 的文件是合法 FeatureCollection', (c) => {
    const geo = c.read()
    expect(geo.type).toBe('FeatureCollection')
    expect(Array.isArray(geo.features)).toBe(true)
    expect(geo.features.length).toBeGreaterThan(0)
  })

  it.each(cases)('$adcode 里的每个要素都是同省的 6 位行政区划代码', (c) => {
    const geo = c.read()
    const provincePrefix = c.adcode.slice(0, 2)
    for (const feature of geo.features) {
      const featureAdcode = String(feature.properties.adcode)
      expect(featureAdcode).toMatch(/^\d{6}$/)
      expect(featureAdcode.slice(0, 2)).toBe(provincePrefix)
    }
  })

  it.each(cases)('$adcode 的每个要素都有可用的几何与面积', (c) => {
    const geo = c.read()
    for (const feature of geo.features) {
      expect(feature.geometry).toBeTruthy()
      expect(['Polygon', 'MultiPolygon']).toContain(feature.geometry.type)
      // 面积必须能算出来：公式对洞的处理出过 bug，这里逐个要素兜住
      expect(featureAreaKm2(feature)).toBeGreaterThan(0)
    }
  })

  it.each(cases)('$adcode 的要素名称非空', (c) => {
    const geo = c.read()
    for (const feature of geo.features) {
      expect(typeof feature.properties.name).toBe('string')
      expect(feature.properties.name.length).toBeGreaterThan(0)
    }
  })

  it('广东的 21 个地级市都在', () => {
    const geo = JSON.parse(
      readFileSync(fileURLToPath(new URL('440000.json', citiesDirUrl)), 'utf-8'),
    )
    expect(geo.features).toHaveLength(21)
    const names = geo.features.map((f) => f.properties.name)
    for (const city of ['广州市', '深圳市', '珠海市', '汕头市', '潮州市']) {
      expect(names).toContain(city)
    }
  })
})
