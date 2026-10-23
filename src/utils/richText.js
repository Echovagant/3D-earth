/**
 * 把讲义要点里的 `**强调**` 渲染成 HTML。
 *
 * 讲义用加粗标出「必须记住的结论」，这个信息要保留。
 * 先把整段做 HTML 转义，再把成对的 `**…**` 换成 `<strong>`——
 * 转义在前，所以内容里的尖括号不会变成可执行标记。
 */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/** HTML 转义 */
export function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c])
}

/**
 * 转义后把 `**文字**` 换成 `<strong>文字</strong>`。
 *
 * 记号不成对时按字面文本渲染（只转义）：`**没闭合`、`****`、`**a**b**`
 * 都不会被拆成半个标签。
 */
export function renderEmphasis(text) {
  const escaped = escapeHtml(text)
  return escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}
