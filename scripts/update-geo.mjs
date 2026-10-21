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
import { lookup } from 'node:dns/promises'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

import { featureAreaKm2 } from '../src/utils/areaData.js'

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

/**
 * 地级市边界按省单独存放。
 *
 * 34 个省的全量约 6.5 MB，放进仓库后下钻时按需取用，用户只会下载自己点进去的那一个
 * （约 190 KB）。这样下钻不依赖第三方接口在线，离线也能用。
 */
const CITY_DIR = 'public/geojson/cities'
/** 同时请求上游的最大并发数，避免把对方接口打爆 */
const CITY_CONCURRENCY = 4

/**
 * 由 scripts/update-tw.mjs 单独同步的省。
 *
 * 台湾省的上游（DataV）没有下辖区县数据，404 是预期结果而不是故障；
 * 它的县市边界来自内政部与 geojson.cn 的合成，由另一个脚本负责。
 * 这里要跳过，否则整个同步会因为一个 404 而中止。
 */
const EXTERNAL_PROVINCES = new Set(['710000'])

/**
 * 需要从上游同步地级市边界的省。
 *
 * 单独抽成纯函数是为了能单测：加新省时若忘了把它排除在 EXTERNAL_PROVINCES 之外，
 * 同步就会因为一个 404 整体中止。
 */
export function citySyncTargets(adcodes) {
  return adcodes.filter((adcode) => !EXTERNAL_PROVINCES.has(String(adcode)))
}

const CHECK_ONLY = process.argv.slice(2).includes('--check')

/**
 * 从本地目录导入地级市边界，走与在线同步同一套校验。
 *
 * 用于本机解析不了上游域名、但手头已有文件的情况；CI 上直接在线拉取即可。
 */
const importIndex = process.argv.indexOf('--import-cities')
const IMPORT_DIR = importIndex >= 0 ? process.argv[importIndex + 1] : null

/** 变更摘要的输出路径（供 CI 拼提交信息） */
const summaryFileIndex = process.argv.indexOf('--summary-file')
const SUMMARY_FILE = summaryFileIndex >= 0 ? process.argv[summaryFileIndex + 1] : null

/** 去掉末尾空白，与仓库里已有文件的格式保持一致 */
const normalize = (text) => text.replace(/\s+$/, '')

/**
 * 复刻仓库里省份详情数据的 JSON 风格：2 空格缩进，只含基本值的数组压在一行。
 *
 * 用 JSON.stringify 的默认输出会把数组展开成多行，与仓库现有文件不一致，
 * 每次同步都会产生整文件 diff。
 */
export function formatJson(value) {
  return `${JSON.stringify(value, null, 2).replace(
    /\[\s*\n((?:[^[\]{}]|\[[^[\]]*\])*?)\s*\n\s*\]/g,
    (_match, inner) => `[${inner.replace(/\s*\n\s*/g, ' ').trim()}]`,
  )}\n`
}

/** 省份详情数据的字段顺序，保证同步后字段位置稳定 */
const PROVINCE_FIELD_ORDER = [
  'adcode',
  'name',
  'abbreviation',
  'capital',
  'area',
  'areaKm2',
  'population',
  'populationYear',
  'populationSource',
  'center',
  'highlights',
  'intro',
]

/** 按固定顺序重建对象，未知字段追加在后面 */
function orderFields(record, order) {
  const ordered = {}
  for (const key of order) {
    if (key in record) ordered[key] = record[key]
  }
  for (const key of Object.keys(record)) {
    if (!(key in ordered)) ordered[key] = record[key]
  }
  return ordered
}

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

/** 等待若干毫秒 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 拉取上游文本，带重试。
 *
 * 本机解析域名走的是 Clash 的本地 DNS 代理，上游一抖，连国内域名也会间歇性
 * ENOTFOUND。单次成功说明不了问题，所以这里对失败做退避重试，
 * 每次重试前先主动解析一次域名，把 DNS 缓存预热起来。
 */
async function fetchText(url, { retries = 5 } = {}) {
  const host = new URL(url).hostname
  let lastError

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': '3D-earth geo updater' },
        // 超时是必须的：一次 TCP 挂起会让整个同步任务无限期停着
        signal: AbortSignal.timeout(30_000),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.text()
    } catch (error) {
      lastError = error
      if (attempt === retries) break
      // 退避后重试；间隔里做一次 DNS 解析，成功则后续请求能复用缓存
      await sleep(400 * (attempt + 1))
      try {
        await lookup(host)
      } catch {
        // 解析仍失败就继续退避
      }
    }
  }
  throw new Error(`拉取 ${url} 失败：${lastError.message}`)
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
  // 从本地目录导入：不需要能解析上游域名
  if (IMPORT_DIR) {
    const results = await importCityBoundaries(IMPORT_DIR)
    const invalid = results.filter((r) => r.status === 'invalid')
    for (const r of invalid) {
      console.error(`  ✗ ${r.adcode}: ${r.errors.join('; ')}`)
    }
    console.log(
      `· 从 ${IMPORT_DIR} 导入 ${results.length - invalid.length} 个省的地级市边界，异常 ${invalid.length}`,
    )
    if (invalid.length > 0) {
      throw new Error(`${invalid.length} 个文件校验未通过，已中止导入`)
    }
    return
  }

  const changedFiles = []
  const summaryLines = []
  let provincesGeo = null

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

    if (source.kind === 'provinces') provincesGeo = geo

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

  // 边界同步之后，顺带把各省的「边界围合面积」算出来写进详情页数据。
  // 这个值由行政区划边界在球面上直接围合得到，跟地级市详情页用的是同一个公式，
  // 因此两处口径一致；它随边界自动更新，不依赖人工维护。
  let areaUpdates = []
  if (provincesGeo) {
    areaUpdates = await syncProvinceAreas(provincesGeo, { dryRun: CHECK_ONLY })
    if (areaUpdates.length > 0) {
      console.log(
        CHECK_ONLY
          ? `· 省份详情数据：${areaUpdates.length} 个省的面积与上游边界不一致`
          : `✓ 省份详情数据：${areaUpdates.length} 个省的面积已更新`,
      )
    }
  }

  // 地级市边界：按省同步，供下钻时按需加载
  let cityResults = []
  if (provincesGeo) {
    const provinceAdcodes = (provincesGeo.features ?? [])
      .map((f) => String(f.properties?.adcode ?? ''))
      .filter((code) => /^\d{6}$/.test(code))
    cityResults = await syncCityBoundaries(provinceAdcodes, { dryRun: CHECK_ONLY })
    const failed = cityResults.filter((r) => r.status === 'failed' || r.status === 'invalid')
    const updated = cityResults.filter((r) => r.status === 'updated')
    console.log(
      `· 地级市边界：${cityResults.length} 个省，更新 ${updated.length}，异常 ${failed.length}`,
    )
    for (const r of failed) {
      console.error(`  ✗ ${r.adcode}: ${r.errors.join('; ')}`)
    }
    if (failed.length > 0) {
      throw new Error(`${failed.length} 个省的地级市边界校验未通过，已中止更新`)
    }
    if (updated.length > 0) {
      summaryLines.push(
        `- 地级市边界：${updated.length} 个省更新（${updated.map((r) => r.adcode).join(', ')}）`,
      )
    }
  }

  if (CHECK_ONLY) {
    const cityOutdated = cityResults.filter((r) => r.status === 'updated')
    if (changedFiles.length > 0 || areaUpdates.length > 0 || cityOutdated.length > 0) {
      if (changedFiles.length > 0) {
        console.error(`\n✗ 有 ${changedFiles.length} 个文件与上游不一致：${changedFiles.join(', ')}`)
      }
      if (areaUpdates.length > 0) {
        console.error(`✗ 省份详情数据的面积与上游边界不一致：${areaUpdates.join(', ')}`)
      }
      if (cityOutdated.length > 0) {
        console.error(
          `✗ 地级市边界与上游不一致：${cityOutdated.map((r) => r.adcode).join(', ')}`,
        )
      }
      process.exitCode = 1
    } else {
      console.log('\n✓ 本地地理数据与上游一致')
    }
    await writeSummaryFile(summaryLines)
    return
  }

  if (changedFiles.length === 0 && areaUpdates.length === 0 && cityResults.length > 0) {
    const cityUpdated = cityResults.filter((r) => r.status === 'updated')
    if (cityUpdated.length === 0) {
      console.log('\n全部文件均与上游一致，未做修改')
      await writeSummaryFile(['地理数据与上游一致，无变更'])
      return
    }
  }

  console.log(`\n已更新 ${changedFiles.length} 个文件：${changedFiles.join(', ')}`)
  if (areaUpdates.length > 0) {
    summaryLines.push(
      `- 省份详情数据：${areaUpdates.length} 个省的边界围合面积已更新（${areaUpdates.join(', ')}）`,
    )
  }
  const cityUpdated = cityResults.filter((r) => r.status === 'updated')
  if (cityUpdated.length > 0) {
    console.log(`地级市边界已更新 ${cityUpdated.length} 个省`)
  }
  if (summaryLines.length > 0) {
    console.log('\n变更摘要：')
    for (const line of summaryLines) console.log(line)
  }
  await writeSummaryFile(summaryLines)
}

/**
 * 拉取各省的地级市边界，存成 public/geojson/cities/<adcode>.json。
 *
 * 写盘的是上游响应原文，与省级边界同一套格式。校验不通过的文件不写盘——
 * 坏数据留在仓库里比缺数据更难排查。
 */
export async function syncCityBoundaries(adcodes, { dryRun = false } = {}) {
  const dir = path.join(ROOT, CITY_DIR)
  await mkdir(dir, { recursive: true })

  const targets = citySyncTargets(adcodes)
  const results = []
  let index = 0

  const worker = async () => {
    while (index < targets.length) {
      const adcode = targets[index++]
      const url = `${AREA_BASE}/${adcode}_full.json`
      const file = path.join(dir, `${adcode}.json`)
      try {
        const raw = await fetchText(url)
        const text = normalize(raw)
        const geo = JSON.parse(text)

        const errors = validateCityGeo(geo)
        if (errors.length > 0) {
          results.push({ adcode, status: 'invalid', errors })
          continue
        }

        const local = await readLocal(`${CITY_DIR}/${adcode}.json`)
        if (local !== null && normalize(local) === text) {
          results.push({ adcode, status: 'unchanged' })
          continue
        }

        results.push({ adcode, status: 'updated' })
        if (!dryRun) await writeFile(file, text, 'utf8')
      } catch (error) {
        results.push({ adcode, status: 'failed', errors: [error.message] })
      }
    }
  }

  await Promise.all(Array.from({ length: CITY_CONCURRENCY }, worker))
  return results
}

/** 校验一个省的地级市边界 */
function validateCityGeo(geo) {
  const errors = []
  if (geo?.type !== 'FeatureCollection') {
    errors.push('顶层 type 不是 FeatureCollection')
    return errors
  }
  const features = Array.isArray(geo.features) ? geo.features : []
  if (features.length === 0) {
    errors.push('要素为空')
    return errors
  }
  for (const feature of features) {
    const featureAdcode = String(feature.properties?.adcode ?? '')
    if (!/^\d{6}$/.test(featureAdcode)) {
      errors.push(`要素 ${featureAdcode} 的 adcode 不是 6 位行政区划代码`)
    }
    checkGeometry(feature, `要素 ${featureAdcode}`, errors)
  }
  // 直属市（省辖市）只有一个要素，那是正常的。
  // 省本级不一定是要素：湖南省本级不是地级市，文件里只有 13 个地级市；
  // 只有直辖市（京、津、沪、渝）的文件里才带着与省同名的那个要素。
  return errors
}

/**
 * 从本地目录导入地级市边界：校验后写入 public/geojson/cities/。
 *
 * 与在线同步走同一套校验，所以「从别处拿来的文件」和「在线拉的文件」有一样的质量门槛。
 */
export async function importCityBoundaries(sourceDir) {
  const dir = path.join(ROOT, CITY_DIR)
  await mkdir(dir, { recursive: true })

  const entries = (await readdir(sourceDir)).filter((f) => f.endsWith('.json'))
  const results = []

  for (const entry of entries) {
    const adcode = entry.replace(/\.json$/, '')
    if (!/^\d{6}$/.test(adcode)) {
      results.push({ adcode, status: 'invalid', errors: ['文件名不是 6 位行政区划代码'] })
      continue
    }
    const raw = await readFile(path.join(sourceDir, entry), 'utf8')
    const text = normalize(raw)
    let geo
    try {
      geo = JSON.parse(text)
    } catch (error) {
      results.push({ adcode, status: 'invalid', errors: [`不是合法 JSON：${error.message}`] })
      continue
    }
    const errors = validateCityGeo(geo)
    if (errors.length > 0) {
      results.push({ adcode, status: 'invalid', errors })
      continue
    }
    await writeFile(path.join(dir, `${adcode}.json`), text, 'utf8')
    results.push({ adcode, status: 'updated' })
  }
  return results
}

/**
 * 把各省的「边界围合面积」写进详情页静态数据。
 *
 * 返回面积发生变化的省 adcode 列表。dryRun 时只报告不写盘。
 */
export async function syncProvinceAreas(geo, { dryRun = false } = {}) {
  const dir = path.join(ROOT, 'public/data/provinces')
  const changed = []

  for (const feature of geo?.features ?? []) {
    const adcode = String(feature.properties?.adcode ?? '')
    // 九段线要素不对应省份，跳过
    if (!/^\d{6}$/.test(adcode)) continue

    const file = path.join(dir, `${adcode}.json`)
    let raw
    try {
      raw = await readFile(file, 'utf8')
    } catch {
      continue // 没有对应详情数据的省跳过
    }

    const record = JSON.parse(raw)
    const areaKm2 = Math.round(featureAreaKm2(feature) * 100) / 100
    if (record.areaKm2 === areaKm2) continue

    changed.push(adcode)
    if (dryRun) continue
    record.areaKm2 = areaKm2
    await writeFile(file, formatJson(orderFields(record, PROVINCE_FIELD_ORDER)), 'utf8')
  }

  return changed
}

/** 把变更摘要写到指定文件，供 CI 拼提交信息 */
async function writeSummaryFile(lines) {
  if (!SUMMARY_FILE) return
  const target = path.isAbsolute(SUMMARY_FILE)
    ? SUMMARY_FILE
    : path.join(ROOT, SUMMARY_FILE)
  await writeFile(target, `${lines.join('\n')}\n`, 'utf8')
}

// 直接运行时才执行同步；被 import 时只导出函数，方便测试。
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`\n更新失败：${error.message}`)
    process.exitCode = 1
  })
}
