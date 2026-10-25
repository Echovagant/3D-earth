/**
 * 校验景区清单与图片是否对得上。
 *
 * 守的是三件事：
 *   ① 每一张图都有自由许可与署名（法定义务，红了就是合规问题）
 *   ② 清单引用的图片都在，仓库里也没有没人引用的图
 *   ③ 每个省 3–4 个景区、id 合法且不重复
 *
 * 用法：node scripts/check-scenic.mjs
 * 退出码非 0 表示有问题。
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isAllowedLicense, SCENIC_ID_PATTERN } from '../src/data/scenicRules.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

/** 一个省该有几个景区 */
const MIN_PER_PROVINCE = 3
const MAX_PER_PROVINCE = 4

/**
 * 定位景区清单目录。
 *
 * root 既可以是直接含 `data/scenic` 的目录，也可以是仓库根（清单在 `public/data/scenic`）。
 * 两处都找不到时返回默认路径，由调用方报「找不到景区数据目录」。
 */
function resolveScenicDir(root) {
  const direct = join(root, 'data', 'scenic')
  if (existsSync(direct)) return direct
  const underPublic = join(root, 'public', 'data', 'scenic')
  if (existsSync(underPublic)) return underPublic
  return direct
}

/**
 * 校验一个景区数据目录。
 *
 * root 指向清单所在的那一层（其下有 `data/scenic/`）；图片从同层的 `data/scenic/images/` 读。
 */
export function checkScenicDir(root) {
  const problems = []
  const stats = { provinces: 0, scenics: 0, images: 0, withImage: 0 }
  const scenicDir = resolveScenicDir(root)
  const imageDir = join(scenicDir, 'images')
  if (!existsSync(scenicDir)) return { problems: ['找不到景区数据目录'], stats }

  const files = readdirSync(scenicDir).filter((f) => f.endsWith('.json'))
  const referenced = new Set()

  for (const file of files) {
    let raw
    try {
      raw = JSON.parse(readFileSync(join(scenicDir, file), 'utf8'))
    } catch (error) {
      problems.push(`${file}：JSON 解析失败：${error.message}`)
      continue
    }
    const adcode = file.replace('.json', '')
    stats.provinces += 1
    if (raw.adcode !== adcode) {
      problems.push(`${file}：adcode 字段是 ${raw.adcode}，与文件名不一致`)
    }
    const scenics = raw.scenics ?? []
    stats.scenics += scenics.length
    if (scenics.length < MIN_PER_PROVINCE || scenics.length > MAX_PER_PROVINCE) {
      problems.push(`${file}：景区 ${scenics.length} 个，应为 ${MIN_PER_PROVINCE}–${MAX_PER_PROVINCE} 个`)
    }
    const seen = new Set()
    for (const s of scenics) {
      if (!s.id || !SCENIC_ID_PATTERN.test(s.id)) {
        problems.push(`${file}：景区「${s.name ?? '?'}」的 id 不合法：${s.id}`)
      } else if (seen.has(s.id)) {
        problems.push(`${file}：景区 id 重复：${s.id}`)
      } else {
        seen.add(s.id)
      }
      if (!s.name) problems.push(`${file}：有景区没写 name`)
      if (!s.summary) problems.push(`${file}：景区 ${s.id} 没写 summary`)
      if (!Array.isArray(s.coords) || s.coords.length !== 2) {
        problems.push(`${file}：景区 ${s.id} 的 coords 不合法：${JSON.stringify(s.coords)}`)
      }
      const images = s.images ?? []
      if (images.length) stats.withImage += 1
      for (const img of images) {
        stats.images += 1
        if (!img.file) {
          problems.push(`${file}：景区 ${s.id} 有图片没写 file`)
          continue
        }
        referenced.add(img.file)
        if (!isAllowedLicense(img.license)) {
          problems.push(`${file}：景区 ${s.id} 的图片 ${img.file} 许可不在白名单：${img.license}`)
        }
        if (!img.author) problems.push(`${file}：图片 ${img.file} 缺 author（署名义务）`)
        if (!img.sourceUrl) problems.push(`${file}：图片 ${img.file} 缺 sourceUrl（原始页面，署名义务）`)
        if (!existsSync(join(imageDir, img.file))) {
          problems.push(`${file}：图片 ${img.file} 在仓库里不存在`)
        }
      }
    }
  }

  if (existsSync(imageDir)) {
    for (const f of readdirSync(imageDir)) {
      if (!referenced.has(f)) {
        problems.push(`图片 ${f} 没有任何清单引用它（孤儿图）`)
      }
    }
  }

  const coverage = stats.scenics ? stats.withImage / stats.scenics : 0
  if (stats.scenics && coverage < 0.9) {
    problems.push(`图片覆盖率 ${(coverage * 100).toFixed(1)}%，低于 90%`)
  }
  stats.coverage = coverage
  return { problems, stats }
}

if (process.argv[1] && process.argv[1].endsWith('check-scenic.mjs')) {
  const { problems, stats } = checkScenicDir(ROOT)
  console.log(
    `省 ${stats.provinces} 个，景区 ${stats.scenics} 个，图片 ${stats.images} 张，` +
      `有图景区 ${stats.withImage} 个（覆盖率 ${((stats.coverage ?? 0) * 100).toFixed(1)}%）`,
  )
  if (problems.length) {
    console.log(`\n=== 有问题的：${problems.length} 条 ===`)
    for (const p of problems) console.log(p)
    process.exitCode = 1
  } else {
    console.log('OK')
  }
}
