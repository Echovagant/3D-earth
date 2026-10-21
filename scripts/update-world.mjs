#!/usr/bin/env node
/**
 * 世界国界数据同步：从 Natural Earth 拉取全球国家边界，精简后存入
 * public/geojson/world-countries.json。
 *
 * 用法：
 *   node scripts/update-world.mjs          拉取并写入有变化的文件
 *   node scripts/update-world.mjs --check  只校验本地数据与上游是否一致
 *
 * 数据源是 Natural Earth 的 admin_0 110m 分辨率国界：单文件、177 个国家，
 * 且每个要素都带中文名（NAME_ZH）、人口估计（POP_EST）与 ISO 代码，
 * 省掉另找属性数据源这一步。
 *
 * 上游在 GitHub 上，国内直连不稳定，默认经 ghproxy 镜像拉取；
 * 可用 WORLD_SOURCE 环境变量覆盖成原始地址。
 */

import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const RAW_PATH = 'nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'
const SOURCES = [
  `https://ghproxy.net/https://raw.githubusercontent.com/${RAW_PATH}`,
  `https://raw.githubusercontent.com/${RAW_PATH}`,
]

/** 写入的目标文件 */
const TARGET = 'public/geojson/world-countries.json'

/** 预期要素数：Natural Earth 的 admin_0 110m 是 177 个 */
const EXPECTED_FEATURES = 177
/** 顶点总数下限：实测 110m 数据约 1.06 万个顶点，留出余量 */
const MIN_VERTEX_COUNT = 9000

const CHECK_ONLY = process.argv.slice(2).includes('--check')

/** 去掉末尾空白，与仓库里已有文件的格式保持一致 */
const normalize = (text) => text.replace(/\s+$/, '')

const sha256 = (text) => createHash('sha256').update(text).digest('hex')

/** 依次尝试各个数据源地址 */
async function fetchText() {
  let lastError
  for (const url of SOURCES) {
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
      console.log(`  · ${url} 失败：${error.message}`)
    }
  }
  throw new Error(`所有数据源都不可用：${lastError.message}`)
}

/**
 * 精简属性：Natural Earth 的原始要素有上百个字段，全带上会让文件大一倍，
 * 而运行时只用到下面这些。
 */
const KEEP_PROPERTIES = [
  'NAME_ZH',
  'NAME',
  'ADM0_A3',
  'ISO_A3',
  'POSTAL',
  'POP_EST',
  'POP_YEAR',
  'CONTINENT',
  'REGION_UN',
  'SUBREGION',
  'SOV_A3',
]

/** 把 Natural Earth 的要素转成仓库里用的形状 */
function toProjectShape(feature) {
  const source = feature.properties ?? {}
  const properties = {}
  for (const key of KEEP_PROPERTIES) {
    if (source[key] !== undefined && source[key] !== null) properties[key] = source[key]
  }
  return {
    type: 'Feature',
    properties,
    geometry: feature.geometry,
  }
}

/** 校验精简后的数据 */
function validate(geo) {
  const errors = []
  if (geo?.type !== 'FeatureCollection') {
    errors.push('顶层 type 不是 FeatureCollection')
    return errors
  }
  const features = Array.isArray(geo.features) ? geo.features : []
  if (features.length < 150) {
    errors.push(`要素数偏少，应约为 ${EXPECTED_FEATURES}，实际 ${features.length}`)
  }

  const seen = new Set()
  let vertexCount = 0
  for (const feature of features) {
    const nameZh = feature.properties?.NAME_ZH
    const isoA3 = feature.properties?.ISO_A3
    const adm0A3 = feature.properties?.ADM0_A3
    const label = nameZh || isoA3 || '(未命名)'
    if (!nameZh) errors.push(`要素 ${label} 缺少中文名`)
    // ISO_A3 为 -99 是 Natural Earth 的哨兵值，表示该地区没有 ISO 代码
    // （争议领地、法属南方与antarctic 属地等），不算缺失。
    if (!isoA3) errors.push(`要素 ${label} 缺少 ISO_A3`)
    // 唯一标识用 ADM0_A3：每个要素都有，且在 Natural Earth 内唯一
    if (!adm0A3) errors.push(`要素 ${label} 缺少 ADM0_A3`)
    if (adm0A3 && seen.has(adm0A3)) errors.push(`ADM0_A3 重复：${adm0A3}`)
    if (adm0A3) seen.add(adm0A3)
    if (!feature.geometry) {
      errors.push(`要素 ${label} 缺少几何`)
      continue
    }
    if (!['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) {
      errors.push(`要素 ${label} 的几何类型非法：${feature.geometry.type}`)
      continue
    }
    const polygons =
      feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
    if (!Array.isArray(polygons) || polygons.length === 0) {
      errors.push(`要素 ${label} 的坐标为空`)
      continue
    }
    // 逐个顶点校验范围。数据源可能是镜像，异常响应里的越界或 NaN 坐标
    // 写进 Float32Array 后会让 GPU 顶点数据出现 NaN，面片错乱或整个地球消失。
    let bad = 0
    for (const polygon of polygons) {
      for (const ring of polygon) {
        for (const coord of ring) {
          vertexCount++
          const [lon, lat] = coord
          if (
            !Number.isFinite(lon) ||
            !Number.isFinite(lat) ||
            lon < -180 ||
            lon > 180 ||
            lat < -90 ||
            lat > 90
          ) {
            bad++
          }
        }
      }
    }
    if (bad > 0) {
      errors.push(`要素 ${label} 有 ${bad} 个坐标越界或非数字`)
    }
    const point = polygons[0]?.[0]?.[0]
    if (!Array.isArray(point) || point.length < 2 || !point.every((n) => typeof n === 'number')) {
      errors.push(`要素 ${label} 的坐标格式异常`)
    }
  }

  // 顶点总量下限：响应被截断或换了格式时，顶点数会明显偏少
  if (vertexCount < MIN_VERTEX_COUNT) {
    errors.push(`顶点总数偏少，应不少于 ${MIN_VERTEX_COUNT}，实际 ${vertexCount}`)
  }

  return errors
}

async function main() {
  console.log('拉取 Natural Earth 世界国界…')
  const raw = await fetchText()

  let source
  try {
    source = JSON.parse(raw)
  } catch (error) {
    throw new Error(`上游返回的不是合法 JSON：${error.message}`)
  }

  const geo = {
    type: 'FeatureCollection',
    features: (source.features ?? []).map(toProjectShape),
  }

  const errors = validate(geo)
  if (errors.length > 0) {
    console.error('✗ 校验未通过：')
    for (const message of errors.slice(0, 20)) console.error(`  - ${message}`)
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
    if (CHECK_ONLY) return
    return
  }

  if (CHECK_ONLY) {
    console.error(`✗ ${TARGET} 与上游不一致`)
    process.exitCode = 1
    return
  }

  await writeFile(path.join(ROOT, TARGET), text, 'utf8')
  console.log(
    `✓ 已更新 ${TARGET}：${geo.features.length} 个国家，${(text.length / 1024 / 1024).toFixed(2)} MB，sha256=${sha256(text).slice(0, 12)}`,
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`\n更新失败：${error.message}`)
    process.exitCode = 1
  })
}
