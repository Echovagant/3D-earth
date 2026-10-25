// @vitest-environment jsdom
/**
 * 讲解层的契约：图上标的元素、说明表、面板里显示的内容必须对得上。
 *
 * 这层最容易出的三类错：
 *   ① 图元加了 data-explain，说明表里漏了这条 → 点了没反应
 *   ② 说明表里写了图上没有的 id → chips 里出现一个点不亮的词条
 *   ③ 推导步骤里的 {占位符} 没有对应的 vars → 面板上原样显示着大括号
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import { DEMO_LOADERS } from '../data/demos'
import { fillTemplate, resolveExplain, resolveExplains } from '../data/svgExplain'
import DemoShell from '../components/DemoShell.vue'

describe('讲解步骤的模板替换', () => {
  it('把 {变量} 换成实际值', () => {
    expect(fillTemplate('cotδ = {cot}', { cot: '2.30' })).toBe('cotδ = 2.30')
  })

  it('同一个占位符出现多次全都替换', () => {
    expect(fillTemplate('{a} 与 {a}', { a: '7' })).toBe('7 与 7')
  })

  it('没有对应值的占位符原样留着——宁可露出来也不要显示错的数', () => {
    expect(fillTemplate('δ = {decl}', { other: '1' })).toBe('δ = {decl}')
  })

  it('说明表填好后，标题、提示、步骤都拿到了', () => {
    const one = resolveExplain({
      name: '比例尺 1:{denom}',
      hint: 'δ = {decl}',
      vars: { decl: '23.5°N', cot: '2.30', denom: '500 万' },
      steps: ['cotδ = {cot}', 'H = ±90°'],
    })
    expect(one.name).toBe('比例尺 1:500 万')
    expect(one.hint).toBe('δ = 23.5°N')
    expect(one.steps).toEqual(['cotδ = 2.30', 'H = ±90°'])
  })

  it('词条名里也不能露出没替换的占位符', () => {
    const one = resolveExplain({ name: '比例尺 1:{denom}', vars: { denom: '500 万' } })
    expect(one.name).not.toMatch(/\{/)
  })

  it('整张说明表一起展开', () => {
    const all = resolveExplains({ a: { name: '甲', hint: 'x' }, b: { name: '乙' } })
    expect(Object.keys(all)).toEqual(['a', 'b'])
    expect(all.b.steps).toEqual([])
  })
})

describe('讲解层：外壳的行为', () => {
  const explains = {
    terminator: {
      name: '晨昏线',
      hint: '昼半球的边界',
      vars: { decl: '23.5°N' },
      steps: ['tanφ = −cotδ·cosH', 'δ = {decl}'],
    },
  }

  it('没有说明表时不渲染讲解面板', () => {
    const wrapper = mount(DemoShell, { props: { steps: [{ id: 'a', title: 't', text: 'x' }] } })
    expect(wrapper.find('.demo__inspect').exists()).toBe(false)
  })

  it('有说明表时渲染出元素清单', () => {
    const wrapper = mount(DemoShell, {
      props: { steps: [{ id: 'a', title: 't', text: 'x' }], explains },
    })
    expect(wrapper.find('.demo__inspect').exists()).toBe(true)
    expect(wrapper.findAll('.demo__chip')).toHaveLength(1)
    expect(wrapper.find('.demo__chip').text()).toBe('晨昏线')
  })

  it('没选中任何元素时给一句提示', () => {
    const wrapper = mount(DemoShell, {
      props: { steps: [{ id: 'a', title: 't', text: 'x' }], explains },
    })
    expect(wrapper.find('.demo__inspect-tip').text()).toContain('移到图上')
  })

  it('点元素清单里的词条，展开推导步骤', async () => {
    const wrapper = mount(DemoShell, {
      props: { steps: [{ id: 'a', title: 't', text: 'x' }], explains },
    })
    await wrapper.find('.demo__chip').trigger('click')
    const steps = wrapper.findAll('.demo__inspect-steps li').map((li) => li.text())
    expect(steps).toEqual(['tanφ = −cotδ·cosH', 'δ = 23.5°N'])
  })

  it('推导里的占位符真的被替换了，不能出现 {decl} 这种原样', async () => {
    const wrapper = mount(DemoShell, {
      props: { steps: [{ id: 'a', title: 't', text: 'x' }], explains },
    })
    await wrapper.find('.demo__chip').trigger('click')
    const text = wrapper.find('.demo__inspect-steps').text()
    expect(text).not.toMatch(/\{decl\}/)
  })
})

describe('讲解层：演示与说明表一一对应', () => {
  it('图上标的每个元素都有说明，说明里的每个 id 都有图元', async () => {
    const problems = []
    for (const [id, loader] of Object.entries(DEMO_LOADERS)) {
      const module = await loader()
      const wrapper = mount(module.default)
      await flushPromises()

      const tagged = new Set(
        wrapper.findAll('.demo__canvas [data-explain]').map((el) => el.attributes('data-explain')),
      )
      const explains = wrapper.findComponent(DemoShell).props('explains')
      if (!explains) {
        if (tagged.size > 0) problems.push(`${id}：图上有可讲解元素，却没给说明表`)
        continue
      }

      for (const eid of tagged) {
        if (!explains[eid]) problems.push(`${id}：图元 ${eid} 没有对应的说明`)
      }
      for (const [eid, entry] of Object.entries(explains)) {
        if (!tagged.has(eid)) problems.push(`${id}：说明表里的 ${eid} 在图上找不到`)
        if (!entry.name) problems.push(`${id}：${eid} 缺 name`)
        if (!entry.hint) problems.push(`${id}：${eid} 缺 hint`)
        for (const line of entry.steps ?? []) {
          for (const m of String(line).matchAll(/\{(\w+)\}/g)) {
            if (!Object.prototype.hasOwnProperty.call(entry.vars ?? {}, m[1])) {
              problems.push(`${id}：${eid} 的步骤里 {${m[1]}} 没有对应的 vars`)
            }
          }
        }
      }
    }
    expect(problems, '讲解层与图对不上').toEqual([])
  }, 60000)
})
