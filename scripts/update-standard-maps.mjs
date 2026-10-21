#!/usr/bin/env node
/**
 * 标准地图与审图号清单同步。
 *
 * 数据来自自然资源部主管的「标准地图服务系统」（bzdt.ch.mnr.gov.cn）。
 * 它公开发布经审核的标准地图，每张都有审图号（GS(年份)序号号）。
 *
 * 这里只取「中国地图」与「世界地图」两类，把名称、比例尺、审图号、审核年份
 * 记进 public/data/standard-maps.json，供应用内的「标准地图与审图号」页展示。
 *
 * 只取元数据，不下载也不分发地图图片——标准地图的免费使用是「不改内容 +
 * 标注审图号」，把图片打包进仓库属于再分发，风险与收益不匹配。
 * 因此上游的缩略图地址（jpgPath）也**不保留**：仓库里不留下指向官方图片的直链，
 * 页面只用文字表格展示清单。
 *
 * 用法：
 *   node scripts/update-standard-maps.mjs          拉取并写入有变化的文件
 *   node scripts/update-standard-maps.mjs --check  只校验本地数据与上游是否一致
 */

import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** 标准地图服务系统的接口地址 */
const API_BASE = process.env.SBSM_API ?? 'http://bzdt.ch.mnr.gov.cn/sbsm/supermap/searchPicture.do'

/** 要收录的两类地图 */
const CATEGORIES = ['中国全图', '世界地图']

/** 写入的目标文件 */
const TARGET = 'public/data/standard-maps.json'

const CHECK_ONLY = process.argv.slice(2).includes('--check')

const normalize = (text) => text.replace(/\s+$/, '')

const sha256 = (text) => createHash('sha256').update(text).digest('hex')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 调用检索接口。
 *
 * 这是个表单 POST 接口（同名参数以空串表示「不限」），
 * 返回 { type, message: { result: [...] } }。
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
      const text = await response.text()
      const json = JSON.parse(text)
      return json?.message?.result ?? []
    } catch (error) {
      lastError = error
      if (attempt === 4) break
      await sleep(1000 * (attempt + 1))
    }
  }
  throw new Error(`检索「${superclass}」失败：${lastError.message}`)
}

/** 从上游记录里挑出要留的字段 */
function toEntry(record) {
  return {
    name: record.name,
    content: record.content,
    scale: record.scale,
    size: record.size,
    mapNumber: record.mapNumber,
    mapYear: record.mapYear,
    id: record.id,
  }
}

function validate(entries) {
  const errors = []
  if (!entries.length) errors.push('没有取到任何标准地图')
  for (const entry of entries) {
    if (!entry.name) errors.push('有记录缺少名称')
    if (!entry.mapNumber) errors.push(`「${entry.name}」缺少审图号`)
    if (!entry.mapYear) errors.push(`「${entry.name}」缺少审核年份`)
  }
  const ids = entries.map((e) => e.id)
  if (new Set(ids).size !== ids.length) errors.push('存在重复的地图 id')
  return errors
}

async function main() {
  console.log('拉取标准地图与审图号清单…')
  const collected = []
  for (const category of CATEGORIES) {
    for (let page = 1; page <= 8; page++) {
      const list = await query(category, page)
      if (!list.length) break
      collected.push(...list)
      // 翻页到空为止
      if (list.length < 12) break
    }
  }
  console.log(`  上游返回 ${collected.length} 条`)

  const entries = collected
    .map(toEntry)
    .sort((a, b) => a.scale.localeCompare(b.scale, 'zh') || a.name.localeCompare(b.name, 'zh'))

  const errors = validate(entries)
  if (errors.length > 0) {
    console.error('✗ 校验未通过：')
    for (const message of errors.slice(0, 20)) console.error(`  - ${message}`)
    throw new Error('校验未通过，已中止更新')
  }

  const payload = {
    source: '自然资源部主管的标准地图服务系统',
    sourceUrl: 'http://bzdt.ch.mnr.gov.cn/',
    note: '只收录元数据（名称、比例尺、审图号、审核年份），不分发地图图片。',
    updatedAt: new Date().toISOString().slice(0, 10),
    maps: entries,
  }
  const text = `${JSON.stringify(payload, null, 2)}\n`

  let local = null
  try {
    local = await readFile(path.join(ROOT, TARGET), 'utf8')
  } catch {
    // 本地还没有
  }

  // updatedAt 每天都会变，比对时忽略它
  const strip = (s) => s.replace(/"updatedAt": "[^"]*"/, '"updatedAt": ""')
  if (local !== null && strip(normalize(local)) === strip(normalize(text))) {
    console.log('· 本地数据与上游一致，无需更新')
    return
  }

  if (CHECK_ONLY) {
    console.error(`✗ ${TARGET} 与上游不一致`)
    process.exitCode = 1
    return
  }

  await writeFile(path.join(ROOT, TARGET), text, 'utf8')
  console.log(
    `✓ 已更新 ${TARGET}：${entries.length} 张标准地图，sha256=${sha256(text).slice(0, 12)}`,
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`\n更新失败：${error.message}`)
    process.exitCode = 1
  })
}
