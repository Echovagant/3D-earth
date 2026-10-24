// @vitest-environment jsdom
/**
 * §2.2 纬线演示的回归守卫。
 *
 * 纬线最容易画错的是两件事：
 *   ① 俯视图里同心圆的大小关系反了（纬度越高半径越小）；
 *   ② 侧视图上把纬线的位置画成了等距（正交投影不是等距的）。
 * 所以这里锁死几何函数的数值，再锁组件本身能渲染、能逐步切换。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import LatitudeCirclesDemo from '../../components/demos/LatitudeCirclesDemo.vue'
import {
  EARTH_RADIUS_KM,
  equidistantY,
  latitudeGapKm,
  latitudeHalfWidth,
  latitudeSegment,
  latitudeY,
  parallelLengthKm,
  polarRadius,
} from '../../data/latitudeCirclesGeometry'

describe('§2.2 纬线的几何', () => {
  it('侧视图上纬线的高度是 cy − R·sinφ', () => {
    expect(latitudeY(0, 195, 125)).toBe(195)
    expect(latitudeY(90, 195, 125)).toBe(70)
    expect(latitudeY(-90, 195, 125)).toBe(320)
    expect(latitudeY(30, 195, 125)).toBeCloseTo(132.5, 6)
  })

  it('侧视图上纬线的半宽是 R·cosφ——赤道最长，向两极收窄', () => {
    expect(latitudeHalfWidth(0, 125)).toBe(125)
    expect(latitudeHalfWidth(60, 125)).toBeCloseTo(62.5, 6)
    expect(latitudeHalfWidth(90, 125)).toBeCloseTo(0, 6)
  })

  it('俯视图里纬线是同心圆，纬度越高半径越小', () => {
    expect(polarRadius(0, 125)).toBe(125)
    expect(polarRadius(30, 125)).toBeCloseTo(108.25, 2)
    expect(polarRadius(60, 125)).toBeCloseTo(62.5, 6)
    expect(polarRadius(90, 125)).toBeCloseTo(0, 6)
    // 半径必须随纬度单调变小
    for (let lat = 0; lat < 90; lat += 5) {
      expect(polarRadius(lat + 5, 125)).toBeLessThan(polarRadius(lat, 125))
    }
  })

  it('纬线长度按 2πR·cosφ 算，赤道约 4 万千米、向两极递减', () => {
    expect(parallelLengthKm(0, EARTH_RADIUS_KM)).toBeCloseTo(40030, 0)
    expect(parallelLengthKm(30, EARTH_RADIUS_KM)).toBeCloseTo(34667, 0)
    expect(parallelLengthKm(60, EARTH_RADIUS_KM)).toBeCloseTo(20015, 0)
    expect(parallelLengthKm(90, EARTH_RADIUS_KM)).toBeCloseTo(0, 6)
    expect(parallelLengthKm(60)).toBeLessThan(parallelLengthKm(30))
    expect(parallelLengthKm(30)).toBeLessThan(parallelLengthKm(0))
  })

  it('相邻纬线的实地间隔处处相等（1° 约 111 千米）', () => {
    expect(latitudeGapKm(1)).toBe(111)
    expect(latitudeGapKm(30)).toBe(3330)
    // 柱面展开图上纬度线等距
    expect(equidistantY(90, 70, 300)).toBe(70)
    expect(equidistantY(0, 70, 300)).toBe(185)
    expect(equidistantY(-90, 70, 300)).toBe(300)
    expect(equidistantY(30, 70, 300) - equidistantY(60, 70, 300)).toBeCloseTo(
      equidistantY(0, 70, 300) - equidistantY(30, 70, 300),
      6,
    )
  })

  it('纬线这一段的端点对称，落在球面上', () => {
    const seg = latitudeSegment(30, 360, 195, 125)
    expect(seg.x1).toBeCloseTo(360 - 125 * Math.cos(Math.PI / 6), 6)
    expect(seg.x2).toBeCloseTo(360 + 125 * Math.cos(Math.PI / 6), 6)
    expect(seg.y).toBeCloseTo(latitudeY(30, 195, 125), 6)
  })
})

describe('§2.2 纬线演示', () => {
  it('渲染出四步图解，标题跟着步骤走', async () => {
    const wrapper = mount(LatitudeCirclesDemo)
    await flushPromises()

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('纬线是一条条平行的横线')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('点步骤圆点能直接跳到最后一步', async () => {
    const wrapper = mount(LatitudeCirclesDemo)
    await flushPromises()

    const dots = wrapper.findAll('.demo__dot')
    await dots[3].trigger('click')
    expect(wrapper.text()).toContain('相邻纬线之间的间隔处处相等')
    expect(wrapper.text()).toContain('4 / 4')
  })
})
