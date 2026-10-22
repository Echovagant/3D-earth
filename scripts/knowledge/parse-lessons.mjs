/**
 * 课程讲义 Markdown → 结构化知识点。
 *
 * 纯函数：输入 Markdown 字符串，输出知识点数组。不碰文件系统，方便单测。
 *
 * 收录边界（见设计规格 §三）：
 *   收 —— 教材出处 / 高考定位 / 前置知识 / 后续关联 / 知识骨架 / 要背 / 易错点 / 典型题型
 *   不收 —— 大白话版 / 核心内容 / 推导与计算 / 完整例题（成段正文，回链视频）
 */

/** 抽 `> **栏位**：值` */
export function extractField(block, label) {
  const re = new RegExp(`^> \\*\\*${label}\\*\\*：(.+)$`, 'm')
  const m = re.exec(block)
  return m ? m[1].trim() : ''
}

/** 抽 `**块名**` 之后、下一个块名或标题之前的内容，每行去掉列表符号 */
export function extractBlock(block, label) {
  const lines = block.split('\n')
  const start = lines.findIndex((l) => l.trim() === `**${label}**`)
  if (start < 0) return []
  const out = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (/^\*\*[^*]+\*\*$/.test(line) || /^#{1,3} /.test(line)) break
    if (!line) continue
    if (line.startsWith('|')) continue // 表格行交给 extractTables
    out.push(line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim())
  }
  return out
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
    if (/^\*\*[^*]+\*\*$/.test(line) || /^#{1,3} /.test(line)) break
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
