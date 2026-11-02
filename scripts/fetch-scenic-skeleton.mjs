/**
 * 抓景区骨架：名字 → Wikidata 实体 → 坐标、图片候选、许可。
 *
 * **产物不入库**：它是抓取的原始输出，含未经核实的许可信息。
 * 核过之后的结果写进 public/data/scenic/<adcode>.json，那才是唯一真相源。
 *
 * 为什么用 curl 而不是 node 的 fetch：实测（2026-10-25）本机 node fetch 连
 * upload.wikimedia.org 与 www.wikidata.org 全部 11 秒超时，curl 能通但会间歇性失败。
 * 所以走 curl 子进程，并且每个请求都重试。
 *
 * 抓取是「尽力而为」的：单个景区取不到不中断整轮，失败原因记进产物的 failures，
 * 重跑时已取到的条目跳过（断点续跑）。
 *
 * 用法：node scripts/fetch-scenic-skeleton.mjs --out <file>
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isAllowedLicense } from '../src/data/scenicRules.js'

// UA 带上仓库地址：Wikimedia 的 UA 政策要求能识别调用方，不带联系方式的 UA 更容易被限流
const UA = '3D-earth/1.0 (https://github.com/Echovagant/3D-earth; static study site)'

// 接口地址可用环境变量改：默认值就是官方地址，改它是为了能在本地 mock 上跑通整条流水线
const API = process.env.WIKIDATA_API ?? 'https://www.wikidata.org/w/api.php'
const COMMONS_API = process.env.COMMONS_API ?? 'https://commons.wikimedia.org/w/api.php'
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SCENIC_DIR = join(ROOT, 'public', 'data', 'scenic')

/** Windows 上是 curl.exe，Linux 上是 curl */
const CURL = process.platform === 'win32' ? 'curl.exe' : 'curl'

/** 退避间隔：1s → 2s → 4s */
const BACKOFF_MS = [1000, 2000, 4000]

/** 单次请求的 curl 超时（秒） */
const REQUEST_TIMEOUT = 25

/**
 * 两次请求之间的最小间隔。
 *
 * 实测（2026-11-01，GitHub runner）：一百多个景区零间隔连发，第 4 个请求起
 * 就被 Wikimedia 限流（HTTP 429「You are making too many requests」）。
 * 500ms 间隔（120 次/分钟）远低于读接口的阈值，代价是整轮多几分钟。
 */
const MIN_REQUEST_GAP_MS = 500

/** 上一次请求发出的时刻：限流靠间隔控制，不在响应后再等 */
let lastRequestAt = 0

/** 实体编号的形状：Q + 数字 */
const QID_PATTERN = /^Q\d+$/

/**
 * 产物默认落 D 盘（系统盘空间紧张），没有 D 盘的环境退回系统临时目录。
 *
 * 临时数据不入库，D 盘的 .tmp 目录也不在版本控制里。
 */
function defaultOutPath() {
  if (process.env.SCENIC_SKELETON_OUT) return process.env.SCENIC_SKELETON_OUT
  if (process.platform === 'win32' && existsSync('D:/')) {
    return 'D:/Projects/3D-earth/.tmp/scenic-skeleton.json'
  }
  return join(tmpdir(), 'scenic-skeleton.json')
}

/**
 * 同步等待。
 *
 * fetchWithRetry 是同步接口（Task 3 直接调用它取文本），同步函数里不能 await，
 * 所以用 Atomics.wait 而不是 node:timers/promises 的 setTimeout——后者只能异步用。
 */
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

/**
 * 带 UA、限流间隔与重试的 GET。
 *
 * --fail 让 HTTP 错误（429 限流、5xx）走 curl 的失败路径：execFileSync 抛错、
 * 进重试退避——不加它的话限流页会被当成功返回，JSON 解析才报错，重试没机会触发。
 */
export function fetchWithRetry(url, tries = 4) {
  let lastError = null
  for (let i = 0; i < tries; i += 1) {
    // 距上次请求不足间隔就等一等：限流靠控制发出节奏，不靠失败后硬扛
    const gap = MIN_REQUEST_GAP_MS - (Date.now() - lastRequestAt)
    if (gap > 0) sleepSync(gap)
    lastRequestAt = Date.now()
    try {
      const out = execFileSync(
        CURL,
        ['-sS', '--fail', '--max-time', String(REQUEST_TIMEOUT), '-H', `User-Agent: ${UA}`, url],
        { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: (REQUEST_TIMEOUT + 5) * 1000 },
      )
      if (out && out.trim()) return out
      lastError = new Error('空响应')
    } catch (e) {
      lastError = e
    }
    if (i < tries - 1) sleepSync(BACKOFF_MS[Math.min(i, BACKOFF_MS.length - 1)])
  }
  throw lastError ?? new Error(`取不到 ${url}`)
}

/** 取 JSON：解析失败或接口报错都要说清楚是哪一种 */
function fetchJson(url, tries = 4) {
  const text = fetchWithRetry(url, tries)
  let json
  try {
    json = JSON.parse(text)
  } catch (error) {
    throw new Error(`响应不是 JSON：${error.message}｜开头：${text.slice(0, 120)}`)
  }
  if (json?.error) {
    throw new Error(`接口报错：${json.error.code ?? ''} ${json.error.info ?? ''}`.trim())
  }
  return json
}

/** 中文维基标题 → Wikidata 实体 */
export function buildSearchUrl(title) {
  const q = encodeURIComponent(title)
  return `${API}?action=wbgetentities&sites=zhwiki&titles=${q}&props=info%7Clabels%7Cclaims&languages=zh-cn%7Czh%7Cen&format=json`
}

/** 取单个实体的完整数据 */
export function buildEntityUrl(qid) {
  return `${API}?action=wbgetentities&ids=${encodeURIComponent(qid)}&props=info%7Clabels%7Cclaims&format=json`
}

/**
 * 标题查不到时的兜底：按名字模糊搜实体。
 *
 * 景区常用名与中文维基标题常常对不上（同一个地方可能有「亚丁」和「稻城亚丁」两个条目），
 * 精确匹配落空时用搜索兜底，取候选里的第一个。
 */
export function buildFallbackSearchUrl(title) {
  const q = encodeURIComponent(title)
  return `${API}?action=wbsearchentities&search=${q}&language=zh&uselang=zh&type=item&limit=5&format=json`
}

/**
 * Commons 文件名 → 文件信息地址（许可、作者、缩略图地址都在里面）。
 *
 * 缩略图地址由接口给出：自己拼要在中文名、括号与追踪参数上踩坑，
 * 而接口给的地址是编码正确的。
 */
export function buildImageInfoUrl(file, width = 960) {
  const title = encodeURIComponent(`File:${file}`)
  return `${COMMONS_API}?action=query&titles=${title}&prop=imageinfo&iiprop=url%7Csize%7Cmime%7Csha1%7Cextmetadata%7Cuser&iiurlwidth=${width}&format=json`
}

/** 从实体 JSON 里取出我们要的字段 */
export function parseEntity(json) {
  const entities = json?.entities ?? {}
  const [key, entity] = Object.entries(entities)[0] ?? []
  if (!entity) return { qid: null, label: '', coords: null, images: [] }

  // 标题查询的响应里键名是中文标题，真正的编号在 entity.id 上
  const qid = entity.id ?? (QID_PATTERN.test(key ?? '') ? key : null)
  const label = entity.labels?.['zh-cn']?.value ?? entity.labels?.zh?.value ?? entity.labels?.en?.value ?? ''

  const coordClaim = entity.claims?.P625?.[0]?.mainsnak?.datavalue?.value
  // 别的天体的坐标对这个地球没用
  const onEarth = !coordClaim?.globe || coordClaim.globe === 'earth'
  const coords = coordClaim && onEarth ? [Number(coordClaim.latitude), Number(coordClaim.longitude)] : null

  const images = []
  for (const claim of entity.claims?.P18 ?? []) {
    const file = claim?.mainsnak?.datavalue?.value
    if (typeof file === 'string' && file) {
      images.push({ file, license: '', author: '', sourceUrl: '', thumbUrl: '' })
    }
  }
  return { qid: qid ?? null, label, coords, images }
}

/** Commons 的作者字段是 HTML 片段，拆成纯文本 */
function stripHtml(text) {
  return String(text ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/** 取第一个非空的文本 */
function firstText(...values) {
  for (const value of values) {
    const text = String(value ?? '').trim()
    if (text) return text
  }
  return ''
}

/** Commons 原图地址 → 存储路径（thumb 地址要用它拼） */
/**
 * Commons 原图地址 → 存储路径（thumb 地址要用它拼）。
 *
 * Commons 返回的 url 后面常跟一串追踪参数（?utm_source=…），
 * 直接拿去拼 thumb 地址会 404——先剥掉查询串与锚点再取路径。
 */
function commonsPathOf(url) {
  const clean = String(url ?? '').split(/[?#]/)[0]
  const matched = /\/wikipedia\/commons\/((?:[^/]+\/){2}[^/]+)$/.exec(clean)
  return matched ? decodeURIComponent(matched[1]) : ''
}

/**
 * 文件名的 md5，当作去重键。
 *
 * Commons 的接口不给文件内容的 md5（只给 sha1），而文件名在 Commons 上唯一，
 * 同名即同一张图——拿去重够用；内容相同但改名上传的图不会被合并，这是本任务的取舍。
 */
function md5Of(file) {
  return createHash('md5').update(String(file ?? '')).digest('hex')
}

/**
 * Commons 文件信息 → 图片候选。
 *
 * allowed 走 Task 1 的许可白名单：不在白名单的图没有下载动作，内容生产时直接跳过。
 */
export function parseImageInfo(json, file) {
  const pages = json?.query?.pages ?? {}
  const page = Object.values(pages)[0]
  const info = page?.imageinfo?.[0]
  if (!info) {
    return {
      file,
      commonsPath: '',
      md5: md5Of(file),
      sha1: '',
      license: '',
      author: '',
      sourceUrl: '',
      thumbUrl: '',
      restrictions: '',
      allowed: false,
    }
  }
  const meta = info.extmetadata ?? {}
  const license = firstText(
    meta.LicenseShortName?.value,
    meta.UsageTerms?.value,
    meta.License?.value,
  )
  return {
    file,
    commonsPath: commonsPathOf(info.url),
    md5: md5Of(file),
    sha1: String(info.sha1 ?? ''),
    license,
    author: stripHtml(meta.Artist?.value ?? meta.Credit?.value ?? ''),
    sourceUrl: String(info.descriptionurl ?? ''),
    thumbUrl: String(info.thumburl ?? ''),
    // 小尺寸的地址由接口另给一次（iiurlwidth=320）：
    // 自己把 960 的地址改成 320 不可靠，Commons 对某些尺寸会回错误页
    thumbUrlSmall: '',
    restrictions: stripHtml(meta.Restrictions?.value ?? ''),
    allowed: isAllowedLicense(license),
  }
}

/** 读清单：每个省一份，景区名在里面 */
function readScenicList(dir) {
  if (!existsSync(dir)) return []
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
  const list = []
  for (const file of files) {
    let raw
    try {
      raw = JSON.parse(readFileSync(join(dir, file), 'utf8'))
    } catch (error) {
      console.error(`跳过 ${file}：JSON 解析失败（${error.message}）`)
      continue
    }
    const adcode = raw.adcode ?? file.replace('.json', '')
    const scenics = (raw.scenics ?? [])
      .filter((s) => s?.name)
      .map((s) => ({ id: s.id, name: s.name }))
    list.push({ adcode, scenics })
  }
  return list
}

/**
 * 名字 → 实体。
 *
 * 先按中文维基标题精确查，查不到再用名字模糊搜兜底。
 */
function resolveEntity(name, tries) {
  const exact = parseEntity(fetchJson(buildSearchUrl(name), tries))
  if (exact.qid) return exact

  const fallback = fetchJson(buildFallbackSearchUrl(name), tries)
  const hit = (fallback?.search ?? []).find((item) => item?.id)
  if (!hit) return { qid: null, label: '', coords: null, images: [] }
  return parseEntity(fetchJson(buildEntityUrl(hit.id), tries))
}

/**
 * 给图片候选补上许可、作者与地址；单张取不到就保留候选，许可留空等人工核。
 *
 * 大图与缩略图的地址分别向接口要一次（iiurlwidth=960 / 320）：
 * 接口给的地址编码正确，自己改宽��不可靠。
 */
function enrichImages(images, tries) {
  const enriched = []
  for (const image of images ?? []) {
    try {
      const info = parseImageInfo(fetchJson(buildImageInfoUrl(image.file, 960), tries), image.file)
      try {
        const small = parseImageInfo(fetchJson(buildImageInfoUrl(image.file, 320), tries), image.file)
        info.thumbUrlSmall = small.thumbUrl
      } catch {
        // 小尺寸的地址拿不到就空着：图片脚本会退回按路径拼
      }
      enriched.push(info)
    } catch (error) {
      enriched.push({
        ...image,
        commonsPath: '',
        md5: md5Of(image.file),
        sha1: '',
        restrictions: '',
        allowed: false,
        error: String(error?.message ?? error),
      })
    }
  }
  return enriched
}

/** 读上一轮的产物，用来断点续跑 */
function loadPrevious(file) {
  if (!existsSync(file)) return { scenics: new Map(), failures: new Map() }
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8'))
    const scenics = new Map()
    for (const province of raw.provinces ?? []) {
      for (const scenic of province.scenics ?? []) {
        if (scenic?.qid) scenics.set(`${province.adcode}/${scenic.id}`, scenic)
      }
    }
    const failures = new Map()
    for (const failure of raw.failures ?? []) {
      failures.set(`${failure.adcode}/${failure.id}`, failure)
    }
    return { scenics, failures }
  } catch (error) {
    console.error(`上一轮产物读不了（${error.message}），从头开始`)
    return { scenics: new Map(), failures: new Map() }
  }
}

/** 落盘：每抓完一个省写一次，中断也不丢已取到的 */
function writeOut(file, result) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
}

function parseArgs(argv) {
  const args = {
    out: defaultOutPath(),
    dir: SCENIC_DIR,
    only: null,
    tries: 4,
    images: true,
    budget: 600,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--out') args.out = argv[++i]
    else if (arg === '--dir') args.dir = argv[++i]
    else if (arg === '--only') {
      args.only = String(argv[++i] ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    } else if (arg === '--tries') args.tries = Number(argv[++i]) || args.tries
    else if (arg === '--no-images') args.images = false
    else if (arg === '--budget') args.budget = Number(argv[++i]) || 0
  }
  return args
}

function printSummary(result) {
  const all = result.provinces.flatMap((p) => p.scenics)
  const resolved = all.filter((s) => s.qid).length
  const withCoords = all.filter((s) => Array.isArray(s.coords)).length
  const withImages = all.filter((s) => (s.images ?? []).length > 0).length
  const allowed = all.reduce(
    (n, s) => n + (s.images ?? []).filter((i) => i.allowed).length,
    0,
  )
  console.log(
    `省 ${result.provinces.length} 个，景区 ${resolved}/${all.length} 个解析成功，` +
      `有坐标 ${withCoords} 个，有图片候选 ${withImages} 个（许可可用 ${allowed} 张）`,
  )
  if (result.failures.length) {
    console.log(`\n=== 没抓到的：${result.failures.length} 条 ===`)
    for (const failure of result.failures) {
      console.log(`${failure.adcode} ${failure.name}：${failure.error}`)
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const provinces = readScenicList(args.dir).filter(
    (p) => !args.only || args.only.includes(p.adcode),
  )
  if (!provinces.length) {
    console.error(`没读到景区清单：${args.dir}`)
    process.exitCode = 1
    return
  }

  const previous = loadPrevious(args.out)
  const result = {
    generatedAt: new Date().toISOString(),
    source: 'wikidata + commons',
    provinces: [],
    failures: [],
  }
  const startedAt = Date.now()

  for (const province of provinces) {
    const entry = { adcode: province.adcode, scenics: [] }
    for (const scenic of province.scenics) {
      const key = `${province.adcode}/${scenic.id}`
      const cached = previous.scenics.get(key)
      if (cached) {
        entry.scenics.push(cached)
        previous.failures.delete(key)
        continue
      }
      if (args.budget && Date.now() - startedAt > args.budget * 1000) {
        const failure = { adcode: province.adcode, id: scenic.id, name: scenic.name, error: '超过时间预算，没抓' }
        previous.failures.set(key, failure)
        continue
      }
      try {
        const entity = resolveEntity(scenic.name, args.tries)
        if (!entity.qid) throw new Error('中文维基标题查不到对应实体')
        const images = args.images ? enrichImages(entity.images, args.tries) : entity.images
        entry.scenics.push({
          id: scenic.id,
          name: scenic.name,
          qid: entity.qid,
          label: entity.label,
          coords: entity.coords,
          images,
        })
        previous.failures.delete(key)
        console.log(`${province.adcode} ${scenic.name} → ${entity.qid} ${entity.label ?? ''}`)
      } catch (error) {
        const failure = {
          adcode: province.adcode,
          id: scenic.id,
          name: scenic.name,
          error: String(error?.message ?? error),
        }
        previous.failures.set(key, failure)
        console.error(`${province.adcode} ${scenic.name}：${failure.error}`)
      }
    }
    result.provinces.push(entry)
    result.failures = [...previous.failures.values()]
    writeOut(args.out, result)
  }

  result.failures = [...previous.failures.values()]
  writeOut(args.out, result)
  printSummary(result)
  console.log(`\n产物：${args.out}`)
}

if (basename(process.argv[1] ?? '') === 'fetch-scenic-skeleton.mjs') {
  main()
}
