// @vitest-environment node
// 课程讲义 Markdown 解析器的单测。
//
// 解析器是纯函数：输入一段 Markdown，输出结构化知识点。
// 它是「94 万字讲义 → 提纲级 JSON」这条管线的唯一入口，解析错了后面全错，所以单测要密。
import { describe, it, expect } from 'vitest'
import {
  extractField,
  extractBlock,
  extractTables,
  extractLessonRefs,
  extractChapterRefs,
  parseChapterRanges,
  parseLessons,
} from '../../scripts/knowledge/parse-lessons.mjs'

const SAMPLE = `## 2. 地图与定位工具：经纬网·等高线·3S技术

### 2.19 等高线地形图：定义、读图与地形判读

> **教材出处**：人教版必修一 第一章
> **高考定位**：高频考点，以读图为主
> **前置知识**：§2.16 地图的方向判读；§2.17 比例尺
> **后续关联**：§2.20 等高线的计算

**知识骨架**

- **等高线**：连接海拔相同的点
- **五条基本规律**：同线等高、闭合为山、凸低为脊

**要背**

- 等高距 = 相邻两条等高线的高差

**易错点**

- 把山谷判成山脊

**典型题型**

- 判读山脊与山谷

### 2.20 等高线的计算：绝对高度、相对高度与坡度

> **教材出处**：人教版必修一 第一章
> **前置知识**：§2.19 等高线地形图
> **后续关联**：§2.21 陡崖的判读
`

describe('extractField', () => {
  it('抽出栏位的值', () => {
    expect(extractField(SAMPLE, '教材出处')).toBe('人教版必修一 第一章')
    expect(extractField(SAMPLE, '高考定位')).toBe('高频考点，以读图为主')
  })

  it('栏位不存在时返回空串', () => {
    expect(extractField(SAMPLE, '老师强调')).toBe('')
  })
})

describe('extractBlock', () => {
  it('抽出块内每行并去掉列表符号', () => {
    expect(extractBlock(SAMPLE, '知识骨架')).toEqual([
      '**等高线**：连接海拔相同的点',
      '**五条基本规律**：同线等高、闭合为山、凸低为脊',
    ])
  })

  it('块不存在时返回空数组', () => {
    expect(extractBlock(SAMPLE, '大白话版')).toEqual([])
  })

  it('遇到下一个块标题就停', () => {
    const block = extractBlock(SAMPLE, '易错点')
    expect(block).toEqual(['把山谷判成山脊'])
  })
})

describe('extractTables', () => {
  it('把块内的 markdown 表格抽成结构', () => {
    const md = `**知识骨架**

- 一条要点

| 分区 | 个数 |
|---|---|
| 华北 | 3 |
`
    expect(extractTables(md, '知识骨架')).toEqual([
      { header: ['分区', '个数'], rows: [['华北', '3']] },
    ])
  })
})

describe('extractLessonRefs / extractChapterRefs', () => {
  it('抽节号引用', () => {
    expect(extractLessonRefs('§2.16 地图的方向判读；§2.17 比例尺')).toEqual(['2.16', '2.17'])
  })

  it('抽章级引用但不把节号当章号', () => {
    expect(extractChapterRefs('§3 地球的自转；§2.16 比例尺')).toEqual(['3'])
  })
})

describe('parseChapterRanges', () => {
  it('抽依赖表里的章节到分P区间', () => {
    const md = '| 2 | 地图与定位工具 | p005–p012 | 7.0h | §1 | 术语基础 |\n'
    expect(parseChapterRanges(md)).toEqual({ 2: { from: 5, to: 12 } })
  })
})

describe('parseLessons', () => {
  it('切出小节并归一化字段', () => {
    const { lessons } = parseLessons(SAMPLE)
    expect(lessons).toHaveLength(2)
    expect(lessons[0].id).toBe('2.19')
    expect(lessons[0].chapter).toBe(2)
    expect(lessons[0].title).toBe('等高线地形图：定义、读图与地形判读')
    expect(lessons[0].prereq).toEqual(['2.16', '2.17'])
    expect(lessons[0].next).toEqual(['2.20'])
    expect(lessons[1].id).toBe('2.20')
    expect(lessons[1].prereq).toEqual(['2.19'])
  })
})
