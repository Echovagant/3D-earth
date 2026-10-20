#!/usr/bin/env node
/**
 * 地理数据更新：把 DataV.GeoAtlas 的行政区划边界同步到 public/geojson/。
 *
 * 用法：
 *   node scripts/update-geo.mjs          拉取并写入有变化的文件
 *   node scripts/update-geo.mjs --check  只校验本地数据与上游是否一致，不写文件
 *   node scripts/update-geo.mjs --summary-file <路径>  把变更摘要写到文件（供提交信息使用）
 *
 * 脚本只做「搬运 + 校验」，不修改数据内容：写盘的是上游响应原文，
 * 末尾空白统一去掉，保证与仓库里已有的文件格式一致，数据没变时不产生 diff。
 *
 * 校验的对象是**上游返回的数据**，目的是保证坏数据不会进仓库；本地文件与上游
 * 不一致时会被上游版本覆盖。所以「本地文件被改坏了」表现为 --check 报不一致、
 * 写入模式把它纠正回来。
 *
 * 行政区划的新增或撤销会牵动配色、图例与详情页数据，这类变更必须人工确认，
 * 脚本遇到 adcode 集合不一致时直接拒绝写入并报错退出。
 */

import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
/** 数据源地址，可用 AREA_BASE 覆盖（测试与离线演练用） */
const AREA_BASE = process.env.AREA_BASE || 'https://geo.datav.aliyun.com/areas_v3/bound'

/** 省级边界：34 个省级行政区 + 1 个南海断续线要素 */
const PROVINCES = {
  url: `${AREA_BASE}/100000_full.json`,
  file: 'public/geojson/china-provinces.json',
  kind: 'provinces',
}

/** 中华人民共和国整体边界 */
const COUNTRY = {
  url: `${AREA_BASE}/100000.json`,
  file: 'public/geojson/china.json',
  kind: 'country',
}

const SOURCES = [PROVINCES, COUNTRY]

/** 预期要素数：34 个省 + 1 个断续线 */
const EXPECTED_PROVINCE_COUNT = 35
/** 九段线要素的 adcode（上游给的是字符串） */
const JD_ADCODE = '100000_JD'

const CHECK_ONLY = process.argv.slice(2).includes('--check')

/** 变更摘要的输出路径（供 CI 拼提交信息） */
const summaryFileIndex = process.argv.indexOf('--summary-file')
const SUMMARY_FILE = summaryFileIndex >= 0 ? process.argv[summaryFileIndex + 1] : null

/** 去掉末尾空白，与仓库里已有文件的格式保持一致 */
const normalize = (text) => text.replace(/\s+$/, '')

const sha256 = (text) => createHash('sha256').update(text).digest('hex')

/** 要素几何的指纹，用来判断某个要素的边界有没有变 */
const geometryHash = (feature) =>
  sha256(JSON.stringify(feature.geometry)).slice(0, 12)

/** 取要素的 adcode，九段线保持字符串，其余统一成字符串便于比较 */
const adcodeOf = (feature) => {
  const raw = feature?.properties?.adcode
  return typeof raw === 'string' ? raw : String(raw ?? '')
}

/**
 * 校验要素的几何：类型合法、坐标非空、坐标是数字对。
 * 只抽查每个环的第一个点——全量遍历几十万坐标点没有额外收益。
 */
function checkGeometry(feature, label, errors) {
  const geometry = feature?.geometry
  if (!geometry) {
    errors.push(`${label}：缺少 geometry`)
    return
  }
  if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') {
    errors.push(`${label}：geometry.type 非法（${geometry.type}）`)
    return
  }
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  if (!Array.isArray(polygons) || polygons.length === 0) {
    errors.push(`${label}：geometry.coordinates 为空`)
    return
  }
  for (const polygon of polygons) {
    const ring = polygon?.[0]
    const point = ring?.[0]
    if (!Array.isArray(point) || point.length < 2 || !point.every((n) => typeof n === 'number')) {
      errors.push(`${label}：坐标格式异常（期望 [经度, 纬度]）`)
      return
    }
  }
}

/** 校验省级边界文件 */
function validateProvinces(geo) {
  const errors = []
  if (geo?.type !== 'FeatureCollection') {
    errors.push('顶层 type 不是 FeatureCollection')
    return errors
  }
  const features = Array.isArray(geo.features) ? geo.features : []
  if (features.length !== EXPECTED_PROVINCE_COUNT) {
    errors.push(`要素数应为 ${EXPECTED_PROVINCE_COUNT}，实际 ${features.length}`)
  }

  const provinceAdcodes = new Set()
  let jdCount = 0
  for (const feature of features) {
    const adcode = adcodeOf(feature)
    const label = `要素 ${adcode}`
    if (adcode === JD_ADCODE) {
      jdCount += 1
    } else if (/^\d{6}$/.test(adcode)) {
      provinceAdcodes.add(adcode)
    } else {
      errors.push(`${label}：adcode 不是 6 位行政区划代码`)
    }
    if (typeof feature?.properties?.name !== 'string') {
      errors.push(`${label}：缺少 properties.name`)
    }
    checkGeometry(feature, label, errors)
  }

  if (jdCount !== 1) {
    errors.push(`南海断续线要素应有 1 个，实际 ${jdCount}`)
  }
  if (provinceAdcodes.size !== 34) {
    errors.push(`省级行政区应有 34 个，实际 ${provinceAdcodes.size}`)
  }
  return errors
}

/** 校验整体边界文件 */
function validateCountry(geo) {
  const errors = []
  if (geo?.type !== 'FeatureCollection') {
    errors.push('顶层 type 不是 FeatureCollection')
    return errors
  }
  const features = Array.isArray(geo.features) ? geo.features : []
  if (features.length !== 1) {
    errors.push(`要素数应为 1，实际 ${features.length}`)
  }
  for (const feature of features) {
    checkGeometry(feature, `要素 ${adcodeOf(feature)}`, errors)
  }
  return errors
}

/** 收集要素的 adcode 与几何指纹 */
function fingerprint(geo) {
  const map = new Map()
  for (const feature of geo?.features ?? []) {
    map.set(adcodeOf(feature), geometryHash(feature))
  }
  return map
}

/** 比较新旧数据的要素集合 */
function diffFingerprints(oldMap, newMap) {
  const added = []
  const removed = []
  const changed = []
  for (const [adcode, hash] of newMap) {
    if (!oldMap.has(adcode)) added.push(adcode)
    else if (oldMap.get(adcode) !== hash) changed.push(adcode)
  }
  for (const adcode of oldMap.keys()) {
    if (!newMap.has(adcode)) removed.push(adcode)
  }
  return { added, removed, changed }
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'User-Agent': '3D-earth geo updater' } })
  if (!response.ok) {
    throw new Error(`拉取 ${url} 失败：HTTP ${response.status}`)
  }
  return response.text()
}

/** 读本地文件；不存在返回 null */
async function readLocal(file) {
  try {
    return await readFile(path.join(ROOT, file), 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

async function main() {
  const changedFiles = []
  const summaryLines = []

  for (const source of SOURCES) {
    const raw = await fetchText(source.url)
    const text = normalize(raw)

    let geo
    try {
      geo = JSON.parse(text)
    } catch (error) {
      throw new Error(`${source.file}：上游返回的不是合法 JSON（${error.message}）`)
    }

    const localText = await readLocal(source.file)

    // 行政区划的新增或撤销会牵动配色、图例与详情页数据，必须人工确认。
    // 这一步排在结构校验之前：上游新增一个省时，要先告诉用户新增了哪个，
    // 而不是只报一句「要素数不对」。
    if (localText !== null && source.kind === 'provinces') {
      const localGeo = JSON.parse(normalize(localText))
      const diff = diffFingerprints(fingerprint(localGeo), fingerprint(geo))
      if (diff.added.length > 0 || diff.removed.length > 0) {
        console.error(`✗ ${source.file} 行政区划集合发生变化：`)
        if (diff.added.length > 0) console.error(`  新增：${diff.added.join(', ')}`)
        if (diff.removed.length > 0) console.error(`  撤销：${diff.removed.join(', ')}`)
        throw new Error(`${source.file} 行政区划集合发生变化，已中止更新`)
      }
    }

    const errors =
      source.kind === 'provinces' ? validateProvinces(geo) : validateCountry(geo)
    if (errors.length > 0) {
      console.error(`✗ ${source.file} 校验未通过：`)
      for (const message of errors) console.error(`  - ${message}`)
      throw new Error(`${source.file} 校验未通过，已中止更新`)
    }

    if (localText === null) {
      console.log(`· ${source.file} 本地不存在，将新建`)
      if (!CHECK_ONLY) await writeFile(path.join(ROOT, source.file), text, 'utf8')
      changedFiles.push(source.file)
      continue
    }

    if (normalize(localText) === text) {
      console.log(`· ${source.file} 与上游一致，无需更新`)
      continue
    }

    const localGeo = JSON.parse(normalize(localText))
    const diff = diffFingerprints(fingerprint(localGeo), fingerprint(geo))

    console.log(`✓ ${source.file} 有更新`)
    if (diff.changed.length > 0) {
      console.log(`  边界变化的要素：${diff.changed.join(', ')}`)
      summaryLines.push(`- ${source.file}：${diff.changed.length} 个要素边界更新（${diff.changed.join(', ')}）`)
    } else {
      summaryLines.push(`- ${source.file}：要素集合未变，仅上游序列化有差异`)
    }

    changedFiles.push(source.file)
    if (!CHECK_ONLY) await writeFile(path.join(ROOT, source.file), text, 'utf8')
  }

  if (CHECK_ONLY) {
    if (changedFiles.length > 0) {
      console.error(`\n✗ 有 ${changedFiles.length} 个文件与上游不一致：${changedFiles.join(', ')}`)
      process.exitCode = 1
    } else {
      console.log('\n✓ 本地地理数据与上游一致')
    }
    await writeSummaryFile(summaryLines)
    return
  }

  if (changedFiles.length === 0) {
    console.log('\n全部文件均与上游一致，未做修改')
    await writeSummaryFile(['地理数据与上游一致，无变更'])
    return
  }

  console.log(`\n已更新 ${changedFiles.length} 个文件：${changedFiles.join(', ')}`)
  if (summaryLines.length > 0) {
    console.log('\n变更摘要：')
    for (const line of summaryLines) console.log(line)
  }
  await writeSummaryFile(summaryLines)
}

/** 把变更摘要写到指定文件，供 CI 拼提交信息 */
async function writeSummaryFile(lines) {
  if (!SUMMARY_FILE) return
  const target = path.isAbsolute(SUMMARY_FILE)
    ? SUMMARY_FILE
    : path.join(ROOT, SUMMARY_FILE)
  await writeFile(target, `${lines.join('\n')}\n`, 'utf8')
}

main().catch((error) => {
  console.error(`\n更新失败：${error.message}`)
  process.exitCode = 1
})
