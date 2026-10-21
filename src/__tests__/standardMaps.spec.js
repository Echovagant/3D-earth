// @vitest-environment node
// 标准地图与审图号清单的契约测试。
//
// 这份清单是本项目「公开 + 审图号齐全」这条路的落脚点，所以对它有两条硬性要求：
// ① 每一条都必须带审图号——没有审图号的标准地图没有合规意义；
// ② 仓库里不能出现指向官方地图图片的直链——图片属于官方，再分发风险不可控。
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const repoRoot = new URL('../../', import.meta.url)
const payload = JSON.parse(
  readFileSync(fileURLToPath(new URL('public/data/standard-maps.json', repoRoot)), 'utf-8'),
)

describe('标准地图与审图号清单', () => {
  it('清单非空，且每一条都带审图号与审核年份', () => {
    expect(Array.isArray(payload.maps)).toBe(true)
    expect(payload.maps.length).toBeGreaterThan(0)
    for (const map of payload.maps) {
      expect(map.name, '缺少名称').toBeTruthy()
      expect(map.mapNumber, `「${map.name}」缺少审图号`).toBeTruthy()
      expect(map.mapYear, `「${map.name}」缺少审核年份`).toBeTruthy()
    }
  })

  it('审图号是「GS(年份)序号号」格式，年份与审核年份对得上', () => {
    for (const map of payload.maps) {
      const matched = /^GS\((\d{4})\)\d+号$/.exec(map.mapNumber)
      expect(matched, `审图号格式不对：${map.mapNumber}`).not.toBeNull()
      expect(matched[1], `审图号年份与审核年份不一致：${map.mapNumber}`).toBe(map.mapYear)
    }
  })

  it('地图 id 唯一', () => {
    const ids = payload.maps.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('仓库里不含任何指向官方地图图片的直链', () => {
    const text = JSON.stringify(payload)
    expect(text).not.toMatch(/https?:\/\/[^"']*\.(jpg|jpeg|png|gif|webp)/i)
    // 缩略图字段整个都不该存在
    for (const map of payload.maps) {
      expect(map.thumbnail, `「${map.name}」仍保留缩略图地址`).toBeUndefined()
    }
  })

  it('数据来源写明是官方标准地图服务系统', () => {
    expect(payload.source).toContain('标准地图服务系统')
    expect(payload.sourceUrl).toContain('mnr.gov.cn')
  })
})
