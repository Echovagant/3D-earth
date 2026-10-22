/**
 * 课程讲义 Markdown → 结构化知识点。
 *
 * 纯函数：输入 Markdown 字符串，输出知识点数组。不碰文件系统，方便单测。
 *
 * 收录边界（见设计规格 §三）：
 *   收 —— 教材出处 / 高考定位 / 前置知识 / 后续关联 / 知识骨架 / 要背 / 易错点 / 典型题型
 *   不收 —— 大白话版 / 核心内容 / 推导与计算 / 完整例题（成段正文，回链视频）
 *
 * 讲义正文里有两类「一次性加粗行」——它们是内容里的小标题，不是栏位边界：
 *   **形成机制四步**、**核心结论**、**承前启后**……
 * 所以块边界只认 BLOCK_LABELS 里的真栏位名，其余加粗行按内容项收进来。
 */

/** 讲义里反复出现的块级栏位名。块边界只认这些名字。 */
export const BLOCK_LABELS = [
  '知识骨架',
  '核心内容',
  '大白话版',
  '要背',
  '易错点',
  '推导与计算',
  '典型题型',
]

/** 讲义里反复出现的头部栏位名。同一行可能挤多个栏位，只在这些名字处切分。 */
export const FIELD_LABELS = ['教材出处', '高考定位', '前置知识', '后续关联']

/** 行内栏位标记：`**名字**：` */
const FIELD_MARKER_RE = /\*\*([^*\r\n]+)\*\*：/g
/** 整行加粗：`**内容**` */
const BOLD_LINE_RE = /^\*\*([^*]+)\*\*$/
/** Markdown 标题 */
const HEADING_RE = /^#{1,6} /
/** 无序列表符号。后面必须有空白，才不会把 `**加粗**`、`---` 误当列表项 */
const LIST_MARKER_RE = /^[-*+]\s+/
/** 有序列表符号：`1. ` / `1、` */
const ORDERED_MARKER_RE = /^\d+[.、]\s*/

/** 是不是块边界：真栏位名，或 Markdown 标题 */
function isBlockBoundary(line) {
  const text = line.trim()
  if (HEADING_RE.test(text)) return true
  const m = BOLD_LINE_RE.exec(text)
  if (!m) return false
  const name = m[1]
  return BLOCK_LABELS.some((label) => name === label || name === `${label}（续）`)
}

/** 去掉行首列表符号 */
function stripListMarker(text) {
  return text.replace(LIST_MARKER_RE, '').replace(ORDERED_MARKER_RE, '').trim()
}

/** 前导缩进的列数，制表符按 4 列算 */
function leadingWidth(raw) {
  return /^[ \t]*/.exec(raw)[0].replace(/\t/g, '    ').length
}

/** 按缩进折算层级：每 2 列一级，一级给 2 个空格前缀 */
function applyIndentLevels(items) {
  return items.map((item) => '  '.repeat(Math.floor(item.width / 2)) + item.text)
}

/** 取第一段连续的 `> ` 行——小节头部的引用区 */
function collectQuoteRun(lines) {
  const start = lines.findIndex((l) => l.trim().startsWith('>'))
  if (start < 0) return []
  const run = []
  for (let i = start; i < lines.length; i++) {
    const text = lines[i].trim()
    if (!text.startsWith('>')) break
    run.push(text)
  }
  return run
}

/**
 * 解析小节头部的引用区，返回「栏位名 → 值」。
 *
 * 讲义里的栏位写法有三种，都得认：
 *   1. 一行一个栏位——`**教材出处**：值`
 *   2. 一行挤两个栏位——`**教材出处**：值。**高考定位**：值`（栏位名可以在行内任意位置）
 *   3. 栏位名为空、值在续行——`**高考定位**：` 后面跟若干 `> - …` 行
 */
function parseFields(block, extraLabel) {
  const run = collectQuoteRun(block.split('\n'))
  const splitNames = new Set([...FIELD_LABELS, extraLabel].filter(Boolean))
  const fields = new Map()
  let current = null
  for (const quote of run) {
    const content = quote.replace(/^>\s?/, '').trim()
    if (!content) continue
    const marks = [...content.matchAll(FIELD_MARKER_RE)].filter((m) => splitNames.has(m[1]))
    if (marks.length && marks[0].index === 0) {
      // 行首就是栏位标记：这一行可能挤多个栏位，按下一个标记切开
      for (let i = 0; i < marks.length; i++) {
        const from = marks[i].index + marks[i][0].length
        const to = i + 1 < marks.length ? marks[i + 1].index : content.length
        const name = marks[i][1]
        const value = content.slice(from, to).trim()
        fields.set(name, fields.has(name) ? `${fields.get(name)}\n${value}` : value)
        current = name
      }
    } else if (current) {
      // 续行：并入上一个栏位
      const prev = fields.get(current) ?? ''
      const piece = stripListMarker(content)
      fields.set(current, prev ? `${prev}\n${piece}` : piece)
    }
  }
  return fields
}

/**
 * 抽栏位的值。
 *
 * 栏位名可以出现在行的任意位置；同行里下一个栏位之前的内容属于本栏位；
 * 栏位值为空时，把后续 `> ` 续行接上来。
 */
export function extractField(block, label) {
  return parseFields(block, label).get(label) ?? ''
}

/**
 * 抽 `**块名**` 之后、下一个真栏位或标题之前的内容。
 *
 * 每行去掉列表符号；嵌套子项保留缩进层级（前缀空格，每级 2 个空格）。
 */
export function extractBlock(block, label) {
  const lines = block.split('\n')
  const start = lines.findIndex((l) => l.trim() === `**${label}**`)
  if (start < 0) return []
  const items = []
  for (let i = start + 1; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trim()
    if (isBlockBoundary(line)) break
    if (!line) continue
    if (line.startsWith('|')) continue // 表格行交给 extractTables
    const width = leadingWidth(raw)
    const content = line.startsWith('>') ? line.replace(/^>\s?/, '') : line
    items.push({ width, text: stripListMarker(content) })
  }
  return applyIndentLevels(items)
}

/** 抽块内的 markdown 表格 */
export function extractTables(block, label) {
  const lines = block.split('\n')
  const start = lines.findIndex((l) => l.trim() === `**${label}**`)
  if (start < 0) return []
  const tables = []
  let current = null
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (isBlockBoundary(line)) break
    if (!line.startsWith('|')) {
      current = null
      continue
    }
    const cells = line.split('|').slice(1, -1).map((c) => c.trim())
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue // 分隔行
    if (!current) {
      current = { header: cells, rows: [] }
      tables.push(current)
      continue
    }
    current.rows.push(cells)
  }
  return tables
}

/** 抽 `§12.5` 形式的节号引用 */
export function extractLessonRefs(text) {
  const refs = []
  for (const m of text.matchAll(/§(\d+)\.(\d+)/g)) {
    const id = `${m[1]}.${m[2]}`
    if (!refs.includes(id)) refs.push(id)
  }
  return refs
}

/** 抽 `§3` 形式的章级引用（节号不算） */
export function extractChapterRefs(text) {
  const refs = []
  for (const m of text.matchAll(/§(\d+)(?!\.\d)/g)) {
    if (!refs.includes(m[1])) refs.push(m[1])
  }
  return refs
}

/** 抽依赖表里的「章节 → pXXX–pYYY」 */
export function parseChapterRanges(markdown) {
  const ranges = {}
  for (const m of markdown.matchAll(/^\|\s*(\d+)\s*\|[^|]*\|\s*p(\d{3})[–-]p(\d{3})\s*\|/gm)) {
    ranges[m[1]] = { from: Number(m[2]), to: Number(m[3]) }
  }
  return ranges
}

/** 抽 `## 3. 地球的自转` 的章名 */
export function parseChapterTitles(markdown) {
  const titles = {}
  for (const m of markdown.matchAll(/^## (\d+)\. (.+)$/gm)) {
    titles[m[1]] = m[2].trim()
  }
  return titles
}

/** 切出全部小节 */
export function parseLessons(markdown) {
  const ranges = parseChapterRanges(markdown)
  const chapterTitles = parseChapterTitles(markdown)
  const parts = markdown.split(/(?=^### \d+\.\d+ )/m)
  const lessons = []
  for (const part of parts) {
    const head = /^### (\d+)\.(\d+) (.+)$/m.exec(part)
    if (!head) continue
    const prereqText = extractField(part, '前置知识')
    const nextText = extractField(part, '后续关联')
    lessons.push({
      id: `${head[1]}.${head[2]}`,
      chapter: Number(head[1]),
      title: head[3].trim(),
      sourceLabel: extractField(part, '教材出处'),
      exam: extractField(part, '高考定位'),
      outline: extractBlock(part, '知识骨架'),
      mustKnow: extractBlock(part, '要背'),
      pitfalls: extractBlock(part, '易错点'),
      questionTypes: extractBlock(part, '典型题型'),
      tables: extractTables(part, '知识骨架'),
      prereq: extractLessonRefs(prereqText),
      prereqChapters: extractChapterRefs(prereqText),
      next: extractLessonRefs(nextText),
      nextChapters: extractChapterRefs(nextText),
    })
  }
  return { ranges, chapterTitles, lessons }
}
