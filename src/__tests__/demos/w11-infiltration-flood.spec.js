// @vitest-environment jsdom
/**
 * §11.4 影响下渗的因素与城市内涝的契约测试。
 *
 * 两处最容易讲错的地方在这里钉死：
 *   ① 降水强度与下渗成**负相关**——四类条件的方向全部指向「下渗↑」，
 *      但没有一条是「雨越大渗得越多」；
 *   ② 城市内涝的链条顺序：硬化路面 → 下渗↓ → 地下径流↓ → 地表径流↑ → 地表积水。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import {
  FLOOD_CHAIN,
  INFILTRATION_FACTORS,
  INFILTRATION_SHARE,
  SOLUTIONS,
  infiltrationArrowLength,
  shareBar,
} from '../../data/infiltrationFloodGeometry'
import InfiltrationFloodDemo from '../../components/demos/InfiltrationFloodDemo.vue'

describe('§11.4 下渗的因素', () => {
  it('四类条件齐全，方向全部指向下渗增加', () => {
    expect(INFILTRATION_FACTORS.map((f) => f.id)).toEqual([
      'intensity',
      'slope',
      'vegetation',
      'permeability',
    ])
    for (const f of INFILTRATION_FACTORS) expect(f.effect).toBe('下渗↑')
  })

  it('降水强度与下渗成负相关，不是「雨越多渗得越多」', () => {
    const intensity = INFILTRATION_FACTORS.find((f) => f.id === 'intensity')
    expect(intensity.label).toBe('降水强度↓')
    expect(intensity.effect).toBe('下渗↑')
  })
})

describe('§11.4 下渗占比的数值', () => {
  it('讲义里的真实数据：自然 25%、浅城 10%、深城 5%', () => {
    expect(INFILTRATION_SHARE.natural).toBe(25)
    expect(INFILTRATION_SHARE.shallowUrban).toBe(10)
    expect(INFILTRATION_SHARE.deepUrban).toBe(5)
  })

  it('条形长度严格按百分比成正比', () => {
    const w = 480
    expect(shareBar(25, w, 30)).toBeCloseTo(400, 6)
    expect(shareBar(10, w, 30)).toBeCloseTo(160, 6)
    expect(shareBar(5, w, 30)).toBeCloseTo(80, 6)
    // 城市路面的下渗只有自然路面的五分之一
    expect(shareBar(25, w, 30) / shareBar(5, w, 30)).toBeCloseTo(5, 6)
  })

  it('默认满量程是 100%', () => {
    expect(shareBar(25, 200)).toBeCloseTo(50, 6)
    expect(shareBar(5, 200)).toBeCloseTo(10, 6)
  })

  it('下渗箭头长度同样按占比折算：自然地面的箭头是城市的五倍', () => {
    const natural = infiltrationArrowLength(INFILTRATION_SHARE.natural, 80, 30)
    const urban = infiltrationArrowLength(INFILTRATION_SHARE.deepUrban, 80, 30)
    expect(natural / urban).toBeCloseTo(5, 6)
    expect(urban).toBeLessThan(natural)
  })
})

describe('§11.4 城市内涝', () => {
  it('成因链的顺序不能乱', () => {
    expect(FLOOD_CHAIN.map((c) => c.label)).toEqual([
      '硬化路面',
      '下渗↓',
      '地下径流↓',
      '地表径流↑',
      '地表积水',
    ])
  })

  it('四条应对措施记全了', () => {
    expect(SOLUTIONS.map((s) => s.label)).toEqual(['海绵城市', '屋顶花园', '透水砖', '植草沟'])
  })
})

describe('§11.4 演示组件', () => {
  it('渲染出四步图解，标题跟着步骤走', async () => {
    const wrapper = mount(InfiltrationFloodDemo)
    await flushPromises()

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('下渗强弱看什么')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('点「下一步」能往后走', async () => {
    const wrapper = mount(InfiltrationFloodDemo)
    await flushPromises()

    const next = wrapper.findAll('.demo__controls button').find((b) => b.text() === '下一步')
    await next.trigger('click')
    expect(wrapper.text()).toContain('自然地面')
    expect(wrapper.text()).toContain('2 / 4')

    await next.trigger('click')
    expect(wrapper.text()).toContain('城市地面')
    expect(wrapper.text()).toContain('3 / 4')

    await next.trigger('click')
    expect(wrapper.text()).toContain('治理')
    expect(wrapper.text()).toContain('4 / 4')
  })
})
