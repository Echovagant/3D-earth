// @vitest-environment node
// 课程讲义 Markdown 解析器的单测。
//
// 解析器是纯函数：输入一段 Markdown，输出结构化知识点。
// 它是「94 万字讲义 → 提纲级 JSON」这条管线的唯一入口，解析错了后面全错，所以单测要密。
import { describe, it, expect } from 'vitest'
import {
  BLOCK_LABELS,
  MAX_LINE_CHARS,
  splitLongLine,
  extractField,
  extractBlock,
  extractTables,
  extractLessonRefs,
  extractChapterRefs,
  parseChapterRanges,
  parseChapterTitles,
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

// §15.2 的写法：一行里挤了「教材出处」和「高考定位」两个栏位。
const INLINE_FIELDS = `### 15.2 世界地理的六要素框架 + 亚洲总览（p084 上半）

> **教材出处**：p084【世界地理】1 东亚与日本（前半部分为亚洲总览）。**高考定位**：区域背景常识，不单独设题。
> **前置知识**：§2 地图与定位工具（p005 经纬网的应用）
> **后续关联**：§15.3 东亚与日本
`

// §15.1 的写法：栏位名为空，值在后续的 `> - ` 续行里。
const EMPTY_VALUE_FIELDS = `### 15.1 本节怎么学：两套框架 + 三件工具

> **教材出处**：本节是课程末尾自设的速览系列。
> **高考定位**：
> - **统一口径**：区域地理在高考中**主要充当背景材料**，直接考的少、间接用的多。
> - **中国地理权重在上升**。
> **前置知识**：§9 气候
`

// §6.3 的写法：知识骨架块里夹着「形成机制四步」「核心结论」这种一次性加粗小标题。
const ONE_OFF_BOLD_HEADS = `### 6.3 热力环流的形成过程：温差 → 气压差 → 风

> **教材出处**：人教版必修一 第二章第二节

**知识骨架**

**形成机制四步**

1. **地面冷热不均** → 冷热源出现
2. **空气密度差异** → 热处上升、冷处下沉

**核心结论**

- **热力环流产生的根本原因：地表冷热不均**

**核心内容**

1. 正文段落
`

// §15.2 的写法：知识骨架里有嵌套子项。
const NESTED_ITEMS = `### 15.2 世界地理的六要素框架 + 亚洲总览（p084 上半）

> **教材出处**：p084【世界地理】

**知识骨架**

- **亚洲总览**：
  - 面积**世界最大**、人口**世界最多**。
  - 地形总特征：**中间高、四周低**。
`

// 块里以 `> ` 开头的采集项，不该把 `>` 带进内容。
const QUOTED_ITEM = `### 4.1 公转的地理意义

> **教材出处**：人教版必修一

**知识骨架**

- 一条采集项
> **补充**：一条引用
`

// 讲义里每小节的最后一块（**易错点**）后面紧跟一行 `---` 水平分隔线，用来断开小节。
const BLOCK_THEN_SEPARATOR = `### 2.1 经纬网：地球的「网格坐标」

**易错点**

- **以为地轴真实存在**：它是虚拟出来的轴。
- **把经纬网当成地球上真实存在的线**：它是人为划分的。

---

### 2.2 纬线：概念与五个特点
`

// §9.4 的写法：嵌套列表里塞表格，含 `---` 的行整行不是纯分隔线，不能被当成水平分隔线吃掉。
const NESTED_TABLE_LIST = `### 9.4 洋流模式

**知识骨架**

5. **把模式套到世界洋流分布图**
   - | 海区 | 模式 | 洋流依次为 |
   - |---|---|---|
   - | **北太平洋** | 八字 | 北赤道暖流 → 日本暖流 |
`

describe('extractField', () => {
  it('抽出栏位的值', () => {
    expect(extractField(SAMPLE, '教材出处')).toBe('人教版必修一 第一章')
    expect(extractField(SAMPLE, '高考定位')).toBe('高频考点，以读图为主')
  })

  it('栏位不存在时返回空串', () => {
    expect(extractField(SAMPLE, '老师强调')).toBe('')
  })

  it('同一行挤两个栏位时各归各位', () => {
    expect(extractField(INLINE_FIELDS, '教材出处')).toBe(
      'p084【世界地理】1 东亚与日本（前半部分为亚洲总览）。',
    )
    expect(extractField(INLINE_FIELDS, '高考定位')).toBe('区域背景常识，不单独设题。')
  })

  it('栏位值为空时把后续续行接上来', () => {
    expect(extractField(EMPTY_VALUE_FIELDS, '高考定位')).toBe(
      '**统一口径**：区域地理在高考中**主要充当背景材料**，直接考的少、间接用的多。\n**中国地理权重在上升**。',
    )
    expect(extractField(EMPTY_VALUE_FIELDS, '教材出处')).toBe('本节是课程末尾自设的速览系列。')
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

  it('一次性加粗小标题不当成栏位边界', () => {
    expect(extractBlock(ONE_OFF_BOLD_HEADS, '知识骨架')).toEqual([
      '**形成机制四步**',
      '**地面冷热不均** → 冷热源出现',
      '**空气密度差异** → 热处上升、冷处下沉',
      '**核心结论**',
      '**热力环流产生的根本原因：地表冷热不均**',
    ])
  })

  it('嵌套子项保留缩进层级', () => {
    expect(extractBlock(NESTED_ITEMS, '知识骨架')).toEqual([
      '**亚洲总览**：',
      '  面积**世界最大**、人口**世界最多**。',
      '  地形总特征：**中间高、四周低**。',
    ])
  })

  it('去掉块内采集项的行首引用符', () => {
    expect(extractBlock(QUOTED_ITEM, '知识骨架')).toEqual(['一条采集项', '**补充**：一条引用'])
  })

  it('块后面的水平分隔线不进条目', () => {
    const items = extractBlock(BLOCK_THEN_SEPARATOR, '易错点')
    expect(items).toHaveLength(2)
    expect(items).not.toContain('---')
    expect(items).toEqual([
      '**以为地轴真实存在**：它是虚拟出来的轴。',
      '**把经纬网当成地球上真实存在的线**：它是人为划分的。',
    ])
  })

  it('其它符号的水平分隔线也不进条目', () => {
    const md = `**易错点**

- 一条要点

***

- 另一条要点
`
    expect(extractBlock(md, '易错点')).toEqual(['一条要点', '另一条要点'])
  })

  it('含 --- 的正常内容不被误伤', () => {
    expect(extractBlock(NESTED_TABLE_LIST, '知识骨架')).toEqual([
      '**把模式套到世界洋流分布图**',
      '  | 海区 | 模式 | 洋流依次为 |',
      '  |---|---|---|',
      '  | **北太平洋** | 八字 | 北赤道暖流 → 日本暖流 |',
    ])
  })

  it('加粗行不是水平分隔线', () => {
    const md = `**易错点**

**一整行加粗**
`
    expect(extractBlock(md, '易错点')).toEqual(['**一整行加粗**'])
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

describe('splitLongLine', () => {
  it('短行原样返回', () => {
    expect(splitLongLine('一条要点')).toEqual(['一条要点'])
  })

  it('超长的行按句读切开，每条都不超过上限', () => {
    const text = `${'甲。'.repeat(120)}结尾`
    const parts = splitLongLine(text)

    expect(parts.length).toBeGreaterThan(1)
    expect(parts.every((p) => p.length <= MAX_LINE_CHARS)).toBe(true)
  })

  it('切分一个字都不丢', () => {
    const text = `${'甲。'.repeat(120)}结尾`
    // 讲义里少数几节把整段推理写成了一行，切开是为了过逐行闸门，不是为了改内容
    expect(splitLongLine(text).join('')).toBe(text)
  })

  it('单句本身就超长的不动——那是真正文，交给闸门报出来', () => {
    const text = '长'.repeat(300)
    expect(splitLongLine(text)).toEqual([text])
  })
})

describe('extractLessonRefs / extractChapterRefs', () => {  it('抽节号引用', () => {
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

describe('parseChapterTitles', () => {
  it('抽章名', () => {
    const md = '## 2. 地图与定位工具：经纬网·等高线·3S技术\n\n## 3. 地球的自转\n'
    expect(parseChapterTitles(md)).toEqual({
      2: '地图与定位工具：经纬网·等高线·3S技术',
      3: '地球的自转',
    })
  })
})

describe('BLOCK_LABELS', () => {
  it('列出讲义里真实存在的栏位名', () => {
    expect(BLOCK_LABELS).toEqual([
      '知识骨架',
      '核心内容',
      '大白话版',
      '要背',
      '易错点',
      '推导与计算',
      '典型题型',
    ])
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
