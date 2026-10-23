/**
 * 人工表的读取与合并。
 *
 * 人工表按章分片放在同目录下，每片一个文件：
 *   chXX.json → { note?, video: {...}, summaries: {...}, entities: {...} }
 *
 * 分片而不是一张大表，是为了让人能并行补不同章节——多个人（或多个 agent）
 * 往同一张表里写就会互相覆盖。按章分片后每人只碰自己那一个文件。
 */
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

/**
 * 读入某个目录下的全部分片并合并。
 *
 * @param {string} dir 分片所在目录
 * @returns {Promise<{videoMap: object, summaries: object, entities: object, files: string[]}>}
 */
export async function loadKnowledgeTables(dir) {
  const files = (await readdir(dir)).filter((f) => /^ch\d{2}\.json$/.test(f)).sort()
  if (!files.length) throw new Error(`找不到人工表分片：${dir}`)

  const parts = []
  for (const file of files) {
    parts.push({ file, ...JSON.parse(await readFile(path.join(dir, file), 'utf8')) })
  }

  const merge = (key) => {
    const merged = {}
    for (const part of parts) {
      for (const [id, value] of Object.entries(part[key] ?? {})) {
        if (id.startsWith('_')) continue
        if (merged[id] !== undefined) {
          throw new Error(`${part.file} 的 ${key} 与别的分片重复：${id}`)
        }
        merged[id] = value
      }
    }
    return merged
  }

  return {
    videoMap: merge('video'),
    summaries: merge('summaries'),
    entities: merge('entities'),
    files,
  }
}
