// @vitest-environment node
// 行内加粗渲染的契约测试。
//
// 讲义要点里用 `**…**` 标出必背处。这个工具要保证两件事：
// ① 成对的记号渲染成 <strong>，不残留字面星号；
// ② 内容里的尖括号先被转义，不会变成可执行标记。
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { escapeHtml, renderEmphasis } from '../utils/richText'

const repoRoot = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => JSON.parse(readFileSync(path.join(repoRoot, p), 'utf-8'))

describe('HTML 转义', () => {
  it('转义五个危险字符', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;')
  })

  it('空值转成空串', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
    expect(escapeHtml('')).toBe('')
  })

  it('普通文字原样返回', () => {
    expect(escapeHtml('经度差 < 180°')).toBe('经度差 &lt; 180°')
  })
})

describe('行内加粗渲染', () => {
  it('成对的记号渲染成 strong', () => {
    expect(renderEmphasis('**等高距**是高度差')).toBe('<strong>等高距</strong>是高度差')
  })

  it('一段里可以有多处加粗', () => {
    expect(renderEmphasis('**甲**和**乙**')).toBe('<strong>甲</strong>和<strong>乙</strong>')
  })

  it('先转义再替换：内容里的标签不会被还原', () => {
    expect(renderEmphasis('**<script>alert(1)</script>**')).toBe(
      '<strong>&lt;script&gt;alert(1)&lt;/script&gt;</strong>',
    )
    expect(renderEmphasis('<img src=x onerror=alert(1)>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;',
    )
  })

  it('加粗内容里的引号同样被转义', () => {
    expect(renderEmphasis('**"引号"**')).toBe('<strong>&quot;引号&quot;</strong>')
  })

  it('没有成对记号时只转义', () => {
    expect(renderEmphasis('**没闭合')).toBe('**没闭合')
    expect(renderEmphasis('普通文字')).toBe('普通文字')
  })

  it('记号不成对时按字面文本渲染', () => {
    // 两个记号挨在一起、中间没有内容：不成对，不该拆成标签
    expect(renderEmphasis('****')).toBe('****')
    // 开头成对、结尾落单：只渲染成对的那一段，落单的记号留作字面文本
    expect(renderEmphasis('**a**b**')).toBe('<strong>a</strong>b**')
  })

  it('空值不会抛异常', () => {
    expect(renderEmphasis(null)).toBe('')
    expect(renderEmphasis(undefined)).toBe('')
  })
})

describe('讲义数据里的加粗', () => {
  const lessons = ['02', '15']
    .map((c) => read(`public/data/knowledge/chapter-${c}.json`))
    .flatMap((c) => c.lessons)

  it('每条要点的记号都成对，渲染后不残留字面星号与裸尖括号', () => {
    for (const lesson of lessons) {
      const items = [
        lesson.exam,
        ...lesson.outline,
        ...lesson.mustKnow,
        ...lesson.pitfalls,
        ...lesson.questionTypes,
      ]
      for (const item of items) {
        const html = renderEmphasis(item)
        expect(html.includes('**'), `${lesson.id} 残留了字面星号`).toBe(false)
        // 除了渲染出来的 strong 标签，不该再有别的尖括号
        const withoutTags = html.replace(/<\/?strong>/g, '')
        expect(
          withoutTags.includes('<') || withoutTags.includes('>'),
          `${lesson.id} 出现了裸尖括号`,
        ).toBe(false)
      }
    }
  })
})
