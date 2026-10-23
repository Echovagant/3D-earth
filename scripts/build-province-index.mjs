#!/usr/bin/env node
/**
 * 省份名称索引：把 34 个省份数据文件里的名称、简称、省会汇成一份小索引。
 *
 * 为什么要单独一份：
 *   - 知识点页一打开就要显示 34 个省名，逐个去请求会发出 34 个并发请求
 *   - 搜索要能按省名命中知识点，但知识点数据里存的是 adcode
 * 一份两 KB 的索引同时解掉这两个问题。
 *
 * 用法：
 *   node scripts/build-province-index.mjs          生成并写入
 *   node scripts/build-province-index.mjs --check  只校验索引与省份数据是否一致
 */

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROVINCE_DIR = path.join(ROOT, 'public', 'data', 'provinces')
const INDEX_FILE = path.join(PROVINCE_DIR, 'index.json')

const CHECK_ONLY = process.argv.slice(2).includes('--check')

/** 索引里收录的字段。省名、简称、省会是教学层唯一用到的三个。 */
const FIELDS = ['name', 'abbreviation', 'capital']

async function main() {
  if (!existsSync(PROVINCE_DIR)) {
    throw new Error(`找不到省份数据目录：${PROVINCE_DIR}`)
  }

  const files = (await readdir(PROVINCE_DIR)).filter((f) => /^\d{6}\.json$/.test(f))
  if (!files.length) {
    throw new Error(`${PROVINCE_DIR} 里没有省份数据文件`)
  }

  const provinces = {}
  for (const file of files) {
    const data = JSON.parse(await readFile(path.join(PROVINCE_DIR, file), 'utf8'))
    const adcode = String(data.adcode ?? path.basename(file, '.json'))
    const entry = {}
    for (const field of FIELDS) {
      const value = data[field]
      if (!value) throw new Error(`${file} 缺 ${field}`)
      entry[field] = String(value)
    }
    provinces[adcode] = entry
  }

  // 按 adcode 排序，保证同样的输入产出同样的字节
  const sorted = Object.fromEntries(
    Object.keys(provinces)
      .sort()
      .map((k) => [k, provinces[k]]),
  )

  const payload = {
    generatedAt: new Date().toISOString().slice(0, 10),
    provinces: sorted,
  }
  const text = `${JSON.stringify(payload, null, 2)}\n`

  if (CHECK_ONLY) {
    const local = existsSync(INDEX_FILE) ? await readFile(INDEX_FILE, 'utf8') : ''
    // generatedAt 是生成日期，与省份数据无关——校验时排除，否则第二天必然不一致
    const stripDate = (t) => t.replace(/"generatedAt": "[^"]*"/, '"generatedAt": ""')
    if (stripDate(local) !== stripDate(text)) {
      throw new Error('省份名称索引与省份数据不一致，重新跑 npm run province:index')
    }
    console.log(`✓ 省份名称索引与省份数据一致（${Object.keys(sorted).length} 个）`)
    return
  }

  await writeFile(INDEX_FILE, text, 'utf8')
  console.log(`✓ 省份名称索引已生成：${Object.keys(sorted).length} 个省，${Buffer.byteLength(text)} 字节`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`\n生成失败：${error.message}`)
    process.exitCode = 1
  })
}
