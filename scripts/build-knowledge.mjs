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
/** 本阶段只做这两章 */
const SCOPED_CHAPTERS = [2, 15]

const CHECK_ONLY = process.argv.slice(2).includes('--check')

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'))

const pLabel = (p) => `p${String(p).padStart(3, '0')}`

async function main() {
  if (!existsSync(SRC)) {
    throw new Error(`找不到源讲义：${SRC}\n用 KNOWLEDGE_SRC 环境变量指定路径。`)
  }
  const markdown = await readFile(SRC, 'utf8')
  const { ranges, chapterTitles, lessons: all } = parseLessons(markdown)

  const videoMap = await readJson(path.join(ROOT, 'scripts', 'knowledge', 'video-map.json'))
  const summaries = await readJson(path.join(ROOT, 'scripts', 'knowledge', 'summaries.json'))
  const entities = await readJson(path.join(ROOT, 'scripts', 'knowledge', 'entities.json'))

  const scoped = all.filter((l) => SCOPED_CHAPTERS.includes(l.chapter))

  const problems = []
  for (const l of scoped) {
    if (!videoMap[l.id]) problems.push(`${l.id} 缺 video-map`)
    if (!summaries[l.id]) problems.push(`${l.id} 缺 summaries`)
    if (!entities[l.id]) problems.push(`${l.id} 缺 entities`)
    if (!l.outline.length) problems.push(`${l.id} 的知识骨架是空的`)
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
  await mkdir(OUT_DIR, { recursive: true })
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
    if (Buffer.byteLength(text) > MAX_SHARD_BYTES) {
      throw new Error(`chapter-${chapterId}.json 超过 ${MAX_SHARD_BYTES / 1024} KB`)
    }
    const file = path.join(OUT_DIR, `chapter-${String(chapterId).padStart(2, '0')}.json`)
    if (CHECK_ONLY) {
      const local = existsSync(file) ? await readFile(file, 'utf8') : ''
      if (local !== text) throw new Error(`chapter-${chapterId}.json 与源不一致`)
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
