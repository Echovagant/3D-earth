/**
 * 图上元素的讲解：悬停高亮 + 点开看推导。
 *
 * 演示里的图元带 `data-explain="<id>"`，外壳靠事件委托拿到 id，
 * 去说明表里查这一条：
 *
 *   {
 *     晨昏线: {
 *       name: '晨昏线',            // 面板标题
 *       hint: '一句话说明',          // 悬停时显示
 *       vars: { decl: '23.5°' },  // 推导里要代入的数值
 *       steps: ['tanφ = −cotδ·cosH', 'cotδ = {cotDecl}'],
 *     },
 *   }
 *
 * **steps 里的数字必须来自几何函数，不能手写**——所以写成 `{变量}` 占位，
 * 由 vars 填进去。这样参数一动，讲解里的数字跟着几何一起变，
 * 不会出现「图上 66.5°、文字写着 65°」这种对不上的情况。
 */

/** 把 {变量} 占位替换成实际值；占位符不存在就原样留着（方便排错） */
export function fillTemplate(text, vars) {
  if (!vars) return String(text)
  return String(text).replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  )
}

/**
 * 一条说明的最终形态：标题、提示、填好数值的推导步骤。
 *
 * @param {object} entry 说明表里的一条
 * @returns {{name: string, hint: string, steps: string[]}}
 */
export function resolveExplain(entry) {
  if (!entry) return { name: '', hint: '', steps: [] }
  const vars = entry.vars ?? {}
  return {
    name: entry.name ?? '',
    hint: fillTemplate(entry.hint ?? '', vars),
    steps: (entry.steps ?? []).map((s) => fillTemplate(s, vars)),
  }
}

/**
 * 把说明表摊平成「id → 已填好数值的说明」。
 *
 * @param {object} table 说明表
 * @returns {Record<string, {name: string, hint: string, steps: string[]}>}
 */
export function resolveExplains(table) {
  const out = {}
  for (const [id, entry] of Object.entries(table ?? {})) {
    out[id] = resolveExplain(entry)
  }
  return out
}
