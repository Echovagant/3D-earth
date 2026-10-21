// @vitest-environment node
// 同步脚本的回归测试。脚本本身在 scripts/ 下（不在 src/），这里直接 import 过来。
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { citySyncTargets, formatJson } from '../../scripts/update-geo.mjs'

const repoRoot = new URL('../../', import.meta.url)
const provincesDir = fileURLToPath(new URL('public/data/provinces/', repoRoot))

describe('citySyncTargets', () => {
  it('排除由 update-tw.mjs 负责的台湾省', () => {
    // 台湾省在 DataV 没有下辖区县数据，拉取会 404；
    // 不排除的话整个同步会因为这一个 404 中止。
    expect(citySyncTargets(['710000'])).toEqual([])
  })

  it('保留其它省', () => {
    expect(citySyncTargets(['440000', '510000'])).toEqual(['440000', '510000'])
  })

  it('对真实的 34 个省，只跳过台湾省', () => {
    const geo = JSON.parse(
      readFileSync(fileURLToPath(new URL('public/geojson/china-provinces.json', repoRoot)), 'utf-8'),
    )
    const adcodes = geo.features
      .map((f) => String(f.properties.adcode))
      .filter((code) => /^\d{6}$/.test(code))
    expect(adcodes).toHaveLength(34)
    expect(adcodes).toContain('710000')
    expect(citySyncTargets(adcodes)).toHaveLength(33)
    expect(citySyncTargets(adcodes)).not.toContain('710000')
  })
})

describe('formatJson', () => {
  it('对现存的省份数据文件是幂等的', () => {
    const files = readdirSync(provincesDir).filter((f) => f.endsWith('.json'))
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      const raw = readFileSync(`${provincesDir}/${file}`, 'utf-8')
      expect(formatJson(JSON.parse(raw))).toBe(raw)
    }
  })

  it('只含基本值的数组压在一行', () => {
    const text = formatJson({ a: 1, list: [1, 2], nested: { b: 'x' } })
    expect(text).toContain('[1, 2]')
    expect(text.endsWith('\n')).toBe(true)
  })
})
