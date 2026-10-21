#!/usr/bin/env node
/**
 * 台湾地级市（县市）边界同步。
 *
 * DataV.GeoAtlas 只有台湾省的整体边界（`710000.json`），没有它下面的县市，
 * 所以这一份单独从两个源合成：
 *
 * - **几何**：geoBoundaries 的 TWN ADM1（OpenStreetMap / Wambacher，ODbL 1.0），
 *   22 个县市，简化版 251 KB。
 * - **属性**：内政部「縣市行政區劃」官方资料（d3 的 `COUNTY_MOI_1081121`），
 *   提供法定中文名与内政部县市代码。
 *
 * 两个源没有共同的标识字段，只能靠下面的对照表关联。表是逐条人工核对的：
 * 一边是内政部的 5 位 COUNTYCODE 与法定中文名，一边是 ISO 3166-2 码。
 *
 * **代码约定**：内政部没有 6 位的县市代码（县市是 3 位，村里码体系里的县市段是 5 位），
 * 而本项目的 adcode 统一 6 位、前 2 位是省级代码。所以这里按内政部 COUNTYCODE
 * 升序生成 710001–710022，前 2 位 71 与台湾省 710000 一致，
 * `provinceAdcodeOf()` 的「前 2 位 + 0000」规则因此自动成立，下钻链路与其他省相同。
 * 内政部的原始代码保留在 `moiCode` 字段里，可逐条核对。
 *
 * 用法：
 *   node scripts/update-tw.mjs          拉取并写入有变化的文件
 *   node scripts/update-tw.mjs --check  只校验本地数据与上游是否一致
 */

import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const GEO_BOUNDARIES_URL =
  'https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/TWN/ADM1/geoBoundaries-TWN-ADM1_simplified.geojson'

/** 写入的目标文件：与其它省的地级市边界同构 */
const TARGET = 'public/geojson/cities/710000.json'

/** 台湾省 adcode */
const PROVINCE_ADCODE = '710000'

/**
 * ISO 3166-2 码 → 内政部 5 位 COUNTYCODE + 法定中文名。
 *
 * 逐条对照内政部「COUNTY_MOI_1081121」的 COUNTYCODE/COUNTYNAME 与
 * geoBoundaries 的 shapeISO 核对而来；两者没有共同的标识字段，只能人工关联。
 */
const COUNTY_TABLE = [
  { iso: 'TW-HSQ', moiCode: '10004', name: '新竹縣' },
  { iso: 'TW-HSZ', moiCode: '10018', name: '新竹市' },
  { iso: 'TW-CHA', moiCode: '10007', name: '彰化縣' },
  { iso: 'TW-CYI', moiCode: '10020', name: '嘉義市' },
  { iso: 'TW-CYQ', moiCode: '10010', name: '嘉義縣' },
  { iso: 'TW-ILA', moiCode: '10002', name: '宜蘭縣' },
  { iso: 'TW-KEE', moiCode: '10017', name: '基隆市' },
  { iso: 'TW-KHH', moiCode: '64000', name: '高雄市' },
  { iso: 'TW-KIN', moiCode: '09020', name: '金門縣' },
  { iso: 'TW-LIE', moiCode: '09007', name: '連江縣' },
  { iso: 'TW-MIA', moiCode: '10005', name: '苗栗縣' },
  { iso: 'TW-NAN', moiCode: '10008', name: '南投縣' },
  { iso: 'TW-NWT', moiCode: '65000', name: '新北市' },
  { iso: 'TW-PIF', moiCode: '10013', name: '屏東縣' },
  { iso: 'TW-PEN', moiCode: '10016', name: '澎湖縣' },
  { iso: 'TW-TAO', moiCode: '68000', name: '桃園市' },
  { iso: 'TW-TNN', moiCode: '67000', name: '臺南市' },
  { iso: 'TW-TPE', moiCode: '63000', name: '臺北市' },
  { iso: 'TW-TXG', moiCode: '66000', name: '臺中市' },
  { iso: 'TW-TTT', moiCode: '10014', name: '臺東縣' },
  { iso: 'TW-YUN', moiCode: '10009', name: '雲林縣' },
  { iso: 'TW-HUA', moiCode: '10015', name: '花蓮縣' },
]

const CHECK_ONLY = process.argv.slice(2).includes('--check')

/**
 * 从本地文件读上游数据。
 *
 * 解析域名走本机的 DNS 代理，偶发失败时可以从别处下载好的文件直接导入。
 */
const sourceIndex = process.argv.indexOf('--source')
const LOCAL_SOURCE = sourceIndex >= 0 ? process.argv[sourceIndex + 1] : null

const normalize = (text) => text.replace(/\s+$/, '')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** 拉取上游文本，带退避重试（本机 DNS 偶发 ENOTFOUND） */
async function fetchText(url, { retries = 5 } = {}) {
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
      await sleep(400 * (attempt + 1))
    }
  }
  throw new Error(`拉取 ${url} 失败：${lastError.message}`)
}

/** 要素的球面质心：与 src/utils/worldData.js 的做法一致（避免跨 180° 经线出错） */
function featureCenter(feature) {
  const rings = []
  if (feature?.geometry?.type === 'Polygon') rings.push(...feature.geometry.coordinates)
  else if (feature?.geometry?.type === 'MultiPolygon') {
    for (const polygon of feature.geometry.coordinates) rings.push(...polygon)
  }
  let x = 0
  let y = 0
  let z = 0
  let count = 0
  for (const ring of rings) {
    for (const coord of ring) {
      const [lon, lat] = coord
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
      const phi = (lon * Math.PI) / 180
      const theta = (lat * Math.PI) / 180
      x += Math.cos(theta) * Math.cos(phi)
      y += Math.cos(theta) * Math.sin(phi)
      z += Math.sin(theta)
      count++
    }
  }
  if (!count) return null
  const length = Math.hypot(x, y, z)
  if (!length) return null
  return [
    (Math.atan2(y / length, x / length) * 180) / Math.PI,
    (Math.asin(z / length) * 180) / Math.PI,
  ]
}

/** 把 geoBoundaries 的要素转成与其它省地级市文件同构的形状 */
function toProjectShape(feature, entry, adcode) {
  const center = featureCenter(feature)
  if (!center) return null
  return {
    type: 'Feature',
    properties: {
      adcode,
      name: entry.name,
      level: 'city',
      center: center.map((n) => Number(n.toFixed(6))),
      centroid: center.map((n) => Number(n.toFixed(6))),
      childrenNum: 0,
      parent: { adcode: PROVINCE_ADCODE },
      // 非中国行政区的原始标识，保留以便核对
      iso31662: entry.iso,
      moiCode: entry.moiCode,
    },
    geometry: feature.geometry,
  }
}

function validate(geo) {
  const errors = []
  if (geo?.type !== 'FeatureCollection') {
    errors.push('顶层 type 不是 FeatureCollection')
    return errors
  }
  const features = Array.isArray(geo.features) ? geo.features : []
  if (features.length !== COUNTY_TABLE.length) {
    errors.push(`要素数应为 ${COUNTY_TABLE.length}，实际 ${features.length}`)
  }
  for (const feature of features) {
    const adcode = String(feature.properties?.adcode ?? '')
    if (!/^\d{6}$/.test(adcode)) errors.push(`要素 ${adcode} 的 adcode 不是 6 位代码`)
    if (!feature.properties?.name) errors.push(`要素 ${adcode} 缺少名称`)
    if (!feature.geometry) {
      errors.push(`要素 ${adcode} 缺少几何`)
      continue
    }
    if (!['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) {
      errors.push(`要素 ${adcode} 的几何类型非法：${feature.geometry.type}`)
    }
  }
  return errors
}

async function main() {
  console.log('拉取 geoBoundaries 台湾县市边界…')
  const raw = LOCAL_SOURCE
    ? await readFile(LOCAL_SOURCE, 'utf8')
    : await fetchText(GEO_BOUNDARIES_URL)
  const source = JSON.parse(raw)

  const byIso = new Map(source.features.map((f) => [f.properties.shapeISO, f]))
  const missing = COUNTY_TABLE.filter((entry) => !byIso.has(entry.iso))
  if (missing.length > 0) {
    throw new Error(
      `上游缺少这些 ISO 码对应的要素：${missing.map((m) => m.iso).join(', ')}`,
    )
  }

  // 按内政部 COUNTYCODE 升序生成 6 位 adcode，保证编号稳定
  const ordered = [...COUNTY_TABLE].sort((a, b) => a.moiCode.localeCompare(b.moiCode))
  const features = []
  ordered.forEach((entry, index) => {
    const adcode = `71${String(index + 1).padStart(4, '0')}`
    const shape = toProjectShape(byIso.get(entry.iso), entry, adcode)
    if (shape) features.push(shape)
  })

  const geo = { type: 'FeatureCollection', features }
  const errors = validate(geo)
  if (errors.length > 0) {
    console.error('✗ 校验未通过：')
    for (const message of errors) console.error(`  - ${message}`)
    throw new Error('校验未通过，已中止更新')
  }

  const text = `${JSON.stringify(geo)}\n`

  let local = null
  try {
    local = await readFile(path.join(ROOT, TARGET), 'utf8')
  } catch {
    // 本地还没有
  }

  if (local !== null && normalize(local) === normalize(text)) {
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
    `✓ 已更新 ${TARGET}：${features.length} 个县市，${(text.length / 1024).toFixed(0)} KB，sha256=${createHash('sha256').update(text).digest('hex').slice(0, 12)}`,
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`\n更新失败：${error.message}`)
    process.exitCode = 1
  })
}
