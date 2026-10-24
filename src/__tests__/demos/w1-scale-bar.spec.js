// @vitest-environment jsdom
/**
 * §2.17 比例尺演示的回归守卫。
 *
 * 单位换算是这一节最容易错的地方：1 千米 = 100 000 厘米（五个零）。
 * 少一个零就差 10 倍，所以分母、实地距离都用公式算，不写死。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import ScaleBarDemo from '../../components/demos/ScaleBarDemo.vue'
import {
  groupDigits,
  kmToCm,
  realDistanceKm,
  scaleDenominator,
  scaleRatio,
  scaleText,
} from '../../data/scaleBarGeometry'

describe('§2.17 比例尺的算法', () => {
  it('1 千米 = 100 000 厘米', () => {
    expect(kmToCm(1)).toBe(100000)
    expect(kmToCm(50)).toBe(5000000)
  })

  it('图上 1 厘米代表实地 50 千米，比例尺是 1 : 5 000 000', () => {
    expect(scaleDenominator(1, 50)).toBe(5000000)
    expect(scaleRatio(1, 50)).toBeCloseTo(2e-7, 12)
    expect(scaleText(5000000)).toBe('1 : 5,000,000')
  })

  it('反过来：比例尺 1 : 1 000 000 时，图上 1 厘米是实地 10 千米', () => {
    expect(realDistanceKm(1, 1000000)).toBe(10)
    expect(realDistanceKm(1, 5000000)).toBe(50)
    expect(realDistanceKm(2, 1000000)).toBe(20)
  })

  it('分母越大，图上同样长度代表的实地越远（覆盖范围越大）', () => {
    expect(realDistanceKm(1, 5000000)).toBeGreaterThan(realDistanceKm(1, 1000000))
    expect(scaleDenominator(1, 50)).toBeGreaterThan(scaleDenominator(1, 10))
  })

  it('千分位只影响写法，不影响数值', () => {
    expect(groupDigits(5000000)).toBe('5,000,000')
    expect(groupDigits(1000000)).toBe('1,000,000')
    expect(groupDigits(180)).toBe('180')
  })
})

describe('§2.17 比例尺的演示', () => {
  it('渲染出四步图解', async () => {
    const wrapper = mount(ScaleBarDemo)
    await flushPromises()

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('图上 1 厘米')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('换算那一步给出的比例尺与公式一致', async () => {
    const wrapper = mount(ScaleBarDemo)
    await flushPromises()

    const next = wrapper.findAll('.demo__controls button').find((b) => b.text() === '下一步')
    await next.trigger('click')
    expect(wrapper.text()).toContain('5,000,000')
    expect(wrapper.text()).toContain('2 / 4')
  })
})
