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

describe('数据源', () => {
  it('同步脚本只连国内可取的数据源', () => {
    // 境外托管（GitHub raw、jsDelivr、unpkg）在国内经常连不上，
    // 也不该成为构建链路的单点。卫星贴图是随仓库分发的，不走这里。
    const forbidden = [
      'raw.githubusercontent.com',
      'media.githubusercontent.com',
      'cdn.jsdelivr.net',
      'unpkg.com',
      'ghproxy',
      'geoboundaries',
      'natural-earth',
    ]
    for (const name of ['update-geo.mjs', 'update-world.mjs', 'update-tw.mjs']) {
      const text = readFileSync(fileURLToPath(new URL(`../../scripts/${name}`, import.meta.url)), 'utf-8')
      for (const host of forbidden) {
        expect(text, `${name} 引用了境外数据源 ${host}`).not.toContain(host)
      }
    }
  })

  it('运行时代码只请求仓库内的静态文件与国内接口', () => {
    const utils = fileURLToPath(new URL('src/utils/', repoRoot))
    for (const file of readdirSync(utils).filter((f) => f.endsWith('.js'))) {
      const text = readFileSync(`${utils}/${file}`, 'utf-8')
      const urls = [...text.matchAll(/https?:\/\/[^\s'"`)]+/g)].map((m) => m[0])
      for (const url of urls) {
        expect(url, `${file} 请求了境外地址 ${url}`).not.toMatch(
          /githubusercontent|github\.com|jsdelivr|unpkg\.com|natural-earth/i,
        )
      }
    }
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
