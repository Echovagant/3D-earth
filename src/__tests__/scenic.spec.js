// @vitest-environment node
/**
 * 景区数据契约的回归测试：许可白名单与清单校验器。
 *
 * 必须跑在 node 环境：被测的校验脚本用 import.meta.url 推仓库根，
 * jsdom 会把它变成 http 地址，fileURLToPath 直接抛错。
 * 运行时部分（访问层、卡片、图廊、页面）在 scenicRuntime.spec.js。
 */
import { describe, it, expect, afterEach } from 'vitest'
import process from 'node:process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { LICENSE_WHITELIST, isAllowedLicense, SCENIC_ID_PATTERN } from '../data/scenicRules'
import { checkScenicDir } from '../../scripts/check-scenic.mjs'

/**
 * 临时数据的落点。
 *
 * 系统盘空间紧张，临时目录一律走 D 盘；没有 D 盘的环境（CI）退回系统临时目录。
 */
const TMP_BASE = (() => {
  if (process.env.SCENIC_TMP_DIR) {
    mkdirSync(process.env.SCENIC_TMP_DIR, { recursive: true })
    return process.env.SCENIC_TMP_DIR
  }
  if (process.platform === 'win32' && existsSync('D:/')) {
    const preferred = 'D:/Projects/3D-earth/.tmp/'
    mkdirSync(preferred, { recursive: true })
    return preferred
  }
  return tmpdir()
})()

/** 自己造的临时目录，测试结束清掉 */
const created = []

const makeScenicDir = (files, images = []) => {
  const root = mkdtempSync(join(TMP_BASE, 'scenic-'))
  created.push(root)
  mkdirSync(join(root, 'data', 'scenic'), { recursive: true })
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(root, 'data', 'scenic', name), JSON.stringify(content, null, 2))
  }
  if (images.length) {
    mkdirSync(join(root, 'data', 'scenic', 'images'), { recursive: true })
    for (const name of images) writeFileSync(join(root, 'data', 'scenic', 'images', name), 'x')
  }
  return root
}

afterEach(() => {
  while (created.length) rmSync(created.pop(), { recursive: true, force: true })
})

describe('景区图片的许可白名单', () => {
  it('只收自由许可', () => {
    expect(isAllowedLicense('CC0-1.0')).toBe(true)
    expect(isAllowedLicense('CC BY-SA 4.0')).toBe(true)
    expect(isAllowedLicense('CC BY 3.0')).toBe(true)
    expect(isAllowedLicense('Public domain')).toBe(true)
  })

  it('非自由许可一律不收', () => {
    expect(isAllowedLicense('CC BY-NC 2.0')).toBe(false)
    expect(isAllowedLicense('CC BY-ND 4.0')).toBe(false)
    expect(isAllowedLicense('Fair use')).toBe(false)
    expect(isAllowedLicense('All rights reserved')).toBe(false)
    expect(isAllowedLicense('')).toBe(false)
    expect(isAllowedLicense(undefined)).toBe(false)
  })

  it('许可写法要能容错：大小写与空格差异不影响判定', () => {
    expect(isAllowedLicense('cc by-sa 4.0')).toBe(true)
    expect(isAllowedLicense('CC-BY-SA-4.0')).toBe(true)
    expect(isAllowedLicense('  CC0 1.0 ')).toBe(true)
  })

  it('白名单里没有非自由许可', () => {
    expect(LICENSE_WHITELIST.some((l) => /NC|ND/i.test(l))).toBe(false)
  })
})

describe('景区 id 的形状', () => {
  it('只收小写字母、数字与连字符', () => {
    expect(SCENIC_ID_PATTERN.test('jiuzhaigou')).toBe(true)
    expect(SCENIC_ID_PATTERN.test('daocheng-yading')).toBe(true)
    expect(SCENIC_ID_PATTERN.test('Jiuzhaigou')).toBe(false)
    expect(SCENIC_ID_PATTERN.test('jiuzhaigou_1')).toBe(false)
    expect(SCENIC_ID_PATTERN.test('')).toBe(false)
  })
})

describe('景区清单校验', () => {
  it('清单格式不对要报出来', () => {
    const root = makeScenicDir({
      '510000.json': { adcode: '510000', scenics: [{ name: '九寨沟' }] },
    })
    const { problems } = checkScenicDir(root)
    expect(problems.length).toBeGreaterThan(0)
    expect(problems.join('\n')).toContain('id')
  })

  it('图片许可不在白名单要报出来', () => {
    const root = makeScenicDir(
      {
        '510000.json': {
          adcode: '510000',
          scenics: [
            {
              id: 'jiuzhaigou',
              name: '九寨沟',
              summary: '一段说明。',
              coords: [33.26, 103.92],
              images: [{ file: 'a.jpg', license: 'CC BY-NC 2.0', author: 'X', sourceUrl: 'https://...' }],
            },
          ],
        },
      },
      ['a.jpg'],
    )
    const { problems } = checkScenicDir(root)
    expect(problems.join('\n')).toContain('许可')
  })

  it('清单引用了不存在的图片要报出来', () => {
    const root = makeScenicDir(
      {
        '510000.json': {
          adcode: '510000',
          scenics: [
            {
              id: 'a',
              name: '甲',
              summary: '说明。',
              coords: [30, 100],
              images: [{ file: 'missing.jpg', license: 'CC0-1.0', author: 'X', sourceUrl: 'https://...' }],
            },
          ],
        },
      },
      [],
    )
    const { problems } = checkScenicDir(root)
    expect(problems.join('\n')).toContain('missing.jpg')
  })

  it('仓库里有没人引用的图要报出来（孤儿图）', () => {
    const root = makeScenicDir(
      {
        '510000.json': {
          adcode: '510000',
          scenics: [
            {
              id: 'a',
              name: '甲',
              summary: '说明。',
              coords: [30, 100],
              images: [{ file: 'used.jpg', license: 'CC0-1.0', author: 'X', sourceUrl: 'https://...' }],
            },
          ],
        },
      },
      ['used.jpg', 'orphan.jpg'],
    )
    const { problems } = checkScenicDir(root)
    expect(problems.join('\n')).toContain('orphan.jpg')
  })

  it('缩略图是大图名加 -t 后缀，不算孤儿图', () => {
    // 清单只列大图，缩略图由约定派生；孤儿扫描要一并认下
    const root = makeScenicDir(
      {
        '510000.json': {
          adcode: '510000',
          scenics: [
            {
              id: 'a',
              name: '甲',
              summary: '说明。',
              coords: [30, 100],
              images: [{ file: 'used.jpg', license: 'CC0-1.0', author: 'X', sourceUrl: 'https://...' }],
            },
          ],
        },
      },
      ['used.jpg', 'used-t.jpg'],
    )
    const { problems } = checkScenicDir(root)
    expect(problems.join('\n')).not.toContain('used-t.jpg')
  })

  it('图片还没落盘（file 为空）时不报错，只是没覆盖到', () => {
    const root = makeScenicDir({
      '510000.json': {
        adcode: '510000',
        scenics: [
          {
            id: 'a',
            name: '甲',
            summary: '说明。',
            coords: [30, 100],
            images: [{ file: '', license: 'CC0-1.0', author: 'X', sourceUrl: 'https://...' }],
          },
        ],
      },
    })
    const { problems, stats } = checkScenicDir(root)
    expect(problems.join('\n')).not.toContain('没写 file')
    expect(stats.withImage).toBe(1)
  })
})
