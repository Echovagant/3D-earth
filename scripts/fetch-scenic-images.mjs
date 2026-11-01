/**
 * 按清单下载景区图片，放进仓库的 public/data/scenic/images/。
 *
 * 许可白名单写死在计划阶段：不在白名单的图**没有下载动作**，直接跳过并报告——
 * 所以「误抓一张有版权的图」在流程上不可能悄悄发生。署名完整性（author 与
 * sourceUrl 齐全）不在下载阶段把守，由 check-scenic.mjs 在入库前统一校验。
 *
 * 大图 960px、缩略图 320px，文件名按 Commons 文件名的 md5 前十六位，
 * 同一张图被多个景区引用时只落盘一份。**不二次压缩**：直接下 Commons 的
 * thumb（它本身就是压好的 JPEG），靠 thumb 地址里的宽度参数控制体积——
 * 本机不引入 ImageMagick 之类的压缩依赖。落盘前校验可解码、宽度与体积。
 *
 * 下载走 curl 子进程（Wikimedia 间歇性不可达是常态，见 fetch-scenic-skeleton.mjs
 * 顶部的实测记录）；已落盘的文件跳过，脚本可以反复重跑。
 *
 * 用法：node scripts/fetch-scenic-images.mjs [--dir <清单目录>]
 *
 * 测试钩子：SCENIC_UPLOAD_BASE 可覆盖图床域名（默认官方地址），
 * 本地 mock 上可离线跑通整条流水线。
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isAllowedLicense } from '../src/data/scenicRules.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SCENIC_DIR = join(ROOT, 'public', 'data', 'scenic')

/** 图床域名可用环境变量改：默认官方地址，改它是为了能在本地 mock 上跑通 */
const UPLOAD_BASE = process.env.SCENIC_UPLOAD_BASE ?? 'https://upload.wikimedia.org'

const UA = '3D-earth/1.0 (static study site)'

/** Windows 上是 curl.exe，Linux 上是 curl */
const CURL = process.platform === 'win32' ? 'curl.exe' : 'curl'

/** 退避间隔：1s → 2s → 4s */
const BACKOFF_MS = [1000, 2000, 4000]

/** 单次请求的 curl 超时（秒） */
const REQUEST_TIMEOUT = 25

/** 每张图要落盘的两个尺寸：suffix 拼在文件名上 */
const WIDTHS = [
  { width: 960, suffix: '', minPx: 800 },
  { width: 320, suffix: '-t', minPx: 300 },
]

/**
 * Commons 文件路径 → thumb 地址。
 *
 * 路径里的文件名可能含中文与括号，必须按 URL 规则编码；
 * 目录部分（两段哈希）是 ASCII，原样保留。
 */
export function commonsThumbUrl(commonsPath, width) {
  const parts = String(commonsPath).split('/')
  const name = parts.pop()
  const dir = parts.join('/')
  return `${UPLOAD_BASE}/wikipedia/commons/thumb/${dir}/${encodeURIComponent(name)}/${width}px-${encodeURIComponent(name)}`
}

/**
 * 接口给的 thumb 地址 → 换宽度的地址。
 *
 * Commons 已经算好了编码正确的地址，直接改宽度最省事，
 * 自己拼容易在中文名与括号上出错。
 * 查询串单独摘出来：尺寸段在文件名里，参数在文件名后面，不能一起替换。
 */
export function resizeThumbUrl(thumbUrl, width) {
  const url = String(thumbUrl ?? '')
  if (!url) return ''
  const [base, query] = url.split('?')
  const file = base.split('/').pop() ?? ''
  if (!/^\d+px-/.test(file)) return url
  const resized = base.replace(/\d+px-[^/]*$/, `${width}px-${file.replace(/^\d+px-/, '')}`)
  return query ? `${resized}?${query}` : resized
}

/** Commons 文件路径 → 原始页面地址（署名义务要给出这个） */
export function commonsFilePageUrl(commonsPath) {
  const name = String(commonsPath).split('/').pop()
  return `https://commons.wikimedia.org/wiki/File:${name}`
}

/** 落盘文件名：同一张图只存一份，大图与缩略图靠后缀区分 */
export function targetFileName(md5, width) {
  const suffix = WIDTHS.find((w) => w.width === width)?.suffix ?? ''
  // 没有 md5 字段时拿文件名兜当去重键，先把自带的 .jpg 剥掉再拼后缀，
  // 否则会拼出 x.jpg.jpg 这种名字
  const base = String(md5).slice(0, 16).replace(/\.jpe?g$/i, '')
  return `${base}${suffix}.jpg`
}

/**
 * 决定要下哪些、跳过哪些。
 *
 * 计划的单位是「源图片」（一张图对应大图 + 缩略图两个落盘文件）：
 * 许可不在白名单的记进 skipped；两个文件都已存在的不再计划；
 * 同一张图被多个景区引用时只计划一次。许可检查是这里唯一把守的合规关口。
 */
export function planImages(scenics, existing) {
  const downloads = []
  const skipped = []
  const planned = new Set()
  for (const s of scenics ?? []) {
    for (const img of s.images ?? []) {
      if (!isAllowedLicense(img.license)) {
        skipped.push({ id: s.id, file: img.file, reason: `许可 ${img.license} 不在白名单` })
        continue
      }
      const md5 = img.md5 ?? img.file
      const large = targetFileName(md5, WIDTHS[0].width)
      const thumb = targetFileName(md5, WIDTHS[1].width)
      if (existing.has(large) && existing.has(thumb)) continue
      if (planned.has(md5)) continue
      planned.add(md5)
      downloads.push({
        id: s.id,
        md5,
        commonsPath: img.commonsPath ?? '',
        // 接口给的地址已经编码好，比自己拼可靠；缩略图与大图分别取
        thumbUrl: img.thumbUrl ?? '',
        thumbUrlSmall: img.thumbUrlSmall ?? '',
        sourceUrl: img.sourceUrl ?? '',
        large,
        thumb,
      })
    }
  }
  return { downloads, skipped }
}

/**
 * 从 JPEG 的 SOF 段里读出宽高；不是 JPEG 或读不出来都返回 null。
 *
 * 只扫段标记不完整解码——落盘前的体检够用，真要解码是浏览器的事。
 */
export function jpegSize(buffer) {
  if (!buffer || buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null
  let i = 2
  while (i + 9 < buffer.length) {
    if (buffer[i] !== 0xff) {
      i += 1
      continue
    }
    const marker = buffer[i + 1]
    // 独立标记（SOI、EOI、重启段）没有长度字段
    if (marker === 0xff || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2
      continue
    }
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buffer.readUInt16BE(i + 5), width: buffer.readUInt16BE(i + 7) }
    }
    const segmentLength = buffer.readUInt16BE(i + 2)
    if (segmentLength < 2) return null
    i += 2 + segmentLength
  }
  return null
}

/**
 * 带 UA 与重试的二进制 GET——与骨架脚本的 fetchWithRetry 同一套退避节奏。
 *
 * 不直接复用它是因为那边按 UTF-8 文本解码，图片按文本解再转回缓冲区会坏；
 * 而本任务的文件清单里没有改骨架脚本的许可，所以在这里放一个二进制版。
 */
export function fetchBufferWithRetry(url, tries = 4) {
  let lastError = null
  for (let i = 0; i < tries; i += 1) {
    try {
      const out = execFileSync(
        CURL,
        ['-sS', '--max-time', String(REQUEST_TIMEOUT), '-H', `User-Agent: ${UA}`, url],
        { encoding: 'buffer', maxBuffer: 32 * 1024 * 1024, timeout: (REQUEST_TIMEOUT + 5) * 1000 },
      )
      if (out && out.length) return out
      lastError = new Error('空响应')
    } catch (e) {
      lastError = e
    }
    if (i < tries - 1) {
      const waitMs = BACKOFF_MS[Math.min(i, BACKOFF_MS.length - 1)]
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitMs)
    }
  }
  throw lastError ?? new Error(`取不到 ${url}`)
}

/** 读清单：保留完整结构（图片条目里有 md5 与 commonsPath），写回时要用 */
function readManifests(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((file) => {
      try {
        return { file, raw: JSON.parse(readFileSync(join(dir, file), 'utf8')) }
      } catch (error) {
        console.error(`跳过 ${file}：JSON 解析失败（${error.message}）`)
        return null
      }
    })
    .filter(Boolean)
}

/**
 * 校验一张抓回来的图：可解码、宽度达标。
 *
 * 体积不在这里管：Commons 的 thumb 只缩放不压缩，原始体积本来就偏大，
 * 压缩交给 optimize-scenic-images.mjs（runner 上有 ImageMagick）。
 */
function checkImage(buffer, minPx) {
  const size = jpegSize(buffer)
  if (!size) return '内容不是可解码的 JPEG'
  if (size.width < minPx) return `宽度 ${size.width}px，不足 ${minPx}px`
  return ''
}

function parseArgs(argv) {
  const args = { dir: SCENIC_DIR, tries: 4 }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--dir') args.dir = argv[++i]
    else if (argv[i] === '--tries') args.tries = Number(argv[++i]) || args.tries
  }
  return args
}

function printSummary(report) {
  for (const province of report.provinces) {
    const skipNote = province.skipped ? `，跳过 ${province.skipped} 张` : ''
    const failNote = province.failed ? `，失败 ${province.failed} 张` : ''
    console.log(`${province.adcode}：新增 ${province.downloaded} 张${skipNote}${failNote}`)
  }
  console.log(
    `合计：新增 ${report.totalWritten} 个文件，跳过 ${report.totalSkipped} 张图，` +
      `失败 ${report.totalFailed} 张，清单更新 ${report.manifestsUpdated} 份`,
  )
  if (report.failures.length) {
    console.log(`\n=== 失败的：${report.failures.length} 条（重跑会自动补） ===`)
    for (const failure of report.failures) {
      console.log(`${failure.id} ${failure.name}：${failure.error}`)
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const manifests = readManifests(args.dir)
  if (!manifests.length) {
    console.error(`没读到景区清单：${args.dir}`)
    process.exitCode = 1
    return
  }
  const imageDir = join(args.dir, 'images')
  mkdirSync(imageDir, { recursive: true })
  const existing = new Set(readdirSync(imageDir))

  const plan = planImages(
    manifests.flatMap((m) => m.raw.scenics ?? []),
    existing,
  )

  const report = {
    provinces: [],
    failures: [],
    totalWritten: 0,
    totalSkipped: plan.skipped.length,
    totalFailed: 0,
    manifestsUpdated: 0,
  }

  for (const download of plan.downloads) {
    for (const { width, suffix, minPx } of WIDTHS) {
      const name = suffix ? download.thumb : download.large
      if (existing.has(name)) continue
      // 优先用接口给的地址（编码正确）；没有就按路径自己拼
      const url =
        (suffix ? download.thumbUrlSmall : download.thumbUrl) ||
        resizeThumbUrl(download.thumbUrl, width) ||
        commonsThumbUrl(download.commonsPath, width)
      if (!url) {
        const failure = { id: download.id, name, error: '缺 commonsPath 与 thumbUrl，拼不出下载地址' }
        report.failures.push(failure)
        report.totalFailed += 1
        continue
      }
      try {
        const buffer = fetchBufferWithRetry(url, args.tries)
        const problem = checkImage(buffer, minPx)
        if (problem) throw new Error(problem)
        writeFileSync(join(imageDir, name), buffer)
        existing.add(name)
        report.totalWritten += 1
      } catch (error) {
        const failure = {
          id: download.id,
          name,
          error: String(error?.message ?? error).split('\n')[0],
        }
        report.failures.push(failure)
        report.totalFailed += 1
      }
    }
  }

  // 落盘成功后把清单里的 file 字段补上：大图文件名，缩略图按 -t 后缀约定推导
  for (const m of manifests) {
    let changed = false
    for (const s of m.raw.scenics ?? []) {
      for (const img of s.images ?? []) {
        if (!img.md5) continue
        const large = targetFileName(img.md5, WIDTHS[0].width)
        // 大图在位就写：缩略图只是列表里的缩略，缺了不影响页面显示
        if (existing.has(large) && img.file !== large) {
          img.file = large
          changed = true
        }
      }
    }
    if (changed) {
      writeFileSync(join(args.dir, m.file), `${JSON.stringify(m.raw, null, 2)}\n`, 'utf8')
      report.manifestsUpdated += 1
    }
  }

  // 分省小结：跳过计在清单所在省头上，失败按下载条目记
  for (const m of manifests) {
    const adcode = m.raw.adcode ?? m.file.replace('.json', '')
    const skipped = plan.skipped.filter((s) => (m.raw.scenics ?? []).some((scenic) => scenic.id === s.id)).length
    const failed = report.failures.filter((f) => (m.raw.scenics ?? []).some((scenic) => scenic.id === f.id)).length
    const downloaded = (m.raw.scenics ?? []).reduce(
      (n, s) => n + (s.images ?? []).filter((img) => img.md5 && existing.has(targetFileName(img.md5, WIDTHS[0].width))).length,
      0,
    )
    report.provinces.push({ adcode, downloaded, skipped, failed })
  }

  printSummary(report)
}

if (basename(process.argv[1] ?? '') === 'fetch-scenic-images.mjs') {
  main()
}
