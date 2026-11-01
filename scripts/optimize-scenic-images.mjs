/**
 * 压缩已落盘的景区图片：大图 960px/q68，缩略图 320px/q70。
 *
 * 为什么要这一步：Commons 的 thumb 只缩放不压缩，一张 960px 的图有 200KB 上下，
 * 600 张就是 120MB，仓库放不下（上限 70MB）。
 *
 * 压缩用系统的 ImageMagick（GitHub 的 ubuntu runner 预装）。
 * 不引入图像库依赖：scripts/ 只用 Node 内置模块是本项目的硬约束，
 * 而 ImageMagick 是 runner 上本来就有的命令行工具。
 * 本机没有 ImageMagick 时这一步整体跳过，图片原样保留——
 * 宁可图片大一点也不要把流水线卡死。
 *
 * 用法：node scripts/optimize-scenic-images.mjs [--dir <图片目录>]
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, renameSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const IMAGE_DIR = join(ROOT, 'public', 'data', 'scenic', 'images')

/** 两档规格：大图与缩略图 */
const SPECS = [
  { suffix: '', width: 960, quality: 68 },
  { suffix: '-t', width: 320, quality: 70 },
]

/** 找出系统上的 ImageMagick：magick（IM7）优先，其次 convert（IM6） */
function findImageMagick() {
  for (const cmd of ['magick', 'convert']) {
    try {
      const out = execFileSync(cmd, ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      if (out && out.toLowerCase().includes('imagemagick')) return cmd
    } catch {
      /* 没有这个命令 */
    }
  }
  return null
}

function parseArgs(argv) {
  const args = { dir: IMAGE_DIR }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--dir') args.dir = argv[++i]
  }
  return args
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!existsSync(args.dir)) {
    console.log(`没有图片目录：${args.dir}`)
    return
  }
  const files = readdirSync(args.dir).filter((f) => f.endsWith('.jpg'))
  if (!files.length) {
    console.log('没有图片要压缩')
    return
  }

  const tool = findImageMagick()
  if (!tool) {
    console.log(
      `本机没有 ImageMagick，跳过压缩（${files.length} 张图原样保留）。` +
        'GitHub 的 runner 上预装了它，流水线里会自动压缩。',
    )
    return
  }
  console.log(`用 ${tool} 压缩 ${files.length} 张图`)

  let saved = 0
  let shrunk = 0
  const failures = []
  const before = files.reduce((n, f) => n + statSync(join(args.dir, f)).size, 0)

  for (const file of files) {
    const spec = SPECS.find((s) => (file.endsWith(`${s.suffix}.jpg`) ? true : false)) ?? SPECS[0]
    const full = join(args.dir, file)
    const tmp = `${full}.tmp.jpg`
    try {
      execFileSync(
        tool,
        [
          full,
          // 只缩不放：原图小的不要拉大，糊的图不如不放
          '-resize',
          `${spec.width}x>`,
          '-strip',
          '-interlace',
          'Plane',
          '-quality',
          String(spec.quality),
          tmp,
        ],
        { stdio: ['ignore', 'ignore', 'pipe'] },
      )
      if (!existsSync(tmp)) throw new Error('没有产出文件')
      const after = statSync(tmp).size
      if (after >= statSync(full).size) {
        // 压完反而更大就丢掉压缩结果
        unlinkSync(tmp)
        continue
      }
      renameSync(tmp, full)
      saved += statSync(full).size - after
      shrunk += 1
    } catch (error) {
      if (existsSync(tmp)) unlinkSync(tmp)
      failures.push(`${file}：${String(error?.message ?? error).split('\n')[0]}`)
    }
  }

  const after = files.reduce((n, f) => n + statSync(join(args.dir, f)).size, 0)
  console.log(
    `压缩完成：${shrunk} 张变小，${(before / 1024 / 1024).toFixed(1)}MB → ` +
      `${(after / 1024 / 1024).toFixed(1)}MB，省了 ${(saved / 1024 / 1024).toFixed(1)}MB`,
  )
  if (failures.length) {
    console.log(`\n=== 失败的：${failures.length} 条 ===`)
    for (const f of failures) console.log(f)
    process.exitCode = 1
  }
}

main()
