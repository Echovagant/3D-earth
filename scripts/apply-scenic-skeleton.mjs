/**
 * 把骨架产物灌进景区清单：补上每个景区的图片候选与许可信息。
 *
 * 骨架是抓取的原始输出（名字 → Wikidata 实体 → 坐标、图片候选、许可），
 * 清单是人工核过许可之后的人话版。两者的关系是：
 *
 *   骨架 ──本脚本──→ 清单的 images[] ──fetch-scenic-images.mjs──→ 仓库里的图片文件
 *
 * 只有白名单内的图片会被写进清单；不在白名单的记进 skipped，报告里列出来。
 * 清单里已有的图片条目不会被覆盖——人工确认过的信息优先。
 *
 * 用法：node scripts/apply-scenic-skeleton.mjs --skeleton <骨架.json> [--dir <清单目录>]
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isAllowedLicense } from '../src/data/scenicRules.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SCENIC_DIR = join(ROOT, 'public', 'data', 'scenic')

/** 只收有文件名与许可的候选；许可的判定交给白名单 */
function usableImages(images) {
  return (images ?? []).filter(
    (img) => img?.file && img?.commonsPath && img?.license && isAllowedLicense(img.license),
  )
}

function parseArgs(argv) {
  const args = { skeleton: 'D:/Projects/3D-earth/.tmp/scenic-skeleton.json', dir: SCENIC_DIR }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--skeleton') args.skeleton = argv[++i]
    else if (argv[i] === '--dir') args.dir = argv[++i]
  }
  return args
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!existsSync(args.skeleton)) {
    console.error(`找不到骨架文件：${args.skeleton}`)
    process.exitCode = 1
    return
  }
  const skeleton = JSON.parse(readFileSync(args.skeleton, 'utf8'))

  // 骨架按 省/景区id 索引
  const byKey = new Map()
  for (const province of skeleton.provinces ?? []) {
    for (const scenic of province.scenics ?? []) {
      if (scenic?.id) byKey.set(`${province.adcode}/${scenic.id}`, scenic)
    }
  }
  if (!byKey.size) {
    console.error(`骨架里没有景区：${args.skeleton}`)
    process.exitCode = 1
    return
  }

  const files = existsSync(args.dir) ? readdirSync(args.dir).filter((f) => f.endsWith('.json')) : []
  const report = { filled: 0, skipped: 0, kept: 0, provinces: [] }

  for (const file of files) {
    const raw = JSON.parse(readFileSync(join(args.dir, file), 'utf8'))
    const adcode = String(raw.adcode ?? file.replace('.json', ''))
    let changed = false
    let filled = 0
    let skipped = 0
    let kept = 0

    for (const scenic of raw.scenics ?? []) {
      const skeletonScenic = byKey.get(`${adcode}/${scenic.id}`)
      if (!skeletonScenic) continue
      const usable = usableImages(skeletonScenic.images)
      const allowed = usable.slice(0, 5)

      // 清单里已经有落盘好的图片：人工核过，不动
      const landed = (scenic.images ?? []).filter((img) => img.file)
      if (landed.length) {
        kept += 1
        continue
      }
      if (!allowed.length) {
        skipped += 1
        continue
      }
      // 上一轮留了候选但没落盘成功（file 为空），或候选的地址是脏的——
      // 一律用骨架里的候选覆盖，避免脏路径一直卡住
      scenic.images = allowed.map((img) => ({
        file: '',
        md5: img.md5,
        commonsPath: img.commonsPath,
        license: img.license,
        author: img.author,
        sourceUrl: img.sourceUrl,
        thumbUrl: img.thumbUrl,
        thumbUrlSmall: img.thumbUrlSmall,
      }))
      filled += 1
      changed = true
    }

    if (changed) {
      writeFileSync(join(args.dir, file), `${JSON.stringify(raw, null, 2)}\n`, 'utf8')
    }
    report.filled += filled
    report.skipped += skipped
    report.kept += kept
    report.provinces.push({ adcode, filled, skipped, kept })
  }

  for (const p of report.provinces) {
    console.log(`${p.adcode}：补 ${p.filled} 个景区的图片候选，跳过 ${p.skipped}，保留已有 ${p.kept}`)
  }
  console.log(
    `\n合计：补 ${report.filled} 个景区，跳过 ${report.skipped} 个（没有白名单内的图），` +
      `保留已有 ${report.kept} 个`,
  )
  console.log('接下来跑 fetch-scenic-images.mjs 落盘图片。')
}

main()
