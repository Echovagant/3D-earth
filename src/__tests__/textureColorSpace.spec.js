// @vitest-environment node
// 贴图颜色空间的回归守卫。
//
// JPEG 里存的是 sRGB 编码的数据，three.js 默认按线性数据处理——漏掉
// `colorSpace = THREE.SRGBColorSpace`，画面会整体发灰、对比度被压掉，
// 卫星影像看起来像蒙了一层雾。**换成更高分辨率的图也必须同样声明**，
// 否则画面会变暗。这条以前被误判成「贴图分辨率不够」。
//
// 用源码扫描来守：任何新加的贴图加载点忘了声明颜色空间，这里就红。
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const repoRoot = new URL('../../', import.meta.url)
const componentsDir = fileURLToPath(new URL('src/components/', repoRoot))
const texturesDir = fileURLToPath(new URL('public/textures/', repoRoot))

const vueFiles = readdirSync(componentsDir).filter((f) => f.endsWith('.vue'))
/** 相对仓库根读文件 */
const read = (rel) => readFileSync(fileURLToPath(new URL(rel, repoRoot)), 'utf-8')

describe('贴图颜色空间', () => {
  it('用了 TextureLoader 的组件都声明了 SRGBColorSpace', () => {
    const users = vueFiles.filter((f) => read(`src/components/${f}`).includes('TextureLoader'))
    expect(users.length, '没找到用 TextureLoader 的组件').toBeGreaterThan(0)
    for (const file of users) {
      const text = read(`src/components/${file}`)
      expect(
        text,
        `${file} 用了 TextureLoader 但没声明 SRGBColorSpace——贴图会发灰、变暗`,
      ).toMatch(/colorSpace\s*=\s*THREE\.SRGBColorSpace/)
    }
  })

  it('地球与全球视角用的是同一张贴图', () => {
    // 两个视角是同一个产品，视觉语言必须一致：贴图换了只改一处
    const earth = read('src/components/EarthScene.vue')
    const world = read('src/components/WorldScene.vue')
    const main = '/textures/earth_atmos_4096.jpg'
    expect(earth).toContain(main)
    expect(world).toContain(main)
  })

  it('首屏用的小图与后台换的高清图都在仓库里', () => {
    for (const name of ['earth_atmos_512.jpg', 'earth_atmos_4096.jpg']) {
      expect(existsSync(`${texturesDir}${name}`), `缺 ${name}`).toBe(true)
    }
  })

  it('小图比高清图小一个数量级——它要能瞬间到位', () => {
    const small = readFileSync(`${texturesDir}earth_atmos_512.jpg`)
    const large = readFileSync(`${texturesDir}earth_atmos_4096.jpg`)
    expect(small.length * 5, '小图要压到高清图的 1/5 以下').toBeLessThan(large.length)
  })
})
