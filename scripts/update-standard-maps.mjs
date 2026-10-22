#!/usr/bin/env node
/**
 * 标准地图与审图号清单同步。
 *
 * 数据来自自然资源部主管的「标准地图服务系统」（bzdt.ch.mnr.gov.cn）。
 * 它公开发布经审核的标准地图，每张都有审图号。
 *
 * 官方口径（站点 meta Description）：
 *   「社会公众可以免费浏览、下载标准地图，直接使用标准地图时需要标注审图号。」
 * 站点页脚：「网站保留所有权，未经许可不得复制、镜像」。
 *
 * 因此这里**只取元数据**（名称、内容、比例尺、开本、审图号、审核年份、分类），
 * **不下载也不分发地图图片**——图片属于官方，再分发不在授权范围内。
 * 审图号是官方公开给公众查询的编号，收录它属于对公开目录信息的引用。
 *
 * 用法：
 *   node scripts/update-standard-maps.mjs                    拉取上游清单，只报数
 *   node scripts/update-standard-maps.mjs --out <file>       拉取并写入指定文件
 */

import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

/** 标准地图服务系统的接口地址 */
const API_BASE = process.env.SBSM_API ?? 'http://bzdt.ch.mnr.gov.cn/sbsm/supermap/searchPicture.do'
const CATEGORY_API =
  process.env.SBSM_CATEGORY_API ?? 'http://bzdt.ch.mnr.gov.cn/sbsm/supermap/getMapCategorys.do'

/** 分类接口拿不到时的兜底清单（2026-10 抓取的全部分类） */
const FALLBACK_CATEGORIES = [
  '中国全图（英）',
  '中国全图',
  '各洲地图',
  '世界地图',
  '世界地图（英）',
  '中国主要河流湖泊分布图',
  '长江经济带区域',
  '京津冀都市圈',
  '长江三角洲地区',
  '粤港澳大湾区',
  '增补藏南地区地名分布图',
  '三沙市地图',
  '分省（区、市）地图',
  'G20国家',
  '人文地图',
  '分国地图',
  '地方共享地图',
  '城市地图集地图',
]

/** --out <file>：把抓到的清单写到哪；不给就只报数 */
const OUT = (() => {
  const argv = process.argv.slice(2)
  const i = argv.indexOf('--out')
  return i >= 0 && argv[i + 1] ? path.resolve(argv[i + 1]) : null
})()

/** 并发请求数——对公共服务要克制 */
const CONCURRENCY = 3

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const sha256 = (text) => createHash('sha256').update(text).digest('hex')

/** 分类接口返回的是 {"type":1,"message":{"superclass":[...]}} */
async function fetchCategories() {
  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      const response = await fetch(CATEGORY_API, {
        method: 'POST',
        headers: {
          'User-Agent': '3D-earth geo updater',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          Referer: 'http://bzdt.ch.mnr.gov.cn/download.html',
        },
        body: 'superclass=&subclass=&smallclass=&scale=&size=&border=&largeclass=',
        signal: AbortSignal.timeout(45_000),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const json = JSON.parse(await response.text())
      const list = json?.message?.superclass
      if (Array.isArray(list) && list.length) return list.filter(Boolean)
      throw new Error('分类接口没返回 superclass 列表')
    } catch (error) {
      if (attempt === 3) {
        console.warn(`  分类接口不可用（${error.message}），改用兜底清单`)
        return FALLBACK_CATEGORIES
      }
      await sleep(1000 * (attempt + 1))
    }
  }
  return FALLBACK_CATEGORIES
}

/**
 * 调用检索接口。
 *
 * 这是个表单 POST 接口（同名参数以空串表示「不限」），
 * 返回 { type, message: { pageSize, currentPageNum, totalNum, result, ... } }。
 */
async function query(superclass, pageNum) {
  const body = new URLSearchParams({
    seachText: '',
    scale: '',
    size: '',
    pageNum: String(pageNum),
    orderSearch: '',
    superclass,
    subclass: '',
    smallclass: '',
    border: '',
    largeclass: '',
  }).toString()

  let lastError
  for (let attempt = 0; attempt <= 4; attempt++) {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'User-Agent': '3D-earth geo updater',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          Referer: 'http://bzdt.ch.mnr.gov.cn/download.html',
        },
        body,
        signal: AbortSignal.timeout(45_000),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const json = JSON.parse(await response.text())
      return json?.message ?? {}
    } catch (error) {
      lastError = error
      if (attempt === 4) break
      await sleep(1000 * (attempt + 1))
    }
  }
  throw new Error(`检索「${superclass}」第 ${pageNum} 页失败：${lastError.message}`)
}

/** 拉一个分类的全部分页 */
async function fetchCategory(superclass) {
  const first = await query(superclass, 1)
  const total = Number(first.totalNum ?? first.result?.length ?? 0)
  const pageSize = Number(first.pageSize ?? 12) || 12
  const pages = Math.max(1, Math.ceil(total / pageSize))

  const byId = new Map()
  const absorb = (list) => {
    for (const item of list ?? []) {
      if (item?.id && !byId.has(item.id)) byId.set(item.id, item)
    }
  }
  absorb(first.result)

  // 逐页取；并发受控
  for (let start = 2; start <= pages; start += CONCURRENCY) {
    const batch = []
    for (let p = start; p < start + CONCURRENCY && p <= pages; p++) batch.push(p)
    const results = await Promise.all(
      batch.map(async (p) => {
        try {
          return (await query(superclass, p)).result ?? []
        } catch {
          return []
        }
      }),
    )
    for (const list of results) absorb(list)
  }
  return [...byId.values()]
}

/** 从上游记录里挑出要留的字段 */
function toEntry(record, category) {
  return {
    name: record.name,
    content: record.content || '',
    scale: record.scale || '',
    size: record.size || '',
    mapNumber: record.mapNumber || '',
    mapYear: record.mapYear || '',
    category,
  }
}

/** 抓到的条目本身要自洽：名称、年份、分类都不能缺 */
function validate(entries) {
  const errors = []
  if (!entries.length) errors.push('没有取到任何标准地图')
  for (const entry of entries) {
    if (!entry.name) errors.push('有记录缺少名称')
    if (!entry.mapYear) errors.push(`「${entry.name}」缺少审核年份`)
    if (!/^\d{4}$/.test(entry.mapYear)) {
      errors.push(`「${entry.name}」的审核年份不是四位：${entry.mapYear}`)
    }
  }
  return errors
}

async function main() {
  console.log('拉取标准地图与审图号清单…')

  const categories = await fetchCategories()
  console.log(`  分类 ${categories.length} 个`)

  const collected = []
  for (let i = 0; i < categories.length; i += CONCURRENCY) {
    const batch = categories.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      batch.map(async (cat) => {
        try {
          const list = await fetchCategory(cat)
          return { cat, list }
        } catch (error) {
          console.warn(`  ! 「${cat}」抓取失败：${error.message}`)
          return { cat, list: [] }
        }
      }),
    )
    for (const { cat, list } of results) {
      collected.push(...list.map((r) => ({ ...r, __cat: cat })))
      console.log(`  ${cat.padEnd(24)} ${list.length} 条`)
    }
  }

  // 上游偶有跨分类重复：先按 id 去重，再按「审图号+名称」去一次
  const byId = new Map()
  for (const raw of collected) {
    if (!byId.has(raw.id)) byId.set(raw.id, raw)
  }
  const byKey = new Map()
  for (const raw of byId.values()) {
    const key = `${raw.mapNumber || ''}::${raw.name || ''}`
    if (!byKey.has(key)) byKey.set(key, raw)
  }
  const dropped = byId.size - byKey.size
  const candidates = [...byKey.values()].map((r) => toEntry(r, r.__cat))
  const entries = candidates
  console.log(
    `  上游返回 ${collected.length} 条，按 id 去重后 ${byId.size} 条，` +
      `同名同号再合并 ${dropped} 条，最终 ${entries.length} 条`,
  )

  // **按审核年份倒序**——最新的排在最前
  entries.sort(
    (a, b) =>
      Number(b.mapYear) - Number(a.mapYear) ||
      a.category.localeCompare(b.category, 'zh') ||
      a.name.localeCompare(b.name, 'zh'),
  )

  const errors = validate(entries)
  if (errors.length > 0) {
    console.error('✗ 校验未通过：')
    for (const message of errors.slice(0, 20)) console.error(`  - ${message}`)
    throw new Error('校验未通过，已中止更新')
  }

  const years = entries.map((e) => Number(e.mapYear))
  const withoutNumber = entries.filter((e) => !e.mapNumber)
  const payload = {
    source: '自然资源部主管的标准地图服务系统',
    sourceUrl: 'http://bzdt.ch.mnr.gov.cn/',
    note: '只收录元数据（名称、比例尺、审图号、审核年份、分类），不分发地图图片。',
    total: entries.length,
    latestYear: Math.max(...years),
    updatedAt: new Date().toISOString().slice(0, 10),
    maps: entries,
  }
  const text = `${JSON.stringify(payload, null, 2)}\n`

  // 落盘位置由 --out 给出；不给就只报数，不动任何文件。
  if (!OUT) {
    console.log(
      `  上游 ${entries.length} 条，最新审核年份 ${payload.latestYear}。` +
        `未指定 --out，只报数不落盘。`,
    )
    return
  }

  await writeFile(OUT, text, 'utf8')
  console.log(
    `✓ 已写入 ${OUT}：${entries.length} 张标准地图，最新审核年份 ${payload.latestYear}，` +
      `未公布审图号 ${withoutNumber.length} 张，sha256=${sha256(text).slice(0, 12)}`,
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`\n更新失败：${error.message}`)
    process.exitCode = 1
  })
}
