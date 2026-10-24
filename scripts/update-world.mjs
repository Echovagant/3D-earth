#!/usr/bin/env node
/**
 * 世界国界数据同步。
 *
 * 用法：
 *   node scripts/update-world.mjs          拉取并写入有变化的文件
 *   node scripts/update-world.mjs --check  只校验本地数据与上游是否一致
 *
 * 数据源是 npm 上的两个包，走 npm 官方源下载：
 *
 * - **几何与中文名**：`@surbowl/world-geo-json-zh` —— 239 个国家/地区的
 *   GeoJSON，简体中文名 + ISO 3166-1 的 alpha-2 / alpha-3 / 数字码。
 *   许可为 Unlicense（作者放弃著作权，进入公有领域）。
 * - **大洲与次区域**：`un-m49` —— 联合国 M49 地区划分表（MIT 许可）。
 *   按它推导每个国家所在的大洲与次区域。
 *
 * 两边靠 ISO alpha-3 关联。英文名用运行时自带的 `Intl.DisplayNames` 生成，
 * 不再引入任何外部属性数据源。人口没有可自动同步的权威源，一律不展示——
 * 详情页改用边界几何实算的面积。
 */

import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** npm 镜像源 */
const REGISTRY = 'https://registry.npmjs.org'

/** 几何与中文名 */
const GEOMETRY_PACKAGE = {
  name: '@surbowl/world-geo-json-zh',
  version: '2.1.5',
  entry: 'package/world.zh.json',
}

/** 大洲与次区域（联合国 M49 地区划分） */
const REGIONS_PACKAGE = {
  name: 'un-m49',
  version: '2.2.0',
  entry: 'package/index.js',
}

/** 写入的目标文件 */
const TARGET = 'public/geojson/world-countries.json'

/** 预期要素数：上游是 239 个国家/地区 */
const EXPECTED_FEATURES = 239
/** 顶点总数下限：实测约 1.17 万个顶点，留出余量 */
const MIN_VERTEX_COUNT = 9000

/**
 * 上游没有独立 ISO 代码的 4 个地区。
 *
 * 索马里兰、北塞浦路斯、锡亚琴冰川在 ISO 3166-1 里没有对应条目，
 * 阿什莫尔和卡捷群岛是澳大利亚的海外属地、也没有自己的代码——
 * 上游给它们的 `iso_a3` 要么是 `'-99'`，要么和母国重复（阿什莫尔
 * 与澳大利亚都是 `AUS`）。
 *
 * 这里用 ISO 3166-1 的用户自定义码段（X 开头）补一个稳定标识：
 * 它只用于路由、配色与去重，不代表任何官方承认。
 */
const EXTRA_ENTRIES = {
  索马里兰: {
    id: 'XSOM',
    nameEn: 'Somaliland',
    region: 'Africa',
    subregion: 'Eastern Africa',
  },
  北塞浦路斯: {
    id: 'XNCY',
    nameEn: 'Northern Cyprus',
    region: 'Asia',
    subregion: 'Western Asia',
  },
  锡亚琴冰川: {
    id: 'XSIC',
    nameEn: 'Siachen Glacier',
    region: 'Asia',
    subregion: 'Southern Asia',
  },
  阿什莫尔和卡捷群岛: {
    id: 'XACC',
    nameEn: 'Ashmore and Cartier Islands',
    region: 'Oceania',
    subregion: 'Australia and New Zealand',
  },
}

const CHECK_ONLY = process.argv.slice(2).includes('--check')

/** 去掉末尾空白，与仓库里已有文件的格式保持一致 */
const normalize = (text) => text.replace(/\s+$/, '')

const sha256 = (text) => createHash('sha256').update(text).digest('hex')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 从 npm tarball 里取出指定的文件。
 *
 * tar 的结构很简单：512 字节一块的头 + 内容，文件名在头部前 100 字节，
 * 大小在 124–136 字节（八进制）。用 node:zlib 解 gzip，不引入第三方依赖。
 */
function extractFromTarball(gzipBuffer, wantedPath) {
  const tar = gunzipSync(gzipBuffer)
  let offset = 0
  let longName = null

  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512)
    if (header.every((byte) => byte === 0)) break

    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '')
    const prefix = header.subarray(345, 500).toString('utf8').replace(/\0.*$/, '')
    const size = Number.parseInt(header.subarray(124, 136).toString('utf8').replace(/\0.*$/, '').trim(), 8) || 0
    const type = String.fromCharCode(header[156])

    offset += 512
    const data = tar.subarray(offset, offset + size)
    offset += Math.ceil(size / 512) * 512

    // 长文件名：GNU tar 的 'L' 类型项，文件名在数据里
    if (type === 'L') {
      longName = data.toString('utf8').replace(/\0.*$/, '')
      continue
    }

    const fullName = longName ?? (prefix ? `${prefix}/${name}` : name)
    longName = null

    if ((type === '0' || type === '\0') && fullName === wantedPath) return data
  }

  return null
}

/** 拉取 tarball，带退避重试（本机解析域名走本地 DNS 代理，偶发失败） */
async function fetchTarball(pkg) {
  const url = `${REGISTRY}/${pkg.name}/-/${pkg.name.split('/').pop()}-${pkg.version}.tgz`
  let lastError
  for (let attempt = 0; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': '3D-earth geo updater' },
        // 超时是必须的：一次 TCP 挂起会让整个同步任务无限期停着
        signal: AbortSignal.timeout(120_000),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return Buffer.from(await response.arrayBuffer())
    } catch (error) {
      lastError = error
      if (attempt === 4) break
      await sleep(600 * (attempt + 1))
    }
  }
  throw new Error(`拉取 ${url} 失败：${lastError.message}`)
}

/** 拉取一个包并取出入口文件 */
async function fetchPackageFile(pkg) {
  const tarball = await fetchTarball(pkg)
  const data = extractFromTarball(tarball, pkg.entry)
  if (!data) throw new Error(`${pkg.name} 的 tarball 里没有 ${pkg.entry}`)
  return data.toString('utf8')
}

/**
 * 解析 un-m49 的地区划分表。
 *
 * 包里是一个 JS 字面量（`export const unM49 = [ { type: 1, name: 'Africa', ... } ]`）。
 * 这里逐字段用正则取值——**不执行远端代码**，同步脚本不引入任何第三方运行时。
 *
 * 层级：0 世界 / 1 大洲 / 2 次区域 / 3 中间区域 / 4 国家或地区。
 */
function parseM49(source) {
  const start = source.indexOf('export const unM49 = [')
  if (start < 0) throw new Error('上游包的结构变了：找不到 unM49 数组')

  const entries = []
  // 名字的引号两种写法都有（`'Kenya'` 与 `"Democratic People's Republic of Korea"`），
  // 也可能有转义引号，所以两种引号都收，名字部分用 `(?:[^'\\]|\\.)*` 匹配。
  const blockPattern =
    /\{\s*type:\s*(\d),\s*name:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")([\s\S]*?)\}/g
  let match
  while ((match = blockPattern.exec(source.slice(start))) !== null) {
    const [, type, singleQuoted, doubleQuoted, rest] = match
    const rawName = singleQuoted ?? doubleQuoted ?? ''
    const name = rawName.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    const code = /code:\s*'([^']*)'/.exec(rest)?.[1] ?? ''
    const iso3166 = /iso3166:\s*'([^']*)'/.exec(rest)?.[1] ?? ''
    const parent = /parent:\s*'([^']*)'/.exec(rest)?.[1] ?? ''
    entries.push({ type: Number(type), name, code, iso3166, parent })
  }

  if (entries.length < 250) {
    throw new Error(`解析出的 M49 条目偏少：${entries.length}`)
  }
  return entries
}

/**
 * 由 M49 层级推出大洲与次区域。
 *
 * 向上找：最近的 type 2/3 作次区域，type 1 作大洲。
 * 南极洲这类直接挂在世界下面的地区没有大洲祖先，用它自己的名字作大洲。
 */
function buildRegionLookup(entries) {
  const byCode = new Map(entries.map((entry) => [entry.code, entry]))
  const byIso = new Map(entries.filter((e) => e.iso3166).map((e) => [e.iso3166, e]))

  // 入参优先是 M49 数字码（上游要素自带），其次是 ISO 3166-1 alpha-3
  const lookup = (numericCode, iso3166) => {
    const entry = byCode.get(numericCode) ?? byIso.get(iso3166)
    if (!entry) return null
    let cursor = byCode.get(entry.parent)
    let subregion = ''
    let region = ''
    while (cursor) {
      if (!subregion && (cursor.type === 2 || cursor.type === 3)) subregion = cursor.name
      if (cursor.type === 1) {
        region = cursor.name
        break
      }
      cursor = byCode.get(cursor.parent)
    }
    if (!region && entry.type === 4) region = entry.name
    return { region, subregion, name: entry.name }
  }

  return lookup
}

/** 英文名：优先用运行时自带的地区名，回退到 M49 里的正式名 */
function buildEnglishNames(entries) {
  const display = new Intl.DisplayNames(['en'], { type: 'region' })
  const byIso = new Map(entries.filter((e) => e.iso3166).map((e) => [e.iso3166, e]))
  return (iso2, iso3) => {
    if (iso2 && iso2 !== '-99') {
      try {
        const name = display.of(iso2)
        if (name && name !== iso2) return name
      } catch {
        // Intl 认不出的代码走下面的兜底
      }
    }
    return byIso.get(iso3)?.name ?? ''
  }
}

/**
 * 把上游要素转成仓库里用的形状。
 *
 * 上游属性是 `iso_a2` / `iso_a3` / `iso_n3`，这里换成小写驼峰，
 * 运行时读起来更顺。
 */
function toProjectShape(feature, id, nameEn, region, subregion) {
  const source = feature.properties ?? {}
  const extra = EXTRA_ENTRIES[source.name]
  const properties = {
    name: source.name,
    fullName: source.full_name,
    nameEn: extra ? extra.nameEn : nameEn,
    iso2: extra ? '' : source.iso_a2,
    iso3: id,
    isoN3: extra ? '' : source.iso_n3,
    region: extra ? extra.region : region,
    subregion: extra ? extra.subregion : subregion,
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
  if (features.length < 200) {
    errors.push(`要素数偏少，应为 ${EXPECTED_FEATURES}，实际 ${features.length}`)
  }

  const seen = new Set()
  let vertexCount = 0
  for (const feature of features) {
    const props = feature.properties ?? {}
    const label = props.name || props.iso3 || '(未命名)'
    if (!props.name) errors.push(`要素 ${label} 缺少中文名`)
    if (!props.nameEn) errors.push(`要素 ${label} 缺少英文名`)
    if (!props.iso3) errors.push(`要素 ${label} 缺少标识`)
    if (props.iso3 && seen.has(props.iso3)) errors.push(`标识重复：${props.iso3}`)
    if (props.iso3) seen.add(props.iso3)
    if (!props.region) errors.push(`要素 ${label} 缺少大洲`)

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
  console.log('拉取世界国界数据（npm 官方源）…')
  const [geometryText, regionsText] = await Promise.all([
    fetchPackageFile(GEOMETRY_PACKAGE),
    fetchPackageFile(REGIONS_PACKAGE),
  ])

  let geometry
  try {
    geometry = JSON.parse(geometryText)
  } catch (error) {
    throw new Error(`上游返回的不是合法 JSON：${error.message}`)
  }

  const m49 = parseM49(regionsText)
  const lookupRegion = buildRegionLookup(m49)
  const lookupEnglish = buildEnglishNames(m49)

  const sourceFeatures = Array.isArray(geometry.features) ? geometry.features : []
  if (sourceFeatures.length === 0) throw new Error('上游没有返回任何要素')

  const features = []
  const usedExtra = new Set()

  for (const feature of sourceFeatures) {
    const name = feature.properties?.name
    const iso = feature.properties?.iso_a3
    const extra = EXTRA_ENTRIES[name]

    // 登记在 EXTRA_ENTRIES 里的要素用补的标识；其余的用上游的 ISO 代码。
    // 上游把阿什莫尔和卡捷群岛也标成了 AUS，靠 EXTRA_ENTRIES 把它摘出去，
    // 剩下的 AUS 才是澳大利亚本身——不依赖要素的先后顺序。
    let id
    if (extra) {
      if (usedExtra.has(name)) throw new Error(`EXTRA_ENTRIES 里 ${name} 重复`)
      usedExtra.add(name)
      id = extra.id
    } else {
      if (!iso || iso === '-99') {
        throw new Error(`要素 ${name} 没有可用的 ISO 代码，也没有登记在 EXTRA_ENTRIES 里`)
      }
      id = iso
    }

    // EXTRA_ENTRIES 里的地区没有 ISO 代码，M49 里也查不到，它们的
    // 大洲与次区域直接取自对照表。
    const m49Entry = extra ? null : lookupRegion(feature.properties?.iso_n3, iso)
    const region = extra ? extra.region : (m49Entry?.region ?? '')
    const subregion = extra ? extra.subregion : (m49Entry?.subregion ?? '')
    if (!region) {
      throw new Error(`要素 ${name} 在 M49 地区划分里找不到大洲`)
    }

    const nameEn = lookupEnglish(feature.properties?.iso_a2, id)
    features.push(toProjectShape(feature, id, nameEn, region, subregion))
  }

  // EXTRA_ENTRIES 里的条目必须都在上游存在，否则说明上游改名了，
  // 补标识的对照表要跟着更新。
  for (const name of Object.keys(EXTRA_ENTRIES)) {
    if (!usedExtra.has(name)) {
      throw new Error(`上游没有名为「${name}」的要素，EXTRA_ENTRIES 需要更新`)
    }
  }

  const geo = { type: 'FeatureCollection', features }

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
    return
  }

  if (CHECK_ONLY) {
    console.error(`✗ ${TARGET} 与上游不一致`)
    process.exitCode = 1
    return
  }

  await writeFile(path.join(ROOT, TARGET), text, 'utf8')
  console.log(
    `✓ 已更新 ${TARGET}：${features.length} 个国家/地区，${(text.length / 1024).toFixed(0)} KB，sha256=${sha256(text).slice(0, 12)}`,
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`\n更新失败：${error.message}`)
    process.exitCode = 1
  })
}
