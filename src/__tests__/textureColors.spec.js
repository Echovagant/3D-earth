// @vitest-environment node
// 贴图色彩空间的回归测试。
//
// JPEG 与 Canvas 存的都是 sRGB 编码的数据，而 three.js 默认把贴图当线性数据处理。
// 漏掉 `colorSpace = SRGBColorSpace` 不会报错、不会警告，只会让画面整体发灰、
// 对比度被压掉——「卫星贴图模糊」曾因此被误判成分辨率不足（实测把 4096 换成 8192
// 只提升 0.2% 锐度，改对色彩空间才是解法）。
//
// 这里做静态扫描：每处建贴图的地方都必须显式声明色彩空间。
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = new URL('../../', import.meta.url)
const repoRootPath = fileURLToPath(repoRoot)

/** 递归找出 src 下所有源码文件 */
function collectSources(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectSources(full))
    else if (/\.(js|vue)$/.test(entry.name)) out.push(full)
  }
  return out
}

const sources = collectSources(fileURLToPath(new URL('src/', repoRoot))).filter(
  (f) => !f.includes(`${path.sep}__tests__${path.sep}`),
)

describe('贴图色彩空间', () => {
  it('src 下确实有建贴图的地方（避免扫描规则空转）', () => {
    const hits = sources.filter((f) =>
      /new THREE\.(TextureLoader|CanvasTexture|DataTexture|VideoTexture)/.test(
        readFileSync(f, 'utf-8'),
      ),
    )
    expect(hits.length).toBeGreaterThan(0)
  })

  it('每处贴图都显式声明了 SRGBColorSpace', () => {
    const problems = []
    for (const file of sources) {
      const text = readFileSync(file, 'utf-8')
      const lines = text.split('\n')
      lines.forEach((line, index) => {
        if (!/new THREE\.(TextureLoader|CanvasTexture|DataTexture|VideoTexture)/.test(line)) return
        // 从建贴图的那一行往后看 25 行，要求出现色彩空间声明
        const window = lines.slice(index, index + 25).join('\n')
        if (!/colorSpace\s*=\s*THREE\.SRGBColorSpace/.test(window)) {
          problems.push(`${path.relative(repoRootPath, file)}:${index + 1}`)
        }
      })
    }
    expect(problems, `这些地方建了贴图但没声明 sRGB 色彩空间：${problems.join('、')}`).toEqual(
      [],
    )
  })
})
