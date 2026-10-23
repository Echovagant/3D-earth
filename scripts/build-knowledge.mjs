#!/usr/bin/env node
/**
 * 课程讲义 → 知识数据产物。
 *
 * 源讲义在仓库外（默认 ../_source/），解析后的提纲级 JSON 进仓库。
 * CI 与 Pages 构建只需要产物，不需要源文件——这样版权链条最短。
 *
 * 用法：
 *   node scripts/build-knowledge.mjs          生成并写入产物
 *   node scripts/build-knowledge.mjs --check  只校验产物与源是否一致
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { parseLessons } from './knowledge/parse-lessons.mjs'
import { loadKnowledgeTables } from './knowledge/tables.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC =
  process.env.KNOWLEDGE_SRC ??
  path.resolve(ROOT, '..', '_source', '高中地理基础课程_学习理解版.md')
const OUT_DIR = path.join(ROOT, 'public', 'data', 'knowledge')
const BVID = 'BV1RN4y1f7Hn'
/** 单片体积上限 */
const MAX_SHARD_BYTES = 150 * 1024
/** 单字段长度上限——超过就是成段正文漏进来了 */
const MAX_FIELD_CHARS = 220
/** 自撰摘要长度上限 */
const MAX_SUMMARY_CHARS = 60
/** 视频分P 号的合法范围（系列共 158 集） */
const MIN_PART = 1
const MAX_PART = 158
/** 本阶段收录的章。§3/§4/§7/§11 是互动实验已经触及的机制章，补上后实验与提纲能互链 */
const SCOPED_CHAPTERS = [2, 3, 4, 7, 11, 15]

const CHECK_ONLY = process.argv.slice(2).includes('--check')

/**
 * 人工表的读取与合并见 scripts/knowledge/tables.mjs（构建脚本与契约测试共用一套）。
 */

const pLabel = (p) => `p${String(p).padStart(3, '0')}`

/** 人工表里以 `_` 开头的键是说明性备注，不参与节级映射 */
const lessonKeys = (table) => Object.keys(table).filter((k) => !k.startsWith('_'))

async function main() {
  if (!existsSync(SRC)) {
    // 源讲义在仓库外，CI 与别人机器上没有。只校验时跳过，但要说清楚跳过了。
    if (CHECK_ONLY) {
      console.log(`⚠ 找不到源讲义，跳过一致性校验：${SRC}\n  用 KNOWLEDGE_SRC 环境变量指定路径。`)
      return
    }
    throw new Error(`找不到源讲义：${SRC}\n用 KNOWLEDGE_SRC 环境变量指定路径。`)
  }
  const markdown = await readFile(SRC, 'utf8')
  const { ranges, chapterTitles, lessons: all } = parseLessons(markdown)

  const { videoMap, summaries, entities } = await loadKnowledgeTables(
    path.join(ROOT, 'scripts', 'knowledge'),
  )

  const scoped = all.filter((l) => SCOPED_CHAPTERS.includes(l.chapter))

  const problems = []
  for (const l of scoped) {
    if (!videoMap[l.id]) problems.push(`${l.id} 缺 video-map`)
    if (!summaries[l.id]) problems.push(`${l.id} 缺 summaries`)
    if (!entities[l.id]) problems.push(`${l.id} 缺 entities`)
    // 骨架可以是要点列表，也可以是一张表——§7.9 的「知识骨架」在讲义里
    // 就是南北半球风带对照表，解析器把表格行交给 extractTables，
    // 要点列表就是空的。这种情况下表格就是骨架，两者都空才是缺内容。
    if (!l.outline.length && !l.tables.length) problems.push(`${l.id} 的知识骨架是空的`)
  }
  // 人工表的取值要合法
  for (const l of scoped) {
    const p = videoMap[l.id]
    if (typeof p !== 'number' || !Number.isInteger(p) || p < MIN_PART || p > MAX_PART) {
      problems.push(`${l.id} 的分P 号 ${JSON.stringify(p)} 不在 ${MIN_PART}–${MAX_PART} 之间`)
    }
    const summary = String(summaries[l.id] ?? '')
    if (summary.length > MAX_SUMMARY_CHARS) {
      problems.push(`${l.id} 的摘要 ${summary.length} 字，超过 ${MAX_SUMMARY_CHARS} 字`)
    }
    const e = entities[l.id]
    for (const field of ['provinces', 'countries', 'regions']) {
      if (!Array.isArray(e?.[field])) {
        problems.push(`${l.id} 的 entities.${field} 不是数组`)
      }
    }
  }
  // 人工表不该有多余条目
  const scopedIds = new Set(scoped.map((l) => l.id))
  for (const [name, table] of [
    ['分片表 video', videoMap],
    ['分片表 summaries', summaries],
    ['分片表 entities', entities],
  ]) {
    for (const key of lessonKeys(table)) {
      if (!scopedIds.has(key)) problems.push(`${name} 有多余条目 ${key}`)
    }
  }
  if (problems.length) {
    throw new Error(`映射表不完整：\n  ${problems.slice(0, 20).join('\n  ')}`)
  }

  // prereq / next 写解析器给的完整列表：跨阶段引用（如 §2.1 → §1.2）也保留。
  // 尚未收录的节由前端渲染成纯文本标签，不在这里过滤——过滤会让「前置」显示成「无」。
  // 章级引用（§3 地球的自转）是第三种形态，单独放在 prereqChapters / nextChapters 里，
  // 同样完整保留——课程地图要靠它显示「这节接着 §3」。
  const lessons = scoped.map((l) => ({
    id: l.id,
    chapter: l.chapter,
    title: l.title,
    summary: summaries[l.id],
    video: { bvid: BVID, p: videoMap[l.id], label: pLabel(videoMap[l.id]) },
    sourceLabel: l.sourceLabel,
    exam: l.exam,
    outline: l.outline,
    mustKnow: l.mustKnow,
    pitfalls: l.pitfalls,
    questionTypes: l.questionTypes,
    tables: l.tables,
    prereq: l.prereq,
    prereqChapters: l.prereqChapters,
    next: l.next,
    nextChapters: l.nextChapters,
    entities: entities[l.id],
  }))

  // 守门：正文泄漏
  // 判据是**单行**长度，不是整条拼接值的长度——
  // 讲义的续行 bullet 用 \n 分隔，多条要点拼起来可以很长（§15.1 的 exam 366 字），
  // 但每一条都短；真正的正文是一整行长句。逐行判断才对。
  for (const l of lessons) {
    const strings = [
      l.title,
      l.summary,
      l.sourceLabel,
      l.exam,
      ...l.outline,
      ...l.mustKnow,
      ...l.pitfalls,
      ...l.questionTypes,
      // 表格的每一格也要过闸门：漏了它，正文就能从表格进来
      ...l.tables.flatMap((t) => [...t.header, ...t.rows.flat()]),
      ...l.entities.provinces,
      ...l.entities.countries,
      ...l.entities.regions,
    ]
    for (const s of strings) {
      for (const line of String(s).split('\n')) {
        if (line.length > MAX_FIELD_CHARS) {
          throw new Error(
            `${l.id} 有一行 ${line.length} 字符，疑似正文泄漏：${line.slice(0, 40)}…`,
          )
        }
      }
    }
  }

  // 产物
  // --check 只读不写：不建目录，免得「目录不存在」被悄悄补出来
  if (!CHECK_ONLY) await mkdir(OUT_DIR, { recursive: true })
  const shards = []
  for (const chapterId of SCOPED_CHAPTERS) {
    const chapterLessons = lessons.filter((l) => l.chapter === chapterId)
    const payload = {
      chapter: chapterId,
      title: chapterTitles[String(chapterId)] ?? '',
      range: ranges[String(chapterId)] ?? null,
      lessons: chapterLessons,
    }
    const text = `${JSON.stringify(payload, null, 2)}\n`
    const file = path.join(OUT_DIR, `chapter-${String(chapterId).padStart(2, '0')}.json`)
    if (Buffer.byteLength(text) > MAX_SHARD_BYTES) {
      throw new Error(`${path.basename(file)} 超过 ${MAX_SHARD_BYTES / 1024} KB`)
    }
    if (CHECK_ONLY) {
      const local = existsSync(file) ? await readFile(file, 'utf8') : ''
      if (local !== text) throw new Error(`${path.basename(file)} 与源不一致`)
    } else {
      await writeFile(file, text, 'utf8')
    }
    shards.push({ file, payload, bytes: Buffer.byteLength(text) })
  }

  const index = {
    generatedAt: new Date().toISOString().slice(0, 10),
    bvid: BVID,
    chapters: Object.keys(chapterTitles)
      .map(Number)
      .sort((a, b) => a - b)
      .map((id) => {
        const count = lessons.filter((l) => l.chapter === id).length
        return {
          id,
          title: chapterTitles[String(id)],
          lessonCount: count,
          hasContent: count > 0,
          range: ranges[String(id)] ?? null,
        }
      }),
    totalLessons: lessons.length,
  }
  const indexText = `${JSON.stringify(index, null, 2)}\n`
  const indexFile = path.join(OUT_DIR, 'index.json')
  if (CHECK_ONLY) {
    const local = existsSync(indexFile) ? await readFile(indexFile, 'utf8') : ''
    // generatedAt 是生成日期，与源无关——校验时排除，否则第二天必然不一致
    const stripDate = (text) => text.replace(/"generatedAt": "[^"]*"/, '"generatedAt": ""')
    if (stripDate(local) !== stripDate(indexText)) throw new Error('index.json 与源不一致')
  } else {
    await writeFile(indexFile, indexText, 'utf8')
  }

  if (CHECK_ONLY) {
    console.log('✓ 知识数据与源讲义一致')
    return
  }
  console.log(`✓ 知识数据已生成：${lessons.length} 节，${shards.length} 个分片`)
  for (const s of shards) {
    console.log(`  ${path.basename(s.file)}  ${(s.bytes / 1024).toFixed(0)} KB`)
  }
  console.log(`  index.json  ${(Buffer.byteLength(indexText) / 1024).toFixed(0)} KB`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`\n生成失败：${error.message}`)
    process.exitCode = 1
  })
}
