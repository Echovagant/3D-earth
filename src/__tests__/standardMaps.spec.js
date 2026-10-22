// @vitest-environment node
// 标准地图与审图号清单的契约测试。
//
// 这份清单是本项目「公开 + 审图号齐全」这条路的落脚点，所以对它有几条硬性要求：
// ① 每一条都要带审核年份——没有审图号的标准地图没有合规意义；
// ② 仓库里不能出现指向官方地图图片的直链——图片属于官方，再分发风险不可控；
// ③ 必须是**全量**而不是抽样——分页写错会静默少收一大批，且不会报错。
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const repoRoot = new URL('../../', import.meta.url)
const payload = JSON.parse(
  readFileSync(fileURLToPath(new URL('public/data/standard-maps.json', repoRoot)), 'utf-8'),
)

const maps = payload.maps ?? []

describe('标准地图与审图号清单', () => {
  it('清单非空，且每一条都带名称与四位审核年份', () => {
    expect(Array.isArray(payload.maps)).toBe(true)
    expect(maps.length).toBeGreaterThan(0)
    for (const map of maps) {
      expect(map.name, '缺少名称').toBeTruthy()
      expect(map.mapYear, `「${map.name}」缺少审核年份`).toMatch(/^\d{4}$/)
    }
  })

  it('是全量而不是抽样：条目数不低于全部分类的量级', () => {
    // 上游全库 2000 条量级（19 个分类）。分页逻辑写错时这里会直接红。
    expect(maps.length).toBeGreaterThanOrEqual(2000)
  })

  it('收录了最新的几批标准地图，不会退化到只剩早期年份', () => {
    const years = maps.map((m) => Number(m.mapYear))
    const latest = Math.max(...years)
    expect(latest, `最新审核年份只有 ${latest}，疑似同步退化`).toBeGreaterThanOrEqual(2024)
    // 2023 年这一批是「各洲地图 + 中国地图 1:1000万/1:740万 界线版」的主体
    expect(years.filter((y) => y === 2023).length).toBeGreaterThan(20)
  })

  it('国家审图号（GS 开头）里的年份与审核年份一致', () => {
    // 国家级审图号格式统一（GS(年份)序号号），年份必须对得上。
    // 地方审图号由各省级主管部门自编，格式五花八门（赣s、豫S〔2019年〕、
    // 皖S、浙甬S…），个别还与平台登记年份不同，不在这里做统一断言。
    const national = maps.filter((m) => /^GS/i.test(m.mapNumber || ''))
    expect(national.length).toBeGreaterThan(100)
    for (const map of national) {
      const matched = /[（(](\d{4})[)）]/.exec(map.mapNumber)
      expect(matched, `审图号格式读不出年份：${map.mapNumber}`).not.toBeNull()
      expect(Number(matched[1]), `审图号与审核年份不一致：${map.mapNumber}`).toBe(
        Number(map.mapYear),
      )
    }
  })

  it('非空审图号里都含 4 位年份（地方审图号允许与审核年份不同）', () => {
    for (const map of maps) {
      if (!map.mapNumber) continue
      const matched = /(\d{4})\s*年?/.exec(map.mapNumber)
      expect(matched, `审图号里没有年份：${map.mapNumber}`).not.toBeNull()
    }
  })

  it('同名同号的条目唯一', () => {
    const keys = maps.map((m) => `${m.mapNumber}::${m.name}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('每条都归到某个分类', () => {
    for (const map of maps) {
      expect(map.category, `「${map.name}」缺少分类`).toBeTruthy()
    }
    // 上游有 19 个分类
    expect(new Set(maps.map((m) => m.category)).size).toBeGreaterThanOrEqual(15)
  })

  it('仓库里不含任何指向官方地图图片的直链', () => {
    const text = JSON.stringify(payload)
    expect(text).not.toMatch(/https?:\/\/[^"']*\.(jpg|jpeg|png|gif|webp)/i)
    for (const map of maps) {
      expect(map.thumbnail, `「${map.name}」仍保留缩略图地址`).toBeUndefined()
    }
  })

  it('数据来源写明是官方标准地图服务系统', () => {
    expect(payload.source).toContain('标准地图服务系统')
    expect(payload.sourceUrl).toContain('mnr.gov.cn')
    expect(payload.latestYear).toBeGreaterThanOrEqual(2024)
    expect(payload.total).toBe(maps.length)
  })
})
