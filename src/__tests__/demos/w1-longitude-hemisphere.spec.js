// @vitest-environment jsdom
/**
 * §2.9 东西经半球展开法演示的回归守卫。
 *
 * 展开图的两条命门：
 *   ① 0° 与 180° 落在直径的两端（东经半球 0° 在左、西经半球 0° 在右）；
 *   ② 「自西向东度数变大 = 东经」不能反。
 */
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import LongitudeHemisphereDemo from '../../components/demos/LongitudeHemisphereDemo.vue'
import {
  degreesIncreaseEastward,
  hemisphereMeridianPath,
  hemisphereMeridianX,
  hemisphereParallelPath,
  longitudeLabel,
} from '../../data/longitudeHemisphereGeometry'

describe('§2.9 半球展开图的几何', () => {
  it('东经半球：0° 在左端、180° 在右端', () => {
    expect(hemisphereMeridianX(185, 110, 0, 'east')).toBeCloseTo(75, 6)
    expect(hemisphereMeridianX(185, 110, 180, 'east')).toBeCloseTo(295, 6)
    expect(hemisphereMeridianX(185, 110, 90, 'east')).toBeCloseTo(185, 6)
  })

  it('西经半球：180° 在左端、0° 在右端', () => {
    expect(hemisphereMeridianX(535, 110, 180, 'west')).toBeCloseTo(425, 6)
    expect(hemisphereMeridianX(535, 110, 0, 'west')).toBeCloseTo(645, 6)
    expect(hemisphereMeridianX(535, 110, 90, 'west')).toBeCloseTo(535, 6)
  })

  it('自西向东：东经半球度数变大，西经半球度数变小', () => {
    expect(degreesIncreaseEastward('east')).toBe(true)
    expect(degreesIncreaseEastward('west')).toBe(false)
    // 沿直径从左到右，东经半球的经度递增、西经半球的经度递减
    const east = [0, 60, 120, 180].map((lon) =>
      hemisphereMeridianX(185, 110, lon, 'east'),
    )
    for (let i = 1; i < east.length; i += 1) expect(east[i]).toBeGreaterThan(east[i - 1])
    const west = [180, 120, 60, 0].map((lon) =>
      hemisphereMeridianX(535, 110, lon, 'west'),
    )
    for (let i = 1; i < west.length; i += 1) expect(west[i]).toBeGreaterThan(west[i - 1])
  })

  it('经线是从北极点画到赤道落点的弧，落点与展开图一致', () => {
    const path = hemisphereMeridianPath(185, 235, 110, 60, 'east')
    expect(path.startsWith('M 185 125')).toBe(true)
    expect(path).toContain(`${hemisphereMeridianX(185, 110, 60, 'east').toFixed(2)} 235`)
  })

  it('纬线是横过半球的一段弧，纬度越高弧越靠近顶点', () => {
    const p30 = hemisphereParallelPath(185, 235, 110, 30)
    const p60 = hemisphereParallelPath(185, 235, 110, 60)
    // 弧横跨整个半球：半宽 = r·cosφ，纵向半高 = r·sinφ
    // 30°：半宽 95.26、y = 235 − 55 = 180
    expect(p30).toContain('89.74 180.00')
    expect(p30).toContain('280.26 180.00')
    // 60°：半宽 55、y = 235 − 95.26 = 139.74 —— 纬度越高弧越靠近顶点
    expect(p60).toContain('130.00 139.74')
    expect(p60).toContain('240.00 139.74')
  })

  it('标注文字：0° 与 180° 不带 E/W', () => {
    expect(longitudeLabel(0, 'east')).toBe('0°')
    expect(longitudeLabel(180, 'east')).toBe('180°')
    expect(longitudeLabel(30, 'east')).toBe('30°E')
    expect(longitudeLabel(150, 'west')).toBe('150°W')
  })
})

describe('§2.9 半球展开法的演示', () => {
  it('渲染出四步图解', async () => {
    const wrapper = mount(LongitudeHemisphereDemo)
    await flushPromises()

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('.demo__frame')).toHaveLength(4)
    expect(wrapper.text()).toContain('东西经半球展开图')
    expect(wrapper.text()).toContain('1 / 4')
  })

  it('点步骤圆点能跳到通用法那一步', async () => {
    const wrapper = mount(LongitudeHemisphereDemo)
    await flushPromises()

    const dots = wrapper.findAll('.demo__seg')
    await dots[3].trigger('click')
    expect(wrapper.text()).toContain('通用法')
    expect(wrapper.text()).toContain('4 / 4')
  })
})
