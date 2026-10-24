#!/usr/bin/env node
/**
 * 数据源体检：上游是否还可达、许可是否还与登记一致。
 *
 * 目的：把「记得去查一下上游有没有改条款、是不是还活着」这件事交给机器。
 * 每周的同步任务里跑一次；上游下线、改名或改了许可，这里就会红。
 *
 * 用法：
 *   node scripts/check-licenses.mjs          体检并打印报告
 *   node scripts/check-licenses.mjs --quiet  只在有问题时输出
 *
 * 退出码：有源不可达、许可与登记不符、或登记文件缺项时为 1。
 */

import { gunzipSync } from 'node:zlib'
import { readFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const QUIET = process.argv.slice(2).includes('--quiet')
const REGISTRY = 'https://registry.npmjs.org'

/**
 * 全部在用的数据源。
 *
 * `license` 填的是上游声明的许可原文（npm 包取 package.json 的 license 字段），
 * 与 LICENSES.md 里登记的一致；不一致就说明上游改了条款。
 */
const SOURCES = [
  {
    id: 'datav',
    name: 'DataV.GeoAtlas 行政区划边界',
    kind: 'http',
    url: 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
    // 上游没有单独的许可声明，它提供的是公开接口数据
    license: null,
  },
  {
    id: 'sbsm',
    name: '标准地图服务系统',
    kind: 'http',
    // 标准地图服务系统的检索接口（表单 POST，返回标准地图清单与审图号）
    url: 'http://bzdt.ch.mnr.gov.cn/sbsm/supermap/searchPicture.do',
    post: {
      seachText: '',
      scale: '',
      size: '',
      pageNum: '1',
      orderSearch: '',
      superclass: '中国全图',
      subclass: '',
      smallclass: '',
      border: '',
      largeclass: '',
    },
    license: null,
  },
  {
    id: 'surbowl',
    name: '@surbowl/world-geo-json-zh',
    kind: 'npm',
    pkg: { name: '@surbowl/world-geo-json-zh', version: '2.1.5', entry: 'package/package.json' },
    license: 'Unlicense',
  },
  {
    id: 'un-m49',
    name: 'un-m49',
    kind: 'npm',
    pkg: { name: 'un-m49', version: '2.2.0', entry: 'package/package.json' },
    license: 'MIT',
  },
  {
    id: 'nasa',
    name: 'NASA Blue Marble 地球影像',
    kind: 'http',
    // 贴图的上游原图（仓库里是缩放调色后的 4096×2048 版）
    url: 'https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/july/world.topo.bathy.200407.3x5400x2700.jpg',
    license: null,
  },
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchWithRetry(url, { retries = 3, timeout = 60_000, headers = {} } = {}) {
  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': '3D-earth geo updater', ...headers },
        signal: AbortSignal.timeout(timeout),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response
    } catch (error) {
      lastError = error
      if (attempt === retries) break
      await sleep(800 * (attempt + 1))
    }
  }
  throw new Error(lastError.message)
}

/** 从 npm tarball 里取出指定的文件 */
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
    if (type === 'L') { longName = data.toString('utf8').replace(/\0.*$/, ''); continue }
    const fullName = longName ?? (prefix ? `${prefix}/${name}` : name)
    longName = null
    if ((type === '0' || type === '\0') && fullName === wantedPath) return data
  }
  return null
}

/** 体检一个数据源 */
async function checkSource(source) {
  try {
    if (source.kind === 'http') {
      const urls = source.urls ?? [source.url]
      let lastError = null
      let lastStatus = 0
      for (const url of urls) {
        try {
          // 不抛异常地探测：状态码本身要用来区分「源失效」和「网络不通」
          const response = await fetch(url, {
            method: source.post ? 'POST' : 'GET',
            headers: {
              'User-Agent': '3D-earth geo updater',
              ...(source.post
                ? { 'Content-Type': 'application/x-www-form-urlencoded' }
                : { Range: 'bytes=0-0' }),
            },
            ...(source.post ? { body: new URLSearchParams(source.post).toString() } : {}),
            signal: AbortSignal.timeout(45_000),
          })
          if (response.ok || response.status === 206) {
            const bytes = response.headers.get('content-length')
            // 表单 POST 的接口用 Range 探测没有意义，得看一眼正文才敢说它活着
            if (source.post) {
              const body = await response.text()
              if (!body.trim()) {
                lastStatus = response.status
                lastError = new Error('HTTP 200 但正文为空')
                continue
              }
              return {
                ok: true,
                detail: `可达（HTTP ${response.status}，POST 正常返回 ${Math.round(body.length / 1024)} KB）`,
              }
            }
            return {
              ok: true,
              detail: `可达（HTTP ${response.status}${bytes ? `，${Math.round(Number(bytes) / 1024)} KB` : ''}）`,
            }
          }
          lastStatus = response.status
          lastError = new Error(`HTTP ${response.status}`)
        } catch (error) {
          lastError = error
        }
      }
      // 404/410 是上游真的没了；其它状态码或连接错误多半是本机网络问题
      if (lastStatus === 404 || lastStatus === 410) {
        return { ok: false, detail: `上游已失效（HTTP ${lastStatus}）` }
      }
      return { ok: false, detail: `本机网络不通（${lastError?.message ?? '未知错误'}）` }
    }

    const url = `${REGISTRY}/${source.pkg.name}/-/${source.pkg.name.split('/').pop()}-${source.pkg.version}.tgz`
    const response = await fetchWithRetry(url, { retries: 2, timeout: 120_000 })
    const tarball = Buffer.from(await response.arrayBuffer())
    const entry = extractFromTarball(tarball, source.pkg.entry)
    if (!entry) return { ok: false, detail: `tarball 里没有 ${source.pkg.entry}` }
    const manifest = JSON.parse(entry.toString('utf8'))
    const license = manifest.license ?? null
    if (source.license && license !== source.license) {
      return { ok: false, detail: `许可与登记不符：上游是 ${license ?? '(无)'}，登记是 ${source.license}` }
    }
    return { ok: true, detail: `可达（v${manifest.version}，许可 ${license ?? '未声明'}）` }
  } catch (error) {
    return { ok: false, detail: `不可达：${error.message}` }
  }
}

async function main() {
  const results = []
  for (const source of SOURCES) {
    const result = await checkSource(source)
    results.push({ source, ...result })
    if (!QUIET || !result.ok) {
      console.log(`  ${result.ok ? '✓' : '✗'} ${source.name.padEnd(30, ' ')} ${result.detail}`)
    }
  }

  // 登记完整性：每个源都要在 LICENSES.md 里出现
  let licensesText = ''
  try {
    licensesText = await readFile(path.join(ROOT, 'LICENSES.md'), 'utf8')
  } catch {
    console.error('  ✗ 找不到 LICENSES.md')
    process.exitCode = 1
    return
  }
  const missing = SOURCES.filter((s) => !licensesText.includes(s.name.split(' ')[0]) && !licensesText.includes(s.id))
  if (missing.length > 0) {
    for (const s of missing) console.log(`  ✗ LICENSES.md 没有登记 ${s.name}`)
    process.exitCode = 1
  }

  const failed = results.filter((r) => !r.ok)
  if (failed.length === 0) {
    console.log(`\n✓ ${SOURCES.length} 个数据源全部可达，许可与登记一致`)
  } else {
    console.error(`\n✗ ${failed.length} 个数据源有问题：${failed.map((r) => r.source.name).join('、')}`)
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`\n体检失败：${error.message}`)
    process.exitCode = 1
  })
}
