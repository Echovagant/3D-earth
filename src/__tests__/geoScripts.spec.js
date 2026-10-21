// @vitest-environment node
// 同步脚本的回归测试。脚本本身在 scripts/ 下（不在 src/），这里直接 import 过来。
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { formatJson } from '../../scripts/update-geo.mjs'

const repoRoot = new URL('../../', import.meta.url)
const provincesDir = fileURLToPath(new URL('public/data/provinces/', repoRoot))


describe('数据源与许可', () => {
  it('同步脚本不使用来源不明或限制用途的数据集', () => {
    // geojson.cn 的台湾数据集是付费离线包，免费接口只是预览，
    // 且站内声明「仅供学习研究使用」——不适合作为公开仓库再分发的数据来源。
    // jsDelivr / unpkg 是境外 CDN，同样不用。
    const forbidden = ['cdn.jsdelivr.net', 'unpkg.com', 'geojson.cn']
    const scripts = [
      'update-geo.mjs',
      'update-world.mjs',
      'update-standard-maps.mjs',
      'check-licenses.mjs',
    ]
    for (const name of scripts) {
      const text = readFileSync(fileURLToPath(new URL(`../../scripts/${name}`, import.meta.url)), 'utf-8')
      for (const host of forbidden) {
        expect(text, `${name} 引用了不该用的数据源 ${host}`).not.toContain(host)
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
          /githubusercontent|github\.com|jsdelivr|unpkg\.com/i,
        )
      }
    }
  })

  it('用到的每个数据源都在 LICENSES.md 里登记了来源与许可', () => {
    const licenses = readFileSync(fileURLToPath(new URL('LICENSES.md', repoRoot)), 'utf-8')
    const required = [
      'DataV.GeoAtlas',
      '标准地图服务系统',
      '审图号',
      '@surbowl/world-geo-json-zh',
      'un-m49',
      'NASA',
      'Unlicense',
      'MIT',
      'Apache License 2.0',
    ]
    for (const item of required) {
      expect(licenses, `LICENSES.md 没有登记 ${item}`).toContain(item)
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
