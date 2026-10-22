// @vitest-environment node
// 知识数据的契约测试。
//
// 这份数据是「提纲级」的，不是正文——所以除了字段完整性，
// 还要守两条线：① 不能有长段落漏进来；② 36 节的映射表必须完整。
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => JSON.parse(readFileSync(path.join(repoRoot, p), 'utf-8'))

const index = read('public/data/knowledge/index.json')
const videoMap = read('scripts/knowledge/video-map.json')
const summaries = read('scripts/knowledge/summaries.json')
const entities = read('scripts/knowledge/entities.json')

const chapters = [2, 15].map((c) => read(`public/data/knowledge/chapter-${String(c).padStart(2, '0')}.json`))
const lessons = chapters.flatMap((c) => c.lessons)
const SCOPED = ['02', '15']

describe('知识数据', () => {
  it('覆盖 §2 与 §15 的 36 个小节', () => {
    expect(lessons).toHaveLength(36)
    expect(lessons.filter((l) => l.chapter === 2)).toHaveLength(26)
    expect(lessons.filter((l) => l.chapter === 15)).toHaveLength(10)
  })

  it('每节都有 id、标题、摘要与视频分P', () => {
    for (const l of lessons) {
      expect(l.id, '缺少 id').toMatch(/^\d+\.\d+$/)
      expect(l.chapter).toBe(Number(l.id.split('.')[0]))
      expect(l.title, `${l.id} 缺少标题`).toBeTruthy()
      expect(l.summary, `${l.id} 缺少摘要`).toBeTruthy()
      expect(l.video, `${l.id} 缺少视频信息`).toBeTruthy()
      expect(l.video.bvid).toBe('BV1RN4y1f7Hn')
      expect(l.video.p, `${l.id} 的分P号越界`).toBeGreaterThanOrEqual(1)
      expect(l.video.p, `${l.id} 的分P号越界`).toBeLessThanOrEqual(158)
    }
  })

  it('骨架清单非空', () => {
    for (const l of lessons) {
      expect(l.outline.length, `${l.id} 的知识骨架是空的`).toBeGreaterThan(0)
    }
  })

  it('不含成段正文：任何一行不超过 220 字符', () => {
    // 判据是**单行**长度：续行 bullet 用 \n 分隔，多条拼起来可以很长，
    // 但每一条都短；真正的正文是一整行长句。
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
          expect(
            line.length,
            `${l.id} 有超长行，疑似正文泄漏：${line.slice(0, 40)}…`,
          ).toBeLessThanOrEqual(220)
        }
      }
    }
  })

  it('不含图片直链', () => {
    const text = JSON.stringify(lessons)
    expect(text).not.toMatch(/https?:\/\/[^"']*\.(jpg|jpeg|png|gif|webp)/i)
  })

  it('依赖引用指向存在的节', () => {
    const ids = new Set(lessons.map((l) => l.id))
    for (const l of lessons) {
      for (const ref of [...l.prereq, ...l.next]) {
        expect(ids.has(ref), `${l.id} 引用了不存在的 ${ref}`).toBe(true)
      }
    }
  })

  it('人工映射表覆盖全部 36 节', () => {
    for (const l of lessons) {
      expect(videoMap[l.id], `video-map.json 缺 ${l.id}`).toBeTypeOf('number')
      expect(summaries[l.id], `summaries.json 缺 ${l.id}`).toBeTruthy()
      expect(entities[l.id], `entities.json 缺 ${l.id}`).toBeTruthy()
    }
    // 映射表不该有多余条目
    for (const key of Object.keys(videoMap)) {
      expect(lessons.some((l) => l.id === key), `video-map.json 多余条目 ${key}`).toBe(true)
    }
  })

  it('索引覆盖全部 15 章，并标出哪些有内容', () => {
    expect(index.chapters).toHaveLength(15)
    const withContent = index.chapters.filter((c) => c.hasContent)
    expect(withContent.map((c) => c.id)).toEqual([2, 15])
    expect(index.totalLessons).toBe(36)
  })

  it('单片 JSON 不超过 150 KB', () => {
    for (const c of SCOPED) {
      const file = path.join(repoRoot, `public/data/knowledge/chapter-${c}.json`)
      expect(existsSync(file)).toBe(true)
      expect(readFileSync(file).length / 1024).toBeLessThanOrEqual(150)
    }
  })
})
