// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { TOOL_SOURCES, BVID, partLabel, partUrl } from '../data/toolSources'

const repoRoot = new URL('../../', import.meta.url)

describe('互动工具的内容来源', () => {
  it('六个工具都有来源记录', () => {
    expect(Object.keys(TOOL_SOURCES).sort()).toEqual([
      'contour',
      'ocean-current',
      'pressure-belt',
      'province-abbrev',
      'province-shape',
      'terminator',
    ])
  })

  it('每条来源都写清了节号、教材出处与讲解主题', () => {
    for (const [key, source] of Object.entries(TOOL_SOURCES)) {
      expect(source.sections, `${key} 缺节号`).toMatch(/§/)
      expect(source.textbook, `${key} 缺教材出处`).toBeTruthy()
      expect(source.topics, `${key} 缺讲解主题`).toBeTruthy()
      expect(source.parts.length, `${key} 缺视频分P`).toBeGreaterThan(0)
    }
  })

  it('视频分P 落在课程范围内', () => {
    // 课程共 158 集；讲义的章节划分里 §2 起于 p5、§15 止于 p91
    for (const [key, source] of Object.entries(TOOL_SOURCES)) {
      for (const p of source.parts) {
        expect(p, `${key} 的分P 越界`).toBeGreaterThanOrEqual(1)
        expect(p, `${key} 的分P 越界`).toBeLessThanOrEqual(158)
      }
    }
  })

  it('分P 的展示与链接指向同一个课程', () => {
    expect(partLabel(9)).toBe('p009')
    expect(partLabel(90)).toBe('p090')
    expect(partUrl(9)).toBe(`https://www.bilibili.com/video/${BVID}?p=9`)
  })

  it('标注的节号确实在知识点数据收录范围内，或属于已收录章', () => {
    // §2 与 §15 是 P1 收录的两章；其余章的机制部分以互动工具的形式覆盖
    const index = JSON.parse(
      readFileSync(fileURLToPath(new URL('public/data/knowledge/index.json', repoRoot)), 'utf8'),
    )
    // index.json 里的章号是数字，这里统一成字符串再比
    const chapters = new Set(index.chapters.map((c) => String(c.id)))
    for (const [key, source] of Object.entries(TOOL_SOURCES)) {
      const refs = [...source.sections.matchAll(/§(\d+)/g)].map((m) => m[1])
      expect(refs.length, `${key} 没标节号`).toBeGreaterThan(0)
      for (const ref of refs) {
        expect(chapters.has(ref), `${key} 标了不存在的第 ${ref} 章`).toBe(true)
      }
    }
  })
})
