// @vitest-environment jsdom
/**
 * §2.3 经线演示的回归守卫。
 *
 * 经线最容易画错的是「半圆还是整圆」：
 *   ① 侧视图上的经线弧必须从一个极点到另一个极点（投影算出来的）；
 *   ② 经线长度处处相等，但经线间隔随纬度递减、到极点为 0。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import MeridianCirclesDemo from '../../components/demos/MeridianCirclesDemo.vue'
import {
  meridianArcPath,
  meridianArcPoints,
  meridianBulge,
  meridianGapKm,
  meridianLengthKm,
} from '../../data/meridianCirclesGeometry'

describe('§2.3 经线的几何', () => {
  it('侧视图上的经线弧两头都在两极上', () => {
    const points = meridianArcPoints(320, 195, 120, 40)
    expect(points[0].x).toBeCloseTo(320, 6)
    expect(points[0].y).toBeCloseTo(75, 6)
    expect(points[points.length - 1].x).toBeCloseTo(320, 6)
    expect(points[points.length - 1].y).toBeCloseTo(315, 6)
  })

  it('正对观察者的经线（λ=0）投影成一条竖直线', () => {
    const path = meridianArcPath(320, 195, 120, 0)
    const points = meridianArcPoints(320, 195, 120, 0)
    for (const p of points) expect(p.x).toBeCloseTo(320, 6)
    expect(path.startsWith('M 320.00')).toBe(true)
  })

  it('经线在赤道处的鼓出量随经度增大，靠近 90° 时贴到球面边缘', () => {
    expect(meridianBulge(120, 0)).toBeCloseTo(0, 6)
    expect(meridianBulge(120, 30)).toBeCloseTo(60, 6)
    expect(meridianBulge(120, 90)).toBeCloseTo(120, 6)
  })

  it('经线长度处处相等，约 2 万千米', () => {
    expect(meridianLengthKm(6371)).toBeCloseTo(20015, 0)
    expect(meridianLengthKm()).toBeCloseTo(meridianLengthKm(6371), 6)
  })

  it('经线间隔随纬度递减，在极点为 0', () => {
    expect(meridianGapKm(0, 1)).toBeGreaterThan(meridianGapKm(30, 1))
    expect(meridianGapKm(30, 1)).toBeGreaterThan(meridianGapKm(60, 1))
    expect(meridianGapKm(90, 1)).toBeCloseTo(0, 6)
  })
})

describe('§2.3 经线演示', () => {
  it('渲染出四步图解，标题跟着步骤走', async () => {
    const wrapper = mount(MeridianCirclesDemo)
    await flushPromises()

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('经线是从北极出发的弧')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('点「下一步」能往后走到半圆那一步', async () => {
    const wrapper = mount(MeridianCirclesDemo)
    await flushPromises()

    const next = wrapper.findAll('.demo__controls button').find((b) => b.text() === '下一步')
    await next.trigger('click')
    expect(wrapper.text()).toContain('经线是半圆，不是整圆')
    expect(wrapper.text()).toContain('2 / 4')
  })
})
